# Fahm (فهم) — Agent Rules

Fahm is an open-source (MIT) web app that helps teach any subject to children, teens and adults.
It never hard-codes content: everything it teaches comes from **packs** (folders of items, texts, images, audio).
First use case: **Read With Me** — a Quran reader where tapping a word shows an image + a written explanation.

READ THIS FILE FIRST IN EVERY SESSION. Then read only the docs your task file names.

## Golden rules
1. **Never type, recall or generate Quran text or translations.** Quran text exists only in pack files that Hazem provides from a verified source. Tests use the synthetic fixtures in `tests/fixtures/`.
2. **One task per session.** Do only what the task file says. Touch only its ALLOWED FILES. If more is needed, stop and ask.
3. **Plan first.** Reply with a plan (max 8 lines) and wait for "go" before writing code.
4. **No hard-coded content in `src/`** (no surah names, vocab words, sample sentences). Content lives in packs and fixtures.
5. **No new dependencies** unless the task allows it. Approved list: docs/ARCHITECTURE.md.
6. **All UI text goes through i18n keys**, added to BOTH `src/i18n/en.json` and `ar.json`.
7. **Logical CSS only**: use `ms-*/me-*/ps-*/pe-*/start/end`, never left/right. Layout must work in RTL and LTR.
8. **Layer rule**: `core/` imports nothing app-related; `storage/` may call pure `core/` functions; neither imports React. `features/` never import each other. Details: docs/ARCHITECTURE.md.
9. **Small files**: aim for <= 200 lines. No `utils.ts` / `helpers.ts`; name files for what they do.
10. **Child mode must stay simple**: big touch targets (>= 48px), icons + short labels, nothing destructive.
11. **Local-first**: no backend, no analytics, no runtime network calls in the MVP.
12. **Writes are atomic**: validate first, then one transaction; a failure must leave existing data unchanged. Never confirm a save before it commits.
13. **Finish properly**: run `npm run check`, report the result, add 3-5 lines to docs/STATE.md. Do not commit unless told to.

## Commands
- `npm run dev` start dev server
- `npm run build` production build
- `npm run test` unit tests (Vitest)
- `npm run lint` / `npm run typecheck`
- `npm run check` = lint + typecheck + test (must pass before you finish)

## Stack
TypeScript (strict), React, Vite, Tailwind, react-router (HashRouter), Zustand, Dexie (IndexedDB), Zod,
i18next, dnd-kit, JSZip, ts-fsrs (Phase 6), vite-plugin-pwa, Vitest. UI font: Cairo.

## Folder map
```
src/app/        shell, routing, child/teacher mode switch
src/core/       pure TS: pack/ binding/ reader/ srs/
src/storage/    Dexie db, asset blobs, backup
src/features/   learn/ reader/ games/ practice/ teacher/
src/ui/         shared components
src/i18n/       en.json ar.json
tests/fixtures/ synthetic packs (never real Quran text)
docs/           concept, architecture, pack spec, roadmap, decisions, state
tasks/          one file per task
```

## Conventions
- Named exports, function components, no classes unless needed.
- Validate every external input (pack files, imports) with Zod. In `core/`, return typed results (`{ ok, value | errors }`), do not throw for bad user data.
- Tests live next to the code: `thing.ts` + `thing.test.ts`.
- Commit style (when told): `feat(core): ...`, `fix(reader): ...`, `docs: ...`.
- Revoke blob URLs you create. Never keep large blobs in React state.

## When unsure
Ask. Do not guess about pack format, Arabic text handling, or religious content. See docs/PACK_SPEC.md and docs/CONTENT_GUIDELINES.md.

## Task habits (apply to every task)
- Before adding anything (component, helper, fallback, context, storage function), check whether it already exists. Reuse it; say what you found in the plan.
- Never compute text offsets or spans by hand. Take them from token start/end/coreStart/coreEnd (D036).
- Test data is invented. No real Quran text, no pause signs or dagger alef in fixtures, tests or comments.
- The plan lists the exact files you will touch. Anything outside that list needs approval before you edit it.
- Report every file touched, anything jsdom cannot prove (as a browser checklist), and any test outside your area that changed.
- A saved change is confirmed only after its transaction commits. A failed write leaves existing data unchanged.
- Update STATE.md (3-5 lines). Add a DECISIONS.md entry (next free D-number) only for a real decision, and say so.
- If you are unsure or a decision is missing, stop and ask. Do not invent schema fields.
- Files stay at about 200 lines or less; split rather than grow.

## Risk levels
- GATED (core, storage, Unicode/Arabic, schema, recorder, backup): plan first, wait for "go".
- FAST (simple UI, strings, CSS, docs): run the self-check below, then proceed without waiting.
  Self-check: allowed files only, layer rule respected, both i18n files updated, logical CSS, no new dependencies, no real Quran text, tests included. If any item fails, stop and wait for "go".
  Still report the plan in the first message and the full summary at the end.