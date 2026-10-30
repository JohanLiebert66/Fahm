# Task 006 — Storage layer (Dexie)
- **Model:** GPT-6.1 Sol (medium). **Session:** NEW.
- **Read:** AGENTS.md, docs/ARCHITECTURE.md (Dexie tables, Transactions and failure handling, Assets), docs/DECISIONS.md D022, D027-D029.
- **Goal:** database and repositories, no UI.
- **Do:** `db.ts` with the v1 tables from ARCHITECTURE and a migration hook; `tx.ts` (transaction helper + typed errors QuotaExceeded, StorageUnavailable, WriteFailed, InvalidData); repos: pack, item, text, annotation, asset, binding, profile, progress; `deletePack.ts` (one transaction removing everything for a pack); `persist.ts`; `quota.ts` (estimate wrapper); first-run creation of one default profile. Dev dependency `fake-indexeddb` allowed.
- **Allowed files:** `src/storage/*`, tests, package.json (only the dev dependency).
- **Done when:** CRUD tests per repo; a forced failure mid-transaction leaves data unchanged; default profile created once; deletePack leaves no orphan assets/bindings/progress for that pack; asset blob round trip; `npm run check` passes.
- **Out of scope:** import/export, UI.
