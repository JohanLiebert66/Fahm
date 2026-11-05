// Analysis only. Source text never enters output, diagnostics, or the repository.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
const EXPECTED_SHA = '6933E133DD56DB778C801BF738848454E43648105A151E8D84D86A7CAE39EC5F';
const EXPECTED_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const UCD_URL = 'https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt';
const METADATA_URL = 'https://tanzil.net/res/text/metadata/quran-data.xml';
const sha = (data) => createHash('sha256').update(data).digest('hex').toUpperCase();
const cp = (c) => `U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
const seq = (s) => [...s].map(cp).join(' ') || '(empty)';
const fail = (message) => { process.stderr.write(`Inventory stopped: ${message}\n`); process.exit(1); };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function main() {
  const args = process.argv.slice(2);
  if (!args[0]) return fail('provide the source file path and optionally an offline UnicodeData.txt path.');
  const bytes = readFileSync(args[0]);
  const hash = sha(bytes);
  if (hash !== EXPECTED_SHA) return fail(`SHA-256 mismatch; expected ${EXPECTED_SHA}; actual ${hash}.`);
  const bom = bytes.subarray(0, 3).equals(Buffer.from([0xEF, 0xBB, 0xBF]));
  const decoded = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  const text = bom ? decoded.slice(1) : decoded;
  const lines = text.split(/\r\n|\n|\r/u);
  if (/(?:\r\n|\n|\r)$/u.test(text)) lines.pop();
  const records = [], blanks = [], notice = [], invalid = [];
  lines.forEach((line, i) => {
    const m = /^(\d+)\|(\d+)\|([^|]+)$/u.exec(line);
    if (m) records.push({ sura: Number(m[1]), aya: Number(m[2]), text: m[3], line: i + 1 });
    else if (/^\s*$/u.test(line)) blanks.push(i + 1);
    else if (/^\s*#/u.test(line)) notice.push(i + 1);
    else invalid.push({ line: i + 1, points: seq(line) });
  });
  if (records.length !== 6236) return fail(`verse-line count ${records.length}; expected 6236.`);
  if (lines.length !== 6266) return fail(`physical line count ${lines.length}; expected 6266.`);
  const counts = EXPECTED_COUNTS.map((expected, i) => {
    const found = records.filter((r) => r.sura === i + 1), ids = new Set(found.map((r) => r.aya));
    return { sura: i + 1, expected, actual: found.length, ok: found.length === expected && ids.size === expected && found.every((r, n) => r.aya === n + 1) };
  });
  if (counts.some((r) => !r.ok) || records.some((r) => r.sura < 1 || r.sura > 114)) return fail('per-sura counts or ordered verse identifiers failed.');
  // Prefer the installed runner, without loading Vitest or replicating application rules.
  const bin = resolve(root, 'node_modules/.bin/vite-node');
  if (!process.env.FAHM_INVENTORY_RUNNER) {
    const runner = existsSync(bin) ? 'vite-node' : 'Node --experimental-strip-types';
    if (!existsSync(bin) && !process.allowedNodeEnvironmentFlags.has('--experimental-strip-types')) return fail('vite-node and native TypeScript stripping unavailable; no rules were replicated.');
    const launch = existsSync(bin) ? [resolve(root, 'node_modules/vite-node/vite-node.mjs'), '--script'] : ['--experimental-strip-types'];
    const child = spawnSync(process.execPath, [...launch, fileURLToPath(import.meta.url), ...args], {
      cwd: root, env: { ...process.env, FAHM_INVENTORY_RUNNER: runner }, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    });
    if (child.status !== 0 || !child.stdout.startsWith('# Tanzil character inventory\n')) return fail('application-runner analysis failed; child diagnostics suppressed to protect source text.');
    process.stdout.write(child.stdout); return;
  }
  if (process.env.FAHM_INVENTORY_RUNNER === 'Node --experimental-strip-types') {
    const { registerHooks } = await import('node:module');
    const tokenizerURL = pathToFileURL(resolve(root, 'src/core/reader/tokenize.ts')).href;
    // Native Node needs the explicit extension for the tokenizer's existing import.
    registerHooks({ resolve(specifier, context, next) {
      return next(specifier === './spans' && context.parentURL === tokenizerURL ? './spans.ts' : specifier, context);
    } });
  }
  const { normalizeText } = await import(pathToFileURL(resolve(root, 'src/core/binding/normalizeText.ts')).href);
  const { tokenize } = await import(pathToFileURL(resolve(root, 'src/core/reader/tokenize.ts')).href);
  const ucdText = args[1] ? readFileSync(args[1], 'utf8') : await (async () => {
    const response = await fetch(UCD_URL); if (!response.ok) return fail('Unicode database download failed.'); return response.text();
  })();
  const ucd = new Map(ucdText.split(/\r?\n/u).filter(Boolean).map((line) => {
    const [hex, name, category] = line.split(';'); return [Number.parseInt(hex, 16), { name, category }];
  }));
  const info = (c) => { const row = ucd.get(c.codePointAt(0)); if (!row || row.name.startsWith('<')) fail(`missing Unicode name for ${cp(c)}.`); return row; };
  const group = (c) => {
    const cat = info(c).category;
    if (/^Z/u.test(cat) || /[\s\p{White_Space}]/u.test(c)) return 'Spaces';
    if (cat === 'Cf') return 'Format/invisible (Cf)';
    if (/^M/u.test(cat) && /\p{Script_Extensions=Arabic}/u.test(c)) return 'Arabic marks (Mn/Me/Mc)';
    if (/^L/u.test(cat) && /\p{Script_Extensions=Arabic}/u.test(c)) return 'Arabic letters';
    if (cat === 'Nd') return 'Digits';
    return /^[PS]/u.test(cat) ? 'Punctuation/symbols' : 'Anything else';
  };
  const effect = (c) => {
    const out = normalizeText(c);
    if (/[\s\p{White_Space}_-]/u.test(c)) return `separator: between letters -> ${seq(normalizeText(`a${c}b`).slice(1, -1))}; isolated -> (empty)`;
    return !out ? 'stripped' : out === c ? 'unchanged' : `unified -> ${seq(out)}`;
  };
  const isEdge = (c) => /[\p{M}\p{P}\p{S}\p{Cf}\u06D6-\u06ED]/u.test(c);
  const edgeRun = /^[\s\p{White_Space}\p{M}\p{P}\p{S}\p{Cf}\u06D6-\u06ED]+|[\s\p{White_Space}\p{M}\p{P}\p{S}\p{Cf}\u06D6-\u06ED]+$/gu;
  const out = ['# Tanzil character inventory', '', 'Task 011a; analysis only. No source text, translations, or notice quotations are reproduced.',
    `Export options (Hazem): Uthmani; pause marks and sajdah signs on; nothing else; sura|aya|text.`,
    `Normalization/tokenization: real application functions via ${process.env.FAHM_INVENTORY_RUNNER || 'Node native TypeScript stripping'}; no replicated step table; no Vitest.`,
    `Unicode names/categories: Unicode 17.0.0 UnicodeData.txt (${UCD_URL}); SHA-256 ${sha(ucdText)}. Node Unicode ${process.versions.unicode}.`,
    `Expected verse counts: numeric sura/ayas metadata from ${METADATA_URL}; all 114 checked for counts, unique IDs, and consecutive ordered IDs.`,
    `Rule fingerprints: normalizeText.ts ${sha(readFileSync(resolve(root, 'src/core/binding/normalizeText.ts')))}; spans.ts ${sha(readFileSync(resolve(root, 'src/core/reader/spans.ts')))}; tokenize.ts ${sha(readFileSync(resolve(root, 'src/core/reader/tokenize.ts')))}.`,
    'Reproduce: node scripts/inventory-tanzil.mjs <external-source-path> [external-UnicodeData.txt-path]. Without the optional database path, the analysis CLI downloads UnicodeData once in memory; the app is not involved.',
    'D010/D016/D020: source bytes are read-only and remain external; normalization is evaluated only for matching. This inventory does not authorize bundling or replace the pending license review.',
    'Inventory covers only verse text fields, not numeric identifiers, delimiters, line endings, or the copyright notice. First references use source-file order.', ''];
  const inventories = [], edgeInventories = [];
  for (const [label, scope] of [['Whole file', records], ['Sura 113 only', records.filter((r) => r.sura === 113)]]) {
    const whole = scope === records, inventory = new Map(), edges = new Map();
    let contextual = 0, tokenCount = 0;
    for (const r of scope) {
      for (const c of r.text) { const row = inventory.get(c) || { count: 0, first: `${r.sura}:${r.aya}` }; row.count++; inventory.set(c, row); }
      for (const raw of r.text.match(/[^\s\p{White_Space}]+/gu) || []) { tokenCount++; if (normalizeText(raw) !== [...raw].map(normalizeText).join('')) contextual++; }
      for (const token of tokenize(r.text)) {
        const indices = new Set();
        for (const run of token.text.matchAll(edgeRun)) for (const c of run[0].matchAll(/./gu)) if (isEdge(c[0])) indices.add(run.index + c.index);
        for (const index of indices) {
          const c = String.fromCodePoint(token.text.codePointAt(index)), row = edges.get(c) || { kept: 0, trimmed: 0, first: `${r.sura}:${r.aya}` };
          row[token.start + index >= token.coreStart && token.start + index < token.coreEnd ? 'kept' : 'trimmed']++; edges.set(c, row);
        }
      }
    }
    inventories.push(inventory); edgeInventories.push(edges);
    const endings = { CRLF: (text.match(/\r\n/gu) || []).length, LF: (text.match(/(?<!\r)\n/gu) || []).length, CR: (text.match(/\r(?!\n)/gu) || []).length };
    out.push(`## ${label}`, '', '### File facts', `- Source SHA-256: ${hash}; expected hash PASS. Source bytes: ${bytes.length}.`,
      `- Physical source-file lines: ${lines.length}; scoped verse lines: ${scope.length}; scoped suras: ${[...new Set(scope.map((r) => r.sura))].join(', ')}.`,
      `- Source BOM: ${bom ? 'present (UTF-8)' : 'absent'}; source line endings: ${JSON.stringify(endings)}; final line terminator: ${/(?:\r\n|\n|\r)$/u.test(text)}.`,
      `- Scoped notice/comment lines: ${whole ? notice.length : 0}; scoped blank lines: ${whole ? blanks.length : 0}; scoped unexpected non-record lines: ${whole ? invalid.length : 0}.`,
      `- Source copyright notice present: ${notice.some((n) => /copyright/iu.test(lines[n - 1])) && notice.some((n) => /tanzil/iu.test(lines[n - 1]))}; notice/comment line numbers: ${whole ? notice.join(', ') : 'none in scope'}.`,
      `- Blank line numbers: ${whole ? blanks.join(', ') : 'none in scope'}; scoped source verse line numbers: ${whole ? 'see per-sura counts below' : scope.map((r) => r.line).join(', ')}.`,
      '- Every non-record line is accounted for above; unexpected lines are represented only as line numbers and code points.', ...((whole ? invalid : []).map((r) => `- Unexpected line ${r.line}: ${r.points}`)),
      `- Verse-count/identifier checks: PASS; sura 113 = 5. Text scalars: ${[...inventory.values()].reduce((n, r) => n + r.count, 0)}; distinct scalars: ${inventory.size}.`, '',
      '| Sura | Expected verses | Actual verses | IDs/count |', '| --- | --- | --- | --- |', ...(whole ? counts : counts.filter((r) => r.sura === 113)).map((r) => `| ${r.sura} | ${r.expected} | ${r.actual} | PASS |`), '', '### Code-point inventory and D034/D035 comparison',
      'Effects below evaluate each scalar through real normalizeText; NFC is context-sensitive. Space behavior is tested between synthetic Latin letters as well as alone.',
      `Whitespace-delimited token occurrences: ${tokenCount}; occurrences where whole-token normalization differs from concatenated scalar normalization: ${contextual}. Whole-token collision analysis below uses the real function, never the scalar table.`, '');
    const sorted = [...inventory.keys()].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
    for (const heading of ['Arabic letters', 'Arabic marks (Mn/Me/Mc)', 'Format/invisible (Cf)', 'Digits', 'Punctuation/symbols', 'Spaces', 'Anything else']) {
      out.push(`#### ${heading}`, '', '| Code point | Unicode name | Category | Count | First sura:aya | Normalization |', '| --- | --- | --- | --- | --- | --- |', ...sorted.filter((c) => group(c) === heading).map((c) => `| ${cp(c)} | ${info(c).name} | ${info(c).category} | ${inventory.get(c).count} | ${inventory.get(c).first} | ${effect(c)} |`), '');
    }
    const retainedMarks = sorted.filter((c) => /^M/u.test(info(c).category) && normalizeText(c));
    const retainedFormats = sorted.filter((c) => info(c).category === 'Cf' && normalizeText(c));
    out.push(`Retained marks NOT stripped: ${retainedMarks.map(cp).join(', ') || 'none'}. Invisible Cf not covered by D035: ${retainedFormats.map(cp).join(', ') || 'none'}.`,
      `Letter/tatweel changes that can merge distinct spellings (matching only): ${sorted.filter((c) => /^L/u.test(info(c).category) && normalizeText(c) !== c).map((c) => `${cp(c)} -> ${seq(normalizeText(c))}`).join('; ') || 'none'}. Diacritic removal also deliberately loses distinctions; normalized keys are not proof of word identity.`,
      ...[[0x0610, 0x061A], [0x08D3, 0x08FF], [0x0670, 0x0670], [0x06D6, 0x06ED], [0x06DD, 0x06DD], [0x06DE, 0x06DE], [0x06E9, 0x06E9]].map(([a, b]) => `- Watch ${seq(String.fromCodePoint(a))}${a === b ? '' : `-${seq(String.fromCodePoint(b))}`}: ${sorted.filter((c) => c.codePointAt(0) >= a && c.codePointAt(0) <= b).map((c) => `${cp(c)} (${effect(c)})`).join('; ') || 'absent'}.`),
      '', '### D036 edge/core-span risk', 'Actual tokenize/coreSpan offsets determine retention; no reconstructed spans. Edge runs include attached marks, standalone signs and exposed whitespace; only mark/sign/symbol/format scalars are counted. Kept attached Mn/Mc marks are intentional, not a trimming failure.',
      '| Edge code point | Category | Kept in core | Trimmed from core | First sura:aya | Assessment |', '| --- | --- | --- | --- | --- | --- |',
      ...[...edges].sort(([a], [b]) => a.codePointAt(0) - b.codePointAt(0)).map(([c, r]) => `| ${cp(c)} | ${info(c).category} | ${r.kept} | ${r.trimmed} | ${r.first} | ${r.kept ? (/^M[cn]$/u.test(info(c).category) ? 'attached mark retained as D036 requires' : info(c).category === 'Lm' ? 'modifier letter retained by D036; stripped for matching' : 'retained; review sign/format semantics') : 'handled: trimmed'} |`), '');
  }
  const distinct = new Map(), collisions = new Map();
  for (const r of records.filter((r) => r.sura === 113)) for (const token of r.text.match(/[^\s\p{White_Space}]+/gu) || []) distinct.set(token, (distinct.get(token) || 0) + 1);
  for (const [raw, count] of distinct) { const normalized = normalizeText(raw); if (normalized) { const group = collisions.get(normalized) || []; group.push({ raw, count }); collisions.set(normalized, group); } }
  const groups = [...collisions].filter(([, members]) => members.length > 1), members = groups.flatMap(([, rows]) => rows);
  out.push('## Sura 113 normalization collisions', 'Tokens are exact whitespace-delimited source sequences, before punctuation trimming. Distinct means different original code-point sequences; empty normalized keys are excluded as no match.',
    `- Token occurrences: ${[...distinct.values()].reduce((a, b) => a + b, 0)}; distinct source tokens: ${distinct.size}; nonempty normalized keys: ${collisions.size}.`,
    `- Collision groups: ${groups.length}; distinct source tokens participating: ${members.length}; excess variants: ${members.length - groups.length}; participating occurrences: ${members.reduce((n, r) => n + r.count, 0)}; distinct empty-normalized tokens: ${[...distinct.keys()].filter((s) => !normalizeText(s)).length}.`,
    '| Normalized code-point sequence | Original code-point sequence | Occurrences |', '| --- | --- | --- |', ...groups.flatMap(([key, rows]) => rows.map((r) => `| ${seq(key)} | ${seq(r.raw)} | ${r.count} |`)), '');
  const risky = [...edgeInventories[0]].filter(([c, r]) => r.kept && !/^(M[cn]|Lm)$/u.test(info(c).category));
  const uncovered = [...inventories[0].keys()].filter((c) => /^[MC]/u.test(info(c).category) && normalizeText(c));
  out.push('## Recommendation', ...(risky.length || uncovered.length || invalid.length ? [
    'Review before 011b; no behavior changed by this task.', ...risky.map(([c]) => `- Core trimming: review ${cp(c)} (${info(c).name}); retained at a source token edge.`),
    ...uncovered.map((c) => `- Normalization: review ${cp(c)} (${info(c).name}); retained mark/format character.`),
    ...(invalid.length ? ['- Resolve unexpected non-record lines before pack building.'] : []),
  ] : ['**no change needed** to normalization or core trimming for the observed corpus. No code points/ranges need adding.',
    'Normalization: all observed marks, the sajdah symbol, tatweel and small modifier letters are already covered; there are no observed Cf characters or retained Mn/Me/Mc marks. Do not broaden U+0610-U+061A or U+08D3-U+08FF on evidence from this export: both ranges are absent and D034 explicitly preserves the former.',
    'Core spans: observed edge pause signs U+06D6-U+06DC and the sajdah symbol U+06E9 trim correctly. Attached Mn/Mc marks remain in the core as required by D036. U+06E5/U+06E6 are Lm letters: their retention is consistent with current D036 letter handling, not an unhandled edge punctuation case; normalization already strips them. Neither occurs in sura 113. Changing that policy is not required for 011b.',
    'Proceed to 011b pack build, subject to existing source/license and browser font-rendering prerequisites. This code-point analysis cannot prove correct visual shaping, mark placement, or font coverage; verify those in a real browser. Absence in this export does not prove support for other exports. Keep matching normalization separate from verbatim display and preserve the intentional alef/diacritic collisions.']), '');
  const report = out.join('\n');
  if (/[^\x00-\x7F]/u.test(report)) return fail('report safety check failed: non-ASCII output.');
  process.stdout.write(report);
}
main().catch(() => fail('input, Unicode metadata, or application import failed; raw diagnostics suppressed to protect source text.'));
