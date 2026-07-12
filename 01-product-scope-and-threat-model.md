# 01 — Product Scope and Threat Model

## Agent assignment

Define the non-negotiable security model before writing Android code. Treat this document as the contract for every later implementation packet. Do not weaken a requirement locally without recording the change as an architecture decision.

## Product objective

Build an Android content-control system for **fully managed devices**. The device owner controls which applications may run, routes ordinary applications through a filtering VPN, and provides a separate controlled browser with its own filtering path. Unknown applications are blocked by default.

The system is intended for devices whose owner or administrator has explicitly enrolled them. It is not a covert monitoring product and must not attempt to hide collection from the administrator or device user.

## Supported platform

- Android 10/API 29 or newer.
- Kotlin Android applications.
- Fully managed/device-owner provisioning.
- Primary target: Google-certified Android devices with Android Enterprise support.
- OEM-specific behavior must be represented as tested compatibility profiles rather than assumed to be identical.

API 29 is the minimum because the design uses an always-on VPN with lockdown while exempting the controlled browser package through the lockdown allowlist.

## Top-level components

1. **Guardian DPC application**
   - Device owner and `DeviceAdminReceiver`.
   - Policy engine and package enforcement.
   - Package inventory and classification client.
   - Always-on `VpnService` for non-browser applications.
   - Compliance monitor and local audit journal.
   - Optional Accessibility Service as a secondary UI guard only.

2. **Controlled browser application**
   - Separate Android package.
   - Excluded from the Guardian VPN.
   - Routes browsing through a dedicated browser filter/gateway or another explicitly controlled network mechanism.
   - Enforces URL, navigation, download, intent, and WebView restrictions.

3. **Policy backend**
   - Device enrollment and authentication.
   - Signed policy delivery.
   - Package catalog keyed by package name and signing certificate.
   - Administrator decisions, schedules, allowlists, and denylists.
   - Audit events and compliance state.

4. **Administrator console**
   - Approves or blocks applications.
   - Reviews unknown packages.
   - Sets content categories and schedules.
   - Displays device health without exposing unnecessary personal browsing content.

## Security invariants

The following requirements are mandatory:

1. **Unknown means blocked.** A package with no current approved decision cannot run.
2. **Identity is signature-pinned.** Package name alone never proves application identity.
3. **The browser is a separate package.** A process inside the DPC package cannot be independently excluded from a package-based VPN policy.
4. **DevicePolicyManager is the primary enforcer.** Accessibility is never the authoritative package blocker.
5. **All ordinary network-capable apps remain behind the VPN.** Only explicitly pinned internal packages may bypass it.
6. **Policies fail closed.** An expired or unverifiable policy cannot silently expand access.
7. **System exceptions are explicit.** A package is not trusted merely because it is preinstalled.
8. **Every policy change is auditable.** Record old state, new state, policy version, actor, reason, and result.
9. **Boot reconciliation is required.** Broadcast delivery alone is not accepted as complete enforcement.
10. **Recovery limitations are documented.** Android restrictions can block safe boot and Settings-based reset, but hardware recovery behavior and OEM bootloaders require separate validation.

## Threat actors

### Managed user

The user can physically operate the device and may try to:

- Install another browser, VPN, proxy, DNS changer, file manager, app store, launcher, terminal, remote-control app, or app-cloning environment.
- Launch an installed but hidden application through a deep link, notification, share sheet, widget, or explicit intent.
- Disable the VPN, change Private DNS, enable developer options, use ADB, switch users, enter safe mode, or uninstall management components.
- Open unfiltered content through an embedded WebView inside an otherwise approved application.
- Exploit a policy synchronization delay or reboot race.

### Malicious or misclassified application

An application may:

- Use an innocent package name or label.
- Change signing certificate or ownership in an update.
- Contain an embedded browser without declaring itself as a browser.
- Start external activities, install APKs, request accessibility/overlay/device-admin capabilities, or create a local tunnel.
- Attempt network access by IPv4, IPv6, DNS over HTTPS, QUIC, direct IP, or native sockets.

### Network attacker

A network attacker may attempt DNS manipulation, policy endpoint impersonation, replay of old policy, or TLS interception.

### Administrator or backend failure

A bad policy, compromised administrator account, backend outage, or classifier error may wrongly allow or block an application. The architecture must support rollback, staged rollout, local last-known-good policy, and emergency recovery.

## Explicit non-goals

- Decrypting arbitrary third-party HTTPS traffic with a user-installed CA.
- Perfect content inspection inside every third-party social or messaging app.
- Guaranteeing resistance against an unlocked bootloader, custom recovery, rooted OS, compromised system image, or OEM security defect.
- Using Accessibility to simulate taps as the main enforcement mechanism.
- Collecting passwords, private messages, or full page contents unless a separately reviewed product requirement makes that necessary.

## Enforcement layers

Use defense in depth:

1. **Provisioning and hardening** prevent common escape paths.
2. **Lock-task and launcher policy** prevent unknown applications from becoming reachable.
3. **Package suspension/hiding** makes forbidden packages unavailable at the operating-system level.
4. **Always-on VPN lockdown** controls networking for allowed non-browser apps.
5. **Controlled browser filtering** handles web content at a higher semantic level.
6. **Accessibility fallback** handles a narrow set of UI surfaces that device policy cannot directly constrain.
7. **Compliance reconciliation** repairs drift after boot, package updates, crashes, or missed broadcasts.

## Security state definitions

Every package must resolve to exactly one effective state:

| State | Meaning | Expected enforcement |
|---|---|---|
| `SYSTEM_REQUIRED` | Required for boot, telephony, emergency use, or policy operation | Allowed, tightly scoped |
| `INTERNAL_TRUSTED` | Signature-pinned Guardian component | Allowed according to internal role |
| `APPROVED_FILTERED` | Administrator-approved ordinary app | Unsuspended; VPN required |
| `APPROVED_RESTRICTED` | Approved with schedule or feature limitations | Unsuspended only while conditions hold |
| `QUARANTINED` | Unknown, changed identity, stale decision, or awaiting review | Suspended and absent from launcher |
| `BLOCKED` | Explicitly forbidden | Hidden where possible; also suspended |
| `ENFORCEMENT_FAILED` | Desired state could not be applied | Device marked noncompliant; fail closed where possible |

## Product decisions that must be recorded later

Before production, create architecture decision records for:

- Managed Google Play versus private APK distribution.
- On-device DNS filter versus full userspace packet tunnel.
- Browser gateway/proxy implementation.
- Whether the Accessibility Service is distributed at all.
- Whether lock-task mode is permanent or policy-driven.
- Emergency calling and accessibility requirements.
- Data retention and reporting level.
- Supported OEM/device list.

## Acceptance criteria

This architecture packet is accepted when:

- The team agrees that arbitrary unknown packages are blocked by default.
- The two-package Android design is approved.
- The minimum supported OS is API 29 or newer.
- All escape paths listed above have an owner in a later packet.
- Non-goals are understood and are not quietly reintroduced during implementation.

## Handoff to packet 02

Packet 02 turns this contract into repository boundaries, application modules, interfaces, and dependency rules.

## Official references

- Android DPC overview: https://developer.android.com/work/dpc/build-dpc
- DevicePolicyManager API: https://developer.android.com/reference/android/app/admin/DevicePolicyManager
- Android Enterprise lock task: https://developer.android.com/work/dpc/dedicated-devices/lock-task-mode
- VpnService.Builder API: https://developer.android.com/reference/android/net/VpnService.Builder
