# Line Chart Skill

Matplotlib를 사용한 라인 차트(꺾은선 그래프) 생성 가이드입니다.

## 사용 시점

- 시간에 따른 데이터 변화를 시각화할 때
- 연속적인 데이터의 추세를 보여줄 때
- 여러 데이터셋의 비교가 필요할 때

## 기본 템플릿

```python
import matplotlib.pyplot as plt
import numpy as np

# 데이터 준비
x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

# 그래프 생성
plt.figure(figsize=(10, 6))
plt.plot(x, y, marker='o', linestyle='-', color='blue', linewidth=2, label='데이터')

# 스타일 설정
plt.title('라인 차트 제목', fontsize=14, fontweight='bold')
plt.xlabel('X축 레이블', fontsize=12)
plt.ylabel('Y축 레이블', fontsize=12)
plt.legend(loc='best')
plt.grid(True, alpha=0.3)

# 저장 및 표시
plt.tight_layout()
plt.savefig('line_chart.png', dpi=300, bbox_inches='tight')
plt.show()
```

## 여러 라인 그리기

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

plt.figure(figsize=(12, 6))
plt.plot(x, np.sin(x), label='sin(x)', color='#1f77b4', linewidth=2)
plt.plot(x, np.cos(x), label='cos(x)', color='#ff7f0e', linewidth=2)
plt.plot(x, np.tan(x), label='tan(x)', color='#2ca02c', linewidth=2, linestyle='--')

plt.title('삼각함수 비교')
plt.xlabel('X')
plt.ylabel('Y')
plt.ylim(-2, 2)
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('multi_line_chart.png', dpi=300)
plt.show()
```

## 스타일 옵션

### 라인 스타일
| 코드 | 스타일 |
|------|--------|
| `-` | 실선 |
| `--` | 대시선 |
| `-.` | 대시-점선 |
| `:` | 점선 |

### 마커 스타일
| 코드 | 마커 |
|------|------|
| `o` | 원 |
| `s` | 사각형 |
| `^` | 삼각형 |
| `*` | 별 |
| `D` | 다이아몬드 |

### 색상 포맷
- 이름: `'red'`, `'blue'`, `'green'`
- Hex: `'#FF5733'`, `'#3498DB'`
- RGB: `(0.1, 0.2, 0.5)`

## 서브플롯 사용

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

axes[0, 0].plot(x, x**2)
axes[0, 0].set_title('제곱')

axes[0, 1].plot(x, np.sqrt(x))
axes[0, 1].set_title('제곱근')

axes[1, 0].plot(x, np.exp(x/10))
axes[1, 0].set_title('지수')

axes[1, 1].plot(x, np.log(x+1))
axes[1, 1].set_title('로그')

plt.tight_layout()
plt.savefig('subplot_line_chart.png', dpi=300)
plt.show()
```

## 한글 폰트 설정

```python
import matplotlib.pyplot as plt

# Windows
plt.rcParams['font.family'] = 'Malgun Gothic'
# macOS
# plt.rcParams['font.family'] = 'AppleGothic'
# Linux
# plt.rcParams['font.family'] = 'NanumGothic'

plt.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 깨짐 방지
```

## 체크리스트

- [ ] 축 레이블과 제목 설정
- [ ] 범례 추가 (여러 라인일 경우)
- [ ] 그리드 추가 (가독성 향상)
- [ ] 적절한 figsize 설정
- [ ] 한글 사용 시 폰트 설정
- [ ] 저장 시 dpi와 bbox_inches 설정
