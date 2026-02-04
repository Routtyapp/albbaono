# -*- coding: utf-8 -*-
"""
GEO Score Audit Report PDF Generator
좌우 분리 레이아웃: 왼쪽(섹션 설명) / 오른쪽(데이터/시각자료)
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

# 컬러 시스템: 흑백 + 회색 기반, 판단 지표만 색상 사용
COLORS = {
    'black': '#000000',
    'dark': '#1a1a1a',
    'gray_dark': '#343a40',
    'gray': '#6c757d',
    'gray_light': '#adb5bd',
    'gray_lighter': '#dee2e6',
    'gray_lightest': '#f8f9fa',
    'white': '#ffffff',
    # 판단 색상
    'pass': '#28a745',
    'fail': '#dc3545',
    'warning': '#ffc107',
}

# 등급별 색상 (판단 색상 사용)
GRADE_COLORS = {
    'A+': COLORS['pass'],
    'A': COLORS['pass'],
    'B+': COLORS['pass'],
    'B': COLORS['warning'],
    'C+': COLORS['warning'],
    'C': COLORS['warning'],
    'D': COLORS['fail'],
    'F': COLORS['fail'],
}

# 카테고리 한글명
CATEGORY_LABELS = {
    'structure': 'STRUCTURE',
    'schema': 'SCHEMA',
    'url': 'URL',
    'meta': 'META',
    'content': 'CONTENT',
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
    """감사 문서 스타일 생성"""
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
        name='SubSection',
        fontName=FONT_NAME_BOLD,
        fontSize=10,
        leading=14,
        spaceBefore=12,
        spaceAfter=8,
        textColor=colors.HexColor(COLORS['gray_dark']),
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
        alignment=TA_CENTER,
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
        name='ScoreValue',
        fontName=FONT_NAME_BOLD,
        fontSize=36,
        leading=40,
        alignment=TA_CENTER,
        textColor=colors.HexColor(COLORS['black']),
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
        name='GradeValue',
        fontName=FONT_NAME_BOLD,
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
    ))

    styles.add(ParagraphStyle(
        name='PageHeader',
        fontName=FONT_NAME,
        fontSize=8,
        leading=10,
        alignment=TA_LEFT,
        textColor=colors.HexColor(COLORS['gray']),
    ))

    styles.add(ParagraphStyle(
        name='Verdict',
        fontName=FONT_NAME_BOLD,
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
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
        name='Certification',
        fontName=FONT_NAME,
        fontSize=9,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor(COLORS['gray_dark']),
    ))

    return styles


# =============================================================================
# 유틸리티 함수
# =============================================================================

def create_divider():
    """구분선 생성"""
    return HRFlowable(
        width="100%",
        thickness=0.5,
        color=colors.HexColor(COLORS['gray_lighter']),
        spaceBefore=10,
        spaceAfter=10
    )


def create_thick_divider():
    """굵은 구분선"""
    return HRFlowable(
        width="100%",
        thickness=2,
        color=colors.HexColor(COLORS['black']),
        spaceBefore=6,
        spaceAfter=6
    )


def get_score_verdict(percentage):
    """점수에 따른 판단"""
    if percentage >= 70:
        return "PASS", COLORS['pass']
    elif percentage >= 50:
        return "WARN", COLORS['warning']
    return "FAIL", COLORS['fail']


def get_grade_color(grade):
    """등급에 따른 색상"""
    return GRADE_COLORS.get(grade, COLORS['gray'])


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

    url = data.get('url', '')
    analyzed_at = data.get('analyzedAt', '')

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
        Paragraph(f"<b>GEO SCORE</b>", styles['DocSubtitle']),
        Paragraph("SITE OPTIMIZATION AUDIT", styles['DocSubtitle']),
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
    elements.append(Paragraph("GEO Score Audit Report", styles['DocTitle']))
    if url:
        elements.append(Paragraph(f"Target: {url} | {formatted_date}", styles['DocSubtitle']))
    else:
        elements.append(Paragraph(f"Analyzed: {formatted_date}", styles['DocSubtitle']))
    elements.append(Spacer(1, 20))

    return elements


def create_score_summary(data: dict, styles) -> list:
    """01. SCORE SUMMARY 섹션 - 좌우 분리"""
    elements = []

    total_score = data.get('totalScore', 0)
    grade = data.get('grade', 'F')
    pages_count = len(data.get('pages', []))

    grade_color = get_grade_color(grade)
    verdict, verdict_color = get_score_verdict(total_score)

    # 등급 설명
    grade_descriptions = {
        'A+': 'GEO 최적화가 최상위 수준입니다.',
        'A': 'GEO 최적화가 높은 기준을 충족합니다.',
        'B+': 'GEO 최적화가 평균 이상입니다.',
        'B': '기본적인 GEO 최적화가 적용되어 있습니다.',
        'C+': '일부 개선이 권장됩니다.',
        'C': '상당한 개선이 필요합니다.',
        'D': '주요 개선이 필요합니다.',
        'F': '종합적인 GEO 최적화가 필요합니다.',
    }

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Score Summary",
        f"사이트의 GEO 최적화 점수와 등급입니다. {grade_descriptions.get(grade, '')}",
        styles
    )

    # 오른쪽: 점수 테이블
    score_data = [
        [
            Paragraph("SCORE", styles['TableHeader']),
            Paragraph("GRADE", styles['TableHeader']),
            Paragraph("PAGES", styles['TableHeader']),
            Paragraph("VERDICT", styles['TableHeader']),
        ],
        [
            Paragraph(f"<b>{total_score}</b>", styles['MetricValue']),
            Paragraph(f"<font color='{grade_color}'><b>{grade}</b></font>", styles['GradeValue']),
            Paragraph(f"<b>{pages_count}</b>", styles['GradeValue']),
            Paragraph(f"<font color='{verdict_color}'><b>{verdict}</b></font>", styles['Verdict']),
        ],
        [
            Paragraph("/ 100", styles['TableCellCenter']),
            Paragraph("", styles['TableCellCenter']),
            Paragraph("pages", styles['TableCellCenter']),
            Paragraph("", styles['TableCellCenter']),
        ],
    ]

    right_table = Table(score_data, colWidths=[2.8*cm, 2.8*cm, 2.8*cm, 2.8*cm], rowHeights=[None, 40, 16])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
        ('VALIGN', (0, 1), (-1, 1), 'BOTTOM'),
        ('VALIGN', (0, 2), (-1, 2), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 1), (-1, 1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 0),
        ('TOPPADDING', (0, 2), (-1, 2), 0),
        ('BOTTOMPADDING', (0, 2), (-1, 2), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def create_category_section(data: dict, styles) -> list:
    """02. CATEGORY ANALYSIS 섹션 - 좌우 분리"""
    elements = []

    categories = data.get('categories', {})

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Category Analysis",
        "5개 핵심 카테고리별 최적화 점수입니다. 각 영역의 성과를 확인하고 개선이 필요한 부분을 파악하세요.",
        styles
    )

    # 오른쪽: 카테고리 테이블
    header_row = [
        Paragraph("CATEGORY", styles['TableHeader']),
        Paragraph("SCORE", styles['TableHeader']),
        Paragraph("RATE", styles['TableHeader']),
        Paragraph("STATUS", styles['TableHeader']),
    ]
    table_data = [header_row]

    for key, cat in categories.items():
        label = CATEGORY_LABELS.get(key, key.upper())
        score = cat.get('score', 0)
        max_score = cat.get('maxScore', 0)
        percentage = cat.get('percentage', 0)

        verdict, verdict_color = get_score_verdict(percentage)

        row = [
            Paragraph(f"<b>{label}</b>", styles['TableCell']),
            Paragraph(f"{score} / {max_score}", styles['TableCellCenter']),
            Paragraph(f"{percentage}%", styles['TableCellCenter']),
            Paragraph(f"<font color='{verdict_color}'><b>{verdict}</b></font>", styles['TableCellCenter']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[3.5*cm, 3*cm, 2.5*cm, 2.5*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
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


def create_detail_section(data: dict, styles) -> list:
    """03. DETAILED ANALYSIS 섹션 - 좌우 분리"""
    elements = []

    categories = data.get('categories', {})

    # 카테고리별 설명
    category_descriptions = {
        'structure': 'HTML 구조, 헤딩 계층, 시맨틱 마크업 등 문서 구조 최적화 항목입니다.',
        'schema': 'Schema.org 구조화 데이터 마크업의 적용 현황입니다.',
        'url': 'URL 구조, 경로 명확성, 키워드 포함 여부 등을 평가합니다.',
        'meta': '메타 태그, 오픈그래프, 설명문 등 메타데이터 항목입니다.',
        'content': '콘텐츠 품질, 키워드 밀도, 가독성 등을 평가합니다.',
    }

    for key, cat in categories.items():
        label = CATEGORY_LABELS.get(key, key.upper())
        items = cat.get('items', [])

        if not items:
            continue

        # 왼쪽: 카테고리 설명
        left = create_left_column(
            f"{label}",
            category_descriptions.get(key, f'{label} 관련 세부 항목별 점수입니다.'),
            styles
        )

        # 오른쪽: 항목 테이블
        header_row = [
            Paragraph("ITEM", styles['TableHeader']),
            Paragraph("SCORE", styles['TableHeader']),
            Paragraph("STATUS", styles['TableHeader']),
            Paragraph("DETAIL", styles['TableHeader']),
        ]
        table_data = [header_row]

        for item in items:
            passed = item.get('passed', False)
            status = "PASS" if passed else "FAIL"
            status_color = COLORS['pass'] if passed else COLORS['fail']

            detail = item.get('detail', '')
            if len(detail) > 35:
                detail = detail[:35] + '...'

            row = [
                Paragraph(item.get('name', ''), styles['TableCell']),
                Paragraph(f"{item.get('score', 0)}/{item.get('maxScore', 0)}", styles['TableCellCenter']),
                Paragraph(f"<font color='{status_color}'><b>{status}</b></font>", styles['TableCellCenter']),
                Paragraph(detail, styles['TableCell']),
            ]
            table_data.append(row)

        right_table = Table(table_data, colWidths=[3*cm, 1.8*cm, 1.8*cm, 4.9*cm])
        right_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['gray_dark'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (2, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
        ]))

        elements.append(create_two_column_section(left, right_table))
        elements.append(Spacer(1, 15))

    return elements


def create_recommendations_section(data: dict, styles) -> list:
    """04. RECOMMENDATIONS 섹션 - 좌우 분리"""
    elements = []

    recommendations = data.get('recommendations', [])
    if not recommendations:
        return elements

    priority_colors = {
        'high': COLORS['fail'],
        'medium': COLORS['warning'],
        'low': COLORS['pass'],
    }

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Recommendations",
        f"총 {len(recommendations)}개의 개선 권장사항입니다. 우선순위에 따라 단계적으로 적용하세요.",
        styles
    )

    # 오른쪽: 권장사항 테이블
    header_row = [
        Paragraph("우선순위", styles['TableHeader']),
        Paragraph("카테고리", styles['TableHeader']),
        Paragraph("이슈", styles['TableHeader']),
    ]
    table_data = [header_row]

    for rec in recommendations[:8]:
        priority = rec.get('priority', 'low')
        priority_label = priority.upper()
        priority_color = priority_colors.get(priority, COLORS['gray'])
        category = CATEGORY_LABELS.get(rec.get('category', ''), rec.get('category', '').upper())

        issue = rec.get('issue', '')
        if len(issue) > 40:
            issue = issue[:40] + '...'

        row = [
            Paragraph(f"<font color='{priority_color}'><b>{priority_label}</b></font>", styles['TableCellCenter']),
            Paragraph(category, styles['TableCellCenter']),
            Paragraph(issue, styles['TableCell']),
        ]
        table_data.append(row)

    right_table = Table(table_data, colWidths=[2.2*cm, 2.5*cm, 6.8*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
    ]))

    elements.append(create_two_column_section(left, right_table))
    elements.append(Spacer(1, 20))

    return elements


def extract_route_from_url(url: str) -> str:
    """URL에서 라우트 경로 추출"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        path = parsed.path
        if not path or path == '/':
            return '/'
        # 마지막 슬래시 제거
        path = path.rstrip('/')
        return path
    except:
        return url


