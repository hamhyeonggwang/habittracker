'use client';
import { useEffect, useState } from 'react';
import { ConfirmState, subscribeConfirm, resolveConfirm } from '@/lib/confirm';
import { Button } from './index';

// 앱 전역 확인 시트. page.tsx에 1회 마운트. confirmDialog()로 호출.
export function ConfirmHost() {
  const [state, setState] = useState<ConfirmState>(null);
  useEffect(() => subscribeConfirm(setState), []);

  if (!state) return null;
  const danger = !!state.danger;

  return (
    <div
      onClick={() => resolveConfirm(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(20,30,25,0.32)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog" aria-modal="true" aria-label={state.title}
        style={{
          width: 'min(100%, 512px)', background: 'var(--bg-card)',
          borderRadius: '20px 20px 0 0', padding: '22px 20px',
          paddingBottom: 'calc(22px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 30px rgba(20,30,25,0.16)',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif', lineHeight: 1.4 }}>
          {state.title}
        </h3>
        {state.message && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6, fontFamily: 'Pretendard, sans-serif' }}>
            {state.message}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => resolveConfirm(false)}>
            {state.cancelLabel ?? '취소'}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="lg" fullWidth onClick={() => resolveConfirm(true)}>
            {state.confirmLabel ?? '확인'}
          </Button>
        </div>
      </div>
    </div>
  );
}
