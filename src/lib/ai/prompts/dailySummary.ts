import type { Task, HabitLog, MentalStateLog, MeaningfulMoment, Habit } from '@/types';

export interface DailySummaryInput {
  date: string;
  tasks: Task[];
  habitLogs: HabitLog[];
  habits: Habit[];
  mental: MentalStateLog | null;
  moment: MeaningfulMoment | null;
}

export function buildDailySummaryPrompt(input: DailySummaryInput): string {
  const { date, tasks, habitLogs, habits, mental, moment } = input;

  const doneTasks = tasks.filter(t => t.completed);
  const undoneTasks = tasks.filter(t => !t.completed);
  const habitMap = new Map(habits.map(h => [h.id, h.name]));
  const completedHabits = habitLogs.filter(l => l.completed).map(l => habitMap.get(l.habitId) ?? l.habitId);

  const lines = [
    `날짜: ${date}`,
    ``,
    `[완료한 작업] ${doneTasks.map(t => t.title).join(', ') || '없음'}`,
    `[미완료 작업] ${undoneTasks.map(t => `${t.title}${t.incompleteReason ? ` (사유: ${t.incompleteReason})` : ''}`).join(', ') || '없음'}`,
    `[수행한 습관] ${completedHabits.join(', ') || '없음'}`,
  ];

  if (mental) {
    lines.push(
      ``,
      `[MOHO 4축 에너지] 신체 ${mental.body}/5, 정서 ${mental.emotion}/5, 인지 흐름 ${mental.focus}/5, 환경 지원도 ${mental.environment}/5`,
      mental.note ? `[컨디션 메모] ${mental.note}` : '',
    );
  }

  if (moment) {
    lines.push(``, `[오늘 의미 있었던 순간] ${moment.content}`);
  }

  return lines.filter(Boolean).join('\n');
}
