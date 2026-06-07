'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { mentalStore, newId } from '@/lib/storage';
import { MentalStateLog, MoodScore } from '@/types';
import { ScoreSelector, Button } from '@/components/ui';
import { TODAY, getLast7Days, formatDate } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Save, CheckCircle2 } from 'lucide-react';
import { MENTAL_LABELS } from '@/lib/strengthLanguage';

const METRICS = [
  { key: 'body'        as const, label: 'Physical Capacity',    sub: '신체 수행 에너지', color: '#22c55e', dot: '🟢' },
  { key: 'emotion'     as const, label: 'Emotional State',      sub: '정서 참여 에너지', color: '#2c4a7c', dot: '🔵' },
  { key: 'focus'       as const, label: 'Cognitive Capacity',   sub: '인지 집중·흐름',   color: '#7c3aed', dot: '🟣' },
  { key: 'environment' as const, label: 'Environmental Support', sub: '환경 지원도',     color: '#ea580c', dot: '🟠' },
];

export default function MentalPage() {
  const [existing, setExisting] = useState<MentalStateLog | null>(null);
  const [allLogs, setAllLogs] = useState<MentalStateLog[]>([]);
  const [values, setValues] = useState<Record<string, MoodScore>>({
    body: 3, emotion: 3, focus: 3, environment: 3,
  });
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    const [todayLog, logs] = await Promise.all([
      mentalStore.getByDate(TODAY),
      mentalStore.getAll(),
    ]);
    setExisting(todayLog);
    setAllLogs(logs);
    if (todayLog) {
      setValues({ body: todayLog.body, emotion: todayLog.emotion, focus: todayLog.focus, environment: todayLog.environment });
      setNote(todayLog.note);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    await mentalStore.save({
      id: existing?.id ?? newId(),
      date: TODAY,
      body: values.body, emotion: values.emotion, focus: values.focus, environment: values.environment,
      note,
    });
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
      [METRICS[0].label]: log?.body ?? 0,
      [METRICS[1].label]: log?.emotion ?? 0,
      [METRICS[2].label]: log?.focus ?? 0,
      [METRICS[3].label]: log?.environment ?? 0,
    };
  }), [allLogs]);

  const getScoreMessage = (score: number) => MENTAL_LABELS.scores[score as keyof typeof MENTAL_LABELS.scores] ?? '평온한 하루';
  const getMoodEmoji = (s: number) => (['','😞','😕','😐','😊','😄'][s] ?? '😐');

  return (
    <div className="page-enter space-y-4">
      <div className="pt-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>
          {MENTAL_LABELS.sectionTitle}
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{formatDate(TODAY)}</p>
      </div>

      {/* ── 에너지 지도 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header">ENERGY MAP</div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>종합 에너지</p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{avg}</span>
              <span className="text-sm mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>/5</span>
            </div>
            <p className="text-[12px] mt-1 font-semibold" style={{ color: 'var(--sage)', fontFamily: 'Noto Sans KR, sans-serif' }}>
              {getScoreMessage(Math.round(avg))}
            </p>
          </div>
          <div className="text-5xl">{getMoodEmoji(Math.round(avg))}</div>
        </div>
        <div className="h-40 px-2 pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
              <Radar name="오늘" dataKey="value" stroke="var(--sage)" fill="var(--sage)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 에너지 레벨 입력 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header-navy">{MENTAL_LABELS.inputTitle}</div>
        <div className="p-3 space-y-4">
          {METRICS.map(m => (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{m.dot}</span>
                  <div>
                    <span className="text-[13px] font-bold" style={{ color: m.color, fontFamily: 'Pretendard, sans-serif', letterSpacing: '0.02em' }}>{m.label}</span>
                    <span className="text-[10px] ml-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{m.sub}</span>
                  </div>
                </div>
                <span className="text-[11px] font-medium" style={{ color: m.color, fontFamily: 'Pretendard, sans-serif' }}>
                  {getScoreMessage(values[m.key])}
                </span>
              </div>
              <ScoreSelector
                value={values[m.key]}
                onChange={v => setValues(p => ({ ...p, [m.key]: v as MoodScore }))}
                labels={Object.fromEntries(Object.entries(MENTAL_LABELS.scores).map(([k, v]) => [k, v]))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── 오늘의 발견 ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header">{MENTAL_LABELS.noteTitle}</div>
        <div className="p-3">
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder={MENTAL_LABELS.notePlaceholder}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none"
            style={{
              borderColor: 'var(--border)', fontFamily: 'Noto Sans KR, sans-serif',
              color: 'var(--text-primary)', lineHeight: 1.7,
            }} />
          <Button onClick={handleSave} className="w-full mt-3" size="lg">
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
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'Pretendard', fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} ticks={[1,2,3,4,5]} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'Pretendard' }}
                formatter={(v: number, name: string) => [getScoreMessage(Math.round(v)) + ` (${v})`, name]}
              />
              {METRICS.map(m => (
                <Line key={m.key} type="monotone" dataKey={m.label} stroke={m.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 justify-center pb-3">
          {METRICS.map(m => (
            <div key={m.key} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: m.color }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
