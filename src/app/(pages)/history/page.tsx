'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, Spinner, Chip, Button, Modal, ModalContent, ModalHeader, ModalBody, Tabs, Tab, Input } from '@heroui/react';
import { LinkButton } from '@/components/ui/LinkButton';

type Item = { slug: string; title: string; description?: string; createdAt: string };

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [total, setTotal] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareAuthor, setShareAuthor] = useState<string | null>(null);
  const [shareHost, setShareHost] = useState<string | null>(null);
  const [shareQuizTitles, setShareQuizTitles] = useState<string[]>([]);

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

  const openShare = async (slug: string, title: string, description?: string) => {
    setShareOpen(true);
    setShareSlug(slug);
    setShareTitle(title);
    const authorMatch = (description || '').match(/作者：([^\n]+)/);
    const urlMatch = (description || '').match(/来源：([^\n\s]+)/);
    let host: string | null = null;
    try { if (urlMatch?.[1]) host = new URL(urlMatch[1]).hostname; } catch {}
    setShareAuthor(authorMatch?.[1] || null);
    setShareHost(host);
    setShareQuizTitles([]);
    setShareLoading(true);
    try {
      const res = await fetch(`/api/sets/${slug}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const quizzes: Array<{ title: string }> = data?.quizzes || [];
        setShareQuizTitles(quizzes.slice(0, 3).map((q: any) => q.title));
      }
    } finally {
      setShareLoading(false);
    }
  };

  const currentShareUrl = typeof window !== 'undefined' && shareSlug ? `${window.location.origin}/set/${shareSlug}` : '';

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
            const authorMatch = (it.description || '').match(/作者：([^\n]+)/);
            return (
              <Card key={it.slug} className="rounded-2xl bg-white/5 border border-white/10 text-white">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between gap-6">
                    <div className="min-w-0 flex-1 flex flex-col items-start justify-center">
                      <Link href={`/set/${it.slug}`} className="text-base md:text-lg font-medium line-clamp-2 hover:underline">
                        {it.title}
                      </Link>
                      <div className="mt-2 flex items-center gap-3 text-sm text-white/70">
                        {host && <Chip size="sm" variant="flat" className="text-white">{host}</Chip>}
                        {authorMatch?.[1] && <span>作者：{authorMatch[1]}</span>}
                        <span>{new Date(it.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-center gap-2">
                      <LinkButton href={`/set/${it.slug}`} color="success" radius="lg">
                        开始测试
                      </LinkButton>
                      <Button variant="flat" radius="lg" className="bg-white/10 text-white" onPress={() => openShare(it.slug, it.title, it.description)}>
                        分享
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
        {/* 分享弹窗 */}
        <Modal
          isOpen={shareOpen}
          onOpenChange={setShareOpen}
          size="lg"
          scrollBehavior="inside"
          classNames={{ base: 'text-black', header: 'text-black', body: 'text-black' }}
        >
          <ModalContent>
            <ModalHeader className="text-base font-semibold">分享题库</ModalHeader>
            <ModalBody>
              <Tabs
                aria-label="分享方式"
                color="primary"
                variant="solid"
                className="mt-1"
                classNames={{ tabList: 'gap-2', tab: 'px-2 rounded-md data-[selected=true]:bg-black data-[selected=true]:text-white', tabContent: 'text-black', cursor: 'hidden' }}
              >
                <Tab key="card" title="卡片形式">
                  <div className="rounded-2xl border border-white/10 bg-black p-4 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-semibold line-clamp-2">{shareTitle}</div>
                        <div className="mt-1 text-sm text-white/70 flex items-center gap-2">
                          {shareAuthor && <span>作者：{shareAuthor}</span>}
                        </div>
                        <ul className="mt-3 pl-0 text-sm text-white/80 space-y-1">
                          {shareLoading && <li>载入题目预览…</li>}
                          {!shareLoading && shareQuizTitles.length === 0 && <li>暂无题目预览</li>}
                          {shareQuizTitles.map((t, i) => (
                            <li key={i} className="line-clamp-1 flex items-start gap-2">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/20 text-[12px] font-mono">{i + 1}</span>
                              <span className="flex-1">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0">
                        {currentShareUrl && (
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentShareUrl)}`}
                            alt="二维码"
                            className="h-40 w-40 rounded-lg bg-white p-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/80">提示：长按或截图保存此卡片，扫描二维码访问题库。</div>
                </Tab>
                <Tab key="link" title="复制链接">
                  <div className="flex items-center gap-2">
                    <Input readOnly value={currentShareUrl} classNames={{ input: 'text-black' }} variant="bordered" />
                    <Button
                      onPress={async () => { if (currentShareUrl) { try { await navigator.clipboard.writeText(currentShareUrl); } catch {} } }}
                      color="primary"
                    >
                      复制
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>
          </ModalContent>
        </Modal>
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


