'use client';
import { useState, useEffect } from 'react';
import { getToday } from './utils';

/**
 * 현재 날짜(YYYY-MM-DD)를 반응형으로 반환하는 훅.
 * - 앱 포커스 복귀(visibilitychange) 시 날짜 재확인
 * - 60초 간격으로 자정 넘김 감지 (앱을 열어둔 상태 대비)
 * 날짜가 실제로 바뀔 때만 상태를 갱신하므로 불필요한 리렌더는 발생하지 않는다.
 */
export function useToday(): string {
  const [today, setToday] = useState(getToday);

  useEffect(() => {
    const sync = () => setToday(prev => {
      const next = getToday();
      return next === prev ? prev : next;
    });
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(sync, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  return today;
}
