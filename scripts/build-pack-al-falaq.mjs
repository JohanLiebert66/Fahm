// Read verified source bytes only; never log source text or underlying errors.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceSha256 = '6933E133DD56DB778C801BF738848454E43648105A151E8D84D86A7CAE39EC5F';
const algorithm = 'SHA-256 of the five verse texts in verse order joined with one LF (U+000A), no trailing LF, encoded as UTF-8 without BOM.';
const hash = bytes => createHash('sha256').update(bytes).digest('hex').toUpperCase();
const stop = message => { throw Object.assign(new Error(message), { name: 'PackBuildError' }); };
const utf8 = bytes => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');

export function zipEntries(entries) {
  // ZIP STORE, UTF-8 names, DOS date 1980-01-01 00:00:00; no clock or filesystem metadata.
  const local = [], central = [];
  let offset = 0;
  for (const [path, bytes] of [...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const name = Buffer.from(path, 'utf8');
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const header = Buffer.alloc(30), directory = Buffer.alloc(46);
    header.writeUInt32LE(0x04034B50, 0); header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x800, 6); header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(bytes.length, 18);
    header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(name.length, 26);
    directory.writeUInt32LE(0x02014B50, 0); directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6); directory.writeUInt16LE(0x800, 8);
    directory.writeUInt16LE(33, 14); directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(bytes.length, 20); directory.writeUInt32LE(bytes.length, 24);
    directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42);
    local.push(header, name, bytes); central.push(directory, name);
    offset += header.length + name.length + bytes.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054B50, 0); end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

