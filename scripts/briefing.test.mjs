import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, mkdir, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBriefing, renderBriefing, renderMarkdown, parseArgs, resolveInput, currentReportDate } from './build_iran_briefing_pdf_v3.mjs';

export async function runTests() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const may = await readFile(path.join(root,'reports/iran-briefing-2026-05-30_2100.md'),'utf8');
  const july = await readFile(path.join(root,'reports/iran-briefing-2026-07-31_1300.md'),'utf8');
  assert.equal(parseBriefing(may).score,66);
  assert.equal(parseBriefing(july).score,76);
  const missing=may.replace('烈度 66','烈度 暂不评分').replace('总分：66','总分：暂不评分').replace('13 / 20','未评分 / 20');
  assert.equal(parseBriefing(missing).score,null);
  assert(renderBriefing(missing).includes('待评估'));
  assert(!renderBriefing(missing).includes('null'));
  assert.throws(()=>parseBriefing(missing.replace('总分：暂不评分','总分：53')),/分项之和/);
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
  assert.equal(parseArgs([]).input,null);
  const now=new Date('2026-07-30T16:01:00Z');
  assert.equal(parseArgs([],now).date,'2026-07-31');
  assert.equal(currentReportDate(new Date('2026-07-30T15:59:00Z')),'2026-07-30');
  assert.equal(parseArgs(['--input','x.md'],now).date,null);
  assert.equal(parseArgs(['--date','2026-07-31']).date,'2026-07-31');
  assert.throws(()=>parseArgs(['--date']),/缺少值/);
  assert.throws(()=>parseArgs(['--date','2026-02-30']),/无效的日期/);
  assert.throws(()=>parseArgs(['--date','2026-07-31_2500']),/无效的日期/);
  assert.throws(()=>parseArgs(['--date','20260731']),/格式必须/);
  assert.throws(()=>parseArgs(['--date','2026-07-31','--input','x.md']),/不能同时指定/);
  const reports=await mkdtemp(path.join(tmpdir(),'iran-reports-test-'));
  const filenames=['README.md','iran-briefing-2026-07-31_0900.md','iran-briefing-2026-07-31_1300.md','iran-briefing-2026-05-30_2100.md','iran-briefing-2026-13-01_1300.md','iran-briefing-2026-07-31_1400.html'];
  const fakeReport=path.join(reports,'iran-briefing-2099-01-01_0000.md');
  try {
    await assert.rejects(resolveInput(parseArgs([],now),reports),/未找到日期 2026-07-31/);
    for(const name of filenames) await writeFile(path.join(reports,name),'');
    await mkdir(fakeReport);
    assert.equal(path.basename(await resolveInput(parseArgs([],now),reports)),'iran-briefing-2026-07-31_1300.md');
    await assert.rejects(resolveInput(parseArgs([],new Date('2026-10-01T00:00:00Z')),reports),/未找到日期 2026-10-01/);
    assert.equal(path.basename(await resolveInput(parseArgs(['--date','2026-07-31']),reports)),'iran-briefing-2026-07-31_1300.md');
    assert.equal(path.basename(await resolveInput(parseArgs(['--date','2026-07-31_0900']),reports)),'iran-briefing-2026-07-31_0900.md');
    assert.equal(path.basename(await resolveInput(parseArgs(['--date','2026-05-30']),reports)),'iran-briefing-2026-05-30_2100.md');
    await assert.rejects(resolveInput(parseArgs(['--date','2026-08-01']),reports),/未找到日期/);
    const explicit=parseArgs(['--input',path.join(reports,'README.md')]);
    assert.equal(await resolveInput(explicit,reports),explicit.input);
  } finally {
    for(const name of filenames) await unlink(path.join(reports,name)).catch(e=>{if(e.code!=='ENOENT') throw e;});
    await rmdir(fakeReport).catch(e=>{if(e.code!=='ENOENT') throw e;});
    await rmdir(reports);
  }
  const html=renderBriefing(may+'\n<script>alert(1)</script>');
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;script&gt;'));
  assert(html.includes('href="https://apnews.com/'));
  assert(html.includes('2026-05-28 09:00'));
  assert(html.includes('待核实与盲区'));
  assert(html.includes('报告生成：'));
  const winter=may.replaceAll('2026-05-28','2026-01-28').replaceAll('2026-05-30','2026-01-30');
  assert(renderBriefing(winter).includes('2026-01-28 08:00'));
  return '通过：默认北京时间今天、跨午夜日期、当天最新一期、缺失当天简报、指定日期/时刻、参数冲突及报告内容校验。';
}
if(typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  runTests().then(console.log).catch(error=>{console.error(error);process.exitCode=1;});
}
