'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  habitStore, habitLogStore, taskStore, mentalStore, archiveStore,
  identityStatementStore, goalStore, quarterStore, monthPlanStore,
  meaningfulStore, newId,
} from '@/lib/storage';
import { Button } from '@/components/ui';
import { formatDate, getToday, cn } from '@/lib/utils';
import { useToday } from '@/lib/useToday';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Activity, Archive, ArrowRight, BarChart3, Check, CheckCircle2, ChevronDown, ChevronUp,
  ListTodo, Pencil, Plus, Repeat, Settings, Trash2, X,
} from 'lucide-react';
import SettingsSheet from '@/components/settings/SettingsSheet';
import { getRateMessage } from '@/lib/strengthLanguage';
import type {
  IdentityStatement, Goal, GoalStatus, Quarter, MonthPlan,
  MeaningfulMoment,
} from '@/types';

// ── 상수 ─────────────────────────────────────────────────────
const GOAL_STATUSES: GoalStatus[] = ['준비 중', '진행 중', '완료'];
const nextStatus = (s: GoalStatus): GoalStatus =>
  GOAL_STATUSES[(GOAL_STATUSES.indexOf(s) + 1) % GOAL_STATUSES.length];
const statusCls = (s: GoalStatus) =>
  s === '완료'   ? 'tag-navy' :
  s === '진행 중' ? 'tag-sage' :
  'text-xs px-2 py-1 rounded-full font-semibold bg-gray-100 text-gray-500 border border-gray-200';
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

