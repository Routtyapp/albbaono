# -*- coding: utf-8 -*-
"""
GEO Visibility Audit Report PDF Generator
좌우 분리 레이아웃: 왼쪽(섹션 설명) / 오른쪽(데이터/차트)
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
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
    'pass': '#28a745',
    'fail': '#dc3545',
    'warning': '#ffc107',
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
        fontSize=18,
        leading=22,
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

def get_verdict_color(value, threshold_pass=50, threshold_warn=30):
    if value >= threshold_pass:
        return COLORS['pass']
    elif value >= threshold_warn:
        return COLORS['warning']
    return COLORS['fail']


def get_verdict_text(value, threshold=50):
    return "PASS" if value >= threshold else "FAIL"


def get_change_display(change):
    if change > 0:
        return f"+{change}", COLORS['pass']
    elif change < 0:
        return str(change), COLORS['fail']
    return "0", COLORS['gray']


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

    report_type = "MONTHLY" if data.get('type') == 'monthly' else "WEEKLY"
    period = data.get('period', '')
    generated_at = data.get('generatedAt', datetime.now().strftime('%Y-%m-%d'))

    # 상단 헤더 라인
    header_data = [[
        Paragraph(f"<b>{report_type} REPORT</b>", styles['PageHeader']),
        Paragraph("GEO VISIBILITY AUDIT", styles['PageHeader']),
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
    elements.append(Paragraph("GEO Visibility Report", styles['DocTitle']))
    elements.append(Paragraph(f"{period} | Generated: {generated_at}", styles['DocSubtitle']))
    elements.append(Spacer(1, 20))

    return elements


def create_summary_section(data: dict, styles) -> list:
    """Executive Summary 섹션 - 좌우 분리"""
    elements = []

    metrics = data.get('metrics', {})
    citation_rate = metrics.get('citationRate', 0)
    citation_change = metrics.get('citationRateChange', 0)
    total_tests = metrics.get('totalTests', 0)
    sov = metrics.get('shareOfVoice', 0)

    change_text, change_color = get_change_display(citation_change)
    verdict_color = get_verdict_color(citation_rate)
    verdict_text = get_verdict_text(citation_rate)

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Executive Summary",
        "분석 기간 동안의 AI 가시성 핵심 지표입니다. 인용률과 테스트 현황을 한눈에 확인할 수 있습니다.",
        styles
    )

    # 오른쪽: 메트릭 테이블
    summary_data = [
        [
            Paragraph("Citation Rate", styles['TableHeader']),
            Paragraph("Total Tests", styles['TableHeader']),
            Paragraph("Share of Voice", styles['TableHeader']),
            Paragraph("Verdict", styles['TableHeader']),
        ],
        [
            Paragraph(f"<b>{citation_rate}%</b>", styles['TableCellCenter']),
            Paragraph(f"<b>{total_tests}</b>", styles['TableCellCenter']),
            Paragraph(f"<b>{sov}%</b>", styles['TableCellCenter']),
            Paragraph(f"<font color='{verdict_color}'><b>{verdict_text}</b></font>", styles['TableCellCenter']),
        ],
        [
            Paragraph(f"<font color='{change_color}'>{change_text}%p</font>", styles['TableCellCenter']),
            Paragraph("-", styles['TableCellCenter']),
            Paragraph("-", styles['TableCellCenter']),
            Paragraph("-", styles['TableCellCenter']),
        ],
    ]

    right_table = Table(summary_data, colWidths=[2.8*cm, 2.8*cm, 2.8*cm, 2.8*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_findings_section(data: dict, styles) -> list:
    """Key Findings 섹션 - 좌우 분리"""
    elements = []

    highlights = data.get('highlights', [])
    if not highlights:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Key Findings",
        "분석 기간 동안 발견된 주요 인사이트와 성과 지표입니다.",
        styles
    )

    # 오른쪽: 파인딩 테이블
    header_row = [
        Paragraph("No.", styles['TableHeader']),
        Paragraph("Finding", styles['TableHeader']),
    ]
    table_data = [header_row]

    for i, highlight in enumerate(highlights[:5], 1):
        row = [
            Paragraph(f"{i:02d}", styles['TableCellCenter']),
            Paragraph(highlight, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[1.2*cm, 10.3*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
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


def create_engine_section(data: dict, styles, charts_dir: str) -> list:
    """Engine Performance 섹션 - 좌우 분리"""
    elements = []

    engine_data = data.get('enginePerformance', [])
    if not engine_data:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Engine Performance",
        "AI 엔진별 인용 성과를 비교 분석한 결과입니다. 각 엔진의 인용률과 변화 추이를 확인하세요.",
        styles
    )

    # 오른쪽: 엔진 테이블
    header_row = [
        Paragraph("Engine", styles['TableHeader']),
        Paragraph("Rate", styles['TableHeader']),
        Paragraph("Tests", styles['TableHeader']),
        Paragraph("Change", styles['TableHeader']),
        Paragraph("Status", styles['TableHeader']),
    ]
    table_data = [header_row]

    for engine in engine_data[:5]:
        rate = engine.get('citationRate', 0)
        change = engine.get('change', 0)
        change_text, change_color = get_change_display(change)
        verdict = get_verdict_text(rate)
        verdict_color = get_verdict_color(rate)

        row = [
            Paragraph(f"<b>{str(engine.get('engine', '')).upper()}</b>", styles['TableCell']),
            Paragraph(f"{rate}%", styles['TableCellCenter']),
            Paragraph(str(engine.get('totalTests', 0)), styles['TableCellCenter']),
            Paragraph(f"<font color='{change_color}'>{change_text}%p</font>", styles['TableCellCenter']),
            Paragraph(f"<font color='{verdict_color}'><b>{verdict}</b></font>", styles['TableCellCenter']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[3*cm, 2*cm, 2*cm, 2.2*cm, 2.3*cm])
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


def create_query_section(data: dict, styles, charts_dir: str) -> list:
    """Query Analysis 섹션 - 좌우 분리"""
    elements = []

    top_queries = data.get('topQueries', [])
    if not top_queries:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Top Queries",
        "인용률이 높은 쿼리 목록입니다. 성과가 좋은 쿼리 유형을 파악하여 전략에 활용하세요.",
        styles
    )

    # 오른쪽: 쿼리 테이블
    header_row = [
        Paragraph("Query", styles['TableHeader']),
        Paragraph("Rate", styles['TableHeader']),
        Paragraph("Status", styles['TableHeader']),
    ]
    table_data = [header_row]

    for q in top_queries[:6]:
        query_text = q.get('query', '')
        if len(query_text) > 35:
            query_text = query_text[:35] + '...'

        rate = q.get('citationRate', 0)
        status = "PASS" if rate >= 50 else "FAIL"
        status_color = COLORS['pass'] if rate >= 50 else COLORS['fail']

        row = [
            Paragraph(query_text, styles['TableCell']),
            Paragraph(f"{rate}%", styles['TableCellCenter']),
            Paragraph(f"<font color='{status_color}'><b>{status}</b></font>", styles['TableCellCenter']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[7.5*cm, 2*cm, 2*cm])
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


def create_worst_query_section(data: dict, styles) -> list:
    """Improvement Required 섹션 - 좌우 분리"""
    elements = []

    worst_queries = data.get('worstQueries', [])
    if not worst_queries:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Needs Improvement",
        "인용률이 낮아 개선이 필요한 쿼리입니다. 콘텐츠 최적화를 통해 성과를 높일 수 있습니다.",
        styles
    )

    # 오른쪽: 쿼리 테이블
    header_row = [
        Paragraph("Query", styles['TableHeader']),
        Paragraph("Rate", styles['TableHeader']),
        Paragraph("Status", styles['TableHeader']),
    ]
    table_data = [header_row]

    for q in worst_queries[:6]:
        query_text = q.get('query', '')
        if len(query_text) > 35:
            query_text = query_text[:35] + '...'

        rate = q.get('citationRate', 0)

        row = [
            Paragraph(query_text, styles['TableCell']),
            Paragraph(f"{rate}%", styles['TableCellCenter']),
            Paragraph(f"<font color='{COLORS['fail']}'><b>FAIL</b></font>", styles['TableCellCenter']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[7.5*cm, 2*cm, 2*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['fail'])),
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


def create_ai_summary_section(data: dict, styles) -> list:
    """AI 종합 분석 섹션 - 좌우 분리"""
    elements = []

    ai = data.get('aiAnalysis')
    if not ai or not ai.get('summary'):
        return elements

    left = create_left_column(
        "AI Analysis",
        "AI가 데이터를 분석하여 도출한 종합 인사이트입니다. 핵심 추세와 전략적 시사점을 확인하세요.",
        styles
    )

    # 오른쪽: 요약 + 하이라이트
    right_elements = []
    right_elements.append(Paragraph(ai['summary'], styles['Body']))
    right_elements.append(Spacer(1, 8))

    ai_highlights = ai.get('highlights', [])
    if ai_highlights:
        for i, h in enumerate(ai_highlights[:5], 1):
            right_elements.append(Paragraph(
                f"<font color='{COLORS['gray']}'>{i:02d}</font>  {h}",
                styles['Body']
            ))

    right_table = Table([[c] for c in right_elements], colWidths=[RIGHT_COL_WIDTH - 0.5*cm])
    right_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_ai_category_section(data: dict, styles) -> list:
    """AI 카테고리별 분석 섹션 - 좌우 분리"""
    elements = []

    ai = data.get('aiAnalysis')
    if not ai:
        return elements

    cat_analysis = ai.get('categoryAnalysis', [])
    if not cat_analysis:
        return elements

    left = create_left_column(
        "Category Insights",
        "카테고리별 인용 성과와 원인 분석입니다. 각 카테고리의 강점과 개선 방향을 파악하세요.",
        styles
    )

    header_row = [
        Paragraph("Category", styles['TableHeader']),
        Paragraph("Rate", styles['TableHeader']),
        Paragraph("Insight", styles['TableHeader']),
    ]
    table_data = [header_row]

    for ca in cat_analysis[:6]:
        category = ca.get('category', '')
        rate = ca.get('citationRate', 0)
        insight = ca.get('insight', '')
        if len(insight) > 80:
            insight = insight[:80] + '...'

        rate_color = get_verdict_color(rate)

        row = [
            Paragraph(f"<b>{category}</b>", styles['TableCell']),
            Paragraph(f"<font color='{rate_color}'><b>{rate}%</b></font>", styles['TableCellCenter']),
            Paragraph(insight, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[2.5*cm, 1.8*cm, 7.2*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4c1d95')),
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


def create_ai_competitor_section(data: dict, styles) -> list:
    """AI 경쟁사 분석 섹션 - 좌우 분리"""
    elements = []

    ai = data.get('aiAnalysis')
    if not ai or not ai.get('competitorAnalysis'):
        return elements

    left = create_left_column(
        "Competitor Analysis",
        "AI 검색 결과에서의 경쟁사 포지셔닝 분석입니다. 차별화 전략 수립에 활용하세요.",
        styles
    )

    right_elements = []
    right_elements.append(Paragraph(ai['competitorAnalysis'], styles['Body']))

    right_table = Table([[c] for c in right_elements], colWidths=[RIGHT_COL_WIDTH - 0.5*cm])
    right_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_ai_action_items_section(data: dict, styles) -> list:
    """AI 개선 제안 섹션 - 좌우 분리"""
    elements = []

    ai = data.get('aiAnalysis')
    if not ai:
        return elements

    action_items = ai.get('actionItems', [])
    if not action_items:
        return elements

    left = create_left_column(
        "Action Items",
        "AI 분석 기반의 구체적 개선 제안입니다. 우선순위에 따라 실행하세요.",
        styles
    )

    header_row = [
        Paragraph("No.", styles['TableHeader']),
        Paragraph("Action Item", styles['TableHeader']),
    ]
    table_data = [header_row]

    for i, item in enumerate(action_items[:7], 1):
        if len(item) > 100:
            item = item[:100] + '...'
        row = [
            Paragraph(f"<b>{i:02d}</b>", styles['TableCellCenter']),
            Paragraph(item, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[1.2*cm, 10.3*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#065f46')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
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


def create_recommendation_section(data: dict, styles) -> list:
    """Recommendations 섹션 - 좌우 분리"""
    elements = []

    metrics = data.get('metrics', {})
    citation_rate = metrics.get('citationRate', 0)
    citation_change = metrics.get('citationRateChange', 0)

    recommendations = []

    if citation_rate < 30:
        recommendations.append(("HIGH", "콘텐츠 구조화 개선 필요"))
        recommendations.append(("HIGH", "타겟 키워드 재검토"))
    elif citation_rate < 60:
        recommendations.append(("MEDIUM", "현 전략 유지 및 모니터링"))
        recommendations.append(("MEDIUM", "콘텐츠 A/B 테스트 수행"))
    else:
        recommendations.append(("LOW", "신규 쿼리 영역 확장 검토"))
        recommendations.append(("LOW", "경쟁사 모니터링 강화"))

    if citation_change < 0:
        recommendations.append(("HIGH", "하락 원인 분석 필요"))

    if not recommendations:
        return elements

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Recommendations",
        "분석 결과를 바탕으로 도출된 전략적 권장사항입니다. 우선순위에 따라 실행하세요.",
        styles
    )

    # 오른쪽: 권장사항 테이블
    priority_colors = {
        "HIGH": COLORS['fail'],
        "MEDIUM": COLORS['warning'],
        "LOW": COLORS['pass'],
    }

    header_row = [
        Paragraph("Priority", styles['TableHeader']),
        Paragraph("Recommendation", styles['TableHeader']),
    ]
    table_data = [header_row]

    for priority, rec in recommendations[:5]:
        color = priority_colors.get(priority, COLORS['gray'])
        row = [
            Paragraph(f"<font color='{color}'><b>{priority}</b></font>", styles['TableCellCenter']),
            Paragraph(rec, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[2.5*cm, 9*cm])
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

def generate_pdf(data: dict, charts_dir: str, output_path: str):
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
        title='GEO Visibility Audit Report',
        author='GEO Tracker',
    )

    elements = []

    # Header
    elements.extend(create_header(data, styles))

    # Summary
    elements.extend(create_summary_section(data, styles))

    # Key Findings
    elements.extend(create_findings_section(data, styles))

    # Engine Performance
    elements.extend(create_engine_section(data, styles, charts_dir))

    # Page Break
    elements.append(PageBreak())

    # 상단 헤더 반복
    report_type = "MONTHLY" if data.get('type') == 'monthly' else "WEEKLY"
    header_data = [[
        Paragraph(f"<b>{report_type} REPORT</b>", styles['PageHeader']),
        Paragraph("GEO VISIBILITY AUDIT", styles['PageHeader']),
    ]]
    header_table = Table(header_data, colWidths=[8*cm, 8.5*cm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # AI Analysis Sections (aiAnalysis가 있을 때만 렌더링)
    if data.get('aiAnalysis'):
        elements.extend(create_ai_summary_section(data, styles))
        elements.extend(create_ai_category_section(data, styles))
        elements.extend(create_ai_competitor_section(data, styles))
        elements.extend(create_ai_action_items_section(data, styles))

        # AI 섹션이 있으면 새 페이지에서 쿼리 섹션 시작
        elements.append(PageBreak())
        header_data2 = [[
            Paragraph(f"<b>{report_type} REPORT</b>", styles['PageHeader']),
            Paragraph("GEO VISIBILITY AUDIT", styles['PageHeader']),
        ]]
        header_table2 = Table(header_data2, colWidths=[8*cm, 8.5*cm])
        header_table2.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        elements.append(header_table2)
        elements.append(Spacer(1, 20))

    # Top Queries
    elements.extend(create_query_section(data, styles, charts_dir))

    # Worst Queries
    elements.extend(create_worst_query_section(data, styles))

    # Recommendations
    elements.extend(create_recommendation_section(data, styles))

    # Footer
    elements.extend(create_footer(styles))

    doc.build(elements)
    return output_path


def main():
    """메인 함수"""
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 4:
        print("Usage: python generate_pdf.py <input_json> <charts_dir> <output_pdf>")
        sys.exit(1)

    input_path = sys.argv[1]
    charts_dir = sys.argv[2]
    output_path = sys.argv[3]

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
        result_path = generate_pdf(data, charts_dir, output_path)
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
