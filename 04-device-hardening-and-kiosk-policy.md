# 04 — Device Hardening and Kiosk Policy

## Agent assignment

Implement an idempotent hardening controller that applies and verifies device-owner restrictions. Separate mandatory restrictions from OEM-dependent and product-optional restrictions. Never assume that an API call succeeded merely because it did not throw.

## Hardening profiles

Define three profiles:

1. `BASELINE_MANAGED`
   - Fully managed device without permanent kiosk.
   - User may access approved apps and selected Settings surfaces.

2. `RESTRICTED_PERSONAL`
   - Default product mode.
   - Custom launcher or tightly controlled stock launcher.
   - Unknown apps unavailable.
   - Settings access limited.

3. `DEDICATED_KIOSK`
   - Permanent lock-task mode.
   - Only explicit allowlisted packages/tasks.
   - Intended for institution-owned dedicated devices.

Policy should select a profile and then apply additive overrides.

## Mandatory user restrictions

The default restricted profile should evaluate and normally apply:

```kotlin
val mandatoryRestrictions = setOf(
    UserManager.DISALLOW_SAFE_BOOT,
    UserManager.DISALLOW_FACTORY_RESET,
    UserManager.DISALLOW_DEBUGGING_FEATURES,
    UserManager.DISALLOW_CONFIG_VPN,
    UserManager.DISALLOW_CONFIG_PRIVATE_DNS,
    UserManager.DISALLOW_NETWORK_RESET,
    UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES_GLOBALLY,
    UserManager.DISALLOW_ADD_USER,
    UserManager.DISALLOW_USER_SWITCH,
    UserManager.DISALLOW_USB_FILE_TRANSFER,
    UserManager.DISALLOW_APPS_CONTROL,
    UserManager.ENSURE_VERIFY_APPS,
)
```

Before shipping, verify API availability and ownership scope for every configured minimum OS and OEM.

Potential optional restrictions include:

- `DISALLOW_INSTALL_APPS` when all installs are administrator-driven.
- `DISALLOW_UNINSTALL_APPS` for a strict kiosk, though per-package uninstall blocking is less disruptive.
- `DISALLOW_CONFIG_DEFAULT_APPS` to stop browser/launcher role changes.
- `DISALLOW_MODIFY_ACCOUNTS` to prevent alternate account-based app stores.
- `DISALLOW_MOUNT_PHYSICAL_MEDIA` for devices with removable storage.
- `DISALLOW_CREATE_WINDOWS` only after compatibility testing because it affects non-app windows.
- `DISALLOW_BLUETOOTH_SHARING`, Wi-Fi Direct, printing, or NFC sharing based on product policy.

Do not enable optional restrictions solely because they sound secure. Record user-impact and recovery implications.

## Protect management packages

Call `setUninstallBlocked` for:

- Guardian DPC/VPN package.
- Controlled browser package.
- Custom launcher package if separate.
- Required support packages.

Also verify package signatures at each boot. If a protected package is missing or its certificate changes, mark the device noncompliant and enter recovery mode.

## Accessibility and input method allowlists

If the product uses an Accessibility Service, restrict permitted non-system accessibility services to approved packages using `setPermittedAccessibilityServices`.

Likewise evaluate `setPermittedInputMethods` because third-party keyboards can provide search, clipboard, translation, GIF, voice, or browser-like surfaces. Do not disable necessary accessibility input methods without a documented accommodation path.

System accessibility services may remain permitted by platform design. Treat this as a known boundary and test the Settings flows that remain available.

## Lock-task allowlist

Lock-task mode is an allowlist, not a classifier. Only packages already approved by the policy engine should be added:

```kotlin
dpm.setLockTaskPackages(admin, approvedLockTaskPackages.toTypedArray())
```

Never add all installed packages and then rely on suspension. The allowlist should minimally contain:

- DPC/launcher package.
- Controlled browser.
- Required dialer/emergency packages.
- Approved user apps.
- OEM system UI dependencies verified for that device profile.

Configure lock-task features deliberately:

```kotlin
val features =
    DevicePolicyManager.LOCK_TASK_FEATURE_SYSTEM_INFO or
    DevicePolicyManager.LOCK_TASK_FEATURE_KEYGUARD
```

