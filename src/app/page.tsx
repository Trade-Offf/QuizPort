"use client";

import { Button } from '@heroui/react';
import Link from 'next/link';
import LiquidEther from '@/components/LiquidEther';
import { useTranslations } from '@/components/providers/LanguageProvider';

export default function HomePage() {
  const home = useTranslations('home');

  return (
    <main className="relative min-h-screen text-white bg-[#0b0912]">
      {/* 背景层：铺满容器，放在内容层下方 */}
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>
      {/* 内容层：位于背景之上 */}
      <section className="relative z-10 mx-auto flex max-w-[1120px] flex-col items-center px-6 pt-16 pb-20 text-center md:pt-24">
        {/* 主标题 */}
        <h1 className="mt-32 text-[44px] md:text-[88px] leading-[1.06] font-extrabold tracking-tight">
          {home.heroTitle}
        </h1>
        <p className="mt-5 max-w-2xl text-white/80 text-[20px] md:text-[24px]">
          {home.heroSubtitle}
        </p>

        {/* CTA */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <Button
            as={Link}
            href="/upload"
            size="lg"
            radius="full"
            className="bg-white text-gray-900 shadow-lg hover:shadow-xl"
          >
            {home.ctaPrimary}
          </Button>
          <Button
            as={Link}
            href="/history"
            variant="bordered"
            size="lg"
            radius="full"
            className="border-white/30 text-white/80 hover:text-white"
          >
            {home.ctaSecondary}
          </Button>
          <Button
            as={Link}
            href="/guide"
            variant="light"
            size="lg"
            radius="full"
            className="text-white/80 hover:text-white"
          >
            {home.ctaGuide}
          </Button>
        </div>

        {/* Tips */}
        <p className="mt-24 text-medium text-white/60">
          {home.tip1Prefix}
          <span className="font-semibold">{home.tip1Guide}</span>
          {home.tip1Middle}
          <a
            href="https://juejin.cn/user/1591748568038823"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 underline text-white/80 hover:text-white"
          >
            HiStewie
          </a>
          {home.tip1Suffix}
        </p>
        <p className="mt-2 text-medium text-white/60">
          {home.tip2}
        </p>
      </section>
    </main>
  );
}
