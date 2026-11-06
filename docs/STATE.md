# Fahm — Current State

The hand-off between agents, models and chats. Update at the end of every task (3-5 lines); condense older entries when this file passes ~80 lines.

## Status
- Done: tasks 000-009, 007b, 008b, 010a (read-only reader), 010b (teacher add explanation), 003b (teacher mode bar), 010c (image box scaling & isolation), 010d (teacher pack list with delete & picker pack id), 011-pre (Tanzil notice & license logged), 011b (verbatim sample folder pack). 993 tests / 67 files pass; npm run check and build pass.
- 011a done: verified Tanzil hash, 6,236 verse records, all per-sura counts.
- Inventory and recommendation: docs/TANZIL_INVENTORY.md. No normalization/core-trimming change needed for this export.
- 011b verified: packs/al-falaq/ rebuilds byte-identically; five source-byte-equal verses, LF-joined integrity sidecar, notice preserved through folder import/export/re-import and database reopen (D039); optional external ZIP is deterministic, never committed. No backup round-trip claimed.
- 011b-fix done (D040): notice extracted from the verified downloaded file's own header; blank source lines 6237/6238 are outside it. All three notice copies are script-generated; documentation bytes outside the fence are unchanged.
- Notice integrity: UTF-8/LF with exactly one trailing LF; noticeSha256 D52680DB446C36E9F7878C704E1DB6EEE16328F854671276FC63533FB73F3483. Independent extraction and a second rebuild verify all six artifacts byte-identically.
- Verse integrity remains AB6D6E8E968748E1B43665E2F08AF76DCDC72EBCDCA189DB822AE64C638F566F; texts/al-falaq.json and items.json have identical before/after byte hashes.
- Verification: npm run check passes (996 tests / 67 files), including 12 source-independent sample-pack tests and notice-preserving import/export/re-import with database reopen. Existing TeacherBar act warnings remain; D017 browser font approval is still pending. No commit.
- Next: Hazem imports the sample at /teacher/import and checks all five verses at /read for D017 Cairo rendering approval.
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
- 011-pre verified: Tanzil terms of use recorded verbatim in docs/THIRD_PARTY_NOTICES.md (D038); O004 resolved (Uthmani with pause/sajdah marks); O005 resolved (license re-read on 2026-11-05).

## Known issues / limits
- No way to edit a pack title currently in the UI.
- JSZip cannot interrupt a synchronous inflate; overflow rejects immediately and discards output, but it is not hard CPU cancellation.
- jsdom Blobs do not round-trip through fake-indexeddb; real-browser Blob read-back verified manually.
- Bundle > 500 kB warning (Phase 7: code-splitting).
- Teacher creation always writes an annotation with `item` using coreStart/coreEnd, never an override; per-occurrence-only creation is parked under D037, and editing already-linked explanations remains a later task.
- 010a browser results still to confirm: Arabic RTL with diacritics, Tab navigation, reload on a reader URL, /teacher redirect in child mode.

## Open questions for Hazem
- D017 Quran font: Cairo accepted only if the Al-Falaq text renders every mark correctly; otherwise an OFL Quran font for the text only — decide in 011.

## Later phases
Phase 4 binding + audio recorder; Phase 5 games (Match, Quiz, Puzzle); Phase 6 practice (ts-fsrs), profiles, backup/restore; Phase 7 PWA, accessibility, README, v0.1.
- Phase 6: Whole-app backup must carry pack.json (including the Tanzil notice) unchanged — D038.