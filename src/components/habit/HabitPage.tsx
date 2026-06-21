'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Activity, Plus, X, Check, Pencil, Trash2 } from 'lucide-react';
import { habitStore, habitLogStore, newId } from '@/lib/storage';
import { Habit, LifeRoleDef, RoutineSlot, PerformanceScore } from '@/types';
import { Button, EmptyState, ProgressBar } from '@/components/ui';
import { getToday, formatDateShort, cn } from '@/lib/utils';
import { useToday } from '@/lib/useToday';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { HABIT_LABELS, MOHO_LABELS, getRateMessage, getStreakMessage } from '@/lib/strengthLanguage';
import { useLifeRoles } from '@/lib/useLifeRoles';
import RoleManager from '@/components/roles/RoleManager';

const ICONS = ['🏃','📚','🧘','💰','🤝','✍️','💧','🥗','🎯','💪','🎸','🌅'];
const COLORS = ['#4a7c59','#2c4a7c','#7c4a2c','#4a2c7c','#7c2c4a','#2c7c4a','#5a8c42','#3a6a9c'];
const ALL_SLOTS: RoutineSlot[] = ['morning', 'afternoon', 'evening', 'flexible'];

// ── 역할 태그 칩 (업무와 공통 역할) ──────────────────────────
function RoleChip({ role, selected, onClick }: { role: LifeRoleDef; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1"
      style={{
        fontFamily: 'Pretendard, sans-serif',
        background: selected ? role.color : 'var(--sage-pale)',
        color: selected ? 'white' : 'var(--text-secondary)',
        borderColor: selected ? role.color : 'var(--border)',
      }}>
      <span>{role.emoji}</span>{role.label}
    </button>
  );
}

// ── 습관 수정/삭제 버튼 ───────────────────────────────────
function HabitActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      <button type="button" onClick={onEdit} aria-label="루틴 수정"
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        style={{ color: 'var(--text-muted)' }}>
        <Pencil size={14} />
      </button>
      <button type="button" onClick={onDelete} aria-label="루틴 삭제"
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        style={{ color: 'var(--text-muted)' }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Performance 입력 미니 UI ──────────────────────────────
function PerformanceInput({ habitId, date, logs, onSave }: {
  habitId: string; date: string; logs: import('@/types').HabitLog[]; onSave: () => Promise<void>;
}) {
  const log = logs.find(l => l.habitId === habitId && l.date === date);
  const [energy, setEnergy] = useState<PerformanceScore>(log?.energyAfter ?? 3);
  const [satisfaction, setSatisfaction] = useState<PerformanceScore>(log?.satisfactionAfter ?? 3);

  const handleSave = async () => {
    await habitLogStore.updatePerformance(habitId, date, energy, satisfaction);
    await onSave();
  };

  const ScoreRow = ({ label, value, onChange }: {
    label: string; value: number; onChange: (v: PerformanceScore) => void;
  }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>{label}</span>
      <div className="flex gap-1">
        {([1,2,3,4,5] as PerformanceScore[]).map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className="w-9 h-9 rounded-full text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            style={{
              background: value === n ? 'var(--sage)' : 'var(--sage-pale)',
              color: value === n ? 'white' : 'var(--text-muted)',
              border: value === n ? '2px solid var(--sage)' : '1px solid var(--border)',
            }}>{n}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-2.5 pt-2.5 border-t space-y-2" style={{ borderColor: 'var(--border-light)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Activity size={14} style={{ color: 'var(--sage)' }} />
        <span className="text-xs font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
          {MOHO_LABELS.performance.inputTitle}
        </span>
      </div>
      <ScoreRow label={MOHO_LABELS.performance.energy} value={energy} onChange={setEnergy} />
      <ScoreRow label={MOHO_LABELS.performance.satisfaction} value={satisfaction} onChange={setSatisfaction} />
      <button type="button" onClick={handleSave}
        className="w-full min-h-[40px] py-2 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
        style={{ background: 'var(--sage)', color: 'white', fontFamily: 'Pretendard, sans-serif' }}>
        {MOHO_LABELS.performance.savBtn}
      </button>
    </div>
  );
}

