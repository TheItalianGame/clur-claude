# 02 — Repository and Module Boundaries

## Agent assignment

Create the repository skeleton and compile-time boundaries. Do not implement enforcement behavior yet. The result should make it difficult for UI code, network code, or accessibility callbacks to mutate policy directly.

## Repository layout

Use a monorepo with Android and backend code separated but versioned together:

```text
/android
  /guardian-dpc
  /controlled-browser
  /core-model
  /core-crypto
  /core-policy
  /core-storage
  /core-network
  /core-test
/backend
  /policy-api
  /classification-worker
  /admin-api
  /shared-contracts
/docs
  /adr
  /runbooks
```

The backend technology can be selected separately. The Android contracts should not depend on the backend framework.

## Android application packages

Use stable package IDs from the start. Example placeholders:

```text
com.example.guardian.dpc
com.example.guardian.browser
```

The browser must remain a separate package because VPN routing exclusions and lockdown exemptions are package-scoped.

## Guardian DPC modules

### `guardian-dpc`

Android application module containing only Android entry points and dependency wiring:

- `GuardianAdminReceiver : DeviceAdminReceiver`
- `PackageEventReceiver`
- `BootReceiver`
- `GuardianVpnService`
- `ComplianceWorker`
- optional `GuardianAccessibilityService`
- Compose administrator/device-status UI
- Hilt or manual dependency injection setup

The module may invoke domain use cases but must not contain policy precedence logic.

### `core-model`

Pure Kotlin models shared by both Android applications:

```kotlin
data class AppIdentity(
    val packageName: String,
    val signingCertSha256: Set<String>,
    val versionCode: Long,
    val installerPackage: String?,
)

enum class EffectiveAppState {
    SYSTEM_REQUIRED,
    INTERNAL_TRUSTED,
    APPROVED_FILTERED,
    APPROVED_RESTRICTED,
    QUARANTINED,
    BLOCKED,
    ENFORCEMENT_FAILED,
}

data class PolicyVersion(
    val sequence: Long,
    val issuedAtEpochMs: Long,
    val expiresAtEpochMs: Long,
    val keyId: String,
)
```

No Android classes are allowed in this module.

### `core-policy`

Pure Kotlin policy evaluation:

- Precedence rules.
- State machine.
- Decision explanation generation.
- Schedule evaluation using injected clocks.
- Policy diffing.
- Validation of impossible or unsafe policies.

Primary interface:

```kotlin
interface PolicyEvaluator {
    fun evaluate(
        inventory: InstalledAppSnapshot,
        policy: VerifiedDevicePolicy,
        context: EvaluationContext,
    ): PolicyPlan
}
```

A `PolicyPlan` is declarative. It says what should be true; it does not call Android APIs.

### `core-storage`

Room database and encrypted secret storage:

- Package inventory.
- Classification cache.
- Last-known-good policy.
- Desired enforcement state.
- Actual enforcement state.
- Append-only audit journal.
- Sync cursors and retry state.

Do not store private keys in Room. Use Android Keystore for device keys and token wrapping.

### `core-network`

Backend clients and transport DTOs:

- Device enrollment.
- Policy fetch.
- Package classification request.
- Audit event upload.
- Certificate pin configuration if adopted.
- Retry/backoff and offline behavior.

No `DevicePolicyManager` calls belong here.

### `core-crypto`

- Ed25519 or another approved signature verification mechanism for policies.
- Canonical payload encoding.
- Certificate SHA-256 helpers.
- Device key generation and proof-of-possession helpers.
- Replay and sequence-number checks.

Cryptographic primitives must come from maintained platform/library implementations, not custom algorithms.

### `core-test`

- Fake clocks.
- Fake inventory builders.
- Policy fixture loaders.
- Fake classifier and backend.
- Golden policy-plan assertions.

## DPC internal layers

Within `guardian-dpc`, use these boundaries:

