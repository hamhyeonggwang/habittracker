// ============================================================
// CORE DATA TYPES
// ============================================================

export type Priority = 'low' | 'medium' | 'high';
export type ProjectScope = 'weekly' | 'monthly';
export type ProjectStatus = 'active' | 'done' | 'paused';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type ArchiveCategory = 'book' | 'work' | 'research' | 'clinical' | 'idea' | 'etc';
export type MoodScore = 1 | 2 | 3 | 4 | 5;

// MOHO — Volition: 삶의 역할 태그
export type RoleTag = 'researcher' | 'clinician' | 'learner' | 'health' | 'social' | 'creator';

// MOHO — Habituation: 루틴 시간대
export type RoutineSlot = 'morning' | 'afternoon' | 'evening' | 'flexible';

// MOHO — Performance: 수행 후 기록 점수
export type PerformanceScore = 1 | 2 | 3 | 4 | 5;

// ============================================================
// HABIT TRACKER
// ============================================================
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetDaysPerWeek: number;
  createdAt: string; // ISO date string
  isArchived: boolean;
  // MOHO — Volition
  roles: RoleTag[];
  // MOHO — Habituation
  routineSlot: RoutineSlot;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
  // MOHO — Performance
  energyAfter?: PerformanceScore;
  satisfactionAfter?: PerformanceScore;
}

// ============================================================
// PROJECT (주간/월간 프로젝트)
// ============================================================
export interface Project {
  id: string;
  title: string;
  scope: ProjectScope;    // 'weekly' | 'monthly'
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
  status: ProjectStatus;  // 'active' | 'done' | 'paused'
  color: string;
  roles: RoleTag[];
  createdAt: string;
}

// ============================================================
// DAILY TASK
// ============================================================
export interface Task {
  id: string;
  title: string;
  priority: Priority;
  timeSlot: TimeSlot;
  date: string; // YYYY-MM-DD
  completed: boolean;
  incompleteReason?: string;
  createdAt: string;
  projectId?: string; // 소속 프로젝트 (없으면 독립형)
}

// ============================================================
// MENTAL STATE
// ============================================================
export interface MentalStateLog {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodScore;
  energy: MoodScore;
  stress: MoodScore;
  sleepQuality: MoodScore;
  note: string;
}

// ============================================================
// ARCHIVE / INSIGHT
// ============================================================
export interface ArchiveItem {
  id: string;
  title: string;
  content: string;
  category: ArchiveCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// AGGREGATE / STATS (computed, not stored)
// ============================================================
export interface WeeklyHabitStats {
  habitId: string;
  habitName: string;
  completedDays: number;
  targetDays: number;
  rate: number; // 0-100
}

export interface DailyStats {
  date: string;
  habitCompletionRate: number;
  taskCompletionRate: number;
  avgMentalScore: number;
}

// ============================================================
// ============================================================
// DASHBOARD — IDENTITY
// ============================================================
export interface IdentityStatement {
  id: string;
  keyword: string;
  statement: string;
}

export type GoalStatus = '준비 중' | '진행 중' | '완료';

export interface Goal {
  id: string;
  field: string;
  goal: string;
  metric: string;
  status: GoalStatus;
}

// ============================================================
// DASHBOARD — ROADMAP
// ============================================================
export interface Quarter {
  id: string;
  label: string;
  milestone: string;
  criteria: string;
}

export interface MonthPlan {
  month: number; // 1-12
  plan: string;
}

// ============================================================
// DASHBOARD — FINANCE
// ============================================================
export type FinanceCategory = 'income' | 'fixed' | 'variable';

export interface FinanceItem {
  id: string;
  type: string;
  amount: number;
  category: FinanceCategory;
}

// ============================================================
// MOHO AGGREGATE (computed, not stored)
// ============================================================
export interface RoleStats {
  role: RoleTag;
  completedDays: number;
  totalDays: number;
  rate: number; // 0-100
}

export interface RoutineSlotStats {
  slot: RoutineSlot;
  completedCount: number;
  totalCount: number;
  rate: number; // 0-100
}

export interface PerformanceTrend {
  date: string;
  avgEnergy: number;
  avgSatisfaction: number;
}

