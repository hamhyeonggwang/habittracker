'use client';
import { useState, useCallback } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import type { ArchiveItem } from '@/types';
import { summarizeForCandidate, type ArchiveConnectInput } from '@/lib/ai/prompts/archiveConnect';

export default function ArchiveConnectButton({ item, allItems }: { item: ArchiveItem; allItems: ArchiveItem[] }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const candidates = allItems.filter(i => i.id !== item.id).map(summarizeForCandidate);

      const payload: ArchiveConnectInput & { type: 'archive_connect' } = {
        type: 'archive_connect',
        date: item.id, // 항목별로 캐시가 분리되도록 id를 캐시 키로 사용
        targetId: item.id,
        target: summarizeForCandidate(item),
        candidates,
      };

      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? '연결 분석에 실패했습니다');
      setContent(json.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [item, allItems]);

  if (allItems.length < 2) return null;

  return (
    <div className="mt-1">
      {!content && (
        <button onClick={run} disabled={loading}
          className="flex items-center gap-1 text-[10px] font-semibold transition-colors hover:opacity-70"
          style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
          {loading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
          {loading ? '연결 찾는 중...' : '관련 기록 찾기'}
        </button>
      )}
      {error && (
        <p className="text-[11px] mt-1" style={{ color: '#c0392b', fontFamily: 'Pretendard, sans-serif' }}>{error}</p>
      )}
      {content && (
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap mt-1.5 p-2 rounded-lg"
          style={{ color: 'var(--text-secondary)', background: 'var(--sage-pale)', fontFamily: 'Noto Sans KR, sans-serif' }}>
          {content}
        </p>
      )}
    </div>
  );
}
