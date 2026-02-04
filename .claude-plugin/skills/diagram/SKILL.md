# Diagram Skill

Matplotlib를 사용한 다이어그램 생성 가이드입니다.

## 사용 시점

- 프로세스 흐름을 시각화할 때
- 조직도나 계층 구조를 표현할 때
- 관계도나 네트워크를 그릴 때
- 벤 다이어그램으로 집합 관계를 보여줄 때

## 플로우차트 (프로세스 다이어그램)

```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(12, 10))
ax.set_xlim(0, 10)
ax.set_ylim(0, 12)
ax.axis('off')

# 색상 정의
start_color = '#2ecc71'
process_color = '#3498db'
decision_color = '#f39c12'
end_color = '#e74c3c'

# 시작 노드
start = mpatches.FancyBboxPatch((4, 10.5), 2, 0.8, boxstyle="round,pad=0.05",
                                  facecolor=start_color, edgecolor='black')
ax.add_patch(start)
ax.text(5, 10.9, '시작', ha='center', va='center', fontsize=12, fontweight='bold')

# 프로세스 노드
process1 = mpatches.FancyBboxPatch((3.5, 8.5), 3, 1, boxstyle="round,pad=0.05",
                                    facecolor=process_color, edgecolor='black')
ax.add_patch(process1)
ax.text(5, 9, '데이터 입력', ha='center', va='center', fontsize=11, color='white')

# 결정 노드 (다이아몬드)
decision = mpatches.RegularPolygon((5, 6.5), numVertices=4, radius=1,
                                    orientation=0.785, facecolor=decision_color, edgecolor='black')
ax.add_patch(decision)
ax.text(5, 6.5, '유효한가?', ha='center', va='center', fontsize=10)

# 프로세스 노드 2
process2 = mpatches.FancyBboxPatch((6.5, 5.5), 2.5, 1, boxstyle="round,pad=0.05",
                                    facecolor=process_color, edgecolor='black')
ax.add_patch(process2)
ax.text(7.75, 6, '처리 실행', ha='center', va='center', fontsize=11, color='white')

# 에러 처리 노드
error = mpatches.FancyBboxPatch((1, 5.5), 2.5, 1, boxstyle="round,pad=0.05",
                                 facecolor='#e74c3c', edgecolor='black')
ax.add_patch(error)
ax.text(2.25, 6, '에러 처리', ha='center', va='center', fontsize=11, color='white')

# 종료 노드
end = mpatches.FancyBboxPatch((4, 3), 2, 0.8, boxstyle="round,pad=0.05",
                               facecolor=end_color, edgecolor='black')
ax.add_patch(end)
ax.text(5, 3.4, '종료', ha='center', va='center', fontsize=12, fontweight='bold', color='white')

# 화살표 연결
arrow_style = dict(arrowstyle='->', color='black', lw=1.5)
ax.annotate('', xy=(5, 9.5), xytext=(5, 10.5), arrowprops=arrow_style)
ax.annotate('', xy=(5, 7.5), xytext=(5, 8.5), arrowprops=arrow_style)
ax.annotate('', xy=(6.5, 6), xytext=(5.7, 6.5), arrowprops=arrow_style)
ax.annotate('', xy=(3.5, 6), xytext=(4.3, 6.5), arrowprops=arrow_style)
ax.annotate('', xy=(5, 3.8), xytext=(6.5, 5.5), arrowprops=arrow_style)
ax.annotate('', xy=(5, 3.8), xytext=(3.5, 5.5), arrowprops=arrow_style)

# Yes/No 레이블
ax.text(6.1, 6.8, 'Yes', fontsize=9, color='green')
ax.text(3.6, 6.8, 'No', fontsize=9, color='red')

plt.title('프로세스 플로우차트', fontsize=14, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('flowchart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 조직도 (계층 다이어그램)

```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis('off')

def draw_box(ax, x, y, text, color='#3498db', width=2, height=0.8):
    box = mpatches.FancyBboxPatch((x-width/2, y-height/2), width, height,
                                   boxstyle="round,pad=0.05",
                                   facecolor=color, edgecolor='black', linewidth=1.5)
    ax.add_patch(box)
    ax.text(x, y, text, ha='center', va='center', fontsize=10, fontweight='bold', color='white')

