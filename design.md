# OTD Design System

이 문서는 OTD(Life Hacking Dashboard)의 UI 작업 기준이다. AI와 개발자는 새 화면, 컴포넌트, 리팩터링 작업을 할 때 이 문서를 우선 참조한다.

## 1. Product Direction

OTD는 모바일 우선 자기관리 앱이다. 사용자는 하루의 루틴, 업무, 컨디션, 인사이트를 빠르게 기록하고 다음 행동을 확인한다.

핵심 화면의 우선순위는 다음과 같다.

1. 오늘 해야 할 행동을 바로 보여준다.
2. 기록 입력은 1~2번의 탭으로 끝나게 한다.
3. 분석과 차트는 행동을 방해하지 않는 보조 정보로 둔다.
4. 홈은 단순 대시보드가 아니라 앱의 진입점이어야 한다.

## 2. Design Principles

### Mobile First

- 기본 화면 폭은 모바일을 기준으로 설계한다.
- 콘텐츠는 단일 컬럼을 기본으로 하고, 복잡한 표보다 카드형 리스트를 우선한다.
- 주요 터치 영역은 최소 `44px` 이상이어야 한다.
- 하단 탭과 바텀시트는 safe area를 고려한다.

### Clear Hierarchy

- 한 화면에는 하나의 주 행동을 가장 강하게 둔다.
- 요약, 입력, 분석 순서로 정보 위계를 만든다.
- 2차 정보는 접힘, 상세, 별도 화면으로 분리한다.
- 홈에는 오늘의 상태와 다음 행동을 가장 먼저 배치한다.

### Calm Productivity

- 브랜드 톤은 차분하고 실용적인 생산성 앱이다.
- 과한 감정 표현, 장식적 이모지, 지나친 색상 변화를 피한다.
- 사용자가 "기록해야 한다"보다 "지금 하나만 하면 된다"고 느끼게 한다.

## 3. Typography

### Font Family

기본 폰트는 Pretendard로 통일한다.

```css
font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
```

사용 규칙:

- 앱 UI, 버튼, 폼, 카드, 차트 라벨은 Pretendard를 사용한다.
- `Noto Serif KR`는 기본 사용하지 않는다.
- 한 화면 안에서 헤딩과 본문 폰트를 과도하게 섞지 않는다.
- 새 컴포넌트는 별도 이유가 없다면 Pretendard만 사용한다.

### Type Scale

모바일 기준 최소 크기를 지킨다.

| Token | Size | Line Height | Usage |
| --- | ---: | ---: | --- |
| `text-caption` | 12px | 1.5 | 보조 라벨, 날짜, 메타 정보 |
| `text-body-sm` | 13px | 1.6 | 작은 설명, 태그 설명 |
| `text-body` | 14px | 1.6 | 기본 본문, 리스트 내용 |
| `text-body-lg` | 16px | 1.6 | 주요 입력값, 강조 본문 |
| `text-title-sm` | 18px | 1.4 | 카드/섹션 제목 |
| `text-title` | 22px | 1.35 | 페이지 제목 |
| `text-display` | 28px | 1.25 | 홈 핵심 수치, 히어로 |

금지 또는 제한:

- `10px`, `11px`는 차트 축, 매우 짧은 배지처럼 제한된 경우에만 쓴다.
- 본문, 버튼, 주요 라벨에는 `10px`, `11px`를 쓰지 않는다.
- 한국어 문장은 줄간격 `1.5` 이상을 유지한다.

## 4. Color Tokens

현재 앱의 sage/navy 기반 톤은 유지하되, 사용 목적을 명확히 한다.

### Core Colors

| Token | Value | Usage |
| --- | --- | --- |
| `--color-primary` | `#4a7c59` | 주요 CTA, 루틴 완료, 긍정 상태 |
| `--color-primary-strong` | `#3f6a4c` | CTA pressed/hover |
| `--color-primary-soft` | `#e8f2ec` | 선택 배경, 부드러운 강조 |
| `--color-primary-pale` | `#f2f8f4` | 카드 내부 보조 배경 |
| `--color-secondary` | `#2c4a7c` | 분석, 프로젝트, 보조 강조 |
| `--color-secondary-soft` | `#e8eef8` | 보조 선택 배경 |
| `--color-danger` | `#b02a2a` | 삭제, 계정 제거 |
| `--color-warning` | `#b45309` | 주의, 중간 우선순위 |

### Surface Colors

