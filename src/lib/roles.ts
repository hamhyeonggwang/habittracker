import { LifeRole } from '@/types';

// 참여(루틴)·업무 공통 정체성 역할 태그 — 단일 출처(Single Source of Truth)
export interface LifeRoleDef {
  key: LifeRole;
  label: string;
  emoji: string;
  color: string;
}

export const LIFE_ROLES: LifeRoleDef[] = [
  { key: 'therapist',  label: '작업치료사', emoji: '🩺', color: '#4a7c59' },
  { key: 'leader',     label: '팀장',       emoji: '🧭', color: '#2c4a7c' },
  { key: 'researcher', label: '연구자',     emoji: '🔬', color: '#7c3aed' },
  { key: 'developer',  label: '개발자',     emoji: '💻', color: '#0891b2' },
  { key: 'father',     label: '아버지',     emoji: '👨‍👧', color: '#d97706' },
  { key: 'believer',   label: '신앙인',     emoji: '🙏', color: '#be185d' },
];

export const LIFE_ROLE_MAP = Object.fromEntries(LIFE_ROLES.map(r => [r.key, r])) as Record<LifeRole, LifeRoleDef>;
