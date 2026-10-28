# ConceptKnot v13 — visual cleanup, 2026-10-29

1. Opening animated garden: removes ivory headline card and scroll caption. Scene remains full-bleed.
2. Tab titles: keeps only functional title, removes generic subtitles/English labels/static date, condenses spacing. Visual and typing top copy also simplified.
3. Typing: charcoal glass with white checked characters (#f5fff4), pale pending text (#b7d3cc) and visible error states. Real textarea remains transparent for single-layer rendering/IME.
4. Cards: legacy colored top/left borders removed. Cyan/rose/gold ambient shadows and glass blur replace opaque fills. Dark glass preserved for hero, board and typing.
5. AI: native ChatGPT/Gemini/Claude links moved into the middle resize/swap rail; 19px circles with white 14px icons, horizontal on mobile. Ctrl+Alt native gesture, right-click split and LexLoom 1/3 popup behavior remain.

Test: node --test tests/ui-compact-glass-v13.cjs. Historical test updated for new cover.
Study data remains in localStorage. No Actions, installer, ZIP or auto Git deploy.
