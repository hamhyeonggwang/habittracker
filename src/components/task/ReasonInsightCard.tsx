'use client';
import { useState, useCallback } from 'react';
import { Sparkles, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { taskStore } from '@/lib/storage';
import { TODAY } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import type { ReasonPatternInput } from '@/lib/ai/prompts/reasonPattern';

export default function ReasonInsightCard() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (force: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const since = format(subDays(new Date(), 29), 'yyyy-MM-dd');
      const allTasks = await taskStore.getAll();
      const tasks = allTasks.filter(t => !t.completed && t.date >= since && t.incompleteReason?.trim());

      if (!tasks.length) {
        setContent('최근 30일간 기록된 미완료 사유가 없어요. 작업을 완료하지 못했을 때 사유를 남겨두면, 패턴을 더 잘 짚어드릴 수 있어요.');
        return;
      }

      const payload: ReasonPatternInput & { type: 'reason_pattern'; force?: boolean } = {
        type: 'reason_pattern', date: TODAY, tasks, force,
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
          <Sparkles size={12} style={{ color: 'var(--sage)' }} /> 미완료 패턴 들여다보기 (최근 30일)
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
          {loading ? '분석 중...' : '미완료 사유 패턴 보기'}
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
