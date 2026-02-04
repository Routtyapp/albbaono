# Subplot Skill

Matplotlib를 사용한 서브플롯(다중 그래프) 생성 가이드입니다.

## 사용 시점

- 여러 그래프를 한 화면에 비교할 때
- 동일 데이터의 다른 관점을 보여줄 때
- 대시보드 스타일 시각화가 필요할 때
- 관련 그래프들을 그룹화할 때

## 기본 서브플롯

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

# 2x2 서브플롯 생성
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 각 서브플롯에 그래프 그리기
axes[0, 0].plot(x, np.sin(x), 'b-')
axes[0, 0].set_title('sin(x)')

axes[0, 1].plot(x, np.cos(x), 'r-')
axes[0, 1].set_title('cos(x)')

axes[1, 0].plot(x, np.exp(x/10), 'g-')
axes[1, 0].set_title('exp(x/10)')

axes[1, 1].plot(x, np.log(x+1), 'm-')
axes[1, 1].set_title('log(x+1)')

# 모든 서브플롯에 그리드 추가
for ax in axes.flat:
    ax.grid(True, alpha=0.3)
    ax.set_xlabel('x')
    ax.set_ylabel('y')

plt.suptitle('기본 2x2 서브플롯', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('basic_subplot.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 다양한 크기의 서브플롯

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

fig = plt.figure(figsize=(14, 8))

# GridSpec으로 다양한 크기 설정
gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)

# 왼쪽 상단: 2열 차지
ax1 = fig.add_subplot(gs[0, :2])
ax1.plot(x, np.sin(x), 'b-', linewidth=2)
ax1.set_title('넓은 차트 (2열)')

# 오른쪽 상단
ax2 = fig.add_subplot(gs[0, 2])
ax2.bar(['A', 'B', 'C'], [3, 7, 5], color='coral')
ax2.set_title('막대 차트')

# 왼쪽 하단
ax3 = fig.add_subplot(gs[1, 0])
ax3.scatter(np.random.randn(50), np.random.randn(50), alpha=0.6)
ax3.set_title('산점도')

# 중앙 하단
ax4 = fig.add_subplot(gs[1, 1])
ax4.pie([30, 40, 30], labels=['A', 'B', 'C'], autopct='%1.1f%%')
ax4.set_title('파이 차트')

# 오른쪽 하단
ax5 = fig.add_subplot(gs[1, 2])
ax5.hist(np.random.randn(100), bins=15, color='steelblue', edgecolor='black')
ax5.set_title('히스토그램')

plt.suptitle('다양한 크기의 서브플롯', fontsize=14, fontweight='bold')
plt.savefig('varied_subplot.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 가로/세로 1열 배치

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

# 1행 3열 (가로 배치)
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].plot(x, np.sin(x), 'b-')
axes[0].set_title('sin(x)')

axes[1].plot(x, np.cos(x), 'r-')
axes[1].set_title('cos(x)')

axes[2].plot(x, np.tan(x), 'g-')
axes[2].set_ylim(-5, 5)
axes[2].set_title('tan(x)')

for ax in axes:
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('horizontal_subplots.png', dpi=300)
plt.show()

# 3행 1열 (세로 배치)
fig, axes = plt.subplots(3, 1, figsize=(10, 10))

axes[0].plot(x, np.sin(x), 'b-')
axes[0].set_title('sin(x)')

axes[1].plot(x, np.cos(x), 'r-')
axes[1].set_title('cos(x)')

axes[2].plot(x, np.sin(x) + np.cos(x), 'g-')
axes[2].set_title('sin(x) + cos(x)')

for ax in axes:
    ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('vertical_subplots.png', dpi=300)
plt.show()
```

## 축 공유

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

# X축 공유
fig, axes = plt.subplots(3, 1, figsize=(10, 8), sharex=True)

axes[0].plot(x, np.sin(x), 'b-')
axes[0].set_ylabel('sin(x)')

axes[1].plot(x, np.cos(x), 'r-')
axes[1].set_ylabel('cos(x)')

axes[2].plot(x, np.sin(x) * np.cos(x), 'g-')
axes[2].set_ylabel('sin*cos')
axes[2].set_xlabel('x (공유됨)')

for ax in axes:
    ax.grid(True, alpha=0.3)

plt.suptitle('X축 공유 서브플롯')
plt.tight_layout()
plt.savefig('shared_x_axis.png', dpi=300)
plt.show()

# Y축 공유
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)

axes[0].plot(x, np.sin(x), 'b-')
axes[0].set_title('sin(x)')
axes[0].set_ylabel('y (공유됨)')

axes[1].plot(x, np.cos(x), 'r-')
axes[1].set_title('cos(x)')

axes[2].plot(x, 0.5 * np.sin(2*x), 'g-')
axes[2].set_title('0.5*sin(2x)')

for ax in axes:
    ax.grid(True, alpha=0.3)
    ax.set_xlabel('x')

plt.tight_layout()
plt.savefig('shared_y_axis.png', dpi=300)
plt.show()
```

## 중첩 서브플롯

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

fig, ax_main = plt.subplots(figsize=(10, 8))

# 메인 차트
ax_main.plot(x, np.sin(x), 'b-', linewidth=2, label='sin(x)')
ax_main.plot(x, np.cos(x), 'r-', linewidth=2, label='cos(x)')
ax_main.set_title('메인 차트', fontsize=14)
ax_main.set_xlabel('x')
ax_main.set_ylabel('y')
ax_main.legend()
ax_main.grid(True, alpha=0.3)

# 중첩 차트 (inset)
ax_inset = fig.add_axes([0.55, 0.55, 0.3, 0.3])  # [left, bottom, width, height]
ax_inset.plot(x, np.sin(x) * np.cos(x), 'g-', linewidth=1.5)
ax_inset.set_title('sin(x)*cos(x)', fontsize=10)
ax_inset.grid(True, alpha=0.3)

plt.savefig('nested_subplot.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 대시보드 스타일

```python
import matplotlib.pyplot as plt
import numpy as np

np.random.seed(42)

fig = plt.figure(figsize=(16, 10))

# 레이아웃 정의
gs = fig.add_gridspec(3, 4, hspace=0.35, wspace=0.3)

# 상단 전체: 라인 차트
ax1 = fig.add_subplot(gs[0, :])
x = np.linspace(0, 100, 100)
ax1.plot(x, np.cumsum(np.random.randn(100)), 'b-', label='시리즈 A')
ax1.plot(x, np.cumsum(np.random.randn(100)), 'r-', label='시리즈 B')
ax1.set_title('추이 분석', fontsize=12, fontweight='bold')
ax1.legend()
ax1.grid(True, alpha=0.3)

# 중단 왼쪽: 막대 차트
ax2 = fig.add_subplot(gs[1, :2])
categories = ['A', 'B', 'C', 'D', 'E']
values = [23, 45, 56, 78, 32]
ax2.bar(categories, values, color='steelblue')
ax2.set_title('카테고리별 현황', fontsize=12)
ax2.grid(axis='y', alpha=0.3)

# 중단 오른쪽: 파이 차트
ax3 = fig.add_subplot(gs[1, 2:])
labels = ['제품A', '제품B', '제품C', '기타']
sizes = [35, 30, 20, 15]
ax3.pie(sizes, labels=labels, autopct='%1.1f%%',
        colors=['#3498db', '#e74c3c', '#2ecc71', '#95a5a6'])
ax3.set_title('제품 비율', fontsize=12)

# 하단 왼쪽: 산점도
ax4 = fig.add_subplot(gs[2, 0:2])
ax4.scatter(np.random.randn(50), np.random.randn(50), alpha=0.6, c='coral', s=50)
ax4.set_title('상관관계 분석', fontsize=12)
ax4.grid(True, alpha=0.3)

# 하단 중앙: 히스토그램
ax5 = fig.add_subplot(gs[2, 2])
ax5.hist(np.random.randn(200), bins=20, color='steelblue', edgecolor='black')
ax5.set_title('분포 분석', fontsize=12)
ax5.grid(axis='y', alpha=0.3)

# 하단 오른쪽: 박스 플롯
ax6 = fig.add_subplot(gs[2, 3])
data = [np.random.normal(0, std, 50) for std in [1, 2, 3]]
bp = ax6.boxplot(data, labels=['Low', 'Med', 'High'], patch_artist=True)
for patch, color in zip(bp['boxes'], ['#3498db', '#e74c3c', '#2ecc71']):
    patch.set_facecolor(color)
    patch.set_alpha(0.7)
ax6.set_title('변동성 비교', fontsize=12)
ax6.grid(axis='y', alpha=0.3)

plt.suptitle('데이터 대시보드', fontsize=16, fontweight='bold', y=1.02)
plt.savefig('dashboard.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 스타일 옵션

### subplots() 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `nrows`, `ncols` | 행/열 수 | `2, 3` |
| `figsize` | 전체 크기 | `(12, 8)` |
| `sharex`, `sharey` | 축 공유 | `True`, `False`, `'col'`, `'row'` |
| `squeeze` | 1D 배열 반환 | `True` (기본) |
| `gridspec_kw` | GridSpec 옵션 | `dict(height_ratios=[2,1])` |

### GridSpec 옵션
```python
# 높이/너비 비율 설정
fig, axes = plt.subplots(2, 1, figsize=(10, 8),
                          gridspec_kw={'height_ratios': [2, 1]})

# 간격 설정
gs = fig.add_gridspec(2, 2, hspace=0.3, wspace=0.3)
```

### 개별 서브플롯 위치
```python
# add_axes: [left, bottom, width, height] (0~1 범위)
ax = fig.add_axes([0.1, 0.1, 0.8, 0.8])

# add_subplot: (rows, cols, index)
ax = fig.add_subplot(2, 2, 1)  # 또는 fig.add_subplot(221)
```

## 서브플롯 간 요소 조절

```python
# 전체 여백 조절
plt.tight_layout()

# 더 세밀한 조절
plt.subplots_adjust(left=0.1, right=0.9, top=0.9, bottom=0.1,
                    wspace=0.2, hspace=0.3)

# 전체 제목 공간 확보
plt.suptitle('제목', y=1.02)
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 적절한 figsize 설정
- [ ] tight_layout() 또는 subplots_adjust() 적용
- [ ] 각 서브플롯에 제목/레이블 설정
- [ ] 필요시 축 공유 설정
- [ ] 전체 제목 (suptitle) 추가
- [ ] 그리드/범례 일관성 유지
