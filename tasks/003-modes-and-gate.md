# Task 003 — Child/teacher modes and hold-to-enter gate
- **Model:** Gemini 3.8 Flash. **Session:** NEW.
- **Read:** AGENTS.md, docs/ARCHITECTURE.md (Teacher gate), docs/PROJECT_CONCEPT.md (Teacher mode).
- **Goal:** a mode switch that keeps children out of teacher screens.
- **Do:** `ModeProvider` (child default, teacher), `ui/HoldButton` (hold 3 seconds with visible progress ring, cancels on release), a small teacher-entry button in the shell, teacher home page placeholder with an "Exit teacher mode" button, route guard so teacher routes redirect to child home when in child mode. All text via i18n keys.
- **Allowed files:** `src/app/*`, `src/ui/HoldButton.tsx`, `src/features/teacher/TeacherHome.tsx`, i18n files, tests.
- **Done when:** holding 3 s enters teacher mode; a quick tap does nothing; direct URL to a teacher route in child mode redirects; works in both languages; `npm run check` passes.
- **Out of scope:** PIN, real teacher tools.