def draw_line(ax, x1, y1, x2, y2):
    ax.plot([x1, x2], [y1, y2], 'k-', linewidth=1.5)

# CEO
draw_box(ax, 7, 9, 'CEO', color='#e74c3c', width=2.5)

# 임원진
executives = [('CTO', 3), ('CFO', 7), ('CMO', 11)]
for name, x in executives:
    draw_box(ax, x, 7, name, color='#f39c12')
    draw_line(ax, 7, 8.6, x, 7.4)

# 팀장
teams = [
    ('개발팀장', 1.5), ('QA팀장', 4.5),  # CTO 산하
    ('회계팀장', 7),                       # CFO 산하
    ('마케팅팀장', 9.5), ('영업팀장', 12.5) # CMO 산하
]
team_colors = ['#3498db', '#3498db', '#2ecc71', '#9b59b6', '#9b59b6']
parent_x = [3, 3, 7, 11, 11]

for (name, x), color, px in zip(teams, team_colors, parent_x):
    draw_box(ax, x, 5, name, color=color)
    draw_line(ax, px, 6.6, x, 5.4)

# 팀원
members = [
    [('개발자1', 0.5), ('개발자2', 2.5)],
    [('QA1', 4), ('QA2', 5)],
    [('회계사', 7)],
    [('마케터', 9.5)],
    [('영업1', 12), ('영업2', 13)]
]
member_parents = [1.5, 4.5, 7, 9.5, 12.5]

for member_group, parent_x in zip(members, member_parents):
    for name, x in member_group:
        draw_box(ax, x, 3, name, color='#95a5a6', width=1.5, height=0.6)
        draw_line(ax, parent_x, 4.6, x, 3.3)

