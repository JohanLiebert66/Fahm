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
- D033 **Normalize backslashes, then validate import paths.** Windows PowerShell 5.1 ZIPs can use backslash separators. Normalize to forward slashes before root-folder handling, traversal checks and case-insensitive NFC duplicate detection; the same rules apply to ZIPs, folders and explicit binding paths.
- D034 **Final NFC for matching normalization.** After the initial NFC, specified mark/tatweel removal, alef unification, Latin-only locale-independent lowercasing and separator collapsing/trimming, apply NFC again: removing marks can leave retained combining marks out of canonical order. Keep U+0610-U+061A and digits unchanged; do not broaden removal ranges. Normalization is matching-only; empty output means no match.
- D035 **Strip specified invisible formats for matching.** Step 2 removes U+061C, U+200B-U+200F, U+202A-U+202E, U+2066-U+2069 and U+FEFF alongside marks/tatweel, before alef unification, so invisible formatting does not prevent matching. These are exact ranges, not all format characters; U+FEFF is stripped rather than becoming a separator. No digit conversion, dash mapping or additional mark ranges; display text stays unchanged.

- D036 **Reader annotation full/core alignment.** Every token also has a core span (token minus leading/trailing punctuation and marks). An annotation aligns if its span equals the token's full span OR its core span. A phrase annotation aligns if it starts at the first token's start or coreStart and ends at the last token's end or coreEnd. Otherwise it is ignored and reported as a warning. This permits punctuation/sign-adjacent occurrence links without changing source text. Core trimming includes edge symbols, U+06D6-U+06DE and exposed whitespace; phrase tokens keep full outer spans. Stable start ordering keeps the earlier accepted overlapping annotation; invalid spans warn instead of throwing. Overrides remain unchanged; override-only annotations use normal matching and warn `override-without-link` without a unique link. This optional item is reader-local; pack schema changes are outside task 009. Core spans serve highlighting and annotation alignment, retaining letter-attached Mn/Mc marks but trimming edge punctuation/symbols, unbased marks and `PAUSE_AND_VERSE_SIGNS_RANGE` (U+06D6-U+06DE) even directly after letters; standalone signs extend only full spans, while matching continues to use the edge-punctuation-stripped token through `normalizeText`.

- D037 Per-occurrence-only explanations for an unlinked word need a design (e.g. an item flag disabling auto-matching); parked, not part of 010b. Per-occurrence overrides remain for already-linked words, in a later task.
- D038 **Tanzil copyright notice:** The Tanzil copyright notice (docs/THIRD_PARTY_NOTICES.md) must be included with the text in every pack that contains Tanzil text, in pack exports and backups, and in the repo; the About screen links to tanzil.net and credits the Tanzil Project. Text is never changed (D016).
- D039 **Tanzil sample pack notice, integrity and test exception.** Store the full notice in the existing `pack.json.description` field: no field-length cap applies and no current screen renders description; real folder import, export and re-import preserve it. Keep repo-reader notice and integrity sidecars beside, not inside, `packs/al-falaq/`, which contains only importer-supported files.
  - Integrity: SHA-256 of the five verse texts in verse order joined with one LF (U+000A), no trailing LF, encoded as UTF-8 without BOM. The sidecar records this hash, verse count, source SHA-256 and algorithm; no verse text. Rebuild verifies the approved source hash and re-reads written pack files, comparing each verse's UTF-8 bytes to its original source slice.
  - No committed ZIP. The Node-built-ins-only builder may write a deterministic ZIP with fixed timestamps to an external path via `--zip`; folder import remains the default. Whole-app backup is not implemented, so pack-transfer tests are not a backup round-trip claim.
  - Test exception: `src/storage/alFalaqPack.test.ts` may read the committed sample pack and compare actual verse text only by hashes, without embedding or printing it. Script and test source files contain no Arabic characters; titles are Latin-script-only. Synthetic fixtures remain synthetic. The notice is checked line by line against `docs/THIRD_PARTY_NOTICES.md`, ignoring blank lines.
- D040 **Downloaded-file notice is authoritative.** Always extract the notice from the verified downloaded Tanzil file's own comment header; a notice copied from chat, another page or elsewhere is not acceptable. Remove only the leading `#` and one following space, preserving indentation, trailing whitespace and internal blank lines; retain empty source lines within the header, not outside it. Encode as UTF-8 with LF and exactly one trailing LF.
  - The builder regenerates `pack.json.description`, `packs/al-falaq.NOTICE.txt`, `packs/al-falaq.integrity.json` and only the fenced notice block in `docs/THIRD_PARTY_NOTICES.md`; its heading, intro and surrounding bytes remain unchanged.
  - Record `noticeSha256` over those exact notice bytes; source-independent tests require all three copies and import/export/re-import results to match it. This supersedes D039's blank-line-insensitive notice comparison. Verse bytes and the D039 verse hash remain unchanged.

## Open decisions (settle before the task that needs them)
(None currently open before 011)

Resolved from the first list: O001 (D016), O002 (D017), O003 (D018).
Resolved for 011:
- O004 (resolved: Uthmani, with pause marks and sajdah signs on)
- O005 (resolved: Hazem re-read the Tanzil license on 2026-11-05; terms match D016)
