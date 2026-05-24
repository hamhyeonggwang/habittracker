'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  habitStore, habitLogStore, taskStore, mentalStore, archiveStore,
  identityStatementStore, goalStore, quarterStore, monthPlanStore, financeStore,
  newId,
} from '@/lib/storage';
import { StatCard } from '@/components/ui';
import { formatDate, TODAY, cn } from '@/lib/utils';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Flame, TrendingUp, Zap, Sparkles, Target, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import {
  DASH_LABELS, HABIT_LABELS, TASK_LABELS, MENTAL_LABELS,
  getRateMessage, getStreakMessage,
} from '@/lib/strengthLanguage';
import type {
  IdentityStatement, Goal, GoalStatus, Quarter, MonthPlan,
  FinanceItem, FinanceCategory,
} from '@/types';

// ── 상수 ─────────────────────────────────────────────────────
const GOAL_STATUSES: GoalStatus[] = ['준비 중', '진행 중', '완료'];
const nextStatus = (s: GoalStatus): GoalStatus =>
  GOAL_STATUSES[(GOAL_STATUSES.indexOf(s) + 1) % GOAL_STATUSES.length];
const statusCls = (s: GoalStatus) =>
  s === '완료'   ? 'tag-navy' :
  s === '진행 중' ? 'tag-sage' :
  'text-[10px] px-1.5 py-0.5 rounded font-semibold bg-gray-100 text-gray-500 border border-gray-200';
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ── 공용 편집 컴포넌트 ────────────────────────────────────────
function EditInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={cn('px-1.5 py-1 rounded border text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400 w-full', className)}
      style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', background: 'white' }} />
  );
}