```text
Android callbacks
      |
      v
Use cases / orchestrators
      |
      +--> PolicyEvaluator
      +--> PackageInventoryRepository
      +--> PolicyRepository
      +--> EnforcementGateway
      +--> AuditJournal
```

Define the Android enforcement adapter as an interface:

```kotlin
interface EnforcementGateway {
    suspend fun suspendPackages(packages: Set<String>): EnforcementResult
    suspend fun unsuspendPackages(packages: Set<String>): EnforcementResult
    suspend fun hidePackages(packages: Set<String>): EnforcementResult
    suspend fun unhidePackages(packages: Set<String>): EnforcementResult
    suspend fun applyUserRestrictions(plan: UserRestrictionPlan): EnforcementResult
    suspend fun applyLockTaskPlan(plan: LockTaskPlan): EnforcementResult
    suspend fun applyVpnPlan(plan: VpnPlan): EnforcementResult
}
```

Only one production class should wrap `DevicePolicyManager`. This makes API failures visible and testable.

## Controlled browser modules

The `controlled-browser` application should have internal packages or Gradle modules for:

- `browser-ui`: tabs, address bar, history controls.
- `browser-policy`: URL decision client, navigation rules, download rules.
- `browser-webview`: hardened WebView configuration and lifecycle.
- `browser-transport`: gateway/proxy configuration and browser authentication.
- `browser-audit`: minimal browsing policy events.

The browser must not import DPC implementation classes. It receives policy through signed backend responses, a signature-protected bound service, or a signature-protected content provider. Prefer a backend-issued browser policy plus local DPC health signal to avoid a tight process dependency.

## Inter-application trust

Any IPC between DPC and browser must be signature-protected:

```xml
<permission
    android:name="com.example.guardian.permission.INTERNAL_CONTROL"
    android:protectionLevel="signature" />
```

Validate the calling UID and certificate where practical. Do not expose exported activities, services, or receivers unless required.

## Background work rules

- Package quarantine is applied synchronously or immediately from the package event orchestrator.
- Network classification and reporting use WorkManager.
- Do not depend exclusively on WorkManager for security enforcement.
- Receivers perform minimal work and use `goAsync()` where needed.
- Boot reconciliation must run even if background scheduling has been delayed.
- Foreground-service restrictions must be respected; the VPN service is started through supported VPN/always-on flows rather than arbitrary background launches.

## Build configuration

Recommended baseline:

- Kotlin.
- Jetpack Compose for management UI.
- Room.
- WorkManager.
- Jetpack WebKit in the browser.
- `minSdk = 29`.
- `targetSdk` set to the latest stable SDK required at release time.
- Release builds minified with mapping files securely retained.
- Separate debug application IDs or signing keys so a debug build can never impersonate production.

## Dependency rules

Enforce these rules in CI:

1. `core-policy` cannot depend on Android SDK classes.
2. UI cannot call `DevicePolicyManager` directly.
3. Accessibility code cannot call policy mutation methods directly; it reports observations to an orchestrator.
4. Browser code cannot bypass its transport policy through an alternate generic HTTP client.
5. Backend DTOs cannot become persistence models without explicit mapping.
6. All time-dependent logic uses an injected `Clock`.

## Deliverables

- Compiling empty applications for DPC and browser.
- Module dependency graph.
- Interfaces above with placeholder implementations.
- Unit-test setup with at least one fake policy evaluation.
- Architecture decision record for IPC choice.
- CI check preventing forbidden module dependencies.

## Acceptance criteria

- Both APKs install side by side.
- Their production package IDs are distinct.
- The policy module runs as a JVM unit test without Android.
- No Android component can mutate policy except through the enforcement gateway.
- Debug signing cannot satisfy production signature-level IPC permission.

## Handoff to packet 03

Packet 03 implements device-owner provisioning and establishes trusted device identity.

## Official references

- Build a DPC: https://developer.android.com/work/dpc/build-dpc
- Foreground service restrictions: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
- Package visibility: https://developer.android.com/training/package-visibility
