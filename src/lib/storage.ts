import {
  Habit, HabitLog, Task, MentalStateLog, ArchiveItem,
  ArchiveCategory, Priority, TimeSlot, MoodScore,
  RoleTag, RoutineSlot, PerformanceScore,
  IdentityStatement, Goal, GoalStatus, Quarter, MonthPlan,
  FinanceItem, FinanceCategory,
} from '@/types';

const KEYS = {
  HABITS: 'lhd_habits',
  HABIT_LOGS: 'lhd_habit_logs',
  TASKS: 'lhd_tasks',
  MENTAL_STATE: 'lhd_mental_state',
  ARCHIVE: 'lhd_archive',
  SEEDED: 'lhd_seeded',
  // Dashboard editable sections
  IDENTITY: 'lhd_identity',
  GOALS: 'lhd_goals',
  QUARTERS: 'lhd_quarters',
  MONTH_PLANS: 'lhd_month_plans',
  FINANCE: 'lhd_finance',
  DASH_SEEDED: 'lhd_dash_seeded',
} as const;

const ARCHIVE_CATEGORIES = new Set<ArchiveCategory>(['book', 'work', 'research', 'clinical', 'idea', 'etc']);
const PRIORITIES = new Set<Priority>(['low', 'medium', 'high']);
const TIME_SLOTS = new Set<TimeSlot>(['morning', 'afternoon', 'evening']);
const ROLE_TAGS = new Set<RoleTag>(['researcher', 'clinician', 'learner', 'health', 'social', 'creator']);
const ROUTINE_SLOTS = new Set<RoutineSlot>(['morning', 'afternoon', 'evening', 'flexible']);

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

function asMoodScore(v: unknown, fallback: MoodScore = 3): MoodScore {
  const n = typeof v === 'number' ? Math.round(v) : Number(v);
  if (n >= 1 && n <= 5) return n as MoodScore;
  return fallback;
}

function readRaw(key: string): unknown[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(key: string, data: unknown[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // private mode / quota — ignore
  }
}

function asRoleTags(v: unknown): RoleTag[] {
  if (!Array.isArray(v)) return [];
  return v.filter((r): r is RoleTag => ROLE_TAGS.has(r as RoleTag));
}

function asRoutineSlot(v: unknown): RoutineSlot {
  return ROUTINE_SLOTS.has(v as RoutineSlot) ? (v as RoutineSlot) : 'flexible';
}

function asPerformanceScore(v: unknown): PerformanceScore | undefined {
  const n = typeof v === 'number' ? Math.round(v) : Number(v);
  if (n >= 1 && n <= 5) return n as PerformanceScore;
  return undefined;
}

function normalizeHabit(raw: unknown): Habit | null {
  if (!isRecord(raw) || !raw.id || !raw.name) return null;
  return {
    id: asString(raw.id),
    name: asString(raw.name),
    icon: asString(raw.icon, '🎯'),
    color: asString(raw.color, '#4a7c59'),
    targetDaysPerWeek: Math.min(7, Math.max(1, Number(raw.targetDaysPerWeek) || 7)),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    isArchived: asBool(raw.isArchived),
    roles: asRoleTags(raw.roles),
    routineSlot: asRoutineSlot(raw.routineSlot),
  };
}

function normalizeHabitLog(raw: unknown): HabitLog | null {
  if (!isRecord(raw) || !raw.id || !raw.habitId || !raw.date) return null;
  return {
    id: asString(raw.id),
    habitId: asString(raw.habitId),
    date: asString(raw.date),
    completed: asBool(raw.completed),
    note: raw.note ? asString(raw.note) : undefined,
    energyAfter: asPerformanceScore(raw.energyAfter),
    satisfactionAfter: asPerformanceScore(raw.satisfactionAfter),
  };
}

function normalizeTask(raw: unknown): Task | null {
  if (!isRecord(raw) || !raw.id || !raw.title || !raw.date) return null;
  const priority = PRIORITIES.has(raw.priority as Priority) ? (raw.priority as Priority) : 'medium';
  const timeSlot = TIME_SLOTS.has(raw.timeSlot as TimeSlot) ? (raw.timeSlot as TimeSlot) : 'morning';
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    priority,
    timeSlot,
    date: asString(raw.date),
    completed: asBool(raw.completed),
    incompleteReason: raw.incompleteReason ? asString(raw.incompleteReason) : undefined,
    createdAt: asString(raw.createdAt, asString(raw.date)),
  };
}

