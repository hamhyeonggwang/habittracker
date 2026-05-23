import {
  Habit, HabitLog, Task, MentalStateLog, ArchiveItem,
  ArchiveCategory, Priority, TimeSlot, MoodScore,
} from '@/types';

const KEYS = {
  HABITS: 'lhd_habits',
  HABIT_LOGS: 'lhd_habit_logs',
  TASKS: 'lhd_tasks',
  MENTAL_STATE: 'lhd_mental_state',
  ARCHIVE: 'lhd_archive',
  SEEDED: 'lhd_seeded',
} as const;

const ARCHIVE_CATEGORIES = new Set<ArchiveCategory>(['book', 'work', 'research', 'clinical', 'idea', 'etc']);
const PRIORITIES = new Set<Priority>(['low', 'medium', 'high']);
const TIME_SLOTS = new Set<TimeSlot>(['morning', 'afternoon', 'evening']);

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
      { id: 'h1', name: '매일 운동', icon: '🏃', color: '#22c55e', targetDaysPerWeek: 5, createdAt: daysAgo(30), isArchived: false },
      { id: 'h2', name: '독서 30분', icon: '📚', color: '#3b82f6', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false },
      { id: 'h3', name: '명상 10분', icon: '🧘', color: '#a855f7', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false },
      { id: 'h4', name: '30% 저축', icon: '💰', color: '#f59e0b', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false },
      { id: 'h5', name: '네트워킹 활동', icon: '🤝', color: '#ec4899', targetDaysPerWeek: 2, createdAt: daysAgo(30), isArchived: false },
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
