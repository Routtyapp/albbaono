# Style Guide Skill

Matplotlib 그래프 스타일 설정 및 커스터마이징 가이드입니다.

## 사용 시점

- 그래프의 전체적인 스타일을 설정할 때
- 일관된 시각화 테마가 필요할 때
- 색상, 폰트, 크기 등을 커스터마이징할 때
- 이미지 저장 옵션을 설정할 때

## 기본 스타일 테마

```python
import matplotlib.pyplot as plt
import numpy as np

# 사용 가능한 스타일 목록 확인
print(plt.style.available)

# 스타일 적용
plt.style.use('seaborn-v0_8-whitegrid')  # 또는 다른 스타일

x = np.linspace(0, 10, 100)
plt.figure(figsize=(10, 6))
plt.plot(x, np.sin(x), label='sin(x)')
plt.plot(x, np.cos(x), label='cos(x)')
plt.title('스타일이 적용된 그래프')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()
plt.savefig('styled_graph.png', dpi=300)
plt.show()
```

## 주요 스타일 테마

```python
import matplotlib.pyplot as plt
import numpy as np

styles = ['default', 'seaborn-v0_8', 'ggplot', 'fivethirtyeight', 'dark_background']

x = np.linspace(0, 10, 100)

fig, axes = plt.subplots(2, 3, figsize=(15, 10))
axes = axes.flatten()

for ax, style in zip(axes, styles):
    with plt.style.context(style):
        ax.plot(x, np.sin(x))
        ax.plot(x, np.cos(x))
        ax.set_title(f"Style: {style}")
        ax.grid(True)

axes[-1].axis('off')  # 마지막 빈 칸 숨기기
plt.tight_layout()
plt.savefig('style_comparison.png', dpi=300)
plt.show()
```

## rcParams 전역 설정

```python
import matplotlib.pyplot as plt

# 기본 설정 초기화
plt.rcdefaults()

# 그래프 크기
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['figure.dpi'] = 100

# 폰트 설정
plt.rcParams['font.family'] = 'Malgun Gothic'  # Windows 한글
plt.rcParams['font.size'] = 12
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10
plt.rcParams['legend.fontsize'] = 10

# 마이너스 기호
plt.rcParams['axes.unicode_minus'] = False

# 라인 스타일
plt.rcParams['lines.linewidth'] = 2
plt.rcParams['lines.markersize'] = 6

# 그리드
plt.rcParams['axes.grid'] = True
plt.rcParams['grid.alpha'] = 0.3

# 색상 사이클
plt.rcParams['axes.prop_cycle'] = plt.cycler(color=['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'])
```

## 컨텍스트 매니저로 임시 스타일 적용

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

# 임시로 스타일 적용 (with 블록 이후 원래대로 복원)
with plt.style.context('dark_background'):
    plt.figure(figsize=(10, 6))
    plt.plot(x, np.sin(x), 'cyan', linewidth=2)
    plt.plot(x, np.cos(x), 'magenta', linewidth=2)
    plt.title('Dark Background Style')
    plt.savefig('dark_style.png', dpi=300)
    plt.show()

# 이후 코드는 원래 스타일로 복원됨
```

## 색상 팔레트 설정

```python
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np

# 커스텀 색상 팔레트
custom_colors = ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']

# 색상 사이클 적용
plt.rcParams['axes.prop_cycle'] = plt.cycler(color=custom_colors)

# 또는 컬러맵에서 색상 추출
cmap = cm.viridis
colors = [cmap(i) for i in np.linspace(0, 1, 5)]

# 그래프에 적용
x = np.linspace(0, 10, 100)
plt.figure(figsize=(10, 6))
for i, color in enumerate(custom_colors):
    plt.plot(x, np.sin(x + i), color=color, label=f'Line {i+1}', linewidth=2)
plt.legend()
plt.title('커스텀 색상 팔레트')
plt.savefig('custom_palette.png', dpi=300)
plt.show()
```

## 전문적인 프레젠테이션 스타일

```python
import matplotlib.pyplot as plt
import numpy as np

def setup_presentation_style():
    """프레젠테이션용 스타일 설정"""
    plt.rcParams.update({
        # 크기
        'figure.figsize': (12, 7),
        'figure.dpi': 150,

        # 폰트
        'font.family': 'Malgun Gothic',
        'font.size': 14,
        'axes.titlesize': 18,
        'axes.titleweight': 'bold',
        'axes.labelsize': 14,

        # 라인
        'lines.linewidth': 2.5,
        'lines.markersize': 10,

        # 축
        'axes.linewidth': 1.5,
        'axes.spines.top': False,
        'axes.spines.right': False,

        # 그리드
        'axes.grid': True,
        'grid.alpha': 0.3,
        'grid.linestyle': '--',

        # 범례
        'legend.frameon': True,
        'legend.framealpha': 0.9,
        'legend.fontsize': 12,

        # 마이너스 기호
        'axes.unicode_minus': False,
    })

setup_presentation_style()

