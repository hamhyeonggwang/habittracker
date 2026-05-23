import { supabase } from './supabase';
import {
  Habit, HabitLog, Task, MentalStateLog, ArchiveItem,
  PerformanceScore, RoleTag, RoutineSlot, Priority, TimeSlot,
  MoodScore, ArchiveCategory, GoalStatus,
  IdentityStatement, Goal, Quarter, MonthPlan, FinanceItem, FinanceCategory,
} from '@/types';

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Row mappers (DB snake_case → TS camelCase) ──────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHabit(r: any): Habit {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon ?? '🎯',
    color: r.color ?? '#4a7c59',
    targetDaysPerWeek: r.target_days_per_week ?? 7,
    createdAt: r.created_at,
    isArchived: r.is_archived ?? false,
    roles: (r.roles ?? []) as RoleTag[],
    routineSlot: (r.routine_slot ?? 'flexible') as RoutineSlot,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHabitLog(r: any): HabitLog {
  return {
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    completed: r.completed ?? false,
    note: r.note ?? undefined,
    energyAfter: r.energy_after ?? undefined,
    satisfactionAfter: r.satisfaction_after ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    priority: (r.priority ?? 'medium') as Priority,
    timeSlot: (r.time_slot ?? 'morning') as TimeSlot,
    date: r.date,
    completed: r.completed ?? false,
    incompleteReason: r.incomplete_reason ?? undefined,
    createdAt: r.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMentalLog(r: any): MentalStateLog {
  return {
    id: r.id,
    date: r.date,
    mood: (r.mood ?? 3) as MoodScore,
    energy: (r.energy ?? 3) as MoodScore,
    stress: (r.stress ?? 3) as MoodScore,
    sleepQuality: (r.sleep_quality ?? 3) as MoodScore,
    note: r.note ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArchiveItem(r: any): ArchiveItem {
  return {
    id: r.id,
    title: r.title,
    content: r.content ?? '',
    category: (r.category ?? 'etc') as ArchiveCategory,
    tags: r.tags ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIdentityStatement(r: any): IdentityStatement {
  return { id: r.id, keyword: r.keyword ?? '', statement: r.statement ?? '' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGoal(r: any): Goal {
  return {
    id: r.id,
    field: r.field ?? '',
    goal: r.goal ?? '',
    metric: r.metric ?? '',
    status: (r.status ?? '준비 중') as GoalStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuarter(r: any): Quarter {
  return { id: r.id, label: r.label ?? '', milestone: r.milestone ?? '', criteria: r.criteria ?? '' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMonthPlan(r: any): MonthPlan {
  return { month: r.month, plan: r.plan ?? '' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFinanceItem(r: any): FinanceItem {
  return {
    id: r.id,
    type: r.type ?? '',
    amount: r.amount ?? 0,
    category: (r.category ?? 'fixed') as FinanceCategory,
  };
}

// ── Stores ───────────────────────────────────────────────────

export const habitStore = {
  async getAll(): Promise<Habit[]> {
    const { data } = await supabase.from('habits').select('*').order('created_at');
    return (data ?? []).map(mapHabit);
  },
  async add(habit: Habit): Promise<void> {
    await supabase.from('habits').insert({
      id: habit.id, name: habit.name, icon: habit.icon, color: habit.color,
      target_days_per_week: habit.targetDaysPerWeek, created_at: habit.createdAt,
      is_archived: habit.isArchived, roles: habit.roles, routine_slot: habit.routineSlot,
    });
  },
  async update(id: string, updates: Partial<Habit>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.icon !== undefined) row.icon = updates.icon;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.targetDaysPerWeek !== undefined) row.target_days_per_week = updates.targetDaysPerWeek;
    if (updates.isArchived !== undefined) row.is_archived = updates.isArchived;
    if (updates.roles !== undefined) row.roles = updates.roles;
    if (updates.routineSlot !== undefined) row.routine_slot = updates.routineSlot;
    await supabase.from('habits').update(row).eq('id', id);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('habits').delete().eq('id', id);
  },
  async save(habits: Habit[]): Promise<void> {
    await supabase.from('habits').delete().neq('id', '');
    if (habits.length) {
      await supabase.from('habits').insert(habits.map(h => ({
        id: h.id, name: h.name, icon: h.icon, color: h.color,
        target_days_per_week: h.targetDaysPerWeek, created_at: h.createdAt,
        is_archived: h.isArchived, roles: h.roles, routine_slot: h.routineSlot,
      })));
    }
  },
};

export const habitLogStore = {
  async getAll(): Promise<HabitLog[]> {
    const { data } = await supabase.from('habit_logs').select('*').order('date');
    return (data ?? []).map(mapHabitLog);
  },
  async getByDate(date: string): Promise<HabitLog[]> {
    const { data } = await supabase.from('habit_logs').select('*').eq('date', date);
    return (data ?? []).map(mapHabitLog);
  },
  async toggle(habitId: string, date: string): Promise<void> {
    const { data } = await supabase.from('habit_logs').select('*')
      .eq('habit_id', habitId).eq('date', date).maybeSingle();
    if (data) {
      await supabase.from('habit_logs').update({ completed: !data.completed }).eq('id', data.id);
    } else {
      await supabase.from('habit_logs').insert({ id: newId(), habit_id: habitId, date, completed: true });
    }
  },
  async deleteByHabitId(habitId: string): Promise<void> {
    await supabase.from('habit_logs').delete().eq('habit_id', habitId);
  },
  async updatePerformance(habitId: string, date: string, energy: PerformanceScore, satisfaction: PerformanceScore): Promise<void> {
    const { data } = await supabase.from('habit_logs').select('id')
      .eq('habit_id', habitId).eq('date', date).maybeSingle();
    if (data) {
      await supabase.from('habit_logs').update({ energy_after: energy, satisfaction_after: satisfaction }).eq('id', data.id);
    }
  },
  async upsertMany(logs: HabitLog[]): Promise<void> {
    if (!logs.length) return;
    await supabase.from('habit_logs').upsert(logs.map(l => ({
      id: l.id, habit_id: l.habitId, date: l.date, completed: l.completed,
      note: l.note, energy_after: l.energyAfter, satisfaction_after: l.satisfactionAfter,
    })));
  },
};

export const taskStore = {
  async getAll(): Promise<Task[]> {
    const { data } = await supabase.from('tasks').select('*').order('created_at');
    return (data ?? []).map(mapTask);
  },
  async getByDate(date: string): Promise<Task[]> {
    const { data } = await supabase.from('tasks').select('*').eq('date', date).order('created_at');
    return (data ?? []).map(mapTask);
  },
  async add(task: Task): Promise<void> {
    await supabase.from('tasks').insert({
      id: task.id, title: task.title, priority: task.priority,
      time_slot: task.timeSlot, date: task.date, completed: task.completed,
      incomplete_reason: task.incompleteReason, created_at: task.createdAt,
    });
  },
  async update(id: string, updates: Partial<Task>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.priority !== undefined) row.priority = updates.priority;
    if (updates.timeSlot !== undefined) row.time_slot = updates.timeSlot;
    if (updates.completed !== undefined) row.completed = updates.completed;
    if (updates.incompleteReason !== undefined) row.incomplete_reason = updates.incompleteReason;
    await supabase.from('tasks').update(row).eq('id', id);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('tasks').delete().eq('id', id);
  },
};

export const mentalStore = {
  async getAll(): Promise<MentalStateLog[]> {
    const { data } = await supabase.from('mental_state_logs').select('*').order('date');
    return (data ?? []).map(mapMentalLog);
  },
  async getByDate(date: string): Promise<MentalStateLog | null> {
    const { data } = await supabase.from('mental_state_logs').select('*')
      .eq('date', date).maybeSingle();
    return data ? mapMentalLog(data) : null;
  },
  async save(log: MentalStateLog): Promise<void> {
    await supabase.from('mental_state_logs').upsert({
      id: log.id, date: log.date, mood: log.mood, energy: log.energy,
      stress: log.stress, sleep_quality: log.sleepQuality, note: log.note,
    }, { onConflict: 'date' });
  },
};

export const archiveStore = {
  async getAll(): Promise<ArchiveItem[]> {
    const { data } = await supabase.from('archive_items').select('*').order('created_at', { ascending: false });
    return (data ?? []).map(mapArchiveItem);
  },
  async add(item: ArchiveItem): Promise<void> {
    await supabase.from('archive_items').insert({
      id: item.id, title: item.title, content: item.content,
      category: item.category, tags: item.tags, created_at: item.createdAt, updated_at: item.updatedAt,
    });
  },
  async update(id: string, updates: Partial<ArchiveItem>): Promise<void> {
    const row: Record<string, unknown> = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.content !== undefined) row.content = updates.content;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.tags !== undefined) row.tags = updates.tags;
    if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;
    await supabase.from('archive_items').update(row).eq('id', id);
  },
  async delete(id: string): Promise<void> {
    await supabase.from('archive_items').delete().eq('id', id);
  },
  async search(query: string): Promise<ArchiveItem[]> {
    const all = await archiveStore.getAll();
    const q = query.toLowerCase();
    return all.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  },
};

export const identityStatementStore = {
  async getAll(): Promise<IdentityStatement[]> {
    const { data } = await supabase.from('identity_statements').select('*');
    return (data ?? []).map(mapIdentityStatement);
  },
  async save(items: IdentityStatement[]): Promise<void> {
    await supabase.from('identity_statements').delete().neq('id', '');
    if (items.length) await supabase.from('identity_statements').insert(items);
  },
};

export const goalStore = {
  async getAll(): Promise<Goal[]> {
    const { data } = await supabase.from('goals').select('*');
    return (data ?? []).map(mapGoal);
  },
  async save(items: Goal[]): Promise<void> {
    await supabase.from('goals').delete().neq('id', '');
    if (items.length) await supabase.from('goals').insert(items);
  },
};

export const quarterStore = {
  async getAll(): Promise<Quarter[]> {
    const { data } = await supabase.from('quarters').select('*');
    return (data ?? []).map(mapQuarter);
  },
  async save(items: Quarter[]): Promise<void> {
    await supabase.from('quarters').delete().neq('id', '');
    if (items.length) await supabase.from('quarters').insert(items);
  },
};

export const monthPlanStore = {
  async getAll(): Promise<MonthPlan[]> {
    const { data } = await supabase.from('month_plans').select('*').order('month');
    const stored = (data ?? []).map(mapMonthPlan);
    return Array.from({ length: 12 }, (_, i) => {
      const found = stored.find(m => m.month === i + 1);
      return found ?? { month: i + 1, plan: '' };
    });
  },
  async save(items: MonthPlan[]): Promise<void> {
    const rows = items.map(m => ({ month: m.month, plan: m.plan }));
    if (rows.length) {
      await supabase.from('month_plans').upsert(rows, { onConflict: 'month' });
    }
  },
};

export const financeStore = {
  async getAll(): Promise<FinanceItem[]> {
    const { data } = await supabase.from('finance_items').select('*');
    return (data ?? []).map(mapFinanceItem);
  },
  async save(items: FinanceItem[]): Promise<void> {
    await supabase.from('finance_items').delete().neq('id', '');
    if (items.length) await supabase.from('finance_items').insert(items.map(i => ({
      id: i.id, type: i.type, amount: i.amount, category: i.category,
    })));
  },
};

// ── No-op stubs kept for page.tsx compatibility ──────────────
export function repairStorage(): void {}
export function clearAppStorage(): void {}
export async function seedDummyData(): Promise<void> {}
export async function seedDashboardData(): Promise<void> {}
