'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastItem, subscribeToasts, dismissToast } from '@/lib/toast';

const STYLES: Record<ToastItem['type'], { bg: string; border: string; color: string; icon: typeof Info }> = {
  success: { bg: '#f0f7f2', border: '#bcdcc8', color: '#2f6b43', icon: CheckCircle2 },
  error:   { bg: '#fdf2f2', border: '#f3c5c5', color: '#b02a2a', icon: AlertCircle },
  info:    { bg: '#f2f5fb', border: '#c8d4ec', color: '#2c4a7c', icon: Info },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 12px)',
        zIndex: 10000,
        width: 'min(92vw, 420px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => {
        const s = STYLES[t.type];
        const Icon = s.icon;
        return (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: s.bg,
              border: `1px solid ${s.border}`,
              color: s.color,
              borderRadius: '12px',
              padding: '11px 12px',
              boxShadow: '0 6px 20px rgba(20,30,25,0.12)',
              fontFamily: 'Pretendard, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.4,
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <Icon size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="닫기"
              style={{ flexShrink: 0, color: s.color, opacity: 0.6, lineHeight: 0, marginTop: 1 }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
