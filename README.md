# Fahm (فهم)

Fahm is an open-source (MIT) web app designed to teach any subject to children, teens, and adults.

It never hard-codes educational content: all content is loaded from dynamic **packs** (folders/archives containing items, texts, images, and audio). The primary initial use case is **Read With Me** — a reader where tapping a word or phrase reveals an explanation and associated multimedia.

## Tech Stack

- **Language & Build:** TypeScript (strict mode), Vite
- **UI:** React 19, Tailwind CSS (logical utilities), react-router-dom (HashRouter)
- **State & Storage:** Zustand, Dexie (IndexedDB)
- **Validation & Tools:** Zod, JSZip, @dnd-kit/core, i18next
- **Testing & Quality:** Vitest, ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js (>= 18)
- npm

### Installation

```bash
npm install
```

### Development

Start the development server with live reload:

```bash
npm run dev
```

### Quality Checks

Run linting, type checking, and unit tests:

```bash
npm run check
```

Individual check scripts:

- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript compiler checks
- `npm run test` — Vitest unit tests
- `npm run build` — Production build

## Deployment

GitHub Pages deployment is automated via GitHub Actions on every push to `main` (or via manual trigger with `workflow_dispatch`).

To enable GitHub Pages in the repository:
1. Go to **Settings** > **Pages** in the repository.
2. Under **Build and deployment** > **Source**, choose **GitHub Actions**.

Once deployed, the app is hosted at:
`https://<username>.github.io/<repo-name>/`

Because the app uses `HashRouter` and relative asset paths (`base: './'`), all routes and assets resolve correctly under the repository sub-path without server-side rewrite rules.

## License

MIT License - see [LICENSE](./LICENSE) for details.
