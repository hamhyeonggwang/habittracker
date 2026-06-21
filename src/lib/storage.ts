import { supabase } from './supabase';
import { showToast } from './toast';
import { getCurrentUserId } from './auth';
import {
  Habit, HabitLog, Task, MentalStateLog, ArchiveItem, MeaningfulMoment,
  PerformanceScore, LifeRoleDef, RoutineSlot, Priority, TimeSlot,
  MoodScore, ArchiveCategory, GoalStatus,
  IdentityStatement, Goal, Quarter, MonthPlan, FinanceItem, FinanceCategory,
  Project, ProjectScope, ProjectStatus,
} from '@/types';

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type Row = Record<string, unknown>;

// 쓰기 작업 결과 — 호출부(handleSave 등)가 성공/실패를 받아 처리한다.
export type Result = { ok: true } | { ok: false; error: string };
const OK: Result = { ok: true };

function logError(op: string, error: unknown) {
  console.error(`[storage:${op}]`, error);
}

// 쓰기 실패: 콘솔 기록 + 사용자에게 토스트 안내 + 실패 Result 반환.
// (getter의 읽기 실패는 토스트하지 않고 기존 logError만 유지 — 저장 무피드백만 해결 대상)
function fail(op: string, error: unknown): Result {
  logError(op, error);
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : '알 수 없는 오류';
  showToast(`저장에 실패했어요. ${message}`, 'error');
  return { ok: false, error: message };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ── Row mappers (DB snake_case → TS camelCase) ──────────────

function mapHabit(r: Row): Habit {
  return {
    id: r.id as string,
    name: r.name as string,
    icon: (r.icon as string) ?? '🎯',
    color: (r.color as string) ?? '#4a7c59',
    targetDaysPerWeek: (r.target_days_per_week as number) ?? 7,
    createdAt: r.created_at as string,
    isArchived: (r.is_archived as boolean) ?? false,
    roles: ((r.roles as string[]) ?? []),
    routineSlot: ((r.routine_slot as RoutineSlot) ?? 'flexible'),
  };
}

function mapHabitLog(r: Row): HabitLog {
  return {
    id: r.id as string,
    habitId: r.habit_id as string,
    date: r.date as string,
    completed: (r.completed as boolean) ?? false,
    note: r.note as string | undefined,
    energyAfter: r.energy_after as PerformanceScore | undefined,
    satisfactionAfter: r.satisfaction_after as PerformanceScore | undefined,
  };
}

function mapTask(r: Row): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    priority: ((r.priority as Priority) ?? 'medium'),
    timeSlot: ((r.time_slot as TimeSlot) ?? 'morning'),
    date: r.date as string,
    completed: (r.completed as boolean) ?? false,
    incompleteReason: r.incomplete_reason as string | undefined,
    createdAt: r.created_at as string,
    projectId: r.project_id as string | undefined,
    roles: ((r.roles as string[]) ?? []),
  };
}

function mapProject(r: Row): Project {
  return {
    id: r.id as string,
    title: r.title as string,
    scope: ((r.scope as ProjectScope) ?? 'weekly'),
    startDate: r.start_date as string,
    endDate: r.end_date as string,
    status: ((r.status as ProjectStatus) ?? 'active'),
    color: (r.color as string) ?? '#4a7c59',
    roles: ((r.roles as string[]) ?? []),
    createdAt: r.created_at as string,
  };
}

function mapMentalLog(r: Row): MentalStateLog {
  return {
    id: r.id as string,
    date: r.date as string,
    body:        ((r.body as MoodScore) ?? 3),
    emotion:     ((r.emotion as MoodScore) ?? 3),
    focus:       ((r.focus as MoodScore) ?? 3),
    environment: ((r.environment as MoodScore) ?? 3),
    note: (r.note as string) ?? '',
  };
}

function mapMeaningful(r: Row): MeaningfulMoment {
  return {
    id: r.id as string,
    date: r.date as string,
    content: (r.content as string) ?? '',
    createdAt: (r.created_at as string) ?? '',
  };
}