function normalizeMentalLog(raw: unknown): MentalStateLog | null {
  if (!isRecord(raw) || !raw.id || !raw.date) return null;
  return {
    id: asString(raw.id),
    date: asString(raw.date),
    mood: asMoodScore(raw.mood),
    energy: asMoodScore(raw.energy),
    stress: asMoodScore(raw.stress),
    sleepQuality: asMoodScore(raw.sleepQuality),
    note: asString(raw.note),
  };
}

function normalizeArchiveItem(raw: unknown): ArchiveItem | null {
  if (!isRecord(raw) || !raw.id || !raw.title) return null;
  const category = ARCHIVE_CATEGORIES.has(raw.category as ArchiveCategory)
    ? (raw.category as ArchiveCategory)
    : 'etc';
  const createdAt = asString(raw.createdAt, new Date().toISOString());
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    content: asString(raw.content),
    category,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    createdAt,
    updatedAt: asString(raw.updatedAt, createdAt),
  };
}

const GOAL_STATUSES = new Set<GoalStatus>(['준비 중', '진행 중', '완료']);
const FINANCE_CATEGORIES = new Set<FinanceCategory>(['income', 'fixed', 'variable']);

function normalizeIdentityStatement(raw: unknown): IdentityStatement | null {
  if (!isRecord(raw) || !raw.id) return null;
  return {
    id: asString(raw.id),
    keyword: asString(raw.keyword),
    statement: asString(raw.statement),
  };
}

function normalizeGoal(raw: unknown): Goal | null {
  if (!isRecord(raw) || !raw.id) return null;
  const status = GOAL_STATUSES.has(raw.status as GoalStatus) ? (raw.status as GoalStatus) : '준비 중';
  return {
    id: asString(raw.id),
    field: asString(raw.field),
    goal: asString(raw.goal),
    metric: asString(raw.metric),
    status,
  };
}

function normalizeQuarter(raw: unknown): Quarter | null {
  if (!isRecord(raw) || !raw.id) return null;
  return {
    id: asString(raw.id),
    label: asString(raw.label),
    milestone: asString(raw.milestone),
    criteria: asString(raw.criteria),
  };
}

function normalizeMonthPlan(raw: unknown): MonthPlan | null {
  if (!isRecord(raw)) return null;
  const month = typeof raw.month === 'number' ? raw.month : Number(raw.month);
  if (month < 1 || month > 12 || !Number.isInteger(month)) return null;
  return { month, plan: asString(raw.plan) };
}

function normalizeFinanceItem(raw: unknown): FinanceItem | null {
  if (!isRecord(raw) || !raw.id) return null;
  const category = FINANCE_CATEGORIES.has(raw.category as FinanceCategory)
    ? (raw.category as FinanceCategory) : 'fixed';
  return {
    id: asString(raw.id),
    type: asString(raw.type),
    amount: typeof raw.amount === 'number' ? raw.amount : Number(raw.amount) || 0,
    category,
  };
}

function getItems<T>(key: string, normalize: (raw: unknown) => T | null): T[] {
  return readRaw(key).map(normalize).filter((item): item is T => item !== null);
}

function setItems<T>(key: string, data: T[]): void {
  writeRaw(key, data);
}

/** Fix or drop invalid cached rows so the UI never crashes on load. */
export function repairStorage(): void {
  if (typeof window === 'undefined') return;
  setItems(KEYS.HABITS, getItems(KEYS.HABITS, normalizeHabit));
  setItems(KEYS.HABIT_LOGS, getItems(KEYS.HABIT_LOGS, normalizeHabitLog));
  setItems(KEYS.TASKS, getItems(KEYS.TASKS, normalizeTask));
  setItems(KEYS.MENTAL_STATE, getItems(KEYS.MENTAL_STATE, normalizeMentalLog));
  setItems(KEYS.ARCHIVE, getItems(KEYS.ARCHIVE, normalizeArchiveItem));
}

