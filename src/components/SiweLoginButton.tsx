"use client";
import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useChainId } from 'wagmi';
import { SiweMessage } from 'siwe';
import { signIn, signOut, useSession } from 'next-auth/react';

async function fetchNonce(): Promise<string> {
  const res = await fetch('/api/siwe/nonce', { method: 'POST' });
  const data = await res.json();
  return data.nonce;
}

export function SiweLoginButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const { signMessageAsync } = useSignMessage();
  const currentChainId = useChainId();

  const handleSiwe = async () => {
    if (!isConnected) {
      const connector = connectors[0];
      if (!connector) {
        alert('未检测到浏览器钱包，请安装或启用注入式钱包（如 MetaMask）');
        return;
      }
      await connect({ connector });
    }
    if (!address) return;

    setLoading(true);
    try {
      const nonce = await fetchNonce();
      const domain = window.location.hostname; // 不含端口，需与服务端 SIWE_DOMAIN 一致
      const origin = window.location.origin;   // 需与 NEXTAUTH_URL 一致
      const message = new SiweMessage({
        domain,
        address,
        statement: process.env["NEXT_PUBLIC_SIWE_STATEMENT"] || 'Sign in to QuizPort',
        uri: origin,
        version: '1',
        chainId: currentChainId || 1,
        nonce,
      });

      const signature = await signMessageAsync({ message: message.prepareMessage() });
      console.log('[SIWE] Signing in with credentials...');
      const res = await signIn('credentials', {
        redirect: false,
        message: JSON.stringify(message),
        signature,
      });
      console.log('[SIWE] Sign in result:', res);
      if (!res?.ok) {
        console.error('[SIWE] Sign in failed:', res?.error);
        throw new Error('SIWE 登录失败: ' + res?.error);
      }
      console.log('[SIWE] Sign in successful!');
    } finally {
      setLoading(false);
    }
  };

  if (session?.user) {
    return (
      <button className="rounded bg-gray-100 px-3 py-1" onClick={() => signOut()}>
        退出（{session.user.name || '已登录'}）
      </button>
    );
  }

  return (
    <button
      className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
      disabled={loading || isPending}
      onClick={handleSiwe}
    >
      {loading ? '登录中...' : '钱包登录 (SIWE)'}
    </button>
  );
}