x = np.linspace(0, 10, 100)
plt.figure()
plt.plot(x, np.sin(x), label='sin(x)', color='#3498db')
plt.plot(x, np.cos(x), label='cos(x)', color='#e74c3c')
plt.title('프레젠테이션용 그래프')
plt.xlabel('X축')
plt.ylabel('Y축')
plt.legend()
plt.savefig('presentation_style.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 논문용 스타일

```python
import matplotlib.pyplot as plt
import numpy as np

def setup_paper_style():
    """학술 논문용 스타일 설정"""
    plt.rcParams.update({
        # 크기 (논문 컬럼 너비에 맞춤)
        'figure.figsize': (3.5, 2.5),  # inches (single column)
        'figure.dpi': 300,

        # 폰트 (Times New Roman 계열)
        'font.family': 'serif',
        'font.serif': ['Times New Roman', 'DejaVu Serif'],
        'font.size': 8,
        'axes.titlesize': 9,
        'axes.labelsize': 8,
        'xtick.labelsize': 7,
        'ytick.labelsize': 7,
        'legend.fontsize': 7,

        # 라인
        'lines.linewidth': 1,
        'lines.markersize': 4,

        # 축
        'axes.linewidth': 0.5,

        # 그리드
        'axes.grid': False,

        # 범례
        'legend.frameon': False,

        # 마이너스 기호
        'axes.unicode_minus': False,
    })

setup_paper_style()

x = np.linspace(0, 10, 100)
plt.figure()
plt.plot(x, np.sin(x), 'k-', label='sin(x)')
plt.plot(x, np.cos(x), 'k--', label='cos(x)')
plt.title('Figure 1. Trigonometric Functions')
plt.xlabel('x')
plt.ylabel('y')
plt.legend()
plt.savefig('paper_style.png', dpi=300, bbox_inches='tight')
plt.savefig('paper_style.pdf', bbox_inches='tight')  # PDF로도 저장
plt.show()
```

## 이미지 저장 옵션

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
plt.figure(figsize=(10, 6))
plt.plot(x, np.sin(x))
plt.title('저장 옵션 예시')

# PNG 저장 (기본)
plt.savefig('output.png', dpi=300, bbox_inches='tight')

# 투명 배경
plt.savefig('output_transparent.png', dpi=300, transparent=True, bbox_inches='tight')

# PDF 저장 (벡터 형식)
plt.savefig('output.pdf', bbox_inches='tight')

# SVG 저장 (벡터 형식, 웹용)
plt.savefig('output.svg', bbox_inches='tight')

# JPEG 저장 (품질 조절)
plt.savefig('output.jpg', dpi=300, quality=95, bbox_inches='tight')

# 패딩 조절
plt.savefig('output_padded.png', dpi=300, pad_inches=0.5, bbox_inches='tight')

plt.show()
```

## 한글 폰트 설정 (OS별)

```python
import matplotlib.pyplot as plt
import platform

def setup_korean_font():
    """OS별 한글 폰트 자동 설정"""
    system = platform.system()

    if system == 'Windows':
        plt.rcParams['font.family'] = 'Malgun Gothic'
    elif system == 'Darwin':  # macOS
        plt.rcParams['font.family'] = 'AppleGothic'
    else:  # Linux
        plt.rcParams['font.family'] = 'NanumGothic'

    plt.rcParams['axes.unicode_minus'] = False

setup_korean_font()

# 폰트 확인
plt.figure(figsize=(8, 4))
plt.text(0.5, 0.5, '한글 테스트: 가나다라마바사',
         fontsize=20, ha='center', va='center')
plt.axis('off')
plt.savefig('korean_font_test.png', dpi=150)
plt.show()
```

## 주요 rcParams 참조

### 그래프 크기/해상도
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `figure.figsize` | 그래프 크기 (inches) | `(10, 6)` |
| `figure.dpi` | 화면 해상도 | `100` |
| `savefig.dpi` | 저장 해상도 | `300` |

### 폰트
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `font.family` | 폰트 계열 | `'sans-serif'` |
| `font.size` | 기본 폰트 크기 | `12` |
| `axes.titlesize` | 제목 크기 | `14` |
| `axes.labelsize` | 축 레이블 크기 | `12` |

### 라인/마커
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `lines.linewidth` | 라인 두께 | `2` |
| `lines.linestyle` | 라인 스타일 | `'-'` |
| `lines.markersize` | 마커 크기 | `6` |

### 축/그리드
| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `axes.grid` | 그리드 표시 | `True` |
| `grid.alpha` | 그리드 투명도 | `0.3` |
| `axes.spines.top` | 상단 테두리 | `False` |

## 컬러맵 목록

```python
# 순차형 (Sequential)
'viridis', 'plasma', 'inferno', 'magma', 'cividis'
'Greys', 'Blues', 'Greens', 'Oranges', 'Reds', 'Purples'
'YlGn', 'YlGnBu', 'GnBu', 'BuGn', 'PuBu', 'BuPu', 'RdPu', 'PuRd'

# 발산형 (Diverging)
'coolwarm', 'bwr', 'seismic', 'RdBu', 'RdYlBu', 'RdYlGn', 'PiYG', 'PRGn'

# 카테고리형 (Qualitative)
'Pastel1', 'Pastel2', 'Paired', 'Accent', 'Dark2'
'Set1', 'Set2', 'Set3', 'tab10', 'tab20'
```

## 체크리스트

- [ ] 적절한 스타일 테마 선택
- [ ] 한글 폰트 설정 확인
- [ ] rcParams 초기화 후 설정
- [ ] 일관된 색상 팔레트 사용
- [ ] 저장 시 dpi와 bbox_inches 설정
- [ ] 용도에 맞는 크기 설정 (논문/프레젠테이션)
