'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function CapsuleNav() {
  return (
    <div className="mx-auto inline-flex items-center gap-4 rounded-full bg-black/40 backdrop-blur px-6 md:px-8 py-3 ring-1 ring-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <Link href="/" className="text-white font-extrabold text-[20px] md:text-[22px]">
        QuizPort
      </Link>
      <span className="text-white/30">|</span>
      <Link href="/guide" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        使用说明
      </Link>
      <span className="text-white/30">·</span>
      <Link href="/upload" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        生成测试
      </Link>
      <span className="text-white/30">·</span>

      <Link href="/history" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        历史题库
      </Link>
      <span className="ml-3 hidden md:inline-block">
        <div className="scale-95 md:scale-100">
          <ConnectButton />
        </div>
      </span>
    </div>
  );
}
