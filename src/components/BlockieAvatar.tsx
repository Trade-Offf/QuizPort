"use client";
import type { AvatarComponent } from '@rainbow-me/rainbowkit';

export const BlockieAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  const seed = (address || 'guest') as string;
  const dicebear = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  const src = (ensImage as string) || dicebear;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="rounded-full" src={src} width={size} height={size} alt={`${address} avatar`} />;
};

