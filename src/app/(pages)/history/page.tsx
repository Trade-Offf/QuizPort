'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader, Spinner, Chip, Button } from '@heroui/react';

type Item = { slug: string; title: string; description?: string; createdAt: string };

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);

  const load = async (p = 1) => {
    setLoading(true);
    const res = await fetch(`/api/history?page=${p}&pageSize=${pageSize}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setPage(data.page || p);
    setLoading(false);
  };

  useEffect(() => { load(1); }, []);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <main className="min-h-screen p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">历史题库</h1>
        {loading && (
          <div className="mt-6 flex items-center gap-2 text-gray-600"><Spinner size="sm"/> 载入中…</div>
        )}
        {!loading && items.length === 0 && (
          <Card className="mt-6 rounded-2xl">
            <CardBody className="py-12 text-center text-gray-600">
              <div className="text-base">暂无历史题库</div>
              <div className="mt-2 text-sm">去生成一个新的测验吧</div>
              <div className="mt-4">
                <Button as={Link} href="/upload" color="primary" radius="lg">前往生成</Button>
              </div>
            </CardBody>
          </Card>
        )}
        <div className="mt-6 grid gap-4 grid-cols-1">
          {items.map((it) => {
            const urlMatch = (it.description || '').match(/来源：([^\n\s]+)/);
            const host = (() => { try { return urlMatch?.[1] ? new URL(urlMatch[1]).hostname : ''; } catch { return ''; }})();
            return (
              <Card key={it.slug} as={Link} href={`/set/${it.slug}`} className="rounded-2xl bg-white/5">
                <CardHeader className="text-base font-medium line-clamp-2 text-white">{it.title}</CardHeader>
                <CardBody className="text-sm text-white/70 flex items-center gap-2">
                  {host && <Chip size="sm" variant="flat" className="text-white">{host}</Chip>}
                  <span>{new Date(it.createdAt).toLocaleString()}</span>
                </CardBody>
              </Card>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-white/70">第 {page} / {totalPages} 页</div>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="bordered" onPress={() => load(page - 1)}>上一页</Button>
            )}
            {page < totalPages && (
              <Button variant="bordered" onPress={() => load(page + 1)}>下一页</Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}


