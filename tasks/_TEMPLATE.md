# Task NNN<x>: <short title>

RISK: GATED | FAST
MODEL: <Sol medium | Sol high | Flash | Astra>
SESSION: NEW
DEPENDS ON: <task ids or "none">

## Goal
<2-4 lines: what the user can do or what exists when this is done>

## Read only
- AGENTS.md
- <doc and section names, e.g. DECISIONS D019-D021, PACK_SPEC "Matching order">
- <paste any 2-5 spec lines the agent would otherwise search for>

## Do
1. <numbered, checkable behaviours>

## Out of scope
- <things tempting to add that belong to a later task>

## Tests
- <what must be proven, with invented fixtures>

## Done when
- npm run check passes
- STATE.md updated (3-5 lines)
- <task-specific checks>
- Final report lists every file touched and a browser checklist. No commit.

## Allowed files
<exact list or patterns; anything else needs approval>

## Parallel notes (only if sub-agents are used)
- Each sub-agent owns separate folders.
- The orchestrating agent alone edits: en.json, ar.json, STATE.md, DECISIONS.md.