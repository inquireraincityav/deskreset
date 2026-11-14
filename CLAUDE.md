# Desk Reset: instructions for Claude Code

Desk Reset is a Mac-first desktop app (Windows second) that interrupts long screen sessions with timed eye, stretch and water breaks. Read `docs/BUILD_SPEC.md` for the plan and `docs/DESIGN.md` for the look.

## Non-negotiables

1. **Local and private.** All data stays on the user's computer. No accounts, no analytics, no network calls for features.
2. **The user can always override.** In every enforcement mode, hold Esc for 5 seconds on a break screen to leave. Log every override locally.
3. **Gentle but firm.** Default mode is "Firm": hold to skip for 3 seconds, limited skips per day.
4. **Never trap the user.** If anything in the overlay fails or crashes, the screen must come back. Add a watchdog that closes overlay windows after the break length plus a margin.
5. **Mac first.** Build and test on macOS. Keep platform code behind small interfaces so the Windows port is easy.

## Stack

Electron + TypeScript. Vite for the renderer. Keep the UI in plain web tech so it matches `design/canvas/`. Three.js for the 3D character.

## How to work

- Build in the phases in `docs/BUILD_SPEC.md`. Finish and verify one phase before starting the next.
- Run the app and look at it. Don't claim a screen works without launching it.
- Match the designs in `design/canvas/` for layout, spacing and copy. Tokens are in `docs/DESIGN.md`.
- Anything marked "verify" in the spec is an unconfirmed assumption. Check the current docs before relying on it.
- Keep commits small, one logical change each.

## Design source of truth

`design/canvas/*.dc.html` are the screen designs. They are a custom format, so treat them as visual references to read, not code to ship. `design/3d-prototype/entry.js` is a rough Three.js prototype of the character and sip scene. It is untested, so use it only as a starting point.

## Fonts

Use the system San Francisco stack. Do not bundle SF font files, because Apple's licence limits SF to Apple platforms. On Windows the stack falls back to the system UI font.