export function clearAppStorage(): void {
  if (typeof window === 'undefined') return;
  Object.values(KEYS).forEach(k => {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  });
}

export const habitStore = {
  getAll: (): Habit[] => getItems(KEYS.HABITS, normalizeHabit),
  save: (habits: Habit[]) => setItems(KEYS.HABITS, habits),
  add: (habit: Habit) => setItems(KEYS.HABITS, [...habitStore.getAll(), habit]),
  update: (id: string, updates: Partial<Habit>) => {
    setItems(KEYS.HABITS, habitStore.getAll().map(h => h.id === id ? { ...h, ...updates } : h));
  },
  delete: (id: string) => setItems(KEYS.HABITS, habitStore.getAll().filter(h => h.id !== id)),
};

export const habitLogStore = {
  getAll: (): HabitLog[] => getItems(KEYS.HABIT_LOGS, normalizeHabitLog),
  getByDate: (date: string): HabitLog[] => habitLogStore.getAll().filter(l => l.date === date),
  getByHabitId: (habitId: string): HabitLog[] => habitLogStore.getAll().filter(l => l.habitId === habitId),
  toggle: (habitId: string, date: string) => {
    const all = habitLogStore.getAll();
    const existing = all.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      setItems(KEYS.HABIT_LOGS, all.map(l =>
        l.id === existing.id ? { ...l, completed: !l.completed } : l
      ));
    } else {
      setItems(KEYS.HABIT_LOGS, [...all, { id: newId(), habitId, date, completed: true }]);
    }
  },
  deleteByHabitId: (habitId: string) => {
    setItems(KEYS.HABIT_LOGS, habitLogStore.getAll().filter(l => l.habitId !== habitId));
  },
  updatePerformance: (habitId: string, date: string, energy: PerformanceScore, satisfaction: PerformanceScore) => {
    const all = habitLogStore.getAll();
    const existing = all.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      setItems(KEYS.HABIT_LOGS, all.map(l =>
        l.id === existing.id ? { ...l, energyAfter: energy, satisfactionAfter: satisfaction } : l
      ));
    }
  },
};

export const taskStore = {
  getAll: (): Task[] => getItems(KEYS.TASKS, normalizeTask),
  getByDate: (date: string): Task[] => taskStore.getAll().filter(t => t.date === date),
  add: (task: Task) => setItems(KEYS.TASKS, [...taskStore.getAll(), task]),
  update: (id: string, updates: Partial<Task>) => {
    setItems(KEYS.TASKS, taskStore.getAll().map(t => t.id === id ? { ...t, ...updates } : t));
  },
  delete: (id: string) => setItems(KEYS.TASKS, taskStore.getAll().filter(t => t.id !== id)),
};

export const mentalStore = {
  getAll: (): MentalStateLog[] => getItems(KEYS.MENTAL_STATE, normalizeMentalLog),
  getByDate: (date: string): MentalStateLog | null =>
    mentalStore.getAll().find(m => m.date === date) ?? null,
  save: (log: MentalStateLog) => {
    const all = mentalStore.getAll().filter(m => m.date !== log.date);
    setItems(KEYS.MENTAL_STATE, [...all, log]);
  },
};

export const archiveStore = {
  getAll: (): ArchiveItem[] => getItems(KEYS.ARCHIVE, normalizeArchiveItem),
  add: (item: ArchiveItem) => setItems(KEYS.ARCHIVE, [...archiveStore.getAll(), item]),
  update: (id: string, updates: Partial<ArchiveItem>) => {
    setItems(KEYS.ARCHIVE, archiveStore.getAll().map(a => a.id === id ? { ...a, ...updates } : a));
  },
  delete: (id: string) => setItems(KEYS.ARCHIVE, archiveStore.getAll().filter(a => a.id !== id)),
  search: (query: string): ArchiveItem[] => {
    const q = query.toLowerCase();
    return archiveStore.getAll().filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  },
};

