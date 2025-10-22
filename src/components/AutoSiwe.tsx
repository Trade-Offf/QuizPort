"use client";
import { useEffect, useRef } from 'react';
import { useAccount, useSignMessage, useChainId } from 'wagmi';
import { useSession, signIn } from 'next-auth/react';
import { SiweMessage } from 'siwe';

async function fetchNonce(): Promise<string> {
  const res = await fetch('/api/siwe/nonce', { method: 'POST' });
  const data = await res.json();
  return data.nonce;
}

export function AutoSiwe() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: session, status } = useSession();
  const { signMessageAsync } = useSignMessage();
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    // 已有有效 session 时不重复签名；仅在显式未认证时触发
    if (status === 'authenticated') return;
    if (status === 'loading') return; // 等待会话状态确定，避免闪签
    if (attemptedRef.current === address) return; // prevent repeat

    const schedule = () => {
      const t = setTimeout(async () => {
        try {
          attemptedRef.current = address;
          const nonce = await fetchNonce();
          const domain = window.location.hostname;
          const origin = window.location.origin;
          const message = new SiweMessage({
            domain,
            address,
            statement: process.env["NEXT_PUBLIC_SIWE_STATEMENT"] || 'Sign in to QuizPort',
            uri: origin,
            version: '1',
            chainId: chainId || 1,
            nonce,
          });
          const signature = await signMessageAsync({ message: message.prepareMessage() });
          await signIn('credentials', { redirect: false, message: JSON.stringify(message), signature });
        } catch {
          // ignore; user may cancel signature
        }
      }, 0); // 推迟到 hydration 之后，避免在 Hydrate 渲染中触发状态更新
      return () => clearTimeout(t);
    };

    return schedule();
  }, [isConnected, address, status, signMessageAsync, chainId]);

  return null;
}

