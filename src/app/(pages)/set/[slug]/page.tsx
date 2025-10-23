import { notFound } from 'next/navigation';
import { Card, CardHeader, CardBody, Chip, Link as UiLink, Button } from '@heroui/react';
import Link from 'next/link';
import { DebugMeta } from './DebugMeta';

async function getData(slug: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sets/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function SetPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const { set, quizzes } = data;
  const urlMatch = (set.description || '').match(/来源：([^\n\s]+)/);
  const authorMatch = (set.description || '').match(/作者：([^\n]+)/);
  const sourceUrl = urlMatch?.[1];
  let host = '';
  try { if (sourceUrl) host = new URL(sourceUrl).hostname; } catch {}

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <DebugMeta title={set.title} author={authorMatch?.[1] || null} sourceUrl={sourceUrl || null} host={host || null} description={set.description || ''} />
        <Card className="rounded-2xl bg-white/5 border border-white/10 text-white">
          <CardBody>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl font-semibold tracking-tight truncate">{set.title}</div>
                <div className="mt-1 text-sm text-white/70">作者：{authorMatch?.[1] || '未识别'}</div>
              </div>
              {sourceUrl && (
                <Button as={Link as any} href={sourceUrl} target="_blank" color="success" radius="md" size="md" className="shrink-0 self-center">
                  原文链接
                </Button>
              )}
            </div>
          </CardBody>
        </Card>
        {/* 客户端播放器 */}
        <SetPlayerClient setId={set.id} quizzes={quizzes} />
      </div>
    </main>
  );
}

// 分离到客户端组件，避免在 Server Component 中使用 ssr:false 的 dynamic
function SetPlayerClient(props: { setId: string; quizzes: any[] }) {
  // 该组件在客户端渲染
  // 为了保持文件内联，使用懒加载的客户端 wrapper
  const Client = require('next/dynamic').default(() => import('./player').then(m => m.SetPlayer), { ssr: false });
  return <Client {...props} />;
}