| Token | Value | Usage |
| --- | --- | --- |
| `--color-bg` | `#f5f7f5` | 앱 배경 |
| `--color-surface` | `#ffffff` | 카드, 시트 |
| `--color-surface-muted` | `#f8faf8` | 약한 구분 배경 |
| `--color-border` | `#d8e4d8` | 기본 경계 |
| `--color-border-light` | `#eaf2ea` | 내부 구분선 |

### Text Colors

| Token | Value | Usage |
| --- | --- | --- |
| `--color-text` | `#1a2310` | 기본 텍스트 |
| `--color-text-secondary` | `#4a5a42` | 보조 텍스트 |
| `--color-text-muted` | `#6e7a65` | 메타 정보, 비활성 텍스트 |
| `--color-text-inverse` | `#ffffff` | 컬러 배경 위 텍스트 |

색상 규칙:

- 기능 의미 없이 새 색상을 추가하지 않는다.
- 역할 색상처럼 사용자 선택성이 있는 경우에도 대비를 확인한다.
- 색상만으로 상태를 전달하지 말고 텍스트 또는 아이콘을 함께 쓴다.

## 5. Spacing and Grid

### Layout

- 페이지 컨테이너: `max-width: 512px`, 좌우 `16px`
- 페이지 상단 여백: `12px~20px`
- 섹션 간격: `16px`
- 카드 내부 여백: `16px`
- 작은 카드 내부 여백: `12px`
- 리스트 row 간격: `8px~12px`

### Grid

- 모바일 기본: 1컬럼
- 통계 카드: 2컬럼 허용
- 3컬럼 이상은 선택지가 짧고 터치 영역이 충분할 때만 사용한다.
- 테이블은 모바일에서 지양한다. 업무/기록/루틴 목록은 카드형 리스트를 우선한다.

## 6. Shape and Elevation

| Token | Value | Usage |
| --- | ---: | --- |
| `radius-sm` | 8px | 작은 배지, 내부 버튼 |
| `radius-md` | 12px | 기본 버튼, 입력 |
| `radius-lg` | 16px | 카드 |
| `radius-sheet` | 20px 20px 0 0 | 바텀시트 |

그림자는 약하게 사용한다.

```css
box-shadow: 0 1px 4px rgba(74, 124, 89, 0.06);
```

## 7. Component Rules

### Buttons

기본 버튼:

- 높이: 최소 `44px`
- 폰트: 14px 이상, 600~700
- radius: 12px
- primary 버튼은 한 화면에 1개를 원칙으로 한다.

크기 기준:

| Variant | Height | Usage |
| --- | ---: | --- |
| `sm` | 36px 이상 | 보조 액션, 카드 내부 |
| `md` | 44px 이상 | 기본 액션 |
| `lg` | 52px 이상 | 주요 CTA |
| `icon` | 44px x 44px | 아이콘 단독 버튼 |

아이콘 단독 버튼은 반드시 `aria-label`을 제공한다.

### Cards

카드는 다음 구조를 기본으로 한다.

1. 제목 또는 상태
2. 핵심 값/내용
3. 보조 정보
4. 선택 액션

카드 안에서 너무 많은 기능을 넣지 않는다. 상세 정보가 필요하면 상세 화면이나 바텀시트로 보낸다.

### Forms

- 입력 높이: 최소 `44px`
- 텍스트 크기: 최소 14px
- 포커스 상태: `focus-visible:ring-2` 제공
- placeholder는 예시를 짧게 제공한다.
- 저장 버튼은 폼 하단에서 전체 너비를 기본으로 한다.

### Bottom Navigation

- 탭은 5개 이하로 유지한다.
- 각 탭 터치 영역은 최소 `56px` 높이를 확보한다.
- 현재 선택 상태는 아이콘, 텍스트 색, 배경 중 2개 이상으로 표시한다.
- 이모지 대신 lucide 아이콘을 사용한다.

### Bottom Sheet and Modal

- 모바일에서는 바텀시트를 기본으로 한다.
- 닫기 버튼은 최소 `44px` 영역을 가진다.
- 삭제/계정 제거 같은 위험 액션은 브라우저 `confirm()` 대신 앱 내 확인 모달을 사용한다.

## 8. Iconography

기본 아이콘 패키지는 `lucide-react`를 사용한다.

아이콘 원칙:

- 이모지 사용을 자제한다.
- 기능적 의미를 가진 아이콘은 lucide 아이콘을 사용한다.
- 장식용 아이콘은 최소화한다.
- 컨디션 화면에는 하트 아이콘을 사용하지 않는다.