export const identityStatementStore = {
  getAll: (): IdentityStatement[] => getItems(KEYS.IDENTITY, normalizeIdentityStatement),
  save: (items: IdentityStatement[]) => setItems(KEYS.IDENTITY, items),
};

export const goalStore = {
  getAll: (): Goal[] => getItems(KEYS.GOALS, normalizeGoal),
  save: (items: Goal[]) => setItems(KEYS.GOALS, items),
};

export const quarterStore = {
  getAll: (): Quarter[] => getItems(KEYS.QUARTERS, normalizeQuarter),
  save: (items: Quarter[]) => setItems(KEYS.QUARTERS, items),
};

export const monthPlanStore = {
  // 항상 1-12월 전체를 반환, 저장 안 된 달은 빈 plan으로 채움
  getAll: (): MonthPlan[] => {
    const stored = getItems(KEYS.MONTH_PLANS, normalizeMonthPlan);
    return Array.from({ length: 12 }, (_, i) => {
      const found = stored.find(m => m.month === i + 1);
      return found ?? { month: i + 1, plan: '' };
    });
  },
  save: (items: MonthPlan[]) => setItems(KEYS.MONTH_PLANS, items),
};

export const financeStore = {
  getAll: (): FinanceItem[] => getItems(KEYS.FINANCE, normalizeFinanceItem),
  save: (items: FinanceItem[]) => setItems(KEYS.FINANCE, items),
};

export function seedDashboardData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(KEYS.DASH_SEEDED)) return;

  identityStatementStore.save([
    { id: newId(), keyword: '성장', statement: '나는 매일 1%씩 성장할 것이다' },
    { id: newId(), keyword: '건강', statement: '나는 규칙적인 운동으로 건강을 유지할 것이다' },
    { id: newId(), keyword: '재정', statement: '나는 수입의 30%를 저축할 것이다' },
    { id: newId(), keyword: '관계', statement: '나는 소중한 사람들과 시간을 보낼 것이다' },
    { id: newId(), keyword: '학습', statement: '나는 매월 2권의 책을 읽을 것이다' },
  ]);

  goalStore.save([
    { id: newId(), field: '커리어', goal: '승진 달성', metric: '연봉 15% 인상', status: '진행 중' },
    { id: newId(), field: '건강', goal: '체중 관리', metric: '목표 체중 도달', status: '진행 중' },
    { id: newId(), field: '재정', goal: '비상금 확보', metric: '6개월치 생활비', status: '준비 중' },
    { id: newId(), field: '자기개발', goal: '자격증 취득', metric: '관련 자격증 2개', status: '진행 중' },
  ]);

  quarterStore.save([
    { id: newId(), label: '1분기 (1~3월)', milestone: '새 프로젝트 리드 시작', criteria: '-' },
    { id: newId(), label: '2분기 (4~6월)', milestone: '투자 포트폴리오 구성', criteria: '-' },
    { id: newId(), label: '3분기 (7~9월)', milestone: '자격증 취득 완료', criteria: '-' },
    { id: newId(), label: '4분기 (10~12월)', milestone: '부업 파이프라인 기획', criteria: '-' },
  ]);

  monthPlanStore.save([]);

  financeStore.save([
    { id: newId(), type: '급여', amount: 3000000, category: 'income' },
    { id: newId(), type: '부수입 1', amount: 300000, category: 'income' },
    { id: newId(), type: '부수입 2', amount: 300000, category: 'income' },
    { id: newId(), type: '주거비', amount: 350000, category: 'fixed' },
    { id: newId(), type: '보험료', amount: 120000, category: 'fixed' },
    { id: newId(), type: '통신비', amount: 80000, category: 'fixed' },
    { id: newId(), type: '구독서비스', amount: 140000, category: 'fixed' },
    { id: newId(), type: '교통비', amount: 45000, category: 'variable' },
    { id: newId(), type: '식비', amount: 450000, category: 'variable' },
    { id: newId(), type: '여가/문화', amount: 250000, category: 'variable' },
  ]);

  localStorage.setItem(KEYS.DASH_SEEDED, 'true');
}

