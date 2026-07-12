# 03 — Managed Device Provisioning and Device Identity

## Agent assignment

Implement enrollment for development and production-like testing. The DPC must become device owner on a fresh device, establish a cryptographic device identity, enroll with the backend, and apply a minimal bootstrap policy before ordinary use begins.

## Provisioning modes

### Development provisioning

Use a factory-reset emulator or test device with no accounts and no existing users beyond the primary user. Install the DPC and set it as device owner using the supported `adb shell dpm set-device-owner` workflow.

Development provisioning must be scripted and must verify afterward:

```kotlin
dpm.isDeviceOwnerApp(context.packageName)
```

Never treat ordinary device-admin activation as equivalent to device owner.

### QR provisioning

For controlled production pilots, provision from the Android setup flow using managed provisioning and a QR payload. The QR configuration should specify:

- DPC component name.
- DPC download location when not preinstalled.
- Cryptographic checksum of the APK.
- Enrollment token or one-time bootstrap data.
- Wi-Fi data only when operationally required.

Do not place long-lived API secrets in the QR code. The QR payload is bootstrap material, not the permanent device credential.

### Scale provisioning

For larger deployments, evaluate Android zero-touch enrollment or an approved Android Enterprise management route. Custom DPC distribution and Android Enterprise approval requirements are a product/commercial workstream, not merely an engineering detail.

## Required Android components

### Device admin receiver

```kotlin
class GuardianAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        EnrollmentOrchestrator.enqueueBootstrap(context)
    }

    override fun onLockTaskModeEntering(
        context: Context,
        intent: Intent,
        pkg: String,
    ) {
        Audit.record("lock_task_entered", mapOf("package" to pkg))
    }

    override fun onLockTaskModeExiting(context: Context, intent: Intent) {
        Audit.record("lock_task_exited")
        ComplianceOrchestrator.requestImmediateReconcile(context)
    }
}
```

Declare it with `BIND_DEVICE_ADMIN` and an admin metadata XML. Keep the requested legacy admin policies minimal; most important controls are device-owner APIs.

### Provisioning activity

Provide a minimal activity that:

1. Confirms device-owner status.
2. Shows enrollment progress.
3. Refuses normal operation until bootstrap policy is verified and applied.
4. Displays a recoverable error code rather than exposing backend secrets.

## Device identity

On first device-owner activation:

1. Generate a non-exportable asymmetric key in Android Keystore.
2. Generate a random local device installation ID.
3. Obtain available hardware-backed key attestation where supported and required.
4. Send a public-key enrollment request with the one-time bootstrap token.
5. Backend returns a device ID, policy verification keys, environment configuration, and initial signed policy.
6. Store refresh credentials encrypted/wrapped by Keystore.
7. Delete the one-time bootstrap token.

Do not use serial number, IMEI, Android ID, or package-scoped identifiers as the sole authentication credential.

## Policy trust bootstrap

The application must ship with at least one root policy-verification key or certificate. Enrollment responses must be signed or delivered over authenticated TLS and then persisted as a keyset with explicit key IDs.

A policy envelope should contain:

```json
{
  "deviceId": "device_123",
  "sequence": 42,
  "issuedAt": "2026-07-12T12:00:00Z",
  "expiresAt": "2026-07-19T12:00:00Z",
  "policy": {},
  "keyId": "policy-key-2026-01",
  "signature": "base64..."
}
```

Reject a policy when:

- Signature verification fails.
- Device ID does not match.
- Sequence number is older than the last accepted sequence.
- Expiry is invalid beyond the configured offline grace model.
- Required fields are absent.
- The policy would remove the last recovery/admin path.

## Bootstrap policy sequence

Apply policy in this order:

1. Confirm device owner.
2. Protect the DPC from uninstall.
3. Disable obvious escape paths such as safe boot, debugging, unknown sources, extra users, VPN configuration, and Private DNS configuration.
4. Establish the system-required package baseline.
5. Configure package visibility and perform inventory.
6. Quarantine non-baseline packages.
7. Install/verify the controlled browser.
8. Configure always-on VPN and lockdown.
9. Configure lock-task/launcher policy.
10. Mark enrollment complete only after reconciliation succeeds.

A partial bootstrap is a noncompliant state. The UI must not report successful enrollment while any mandatory step is unresolved.

## Factory-reset protection

Use `FactoryResetProtectionPolicy` where supported and appropriate so authorized administrator accounts can recover a device after an untrusted reset. This is separate from `DISALLOW_FACTORY_RESET`.

Document the limitation clearly:

- `DISALLOW_FACTORY_RESET` addresses reset through Settings.
- `DISALLOW_SAFE_BOOT` addresses safe-mode entry.
- Recovery menu, bootloader, OEM service tools, and physical attacks require device/OEM testing.
- FRP helps control reprovisioning after an untrusted reset; it is not a substitute for data backup or tamper-proof hardware.

## Enrollment persistence

Store an explicit enrollment state machine:

```text
NOT_DEVICE_OWNER
DEVICE_OWNER_UNENROLLED
ENROLLING
POLICY_RECEIVED
HARDENING_APPLIED
INVENTORY_RECONCILED
NETWORK_ENFORCED
ENROLLED_COMPLIANT
ENROLLED_NONCOMPLIANT
REVOKED
```

Transitions must be idempotent. A reboot at any point resumes from persisted state and rechecks actual platform state rather than trusting the previous step marker.

## Deprovisioning

Do not provide a local unauthenticated “remove management” button. A supported deprovision flow should require:

- Administrator authorization.
- Fresh backend command.
- Audit record.
- Explicit policy that determines whether to wipe or release the device.
- Removal of sensitive credentials.

Development builds may include a clearly marked test-only removal workflow guarded by build type and excluded from production.

## Test matrix

Test enrollment on:

- Emulator API 29 and latest stable API.
- At least one Pixel device.
- Each OEM family intended for production.
- Offline during enrollment.
- Reboot between every bootstrap step.
- Invalid QR checksum.
- Replayed enrollment token.
- Backend returns old or malformed policy.
- Browser APK missing or wrong certificate.

## Deliverables

- Device-admin receiver and manifest configuration.
- Development provisioning script.
- QR provisioning payload generator for pilot use.
- Keystore device identity implementation.
- Enrollment API client.
- Persisted enrollment state machine.
- Bootstrap policy orchestration and recovery tests.

## Acceptance criteria

- A factory-reset test device becomes device owner and enrolls without manual settings changes.
- A copied/replayed bootstrap token is rejected.
- Rebooting during provisioning resumes safely.
- No ordinary app use is possible before mandatory policy is applied.
- Backend revocation moves the device to a controlled noncompliant/recovery state.

## Handoff to packet 04

Packet 04 defines the complete hardening policy, user restrictions, lock-task behavior, and recovery boundaries.

## Official references

- DPC development: https://developer.android.com/work/dpc/build-dpc
- Dedicated-device cookbook: https://developer.android.com/work/dpc/dedicated-devices/cookbook
- FactoryResetProtectionPolicy: https://developer.android.com/reference/android/app/admin/FactoryResetProtectionPolicy
- Android Enterprise security: https://developer.android.com/work/dpc/security
