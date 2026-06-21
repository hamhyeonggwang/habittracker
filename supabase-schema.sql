-- ============================================================
-- Occupation Tracking Dashboard — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. HABITS
CREATE TABLE IF NOT EXISTS habits (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  icon                text DEFAULT '🎯',
  color               text DEFAULT '#4a7c59',
  target_days_per_week int  DEFAULT 7,
  created_at          text NOT NULL,
  is_archived         boolean DEFAULT false,
  roles               text[] DEFAULT '{}',
  routine_slot        text DEFAULT 'flexible'
);
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;

-- 2. HABIT_LOGS
CREATE TABLE IF NOT EXISTS habit_logs (
  id                text PRIMARY KEY,
  habit_id          text REFERENCES habits(id) ON DELETE CASCADE,
  date              text NOT NULL,
  completed         boolean DEFAULT false,
  note              text,
  energy_after      int,
  satisfaction_after int
);
ALTER TABLE habit_logs DISABLE ROW LEVEL SECURITY;

-- 3. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id               text PRIMARY KEY,
  title            text NOT NULL,
  priority         text DEFAULT 'medium',
  time_slot        text DEFAULT 'morning',
  date             text NOT NULL,
  completed        boolean DEFAULT false,
  incomplete_reason text,
  created_at       text NOT NULL
);
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 4. MENTAL_STATE_LOGS (MOHO 4축 에너지 모델)
CREATE TABLE IF NOT EXISTS mental_state_logs (
  id          text PRIMARY KEY,
  date        text NOT NULL UNIQUE,
  body        int  DEFAULT 3,  -- 신체 수행 에너지
  emotion     int  DEFAULT 3,  -- 정서 참여 에너지
  focus       int  DEFAULT 3,  -- 인지 흐름 상태
  environment int  DEFAULT 3,  -- 환경 지원도
  note        text DEFAULT ''
);
ALTER TABLE mental_state_logs DISABLE ROW LEVEL SECURITY;

-- 5. ARCHIVE_ITEMS
CREATE TABLE IF NOT EXISTS archive_items (
  id         text PRIMARY KEY,
  title      text NOT NULL,
  content    text DEFAULT '',
  category   text DEFAULT 'etc',
  tags       text[] DEFAULT '{}',
  created_at text NOT NULL,
  updated_at text NOT NULL
);
ALTER TABLE archive_items DISABLE ROW LEVEL SECURITY;

-- 6. IDENTITY_STATEMENTS
CREATE TABLE IF NOT EXISTS identity_statements (
  id        text PRIMARY KEY,
  keyword   text DEFAULT '',
  statement text DEFAULT ''
);
ALTER TABLE identity_statements DISABLE ROW LEVEL SECURITY;

-- 7. GOALS
CREATE TABLE IF NOT EXISTS goals (
  id     text PRIMARY KEY,
  field  text DEFAULT '',
  goal   text DEFAULT '',
  metric text DEFAULT '',
  status text DEFAULT '준비 중'
);
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;

-- 8. QUARTERS
CREATE TABLE IF NOT EXISTS quarters (
  id        text PRIMARY KEY,
  label     text DEFAULT '',
  milestone text DEFAULT '',
  criteria  text DEFAULT ''
);
ALTER TABLE quarters DISABLE ROW LEVEL SECURITY;

-- 9. MONTH_PLANS
CREATE TABLE IF NOT EXISTS month_plans (
  month int  PRIMARY KEY CHECK (month BETWEEN 1 AND 12),
  plan  text DEFAULT ''
);
ALTER TABLE month_plans DISABLE ROW LEVEL SECURITY;

-- 10. FINANCE_ITEMS
CREATE TABLE IF NOT EXISTS finance_items (
  id       text PRIMARY KEY,
  type     text DEFAULT '',
  amount   int  DEFAULT 0,
  category text DEFAULT 'fixed'  -- income | savings | fixed | variable
);
ALTER TABLE finance_items DISABLE ROW LEVEL SECURITY;

