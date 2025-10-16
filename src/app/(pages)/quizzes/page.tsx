async function getData(query = '') {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/quizzes${query ? `?${query}` : ''}`, { cache: 'no-store' });
  return res.json();
}

export default async function QuizzesPage() {
  // 显示所有状态（包括刚上传的 pending），按时间倒序
  const { items } = await getData('sort=new&page=1&pageSize=50');
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">题库</h1>
        <ul className="mt-4 divide-y">
          {items.map((q: any) => (
            <li key={q.id} className="py-3">
              <div className="font-medium">{q.title}</div>
              <div className="text-xs text-gray-500">{q.type} · {q.tags?.join(', ')} · {q.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

