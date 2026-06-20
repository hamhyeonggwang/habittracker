import { supabase } from './supabase';

// 현재 로그인 사용자 id를 모듈 레벨에 캐싱한다.
// storage의 insert/upsert가 동기적으로 user_id를 주입할 수 있도록 하기 위함.
// 비로그인(anon) 상태에서는 null — 그 경우 user_id는 NULL로 저장된다(전환기 호환).
let currentUserId: string | null = null;

if (typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data }) => {
    currentUserId = data.session?.user.id ?? null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUserId = session?.user.id ?? null;
  });
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