추천 아이콘:

| Context | Preferred Icons |
| --- | --- |
| 홈 | `Home`, `LayoutDashboard`, `Sparkles`, `ArrowRight` |
| 참여/루틴 | `Repeat`, `CheckCircle2`, `CalendarDays` |
| 업무 | `ListTodo`, `CheckSquare`, `FolderKanban` |
| 컨디션 | `Activity`, `Gauge`, `Brain`, `Pulse`, `Battery` |
| 인사이트 창고 | `Archive`, `BookOpen`, `Search`, `FileText` |
| 설정 | `Settings`, `User`, `LogOut`, `Trash2` |

이모지 허용 범위:

- 빈 상태의 가벼운 장식은 제한적으로 허용한다.
- 사용자 선택 아이콘으로 남길 경우 lucide 대체 옵션을 함께 검토한다.
- 내비게이션, 주요 CTA, 상태 진단에는 이모지를 쓰지 않는다.

## 9. Page Guidelines

### Home

홈은 앱의 시작점이다. 다음 요소를 우선한다.

1. 오늘의 상태 요약
2. 지금 할 다음 행동
3. 오늘 기록 바로가기
4. 짧은 인사이트

홈에서 지양할 것:

- 기능별 모든 데이터를 나열하는 것
- 큰 차트를 먼저 보여주는 것
- 재무, 로드맵, 정체성 설정을 홈의 주요 영역으로 두는 것

### Habit

- 오늘 체크인을 기본 경험으로 둔다.
- 완료 버튼은 크게 배치한다.
- 월간 캘린더는 보조 뷰로 둔다.
- 루틴별 이모지는 lucide 아이콘 또는 심플한 심볼로 대체를 검토한다.

### Task

- 모바일 테이블을 사용하지 않는다.
- 업무는 카드형 row로 표현한다.
- 완료 체크는 왼쪽 큰 터치 영역에 둔다.
- 프로젝트, 역할, 우선순위는 업무명 아래 보조 줄로 정리한다.

### Mental

- 하트 중심의 감정 앱처럼 보이지 않게 한다.
- 에너지, 상태, 회복, 집중을 시각 언어의 중심에 둔다.
- 1~5점 선택에는 양끝 의미를 표시한다.
- 차트 라벨은 읽을 수 있는 크기를 유지한다.

### Archive

- 목록 클릭 시 상세 보기로 이동하거나 상세 바텀시트를 연다.
- 목록의 2줄 요약은 preview일 뿐, 전체 본문 접근을 막지 않는다.
- 수정/삭제는 상세 화면 안의 액션으로 둔다.

### Finance

- 파이낸스 영역은 제품 핵심 범위에서 제거한다.
- 홈, 대시보드 탭, 관련 UI, 타입, 스토리지, 마이그레이션, 스키마 정의에서 제거한다.
- 새 UI와 데이터 모델에서 파이낸스 기능을 재도입하지 않는다.
- 기존 원격 DB에 남아 있는 파이낸스 테이블 삭제는 운영 DB 작업으로 별도 승인 후 수행한다.

## 10. Accessibility Checklist

새 UI를 만들거나 수정할 때 다음을 확인한다.

- 모든 버튼의 터치 영역이 최소 `44px`인가?
- 아이콘 단독 버튼에 `aria-label`이 있는가?
- 포커스 상태가 키보드 사용자에게 보이는가?
- 텍스트가 12px 미만으로 내려가지 않았는가?
- 색상 대비가 충분한가?
- 색상만으로 상태를 전달하지 않는가?
- 바텀시트/모달 닫기 동작이 명확한가?
- 삭제 액션에 실수 방지 장치가 있는가?

## 11. Implementation Rules for AI

AI가 UI 작업을 할 때는 다음 순서를 따른다.

1. 이 문서의 토큰과 컴포넌트 규칙을 먼저 확인한다.
2. 기존 화면의 작은 텍스트, 작은 터치 타겟, 이모지 사용을 늘리지 않는다.
3. 새 색상, 새 폰트, 새 컴포넌트 패턴을 임의로 추가하지 않는다.
4. 모바일 카드형 구조를 우선한다.
5. 복잡한 기능은 홈에 쌓지 말고 상세 또는 별도 화면으로 분리한다.
6. 파이낸스 기능은 새 UI에서 재도입하지 않는다.
