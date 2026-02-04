# Dual Axis Skill

Matplotlib를 사용한 이중 축 그래프 생성 가이드입니다.

## 사용 시점

- 스케일이 다른 두 데이터를 함께 표시할 때
- 단위가 다른 변수들의 관계를 보여줄 때
- 온도와 강수량, 매출과 성장률 등 비교할 때

## 기본 이중 Y축

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
months = ['1월', '2월', '3월', '4월', '5월', '6월']
sales = [100, 120, 140, 160, 150, 180]
growth_rate = [5, 8, 12, 15, 10, 18]

# 그래프 생성
fig, ax1 = plt.subplots(figsize=(10, 6))

# 첫 번째 Y축 (왼쪽) - 막대 그래프
color1 = '#3498db'
ax1.bar(months, sales, color=color1, alpha=0.7, label='매출')
ax1.set_xlabel('월')
ax1.set_ylabel('매출 (백만원)', color=color1)
ax1.tick_params(axis='y', labelcolor=color1)

# 두 번째 Y축 (오른쪽) - 라인 그래프
ax2 = ax1.twinx()
color2 = '#e74c3c'
ax2.plot(months, growth_rate, color=color2, marker='o', linewidth=2, label='성장률')
ax2.set_ylabel('성장률 (%)', color=color2)
ax2.tick_params(axis='y', labelcolor=color2)

# 범례 통합
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')

