'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Check, Trash2, X, ChevronDown, ChevronUp, Folder, FolderPlus } from 'lucide-react';
import { newId, taskStore, projectStore } from '@/lib/storage';
import { Task, Priority, TimeSlot, Project, ProjectScope, LifeRole } from '@/types';
import { Button, EmptyState } from '@/components/ui';
import { TODAY, cn } from '@/lib/utils';
import { TASK_LABELS, getRateMessage } from '@/lib/strengthLanguage';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// ── 정체성 역할 태그 (업무 분류용) ───────────────────────────
const ROLE_TAGS: { key: LifeRole; label: string; emoji: string; color: string }[] = [
  { key: 'therapist',  label: '작업치료사', emoji: '🩺', color: '#4a7c59' },
  { key: 'leader',     label: '팀장',       emoji: '🧭', color: '#2c4a7c' },
  { key: 'researcher', label: '연구자',     emoji: '🔬', color: '#7c3aed' },
  { key: 'developer',  label: '개발자',     emoji: '💻', color: '#0891b2' },
  { key: 'father',     label: '아버지',     emoji: '👨‍👧', color: '#d97706' },
  { key: 'believer',   label: '신앙인',     emoji: '🙏', color: '#be185d' },
];
type RoleTagDef = { key: LifeRole; label: string; emoji: string; color: string };
const ROLE_MAP = Object.fromEntries(ROLE_TAGS.map(r => [r.key, r])) as Record<LifeRole, RoleTagDef>;

// ── 역할 태그 칩 (다중 선택) ─────────────────────────────────
function RoleTagChip({ role, selected, onClick }: {
  role: { key: LifeRole; label: string; emoji: string; color: string };
  selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border flex items-center gap-1"
      style={{
        fontFamily: 'Pretendard, sans-serif',
        background: selected ? role.color : 'var(--sage-pale)',
        color: selected ? 'white' : 'var(--text-secondary)',
        borderColor: selected ? role.color : 'var(--border)',
      }}>
      <span>{role.emoji}</span>{role.label}
    </button>
  );
}

const PROJECT_COLORS = ['#4a7c59', '#2c4a7c', '#7c4a2c', '#7c2c5a', '#2c7c6e', '#6e2c7c'];

const SCOPE_LABELS: Record<ProjectScope, string> = { weekly: '주간', monthly: '월간' };

// ── Project progress helper ──────────────────────────────────
function getProgress(projectId: string, tasks: Task[]): number {
  const pts = tasks.filter(t => t.projectId === projectId);
  if (!pts.length) return 0;
  return Math.round(pts.filter(t => t.completed).length / pts.length * 100);
}

// ── Add Project Modal ────────────────────────────────────────
function AddProjectModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<ProjectScope>('weekly');
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const submit = async () => {
    if (!title.trim() || !endDate) return;
    await projectStore.add({
      id: newId(), title: title.trim(), scope, startDate, endDate,
      status: 'active', color, roles: [], createdAt: TODAY,
    });
    await onAdd();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ fontFamily: 'Noto Serif KR, serif', color: 'var(--text-primary)' }}>
            프로젝트 추가
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>프로젝트명</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 논문 3장 작성"
              className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>기간 단위</label>
            <div className="grid grid-cols-2 gap-2">
              {(['weekly', 'monthly'] as ProjectScope[]).map(s => (
                <button key={s} onClick={() => setScope(s)}
                  className="py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    background: scope === s ? 'var(--sage-light)' : 'white',
                    color: scope === s ? 'var(--sage)' : 'var(--text-muted)',
                    borderColor: scope === s ? 'var(--sage)' : 'var(--border)',
                  }}>
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>시작일</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none"
                style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>종료일</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs focus:outline-none"
                style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>색상</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: color === c ? '#1c1f2e' : 'transparent' }} />
              ))}
            </div>
          </div>
          <Button onClick={submit} className="w-full" size="lg" disabled={!title.trim() || !endDate}>추가하기</Button>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Modal ───────────────────────────────────────────
