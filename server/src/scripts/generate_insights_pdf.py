# -*- coding: utf-8 -*-
"""
AI Insights Report PDF Generator
AI 인사이트 분석 리포트를 PDF 문서로 생성한다.
좌우 분리 레이아웃: 왼쪽(섹션 설명) / 오른쪽(데이터 테이블)
"""

import json
import sys
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# =============================================================================
# 전역 설정
# =============================================================================

FONT_NAME = 'Helvetica'
FONT_NAME_BOLD = 'Helvetica-Bold'

# 레이아웃 설정
LEFT_COL_WIDTH = 5 * cm
RIGHT_COL_WIDTH = 11.5 * cm

# 컬러 시스템
COLORS = {
    'black': '#000000',
    'dark': '#1a1a1a',
    'gray_dark': '#343a40',
    'gray': '#6c757d',
    'gray_light': '#adb5bd',
    'gray_lighter': '#dee2e6',
    'gray_lightest': '#f8f9fa',
    'white': '#ffffff',
    'violet': '#7c3aed',
    'grape': '#9333ea',
    'purple': '#a855f7',
    'pass': '#28a745',
    'fail': '#dc3545',
    'warning': '#ffc107',
    'info': '#17a2b8',
}

PRIORITY_COLORS = {
    'high': COLORS['fail'],
    'medium': COLORS['warning'],
    'low': COLORS['info'],
}

IMPORTANCE_COLORS = {
    'high': COLORS['fail'],
    'medium': COLORS['warning'],
    'low': COLORS['info'],
}


def register_korean_fonts():
    """한글 폰트 등록"""
    global FONT_NAME, FONT_NAME_BOLD

    try:
        font_paths = [
            ("C:/Windows/Fonts/malgun.ttf", "C:/Windows/Fonts/malgunbd.ttf"),
            ("C:/Windows/Fonts/NanumGothic.ttf", "C:/Windows/Fonts/NanumGothicBold.ttf"),
        ]

        for regular, bold in font_paths:
            if os.path.exists(regular):
                pdfmetrics.registerFont(TTFont('KoreanFont', regular))
                if os.path.exists(bold):
                    pdfmetrics.registerFont(TTFont('KoreanFontBold', bold))
                else:
                    pdfmetrics.registerFont(TTFont('KoreanFontBold', regular))

                FONT_NAME = 'KoreanFont'
                FONT_NAME_BOLD = 'KoreanFontBold'
                return True

    except Exception as e:
        print(f"Font registration error: {e}")

    return False


# =============================================================================
# 스타일 시스템
# =============================================================================

def create_styles():
    """문서 스타일 생성"""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='DocTitle',
        fontName=FONT_NAME_BOLD,
        fontSize=18,
        leading=22,
        alignment=TA_LEFT,
        spaceAfter=2,
        textColor=colors.HexColor(COLORS['black']),
    ))

    styles.add(ParagraphStyle(
        name='DocSubtitle',
        fontName=FONT_NAME,
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        spaceAfter=2,
        textColor=colors.HexColor(COLORS['gray']),
    ))

    styles.add(ParagraphStyle(
        name='SectionNumber',
        fontName=FONT_NAME_BOLD,
        fontSize=9,
        leading=12,
        alignment=TA_LEFT,
        textColor=colors.HexColor(COLORS['gray']),
    ))

    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName=FONT_NAME_BOLD,
        fontSize=12,
        leading=16,
        alignment=TA_LEFT,
        spaceAfter=8,
        textColor=colors.HexColor(COLORS['black']),
    ))

    styles.add(ParagraphStyle(
        name='SectionDesc',
        fontName=FONT_NAME,
        fontSize=8,
        leading=12,
        alignment=TA_LEFT,
        textColor=colors.HexColor(COLORS['gray']),
    ))

    styles.add(ParagraphStyle(
        name='Body',
        fontName=FONT_NAME,
        fontSize=9,
        leading=13,
        spaceAfter=6,
        textColor=colors.HexColor(COLORS['dark']),
    ))

    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName=FONT_NAME_BOLD,
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor(COLORS['white']),
    ))

    styles.add(ParagraphStyle(
        name='TableCell',
        fontName=FONT_NAME,
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
        textColor=colors.HexColor(COLORS['dark']),
    ))

    styles.add(ParagraphStyle(
        name='TableCellCenter',
        fontName=FONT_NAME,
        fontSize=8,
        leading=11,
        alignment=TA_CENTER,
        textColor=colors.HexColor(COLORS['dark']),
    ))

    styles.add(ParagraphStyle(
        name='MetricValue',
        fontName=FONT_NAME_BOLD,
        fontSize=20,
        leading=24,
        alignment=TA_CENTER,
        textColor=colors.HexColor(COLORS['black']),
    ))

    styles.add(ParagraphStyle(
        name='MetricLabel',
        fontName=FONT_NAME,
        fontSize=7,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor(COLORS['gray']),
    ))

    styles.add(ParagraphStyle(
        name='Footer',
        fontName=FONT_NAME,
        fontSize=7,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.HexColor(COLORS['gray_light']),
    ))

    styles.add(ParagraphStyle(
        name='PageHeader',
        fontName=FONT_NAME,
        fontSize=8,
        leading=10,
        alignment=TA_LEFT,
        textColor=colors.HexColor(COLORS['gray']),
    ))

    return styles


