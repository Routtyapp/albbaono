# -*- coding: utf-8 -*-
"""
GEO Visibility Audit Report Chart Generator
감사 인증 문서 스타일의 차트를 생성한다.
흑백 + 회색 기반, 성과 지표만 색상 사용.
"""

import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np
import json
import sys
import os
from pathlib import Path

# =============================================================================
# 스타일 설정
# =============================================================================

# 한글 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False

# 컬러 시스템: 흑백 + 회색 기반
COLORS = {
    'black': '#000000',
    'dark': '#1a1a1a',
    'gray_dark': '#343a40',
    'gray': '#6c757d',
    'gray_light': '#adb5bd',
    'gray_lighter': '#dee2e6',
    'gray_lightest': '#f8f9fa',
    'white': '#ffffff',
    # 판단 색상 (성과 지표에만 사용)
    'pass': '#28a745',
    'fail': '#dc3545',
    'warning': '#ffc107',
}

# 엔진별 색상 (회색 톤 유지, 구분용)
ENGINE_COLORS = {
    'gpt': '#2d2d2d',
    'claude': '#4a4a4a',
    'gemini': '#666666',
    'perplexity': '#888888',
    'copilot': '#aaaaaa',
}


def setup_audit_style():
    """감사 문서 스타일 설정"""
    plt.rcParams.update({
        'figure.figsize': (10, 5),
        'figure.dpi': 150,
        'figure.facecolor': 'white',
        'font.size': 9,
        'axes.titlesize': 11,
        'axes.titleweight': 'bold',
        'axes.labelsize': 9,
        'axes.labelweight': 'normal',
        'axes.facecolor': 'white',
        'axes.edgecolor': COLORS['gray_lighter'],
        'axes.linewidth': 0.8,
        'axes.spines.top': False,
        'axes.spines.right': False,
        'axes.grid': True,
        'grid.color': COLORS['gray_lighter'],
        'grid.alpha': 0.5,
        'grid.linestyle': '-',
        'grid.linewidth': 0.5,
        'lines.linewidth': 2,
        'lines.markersize': 6,
        'xtick.color': COLORS['gray'],
        'ytick.color': COLORS['gray'],
        'legend.frameon': False,
        'legend.fontsize': 8,
    })


# =============================================================================
# 차트 생성 함수
# =============================================================================

def create_citation_trend_chart(data: dict, output_path: str):
    """인용률 트렌드 라인 차트 - 감사 문서 스타일"""
    setup_audit_style()

    dates = data.get('dates', [])
    citation_rates = data.get('citationRates', [])

    if not dates or not citation_rates:
        dates = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
        citation_rates = [45, 52, 48, 55]

    fig, ax = plt.subplots(figsize=(10, 5))

    # 라인 차트: 회색 톤 메인, 마커는 검정
    ax.plot(dates, citation_rates,
            marker='o',
            color=COLORS['gray_dark'],
            linewidth=2,
            markersize=8,
            markerfacecolor=COLORS['white'],
            markeredgecolor=COLORS['black'],
            markeredgewidth=2)

    # 영역 채우기: 연한 회색
    ax.fill_between(dates, citation_rates, alpha=0.1, color=COLORS['gray'])

    # 값 레이블
    for i, (x, y) in enumerate(zip(dates, citation_rates)):
        ax.annotate(f'{y}%',
                    (x, y),
                    textcoords="offset points",
                    xytext=(0, 12),
                    ha='center',
                    fontsize=9,
                    fontweight='bold',
                    color=COLORS['black'])

    ax.set_title('CITATION RATE TREND', pad=15, color=COLORS['black'])
    ax.set_xlabel('Period', color=COLORS['gray'])
    ax.set_ylabel('Citation Rate (%)', color=COLORS['gray'])
    ax.set_ylim(0, 100)

    # 50% 기준선 (PASS/FAIL 기준)
    ax.axhline(y=50, color=COLORS['gray_light'], linestyle='--', linewidth=1, alpha=0.7)
    ax.text(dates[-1], 52, 'PASS threshold', ha='right', va='bottom',
            fontsize=7, color=COLORS['gray'], style='italic')

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()


