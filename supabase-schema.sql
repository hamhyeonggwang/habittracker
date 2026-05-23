-- ============================================================
-- Life Hacking Dashboard — Supabase Schema
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

-- 4. MENTAL_STATE_LOGS
CREATE TABLE IF NOT EXISTS mental_state_logs (
  id            text PRIMARY KEY,
  date          text NOT NULL UNIQUE,
  mood          int  DEFAULT 3,
  energy        int  DEFAULT 3,
  stress        int  DEFAULT 3,
  sleep_quality int  DEFAULT 3,
  note          text DEFAULT ''
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
  category text DEFAULT 'fixed'
);
ALTER TABLE finance_items DISABLE ROW LEVEL SECURITY;
