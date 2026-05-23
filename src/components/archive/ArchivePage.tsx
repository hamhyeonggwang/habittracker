'use client';
import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, X, Tag } from 'lucide-react';
import { archiveStore, newId } from '@/lib/storage';
import { ArchiveItem, ArchiveCategory } from '@/types';
import { Button, EmptyState } from '@/components/ui';
import { CATEGORY_LABELS, formatDate } from '@/lib/utils';
import { ARCHIVE_LABELS } from '@/lib/strengthLanguage';

const CAT_COLORS: Record<ArchiveCategory, { bg: string; text: string; border: string }> = {
  book:     { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  work:     { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  research: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
  clinical: { bg: 'var(--sage-light)', text: 'var(--sage)', border: '#c5ddc8' },
  idea:     { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  etc:      { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' },
};

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ArchiveCategory>('idea');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
  };
  const submit = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    archiveStore.add({ id: newId(), title: title.trim(), content: content.trim(), category, tags, createdAt: now, updatedAt: now });
    onAdd(); onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ fontFamily: 'Noto Serif KR, serif', color: 'var(--text-primary)' }}>
            {ARCHIVE_LABELS.modalTitle}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="오늘 발견한 것의 제목"
              className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>카테고리</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CATEGORY_LABELS) as ArchiveCategory[]).map(cat => {
                const c = CAT_COLORS[cat];
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="py-1.5 rounded-lg text-[11px] font-semibold border transition-all"
                    style={{
                      fontFamily: 'Pretendard, sans-serif',
                      background: category === cat ? c.bg : 'white',
                      color: category === cat ? c.text : 'var(--text-muted)',
                      borderColor: category === cat ? c.border : 'var(--border)',
                    }}>
                    {CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>내용</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder={ARCHIVE_LABELS.contentPlaceholder}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none"
              style={{ borderColor: 'var(--border)', fontFamily: 'Noto Sans KR, sans-serif', lineHeight: 1.7 }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>태그</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="태그 입력 후 Enter"
                className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
              <Button onClick={addTag} size="sm" variant="secondary">추가</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <button key={tag} onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ background: 'var(--sage-light)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                    #{tag} <X size={9} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={submit} className="w-full" size="lg">저장하기 ✨</Button>
        </div>
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>(() =>
    archiveStore.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<ArchiveCategory | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);

  const refresh = useCallback(() =>
    setItems(archiveStore.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))), []);

  const filtered = useMemo(() => {
    let r = items;
    if (query) r = r.filter(i =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.content.toLowerCase().includes(query.toLowerCase()) ||
      i.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
    if (activeCat !== 'all') r = r.filter(i => i.category === activeCat);
    return r;
  }, [items, query, activeCat]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach(i => { c[i.category] = (c[i.category] ?? 0) + 1; });
    return c;
  }, [items]);

  return (
    <div className="page-enter space-y-4">
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>
            {ARCHIVE_LABELS.pageTitle}
          </h1>
          <p className="text-[12px] mt-0.5 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            {ARCHIVE_LABELS.countSub(items.length)}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus size={13} className="inline mr-1" />{ARCHIVE_LABELS.addBtn}
        </Button>
      </div>

      {/* ── 검색 ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder={ARCHIVE_LABELS.searchPlaceholder}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg border text-sm focus:outline-none"
          style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', background: 'white' }} />
        {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
          <X size={13} style={{ color: 'var(--text-muted)' }} /></button>}
      </div>

      {/* ── 카테고리 필터 ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setActiveCat('all')}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
          style={{
            fontFamily: 'Pretendard, sans-serif',
            background: activeCat === 'all' ? 'var(--sage)' : 'white',
            color: activeCat === 'all' ? 'white' : 'var(--text-muted)',
            border: `1px solid ${activeCat === 'all' ? 'var(--sage)' : 'var(--border)'}`,
          }}>
          전체 {counts.all}
        </button>
        {(Object.keys(CATEGORY_LABELS) as ArchiveCategory[]).filter(cat => counts[cat] > 0).map(cat => {
          const c = CAT_COLORS[cat];
          const active = activeCat === cat;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                fontFamily: 'Pretendard, sans-serif',
                background: active ? c.bg : 'white',
                color: active ? c.text : 'var(--text-muted)',
                border: `1px solid ${active ? c.border : 'var(--border)'}`,
              }}>
              {CATEGORY_LABELS[cat]} {counts[cat]}
            </button>
          );
        })}
      </div>

      {/* ── 아이템 목록 ── */}
      {filtered.length === 0 ? (
        <EmptyState icon="🌱"
          title={query ? '검색 결과가 없어요' : ARCHIVE_LABELS.emptyTitle}
          description={query ? '다른 키워드로 검색해볼까요?' : ARCHIVE_LABELS.emptyDesc}
          action={!query ? <Button onClick={() => setShowAdd(true)} size="sm">첫 발견 기록하기 ✨</Button> : undefined} />
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((item, idx) => {
            const c = CAT_COLORS[item.category];
            return (
              <div key={item.id}
                className={`p-3.5 ${idx < filtered.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ background: c.bg, color: c.text, borderColor: c.border, fontFamily: 'Pretendard, sans-serif' }}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                    {formatDate(item.createdAt, 'M/d')}
                  </span>
                </div>
                <h3 className="text-[13px] font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Noto Serif KR, serif' }}>
                  {item.title}
                </h3>
                {item.content && (
                  <p className="text-[12px] leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'Noto Sans KR, sans-serif' }}>
                    {item.content}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-0.5 text-[10px]"
                        style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                        <Tag size={8} />#{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="h-4" />
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={refresh} />}
    </div>
  );
}