def group_pages_by_route(pages: list) -> dict:
    """페이지를 라우트별로 그룹화"""
    grouped = {}
    for page in pages:
        url = page.get('url', '')
        route = extract_route_from_url(url)

        # 라우트의 첫 번째 세그먼트로 그룹화
        segments = route.split('/')
        if len(segments) > 1 and segments[1]:
            group_key = '/' + segments[1]
        else:
            group_key = '/'

        if group_key not in grouped:
            grouped[group_key] = []
        grouped[group_key].append(page)

    return grouped


def create_pages_section(data: dict, styles) -> list:
    """05. PAGE ANALYSIS 섹션 - 좌우 분리"""
    elements = []

    pages = data.get('pages', [])
    if len(pages) <= 1:
        return elements

    # 페이지를 라우트별로 그룹화
    grouped_pages = group_pages_by_route(pages)

    for route, route_pages in grouped_pages.items():
        route_display = route if route != '/' else '/ (root)'

        # 왼쪽: 라우트 설명
        left = create_left_column(
            f"Route: {route_display}",
            f"해당 경로의 {len(route_pages)}개 페이지별 카테고리 점수입니다.",
            styles
        )

        # 오른쪽: 페이지 테이블
        header_row = [
            Paragraph("PATH", styles['TableHeader']),
            Paragraph("STR", styles['TableHeader']),
            Paragraph("SCH", styles['TableHeader']),
            Paragraph("URL", styles['TableHeader']),
            Paragraph("META", styles['TableHeader']),
            Paragraph("TOTAL", styles['TableHeader']),
            Paragraph("STATUS", styles['TableHeader']),
        ]
        table_data = [header_row]

        for page in route_pages[:8]:  # 라우트당 최대 8개
            url = page.get('url', '')
            path = extract_route_from_url(url)

            # 경로 표시 (너무 길면 축약)
            if len(path) > 20:
                path_display = '...' + path[-17:]
            else:
                path_display = path

            scores = page.get('scores', {})
            total = scores.get('total', 0)
            verdict, verdict_color = get_score_verdict(total)

            row = [
                Paragraph(path_display, styles['TableCell']),
                Paragraph(str(scores.get('structure', 0)), styles['TableCellCenter']),
                Paragraph(str(scores.get('schema', 0)), styles['TableCellCenter']),
                Paragraph(str(scores.get('url', 0)), styles['TableCellCenter']),
                Paragraph(str(scores.get('meta', 0)), styles['TableCellCenter']),
                Paragraph(f"<b>{total}</b>", styles['TableCellCenter']),
                Paragraph(f"<font color='{verdict_color}'><b>{verdict}</b></font>", styles['TableCellCenter']),
            ]
            table_data.append(row)

        right_table = Table(table_data, colWidths=[3.5*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.2*cm, 1.5*cm, 1.7*cm])
        right_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['gray_dark'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(COLORS['gray_lighter'])),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(COLORS['gray_lightest'])]),
        ]))

        elements.append(create_two_column_section(left, right_table))
        elements.append(Spacer(1, 15))

    return elements


