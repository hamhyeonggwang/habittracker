import { LifeRoleDef } from '@/types';

// 사용자 정의 역할 — 더 이상 하드코딩된 개인 정체성은 없다.
// 실제 역할은 life_roles 테이블에서 사용자별로 로드한다(useLifeRoles).

// 온보딩/추가 시 제안하는 일반 역할 풀 (대중 대상)
export interface RoleSuggestion {
  label: string;
  emoji: string;
  color: string;
}

export const ROLE_SUGGESTIONS: RoleSuggestion[] = [
  { label: '직장인',     emoji: '💼', color: '#2c4a7c' },
  { label: '부모',       emoji: '👨‍👧', color: '#d97706' },
  { label: '학생',       emoji: '📚', color: '#7c3aed' },
  { label: '운동인',     emoji: '🏃', color: '#16a34a' },
  { label: '창작자',     emoji: '🎨', color: '#db2777' },
  { label: '반려인',     emoji: '🐾', color: '#0d9488' },
  { label: '신앙인',     emoji: '🙏', color: '#be185d' },
  { label: '자기계발러', emoji: '📈', color: '#0891b2' },
  { label: '살림가',     emoji: '🏠', color: '#ca8a04' },
  { label: '친구',       emoji: '🤝', color: '#6366f1' },
  { label: '건강관리',   emoji: '🩺', color: '#4a7c59' },
  { label: '연인·배우자', emoji: '💞', color: '#dc2626' },
];

// 역할 추가/수정 시 선택 가능한 이모지·색상 팔레트
export const ROLE_EMOJIS = ['🏷️', '💼', '👨‍👧', '📚', '🏃', '🎨', '🐾', '🙏', '📈', '🏠', '🤝', '🩺', '💞', '🎯', '🌱', '⭐', '🎵', '✍️', '🔬', '💻'];

export const ROLE_COLORS = ['#4a7c59', '#2c4a7c', '#7c3aed', '#0891b2', '#d97706', '#be185d', '#16a34a', '#db2777', '#0d9488', '#ca8a04', '#6366f1', '#dc2626'];

// 역할 배열 → id 기준 맵. 렌더 시 존재하지 않는 id는 자연히 누락(orphan-safe).
export function buildRoleMap(roles: LifeRoleDef[]): Record<string, LifeRoleDef> {
  return Object.fromEntries(roles.map(r => [r.id, r]));
}
