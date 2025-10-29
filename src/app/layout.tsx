import './tw.gen.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/AppProviders';
import CapsuleNav from '@/components/layout/CapsuleNav';
import PageOffset from '@/components/layout/PageOffset';
import NonHomeBackdrop from '@/components/layout/NonHomeBackdrop';
import { RouteLoading } from '@/components/RouteLoading';

export const metadata: Metadata = {
  title: 'QuizPort',
  description: '在线习题站，用于文章末尾跳转引流',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@callmebill/lxgw-wenkai-web@latest/style.css"
        />
      </head>
      <body className="font-sans bg-[#0b0912] text-white">
        <AppProviders>
          <RouteLoading />
          {/* 全站统一采用暗色背景与胶囊导航；首页自身会再渲染背景效果 */}
          <header className="fixed top-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <CapsuleNav />
            </div>
          </header>
          {/* 非首页背景渐层（自适应高度） */}
          <NonHomeBackdrop />
          <PageOffset>{children}</PageOffset>
        </AppProviders>
      </body>
    </html>
  );
}