plt.title('조직도', fontsize=16, fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('org_chart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 벤 다이어그램

```python
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
import numpy as np

fig, ax = plt.subplots(figsize=(10, 8))

# 세 개의 원
colors = ['#3498db', '#e74c3c', '#2ecc71']
alpha = 0.5

circle1 = Circle((3, 4), 2.5, color=colors[0], alpha=alpha, label='집합 A')
circle2 = Circle((5, 4), 2.5, color=colors[1], alpha=alpha, label='집합 B')
circle3 = Circle((4, 6), 2.5, color=colors[2], alpha=alpha, label='집합 C')

ax.add_patch(circle1)
ax.add_patch(circle2)
ax.add_patch(circle3)

# 레이블
ax.text(1.5, 3.5, 'A만\n(15)', ha='center', va='center', fontsize=11)
ax.text(6.5, 3.5, 'B만\n(20)', ha='center', va='center', fontsize=11)
ax.text(4, 7.5, 'C만\n(25)', ha='center', va='center', fontsize=11)
ax.text(4, 3, 'A∩B\n(5)', ha='center', va='center', fontsize=10)
ax.text(2.5, 5.5, 'A∩C\n(8)', ha='center', va='center', fontsize=10)
ax.text(5.5, 5.5, 'B∩C\n(10)', ha='center', va='center', fontsize=10)
ax.text(4, 4.8, 'A∩B∩C\n(3)', ha='center', va='center', fontsize=9, fontweight='bold')

ax.set_xlim(0, 8)
ax.set_ylim(0, 10)
ax.set_aspect('equal')
ax.axis('off')
ax.legend(loc='upper right')

plt.title('벤 다이어그램', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('venn_diagram.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 네트워크 다이어그램 (간단한 버전)

```python
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(12, 10))

# 노드 위치
nodes = {
    'Server': (5, 8),
    'Router': (5, 5),
    'PC1': (2, 2),
    'PC2': (5, 2),
    'PC3': (8, 2),
    'Printer': (1, 5),
    'Database': (9, 8)
}

# 연결
connections = [
    ('Server', 'Router'),
    ('Router', 'PC1'),
    ('Router', 'PC2'),
    ('Router', 'PC3'),
    ('Router', 'Printer'),
    ('Server', 'Database')
]

# 노드 색상
node_colors = {
    'Server': '#e74c3c',
    'Router': '#f39c12',
    'PC1': '#3498db',
    'PC2': '#3498db',
    'PC3': '#3498db',
    'Printer': '#9b59b6',
    'Database': '#2ecc71'
}

# 연결선 그리기
for start, end in connections:
    x1, y1 = nodes[start]
    x2, y2 = nodes[end]
    ax.plot([x1, x2], [y1, y2], 'gray', linewidth=2, zorder=1)

# 노드 그리기
for name, (x, y) in nodes.items():
    circle = plt.Circle((x, y), 0.6, color=node_colors[name], ec='black', lw=2, zorder=2)
    ax.add_patch(circle)
    ax.text(x, y-1, name, ha='center', fontsize=10, fontweight='bold')

ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.set_aspect('equal')
ax.axis('off')

plt.title('네트워크 다이어그램', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('network_diagram.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 타임라인 다이어그램

```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(14, 6))

# 이벤트 데이터
events = [
    ('2020-01', '프로젝트 시작', '#3498db'),
    ('2020-06', '1차 개발 완료', '#2ecc71'),
    ('2021-01', '베타 출시', '#f39c12'),
    ('2021-06', '정식 출시', '#e74c3c'),
    ('2022-01', '버전 2.0', '#9b59b6'),
]

# 타임라인 기준선
ax.axhline(y=0.5, color='gray', linewidth=3, zorder=1)

# 이벤트 표시
for i, (date, event, color) in enumerate(events):
    x = i + 1
    # 점
    ax.scatter(x, 0.5, s=200, c=color, zorder=2, edgecolors='black', linewidth=2)

    # 라벨 (위아래 번갈아)
    if i % 2 == 0:
        y_text = 0.7
        va = 'bottom'
    else:
        y_text = 0.3
        va = 'top'

    ax.annotate(f'{event}\n({date})', xy=(x, 0.5), xytext=(x, y_text),
                ha='center', va=va, fontsize=10,
                arrowprops=dict(arrowstyle='-', color='gray'),
                bbox=dict(boxstyle='round,pad=0.3', facecolor=color, alpha=0.3))

ax.set_xlim(0, len(events) + 1)
ax.set_ylim(0, 1)
ax.axis('off')

plt.title('프로젝트 타임라인', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('timeline.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 간트 차트

```python
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(14, 8))

# 작업 데이터 (작업명, 시작일, 기간, 색상)
tasks = [
    ('기획', 0, 2, '#3498db'),
    ('디자인', 1, 3, '#2ecc71'),
    ('프론트엔드 개발', 3, 5, '#f39c12'),
    ('백엔드 개발', 3, 6, '#e74c3c'),
    ('테스트', 8, 2, '#9b59b6'),
    ('배포', 10, 1, '#1abc9c'),
]

# 막대 그리기
for i, (task, start, duration, color) in enumerate(tasks):
    ax.barh(i, duration, left=start, height=0.5, color=color,
            edgecolor='black', linewidth=1)
    ax.text(start + duration/2, i, task, ha='center', va='center',
            fontsize=10, fontweight='bold', color='white')

# 축 설정
ax.set_yticks(range(len(tasks)))
ax.set_yticklabels([t[0] for t in tasks])
ax.set_xlabel('기간 (주)', fontsize=12)
ax.set_xlim(0, 12)

# 그리드
ax.xaxis.grid(True, alpha=0.3)
ax.set_axisbelow(True)

# 오늘 표시 (예: 5주차)
ax.axvline(x=5, color='red', linestyle='--', linewidth=2, label='현재')
ax.legend()

plt.title('프로젝트 간트 차트', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('gantt_chart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 유용한 패치 모양

```python
import matplotlib.patches as mpatches

# 둥근 사각형
FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.05")

# 다이아몬드 (결정 노드)
RegularPolygon((x, y), numVertices=4, radius=r, orientation=0.785)

# 원
Circle((x, y), radius)

# 화살표
FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='->', mutation_scale=15)

# 타원
Ellipse((x, y), width, height)
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows
plt.rcParams['axes.unicode_minus'] = False
```

## 체크리스트

- [ ] axis('off')로 축 숨기기
- [ ] 적절한 figsize 설정
- [ ] 노드 간 연결선 명확히
- [ ] 색상으로 카테고리 구분
- [ ] 레이블 가독성 확인
- [ ] zorder로 레이어 순서 관리
