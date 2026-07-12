# 05 — Package Inventory and Classification

## Agent assignment

Implement complete package inventory and a conservative classification pipeline. The pipeline does not grant access directly; it produces evidence and a proposed decision for the policy engine. Unknown or ambiguous packages remain quarantined.

## Package visibility

Declare the minimum package visibility needed. A device-management/security application that must classify all installed apps will likely require:

```xml
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
```

Google Play subjects broad package visibility to approval. For private managed-device distribution, still document why the permission is required and collect only necessary metadata.

## Inventory triggers

Run inventory on:

- Enrollment.
- Every boot and user unlock.
- `ACTION_PACKAGE_ADDED`.
- `ACTION_PACKAGE_REPLACED`.
- `ACTION_PACKAGE_CHANGED`.
- `ACTION_PACKAGE_REMOVED`.
- Policy update.
- Scheduled compliance reconciliation.
- Guardian/browser version change.

Broadcasts are optimization signals. Full reconciliation is the correctness mechanism.

## Identity record

Use package name plus the complete current signer set and signer history where Android exposes it:

```kotlin
data class AppIdentity(
    val packageName: String,
    val currentSignerSha256: Set<String>,
    val signerHistorySha256: Set<String>,
    val versionCode: Long,
    val firstInstallTime: Long,
    val lastUpdateTime: Long,
    val installerPackageName: String?,
    val isSystemApp: Boolean,
    val isUpdatedSystemApp: Boolean,
)
```

Hash DER-encoded signing certificates with SHA-256 and encode in lowercase hex or base64url consistently.

Package labels, icons, categories, and installer names are descriptive metadata, not trust anchors.

## Capability signals

Collect manifest-level signals using `PackageManager`:

### Network and web

- Requests `android.permission.INTERNET`.
- Handles `http` or `https` `ACTION_VIEW` with `CATEGORY_BROWSABLE`.
- Exposes Custom Tabs service intent.
- Handles generic search intents.
- Declares network-related foreground services.

### Circumvention

- Declares a service requiring `BIND_VPN_SERVICE`.
- Declares Accessibility Service metadata or requires `BIND_ACCESSIBILITY_SERVICE`.
- Declares device-admin receiver metadata or requires `BIND_DEVICE_ADMIN`.
- Requests `REQUEST_INSTALL_PACKAGES`.
- Requests `SYSTEM_ALERT_WINDOW`.
- Handles APK MIME types or package-install intents.
- Acts as a launcher/home handler.
- Provides input method services.
- Provides notification-listener or screen-capture-related services.
- Handles file-management/document-provider roles.

### Content risk

- Media capture/playback permissions and services.
- Messaging/share targets.
- User-generated-content or social category from trusted catalog data.
- Browser-like intent combinations.
- Cloud storage/file-sharing functionality.

Manifest analysis cannot reliably prove whether an app embeds a WebView or can display adult content. Treat that as a limitation, not a missing regex.

## Package snapshot

Persist a normalized snapshot:

```kotlin
data class InstalledAppSnapshot(
    val identity: AppIdentity,
    val requestedPermissions: Set<String>,
    val grantedPermissions: Set<String>,
    val activities: List<ComponentSignal>,
    val services: List<ComponentSignal>,
    val receivers: List<ComponentSignal>,
    val providers: List<ComponentSignal>,
    val handledIntents: Set<IntentCapability>,
    val applicationCategory: Int?,
    val observedAtEpochMs: Long,
    val inventorySchemaVersion: Int,
)
```

Avoid storing full manifest XML when structured fields are sufficient.

## Classification categories

Allow multiple categories per application:

```text
SYSTEM_CORE
BROWSER
IN_APP_BROWSER_RISK
VPN_OR_PROXY
DNS_TOOL
APP_STORE
PACKAGE_INSTALLER
FILE_MANAGER
LAUNCHER
ACCESSIBILITY_TOOL
KEYBOARD
REMOTE_ACCESS
TERMINAL_OR_DEVELOPER_TOOL
VIRTUALIZATION_OR_APP_CLONER
SOCIAL_MEDIA
MESSAGING
IMAGE_OR_VIDEO_SHARING
VIDEO_STREAMING
AI_CHAT
CLOUD_STORAGE
GAME
EDUCATION
PRODUCTIVITY
FINANCE
HEALTH
UNKNOWN
```

Risk flags should be separate from categories:

