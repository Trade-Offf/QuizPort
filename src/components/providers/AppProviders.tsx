"use client";
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { HeroUIProvider } from '@heroui/react';
import '@rainbow-me/rainbowkit/styles.css';
import { BlockieAvatar } from '@/components/BlockieAvatar';
import { AutoSiwe } from '@/components/AutoSiwe';
import { AutoSignoutOnDisconnect } from '@/components/AutoSignoutOnDisconnect';
import { useEffect } from 'react';
import { LanguageProvider } from './LanguageProvider';

function ClearQuizCacheOnLogout() {
  const { status } = useSession();
  useEffect(() => {
    if (status === 'unauthenticated') {
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('qp_set_progress:')) keys.push(k);
        }
        for (const k of keys) localStorage.removeItem(k);
        // 清理登录标记，避免刷新后误判已登录
        localStorage.removeItem('qp_session_active');
        localStorage.removeItem('qp_siwe_last_attempt');
      } catch {}
    }
  }, [status]);
  return null;
}

const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
  connectors: [injected()],
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const router = useRouter();
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider avatar={BlockieAvatar} theme={lightTheme()}>
            <HeroUIProvider navigate={(...args: any[]) => (router.push as any)(...args)}>
              <LanguageProvider>
              <AutoSiwe />
              <AutoSignoutOnDisconnect />
              <ClearQuizCacheOnLogout />
              {children}
              </LanguageProvider>
            </HeroUIProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}

