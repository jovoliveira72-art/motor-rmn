// Uso: node scripts/terminologia-2.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const subs = [
  ['diretamente colado', 'diretamente ligado'],
  ['colado no oxigênio', 'ligado ao oxigênio'],
  ['colado em oxigênio', 'ligado ao oxigênio'],
  ['H colado', 'H diretamente ligado'],
  ['Singleto', 'Simpleto'],
  ['singleto', 'simpleto']
];

const arquivos = ['data/blocks.json', 'data/guided.json', 'data/solo.json', 'data/glossary.json', 'index.html'];

for (const rel of arquivos) {
  const p = join(root, rel);
  let s = readFileSync(p, 'utf8');
  let total = 0;
  for (const [a, b] of subs) {
    const n = s.split(a).length - 1;
    if (n > 0) { s = s.split(a).join(b); total += n; }
  }
  if (rel.endsWith('.json')) JSON.parse(s);
  writeFileSync(p, s);
  console.log(`${rel}: ${total} substituição(ões)`);
}
