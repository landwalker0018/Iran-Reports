import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBriefing, renderBriefing, renderMarkdown, parseArgs } from './build_iran_briefing_pdf_v3.mjs';

export async function runTests() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const may = await readFile(path.join(root,'reports/iran-briefing-2026-05-30_2100.md'),'utf8');
  const july = await readFile(path.join(root,'reports/iran-briefing-2026-07-31_1300.md'),'utf8');
  assert.equal(parseBriefing(may).score,66);
  assert.equal(parseBriefing(july).score,76);
  assert.equal(parseBriefing('\uFEFF'+may).score,66);
  assert.equal(renderBriefing(may.replace(/\r\n?/g,'\n')), renderBriefing(may));
  assert.equal(renderBriefing(may.replace(/\r\n?|\n/g,'\r')), renderBriefing(may));
  assert.equal(renderBriefing('\uFEFF'+may), renderBriefing(may));
  assert.throws(()=>renderMarkdown('| a | b |\n| --- | --- |\n| one |'),/列数不一致/);
  assert.throws(()=>renderMarkdown('```text\nnot closed'),/未闭合/);
  assert.throws(()=>parseBriefing(may.replace('烈度 66','烈度 67')),/分项之和/);
  assert.throws(()=>parseBriefing(may.replace('13 / 20','21 / 20')),/分数无效/);
  assert.throws(()=>parseBriefing(may.replace('48h','24h')),/回溯长度/);
  assert.throws(()=>parseBriefing(may.replace('2026-05-30_2100','2026-05-30_2200')),/锚点/);
  assert.throws(()=>parseBriefing(may+'\n{{missing}}'),/占位符/);
  assert.throws(()=>parseArgs(['--input']),/缺少值/);
  assert.throws(()=>parseArgs(['--unknown']),/未知参数/);
  const html=renderBriefing(may+'\n<script>alert(1)</script>');
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;script&gt;'));
  assert(html.includes('href="https://apnews.com/'));
  assert(html.includes('2026-05-28 09:00'));
  assert(html.includes('待核实与盲区'));
  assert(html.includes('报告生成：'));
  const winter=may.replaceAll('2026-05-28','2026-01-28').replaceAll('2026-05-30','2026-01-30');
  assert(renderBriefing(winter).includes('2026-01-28 08:00'));
  return '通过：两期样稿、分数范围/总和、时间窗口、参数、占位符、HTML 转义、来源链接、夏令时/冬令时和末尾内容。';
}
if(typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  runTests().then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
