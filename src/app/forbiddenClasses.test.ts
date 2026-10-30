import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_CLASS_PATTERNS = [
  /\bml-[^\s"'`]+/g,
  /\bmr-[^\s"'`]+/g,
  /\bpl-[^\s"'`]+/g,
  /\bpr-[^\s"'`]+/g,
  /\bleft-[^\s"'`]+/g,
  /\bright-[^\s"'`]+/g,
  /\btext-left\b/g,
  /\btext-right\b/g,
  /\brounded-l\b/g,
  /\brounded-l-[^\s"'`]+/g,
  /\brounded-r\b/g,
  /\brounded-r-[^\s"'`]+/g,
  /\bborder-l\b/g,
  /\bborder-l-[^\s"'`]+/g,
  /\bborder-r\b/g,
  /\bborder-r-[^\s"'`]+/g,
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (/\.(tsx?|css|html)$/.test(file)) {
      // Do not scan the test file itself which declares the forbidden list
      if (!file.includes('forbiddenClasses.test')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

describe('RTL / logical CSS compliance', () => {
  it('forbids non-logical physical directional classes in src/', () => {
    const srcDir = path.resolve(__dirname, '..');
    const files = scanDirectory(srcDir);

    const violations: { file: string; line: number; match: string }[] = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);

      lines.forEach((lineText, lineIdx) => {
        // Ignore single-line comments mentioning patterns
        const strippedLine = lineText.replace(/\/\/.*$/, '');
        for (const pattern of FORBIDDEN_CLASS_PATTERNS) {
          const match = strippedLine.match(pattern);
          if (match) {
            violations.push({
              file: path.relative(srcDir, filePath),
              line: lineIdx + 1,
              match: match[0],
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
