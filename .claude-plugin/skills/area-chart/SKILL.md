# Area Chart Skill

Matplotlib를 사용한 영역 차트 생성 가이드입니다.

## 사용 시점

- 시간에 따른 누적 데이터를 시각화할 때
- 전체 대비 각 부분의 비중 변화를 보여줄 때
- 여러 데이터셋의 합계 추이를 표현할 때

## 기본 영역 차트

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
x = np.linspace(0, 10, 100)
y = np.sin(x) + 2

# 그래프 생성
plt.figure(figsize=(10, 6))
plt.fill_between(x, y, alpha=0.5, color='steelblue')
plt.plot(x, y, color='steelblue', linewidth=2)

# 스타일 설정
plt.title('기본 영역 차트', fontsize=14, fontweight='bold')
plt.xlabel('X축', fontsize=12)
plt.ylabel('Y축', fontsize=12)
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('area_chart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 누적 영역 차트

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.arange(1, 13)  # 월
product_a = np.array([20, 25, 30, 35, 40, 45, 50, 55, 50, 45, 40, 35])
product_b = np.array([15, 20, 25, 20, 25, 30, 35, 40, 35, 30, 25, 20])
product_c = np.array([10, 15, 10, 15, 20, 15, 20, 25, 20, 15, 15, 10])

plt.figure(figsize=(12, 6))
plt.stackplot(x, product_a, product_b, product_c,
              labels=['제품 A', '제품 B', '제품 C'],
              colors=['#3498db', '#e74c3c', '#2ecc71'],
              alpha=0.8)

plt.title('월별 제품 판매량 (누적)', fontsize=14)
plt.xlabel('월')
plt.ylabel('판매량')
plt.xticks(x, [f'{i}월' for i in x])
plt.legend(loc='upper left')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('stacked_area_chart.png', dpi=300)
plt.show()
```

## 기준선 지정 영역 차트

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y1 = np.sin(x) * 2
y2 = np.cos(x) * 2

plt.figure(figsize=(12, 6))

# y1과 y2 사이 영역 채우기
plt.fill_between(x, y1, y2, where=(y1 > y2), color='green', alpha=0.5, label='y1 > y2')
plt.fill_between(x, y1, y2, where=(y1 <= y2), color='red', alpha=0.5, label='y1 <= y2')

plt.plot(x, y1, 'g-', linewidth=2, label='y1 = sin(x)*2')
plt.plot(x, y2, 'r-', linewidth=2, label='y2 = cos(x)*2')

plt.title('두 곡선 사이 영역 채우기')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True, alpha=0.3)
plt.axhline(y=0, color='black', linestyle='-', linewidth=0.5)

plt.tight_layout()
plt.savefig('between_area_chart.png', dpi=300)
plt.show()
```

## 수직 영역 채우기

```python
import matplotlib.pyplot as plt
import numpy as np

y = np.linspace(0, 10, 100)
x1 = np.sin(y) + 5
x2 = np.zeros_like(y) + 5

plt.figure(figsize=(8, 10))

# 수직 방향 영역 채우기
plt.fill_betweenx(y, x1, x2, where=(x1 > x2), color='coral', alpha=0.5)
plt.fill_betweenx(y, x1, x2, where=(x1 <= x2), color='steelblue', alpha=0.5)

plt.plot(x1, y, 'b-', linewidth=2)
plt.axvline(x=5, color='gray', linestyle='--')

plt.title('수직 방향 영역 채우기')
plt.xlabel('X')
plt.ylabel('Y')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('vertical_area_chart.png', dpi=300)
plt.show()
```

## 신뢰 구간 표시

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
x = np.linspace(0, 10, 50)
y = np.sin(x) + np.random.normal(0, 0.1, 50)

# 이동 평균과 표준편차
window = 5
y_mean = np.convolve(y, np.ones(window)/window, mode='same')
y_std = np.array([np.std(y[max(0,i-window):min(len(y),i+window)]) for i in range(len(y))])

plt.figure(figsize=(12, 6))

# 신뢰 구간 (1, 2 표준편차)
plt.fill_between(x, y_mean - 2*y_std, y_mean + 2*y_std,
                 color='steelblue', alpha=0.2, label='95% 신뢰구간')
plt.fill_between(x, y_mean - y_std, y_mean + y_std,
                 color='steelblue', alpha=0.4, label='68% 신뢰구간')

# 평균선과 데이터 포인트
plt.plot(x, y_mean, 'b-', linewidth=2, label='평균')
plt.scatter(x, y, c='red', s=20, alpha=0.6, label='데이터')

plt.title('신뢰 구간이 있는 영역 차트')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('confidence_area_chart.png', dpi=300)
plt.show()
```

## 100% 누적 영역 차트

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.arange(2018, 2024)
data1 = np.array([30, 35, 40, 45, 50, 55])
data2 = np.array([40, 35, 30, 30, 30, 25])
data3 = np.array([30, 30, 30, 25, 20, 20])

# 100%로 정규화
total = data1 + data2 + data3
data1_pct = data1 / total * 100
data2_pct = data2 / total * 100
data3_pct = data3 / total * 100

plt.figure(figsize=(12, 6))

plt.stackplot(x, data1_pct, data2_pct, data3_pct,
              labels=['카테고리 A', '카테고리 B', '카테고리 C'],
              colors=['#3498db', '#e74c3c', '#2ecc71'],
              alpha=0.8)

plt.title('연도별 비율 변화 (100% 누적)')
plt.xlabel('연도')
plt.ylabel('비율 (%)')
plt.ylim(0, 100)
plt.legend(loc='upper left')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('percent_stacked_area.png', dpi=300)
plt.show()
```

## 그라데이션 영역 차트

```python
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

x = np.linspace(0, 10, 100)
y = np.sin(x) * np.exp(-x/10) + 2

plt.figure(figsize=(12, 6))

# 그라데이션 효과
for i in range(100):
    alpha = (100 - i) / 100 * 0.5
    plt.fill_between(x, y * i/100, y * (i+1)/100, color='steelblue', alpha=alpha)

plt.plot(x, y, color='darkblue', linewidth=2)

plt.title('그라데이션 영역 차트')
plt.xlabel('X')
plt.ylabel('Y')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('gradient_area_chart.png', dpi=300)
plt.show()
```

## 스타일 옵션

### fill_between() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `x` | X 좌표 배열 | `np.linspace(0, 10, 100)` |
| `y1` | 첫 번째 Y 경계 | 배열 또는 스칼라 |
| `y2` | 두 번째 Y 경계 | 기본값 0 |
| `where` | 조건부 채우기 | `y1 > y2` |
| `color` | 채우기 색상 | `'steelblue'` |
| `alpha` | 투명도 | `0.5` |
| `interpolate` | 교차점 보간 | `True` |
| `step` | 스텝 스타일 | `'pre'`, `'post'`, `'mid'` |

### stackplot() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `x` | X 좌표 배열 | `np.arange(12)` |
| `*args` | Y 데이터들 | `y1, y2, y3` |
| `labels` | 범례 라벨 | `['A', 'B', 'C']` |
| `colors` | 색상 리스트 | `['red', 'blue']` |
| `baseline` | 기준선 스타일 | `'zero'`, `'sym'`, `'wiggle'` |

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 적절한 alpha 값으로 가독성 확보
- [ ] 축 레이블과 제목 설정
- [ ] 범례 추가 (여러 영역일 경우)
- [ ] 그리드 추가
- [ ] 색상 대비 확인
- [ ] 데이터 정규화 (비율 차트 시)