def create_engine_performance_chart(data: dict, output_path: str):
    """엔진별 성과 가로 막대 차트 - 감사 문서 스타일"""
    setup_audit_style()

    engines = data.get('engines', ['GPT', 'Gemini', 'Claude', 'Perplexity'])
    citation_rates = data.get('citationRates', [65, 58, 72, 45])

    fig, ax = plt.subplots(figsize=(10, 5))

    y_pos = np.arange(len(engines))

    # 막대 색상: 성과에 따라 결정
    bar_colors = []
    for rate in citation_rates:
        if rate >= 50:
            bar_colors.append(COLORS['pass'])
        elif rate >= 30:
            bar_colors.append(COLORS['warning'])
        else:
            bar_colors.append(COLORS['fail'])

    bars = ax.barh(y_pos, citation_rates,
                   color=bar_colors,
                   edgecolor=COLORS['white'],
                   height=0.5)

    # 값 레이블
    for bar, val in zip(bars, citation_rates):
        verdict = "PASS" if val >= 50 else "FAIL"
        ax.text(val + 2, bar.get_y() + bar.get_height()/2,
                f'{val}% ({verdict})',
                ha='left', va='center',
                fontsize=8, fontweight='bold',
                color=COLORS['black'])

    ax.set_yticks(y_pos)
    ax.set_yticklabels([e.upper() for e in engines])
    ax.set_xlabel('Citation Rate (%)', color=COLORS['gray'])
    ax.set_title('ENGINE PERFORMANCE', pad=15, color=COLORS['black'])
    ax.set_xlim(0, 100)
    ax.invert_yaxis()

    # 50% 기준선
    ax.axvline(x=50, color=COLORS['gray_light'], linestyle='--', linewidth=1)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()


def create_category_distribution_chart(data: dict, output_path: str):
    """카테고리별 분포 파이 차트 - 감사 문서 스타일"""
    setup_audit_style()

    categories = data.get('categories', ['Product', 'Service', 'Technical', 'Other'])
    values = data.get('values', [35, 28, 22, 15])

    # 회색 톤 팔레트
    gray_palette = [COLORS['gray_dark'], COLORS['gray'], COLORS['gray_light'], COLORS['gray_lighter']]

    fig, ax = plt.subplots(figsize=(8, 6))

    wedges, texts, autotexts = ax.pie(
        values,
        labels=categories,
        colors=gray_palette[:len(values)],
        autopct='%1.0f%%',
        startangle=90,
        wedgeprops=dict(width=0.6, edgecolor=COLORS['white'], linewidth=2),
        pctdistance=0.75
    )

    # 텍스트 스타일
    for text in texts:
        text.set_fontsize(9)
        text.set_color(COLORS['gray_dark'])

    for autotext in autotexts:
        autotext.set_fontsize(9)
        autotext.set_fontweight('bold')
        autotext.set_color(COLORS['white'])

    ax.set_title('QUERY CATEGORY DISTRIBUTION', pad=15, color=COLORS['black'])

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()


def create_top_queries_chart(data: dict, output_path: str):
    """상위 쿼리 성과 막대 차트 - 감사 문서 스타일"""
    setup_audit_style()

    queries = data.get('queries', [
        'Query 1',
        'Query 2',
        'Query 3',
        'Query 4',
        'Query 5'
    ])
    citation_rates = data.get('citationRates', [85, 78, 72, 68, 65])

    # 쿼리 텍스트 길이 제한
    queries = [q[:18] + '...' if len(q) > 18 else q for q in queries]

    fig, ax = plt.subplots(figsize=(10, 5))

    x_pos = np.arange(len(queries))

    # 막대 색상: 성과에 따라 결정
    bar_colors = []
    for rate in citation_rates:
        if rate >= 50:
            bar_colors.append(COLORS['pass'])
        elif rate >= 30:
            bar_colors.append(COLORS['warning'])
        else:
            bar_colors.append(COLORS['fail'])

    bars = ax.bar(x_pos, citation_rates,
                  color=bar_colors,
                  edgecolor=COLORS['white'],
                  width=0.6)

    # 값 레이블
    for bar, val in zip(bars, citation_rates):
        verdict = "P" if val >= 50 else "F"
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'{val}%',
                ha='center', va='bottom',
                fontsize=8, fontweight='bold',
                color=COLORS['black'])

    ax.set_xticks(x_pos)
    ax.set_xticklabels(queries, rotation=20, ha='right', fontsize=8)
    ax.set_ylabel('Citation Rate (%)', color=COLORS['gray'])
    ax.set_title('TOP QUERIES PERFORMANCE', pad=15, color=COLORS['black'])
    ax.set_ylim(0, 100)

    # 50% 기준선
    ax.axhline(y=50, color=COLORS['gray_light'], linestyle='--', linewidth=1)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()


