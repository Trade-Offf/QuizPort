export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">QuizPort</h1>
        <p className="mt-2 text-gray-600">在线习题站 · MVP 初始化完成</p>
        <div className="mt-6">
          {/* 钱包登录按钮 */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700">身份：</span>
            {/* @ts-expect-error Server Component imports client */}
            <LoginButtonClient />
          </div>
        </div>
      </div>
    </main>
  );
}

// 分离一个 Client 包装以便在 Server 组件中引用
import dynamic from 'next/dynamic';
const LoginButtonClient = dynamic(() => import('@/components/SiweLoginButton').then(m => m.SiweLoginButton), { ssr: false });

