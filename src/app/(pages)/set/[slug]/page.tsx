import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

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
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">{set.title}</h1>
        <p className="text-gray-600">{set.description}</p>
        {/* @ts-expect-error Server Component imports client */}
        <SetPlayerClient setId={set.id} quizzes={quizzes} />
      </div>
    </main>
  );
}

const SetPlayerClient = dynamic(() => import('./player').then(m => m.SetPlayer), { ssr: false });

