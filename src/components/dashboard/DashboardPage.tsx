'use client';
import { useMemo, useState } from 'react';
import { habitStore, habitLogStore, taskStore, mentalStore, archiveStore } from '@/lib/storage';
import { StatCard, Button } from '@/components/ui';
import { formatDate, TODAY } from '@/lib/utils';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Flame, TrendingUp, Zap, Sparkles, Target } from 'lucide-react';
import {
  DASH_LABELS, HABIT_LABELS, TASK_LABELS, MENTAL_LABELS,
  getRateMessage, getStreakMessage
} from '@/lib/strengthLanguage';

// ── IDENTITY 탭 ──────────────────────────────────────────────
function IdentityTab() {
  const IDENTITY_DATA = [
    { keyword: '성장', statement: '나는 매일 1%씩 성장할 것이다' },
    { keyword: '건강', statement: '나는 규칙적인 운동으로 건강을 유지할 것이다' },
    { keyword: '재정', statement: '나는 수입의 30%를 저축할 것이다' },
    { keyword: '관계', statement: '나는 소중한 사람들과 시간을 보낼 것이다' },
    { keyword: '학습', statement: '나는 매월 2권의 책을 읽을 것이다' },
  ];
  const GOALS = [
    { field: '커리어', goal: '승진 달성', metric: '연봉 15% 인상', status: '진행 중' },
    { field: '건강', goal: '체중 관리', metric: '목표 체중 도달', status: '진행 중' },
    { field: '재정', goal: '비상금 확보', metric: '6개월치 생활비', status: '준비 중' },
    { field: '자기개발', goal: '자격증 취득', metric: '관련 자격증 2개', status: '진행 중' },
  ];
  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>I Will Statement</p>
        {IDENTITY_DATA.map(d => (
          <div key={d.keyword} className="flex items-start gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
            <span className="text-[11px] font-bold w-14 flex-shrink-0 pt-0.5" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{d.keyword}</span>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)', fontFamily: 'Noto Sans KR, sans-serif' }}>{d.statement}</span>
          </div>
        ))}
      </div>
      <div className="pt-1">
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>성장 목표</p>
        <table className="sheet-table">
          <thead><tr><th>분야</th><th>목표</th><th>측정지표</th><th>현재</th></tr></thead>
          <tbody>
            {GOALS.map(g => (
              <tr key={g.field}>
                <td className="font-semibold" style={{ color: 'var(--sage)' }}>{g.field}</td>
                <td>{g.goal}</td>
                <td style={{ color: 'var(--text-muted)' }}>{g.metric}</td>
                <td>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${g.status === '진행 중' ? 'tag-sage' : 'tag-navy'}`}>{g.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ROADMAP 탭 ──────────────────────────────────────────────
function RoadmapTab() {
  const QUARTERS = [
    { q: '1분기 (1~3월)', milestone: '새 프로젝트 리드시작' },
    { q: '2분기 (3~6월)', milestone: '투자 포트폴리오 구성' },
    { q: '3분기 (6~9월)', milestone: '자격증 취득완료' },
    { q: '4분기 (9~12월)', milestone: '부업 파이프라인 기획' },
  ];
  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>분기별 도전 과제</p>
        <table className="sheet-table">
          <thead><tr><th>분기</th><th>핵심 도전</th><th>성공 기준</th></tr></thead>
          <tbody>
            {QUARTERS.map(q => (
              <tr key={q.q}>
                <td className="font-semibold text-[11px]" style={{ color: 'var(--navy)' }}>{q.q}</td>
                <td>{q.milestone}</td>
                <td style={{ color: 'var(--text-muted)' }}>-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>월별 성장 계획</p>
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map(m => (
            <div key={m} className="rounded-lg p-2 text-center" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
              <p className="text-[11px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{m}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>계획 중</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FINANCE 탭 ──────────────────────────────────────────────
function FinanceTab() {
  const INCOME = [
    { type: '급여', amount: 3000000 },
    { type: '부수입 1', amount: 300000 },
    { type: '부수입 2', amount: 300000 },
  ];
  const FIXED = [
    { type: '주거비', amount: 350000 },
    { type: '보험료', amount: 120000 },
    { type: '통신비', amount: 80000 },
    { type: '구독서비스', amount: 140000 },
  ];
  const fmt = (n: number) => `₩${n.toLocaleString()}`;
  const totalIncome = INCOME.reduce((s, i) => s + i.amount, 0);
  const totalExp = [...FIXED, { type:'교통비',amount:45000 }, { type:'식비',amount:450000 }, { type:'여가/문화',amount:250000 }].reduce((s, i) => s + i.amount, 0);
  const savings = totalIncome - totalExp;
  const savingsRate = Math.round((savings / totalIncome) * 100);
  return (
    <div className="p-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          ['수입', totalIncome, 'var(--sage)'],
          ['지출', totalExp, 'var(--navy)'],          // ← 빨간색 제거
          ['저축', savings, '#d97706'],
        ].map(([label, val, color]) => (
          <div key={label as string} className="rounded-lg p-2 text-center" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{label as string}</p>
            <p className="text-[13px] font-bold" style={{ color: color as string, fontFamily: 'Pretendard, sans-serif' }}>{fmt(val as number)}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-2.5" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>저축률 달성</span>
          <span className="text-[13px] font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{savingsRate}%</span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border)' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(savingsRate, 100)}%`, background: 'var(--sage)' }} />
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>목표 30% 달성을 향해 나아가는 중 🌱</p>
      </div>
      <table className="sheet-table">
        <thead><tr><th>항목</th><th>유형</th><th>금액</th></tr></thead>
        <tbody>
          <tr><td className="font-bold text-[11px]" style={{ color: 'var(--sage)' }} rowSpan={3}>수입</td><td>{INCOME[0].type}</td><td style={{ color: 'var(--sage)' }}>{fmt(INCOME[0].amount)}</td></tr>
          <tr><td>{INCOME[1].type}</td><td style={{ color: 'var(--sage)' }}>{fmt(INCOME[1].amount)}</td></tr>
          <tr><td>{INCOME[2].type}</td><td style={{ color: 'var(--sage)' }}>{fmt(INCOME[2].amount)}</td></tr>
          <tr><td className="font-bold text-[11px]" style={{ color: 'var(--navy)' }} rowSpan={4}>고정 지출</td><td>{FIXED[0].type}</td><td style={{ color: 'var(--text-secondary)' }}>{fmt(FIXED[0].amount)}</td></tr>
          <tr><td>{FIXED[1].type}</td><td style={{ color: 'var(--text-secondary)' }}>{fmt(FIXED[1].amount)}</td></tr>
          <tr><td>{FIXED[2].type}</td><td style={{ color: 'var(--text-secondary)' }}>{fmt(FIXED[2].amount)}</td></tr>
          <tr><td>{FIXED[3].type}</td><td style={{ color: 'var(--text-secondary)' }}>{fmt(FIXED[3].amount)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

// ── MAIN DASHBOARD ──────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'identity' | 'roadmap' | 'finance'>('identity');

  const data = useMemo(() => {
    const todayTasks = taskStore.getByDate(TODAY);
    const completedTasks = todayTasks.filter(t => t.completed);
    const taskRate = todayTasks.length ? (completedTasks.length / todayTasks.length) * 100 : 0;

    const habits = habitStore.getAll().filter(h => !h.isArchived);
    const todayLogs = habitLogStore.getByDate(TODAY);
    const completedHabits = todayLogs.filter(l => l.completed).length;
    const habitRate = habits.length ? (completedHabits / habits.length) * 100 : 0;

    const todayMental = mentalStore.getByDate(TODAY);
    const mentalScore = todayMental
      ? Math.round((todayMental.mood + todayMental.energy + todayMental.stress + todayMental.sleepQuality) / 4 * 10) / 10
      : null;

    const momentum = Math.round((habitRate + taskRate + (mentalScore ? mentalScore * 20 : 0)) / 3);

    // Growth opportunity: 가장 참여가 적은 습관 (부정어 없이)
    const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
    let growthHabit = '';
    let growthRate = 101;
    habits.forEach(h => {
      const done = last7.filter(d => habitLogStore.getByDate(d).some(l => l.habitId === h.id && l.completed)).length;
      const rate = (done / 7) * 100;
      if (rate < growthRate) { growthRate = rate; growthHabit = h.name; }
    });

    const monthlyData = Array.from({ length: 7 }, (_, i) => {
      const m = new Date(); m.setMonth(m.getMonth() - (6 - i));
      return { label: `${m.getMonth() + 1}월`, rate: Math.floor(Math.random() * 60 + 20) };
    });

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (habitLogStore.getByDate(d).some(l => l.completed)) streak++;
      else break;
    }

    const recentArchive = archiveStore.getAll()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2);

    return { taskRate, habitRate, mentalScore, completedHabits, habits, momentum, growthHabit, growthRate, monthlyData, streak, recentArchive, completedTasks, todayTasks };
  }, []);

  const TABS = [
    { id: 'identity', label: 'IDENTITY' },
    { id: 'roadmap', label: 'ROADMAP' },
    { id: 'finance', label: 'FINANCE' },
  ] as const;

  return (
    <div className="page-enter space-y-4">
      {/* ── Header ── */}
      <div className="pt-3 pb-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
          {formatDate(TODAY, 'yyyy.MM.dd EEEE')}
        </p>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>
          Life Hacking Dashboard
        </h1>
        {/* 오늘 전체 메시지 */}
        <p className="text-[12px] mt-1 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Noto Sans KR, sans-serif' }}>
          {getRateMessage(data.momentum)}
        </p>
      </div>

      {/* ── MOMENTUM + GROWTH OPPORTUNITY ── */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Momentum (← 기존 "System Integrity") */}
          <div className="p-3 border-r" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
              {DASH_LABELS.integrityTitle}
            </p>
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

          {/* Growth Opportunity (← 기존 "Top Missed Habit") */}
          <div className="p-3" style={{ background: 'var(--sage-pale)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
              {HABIT_LABELS.topMissedTitle}
            </p>
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
        <StatCard
          label={DASH_LABELS.habitStatLabel}
          value={Math.round(data.habitRate)} unit="%"
          sub={`${data.completedHabits}/${data.habits.length} 참여`}
          icon={<Target size={12} />}
        />
        <StatCard
          label={DASH_LABELS.taskStatLabel}
          value={Math.round(data.taskRate)} unit="%"
          sub={TASK_LABELS.summaryDone(data.completedTasks.length, data.todayTasks.length)}
          icon={<Zap size={12} />}
        />
        <StatCard
          label={DASH_LABELS.mentalStatLabel}
          value={data.mentalScore ?? '-'}
          unit={data.mentalScore ? '/5' : ''}
          sub={data.mentalScore ? DASH_LABELS.mentalRecorded : DASH_LABELS.mentalNotYet}
          icon={<span style={{ fontSize: 12 }}>✦</span>}
        />
        <StatCard
          label={DASH_LABELS.streakStatLabel}
          value={data.streak} unit="일"
          sub={getStreakMessage(data.streak)}
          icon={<Flame size={12} />}
        />
      </div>

      {/* ── GROWTH JOURNEY (← 1 YEAR DASHBOARD) ── */}
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
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                  formatter={(v: number) => [`${v}%`, '참여율']}
                />
                <Bar dataKey="rate" fill="var(--sage)" radius={[3, 3, 0, 0]} opacity={0.85} />
                <Line type="monotone" dataKey="rate" stroke="var(--navy)" strokeWidth={1.5} dot={{ fill: 'var(--navy)', r: 3 }} />
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
          {activeTab === 'roadmap' && <RoadmapTab />}
          {activeTab === 'finance' && <FinanceTab />}
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
                  <p className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>{item.title}</p>
                  <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>{item.content}</p>
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
