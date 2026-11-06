# Sample packs

## Al-Falaq (113)

`al-falaq/` is an importable folder containing one text with five verse segments,
no items and no annotations. Titles use Latin script; content language is `ar`
and direction is `rtl`. Teachers can add explanations after importing.

Source: Tanzil Project, https://tanzil.net. Text license: Creative Commons
Attribution 3.0; verbatim distribution only. The complete notice from
`docs/THIRD_PARTY_NOTICES.md` is in `pack.json.description`, so the current
import/export path preserves it. `al-falaq.NOTICE.txt` is a repo-reader copy.
Do not put sidecars inside the importable folder: its importer rejects them.
Whole-app backup is not implemented; a backup round-trip has not been tested.

### Rebuild

Use the verified external Tanzil Uthmani file supplied by Hazem:

```sh
node scripts/build-pack-al-falaq.mjs "<external-source-path>"
```

The script requires the exact source SHA-256 recorded in
`al-falaq.integrity.json` and 6,236 verse records. It extracts sura 113 without
trimming, normalization, replacement or wrapping, then re-reads every pack file
and compares each decoded verse's UTF-8 bytes with its original source slice.
JSON is UTF-8 without BOM, with a trailing LF. No verse text is logged.

Optional ZIP output must be outside this repository, in an existing directory:

```sh
node scripts/build-pack-al-falaq.mjs "<external-source-path>" --zip "<external-output-path>"
```

The ZIP has fixed timestamps (1980-01-01 00:00:00), sorted entries, no sidecars,
and no dependencies beyond Node built-ins. Existing ZIP files are never
overwritten. No ZIP belongs in the repository; folder import is the default.

### Verify without the source file

```sh
npm run test -- src/storage/alFalaqPack.test.ts
npm run check
```

The integrity algorithm is SHA-256 of the five verse texts in verse order,
joined with exactly one LF byte (`0A`) between verses, no trailing LF, UTF-8
without BOM. The sidecar records that hash, verse count and source-file hash;
it contains no verse text. Tests compare text hashes, not printed text, and
prove folder import, database reopen, export and re-import preserve each verse
and the complete notice. Rebuilding from the verified source twice must leave
all three pack files and both generated sidecars byte-identical.

`packs/` is excluded from Prettier. Existing `.gitattributes` rule
`* text=auto eol=lf` covers these JSON files and forces LF checkout even with
`core.autocrlf=true`. Without an override, autocrlf can change physical file
line endings; it must never change JSON string content. Do not normalize or
format the verse text. Re-run integrity checks after any tooling change.

### Browser check (Hazem, D017)

Import the **`al-falaq/` folder**, not its parent, at `/teacher/import`; open it
at `/read`. Visit all five verses and check Cairo's shaping, diacritics, mark
placement and legibility against the verified source. This font approval needs
a real browser; automated hashes and jsdom cannot establish correct rendering.
