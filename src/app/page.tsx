'use client';
import { useState, useEffect } from 'react';
import { migrateFromLocalStorage } from '@/lib/migrate';
import BottomNav from '@/components/layout/BottomNav';
import DashboardPage from '@/components/dashboard/DashboardPage';
import HabitPage from '@/components/habit/HabitPage';
import TaskPage from '@/components/task/TaskPage';
import MentalPage from '@/components/mental/MentalPage';
import ArchivePage from '@/components/archive/ArchivePage';
import { Toaster } from '@/components/ui/Toast';
import LoginScreen from '@/components/auth/LoginScreen';
import { useSession } from '@/lib/useSession';

type PageId = 'dashboard' | 'habit' | 'task' | 'mental' | 'archive';

const ALL_PAGES: PageId[] = ['dashboard', 'habit', 'task', 'mental', 'archive'];

const PAGE_COMPONENTS: Record<PageId, React.ReactNode> = {
  dashboard: <DashboardPage />,
  habit: <HabitPage />,
  task: <TaskPage />,
  mental: <MentalPage />,
  archive: <ArchivePage />,
};

function SplashScreen({ leaving }: { leaving: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: leaving ? 'splashOut 0.45s ease forwards' : 'splashIn 0.3s ease',
        zIndex: 9999,
      }}
    >
      {/* 로고 */}
      <div style={{ animation: 'logoIn 0.65s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(54px, 14vw, 74px)',
            letterSpacing: '0.015em',
            color: '#1c1f2e',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <span>OTD</span>
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(10px, 2.5vw, 14px)',
              height: 'clamp(10px, 2.5vw, 14px)',
              borderRadius: '50%',
              background: '#2D58E0',
              margin: '0 clamp(3px, 0.7vw, 5px)',
              flexShrink: 0,
              transform: 'translateY(6%)',
            }}
          />
          <span>H</span>
        </div>

        {/* 태그라인 */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '10px',
            letterSpacing: '0.22em',
            color: '#b0baa8',
            marginTop: '18px',
            fontFamily: 'Pretendard, sans-serif',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >
          Occupational Therapist&apos;s Daily Hub
        </p>
      </div>

      {/* 로딩 점 */}
      <div
        style={{
          position: 'absolute',
          bottom: '64px',
          display: 'flex',
          gap: '7px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#4a7c59',
              animation: `splashDot 1.4s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mounted, setMounted] = useState(false);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const { session, loading: sessionLoading } = useSession();
  const [visited, setVisited] = useState<Record<PageId, boolean>>({
    dashboard: true, habit: false, task: false, mental: false, archive: false,
  });

  useEffect(() => {
    // 최소 0.9s 표시 후 퇴장 애니메이션
    const minDelay = new Promise<void>(res => setTimeout(res, 900));
    Promise.all([migrateFromLocalStorage(), minDelay]).finally(() => {
      setSplashLeaving(true);
      setTimeout(() => setMounted(true), 450);
    });
  }, []);

  const handlePageChange = (id: string) => {
    const newPage = id as PageId;
    setPage(newPage);
    setVisited(prev => prev[newPage] ? prev : { ...prev, [newPage]: true });
  };

  // 스플래시: 최소 표시시간(mounted) 또는 세션 복원(sessionLoading) 중에는 유지
  const showSplash = !mounted || sessionLoading;

  return (
    <>
      {showSplash && <SplashScreen leaving={splashLeaving && !sessionLoading} />}
      {!showSplash && !session && (
        <>
          <LoginScreen />
          <Toaster />
        </>
      )}
      {!showSplash && session && (
        <main
          className="min-h-screen bg-[#f8faf8]"
          style={{ paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
        >
          <div className="max-w-lg mx-auto px-4">
            {ALL_PAGES.map(p => (
              <div key={p} style={{ display: page === p ? 'block' : 'none' }}>
                {visited[p] && PAGE_COMPONENTS[p]}
              </div>
            ))}
          </div>
          <BottomNav current={page} onChange={handlePageChange} />
          <Toaster />
        </main>
      )}
    </>
  );
}
