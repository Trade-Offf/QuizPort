"use client";
import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useSession, signOut } from 'next-auth/react';

export function AutoSignoutOnDisconnect() {
  const { isConnected } = useAccount();
  const { status } = useSession();
  const signedOutRef = useRef(false);

  useEffect(() => {
    // 当钱包断开且当前有有效会话时，清除 NextAuth 会话
    if (!isConnected && status === 'authenticated' && !signedOutRef.current) {
      signedOutRef.current = true;
      void signOut({ redirect: false });
    }
    if (isConnected) signedOutRef.current = false;
  }, [isConnected, status]);

  return null;
}


