# Remaining Work

OTD 모바일 UI/UX 개편 이후 남은 작업 목록이다. 새 작업을 시작할 때는 `design.md`와 함께 이 문서를 확인한다.

## 1. Common Components

공통 UI 컴포넌트를 `design.md` 기준으로 정리한다.

- `Button` 크기 체계를 `sm 36px`, `md 44px`, `lg 52px` 기준으로 조정
- `EmptyState`에서 이모지 의존 제거 또는 제한
- 입력 필드 공통 스타일 정리
- 바텀시트/모달 닫기 버튼 44px 기준 통일
- `focus-visible:ring-2` 기본 제공
- 화면별 inline style 중 반복되는 패턴을 공통화

## 2. Delete Confirmation UX

삭제 흐름을 공통 확인 UI로 통일한다.

- 브라우저 `confirm()` 사용 제거
- 즉시 삭제되는 액션 점검
- 공통 삭제 확인 바텀시트 또는 모달 컴포넌트 추가
- 위험 액션은 danger 색상 토큰 사용
- 삭제 전 경고 문구와 취소/삭제 버튼 터치 영역 44px 이상 보장

## 3. Emoji Data Model Cleanup

루틴 아이콘과 역할 이모지는 아직 데이터 모델에 남아 있다. 완전 제거하려면 별도 데이터 모델 변경이 필요하다.

- `LifeRoleDef.emoji` 대체 방식 결정
- `Habit.icon` 이모지 저장 방식 대체
- lucide 아이콘 key 기반 모델 검토
- 온보딩 역할 선택 UI 업데이트
- 역할 관리 UI 업데이트
- 기존 사용자 데이터 마이그레이션 방식 결정

## 4. Onboarding And Login UI

온보딩과 로그인 화면을 디자인 시스템에 맞춘다.

- Pretendard 중심 폰트 통일
- inline style 축소
- 이모지 사용 최소화
- lucide 아이콘 기반 안내로 전환
- 버튼/입력/칩 터치 영역 검수
- 온보딩 완료 후 홈의 Next Action과 자연스럽게 연결

## 5. Mobile Device QA

실제 모바일 환경에서 주요 흐름을 점검한다.

- 홈 첫 화면 정보량 확인
- 하단 탭 safe area 확인
- 바텀시트 높이와 스크롤 확인
- 참여 월간 캘린더 셀 터치감 확인
- 업무 카드 완료/삭제/사유 입력 흐름 확인
- 컨디션 점수 입력 터치감 확인
- 아카이브 상세 바텀시트 읽기/수정/삭제 흐름 확인

## 6. Supabase Cleanup

코드에서는 파이낸스 기능을 제거했지만, 기존 원격 DB에 `finance_items` 테이블이 남아 있을 수 있다.

- 운영 DB에서 `finance_items` 존재 여부 확인
- 기존 데이터 백업 필요 여부 결정
- 별도 승인 후 drop SQL 실행
- 스키마 문서와 실제 DB 상태 일치 확인

## Suggested Order

1. Common Components
2. Delete Confirmation UX
3. Onboarding And Login UI
4. Mobile Device QA
5. Emoji Data Model Cleanup
6. Supabase Cleanup
