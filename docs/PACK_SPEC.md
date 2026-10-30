# Fahm — Pack Specification (schemaVersion 1)

A **pack** is a folder (or a .zip of it) describing one topic. The app imports it into IndexedDB. Exporting produces the same structure, losslessly.

```
my-pack/
  pack.json            required
  items.json           required (may be [] for text-only or puzzle-only packs)
  texts/<id>.json      optional, one file per text (surah, story, chapter) — SOURCE TEXT, verbatim
  annotations/<id>.json optional, teacher/author links and per-occurrence overrides for texts/<id>.json
  bindings.json        optional, explicit asset bindings (always written on export)
  images/ audio/ puzzles/   asset files
```

## pack.json
```json
{
  "schemaVersion": 1,
  "id": "sample-en-vocab",
  "title": { "en": "Sample vocabulary", "ar": "مفردات تجريبية" },
  "lang": "en",
  "dir": "ltr",
  "author": "Name",
  "license": "CC-BY-4.0",
  "source": "Original work",
  "description": "Optional"
}
```
All of these are required except `description`: `schemaVersion`, `id`, `title` (>= 1 language), `lang`, `dir`, `author`, `license`, `source`.
`source` is ALWAYS required (use "Original work" if it is yours). External text must name its source and link (e.g. Tanzil: name + https://tanzil.net).
`id`: lowercase ascii letters, digits, hyphen (`[a-z0-9-]+`).
A higher `schemaVersion` than the app supports is rejected with a clear message; older versions are migrated on import.

## items.json
```json
{
  "id": "mercy",
  "term": "mercy",
  "forms": ["mercies"],
  "group": "feelings",
  "level": 1,
  "explain": {
    "en": { "meaning": "Being kind to someone who is suffering.", "example": "She showed mercy to the lost kitten." },
    "ar": { "meaning": "...", "example": "..." }
  }
}
```
- **`id` is permanent.** Progress and bindings refer to it. Changing an id means a different item. Charset: Unicode letters, digits, hyphen, underscore — **no dots, no spaces**. Lowercase ascii recommended.
- `term`: displayed word (may include diacritics). `forms`: other written forms that should link to this item.
- `group`, `level`: optional (quiz distractors, difficulty).
- `explain`: per language `meaning` (simple words) and optional `example`.
- Images and audio are NOT inside items; they are linked by bindings (below).

## texts/<id>.json — source text (verbatim, immutable in the app)
```json
{
  "id": "sample-text",
  "title": { "en": "A short sample" },
  "ref": "optional reference label",
  "segments": [ { "id": "1", "ref": "1", "text": "The cat sat on the mat." } ]
}
```
- `text` is authoritative. The app displays it exactly as stored. It never edits, normalizes, re-spaces or re-orders it. In the MVP, source text is not editable in any pack; only annotations are.
- Tokens are NOT stored in texts. The reader splits `text` at runtime (see "Reader linking").
- Every supported field (`id`, `title`, `ref`, segment `id/ref/text`) must survive import and export unchanged (round-trip test).

## annotations/<textId>.json — editable layer
```json
[
  { "segment": "1", "start": 4, "end": 7, "text": "cat", "item": "cat" },
  { "segment": "1", "start": 18, "end": 21, "text": "mat", "item": "mat",
    "override": { "explain": { "en": { "meaning": "A small rug." } } } }
]
```
- `start`/`end` are UTF-16 code-unit offsets into the segment `text` (end exclusive). `text` is optional, but if present it must equal the slice (validation error otherwise).
- Spans must be inside the text, ordered, and must not overlap within a segment.
- `item` links this exact occurrence to an item. `override` replaces the explanation for this occurrence only.
- Teacher actions in the reader write here and to items (see Reader linking).

## bindings.json — explicit asset bindings
```json
[
  { "path": "images/mercy.png", "item": "mercy", "role": "image", "order": 1, "credit": "Me", "license": "CC0-1.0" },
  { "path": "audio/mercy.m4a", "item": "mercy", "role": "pronunciation" },
  { "path": "audio/mercy.explain.webm", "item": "mercy", "role": "explanation" },
  { "path": "puzzles/garden.jpg", "role": "puzzle" }
]
```
- Roles: `image`, `pronunciation`, `explanation`, `puzzle` (`puzzle` has no item).
- `credit` and `license` are optional per asset; if absent the pack's license applies. This is how mixed-license packs stay honest.
- **Export always writes every binding.** On import, files listed in bindings.json use it; only files NOT listed fall back to filename inference.
- Assets belong to exactly one pack in the MVP (no sharing across packs).

## Filename inference (only for files not in bindings.json)
Stem = filename up to the FIRST dot; the rest of the name is the role/order part. Item ids cannot contain dots, so this is unambiguous.
| File | Meaning |
|---|---|
| `images/mercy.png` | image of item `mercy` |
| `images/mercy.2.png`, `mercy.3.png` | extra images, in order |
| `audio/mercy.mp3` | pronunciation |
| `audio/mercy.explain.mp3` | teacher explanation |
| `puzzles/anything.jpg` | puzzle image |
An item named `card_2` and an item named `card` never collide: `card_2.png` is image of `card_2`; `card.2.png` is the second image of `card`.

## Text normalization (matching only, never for display)
1. Unicode NFC. 2. Remove Arabic diacritics and Quranic marks (U+064B-U+065F, U+0670, U+06D6-U+06ED) and tatweel (U+0640). 3. Unify alef forms (أ إ آ ٱ -> ا). 4. Lowercase Latin; trim; collapse spaces/underscores/hyphens to one hyphen.
Not unified by default: ى/ي, ة/ه.

## Asset matching order (per stem)
exact id -> normalized id -> normalized term -> normalized `forms`. Result: `matched`, `ambiguous`, `unmatched`. Ambiguous and unmatched go to the teacher's drag-to-match tray. Never silently guess.

## Reader linking (runtime)
1. Split segment text on whitespace into tokens, keeping exact offsets. Tokens that consist only of Quranic/pause marks or punctuation attach to the previous token.
2. Explicit annotation for the span wins.
3. Otherwise compare the token, stripped of leading/trailing punctuation and normalized, to item `term` and `forms` (normalized). Exactly one match links; zero matches stay unlinked; **two or more matches stay unlinked and are reported** as a collision.
4. **Teacher adds content to an unlinked word:** the app creates a new item (id from a slug of the normalized token, suffix on collision) with that term and the explanation. Because linking is by term/forms, ALL occurrences of that word link automatically. An annotation is written for the tapped occurrence. "Only this occurrence" writes an `override` instead.
5. Editing an item's explanation changes every linked occurrence; editing an `override` changes one.

## Audio formats
Recordings are stored exactly as recorded (never relabelled). Export extension comes from the MIME type:
| MIME | Extension |
|---|---|
| audio/webm (opus) | .webm |
| audio/mp4 | .m4a |
| audio/ogg | .ogg |
| audio/mpeg | .mp3 |
| audio/wav | .wav |
Imported audio is accepted only for these pairs. Playback support differs by browser; if a file cannot play, show a clear message (do not crash).

## Import safety
Archive and folder imports are bounded and validated BEFORE anything is written:
- max 2000 entries; max 250 MB total uncompressed (count actual bytes read, not just headers); max 5 MB per image, 10 MB per audio;
- reject absolute paths, `..`, backslashes, nested archives, entries outside the known folders, and duplicate paths (compared case-insensitively after NFC);
- validate everything first; write in ONE database transaction; on any failure nothing changes and the user gets a readable report.

## Re-import of an existing pack id
Ask the user, with these options:
- **Import as copy** (default): new id `<id>-2` (and so on); nothing existing is touched.
- **Replace:** warn that teacher edits and recordings in the old pack are lost (offer a backup export first). Progress rows are kept for item ids that still exist.
- (Merge is post-MVP.)

## Validation errors
List readable errors (file, field, problem): duplicate ids, unknown item in annotation or binding, bad span, unsupported schemaVersion, missing required field, size limits. One bad file must not hide the others.

## Whole-app backup
`fahm-backup.zip` containing `backup.json` and `packs/<packId>.zip` (one per pack).
```json
{ "backupVersion": 1, "appVersion": "0.1.0", "createdAt": "ISO-8601",
  "settings": {}, "profiles": [], "progress": [], "srsVersion": 1 }
```
Restore: check `backupVersion` is supported, validate every pack, stage in memory, ask for confirmation ("replaces everything"), then replace in one transaction. Never restore partially.

## Licensing
Pack content has its own license (`license`, `source`, optional per-asset `license`/`credit`), separate from the MIT code license.
