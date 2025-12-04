"use client";
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { HeroUIProvider } from '@heroui/react';
import { LanguageProvider } from './LanguageProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <HeroUIProvider navigate={(...args: any[]) => (router.push as any)(...args)}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </HeroUIProvider>
  );
}

