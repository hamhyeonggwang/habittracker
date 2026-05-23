// ============================================================
// CORE DATA TYPES
// Designed for LocalStorage now, Supabase-ready later
// ============================================================

export type Priority = 'low' | 'medium' | 'high';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';
export type ArchiveCategory = 'book' | 'work' | 'research' | 'clinical' | 'idea' | 'etc';
export type MoodScore = 1 | 2 | 3 | 4 | 5;

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
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  note?: string;
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
// SUPABASE TABLE MAPPING (for future migration)
// Each interface maps to a Supabase table:
// habits           → Habit
// habit_logs       → HabitLog
// tasks            → Task
// mental_state_logs → MentalStateLog
// archive_items    → ArchiveItem
//
// Add userId: string to each when auth is enabled
// ============================================================
