# Histogram Skill

Matplotlib를 사용한 히스토그램 생성 가이드입니다.

## 사용 시점

- 데이터의 분포를 파악할 때
- 빈도 분석이 필요할 때
- 정규분포 등 분포 형태를 확인할 때
- 이상치나 데이터 편향을 파악할 때

## 기본 히스토그램

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
np.random.seed(42)
data = np.random.randn(1000)

# 그래프 생성
plt.figure(figsize=(10, 6))
plt.hist(data, bins=30, color='steelblue', edgecolor='black', alpha=0.7)

# 스타일 설정
plt.title('데이터 분포', fontsize=14, fontweight='bold')
plt.xlabel('값', fontsize=12)
plt.ylabel('빈도', fontsize=12)
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('histogram.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 밀도 곡선 추가

```python
import matplotlib.pyplot as plt
import numpy as np
from scipy import stats

np.random.seed(42)
data = np.random.randn(1000)

plt.figure(figsize=(10, 6))

# 히스토그램 (정규화)
n, bins, patches = plt.hist(data, bins=30, density=True,
                             color='steelblue', edgecolor='black', alpha=0.7)

# 밀도 곡선 (KDE)
x = np.linspace(data.min(), data.max(), 100)
kde = stats.gaussian_kde(data)
plt.plot(x, kde(x), 'r-', linewidth=2, label='밀도 곡선')

# 이론적 정규분포
mu, std = data.mean(), data.std()
plt.plot(x, stats.norm.pdf(x, mu, std), 'g--', linewidth=2, label='정규분포')

plt.title('히스토그램과 밀도 곡선')
plt.xlabel('값')
plt.ylabel('밀도')
plt.legend()
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('histogram_with_kde.png', dpi=300)
plt.show()
```

## 여러 그룹 비교

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
group_a = np.random.normal(0, 1, 500)
group_b = np.random.normal(2, 1.5, 500)
group_c = np.random.normal(-1, 0.8, 500)

plt.figure(figsize=(12, 6))

plt.hist(group_a, bins=30, alpha=0.5, label='그룹 A', color='#3498db')
plt.hist(group_b, bins=30, alpha=0.5, label='그룹 B', color='#e74c3c')
plt.hist(group_c, bins=30, alpha=0.5, label='그룹 C', color='#2ecc71')

plt.title('그룹별 데이터 분포 비교')
plt.xlabel('값')
plt.ylabel('빈도')
plt.legend()
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('multiple_histogram.png', dpi=300)
plt.show()
```

## 누적 히스토그램

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = np.random.randn(1000)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 일반 히스토그램
axes[0].hist(data, bins=30, color='steelblue', edgecolor='black', alpha=0.7)
axes[0].set_title('일반 히스토그램')
axes[0].set_xlabel('값')
axes[0].set_ylabel('빈도')

# 누적 히스토그램
axes[1].hist(data, bins=30, cumulative=True, color='coral',
             edgecolor='black', alpha=0.7)
axes[1].set_title('누적 히스토그램')
axes[1].set_xlabel('값')
axes[1].set_ylabel('누적 빈도')

for ax in axes:
    ax.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('cumulative_histogram.png', dpi=300)
plt.show()
```

## 수평 히스토그램

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = np.random.randn(500)

plt.figure(figsize=(8, 10))
plt.hist(data, bins=30, orientation='horizontal',
         color='steelblue', edgecolor='black', alpha=0.7)

plt.title('수평 히스토그램')
plt.xlabel('빈도')
plt.ylabel('값')
plt.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('horizontal_histogram.png', dpi=300)
plt.show()
```

## 2D 히스토그램

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
x = np.random.randn(5000)
y = x + np.random.randn(5000) * 0.5

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# 2D 히스토그램
h = axes[0].hist2d(x, y, bins=50, cmap='Blues')
plt.colorbar(h[3], ax=axes[0], label='빈도')
axes[0].set_title('2D 히스토그램')
axes[0].set_xlabel('X')
axes[0].set_ylabel('Y')

# hexbin (육각형 비닝)
hb = axes[1].hexbin(x, y, gridsize=30, cmap='YlOrRd')
plt.colorbar(hb, ax=axes[1], label='빈도')
axes[1].set_title('Hexbin 히스토그램')
axes[1].set_xlabel('X')
axes[1].set_ylabel('Y')

plt.tight_layout()
plt.savefig('2d_histogram.png', dpi=300)
plt.show()
```

## 스텝 히스토그램

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data1 = np.random.normal(0, 1, 1000)
data2 = np.random.normal(2, 1.2, 1000)

plt.figure(figsize=(10, 6))

plt.hist(data1, bins=30, histtype='step', linewidth=2,
         label='데이터 1', color='#3498db')
plt.hist(data2, bins=30, histtype='step', linewidth=2,
         label='데이터 2', color='#e74c3c')

plt.title('스텝 히스토그램 (겹침 비교에 유용)')
plt.xlabel('값')
plt.ylabel('빈도')
plt.legend()
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('step_histogram.png', dpi=300)
plt.show()
```

## 통계량 표시

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = np.random.exponential(2, 1000)

plt.figure(figsize=(10, 6))
n, bins, patches = plt.hist(data, bins=40, color='steelblue',
                             edgecolor='black', alpha=0.7)

# 통계량 계산
mean = np.mean(data)
median = np.median(data)
std = np.std(data)

# 수직선 추가
plt.axvline(mean, color='red', linestyle='--', linewidth=2, label=f'평균: {mean:.2f}')
plt.axvline(median, color='green', linestyle='-.', linewidth=2, label=f'중앙값: {median:.2f}')

# 텍스트 박스
textstr = f'표준편차: {std:.2f}\n최소: {data.min():.2f}\n최대: {data.max():.2f}'
props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
plt.text(0.95, 0.95, textstr, transform=plt.gca().transAxes, fontsize=10,
         verticalalignment='top', horizontalalignment='right', bbox=props)

plt.title('지수분포 데이터 히스토그램')
plt.xlabel('값')
plt.ylabel('빈도')
plt.legend()
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('histogram_with_stats.png', dpi=300)
plt.show()
```

## 스타일 옵션

### hist() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `bins` | 막대 개수/경계 | `30`, `'auto'`, `[0,1,2,3]` |
| `density` | 밀도 정규화 | `True`, `False` |
| `cumulative` | 누적 여부 | `True`, `False` |
| `histtype` | 히스토그램 타입 | `'bar'`, `'step'`, `'stepfilled'` |
| `orientation` | 방향 | `'vertical'`, `'horizontal'` |
| `alpha` | 투명도 | `0.7` |
| `color` | 막대 색상 | `'steelblue'` |
| `edgecolor` | 테두리 색상 | `'black'` |
| `linewidth` | 테두리 두께 | `1.2` |

### bins 자동 결정 방법
```python
# 자동 결정 (추천)
plt.hist(data, bins='auto')

# Sturges 공식
plt.hist(data, bins='sturges')

# Freedman-Diaconis 공식
plt.hist(data, bins='fd')

# Scott 공식
plt.hist(data, bins='scott')
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 적절한 bins 수 선택
- [ ] 축 레이블과 제목 설정
- [ ] 여러 그룹 비교 시 alpha 조정
- [ ] 필요시 통계량 표시
- [ ] 밀도 곡선 추가 (분포 확인)
- [ ] 이상치 확인
