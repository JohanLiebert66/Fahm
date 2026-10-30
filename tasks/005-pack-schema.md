# Task 005 — Pack schema and fixture packs
- **Model:** GPT-6.1 Sol (medium). **Session:** NEW.
- **Read:** AGENTS.md, docs/PACK_SPEC.md (all), docs/ARCHITECTURE.md (Layers), docs/DECISIONS.md (D019-D021, D030).
- **Goal:** typed, validated pack format in pure TypeScript.
- **Do:** in `src/core/pack/`: `types.ts`, `schema.ts` (Zod for pack.json, items.json, texts/*.json, annotations/*.json, bindings.json), `validate.ts` returning `{ ok: true, value } | { ok: false, errors[] }` (each error: file, path, message). Cross-checks: duplicate item ids; id charset (no dots/spaces); unsupported schemaVersion; annotation refers to unknown item or segment; spans inside text, ordered, non-overlapping; annotation `text` equals the slice; binding refers to unknown item; `source` present. Fixture packs in `tests/fixtures/`: `en-vocab` (6 items with groups, one text, annotations, bindings), `ar-letters` (a few letters as items), `ar-sample-text` (a SYNTHETIC non-Quran Arabic sentence with diacritics and annotations), `puzzle-only` (no items, puzzles/ images). Placeholder images can be tiny generated files.
- **Allowed files:** `src/core/pack/*`, `tests/fixtures/*`.
- **Done when:** valid fixtures pass; every error type above is reported readably; several errors are reported together; text `ref` and all spec fields survive parse (no field dropped); `npm run check` passes.
- **Out of scope:** storage, import UI, React.
