# OTD Android 출시 수정 설계 (v0.1 draft)

- 작성일: 2026-10-17
- 선행 문서: `otdh-launch-spec.md`(P0~P6), `otd-final-review.md`, QA 점검(2026-10-16, 본 문서 §4)
- 상태: **초안** — D1 확정. D3·D4 확정 전까지 C 묶음 착수 보류

---

## 0. 현재 위치 (코드 기준 확인 사항)

| 출시 스펙 단계 | 상태 | 근거 |
|---|---|---|
| P0 자정버그·온보딩·저장피드백 | 완료 | `useToday`, `Onboarding.tsx`, storage `Result` 반환 |
| P1 인증·RLS·역할 사용자화 | 완료 | Google/Kakao OAuth, `life_roles`, 스키마 주석상 `owner_all`만 |
| P2 AI 제거 | 완료 | `ai/`, `insight` 코드 없음 |
| P3 PWA·접근성·리브랜딩 | 대부분 완료 | manifest PNG 아이콘, `sw.js`, `maximumScale` 미지정 |
| P4 개인정보·계정삭제 | 완료 | `/privacy`, `delete-account` Edge Function |
| P5 TWA 패키징 | 완료 | `com.otdevham.otd`로 비공개 테스트 배포 중(2026-10-17 사용자 확인) |
| P6 Play 제출 | **비공개 테스트 진행 중** | 프로덕션 신청 전 |

---

### 배포 구조 메모
TWA는 앱 껍데기(AAB)가 Vercel 프로덕션 URL을 띄우는 구조다. **웹 수정은 Vercel 프로덕션 배포 즉시 테스터 앱에 반영**되며, AAB 재업로드가 필요한 것은 패키지 수준 변경(네이티브 스플래시·상태바 색·versionCode·권한)뿐이다.
→ 비공개 테스트 중에는 모든 변경을 Preview 배포에서 먼저 확인한 뒤 main에 병합한다.

## 1. Out / Exit (C4)

### Out — v1에서 하지 않는 것
- iOS 출시
- 결제·구독·광고
- AI 기능
- 네이티브 기능(위젯, 네이티브 푸시, 백그라운드 동기화) — TWA 범위를 벗어나는 것
- 오프라인 우선(로컬 DB 동기화) 모드
- 소셜 프로필(이름·사진) 저장

### Exit — 손을 떼는 방법
| 시나리오 | 탈출 경로 |
|---|---|
| TWA 한계(네이티브 기능 필요) | 같은 패키지명·서명키로 Capacitor 앱 교체 업데이트 가능. 웹 코드 재사용 |
| Vercel 이탈 | 정적 빌드 + 다른 호스팅. 단 **TWA는 도메인에 묶임** → 커스텀 도메인 사용 필수(§2-D3) |
| 서비스 종료 | Play 비공개 전환 → 데이터 내보내기 기간 공지 → Supabase 프로젝트 삭제. 계정 삭제 경로는 상시 유지 |
| Supabase 이탈 | PostgreSQL 덤프 이관. Auth는 재로그인 필요 |

---

## 2. 결정 필요 항목 (Decision Log)

| ID | 결정 | 가역성 | 권장안 | 상태 |
|---|---|---|---|---|
| D1 | 패키지명 | **비가역** (Play 등록 후 변경 불가) | **`com.otdevham.otd`** (assetlinks와 일치). 스펙의 `kr.othub.otd`는 폐기 | ✅ 확정 (2026-10-17) |
| D2 | 패키징 방식: TWA vs Capacitor | 중간 | **TWA 유지**. 근거: Google OAuth는 임베디드 WebView 로그인을 차단하므로 Capacitor로 가면 네이티브 로그인 플러그인 추가 작업 발생. TWA는 Chrome 기반이라 현재 OAuth 흐름이 그대로 동작 | 권장 |
| D3 | 프로덕션 도메인 | 높음(TWA·assetlinks·OAuth redirect가 모두 묶임) | `*.vercel.app` 대신 커스텀 도메인 | ⏳ 확인 필요 |
| D4 | Play 타깃 연령 | 높음(가족 정책 적용 여부) | 18세 이상(또는 13세 이상)으로 설정, 아동은 "보호자·치료사 동반 사용"으로 안내. 13세 미만 포함 시 Families 정책 요건 별도 검토 | ⏳ 미확정 |
| D5 | 습관 리마인더 알림 v1 포함 여부 | 높음 | **v1 Out**. 웹 푸시는 서버·구독 관리 필요 → v1.1 | 권장 |
| D6 | 데이터 내보내기 v1 포함 여부 | 높음 | JSON 내보내기 1개 버튼 정도면 v1 포함 권장(신뢰·데이터 이동권) | ⏳ 기존 미결 |

