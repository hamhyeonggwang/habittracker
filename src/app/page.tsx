'use client';
import { useState, useEffect } from 'react';
import { repairStorage, seedDummyData, seedDashboardData } from '@/lib/storage';
import BottomNav from '@/components/layout/BottomNav';
import DashboardPage from '@/components/dashboard/DashboardPage';
import HabitPage from '@/components/habit/HabitPage';
import TaskPage from '@/components/task/TaskPage';
import MentalPage from '@/components/mental/MentalPage';
import ArchivePage from '@/components/archive/ArchivePage';

type PageId = 'dashboard' | 'habit' | 'task' | 'mental' | 'archive';

export default function Home() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    repairStorage();
    seedDummyData();
    seedDashboardData();
    setMounted(true);
  }, []);

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

  const pages: Record<PageId, React.ReactNode> = {
    dashboard: <DashboardPage />,
    habit: <HabitPage />,
    task: <TaskPage />,
    mental: <MentalPage />,
    archive: <ArchivePage />,
  };

  return (
    <main className="min-h-screen bg-[#f8faf8]" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
      <div className="max-w-lg mx-auto px-4">
        {pages[page]}
      </div>
      <BottomNav current={page} onChange={(id) => setPage(id as PageId)} />
    </main>
  );
}
