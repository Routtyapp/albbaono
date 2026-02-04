# God Damn Visualization Plugin

Matplotlib 기반 데이터 시각화 플러그인입니다. 다양한 차트 유형별 가이드와 코드 템플릿을 제공합니다.

## 설치 요구사항

```bash
pip install matplotlib numpy
# 선택적: scipy (통계 분석용)
pip install scipy
```

## 제공 Skills

### 기본 차트

| Skill | 설명 | 사용 시점 |
|-------|------|----------|
| **line-chart** | 라인 차트 | 시간에 따른 추세, 연속 데이터 |
| **bar-chart** | 막대 차트 | 카테고리별 비교, 순위 |
| **pie-chart** | 파이 차트 | 전체 대비 비율 (5개 이하 권장) |
| **histogram** | 히스토그램 | 데이터 분포, 빈도 분석 |

### 고급 차트

| Skill | 설명 | 사용 시점 |
|-------|------|----------|
| **scatter-plot** | 산점도 | 상관관계, 분포 패턴 |
| **heatmap** | 히트맵 | 행렬 데이터, 상관관계 매트릭스 |
| **area-chart** | 영역 차트 | 누적 데이터, 시간별 비중 |
| **box-plot** | 박스 플롯 | 분포 비교, 이상치 탐지 |

### 레이아웃 및 스타일

| Skill | 설명 | 사용 시점 |
|-------|------|----------|
| **subplot** | 서브플롯 | 여러 그래프 배치, 대시보드 |
| **dual-axis** | 이중 축 | 스케일이 다른 데이터 비교 |
| **diagram** | 다이어그램 | 플로우차트, 조직도, 타임라인 |
| **style-guide** | 스타일 가이드 | 테마 설정, 폰트, 색상 |

## 빠른 시작

### 한글 폰트 설정

```python
import matplotlib.pyplot as plt

# Windows
plt.rcParams['font.family'] = 'Malgun Gothic'
# macOS
# plt.rcParams['font.family'] = 'AppleGothic'
# Linux
# plt.rcParams['font.family'] = 'NanumGothic'

plt.rcParams['axes.unicode_minus'] = False
```

### 기본 그래프 템플릿

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터
x = np.linspace(0, 10, 100)
y = np.sin(x)

# 그래프 생성
plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')

# 스타일
plt.title('제목', fontsize=14, fontweight='bold')
plt.xlabel('X축')
plt.ylabel('Y축')
plt.legend()
plt.grid(True, alpha=0.3)

# 저장 및 표시
plt.tight_layout()
plt.savefig('output.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 차트 선택 가이드

```
데이터 유형에 따른 차트 선택:

시간에 따른 변화 → line-chart, area-chart
카테고리 비교 → bar-chart
전체 대비 비율 → pie-chart (5개 이하)
분포 확인 → histogram, box-plot
상관관계 → scatter-plot, heatmap
여러 그래프 → subplot
단위가 다른 비교 → dual-axis
프로세스/구조 → diagram
```

## 색상 팔레트 추천

```python
# 기본 팔레트
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

# 파스텔 톤
colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#ff99cc']

# 그라데이션
import matplotlib.cm as cm
colors = cm.viridis(np.linspace(0, 1, 5))
```

## 저장 옵션

```python
# 고해상도 PNG
plt.savefig('output.png', dpi=300, bbox_inches='tight')

# 투명 배경
plt.savefig('output.png', dpi=300, transparent=True)

# 벡터 형식 (PDF/SVG)
plt.savefig('output.pdf', bbox_inches='tight')
plt.savefig('output.svg', bbox_inches='tight')
```

## 참고 자료

- [Matplotlib 공식 문서](https://matplotlib.org/stable/contents.html)
- [Matplotlib 갤러리](https://matplotlib.org/stable/gallery/index.html)
- reference.md - Matplotlib 상세 튜토리얼
