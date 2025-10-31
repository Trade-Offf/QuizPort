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
    console.log('[AutoSiwe] Effect triggered, isConnected:', isConnected, 'address:', address, 'status:', status);
    
    if (!isConnected || !address) {
      console.log('[AutoSiwe] Not connected or no address');
      return;
    }
    // 已有有效 session 时不重复签名；仅在显式未认证时触发
    if (status === 'authenticated') {
      try { localStorage.setItem('qp_session_active', '1'); } catch {}
      console.log('[AutoSiwe] Already authenticated');
      return;
    }
    if (status === 'loading') {
      console.log('[AutoSiwe] Session loading');
      return; // 等待会话状态确定，避免闪签
    }
    // 若本地已记录已登录状态，则跳过自动签名，避免刷新时重复弹窗
    try {
      const active = typeof window !== 'undefined' ? localStorage.getItem('qp_session_active') : null;
      if (active === '1') {
        console.log('[AutoSiwe] Local session_active flag found, skip auto SIWE');
        return;
      }
      // 节流：若刚尝试过（≤60s），不要再次触发
      const lastAttempt = Number(localStorage.getItem('qp_siwe_last_attempt') || '0');
      if (Date.now() - lastAttempt < 60_000) {
        console.log('[AutoSiwe] Throttled: last attempt < 60s');
        return;
      }
    } catch {}
    if (attemptedRef.current === address) {
      console.log('[AutoSiwe] Already attempted for this address');
      return; // prevent repeat
    }

    const schedule = () => {
      const t = setTimeout(async () => {
        try {
          console.log('[AutoSiwe] Starting SIWE flow...');
          attemptedRef.current = address;
          try { localStorage.setItem('qp_siwe_last_attempt', String(Date.now())); } catch {}
          const nonce = await fetchNonce();
          console.log('[AutoSiwe] Got nonce:', nonce);
          const domain = window.location.hostname;
          const origin = window.location.origin;
          console.log('[AutoSiwe] Domain:', domain, 'Origin:', origin);
          const message = new SiweMessage({
            domain,
            address,
            statement: process.env["NEXT_PUBLIC_SIWE_STATEMENT"] || 'Sign in to QuizPort',
            uri: origin,
            version: '1',
            chainId: chainId || 1,
            nonce,
          });
          console.log('[AutoSiwe] Requesting signature...');
          const signature = await signMessageAsync({ message: message.prepareMessage() });
          console.log('[AutoSiwe] Got signature, signing in...');
          const result = await signIn('credentials', { redirect: false, message: JSON.stringify(message), signature });
          console.log('[AutoSiwe] Sign in result:', result);
          if (result?.ok) {
            try { localStorage.setItem('qp_session_active', '1'); } catch {}
          }
        } catch (error) {
          console.error('[AutoSiwe] Error:', error);
          // ignore; user may cancel signature
        }
      }, 0); // 推迟到 hydration 之后，避免在 Hydrate 渲染中触发状态更新
      return () => clearTimeout(t);
    };

    return schedule();
  }, [isConnected, address, status, signMessageAsync, chainId]);

  return null;
}