function mapArchiveItem(r: Row): ArchiveItem {
  return {
    id: r.id as string,
    title: r.title as string,
    content: (r.content as string) ?? '',
    category: ((r.category as ArchiveCategory) ?? 'etc'),
    tags: ((r.tags as string[]) ?? []),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function mapIdentityStatement(r: Row): IdentityStatement {
  return {
    id: r.id as string,
    keyword: (r.keyword as string) ?? '',
    statement: (r.statement as string) ?? '',
  };
}

function mapGoal(r: Row): Goal {
  return {
    id: r.id as string,
    field: (r.field as string) ?? '',
    goal: (r.goal as string) ?? '',
    metric: (r.metric as string) ?? '',
    status: ((r.status as GoalStatus) ?? '준비 중'),
  };
}

function mapQuarter(r: Row): Quarter {
  return {
    id: r.id as string,
    label: (r.label as string) ?? '',
    milestone: (r.milestone as string) ?? '',
    criteria: (r.criteria as string) ?? '',
  };
}

function mapMonthPlan(r: Row): MonthPlan {
  return { month: r.month as number, plan: (r.plan as string) ?? '' };
}

function mapFinanceItem(r: Row): FinanceItem {
  return {
    id: r.id as string,
    type: (r.type as string) ?? '',
    amount: (r.amount as number) ?? 0,
    category: ((r.category as FinanceCategory) ?? 'fixed'),
  };
}

// ── 공통: 차등 저장 (upsert + 삭제된 행만 delete) ──────────
async function differentialSave<T extends { id: string }>(
  table: string,
  items: T[],
  toRow: (item: T) => Row,
): Promise<Result> {
  const { data: existing, error: readErr } = await supabase.from(table).select('id');
  if (readErr) return fail(`${table}.save/read`, readErr);

  const keepIds = new Set(items.map(i => i.id));
  const toDelete = (existing ?? []).map(r => r.id as string).filter(id => !keepIds.has(id));

  if (toDelete.length) {
    const { error } = await supabase.from(table).delete().in('id', toDelete);
    if (error) return fail(`${table}.save/delete`, error);
  }
  if (items.length) {
    const uid = getCurrentUserId();
    const { error } = await supabase.from(table).upsert(items.map(i => ({ ...toRow(i), user_id: uid })));
    if (error) return fail(`${table}.save/upsert`, error);
  }
  return OK;
}

// ── Stores ───────────────────────────────────────────────────

export const habitStore = {
  async getAll(): Promise<Habit[]> {
    const { data, error } = await supabase.from('habits').select('*').order('created_at');
    if (error) { logError('habits.getAll', error); return []; }
    return (data ?? []).map(mapHabit);
  },
  async add(habit: Habit): Promise<Result> {
    const { error } = await supabase.from('habits').insert({
      id: habit.id, name: habit.name, icon: habit.icon, color: habit.color,
      target_days_per_week: habit.targetDaysPerWeek, created_at: habit.createdAt,
      is_archived: habit.isArchived, roles: habit.roles, routine_slot: habit.routineSlot,
      user_id: getCurrentUserId(),
    });
    return error ? fail('habits.add', error) : OK;
  },
  async update(id: string, updates: Partial<Habit>): Promise<Result> {
    const row: Row = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.icon !== undefined) row.icon = updates.icon;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.targetDaysPerWeek !== undefined) row.target_days_per_week = updates.targetDaysPerWeek;
    if (updates.isArchived !== undefined) row.is_archived = updates.isArchived;
    if (updates.roles !== undefined) row.roles = updates.roles;
    if (updates.routineSlot !== undefined) row.routine_slot = updates.routineSlot;
    const { error } = await supabase.from('habits').update(row).eq('id', id);
    return error ? fail('habits.update', error) : OK;
  },
  async delete(id: string): Promise<Result> {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    return error ? fail('habits.delete', error) : OK;
  },
};

