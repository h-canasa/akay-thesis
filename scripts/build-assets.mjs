import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'asset-src');
const output = path.join(root, 'public');

fs.mkdirSync(output, { recursive: true });

function writeFromChunks(chunks, filename) {
  const b64 = chunks
    .map((name) => fs.readFileSync(path.join(source, name), 'utf8').trim())
    .join('');
  fs.writeFileSync(path.join(output, filename), Buffer.from(b64, 'base64'));
}

writeFromChunks(
  ['header.00.b64', 'header.01.b64', 'header.02.b64'],
  'akay-header-art.webp',
);
writeFromChunks(['logo-mark.b64'], 'akay-mark.webp');

console.log('Akay static assets generated.');
