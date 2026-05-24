'use client';
import { useState, useEffect } from 'react';
import { migrateFromLocalStorage } from '@/lib/migrate';
import BottomNav from '@/components/layout/BottomNav';
import DashboardPage from '@/components/dashboard/DashboardPage';
import HabitPage from '@/components/habit/HabitPage';
import TaskPage from '@/components/task/TaskPage';
import MentalPage from '@/components/mental/MentalPage';
import ArchivePage from '@/components/archive/ArchivePage';

type PageId = 'dashboard' | 'habit' | 'task' | 'mental' | 'archive';

const ALL_PAGES: PageId[] = ['dashboard', 'habit', 'task', 'mental', 'archive'];

const PAGE_COMPONENTS: Record<PageId, React.ReactNode> = {
  dashboard: <DashboardPage />,
  habit: <HabitPage />,
  task: <TaskPage />,
  mental: <MentalPage />,
  archive: <ArchivePage />,
};

export default function Home() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mounted, setMounted] = useState(false);
  // 한 번 방문한 페이지만 마운트 유지 — 초기에는 dashboard만
  const [visited, setVisited] = useState<Record<PageId, boolean>>({ dashboard: true, habit: false, task: false, mental: false, archive: false });

  useEffect(() => {
    migrateFromLocalStorage().finally(() => setMounted(true));
  }, []);

  const handlePageChange = (id: string) => {
    const newPage = id as PageId;
    setPage(newPage);
    setVisited(prev => prev[newPage] ? prev : { ...prev, [newPage]: true });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf8]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-white text-xl">
            🎯
          </div>
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8faf8]" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
      <div className="max-w-lg mx-auto px-4">
        {ALL_PAGES.map(p => (
          <div key={p} style={{ display: page === p ? 'block' : 'none' }}>
            {visited[p] && PAGE_COMPONENTS[p]}
          </div>
        ))}
      </div>
      <BottomNav current={page} onChange={handlePageChange} />
    </main>
  );
}