-- 11. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id         text PRIMARY KEY,
  title      text NOT NULL,
  scope      text DEFAULT 'weekly',
  start_date text NOT NULL,
  end_date   text NOT NULL,
  status     text DEFAULT 'active',
  color      text DEFAULT '#4a7c59',
  roles      text[] DEFAULT '{}',
  created_at text NOT NULL
);
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- 12. MEANINGFUL_MOMENTS (오늘 가장 의미 있었던 순간 — 하루 1건)
CREATE TABLE IF NOT EXISTS meaningful_moments (
  id         text PRIMARY KEY,
  date       text NOT NULL UNIQUE,
  content    text DEFAULT '',
  created_at text NOT NULL
);
ALTER TABLE meaningful_moments DISABLE ROW LEVEL SECURITY;

-- tasks에 project_id 컬럼 추가 (이미 있으면 무시됨)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id text REFERENCES projects(id) ON DELETE SET NULL;

-- tasks에 roles(정체성 역할 태그) 컬럼 추가 (이미 있으면 무시됨)
-- therapist | leader | researcher | developer | father | believer
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}';

-- ============================================================
-- RLS POLICIES — anon 롤 전체 허용
-- sb_publishable_ 키는 anon 롤로 동작하므로
-- DISABLE ROW LEVEL SECURITY 만으로는 INSERT가 차단됨.
-- RLS를 켠 채로 명시적 policy를 추가해야 함.
-- ============================================================
ALTER TABLE habits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_state_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarters            ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE meaningful_moments  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON habits              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON habit_logs          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON tasks               FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON mental_state_logs   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON archive_items       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON identity_statements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON goals               FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON quarters            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON month_plans         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON finance_items       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON projects            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON meaningful_moments  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- P1 ① 멀티테넌트 비파괴 추가 (적용 완료: migration p1_add_user_id_columns_and_life_roles)
-- nullable user_id + life_roles 테이블. anon_all 정책은 유지되므로 기존 앱 정상 동작.
-- ============================================================
ALTER TABLE habits              ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE habit_logs          ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tasks               ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE projects            ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE mental_state_logs   ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE archive_items       ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE identity_statements ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE goals               ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE quarters            ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE month_plans         ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE finance_items       ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE meaningful_moments  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS life_roles (
  id         text PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  label      text NOT NULL,
  emoji      text DEFAULT '🏷️',
  color      text DEFAULT '#4a7c59',
  sort_order int  DEFAULT 0,
  created_at text NOT NULL
);
ALTER TABLE life_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON life_roles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- P1 컷오버 진행 상황 (2026-06-21)
-- ============================================================
-- ✅ 적용 완료 (라이브):
--   - owner_all (authenticated) 정책 12개 테이블 — migration p1_add_owner_all_policies
--   - 기존 데이터 백필: 전 테이블 user_id = '58f9c6d0-...813e'(소유자 본인)
--   - 복합 유니크 추가(additive, 기존 제약 유지): migration p1_add_composite_unique_constraints
--       mental_state_logs_user_date_key (user_id,date)
--       meaningful_moments_user_date_key (user_id,date)
--       month_plans_user_month_key (user_id,month)
--   - 코드 upsert onConflict → 'user_id,date' / 'user_id,month'
--
-- ✅ 최종 잠금 적용 완료 — migration p1_final_lockdown (배포 후):
--   - anon_all 정책 12개 전부 DROP → 비인증 접근 차단(원 취약점 해소)
--   - 구 제약 제거: mental_state_logs_date_key, meaningful_moments_date_key
--   - month_plans: PK(month) → PK(user_id, month)
--   - 전 테이블 user_id NOT NULL
--   - ai_insights 테이블 DROP
--
-- 최종 상태: 전 테이블 RLS = owner_all(authenticated)만. anon은 행 0개.
-- ⚠️ 위쪽 'RLS POLICIES — anon 롤 전체 허용' 및 각 CREATE TABLE의 초기 정의는
--    역사적 기록일 뿐 현재 라이브와 다름. 권위 있는 이력은 Supabase migrations 참조.
--
-- 선택적 후속 하드닝: REVOKE SELECT ON <테이블> FROM anon
--   (RLS가 이미 행을 막지만 GraphQL 스키마 노출 경고 제거용)