# =============================================================================
# 유틸리티 함수
# =============================================================================

def get_priority_label(priority):
    labels = {'high': '높음', 'medium': '중간', 'low': '낮음'}
    return labels.get(priority, priority)


def get_importance_label(importance):
    labels = {'high': '높음', 'medium': '중간', 'low': '낮음'}
    return labels.get(importance, importance)


def create_two_column_section(left_content, right_content):
    """좌우 2단 레이아웃 생성"""
    layout_table = Table(
        [[left_content, right_content]],
        colWidths=[LEFT_COL_WIDTH, RIGHT_COL_WIDTH]
    )
    layout_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return layout_table


def create_left_column(section_title, description, styles):
    """왼쪽 컬럼 (제목 + 설명) 생성"""
    content = []
    content.append(Paragraph(f"<b>{section_title}</b>", styles['SectionTitle']))
    content.append(Spacer(1, 4))
    content.append(Paragraph(description, styles['SectionDesc']))

    # Table로 감싸서 반환
    left_table = Table([[c] for c in content], colWidths=[LEFT_COL_WIDTH - 0.5*cm])
    left_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return left_table


# =============================================================================
# 섹션 생성 함수
# =============================================================================

def create_header(data: dict, styles) -> list:
    """문서 헤더"""
    elements = []

    brand_name = data.get('brandName', '')
    analyzed_at = data.get('metadata', {}).get('analyzedAt', '')

    if analyzed_at:
        try:
            dt = datetime.fromisoformat(analyzed_at.replace('Z', '+00:00'))
            formatted_date = dt.strftime('%Y-%m-%d')
        except:
            formatted_date = analyzed_at
    else:
        formatted_date = datetime.now().strftime('%Y-%m-%d')

    # 상단 헤더 라인
    header_data = [[
        Paragraph(f"<b>{brand_name}</b>", styles['PageHeader']),
        Paragraph("AI INSIGHTS REPORT", styles['PageHeader']),
    ]]
    header_table = Table(header_data, colWidths=[8*cm, 8.5*cm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # 메인 타이틀
    elements.append(Paragraph("AI Insights Report", styles['DocTitle']))
    elements.append(Paragraph(f"AI 응답 패턴 분석 리포트 | {formatted_date}", styles['DocSubtitle']))
    elements.append(Spacer(1, 20))

    return elements


def create_summary_section(data: dict, styles) -> list:
    """01. SUMMARY 섹션 - 좌우 분리"""
    elements = []

    metadata = data.get('metadata', {})
    total_responses = metadata.get('totalResponses', 0)
    cited_responses = metadata.get('citedResponses', 0)
    citation_rate = round((cited_responses / total_responses * 100) if total_responses > 0 else 0)
    keywords_count = len(data.get('commonKeywords', []))
    actions_count = len(data.get('actionableInsights', []))

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Analysis Summary",
        "AI 응답 분석 결과의 핵심 지표입니다. 전체 분석 현황과 인용 성공률을 확인할 수 있습니다.",
        styles
    )

    # 오른쪽: 데이터 테이블
    summary_data = [
        [
            Paragraph("분석 응답", styles['TableHeader']),
            Paragraph("인용 성공", styles['TableHeader']),
            Paragraph("인용률", styles['TableHeader']),
            Paragraph("키워드", styles['TableHeader']),
            Paragraph("액션", styles['TableHeader']),
        ],
        [
            Paragraph(f"<b>{total_responses}</b>", styles['TableCellCenter']),
            Paragraph(f"<b>{cited_responses}</b>", styles['TableCellCenter']),
            Paragraph(f"<b>{citation_rate}%</b>", styles['TableCellCenter']),
            Paragraph(f"<b>{keywords_count}</b>", styles['TableCellCenter']),
            Paragraph(f"<b>{actions_count}</b>", styles['TableCellCenter']),
        ],
    ]

    right_table = Table(summary_data, colWidths=[2.2*cm, 2.2*cm, 2.2*cm, 2.2*cm, 2.2*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_keywords_section(data: dict, styles) -> list:
    """02. KEYWORDS 섹션 - 좌우 분리"""
    elements = []

    keywords = data.get('commonKeywords', [])
    if not keywords:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Target Keywords",
        "AI가 응답에서 자주 언급하는 핵심 키워드입니다. 콘텐츠 제작 시 이 키워드들을 포함하면 인용 확률이 높아집니다.",
        styles
    )

    # 오른쪽: 키워드 테이블
    header_row = [
        Paragraph("키워드", styles['TableHeader']),
        Paragraph("설명", styles['TableHeader']),
    ]
    table_data = [header_row]

    for kw in keywords[:10]:
        description = kw.get('description', '')
        if len(description) > 50:
            description = description[:50] + '...'

        row = [
            Paragraph(f"<b>{kw.get('keyword', '')}</b>", styles['TableCell']),
            Paragraph(description, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[3.5*cm, 8*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_category_section(data: dict, styles) -> list:
    """03. CATEGORY INSIGHTS 섹션 - 좌우 분리"""
    elements = []

    categories = data.get('categoryInsights', [])
    if not categories:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Category Insights",
        "카테고리별로 분석된 AI 응답 패턴과 전략적 권장사항입니다.",
        styles
    )

    # 오른쪽: 카테고리 테이블
    header_row = [
        Paragraph("카테고리", styles['TableHeader']),
        Paragraph("권장사항", styles['TableHeader']),
    ]
    table_data = [header_row]

    for cat in categories[:8]:
        recommendation = cat.get('recommendation', '')
        if len(recommendation) > 60:
            recommendation = recommendation[:60] + '...'

        row = [
            Paragraph(f"<b>{cat.get('category', '')}</b>", styles['TableCell']),
            Paragraph(recommendation, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[3.5*cm, 8*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_patterns_section(data: dict, styles) -> list:
    """04. CITATION PATTERNS 섹션 - 좌우 분리"""
    elements = []

    patterns = data.get('citationPatterns', {})
    cited = patterns.get('citedPatterns', [])
    uncited = patterns.get('uncitedPatterns', [])

    if not cited and not uncited:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Citation Patterns",
        "브랜드가 인용될 때와 인용되지 않을 때의 응답 패턴 차이를 분석한 결과입니다.",
        styles
    )

    # 오른쪽: 패턴 테이블
    header_row = [
        Paragraph("인용 성공 패턴", styles['TableHeader']),
        Paragraph("인용 실패 패턴", styles['TableHeader']),
    ]
    table_data = [header_row]

    max_rows = max(len(cited), len(uncited), 1)
    for i in range(min(max_rows, 5)):
        cited_text = cited[i] if i < len(cited) else ""
        uncited_text = uncited[i] if i < len(uncited) else ""

        if isinstance(cited_text, dict):
            cited_text = str(cited_text)
        if isinstance(uncited_text, dict):
            uncited_text = str(uncited_text)

        row = [
            Paragraph(cited_text, styles['TableCell']),
            Paragraph(uncited_text, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[5.75*cm, 5.75*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor(COLORS['pass'])),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor(COLORS['fail'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_content_gaps_section(data: dict, styles) -> list:
    """05. CONTENT GAPS 섹션 - 좌우 분리"""
    elements = []

    gaps = data.get('contentGaps', [])
    if not gaps:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Content Gaps",
        "현재 콘텐츠에서 부족한 영역과 개선이 필요한 부분입니다.",
        styles
    )

    # 오른쪽: 갭 테이블
    header_row = [
        Paragraph("영역", styles['TableHeader']),
        Paragraph("권장사항", styles['TableHeader']),
    ]
    table_data = [header_row]

    for gap in gaps[:6]:
        recommendation = gap.get('recommendation', '')
        if len(recommendation) > 50:
            recommendation = recommendation[:50] + '...'

        row = [
            Paragraph(f"<b>{gap.get('area', '')}</b>", styles['TableCell']),
            Paragraph(recommendation, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[3.5*cm, 8*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['warning'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor(COLORS['dark'])),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_actions_section(data: dict, styles) -> list:
    """06. ACTION GUIDE 섹션 - 좌우 분리"""
    elements = []

    actions = data.get('actionableInsights', [])
    if not actions:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Action Guide",
        "AI 가시성 향상을 위한 실행 가이드입니다. 우선순위에 따라 단계적으로 실행하세요.",
        styles
    )

    # 오른쪽: 액션 테이블
    header_row = [
        Paragraph("액션", styles['TableHeader']),
        Paragraph("설명", styles['TableHeader']),
        Paragraph("우선순위", styles['TableHeader']),
    ]
    table_data = [header_row]

    for action in actions[:6]:
        priority = action.get('priority', 'low')
        priority_color = PRIORITY_COLORS.get(priority, COLORS['gray'])
        priority_label = get_priority_label(priority)

        description = action.get('description', '')
        if len(description) > 40:
            description = description[:40] + '...'

        row = [
            Paragraph(f"<b>{action.get('title', '')}</b>", styles['TableCell']),
            Paragraph(description, styles['TableCell']),
            Paragraph(f"<font color='{priority_color}'><b>{priority_label}</b></font>", styles['TableCellCenter']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[4*cm, 5.5*cm, 2*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_footer(styles) -> list:
    """푸터"""
    elements = []
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        f"Generated by GEO Tracker | {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        styles['Footer']
    ))
    return elements


# =============================================================================
# 메인 PDF 생성 함수
# =============================================================================

def generate_pdf(data: dict, output_path: str):
    """PDF 문서 생성"""
    register_korean_fonts()
    styles = create_styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm,
        title='AI Insights Report',
        author='GEO Tracker',
    )

    elements = []

    # Header
    elements.extend(create_header(data, styles))

    # 01. Summary
    elements.extend(create_summary_section(data, styles))

    # 02. Keywords
    elements.extend(create_keywords_section(data, styles))

    # 03. Category Insights
    elements.extend(create_category_section(data, styles))

    # Page Break
    elements.append(PageBreak())

    # 상단 헤더 반복
    brand_name = data.get('brandName', '')
    header_data = [[
        Paragraph(f"<b>{brand_name}</b>", styles['PageHeader']),
        Paragraph("AI INSIGHTS REPORT", styles['PageHeader']),
    ]]
    header_table = Table(header_data, colWidths=[8*cm, 8.5*cm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # 04. Citation Patterns
    elements.extend(create_patterns_section(data, styles))

    # 05. Content Gaps
    elements.extend(create_content_gaps_section(data, styles))

    # 06. Action Guide
    elements.extend(create_actions_section(data, styles))

    # Footer
    elements.extend(create_footer(styles))

    doc.build(elements)
    return output_path


def main():
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 3:
        print("Usage: python generate_insights_pdf.py <input_json> <output_pdf>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f"Error loading JSON: {str(e)}"
        }, ensure_ascii=False))
        sys.exit(1)

    try:
        result_path = generate_pdf(data, output_path)
        print(json.dumps({
            'success': True,
            'path': result_path
        }, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }, ensure_ascii=False))
        sys.exit(1)


if __name__ == '__main__':
    main()
