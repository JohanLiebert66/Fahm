# Fahm — Architecture

## Stack
| Need | Choice |
|---|---|
| Language / build | TypeScript (strict), Vite |
| UI | React, Tailwind (logical utilities), react-router-dom (HashRouter) |
| State | Zustand (UI state only; data lives in Dexie) |
| Storage | Dexie (IndexedDB) |
| Validation | Zod |
| i18n | i18next + react-i18next |
| Drag and drop | dnd-kit |
| Zip import/export | JSZip |
| Spaced repetition | ts-fsrs (MVP, Phase 6) |
| PWA / offline | vite-plugin-pwa |
| Tests | Vitest (+ Playwright later for RTL checks) |

Fonts are self-hosted (no CDN). UI font: Cairo (verify OFL license file is included). Quran text font: see DECISIONS D017 (rendering test decides).
Anything not in this table needs approval and a DECISIONS.md entry.

## Layers and dependency rule
```
app      -> features, storage, core, ui
features -> storage, core, ui          (never other features)
storage  -> core                        (pure functions and types: validate, match, normalize)
ui       -> nothing app-specific
core     -> nothing (pure TypeScript, no React, no browser APIs, no storage)
```
- `core/` is pure and fully unit-tested. `storage/` is the only place that touches IndexedDB. Import orchestration (validate -> bind -> write) lives in `storage/` and calls pure `core/` functions.
- Each file does one thing and stays around 200 lines or less.

## Folder tree
```
src/
  app/        App.tsx, routes, ModeProvider, TeacherGate
  core/
    pack/       types.ts, schema.ts (Zod), validate.ts, version.ts
    binding/    normalizeText.ts, matchAssets.ts, filenames.ts
    reader/     tokenize.ts, linkTokens.ts, spans.ts
    games/      eligibility.ts (pure rules per game)
    srs/        scheduler.ts (wraps ts-fsrs)
  storage/
    db.ts       Dexie schema + migrations
    tx.ts       transaction helper + typed storage errors
    packRepo.ts itemRepo.ts textRepo.ts annotationRepo.ts assetRepo.ts bindingRepo.ts progressRepo.ts profileRepo.ts
    importPack.ts exportPack.ts deletePack.ts backup.ts restore.ts persist.ts quota.ts
  features/
    learn/ reader/ practice/ teacher/ (import, bind, record, edit)
    games/  engine/  match/ quiz/ puzzle/  registry.ts
  ui/         Button, IconButton, Card, Dialog, HoldButton, ImageBox, ExplainBox
  i18n/       index.ts, en.json, ar.json
tests/fixtures/  synthetic packs (never real Quran text)
```

## Dexie tables (v1)
- `packs` {id, meta, importedAt}
- `items` {[packId+id], packId, id, term, forms[], group, level, explain{lang:{meaning,example}}}
- `texts` {[packId+id], packId, id, title, ref, segments[]}   — immutable after import
- `annotations` {[packId+textId+segment+start+end], item?, override?}   — editable layer
- `assets` {id (crypto.randomUUID), packId, kind, mime, name, size, blob, credit?, license?}
- `bindings` {id, packId, assetId, itemId?, role, order, }   — links items to assets
- `profiles` {id, name, avatar, createdAt}
- `progress` {[profileId+packId+itemId], srsVersion, srsState, lastSeen, correct, wrong}
- `settings` {key, value}
Rules: every progress row has `profileId` (MVP: one default profile at first run). Schema changes need a Dexie version bump + migration. `srsState` is versioned so the algorithm can change later.

## Transactions and failure handling
- **Validate first, mutate second.** Import and restore parse and validate everything in memory, then write in ONE Dexie transaction. Any failure leaves existing data untouched.
- Wrap storage errors in typed errors (`QuotaExceeded`, `StorageUnavailable`, `WriteFailed`, `InvalidData`) with user-readable i18n messages and a next step (free space, export a backup).
- Before large imports and recordings, call `navigator.storage.estimate()` and warn if space is low.
- **A recording is confirmed to the user only after its transaction commits.** If saving fails, keep the recording in memory and offer retry or download.
- Call `navigator.storage.persist()` at first run (best effort, never blocks).
- If IndexedDB is unavailable (private mode), show a clear "can't save here" screen; read-only demo is acceptable.

## Assets
- Asset ids are UUIDs; each asset belongs to one pack. Bindings reference assets.
- **Deleting a pack** (after confirmation) removes its items, texts, annotations, bindings, assets and progress rows in one transaction. Unbinding an asset removes only the binding; "remove unused files" is a teacher action that deletes assets with no binding.
- UI shows blobs via `URL.createObjectURL` and revokes them on unmount. Make small thumbnails for lists.
- Recordings use `MediaRecorder`; choose the format with `isTypeSupported`; store the real MIME type; never relabel.

## Games
```ts
interface GameContext {
  packId: string;
  profileId: string;
  items: Item[];
  assets: AssetAccess;   // getImages(), getPuzzleImages(), getUrl(assetId), bindings per item
}
interface GameDefinition {
  id: string;
  titleKey: string;
  canRun(ctx: GameContext): { ok: boolean; reasonKey?: string };
  Component: React.FC<{ ctx: GameContext; onResult(r: GameResult): void }>;
}
```
`games/registry.ts` lists games; adding one = new folder + one line. Eligibility rules live in `core/games/eligibility.ts` (pure, tested):
- **Match:** at least 4 items that each have an image, with distinct terms and distinct images. Otherwise disabled with a reason.
- **Quiz:** at least 4 items with distinct terms and a meaning or image. Wrong answers come from the same `group` first, then any other items; never duplicates of the correct answer or of each other. Items that cannot be asked are skipped.
- **Puzzle:** at least 1 image, from item images or `puzzles/`. Works in packs with zero items.
Games never know the subject.

## i18n, RTL and languages
- UI language (en/ar) is a setting. The pack content area uses the pack `dir`; everything else follows the UI language.
- Explanation language choice: UI language -> pack language -> first available. Each explanation is rendered with its own language and direction (`lang` + `dir`), terms embedded in other-language text are wrapped in `<bdi>`, and references (like "113:1") are forced LTR and isolated.
- Logical CSS only; direction-implying icons flip in RTL.
- Display text is never normalized or altered; normalization is for matching only.

## Backup, privacy, teacher gate
- Whole-app backup/restore format is in PACK_SPEC ("Whole-app backup"). Remind users to back up after big edits.
- No network calls at runtime in the MVP. No analytics.
- Teacher gate: hold a button 3 seconds. A child guard, not security. PIN optional later.

## Testing
Fixture packs are the test data. Unit-test everything in `core/`. Transaction tests prove failed imports change nothing. Round-trip tests prove export -> import equals the original, including bindings and annotations. One automated RTL check of the reader. `npm run check` must pass before a task is done.