// ── 습관 추가/수정 폼 모달 ────────────────────────────────
function HabitFormModal({ habit, onClose, onSave, availableRoles, onManageRoles }: {
  habit?: Habit; onClose: () => void; onSave: () => Promise<void>;
  availableRoles: LifeRoleDef[]; onManageRoles: () => void;
}) {
  const isEdit = !!habit;
  const [name, setName] = useState(habit?.name ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? '🎯');
  const [color, setColor] = useState(habit?.color ?? '#4a7c59');
  const [targetDays, setTargetDays] = useState(habit?.targetDaysPerWeek ?? 7);
  const [roles, setRoles] = useState<string[]>(habit?.roles ?? []);
  const [routineSlot, setRoutineSlot] = useState<RoutineSlot>(habit?.routineSlot ?? 'flexible');

  const toggleRole = (id: string) => {
    setRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (isEdit && habit) {
      await habitStore.update(habit.id, { name: name.trim(), icon, color, targetDaysPerWeek: targetDays, roles, routineSlot });
    } else {
      await habitStore.add({
        id: newId(), name: name.trim(), icon, color,
        targetDaysPerWeek: targetDays, createdAt: getToday(), isArchived: false,
        roles, routineSlot,
      });
    }
    await onSave(); onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Pretendard, sans-serif', color: 'var(--text-primary)' }}>
            {isEdit ? '루틴 수정' : '새 루틴 추가'}
          </h3>
          <button type="button" onClick={onClose} aria-label="닫기"
            className="w-11 h-11 flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div className="space-y-4">
          {/* 습관명 */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>루틴 이름</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 매일 운동"
              className="w-full min-h-[44px] px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
          </div>

          {/* 아이콘 */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>아이콘</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={cn('w-11 h-11 rounded-lg text-lg flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400', icon === ic ? 'ring-2 ring-offset-1' : '')}
                  style={{ background: icon === ic ? 'var(--sage-light)' : 'var(--sage-pale)', outline: icon === ic ? `2px solid var(--sage)` : 'none' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>색상</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-10 h-10 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          {/* 주 목표 */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>주 목표: {targetDays}일</label>
            <input type="range" min={1} max={7} value={targetDays} onChange={e => setTargetDays(+e.target.value)}
              className="w-full" style={{ accentColor: 'var(--sage)' }} />
          </div>

          {/* Volition: 역할 태그 */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
              역할 태그 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {availableRoles.map(role => (
                <RoleChip key={role.id} role={role} selected={roles.includes(role.id)} onClick={() => toggleRole(role.id)} />
              ))}
              <button type="button" onClick={onManageRoles}
                className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-semibold border border-dashed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                style={{ color: 'var(--sage)', borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }}>
                + 역할 관리
              </button>
            </div>
          </div>

          {/* Habituation: 루틴 시간대 */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>루틴 시간대</label>
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_SLOTS.map(slot => (
                <button key={slot} type="button" onClick={() => setRoutineSlot(slot)}
                  className="min-h-[44px] py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    background: routineSlot === slot ? 'var(--navy)' : 'var(--sage-pale)',
                    color: routineSlot === slot ? 'white' : 'var(--text-secondary)',
                  }}>
                  {MOHO_LABELS.routineSlots[slot]}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full min-h-[52px]" size="lg">{isEdit ? '저장하기' : '추가하기'}</Button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function HabitPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<import('@/types').HabitLog[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [view, setView] = useState<'today' | 'month'>('today');
  const currentMonth = useMemo(() => new Date(), []);
  const [openPerformance, setOpenPerformance] = useState<string | null>(null);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const { roles: lifeRoles, roleMap, refresh: refreshRoles } = useLifeRoles();
  const today = useToday();

  const refresh = useCallback(async () => {
    const [allHabits, allLogs] = await Promise.all([habitStore.getAll(), habitLogStore.getAll()]);
    setHabits(allHabits.filter(h => !h.isArchived));
    setLogs(allLogs);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  // O(1) 완료 체크용 Set — logs.find() 반복 탐색 대체
  const completedSet = useMemo(() => {
    const s = new Set<string>();
    logs.forEach(l => { if (l.completed) s.add(`${l.habitId}:${l.date}`); });
    return s;
  }, [logs]);

  const isCompleted = (habitId: string, date: string) => completedSet.has(`${habitId}:${date}`);

  // 습관별 연속 참여일 사전 계산 — 렌더마다 재탐색 방지
  const streaks = useMemo(() => {
    const map: Record<string, number> = {};
    for (const habit of habits) {
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (completedSet.has(`${habit.id}:${d}`)) streak++;
        else break;
      }
      map[habit.id] = streak;
    }
    return map;
  }, [habits, completedSet]);

  const toggle = async (habitId: string, date: string) => {
    const wasComplete = completedSet.has(`${habitId}:${date}`);
    await habitLogStore.toggle(habitId, date);
    await refresh();
    if (date === getToday() && !wasComplete) {
      setOpenPerformance(habitId);
    } else {
      setOpenPerformance(null);
    }
  };

  const removeHabit = async (habit: Habit) => {
    if (!confirm(`"${habit.name}" 루틴을 삭제할까요?\n참여 기록도 함께 삭제됩니다.`)) return;
    await habitLogStore.deleteByHabitId(habit.id);
    await habitStore.delete(habit.id);
    await refresh();
  };

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [currentMonth]);

  const daysInMonth = getDaysInMonth(currentMonth);

  const weeks = useMemo(() => {
    const w: (string | null)[][] = [];
    let currentWeek: (string | null)[] = [];
    const firstDayOfWeek = new Date(monthDays[0]).getDay(); // 0=일, 6=토
    for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null);
    for (const d of monthDays) {
      currentWeek.push(d);
      if (currentWeek.length === 7) { w.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      w.push(currentWeek);
    }
    return w;
  }, [monthDays]);

  const getMonthlyRate = (habitId: string) => {
    const done = monthDays.filter(d => isCompleted(habitId, d)).length;
    return Math.round((done / daysInMonth) * 100);
  };

  const todayDone = habits.filter(h => isCompleted(h.id, today)).length;
  const todayRate = habits.length ? Math.round((todayDone / habits.length) * 100) : 0;

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const done = habits.filter(h => isCompleted(h.id, date)).length;
    return { label: format(new Date(date), 'EEE', { locale: ko }), 참여: done };
  }), [habits, logs]);

  // Habituation: 루틴 시간대별 그룹핑
  const habitsBySlot = useMemo(() => {
    const groups: Record<RoutineSlot, Habit[]> = { morning: [], afternoon: [], evening: [], flexible: [] };
    habits.forEach(h => groups[h.routineSlot].push(h));
    return groups;
  }, [habits]);

  // Performance: 최근 7일 에너지/만족도 평균 트렌드
  const performanceTrend = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.date === date && l.completed && l.energyAfter !== undefined);
    const avgEnergy = dayLogs.length
      ? +(dayLogs.reduce((s, l) => s + (l.energyAfter ?? 0), 0) / dayLogs.length).toFixed(1)
      : null;
    const satLogs = logs.filter(l => l.date === date && l.completed && l.satisfactionAfter !== undefined);
    const avgSat = satLogs.length
      ? +(satLogs.reduce((s, l) => s + (l.satisfactionAfter ?? 0), 0) / satLogs.length).toFixed(1)
      : null;
    return { label: format(new Date(date), 'EEE', { locale: ko }), 에너지: avgEnergy, 만족도: avgSat };
  }), [logs]);

  const hasPerformanceData = performanceTrend.some(d => d.에너지 !== null);

  // Volition: 역할별 이달 참여율
  const roleStats = useMemo(() => {
    return lifeRoles.map(role => {
      const roleHabits = habits.filter(h => h.roles.includes(role.id));
      if (!roleHabits.length) return null;
      const total = roleHabits.length * daysInMonth;
      const done = roleHabits.reduce((s, h) => s + monthDays.filter(d => isCompleted(h.id, d)).length, 0);
      return { role, rate: Math.round((done / total) * 100), count: roleHabits.length };
    }).filter(Boolean) as { role: LifeRoleDef; rate: number; count: number }[];
  }, [habits, logs, monthDays, daysInMonth, lifeRoles]);

  // ── Today 뷰: 슬롯별 습관 카드 렌더러 ──────────────────
  const renderTodaySlot = (slot: RoutineSlot) => {
    const slotHabits = habitsBySlot[slot];
    if (!slotHabits.length) return null;
    return (
      <div key={slot}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--navy)', color: 'white', fontFamily: 'Pretendard, sans-serif' }}>
            {MOHO_LABELS.routineSlots[slot]}
          </span>
        </div>
        <div className="space-y-2.5">
          {slotHabits.map(habit => {
            const done = isCompleted(habit.id, today);
            const streak = streaks[habit.id] ?? 0;
            const rate = getMonthlyRate(habit.id);
            const showPerf = openPerformance === habit.id && done;
            return (
              <div key={habit.id} className="card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">{habit.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{habit.name}</p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        {habit.roles.map(r => {
                          const def = roleMap[r];
                          if (!def) return null;
                          return (
                            <span key={r} className="text-xs font-semibold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                              {def.emoji} {def.label}
                            </span>
                          );
                        })}
                        {streak > 0 && (
                          <span className="text-xs font-bold" style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>
                            {getStreakMessage(streak)}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                          {HABIT_LABELS.monthlyRate} {rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <HabitActionButtons
                      onEdit={() => setEditingHabit(habit)}
                      onDelete={() => removeHabit(habit)}
                    />
                    <button type="button" onClick={() => toggle(habit.id, getToday())}
                      className="w-11 h-11 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        background: done ? habit.color : 'var(--sage-pale)',
                        border: `2px solid ${done ? habit.color : 'var(--border)'}`,
                        transform: done ? 'scale(1.05)' : 'scale(1)',
                      }}>
                      {done
                        ? <Check size={18} color="white" strokeWidth={3} />
                        : <span className="text-lg">{habit.icon}</span>}
                    </button>
                  </div>
                </div>
                {done && !showPerf && (
                  <div className="mt-2.5 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                    <ProgressBar value={rate} />
                    <button type="button"
                      onClick={() => setOpenPerformance(habit.id)}
                      className="mt-1.5 min-h-[36px] rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                      style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                      + 수행 소감 기록하기
                    </button>
                  </div>
                )}
                {showPerf && (
                  <PerformanceInput
                    habitId={habit.id}
                    date={today}
                    logs={logs}
                    onSave={async () => { await refresh(); setOpenPerformance(null); }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>참여 트래커</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            {getRateMessage(todayRate)}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="min-h-[40px]"><Plus size={15} className="inline mr-1" />추가</Button>
      </div>

      {/* ── 오늘 참여율 요약 ── */}
      {habits.length > 0 && (
        <div className="card p-3.5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
              오늘 {HABIT_LABELS.completionRate}
            </span>
            <span className="text-[14px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
              {todayDone}/{habits.length} 참여
            </span>
          </div>
          <ProgressBar value={todayRate} />
        </div>
      )}

      {/* ── View Toggle ── */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        {[['today', HABIT_LABELS.checkIn], ['month', HABIT_LABELS.calendar]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v as 'today' | 'month')}
            className="flex-1 min-h-[44px] py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            style={{
              fontFamily: 'Pretendard, sans-serif',
              background: view === v ? 'var(--sage)' : 'white',
              color: view === v ? 'white' : 'var(--text-muted)',
            }}>{label}</button>
        ))}
      </div>

      {habits.length === 0 ? (
        <EmptyState icon="" title="아직 등록된 루틴이 없어요"
          description="작은 루틴 하나부터 시작해볼까요?"
          action={<Button onClick={() => setShowAdd(true)} size="sm">첫 루틴 시작하기</Button>} />
      ) : view === 'today' ? (
        /* ── TODAY CHECK-IN VIEW (루틴 시간대 그룹핑) ── */
        <div className="space-y-4">
          {ALL_SLOTS.map(slot => renderTodaySlot(slot))}
        </div>
      ) : (
        /* ── MONTHLY CALENDAR VIEW ── */
        <div className="space-y-3">
          {habits.map(habit => {
            const rate = getMonthlyRate(habit.id);
            const monthLabel = format(currentMonth, 'M월', { locale: ko });
            return (
              <div key={habit.id} className="card overflow-hidden">
                <div className="sheet-header-navy flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-base flex-shrink-0">{habit.icon}</span>
                    <span className="truncate">{habit.name}</span>
                    <span className="flex-shrink-0" style={{ opacity: 0.7 }}>— {monthLabel}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => setEditingHabit(habit)} aria-label="루틴 수정"
                      className="w-10 h-10 rounded-md flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => removeHabit(habit)} aria-label="루틴 삭제"
                      className="w-10 h-10 rounded-md flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                      <Trash2 size={13} />
                    </button>
                    <span className="text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: 12 }}>
                      {HABIT_LABELS.monthlyRate}
                    </span>
                  </div>
                </div>
                {/* 역할 태그 */}
                {habit.roles.length > 0 && (
                  <div className="px-3 pt-2 flex flex-wrap gap-1">
                    {habit.roles.map(r => {
                      const def = roleMap[r];
                      if (!def) return null;
                      return (
                        <span key={r} className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--sage-pale)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                          {def.emoji} {def.label}
                        </span>
                      );
                    })}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(30,58,138,0.08)', color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>
                      {MOHO_LABELS.routineSlots[habit.routineSlot]}
                    </span>
                  </div>
                )}
                <div className="px-3 pt-2 pb-3">
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-1 mb-1.5">
                    {['일','월','화','수','목','금','토'].map(d => (
                      <div key={d} className="text-center text-xs font-bold" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{d}</div>
                    ))}
                  </div>
                  {/* 주차별 그리드 */}
                  {weeks.map((week, wi) => (
                    <div key={wi} className="mb-1">
                      <div className="grid grid-cols-7 gap-1 mb-0.5">
                        {Array.from({ length: 7 }, (_, di) => {
                          const date = week[di];
                          if (!date) return <div key={di} style={{ height: 40 }} />;
                          const done = isCompleted(habit.id, date);
                          const isToday = date === today;
                          return (
                            <button key={date} onClick={() => toggle(habit.id, date)}
                              className="habit-cell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                              style={{
                                width: '100%',
                                height: 40,
                                background: done ? habit.color : 'var(--sage-pale)',
                                color: done ? 'white' : 'var(--text-muted)',
                                border: isToday ? `2px solid var(--navy)` : done ? `1px solid ${habit.color}` : '1px solid var(--border)',
                              }}>
                              {formatDateShort(date)}
                            </button>
                          );
                        })}
                      </div>
                      {wi < weeks.length - 1 && <div className="h-px my-0.5" style={{ background: 'var(--border-light)' }} />}
                    </div>
                  ))}
                  {/* 참여율 */}
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                    <ProgressBar value={rate} label={`이달 ${HABIT_LABELS.completionRate}`} />
                    <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                      {getRateMessage(rate)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 주간 참여 차트 ── */}
      {habits.length > 0 && (
        <div className="card overflow-hidden">
          <div className="sheet-header">이번 주 {HABIT_LABELS.weeklyRate}</div>
          <div className="p-3 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                  formatter={(v: number) => [`${v}개 참여`, '오늘 루틴']}
                />
                <Bar dataKey="참여" fill="var(--sage)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── PERFORMANCE: 7일 에너지/만족도 트렌드 ── */}
      {hasPerformanceData && (
        <div className="card overflow-hidden">
          <div className="sheet-header">{MOHO_LABELS.performanceTitle}</div>
          <div className="p-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
                <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Pretendard' }} />
                <Line type="monotone" dataKey="에너지" stroke="var(--sage)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="만족도" stroke="var(--navy)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── VOLITION: 역할별 이달 참여율 ── */}
      {roleStats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="sheet-header-navy">{MOHO_LABELS.volitionTitle}</div>
          <div className="p-3 space-y-2.5">
            {roleStats.map(({ role, rate, count }) => (
              <div key={role.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                    {role.emoji} {role.label}
                    <span className="ml-1 font-normal text-xs" style={{ color: 'var(--text-muted)' }}>({count}개 루틴)</span>
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>{rate}%</span>
                </div>
                <ProgressBar value={rate} sage={false} height={5} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
      {showAdd && (
        <HabitFormModal
          onClose={() => setShowAdd(false)} onSave={refresh}
          availableRoles={lifeRoles} onManageRoles={() => setShowRoleManager(true)}
        />
      )}
      {editingHabit && (
        <HabitFormModal
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSave={refresh}
          availableRoles={lifeRoles} onManageRoles={() => setShowRoleManager(true)}
        />
      )}
      {showRoleManager && (
        <RoleManager onClose={() => setShowRoleManager(false)} onChange={refreshRoles} />
      )}
    </div>
  );
}
