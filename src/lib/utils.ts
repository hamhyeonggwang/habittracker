import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export const TODAY = format(new Date(), 'yyyy-MM-dd');

export function formatDate(date: string | Date, pattern = 'M월 d일 (EEE)') {
  return format(new Date(date), pattern, { locale: ko });
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'd', { locale: ko });
}

export function getWeekDays(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getLast28Days() {
  return Array.from({ length: 28 }, (_, i) =>
    format(subDays(new Date(), 27 - i), 'yyyy-MM-dd')
  );
}

export function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
  );
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export const CATEGORY_LABELS: Record<string, string> = {
  book: '📚 독서',
  work: '💼 업무',
  research: '🔬 연구',
  clinical: '🏥 임상',
  idea: '💡 아이디어',
  etc: '📌 기타',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

export const TIMESLOT_LABELS: Record<string, string> = {
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
};

export const SCORE_LABELS: Record<number, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
};
