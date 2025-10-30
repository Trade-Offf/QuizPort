"use client";
import { useEffect, useMemo, useState } from 'react';

type Quiz = { id: string; title: string; type: string; tags: string[] };

export default function NewSetPage() {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resp, setResp] = useState<any>(null);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/quizzes?page=1&pageSize=100');
        const data = await res.json();
        setQuizzes(data.items ?? []);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const quizIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  const createSet = async () => {
    setResp(null);
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, description, quizIds }),
      });
      const data = await res.json();
      setResp(data);
      if (res.ok) setCreated({ id: data.set.id, slug: data.set.slug });
    } catch (e) {
      setResp({ error: String(e) });
    }
  };

  const publishSet = async () => {
    if (!created) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/sets/${created.slug}/publish`, { method: 'POST' });
      const data = await res.json();
      setResp(data);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold">创建题单</h1>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600">Slug（分享链接标识，仅小写、数字与连字符）</label>
              <input className="mt-1 w-full rounded border p-2" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="如: web3-basics" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">标题</label>
              <input className="mt-1 w-full rounded border p-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="题单标题" />
            </div>
            <div>
              <label className="block text-sm text-gray-600">描述</label>
              <textarea className="mt-1 w-full rounded border p-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="题单描述" />
            </div>

            <div className="flex items-center gap-2">
              <button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" onClick={createSet} disabled={!slug || !title || quizIds.length === 0}>创建题单</button>
              <button className="rounded border px-3 py-1 disabled:opacity-50" onClick={publishSet} disabled={!created || publishing}>{publishing ? '发布中…' : '发布题单'}</button>
            </div>
            {created && (
              <div className="text-sm text-gray-600">已创建：/set/{created.slug}</div>
            )}
          </div>

          <div>
            <div className="mb-2 text-sm text-gray-600">选择题目</div>
            <div className="max-h-[60vh] overflow-auto rounded border">
              {loading ? (
                <div className="p-3 text-sm text-gray-500">加载中…</div>
              ) : (
                <ul className="divide-y">
                  {quizzes.map((q) => (
                    <li key={q.id} className="flex items-center gap-2 p-3">
                      <input type="checkbox" checked={!!selected[q.id]} onChange={(e) => setSelected((prev) => ({ ...prev, [q.id]: e.target.checked }))} />
                      <div className="flex-1">
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-gray-500">{q.type} · {q.tags?.join(', ')}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {resp && (
          <pre className="overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(resp, null, 2)}</pre>
        )}
      </div>
    </main>
  );
}

