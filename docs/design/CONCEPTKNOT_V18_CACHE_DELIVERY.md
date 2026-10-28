# v18 cache delivery and browser verification

- Service Worker cache version advances from v17 to v18 to invalidate stale CSS and JavaScript assets after manual deployment.
- This does not activate GitHub Actions or Vercel Git auto-deploy.
- Because the Service Worker is scoped to the deployed site, this code change is not live until deliberately deployed.
- User-facing smoke test: open the production website, hard-refresh once, reload a second time to let the replacement worker take over, and inspect network for v18 stylesheet / edited PDF and WebGL JS. If old assets remain, unregister the previous worker under Developer Tools > Application > Service Workers and reload; existing localStorage notes are not removed by unregistering.
- Tested here: GitHub branch ref, source parse, and deploy config only. No device/GPU browser performance measurement has been performed.
