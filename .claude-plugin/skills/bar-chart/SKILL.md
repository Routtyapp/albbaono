# Bar Chart Skill

Matplotlib를 사용한 바 차트(막대 그래프) 생성 가이드입니다.

## 사용 시점

- 카테고리별 데이터 비교가 필요할 때
- 순위나 크기 비교를 시각화할 때
- 그룹별 데이터 분포를 보여줄 때

## 기본 세로 막대 차트

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
categories = ['A', 'B', 'C', 'D', 'E']
values = [23, 45, 56, 78, 32]

# 그래프 생성
plt.figure(figsize=(10, 6))
bars = plt.bar(categories, values, color='steelblue', edgecolor='black', linewidth=1.2)

# 값 레이블 추가
for bar, val in zip(bars, values):
    plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
             str(val), ha='center', va='bottom', fontsize=10)

# 스타일 설정
plt.title('카테고리별 값 비교', fontsize=14, fontweight='bold')
plt.xlabel('카테고리', fontsize=12)
plt.ylabel('값', fontsize=12)
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 가로 막대 차트

```python
import matplotlib.pyplot as plt

categories = ['제품 A', '제품 B', '제품 C', '제품 D', '제품 E']
values = [23, 45, 56, 78, 32]

plt.figure(figsize=(10, 6))
bars = plt.barh(categories, values, color='coral', edgecolor='black')

# 값 레이블 추가
for bar, val in zip(bars, values):
    plt.text(val + 1, bar.get_y() + bar.get_height()/2,
             str(val), ha='left', va='center', fontsize=10)

plt.title('제품별 판매량')
plt.xlabel('판매량')
plt.ylabel('제품')
plt.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('horizontal_bar_chart.png', dpi=300)
plt.show()
```

## 그룹 바 차트

```python
import matplotlib.pyplot as plt
import numpy as np

categories = ['Q1', 'Q2', 'Q3', 'Q4']
product_a = [20, 35, 30, 35]
product_b = [25, 32, 34, 20]
product_c = [22, 30, 28, 32]

x = np.arange(len(categories))
width = 0.25

plt.figure(figsize=(12, 6))
plt.bar(x - width, product_a, width, label='제품 A', color='#3498db')
plt.bar(x, product_b, width, label='제품 B', color='#e74c3c')
plt.bar(x + width, product_c, width, label='제품 C', color='#2ecc71')

plt.title('분기별 제품 판매량 비교', fontsize=14)
plt.xlabel('분기')
plt.ylabel('판매량')
plt.xticks(x, categories)
plt.legend()
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('grouped_bar_chart.png', dpi=300)
plt.show()
```

## 누적 바 차트

```python
import matplotlib.pyplot as plt
import numpy as np

categories = ['2020', '2021', '2022', '2023']
product_a = [20, 35, 30, 35]
product_b = [25, 32, 34, 20]
product_c = [22, 30, 28, 32]

plt.figure(figsize=(10, 6))
plt.bar(categories, product_a, label='제품 A', color='#3498db')
plt.bar(categories, product_b, bottom=product_a, label='제품 B', color='#e74c3c')
plt.bar(categories, product_c, bottom=np.array(product_a)+np.array(product_b),
        label='제품 C', color='#2ecc71')

plt.title('연도별 제품 판매량 (누적)', fontsize=14)
plt.xlabel('연도')
plt.ylabel('판매량')
plt.legend()
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('stacked_bar_chart.png', dpi=300)
plt.show()
```

## 색상 그라데이션

```python
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np

categories = ['A', 'B', 'C', 'D', 'E', 'F']
values = [23, 45, 56, 78, 32, 64]

# 값에 따른 색상 그라데이션
colors = cm.Blues(np.linspace(0.3, 0.9, len(values)))

plt.figure(figsize=(10, 6))
plt.bar(categories, values, color=colors, edgecolor='black')

plt.title('값에 따른 색상 변화')
plt.xlabel('카테고리')
plt.ylabel('값')

plt.tight_layout()
plt.savefig('gradient_bar_chart.png', dpi=300)
plt.show()
```

## 스타일 옵션

### 색상 팔레트 (추천)
```python
# 단일 색상
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']

# Matplotlib 컬러맵
import matplotlib.cm as cm
colors = cm.viridis(np.linspace(0, 1, n))  # viridis, plasma, inferno, magma
colors = cm.Set1(np.linspace(0, 1, n))     # 카테고리형
colors = cm.Blues(np.linspace(0.3, 0.9, n))  # 순차형
```

### bar() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `color` | 막대 색상 | `'steelblue'`, `'#3498db'` |
| `edgecolor` | 테두리 색상 | `'black'`, `'white'` |
| `linewidth` | 테두리 두께 | `1.5` |
| `width` | 막대 너비 | `0.8` (기본값) |
| `alpha` | 투명도 | `0.7` |
| `hatch` | 패턴 | `'/'`, `'\\'`, `'x'`, `'o'` |

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 축 레이블과 제목 설정
- [ ] 값 레이블 추가 (필요시)
- [ ] 범례 추가 (여러 그룹일 경우)
- [ ] 그리드 추가 (y축만 권장)
- [ ] 적절한 색상 선택
- [ ] 막대 너비 조절 (그룹 차트 시)
