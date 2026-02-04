# Box Plot Skill

Matplotlib를 사용한 박스 플롯(상자 그림) 생성 가이드입니다.

## 사용 시점

- 데이터의 분포와 이상치를 파악할 때
- 여러 그룹의 분포를 비교할 때
- 중앙값, 사분위수, 범위를 시각화할 때
- 통계적 요약 정보를 한눈에 보여줄 때

## 기본 박스 플롯

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
np.random.seed(42)
data = np.random.randn(100)

# 그래프 생성
plt.figure(figsize=(8, 6))
plt.boxplot(data)

# 스타일 설정
plt.title('기본 박스 플롯', fontsize=14, fontweight='bold')
plt.ylabel('값', fontsize=12)

plt.tight_layout()
plt.savefig('box_plot.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 여러 그룹 비교

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
group_a = np.random.normal(100, 10, 200)
group_b = np.random.normal(90, 20, 200)
group_c = np.random.normal(110, 15, 200)
group_d = np.random.normal(95, 12, 200)

data = [group_a, group_b, group_c, group_d]
labels = ['그룹 A', '그룹 B', '그룹 C', '그룹 D']

plt.figure(figsize=(10, 6))
bp = plt.boxplot(data, labels=labels, patch_artist=True)

# 색상 지정
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)

plt.title('그룹별 데이터 분포 비교')
plt.xlabel('그룹')
plt.ylabel('값')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('grouped_box_plot.png', dpi=300)
plt.show()
```

## 수평 박스 플롯

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = [np.random.normal(0, std, 100) for std in range(1, 5)]
labels = ['Std=1', 'Std=2', 'Std=3', 'Std=4']

plt.figure(figsize=(10, 6))
bp = plt.boxplot(data, labels=labels, vert=False, patch_artist=True)

# 색상 지정
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)

plt.title('수평 박스 플롯')
plt.xlabel('값')
plt.ylabel('그룹')
plt.grid(axis='x', alpha=0.3)

plt.tight_layout()
plt.savefig('horizontal_box_plot.png', dpi=300)
plt.show()
```

## 노치 박스 플롯

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = [np.random.normal(loc, 5, 100) for loc in [50, 55, 45, 60]]
labels = ['A', 'B', 'C', 'D']

plt.figure(figsize=(10, 6))
bp = plt.boxplot(data, labels=labels, notch=True, patch_artist=True)

# 색상 지정
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)

plt.title('노치 박스 플롯 (중앙값 신뢰구간 표시)')
plt.xlabel('그룹')
plt.ylabel('값')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('notched_box_plot.png', dpi=300)
plt.show()
```

## 박스 플롯 + 데이터 포인트

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = [np.random.normal(0, std, 30) for std in range(1, 4)]
labels = ['Low', 'Medium', 'High']

plt.figure(figsize=(10, 6))

# 박스 플롯
bp = plt.boxplot(data, labels=labels, patch_artist=True, widths=0.5)

# 색상 지정
colors = ['#3498db', '#e74c3c', '#2ecc71']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.5)

# 개별 데이터 포인트 (지터 적용)
for i, d in enumerate(data):
    x = np.random.normal(i+1, 0.04, size=len(d))
    plt.scatter(x, d, alpha=0.6, color=colors[i], s=30, edgecolors='black', linewidth=0.5)

plt.title('박스 플롯 + 데이터 포인트')
plt.xlabel('변동성')
plt.ylabel('값')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('box_with_points.png', dpi=300)
plt.show()
```

## 바이올린 플롯 (분포 밀도 포함)

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = [np.random.normal(0, std, 200) for std in range(1, 5)]
labels = ['A', 'B', 'C', 'D']

fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# 박스 플롯
bp = axes[0].boxplot(data, labels=labels, patch_artist=True)
colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)
axes[0].set_title('박스 플롯')
axes[0].set_ylabel('값')
axes[0].grid(axis='y', alpha=0.3)

# 바이올린 플롯
vp = axes[1].violinplot(data, positions=range(1, 5), showmeans=True, showmedians=True)
for i, body in enumerate(vp['bodies']):
    body.set_facecolor(colors[i])
    body.set_alpha(0.7)
