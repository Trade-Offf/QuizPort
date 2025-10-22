"use client";
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import { HeroUIProvider } from '@heroui/react';
import '@rainbow-me/rainbowkit/styles.css';
import { BlockieAvatar } from '@/components/BlockieAvatar';
import { AutoSiwe } from '@/components/AutoSiwe';
import { AutoSignoutOnDisconnect } from '@/components/AutoSignoutOnDisconnect';

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
              <AutoSiwe />
              <AutoSignoutOnDisconnect />
              {children}
            </HeroUIProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}

