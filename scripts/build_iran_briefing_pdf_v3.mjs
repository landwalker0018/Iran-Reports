import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const WEIGHTS = [20, 15, 15, 15, 10, 8, 7, 10];
const DIMENSIONS = ['军事行动', '战略升级信号', '霍尔木兹与航运', '核问题与外交谈判', '能源市场', '制裁与经济战', '国内稳定与信息环境', '第三方斡旋与外溢风险'];
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function formatTime(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  }).formatToParts(date).map(p => [p.type, p.value]));
  return parts.year+'-'+parts.month+'-'+parts.day+' '+parts.hour+':'+parts.minute;
}
function parseCst(value) {
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) throw new Error('无效的北京时间：'+value);
  const date = new Date(match[1]+'T'+match[2]+':'+(match[3] || '00')+'+08:00');
  if (!Number.isFinite(date.getTime()) || formatTime(date,'Asia/Shanghai') !== match[1]+' '+match[2]) throw new Error('无效的日期：'+value);
  return date;
}
export function parseBriefing(markdown) {
  markdown = normalizeMarkdown(markdown);
  if (/\{\{[^}]*\}\}/.test(markdown)) throw new Error('简报中仍有未填写的占位符');
  const title = /^# (\d{4}-\d{2}-\d{2})_(\d{4}) \|.*?烈度\s+(\d+|暂不评分)\s*\|\s*(.+)$/m.exec(markdown);
  if (!title) throw new Error('缺少报告标识：# YYYY-MM-DD_HHMM | 颜色 烈度 分数 | 趋势');
  const window = /^信息窗口：(.+?)\s*->\s*(.+?)\s+CST\s*$/m.exec(markdown);
  if (!window) throw new Error('缺少 CST 信息窗口');
  const start = parseCst(window[1]);
  const end = parseCst(window[2]);
  if (end <= start) throw new Error('信息窗口结束时间必须晚于开始时间');
  const anchor = title[1]+' '+title[2].slice(0,2)+':'+title[2].slice(2);
  if (formatTime(end,'Asia/Shanghai') !== anchor) throw new Error('标题锚点与窗口结束时间不一致');
  const hours = (end-start)/3600000;
  const lookback = /^回溯长度：\s*(\d+(?:\.\d+)?)(h|d)\s*$/m.exec(markdown);
  if (!lookback || Number(lookback[1])*(lookback[2]==='d'?24:1) !== hours) throw new Error('回溯长度与信息窗口不一致');
  const scoreSection = /^## 烈度指数\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(markdown)?.[1];
  if (!scoreSection) throw new Error('缺少烈度指数章节');
  const rows = [...scoreSection.matchAll(/^\|\s*([^|]+?)\s*\|\s*(\d+|未评分)\s*\/\s*(\d+)\s*\|/gm)]
    .map(m => ({ name:m[1].trim(), score:m[2]==='未评分'?null:Number(m[2]), max:Number(m[3]) }));
  if (rows.length !== WEIGHTS.length) throw new Error('烈度指数必须包含八个维度');
  rows.forEach((row,i) => {
    if (row.name !== DIMENSIONS[i] || row.max !== WEIGHTS[i] || row.score > row.max) throw new Error('烈度维度或分数无效：'+row.name);
  });
  const score = rows.some(row=>row.score===null)?null:rows.reduce((sum,row) => sum+row.score,0);
  const stated = /总分：\s*(\d+|暂不评分)\s*\/\s*100/.exec(scoreSection);
  const matchesScore=value=>score===null?value==='暂不评分':Number(value)===score;
  if (!stated || !matchesScore(stated[1]) || !matchesScore(title[3])) throw new Error('首页、总分与分项之和不一致；计算值为 '+(score??'暂不评分'));
  const level = score===null?'资料不足':score>=80?'高烈度':score>=60?'明显紧张':score>=40?'中等波动':'低烈度';
  const color = score===null?'#68707a':score>=80?'#a7352a':score>=60?'#e46f2e':score>=40?'#c99722':'#2f8f6b';
  const summary = /^## 一句话结论\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(markdown)?.[1].trim();
  if (!summary) throw new Error('缺少一句话结论');
  return { id:title[1]+'_'+title[2], anchor, hours, start, end, score, rows, level, color, summary, trend:title[4].trim() };
}
// The repository uses a deliberately small Markdown subset. HTML is always escaped.
function normalizeMarkdown(markdown) {
  return markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}
