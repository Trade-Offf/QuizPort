'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function PageOffset({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const needsOffset = pathname !== '/';
  return <div className={needsOffset ? 'pt-24 md:pt-28' : ''}>{children}</div>;
}