```text
HAS_INTERNET
USER_GENERATED_CONTENT
CAN_INSTALL_APKS
CAN_CREATE_TUNNEL
CAN_DRAW_OVER_APPS
CAN_OBSERVE_UI
CAN_LAUNCH_WEB_LINKS
SIGNER_CHANGED
UNKNOWN_INSTALLER
CATALOG_STALE
```

## Decision inputs and precedence

Classification sources, from strongest to weakest:

1. Internal package and certificate pin.
2. Administrator explicit package+certificate decision.
3. Trusted catalog exact package+certificate decision.
4. Trusted catalog publisher/signer rule with constrained package pattern.
5. Server-side static analysis of the exact APK hash, when available.
6. On-device manifest heuristics.
7. Application label/category text.

A weak source may increase risk but must not override an explicit block or signature mismatch.

## Default classification behavior

- New exact identity: `UNKNOWN`, proposed `QUARANTINE`.
- Same package with new unrecognized signer: `SIGNER_CHANGED`, proposed `QUARANTINE`.
- New version with recognized signer and valid non-expired catalog entry: retain prior decision unless policy requires version review.
- Browser/VPN/proxy/app-store/package-installer capability: proposed `BLOCK` or administrator review.
- Internet-free utility with no dangerous capability: may be proposed for approval, but remains quarantined until policy grants it.
- System app not present in the tested OEM baseline: quarantine if suspendable; otherwise mark noncompliant for review.

## Classification API

Example request:

```json
{
  "deviceId": "device_123",
  "inventorySchemaVersion": 1,
  "apps": [
    {
      "packageName": "com.example.app",
      "signers": ["sha256:..."],
      "versionCode": 100,
      "installer": "com.android.vending",
      "signals": ["HAS_INTERNET", "CAN_LAUNCH_WEB_LINKS"]
    }
  ]
}
```

Example response:

```json
{
  "catalogVersion": 84,
  "decisions": [
    {
      "packageName": "com.example.app",
      "signers": ["sha256:..."],
      "categories": ["PRODUCTIVITY", "IN_APP_BROWSER_RISK"],
      "riskFlags": ["HAS_INTERNET", "CAN_LAUNCH_WEB_LINKS"],
      "recommendedAction": "REVIEW",
      "confidence": 0.73,
      "expiresAt": "2026-08-01T00:00:00Z",
      "reasonCodes": ["UNKNOWN_EMBEDDED_WEB_CAPABILITY"]
    }
  ]
}
```

The client verifies that the response applies to the exact identity requested and that catalog data is signed or delivered within the signed device policy model.

## Manual review workflow

The administrator should see:

- App label and icon for convenience.
- Exact package name.
- Certificate fingerprint and known publisher.
- Installer and version.
- Risk categories and reason codes.
- Requested dangerous capabilities.
- Whether the app was previously approved under another signer.
- Recommended action.

Admin decisions must specify scope:

- This exact package and signer.
- All versions signed by this signer.
- Temporary approval until date/time.
- Device-specific or policy-group-wide.

Avoid “approve by app name” controls.

## Local cache and staleness

Cache classification by:

```text
packageName + signer-set + versionCode + inventory-schema-version
```

Catalog decisions have expiry. On expiry:

- Explicit administrator approval may remain according to policy.
- Catalog-only approval enters a grace period or quarantine, depending on risk.
- High-risk categories fail closed immediately if configured.

## Deliverables

- Package visibility manifest configuration.
- Package inventory scanner.
- Certificate fingerprint implementation and tests.
- Capability signal extractor.
- Room schema for snapshots and classification cache.
- Classification API client and DTOs.
- Manual review data model.
- Full reconciliation job.

## Acceptance criteria

- Scanner returns every installed package visible to a device-management app on tested devices.
- Two APKs with the same package name but different certificates produce different identities.
- A signer change immediately invalidates prior approval.
- Browser, VPN-service, APK-installer, launcher, accessibility-service, and keyboard test apps produce the expected signals.
- Unknown apps never become allowed because a classifier timed out.

## Handoff to packet 06

Packet 06 converts effective policy decisions into suspension, hiding, lock-task, and launch-prevention actions.

## Official references

- Package visibility overview: https://developer.android.com/training/package-visibility
- Declaring package visibility: https://developer.android.com/training/package-visibility/declaring
- PackageManager API: https://developer.android.com/reference/android/content/pm/PackageManager
- SigningInfo API: https://developer.android.com/reference/android/content/pm/SigningInfo
