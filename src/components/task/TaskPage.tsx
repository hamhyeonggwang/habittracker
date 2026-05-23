'use client';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Check, Trash2, X, ChevronDown } from 'lucide-react';
import { newId, taskStore } from '@/lib/storage';
import { Task, Priority, TimeSlot } from '@/types';
import { Button, EmptyState } from '@/components/ui';
import { TODAY, cn } from '@/lib/utils';
import { TASK_LABELS, getRateMessage } from '@/lib/strengthLanguage';

// 강점 기반 우선순위 레이블
const PRIORITY_LABELS: Record<Priority, string> = {
  high: '핵심',    // ← "높음"
  medium: '일반',  // ← "보통"
  low: '여유',     // ← "낮음"
};
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const TIMESLOT_LABELS: Record<TimeSlot, string> = { morning: '오전', afternoon: '오후', evening: '저녁' };
const TIMESLOT_ICONS: Record<TimeSlot, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');

  const submit = () => {
    if (!title.trim()) return;
    taskStore.add({ id: newId(), title: title.trim(), priority, timeSlot, date: TODAY, completed: false, createdAt: TODAY });
    onAdd(); onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ fontFamily: 'Noto Serif KR, serif', color: 'var(--text-primary)' }}>오늘의 도전 추가</h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>업무명</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="오늘 도전할 일을 입력하세요"
              className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>집중도</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high','medium','low'] as Priority[]).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className="py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    background: priority === p ? 'var(--sage-light)' : 'white',
                    color: priority === p ? 'var(--sage)' : 'var(--text-muted)',
                    borderColor: priority === p ? 'var(--sage)' : 'var(--border)',
                  }}>
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>시간대</label>
            <div className="grid grid-cols-3 gap-2">
              {(['morning','afternoon','evening'] as TimeSlot[]).map(t => (
                <button key={t} onClick={() => setTimeSlot(t)}
                  className="py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    background: timeSlot === t ? 'var(--sage-light)' : 'white',
                    color: timeSlot === t ? 'var(--sage)' : 'var(--text-muted)',
                    borderColor: timeSlot === t ? 'var(--sage)' : 'var(--border)',
                  }}>
                  {TIMESLOT_ICONS[t]} {TIMESLOT_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={submit} className="w-full" size="lg">추가하기</Button>
        </div>
      </div>
    </div>
  );
}

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>(() => taskStore.getByDate(TODAY));
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, string>>({});

  const refresh = useCallback(() => setTasks(taskStore.getByDate(TODAY)), []);
  const toggle = (id: string) => {
    const t = tasks.find(t => t.id === id);
    if (t) { taskStore.update(id, { completed: !t.completed }); refresh(); }
  };
  const remove = (id: string) => { taskStore.delete(id); refresh(); };
  const saveMemo = (id: string) => {
    taskStore.update(id, { incompleteReason: memos[id] });
    setExpandedId(null);
  };

  const { bySlot, completedCount } = useMemo(() => {
    const bySlot: Record<TimeSlot, Task[]> = {
      morning:   tasks.filter(t => t.timeSlot === 'morning').sort((a,b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
      afternoon: tasks.filter(t => t.timeSlot === 'afternoon').sort((a,b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
      evening:   tasks.filter(t => t.timeSlot === 'evening').sort((a,b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    };
    return { bySlot, completedCount: tasks.filter(t => t.completed).length };
  }, [tasks]);

  const rate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const inProgress = tasks.filter(t => !t.completed).length;

  return (
    <div className="page-enter space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>오늘의 업무</h1>
          <p className="text-[12px] mt-0.5 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            {tasks.length > 0
              ? TASK_LABELS.summaryDone(completedCount, tasks.length)
              : TASK_LABELS.noTasks}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus size={13} className="inline mr-1" />추가</Button>
      </div>

      {/* ── 진행 현황 ── */}
      {tasks.length > 0 && (
        <div className="card overflow-hidden">
          <div className="sheet-header flex items-center justify-between">
            <span>DAILY TASK</span>
            <span className="text-[11px] font-semibold opacity-90">{getRateMessage(rate)}</span>
          </div>
          <div className="p-3">
            <div className="w-full rounded-full overflow-hidden mb-3" style={{ height: 8, background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${rate}%`, background: 'var(--sage)' }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['완료', completedCount, 'var(--sage)'],
                ['진행 중', inProgress, 'var(--navy)'],           // ← "미완료" → "진행 중"
                ['전체', tasks.length, 'var(--text-secondary)'],
              ].map(([label, val, color]) => (
                <div key={label as string} className="rounded-lg p-2" style={{ background: 'var(--sage-pale)' }}>
                  <p className="text-[10px] font-bold mb-0.5" style={{ color: color as string, fontFamily: 'Pretendard, sans-serif' }}>{label as string}</p>
                  <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{val as number}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon="🌱" title={TASK_LABELS.noTasks}
          description={TASK_LABELS.addFirst}
          action={<Button onClick={() => setShowAdd(true)} size="sm">오늘의 도전 시작하기 ✨</Button>} />
      ) : (
        (['morning','afternoon','evening'] as TimeSlot[]).map(slot => {
          const slotTasks = bySlot[slot];
          if (!slotTasks.length) return null;
          const slotDone = slotTasks.filter(t => t.completed).length;
          return (
            <div key={slot}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{TIMESLOT_ICONS[slot]}</span>
                <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                  {TIMESLOT_LABELS[slot]}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[11px]" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                  {slotDone}/{slotTasks.length} 완료
                </span>
              </div>

              <div className="card overflow-hidden mb-3">
                <table className="sheet-table w-full">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>✓</th>
                      <th>업무</th>
                      <th style={{ width: 44 }}>집중도</th>
                      <th style={{ width: 32 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotTasks.map(task => (
                      <>
                        <tr key={task.id} style={{ opacity: task.completed ? 0.55 : 1 }}>
                          <td>
                            <button onClick={() => toggle(task.id)}
                              className="w-5 h-5 rounded flex items-center justify-center transition-all"
                              style={{
                                background: task.completed ? 'var(--sage)' : 'white',
                                border: `1.5px solid ${task.completed ? 'var(--sage)' : 'var(--border)'}`,
                              }}>
                              {task.completed && <Check size={11} color="white" strokeWidth={3} />}
                            </button>
                          </td>
                          <td className={task.completed ? 'line-through' : ''}
                            style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 12, color: 'var(--text-primary)' }}>
                            {task.title}
                          </td>
                          <td>
                            {/* 강점 기반: 집중도 색상 모두 녹색 계열 */}
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                              style={{
                                fontFamily: 'Pretendard, sans-serif',
                                background: task.priority === 'high' ? 'var(--sage-light)' : task.priority === 'medium' ? 'var(--navy-light)' : 'var(--border-light)',
                                color: task.priority === 'high' ? 'var(--sage)' : task.priority === 'medium' ? 'var(--navy)' : 'var(--text-muted)',
                              }}>
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1 justify-end">
                              {!task.completed && (
                                <button onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                                  className="w-5 h-5 rounded flex items-center justify-center"
                                  style={{ color: 'var(--text-muted)' }}>
                                  <ChevronDown size={12} className={cn('transition-transform', expandedId === task.id ? 'rotate-180' : '')} />
                                </button>
                              )}
                              <button onClick={() => remove(task.id)}
                                className="w-5 h-5 rounded flex items-center justify-center"
                                style={{ color: 'var(--text-muted)' }}>
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* 상황 메모 (← "미완료 사유") */}
                        {expandedId === task.id && (
                          <tr key={`${task.id}-memo`}>
                            <td colSpan={4} className="py-2 px-2" style={{ background: 'var(--sage-pale)' }}>
                              <p className="text-[10px] mb-1.5 font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                                {TASK_LABELS.reasonLabel}
                              </p>
                              <div className="flex gap-2">
                                <input
                                  value={memos[task.id] ?? task.incompleteReason ?? ''}
                                  onChange={e => setMemos(m => ({ ...m, [task.id]: e.target.value }))}
                                  placeholder={TASK_LABELS.reasonPlaceholder}
                                  className="flex-1 px-2 py-1 rounded border text-[11px] focus:outline-none"
                                  style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
                                <Button onClick={() => saveMemo(task.id)} size="sm" variant="secondary">저장</Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      <div className="h-4" />
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={refresh} />}
    </div>
  );
}
