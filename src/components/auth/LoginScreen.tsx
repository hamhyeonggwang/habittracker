'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/lib/toast';

type Provider = 'google' | 'kakao';

export default function LoginScreen() {
  const [busy, setBusy] = useState<Provider | null>(null);

  const signIn = async (provider: Provider) => {
    setBusy(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    if (error) {
      showToast(`로그인을 시작하지 못했어요. ${error.message}`, 'error');
      setBusy(null);
    }
    // 성공 시 OAuth 리다이렉트가 일어나므로 별도 처리 없음
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#ffffff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* 워드마크 */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 800, fontSize: 'clamp(48px, 12vw, 64px)', letterSpacing: '0.015em',
          color: '#1c1f2e', lineHeight: 1, userSelect: 'none',
        }}
      >
        <span>OTD</span>
      </div>
      <p
        style={{
          fontSize: '11px', letterSpacing: '0.22em', color: '#b0baa8',
          marginTop: '14px', fontFamily: 'Pretendard, sans-serif', fontWeight: 600, textTransform: 'uppercase',
        }}
      >
        Own The Day
      </p>
      <p
        style={{
          fontSize: '13px', color: '#6b7280', marginTop: '20px', textAlign: 'center',
          fontFamily: 'Noto Sans KR, sans-serif', lineHeight: 1.6, maxWidth: '300px',
        }}
      >
        역할이 모여 하루가 됩니다.<br />로그인하고 나의 하루를 기록해보세요.
      </p>

      {/* 로그인 버튼 */}
      <div style={{ marginTop: '36px', width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          onClick={() => signIn('google')}
          disabled={busy !== null}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            height: '50px', borderRadius: '12px', border: '1px solid #dadce0', background: '#fff',
            color: '#3c4043', fontFamily: 'Pretendard, sans-serif', fontWeight: 600, fontSize: '15px',
            cursor: busy ? 'default' : 'pointer', opacity: busy && busy !== 'google' ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.98 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          {busy === 'google' ? '이동 중…' : 'Google로 계속하기'}
        </button>

        <button
          type="button"
          onClick={() => signIn('kakao')}
          disabled={busy !== null}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            height: '50px', borderRadius: '12px', border: 'none', background: '#FEE500',
            color: '#191600', fontFamily: 'Pretendard, sans-serif', fontWeight: 700, fontSize: '15px',
            cursor: busy ? 'default' : 'pointer', opacity: busy && busy !== 'kakao' ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#191600" d="M9 1.5C4.86 1.5 1.5 4.1 1.5 7.3c0 2.07 1.4 3.89 3.5 4.92-.15.53-.56 1.96-.64 2.27-.1.38.14.38.29.27.12-.08 1.86-1.26 2.62-1.78.4.06.81.09 1.23.09 4.14 0 7.5-2.6 7.5-5.8S13.14 1.5 9 1.5z" />
          </svg>
          {busy === 'kakao' ? '이동 중…' : '카카오로 계속하기'}
        </button>
      </div>

      <p
        style={{
          fontSize: '11px', color: '#9ca3af', marginTop: '28px', textAlign: 'center',
          fontFamily: 'Noto Sans KR, sans-serif', lineHeight: 1.6, maxWidth: '300px',
        }}
      >
        이메일 외 추가 정보는 수집하지 않습니다.
      </p>
    </div>
  );
}
