import type { Task } from '@/types';

export interface ReasonPatternInput {
  date: string; // 기준일 (최근 30일 집계)
  tasks: Task[]; // incompleteReason이 있는 미완료 작업들 (최근 30일)
}

export function buildReasonPatternPrompt(input: ReasonPatternInput): string {
  const { date, tasks } = input;

  const entries = tasks
    .filter(t => t.incompleteReason?.trim())
    .map(t => `- (${t.date}, ${t.timeSlot}) ${t.title} → ${t.incompleteReason}`);

  const body = entries.length
    ? entries.join('\n')
    : '(최근 30일간 기록된 미완료 사유 없음)';

  return [
    `기준일: ${date} (최근 30일 집계, 총 ${entries.length}건)`,
    ``,
    `[미완료 작업과 그 사유 목록]`,
    body,
  ].join('\n');
}
