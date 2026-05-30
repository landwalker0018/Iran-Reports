from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (
    Flowable,
    FrameBreak,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports" / "iran-briefing-2026-05-30_2100-visual.pdf"

PAGE_W, PAGE_H = A4
ORANGE = colors.HexColor("#E46F2E")
DEEP_RED = colors.HexColor("#A7352A")
INK = colors.HexColor("#20242A")
MUTED = colors.HexColor("#68707A")
LIGHT = colors.HexColor("#F5F1EA")
LINE = colors.HexColor("#D9D1C7")
GREEN = colors.HexColor("#2F8F6B")
YELLOW = colors.HexColor("#C99722")
BLUE = colors.HexColor("#3D6C91")
GRAY_BG = colors.HexColor("#F7F7F5")


pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CNBody",
        fontName="STSong-Light",
        fontSize=9.2,
        leading=14,
        textColor=INK,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="CNBodySmall",
        fontName="STSong-Light",
        fontSize=8,
        leading=11,
        textColor=INK,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="CNMuted",
        fontName="STSong-Light",
        fontSize=8.2,
        leading=11,
        textColor=MUTED,
    )
)
styles.add(
    ParagraphStyle(
        name="CNTitle",
        fontName="STSong-Light",
        fontSize=25,
        leading=31,
        textColor=colors.white,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="CNSubtitle",
        fontName="STSong-Light",
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#F4E6DB"),
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="H1",
        fontName="STSong-Light",
        fontSize=15,
        leading=19,
        textColor=DEEP_RED,
        spaceBefore=10,
        spaceAfter=8,
    )
)
styles.add(
    ParagraphStyle(
        name="H2",
        fontName="STSong-Light",
        fontSize=11.5,
        leading=15,
        textColor=INK,
        spaceBefore=7,
        spaceAfter=5,
    )
)
styles.add(
    ParagraphStyle(
        name="CenterBig",
        fontName="STSong-Light",
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=INK,
    )
)


def p(text: str, style: str = "CNBody") -> Paragraph:
    return Paragraph(escape(text), styles[style])


class CoverBand(Flowable):
    def __init__(self):
        super().__init__()
        self.width = PAGE_W - 3.0 * cm
        self.height = 15.6 * cm

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.saveState()
        c.setFillColor(DEEP_RED)
        c.roundRect(0, 0, w, h, 10, stroke=0, fill=1)
        c.setFillColor(ORANGE)
        c.rect(0, 0, 1.05 * cm, h, stroke=0, fill=1)
        c.setStrokeColor(colors.HexColor("#F0B17C"))
        c.setLineWidth(1.2)
        for i in range(4):
            y = 4.25 * cm + i * 1.25 * cm
            c.line(2.0 * cm, y, w - 1.2 * cm, y + 0.45 * cm)
        c.setFillColor(colors.white)
        c.setFont("STSong-Light", 28)
        c.drawString(1.8 * cm, h - 3.0 * cm, "伊朗局势简报")
        c.setFont("STSong-Light", 13)
        c.setFillColor(colors.HexColor("#F6D6BE"))
        c.drawString(1.85 * cm, h - 4.0 * cm, "2026-05-30 21:00 CST | 回溯 48 小时")
        c.setFillColor(colors.white)
        c.setFont("STSong-Light", 45)
        c.drawRightString(w - 1.5 * cm, h - 6.9 * cm, "66")
        c.setFont("STSong-Light", 12)
        c.drawRightString(w - 1.55 * cm, h - 7.8 * cm, "烈度指数 / 100")
        c.setFillColor(colors.HexColor("#F6D6BE"))
        c.setFont("STSong-Light", 10)
        c.drawString(1.85 * cm, 3.6 * cm, "一句话结论")
        c.setFillColor(colors.white)
        c.setFont("STSong-Light", 13)
        c.drawString(1.85 * cm, 2.75 * cm, "谈判预期降温市场，霍尔木兹与军事摩擦仍是风险阀门。")
        c.setFillColor(colors.HexColor("#F6D6BE"))
        c.setFont("STSong-Light", 9)
        c.drawString(1.85 * cm, 1.55 * cm, "信息窗口: 2026-05-28 21:00:00 -> 2026-05-30 21:00:00 CST")
        c.restoreState()


