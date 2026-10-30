# Fahm (فهم) — Idea Brief for the Coding Agent

> Read this first for context. It explains WHAT we are building and WHY.
> The detailed rules and specs live in `AGENTS.md`, `docs/`, and `tasks/` (added to the repo by Hazem).
> Until a task file is given to you: do NOT write code, do NOT scaffold, do NOT choose a different stack. Read, then confirm understanding in at most 10 lines and wait.

## The idea in one paragraph
Fahm is a free, open-source (MIT), offline-first web app that accompanies a parent or teacher in teaching any subject to children (and later teens and adults). A word or concept is shown with a picture and a simple written explanation, optionally with the teacher's own recorded voice. Children can then play games and practise using the same material. The app has no hard-coded subject: all content comes from **packs** that the user controls.

## Why it exists
Hazem wants one simple tool to explain things to his kids: Quran verses word by word, new English vocabulary, science concepts, letters. Today this means scattered apps and manual work. Fahm brings pictures, explanations, audio, games and practice into one calm interface that works with any material, and that anyone can extend.

## First use case: Read With Me (اقرأ معي)
- A short passage (1-3 verses or sentences) sits at the top of the screen.
- Words that have content are highlighted. The child (or teacher) taps a word.
- Below the text, two boxes appear: **image** on one side, **written explanation** (simple meaning + example) on the other, with an audio button.
- Quran (Arabic, right-to-left) and English stories (left-to-right) use the same screen; only the pack differs.
- In teacher mode, tapping a word with no content offers: add image, add explanation, record my voice.

## Everything else, briefly
- **Packs:** folders of items (words/concepts), texts, images, audio. Images bind to words by filename convention or by dragging them onto words. No images or words are ever hard-coded in the app.
- **Audio:** the teacher records their own voice and attaches it to any word as pronunciation or explanation. Voice-synthesis pronunciation comes later.
- **MVP games (generic, work on any pack):** Match (words to pictures), Quiz (multiple choice), Puzzle (any image sliced into pieces).
- **Practice:** spaced repetition per child profile. One local profile at first, but all progress data carries a `profileId` so several children can be added later.
- **Two modes:** Child mode (big buttons, almost empty, nothing destructive) and Teacher mode (import, bind, record, edit, backup), entered by holding a button for 3 seconds.
- **Languages:** Arabic and English interface from day one, RTL and LTR. The interface language and the pack content language are independent.
- **Local-first:** no accounts, no server, no analytics. Data stays on the device. Backup and restore are first-class because recordings cannot be recreated.
- **AI features** (image/text generation with the user's own key or local models) are intentionally parked; see `docs/ROADMAP.md`. Do not build them.

## Stack (decided)
TypeScript (strict), React, Vite, Tailwind, react-router (HashRouter), Zustand, Dexie (IndexedDB), Zod, i18next, dnd-kit, JSZip, ts-fsrs, vite-plugin-pwa, Vitest. UI font: Cairo. Hosted free on GitHub Pages. No new dependencies without approval.

## How the code must be shaped
Modular but not complex. Feature folders (`learn`, `reader`, `games`, `practice`, `teacher`), a pure `core/` layer with no React, a `storage/` layer for the database, and a small shared `ui/`. Files stay small (about 200 lines or less), one responsibility each, no catch-all `utils.ts`. Each game is a plugin behind one interface and a registry, so adding a game never touches existing games.

## Non-negotiables
1. **Never type, recall, or generate Quran text or translations.** Quran text comes only from verified pack files Hazem provides. Tests use synthetic fixtures.
2. **Nothing subject-specific in `src/`.** No surah names, no vocabulary lists, no sample sentences.
3. **Pack text is displayed exactly as stored.** Normalization is for matching only, never for display.
4. **Logical CSS only** (start/end, not left/right) and every UI string through i18n keys in both languages.
5. **Child safety and simplicity:** large touch targets, no destructive actions in child mode, respectful handling of religious content (`docs/CONTENT_GUIDELINES.md`).
6. **Writes are atomic:** validate first, then one transaction; failures leave existing data unchanged.
7. **One task at a time**, only the files the task allows, plan first, wait for "go".

## Decisions already made (see docs/DECISIONS.md)
- Quran text source: Tanzil.net (verbatim, attribution with link; never modified).
- First sample surah: Al-Falaq (113).
- Fonts: Cairo for the UI; the Quran text font is confirmed by a rendering test.
- Still open: Tanzil variant (Uthmani or Simple) and a license re-check. Do not decide these yourself.

## How we work together
1. Hazem gives you one task file at a time (`tasks/NNN-name.md`), tells you which model to use, and starts a fresh session per task.
2. You reply with a plan of at most 8 lines and wait for approval.
3. You implement only that task, run `npm run check`, report the result, and add 3-5 lines to `docs/STATE.md`.
4. If you hit something the spec does not cover, ask. Do not guess about pack format, Arabic text handling, or religious content.

## Definition of done for the whole MVP
A user can import a pack; read a passage with tappable words; add an image and a recording to a word; play Match, Quiz and Puzzle on the same pack; practise with spaced repetition; and back up and restore everything. It works offline, in Arabic and English, on a tablet.
