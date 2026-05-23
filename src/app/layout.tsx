import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life Hacking Dashboard',
  description: '매일의 습관, 업무, 컨디션을 추적하고 성장을 시각화하는 대시보드',
  manifest: '/manifest.json',
  themeColor: '#22c55e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