class ScoreGauge(Flowable):
    def __init__(self, score: int = 66):
        super().__init__()
        self.score = score
        self.width = PAGE_W - 3.0 * cm
        self.height = 4.0 * cm

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.saveState()
        c.setFillColor(GRAY_BG)
        c.roundRect(0, 0, w, h, 8, stroke=0, fill=1)
        x0 = 1.0 * cm
        y = 1.35 * cm
        bar_w = w - 2.0 * cm
        c.setFillColor(colors.HexColor("#E5E1DA"))
        c.roundRect(x0, y, bar_w, 0.42 * cm, 5, stroke=0, fill=1)
        stops = [(0, 40, GREEN), (40, 60, YELLOW), (60, 80, ORANGE), (80, 100, DEEP_RED)]
        for lo, hi, col in stops:
            c.setFillColor(col)
            c.rect(x0 + bar_w * lo / 100, y, bar_w * (hi - lo) / 100, 0.42 * cm, stroke=0, fill=1)
        marker_x = x0 + bar_w * self.score / 100
        c.setFillColor(INK)
        c.circle(marker_x, y + 0.21 * cm, 0.18 * cm, stroke=0, fill=1)
        c.setFont("STSong-Light", 11)
        c.drawString(0.8 * cm, h - 0.9 * cm, "烈度指数：中高位，趋势为降温中带扰动")
        c.setFont("STSong-Light", 22)
        c.setFillColor(ORANGE)
        c.drawRightString(w - 0.9 * cm, h - 0.85 * cm, f"{self.score}/100")
        c.setFillColor(MUTED)
        c.setFont("STSong-Light", 7.5)
        for v, label in [(0, "低"), (40, "中"), (60, "偏高"), (80, "高"), (100, "极高")]:
            x = x0 + bar_w * v / 100
            c.drawCentredString(x, y - 0.35 * cm, label)
        c.restoreState()


class ScoreBars(Flowable):
    def __init__(self, rows):
        super().__init__()
        self.rows = rows
        self.width = PAGE_W - 3.0 * cm
        self.height = 7.9 * cm

    def draw(self):
        c = self.canv
        c.saveState()
        y = self.height - 0.3 * cm
        bar_x = 5.4 * cm
        bar_w = self.width - bar_x - 1.7 * cm
        for name, score, total, note in self.rows:
            pct = score / total
            col = ORANGE if pct >= 0.72 else YELLOW if pct >= 0.55 else GREEN
            c.setFillColor(INK)
            c.setFont("STSong-Light", 8.5)
            c.drawString(0, y, name)
            c.setFillColor(colors.HexColor("#E9E4DC"))
            c.roundRect(bar_x, y - 0.08 * cm, bar_w, 0.25 * cm, 3, stroke=0, fill=1)
            c.setFillColor(col)
            c.roundRect(bar_x, y - 0.08 * cm, bar_w * pct, 0.25 * cm, 3, stroke=0, fill=1)
            c.setFillColor(MUTED)
            c.setFont("STSong-Light", 7.5)
            c.drawRightString(self.width, y, f"{score}/{total}")
            c.drawString(bar_x, y - 0.43 * cm, note)
            y -= 0.93 * cm
        c.restoreState()


