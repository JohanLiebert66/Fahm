# Task 004 — CI and GitHub Pages deploy
- **Model:** Gemini 3.8 Flash. **Session:** NEW.
- **Read:** AGENTS.md.
- **Goal:** every push runs checks; every merge to main deploys to GitHub Pages.
- **Do:** GitHub Actions workflow for `npm ci && npm run check`; deploy workflow with the official Pages actions; Vite `base` configured for the repo name; short section in README about deployment.
- **Allowed files:** `.github/workflows/*`, `vite.config.ts`, README.md.
- **Done when:** workflows are valid YAML and the build output works under the repo sub-path (HashRouter links still work). Hazem enables Pages in repo settings himself.
- **Out of scope:** PWA/service worker (Phase 7), custom domain.