function AddModal({
  onClose, onAdd, projects,
}: { onClose: () => void; onAdd: () => Promise<void>; projects: Project[] }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [projectId, setProjectId] = useState<string>('');
  const [roles, setRoles] = useState<LifeRole[]>([]);

  const toggleRole = (key: LifeRole) =>
    setRoles(prev => prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]);

  const submit = async () => {
    if (!title.trim()) return;
    await taskStore.add({
      id: newId(), title: title.trim(), priority, timeSlot, date: TODAY,
      completed: false, createdAt: TODAY,
      projectId: projectId || undefined,
      roles,
    });
    await onAdd();
    onClose();
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

          {/* 역할 태그 (선택, 다중) */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
              역할 태그 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(선택 · 복수 가능)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_TAGS.map(role => (
                <RoleTagChip key={role.key} role={role}
                  selected={roles.includes(role.key)} onClick={() => toggleRole(role.key)} />
              ))}
            </div>
          </div>

          {/* 프로젝트 연결 */}
          {projects.length > 0 && (
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>프로젝트 연결 (선택)</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', color: 'var(--text-primary)' }}>
                <option value="">— 독립형 (프로젝트 없음)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>집중도</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className="py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    background: priority === p ? 'var(--sage-light)' : 'white',
                    color: priority === p ? 'var(--sage)' : 'var(--text-muted)',
                    borderColor: priority === p ? 'var(--sage)' : 'var(--border)',
                  }}>
                  {TASK_LABELS.priorities[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>시간대</label>
            <div className="grid grid-cols-3 gap-2">
              {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map(t => (
                <button key={t} onClick={() => setTimeSlot(t)}
                  className="py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={{
                    fontFamily: 'Pretendard, sans-serif',
                    background: timeSlot === t ? 'var(--sage-light)' : 'white',
                    color: timeSlot === t ? 'var(--sage)' : 'var(--text-muted)',
                    borderColor: timeSlot === t ? 'var(--sage)' : 'var(--border)',
                  }}>
                  {TASK_LABELS.timeslotIcons[t]} {TASK_LABELS.timeslots[t]}
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

// ── Weekly Project Banner ────────────────────────────────────
function WeeklyProjectBanner({
  projects, tasks, onRefreshProjects,
}: {
  projects: Project[];
  tasks: Task[];
  onRefreshProjects: () => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const markDone = async (p: Project) => {
    await projectStore.update(p.id, { status: 'done' });
    await onRefreshProjects();
  };

  const deleteProject = async (p: Project) => {
    await projectStore.delete(p.id);
    await onRefreshProjects();
  };

  if (projects.length === 0 && !showAddProject) {
    return (
      <div className="card overflow-hidden">
        <div className="sheet-header-navy flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Folder size={12} />프로젝트</span>
        </div>
        <div className="p-3 flex items-center justify-between">
          <span className="text-[12px]" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
            진행 중인 프로젝트가 없습니다
          </span>
          <button onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
            style={{ color: 'var(--navy)', background: 'var(--navy-light)', fontFamily: 'Pretendard, sans-serif' }}>
            <FolderPlus size={11} /> 추가
          </button>
        </div>
        {showAddProject && <AddProjectModal onClose={() => setShowAddProject(false)} onAdd={onRefreshProjects} />}
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="sheet-header-navy flex items-center justify-between" style={{ cursor: 'pointer' }}
          onClick={() => setCollapsed(c => !c)}>
          <span className="flex items-center gap-1.5">
            <Folder size={12} />
            프로젝트 현황
            <span className="text-[10px] opacity-75">({projects.length})</span>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); setShowAddProject(true); }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded transition-all"
              style={{ color: 'white', background: 'rgba(255,255,255,0.2)' }}>
              <FolderPlus size={10} /> 추가
            </button>
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </div>
        </div>

        {!collapsed && (
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {projects.map(p => {
              const progress = getProgress(p.id, tasks);
              return (
                <div key={p.id} className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
                        {p.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                        style={{ background: 'var(--navy-light)', color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>
                        {SCOPE_LABELS[p.scope]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <span className="text-[11px] font-bold" style={{ color: p.color, fontFamily: 'Pretendard, sans-serif' }}>{progress}%</span>
                      {progress === 100 ? (
                        <button onClick={() => markDone(p)}
                          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ background: 'var(--sage-light)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                          완료 처리
                        </button>
                      ) : (
                        <button onClick={() => deleteProject(p)}
                          className="w-5 h-5 flex items-center justify-center rounded opacity-40 hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 진행률 바 */}
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, background: p.color }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                    {p.startDate} ~ {p.endDate}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddProject && (
        <AddProjectModal onClose={() => setShowAddProject(false)} onAdd={onRefreshProjects} />
      )}
    </>
  );
}

// ── Main TaskPage ────────────────────────────────────────────
export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const [t, p] = await Promise.all([taskStore.getByDate(TODAY), projectStore.getActive()]);
    setTasks(t);
    setProjects(p);
  }, []);
  const refreshProjects = useCallback(async () => {
    setProjects(await projectStore.getActive());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (id: string) => {
    const t = tasks.find(t => t.id === id);
    if (t) { await taskStore.update(id, { completed: !t.completed }); await refresh(); }
  };
  const remove = async (id: string) => { await taskStore.delete(id); await refresh(); };
  const saveMemo = async (id: string) => {
    await taskStore.update(id, { incompleteReason: memos[id] });
    setExpandedId(null);
  };

  // 프로젝트 ID → Project 맵
  const projectMap = useMemo(() => {
    const m: Record<string, Project> = {};
    projects.forEach(p => { m[p.id] = p; });
    return m;
  }, [projects]);

  const { bySlot, completedCount } = useMemo(() => {
    const bySlot: Record<TimeSlot, Task[]> = {
      morning:   tasks.filter(t => t.timeSlot === 'morning').sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
      afternoon: tasks.filter(t => t.timeSlot === 'afternoon').sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
      evening:   tasks.filter(t => t.timeSlot === 'evening').sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    };
    return { bySlot, completedCount: tasks.filter(t => t.completed).length };
  }, [tasks]);

  const rate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const inProgress = tasks.filter(t => !t.completed).length;

  // 역할별 오늘 참여 통계 (역할 태그가 달린 업무만 집계)
  const roleStats = useMemo(() => {
    return ROLE_TAGS.map(role => {
      const roleTasks = tasks.filter(t => t.roles?.includes(role.key));
      if (!roleTasks.length) return null;
      const done = roleTasks.filter(t => t.completed).length;
      return { role, total: roleTasks.length, done, rate: Math.round((done / roleTasks.length) * 100) };
    }).filter(Boolean) as { role: typeof ROLE_TAGS[number]; total: number; done: number; rate: number }[];
  }, [tasks]);

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

      {/* ── 프로젝트 배너 ── */}
      <WeeklyProjectBanner
        projects={projects}
        tasks={tasks}
        onRefreshProjects={refreshProjects}
      />

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
                ['진행 중', inProgress, 'var(--navy)'],
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

      {/* ── 역할별 오늘 참여 ── */}
      {roleStats.length > 0 && (
        <div className="card overflow-hidden">
          <div className="sheet-header-navy">역할별 오늘 참여</div>
          <div className="p-3 space-y-2.5">
            {roleStats.map(({ role, total, done, rate }) => (
              <div key={role.key}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                    <span>{role.emoji}</span>{role.label}
                    <span className="ml-0.5 font-normal text-[10px]" style={{ color: 'var(--text-muted)' }}>({done}/{total})</span>
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: role.color, fontFamily: 'Pretendard, sans-serif' }}>{rate}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${rate}%`, background: role.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon="🌱" title={TASK_LABELS.noTasks}
          description={TASK_LABELS.addFirst}
          action={<Button onClick={() => setShowAdd(true)} size="sm">오늘의 도전 시작하기 ✨</Button>} />
      ) : (
        (['morning', 'afternoon', 'evening'] as TimeSlot[]).map(slot => {
          const slotTasks = bySlot[slot];
          if (!slotTasks.length) return null;
          const slotDone = slotTasks.filter(t => t.completed).length;
          return (
            <div key={slot}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{TASK_LABELS.timeslotIcons[slot]}</span>
                <span className="text-[12px] font-bold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                  {TASK_LABELS.timeslots[slot]}
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
                    {slotTasks.map(task => {
                      const proj = task.projectId ? projectMap[task.projectId] : undefined;
                      return (
                        <React.Fragment key={task.id}>
                          <tr style={{ opacity: task.completed ? 0.55 : 1 }}>
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
                            <td style={{ fontFamily: 'Pretendard, sans-serif', fontSize: 12, color: 'var(--text-primary)' }}>
                              <div className={cn('flex items-center gap-1.5', task.completed ? 'line-through' : '')}>
                                {/* 프로젝트 컬러 배지 */}
                                {proj && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                                    style={{
                                      background: proj.color + '22',
                                      color: proj.color,
                                      border: `1px solid ${proj.color}44`,
                                      fontFamily: 'Pretendard, sans-serif',
                                    }}>
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: proj.color }} />
                                    {proj.title.length > 6 ? proj.title.slice(0, 6) + '…' : proj.title}
                                  </span>
                                )}
                                <span>{task.title}</span>
                                {task.roles?.map(rk => {
                                  const r = ROLE_MAP[rk];
                                  if (!r) return null;
                                  return (
                                    <span key={rk} title={r.label}
                                      className="text-[10px] flex-shrink-0">{r.emoji}</span>
                                  );
                                })}
                              </div>
                            </td>
                            <td>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                style={{
                                  fontFamily: 'Pretendard, sans-serif',
                                  background: task.priority === 'high' ? 'var(--sage-light)' : task.priority === 'medium' ? 'var(--navy-light)' : 'var(--border-light)',
                                  color: task.priority === 'high' ? 'var(--sage)' : task.priority === 'medium' ? 'var(--navy)' : 'var(--text-muted)',
                                }}>
                                {TASK_LABELS.priorities[task.priority]}
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

                          {expandedId === task.id && (
                            <tr>
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
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      <div className="h-4" />
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={refresh} projects={projects} />}
    </div>
  );
}
