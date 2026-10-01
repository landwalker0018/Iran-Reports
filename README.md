# Iran Reports

伊朗局势简报的研究框架、Markdown 报告与 HTML/PDF 生成工具。

## 目录

- notes/：制作框架与研究笔记。
- reports/：作为内容来源的 Markdown 简报，以及历史 HTML/PDF 样稿。
- scripts/：统一生成器、Python/V2 兼容入口与校验测试。
- scripts/legacy/：保留的旧版固定内容排版脚本。
- output/briefings/：新生成的 HTML、PDF、完整网页预览，默认不纳入 Git。

## 快速开始

需要 Node.js 22 或更新版本，在仓库根目录执行：

    npm ci
    npx playwright install chromium
    npm test
    npm run build
    npm run build -- --date 2026-07-31

无需浏览器的内容校验与 HTML 生成：

    node scripts/build_iran_briefing_pdf_v3.mjs --check
    node scripts/build_iran_briefing_pdf_v3.mjs --input reports/iran-briefing-2026-07-31_1300.md --html-only

详细参数和输入约定见 [scripts/README.md](scripts/README.md)。研究规范见 [简报制作框架](notes/iran-briefing-framework.md)。

未指定日期或输入文件时，默认日期为运行时北京时间今天（Asia/Shanghai），选择当天最新一期；没有当天简报时报错。--date YYYY-MM-DD 选择指定日期最新一期，--date YYYY-MM-DD_HHMM 精确指定一期；Python 与 V2 入口支持同样的参数。

Markdown 是报告唯一内容来源。评分和时间窗口校验通过后生成封面、评分概览与完整正文；纽约时间自动处理夏令时。历史样稿保留用于对照，新输出采用自动分页。

当前工具负责校验与排版；消息检索、事件去重、事实核实和评分判断仍需按制作框架完成。

## 文件策略

仓库保留源码、文本及常见文本配置；二进制文件默认忽略。node_modules/、output/ 和 Python 缓存不纳入版本控制。
