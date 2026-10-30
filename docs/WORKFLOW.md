# Fahm — How to work with the agents (for Hazem)

## The loop (every task)
1. Open `docs/STATE.md`, pick the next task file in `tasks/`.
2. Start the session the task file says (NEW or CONTINUE) with the model it names.
3. Paste the starter prompt below, with the task file name filled in.
4. Read the agent's plan. Say "go" or correct it.
5. Run `npm run check` yourself. Test in the browser. Commit.
6. Make sure STATE.md was updated. End the session.

## Starter prompt (paste as the first message)
```
Read AGENTS.md first. Then read tasks/<NNN-name>.md and only the docs it lists.
Do exactly that task, nothing else. Touch only its ALLOWED FILES.
First reply with a plan (max 8 lines) and wait for my "go".
```
(If your Hermes setup does not auto-load AGENTS.md, this prompt covers it, because it tells the agent to read it.)

## Which model for what
| Work type | Model | Notes |
|---|---|---|
| Scaffolding, config, CSS, simple screens, strings, README | Gemini 3.8 Flash | Cheap and fast. Give narrow tasks and name the files, because Flash tends to re-read files and wander. |
| Core logic: schema, storage, import/export, matching, tokenizer, game engine, SRS | GPT-6.1 Sol | Default for anything with edge cases. Medium effort; high for Arabic text handling. |
| Tricky UI (drag and drop, puzzle slicing, recorder) | Sol, or Flash first then Sol to fix | If Flash fails the same thing twice, switch. |
| Tests | Sol (core), Flash (simple UI) | |
| Code review of a finished task | Sol, fresh session, diff only | Fresh eyes catch more. |
| Bug that survived 2 attempts | Sol high; after 2 more failures, Astra | Give the new session the error and the file names, not the whole history. |
| Architecture review, final privacy/security review | Astra | Rare, one-shot, mostly read-only. |

## Session rules
- **New session per task** (default). Long sessions get expensive and confused.
- **Continue the same session** only for small follow-ups on the same task (a CSS tweak, a missed string).
- **Always new session** for: a review, a switch of model, a new phase, or after the agent starts repeating itself.
- Switching model mid-task: start a new session and give it the task file plus 3 lines on what is done.
- If the agent says it needs a file outside ALLOWED FILES, decide yourself; do not let it roam.

## Saving tokens
- Keep AGENTS.md short; link to docs instead of pasting them.
- Point at sections ("PACK_SPEC.md, section 'Matching order'") rather than whole docs.
- Ask for the plan first; it is cheaper to fix a plan than code.
- Give checkable "done when" bullets so the agent stops.
- Paste only the failing test output when reporting a problem.
- Commit after each task so a bad session can be reverted.

## Escalation ladder
Flash -> Sol medium -> Sol high -> Astra. Each step in a NEW session with a short summary of what failed.

## After each phase
Ask a fresh Sol session to review the diff of the whole phase against ARCHITECTURE.md (layer rule, file sizes, hard-coded content, i18n keys, logical CSS). Then update DECISIONS.md if anything changed.
