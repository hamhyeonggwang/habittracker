'use client';
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * 현재 인증 세션을 반환하는 훅.
 * loading=true 동안은 세션 복원 중(스플래시 유지), 이후 session=null이면 로그인 필요.
 */
export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
