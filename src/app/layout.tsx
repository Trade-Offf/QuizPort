import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AppProviders } from '@/components/providers/AppProviders';
import { Header } from '@/components/layout/Header';
// 移除 next/font 以避免覆盖自定义字体栈

export const metadata: Metadata = {
  title: 'QuizPort',
  description: '在线习题站，用于文章末尾跳转引流',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@callmebill/lxgw-wenkai-web@latest/style.css" />
      </head>
      <body className="font-sans">
        <AppProviders>
          <Header />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}

