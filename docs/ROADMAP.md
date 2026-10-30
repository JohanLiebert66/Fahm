# Fahm — Roadmap

Each phase ends with something that runs. Tasks live in `tasks/`. Current status: `docs/STATE.md`.

## Phase 0 — Planning (done)
Concept, architecture, pack spec, decisions, tasks.

## Phase 1 — Foundation
Scaffold, i18n and RTL, fonts, app shell, child/teacher modes with hold-to-enter gate, CI and deploy.

## Phase 2 — Pack core
Zod schema, fixture packs, Dexie storage, pack import/export (folder and zip), validation reports.

## Phase 3 — Read With Me
Arabic normalization, tokenizer and token linking, reader screen (text on top; image box and explanation box below), teacher "add to word" flow, Quran sample pack from a verified source provided by Hazem.

## Phase 4 — Binding and audio
Filename matcher, drag-to-match tray, image attach, audio recorder and player, pronunciation/explanation slots.

## Phase 5 — MVP games
Games engine and registry, Match, Quiz, Puzzle.

## Phase 6 — Practice, profiles, backup
Spaced repetition (ts-fsrs), one default profile with profileId, progress view, whole-app backup and restore, persistent storage.

## Phase 7 — Polish and release
PWA offline, tablet layouts, accessibility pass, README, sample packs, contribution guide, v0.1 release.

## MVP = end of Phase 7
See "MVP definition of done" in PROJECT_CONCEPT.md.

## Post-MVP
- English story pack and story-specific read-aloud
- Pronunciation by voice synthesis (Web Speech API), your recording first
- More games: spelling tiles, cloze, sort, sequence, label-the-picture, word search, crossword, letter tracing, draw and color
- Multiple child profiles UI
- Pack sharing: a community `fahm-packs` repo
- Desktop wrapper (Tauri)

## Parked: AI features (documented, not built)
Goal: help create images and text for packs without hard-coding any provider.
- **Provider adapter**: one interface (`generateText`, `generateImage`) with swappable backends.
- **Backends**: user's own API key (e.g. Gemini free tier, OpenRouter), local models (Ollama for text, ComfyUI/Stable Diffusion for images via OpenAI-compatible endpoints), and a **copy-prompt / paste-image-back** fallback that needs no API at all.
- **Keys stay in the browser**; never sent to any Fahm server (there is none).
- **Prompt builder GUI**: pick style, age, concept; optionally edit the generated prompt. Styles are a plain JSON list so anyone can add new ones.
- **Review step**: AI images are never shown to a child until the teacher approves them.
- **Where it plugs in**: the teacher "add image" dialog gets a "Generate" tab; the pack format does not change (generated images are just images).
- Note: consumer chat subscriptions generally do not provide API access; check current free-tier limits before promising features.
