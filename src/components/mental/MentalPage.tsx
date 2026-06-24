'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { mentalStore, newId } from '@/lib/storage';
import { MentalStateLog, MoodScore } from '@/types';
import { ScoreSelector, Button } from '@/components/ui';
import { getToday, getLast7Days, formatDate } from '@/lib/utils';
import { useToday } from '@/lib/useToday';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Activity, Battery, Brain, CheckCircle2, Gauge, Save } from 'lucide-react';
import { MENTAL_LABELS } from '@/lib/strengthLanguage';

// 한글 라벨 우선(차트·레이더·행 제목) + 영문 임상 용어 부가(sub)
const METRICS = [
  { key: 'body'        as const, label: '신체 에너지', sub: 'Physical Capacity',     color: '#22c55e', icon: Battery },
  { key: 'emotion'     as const, label: '정서 에너지', sub: 'Emotional State',       color: '#2c4a7c', icon: Gauge },
  { key: 'focus'       as const, label: '인지 흐름',   sub: 'Cognitive Capacity',    color: '#7c3aed', icon: Brain },
  { key: 'environment' as const, label: '환경 지원',   sub: 'Environmental Support', color: '#ea580c', icon: Activity },
];

export default function MentalPage() {
  const [existing, setExisting] = useState<MentalStateLog | null>(null);
  const [allLogs, setAllLogs] = useState<MentalStateLog[]>([]);
  const [values, setValues] = useState<Record<string, MoodScore>>({
    body: 3, emotion: 3, focus: 3, environment: 3,
  });
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const today = useToday();

  const loadData = useCallback(async () => {
    const [todayLog, logs] = await Promise.all([
      mentalStore.getByDate(today),
      mentalStore.getAll(),
    ]);
    setExisting(todayLog);
    setAllLogs(logs);
    if (todayLog) {
      setValues({ body: todayLog.body, emotion: todayLog.emotion, focus: todayLog.focus, environment: todayLog.environment });
      setNote(todayLog.note);
    }
  }, [today]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    const result = await mentalStore.save({
      id: existing?.id ?? newId(),
      date: getToday(),
      body: values.body, emotion: values.emotion, focus: values.focus, environment: values.environment,
      note,
    });
    if (!result.ok) return; // 실패 토스트는 storage가 띄움 — "저장됨" 표시하지 않음
    setSaved(true);
    await loadData();
    setTimeout(() => setSaved(false), 2000);
  };

  const avg = Math.round((Object.values(values).reduce((a, b) => a + b, 0) / 4) * 10) / 10;
  const radarData = METRICS.map(m => ({ metric: m.label, value: values[m.key], fullMark: 5 }));
  const chartColors: Record<string, string> = Object.fromEntries(METRICS.map(m => [m.label, m.color]));

  const weeklyData = useMemo(() => getLast7Days().map(date => {
    const log = allLogs.find(l => l.date === date);
    return {
      label: format(new Date(date), 'EEE', { locale: ko }),
      [METRICS[0].label]: log?.body ?? null,
      [METRICS[1].label]: log?.emotion ?? null,
      [METRICS[2].label]: log?.focus ?? null,
      [METRICS[3].label]: log?.environment ?? null,
    };
  }), [allLogs]);

  const getScoreMessage = (score: number) => MENTAL_LABELS.scores[score as keyof typeof MENTAL_LABELS.scores] ?? '평온한 하루';

  return (
    <div className="page-enter space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      <div className="pt-3">
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
          {MENTAL_LABELS.sectionTitle}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{formatDate(today)}</p>
      </div>

      {/* ── 에너지 지도 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header">ENERGY MAP</div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>종합 에너지</p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{avg}</span>
              <span className="text-sm mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>/5</span>
            </div>
            <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
              {getScoreMessage(Math.round(avg))}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--sage-light)', color: 'var(--sage)' }}>
            <Activity size={28} />
          </div>
        </div>
        <div className="h-40 px-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
              <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={false} axisLine={false} />
              <Radar name="오늘" dataKey="value" stroke="var(--sage)" fill="var(--sage)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 에너지 레벨 입력 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header-navy">{MENTAL_LABELS.inputTitle}</div>
        <div className="p-3 space-y-4">
          {METRICS.map(m => {
            const Icon = m.icon;
            return (
            <div key={m.key} className="rounded-2xl p-3" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border-light)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'white', color: m.color }}>
                    <Icon size={18} />
                  </span>
                  <div>
                    <span className="text-sm font-bold block" style={{ color: m.color, fontFamily: 'Pretendard, sans-serif', letterSpacing: '0.02em' }}>{m.label}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{m.sub}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold" style={{ color: m.color, fontFamily: 'Pretendard, sans-serif' }}>
                  {getScoreMessage(values[m.key])}
                </span>
              </div>
              <ScoreSelector
                value={values[m.key]}
                onChange={v => setValues(p => ({ ...p, [m.key]: v as MoodScore }))}
                labels={Object.fromEntries(Object.entries(MENTAL_LABELS.scores).map(([k, v]) => [k, v]))}
              />
              <div className="flex justify-between mt-1.5 px-0.5">
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>낮음</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>높음</span>
              </div>
            </div>
          );})}
        </div>
      </div>

      {/* ── 오늘의 발견 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header">{MENTAL_LABELS.noteTitle}</div>
        <div className="p-3">
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder={MENTAL_LABELS.notePlaceholder}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{
              borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif',
              color: 'var(--text-primary)', lineHeight: 1.7,
            }} />
          <Button onClick={handleSave} className="w-full mt-3 min-h-[52px]" size="lg">
            {saved
              ? <><CheckCircle2 size={15} className="inline mr-1.5" />{MENTAL_LABELS.savedBtn}</>
              : <><Save size={15} className="inline mr-1.5" />{MENTAL_LABELS.saveBtn}</>}
          </Button>
        </div>
      </div>

      {/* ── 에너지 흐름 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header">{MENTAL_LABELS.trendTitle}</div>
        <div className="p-3 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} ticks={[1,2,3,4,5]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                formatter={(v: number, name: string) => [`${getScoreMessage(Math.round(v))} (${v})`, name]}
              />
              {METRICS.map(m => (
                <Line key={m.key} type="monotone" dataKey={m.label} stroke={m.color} strokeWidth={2} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 justify-center pb-3">
          {METRICS.map(m => (
            <div key={m.key} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: m.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
