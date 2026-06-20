import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 현재 날짜(YYYY-MM-DD)를 호출 시점에 평가해 반환.
 * 모듈 로드 시 1회 고정되던 기존 `TODAY` 상수를 대체 — 앱을 열어둔 채
 * 자정을 넘겨도 저장·체크가 항상 정확한 날짜를 사용하도록 보장한다.
 */
export function getToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

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
