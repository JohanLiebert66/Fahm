# Task 009 — Reader core: tokenizing and linking
- **Model:** GPT-6.1 Sol (medium). **Session:** NEW.
- **Read:** AGENTS.md, docs/PACK_SPEC.md (texts, annotations, Reader linking, Text normalization), docs/ARCHITECTURE.md (Layers).
- **Goal:** turn a segment plus annotations into tappable tokens linked to items, in pure TypeScript.
- **Do:** `src/core/reader/spans.ts` (span helpers, UTF-16 offsets, overlap checks), `tokenize.ts` (split on whitespace keeping exact offsets; tokens made only of marks/punctuation attach to the previous token; token text is always `text.slice(start,end)`), `linkTokens.ts` (explicit annotation first; else normalized match to item `term`/`forms` after stripping edge punctuation; zero matches = unlinked; two or more = unlinked plus a collision report; apply `override`).
- **Allowed files:** `src/core/reader/*`, tests using fixtures `en-vocab` and `ar-sample-text`.
- **Done when:** for every token, token text equals the original slice and tokens cover all non-whitespace characters; diacritic differences still link; collisions are reported not guessed; `npm run check` passes.
- **Out of scope:** UI, storage.