export const habitLogStore = {
  // 최근 90일 로그만 fetch — 월간 캘린더(~31일) + 스트릭(최대 60일) 커버
  async getAll(): Promise<HabitLog[]> {
    const since = daysAgo(90);
    const { data, error } = await supabase.from('habit_logs').select('*')
      .gte('date', since).order('date');
    if (error) { logError('habit_logs.getAll', error); return []; }
    return (data ?? []).map(mapHabitLog);
  },
  async getByDate(date: string): Promise<HabitLog[]> {
    const { data, error } = await supabase.from('habit_logs').select('*').eq('date', date);
    if (error) { logError('habit_logs.getByDate', error); return []; }
    return (data ?? []).map(mapHabitLog);
  },
  async toggle(habitId: string, date: string): Promise<Result> {
    const { data, error: readErr } = await supabase.from('habit_logs').select('*')
      .eq('habit_id', habitId).eq('date', date).maybeSingle();
    if (readErr) return fail('habit_logs.toggle/read', readErr);
    if (data) {
      const { error } = await supabase.from('habit_logs').update({ completed: !data.completed }).eq('id', data.id);
      return error ? fail('habit_logs.toggle/update', error) : OK;
    }
    const { error } = await supabase.from('habit_logs').insert({ id: newId(), habit_id: habitId, date, completed: true, user_id: getCurrentUserId() });
    return error ? fail('habit_logs.toggle/insert', error) : OK;
  },
  async deleteByHabitId(habitId: string): Promise<Result> {
    const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId);
    return error ? fail('habit_logs.deleteByHabitId', error) : OK;
  },
  async updatePerformance(habitId: string, date: string, energy: PerformanceScore, satisfaction: PerformanceScore): Promise<Result> {
    const { data, error: readErr } = await supabase.from('habit_logs').select('id')
      .eq('habit_id', habitId).eq('date', date).maybeSingle();
    if (readErr) return fail('habit_logs.updatePerformance/read', readErr);
    if (data) {
      const { error } = await supabase.from('habit_logs')
        .update({ energy_after: energy, satisfaction_after: satisfaction }).eq('id', data.id);
      return error ? fail('habit_logs.updatePerformance/update', error) : OK;
    }
    return OK;
  },
};

export const taskStore = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at');
    if (error) { logError('tasks.getAll', error); return []; }
    return (data ?? []).map(mapTask);
  },
  async getByDate(date: string): Promise<Task[]> {
    const { data, error } = await supabase.from('tasks').select('*').eq('date', date).order('created_at');
    if (error) { logError('tasks.getByDate', error); return []; }
    return (data ?? []).map(mapTask);
  },
  async add(task: Task): Promise<Result> {
    const { error } = await supabase.from('tasks').insert({
      id: task.id, title: task.title, priority: task.priority,
      time_slot: task.timeSlot, date: task.date, completed: task.completed,
      incomplete_reason: task.incompleteReason, created_at: task.createdAt,
      project_id: task.projectId ?? null,
      roles: task.roles ?? [],
      user_id: getCurrentUserId(),
    });
    return error ? fail('tasks.add', error) : OK;
  },
  async update(id: string, updates: Partial<Task>): Promise<Result> {
    const row: Row = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.priority !== undefined) row.priority = updates.priority;
    if (updates.timeSlot !== undefined) row.time_slot = updates.timeSlot;
    if (updates.completed !== undefined) row.completed = updates.completed;
    if (updates.incompleteReason !== undefined) row.incomplete_reason = updates.incompleteReason;
    if (updates.projectId !== undefined) row.project_id = updates.projectId;
    if (updates.roles !== undefined) row.roles = updates.roles;
    const { error } = await supabase.from('tasks').update(row).eq('id', id);
    return error ? fail('tasks.update', error) : OK;
  },
  async delete(id: string): Promise<Result> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    return error ? fail('tasks.delete', error) : OK;
  },
};

export const mentalStore = {
  async getAll(): Promise<MentalStateLog[]> {
    const { data, error } = await supabase.from('mental_state_logs').select('*').order('date');
    if (error) { logError('mental_state_logs.getAll', error); return []; }
    return (data ?? []).map(mapMentalLog);
  },
  async getByDate(date: string): Promise<MentalStateLog | null> {
    const { data, error } = await supabase.from('mental_state_logs').select('*')
      .eq('date', date).maybeSingle();
    if (error) { logError('mental_state_logs.getByDate', error); return null; }
    return data ? mapMentalLog(data) : null;
  },
  async save(log: MentalStateLog): Promise<Result> {
    const { error } = await supabase.from('mental_state_logs').upsert({
      id: log.id, date: log.date,
      body: log.body, emotion: log.emotion, focus: log.focus, environment: log.environment,
      note: log.note, user_id: getCurrentUserId(),
    }, { onConflict: 'user_id,date' });
    return error ? fail('mental_state_logs.save', error) : OK;
  },
};

