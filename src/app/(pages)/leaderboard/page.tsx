import type { Metadata } from 'next';

async function getData() {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/leaderboard?range=all&limit=100`, { cache: 'no-store' });
  return res.json();
}

export const metadata: Metadata = {
  title: '排行榜',
  alternates: { canonical: '/leaderboard' },
  openGraph: { title: '排行榜', url: '/leaderboard', type: 'website' },
};

export default async function LeaderboardPage() {
  const { users } = await getData();
  const ld: any = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Leaderboard',
    itemListElement: (users || []).slice(0, 20).map((u: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@type': 'Person', name: u.username },
    })),
  };
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">排行榜</h1>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <ol className="mt-4 space-y-2">
          {users.map((u: any, idx: number) => (
            <li key={u.id} className="flex items-center justify-between rounded border p-2">
              <div className="flex items-center gap-3">
                <span className="w-8 text-center font-mono">{idx + 1}</span>
                <span className="font-medium">{u.username}</span>
              </div>
              <span className="text-sm text-gray-600">{u.points} pts</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

