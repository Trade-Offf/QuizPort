import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/authz';

async function fetchPending() {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/review?status=pending`, { cache: 'no-store' });
  return res.json();
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const user = (session as any)?.userId ? { role: 'admin' } : null; // 仅示意：实际应查询数据库
  if (!hasRole(user as any, ['admin','moderator'])) {
    return <main className="p-6">无权访问</main>;
  }
  const { items } = await fetchPending();
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">审核队列</h1>
        <table className="mt-4 w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="border px-2 py-1">标题</th>
              <th className="border px-2 py-1">作者</th>
              <th className="border px-2 py-1">状态</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q: any) => (
              <tr key={q.id}>
                <td className="border px-2 py-1">{q.title}</td>
                <td className="border px-2 py-1">{q.authorId}</td>
                <td className="border px-2 py-1">{q.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