plt.title('월별 매출과 성장률', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('dual_axis.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 두 개의 라인 그래프

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
x = np.arange(2018, 2024)
temperature = [15.2, 15.8, 16.1, 14.9, 15.5, 16.3]  # 섭씨
rainfall = [1200, 1350, 1100, 1450, 1300, 1250]      # mm

fig, ax1 = plt.subplots(figsize=(10, 6))

# 왼쪽 Y축: 온도
color1 = '#e74c3c'
ax1.plot(x, temperature, color=color1, marker='o', linewidth=2, markersize=8, label='평균 기온')
ax1.set_xlabel('연도', fontsize=12)
ax1.set_ylabel('평균 기온 (°C)', color=color1, fontsize=12)
ax1.tick_params(axis='y', labelcolor=color1)
ax1.set_ylim(14, 17)

# 오른쪽 Y축: 강수량
ax2 = ax1.twinx()
color2 = '#3498db'
ax2.plot(x, rainfall, color=color2, marker='s', linewidth=2, markersize=8, label='연강수량')
ax2.set_ylabel('연강수량 (mm)', color=color2, fontsize=12)
ax2.tick_params(axis='y', labelcolor=color2)
ax2.set_ylim(1000, 1600)

# 범례
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right')

# 그리드 (첫 번째 축만)
ax1.grid(True, alpha=0.3)

plt.title('연도별 기온과 강수량 변화', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('dual_line_chart.png', dpi=300)
plt.show()
```

## 막대 + 라인 조합

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터
categories = ['제품A', '제품B', '제품C', '제품D', '제품E']
revenue = [450, 320, 280, 190, 150]
margin_rate = [25, 18, 32, 15, 28]

fig, ax1 = plt.subplots(figsize=(10, 6))

# 막대 그래프 (매출)
x = np.arange(len(categories))
bars = ax1.bar(x, revenue, color='#3498db', alpha=0.7, width=0.6, label='매출')
ax1.set_xlabel('제품')
ax1.set_ylabel('매출 (백만원)', color='#3498db')
ax1.tick_params(axis='y', labelcolor='#3498db')
ax1.set_xticks(x)
ax1.set_xticklabels(categories)

# 막대 위에 값 표시
for bar, val in zip(bars, revenue):
    ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
             f'{val}', ha='center', va='bottom', fontsize=10)

# 라인 그래프 (이익률)
ax2 = ax1.twinx()
line = ax2.plot(x, margin_rate, color='#e74c3c', marker='o',
                linewidth=2.5, markersize=10, label='이익률')
ax2.set_ylabel('이익률 (%)', color='#e74c3c')
ax2.tick_params(axis='y', labelcolor='#e74c3c')
ax2.set_ylim(0, 40)

# 라인 위에 값 표시
for i, val in enumerate(margin_rate):
    ax2.text(i, val + 2, f'{val}%', ha='center', fontsize=10, color='#e74c3c')

# 범례
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right')

ax1.grid(axis='y', alpha=0.3)

plt.title('제품별 매출과 이익률', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('bar_line_dual.png', dpi=300)
plt.show()
```

## 이중 X축

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터
celsius = np.arange(-20, 41, 10)
values = [10, 15, 25, 40, 55, 65, 70]

fig, ax1 = plt.subplots(figsize=(10, 6))

# 기본 X축 (섭씨)
ax1.plot(celsius, values, 'b-o', linewidth=2, markersize=8)
ax1.set_xlabel('온도 (°C)', fontsize=12)
ax1.set_ylabel('값', fontsize=12)
ax1.grid(True, alpha=0.3)

# 두 번째 X축 (화씨)
ax2 = ax1.twiny()
fahrenheit = celsius * 9/5 + 32
ax2.set_xlim(ax1.get_xlim()[0] * 9/5 + 32, ax1.get_xlim()[1] * 9/5 + 32)
ax2.set_xlabel('온도 (°F)', fontsize=12)

plt.title('온도에 따른 값 변화 (섭씨/화씨)', fontsize=14, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('dual_x_axis.png', dpi=300)
plt.show()
```

## 세 개의 Y축

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터
x = np.arange(1, 13)
temperature = [5, 7, 12, 18, 23, 28, 30, 29, 24, 17, 10, 6]
humidity = [80, 75, 65, 60, 55, 50, 55, 60, 65, 70, 75, 80]
uv_index = [2, 3, 5, 7, 9, 11, 12, 10, 7, 4, 2, 1]

fig, ax1 = plt.subplots(figsize=(12, 6))

# 첫 번째 Y축: 온도
color1 = '#e74c3c'
ax1.plot(x, temperature, color=color1, marker='o', linewidth=2, label='기온')
ax1.set_xlabel('월')
ax1.set_ylabel('기온 (°C)', color=color1)
ax1.tick_params(axis='y', labelcolor=color1)

# 두 번째 Y축: 습도
ax2 = ax1.twinx()
color2 = '#3498db'
ax2.plot(x, humidity, color=color2, marker='s', linewidth=2, label='습도')
ax2.set_ylabel('습도 (%)', color=color2)
ax2.tick_params(axis='y', labelcolor=color2)

# 세 번째 Y축: UV 지수 (오프셋)
ax3 = ax1.twinx()
ax3.spines['right'].set_position(('outward', 60))  # 오른쪽으로 60pt 이동
color3 = '#f39c12'
ax3.plot(x, uv_index, color=color3, marker='^', linewidth=2, label='UV 지수')
ax3.set_ylabel('UV 지수', color=color3)
ax3.tick_params(axis='y', labelcolor=color3)

# 범례
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
lines3, labels3 = ax3.get_legend_handles_labels()
ax1.legend(lines1 + lines2 + lines3, labels1 + labels2 + labels3, loc='upper left')

ax1.set_xticks(x)
ax1.set_xticklabels([f'{i}월' for i in x])
ax1.grid(True, alpha=0.3)

plt.title('월별 기상 데이터', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('triple_y_axis.png', dpi=300)
plt.show()
```

## 영역 채우기 포함

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터
months = np.arange(1, 13)
revenue = [80, 95, 110, 130, 145, 160, 175, 170, 155, 140, 120, 100]
target = [100] * 12

fig, ax1 = plt.subplots(figsize=(12, 6))

# 막대 그래프 (매출)
bars = ax1.bar(months, revenue, color='#3498db', alpha=0.7, label='실제 매출')
ax1.axhline(y=100, color='gray', linestyle='--', linewidth=1.5, label='목표')
ax1.set_xlabel('월')
ax1.set_ylabel('매출 (백만원)', color='#3498db')
ax1.tick_params(axis='y', labelcolor='#3498db')
ax1.set_xticks(months)
ax1.set_xticklabels([f'{i}월' for i in months])

# 누적 성장률 (오른쪽 축)
ax2 = ax1.twinx()
cumulative_growth = np.cumsum(np.array(revenue) - 100) / 100 * 10  # 임의 계산
ax2.fill_between(months, 0, cumulative_growth,
                  where=(np.array(cumulative_growth) >= 0),
                  color='#2ecc71', alpha=0.3, label='초과 달성')
ax2.fill_between(months, 0, cumulative_growth,
                  where=(np.array(cumulative_growth) < 0),
                  color='#e74c3c', alpha=0.3, label='미달성')
ax2.plot(months, cumulative_growth, 'k-', linewidth=1.5)
ax2.axhline(y=0, color='black', linewidth=0.5)
ax2.set_ylabel('누적 목표 대비 (%)', color='black')

# 범례
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')

ax1.grid(axis='y', alpha=0.3)

plt.title('월별 매출 실적과 목표 대비 현황', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('dual_with_fill.png', dpi=300)
plt.show()
```

## 스타일 옵션

### twinx() / twiny() 사용법
```python
# Y축 공유, X축 별도
ax2 = ax1.twinx()

# X축 공유, Y축 별도
ax2 = ax1.twiny()
```

### 축 위치 조정
```python
# 오른쪽 축을 더 오른쪽으로 이동
ax2.spines['right'].set_position(('outward', 60))

# 축 색상 변경
ax2.spines['right'].set_color('red')
```

### 눈금 스타일
```python
# 눈금 라벨 색상
ax1.tick_params(axis='y', labelcolor='blue')

# 눈금 위치/방향
ax1.tick_params(axis='y', direction='in', length=6)
```

## 범례 통합 방법

```python
# 방법 1: get_legend_handles_labels() 사용
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='best')

# 방법 2: 수동 지정
from matplotlib.lines import Line2D
legend_elements = [
    Line2D([0], [0], color='blue', label='데이터 1'),
    Line2D([0], [0], color='red', label='데이터 2')
]
ax1.legend(handles=legend_elements)
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] 각 축의 레이블과 색상 매칭
- [ ] 범례 통합 및 위치 설정
- [ ] Y축 범위 적절히 설정
- [ ] 그리드는 하나의 축에만 적용
- [ ] 스케일 차이가 크면 로그 스케일 고려
- [ ] 세 개 이상의 축은 가독성 저하 주의