---

## 3. 수정 설계 — 작업 단위

### A. 출시 차단 해소 (QA 결과 반영)

| ID | 작업 | 변경 위치 | 완료 기준 |
|---|---|---|---|
| A1 | Next.js 14.2.35로 보안 패치 (14.x 최종) | `package.json` | build 통과. **남은 advisory 2건(next·postcss)은 15/16에서만 수정** → A1b |
| A1b | 남은 advisory 대응: ① `output: 'export'` 정적 배포로 서버 표면 제거(전 라우트가 이미 정적, next/image·server actions·middleware 미사용) 또는 ② Next 15/16 + React 19 메이저 업그레이드 | `next.config.js` / 전체 | 결정 필요 |
| A2 | 습관 체크 무결성: 진행 중 잠금 + 낙관적 업데이트 + 결과 확인 | `HabitPage.tsx`, `DashboardPage.tsx`(체크 지점) | 연타 시 행 1개만 생성 |
| A2-DB | `habit_logs` 중복 정리 + `UNIQUE(user_id, habit_id, date)` | Supabase migration | **별도 결재**(중복 행 삭제는 비가역) |
| A3 | 습관 삭제 단일화(`deleteByHabitId` 제거, FK CASCADE 활용) | `HabitPage.tsx`, `storage.ts` | 삭제 실패 시 기록 보존 |
| A4 | 연속일: 오늘 미체크면 어제부터 계산 / 날짜 유틸 로컬 기준 통일 | `HabitPage.tsx`, `storage.ts:daysAgo` | 단위 테스트 통과 |
| A5 | **레거시 localStorage 마이그레이션 삭제** (2026-10-17 승인) | `src/lib/migrate.ts` 삭제, `page.tsx` 호출 제거 | grep `migrate` 0건 |
| A6 | 탭 진입 시 재조회(`active` prop 전 탭 확장) | `page.tsx`, 각 Page | 홈 체크 → 습관 탭 즉시 반영 |
| A7 | 스키마 파일을 라이브 기준으로 재작성 + `profiles` 추가 | `supabase-schema.sql` | 빈 DB에 적용 시 anon 접근 0 |

### B. Android(TWA) 적합화 — 웹 코드 수정

| ID | 작업 | 이유 | 설계 |
|---|---|---|---|
| B1 | **뒤로가기 버튼 처리** | 현재 탭이 state 전환이라 history가 없음 → 어느 탭에서든 뒤로가기 = 앱 종료. 바텀시트·모달도 뒤로가기로 안 닫힘 | 탭 전환 시 `history.pushState({tab})`, `popstate`로 복원. 홈에서 뒤로가기 → 종료. 바텀시트/ConfirmDialog 열림 시 history 1단계 push, 뒤로가기 = 닫기. 공용 훅 `useBackHandler` |
| B2 | 이중 스플래시 제거 | TWA 네이티브 스플래시 + 앱 스플래시(최소 0.9s) 연속 노출 | 최소 지연 제거(A5로 migrate 대기도 사라짐). 세션·온보딩 확인 동안만 표시. 네이티브 스플래시 배경색과 동일하게 |
| B3 | 당겨서 새로고침/오버스크롤 억제 | Chrome 기본 pull-to-refresh가 바텀시트 스크롤과 충돌 | `body { overscroll-behavior-y: contain }` |
| B4 | 상태바·테마 색 정렬 | `theme_color #22c55e`가 브랜드 sage(`#4a7c59`)와 다름 → 상태바 색 이질감 | manifest·viewport·TWA 설정 한 값으로 통일 |
| B5 | 오프라인/네트워크 실패 상태 | 오프라인 시 조회 실패가 "기록 없음"으로 보임 | `navigator.onLine` + 조회 실패 시 상단 배너 "연결 안 됨". 빈 상태와 구분 |
| B6 | OAuth 복귀 경로 검증 | Kakao/Google 로그인 후 TWA 안으로 돌아오는지(브라우저로 새는지) | redirect URL = 프로덕션 도메인(D3). Supabase Redirect URLs 허용 목록 점검. 실기기 테스트 필수 |
| B7 | 외부 링크 처리 | `/privacy`가 `target=_blank` → TWA에서 Custom Tab 열림(정상), mailto 동작 확인 | 실기기 확인만 |
| B8 | 서비스워커 버전 관리 | 캐시명 고정(`otd-shell-v1`) → 배포 후 오래된 셸 잔존 가능성 | 빌드 ID 기반 캐시명 또는 배포 시 증가 |