// ── 공용 편집 컴포넌트 ────────────────────────────────────────
function EditInput({ value, onChange, placeholder, className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={cn('min-h-[44px] px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-full', className)}
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
          className="min-h-[36px] flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          style={{ background: 'var(--sage-pale)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
          <Pencil size={14} /> 편집
        </button>
      ) : (
        <>
          <button onClick={onCancel}
            className="min-h-[36px] flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            style={{ background: 'var(--sage-pale)', color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
            <X size={14} /> 취소
          </button>
          <button onClick={onSave}
            className="min-h-[36px] flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            style={{ background: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            <Check size={14} /> 저장
          </button>
        </>
      )}
    </div>
  );
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
      style={{ color: 'var(--text-muted)' }}>
      <Trash2 size={15} />
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
    const results = await Promise.all([identityStatementStore.save(s), goalStore.save(g)]);
    if (results.some(r => !r.ok)) return; // 실패 시 편집 유지(토스트는 storage가 띄움)
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
        <p className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>I WILL · 되고 싶은 나</p>
        <p className="text-sm mb-3 leading-relaxed"
          style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
          내가 되고 싶은 사람의 모습을, 매일의 실천 한 문장으로 연결해보세요.
        </p>
        {editing ? (
          <div className="space-y-2">
            {dispS.map((d, i) => (
              <div key={d.id} className="rounded-lg p-2.5 space-y-2"
                style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>되고 싶은 모습</span>
                  <DeleteBtn onClick={() => removeS(i)} />
                </div>
                <EditInput value={d.keyword} onChange={v => updateS(i, 'keyword', v)}
                  placeholder="예: 좋은 아빠, 성장하는 치료사, 건강한 나" />
                <span className="text-xs font-bold uppercase tracking-wider block"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>실천 문장</span>
                <EditInput value={d.statement} onChange={v => updateS(i, 'statement', v)}
                  placeholder="예: 나는 매일 아이와 30분 함께한다" />
              </div>
            ))}
            <button onClick={addS}
              className="min-h-[36px] mt-1 flex items-center gap-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded-lg"
              style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
              <Plus size={14} /> 선언문 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dispS.map((d, i) => (
              <div key={d.id} className="rounded-xl p-3"
                style={{ background: 'var(--sage-pale)', border: '1px solid var(--border-light)' }}>
                <span className="text-xs font-bold block mb-1"
                  style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{d.keyword}</span>
                <span className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>{d.statement}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2"
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
                    <span className="text-xs font-bold w-9 flex-shrink-0"
                      style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{label}</span>
                    <EditInput value={val} onChange={v => updateG(i, key, v)} placeholder={ph} />
                  </div>
                ))}
              </div>
            ))}
            <button onClick={addG}
              className="min-h-[36px] flex items-center gap-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 rounded-lg"
              style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>
              <Plus size={14} /> 목표 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {dispG.map(g => (
              <div key={g.id} className="rounded-xl p-3"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{g.field}</span>
                  <span className={statusCls(g.status)}>{g.status}</span>
                </div>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{g.goal}</p>
                {g.metric && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{g.metric}</p>
                )}
              </div>
            ))}
          </div>
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
    const results = await Promise.all([quarterStore.save(draftQ), monthPlanStore.save(draftM)]);
    if (results.some(r => !r.ok)) return; // 실패 시 편집 유지
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
        <p className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>분기별 도전 과제</p>
        {editing ? (
          <div className="space-y-3">
            {dispQ.map((q, i) => (
              <div key={q.id}>
                <p className="text-xs font-bold mb-1"
                  style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>{q.label}</p>
                <div className="flex gap-1.5">
                  <EditInput value={q.milestone} onChange={v => updateQ(i, 'milestone', v)} placeholder="핵심 도전" className="flex-1" />
                  <EditInput value={q.criteria} onChange={v => updateQ(i, 'criteria', v)} placeholder="성공 기준" className="flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {dispQ.map(q => (
              <div key={q.id} className="rounded-xl p-3"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>{q.label}</p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{q.milestone}</p>
                {q.criteria && (
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{q.criteria}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly plans */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>월별 성장 계획</p>
        <div className="grid grid-cols-2 gap-2">
          {dispM.map(m => (
            <div key={m.month} className="rounded-xl p-3"
              style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold mb-1"
                style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                {MONTH_NAMES[m.month - 1]}
              </p>
              {editing ? (
                <input value={m.plan} onChange={e => updateM(m.month, e.target.value)}
                  placeholder="계획"
                  className="w-full min-h-[40px] text-sm px-2.5 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', background: 'white' }} />
              ) : (
                <p className="text-sm leading-relaxed"
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

// ── 오늘 가장 의미 있었던 순간 ──────────────────────────────
function MeaningfulMomentCard() {
  const [existing, setExisting] = useState<MeaningfulMoment | null>(null);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [monthList, setMonthList] = useState<MeaningfulMoment[]>([]);
  const [showList, setShowList] = useState(false);
  const [saved, setSaved] = useState(false);
  const todayDate = useToday();

  const load = useCallback(async () => {
    const [today, all] = await Promise.all([
      meaningfulStore.getByDate(todayDate),
      meaningfulStore.getAll(),
    ]);
    setExisting(today);
    setText(today?.content ?? '');
    setEditing(!today);
    const prefix = todayDate.slice(0, 7);
    setMonthList(all.filter(m => m.date.startsWith(prefix) && m.content.trim()));
  }, [todayDate]);
  useEffect(() => { load(); }, [load]);
  const monthCount = monthList.length;

  const save = async () => {
    if (!text.trim()) return;
    const result = await meaningfulStore.save({
      id: existing?.id ?? newId(),
      date: getToday(),
      content: text.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
    });
    if (!result.ok) return; // 실패 토스트는 storage가 띄움
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    await load();
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center gap-2">
          <Archive size={18} style={{ color: 'var(--sage)' }} />
          <span className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>오늘 가장 의미 있었던 순간</span>
        </div>
        {monthCount > 0 && <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>이달 {monthCount}개</span>}
      </div>
      <div className="p-4">
        {existing && !editing ? (
          <>
            <div className="flex items-start gap-2">
              <p className="flex-1 text-sm leading-relaxed"
                style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
                {existing.content}
              </p>
              <button onClick={() => setEditing(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                aria-label="수정"
                style={{ color: 'var(--text-muted)' }}>
                <Pencil size={16} />
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
              하루를 채운 한 가지 · 월말에 모아 돌아볼 수 있어요
            </p>
          </>
        ) : (
          <div className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); }}
              placeholder="예: 아이들과 물놀이 · 논문 작성 · 기도 시간"
              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
            <Button onClick={save} size="sm" disabled={!text.trim()}>
              {saved ? <Check size={14} /> : '저장'}
            </Button>
          </div>
        )}

        {/* 이달의 의미 있었던 순간 타임라인 */}
        {monthCount > 0 && (
          <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <button onClick={() => setShowList(s => !s)}
              className="min-h-[36px] flex items-center gap-1 text-xs font-semibold rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
              {format(new Date(), 'M월', { locale: ko })} 모아보기 ({monthCount})
              {showList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showList && (
              <div className="mt-2 space-y-1.5">
                {monthList.map(m => (
                  <div key={m.id} className="flex gap-2 items-start">
                    <span className="text-xs font-bold flex-shrink-0 mt-0.5 text-right"
                      style={{ width: 30, color: m.date === todayDate ? 'var(--sage)' : 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                      {format(new Date(m.date), 'M/d')}
                    </span>
                    <p className="flex-1 text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                      {m.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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

export default function DashboardPage({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState<'identity' | 'roadmap'>('identity');
  const [data, setData] = useState(EMPTY_DATA);
  const [showSettings, setShowSettings] = useState(false);
  const today = useToday();

  const loadData = useCallback(async () => {
    const [todayTasks, habits, allLogs, todayMental, allArchive] = await Promise.all([
      taskStore.getByDate(today),
      habitStore.getAll(),
      habitLogStore.getAll(),
      mentalStore.getByDate(today),
      archiveStore.getAll(),
    ]);

    const completedTasks = todayTasks.filter(t => t.completed);
    const taskRate = todayTasks.length ? (completedTasks.length / todayTasks.length) * 100 : 0;
    const activeHabits = habits.filter(h => !h.isArchived);
    const todayLogs = allLogs.filter(l => l.date === today);
    const completedHabits = todayLogs.filter(l => l.completed).length;
    const habitRate = activeHabits.length ? (completedHabits / activeHabits.length) * 100 : 0;
    const mentalScore = todayMental
      ? Math.round((todayMental.body + todayMental.emotion + todayMental.focus + todayMental.environment) / 4 * 10) / 10
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
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const TABS = [
    { id: 'identity', label: 'IDENTITY' },
    { id: 'roadmap', label: 'ROADMAP' },
  ] as const;

  const incompleteHabits = Math.max(data.habits.length - data.completedHabits, 0);
  const incompleteTasks = Math.max(data.todayTasks.length - data.completedTasks.length, 0);
  const hasAnyDailyData = data.habits.length > 0 || data.todayTasks.length > 0 || data.mentalScore !== null;

  const nextAction = (() => {
    if (!hasAnyDailyData) {
      return {
        title: '첫 루틴부터 시작해볼까요?',
        description: '작은 반복 하나가 오늘의 기준이 됩니다.',
        cta: '루틴 만들기',
        page: 'habit',
        icon: Repeat,
      };
    }
    if (data.mentalScore === null) {
      return {
        title: '오늘 컨디션을 먼저 확인하세요',
        description: '신체, 정서, 집중, 환경 상태를 1분 안에 기록합니다.',
        cta: '컨디션 기록',
        page: 'mental',
        icon: Activity,
      };
    }
    if (incompleteHabits > 0) {
      return {
        title: `${incompleteHabits}개 루틴이 남아 있어요`,
        description: '지금 할 수 있는 루틴 하나만 체크해도 흐름이 이어집니다.',
        cta: '루틴 체크',
        page: 'habit',
        icon: CheckCircle2,
      };
    }
    if (incompleteTasks > 0) {
      return {
        title: `${incompleteTasks}개 업무가 남아 있어요`,
        description: '오늘 안에 끝낼 수 있는 한 가지를 먼저 정리하세요.',
        cta: '업무 확인',
        page: 'task',
        icon: ListTodo,
      };
    }
    return {
      title: '오늘의 인사이트를 남겨보세요',
      description: '완료한 하루에서 기억할 만한 한 줄을 저장합니다.',
      cta: '기록 남기기',
      page: 'archive',
      icon: Archive,
    };
  })();

  const NextIcon = nextAction.icon;

  const summaryCards = [
    {
      label: '루틴',
      value: `${data.completedHabits}/${data.habits.length}`,
      sub: `${Math.round(data.habitRate)}% 참여`,
      icon: Repeat,
      color: 'var(--sage)',
    },
    {
      label: '업무',
      value: `${data.completedTasks.length}/${data.todayTasks.length}`,
      sub: incompleteTasks > 0 ? `${incompleteTasks}개 남음` : '정리 완료',
      icon: ListTodo,
      color: 'var(--navy)',
    },
    {
      label: '컨디션',
      value: data.mentalScore === null ? '미기록' : `${data.mentalScore}/5`,
      sub: data.mentalScore === null ? '오늘 상태 확인 필요' : '오늘 기록 완료',
      icon: Activity,
      color: data.mentalScore === null ? 'var(--text-muted)' : 'var(--sage)',
    },
  ];

  const quickActions = [
    { label: '루틴 체크', page: 'habit', icon: CheckCircle2 },
    { label: '업무 추가', page: 'task', icon: ListTodo },
    { label: '컨디션 기록', page: 'mental', icon: Activity },
    { label: '인사이트 작성', page: 'archive', icon: Archive },
  ];

  return (
    <div className="page-enter space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      {/* ── Header ── */}
      <div className="pt-4 pb-1 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide mb-1"
            style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
            {formatDate(today, 'yyyy.MM.dd EEEE')}
          </p>
          <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
            Own The Day
          </h1>
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            오늘 필요한 한 가지를 먼저 정리하세요.
          </p>
        </div>
        <button type="button" onClick={() => setShowSettings(true)} aria-label="설정"
          className="w-11 h-11 -mr-1.5 flex items-center justify-center flex-shrink-0 rounded-xl transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          style={{ color: 'var(--text-muted)' }}>
          <Settings size={20} />
        </button>
      </div>

      {/* ── Today Hero ── */}
      <section className="card p-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #ffffff 0%, var(--sage-pale) 100%)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: 'var(--sage)' }}>
              Today Score
            </p>
            <div className="flex items-end gap-2">
              <span className="text-[34px] leading-none font-bold" style={{ color: 'var(--text-primary)' }}>
                {data.momentum}
              </span>
              <span className="text-sm font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
                /100
              </span>
            </div>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {getRateMessage(data.momentum)}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--sage-light)', color: 'var(--sage)' }}>
            <BarChart3 size={26} />
          </div>
        </div>
        <div className="mt-4">
          <div className="integrity-bar" style={{ height: 10 }}>
            <div className="integrity-bar-fill" style={{ width: `${data.momentum}%` }} />
          </div>
        </div>
        <button type="button" onClick={() => onNavigate?.(nextAction.page)}
          className="mt-4 w-full min-h-[52px] rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          style={{ background: 'var(--sage)', color: 'white' }}>
          {nextAction.cta}
          <ArrowRight size={17} />
        </button>
      </section>

      {/* ── Next Action ── */}
      <section className="card p-4">
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--sage-light)', color: 'var(--sage)' }}>
            <NextIcon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              Next Action
            </p>
            <h2 className="text-lg font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
              {nextAction.title}
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {nextAction.description}
            </p>
          </div>
        </div>
      </section>

      {/* ── Today Summary ── */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
            오늘 요약
          </h2>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {data.streak > 0 ? `${data.streak}일 연속 기록` : '오늘부터 시작'}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {summaryCards.map(card => {
            const Icon = card.icon;
            return (
              <button key={card.label} type="button"
                onClick={() => onNavigate?.(card.label === '루틴' ? 'habit' : card.label === '업무' ? 'task' : 'mental')}
                className="card p-3.5 min-h-[72px] flex items-center gap-3 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--sage-pale)', color: card.color }}>
                  <Icon size={21} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{card.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{card.sub}</p>
                </div>
                <span className="text-lg font-bold" style={{ color: card.color }}>{card.value}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
          바로가기
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button key={action.label} type="button" onClick={() => onNavigate?.(action.page)}
                className="card min-h-[56px] px-3 flex items-center gap-2.5 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
                <Icon size={18} style={{ color: 'var(--sage)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 오늘 가장 의미 있었던 순간 ── */}
      <MeaningfulMomentCard />

      {/* ── Recent Archive ── */}
      {data.recentArchive.length > 0 && (
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center gap-2">
              <Archive size={18} style={{ color: 'var(--sage)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
                최근 인사이트
              </h2>
            </div>
            <button type="button" onClick={() => onNavigate?.('archive')}
              className="min-h-[36px] px-2 rounded-lg text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              style={{ color: 'var(--sage)' }}>
              전체 보기
            </button>
          </div>
          <div className="p-4 space-y-3">
            {data.recentArchive.map(item => (
              <button key={item.id} type="button" onClick={() => onNavigate?.('archive')}
                className="w-full text-left rounded-xl p-3 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                style={{ background: 'var(--sage-pale)' }}>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                  {item.content}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Optional Analytics ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: 'var(--navy)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
              최근 흐름
            </h2>
          </div>
          {data.growthHabit && (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              보완: {data.growthHabit}
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthlyData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
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
                <p className="text-xs font-bold" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{m.label}</p>
                <p className="text-xs" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{m.rate}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── IDENTITY / ROADMAP ── */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
            생활 설계
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
            정체성과 로드맵은 하단에서 필요할 때 정리하세요.
          </p>
        </div>
        <div className="flex border-b" style={{ borderColor: 'var(--border-light)' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-h-[44px] py-2.5 text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
        </div>
      </div>

      <div className="h-4" />

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  );
}
