# Pie Chart Skill

Matplotlib를 사용한 파이 차트(원형 그래프) 생성 가이드입니다.

## 사용 시점

- 전체에서 각 부분의 비율을 보여줄 때
- 구성 요소의 상대적 크기를 시각화할 때
- 카테고리가 5개 이하일 때 (그 이상은 바 차트 권장)

## 기본 파이 차트

```python
import matplotlib.pyplot as plt

# 데이터 준비
labels = ['A', 'B', 'C', 'D']
sizes = [35, 25, 25, 15]
colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']

# 그래프 생성
plt.figure(figsize=(8, 8))
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%',
        startangle=90, explode=(0.05, 0, 0, 0))

plt.title('카테고리 비율', fontsize=14, fontweight='bold')
plt.axis('equal')  # 원형 유지

plt.tight_layout()
plt.savefig('pie_chart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 도넛 차트

```python
import matplotlib.pyplot as plt

labels = ['제품 A', '제품 B', '제품 C', '제품 D']
sizes = [35, 25, 25, 15]
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']

plt.figure(figsize=(8, 8))

# 도넛 효과: wedgeprops로 내부 원 생성
wedges, texts, autotexts = plt.pie(sizes, labels=labels, colors=colors,
                                    autopct='%1.1f%%', startangle=90,
                                    wedgeprops=dict(width=0.5, edgecolor='white'))

# 가운데 텍스트 추가
plt.text(0, 0, '총 판매량\n100%', ha='center', va='center', fontsize=14)

plt.title('제품별 판매 비율', fontsize=14, fontweight='bold')
plt.axis('equal')

plt.tight_layout()
plt.savefig('donut_chart.png', dpi=300)
plt.show()
```

## 강조 효과 (Explode)

```python
import matplotlib.pyplot as plt

labels = ['온라인', '오프라인', '도매', '기타']
sizes = [45, 30, 15, 10]
colors = ['#3498db', '#e74c3c', '#2ecc71', '#95a5a6']
explode = (0.1, 0, 0, 0)  # 첫 번째 조각 강조

plt.figure(figsize=(8, 8))
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%',
        startangle=90, explode=explode, shadow=True)

plt.title('판매 채널별 비율')
plt.axis('equal')

plt.tight_layout()
plt.savefig('exploded_pie_chart.png', dpi=300)
plt.show()
```

## 범례 외부 배치

```python
import matplotlib.pyplot as plt

labels = ['카테고리 A', '카테고리 B', '카테고리 C', '카테고리 D', '카테고리 E']
sizes = [30, 25, 20, 15, 10]
colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']

plt.figure(figsize=(10, 8))

wedges, texts, autotexts = plt.pie(sizes, colors=colors, autopct='%1.1f%%',
                                    startangle=90, pctdistance=0.75)

# 퍼센트 텍스트 스타일
for autotext in autotexts:
    autotext.set_fontsize(10)
    autotext.set_fontweight('bold')

# 범례 외부 배치
plt.legend(wedges, labels, title='카테고리', loc='center left',
           bbox_to_anchor=(1, 0, 0.5, 1))

plt.title('카테고리별 비율 분석', fontsize=14)
plt.axis('equal')

plt.tight_layout()
plt.savefig('pie_chart_legend.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 중첩 파이 차트

```python
import matplotlib.pyplot as plt
import numpy as np

# 외부 파이 데이터
outer_labels = ['그룹 A', '그룹 B', '그룹 C']
outer_sizes = [40, 35, 25]
outer_colors = ['#3498db', '#e74c3c', '#2ecc71']

# 내부 파이 데이터
inner_labels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
inner_sizes = [25, 15, 20, 15, 15, 10]
inner_colors = ['#5dade2', '#85c1e9', '#ec7063', '#f1948a', '#58d68d', '#82e0aa']

plt.figure(figsize=(10, 10))

# 외부 파이
plt.pie(outer_sizes, labels=outer_labels, colors=outer_colors,
        radius=1.2, wedgeprops=dict(width=0.3, edgecolor='white'),
        autopct='%1.1f%%', pctdistance=0.85)

# 내부 파이
plt.pie(inner_sizes, labels=inner_labels, colors=inner_colors,
        radius=0.9, wedgeprops=dict(width=0.4, edgecolor='white'),
        autopct='%1.0f%%', pctdistance=0.7)

plt.title('중첩 파이 차트')
plt.axis('equal')

plt.tight_layout()
plt.savefig('nested_pie_chart.png', dpi=300)
plt.show()
```

## 스타일 옵션

### pie() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `labels` | 라벨 목록 | `['A', 'B', 'C']` |
| `colors` | 색상 목록 | `['red', 'blue', 'green']` |
| `autopct` | 퍼센트 포맷 | `'%1.1f%%'`, `'%.0f%%'` |
| `startangle` | 시작 각도 | `90` (12시 방향) |
| `explode` | 조각 분리 | `(0.1, 0, 0)` |
| `shadow` | 그림자 효과 | `True`, `False` |
| `wedgeprops` | 조각 스타일 | `dict(width=0.5)` |
| `pctdistance` | 퍼센트 위치 | `0.75` |

### 색상 팔레트 (추천)
```python
# 밝은 색상
colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#ff99cc']

# 진한 색상
colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']

# Matplotlib 컬러맵
import matplotlib.cm as cm
colors = cm.Pastel1(np.linspace(0, 1, n))
colors = cm.Set2(np.linspace(0, 1, n))
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 카테고리 5개 이하인지 확인
- [ ] autopct로 퍼센트 표시
- [ ] axis('equal')로 원형 유지
- [ ] 가장 중요한 항목 강조 (explode)
- [ ] 범례 위치 적절히 배치
- [ ] 색상 대비 확인
