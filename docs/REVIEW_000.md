# Review 000 (Astra) — dispositions

All 20 findings were accepted as spec changes (cheap now, costly later). Implementation is scoped by phase.

| # | Finding | Resolution |
|---|---|---|
| 1 | Import/restore atomicity | D022; ARCHITECTURE "Transactions"; tasks 006, 007 |
| 2 | Re-import conflicts | D023; PACK_SPEC "Re-import"; task 007 |
| 3 | Backup manifest | D024; PACK_SPEC "Whole-app backup"; Phase 6 |
| 4 | Storage failure handling | ARCHITECTURE "Transactions and failure handling"; tasks 006, 007 |
| 5 | Archive limits | D025; PACK_SPEC "Import safety"; task 007 |
| 6 | Lossless manual bindings | D021; `bindings.json`; tasks 005, 007 |
| 7 | Filename collisions | D021; stem before first dot; no dots in ids |
| 8 | Audio formats | D026; PACK_SPEC "Audio formats" |
| 9 | Text/token disagreement | D020; verbatim text + offset annotations |
| 10 | Auto-link ambiguity | PACK_SPEC "Reader linking"; task 009 |
| 11 | Add-to-unlinked-word persistence | PACK_SPEC "Reader linking" step 4; task 010 |
| 12 | Text `ref` dropped | `texts` table has ref; round-trip test in tasks 005, 007 |
| 13 | Read-only enforcement | D019; texts immutable, annotations separate |
| 14 | Language fallback / bidi | D032; ARCHITECTURE "i18n, RTL and languages"; task 010 |
| 15 | Puzzle asset access | `GameContext.assets`; ARCHITECTURE "Games" |
| 16 | Game eligibility | D031; `core/games/eligibility.ts` |
| 17 | Scheduler undecided | D027 |
| 18 | Layer conflict | D028 |
| 19 | Asset ownership/deletion | D029; `bindings` table |
| 20 | Licensing contradictions | D030; `source` always required |

Deferred on purpose: merge-on-reimport, cross-pack asset sharing, PIN gate.