export const meaningfulStore = {
  async getAll(): Promise<MeaningfulMoment[]> {
    const { data, error } = await supabase.from('meaningful_moments').select('*')
      .order('date', { ascending: false });
    if (error) { logError('meaningful_moments.getAll', error); return []; }
    return (data ?? []).map(mapMeaningful);
  },
  async getByDate(date: string): Promise<MeaningfulMoment | null> {
    const { data, error } = await supabase.from('meaningful_moments').select('*')
      .eq('date', date).maybeSingle();
    if (error) { logError('meaningful_moments.getByDate', error); return null; }
    return data ? mapMeaningful(data) : null;
  },
  async save(m: MeaningfulMoment): Promise<Result> {
    const { error } = await supabase.from('meaningful_moments').upsert({
      id: m.id, date: m.date, content: m.content, created_at: m.createdAt, user_id: getCurrentUserId(),
    }, { onConflict: 'user_id,date' });
    return error ? fail('meaningful_moments.save', error) : OK;
  },
};

export const archiveStore = {
  async getAll(): Promise<ArchiveItem[]> {
    const { data, error } = await supabase.from('archive_items').select('*')
      .order('created_at', { ascending: false });
    if (error) { logError('archive_items.getAll', error); return []; }
    return (data ?? []).map(mapArchiveItem);
  },
  async add(item: ArchiveItem): Promise<Result> {
    const { error } = await supabase.from('archive_items').insert({
      id: item.id, title: item.title, content: item.content,
      category: item.category, tags: item.tags,
      created_at: item.createdAt, updated_at: item.updatedAt,
      user_id: getCurrentUserId(),
    });
    return error ? fail('archive_items.add', error) : OK;
  },
  async update(id: string, updates: Partial<ArchiveItem>): Promise<Result> {
    const row: Row = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.content !== undefined) row.content = updates.content;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.tags !== undefined) row.tags = updates.tags;
    if (updates.updatedAt !== undefined) row.updated_at = updates.updatedAt;
    const { error } = await supabase.from('archive_items').update(row).eq('id', id);
    return error ? fail('archive_items.update', error) : OK;
  },
  async delete(id: string): Promise<Result> {
    const { error } = await supabase.from('archive_items').delete().eq('id', id);
    return error ? fail('archive_items.delete', error) : OK;
  },
};

export const identityStatementStore = {
  async getAll(): Promise<IdentityStatement[]> {
    const { data, error } = await supabase.from('identity_statements').select('*');
    if (error) { logError('identity_statements.getAll', error); return []; }
    return (data ?? []).map(mapIdentityStatement);
  },
  async save(items: IdentityStatement[]): Promise<Result> {
    return differentialSave('identity_statements', items, i => ({
      id: i.id, keyword: i.keyword, statement: i.statement,
    }));
  },
};

export const goalStore = {
  async getAll(): Promise<Goal[]> {
    const { data, error } = await supabase.from('goals').select('*');
    if (error) { logError('goals.getAll', error); return []; }
    return (data ?? []).map(mapGoal);
  },
  async save(items: Goal[]): Promise<Result> {
    return differentialSave('goals', items, g => ({
      id: g.id, field: g.field, goal: g.goal, metric: g.metric, status: g.status,
    }));
  },
};

export const quarterStore = {
  async getAll(): Promise<Quarter[]> {
    const { data, error } = await supabase.from('quarters').select('*');
    if (error) { logError('quarters.getAll', error); return []; }
    return (data ?? []).map(mapQuarter);
  },
  async save(items: Quarter[]): Promise<Result> {
    return differentialSave('quarters', items, q => ({
      id: q.id, label: q.label, milestone: q.milestone, criteria: q.criteria,
    }));
  },
};

