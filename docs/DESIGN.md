# Design

## Feel

Calm, light, rounded. A frosted whitish-purple layer sits over a blurred copy of whatever the user was doing. Copy is friendly and short. Tone is gentle but firm.

## Colour tokens

| Token | Value | Use |
| --- | --- | --- |
| frost | `rgba(243,238,255,0.72)` | Overlay layer over the blurred desktop |
| blur | `40px`, saturate `1.1` | Backdrop blur |
| ink | `#261852` | Headings, primary text |
| body | `#43367A` | Body text |
| subtle | `#5B4F86` | Secondary text |
| accent | `#6B46E5` | Button fills, rings, bars (white text on it) |
| accent-text | `#4F2FC4` | Small accent text |
| accent-large | `#5B36D6` | Large numerals and countdowns |
| soft | `#E6DEFF` | Selected nav item, soft fills |
| tint | `#F3EEFF` | Selected card background |
| glass | `rgba(255,255,255,0.55–0.7)` with `rgba(255,255,255,0.9)` border | Cards and secondary buttons |

Small text should keep at least 4.5:1 contrast. Re-check contrast when the real blurred background is in place, because it changes with the user's desktop.

## Type

San Francisco, through the system font stack.

- Body: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif`
- Headings, buttons, numerals: `ui-rounded, 'SF Pro Rounded', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif`

`ui-rounded` gives the rounded SF where the platform supports it, and falls back to regular SF elsewhere. Do not bundle SF font files.

Sizes used in the designs: overlay title 92 px, stretch name 72 px, countdown 80 px, body 24–26 px on break screens, 14–16 px in settings.

## Shape

Pills (`999px`) for buttons and chips. Cards 20–36 px radius. Soft violet shadow on floating cards, for example `0 24px 60px rgba(80,50,170,0.18)`.

## Screens

1. **Eye-break overlay.** Clock chip at top, eyebrow "Eye break · 3 of 8 today", title "Eyes to the horizon", sentence, countdown, thin progress bar. Bottom: "Hold to skip" (with a fill showing hold progress) and "Lock screen", then "2 skips left today · Press Esc twice to snooze 5 min".
2. **Stretch break.** Four-segment progress along the top. Left: a 3D character card. Right: side chip, stretch name, cue, a timer ring with seconds, and Back / Pause / Next. Footer safety note.
3. **Take a sip.** 3D character lifts a glass and drinks. "Take a sip." with a sips counter, ten dots, and a primary button. Footer says sips are saved only on this Mac.
4. **Menu bar.** Status item shows minutes to the next break. Popover shows next break, today's breaks, sips and skips, then Start a break now, Take a sip, Pause 1 hour, Settings. The 10-second heads-up is a floating card with Start now and +1m, +5m, +15m.
5. **Settings: break enforcement.** Gentle, Firm (default), Strict cards, skips per day stepper, an "Always on" emergency override row, a "Lock my Mac when a break starts" switch (off), and a privacy line.

## Stretches

Holds are 20 seconds per side. Most desk-stretch guides give a range of about 15 to 30 seconds.

| # | Stretch | Cue |
| --- | --- | --- |
| 1 | Neck tilt | Drop an ear toward the same shoulder. Keep both shoulders low. |
| 2 | Shoulder rolls | Lift the shoulders, then roll back and down in slow, big circles. |
| 3 | Seated twist | Sit tall, one hand on the chair back, turn gently. |
| 4 | Wrist and forearm | Arm straight out, palm facing away, draw the fingers back gently. |

Always show: "Move gently and stop if anything hurts."

The animations are original. They are not copied from the sources below. Have a physiotherapist or similar professional check the form before release.

## Sources used for the stretch choices and hold times

- https://ubiehealth.com/doctors-note/office-workers-desk-workers-posturego-stretches-5793q6
- https://www.getluna.com/blog/stretches-for-desk-workers
- https://fs8.com/?p=1451
- https://my.vanderbilthealth.com/?p=40626
- https://health.clevelandclinic.org/sit-all-day-or-text-a-lot-these-yoga-poses-can-help/

## Reference inspiration

Layout and flow inspiration came from existing break-reminder apps (a green popup break timer and a Mac break app with a full-screen blurred overlay, a 10-second heads-up, and enforcement levels). The visual styling here is original. Do not copy those apps' names, icons or artwork.
