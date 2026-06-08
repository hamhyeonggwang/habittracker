import type { IdentityStatement, Habit, Task, HabitLog, LifeRole } from '@/types';
import { LIFE_ROLE_MAP } from '@/lib/roles';

export interface IdentityCheckInput {
  date: string; // 기준일 (최근 7일 집계)
  statements: IdentityStatement[];
  habits: Habit[];
  habitLogs: HabitLog[]; // 최근 7일분
  tasks: Task[];         // 최근 7일분
}

function roleLabel(role: LifeRole): string {
  return LIFE_ROLE_MAP[role]?.label ?? role;
}

export function buildIdentityCheckPrompt(input: IdentityCheckInput): string {
  const { date, statements, habits, habitLogs, tasks } = input;

  const habitMap = new Map(habits.map(h => [h.id, h]));
  const roleCounts = new Map<LifeRole, number>();

  habitLogs.filter(l => l.completed).forEach(l => {
    const habit = habitMap.get(l.habitId);
    habit?.roles.forEach(r => roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1));
  });
  tasks.filter(t => t.completed).forEach(t => {
    t.roles.forEach(r => roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1));
  });

  const roleSummary = Array.from(roleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([role, count]) => `${roleLabel(role)} ${count}회`)
    .join(', ') || '기록 없음';

  const statementSummary = statements.length
    ? statements.map(s => `- ${s.keyword}: ${s.statement}`).join('\n')
    : '(등록된 정체성 선언 없음)';

  return [
    `기준일: ${date} (최근 7일 집계)`,
    ``,
    `[등록된 정체성 선언]`,
    statementSummary,
    ``,
    `[최근 7일간 실제 수행 — 역할 태그별 빈도]`,
    roleSummary,
  ].join('\n');
}
