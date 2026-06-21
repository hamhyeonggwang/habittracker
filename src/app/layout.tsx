import type { Metadata, Viewport } from 'next';
import './globals.css';
import RegisterSW from '@/components/pwa/RegisterSW';

export const metadata: Metadata = {
  title: 'OTD — Own The Day',
  description: '작업치료사가 설계한 습관·컨디션 기록. 역할 중심으로 하루를 관리하세요.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  // maximumScale 미지정 — 확대 허용(접근성: 확대 차단 금지)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