def create_certification_section(data: dict, styles) -> list:
    """06. CERTIFICATION 섹션 - 좌우 분리"""
    elements = []

    total_score = data.get('totalScore', 0)
    grade = data.get('grade', 'F')
    grade_color = get_grade_color(grade)

    # 왼쪽: 섹션 설명
    left = create_left_column(
        "Certification",
        "본 문서는 GEO 최적화 분석이 완료되었음을 인증합니다. 모든 평가는 표준화된 GEO 기준을 따릅니다.",
        styles
    )

    # 오른쪽: 인증 정보
    cert_data = [
        [Paragraph("AUDIT CERTIFICATION", styles['TableHeader'])],
        [Paragraph(" ", styles['Body'])],
        [Paragraph(f"<font size='16'><b>Final Score: {total_score}/100</b></font>", styles['Certification'])],
        [Paragraph(f"<font size='14' color='{grade_color}'><b>Grade: {grade}</b></font>", styles['Certification'])],
        [Paragraph(" ", styles['Body'])],
        [Paragraph(f"Document ID: GEO-{datetime.now().strftime('%Y%m%d%H%M%S')}", styles['Certification'])],
        [Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Certification'])],
    ]

    right_table = Table(cert_data, colWidths=[11.5*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(COLORS['black'])),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor(COLORS['gray_lightest'])),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(COLORS['gray_lighter'])),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(create_two_column_section(left, right_table))

    return elements


