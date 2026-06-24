'use client';
import { Activity, LayoutDashboard, CheckSquare, ListTodo, BookMarked } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard', label: '홈', icon: LayoutDashboard },
  { id: 'habit', label: '루틴', icon: CheckSquare },
  { id: 'task', label: '업무', icon: ListTodo },
  { id: 'mental', label: '컨디션', icon: Activity },
  { id: 'archive', label: '기록', icon: BookMarked },
];

export default function BottomNav({ current, onChange }: {
  current: string; onChange: (id: string) => void;
}) {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button key={id} onClick={() => onChange(id)}
              className={cn('min-h-[56px] min-w-[56px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400',
                active ? '' : 'opacity-50 hover:opacity-75')}
              style={{ fontFamily: 'Pretendard, sans-serif' }}>
              <div className={cn('w-9 h-9 flex items-center justify-center rounded-lg transition-all',
                active ? '' : '')}
                style={{ background: active ? 'var(--sage-light)' : 'transparent' }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8}
                  style={{ color: active ? 'var(--sage)' : 'var(--text-muted)' }} />
              </div>
              <span className="text-xs font-semibold"
                style={{ color: active ? 'var(--sage)' : 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
