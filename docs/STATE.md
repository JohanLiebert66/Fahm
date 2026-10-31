# Fahm — Current State

Update this file at the end of every task (3-5 lines). It is the hand-off between agents and models.

## Status
- Phase: 1 in progress
- Task 003 (Child/teacher modes and hold-to-enter gate): DONE. In-memory ModeProvider (resets to child on reload), 3s HoldButton with SVG progress ring (pointer + keyboard hold, cancel on release/blur), teacher entry header button, TeacherGate route guard with automatic redirection to '/', and TeacherHome placeholder with exit button.
- Next task: tasks/004-first-pack.md

## Done
- Planning pack, review fixes (spec v1.1)
- Task 001 scaffold: build, test, lint, typecheck pipelines working and verified.
- Task 002 i18n, RTL & app shell: 17 unit tests passing across i18n, components, shell, and physical class validation.
- Task 003 Child/teacher modes & hold-to-enter gate: 35 tests passing across modes, gate, routes, touch targets, and i18n.

## Known issues / notes
- Docs changed after the first pack: ARCHITECTURE, PACK_SPEC, DECISIONS, AGENTS, tasks 005-010.

## Open questions for Hazem
- O004 Tanzil variant (Uthmani or Simple) — before task 011
- O005 Re-read Tanzil license and record the date — before task 011
- Quran font rendering test (D017) — during task 002/010
