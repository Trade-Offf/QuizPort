'use client';
import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Checkbox,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { useTranslations } from '@/components/providers/LanguageProvider';

type Option = { id: string; text: string };
type PreviewQuestion = {
  id: string;
  type: 'single' | 'multiple' | 'boolean';
  content: string;
  options: Option[];
  answer: string[]; // 用于预览参考；创建时按服务端 normalize 处理
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
};

export default function UploadPage() {
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState<string | undefined>(undefined);
  const [content, setContent] = useState('');
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'warning' | 'danger' | 'info';
  } | null>(null);
  const [existsSlug, setExistsSlug] = useState<string | null>(null);
  const [debug, setDebug] = useState<{
    source: 'direct' | 'proxy' | 'fallback';
    matchedArticleRoot: boolean;
    excerpt: string;
    full?: string;
  } | null>(null);
  const canCreate = selected.size >= 10;
  const upload = useTranslations('upload');
  const common = useTranslations('common');

  const extractArticle = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    setQuestions([]);
    setSelected(new Set());
    setTitle('');
    setContent('');
    setDebug(null);
    try {
      const res = await fetch('/api/article-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setTitle((data?.title || '').trim());
        setAuthor((data?.author || '')?.trim() || undefined);
        setContent((data?.content || '').trim());
        try { console.log('[Extract Preview]', { title: data?.title, author: data?.author }); } catch {}
        setDebug({
          source: 'direct',
          matchedArticleRoot: true,
          excerpt: (data?.content || '').slice(0, 200),
          full: data?.content || '',
        });
      } else {
        setDebug({ source: 'direct', matchedArticleRoot: false, excerpt: '', full: '' });
      }
    } finally {
      setExtracting(false);
    }
  };

  const genPreview = async () => {
    if (!content) return;
    setGenerating(true);
    setToast({ message: upload.toasts.generating, tone: 'info' });
    setQuestions([]);
    setSelected(new Set());
    try {
      const res = await fetch('/api/generate-from-url/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(Array.isArray(data?.questions) ? data.questions : []);
        setToast({ message: upload.toasts.generated, tone: 'success' });
      } else {
        setToast({ message: upload.toasts.generateFailed, tone: 'danger' });
      }
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const ids = questions.map((q) => q.id);
    setSelected(new Set(ids));
  };
  const clearAll = () => setSelected(new Set());

  const createSet = async () => {
    if (!canCreate || submitting) return;
    setSubmitting(true);
    setToast({ message: upload.toasts.creating, tone: 'info' });
    try {
      const payload = {
        url,
        title,
        author,
        selectedQuestions: questions.filter((q) => selected.has(q.id)),
      };
      const res = await fetch('/api/generate-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          setToast({ message: upload.toasts.loginRequired, tone: 'warning' });
        } else if (res.status === 409) {
          const slug409: string | undefined = data?.set?.slug;
          if (slug409) {
            setExistsSlug(slug409);
            setToast({ message: upload.toasts.existing, tone: 'info' });
          } else {
            setToast({ message: upload.toasts.existing, tone: 'info' });
          }
        } else {
          setToast({ message: data?.error || upload.toasts.createFailed, tone: 'danger' });
        }
        return;
      }
      
      const slug: string | undefined = data?.set?.slug;
      if (slug) {
        await fetch(`/api/sets/${slug}/publish`, { method: 'POST' });
        setToast({ message: upload.toasts.created, tone: 'success' });
        window.location.href = `/set/${slug}`;
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center md:items-start md:text-left gap-2">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">{upload.title}</h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs md:text-sm text-white/80 ring-1 ring-white/10">
            <span className="inline-block h-2 w-2 rounded-full bg-white/70" />
            {upload.subtitleBadge}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <Input
            size="lg"
            radius="full"
            variant="bordered"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={upload.placeholder}
          />
          <Button
            onPress={extractArticle}
            color="primary"
            size="lg"
            radius="full"
            isDisabled={extracting}
            isLoading={extracting}
          >
            {upload.fetchButton}
          </Button>
        </div>

        {debug && (
          <Card className="mt-6 rounded-2xl">
            <CardHeader className="text-base font-semibold">{upload.previewCard.title}</CardHeader>
            <CardBody className="space-y-3">
              <div className="text-sm text-gray-600">
                {upload.previewCard.sourceLabel}：{debug.source} · {upload.previewCard.articleBodyLabel}：
                {debug.matchedArticleRoot ? common.yes : common.no}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{upload.previewCard.titleLabel}</div>
                <div className="text-sm text-gray-800">{title || upload.previewCard.titleEmpty}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{upload.previewCard.authorLabel}</div>
                <div className="text-sm text-gray-800">{author || upload.previewCard.authorEmpty}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{upload.previewCard.contentLabel}</div>
                <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded bg-default-100 p-3 text-sm text-gray-800">
                  {debug.excerpt || upload.previewCard.contentEmpty}
                </pre>
              </div>
              {debug.full && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    {upload.previewCard.expandLabel}
                  </summary>
                  <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-default-50 p-3 text-sm text-gray-800">
                    {content}
                  </pre>
                </details>
              )}
              <div className="pt-2 grid grid-cols-[auto_1fr] items-center gap-3">
                <Button
                  color="primary"
                  radius="lg"
                  onPress={genPreview}
                  isDisabled={!content}
                  isLoading={generating}
                >
                  {upload.previewCard.generateButton}
                </Button>
                <div className="text-xs md:text-sm text-gray-500">
                  {upload.previewCard.generateHint}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {questions.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-medium">{title || upload.previewCard.previewTitleFallback}</div>
                <div className="text-sm text-gray-600">
                  {upload.selectionSummary(selected.size, questions.length, 10)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="bordered"
                  onPress={selectAll}
                  radius="lg"
                  className="text-white border-white/30 hover:text-white"
                >
                  {upload.actions.selectAll}
                </Button>
                <Button
                  variant="bordered"
                  onPress={clearAll}
                  radius="lg"
                  className="text-white border-white/30 hover:text-white"
                >
                  {upload.actions.clearAll}
                </Button>
                <Button
                  color="success"
                  onPress={createSet}
                  radius="lg"
                  isDisabled={!canCreate || submitting}
                  isLoading={submitting}
                >
                  {submitting ? upload.actions.creating : upload.actions.create}
                </Button>
                <div className="text-xs text-gray-500">
                  {upload.actions.createHint}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <Progress
                aria-label={upload.progressAria}
                size="sm"
                radius="lg"
                value={Math.min(selected.size, 10) * 10}
                color="success"
                className="max-w-md"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {questions.map((q, idx) => (
                <Card
                  key={q.id}
                  className={`${
                    selected.has(q.id) ? 'ring-1 ring-primary-500 bg-primary-50' : ''
                  } rounded-2xl`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium leading-6">
                        {idx + 1}. {q.content}
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <Checkbox isSelected={selected.has(q.id)} onChange={() => toggle(q.id)} />
                      </label>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`px-1 text-sm ${
                          q.type === 'single'
                            ? 'text-blue-600'
                            : q.type === 'multiple'
                            ? 'text-purple-600'
                            : 'text-green-600'
                        }`}
                      >
                        {upload.questionTypes[q.type]}
                      </span>
                      <Chip
                        size="sm"
                        color={
                          q.difficulty === 'hard'
                            ? 'danger'
                            : q.difficulty === 'medium'
                            ? 'warning'
                            : 'success'
                        }
                        variant="flat"
                      >
                        {upload.difficulty[q.difficulty || 'easy']}
                      </Chip>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {q.options.map((op) => (
                        <li key={op.id} className="flex items-start gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-mono bg-white/70">
                            {op.id}
                          </span>
                          <span className="leading-6">{op.text}</span>
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <div className="mt-2 text-xs text-gray-500">
                        {upload.explanationLabel}
                        {q.explanation}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {upload.meta.type}：{upload.questionTypes[q.type]} · {upload.meta.difficulty}：
                      {upload.difficulty[q.difficulty || 'easy']}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        )}
        <p className="mt-10 text-sm text-white/70">{upload.bottomNote}</p>
      </div>
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg ${
            toast.tone === 'success'
              ? 'bg-green-600'
              : toast.tone === 'warning'
              ? 'bg-yellow-600'
              : toast.tone === 'danger'
              ? 'bg-red-600'
              : 'bg-gray-900'
          }`}
        >
          {toast.message}
        </div>
      )}
      <Modal isOpen={!!existsSlug} onOpenChange={(open) => { if (!open) setExistsSlug(null); }} classNames={{ base: 'text-black' }}>
        <ModalContent>
          <ModalHeader className="text-base font-semibold">{upload.modal.title}</ModalHeader>
          <ModalBody>
            <div className="text-sm text-gray-700">{upload.modal.description}</div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setExistsSlug(null)}>{upload.modal.dismiss}</Button>
            {existsSlug && (
              <Button color="primary" onPress={() => { window.location.href = `/set/${existsSlug}`; }}>{upload.modal.confirm}</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
