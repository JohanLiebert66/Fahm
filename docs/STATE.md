# Fahm — Current State

The hand-off between agents, models and chats. Update at the end of every task (3-5 lines); condense older entries when this file passes ~80 lines.

## Status
- Done: tasks 000-009, 007b, 008b, 010a (read-only reader), 010b (teacher add explanation), 003b (teacher mode bar), 010c (image box scaling & isolation), 010d (teacher pack list with delete & picker pack id). 984 tests / 66 files pass; npm run check and build pass.
- Next: 011 (Tanzil Al-Falaq pack, needs O004/O005).
- Live site: https://johanliebert66.github.io/Fahm/ (GitHub Pages via Actions).

## What exists
- App shell: Arabic/English UI with RTL, Cairo font, child home, hold-to-enter (3 s) teacher gate, in-memory mode, teacher bar with exit on every route.
- Core (pure TS): pack schema + validatePack (D019-D021, D030), normalizeText (5 steps, D034/D035), reader tokenizer/linker with full/core span alignment (D036).
- Storage (Dexie): v1 tables, typed storage errors, atomic transactions, deletePack, default profile, persist/quota wrappers.
- Import/export at /teacher/import: ZIP and folder, bounded streamed reading, Windows-path normalization (D033), copy/replace on conflict, canonical export.
- Reader at /read and /read/:packId/:textId: exact stored text, linked word buttons, phrase selection, 1-3 segment window, image + explanation boxes, language fallback, read-only per-occurrence overrides, injectable asset URLs with revoke; teachers can add an explanation applying to every matching occurrence of an unlinked word.
- 010b verified: tokenizer core spans/terms, injected collision-safe IDs, atomic item + annotation creation, empty/duplicate/overlap rejection, rollback, cancel/double submit, immediate links and database-reopen persistence; unavailable storage gives a clear cannot-save message. Child mode has no editing UI.
- 010c verified: image box scales any picture (object-contain, max-w-full, max-h-64, w-auto h-auto, centered) with logical CSS without overflow, replaces broken/failed images with placeholder on error, and enforces image isolation to <img src="blob:..."> with zero <svg>/<object>/<embed> elements.
- 010d verified: teacher pack list (/teacher) with pack title, id, localized date, item/text counts, empty state, and destructive delete dialog (Cancel initial focus, disabled while deleting, atomic deletePack, in-place update, typed storage error); reader picker displays subtle pack id to distinguish copies.

## Known issues / limits
- No way to edit a pack title currently in the UI.
- JSZip cannot interrupt a synchronous inflate; overflow rejects immediately and discards output, but it is not hard CPU cancellation.
- jsdom Blobs do not round-trip through fake-indexeddb; real-browser Blob read-back verified manually.
- Bundle > 500 kB warning (Phase 7: code-splitting).
- Teacher creation always writes an annotation with `item` using coreStart/coreEnd, never an override; per-occurrence-only creation is parked under D037, and editing already-linked explanations remains a later task.
- 010a browser results still to confirm: Arabic RTL with diacritics, Tab navigation, reload on a reader URL, /teacher redirect in child mode.

## Open questions for Hazem
- O004 Tanzil text variant (Uthmani recommended, or Simple) — before 011.
- O005 Re-read the Tanzil license (CC BY 3.0, verbatim only, link to tanzil.net) and record the date in DECISIONS.md — before 011.
- D017 Quran font: Cairo accepted only if the Al-Falaq text renders every mark correctly; otherwise an OFL Quran font for the text only — decide in 011.
- 011 should include a character inventory of the real Tanzil text to decide whether mark stripping needs extending (U+0610-U+061A, Arabic Extended-A marks).

## Later phases
Phase 4 binding + audio recorder; Phase 5 games (Match, Quiz, Puzzle); Phase 6 practice (ts-fsrs), profiles, backup/restore; Phase 7 PWA, accessibility, README, v0.1.