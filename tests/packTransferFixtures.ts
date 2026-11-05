import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';

/** Only the existing invented English fixture; never religious source text. */
export async function fixtureArchive(prefix = '', backslashes = false) {
  const zip = new JSZip();
  const root = join(import.meta.dirname, 'fixtures/en-vocab');
  const add = (directory: string, relative = '') => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = relative + entry.name;
      if (entry.isDirectory()) add(join(directory, entry.name), `${path}/`);
      else zip.file((prefix + path).replaceAll('/', backslashes ? '\\' : '/'),
        new Uint8Array(readFileSync(join(directory, entry.name))), { createFolders: false });
    }
  };
  add(root);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
