'use client';
import { useState, useCallback } from 'react';
import { Sparkles, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  taskStore, habitStore, habitLogStore, mentalStore, meaningfulStore,
} from '@/lib/storage';
import { TODAY } from '@/lib/utils';
import type { DailySummaryInput } from '@/lib/ai/prompts/dailySummary';

export default function AIInsightCard() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const [tasks, habits, allLogs, mental, moment] = await Promise.all([
        taskStore.getByDate(TODAY),
        habitStore.getAll(),
        habitLogStore.getAll(),
        mentalStore.getByDate(TODAY),
        meaningfulStore.getByDate(TODAY),
      ]);
      const habitLogs = allLogs.filter(l => l.date === TODAY);

      const payload: DailySummaryInput & { force?: boolean } = {
        date: TODAY, tasks, habits, habitLogs, mental, moment, force,
      };

      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '인사이트 생성에 실패했습니다');
      setContent(json.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
          <Sparkles size={12} style={{ color: 'var(--sage)' }} /> 오늘의 AI 인사이트
        </p>
        {content && (
          <button onClick={() => generate(true)} disabled={loading}
            className="flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            <RotateCw size={11} className={loading ? 'animate-spin' : ''} /> 다시 생성
          </button>
        )}
      </div>

      {!content && (
        <Button onClick={() => generate(false)} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? '생성 중...' : '오늘의 인사이트 보기'}
        </Button>
      )}

      {error && (
        <p className="text-[12px] mt-2" style={{ color: '#c0392b', fontFamily: 'Pretendard, sans-serif' }}>{error}</p>
      )}

      {content && (
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap mt-1"
          style={{ color: 'var(--text-primary)', fontFamily: 'Noto Sans KR, sans-serif' }}>
          {content}
        </p>
      )}
    </div>
  );
}