function inline(text) {
  return text.split(/(https?:\/\/[^\s<>]+)/g).map(part => {
    if (!/^https?:\/\//.test(part)) return escapeHtml(part);
    return '<a href="'+escapeHtml(part)+'">'+escapeHtml(part)+'</a>';
  }).join('');
}
export function renderMarkdown(markdown) {
  const lines=normalizeMarkdown(markdown).split('\n');
  const out=[];
  let i=0;
  const cells=line => line.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
  while (i<lines.length) {
    const line=lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\|/.test(line) && /^\|[\s:|\-]+\|\s*$/.test(lines[i+1] || '')) {
      const headings=cells(line); i+=2; const rows=[];
      while (i<lines.length && /^\|/.test(lines[i])) {
        const values=cells(lines[i++]);
        if (values.length !== headings.length) throw new Error('Markdown 表格列数不一致');
        rows.push('<tr>'+values.map(v=>'<td>'+inline(v)+'</td>').join('')+'</tr>');
      }
      out.push('<table><thead><tr>'+headings.map(v=>'<th>'+inline(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>'); continue;
    }
    if (/^`{3}/.test(line)) {
      i++; const code=[]; while(i<lines.length && !/^`{3}/.test(lines[i])) code.push(lines[i++]);
      if (i===lines.length) throw new Error('Markdown 代码块未闭合');
      i++; out.push('<pre>'+escapeHtml(code.join('\n'))+'</pre>'); continue;
    }
    const heading=/^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {out.push('<h'+heading[1].length+'>'+inline(heading[2])+'</h'+heading[1].length+'>'); i++; continue;}
    if (/^---\s*$/.test(line)) {out.push('<hr>'); i++; continue;}
    if (/^- /.test(line)) {
      const items=[]; while(i<lines.length && /^- /.test(lines[i])) items.push('<li>'+inline(lines[i++].slice(2))+'</li>');
      out.push('<ul>'+items.join('')+'</ul>'); continue;
    }
    const paragraph=[];
    while(i<lines.length && lines[i].trim() && !/^(#{1,3}\s|\||- |---\s*$|`{3})/.test(lines[i])) paragraph.push(lines[i++]);
    if (!paragraph.length) paragraph.push(lines[i++]);
    out.push('<p>'+paragraph.map(inline).join('<br>')+'</p>');
  }
  return out.join('\n');
}
export function renderBriefing(markdown) {
  markdown = normalizeMarkdown(markdown);
  const data=parseBriefing(markdown);
  // Both time zones derive from the same instants, including New York daylight saving.
  const cst=formatTime(data.start,'Asia/Shanghai')+' -> '+formatTime(data.end,'Asia/Shanghai')+' CST';
  const et=formatTime(data.start,'America/New_York')+' -> '+formatTime(data.end,'America/New_York')+' ET';
  let body=markdown.replace(/^信息窗口：.*$/gm,'信息窗口：'+cst).replace(/^对应纽约时间：.*$/gm,'对应纽约时间：'+et);
  body=body.replace(/^# .*\r?\n/gm,'');
  const bars=data.rows.map(r=>'<div class="bar-row"><span>'+escapeHtml(r.name)+'</span>'+(r.score===null?'<span class="muted">未评分（缺少完整依据）</span><b>—</b>':'<div class="bar"><div style="width:'+r.score/r.max*100+'%;background:'+data.color+'"></div></div><b>'+r.score+'/'+r.max+'</b>')+'</div>').join('');
  const scoreLabel=data.score===null?'待评估':data.score+'<small> / 100 · '+data.level+'</small>';
  const overview=data.score===null?'':'<section class="overview"><h2>烈度概览</h2>'+bars+'</section>';
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>伊朗局势简报 '+data.id+'</title><style>'+CSS+'</style></head><body><section class="cover"><div class="kicker">IRAN BRIEFING</div><h1>伊朗局势简报</h1><div class="score" style="color:'+data.color+'">'+scoreLabel+'</div><p class="lead">'+escapeHtml(data.summary)+'</p><p>'+escapeHtml(data.anchor)+' CST · 回溯 '+data.hours+' 小时</p><p>'+escapeHtml(data.trend)+'</p></section><main>'+overview+renderMarkdown(body)+'</main></body></html>';
}
const CSS = String.raw`
@page { size:A4 landscape; margin:16mm 18mm 19mm; }
* { box-sizing:border-box; }
body { margin:0; color:#20242a; background:#fbfaf6; font-family:'Microsoft YaHei','PingFang SC','Noto Sans CJK SC',sans-serif; font-size:12px; line-height:1.65; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
.cover { min-height:150mm; padding:15mm 12mm; border-left:8px solid #a7352a; break-after:page; }
.kicker { color:#a7352a; letter-spacing:.15em; }
h1 { font-size:42px; margin:8mm 0; }
.score { font-size:62px; font-weight:700; }
.score small { font-size:18px; }
.lead { font-size:23px; max-width:220mm; }
h2 { font-size:23px; color:#8f2b25; border-bottom:1px solid #d9d1c7; padding-bottom:6px; margin-top:24px; break-after:avoid; }
h3 { color:#8f2b25; break-after:avoid; }
p,li { orphans:3; widows:3; overflow-wrap:anywhere; break-inside:avoid; }
a { color:#3d6c91; overflow-wrap:anywhere; }
table { width:100%; border-collapse:collapse; font-size:11px; margin:12px 0; break-inside:avoid; }
thead { display:table-header-group; }
tr { break-inside:avoid; }
th { background:#8f2b25; color:white; text-align:left; }
th,td { border:1px solid #d9d1c7; padding:8px; vertical-align:top; overflow-wrap:anywhere; }
tr:nth-child(even) { background:#f5f1ea; }
pre { white-space:pre-wrap; overflow-wrap:anywhere; font:inherit; background:#f5f1ea; padding:12px; }
.overview { break-inside:avoid; }
.bar-row { display:grid; grid-template-columns:52mm 1fr 18mm; align-items:center; gap:12px; margin:7px 0; }
.bar { height:9px; background:#e9e1d8; border-radius:8px; }
.bar div { height:100%; border-radius:8px; }
@media screen { body { max-width:1100px; margin:24px auto; padding:30px; box-shadow:0 3px 24px #ddd; } }
`;
export function currentReportDate(now=new Date()) {
  return formatTime(now,'Asia/Shanghai').slice(0,10);
}
export function parseArgs(args, now=new Date()) {
  const result={input:null,date:null,outDir:path.join(ROOT,'output/briefings'),htmlOnly:false,check:false};
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if(arg==='--html-only') result.htmlOnly=true;
    else if(arg==='--check') result.check=true;
    else if(arg==='--help') result.help=true;
    else if(arg==='--input' || arg==='--out-dir' || arg==='--date') {
      if(!args[i+1] || args[i+1].startsWith('--')) throw new Error('参数缺少值：'+arg);
      const value=args[++i];
      if(arg==='--date') result.date=value;
      else result[arg==='--input'?'input':'outDir']=path.resolve(value);
    } else throw new Error('未知参数：'+arg);
  }
  if(result.input && result.date) throw new Error('--input 与 --date 不能同时指定');
  if(!result.input && !result.date) result.date=currentReportDate(now);
  if(result.date) validateReportDate(result.date);
  return result;
}
function validateReportDate(value) {
  const match=/^(\d{4}-\d{2}-\d{2})(?:_(\d{2})(\d{2}))?$/.exec(value);
  if(!match) throw new Error('--date 格式必须为 YYYY-MM-DD 或 YYYY-MM-DD_HHMM');
  parseCst(match[1]+' '+(match[2] || '00')+':'+(match[3] || '00'));
}
export async function resolveInput(options, reportsDir=REPORTS_DIR) {
  if(options.input) return options.input;
  const date=options.date || currentReportDate();
  validateReportDate(date);
  const entries=await readdir(reportsDir,{withFileTypes:true});
  const candidates=entries.filter(entry=>entry.isFile()).map(entry=>entry.name)
    .filter(name=>/^iran-briefing-\d{4}-\d{2}-\d{2}_\d{4}\.md$/.test(name))
    .filter(name=>{
      const id=name.slice('iran-briefing-'.length,-3);
      try {validateReportDate(id);} catch {return false;}
      return date.length===10 ? id.startsWith(date+'_') : id===date;
    }).sort();
  if(!candidates.length) throw new Error('未找到日期 '+date+' 的 Markdown 简报，请先在 reports/ 中准备该日期的简报，或用 --date / --input 指定已有简报');
  return path.join(reportsDir,candidates.at(-1));
}
export async function main(args=process.argv.slice(2)) {
  const options=parseArgs(args);
  if(options.help) { console.log('node scripts/build_iran_briefing_pdf_v3.mjs [--date YYYY-MM-DD[_HHMM] | --input report.md] [--out-dir directory] [--html-only] [--check]\n默认日期为北京时间今天（Asia/Shanghai），选择当天最新一期。没有当天简报时报错。'); return; }
  const input=await resolveInput(options);
  const markdown=await readFile(input,'utf8');
  const data=parseBriefing(markdown);
  if(!options.input && path.basename(input)!=='iran-briefing-'+data.id+'.md') throw new Error('文件名日期与报告标题不一致：'+path.basename(input));
  const html=renderBriefing(markdown);
  if(options.check) {console.log('校验通过：'+data.id+'，烈度 '+(data.score??'暂不评分')+'/100'); return;}
  await mkdir(options.outDir,{recursive:true});
  const stem='iran-briefing-'+data.id;
  const htmlPath=path.join(options.outDir,stem+'.html');
  await writeFile(htmlPath,html,'utf8');
  console.log(htmlPath);
  if(options.htmlOnly) return;
  let chromium;
  try { ({chromium}=await import('playwright')); }
  catch(error) {throw new Error('无法加载 Playwright，请先执行 npm install 和 npx playwright install chromium。HTML 已生成。',{cause:error});}
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:850},deviceScaleFactor:1});
    await page.goto(pathToFileURL(htmlPath).href,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    await page.emulateMedia({media:'print'});
    const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+2 && el.clientWidth>0 && getComputedStyle(el).display!=='inline').map(el=>el.tagName+': '+el.textContent.slice(0,60)));
    if(overflow.length) throw new Error('检测到横向溢出，停止 PDF 导出：'+overflow.join('; '));
    await page.pdf({path:path.join(options.outDir,stem+'.pdf'),format:'A4',landscape:true,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-size:9px;width:100%;padding:0 18mm;display:flex;justify-content:space-between;color:#68707a"><span>Iran Briefing '+data.id+'</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
    await page.emulateMedia({media:'screen'});
    await page.screenshot({path:path.join(options.outDir,stem+'-preview.png'),fullPage:true});
    console.log(path.join(options.outDir,stem+'.pdf'));
  } finally {await browser.close();}
}
if (typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