export function seedDummyData() {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(KEYS.SEEDED)) return;

    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const daysAgo = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - n);
      return fmt(d);
    };

    const habits: Habit[] = [
      { id: 'h1', name: '매일 운동', icon: '🏃', color: '#22c55e', targetDaysPerWeek: 5, createdAt: daysAgo(30), isArchived: false, roles: ['health'], routineSlot: 'morning' },
      { id: 'h2', name: '독서 30분', icon: '📚', color: '#3b82f6', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false, roles: ['learner', 'researcher'], routineSlot: 'evening' },
      { id: 'h3', name: '명상 10분', icon: '🧘', color: '#a855f7', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false, roles: ['health'], routineSlot: 'morning' },
      { id: 'h4', name: '30% 저축', icon: '💰', color: '#f59e0b', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false, roles: ['social'], routineSlot: 'flexible' },
      { id: 'h5', name: '네트워킹 활동', icon: '🤝', color: '#ec4899', targetDaysPerWeek: 2, createdAt: daysAgo(30), isArchived: false, roles: ['social', 'clinician'], routineSlot: 'afternoon' },
    ];
    habitStore.save(habits);

    const logs: HabitLog[] = [];
    for (let i = 0; i < 14; i++) {
      const date = daysAgo(i);
      habits.forEach(h => {
        if (Math.random() > 0.3) {
          logs.push({ id: newId(), habitId: h.id, date, completed: true });
        }
      });
    }
    setItems(KEYS.HABIT_LOGS, logs);

    const tasks: Task[] = [
      { id: 't1', title: 'ICF 코드 분류 논문 리뷰', priority: 'high', timeSlot: 'morning', date: fmt(today), completed: true, createdAt: fmt(today) },
      { id: 't2', title: 'Delphi 설문 전문가 패널 연락', priority: 'high', timeSlot: 'morning', date: fmt(today), completed: false, createdAt: fmt(today) },
      { id: 't3', title: 'KAOT 서울지부 회의 준비', priority: 'medium', timeSlot: 'afternoon', date: fmt(today), completed: true, createdAt: fmt(today) },
      { id: 't4', title: '아동 상지재활 케이스 기록', priority: 'medium', timeSlot: 'afternoon', date: fmt(today), completed: false, createdAt: fmt(today) },
      { id: 't5', title: '인스타그램 콘텐츠 업로드', priority: 'low', timeSlot: 'evening', date: fmt(today), completed: false, createdAt: fmt(today) },
    ];
    setItems(KEYS.TASKS, tasks);

    const mentalLogs: MentalStateLog[] = [];
    for (let i = 0; i < 7; i++) {
      mentalLogs.push({
        id: newId(),
        date: daysAgo(i),
        mood: (Math.floor(Math.random() * 3) + 3) as MoodScore,
        energy: (Math.floor(Math.random() * 3) + 2) as MoodScore,
        stress: (Math.floor(Math.random() * 3) + 2) as MoodScore,
        sleepQuality: (Math.floor(Math.random() * 3) + 2) as MoodScore,
        note: i === 0 ? '논문 진행이 잘 되는 날. 집중력이 좋았다.' : '',
      });
    }
    setItems(KEYS.MENTAL_STATE, mentalLogs);

    const archive: ArchiveItem[] = [
      { id: 'a1', title: 'ICF 자동 분류의 핵심은 컨텍스트 이해', content: 'sLLM 모델이 임상 텍스트에서 body function vs activity를 구분하려면 문장 앞뒤 맥락이 필수적이다.', category: 'research', tags: ['ICF', 'NLP', '논문'], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
      { id: 'a2', title: '제로 투 원 - 독점의 역설', content: '경쟁이 없는 시장을 만드는 것이 진정한 혁신.', category: 'book', tags: ['독서', '비즈니스'], createdAt: daysAgo(7), updatedAt: daysAgo(7) },
      { id: 'a3', title: '바이브코딩 콘텐츠 방향성', content: 'AI와 함께 만드는 임상 도구 시리즈.', category: 'idea', tags: ['콘텐츠', '인스타그램'], createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    ];
    setItems(KEYS.ARCHIVE, archive);

    localStorage.setItem(KEYS.SEEDED, 'true');
  } catch {
    clearAppStorage();
  }
}
