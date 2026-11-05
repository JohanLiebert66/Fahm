# Fahm — Current State

Update this file at the end of every task (3-5 lines). It is the hand-off between agents and models.

## Status
- Phase: 1 in progress
- Task 003b (Teacher mode bar): complete; universal teacher navigation bar, exit action, and child-mode redirection verified.
- Next task: awaiting selection.

## Done
- Planning pack, review fixes (spec v1.1)
- Task 001 scaffold: build, test, lint, typecheck pipelines working and verified.
- Task 002 i18n, RTL & app shell: 17 unit tests passing across i18n, components, shell, and physical class validation.
- Task 003 Child/teacher modes & hold-to-enter gate: 35 tests passing across modes, gate, routes, touch targets, and i18n.
- Task 004 CI & GitHub Pages deploy: workflows created, Vite relative base verified, all 35 tests passing, README updated.
- Task 005: validatePack accepts parsed per-file JSON plus asset-path strings; validates IDs, references, UTF-16 spans and binding roles/paths without I/O or input mutation.
- Four synthetic JSON fixture packs added, with placeholder SVG assets; supported fields survive parsing and unknown fields are ignored with warnings. No Quran text or new dependencies added.
- Verification: npm run check passes (116 tests across 12 files); npm run build passes. Negative tests cover schema and cross-file failures, including simultaneous independent errors.
- Task 006: real multi-table rollback and atomic pack-deletion/isolation tests pass; default-profile initialization is transactional and safe across concurrent connections; source texts remain immutable.
- Typed storage errors use storage-local i18n keys; persist/estimate wrappers handle missing APIs and rejected calls without throwing. Added only fake-indexeddb (dev), including the explicitly approved lockfile update; i18n/setup untouched.
- Verification: npm run check passes (161 tests across 24 files), npm run build passes, npm ci --dry-run --ignore-scripts passes; every pre-existing lockfile dependency record is unchanged.
- Task 007: real ZIP/folder pickers at `/teacher/import`, bilingual reports/validation diagnostics and copy-default/replace dialog; small transfer helpers, no dependency or database-schema changes.
- Import checks raw ZIP records, normalizes Windows separators including explicit directories (D033), rejects NFC/case duplicates before root stripping, enforces hard streamed-byte ceilings, and warns when quota estimates are unavailable.
- Atomic copy/replace, surviving-item progress and canonical export preserve items, text/segment refs, annotations, binding metadata and native-Blob bytes; text filename/ID and declared MIME mismatches fail without writes.
- Verification: npm run check passes (430 tests/43 files), build passes (540 KB bundle-size warning), git diff --check passes; Chrome ZIP/folder/copy, IndexedDB readback, Replace keyboard trapping and Arabic 375px reports verified; independent review passed with all 60 reviewed hashes unchanged.
- JSZip limitation: overflow rejects immediately, clears retained chunks and permanently pauses future compressed input; the current synchronous inflater push can still emit discarded output, so this is not hard CPU cancellation.
- Task 007b: empty directories are skipped before path validation/file counting; safe ZIP/folder selections without pack.json report only bilingual noPack; unsafe files retain existing keys, with a separate injectable 10,000-raw-entry cap.
- Verification: npm run check passes (456 tests/44 files), including directory/data/hostile-path regressions, default 10,000/10,001 raw-entry boundaries for ZIP/folder inputs, Windows-style ZIP import with database readback, i18n parity and emitted-key coverage; git diff --check passes. No new dependencies or commits.

- Task 008: pure matching-only normalizeText and thin normalizeFilenameStem wrapper use named constants/precompiled regexes; empty output means no match; no dependencies, filename-parser or importer changes.
- Added 276 synthetic normalization tests covering every removal-range member, decomposed/composed equivalence, Unicode separator edges, retained marks/digits, Latin-only lowercasing and 1,024 deterministic seeded inputs per export.
- Owner-approved final NFC resolves the retained-mark ordering regression U+0617 U+06E5 U+0619; PACK_SPEC normalization and D034 document it without widening removal ranges. Ordinary-input outputs remain unchanged.
- Verification: npm run check passes lint, typecheck and all 732 tests across 45 files; normalization source/test are 40/186 lines. No commit.
- Task 008b: step 2 strips exactly the 16 approved invisible format characters (including BOM, now removed rather than separating); PACK_SPEC/D035 updated; all 758 tests/45 files pass via npm run check, including 302 normalization tests, seeded idempotence and unchanged ordinary-input controls; no dependencies, extra transformations or commit.

