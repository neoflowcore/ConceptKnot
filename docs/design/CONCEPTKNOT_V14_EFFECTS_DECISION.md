# ConceptKnot v14: design-effects decision — 2026-10-29

Design Taste Skill v2 app-screen guidance: purposeful feedback, not decorative motion. Existing garden is the identity. Chosen: keep background mounted, short 150/270ms content view transition; preserve reduced-motion and no repeated card entrances. The signature element stays split chalkboard/workspace.

1. Cursor: unified note mirror and textarea font, weight, kerning, line-height, letter-spacing and padding at every 12–36px size; mirror measured Range caret overlay tracks actual text, including Korean. Preserve native keyboard/IME, S Pen mode, letter colors and saved notes.
2. Translucent charcoal typing surface with light text.
3. Starter card three ambient light identities: coral (reverse), violet (exam), mint (comparison) — glow/shadow instead of top borders.
4. Ribbon from 66px to 53px (about 80%), 1px larger tab labels, matching brand wordmark size.
5. Header before date: persisted dark-mode toggle and compact Pomodoro launcher; original study timer shares same deadline, focus 25min / rest 5min defaults, configurable durations, pause/reset/next, completed focus count, local persistence.
6. View Transition API used when supported, keeps scene canvas outside #main; fallback immediate and reduced-motion disabled.
7. Existing GitHub Actions and automatic Vercel git deploy remain disabled; manual deployment only.

QA: static script/stylesheet validation and browser input/resize/transition check recommended at 1440px, 768px, 390px. Runtime Chrome behavior requires real browser verification.
