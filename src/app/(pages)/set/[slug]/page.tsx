import { notFound } from 'next/navigation';

async function getData(slug: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sets/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SetPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const { set, quizzes } = data;
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">{set.title}</h1>
        <p className="text-gray-600">{set.description}</p>
        <div className="mt-6 space-y-4">
          {quizzes.map((q: any, idx: number) => (
            <div key={q.id} className="rounded border p-4">
              <div className="text-sm text-gray-500">第 {idx + 1} 题</div>
              <div className="mt-1 font-medium">{q.title}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

