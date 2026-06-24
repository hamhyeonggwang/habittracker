// ============================================================
// 강점 기반 언어 시스템 (Strengths-Based Language System)
// OT 임상 강점 관점 + 참여 중심 프레임워크 적용
// ============================================================

// ── 상태 레이블 ────────────────────────────────────────────
export const STATUS_LABELS = {
  // 업무/습관 상태
  completed:    '달성 ✓',
  inProgress:   '진행 중',        // ← "미완료" 대신
  notStarted:   '준비 중',        // ← "시작전" 대신
  skipped:      '다음에 도전',    // ← "미수행" 대신

  // 달성률 해석
  rate100:  '완벽한 하루! 🎉',
  rate80:   '훌륭해요 💪',
  rate60:   '잘 하고 있어요 👍',
  rate40:   '조금씩 나아가는 중 🌱',
  rate20:   '오늘도 시작했어요 🌤',
  rate0:    '내일 다시 도전 🌙',
} as const;

// ── 습관 관련 ──────────────────────────────────────────────
export const HABIT_LABELS = {
  topMissedTitle:  'GROWTH OPPORTUNITY',        // ← "Top Missed Habit"
  topMissedSub:    '더 키울 수 있는 루틴',       // ← "가장 실패한 습관"
  topMissedCta:    '이 습관에 집중해볼까요?',
  streakUnit:      '일 연속 참여',              // ← "일 연속 달성"
  streakZero:      '오늘부터 시작!',
  monthlyRate:     '이달 참여율',               // ← "이달 달성률"
  weeklyRate:      '주간 참여율',
  completionRate:  '참여율',                    // ← "달성률"
  checkIn:         '오늘 참여',                 // ← "오늘 체크"
  calendar:        '월간 참여 기록',            // ← "월간 캘린더"
} as const;

// ── 업무 관련 ──────────────────────────────────────────────
export const TASK_LABELS = {
  completed:       '완료',
  inProgress:      '진행 중',
  pending:         '대기 중',
  reasonPlaceholder: '어떤 상황이 있었나요? (선택)',
  reasonLabel:     '상황 메모',
  highPriority:    '핵심 업무',
  medPriority:     '일반 업무',
  lowPriority:     '여유 업무',
  noTasks:         '오늘 일정이 비어있어요',
  addFirst:        '첫 업무를 추가해볼까요?',
  summaryDone:     (done: number, total: number) => `${done}개 완료 · ${total - done}개 진행 예정`,
  priorities: { high: '핵심', medium: '일반', low: '여유' } as Record<string, string>,
  timeslots:  { morning: '오전', afternoon: '오후', evening: '저녁' } as Record<string, string>,
  timeslotIcons: { morning: '🌅', afternoon: '☀️', evening: '🌙' } as Record<string, string>,
} as const;

// ── 컨디션 관련 ───────────────────────────────────────────
export const MENTAL_LABELS = {
  scores: {
    1: '회복이 필요한 상태',  // 참여 준비도: Recovery
    2: '안정을 찾는 상태',    // 참여 준비도: Stabilizing
    3: '참여 준비 상태',      // 참여 준비도: Ready
    4: '활발한 참여 상태',    // 참여 준비도: Engaged
    5: '최적 참여 상태',      // 참여 준비도: Optimal
  },
  sectionTitle: '오늘의 에너지 체크',    // ← "컨디션 기록"
  radarTitle:   '나의 에너지 지도',      // ← "오늘의 상태"
  inputTitle:   '에너지 레벨 입력',      // ← "점수 입력"
  noteTitle:    '오늘의 발견',           // ← "오늘의 한 줄 기록"
  notePlaceholder: '오늘 나에게 일어난 좋은 일, 배운 것, 느낀 감사함을 적어보세요...',
  trendTitle:   '7일 에너지 흐름',       // ← "7일 트렌드"
  saveBtn:      '오늘 에너지 저장',
  savedBtn:     '저장 완료! ✓',
} as const;

