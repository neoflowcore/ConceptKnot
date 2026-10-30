# ConceptKnot Dot Landing v51 - blank lower foreground

## User-approved intent

- Remove both lion cubs, lawn/grass, flowers, decorative notes and old garden backdrop from the lower landing scene.
- Keep the sky with the large pointillist cumulus and two softly looping small clouds, six colored dot apples, the orbit and the baby owl.
- **Preserve the SCROLL DOWN button** exactly: position, text, gentle bobbing animation, keyboard focus and click behavior.
- Leave the lower part of the homepage as clean white negative space (no faint background dots or line patterns).

## Rollback

- GitHub pre-change backup branch: `backup/dot-v50-before-blank-foreground-20261030`
- Saved Git commit: `155d8bb53a7d9cdc5d99dd7255bb2dae702ad2ea`
- Previous Vercel production deployment: `dpl_6TSvM6D2a4vJroxcmxz1Q6PUujmL`
- Restore through a normal revert commit and manual production deployment, avoiding force-pushing main or running GitHub Actions.

## Changes

- `assets/ck-dot-landing-v51.js`: mount sky/orbit/owl/scroll only, keep home-only motion and 24fps cap.
- `assets/ck-dot-landing-v51.css`: pure white negative space, retains SCROLL DOWN style and animation.
- `assets/ck-garden-25d-v36.js`: point to new renderer, existing fallback unaffected.
- `sw.js`: bump service worker version and pre-cache v51 files, no automatic build.
- `tests/dot-landing-v51.test.cjs`: DOM contract + lifecycle + button activation + viewport checks.

## Validation

- JavaScript static / dynamic tests, visual inspection in headless Chromium at desktop and mobile viewport sizes; compare against v50 screenshot as available.
- Production deploy manually through the Vercel Git integration for the exact new main SHA.
