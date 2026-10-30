# Task 008 — Text normalization for matching
- **Model:** GPT-6.1 Sol (HIGH). **Session:** NEW.
- **Read:** AGENTS.md, docs/PACK_SPEC.md (Text normalization, Matching order), docs/DECISIONS.md D015.
- **Goal:** one trustworthy function that normalizes text for matching, never for display.
- **Do:** `src/core/binding/normalizeText.ts` implementing the four steps exactly as specified; `normalizeFilenameStem`; tests with many cases: diacritics (fatha, damma, kasra, shadda, sukun, dagger alef), Quranic marks, tatweel, alef variants, mixed Arabic/Latin, spaces/underscores/hyphens, NFC vs NFD input, empty strings. Document edge cases in code comments briefly.
- **Allowed files:** `src/core/binding/normalizeText.ts`, `normalizeText.test.ts`.
- **Done when:** all tests pass; function is pure and idempotent (normalize(normalize(x)) equals normalize(x)); `npm run check` passes.
- **Out of scope:** matching assets (task 012), reader.
