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

// 계정 및 모든 데이터 영구 삭제.
// delete-account 엣지 함수가 service_role로 auth 사용자를 삭제하면
// FK ON DELETE CASCADE로 전 테이블의 본인 데이터가 함께 삭제된다.
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) return { ok: false, error: error.message };
  if (data && data.ok === false) return { ok: false, error: data.error ?? '삭제에 실패했습니다' };
  await supabase.auth.signOut();
  return { ok: true };
}