function EditBar({ editing, onEdit, onSave, onCancel }: {
  editing: boolean; onEdit: () => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-1.5 mb-2">
      {!editing ? (
        <button onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: 'var(--sage-pale)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
          <Pencil size={11} /> 편집
        </button>
      ) : (
        <>
          <button onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{ background: 'var(--sage-pale)', color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
            <X size={11} /> 취소
          </button>
          <button onClick={onSave}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
            style={{ background: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            <Check size={11} /> 저장
          </button>
        </>
      )}
    </div>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-6 h-6 flex items-center justify-center rounded flex-shrink-0 hover:bg-red-50 transition-colors"
      style={{ color: 'var(--text-muted)' }}>
      <Trash2 size={12} />
    </button>
  );
}

// ── IDENTITY 탭 ──────────────────────────────────────────────
function IdentityTab() {
  const [statements, setStatements] = useState<IdentityStatement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editing, setEditing] = useState(false);
  const [draftS, setDraftS] = useState<IdentityStatement[]>([]);
  const [draftG, setDraftG] = useState<Goal[]>([]);

  useEffect(() => {
    Promise.all([identityStatementStore.getAll(), goalStore.getAll()]).then(([s, g]) => {
      setStatements(s); setGoals(g);
    });
  }, []);

  const startEdit = () => { setDraftS([...statements]); setDraftG([...goals]); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = async () => {
    const s = draftS.filter(d => d.keyword.trim() || d.statement.trim());
    const g = draftG.filter(d => d.field.trim() || d.goal.trim());
    await Promise.all([identityStatementStore.save(s), goalStore.save(g)]);
    setStatements(s); setGoals(g); setEditing(false);
  };

  const updateS = (i: number, field: keyof IdentityStatement, val: string) =>
    setDraftS(prev => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));
  const addS = () => setDraftS(prev => [...prev, { id: newId(), keyword: '', statement: '' }]);
  const removeS = (i: number) => setDraftS(prev => prev.filter((_, j) => j !== i));

  const updateG = (i: number, field: keyof Goal, val: string) =>
    setDraftG(prev => prev.map((g, j) => j === i ? { ...g, [field]: val } : g));
  const cycleStatus = (i: number) =>
    setDraftG(prev => prev.map((g, j) => j === i ? { ...g, status: nextStatus(g.status) } : g));
  const addG = () => setDraftG(prev => [...prev, { id: newId(), field: '', goal: '', metric: '', status: '준비 중' }]);
  const removeG = (i: number) => setDraftG(prev => prev.filter((_, j) => j !== i));

  const dispS = editing ? draftS : statements;
  const dispG = editing ? draftG : goals;

  return (
    <div className="space-y-4 p-3">
      <EditBar editing={editing} onEdit={startEdit} onSave={save} onCancel={cancel} />

      {/* I Will Statements */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>I Will Statement</p>
        {editing ? (
          <div className="space-y-2">
            {dispS.map((d, i) => (
              <div key={d.id} className="rounded-lg p-2.5 space-y-2"
                style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>키워드</span>
                  <DeleteBtn onClick={() => removeS(i)} />
                </div>
                <EditInput value={d.keyword} onChange={v => updateS(i, 'keyword', v)}
                  placeholder="예: 성장, 건강, 재정…" />
                <span className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>선언문</span>
                <EditInput value={d.statement} onChange={v => updateS(i, 'statement', v)}
                  placeholder="나는 …" />
              </div>
            ))}
            <button onClick={addS}
              className="mt-1 flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
              <Plus size={12} /> 선언문 추가
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {dispS.map((d, i) => (
              <div key={d.id} className="flex items-start gap-2 py-1.5 border-b last:border-0"
                style={{ borderColor: 'var(--border-light)' }}>
                <span className="text-[11px] font-bold w-14 flex-shrink-0 pt-0.5"
                  style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{d.keyword}</span>
                <span className="text-[12px]"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'Noto Sans KR, sans-serif' }}>{d.statement}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>성장 목표</p>
        {editing ? (
          <div className="space-y-2">
            {dispG.map((g, i) => (
              <div key={g.id} className="rounded-lg p-2.5 space-y-2"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <button onClick={() => cycleStatus(i)}
                    className={cn('whitespace-nowrap', statusCls(g.status))}>
                    {g.status}
                  </button>
                  <DeleteBtn onClick={() => removeG(i)} />
                </div>
                {([
                  { label: '분야', key: 'field' as const, ph: '예: 커리어, 건강', val: g.field },
                  { label: '목표', key: 'goal'  as const, ph: '달성하고자 하는 목표', val: g.goal },
                  { label: '지표', key: 'metric' as const, ph: '측정 기준 (예: 연봉 15% 인상)', val: g.metric },
                ] as const).map(({ label, key, ph, val }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold w-8 flex-shrink-0"
                      style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{label}</span>
                    <EditInput value={val} onChange={v => updateG(i, key, v)} placeholder={ph} />
                  </div>
                ))}
              </div>
            ))}
            <button onClick={addG}
              className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>
              <Plus size={12} /> 목표 추가
            </button>
          </div>
        ) : (
          <table className="sheet-table">
            <thead><tr><th>분야</th><th>목표</th><th>측정지표</th><th>현재</th></tr></thead>
            <tbody>
              {dispG.map(g => (
                <tr key={g.id}>
                  <td className="font-semibold" style={{ color: 'var(--sage)' }}>{g.field}</td>
                  <td>{g.goal}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{g.metric}</td>
                  <td><span className={statusCls(g.status)}>{g.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── ROADMAP 탭 ──────────────────────────────────────────────
function RoadmapTab() {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [monthPlans, setMonthPlans] = useState<MonthPlan[]>([]);
  const [editing, setEditing] = useState(false);
  const [draftQ, setDraftQ] = useState<Quarter[]>([]);
  const [draftM, setDraftM] = useState<MonthPlan[]>([]);

  useEffect(() => {
    Promise.all([quarterStore.getAll(), monthPlanStore.getAll()]).then(([q, m]) => {
      setQuarters(q); setMonthPlans(m);
    });
  }, []);

  const startEdit = () => { setDraftQ([...quarters]); setDraftM([...monthPlans]); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = async () => {
    await Promise.all([quarterStore.save(draftQ), monthPlanStore.save(draftM)]);
    setQuarters([...draftQ]); setMonthPlans([...draftM]); setEditing(false);
  };

  const updateQ = (i: number, field: keyof Quarter, val: string) =>
    setDraftQ(prev => prev.map((q, j) => j === i ? { ...q, [field]: val } : q));
  const updateM = (month: number, val: string) =>
    setDraftM(prev => prev.map(m => m.month === month ? { ...m, plan: val } : m));

  const dispQ = editing ? draftQ : quarters;
  const dispM = editing ? draftM : monthPlans;

  return (
    <div className="space-y-4 p-3">
      <EditBar editing={editing} onEdit={startEdit} onSave={save} onCancel={cancel} />

      {/* Quarters */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>분기별 도전 과제</p>
        {editing ? (
          <div className="space-y-3">
            {dispQ.map((q, i) => (
              <div key={q.id}>
                <p className="text-[11px] font-bold mb-1"
                  style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>{q.label}</p>
                <div className="flex gap-1.5">
                  <EditInput value={q.milestone} onChange={v => updateQ(i, 'milestone', v)} placeholder="핵심 도전" className="flex-1" />
                  <EditInput value={q.criteria} onChange={v => updateQ(i, 'criteria', v)} placeholder="성공 기준" className="flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="sheet-table">
            <thead><tr><th>분기</th><th>핵심 도전</th><th>성공 기준</th></tr></thead>
            <tbody>
              {dispQ.map(q => (
                <tr key={q.id}>
                  <td className="font-semibold text-[11px]" style={{ color: 'var(--navy)' }}>{q.label}</td>
                  <td>{q.milestone}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{q.criteria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Monthly plans */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>월별 성장 계획</p>
        <div className="grid grid-cols-3 gap-1.5">
          {dispM.map(m => (
            <div key={m.month} className="rounded-lg p-2"
              style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-bold mb-1"
                style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                {MONTH_NAMES[m.month - 1]}
              </p>
              {editing ? (
                <input value={m.plan} onChange={e => updateM(m.month, e.target.value)}
                  placeholder="계획"
                  className="w-full text-[10px] px-1 py-0.5 rounded border focus:outline-none focus:ring-1 focus:ring-green-400"
                  style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', background: 'white' }} />
              ) : (
                <p className="text-[10px]"
                  style={{ color: m.plan ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                  {m.plan || '계획 중'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FINANCE 탭 ──────────────────────────────────────────────
function FinanceTab() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FinanceItem[]>([]);

  useEffect(() => { financeStore.getAll().then(setItems); }, []);

  const startEdit = () => { setDraft([...items]); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = async () => { await financeStore.save(draft); setItems([...draft]); setEditing(false); };

  const disp = editing ? draft : items;
  const income   = disp.filter(i => i.category === 'income');
  const fixed    = disp.filter(i => i.category === 'fixed');
  const variable = disp.filter(i => i.category === 'variable');

  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExp    = [...fixed, ...variable].reduce((s, i) => s + i.amount, 0);
  const savings     = totalIncome - totalExp;
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
  const fmt = (n: number) => `₩${n.toLocaleString()}`;

  const updateItem = (id: string, field: 'type' | 'amount', val: string) =>
    setDraft(prev => prev.map(item =>
      item.id === id
        ? { ...item, [field]: field === 'amount' ? (Number(val.replace(/[^0-9]/g, '')) || 0) : val }
        : item
    ));
  const removeItem = (id: string) => setDraft(prev => prev.filter(item => item.id !== id));
  const addItem = (category: FinanceCategory) =>
    setDraft(prev => [...prev, { id: newId(), type: '', amount: 0, category }]);

  const sectionColor: Record<FinanceCategory, string> = {
    income: 'var(--sage)',
    fixed: 'var(--navy)',
    variable: '#92400e',
  };
  const sectionLabel: Record<FinanceCategory, string> = {
    income: '수입',
    fixed: '고정 지출',
    variable: '변동 지출',
  };

  const renderSection = (category: FinanceCategory, sectionItems: FinanceItem[]) => {
    const color = sectionColor[category];
    return (
      <div key={category} className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold" style={{ color, fontFamily: 'Pretendard, sans-serif' }}>
            {sectionLabel[category]}
          </span>
          {editing && (
            <button onClick={() => addItem(category)}
              className="flex items-center gap-0.5 text-[10px] font-semibold"
              style={{ color, fontFamily: 'Pretendard, sans-serif' }}>
              <Plus size={10} /> 추가
            </button>
          )}
        </div>
        {sectionItems.map(item => (
          <div key={item.id}
            className={cn('flex items-center gap-2', editing ? 'mb-1.5' : 'py-1.5 border-b last:border-0')}
            style={{ borderColor: 'var(--border-light)' }}>
            {editing ? (
              <>
                <EditInput value={item.type} onChange={v => updateItem(item.id, 'type', v)}
                  placeholder="항목명" className="flex-1" />
                <div className="flex items-center gap-0.5 w-28 flex-shrink-0">
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>₩</span>
                  <EditInput
                    value={item.amount === 0 ? '' : String(item.amount)}
                    onChange={v => updateItem(item.id, 'amount', v)}
                    placeholder="0" className="flex-1" />
                </div>
                <DeleteBtn onClick={() => removeItem(item.id)} />
              </>
            ) : (
              <>
                <span className="text-[12px] flex-1"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>{item.type}</span>
                <span className="text-[12px] font-semibold"
                  style={{ color, fontFamily: 'Pretendard, sans-serif' }}>{fmt(item.amount)}</span>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-3 space-y-3">
      <EditBar editing={editing} onEdit={startEdit} onSave={save} onCancel={cancel} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {([['수입', totalIncome, 'var(--sage)'], ['지출', totalExp, 'var(--navy)'], ['저축', savings, '#d97706']] as const).map(
          ([label, val, color]) => (
            <div key={label} className="rounded-lg p-2 text-center"
              style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold mb-0.5"
                style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{label}</p>
              <p className="text-[13px] font-bold"
                style={{ color, fontFamily: 'Pretendard, sans-serif' }}>{fmt(val)}</p>
            </div>
          )
        )}
      </div>

      {/* Savings rate bar */}
      <div className="rounded-lg p-2.5" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>저축률 달성</span>
          <span className="text-[13px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{savingsRate}%</span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(savingsRate, 100)}%`, background: 'var(--sage)' }} />
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
          목표 30% 달성을 향해 나아가는 중 🌱
        </p>
      </div>

      {/* Sections */}
      {renderSection('income', income)}
      {renderSection('fixed', fixed)}
      {renderSection('variable', variable)}
    </div>
  );
}

// ── MAIN DASHBOARD ──────────────────────────────────────────
const EMPTY_DATA = {
  taskRate: 0, habitRate: 0, mentalScore: null as number | null,
  completedHabits: 0, habits: [] as import('@/types').Habit[], momentum: 0,
  growthHabit: '', growthRate: 0,
  monthlyData: [] as { label: string; rate: number }[],
  streak: 0, recentArchive: [] as import('@/types').ArchiveItem[],
  completedTasks: [] as import('@/types').Task[], todayTasks: [] as import('@/types').Task[],
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'identity' | 'roadmap' | 'finance'>('identity');
  const [data, setData] = useState(EMPTY_DATA);

  const loadData = useCallback(async () => {
    const [todayTasks, habits, allLogs, todayMental, allArchive] = await Promise.all([
      taskStore.getByDate(TODAY),
      habitStore.getAll(),
      habitLogStore.getAll(),
      mentalStore.getByDate(TODAY),
      archiveStore.getAll(),
    ]);

    const completedTasks = todayTasks.filter(t => t.completed);
    const taskRate = todayTasks.length ? (completedTasks.length / todayTasks.length) * 100 : 0;
    const activeHabits = habits.filter(h => !h.isArchived);
    const todayLogs = allLogs.filter(l => l.date === TODAY);
    const completedHabits = todayLogs.filter(l => l.completed).length;
    const habitRate = activeHabits.length ? (completedHabits / activeHabits.length) * 100 : 0;
    const mentalScore = todayMental
      ? Math.round((todayMental.mood + todayMental.energy + todayMental.stress + todayMental.sleepQuality) / 4 * 10) / 10
      : null;
    const momentum = Math.round((habitRate + taskRate + (mentalScore ? mentalScore * 20 : 0)) / 3);

    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
    let growthHabit = '';
    let growthRate = 101;
    activeHabits.forEach(h => {
      const done = last7.filter(d => allLogs.some(l => l.habitId === h.id && l.date === d && l.completed)).length;
      const rate = (done / 7) * 100;
      if (rate < growthRate) { growthRate = rate; growthHabit = h.name; }
    });

    const monthlyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (6 - i));
      const monthPrefix = format(d, 'yyyy-MM');
      const daysInMo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const monthCompleted = allLogs.filter(l => l.date.startsWith(monthPrefix) && l.completed).length;
      const totalPossible = activeHabits.length * daysInMo;
      const rate = totalPossible > 0 ? Math.round((monthCompleted / totalPossible) * 100) : 0;
      return { label: `${d.getMonth() + 1}월`, rate };
    });

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (allLogs.some(l => l.date === d && l.completed)) streak++;
      else break;
    }

    const recentArchive = allArchive.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2);

    setData({ taskRate, habitRate, mentalScore, completedHabits, habits: activeHabits, momentum, growthHabit, growthRate, monthlyData, streak, recentArchive, completedTasks, todayTasks });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS = [
    { id: 'identity', label: 'IDENTITY' },
    { id: 'roadmap', label: 'ROADMAP' },
    { id: 'finance', label: 'FINANCE' },
  ] as const;

  return (
    <div className="page-enter space-y-4">
      {/* ── Header ── */}
      <div className="pt-3 pb-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-0.5"
          style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
          {formatDate(TODAY, 'yyyy.MM.dd EEEE')}
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>
          Occupation Tracking Dashboard
        </h1>
        <p className="text-[12px] mt-1 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Noto Sans KR, sans-serif' }}>
          {getRateMessage(data.momentum)}
        </p>
      </div>

      {/* ── MOMENTUM + GROWTH OPPORTUNITY ── */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="p-3 border-r" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{DASH_LABELS.integrityTitle}</p>
            <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
              {DASH_LABELS.integritySub}
            </p>
            <div className="flex items-end gap-1.5 mb-2">
              <span className="text-2xl font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{data.momentum}</span>
              <span className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>/ 100</span>
            </div>
            <div className="integrity-bar">
              <div className="integrity-bar-fill" style={{ width: `${data.momentum}%` }} />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
              {DASH_LABELS.integrityLevels(data.momentum)}
            </p>
          </div>
          <div className="p-3" style={{ background: 'var(--sage-pale)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{HABIT_LABELS.topMissedTitle}</p>
            <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
              {HABIT_LABELS.topMissedSub}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles size={13} style={{ color: 'var(--sage)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                {data.growthHabit || '-'}
              </span>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
              {HABIT_LABELS.topMissedCta}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats 4 cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={DASH_LABELS.habitStatLabel} value={Math.round(data.habitRate)} unit="%"
          sub={`${data.completedHabits}/${data.habits.length} 참여`} icon={<Target size={12} />} />
        <StatCard label={DASH_LABELS.taskStatLabel} value={Math.round(data.taskRate)} unit="%"
          sub={TASK_LABELS.summaryDone(data.completedTasks.length, data.todayTasks.length)} icon={<Zap size={12} />} />
        <StatCard label={DASH_LABELS.mentalStatLabel} value={data.mentalScore ?? '-'}
          unit={data.mentalScore ? '/5' : ''}
          sub={data.mentalScore ? DASH_LABELS.mentalRecorded : DASH_LABELS.mentalNotYet}
          icon={<span style={{ fontSize: 12 }}>✦</span>} />
        <StatCard label={DASH_LABELS.streakStatLabel} value={data.streak} unit="일"
          sub={getStreakMessage(data.streak)} icon={<Flame size={12} />} />
      </div>

      {/* ── GROWTH JOURNEY ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header-navy flex items-center justify-between">
          <span>{DASH_LABELS.yearChartTitle}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] opacity-80">{DASH_LABELS.yearChartSub}</span>
            <TrendingUp size={13} />
          </div>
        </div>
        <div className="p-3">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthlyData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                  formatter={(v: number) => [`${v}%`, '참여율']} />
                <Bar dataKey="rate" fill="var(--sage)" radius={[3, 3, 0, 0]} opacity={0.85} />
                <Line type="monotone" dataKey="rate" stroke="var(--navy)" strokeWidth={1.5}
                  dot={{ fill: 'var(--navy)', r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-7 mt-1">
            {data.monthlyData.map(m => (
              <div key={m.label} className="text-center">
                <p className="text-[9px] font-bold" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{m.label}</p>
                <p className="text-[9px]" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{m.rate}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── IDENTITY / ROADMAP / FINANCE ── */}
      <div className="card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all"
              style={{
                fontFamily: 'Pretendard, sans-serif',
                color: activeTab === tab.id ? 'var(--sage)' : 'var(--text-muted)',
                background: activeTab === tab.id ? 'var(--sage-pale)' : 'white',
                borderBottom: activeTab === tab.id ? '2px solid var(--sage)' : '2px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="animate-fade-in">
          {activeTab === 'identity' && <IdentityTab />}
          {activeTab === 'roadmap'  && <RoadmapTab />}
          {activeTab === 'finance'  && <FinanceTab />}
        </div>
      </div>

      {/* ── Recent Archive ── */}
      {data.recentArchive.length > 0 && (
        <div className="card overflow-hidden">
          <div className="sheet-header">{DASH_LABELS.archiveTitle}</div>
          <div className="p-3 space-y-2">
            {data.recentArchive.map(item => (
              <div key={item.id} className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--sage)' }} />
                <div>
                  <p className="text-[12px] font-semibold"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>{item.title}</p>
                  <p className="text-[11px] mt-0.5 line-clamp-1"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