### C. 패키징·스토어 (P5~P6 구체화)

| ID | 작업 | 주의 |
|---|---|---|
| C1 | Bubblewrap(또는 PWABuilder)으로 TWA 생성 — 패키지명 `com.otdevham.otd` | `twa-manifest.json`을 저장소 `android/`에 보관(키스토어는 **저장소 제외**) |
| C2 | 서명키 백업 + **Play App Signing 키 SHA-256을 assetlinks에 추가** | Play가 재서명하므로 업로드 키 지문만 있으면 주소창이 노출됨. 두 지문 모두 등록 |
| C3 | assetlinks 검증 | Google Digital Asset Links API로 확인, 실기기에서 주소창 미노출 확인 |
| C4 | 버전 규칙 | `versionName` = semver, `versionCode` = 정수 증가. 웹 배포만으로 반영되는 변경은 앱 업데이트 불필요 |
| C5 | Play Console: 개인정보 URL, 데이터 삭제 URL, Data Safety, 콘텐츠 등급, 타깃 연령(D4) | 컨디션 데이터 → 건강 관련 신고(Health apps 선언) 해당 여부 확인 |
| C6 | 웹 기반 삭제 요청 경로 | 현재 mailto만 존재 → Play 요건 충족 여부 확인, 필요 시 `/delete-account` 안내 페이지 |
| C7 | 비공개 테스트 (스펙 기준 12명·14일) | 테스터 피드백 수집 경로(폼 등) 준비 |

### D. 품질 인프라

| ID | 작업 |
|---|---|
| D-1 | ESLint 설정 + Vitest 도입. A4 날짜/연속일 로직부터 테스트 |
| D-2 | GitHub Actions: lint · typecheck · test · build |
| D-3 | 저장소 정리: `files.zip`, `card-news/` 중복 삭제, 기획 문서 `docs/` 이동 |

---

## 4. 실행 순서

```
A1 ─┬─ A5 ── B2
    ├─ A2 ── A2-DB(결재)
    ├─ A3, A4, A6
    └─ D-1 ── D-2
D1·D3 확정 ── B6 ── C1 ── C2 ── C3 ── B1·B3·B4·B5 실기기 QA ── C5~C7
A7, B8, D-3 은 병행
```

- 1주차: A1~A6, D-1 (웹만으로 검증 가능)
- 2주차: B1~B5, B8 (웹 수정 + Android Chrome에서 확인)
- 3주차: D1·D3 확정 후 C1~C3, 실기기 QA
- 4주차~: C5~C7 (비공개 테스트 14일 포함)

---

## 5. 실기기 QA 시나리오 (TWA 설치본 기준)

1. 설치 → 첫 실행: 스플래시 1회만, 주소창 미노출
2. Google 로그인 / Kakao 로그인 → 앱 안으로 복귀
3. 각 탭 이동 후 뒤로가기 → 이전 탭, 홈에서 뒤로가기 → 종료
4. 바텀시트 열고 뒤로가기 → 시트만 닫힘
5. 습관 체크 연타 → 기록 1건
6. 비행기 모드 → 연결 안 됨 배너, 저장 실패 토스트
7. 앱 열어둔 채 자정 경과 → 날짜 전환
8. 시스템 글꼴 최대 크기 → 레이아웃 깨짐 없음
9. 계정 삭제 → 재로그인 시 온보딩부터
10. 웹 배포 후 앱 재실행 → 새 버전 반영(B8)

---

## Assumption Ledger

| 항목 | 상태 |
|---|---|
| assetlinks의 `com.otdevham.otd`와 지문이 실제 생성된 키스토어와 일치 | 미확인 |
| 해당 지문이 업로드 키인지 Play App Signing 키인지 | 미확인 |
| 프로덕션 도메인(커스텀 도메인 여부) | 미확인 |
| Play 비공개 테스트 요건(12명·14일) 현행 유지 | 스펙 기준, 현행 정책 재확인 필요 |
| Health apps 선언·Families 정책 적용 범위 | 현행 Play 정책 재확인 필요 |
| habit_logs 중복 행 존재 여부 | 운영 DB 미확인 |
