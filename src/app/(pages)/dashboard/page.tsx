import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileForm from './profile-form';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const myQuizzes = userId ? await prisma.quiz.findMany({ where: { authorId: userId }, orderBy: { createdAt: 'desc' }, take: 10 }) : [];
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">个人面板</h1>
        {!user && <p className="text-gray-600">请先登录。</p>}
        {user && (
          <div className="space-y-2">
            <div>昵称：{user.username}</div>
            <div>积分：{user.points}</div>
          </div>
        )}
        <div>
          <h2 className="mt-6 text-xl font-semibold">我上传的题目</h2>
          <ul className="list-disc pl-5">
            {myQuizzes.map((q) => (
              <li key={q.id}>{q.title}（{q.status}）</li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          {/* @ts-expect-error Server Component imports client */}
          <ProfileForm initial={{ username: user?.username || '', avatarUrl: user?.avatarUrl || '' }} />
        </div>
      </div>
    </main>
  );
}

