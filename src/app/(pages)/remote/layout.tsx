import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Remote 求职导航',
  description: '精选远程/混合办公招聘网站与社区，点击卡片直达官网。',
  alternates: { canonical: '/remote' },
  openGraph: { title: 'Remote 求职导航', url: '/remote', type: 'website' },
  robots: { index: true, follow: true },
};

export default function RemoteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

