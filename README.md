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

## Starting the build

Open this repo in Claude Code and say:

> Read CLAUDE.md and docs/BUILD_SPEC.md, then start Phase 1.
