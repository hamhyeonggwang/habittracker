'use client';
import { useState, useMemo, useCallback } from 'react';
import { Plus, X, Check, Sparkles } from 'lucide-react';
import { habitStore, habitLogStore, newId } from '@/lib/storage';
import { Habit } from '@/types';
import { Button, EmptyState, ProgressBar } from '@/components/ui';
import { TODAY, formatDateShort, cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { HABIT_LABELS, getRateMessage, getStreakMessage } from '@/lib/strengthLanguage';

const ICONS = ['🏃','📚','🧘','💰','🤝','✍️','💧','🥗','🎯','💪','🎸','🌅'];
const COLORS = ['#4a7c59','#2c4a7c','#7c4a2c','#4a2c7c','#7c2c4a','#2c7c4a','#5a8c42','#3a6a9c'];

function AddHabitModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#4a7c59');
  const [targetDays, setTargetDays] = useState(7);

  const handleSubmit = () => {
    if (!name.trim()) return;
    habitStore.add({ id: newId(), name: name.trim(), icon, color, targetDaysPerWeek: targetDays, createdAt: TODAY, isArchived: false });
    onAdd(); onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ fontFamily: 'Noto Serif KR, serif', color: 'var(--text-primary)' }}>새 습관 추가</h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>습관명</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 매일 운동"
              className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>아이콘</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all', icon === ic ? 'ring-2 ring-offset-1' : '')}
                  style={{ background: icon === ic ? 'var(--sage-light)' : 'var(--sage-pale)', outline: icon === ic ? `2px solid var(--sage)` : 'none' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>색상</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>주 목표: {targetDays}일</label>
            <input type="range" min={1} max={7} value={targetDays} onChange={e => setTargetDays(+e.target.value)}
              className="w-full" style={{ accentColor: 'var(--sage)' }} />
          </div>
          <Button onClick={handleSubmit} className="w-full" size="lg">추가하기</Button>
        </div>
      </div>
    </div>
  );
}

export default function HabitPage() {
  const [habits, setHabits] = useState<Habit[]>(() => habitStore.getAll().filter(h => !h.isArchived));
  const [logs, setLogs] = useState(() => habitLogStore.getAll());
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<'today' | 'month'>('month');
  const [currentMonth] = useState(new Date());

  const refresh = useCallback(() => {
    setHabits(habitStore.getAll().filter(h => !h.isArchived));
    setLogs(habitLogStore.getAll());
  }, []);

  const toggle = (habitId: string, date: string) => { habitLogStore.toggle(habitId, date); refresh(); };

  const isCompleted = (habitId: string, date: string) =>
    logs.find(l => l.habitId === habitId && l.date === date)?.completed ?? false;

  const getStreak = (habitId: string) => {
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (logs.find(l => l.habitId === habitId && l.date === d && l.completed)) streak++;
      else break;
    }
    return streak;
  };

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  }, [currentMonth]);

  const daysInMonth = getDaysInMonth(currentMonth);

  const weeks = useMemo(() => {
    const w: string[][] = [[], [], [], []];
    monthDays.forEach((d, i) => { w[Math.floor(i / 7)].push(d); });
    return w.filter(wk => wk.length > 0);
  }, [monthDays]);

  const getMonthlyRate = (habitId: string) => {
    const done = monthDays.filter(d => isCompleted(habitId, d)).length;
    return Math.round((done / daysInMonth) * 100);
  };

  const todayDone = habits.filter(h => isCompleted(h.id, TODAY)).length;
  const todayRate = habits.length ? Math.round((todayDone / habits.length) * 100) : 0;

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const done = habits.filter(h => isCompleted(h.id, date)).length;
    return { label: format(new Date(date), 'EEE', { locale: ko }), 참여: done };
  }), [habits, logs]);

  return (
    <div className="page-enter space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>습관 트래커</h1>
          <p className="text-[12px] mt-0.5 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            {getRateMessage(todayRate)}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus size={13} className="inline mr-1" />추가</Button>
      </div>

      {/* ── 오늘 참여율 요약 ── */}
      {habits.length > 0 && (
        <div className="card p-3.5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
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
        {[['month', HABIT_LABELS.calendar], ['today', HABIT_LABELS.checkIn]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v as any)}
            className="flex-1 py-2 text-[12px] font-semibold transition-all"
            style={{
              fontFamily: 'Pretendard, sans-serif',
              background: view === v ? 'var(--sage)' : 'white',
              color: view === v ? 'white' : 'var(--text-muted)',
            }}>{label}</button>
        ))}
      </div>

      {habits.length === 0 ? (
        <EmptyState icon="🌱" title="아직 등록된 습관이 없어요"
          description="작은 습관 하나부터 시작해볼까요?"
          action={<Button onClick={() => setShowAdd(true)} size="sm">첫 습관 시작하기 🌱</Button>} />
      ) : view === 'today' ? (
        /* ── TODAY CHECK-IN VIEW ── */
        <div className="space-y-3">
          {habits.map(habit => {
            const done = isCompleted(habit.id, TODAY);
            const streak = getStreak(habit.id);
            const rate = getMonthlyRate(habit.id);
            return (
              <div key={habit.id} className="card p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{habit.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {streak > 0 && (
                          <span className="text-[11px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                            {getStreakMessage(streak)}
                          </span>
                        )}
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                          {HABIT_LABELS.monthlyRate} {rate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggle(habit.id, TODAY)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
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
                {done && (
                  <div className="mt-2.5 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles size={11} style={{ color: 'var(--sage)' }} />
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                        오늘도 해냈어요!
                      </span>
                    </div>
                    <ProgressBar value={rate} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── MONTHLY CALENDAR VIEW ── */
        <div className="space-y-3">
          {habits.map(habit => {
            const rate = getMonthlyRate(habit.id);
            const monthLabel = format(currentMonth, 'M월', { locale: ko });
            return (
              <div key={habit.id} className="card overflow-hidden">
                <div className="sheet-header-navy flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{habit.icon}</span>
                    <span>{habit.name}</span>
                    <span style={{ opacity: 0.7 }}>— {monthLabel}</span>
                  </div>
                  <span className="text-[11px] font-bold" style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 8px', borderRadius: 12 }}>
                    {HABIT_LABELS.monthlyRate}
                  </span>
                </div>
                <div className="px-3 pt-2 pb-3">
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-1 mb-1.5">
                    {['일','월','화','수','목','금','토'].map(d => (
                      <div key={d} className="text-center text-[9px] font-bold" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{d}</div>
                    ))}
                  </div>
                  {/* 주차별 그리드 */}
                  {weeks.map((week, wi) => (
                    <div key={wi} className="mb-1">
                      <div className="grid grid-cols-7 gap-1 mb-0.5">
                        {Array.from({ length: 7 }, (_, di) => {
                          const date = week[di];
                          if (!date) return <div key={di} style={{ height: 26 }} />;
                          const done = isCompleted(habit.id, date);
                          const isToday = date === TODAY;
                          return (
                            <button key={date} onClick={() => toggle(habit.id, date)}
                              className="habit-cell"
                              style={{
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
                  {/* 참여율 + 격려 메시지 */}
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-light)' }}>
                    <ProgressBar value={rate} label={`이달 ${HABIT_LABELS.completionRate}`} />
                    <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
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
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                  formatter={(v: number) => [`${v}개 참여`, '오늘 습관']}
                />
                <Bar dataKey="참여" fill="var(--sage)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="h-4" />
      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} onAdd={refresh} />}
    </div>
  );
}
