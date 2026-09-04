// Uso: node scripts/renomear-termos.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');

const subsBlocks = [
  // pico → sinal (só onde significa a ressonância)
  ['cada frequência vira um pico, e a área do pico conta os núcleos', 'cada frequência vira um sinal, e a área do sinal conta os núcleos'],
  ['cada frequência de precessão vira um pico no espectro', 'cada frequência de precessão vira um sinal no espectro'],
  ['e ela decide o endereço de cada pico', 'e ela decide o endereço de cada sinal'],
  ['A <strong>regra n+1</strong> transforma picos em contagem.', 'A <strong>regra n+1</strong> prevê quantos picos cada sinal terá.'],
  ['a <strong>área</strong> de cada pico conta quantos H moram nele', 'a <strong>área</strong> de cada sinal conta quantos H moram nele'],
  ['Pico anormalmente largo', 'Sinal anormalmente largo'],
  ['cada pico com dono', 'cada sinal com dono'],
  ['Cada pico tem dono.', 'Cada sinal tem dono.'],
  ['todo pico com dono', 'todo sinal com dono'],
  ['Nem todo pico é da sua amostra', 'Nem todo sinal é da sua amostra'],
  ['Pico largo e variável? Desconfie', 'Sinal largo e variável? Desconfie'],
  // efeito teto → efeito telha
  ['Efeito teto (roof)', 'Efeito telha (roof)'],
  ['(efeito teto)', '(efeito telha)'],
  ['Lembra do efeito teto do nível 5?', 'Lembra do efeito telha do nível 5?']
];

const subsHtml = [
  ['cada frequência vira um pico. Pronto: o espectro.', 'cada frequência vira um sinal. Pronto: o espectro.']
];

function aplicar(arquivo, subs) {
  let s = readFileSync(arquivo, 'utf8');
  for (const [a, b] of subs) {
    if (!s.includes(a)) {
      console.error(`[${arquivo}] não encontrado (já aplicado?): "${a.slice(0, 60)}"`);
      process.exit(1);
    }
    s = s.split(a).join(b);
  }
  if (arquivo.endsWith('.json')) JSON.parse(s);
  writeFileSync(arquivo, s);
  console.log(`${arquivo} ok`);
}

aplicar(join(dataDir, 'blocks.json'), subsBlocks);
aplicar(join(root, 'index.html'), subsHtml);
