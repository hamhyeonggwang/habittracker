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
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3" style={{ color: 'var(--text-muted)' }}>{icon}</div>}
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>{title}</h3>
      {description && <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'Noto Sans KR, sans-serif' }}>{description}</p>}
      {action}
    </div>
  );
}

// ── BUTTON ────────────────────────────────────────
// design.md: 높이 sm 36 / md 44 / lg 52, radius 12, 폰트 14px+ 600~700, focus-visible:ring-2
export function Button({ children, onClick, variant = 'primary', size = 'md', className, disabled, type = 'button', fullWidth }: {
  children: ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy';
  size?: 'sm' | 'md' | 'lg'; className?: string; disabled?: boolean;
  type?: 'button' | 'submit'; fullWidth?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: 'text-white shadow-sm',
    secondary: 'bg-white border hover:bg-gray-50',
    ghost: 'hover:bg-gray-100',
    danger: 'hover:opacity-90',
    navy: 'text-white',
  };
  const sizes = {
    sm: 'min-h-9 px-3 text-sm',
    md: 'min-h-11 px-4 text-sm',
    lg: 'min-h-[52px] px-5 text-base',
  };
  const bg = variant === 'primary' ? 'var(--sage)' : variant === 'navy' ? 'var(--navy)' : variant === 'danger' ? '#fdf2f2' : undefined;
  const color = variant === 'secondary' ? 'var(--text-secondary)' : variant === 'danger' ? '#b02a2a' : undefined;
  const border = variant === 'secondary' ? 'var(--border)' : undefined;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#4a7c59]',
        'disabled:opacity-50', fullWidth && 'w-full', variants[variant], sizes[size], className)}
      style={{ fontFamily: 'Pretendard, sans-serif', backgroundColor: bg, color, borderColor: border }}>
      {children}
    </button>
  );
}

// ── ICON BUTTON (아이콘 단독, 44x44, aria-label 필수) ──
export function IconButton({ children, onClick, label, className, disabled }: {
  children: ReactNode; onClick?: () => void; label: string; className?: string; disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled}
      className={cn('inline-flex items-center justify-center w-11 h-11 rounded-xl transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#4a7c59]',
        'disabled:opacity-50 hover:bg-gray-100', className)}
      style={{ color: 'var(--text-muted)' }}>
      {children}
    </button>
  );
}

// ── INPUT / TEXTAREA (design.md: 높이 44px+, 14px+, focus-visible:ring-2) ──
const fieldBase = 'w-full rounded-xl border bg-white text-sm transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#4a7c59] ' +
  'placeholder:text-[var(--text-muted)] disabled:opacity-50';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cn(fieldBase, 'min-h-11 px-3.5', className)}
      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif', ...props.style }}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(fieldBase, 'min-h-[88px] py-2.5 px-3.5 leading-relaxed', className)}
      style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif', ...props.style }}
    />
  );
}