def create_footer(styles) -> list:
    """푸터"""
    elements = []

    elements.append(Spacer(1, 30))
    elements.append(create_divider())
    elements.append(Paragraph(
        "GEO Tracker | GEO Score Analysis Platform",
        styles['Footer']
    ))
    elements.append(Paragraph(
        "This is an automatically generated audit document.",
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
        title='GEO Score Audit Report',
        author='GEO Tracker',
    )

    elements = []

    # Header
    elements.extend(create_header(data, styles))

    # Score Summary
    elements.extend(create_score_summary(data, styles))

    # Category Analysis
    elements.extend(create_category_section(data, styles))

    # Detailed Analysis
    elements.extend(create_detail_section(data, styles))

    # Page Break
    elements.append(PageBreak())

    # 상단 헤더 반복
    header_data = [[
        Paragraph(f"<b>GEO SCORE</b>", styles['PageHeader']),
        Paragraph("SITE OPTIMIZATION AUDIT", styles['PageHeader']),
    ]]
    header_table = Table(header_data, colWidths=[8*cm, 8.5*cm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))

    # Recommendations
    elements.extend(create_recommendations_section(data, styles))

    # Page Analysis
    elements.extend(create_pages_section(data, styles))

    # Certification
    elements.extend(create_certification_section(data, styles))

    # Footer
    elements.extend(create_footer(styles))

    doc.build(elements)
    return output_path


def main():
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 3:
        print("Usage: python generate_geo_score_pdf.py <input_json> <output_pdf>")
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
