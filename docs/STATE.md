# Fahm — Current State

Update this file at the end of every task (3-5 lines). It is the hand-off between agents and models.

## Status
- Phase: 1 in progress
- Task 006 (Storage layer): DONE. Exact Dexie v1 tables, pack-derived stored records, eight repositories and migration registration; no UI or import/export.
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

## Known issues / notes
- Docs changed after the first pack: ARCHITECTURE, PACK_SPEC, DECISIONS, AGENTS, tasks 005-010.
- Blob test limitation: Node structuredClone converts jsdom Blobs to {} (payload/type/size lost); repository MIME/size metadata survives. A native Node Blob round-trips bytes/type/size through the unchanged asset table; no production schema workaround.

## Open questions for Hazem
- O004 Tanzil variant (Uthmani or Simple) — before task 011
- O005 Re-read Tanzil license and record the date — before task 011
- Quran font rendering test (D017) — during task 002/010
