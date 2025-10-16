"use client";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SiweLoginButton } from '@/components/SiweLoginButton';

export function Onboarding() {
  return (
    <section className="mt-6 space-y-6">
      <div className="card card-hover p-6">
        <h2 className="text-xl font-semibold">核心卖点</h2>
        <ul className="mt-3 space-y-2 pl-0 text-sm text-gray-700">
          <li>为博客而生：在博文末尾嵌入题目，读完即测。</li>
          <li>去中心化协作：任何人都能创建与复用题集，透明可追溯。</li>
          <li>钱包登录：无需注册，凭钱包管理身份与贡献。</li>
          <li>开放题库与评分：题目、解析与评分公开，质量由社区共建。</li>
        </ul>
        <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">
          接入说明：在你的技术博客嵌入一行脚本或 Markdown 卡片，即可把文章转化为“读完即测”的体验。
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ConnectButton />
          <SiweLoginButton />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <a href="/set/hello-world" className="card card-hover p-4">
          <div className="text-lg font-medium">试试示例题单</div>
          <div className="text-sm text-gray-600">快速体验作答与评分</div>
        </a>
        <a href="/quizzes" className="card card-hover p-4">
          <div className="text-lg font-medium">浏览题库</div>
          <div className="text-sm text-gray-600">探索更多题目</div>
        </a>
        <a href="/creator/sets/new" className="card card-hover p-4">
          <div className="text-lg font-medium">创建题单</div>
          <div className="text-sm text-gray-600">组合题目生成分享链接</div>
        </a>
      </div>
    </section>
  );
}

