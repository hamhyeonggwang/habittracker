/**
 * One-time migration: localStorage → Supabase
 * Runs automatically on first app load when localStorage data exists.
 * After upload, marks migration complete to avoid re-running.
 */
import { supabase } from './supabase';

const MIGRATION_KEY = 'lhd_migrated_to_supabase';

const LS_KEYS = {
  HABITS: 'lhd_habits',
  HABIT_LOGS: 'lhd_habit_logs',
  TASKS: 'lhd_tasks',
  MENTAL_STATE: 'lhd_mental_state',
  ARCHIVE: 'lhd_archive',
  IDENTITY: 'lhd_identity',
  GOALS: 'lhd_goals',
  QUARTERS: 'lhd_quarters',
  MONTH_PLANS: 'lhd_month_plans',
  FINANCE: 'lhd_finance',
};

function readLS(key: string): unknown[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const hasData = Object.values(LS_KEYS).some(k => localStorage.getItem(k));
  if (!hasData) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  try {
    const habits = readLS(LS_KEYS.HABITS) as Record<string, unknown>[];
    if (habits.length) {
      await supabase.from('habits').upsert(habits.map((h) => ({
        id: h.id, name: h.name, icon: h.icon ?? '🎯', color: h.color ?? '#4a7c59',
        target_days_per_week: h.targetDaysPerWeek ?? 7,
        created_at: h.createdAt ?? new Date().toISOString(),
        is_archived: h.isArchived ?? false,
        roles: h.roles ?? [],
        routine_slot: h.routineSlot ?? 'flexible',
      })));
    }

    const logs = readLS(LS_KEYS.HABIT_LOGS) as Record<string, unknown>[];
    if (logs.length) {
      await supabase.from('habit_logs').upsert(logs.map((l) => ({
        id: l.id, habit_id: l.habitId, date: l.date, completed: l.completed ?? false,
        note: l.note ?? null,
        energy_after: l.energyAfter ?? null,
        satisfaction_after: l.satisfactionAfter ?? null,
      })));
    }

    const tasks = readLS(LS_KEYS.TASKS) as Record<string, unknown>[];
    if (tasks.length) {
      await supabase.from('tasks').upsert(tasks.map((t) => ({
        id: t.id, title: t.title, priority: t.priority ?? 'medium',
        time_slot: t.timeSlot ?? 'morning', date: t.date,
        completed: t.completed ?? false,
        incomplete_reason: t.incompleteReason ?? null,
        created_at: t.createdAt ?? t.date,
      })));
    }

    const mental = readLS(LS_KEYS.MENTAL_STATE) as Record<string, unknown>[];
    if (mental.length) {
      await supabase.from('mental_state_logs').upsert(mental.map((m) => ({
        id: m.id, date: m.date,
        body: m.mood ?? 3, emotion: m.energy ?? 3,
        focus: m.stress ?? 3, environment: m.sleepQuality ?? 3,
        note: m.note ?? '',
      })), { onConflict: 'date' });
    }

    const archive = readLS(LS_KEYS.ARCHIVE) as Record<string, unknown>[];
    if (archive.length) {
      await supabase.from('archive_items').upsert(archive.map((a) => ({
        id: a.id, title: a.title, content: a.content ?? '', category: a.category ?? 'etc',
        tags: a.tags ?? [], created_at: a.createdAt, updated_at: a.updatedAt ?? a.createdAt,
      })));
    }

    const identity = readLS(LS_KEYS.IDENTITY) as Record<string, unknown>[];
    if (identity.length) {
      await supabase.from('identity_statements').upsert(identity.map((i) => ({
        id: i.id, keyword: i.keyword ?? '', statement: i.statement ?? '',
      })));
    }

    const goals = readLS(LS_KEYS.GOALS) as Record<string, unknown>[];
    if (goals.length) {
      await supabase.from('goals').upsert(goals.map((g) => ({
        id: g.id, field: g.field ?? '', goal: g.goal ?? '',
        metric: g.metric ?? '', status: g.status ?? '준비 중',
      })));
    }

    const quarters = readLS(LS_KEYS.QUARTERS) as Record<string, unknown>[];
    if (quarters.length) {
      await supabase.from('quarters').upsert(quarters.map((q) => ({
        id: q.id, label: q.label ?? '', milestone: q.milestone ?? '', criteria: q.criteria ?? '',
      })));
    }

    const monthPlans = readLS(LS_KEYS.MONTH_PLANS) as Record<string, unknown>[];
    if (monthPlans.length) {
      await supabase.from('month_plans').upsert(
        monthPlans.map((m) => ({ month: m.month, plan: m.plan ?? '' })),
        { onConflict: 'month' }
      );
    }

    const finance = readLS(LS_KEYS.FINANCE) as Record<string, unknown>[];
    if (finance.length) {
      await supabase.from('finance_items').upsert(finance.map((f) => ({
        id: f.id, type: f.type ?? '', amount: f.amount ?? 0, category: f.category ?? 'fixed',
      })));
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[migrate] localStorage → Supabase 완료');
  } catch (err) {
    console.error('[migrate] 마이그레이션 실패:', err);
  }
}
