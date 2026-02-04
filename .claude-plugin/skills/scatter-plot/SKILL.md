# Scatter Plot Skill

Matplotlib를 사용한 산점도 생성 가이드입니다.

## 사용 시점

- 두 변수 간의 관계를 탐색할 때
- 상관관계를 시각화할 때
- 데이터의 분포와 패턴을 파악할 때
- 클러스터나 이상치를 식별할 때

## 기본 산점도

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
np.random.seed(42)
x = np.random.randn(100)
y = 2 * x + np.random.randn(100) * 0.5

# 그래프 생성
plt.figure(figsize=(10, 6))
plt.scatter(x, y, c='steelblue', alpha=0.7, edgecolors='black', linewidths=0.5)

# 스타일 설정
plt.title('X와 Y의 상관관계', fontsize=14, fontweight='bold')
plt.xlabel('X 변수', fontsize=12)
plt.ylabel('Y 변수', fontsize=12)
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('scatter_plot.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 추세선 추가

```python
import matplotlib.pyplot as plt
import numpy as np
from numpy.polynomial import polynomial as P

np.random.seed(42)
x = np.random.randn(100)
y = 2 * x + np.random.randn(100) * 0.5

# 선형 회귀선 계산
z = np.polyfit(x, y, 1)
p = np.poly1d(z)

plt.figure(figsize=(10, 6))
plt.scatter(x, y, c='steelblue', alpha=0.6, label='데이터')
plt.plot(np.sort(x), p(np.sort(x)), 'r-', linewidth=2, label=f'추세선 (y={z[0]:.2f}x+{z[1]:.2f})')

plt.title('추세선이 있는 산점도')
plt.xlabel('X 변수')
plt.ylabel('Y 변수')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('scatter_with_trendline.png', dpi=300)
plt.show()
```

## 그룹별 색상 구분

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)

# 그룹별 데이터
groups = ['그룹 A', '그룹 B', '그룹 C']
colors = ['#3498db', '#e74c3c', '#2ecc71']

plt.figure(figsize=(10, 6))

for i, (group, color) in enumerate(zip(groups, colors)):
    x = np.random.randn(30) + i
    y = np.random.randn(30) + i
    plt.scatter(x, y, c=color, label=group, alpha=0.7, edgecolors='black', s=80)

plt.title('그룹별 산점도')
plt.xlabel('X 변수')
plt.ylabel('Y 변수')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('grouped_scatter.png', dpi=300)
plt.show()
```

## 크기와 색상으로 값 표현 (버블 차트)

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
n = 50
x = np.random.rand(n)
y = np.random.rand(n)
sizes = np.random.rand(n) * 500  # 버블 크기
colors = np.random.rand(n)       # 색상 값

plt.figure(figsize=(10, 8))
scatter = plt.scatter(x, y, c=colors, s=sizes, alpha=0.6,
                      cmap='viridis', edgecolors='black')

# 컬러바 추가
cbar = plt.colorbar(scatter)
cbar.set_label('값', fontsize=12)

plt.title('버블 차트 (크기와 색상으로 값 표현)')
plt.xlabel('X 변수')
plt.ylabel('Y 변수')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('bubble_chart.png', dpi=300)
plt.show()
```

## 밀도 표현 (2D 히스토그램)

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
x = np.random.randn(10000)
y = x + np.random.randn(10000) * 0.5

plt.figure(figsize=(10, 8))
plt.hist2d(x, y, bins=50, cmap='Blues')
plt.colorbar(label='빈도')

plt.title('2D 히스토그램 (밀도 표현)')
plt.xlabel('X 변수')
plt.ylabel('Y 변수')

plt.tight_layout()
plt.savefig('density_scatter.png', dpi=300)
plt.show()
```

## 주석 추가

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
x = np.random.rand(10)
y = np.random.rand(10)
labels = [f'P{i+1}' for i in range(10)]

plt.figure(figsize=(10, 8))
plt.scatter(x, y, c='steelblue', s=100, alpha=0.7, edgecolors='black')

# 각 점에 라벨 추가
for i, label in enumerate(labels):
    plt.annotate(label, (x[i], y[i]), xytext=(5, 5),
                 textcoords='offset points', fontsize=9)

# 특정 점 강조 주석
plt.annotate('중요 포인트', xy=(x[5], y[5]), xytext=(x[5]+0.1, y[5]+0.15),
             arrowprops=dict(arrowstyle='->', color='red'),
             fontsize=10, color='red')

plt.title('주석이 있는 산점도')
plt.xlabel('X 변수')
plt.ylabel('Y 변수')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('annotated_scatter.png', dpi=300)
plt.show()
```

## 서브플롯 비교

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
n = 100

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 양의 상관관계
x1 = np.random.randn(n)
y1 = x1 + np.random.randn(n) * 0.3
axes[0, 0].scatter(x1, y1, alpha=0.6)
axes[0, 0].set_title('양의 상관관계')

# 음의 상관관계
x2 = np.random.randn(n)
y2 = -x2 + np.random.randn(n) * 0.3
axes[0, 1].scatter(x2, y2, alpha=0.6, c='red')
axes[0, 1].set_title('음의 상관관계')

# 무상관
x3 = np.random.randn(n)
y3 = np.random.randn(n)
axes[1, 0].scatter(x3, y3, alpha=0.6, c='green')
axes[1, 0].set_title('무상관')

# 비선형 관계
x4 = np.linspace(-3, 3, n)
y4 = x4**2 + np.random.randn(n) * 0.5
axes[1, 1].scatter(x4, y4, alpha=0.6, c='purple')
axes[1, 1].set_title('비선형 관계')

for ax in axes.flat:
    ax.grid(True, alpha=0.3)
    ax.set_xlabel('X')
    ax.set_ylabel('Y')

plt.tight_layout()
plt.savefig('scatter_comparison.png', dpi=300)
plt.show()
```

## 스타일 옵션

### scatter() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `c` | 색상 | `'blue'`, `array` (컬러맵용) |
| `s` | 점 크기 | `50`, `array` |
| `alpha` | 투명도 | `0.7` |
| `cmap` | 컬러맵 | `'viridis'`, `'plasma'` |
| `marker` | 마커 모양 | `'o'`, `'s'`, `'^'` |
| `edgecolors` | 테두리 색상 | `'black'`, `'none'` |
| `linewidths` | 테두리 두께 | `0.5` |

### 컬러맵 추천
- 순차형: `'viridis'`, `'plasma'`, `'Blues'`, `'Reds'`
- 발산형: `'coolwarm'`, `'RdBu'`, `'seismic'`
- 카테고리형: `'Set1'`, `'Set2'`, `'tab10'`

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 축 레이블과 제목 설정
- [ ] 적절한 alpha 값으로 겹침 표현
- [ ] 그룹이 있으면 범례 추가
- [ ] 필요시 추세선 추가
- [ ] 이상치 확인 및 처리
- [ ] 컬러바 추가 (색상으로 값 표현 시)
