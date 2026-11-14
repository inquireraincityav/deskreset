# Desk Reset

A desk-wellness app for people who sit at a screen 6–8 hours a day. Desk Reset takes over the screen for short, timed breaks: rest your eyes, do a few easy stretches, and take a sip of water. Everything stays on your computer. There are no accounts.

Mac first, then Windows.

## How it works

- **Eye breaks** (20 seconds, roughly every 20 minutes): look at something far away.
- **Stretch breaks** (about 2½ minutes, roughly every hour): four easy desk stretches, each timed and shown by a 3D character.
- **Sips:** tap "Take a sip" to log water. No measuring.
- **Blur overlay:** a break blurs whatever you were working on.
- **Gentle but firm:** skipping takes a deliberate hold. You can always override, in every mode.

## Status

Design phase. The screens are designed. The app is not built yet.

## Repo layout

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Instructions for Claude Code. Read first. |
| `docs/BUILD_SPEC.md` | What to build, in what order, with acceptance criteria. |
| `docs/DESIGN.md` | Colours, type, screens, stretch details, sources. |
| `design/canvas/` | The screen designs (`*.dc.html`) and their layout (`canvas.json`). |
| `design/3d-prototype/` | A Three.js prototype of the 3D character and sip scene. Reference only. |

## Running the app (dev)

Requires Node 20+. On macOS for the full behaviour.

```bash
npm install
npm run dev
```

The app runs as a menu-bar icon (no Dock icon). Click it for the popover.

## Packaging a shareable file

For USB or AirDrop handoff, package a standalone build. Signing and
notarization are Phase 4 — until they are set up, the recipient will
right-click → Open the first time to bypass Gatekeeper.

```bash
# Apple Silicon Mac (recommended for personal share)
npm run pack:mac-arm

# Universal (Intel + Apple Silicon)
npm run pack:mac

# Windows portable .exe + installer
npm run pack:win
```

Output lands in `release/`:

- `Desk Reset-<ver>-arm64.dmg` — double-click, drag to Applications. Good for AirDrop.
- `Desk Reset-<ver>-arm64-mac.zip` — the raw `.app` bundle zipped. Unzip and drop in Applications. Smallest handoff.
- `DeskReset-<ver>-portable.exe` — Windows single-file portable.

Either Mac file copies to a USB stick or AirDrops without an installer.

## Starting the build

Open this repo in Claude Code and say:

> Read CLAUDE.md and docs/BUILD_SPEC.md, then start Phase 1.
