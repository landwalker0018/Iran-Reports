# 简报生成工具

推荐入口：build_iran_briefing_pdf_v3.mjs。直接读取 reports/ 中的 Markdown，不需要修改脚本中的日期和正文。Python 与 V2 文件是兼容入口，接受相同参数；原始样稿代码位于 legacy/。

## 安装

在仓库根目录，使用 Node.js 22 或更新版本：

    npm ci
    npx playwright install chromium

纯校验和 HTML 生成不需要安装 Playwright。Python 兼容入口只使用标准库，但仍需要 Node.js。

## 使用

    npm run check
    npm test
    npm run build
    npm run build -- --input reports/iran-briefing-2026-07-31_1300.md
    npm run build -- --input reports/iran-briefing-2026-07-31_1300.md --html-only
    python scripts/build_iran_briefing_pdf.py --check

参数：

- --input：输入 Markdown；默认使用 2026-05-30 样稿。
- --out-dir：输出目录；默认 output/briefings/。
- --html-only：只生成 HTML。
- --check：只校验，不写入文件。
- --help：查看帮助。

输出按标题中的日期命名为 HTML、PDF 和完整网页预览 PNG。同日期重新生成会覆盖对应产物。原 reports/ 下的历史 HTML/PDF 不会自动更新。

## 输入约定

复制现有 Markdown 样稿，更新标题、信息窗口、回溯长度及正文。必须包含：

- 标题：# YYYY-MM-DD_HHMM | 颜色 烈度 分数 | 趋势。
- 信息窗口：北京时间起点 -> 终点 CST，终点与标题锚点一致。
- 回溯长度：例如 48h 或 2d。
- 一句话结论章节。
- 烈度指数章节：八项维度及权重按制作框架的顺序排列，总分必须等于分项之和。

生成器校验分数范围、总分、窗口、锚点、回溯长度和未填占位符。纽约时间在输出中按 America/New_York 自动重算，不改变输入文件。封面总分及等级来自分项计算。

支持的 Markdown 子集为一至三级标题、段落、无序列表、表格、代码块、分隔线和裸 HTTP/HTTPS 链接。原始 HTML 会转义；不支持图片、复杂嵌套列表和内嵌 HTML。来源 URL 保留为可点击链接。

## 排版与检查

采用自动分页，段落、事件卡、列表项及可容纳在单页的表格尽量保持完整，重复表头，页码由浏览器生成。输入兼容 UTF-8 BOM、LF、CRLF 和 CR 换行。导出前等待字体加载并检查横向溢出；浏览器始终在 finally 中关闭。优先使用 Microsoft YaHei、PingFang SC 或 Noto Sans CJK SC，请确保运行机器安装中文字体。

PNG 是完整网页预览，不能代替逐页 PDF 检查。正式交付前仍应检查 PDF 的分页、长表格和中文字体；特别长的单行表格需要拆分。自动校验不核验新闻真实性，也不判断来源是否足够独立。
