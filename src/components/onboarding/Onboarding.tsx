'use client';
import { useState } from 'react';
import { Home, Repeat, ListTodo, Activity, Archive } from 'lucide-react';
import { LifeRoleDef } from '@/types';
import { ROLE_SUGGESTIONS } from '@/lib/roles';
import { lifeRoleStore, habitStore, profileStore, newId } from '@/lib/storage';
import { getToday } from '@/lib/utils';

const HABIT_ICONS = ['🎯', '💧', '📖', '🏃', '🧘', '✍️', '🌱', '💊', '🙏', '🛏️'];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<LifeRoleDef[]>([]);
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState(HABIT_ICONS[0]);
  const [habitRoleId, setHabitRoleId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const toggleSuggestion = (s: typeof ROLE_SUGGESTIONS[number]) => {
    setRoles(prev => {
      const existing = prev.find(r => r.label === s.label);
      if (existing) return prev.filter(r => r.label !== s.label);
      return [...prev, { id: newId(), label: s.label, emoji: s.emoji, color: s.color, sortOrder: prev.length, createdAt: getToday() }];
    });
  };

  const finish = async (opts?: { skipAll?: boolean }) => {
    if (saving) return;
    setSaving(true);
    if (!opts?.skipAll) {
      for (const r of roles) await lifeRoleStore.add(r);
      if (habitName.trim()) {
        await habitStore.add({
          id: newId(), name: habitName.trim(), icon: habitIcon,
          color: roles.find(r => r.id === habitRoleId)?.color ?? '#4a7c59',
          targetDaysPerWeek: 7, createdAt: getToday(), isArchived: false,
          roles: habitRoleId ? [habitRoleId] : [], routineSlot: 'flexible',
        });
      }
    }
    await profileStore.completeOnboarding();
    onDone();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#ffffff', zIndex: 9000, overflowY: 'auto' }}>
      <div style={{ maxWidth: 460, margin: '0 auto', minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '24px 22px 28px' }}>
        {/* 건너뛰기 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 28 }}>
          {step < 3 && (
            <button type="button" onClick={() => finish({ skipAll: true })} disabled={saving}
              style={{ fontSize: 13, color: '#6e7a65', fontFamily: 'Pretendard, sans-serif', fontWeight: 600 }}>
              건너뛰기
            </button>
          )}
        </div>

        {/* 진행 점 */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '8px 0 28px' }}>
          {[0, 1, 2, 3].map(i => (
            <span key={i} style={{ width: i === step ? 22 : 7, height: 7, borderRadius: 99, background: i === step ? '#4a7c59' : '#dfe6da', transition: 'all .2s' }} />
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {step === 0 && <Welcome />}
          {step === 1 && <RolePick roles={roles} toggle={toggleSuggestion} />}
          {step === 2 && (
            <FirstHabit
              roles={roles}
              name={habitName} setName={setHabitName}
              icon={habitIcon} setIcon={setHabitIcon}
              roleId={habitRoleId} setRoleId={setHabitRoleId}
            />
          )}
          {step === 3 && <TabGuide />}
        </div>

        {/* 하단 버튼 */}
        <div style={{ marginTop: 24 }}>
          <button type="button" disabled={saving}
            onClick={() => (step < 3 ? setStep(step + 1) : finish())}
            style={{
              width: '100%', height: 52, borderRadius: 14, border: 'none',
              background: '#4a7c59', color: '#fff', fontFamily: 'Pretendard, sans-serif',
              fontWeight: 700, fontSize: 16, cursor: 'pointer', opacity: saving ? 0.6 : 1,
            }}>
            {step === 0 ? '시작하기' : step === 3 ? (saving ? '준비 중…' : 'OTD 시작하기') : '다음'}
          </button>
          {step === 2 && (
            <button type="button" onClick={() => setStep(3)} disabled={saving}
              style={{ width: '100%', marginTop: 10, fontSize: 13, color: '#6e7a65', fontFamily: 'Pretendard, sans-serif', fontWeight: 600 }}>
              나중에 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1c1f2e', fontFamily: 'Pretendard, sans-serif', lineHeight: 1.35 }}>{children}</h2>
      {sub && <p style={{ fontSize: 14, color: '#6e7a65', marginTop: 8, fontFamily: 'Pretendard, sans-serif', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

function Welcome() {
  return (
    <div>
      <div style={{ fontSize: 44, fontWeight: 800, color: '#1c1f2e', fontFamily: 'Pretendard, sans-serif', marginBottom: 4 }}>OTD</div>
      <p style={{ fontSize: 11, letterSpacing: '0.22em', color: '#b0baa8', textTransform: 'uppercase', fontWeight: 600, marginBottom: 24 }}>Own The Day</p>
      <Title sub="작업치료사가 설계한 자기관리 도구예요. 내가 맡은 ‘역할’을 중심으로 습관과 하루를 기록합니다. 같이 설정해볼까요? (언제든 건너뛸 수 있어요)">
        역할이 모여<br />하루가 됩니다
      </Title>
    </div>
  );
}

function RolePick({ roles, toggle }: { roles: LifeRoleDef[]; toggle: (s: typeof ROLE_SUGGESTIONS[number]) => void }) {
  return (
    <div>
      <Title sub="나를 이루는 역할을 3~6개 골라보세요. 나중에 자유롭게 추가·수정할 수 있어요.">
        어떤 역할로<br />하루를 사나요?
      </Title>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {ROLE_SUGGESTIONS.map(s => {
          const on = roles.some(r => r.label === s.label);
          return (
            <button key={s.label} type="button" onClick={() => toggle(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 14px',
                borderRadius: 99, border: `1.5px solid ${on ? s.color : '#dfe6da'}`,
                background: on ? s.color : '#fff', color: on ? '#fff' : '#3c4640',
                fontFamily: 'Pretendard, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
              <span>{s.emoji}</span>{s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FirstHabit({ roles, name, setName, icon, setIcon, roleId, setRoleId }: {
  roles: LifeRoleDef[]; name: string; setName: (v: string) => void;
  icon: string; setIcon: (v: string) => void; roleId: string; setRoleId: (v: string) => void;
}) {
  return (
    <div>
      <Title sub="작게 시작하는 게 좋아요. 예: 물 마시기, 10분 산책, 감사일기 한 줄.">
        첫 습관 하나만<br />만들어볼까요?
      </Title>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {HABIT_ICONS.map(em => (
            <button key={em} type="button" onClick={() => setIcon(em)}
              style={{ width: 44, height: 44, borderRadius: 10, fontSize: 20, border: `1.5px solid ${icon === em ? '#4a7c59' : '#dfe6da'}`, background: icon === em ? '#eef4ef' : '#fff', cursor: 'pointer' }}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="습관 이름 (예: 물 2L 마시기)"
        style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 12, border: '1.5px solid #dfe6da', fontSize: 15, fontFamily: 'Pretendard, sans-serif' }} />
      {roles.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: '#6e7a65', fontWeight: 600, marginBottom: 8, fontFamily: 'Pretendard, sans-serif' }}>어떤 역할의 습관인가요? (선택)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {roles.map(r => (
              <button key={r.id} type="button" onClick={() => setRoleId(roleId === r.id ? '' : r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 40, padding: '0 12px', borderRadius: 99, border: `1.5px solid ${roleId === r.id ? r.color : '#dfe6da'}`, background: roleId === r.id ? r.color : '#fff', color: roleId === r.id ? '#fff' : '#3c4640', fontFamily: 'Pretendard, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                <span>{r.emoji}</span>{r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabGuide() {
  const items = [
    { Icon: Home, t: '홈', d: '오늘의 참여·컨디션·의미있는 순간을 한눈에' },
    { Icon: Repeat, t: '루틴', d: '루틴을 체크하고 역할별 참여를 쌓아요' },
    { Icon: ListTodo, t: '업무', d: '오늘 할 일을 역할·프로젝트와 함께 관리' },
    { Icon: Activity, t: '컨디션', d: '신체·정서·인지·환경 4축으로 상태를 기록' },
    { Icon: Archive, t: '기록', d: '메모·아이디어·기록을 모아두는 공간' },
  ];
  return (
    <div>
      <Title sub="아래 탭으로 하루를 기록해요. 천천히 둘러보세요.">준비 끝!<br />이렇게 쓰면 돼요</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(({ Icon, t, d }) => (
          <div key={t} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, color: '#4a7c59', marginTop: 1 }}><Icon size={20} /></span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#1c1f2e', fontFamily: 'Pretendard, sans-serif' }}>{t}</p>
              <p style={{ fontSize: 13, color: '#6e7a65', fontFamily: 'Pretendard, sans-serif', lineHeight: 1.5 }}>{d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