// ── 대시보드 관련 ─────────────────────────────────────────
export const DASH_LABELS = {
  integrityTitle: 'TODAY\'S MOMENTUM',   // ← "Total System Integrity"
  integritySub:   '오늘의 참여 에너지',  // ← "전체 시스템 흐름"
  integrityLevels: (v: number) => {
    if (v >= 80) return '완벽한 흐름 🚀';
    if (v >= 60) return '좋은 흐름 💪';
    if (v >= 40) return '꾸준히 나아가는 중 🌱';
    if (v >= 20) return '오늘도 움직이고 있어요 👣';
    return '오늘의 시작을 응원해요 🌤';
  },
  yearChartTitle: 'GROWTH JOURNEY',      // ← "1 YEAR DASHBOARD"
  yearChartSub:   '나의 성장 여정',
  archiveTitle:   'ARCHIVE — 쌓여가는 기록',
  habitStatLabel:   '루틴 참여',          // ← "오늘 습관"
  taskStatLabel:    '업무 진행',          // ← "업무 완료"
  mentalStatLabel:  '에너지',            // ← "컨디션"
  streakStatLabel:  '연속 참여',         // ← "연속 달성"
  mentalRecorded:   '기록됨 ✓',
  mentalNotYet:     '오늘 기록해볼까요?',
} as const;

// ── 아카이브 관련 ─────────────────────────────────────────
export const ARCHIVE_LABELS = {
  pageTitle:    '기록 보관함',            // 탭 명칭 '기록'으로 통일
  countSub:     (n: number) => `${n}개의 기록이 쌓였어요`,
  emptyTitle:   '아직 비어있어요',
  emptyDesc:    '매일의 배움과 발견을 여기에 기록해보세요',
  searchPlaceholder: '기록 검색...',
  addBtn:       '기록하기',
  modalTitle:   '오늘의 기록',            // 탭 명칭 '기록'으로 통일
  contentPlaceholder: '오늘 배운 것, 느낀 것, 기억하고 싶은 것을 자유롭게 적어보세요...',
} as const;

// ── MOHO 관련 ─────────────────────────────────────────────
export const MOHO_LABELS = {
  // Volition: 역할 태그
  roles: {
    researcher: '🔬 연구자',
    clinician:  '🏥 임상가',
    learner:    '📚 학습자',
    health:     '💪 건강인',
    social:     '🤝 사회인',
    creator:    '✍️ 창작자',
  } as const,

  // Habituation: 루틴 시간대
  routineSlots: {
    morning:   '🌅 오전',
    afternoon: '☀️ 오후',
    evening:   '🌙 저녁',
    flexible:  '🔄 자유',
  } as const,

  // Performance: 수행 후 기록
  performance: {
    energy:              '⚡ 수행 후 에너지',
    satisfaction:        '★ 만족도',
    inputTitle:          '수행 소감',
    energyPlaceholder:   '얼마나 에너지가 올랐나요?',
    savBtn:              '저장',
  } as const,

  // 섹션 타이틀
  volitionTitle:     'VOLITION — 나의 역할',
  habituationTitle:  'HABITUATION — 루틴 흐름',
  performanceTitle:  'PERFORMANCE — 수행 에너지',
} as const;

// ── 달성률 → 메시지 변환 헬퍼 ───────────────────────────────
export function getRateMessage(rate: number): string {
  if (rate >= 100) return STATUS_LABELS.rate100;
  if (rate >= 80)  return STATUS_LABELS.rate80;
  if (rate >= 60)  return STATUS_LABELS.rate60;
  if (rate >= 40)  return STATUS_LABELS.rate40;
  if (rate >= 1)   return STATUS_LABELS.rate20;
  return STATUS_LABELS.rate0;
}

// ── 연속 달성 메시지 ────────────────────────────────────────
export function getStreakMessage(streak: number): string {
  if (streak >= 30) return `${streak}일 연속 참여 🏆`;
  if (streak >= 14) return `${streak}일 연속 참여 🔥`;
  if (streak >= 7)  return `${streak}일 연속 참여 ⚡`;
  if (streak >= 1)  return `${streak}일 연속 참여 ✨`;
  return HABIT_LABELS.streakZero;
}