- Task 009: pure reader span helpers, Unicode tokenization and annotation-first linking preserve exact UTF-16 source slices; standalone marks/signs attach backwards, with non-linkable initial marks.
- D036/PACK_SPEC record exact full/core annotation alignment, phrase merging, stable earlier-overlap precedence, offset-bearing collision/warning reports and unchanged overrides; override-only annotations use a reader-local type without changing pack schemas.
- Synthetic fixture/inline tests cover source coverage, all U+06D6-U+06DE signs, diacritic matching, meaningful accents/symbols, phrase boundaries, invalid spans, overlaps, override fallback, frozen inputs and equivalent RTL/LTR offsets.
- Verification: npm run check passes lint, typecheck and all 798 tests across 49 files; git diff --check passes. Reader source/test files are at most 96 lines; no dependencies, UI/storage changes or commit.

- Task 009 core-span correction: retain letter-attached Mn/Mc marks, trim unbased edge marks and the named U+06D6-U+06DE pause/verse range; standalone signs extend full spans only, with tokenizer/linker/normalizer code unchanged.
- All 32 vowel regressions pass; added direct-sign, leading-mark, dagger-alef/small-mark, spacing-mark, decomposed-Latin, supplementary-offset, vowel-core annotation and matching-equivalence coverage; spans cutting off a retained final vowel now warn as misaligned.
- Differential check: 438 synthetic/fixture input cases compared, 107 changed results enumerated in the session artifact; token boundaries/text/kinds and automatic item ids unchanged across that corpus.
- Verification: npm run check passes lint, typecheck and all 858 tests/50 files; RTL source-scan test alone now has a 30,000 ms timeout (earlier 5,383 ms timeout, isolated retry 22 ms, final suite 138 ms); no dependencies or commit.

- Task 010a: child home opens `/read` and ungated reader deep links; exact core-linked text, phrase selection, bounded 1–3-segment windows and logical RTL image/explanation layout; teacher routes remain guarded.
- Explanation fallback/occurrence overrides, per-block language/direction, embedded-term isolation and LTR references implemented; first selected image only, term alt text, calm placeholders and localized disabled audio; existing Cairo retained.
- Injectable asset URLs revoke on selection/segment changes, unmount and late completion; route loads reject stale results, including away-and-back navigation. Synthetic en/ar fixtures, missing/error states and read-only database snapshots covered without Blob round-trips.
- Verification: `npm run check` passes lint/typecheck and 896 tests/58 files; build and `git diff --check` pass. Build retains the >500 kB chunk warning; no dependencies, schema/core/storage changes, teacher editing or commit.

- Task 003b: universal <nav> TeacherBar rendered in normal document flow on all routes when in teacher mode; includes visible "Teacher mode" text, Link to `/teacher`, and Exit button navigating to `/` and restoring child mode; completely hidden in child mode.
- Consolidated exit action into TeacherBar, removing redundant exit button from TeacherHome; all interactive targets >= 48px, logical CSS only, responsive 375px wrapping, and key-parity i18n in English and Arabic.
- Verification: `npm run check` passes lint, typecheck, and 908 tests across 59 files; `npm run build` passes; child-mode guard redirection verified without new dependencies or commit.

## Known issues / notes
- Docs changed after the first pack: ARCHITECTURE, PACK_SPEC, DECISIONS, AGENTS, tasks 005-010.
- Blob test limitation: Node structuredClone converts jsdom Blobs to {} (payload/type/size lost); repository MIME/size metadata survives. A native Node Blob round-trips bytes/type/size through the unchanged asset table; no production schema workaround.

## Open questions for Hazem
- O004 Tanzil variant (Uthmani or Simple) — before task 011
- O005 Re-read Tanzil license and record the date — before task 011
- Quran font rendering test (D017) — during task 002/010