class Timeline(Flowable):
    def __init__(self, events):
        super().__init__()
        self.events = events
        self.width = PAGE_W - 3.0 * cm
        self.height = 8.3 * cm

    def draw(self):
        c = self.canv
        c.saveState()
        x = 1.2 * cm
        c.setStrokeColor(LINE)
        c.setLineWidth(1.2)
        c.line(x, 0.4 * cm, x, self.height - 0.4 * cm)
        y = self.height - 0.7 * cm
        for idx, (time, title, tag) in enumerate(self.events):
            col = ORANGE if idx < 2 else BLUE if idx == 2 else YELLOW
            c.setFillColor(col)
            c.circle(x, y + 0.1 * cm, 0.13 * cm, stroke=0, fill=1)
            c.setFillColor(MUTED)
            c.setFont("STSong-Light", 7.4)
            c.drawRightString(x - 0.25 * cm, y, time)
            c.setFillColor(INK)
            c.setFont("STSong-Light", 8.8)
            c.drawString(x + 0.35 * cm, y + 0.09 * cm, title)
            c.setFillColor(col)
            c.roundRect(x + 0.35 * cm, y - 0.39 * cm, 2.2 * cm, 0.34 * cm, 4, stroke=0, fill=1)
            c.setFillColor(colors.white)
            c.setFont("STSong-Light", 7)
            c.drawCentredString(x + 1.45 * cm, y - 0.30 * cm, tag)
            y -= 1.55 * cm
        c.restoreState()


class RiskRadar(Flowable):
    def __init__(self):
        super().__init__()
        self.width = PAGE_W - 3.0 * cm
        self.height = 4.2 * cm
        self.items = [
            ("军事", "中高", ORANGE),
            ("外交", "中", YELLOW),
            ("航运", "高", DEEP_RED),
            ("能源", "中", YELLOW),
            ("制裁", "中高", ORANGE),
            ("国内", "中低", GREEN),
        ]

    def draw(self):
        c = self.canv
        c.saveState()
        cell_w = self.width / 3
        cell_h = 1.65 * cm
        for i, (name, level, col) in enumerate(self.items):
            row = i // 3
            col_i = i % 3
            x = col_i * cell_w
            y = self.height - (row + 1) * cell_h
            c.setFillColor(GRAY_BG)
            c.roundRect(x + 0.08 * cm, y, cell_w - 0.18 * cm, cell_h - 0.18 * cm, 6, stroke=0, fill=1)
            c.setFillColor(col)
            c.circle(x + 0.55 * cm, y + 0.72 * cm, 0.20 * cm, stroke=0, fill=1)
            c.setFillColor(INK)
            c.setFont("STSong-Light", 9.5)
            c.drawString(x + 0.95 * cm, y + 0.86 * cm, name)
            c.setFillColor(MUTED)
            c.setFont("STSong-Light", 8)
            c.drawString(x + 0.95 * cm, y + 0.43 * cm, level)
        c.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#FBFAF7"))
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.restoreState()


def later_pages(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#FBFAF7"))
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.line(1.5 * cm, PAGE_H - 1.2 * cm, PAGE_W - 1.5 * cm, PAGE_H - 1.2 * cm)
    canvas.setFont("STSong-Light", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.5 * cm, PAGE_H - 0.86 * cm, "伊朗局势简报 · 2026-05-30 21:00 CST")
    canvas.drawRightString(PAGE_W - 1.5 * cm, 0.75 * cm, f"{doc.page}")
    canvas.restoreState()


def section(title: str):
    return Paragraph(escape(title), styles["H1"])


def box(text: str, fill=LIGHT, border=LINE):
    tbl = Table([[p(text)]], colWidths=[PAGE_W - 3.0 * cm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), fill),
                ("BOX", (0, 0), (-1, -1), 0.7, border),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return tbl


def make_table(data, widths):
    tbl = Table(
        [[Paragraph(escape(str(cell)), styles["CNBodySmall"]) for cell in row] for row in data],
        colWidths=widths,
        repeatRows=1,
    )
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), DEEP_RED),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FBF8F3")]),
            ]
        )
    )
    return tbl


