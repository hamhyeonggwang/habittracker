'use client';
import { useState } from 'react';
import { X, Tag, FileText, LogOut, Trash2 } from 'lucide-react';
import { useSession } from '@/lib/useSession';
import { signOut, deleteAccount } from '@/lib/auth';
import { showToast } from '@/lib/toast';
import RoleManager from '@/components/roles/RoleManager';

export default function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { session } = useSession();
  const [showRoles, setShowRoles] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const ok1 = window.confirm('계정과 모든 데이터(습관·업무·컨디션·재무·역할 등)가 영구 삭제됩니다. 되돌릴 수 없습니다. 계속할까요?');
    if (!ok1) return;
    const ok2 = window.confirm('정말 삭제하시겠어요? 이 작업은 취소할 수 없습니다.');
    if (!ok2) return;
    setDeleting(true);
    const r = await deleteAccount();
    if (!r.ok) {
      setDeleting(false);
      showToast(`계정 삭제에 실패했어요. ${r.error ?? ''}`, 'error');
    }
    // 성공 시 세션이 사라지며 로그인 화면으로 전환됨(별도 처리 불필요)
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ fontFamily: 'Noto Serif KR, serif', color: 'var(--text-primary)' }}>설정</h3>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* 계정 */}
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--sage-pale)' }}>
          <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>로그인 계정</p>
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
            {session?.user.email ?? '회원'}
          </p>
        </div>

        {/* 메뉴 */}
        <div className="flex flex-col gap-1">
          <Row icon={<Tag size={16} />} label="내 역할 관리" onClick={() => setShowRoles(true)} />
          <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <Row icon={<FileText size={16} />} label="개인정보처리방침" />
          </a>
          <Row icon={<LogOut size={16} />} label="로그아웃" onClick={() => signOut()} />
        </div>

        {/* 위험 영역 */}
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: '#fdf2f2', color: '#b02a2a', fontFamily: 'Pretendard, sans-serif' }}>
            <Trash2 size={15} />
            {deleting ? '삭제 중…' : '계정 및 모든 데이터 삭제'}
          </button>
          <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>
            삭제 시 모든 기록이 영구히 사라지며 되돌릴 수 없습니다.
          </p>
        </div>
      </div>

      {showRoles && <RoleManager onClose={() => setShowRoles(false)} />}
    </div>
  );
}

function Row({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-2.5 py-2.5 px-1 text-sm font-medium"
      style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
      <span style={{ color: 'var(--sage)' }}>{icon}</span>{label}
    </button>
  );
}
