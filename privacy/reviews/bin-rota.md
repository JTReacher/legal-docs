# Bin Rota: privacy policy checks

Policy: `privacy/generated/bin-rota.html` (config `eula/configs/bin-rota.json`).
Checked 25 October 2026 against the `bin-rota` repo, branch `feat/play-flavour`.

## 1. Exodus Privacy scan

Command: `orch legal exodus <apk>`. Debug builds were scanned because they are not minified, so every class name is visible.

| Build | Trackers (of 428 Exodus signatures) | Permissions |
|---|---|---|
| Play (`app-play-debug.apk`) | None | INTERNET, ACCESS_NETWORK_STATE, POST_NOTIFICATIONS, READ_CONTACTS, RECEIVE_BOOT_COMPLETED, SCHEDULE_EXACT_ALARM |
| Sideload (`app-sideload-debug.apk`) | None | The Play list, plus SEND_SMS and USE_EXACT_ALARM (SCHEDULE_EXACT_ALARM only up to API 32) |

To check the scanner works, I matched planted AdMob and Firebase Analytics class names against the live signature list, and both were flagged. A code review then confirmed that real dex parsing flags a planted signature. Every permission is explained in the policy's "Device permissions" section. Before submitting, re-run the scan on the release build. For an AAB, build a universal APK first (`bundletool build-apks --mode=universal`) and scan that.

## 2. ICO privacy notice checklist

Source: the ICO "right to be informed" checklist (UK GDPR Art. 13/14).

| Item | Covered | Where |
|---|---|---|
| Name and contact details of the organisation | Yes | Owner and Data Controller |
| Contact details of the DPO | N/A | Not required for a sole trader with no large-scale processing |
| Purposes of processing | Yes | Data table, Purpose column |
| Lawful basis for each purpose | Yes | Data table, Legal basis column |
| Legitimate interests relied on | Yes | Stated per row |
| Categories of data not obtained from the individual | Yes | Rota members' names and numbers (entered by the user or picked from contacts) |
| Recipients | Yes | Services the app contacts; mobile network or Messages app; Google backup |
| Transfers outside the UK and safeguards | Yes | International transfers (added in this check) |
| Retention periods | Yes | Data table, Retention column |
| Rights (access, rectification, erasure, restriction, portability, objection) | Yes | Rights of Users |
| Right to withdraw consent | Yes | Rights of Users (no processing relies on consent) |
| Right to complain to the ICO | Yes | Link to ico.org.uk/make-a-complaint |
| Whether providing data is required, and the consequences | Yes | "Users are not obliged to provide any Data..." |
| Source of data not obtained from the individual | Yes | Typed in or picked from the user's contacts |
| Automated decision-making and profiling | Yes | "No automated decision-making" |
| Concise, plain language, easy to find | Yes, with one to-do | The "In short" summary comes first. **To do at submission:** link the policy from the Play listing |

Open question for John: the ICO helpline (0303 123 1113) can confirm whether you count as a controller at all for data that never leaves the phone. The policy is written to hold up either way.

## 3. Google Play Data safety form (draft answers)

Play counts data as "collected" only when the app sends it off the device, and as "shared" only when it goes to a third party.

| Question | Draft answer | Why |
|---|---|---|
| Does the app collect or share required user data types? | **Yes** | The council UPRN or iCal address is sent to the collection service |
| Data type | Personal info → **Address** (optional) | A UPRN identifies a property. Mark it optional, because a manual pattern works without one |
| Collected or shared? | **Collected**, not shared | Sending data to a third party because of a user action, as the user would expect, is a listed exemption from "shared" |
| Processed ephemerally? | No | We can't confirm that the council's service keeps requests in memory only |
| Purpose | App functionality | |
| Encrypted in transit? | **Yes** | The council lookup uses https. The app targets SDK 36 and doesn't opt into cleartext, so Android blocks `http://` iCal links and nothing is sent unencrypted |
| Can users request deletion? | **John to decide** | The only "collected" data is the lookup request, which reaches the council's service. Neither the user nor the Owner can have that deleted. Everything else is on the device, where the user deletes it. Check Play's help text: answer "No", or "Yes" with that reason |
| Contacts, phone numbers, SMS | **Not declared** | They are read and stored only on the device, and never sent off it by the app. Texts go via the user's own Messages app or SIM |
| Independent security review | No | |

## Outcome

With the transfers statement in this PR, the policy matches the app on all three checks. Two items need John:
1. Approve the transfers wording.
2. Choose the Data safety deletion answer (see the table above).
