# Heatmap Skill

Matplotlib를 사용한 히트맵 생성 가이드입니다.

## 사용 시점

- 행렬 형태의 데이터를 시각화할 때
- 상관관계 매트릭스를 표현할 때
- 시간/카테고리별 패턴을 파악할 때
- 밀도나 강도 데이터를 표현할 때

## 기본 히트맵

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
data = np.random.rand(5, 7)
row_labels = ['A', 'B', 'C', 'D', 'E']
col_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

# 그래프 생성
plt.figure(figsize=(10, 6))
im = plt.imshow(data, cmap='YlOrRd', aspect='auto')

# 축 설정
plt.xticks(np.arange(len(col_labels)), col_labels)
plt.yticks(np.arange(len(row_labels)), row_labels)

# 컬러바 추가
cbar = plt.colorbar(im)
cbar.set_label('값', fontsize=12)

plt.title('기본 히트맵', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('heatmap.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 값 표시가 있는 히트맵

```python
import matplotlib.pyplot as plt
import numpy as np

data = np.random.randint(0, 100, (6, 8))
row_labels = ['제품A', '제품B', '제품C', '제품D', '제품E', '제품F']
col_labels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월']

fig, ax = plt.subplots(figsize=(12, 8))
im = ax.imshow(data, cmap='Blues')

# 축 설정
ax.set_xticks(np.arange(len(col_labels)))
ax.set_yticks(np.arange(len(row_labels)))
ax.set_xticklabels(col_labels)
ax.set_yticklabels(row_labels)

# 각 셀에 값 표시
for i in range(len(row_labels)):
    for j in range(len(col_labels)):
        text_color = 'white' if data[i, j] > 50 else 'black'
        ax.text(j, i, data[i, j], ha='center', va='center',
                color=text_color, fontsize=10)

plt.colorbar(im, label='판매량')
plt.title('월별 제품 판매량')
plt.tight_layout()
plt.savefig('annotated_heatmap.png', dpi=300)
plt.show()
```

## 상관관계 히트맵

```python
import matplotlib.pyplot as plt
import numpy as np

# 상관계수 매트릭스 (예시)
variables = ['변수A', '변수B', '변수C', '변수D', '변수E']
n = len(variables)
corr_matrix = np.random.rand(n, n)
corr_matrix = (corr_matrix + corr_matrix.T) / 2  # 대칭 행렬
np.fill_diagonal(corr_matrix, 1)  # 대각선 = 1
corr_matrix = corr_matrix * 2 - 1  # -1 ~ 1 범위

fig, ax = plt.subplots(figsize=(10, 8))
im = ax.imshow(corr_matrix, cmap='RdBu_r', vmin=-1, vmax=1)

ax.set_xticks(np.arange(n))
ax.set_yticks(np.arange(n))
ax.set_xticklabels(variables, rotation=45, ha='right')
ax.set_yticklabels(variables)

# 값 표시
for i in range(n):
    for j in range(n):
        text_color = 'white' if abs(corr_matrix[i, j]) > 0.5 else 'black'
        ax.text(j, i, f'{corr_matrix[i, j]:.2f}', ha='center', va='center',
                color=text_color, fontsize=10)

plt.colorbar(im, label='상관계수')
plt.title('변수 간 상관관계 히트맵')
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=300)
plt.show()
```

## 시간별 패턴 히트맵

```python
import matplotlib.pyplot as plt
import numpy as np

# 시간대별 요일별 데이터
hours = [f'{i}:00' for i in range(24)]
days = ['월', '화', '수', '목', '금', '토', '일']

# 샘플 데이터 (출퇴근 패턴)
data = np.random.rand(7, 24) * 50
data[:, 7:10] += 30  # 출근 시간
data[:, 17:20] += 30  # 퇴근 시간
data[5:, :] *= 0.5   # 주말

fig, ax = plt.subplots(figsize=(16, 6))
im = ax.imshow(data, cmap='YlGnBu', aspect='auto')

ax.set_xticks(np.arange(24))
ax.set_yticks(np.arange(7))
ax.set_xticklabels(hours, rotation=45, ha='right')
ax.set_yticklabels(days)

plt.colorbar(im, label='활동량')
plt.title('시간대별 요일별 활동 패턴')
plt.xlabel('시간')
plt.ylabel('요일')
plt.tight_layout()
plt.savefig('time_pattern_heatmap.png', dpi=300)
plt.show()
```

## Seaborn 스타일 히트맵

```python
import matplotlib.pyplot as plt
import numpy as np

# Seaborn 없이 유사한 스타일 구현
data = np.random.rand(8, 10)
row_labels = [f'Row {i+1}' for i in range(8)]
col_labels = [f'Col {i+1}' for i in range(10)]

fig, ax = plt.subplots(figsize=(12, 8))

# pcolormesh 사용 (imshow 대안)
im = ax.pcolormesh(data, cmap='viridis', edgecolors='white', linewidths=2)

# 축 설정
ax.set_xticks(np.arange(len(col_labels)) + 0.5)
ax.set_yticks(np.arange(len(row_labels)) + 0.5)
ax.set_xticklabels(col_labels)
ax.set_yticklabels(row_labels)

# 값 표시
for i in range(len(row_labels)):
    for j in range(len(col_labels)):
        ax.text(j + 0.5, i + 0.5, f'{data[i, j]:.2f}',
                ha='center', va='center', color='white', fontsize=9)

plt.colorbar(im)
plt.title('Seaborn 스타일 히트맵')
plt.tight_layout()
plt.savefig('seaborn_style_heatmap.png', dpi=300)
plt.show()
```

## 마스크가 있는 히트맵 (삼각 행렬)

```python
import matplotlib.pyplot as plt
import numpy as np

# 상관계수 매트릭스
n = 6
labels = ['A', 'B', 'C', 'D', 'E', 'F']
corr = np.random.rand(n, n)
corr = (corr + corr.T) / 2
np.fill_diagonal(corr, 1)

# 상삼각 마스크 생성
mask = np.triu(np.ones_like(corr, dtype=bool))

fig, ax = plt.subplots(figsize=(10, 8))

# 마스크 적용
masked_corr = np.ma.masked_where(mask, corr)
im = ax.imshow(masked_corr, cmap='coolwarm', vmin=0, vmax=1)

ax.set_xticks(np.arange(n))
ax.set_yticks(np.arange(n))
ax.set_xticklabels(labels)
ax.set_yticklabels(labels)

# 값 표시 (하삼각만)
for i in range(n):
    for j in range(i):
        ax.text(j, i, f'{corr[i, j]:.2f}', ha='center', va='center', fontsize=10)

plt.colorbar(im, label='상관계수')
plt.title('하삼각 상관관계 히트맵')
plt.tight_layout()
plt.savefig('triangular_heatmap.png', dpi=300)
plt.show()
```

## 컬러맵 추천

### 순차형 (값의 크기)
- `'viridis'` - 기본 추천
- `'YlOrRd'` - 노랑-주황-빨강
- `'Blues'`, `'Greens'`, `'Reds'`
- `'YlGnBu'` - 노랑-녹색-파랑

### 발산형 (중심값 기준 양방향)
- `'RdBu_r'` - 빨강-흰-파랑 (상관관계)
- `'coolwarm'` - 차가운-따뜻한
- `'seismic'` - 지진 컬러맵
- `'PiYG'` - 분홍-녹색

### 주요 파라미터
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `cmap` | 컬러맵 | `'viridis'`, `'RdBu_r'` |
| `vmin`, `vmax` | 값 범위 | `vmin=-1, vmax=1` |
| `aspect` | 종횡비 | `'auto'`, `'equal'` |
| `interpolation` | 보간 방식 | `'nearest'`, `'bilinear'` |

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 적절한 컬러맵 선택
- [ ] 축 레이블 설정
- [ ] 컬러바 추가 및 레이블
- [ ] 필요시 셀에 값 표시
- [ ] 값 표시 시 가독성 (텍스트 색상)
- [ ] vmin, vmax로 범위 지정 (발산형)
