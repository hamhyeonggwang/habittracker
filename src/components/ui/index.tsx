'use client';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// ── CARD ──────────────────────────────────────────
export function Card({ children, className, onClick }: {
  children: ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <div className={cn('card overflow-hidden animate-fade-in', className, onClick ? 'cursor-pointer' : '')} onClick={onClick}>
      {children}
    </div>
  );
}

// ── SHEET CARD (구글 시트 스타일) ──────────────────
export function SheetCard({ title, navy, children, className }: {
  title: string; navy?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn('card overflow-hidden animate-fade-in', className)}>
      <div className={navy ? 'sheet-header-navy' : 'sheet-header'}>{title}</div>
      <div className="p-0">{children}</div>
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────
export function StatCard({ label, value, unit, sub, sage, icon }: {
  label: string; value: string | number; unit?: string; sub?: string; sage?: boolean; icon?: ReactNode;
}) {
  const color = sage !== false ? 'var(--sage)' : 'var(--navy)';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{label}</span>
        {icon && <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'var(--sage-light)' }}><span style={{ color }}>{icon}</span></div>}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold" style={{ fontFamily: 'Pretendard, sans-serif', color }}>{value}</span>
        {unit && <span className="text-xs mb-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{unit}</span>}
      </div>
      {sub && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>{sub}</p>}
    </div>
  );
}

// ── PROGRESS BAR ──────────────────────────────────
export function ProgressBar({ value, sage = true, height = 7, label }: {
  value: number; sage?: boolean; height?: number; label?: string;
}) {
  const color = sage ? 'var(--sage)' : 'var(--navy)';
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>{label}</span>
          <span className="text-xs font-bold" style={{ color, fontFamily: 'Pretendard, sans-serif' }}>{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────
export function Badge({ children, variant = 'sage' }: {
  children: ReactNode;
  variant?: 'sage' | 'navy' | 'red' | 'amber' | 'gray' | 'blue' | 'purple' | 'green';
}) {
  const cls: Record<string, string> = {
    sage: 'tag-sage', navy: 'tag-navy',
    red: 'bg-red-50 text-red-600 border border-red-200 text-[11px] px-2 py-0.5 rounded-full font-semibold',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2 py-0.5 rounded-full font-semibold',
    gray: 'bg-gray-50 text-gray-500 border border-gray-200 text-[11px] px-2 py-0.5 rounded-full font-semibold',
    blue: 'tag-navy',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 text-[11px] px-2 py-0.5 rounded-full font-semibold',
    green: 'tag-sage',
  };
  return <span className={cls[variant]} style={{ fontFamily: 'Pretendard, sans-serif' }}>{children}</span>;
}

// ── SECTION HEADER ────────────────────────────────
export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>{title}</h2>
        {subtitle && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── SCORE SELECTOR ────────────────────────────────
export function ScoreSelector({ value, onChange, labels }: {
  value: number; onChange: (v: number) => void; labels?: Record<number, string>;
}) {
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          className={cn('score-btn', value === n ? 'active' : 'inactive')}
          title={labels?.[n]}>{n}</button>
      ))}
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>{title}</h3>
      {description && <p className="text-xs mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>{description}</p>}
      {action}
    </div>
  );
}

// ── BUTTON ────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', className, disabled }: {
  children: ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy';
  size?: 'sm' | 'md' | 'lg'; className?: string; disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: 'text-white shadow-sm',
    secondary: 'bg-white border text-gray-700 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    navy: 'text-white',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const bg = variant === 'primary' ? 'var(--sage)' : variant === 'navy' ? 'var(--navy)' : undefined;
  const border = variant === 'secondary' ? 'var(--border)' : undefined;
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn('rounded-lg font-semibold transition-all duration-150 disabled:opacity-50', variants[variant], sizes[size], className)}
      style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: bg, borderColor: border }}>
      {children}
    </button>
  );
}
