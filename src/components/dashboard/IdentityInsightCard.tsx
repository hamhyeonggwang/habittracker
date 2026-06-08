'use client';
import { useState, useCallback } from 'react';
import { Sparkles, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  taskStore, habitStore, habitLogStore, identityStatementStore,
} from '@/lib/storage';
import { TODAY } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import type { IdentityCheckInput } from '@/lib/ai/prompts/identityCheck';

export default function IdentityInsightCard() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const last7 = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));

      const [statements, habits, allTasks, allLogs] = await Promise.all([
        identityStatementStore.getAll(),
        habitStore.getAll(),
        taskStore.getAll(),
        habitLogStore.getAll(),
      ]);

      const tasks = allTasks.filter(t => last7.includes(t.date));
      const habitLogs = allLogs.filter(l => last7.includes(l.date));

      const payload: IdentityCheckInput & { type: 'identity_check'; force?: boolean } = {
        type: 'identity_check',
        date: TODAY,
        statements, habits, habitLogs, tasks, force,
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
    <div className="rounded-lg p-2.5" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
          <Sparkles size={12} /> 선언과 실제, 얼마나 가까울까요
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
        <Button onClick={() => generate(false)} disabled={loading} size="sm">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? '분석 중...' : '최근 7일 정합성 보기'}
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
