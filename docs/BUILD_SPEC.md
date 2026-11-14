# Build spec

## 1. Product

Desk Reset helps people who sit at a screen 6–8 hours a day to rest their eyes, stretch and drink water. It does this by taking over the screen for short breaks, with an easy override so the user stays in control.

Primary user: the builder (personal use first). Then other desk workers.

## 2. Principles

- Local, private, no accounts.
- Gentle but firm, never punishing.
- The user can always get out.
- Short, calm, attractive screens.

## 3. Breaks

| Break | Length | Default every | What happens |
| --- | --- | --- | --- |
| Eye break | 20 s | 20 min | Blur overlay, "Eyes to the horizon", countdown |
| Stretch break | about 2 min 20 s | 60 min | Blur overlay, 7 timed phases (see below), then a sip prompt |
| Long break | 5 min | 2 h | Blur overlay, stand-up prompt, sip prompt |

All intervals and lengths are user-adjustable. Working hours limit when breaks fire.

A heads-up appears 10 seconds before a break: "Start this break now", +1m, +5m, +15m. Each snooze uses one of the day's snoozes.

### Stretch routine (20 seconds per phase)

1. Neck tilt, right side
2. Neck tilt, left side
3. Shoulder rolls (both)
4. Seated twist, right
5. Seated twist, left
6. Wrist and forearm, right hand
7. Wrist and forearm, left hand

Phases advance automatically. The user can go Back, Next or Pause. Show a timer ring, the stretch name, the side, and a one-sentence cue.

## 4. Enforcement modes

| Mode | Skip behaviour |
| --- | --- |
| Gentle | One-click skip |
| Firm (default) | Hold to skip for 3 seconds. Limited skips per day (default 2) |
| Strict | No skip button |

**Emergency override (all modes):** hold Esc for 5 seconds. Always works and is logged.

Esc twice snoozes for 5 minutes (counts against the snooze limit).

**Optional "Lock my Mac when a break starts":** off by default. It uses the OS lock, so it needs the user's password to come back. Verify the mechanism before building.

## 5. Water

No measuring. The unit is a "sip". Tapping "Take a sip" plays a short 3D animation and adds one to today's count. Default daily goal is 10 sips (adjustable). Sips can be logged from the break screens, the menu bar popover, and the sip screen.

## 6. Overlay behaviour

- One overlay window per display, covering the whole display, above other apps including full-screen apps.
- The background blurs whatever was behind it, with a light lavender frost on top.
- Overlay must never block the emergency override.

Electron approaches to verify against current docs:
- macOS blur: a transparent frameless window with the `vibrancy` option.
- Windows blur: the `backgroundMaterial` option on Windows 11. Needs a fallback (a plain frosted colour) on older versions.
- Staying on top: `setAlwaysOnTop(true, 'screen-saver')` and `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`.
- Multiple displays: `screen.getAllDisplays()`.

## 7. Smart pause

- Idle: if the user has been idle for a while, treat it as a natural break and reset the timers (`powerMonitor.getSystemIdleTime`).
- Manual pause: "Pause 1 hour" in the menu bar popover.
- Working hours.
- Later: pause during calls and screen sharing. This is hard to detect reliably, so treat it as its own task and research it first.

## 8. Data (local only)

Store in a local file or SQLite in the app data folder:
- settings
- daily counts: breaks taken, breaks skipped, snoozes used, sips
- override log (time, break type, reason)

No data leaves the machine. Provide "Export" and "Delete all data" in Settings.

## 9. Screens and designs

| Screen | Design file |
| --- | --- |
| Eye-break overlay | `design/canvas/Main.dc.html` |
| Stretch break with 3D character | `design/canvas/Stretch.dc.html` |
| Take a sip with 3D character | `design/canvas/Water.dc.html` |
| Menu bar popover and 10-second heads-up | `design/canvas/MenuBar.dc.html` |
| Settings: break enforcement | `design/canvas/Settings.dc.html` |
| Desktop used as the blurred background in mockups | `design/canvas/BlurredDesktop.dc.html` |

Settings still to design: General, Stretches, Water, Smart pause, Working hours, Privacy.

## 10. 3D character

Goal: a real 3D human that performs each stretch and the sip.

Plan:
- Load a rigged humanoid `.glb` with Three.js (`GLTFLoader`) and play clips with `AnimationMixer`.
- Needed clips: `idle_seated`, `neck_tilt_R`, `neck_tilt_L`, `shoulder_roll`, `seated_twist_R`, `seated_twist_L`, `wrist_stretch_R`, `wrist_stretch_L`, `sip`.
- Mirror the left clips from the right ones if the rig allows it.
- Fall back to a simple static illustration if WebGL is unavailable.

Asset sourcing (verify licences before shipping anything):
- Characters: Quaternius Universal Base Characters (CC0).
- Animations: Quaternius Universal Animation Library (CC0) has a sitting set, but it has not been confirmed to include desk stretches. The stretches likely need custom animation (Blender keyframing, a text-to-motion tool, or a commissioned animator).
- Record every asset and its licence in `assets/LICENSES.md`.

`design/3d-prototype/entry.js` is a rough procedural prototype (capsule mannequin, inverse-kinematics arms, clipped water). It has not been visually verified. Use it for ideas only.

## 11. Phases

**Phase 1: personal MVP**
- Electron + TypeScript app, menu bar icon with countdown to the next break.
- Scheduler for eye, stretch and long breaks.
- Overlay on all displays with blur, countdown, and the Firm skip.
- Emergency override and watchdog.
- Sips logged from the popover.
- Local storage.
- Launch at login.
- Acceptance: the builder uses it for a full workday without getting stuck, and every break and override is logged.

**Phase 2: stretches and 3D**
- Stretch routine screen with timers and Back/Next/Pause.
- 3D character with real clips.
- Sip screen with 3D animation.
- Acceptance: all seven phases play correctly on both sides.

**Phase 3: polish**
- Heads-up with snooze, working hours, idle detection, stats, all settings screens.
- Acceptance: settings changes apply without restart.

**Phase 4: share**
- Onboarding with presets.
- Mac signing and notarization (needs an Apple Developer account).
- Windows port and code signing.
- Landing page.

## 12. Out of scope for now

Accounts, cloud sync, team dashboards, mobile apps, analytics.

## 13. Open items

- Confirm the Electron APIs listed in section 6 against current docs.
- Decide how to detect calls and screen sharing (Phase 3 or later).
- Decide the 3D character and who makes the stretch animations.
- Windows fonts: the SF stack falls back to the system UI font.
