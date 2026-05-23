import { Habit, HabitLog, Task, MentalStateLog, ArchiveItem } from '@/types';

// ============================================================
// STORAGE KEYS
// ============================================================
const KEYS = {
  HABITS: 'lhd_habits',
  HABIT_LOGS: 'lhd_habit_logs',
  TASKS: 'lhd_tasks',
  MENTAL_STATE: 'lhd_mental_state',
  ARCHIVE: 'lhd_archive',
};

function getItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================
// HABITS
// ============================================================
export const habitStore = {
  getAll: (): Habit[] => getItem<Habit>(KEYS.HABITS),
  save: (habits: Habit[]) => setItem(KEYS.HABITS, habits),
  add: (habit: Habit) => {
    const all = habitStore.getAll();
    setItem(KEYS.HABITS, [...all, habit]);
  },
  update: (id: string, updates: Partial<Habit>) => {
    const all = habitStore.getAll().map(h => h.id === id ? { ...h, ...updates } : h);
    setItem(KEYS.HABITS, all);
  },
  delete: (id: string) => {
    setItem(KEYS.HABITS, habitStore.getAll().filter(h => h.id !== id));
  },
};

// ============================================================
// HABIT LOGS
// ============================================================
export const habitLogStore = {
  getAll: (): HabitLog[] => getItem<HabitLog>(KEYS.HABIT_LOGS),
  getByDate: (date: string): HabitLog[] =>
    habitLogStore.getAll().filter(l => l.date === date),
  getByHabitId: (habitId: string): HabitLog[] =>
    habitLogStore.getAll().filter(l => l.habitId === habitId),
  toggle: (habitId: string, date: string) => {
    const all = habitLogStore.getAll();
    const existing = all.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      setItem(KEYS.HABIT_LOGS, all.map(l =>
        l.id === existing.id ? { ...l, completed: !l.completed } : l
      ));
    } else {
      setItem(KEYS.HABIT_LOGS, [...all, {
        id: crypto.randomUUID(),
        habitId, date, completed: true,
      }]);
    }
  },
};

// ============================================================
// TASKS
// ============================================================
export const taskStore = {
  getAll: (): Task[] => getItem<Task>(KEYS.TASKS),
  getByDate: (date: string): Task[] =>
    taskStore.getAll().filter(t => t.date === date),
  add: (task: Task) => setItem(KEYS.TASKS, [...taskStore.getAll(), task]),
  update: (id: string, updates: Partial<Task>) => {
    setItem(KEYS.TASKS, taskStore.getAll().map(t => t.id === id ? { ...t, ...updates } : t));
  },
  delete: (id: string) => setItem(KEYS.TASKS, taskStore.getAll().filter(t => t.id !== id)),
};

// ============================================================
// MENTAL STATE
// ============================================================
export const mentalStore = {
  getAll: (): MentalStateLog[] => getItem<MentalStateLog>(KEYS.MENTAL_STATE),
  getByDate: (date: string): MentalStateLog | null =>
    mentalStore.getAll().find(m => m.date === date) ?? null,
  save: (log: MentalStateLog) => {
    const all = mentalStore.getAll().filter(m => m.date !== log.date);
    setItem(KEYS.MENTAL_STATE, [...all, log]);
  },
};

// ============================================================
// ARCHIVE
// ============================================================
export const archiveStore = {
  getAll: (): ArchiveItem[] => getItem<ArchiveItem>(KEYS.ARCHIVE),
  add: (item: ArchiveItem) => setItem(KEYS.ARCHIVE, [...archiveStore.getAll(), item]),
  update: (id: string, updates: Partial<ArchiveItem>) => {
    setItem(KEYS.ARCHIVE, archiveStore.getAll().map(a => a.id === id ? { ...a, ...updates } : a));
  },
  delete: (id: string) => setItem(KEYS.ARCHIVE, archiveStore.getAll().filter(a => a.id !== id)),
  search: (query: string): ArchiveItem[] => {
    const q = query.toLowerCase();
    return archiveStore.getAll().filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q))
    );
  },
};

