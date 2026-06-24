# OTD 공개 출시 기획서
**버전**: v1 (무료, AI 기능 제외, 멀티테넌트)
**리포**: github.com/hamhyeonggwang/habittracker
**스택**: Next.js 14 (App Router) · Supabase · TypeScript · Tailwind · Vercel
**목표**: 불특정 다수 대상 Google Play 정식 공개 (TWA 패키징)
**작업 도구**: Claude Code (본 문서를 그대로 작업 지시서로 사용)

---

## 0-A. 브랜드 네이밍 (확정)

| 항목 | 내용 |
|------|------|
| 앱 이름(아이콘 라벨) | **OTD** |
| 확장 의미 | **Own The Day** — "하루를 내 것으로 만들다" |
| 기원 스토리 (About/스토어 설명용) | 원래 작업치료사가 만든 "Occupation Tracking Dashboard"의 이니셜이었으나, 공개 버전에서 "Own The Day"로 의미 확장. 역할(Role)이 모여 하루가 되고, 하루를 내 것으로 만든다는 메시지로 일반 대중에게도 직관적으로 전달 |
| 포지셔닝 | 작업치료사가 설계한 신뢰성 + MOHO(역할이 의지에 영향을 준다는 이론)를 기능 설명에 녹여서 전달. 이름 자체는 대중적·간결하게 |
| 패키지명(가제) | `kr.othub.otd` — Claude Code 작업 착수 전 최종 확정 필요 (변경 불가 항목) |
| 구) 명칭 | OTD·H (Occupation Tracking Dashboard / Occupational Therapist's Daily Hub) — 개인용 당시 이름. 코드베이스 내 잔존 텍스트(README, layout.tsx metadata, manifest.json, 스플래시 화면 "OTD·H" 텍스트) 전수 교체 필요 → P3(PWA 마감) 작업 범위에 포함 |

---

## 0. 확정된 스코프

| 항목 | 결정 |
|------|------|
| 가격 | 완전 무료 |
| AI 분석 기능 (일일요약·정체성점검·미완사유패턴·아카이브연결) | **전면 제거** |
| 등급 구분 (FREE/PRO) | 없음 — 로그인 사용자 전원 동일 기능 |
| 결제/구독 | 없음 |
| 대상 | 불특정 다수 공개 |
| 배포 형태 | TWA(Trusted Web Activity)로 Android 패키징, Vercel 배포 유지 |
| 개발자 계정 | 개인 계정 등록 완료 (비공개 테스트 12명·14일 요건 적용 대상) |

---

## 1. 현재 구조의 치명적 문제 (반드시 P1에서 해결)

- 전 테이블에 `user_id` 없음. 로그인도 없음.
- `supabase-schema.sql`의 RLS 정책이 `CREATE POLICY "anon_all" ... USING (true) WITH CHECK (true)` — **anon 키를 가진 누구나 전체 행을 읽고/쓰고/지울 수 있음.**
- `src/lib/storage.ts`의 `differentialSave`가 "로컬에 없는 행은 서버에서도 삭제" 방식 — 두 번째 사용자가 저장하는 순간 **다른 사용자 데이터가 삭제됨.**
- `mental_state_logs`(컨디션/정서 4축) 등 민감 데이터가 전원에게 노출됨.

→ 이 상태로는 공개 자체가 데이터 사고. **P1을 가장 먼저, 가장 꼼꼼히 진행.**

---

## 2. 단계별 작업 (Claude Code 실행 순서)

### P0 — 출시 전 Blocker (최종 기획회의 2026-06-20 확정, otd-final-review.md 참조)

**P0-A. `TODAY` 자정 버그 수정 (필수)**
- `src/lib/utils.ts`의 `export const TODAY` 상수(모듈 로드 시 1회 고정) → `export function getToday()` 함수로 전환
- 전 컴포넌트의 `TODAY` 참조를 호출 시점 평가로 교체. 저장·체크 시 항상 현재 날짜 사용
- 보강: `visibilitychange`로 앱 포커스 복귀 시 날짜 상태 갱신

**P0-B. 온보딩 + 상시 튜토리얼 (포지셔닝: 치료사 권유형 임상 도구)**
- **2경로 온보딩**: ① 치료사 동반 설치(역할·첫 습관 같이 설정, 건너뛰기 허용) ② 클라이언트 단독(상시 길잡이)
- **상시 튜토리얼**: 각 탭 첫 진입 시 코치마크, 화면 내 도움말(?) 버튼으로 재호출 가능
- `profiles.onboarding_completed`로 온보딩 1회성 제어. P1-6(역할 설정)과 통합 — 역할 제안 풀 선택 → 첫 습관 만들기 → 핵심 탭 설명
- ⚠️ 대상에 아동·지체장애 당사자 포함 → 온보딩 카피·터치 타깃을 쉽게

**P0-C. 저장 실패 무피드백 해결**
- `src/lib/storage.ts`의 모든 store 함수가 성공/실패를 `{ ok: boolean, error?: string }`로 반환하도록 리팩토링 (현재 실패 시 `console.error`만)
- 각 페이지 `handleSave`가 결과를 받아 실패 시 toast/배너로 명시. 무조건 "저장됨" 표시 제거
- 공용 toast 컴포넌트 신규

---

### P1 — 인증 + 데이터 격리 (최우선, 차단 항목)

**1-1. Supabase Auth 도입 — Google + Kakao OAuth (최소 인증 원칙)**
- **Google + Kakao 소셜 로그인 제공.** 이메일/비밀번호 가입 폼 없음 — 별도 비밀번호 관리 절차 자체를 없애 "최소 인증"을 구조적으로 강제
- Kakao는 Supabase Auth **내장 프로바이더** (별도 OIDC 커스텀 연동 불필요)
- ⚠️ **카카오 비즈 앱 전환 절차** (검증됨, 사업자등록 불필요):
  1. 카카오 디벨로퍼스 Owner 계정 **본인인증**(전화번호) 완료
  2. 카카오 데브톡에 "개인 개발자 비즈 앱 전환 신청" 글 작성 — 앱 이름·앱 ID·서비스 URL·서비스 성격·운영 형태 기재
  3. 카카오 내부 심사 (서비스-앱 일치 여부, 운영정책 준수, **실제 회원가입 화면에서 받는 개인정보 항목** 기준) → 승인/반려. 반려 사례도 실재함, 승인 보장 안 됨
  4. 승인 시 [카카오 로그인] > [동의항목]에서 이메일을 필수 동의로 설정 가능
- ⚠️ **순서 의존성**: 심사가 "실제 운영 중인 서비스의 가입 화면"을 보고 이뤄지므로, **앱이 배포되고 가입 플로우가 동작한 뒤에만 신청 가능**. 출시 선행조건이 아니라 **P1 배포 이후 병행 진행**. 반려·지연 가능성 있으므로 승인 전까지는 "이메일 없이 카카오 ID만으로 인증"하는 폴백으로 정상 동작하게 구현 (이메일이 없어도 `auth.uid()` 기반 RLS는 그대로 작동하므로 기능상 문제 없음)
- ⚠️ 정확한 표현: "개인정보 완전 미수집"은 기술적으로 불가능(Google은 이메일 기본 제공). 정확히는 **"이메일 외 추가 수집 없음"** — 양쪽 프로바이더가 함께 넘기는 이름·프로필사진은 저장하지 않음
- `profiles` 테이블: 이름/사진 등 프로필 정보 동기화 **금지**. `id (uuid)`, `onboarding_completed (boolean)` 등 앱 동작에 필요한 최소 플래그만 저장
- 앱 내 사용자 표시명은 소셜 프로필명을 끌어오지 않고 "회원" 등 익명 기본값 사용 (추후 닉네임 직접 입력 기능은 백로그)
- 로그인 게이트: 미인증 시 `page.tsx`에서 전체 앱 대신 로그인 화면 렌더링

**1-2. 전 테이블에 `user_id uuid REFERENCES auth.users(id)` 추가**
대상: `habits`, `habit_logs`, `tasks`, `projects`, `mental_state_logs`, `archive_items`, `identity_statements`, `goals`, `quarters`, `month_plans`, `meaningful_moments`
- `habit_logs`는 `habit_id`로 간접 연결되지만, RLS 단순화를 위해 직접 `user_id` 컬럼도 추가 권장

**1-3. RLS 정책 전면 재작성**
```sql
-- 예시 (전 테이블 동일 패턴)
DROP POLICY "anon_all" ON habits;
CREATE POLICY "owner_all" ON habits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
- `anon` 롤 정책 전체 삭제 (로그인 안 한 사용자는 아무것도 못 봄)
- 모든 `select/insert/update/delete`가 `auth.uid()` 기준으로 자동 격리되는지 전수 확인

**1-4. `src/lib/storage.ts` 수정**
- 모든 `supabase.from(table).select/insert/update`에 `user_id: session.user.id` 주입
- `differentialSave`의 read 쿼리에 암묵적으로 RLS가 적용되므로(본인 행만 보임) 삭제 로직 자체는 안전해짐 — 단, **현재 RLS 없이 작동하던 가정이 깨지는 지점들 전수 테스트**

**1-5. 기존 데이터(선생님 본인 데이터) 마이그레이션**
- 현재 anon으로 쌓인 기존 행들을 선생님 계정 `user_id`로 일괄 UPDATE하는 1회성 SQL 스크립트 작성
- 순서: ① 선생님 계정 가입 → ② `auth.uid()` 확보 → ③ 전 테이블 `UPDATE ... SET user_id = '<해당 uuid>' WHERE user_id IS NULL` → ④ RLS 활성화

**완료 기준**: 두 개의 테스트 계정으로 가입 → 각자 습관 추가 → 서로의 데이터가 전혀 안 보이고, 한쪽 저장이 다른 쪽 데이터를 지우지 않음을 확인.

**1-6. 역할(Role) 사용자 커스터마이즈 ★QA 1차 점검 최우선 발견사항**
- 현재 `src/lib/roles.ts`의 `LIFE_ROLES`가 선생님 개인 정체성(작업치료사/팀장/연구자/개발자/아버지/신앙인)으로 **하드코딩**되어 있고, 추가·수정·삭제 UI 자체가 없음. 공개 시 전 사용자에게 노출되면 안 됨.
- **데이터 모델**: `life_roles` 테이블 신규 — `id text PK`, `user_id uuid`, `label text`, `emoji text`, `color text`, `sort_order int`, `created_at text`
- `habits.roles` / `tasks.roles` / `projects.roles`가 참조하는 값을 고정 `LifeRole` enum → 사용자의 `life_roles.id` (자유 텍스트 id)로 전환. `LifeRole` 타입은 폐기.
- 역할 삭제 시 연결된 습관/업무는 삭제하지 않고 태그만 제거(orphan-safe) — 렌더링 시 존재하지 않는 role id는 무시
- **온보딩 플로우**: 가입 직후 빈 상태 대신, 12개 안팎의 제안 역할 풀(직장인·부모·학생·운동인·창작자·반려인·신앙인·자기계발러 등)에서 3~6개 멀티선택 → 이후 설정 화면에서 자유롭게 추가/수정/삭제/순서변경
- 설정 화면(신규) 필요: "내 역할 관리" — 추가/이름변경/이모지·색상변경/삭제/순서변경 UI

**1-7. DB 제약조건 멀티유저 대응**
- `mental_state_logs.date`, `meaningful_moments.date`의 `UNIQUE(date)` 제약 → `UNIQUE(user_id, date)`로 교체 필수. 현재 상태로 멀티테넌트 전환 시 두 번째 사용자가 동일 날짜에 기록하는 순간 DB 에러 발생.

---

---


## 3. 의존성 순서 (Claude Code 작업 시 준수)

```
P0 (자정버그·온보딩·저장피드백) ──→ P1 (인증·격리) ─┬─→ P2 (AI 제거)
                                                    ├─→ P3 (PWA·접근성·리브랜딩)
                                                    └─→ P4 (정책·계정삭제) ──→ P5 (TWA) ──→ P6 (Play 제출)
```
P0는 기존 코드 신뢰성 수정이라 P1과 병행 가능하나, 온보딩(P0-B)은 P1 인증·P1-6 역할설정에 의존하므로 그 이후 완성. P1은 다른 모든 단계의 전제.

---

## 4. 보류/백로그 (v1 범위 밖, 메모만)

- 클라우드 동기화 외 오프라인 우선 모드
- AI 분석 재도입(유료화 포함) — 추후 별도 기획
- iOS 배포

---

*작성: Claude (claude.ai) — 2026-06-20. Claude Code 작업 시작 시 이 문서를 컨텍스트로 제공할 것.*

---

## 5. QA 1차 점검 결과 (2026-06-20)

| 등급 | 항목 | 내용 | 처리 위치 |
|------|------|------|-----------|
| 🔴 Critical | 역할 하드코딩 | 선생님 개인 정체성 6종이 코드 상수로 고정, 수정 UI 없음 | P1-6 (위) |
| 🔴 Critical | UNIQUE(date) 전역 제약 | 멀티유저 전환 시 DB 에러 유발 | P1-7 (위) |
| 🟡 Important | 에러 피드백 부재 | `storage.ts` 전체가 실패 시 `console.error`만 수행, 사용자에게 알림 없음. AI 카드(곧 삭제 대상)에만 loading/error 상태 존재 | 신규 — 최소 toast/배너 컴포넌트 추가, `storage.ts` 함수들이 성공/실패를 반환하도록 리팩토링 필요 |
| 🟡 Important | 초기 로딩 상태 없음 | 데이터 fetch 중과 "기록 없음"이 화면상 구분 안 됨 | 신규 — 각 페이지에 skeleton/loading state 추가 |
| 🟢 확정 | 대시보드 Identity/Goals/Roadmap 섹션 | 파이낸스는 제품 범위에서 완전 삭제. Identity/Goals/Roadmap은 홈 개편 시 노출 위계를 재검토 | `design.md`, `home-prd.md` 기준 적용 |



### P2 — AI 기능 제거

**삭제 대상 파일**
- `src/app/api/insight/route.ts`
- `src/lib/ai/` 전체 (`client.ts`, `prompts/*`)
- `src/components/dashboard/AIInsightCard.tsx`
- `src/components/dashboard/IdentityInsightCard.tsx`
- `src/components/task/ReasonInsightCard.tsx`
- `src/components/archive/ArchiveConnectButton.tsx`

**수정 대상**
- `DashboardPage.tsx`, `TaskPage.tsx`, `ArchivePage.tsx`에서 위 컴포넌트 import·렌더링 제거
- `supabase-schema.sql`에서 `ai_insights` 테이블 정의 제거 (또는 운영 DB에서 `DROP TABLE`)
- Vercel 환경변수에서 `ANTHROPIC_API_KEY` 제거
- `src/lib/storage.ts`의 `insightStore` 관련 함수 제거

**완료 기준**: 코드베이스 전수 grep `ai/`, `insight`, `ANTHROPIC` → 0건. 빌드 경고 없음.

---

### P3 — PWA 마감 + 리브랜딩 + 접근성(임상 요건)

- **접근성 (P1 승격 — 대상에 아동·지체장애 당사자 포함)**:
  - 명도 대비 WCAG AA(4.5:1) 점검 — `--text-muted: #8a9a82` on `#fff` 등 소형 텍스트 재조정
  - viewport `maximum-scale=1` 제거(확대 허용)
  - 터치 타깃 최소 44×44pt 확보(하단 내비·점수 선택·체크 버튼)
  - 시스템 글꼴 확대 설정 존중
- **용어 절충(전문성 유지)**: 컨디션 4축 영문 임상 라벨(`Physical Capacity` 등) → 한글 라벨 우선 + 영문 부가. 전문 용어에 툴팁 풀이(P0-B 튜토리얼 연계)
- **리브랜딩**: "OTD·H" / "Occupation Tracking Dashboard" / "Occupational Therapist's Daily Hub" 잔존 텍스트를 "OTD" / "Own The Day"로 전수 교체
  - `README.md`, `src/app/layout.tsx` (metadata title/description), `public/manifest.json` (name/short_name/description), `src/app/page.tsx` SplashScreen 컴포넌트의 "OTD" 워드마크 옆 "H" 점 표기 제거, 태그라인 "Occupational Therapist's Daily Hub" → "Own The Day"
- `public/icon.svg` → 192×192, 512×512 **PNG** 아이콘 추가 (TWA는 PNG 권장, maskable 포함)
- `manifest.json`에 `icons` 배열 PNG로 교체, `id` 필드 추가 권장
- 기본 서비스워커 추가 (오프라인 시 최소 셸 캐싱 — 필수는 아니나 Play 심사 시 "정상 작동 앱" 인상에 유리)
- `layout.tsx`의 `viewport`/`themeColor`를 Next.js 14 권장 방식(`generateViewport`)으로 정리 (현재 `metadata.viewport` 직접 지정은 deprecation 경고 대상)

---

### P4 — 법적/정책 요건

**4-1. 개인정보처리방침 페이지** (`/privacy` 라우트, 필수)
- 수집 항목 명시: 이메일(Google·Kakao 로그인 — 카카오는 비즈니스 앱 미등록 시 이메일 자체가 없을 수 있음. 그 외 이름·프로필사진 등은 수집하지 않음), 습관/업무/프로젝트 기록, 컨디션(정서 4축 — 민감), 재무 항목(수입/저축 — 민감), 아카이브 메모
- **서비스 품질 개선 목적 이용 고지** (확정, 2026-06-20): "수집된 이용 데이터는 서비스 품질 개선을 위한 통계 분석에 활용될 수 있습니다"라는 취지의 조항 포함. 정식 학술/임상 연구 목적이 아니므로 별도의 연구동의 절차는 불필요 — 표준 개인정보처리방침 고지로 충분
- **원칙 (설계에도 반영)**: 컨디션(정서) 데이터 등 민감 항목의 내부 분석은 **반드시 집계·비식별 형태로만** 수행. 개별 사용자 단위로 재식별하여 들여다보는 분석/대시보드는 만들지 않음
- 보관 위치(Supabase), 제3자 제공 없음, 보관 기간, 삭제 방법 명시

**4-2. 계정 삭제 기능 (Play 필수 요건)**
- 로그인 기반 앱은 **앱 내 계정 삭제 기능** + **웹 기반 삭제 요청 경로**를 모두 제공해야 Play 심사 통과
- 설정 화면에 "계정 및 모든 데이터 삭제" 버튼 → 전 테이블 cascade delete → `auth.users` 삭제
- 이 URL을 Play Console "Data deletion" 섹션에 등록

**4-3. Data Safety 설문 사전 정리**
- 수집: 이메일(계정), "건강 및 피트니스"가 아닌 "기타 — 정신적/정서적 상태 자기보고"로 분류 가능성 검토(애매하면 보수적으로 "건강" 카테고리 체크 권장), 재무 정보
- 공유 여부: 제3자 공유 없음(AI 제거로 외부 전송 없음) → 설문 단순화됨

---

### P5 — Android 패키징 (TWA)

- 패키지명: **`kr.othub.otd`** (0-A에서 가결정 — 최종 확정 후 변경 불가하므로 착수 전 재확인)
- PWABuilder(https://www.pwabuilder.com) 에 Vercel 프로덕션 URL 입력 → Android 패키지 생성
- `/.well-known/assetlinks.json` 배포 (TWA가 브라우저 주소창 없이 풀스크린으로 뜨려면 필수 — Digital Asset Links 검증)
- 서명 키 생성 및 안전 보관 (분실 시 업데이트 불가)
- 버전코드/버전네임 규칙 정하기 (예: 1.0.0 / versionCode 1)

---

### P6 — Play Console 제출

- 스토어 등록정보: 앱 이름, 짧은/긴 설명, 아이콘, 스크린샷(휴대폰 최소 2장), 피처 그래픽
  - **포지셔닝 카피 방향 (확정)**: "작업치료사가 설계한 자기관리 도구" 신뢰 소구
  - 짧은 설명(초안): "작업치료사가 설계한 습관·컨디션 기록. 역할 중심으로 하루를 관리하세요."
  - ⚠️ **Play 의료·건강 심사 대비**: 효능/치료를 약속하는 표현 금지 — "치료한다·재활효과·증상개선·의학적·진단" 등 배제. "기록·관리·돌아봄·설계" 등 자기관리 어휘 사용. 의료기기/의료서비스로 오인되지 않게 작성
- 콘텐츠 등급 설문(IARC) 작성
- 타겟 연령층 설정
- 광고 없음 선언
- 개인정보처리방침 URL 등록 (P4-1)
- 데이터 삭제 URL 등록 (P4-2)
- Data Safety 설문 제출 (P4-3)
- **비공개 테스트**: 테스터 12명 확보(확보 가능 확인됨) → 14일 연속 옵트인 유지 → 프로덕션 액세스 신청

---
