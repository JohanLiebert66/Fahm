import { transferFailure } from './types';

/** Inspect raw records before JSZip sanitizes or overwrites their names. No inflation. */
export function zipDirectory(bytes: Uint8Array, maxEntries = 2000, maxRawEntries = 10000): string[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = (): never => { throw transferFailure('packImport.error.archive'); };
  const u16 = (offset: number) => view.getUint16(offset, true);
  const u32 = (offset: number) => view.getUint32(offset, true);
  let end = bytes.length - 22;
  const earliest = Math.max(0, end - 65535);
  while (end >= earliest) {
    if (u32(end) === 0x06054b50 && end + 22 + u16(end + 20) === bytes.length) break;
    end--;
  }
  if (end < earliest) invalid();
  if (u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)
    || u16(end + 10) === 0xffff) invalid();
  const start = u32(end + 16);
  if (start === 0xffffffff || u32(end + 12) === 0xffffffff
    || start + u32(end + 12) !== end) invalid();
  const names: string[] = [];
  const seen = new Set<string>();
  let offset = start;
  let rawEntries = 0;
  while (offset < end) {
    if (offset + 46 > end || u32(offset) !== 0x02014b50) invalid();
    if (++rawEntries > maxRawEntries) throw transferFailure('packImport.error.rawEntries');
    const flags = u16(offset + 8);
    const method = u16(offset + 10);
    const nameLength = u16(offset + 28);
    const extraLength = u16(offset + 30);
    const next = offset + 46 + nameLength + extraLength + u16(offset + 32);
    if (next > end || flags & 0x2041 || (method !== 0 && method !== 8)
      || u16(offset + 34) || u32(offset + 20) === 0xffffffff
      || u32(offset + 24) === 0xffffffff) invalid();
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + nameLength);
    let name: string;
    try { name = new TextDecoder('utf-8', { fatal: true }).decode(nameBytes); }
    catch { return invalid(); }

    // Reject ZIP64 extras even if their sentinel values were omitted.
    let extra = offset + 46 + nameLength;
    const extraEnd = extra + extraLength;
    while (extra < extraEnd) {
      if (extra + 4 > extraEnd || u16(extra) === 1) invalid();
      extra += 4 + u16(extra + 2);
    }
    if (extra !== extraEnd) invalid();
    const local = u32(offset + 42);
    if (local + 30 > start || u32(local) !== 0x04034b50
      || u16(local + 6) !== flags || u16(local + 8) !== method) invalid();
    const localNameLength = u16(local + 26);
    const data = local + 30 + localNameLength + u16(local + 28);
    if (data + u32(offset + 20) > start) invalid();
    let localName: string;
    try { localName = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(local + 30, local + 30 + localNameLength)); }
    catch { return invalid(); }
    if (localName.replaceAll('\\', '/').normalize('NFC') !== name.replaceAll('\\', '/').normalize('NFC')) invalid();
    const trailingSlash = name.replaceAll('\\', '/').endsWith('/');
    const directory = trailingSlash && u32(offset + 20) === 0 && u32(offset + 24) === 0
      && u32(local + 18) === 0 && u32(local + 22) === 0;
    if (!directory) {
      if (trailingSlash) throw transferFailure('packImport.error.path', name);
      if (names.length >= Math.min(maxEntries, 2000)) throw transferFailure('packImport.error.entries');
      if (seen.has(name)) throw transferFailure('packImport.error.duplicate', name);
      seen.add(name);
      names.push(name);
    }
    offset = next;
  }
  if (offset !== end || rawEntries !== u16(end + 10)) invalid();
  return names;
}
