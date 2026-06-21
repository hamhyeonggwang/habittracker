'use client';
import { useEffect } from 'react';

// 서비스워커 등록 (프로덕션에서만). 렌더링 없음.
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
