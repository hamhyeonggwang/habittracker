'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Check, Trash2, X, ChevronDown, ChevronUp, Folder, FolderPlus } from 'lucide-react';
import { newId, taskStore, projectStore } from '@/lib/storage';
import { Task, Priority, TimeSlot, Project, ProjectScope, LifeRoleDef } from '@/types';
import { Button, EmptyState } from '@/components/ui';
import { getToday, cn } from '@/lib/utils';
import { useToday } from '@/lib/useToday';
import { TASK_LABELS, getRateMessage } from '@/lib/strengthLanguage';
import { useLifeRoles } from '@/lib/useLifeRoles';
import RoleManager from '@/components/roles/RoleManager';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// ── 역할 태그 칩 (다중 선택) ─────────────────────────────────
function RoleTagChip({ role, selected, onClick }: {
  role: LifeRoleDef;
  selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1"
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
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  const submit = async () => {
    if (!title.trim() || !endDate) return;
    await projectStore.add({
      id: newId(), title: title.trim(), scope, startDate, endDate,
      status: 'active', color, roles: [], createdAt: getToday(),
    });
    await onAdd();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Pretendard, sans-serif', color: 'var(--text-primary)' }}>
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
  onClose, onAdd, projects, availableRoles, onManageRoles,
}: { onClose: () => void; onAdd: () => Promise<void>; projects: Project[]; availableRoles: LifeRoleDef[]; onManageRoles: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [projectId, setProjectId] = useState<string>('');
  const [roles, setRoles] = useState<string[]>([]);

  const toggleRole = (id: string) =>
    setRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const submit = async () => {
    if (!title.trim()) return;
    await taskStore.add({
      id: newId(), title: title.trim(), priority, timeSlot, date: getToday(),
      completed: false, createdAt: getToday(),
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
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Pretendard, sans-serif', color: 'var(--text-primary)' }}>오늘의 도전 추가</h3>
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
            <div className="flex flex-wrap gap-1.5 items-center">
              {availableRoles.map(role => (
                <RoleTagChip key={role.id} role={role}
                  selected={roles.includes(role.id)} onClick={() => toggleRole(role.id)} />
              ))}
              <button type="button" onClick={onManageRoles}
                className="min-h-[36px] px-2.5 py-1 rounded-full text-xs font-semibold border border-dashed"
                style={{ color: 'var(--sage)', borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }}>
                + 역할 관리
              </button>
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
            className="min-h-[36px] flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
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
            <span className="text-xs opacity-75">({projects.length})</span>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={e => { e.stopPropagation(); setShowAddProject(true); }}
              className="min-h-[32px] flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-all"
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
                      <span className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0"
                        style={{ background: 'var(--navy-light)', color: 'var(--navy)', fontFamily: 'Pretendard, sans-serif' }}>
                        {SCOPE_LABELS[p.scope]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <span className="text-xs font-bold" style={{ color: p.color, fontFamily: 'Pretendard, sans-serif' }}>{progress}%</span>
                      {progress === 100 ? (
                        <button onClick={() => markDone(p)}
                          className="min-h-[32px] text-xs px-2 py-1 rounded-lg font-semibold"
                          style={{ background: 'var(--sage-light)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                          완료 처리
                        </button>
                      ) : (
                        <button onClick={() => deleteProject(p)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg opacity-60 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
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
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
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
  const [showRoleManager, setShowRoleManager] = useState(false);
  const today = useToday();
  const { roles: lifeRoles, roleMap, refresh: refreshRoles } = useLifeRoles();

  const refresh = useCallback(async () => {
    const [t, p] = await Promise.all([taskStore.getByDate(today), projectStore.getActive()]);
    setTasks(t);
    setProjects(p);
  }, [today]);
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
    return lifeRoles.map(role => {
      const roleTasks = tasks.filter(t => t.roles?.includes(role.id));
      if (!roleTasks.length) return null;
      const done = roleTasks.filter(t => t.completed).length;
      return { role, total: roleTasks.length, done, rate: Math.round((done / roleTasks.length) * 100) };
    }).filter(Boolean) as { role: LifeRoleDef; total: number; done: number; rate: number }[];
  }, [tasks, lifeRoles]);

  return (
    <div className="page-enter space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>오늘의 업무</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            {tasks.length > 0
              ? TASK_LABELS.summaryDone(completedCount, tasks.length)
              : TASK_LABELS.noTasks}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="min-h-[40px]"><Plus size={15} className="inline mr-1" />추가</Button>
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
            <span className="text-xs font-semibold opacity-90">{getRateMessage(rate)}</span>
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
                  <p className="text-xs font-bold mb-0.5" style={{ color: color as string, fontFamily: 'Pretendard, sans-serif' }}>{label as string}</p>
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
              <div key={role.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                    <span>{role.emoji}</span>{role.label}
                    <span className="ml-0.5 font-normal text-xs" style={{ color: 'var(--text-muted)' }}>({done}/{total})</span>
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
        <EmptyState icon="" title={TASK_LABELS.noTasks}
          description={TASK_LABELS.addFirst}
          action={<Button onClick={() => setShowAdd(true)} size="sm">오늘의 도전 시작하기</Button>} />
      ) : (
        (['morning', 'afternoon', 'evening'] as TimeSlot[]).map(slot => {
          const slotTasks = bySlot[slot];
          if (!slotTasks.length) return null;
          const slotDone = slotTasks.filter(t => t.completed).length;
          return (
            <div key={slot}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{TASK_LABELS.timeslotIcons[slot]}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                  {TASK_LABELS.timeslots[slot]}
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                  {slotDone}/{slotTasks.length} 완료
                </span>
              </div>

              <div className="space-y-2.5 mb-3">
                {slotTasks.map(task => {
                  const proj = task.projectId ? projectMap[task.projectId] : undefined;
                  const expanded = expandedId === task.id;
                  const priorityStyle = {
                    background: task.priority === 'high' ? 'var(--sage-light)' : task.priority === 'medium' ? 'var(--navy-light)' : 'var(--border-light)',
                    color: task.priority === 'high' ? 'var(--sage)' : task.priority === 'medium' ? 'var(--navy)' : 'var(--text-muted)',
                  };

                  return (
                    <div key={task.id} className="card p-3.5" style={{ opacity: task.completed ? 0.65 : 1 }}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggle(task.id)}
                          aria-label={task.completed ? '업무 미완료로 변경' : '업무 완료'}
                          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                          style={{
                            background: task.completed ? 'var(--sage)' : 'white',
                            border: `1.5px solid ${task.completed ? 'var(--sage)' : 'var(--border)'}`,
                          }}>
                          {task.completed && <Check size={18} color="white" strokeWidth={3} />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-sm font-bold leading-relaxed', task.completed ? 'line-through' : '')}
                              style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
                              {task.title}
                            </p>
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0"
                              style={{ ...priorityStyle, fontFamily: 'Pretendard, sans-serif' }}>
                              {TASK_LABELS.priorities[task.priority]}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {proj && (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                                style={{
                                  background: proj.color + '22',
                                  color: proj.color,
                                  border: `1px solid ${proj.color}44`,
                                  fontFamily: 'Pretendard, sans-serif',
                                }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: proj.color }} />
                                {proj.title}
                              </span>
                            )}
                            {task.roles?.map(rk => {
                              const r = roleMap[rk];
                              if (!r) return null;
                              return (
                                <span key={rk} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                                  style={{ background: 'var(--sage-pale)', color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                                  <span>{r.emoji}</span>{r.label}
                                </span>
                              );
                            })}
                          </div>

                          {task.incompleteReason && !expanded && (
                            <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                              {TASK_LABELS.reasonLabel}: {task.incompleteReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                        {!task.completed && (
                          <button onClick={() => setExpandedId(expanded ? null : task.id)}
                            className="min-h-[40px] px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                            style={{ color: 'var(--text-secondary)', background: 'var(--sage-pale)', fontFamily: 'Pretendard, sans-serif' }}>
                            {TASK_LABELS.reasonLabel}
                            <ChevronDown size={14} className={cn('transition-transform', expanded ? 'rotate-180' : '')} />
                          </button>
                        )}
                        <button onClick={() => remove(task.id)}
                          className="min-h-[40px] px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                          style={{ color: '#b02a2a', background: '#fdf2f2', fontFamily: 'Pretendard, sans-serif' }}>
                          <Trash2 size={14} /> 삭제
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-3 rounded-xl p-3" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border-light)' }}>
                          <p className="text-xs mb-2 font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                            {TASK_LABELS.reasonLabel}
                          </p>
                          <div className="flex gap-2">
                            <input
                              value={memos[task.id] ?? task.incompleteReason ?? ''}
                              onChange={e => setMemos(m => ({ ...m, [task.id]: e.target.value }))}
                              placeholder={TASK_LABELS.reasonPlaceholder}
                              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
                            <Button onClick={() => saveMemo(task.id)} size="sm" variant="secondary" className="min-h-[44px]">저장</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      <div className="h-4" />
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)} onAdd={refresh} projects={projects}
          availableRoles={lifeRoles} onManageRoles={() => setShowRoleManager(true)}
        />
      )}
      {showRoleManager && (
        <RoleManager onClose={() => setShowRoleManager(false)} onChange={refreshRoles} />
      )}
    </div>
  );
}
