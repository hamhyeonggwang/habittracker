'use client';
import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Check, X, Pencil } from 'lucide-react';
import { LifeRoleDef } from '@/types';
import { lifeRoleStore, newId } from '@/lib/storage';
import { ROLE_SUGGESTIONS, ROLE_EMOJIS, ROLE_COLORS } from '@/lib/roles';
import { useLifeRoles } from '@/lib/useLifeRoles';
import { confirmDialog } from '@/lib/confirm';
import { getToday } from '@/lib/utils';

export default function RoleManager({ onClose, onChange }: { onClose: () => void; onChange?: () => void }) {
  const { roles, refresh } = useLifeRoles();

  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState(ROLE_EMOJIS[0]);
  const [newColor, setNewColor] = useState(ROLE_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const reload = async () => { await refresh(); onChange?.(); };

  const addRole = async (label: string, emoji: string, color: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const role: LifeRoleDef = {
      id: newId(), label: trimmed, emoji, color,
      sortOrder: roles.length, createdAt: getToday(),
    };
    const r = await lifeRoleStore.add(role);
    if (r.ok) { setNewLabel(''); await reload(); }
  };

  const quickAddSuggestion = async (s: { label: string; emoji: string; color: string }) => {
    if (roles.some(r => r.label === s.label)) return;
    await addRole(s.label, s.emoji, s.color);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    const r = await lifeRoleStore.update(id, { label: editLabel.trim() });
    if (r.ok) { setEditingId(null); await reload(); }
  };

  const cycleEmoji = async (role: LifeRoleDef) => {
    const next = ROLE_EMOJIS[(ROLE_EMOJIS.indexOf(role.emoji) + 1) % ROLE_EMOJIS.length];
    if ((await lifeRoleStore.update(role.id, { emoji: next })).ok) await reload();
  };

  const cycleColor = async (role: LifeRoleDef) => {
    const next = ROLE_COLORS[(ROLE_COLORS.indexOf(role.color) + 1) % ROLE_COLORS.length];
    if ((await lifeRoleStore.update(role.id, { color: next })).ok) await reload();
  };

  const remove = async (id: string) => {
    const ok = await confirmDialog({
      title: '이 역할을 삭제할까요?',
      message: '연결된 습관·업무의 태그만 사라지고 기록은 유지됩니다.',
      confirmLabel: '삭제', danger: true,
    });
    if (!ok) return;
    if ((await lifeRoleStore.delete(id)).ok) await reload();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= roles.length) return;
    const a = roles[index], b = roles[target];
    await lifeRoleStore.update(a.id, { sortOrder: b.sortOrder });
    await lifeRoleStore.update(b.id, { sortOrder: a.sortOrder });
    await reload();
  };

  const unusedSuggestions = ROLE_SUGGESTIONS.filter(s => !roles.some(r => r.label === s.label));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ fontFamily: 'Noto Serif KR, serif', color: 'var(--text-primary)' }}>내 역할 관리</h3>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* 현재 역할 목록 */}
        <div className="space-y-1.5 mb-4">
          {roles.length === 0 && (
            <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>
              아직 역할이 없어요. 아래에서 추가해보세요.
            </p>
          )}
          {roles.map((role, i) => (
            <div key={role.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--sage-pale)' }}>
              <button type="button" onClick={() => cycleEmoji(role)} title="이모지 변경" className="text-lg flex-shrink-0">{role.emoji}</button>
              <button type="button" onClick={() => cycleColor(role)} title="색상 변경"
                className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: role.color }} />
              {editingId === role.id ? (
                <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(role.id); }}
                  className="flex-1 text-sm px-2 py-1 rounded border" style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
              ) : (
                <span className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>{role.label}</span>
              )}
              <div className="flex items-center gap-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {editingId === role.id ? (
                  <button type="button" onClick={() => saveEdit(role.id)} aria-label="저장"><Check size={15} /></button>
                ) : (
                  <button type="button" onClick={() => { setEditingId(role.id); setEditLabel(role.label); }} aria-label="이름 수정"><Pencil size={14} /></button>
                )}
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로" style={{ opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={15} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === roles.length - 1} aria-label="아래로" style={{ opacity: i === roles.length - 1 ? 0.3 : 1 }}><ChevronDown size={15} /></button>
                <button type="button" onClick={() => remove(role.id)} aria-label="삭제"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* 추천 역할 */}
        {unusedSuggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>추천 역할 (눌러서 추가)</p>
            <div className="flex flex-wrap gap-1.5">
              {unusedSuggestions.map(s => (
                <button key={s.label} type="button" onClick={() => quickAddSuggestion(s)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1"
                  style={{ background: 'var(--sage-pale)', color: 'var(--text-secondary)', borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }}>
                  <span>{s.emoji}</span>{s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 직접 추가 */}
        <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>직접 추가</p>
          <div className="flex items-center gap-1.5 mb-2">
            <button type="button" onClick={() => setNewEmoji(ROLE_EMOJIS[(ROLE_EMOJIS.indexOf(newEmoji) + 1) % ROLE_EMOJIS.length])}
              className="text-lg w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--sage-pale)' }} title="이모지">{newEmoji}</button>
            <button type="button" onClick={() => setNewColor(ROLE_COLORS[(ROLE_COLORS.indexOf(newColor) + 1) % ROLE_COLORS.length])}
              className="w-9 h-9 rounded-lg flex-shrink-0" style={{ background: newColor }} title="색상" />
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="역할 이름"
              onKeyDown={e => { if (e.key === 'Enter') addRole(newLabel, newEmoji, newColor); }}
              className="flex-1 text-sm px-2.5 py-2 rounded-lg border" style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
            <button type="button" onClick={() => addRole(newLabel, newEmoji, newColor)} disabled={!newLabel.trim()}
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              style={{ background: 'var(--sage)', color: 'white' }} aria-label="추가"><Plus size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
