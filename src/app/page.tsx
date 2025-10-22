import { Button } from '@heroui/react';
import Link from 'next/link';
import LiquidEther from '@/components/LiquidEther';

export default function HomePage() {
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
          问以明之,习以成之
        </h1>
        <p className="mt-5 max-w-2xl text-white/80 text-[20px] md:text-[24px]">
          一键从文章到试题，智能抽取要点、生成多题型，助力高效巩固
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
            开始测试
          </Button>
          <Button
            as={Link}
            href="/history"
            variant="bordered"
            size="lg"
            radius="full"
            className="border-white/30 text-white/80 hover:text-white"
          >
            历史题库
          </Button>
        </div>

        {/* Tips */}
        <p className="mt-24 text-medium text-white/60">
          Tips：由于模型调用价格，所以生成测试题目功能仅对白名单开放，如果有想体验的朋友请掘金私信:
          <a
            href="https://juejin.cn/user/1591748568038823"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 underline text-white/80 hover:text-white"
          >
            HiStewie
          </a>
        </p>
        <p className="mt-2 text-medium text-white/60">
          目前仅支持「稀土掘金」题目生成，后续会支持其他平台。
        </p>
      </section>
    </main>
  );
}
