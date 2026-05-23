'use client';
import { useState, useMemo } from 'react';
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
  { key: 'mood' as const, label: '기분', icon: '😊' },
  { key: 'energy' as const, label: '에너지', icon: '⚡' },
  { key: 'stress' as const, label: '스트레스', icon: '🌊' },   // ← 😤 → 🌊 (파도=자연스러운 감정)
  { key: 'sleepQuality' as const, label: '수면', icon: '🌙' },
];

export default function MentalPage() {
  const existing = mentalStore.getByDate(TODAY);
  const [values, setValues] = useState<Record<string, MoodScore>>({
    mood: existing?.mood ?? 3, energy: existing?.energy ?? 3,
    stress: existing?.stress ?? 3, sleepQuality: existing?.sleepQuality ?? 3,
  });
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    mentalStore.save({
      id: existing?.id ?? newId(),
      date: TODAY, mood: values.mood, energy: values.energy,
      stress: values.stress, sleepQuality: values.sleepQuality, note,
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const avg = Math.round((Object.values(values).reduce((a, b) => a + b, 0) / 4) * 10) / 10;
  const radarData = METRICS.map(m => ({ metric: m.label, value: values[m.key], fullMark: 5 }));

  const weeklyData = useMemo(() => getLast7Days().map(date => {
    const log = mentalStore.getByDate(date);
    return {
      label: format(new Date(date), 'EEE', { locale: ko }),
      기분: log?.mood ?? 0, 에너지: log?.energy ?? 0,
      스트레스: log?.stress ?? 0, 수면: log?.sleepQuality ?? 0,
    };
  }), [saved]);

  // 강점 기반: 점수에 따른 격려 메시지
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

      {/* ── 에너지 지도 (← "오늘의 상태") ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header">{MENTAL_LABELS.radarTitle}</div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>종합 에너지</p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>{avg}</span>
              <span className="text-sm mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>/5</span>
            </div>
            {/* 강점 기반 메시지 */}
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

      {/* ── 에너지 레벨 입력 (← "점수 입력") ── */}
      <div className="card overflow-hidden">
        <div className="sheet-header-navy">{MENTAL_LABELS.inputTitle}</div>
        <div className="p-3 space-y-4">
          {METRICS.map(m => (
            <div key={m.key}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{m.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{m.label}</span>
                </div>
                {/* 강점 기반 레이블 */}
                <span className="text-[11px] font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
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

      {/* ── 오늘의 발견 (← "오늘의 한 줄 기록") ── */}
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

      {/* ── 에너지 흐름 (← "7일 트렌드") ── */}
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
              <Line type="monotone" dataKey="기분" stroke="var(--sage)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="에너지" stroke="#d97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="스트레스" stroke="var(--navy)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="수면" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 justify-center pb-3">
          {[['var(--sage)','기분'],['#d97706','에너지'],['var(--navy)','스트레스'],['#7c3aed','수면']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: c }} />
              <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
}