Home, Overview, notifications, global actions, and other features should be enabled only if required. The exact feature set is a product decision and must be tested for emergency calling and recovery.

## Launcher strategy

A custom launcher is recommended for the restricted profile because it can:

- Display only effectively approved packages.
- Display quarantine/pending-review status.
- Avoid stale shortcuts to blocked apps.
- Route app requests to the administrator workflow.
- Show device compliance and VPN status.

However, launcher filtering is not security enforcement. Packages must also be suspended/hidden and constrained through lock task or device policy.

If using the stock launcher, apply application hiding/suspension and test deep links, widgets, recents, notifications, and Settings “Open” buttons.

## Settings strategy

Prefer platform restrictions over hiding Settings. Keep only necessary Settings paths reachable, such as:

- Approved Wi-Fi selection when allowed.
- Display/volume settings if policy permits.
- Accessibility accommodations.
- Emergency information.

For surfaces not controllable by DevicePolicyManager, use one of these in order:

1. Avoid exposing Settings through launcher/lock task.
2. Launch specific settings panels rather than the main Settings app.
3. Use an OEM management API for supported devices.
4. Use Accessibility as a narrow fallback with explicit package/activity rules.

Do not implement a broad Accessibility loop that continuously closes every Settings screen. It is brittle and can interfere with legitimate accessibility.

## Safe boot, reset, and recovery

Apply `DISALLOW_SAFE_BOOT` and verify it appears in active restrictions. Apply `DISALLOW_FACTORY_RESET` and a deliberate FRP policy.

Maintain a secure administrator recovery path for:

- Broken Wi-Fi or expired credentials.
- Failed VPN startup.
- Backend outage past policy grace period.
- Incorrect app classification.
- Accessibility failure.
- Device clock errors.

Recovery must not simply disable enforcement. It should expose a limited signed-command or one-time-code workflow that can repair network/configuration while preserving package quarantine.

## Policy application algorithm

```text
read desired hardening profile
read actual restrictions and DPM state
calculate diff
apply restrictions first
protect internal packages
apply permitted-service lists
apply lock-task package list and features
verify actual state
journal each result
mark compliance
```

The controller must be idempotent and safe to rerun after every boot and policy update.

## Compliance checks

At minimum verify:

- DPC remains device owner.
- Mandatory user restrictions are active.
- Protected packages are installed and signature-correct.
- No unapproved accessibility service is enabled where policy can control it.
- Lock-task package list matches desired state.
- Always-on VPN package and lockdown state match desired state.
- No unexpected user/profile exists.
- Developer options/ADB cannot be enabled through ordinary UI.

## OEM compatibility profile

Create a data file per supported device family:

```json
{
  "manufacturer": "Example",
  "modelPattern": "X.*",
  "requiredPackages": [],
  "emergencyPackages": [],
  "settingsExceptions": [],
  "knownUnsuspendablePackages": [],
  "testedBuildFingerprints": []
}
```

Do not infer required packages from package prefixes alone. Validate by removing access in a controlled test and confirming boot, telephony, Wi-Fi, updates, and emergency behavior.

## Deliverables

- `HardeningPolicyController`.
- Restriction plan model and policy mapping.
- Lock-task controller.
- Protected package controller.
- Custom launcher skeleton or documented launcher choice.
- Recovery mode design.
- OEM compatibility-profile schema.
- Instrumented tests for each mandatory restriction.

## Acceptance criteria

- Safe mode cannot be entered through normal power-menu/user flows on tested devices.
- Factory reset is unavailable through Settings.
- User cannot enable ADB, alternate VPN, or Private DNS through Settings.
- Unknown packages cannot appear or launch through launcher, deep links, or Recents.
- Emergency and required accessibility flows still function according to the product requirement.
- A failed policy application produces a visible noncompliant state and audit event.

## Handoff to packet 05

Packet 05 inventories every installed package and produces classification inputs without trusting app names or labels.

## Official references

- UserManager restrictions: https://developer.android.com/reference/android/os/UserManager
- Dedicated-device cookbook: https://developer.android.com/work/dpc/dedicated-devices/cookbook
- Lock task mode: https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode
- DevicePolicyManager: https://developer.android.com/reference/android/app/admin/DevicePolicyManager