axes[1].set_xticks(range(1, 5))
axes[1].set_xticklabels(labels)
axes[1].set_title('바이올린 플롯')
axes[1].set_ylabel('값')
axes[1].grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('box_vs_violin.png', dpi=300)
plt.show()
```

## 그룹화된 박스 플롯

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)

# 데이터 생성
categories = ['Category 1', 'Category 2', 'Category 3']
groups = ['Before', 'After']

data_before = [np.random.normal(50, 10, 50),
               np.random.normal(60, 15, 50),
               np.random.normal(55, 12, 50)]
data_after = [np.random.normal(55, 8, 50),
              np.random.normal(70, 12, 50),
              np.random.normal(65, 10, 50)]

fig, ax = plt.subplots(figsize=(12, 6))

# 위치 설정
positions_before = [1, 4, 7]
positions_after = [2, 5, 8]

bp1 = ax.boxplot(data_before, positions=positions_before, widths=0.6, patch_artist=True)
bp2 = ax.boxplot(data_after, positions=positions_after, widths=0.6, patch_artist=True)

# 색상 지정
for patch in bp1['boxes']:
    patch.set_facecolor('#3498db')
    patch.set_alpha(0.7)
for patch in bp2['boxes']:
    patch.set_facecolor('#e74c3c')
    patch.set_alpha(0.7)

# 축 설정
ax.set_xticks([1.5, 4.5, 7.5])
ax.set_xticklabels(categories)
ax.legend([bp1['boxes'][0], bp2['boxes'][0]], groups, loc='upper left')

plt.title('그룹화된 박스 플롯 (전후 비교)')
plt.ylabel('값')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('grouped_comparison_box.png', dpi=300)
plt.show()
```

## 커스텀 스타일

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)
data = [np.random.normal(loc, 10, 100) for loc in [50, 60, 55, 70]]
labels = ['Q1', 'Q2', 'Q3', 'Q4']

plt.figure(figsize=(10, 6))

bp = plt.boxplot(data, labels=labels, patch_artist=True,
                  boxprops=dict(facecolor='lightblue', color='navy'),
                  whiskerprops=dict(color='navy', linewidth=1.5),
                  capprops=dict(color='navy', linewidth=1.5),
                  medianprops=dict(color='red', linewidth=2),
                  flierprops=dict(marker='o', markerfacecolor='orange',
                                  markersize=8, markeredgecolor='black'))

plt.title('커스텀 스타일 박스 플롯')
plt.xlabel('분기')
plt.ylabel('값')
plt.grid(axis='y', alpha=0.3)

plt.tight_layout()
plt.savefig('custom_box_plot.png', dpi=300)
plt.show()
```

## 스타일 옵션

### boxplot() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `x` | 데이터 (리스트의 리스트) | `[data1, data2]` |
| `labels` | x축 라벨 | `['A', 'B']` |
| `vert` | 수직 여부 | `True` (기본), `False` |
| `notch` | 노치 표시 | `True`, `False` |
| `patch_artist` | 박스 채우기 | `True` (색상 적용시 필수) |
| `widths` | 박스 너비 | `0.5` |
| `showmeans` | 평균 표시 | `True`, `False` |
| `showfliers` | 이상치 표시 | `True` (기본), `False` |

### 스타일 속성
```python
# 박스
boxprops=dict(facecolor='color', color='edgecolor')

# 수염 (whisker)
whiskerprops=dict(color='color', linewidth=1.5)

# 수염 끝 (cap)
capprops=dict(color='color', linewidth=1.5)

# 중앙값
medianprops=dict(color='red', linewidth=2)

# 이상치
flierprops=dict(marker='o', markerfacecolor='red', markersize=6)

# 평균
meanprops=dict(marker='D', markerfacecolor='green', markersize=6)
```

## 박스 플롯 해석

```
      ┌─────────────┐
      │             │ ← 3사분위수 (Q3, 75%)
      │      ─      │ ← 중앙값 (Median, 50%)
      │             │ ← 1사분위수 (Q1, 25%)
      └─────────────┘
           │
    ───────┼─────── ← 최솟값 (Q1 - 1.5*IQR 이내)
           │
           o        ← 이상치 (outlier)

IQR = Q3 - Q1 (사분위범위)
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] patch_artist=True로 색상 적용
- [ ] 축 레이블과 제목 설정
- [ ] 여러 그룹일 경우 범례 추가
- [ ] 그리드 추가 (y축만)
- [ ] 이상치 처리 방법 결정
- [ ] 노치로 중앙값 신뢰구간 표시 (필요시)