def create_metrics_summary_chart(data: dict, output_path: str):
    """주요 지표 요약 차트 - 감사 문서 스타일"""
    setup_audit_style()

    metrics = data.get('metrics', {
        'citationRate': 58,
        'citationRateChange': 5.2,
        'totalTests': 156,
        'avgRank': 3.2,
    })

    fig, axes = plt.subplots(2, 2, figsize=(10, 8))
    axes = axes.flatten()

    # 1. 인용률 게이지
    ax = axes[0]
    value = metrics.get('citationRate', 58)
    change = metrics.get('citationRateChange', 0)

    # 도넛 차트
    sizes = [value, 100 - value]
    color = COLORS['pass'] if value >= 50 else COLORS['fail']
    wedge_colors = [color, COLORS['gray_lightest']]

    wedges, _ = ax.pie(sizes, colors=wedge_colors, startangle=90,
                       wedgeprops=dict(width=0.35, edgecolor=COLORS['white']))

    change_text = f'+{change}%p' if change > 0 else f'{change}%p'
    change_color = COLORS['pass'] if change > 0 else COLORS['fail']
    verdict = "PASS" if value >= 50 else "FAIL"

    ax.text(0, 0.1, f'{value}%', ha='center', va='center',
            fontsize=24, fontweight='bold', color=COLORS['black'])
    ax.text(0, -0.15, verdict, ha='center', va='center',
            fontsize=10, fontweight='bold', color=color)
    ax.text(0, -0.35, change_text, ha='center', va='center',
            fontsize=10, color=change_color)
    ax.set_title('CITATION RATE', pad=10, fontsize=10, color=COLORS['black'])

    # 2. 총 테스트 수
    ax = axes[1]
    total_tests = metrics.get('totalTests', 156)
    ax.text(0.5, 0.55, str(total_tests), ha='center', va='center',
            fontsize=32, fontweight='bold', color=COLORS['black'],
            transform=ax.transAxes)
    ax.text(0.5, 0.3, 'TESTS', ha='center', va='center',
            fontsize=10, color=COLORS['gray'], transform=ax.transAxes)
    ax.set_title('TOTAL TESTS', pad=10, fontsize=10, color=COLORS['black'])
    ax.axis('off')

    # 3. 평균 순위
    ax = axes[2]
    avg_rank = metrics.get('avgRank', 3.2)
    ax.text(0.5, 0.55, f'{avg_rank:.1f}' if avg_rank else '-', ha='center', va='center',
            fontsize=32, fontweight='bold', color=COLORS['black'],
            transform=ax.transAxes)
    ax.text(0.5, 0.3, 'RANK', ha='center', va='center',
            fontsize=10, color=COLORS['gray'], transform=ax.transAxes)
    ax.set_title('AVG RANK', pad=10, fontsize=10, color=COLORS['black'])
    ax.axis('off')

    # 4. SOV
    ax = axes[3]
    sov = metrics.get('shareOfVoice', 42)
    sizes = [sov, 100 - sov]
    color = COLORS['gray_dark']
    wedge_colors = [color, COLORS['gray_lightest']]

    wedges, _ = ax.pie(sizes, colors=wedge_colors, startangle=90,
                       wedgeprops=dict(width=0.35, edgecolor=COLORS['white']))

    ax.text(0, 0, f'{sov}%', ha='center', va='center',
            fontsize=24, fontweight='bold', color=COLORS['black'])
    ax.set_title('SHARE OF VOICE', pad=10, fontsize=10, color=COLORS['black'])

    plt.suptitle('KEY METRICS SUMMARY', fontsize=12, fontweight='bold',
                 color=COLORS['black'], y=1.02)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()


# =============================================================================
# 메인 함수
# =============================================================================

def main():
    """메인 함수"""
    if len(sys.argv) < 3:
        print("Usage: python generate_report_charts.py <input_json_path> <output_dir>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]

    # 출력 디렉토리 생성
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # JSON 데이터 로드
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        data = {}

    # 차트 생성
    charts = []

    try:
        chart_path = os.path.join(output_dir, 'citation_trend.png')
        create_citation_trend_chart(data.get('trend', {}), chart_path)
        charts.append(chart_path)
        print(f"Created: citation_trend.png")
    except Exception as e:
        print(f"Error creating citation_trend: {e}")

    try:
        chart_path = os.path.join(output_dir, 'engine_performance.png')
        create_engine_performance_chart(data.get('enginePerformance', {}), chart_path)
        charts.append(chart_path)
        print(f"Created: engine_performance.png")
    except Exception as e:
        print(f"Error creating engine_performance: {e}")

    try:
        chart_path = os.path.join(output_dir, 'category_distribution.png')
        create_category_distribution_chart(data.get('categoryDistribution', {}), chart_path)
        charts.append(chart_path)
        print(f"Created: category_distribution.png")
    except Exception as e:
        print(f"Error creating category_distribution: {e}")

    try:
        chart_path = os.path.join(output_dir, 'top_queries.png')
        create_top_queries_chart(data.get('topQueries', {}), chart_path)
        charts.append(chart_path)
        print(f"Created: top_queries.png")
    except Exception as e:
        print(f"Error creating top_queries: {e}")

    try:
        chart_path = os.path.join(output_dir, 'metrics_summary.png')
        create_metrics_summary_chart(data.get('metrics', {}), chart_path)
        charts.append(chart_path)
        print(f"Created: metrics_summary.png")
    except Exception as e:
        print(f"Error creating metrics_summary: {e}")

    # 결과 출력
    result = {
        'success': True,
        'charts': charts
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
