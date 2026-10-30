# Task 002 — i18n, RTL and app shell
- **Model:** Gemini 3.8 Flash. **Session:** NEW.
- **Read:** AGENTS.md, docs/ARCHITECTURE.md (i18n and RTL). Fonts: self-host Cairo (decision D017) with its OFL license file in the repo; use it for the Arabic UI. Do not choose any Quran text font yet.
- **Goal:** language switch (en/ar) that flips direction, plus the app shell.
- **Do:** i18next setup with `en.json` and `ar.json` (keys for app name, Learn, Play, Practice, Read With Me / اقرأ معي, Teacher, Settings, Language); `dir` and `lang` set on `<html>` from UI language; language choice persisted in localStorage; shell layout with three large child-mode buttons (Learn, Play, Practice) and a Read With Me button; shared `ui/IconButton` and `ui/Card`; Tailwind logical utilities only.
- **Allowed files:** `src/i18n/*`, `src/app/*`, `src/ui/*`, `src/index.css`, tailwind config, tests for these.
- **Done when:** switching language flips layout correctly with no `left/right` classes anywhere (add a lint or test that greps for them); buttons are >= 48px; `npm run check` passes.
- **Out of scope:** real screens behind the buttons, storage, teacher mode.