def build():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.45 * cm,
        bottomMargin=1.25 * cm,
        title="伊朗局势简报 2026-05-30 2100",
        author="OpenClaw / Codex",
    )

    story = []
    story.append(CoverBand())
    story.append(Spacer(1, 0.55 * cm))
    story.append(box("核心判断：主线从军事升级转向谈判定价；霍尔木兹仍是协议成败的核心变量；油价已先行反映乐观预期，但实际航运恢复尚未确认。"))
    story.append(Spacer(1, 0.5 * cm))
    story.append(
        make_table(
            [
                ["锚点时间", "回溯窗口", "冲突天数", "资料口径"],
                ["2026-05-30 21:00 CST", "48 小时", "第 92 天", "权威源 + 通讯社 + 市场数据"],
            ],
            [4.6 * cm, 3.5 * cm, 3.0 * cm, 6.0 * cm],
        )
    )
    story.append(PageBreak())

    story.append(section("一、摘要与态势图"))
    story.append(ScoreGauge(66))
    story.append(Spacer(1, 0.3 * cm))
    story.append(RiskRadar())
    story.append(Spacer(1, 0.35 * cm))
    story.append(box("一句话结论：美伊停火延长方案接近落地但仍卡在核材料、霍尔木兹通航安排和费用/监管权问题上，市场先行降温，军事端仍有低烈度摩擦。"))
    story.append(Spacer(1, 0.25 * cm))
    story.append(p("判断方式：本报告把已确认事实、市场定价和待核实信息分开呈现。涉及停火、核材料、霍尔木兹关闭/开放等重大事项，未达到官方确认或多源互证前不写作既成事实。"))

    story.append(section("二、烈度拆解"))
    story.append(
        ScoreBars(
            [
                ("军事行动", 13, 20, "无人机、导弹、空袭和反击仍构成低烈度摩擦。"),
                ("战略升级信号", 9, 15, "白宫会议聚焦协议最终决定，措辞强硬但未扩大打击。"),
                ("霍尔木兹与航运", 12, 15, "通航、清雷、收费和封锁解除是最大卡点。"),
                ("核问题与谈判", 10, 15, "60天停火框架接近，但核材料处置仍未闭环。"),
                ("能源市场", 6, 10, "Brent 周跌约 11%，市场提前交易协议预期。"),
                ("制裁与经济战", 6, 8, "美国继续压制伊朗油品收入和收费机制。"),
                ("国内稳定", 3, 7, "窗口内未见改变局势的国内稳定事件。"),
                ("第三方斡旋", 7, 10, "黎巴嫩、海湾和联合国方向仍可能改变节奏。"),
            ]
        )
    )

    story.append(PageBreak())
    story.append(section("三、48 小时事件时间线"))
    story.append(
        Timeline(
            [
                ("5/29 22:13", "白宫讨论是否批准美伊协议，尚无最终决定", "外交"),
                ("5/29-5/30", "霍尔木兹无收费通航、清雷和封锁解除出现解释分歧", "航运"),
                ("5/28 起", "美国财政部继续打击伊朗军方油品收入", "制裁"),
                ("5/28 前后", "霍尔木兹附近无人机、导弹和空袭摩擦延续", "军事"),
                ("5/30 早间", "Brent 收 92.05 美元/桶，周跌约 11%", "能源"),
            ]
        )
    )
    story.append(Spacer(1, 0.25 * cm))
    story.append(section("四、关键事件卡片"))
    cards = [
        ("白宫决策节点", "AP 报道特朗普与国家安全团队讨论是否推进延长停火和重开霍尔木兹协议，会后高级官员称尚无决定。", "可信度 A · 外交/核谈判 · 降温但未闭环"),
        ("霍尔木兹条款分歧", "美方口径强调无收费通航和30天内清雷，伊朗方面称尚无最终理解，并否认部分条款解释。", "可信度 B · 航运/能源 · 方向未定"),
        ("制裁压力延续", "美国财政部继续针对伊朗军方油品收入和所谓海峡收费安排施压。", "可信度 A · 制裁/航运 · 高压"),
        ("军事摩擦未消失", "CENTCOM 与新华网信息显示，无人机、导弹、空袭和反击仍在谈判背景下发生。", "可信度 A/B · 军事/谈判 · 中高"),
    ]
    for title, body, meta in cards:
        story.append(KeepTogether([Paragraph(escape(title), styles["H2"]), box(body + "\n" + meta, fill=colors.white)]))
        story.append(Spacer(1, 0.15 * cm))

    story.append(PageBreak())
    story.append(section("五、情景推演"))
    story.append(
        make_table(
            [
                ["情景", "等级", "触发条件", "观察指标"],
                ["缓和落地", "中高", "白宫批准备忘录；伊朗确认通航安排；清雷和封锁解除开始执行", "双方同步声明、首批船只稳定通行、Brent 继续跌破 90"],
                ["僵持延长", "中", "继续交换文本，但核材料、收费、黎巴嫩条件未解决", "接近协议但未签署、通航量低位、油价 90-100 区间震荡"],
                ["再升级", "中低", "霍尔木兹再发生扣船/袭船/误击；以黎方向扩大", "CENTCOM/IRGC 新声明、保险费率跳升、Brent 快速反弹至 100 以上"],
            ],
            [2.6 * cm, 2.1 * cm, 6.2 * cm, 6.2 * cm],
        )
    )
    story.append(section("六、结论矩阵"))
    story.append(
        make_table(
            [
                ["结论", "置信度", "证据", "影响"],
                ["协议接近但未完成，不能写作已达成最终和平", "高", "AP 称白宫会后未决定；伊朗称尚无最终理解", "防止过度乐观"],
                ["霍尔木兹恢复是停火延长的核心交换项", "高", "AP、Reuters、Treasury、Polymarket 均围绕通航/清雷/收费定价", "决定能源风险溢价"],
                ["军事端没有完全停火", "中高", "CENTCOM、新华网关于无人机、导弹、空袭和反击的报道", "维持中高烈度"],
                ["油价回落更像预期交易", "高", "Reuters 称通航仍远低战前，Brent 周跌约 11%", "后续易波动"],
            ],
            [4.1 * cm, 1.8 * cm, 7.2 * cm, 4.0 * cm],
        )
    )

    story.append(PageBreak())
    story.append(section("七、待核实与来源"))
    story.append(p("待核实事项：伊朗是否正式接受无收费通航、30天清雷、核材料处置等条款；霍尔木兹实际日通航船只数量、油轮类别、保险费率变化；美国解除港口封锁和放松制裁的顺序、条件和执行主体；黎巴嫩方向停火是否被纳入美伊备忘录。"))
    sources = [
        "AP: Trump weighs whether to go with Iran deal but has not decided yet, 2026-05-29.",
        "CENTCOM: Statement from CENTCOM on Recent Iranian Aggression, 2026-05-28.",
        "U.S. Treasury: Economic Fury Targets Illicit Oil Revenue Fueling Iran's Military, 2026-05-28.",
        "新华网：新闻分析丨中东两线交火会否拖累美伊停火？2026-05-28.",
        "Reuters via MarketScreener: Oil falls on hopes for US-Iran ceasefire agreement, 2026-05-29.",
        "Anadolu Agency / IRNA 转述：Iran says message exchanges with US continue, no final understanding reached, 2026-05-29.",
        "Polymarket: Iran ceasefire continues through...? 市场情绪参考。",
    ]
    story.append(
        make_table(
            [["序号", "来源说明"]]
            + [[str(i + 1), src] for i, src in enumerate(sources)],
            [1.2 * cm, 15.9 * cm],
        )
    )
    story.append(Spacer(1, 0.35 * cm))
    story.append(box("质量提示：本 PDF 是基于 2026-05-30 21:00 CST 前后可检索公开信息制作的试制版。预测市场价格和航运状态需要在正式交付时重新抓取。", fill=colors.HexColor("#FFF7E8"), border=ORANGE))

    doc.build(story, onFirstPage=cover, onLaterPages=later_pages)


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    build()
    print(OUT)