// ============================================================
// SEED DUMMY DATA
// ============================================================
export function seedDummyData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('lhd_seeded')) return;

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return fmt(d);
  };

  // Habits
  const habits: Habit[] = [
    { id: 'h1', name: '매일 운동', icon: '🏃', color: '#22c55e', targetDaysPerWeek: 5, createdAt: daysAgo(30), isArchived: false },
    { id: 'h2', name: '독서 30분', icon: '📚', color: '#3b82f6', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false },
    { id: 'h3', name: '명상 10분', icon: '🧘', color: '#a855f7', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false },
    { id: 'h4', name: '30% 저축', icon: '💰', color: '#f59e0b', targetDaysPerWeek: 7, createdAt: daysAgo(30), isArchived: false },
    { id: 'h5', name: '네트워킹 활동', icon: '🤝', color: '#ec4899', targetDaysPerWeek: 2, createdAt: daysAgo(30), isArchived: false },
  ];
  habitStore.save(habits);

  // Habit logs (past 14 days)
  const logs: HabitLog[] = [];
  for (let i = 0; i < 14; i++) {
    const date = daysAgo(i);
    habits.forEach(h => {
      if (Math.random() > 0.3) {
        logs.push({ id: crypto.randomUUID(), habitId: h.id, date, completed: true });
      }
    });
  }
  setItem(KEYS.HABIT_LOGS, logs);

  // Tasks for today
  const tasks: Task[] = [
    { id: 't1', title: 'ICF 코드 분류 논문 리뷰', priority: 'high', timeSlot: 'morning', date: fmt(today), completed: true, createdAt: fmt(today) },
    { id: 't2', title: 'Delphi 설문 전문가 패널 연락', priority: 'high', timeSlot: 'morning', date: fmt(today), completed: false, createdAt: fmt(today) },
    { id: 't3', title: 'KAOT 서울지부 회의 준비', priority: 'medium', timeSlot: 'afternoon', date: fmt(today), completed: true, createdAt: fmt(today) },
    { id: 't4', title: '아동 상지재활 케이스 기록', priority: 'medium', timeSlot: 'afternoon', date: fmt(today), completed: false, createdAt: fmt(today) },
    { id: 't5', title: '인스타그램 콘텐츠 업로드', priority: 'low', timeSlot: 'evening', date: fmt(today), completed: false, createdAt: fmt(today) },
  ];
  setItem(KEYS.TASKS, tasks);

  // Mental state (past 7 days)
  const mentalLogs: MentalStateLog[] = [];
  for (let i = 0; i < 7; i++) {
    mentalLogs.push({
      id: crypto.randomUUID(),
      date: daysAgo(i),
      mood: (Math.floor(Math.random() * 3) + 3) as any,
      energy: (Math.floor(Math.random() * 3) + 2) as any,
      stress: (Math.floor(Math.random() * 3) + 2) as any,
      sleepQuality: (Math.floor(Math.random() * 3) + 2) as any,
      note: i === 0 ? '논문 진행이 잘 되는 날. 집중력이 좋았다.' : '',
    });
  }
  setItem(KEYS.MENTAL_STATE, mentalLogs);

  // Archive items
  const archive: ArchiveItem[] = [
    { id: 'a1', title: 'ICF 자동 분류의 핵심은 컨텍스트 이해', content: 'sLLM 모델이 임상 텍스트에서 body function vs activity를 구분하려면 문장 앞뒤 맥락이 필수적이다. 단순 키워드 매칭 접근은 한계가 있음.', category: 'research', tags: ['ICF', 'NLP', '논문'], createdAt: daysAgo(3), updatedAt: daysAgo(3) },
    { id: 'a2', title: '제로 투 원 - 독점의 역설', content: '경쟁이 없는 시장을 만드는 것이 진정한 혁신. OT 디지털 툴 시장도 아직 블루오션. othub.kr이 그 가능성을 가지고 있다.', category: 'book', tags: ['독서', '비즈니스'], createdAt: daysAgo(7), updatedAt: daysAgo(7) },
    { id: 'a3', title: '바이브코딩 콘텐츠 방향성', content: 'AI와 함께 만드는 임상 도구 시리즈. 독자는 코드를 모르는 치료사. 핵심 가치: 임상가도 디지털 도구를 만들 수 있다는 자신감.', category: 'idea', tags: ['콘텐츠', '인스타그램', '바이브코딩'], createdAt: daysAgo(1), updatedAt: daysAgo(1) },
  ];
  setItem(KEYS.ARCHIVE, archive);

  localStorage.setItem('lhd_seeded', 'true');
}
