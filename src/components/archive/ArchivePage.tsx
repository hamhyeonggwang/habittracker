'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Search, X, Tag, Pencil, Trash2 } from 'lucide-react';
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

function ArchiveModal({ item, onClose, onSave }: { item?: ArchiveItem; onClose: () => void; onSave: () => Promise<void> }) {
  const isEdit = !!item;
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [category, setCategory] = useState<ArchiveCategory>(item?.category ?? 'idea');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
  };
  const submit = async () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (isEdit && item) {
      await archiveStore.update(item.id, { title: title.trim(), content: content.trim(), category, tags, updatedAt: now });
    } else {
      await archiveStore.add({ id: newId(), title: title.trim(), content: content.trim(), category, tags, createdAt: now, updatedAt: now });
    }
    await onSave(); onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Pretendard, sans-serif', color: 'var(--text-primary)' }}>
            {isEdit ? '기록 수정' : ARCHIVE_LABELS.modalTitle}
          </h3>
          <button type="button" onClick={onClose} aria-label="닫기"
            className="w-11 h-11 flex items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="오늘 발견한 것의 제목"
              className="w-full min-h-[44px] px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>카테고리</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CATEGORY_LABELS) as ArchiveCategory[]).map(cat => {
                const c = CAT_COLORS[cat];
                return (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className="min-h-[40px] py-2 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
              className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', lineHeight: 1.7 }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>태그</label>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="태그 입력 후 Enter"
                className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif' }} />
              <Button onClick={addTag} size="sm" variant="secondary">추가</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <button key={tag} onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="min-h-[32px] flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                    style={{ background: 'var(--sage-light)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                    #{tag} <X size={9} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={submit} className="w-full min-h-[52px]" size="lg">{isEdit ? '수정 저장' : '저장하기'}</Button>
        </div>
      </div>
    </div>
  );
}

function ArchiveDetailSheet({
  item,
  onClose,
  onEdit,
  onDelete,
}: {
  item: ArchiveItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const c = CAT_COLORS[item.category];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <span className="inline-flex min-h-[28px] items-center px-2.5 py-1 rounded-full border text-xs font-bold"
              style={{ background: c.bg, color: c.text, borderColor: c.border, fontFamily: 'Pretendard, sans-serif' }}>
              {CATEGORY_LABELS[item.category]}
            </span>
            <h2 className="text-xl font-bold leading-snug mt-3" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
              {item.title}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
              작성 {formatDate(item.createdAt, 'yyyy.MM.dd')} · 수정 {formatDate(item.updatedAt, 'yyyy.MM.dd')}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기"
            className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'var(--sage-pale)', border: '1px solid var(--border-light)' }}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
            {item.content || '내용이 없습니다.'}
          </p>
        </div>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {item.tags.map(tag => (
              <span key={tag} className="inline-flex min-h-[30px] items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'var(--sage-light)', color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
                <Tag size={12} />#{tag}
              </span>
            ))}
          </div>
        )}

        {confirmingDelete ? (
          <div className="mt-5 rounded-2xl p-4" style={{ background: '#fdf2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-semibold" style={{ color: '#991b1b', fontFamily: 'Pretendard, sans-serif' }}>
              이 기록을 삭제할까요?
            </p>
            <p className="text-xs mt-1" style={{ color: '#b02a2a', fontFamily: 'Pretendard, sans-serif' }}>
              삭제한 기록은 되돌릴 수 없습니다.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button type="button" onClick={() => setConfirmingDelete(false)}
                className="min-h-[44px] rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                style={{ background: 'white', color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                취소
              </button>
              <button type="button" onClick={onDelete}
                className="min-h-[44px] rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                style={{ background: '#b02a2a', color: 'white', fontFamily: 'Pretendard, sans-serif' }}>
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-5">
            <button type="button" onClick={onEdit}
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              style={{ background: 'var(--sage)', color: 'white', fontFamily: 'Pretendard, sans-serif' }}>
              <Pencil size={16} /> 수정
            </button>
            <button type="button" onClick={() => setConfirmingDelete(true)}
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              style={{ background: '#fdf2f2', color: '#b02a2a', fontFamily: 'Pretendard, sans-serif' }}>
              <Trash2 size={16} /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArchivePage() {
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<ArchiveCategory | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<ArchiveItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

  const refresh = useCallback(async () => {
    const data = await archiveStore.getAll();
    setItems(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = async (id: string) => {
    await archiveStore.delete(id);
    setSelectedItem(null);
    await refresh();
  };

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
    <div className="page-enter space-y-4" style={{ fontFamily: 'Pretendard, sans-serif' }}>
      <div className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
            {ARCHIVE_LABELS.pageTitle}
          </h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--sage)', fontFamily: 'Pretendard, sans-serif' }}>
            {ARCHIVE_LABELS.countSub(items.length)}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} size="sm" className="min-h-[40px]">
          <Plus size={15} className="inline mr-1" />{ARCHIVE_LABELS.addBtn}
        </Button>
      </div>

      {/* ── 검색 ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder={ARCHIVE_LABELS.searchPlaceholder}
          className="w-full min-h-[44px] pl-9 pr-10 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          style={{ borderColor: 'var(--border)', fontFamily: 'Pretendard, sans-serif', background: 'white' }} />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400">
          <X size={13} style={{ color: 'var(--text-muted)' }} /></button>}
      </div>

      {/* ── 카테고리 필터 ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setActiveCat('all')}
          className="flex-shrink-0 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
              className="flex-shrink-0 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
        <EmptyState icon=""
          title={query ? '검색 결과가 없어요' : ARCHIVE_LABELS.emptyTitle}
          description={query ? '다른 키워드로 검색해볼까요?' : ARCHIVE_LABELS.emptyDesc}
          action={!query ? <Button onClick={() => setShowAdd(true)} size="sm">첫 기록 남기기</Button> : undefined} />
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((item, idx) => {
            const c = CAT_COLORS[item.category];
            return (
              <button key={item.id} type="button" onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-4 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${idx < filtered.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border-light)' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full border"
                    style={{ background: c.bg, color: c.text, borderColor: c.border, fontFamily: 'Pretendard, sans-serif' }}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                    {formatDate(item.createdAt, 'M/d')}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'Pretendard, sans-serif' }}>
                  {item.title}
                </h3>
                {item.content && (
                  <p className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'Pretendard, sans-serif' }}>
                    {item.content}
                  </p>
                )}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-0.5 text-xs"
                        style={{ color: 'var(--text-muted)', fontFamily: 'Pretendard, sans-serif' }}>
                        <Tag size={11} />#{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="h-4" />
      {showAdd && <ArchiveModal onClose={() => setShowAdd(false)} onSave={refresh} />}
      {editingItem && (
        <ArchiveModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={async () => {
            await refresh();
            setEditingItem(null);
            setSelectedItem(null);
          }}
        />
      )}
      {selectedItem && !editingItem && (
        <ArchiveDetailSheet
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEdit={() => setEditingItem(selectedItem)}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      )}
    </div>
  );
}
