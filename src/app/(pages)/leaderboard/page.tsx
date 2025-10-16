async function getData() {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/leaderboard?range=all&limit=100`, { cache: 'no-store' });
  return res.json();
}

export default async function LeaderboardPage() {
  const { users } = await getData();
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold">排行榜</h1>
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

