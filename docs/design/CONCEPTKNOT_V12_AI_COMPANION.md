# ConceptKnot AI companion — LexLoom 1/3 pop-out & native split-view parity

Reference (user's private LexLoom repository):
- app/chatgpt-companion.mjs: popup geometry requests the right 1/3 of available screen width, full available height, including multi-monitor origins.
- app/ai-split-links.tsx: real \`<a href target="_blank">\` elements, no JavaScript interception of Ctrl/Alt/Meta/Shift clicking; 720px mobile fallback; default anchor behavior when popup blocked.
- docs/brave-split-view-no-install.md: Ctrl+Alt+left click is a **Brave browser gesture**, not an action webpages can force. Context menu is a fallback.

ConceptKnot behavior:
- Three native AI service links in bottom-left chalkboard: ChatGPT, Gemini, Claude; transparent white SVG logos stay local.
- Plain left click on desktop (>=720px): opens selected service in a popup requesting **one-third screen width at the right edge**. The page does not resize existing tabs/windows or move the parent.
- Ctrl+Alt+left click on an AI link: **no preventDefault or JS synthetic click**. Brave versions that support native split gesture can handle it. Chrome may differ; Chrome Windows native split shortcut is Shift+Alt+N (browser-controlled). Right-click each AI link → browser's "Open link in split view" is the supported route.
- Modified click on chalkboard background **no longer overrides browser actions**. Click the actual AI logo/link.
- Popup blocked or small screens: normal link opens new tab. No iframe, privileged extensions, API tokens or third-party session reads.
- Optional question dock/copy, export, glass and notes stay intact.

Manual smoke:
1. Desktop Chrome/Brave: plain click each logo and check pop-out on right, width roughly 1/3 where browser permits.
2. Ctrl+Alt+click each logo in Brave: browser split view where supported; verify no scripted duplicate popup.
3. Right-click logo: Open link in split view; navigate without editing ConceptKnot content.
4. Chrome: right-click link → Open link in split view. Native shortcut Shift+Alt+N creates split in current tab (may not directly open AI URL).
5. Block popups: default new tab still works.
6. Narrow screen <720px: native link target instead of small popup.
7. Existing JSON study data and printer/PDF outputs unchanged.

Automated source/geometry tests: \`node --test tests/ai-companion-native-link.test.cjs\`.
No Actions, installer archives, scheduled CI or automatic Vercel Git deployments are introduced.
