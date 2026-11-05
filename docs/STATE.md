# Fahm — Current State

Update this file at the end of every task (3-5 lines). It is the hand-off between agents and models.

## Status
- Phase: 1 in progress
- Task 007 (Pack import/export): complete; full checks and final independent review passed.
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

## Known issues / notes
- Docs changed after the first pack: ARCHITECTURE, PACK_SPEC, DECISIONS, AGENTS, tasks 005-010.
- Blob test limitation: Node structuredClone converts jsdom Blobs to {} (payload/type/size lost); repository MIME/size metadata survives. A native Node Blob round-trips bytes/type/size through the unchanged asset table; no production schema workaround.

## Open questions for Hazem
- O004 Tanzil variant (Uthmani or Simple) — before task 011
- O005 Re-read Tanzil license and record the date — before task 011
- Quran font rendering test (D017) — during task 002/010
