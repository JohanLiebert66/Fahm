# Fahm — Decisions Log

Format: ID, decision, reason. Add new entries at the bottom. Do not re-debate settled items; propose a change as a new entry.

- D001 **Name: Fahm (فهم).** "Understanding." Short, bilingual, available.
- D002 **License: MIT** for code. Pack content has separate licenses (pack.json fields).
- D003 **Web app (PWA), TypeScript + React + Vite.** One codebase for laptop and tablet, free static hosting, good RTL support.
- D004 **Local-first, no backend.** Data in IndexedDB (Dexie). Privacy for children, zero hosting cost.
- D005 **Arabic + English UI from day one.** Retrofitting RTL later is costly. UI language and pack language are independent.
- D006 **Packs are the unit of content.** The app never hard-codes subject matter.
- D007 **Games are plugins** behind one `GameDefinition` interface and a registry.
- D008 **Feature-based folders with one-way dependencies** (see ARCHITECTURE.md).
- D009 **HashRouter** so deep links work on GitHub Pages without server rules.
- D010 **Quran text policy:** only from verified source files provided by Hazem; agents never type or generate it; app treats it as read-only.
- D011 **Profiles:** one default local profile at first run; `profileId` is in all progress data so several children can be added later.
- D012 **Teacher gate:** hold-to-enter (3 s) in MVP; optional PIN later.
- D013 **AI features parked** (see ROADMAP). Design leaves room via the provider adapter idea.
- D014 **Backups are first-class:** persistent storage request, whole-app zip backup/restore, because recordings are irreplaceable.
- D015 **Matching normalization** removes diacritics/tatweel and unifies alef forms; does not unify ى/ي or ة/ه by default.
- D016 **Quran text source: Tanzil.net.** Terms (verify on tanzil.net/docs/license before bundling): Creative Commons Attribution 3.0; verbatim copies only, changing the text is not allowed; the source must be clearly indicated with a link to https://tanzil.net. Consequences: verses are stored verbatim; tokens are never stored in the text (annotations use offsets); pack.json `source` names Tanzil and links it; the app About screen credits Tanzil.
- D017 **Fonts:** UI font = Cairo (verify OFL license file). Quran text font: Hazem chose Cairo; accepted only if the rendering test passes (Al-Falaq verses, all marks, pause signs and dagger alef show correctly and legibly). If not, use an OFL Quran font such as Amiri Quran for the text only; Cairo stays the UI font.
- D018 **First sample surah: Al-Falaq (113).** Short; good for a first pack. Take care with images for abstract words (see CONTENT_GUIDELINES).
- D019 **Source text is immutable in the MVP.** Teachers edit only items and the annotation layer.
- D020 **Texts store verbatim text only.** Tokens come from runtime splitting; explicit links and per-occurrence overrides live in `annotations/<textId>.json` as UTF-16 offsets validated against the text.
- D021 **Explicit asset bindings:** `bindings.json` is the source of truth and is always exported; filename inference is only a fallback. Item ids may not contain dots; the filename stem is everything before the first dot.
- D022 **Atomic import/restore:** validate first, one transaction, existing data preserved on failure.
- D023 **Re-import:** "Import as copy" (default) or "Replace" (keeps progress for item ids that still exist). Merge is post-MVP. Item ids are permanent.
- D024 **Versioned whole-app backup** (`backup.json` with backupVersion, settings, profiles, progress, srsVersion, plus one zip per pack). Restore is all-or-nothing.
- D025 **Bounded archive import:** 2000 entries, 250 MB expanded (actual bytes), 5 MB image, 10 MB audio, strict path and duplicate rules.
- D026 **Audio:** stored as recorded; extension derived from MIME (webm, m4a, ogg, mp3, wav); never relabelled.
- D027 **ts-fsrs is the MVP scheduler** (Phase 6); `srsState` is versioned.
- D028 **Layers:** `storage` may call pure `core` functions; `core` imports nothing app-related.
- D029 **Assets belong to one pack** (UUID ids); deleting a pack removes its assets in one transaction; unbinding keeps files until the teacher cleans up unused ones.
- D030 **`source` is always required** in pack.json; per-asset `credit`/`license` are optional in bindings and default to the pack license.
- D031 **Game eligibility rules** (Match >= 4 items with distinct images; Quiz >= 4 items with distinct terms; Puzzle >= 1 image) are pure functions in `core/games`; games receive a `GameContext` that includes asset access.
- D032 **Language fallback:** UI language, then pack language, then first available; each explanation renders with its own lang/dir, terms in `<bdi>`, references forced LTR.

## Open decisions (settle before the task that needs them)
- O004 **Which Tanzil text variant:** Uthmani (matches the printed mushaf, more marks)
- O005 **Tanzil license re-check:** read http://tanzil.net/docs/license yourself and note the date in this file. Needed before task 011.

Resolved from the first list: O001 (D016), O002 (D017), O003 (D018).
