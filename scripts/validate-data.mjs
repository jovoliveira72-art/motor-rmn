// scripts/validate-data.mjs — validador de conteúdo do Motor RMN
// Uso: node scripts/validate-data.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
let problemas = 0;
const ok = m => console.log('✓ ' + m);
const falha = m => { console.error('✗ ' + m); problemas++; };

function ler(f) {
  try {
    const d = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
    ok(`${f}: JSON válido`);
    return d;
  } catch (e) {
    falha(`${f}: JSON inválido (${e.message})`);
    return null;
  }
}

const tutorial = ler('tutorial.json');
const blocks = ler('blocks.json');
const mapping = ler('mapping.json');
const solo = ler('solo.json');
const guided = ler('guided.json');
const glossary = ler('glossary.json');

// kinds de diagrama que o index.html sabe desenhar
const KINDS = ['ppm-axis', 'splitting-tree', 'c13-axis', 'd2o', 'dept', 'shield', 'energy', 'integration', 'decouple', 'ft'];

// contagem aproximada de átomos de um SMILES (subset orgânico + colchetes)
function atomCount(smiles) {
  let n = 0, i = 0;
  const dois = ['Cl', 'Br', 'Si', 'Se'];
  const um = 'BCNOFPSIbcnops';
  while (i < smiles.length) {
    const ch = smiles[i];
    if (ch === '[') { n++; i = smiles.indexOf(']', i) + 1; continue; }
    if (dois.includes(smiles.substr(i, 2))) { n++; i += 2; continue; }
    if (um.includes(ch)) n++;
    i++;
  }
  return n;
}

function varrerStrings(v, cb, caminho = '') {
  if (typeof v === 'string') cb(v, caminho);
  else if (Array.isArray(v)) v.forEach((x, i) => varrerStrings(x, cb, `${caminho}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => varrerStrings(x, cb, `${caminho}.${k}`));
}

// tutorial ↔ blocks: mesmos níveis, sem furos nem sobras
if (tutorial && blocks) {
  const niveis = tutorial.map(t => t.level);
  const unicos = new Set(niveis);
  if (unicos.size !== niveis.length) falha('tutorial.json: níveis duplicados');
  else ok(`tutorial.json: ${niveis.length} níveis únicos`);
  const chaves = Object.keys(blocks).map(Number);
  const faltam = niveis.filter(n => !chaves.includes(n));
  const sobras = chaves.filter(n => !niveis.includes(n));
  if (faltam.length) falha(`blocks.json sem conteúdo para: ${faltam.join(', ')}`);
  if (sobras.length) falha(`blocks.json com níveis fora do tutorial: ${sobras.join(', ')}`);
  if (!faltam.length && !sobras.length) ok('blocks.json cobre exatamente os níveis do tutorial');
}

// blocos: kinds de diagrama, badges dentro do range, quizzes com 1 correta
if (blocks) {
  let antes = problemas;
  for (const [niv, lista] of Object.entries(blocks)) {
    lista.forEach((b, i) => {
      if (b.type === 'diagrama' && !KINDS.includes(b.kind)) falha(`blocks ${niv}[${i}]: diagrama "${b.kind}" não implementado`);
      if (b.type === 'exemplo' && b.badges && b.smiles) {
        const total = atomCount(b.smiles);
        b.badges.forEach(bd => (bd.atoms || []).forEach(a => {
          if (a < 0 || a >= total) falha(`blocks ${niv}[${i}]: badge "${bd.label}" aponta átomo ${a} fora do range (0–${total - 1})`);
        }));
      }
      if (b.type === 'quiz' && b.options.filter(o => o.correct).length !== 1) {
        falha(`blocks ${niv}[${i}]: quiz sem exatamente 1 correta`);
      }
    });
  }
  if (problemas === antes) ok('blocks.json: diagramas, badges e quizzes ok');
}

// mapping: atomIndices dentro do range da molécula
if (mapping) {
  let antes = problemas;
  mapping.forEach(q => {
    if (!q.smiles) return;
    const total = atomCount(q.smiles);
    const checar = (item, onde) => (item.atomIndices || []).forEach(a => {
      if (a < 0 || a >= total) falha(`mapping ${q.level} (${onde}): átomo ${a} fora do range (0–${total - 1})`);
    });
    (q.chain || []).forEach(it => { checar(it, 'chain'); (it.branches || []).forEach(b => checar(b, 'branch')); });
    (q.chain13C || []).forEach(it => { checar(it, 'chain13C'); (it.branches || []).forEach(b => checar(b, 'branch')); });
  });
  if (problemas === antes) ok('mapping.json: atomIndices ok');
}

// solo e guided: exatamente 1 correta por pergunta
if (solo) {
  let antes = problemas;
  solo.forEach(q => {
    if ((q.options || []).filter(o => o.correct).length !== 1) falha(`solo ${q.level}: sem exatamente 1 correta`);
  });
  if (problemas === antes) ok('solo.json: quizzes ok');
}
if (guided) {
  let antes = problemas;
  guided.forEach(g => (g.steps || []).forEach((s, i) => {
    if (s.options && s.options.filter(o => o.correct).length !== 1) falha(`guided ${g.id}, passo ${i}: sem exatamente 1 correta`);
  }));
  if (problemas === antes) ok('guided.json: quizzes ok');
}

// glossary: entradas completas
if (glossary) {
  let antes = problemas;
  glossary.forEach(g => {
    if (!g.id || !g.termo || !g.def) falha(`glossary: entrada incompleta (${g.id || g.termo || '?'})`);
  });
  if (problemas === antes) ok('glossary.json: entradas ok');
}

// ponto decimal em texto livre (padrão: vírgula)
let antes = problemas;
for (const [nome, d] of Object.entries({ blocks, mapping, solo, guided, glossary })) {
  if (!d) continue;
  varrerStrings(d, (s, caminho) => {
    const m = s.match(/\d\.\d/);
    if (m) falha(`${nome}${caminho}: decimal com ponto ("${m[0]}") — use vírgula`);
  });
}
if (problemas === antes) ok('sem decimais com ponto em textos');

console.log(problemas ? `\n${problemas} problema(s).` : '\nTudo certo.');
process.exit(problemas ? 1 : 0);