export const monthPlanStore = {
  async getAll(): Promise<MonthPlan[]> {
    const { data, error } = await supabase.from('month_plans').select('*').order('month');
    if (error) { logError('month_plans.getAll', error); return []; }
    const stored = (data ?? []).map(mapMonthPlan);
    return Array.from({ length: 12 }, (_, i) => {
      const found = stored.find(m => m.month === i + 1);
      return found ?? { month: i + 1, plan: '' };
    });
  },
  async save(items: MonthPlan[]): Promise<Result> {
    const uid = getCurrentUserId();
    const rows = items.map(m => ({ month: m.month, plan: m.plan, user_id: uid }));
    if (rows.length) {
      const { error } = await supabase.from('month_plans').upsert(rows, { onConflict: 'user_id,month' });
      if (error) return fail('month_plans.save', error);
    }
    return OK;
  },
};

export const financeStore = {
  async getAll(): Promise<FinanceItem[]> {
    const { data, error } = await supabase.from('finance_items').select('*');
    if (error) { logError('finance_items.getAll', error); return []; }
    return (data ?? []).map(mapFinanceItem);
  },
  async save(items: FinanceItem[]): Promise<Result> {
    return differentialSave('finance_items', items, i => ({
      id: i.id, type: i.type, amount: i.amount, category: i.category,
    }));
  },
};

export const projectStore = {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*').order('created_at');
    if (error) { logError('projects.getAll', error); return []; }
    return (data ?? []).map(mapProject);
  },
  async getActive(): Promise<Project[]> {
    const { data, error } = await supabase.from('projects').select('*')
      .eq('status', 'active').order('start_date');
    if (error) { logError('projects.getActive', error); return []; }
    return (data ?? []).map(mapProject);
  },
  async add(project: Project): Promise<Result> {
    const { error } = await supabase.from('projects').insert({
      id: project.id, title: project.title, scope: project.scope,
      start_date: project.startDate, end_date: project.endDate,
      status: project.status, color: project.color,
      roles: project.roles, created_at: project.createdAt,
      user_id: getCurrentUserId(),
    });
    return error ? fail('projects.add', error) : OK;
  },
  async update(id: string, updates: Partial<Project>): Promise<Result> {
    const row: Row = {};
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.scope !== undefined) row.scope = updates.scope;
    if (updates.startDate !== undefined) row.start_date = updates.startDate;
    if (updates.endDate !== undefined) row.end_date = updates.endDate;
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.roles !== undefined) row.roles = updates.roles;
    const { error } = await supabase.from('projects').update(row).eq('id', id);
    return error ? fail('projects.update', error) : OK;
  },
  async delete(id: string): Promise<Result> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    return error ? fail('projects.delete', error) : OK;
  },
};

// ── 사용자 정의 역할 (life_roles) ───────────────────────────
function mapLifeRole(r: Row): LifeRoleDef {
  return {
    id: r.id as string,
    label: (r.label as string) ?? '',
    emoji: (r.emoji as string) ?? '🏷️',
    color: (r.color as string) ?? '#4a7c59',
    sortOrder: (r.sort_order as number) ?? 0,
    createdAt: (r.created_at as string) ?? '',
  };
}

export const lifeRoleStore = {
  async getAll(): Promise<LifeRoleDef[]> {
    const { data, error } = await supabase.from('life_roles').select('*').order('sort_order');
    if (error) { logError('life_roles.getAll', error); return []; }
    return (data ?? []).map(mapLifeRole);
  },
  async add(role: LifeRoleDef): Promise<Result> {
    const { error } = await supabase.from('life_roles').insert({
      id: role.id, label: role.label, emoji: role.emoji, color: role.color,
      sort_order: role.sortOrder, created_at: role.createdAt, user_id: getCurrentUserId(),
    });
    return error ? fail('life_roles.add', error) : OK;
  },
  async update(id: string, updates: Partial<LifeRoleDef>): Promise<Result> {
    const row: Row = {};
    if (updates.label !== undefined) row.label = updates.label;
    if (updates.emoji !== undefined) row.emoji = updates.emoji;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.sortOrder !== undefined) row.sort_order = updates.sortOrder;
    const { error } = await supabase.from('life_roles').update(row).eq('id', id);
    return error ? fail('life_roles.update', error) : OK;
  },
  async delete(id: string): Promise<Result> {
    const { error } = await supabase.from('life_roles').delete().eq('id', id);
    return error ? fail('life_roles.delete', error) : OK;
  },
};