export function extractNotice(bytes) {
  const lines = utf8(bytes).split(/\r\n|\r|\n/u);
  const comments = lines.flatMap((line, index) => line.startsWith('#') ? [index] : []);
  if (!comments.length) stop('Missing source comment lines.');
  let seenVerse = false;
  lines.forEach((line, index) => {
    if (line.startsWith('#') || line === '') return;
    if (index > comments[0] && index < comments.at(-1)) {
      stop(`Unexpected non-comment line inside notice block at line ${index + 1}.`);
    }
    if (!seenVerse && !/^[1-9]\d*\|[1-9]\d*\|.+$/u.test(line)) {
      stop(`Unexpected non-comment line before first verse at line ${index + 1}.`);
    }
    seenVerse = true;
  });
  const notice = lines.slice(comments[0], comments.at(-1) + 1)
    .filter(line => line.startsWith('#') || line === '')
    .map(line => line.startsWith('#') ? line.replace(/^# ?/u, '') : line).join('\n');
  return `${notice.replace(/\n*$/u, '')}\n`;
}

export function updateNoticeDocument(document, notice) {
  const block = /(^```\r?\n)[\s\S]*?(^```(?=\r?$))/gmu;
  if ([...document.matchAll(block)].length !== 1) stop('Expected exactly one fenced notice block.');
  return document.replace(block, (_match, open, close) => `${open}${notice}${close}`);
}

function sourceVerses(bytes) {
  const actual = hash(bytes);
  if (actual !== sourceSha256) stop(`Source SHA-256 mismatch; actual ${actual}.`);
  const verses = [];
  let start = 0, count = 0;
  for (let end = 0; end <= bytes.length; end++) {
    if (end < bytes.length && bytes[end] !== 10 && bytes[end] !== 13) continue;
    const line = bytes.subarray(start, end);
    const first = line.indexOf(124), second = line.indexOf(124, first + 1);
    const header = second > first && first > 0 ? line.subarray(0, second).toString('ascii') : '';
    const match = /^(\d+)\|(\d+)$/u.exec(header);
    if (match) {
      count++;
      if (match[1] === '113') {
        if (Number(match[2]) !== verses.length + 1) stop('Unexpected verse identifiers.');
        verses.push(Buffer.from(line.subarray(second + 1)));
      }
    }
    if (bytes[end] === 13 && bytes[end + 1] === 10) end++;
    start = end + 1;
  }
  if (count !== 6236 || verses.length !== 5) stop(`Unexpected verse counts: ${count}/${verses.length}.`);
  return verses;
}

function build(sourcePath, zipPath) {
  let zipFile;
  if (zipPath) {
    zipFile = resolve(realpathSync(dirname(resolve(zipPath))), basename(zipPath));
    const path = relative(realpathSync(root), zipFile);
    if (!(path.startsWith(`..${sep}`) || isAbsolute(path))) stop('ZIP output must be outside the repository.');
  }
  const source = readFileSync(sourcePath);
  const verses = sourceVerses(source);
  const notice = extractNotice(source);
  const documentPath = resolve(root, 'docs/THIRD_PARTY_NOTICES.md');
  const document = updateNoticeDocument(readFileSync(documentPath, 'utf8'), notice);
  const pack = {
    schemaVersion: 1, id: 'al-falaq', title: { en: 'Al-Falaq' }, lang: 'ar', dir: 'rtl',
    author: 'Tanzil Project', license: 'Creative Commons Attribution 3.0',
    source: 'Tanzil Project - https://tanzil.net', description: notice,
  };
  const text = {
    id: 'al-falaq', title: { en: 'Al-Falaq (113)' }, ref: '113',
    segments: verses.map((bytes, index) => ({ id: String(index + 1), ref: `113:${index + 1}`, text: utf8(bytes) })),
  };
  const integrity = {
    sha256: hash(Buffer.concat(verses.flatMap((bytes, index) => index ? [Buffer.from('\n'), bytes] : [bytes]))),
    verseCount: 5, sourceSha256, algorithm, noticeSha256: hash(Buffer.from(notice, 'utf8')),
  };
  if (integrity.sha256 !== 'AB6D6E8E968748E1B43665E2F08AF76DCDC72EBCDCA189DB822AE64C638F566F') {
    stop('Extracted verse-text SHA-256 mismatch.');
  }
  const entries = [['pack.json', json(pack)], ['items.json', json([])], ['texts/al-falaq.json', json(text)]];
  const folder = resolve(root, 'packs/al-falaq');
  mkdirSync(resolve(folder, 'texts'), { recursive: true });
  for (const [path, bytes] of entries) {
    const target = resolve(folder, path);
    if (!existsSync(target) || !readFileSync(target).equals(bytes)) writeFileSync(target, bytes);
  }
  // Re-read every JSON file and compare decoded payloads to the original byte slices.
  for (const [path, bytes] of entries) {
    const written = readFileSync(resolve(folder, path));
    if (!written.equals(bytes)) stop('Pack file read-back mismatch.');
    JSON.parse(utf8(written));
  }
  const saved = JSON.parse(utf8(readFileSync(resolve(folder, 'texts/al-falaq.json'))));
  if (saved.segments.length !== verses.length) stop('Written verse count mismatch.');
  saved.segments.forEach((segment, index) => {
    if (!Buffer.from(segment.text, 'utf8').equals(verses[index])) stop(`Written verse byte mismatch at 113:${index + 1}.`);
  });
  if (hash(Buffer.from(saved.segments.map(segment => segment.text).join('\n'), 'utf8')) !== integrity.sha256) {
    stop('Written verse-text hash mismatch.');
  }
  const generated = [
    [resolve(root, 'packs/al-falaq.NOTICE.txt'), Buffer.from(notice, 'utf8')],
    [resolve(root, 'packs/al-falaq.integrity.json'), json(integrity)],
    [documentPath, Buffer.from(document, 'utf8')],
  ];
  for (const [path, bytes] of generated) {
    writeFileSync(path, bytes);
    if (!readFileSync(path).equals(bytes)) stop('Generated notice/integrity file read-back mismatch.');
  }
  if (zipFile) {
    const readBack = entries.map(([path]) => [path, readFileSync(resolve(folder, path))]);
    writeFileSync(zipFile, zipEntries(readBack), { flag: 'wx' });
  }
  console.log(`Built 5 verses; source-byte read-back PASS; verse-text SHA-256 ${integrity.sha256}; notice SHA-256 ${integrity.noticeSha256}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1 && !(args.length === 3 && args[1] === '--zip' && args[2])) {
      stop('Usage: node scripts/build-pack-al-falaq.mjs <source-path> [--zip <external-path>]');
    }
    build(args[0], args[2]);
  } catch (error) {
    console.error(error?.name === 'PackBuildError' ? error.message : 'Build failed; underlying diagnostics suppressed to protect source text.');
    process.exitCode = 1;
  }
}
