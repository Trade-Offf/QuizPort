import dynamic from 'next/dynamic';
import Image from 'next/image';
const Onboarding = dynamic(() => import('./onboarding').then(m => m.Onboarding), { ssr: false });

export default function HomePage() {
  return (
    <main className="min-h-screen bg-radial-fade">
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 py-12 text-center md:py-20">
        <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">
          <span className="bg-gradient-brand bg-clip-text text-transparent">把技术博客变成可验证的学习</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-gray-700 md:text-xl">去中心化练习题平台：钱包登录，任何人可出题、答题；在阅读之后，用题目验证理解、积累可携带的学习凭证。</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href="/quizzes" className="rounded-lg bg-primary-500 px-6 py-3 text-white shadow hover:bg-primary-600">开始练习</a>
          <a href="/creator/sets/new" className="rounded-lg border border-gray-300 px-6 py-3 text-gray-800 hover:border-gray-400">创建题单</a>
        </div>
        {/* 图片已取消按你的要求删除；保留容器结构以便后续需要时快速复用 */}
        {/* @ts-expect-error Server Component imports client */}
        <div className="w-full max-w-6xl">
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <a href="/set/hello-world" className="card card-hover p-6 text-left">
              <div className="text-xl font-semibold">试试示例题单</div>
              <p className="mt-2 text-sm text-gray-600">快速体验作答与评分</p>
            </a>
            <a href="/quizzes" className="card card-hover p-6 text-left">
              <div className="text-xl font-semibold">浏览题库</div>
              <p className="mt-2 text-sm text-gray-600">探索更多题目与解析</p>
            </a>
            <a href="/creator/sets/new" className="card card-hover p-6 text-left">
              <div className="text-xl font-semibold">创建题单</div>
              <p className="mt-2 text-sm text-gray-600">组合题目生成分享链接</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

