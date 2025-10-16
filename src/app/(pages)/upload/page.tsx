"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });
const baseSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  explanation: z.string().optional(),
  tags: z.string().optional(), // 逗号分隔
});

const singleChoiceSchema = baseSchema.extend({
  type: z.literal('single_choice'),
  contentStem: z.string().min(1, '请输入题干'),
  options: z.array(optionSchema).min(2, '至少两个选项'),
  answerSingle: z.string().min(1, '请选择正确答案'),
});

const multiChoiceSchema = baseSchema.extend({
  type: z.literal('multi_choice'),
  contentStem: z.string().min(1, '请输入题干'),
  options: z.array(optionSchema).min(2, '至少两个选项'),
  answerMulti: z.array(z.string().min(1)).min(1, '至少一个正确选项'),
});

const trueFalseSchema = baseSchema.extend({
  type: z.literal('true_false'),
  contentStem: z.string().min(1, '请输入题干'),
  answerBool: z.enum(['true','false']),
});

const shortAnswerSchema = baseSchema.extend({
  type: z.literal('short_answer'),
  contentStem: z.string().min(1, '请输入题干'),
  answerAccepts: z.string().min(1, '至少一个答案'), // 逗号分隔
});

const schema = z.discriminatedUnion('type', [singleChoiceSchema, multiChoiceSchema, trueFalseSchema, shortAnswerSchema]);

type FormData = z.infer<typeof schema>;

function parseTags(input?: string) {
  return (input || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyOptions(n = 4) {
  return Array.from({ length: n }).map((_, i) => ({ id: String.fromCharCode(65 + i), text: '' }));
}

export default function UploadPage() {
  const [resp, setResp] = useState<any>(null);
  const [type, setType] = useState<'single_choice'|'multi_choice'|'true_false'|'short_answer'>('single_choice');
  const [batchJson, setBatchJson] = useState('');

  const defaultValues = useMemo<FormData>(() => {
    if (type === 'single_choice') return { type, title: '', explanation: '', tags: '', contentStem: '', options: emptyOptions(), answerSingle: '' } as any;
    if (type === 'multi_choice') return { type, title: '', explanation: '', tags: '', contentStem: '', options: emptyOptions(), answerMulti: [] } as any;
    if (type === 'true_false') return { type, title: '', explanation: '', tags: '', contentStem: '', answerBool: 'true' } as any;
    return { type, title: '', explanation: '', tags: '', contentStem: '', answerAccepts: '' } as any;
  }, [type]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
    mode: 'onChange',
  });

  const onSubmit = async (data: FormData) => {
    setResp(null);
    const common = { title: data.title, explanation: data.explanation, tags: parseTags((data as any).tags) };
    let payload: any;
    if (data.type === 'single_choice') {
      payload = {
        ...common,
        type: data.type,
        content: { stem: data.contentStem, options: data.options },
        answer: data.answerSingle,
      };
    } else if (data.type === 'multi_choice') {
      payload = {
        ...common,
        type: data.type,
        content: { stem: data.contentStem, options: data.options },
        answer: data.answerMulti,
      };
    } else if (data.type === 'true_false') {
      payload = {
        ...common,
        type: data.type,
        content: { stem: data.contentStem },
        answer: data.answerBool === 'true',
      };
    } else {
      payload = {
        ...common,
        type: data.type,
        content: { stem: data.contentStem },
        answer: { accepts: parseTags((data as any).answerAccepts) },
      };
    }
    const res = await fetch('/api/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const out = await res.json();
    setResp(out);
  };

  const onBatch = async () => {
    try {
      const payload = JSON.parse(batchJson);
      const res = await fetch('/api/quizzes/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const out = await res.json();
      setResp(out);
    } catch (e) {
      setResp({ error: String(e) });
    }
  };

  const batchPreview = useMemo(() => {
    if (!batchJson.trim()) return { pretty: '', errors: [] as string[], stats: null as any };
    try {
      const data = JSON.parse(batchJson);
      const errs: string[] = [];
      if (!data || typeof data !== 'object') errs.push('JSON 不是对象');
      if (!data.version) errs.push('缺少 version');
      if (!Array.isArray(data.questions) || data.questions.length === 0) errs.push('questions 必须为非空数组');
      const total = Array.isArray(data.questions) ? data.questions.length : 0;
      let singles = 0, multiples = 0, booleans = 0;
      if (Array.isArray(data.questions)) {
        for (const q of data.questions) {
          if (q?.type === 'single') singles++;
          else if (q?.type === 'multiple') multiples++;
          else if (q?.type === 'boolean') booleans++;
          if (!q?.id) errs.push('存在题目缺少 id');
          if (!q?.content) errs.push(`题 ${q?.id || '?'} 缺少 content`);
          if (!Array.isArray(q?.options) || q.options.length < 2) errs.push(`题 ${q?.id || '?'} options 至少 2 项`);
          if (!Array.isArray(q?.answer)) errs.push(`题 ${q?.id || '?'} answer 必须为数组`);
        }
      }
      return { pretty: JSON.stringify(data, null, 2), errors: Array.from(new Set(errs)), stats: { total, singles, multiples, booleans } };
    } catch (e: any) {
      return { pretty: '', errors: [String(e?.message || e)], stats: null };
    }
  }, [batchJson]);

  const livePreview = (() => {
    const data = watch();
    try {
      const common = { title: data.title, explanation: (data as any).explanation, tags: parseTags((data as any).tags) } as any;
      if (data.type === 'single_choice') return { ...common, type: data.type, content: { stem: (data as any).contentStem, options: (data as any).options }, answer: (data as any).answerSingle };
      if (data.type === 'multi_choice') return { ...common, type: data.type, content: { stem: (data as any).contentStem, options: (data as any).options }, answer: (data as any).answerMulti };
      if (data.type === 'true_false') return { ...common, type: data.type, content: { stem: (data as any).contentStem }, answer: (data as any).answerBool === 'true' };
      return { ...common, type: data.type, content: { stem: (data as any).contentStem }, answer: { accepts: parseTags((data as any).answerAccepts) } };
    } catch {
      return null;
    }
  })();

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">上传题目</h1>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm text-gray-600">题型</label>
              <select className="mt-1 w-full rounded border p-2" value={type} onChange={(e) => setType(e.target.value as any)}>
                <option value="single_choice">单选</option>
                <option value="multi_choice">多选</option>
                <option value="true_false">判断</option>
                <option value="short_answer">简答</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600">标题</label>
              <input className="mt-1 w-full rounded border p-2" {...register('title')} />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600">题干</label>
              <input className="mt-1 w-full rounded border p-2" {...register('contentStem' as any)} />
              {(errors as any).contentStem && <p className="mt-1 text-xs text-red-600">{(errors as any).contentStem.message}</p>}
            </div>

            {(type === 'single_choice' || type === 'multi_choice') && (
              <div>
                <label className="block text-sm text-gray-600">选项</label>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mt-1 flex items-center gap-2">
                    <input
                      className="w-16 rounded border p-2"
                      placeholder={`ID`}
                      value={(watch('options' as any)?.[i]?.id) || String.fromCharCode(65 + i)}
                      onChange={(e) => {
                        const arr = [...(watch('options' as any) || emptyOptions())];
                        arr[i] = { ...(arr[i] || {}), id: e.target.value };
                        setValue('options' as any, arr as any, { shouldValidate: true });
                      }}
                    />
                    <input
                      className="flex-1 rounded border p-2"
                      placeholder={`选项 ${i + 1}`}
                      value={(watch('options' as any)?.[i]?.text) || ''}
                      onChange={(e) => {
                        const arr = [...(watch('options' as any) || emptyOptions())];
                        arr[i] = { ...(arr[i] || {}), text: e.target.value };
                        setValue('options' as any, arr as any, { shouldValidate: true });
                      }}
                    />
                    {type === 'single_choice' ? (
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="radio" name="answerSingle"
                               checked={watch('answerSingle' as any) === (watch('options' as any)?.[i]?.id || String.fromCharCode(65 + i))}
                               onChange={() => setValue('answerSingle' as any, (watch('options' as any)?.[i]?.id || String.fromCharCode(65 + i)))} /> 正确
                      </label>
                    ) : (
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox"
                               checked={Array.isArray((watch('answerMulti' as any))) && (watch('answerMulti' as any))?.includes((watch('options' as any)?.[i]?.id || String.fromCharCode(65 + i)))}
                               onChange={(e) => {
                                 const id = (watch('options' as any)?.[i]?.id || String.fromCharCode(65 + i));
                                 const set = new Set<string>(watch('answerMulti' as any) || []);
                                 if (e.target.checked) set.add(id); else set.delete(id);
                                 setValue('answerMulti' as any, Array.from(set), { shouldValidate: true });
                               }} /> 正确
                      </label>
                    )}
                  </div>
                ))}
                {(errors as any).options && <p className="mt-1 text-xs text-red-600">{(errors as any).options.message}</p>}
                {(errors as any).answerSingle && <p className="mt-1 text-xs text-red-600">{(errors as any).answerSingle.message}</p>}
                {(errors as any).answerMulti && <p className="mt-1 text-xs text-red-600">{(errors as any).answerMulti.message}</p>}
              </div>
            )}

            {type === 'true_false' && (
              <div>
                <label className="block text-sm text-gray-600">正确答案</label>
                <select className="mt-1 w-full rounded border p-2" {...register('answerBool' as any)}>
                  <option value="true">对</option>
                  <option value="false">错</option>
                </select>
              </div>
            )}

            {type === 'short_answer' && (
              <div>
                <label className="block text-sm text-gray-600">允许答案（逗号分隔，忽略大小写与多空格）</label>
                <input className="mt-1 w-full rounded border p-2" {...register('answerAccepts' as any)} placeholder="如：HTTP, Hyper Text Transfer Protocol" />
                {(errors as any).answerAccepts && <p className="mt-1 text-xs text-red-600">{(errors as any).answerAccepts.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600">标签（逗号分隔）</label>
              <input className="mt-1 w-full rounded border p-2" {...register('tags' as any)} placeholder="web, http, 基础" />
            </div>

            <div>
              <label className="block text-sm text-gray-600">解析（可选）</label>
              <textarea className="mt-1 w-full rounded border p-2" rows={3} {...register('explanation' as any)} />
            </div>

            <button className="rounded bg-black px-3 py-1 text-white">提交</button>
          </form>

          <div>
            <div className="text-sm text-gray-600">实时预览（提交到后端的 JSON）</div>
            <pre className="mt-2 max-h-[70vh] overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(livePreview, null, 2)}</pre>
            {resp && (
              <>
                <pre className="mt-3 max-h-[40vh] overflow-auto rounded bg-gray-100 p-3 text-xs">{JSON.stringify(resp, null, 2)}</pre>
                {resp.quiz && (
                  <div className="mt-3">
                    <Link href="/creator/sets/new" className="inline-block rounded bg-black px-3 py-1 text-white">
                      去创建题单
                    </Link>
                  </div>
                )}
              </>
            )}

            <div className="mt-8">
              <div className="mb-2 text-sm font-medium">批量上传（粘贴题集 JSON）</div>
              <textarea className="h-48 w-full rounded border p-2 font-mono text-xs" value={batchJson} onChange={(e) => setBatchJson(e.target.value)} placeholder='{"version":"1.0","questions":[{"id":"q1","type":"single","content":"...","options":[{"id":"A","text":"..."},{"id":"B","text":"..."}],"answer":["A"]}]}' />
              <div className="mt-2 flex gap-2">
                <button className="rounded bg-black px-3 py-1 text-white" onClick={onBatch}>批量提交</button>
                <a className="rounded border px-3 py-1" href="https://gist.github.com/" target="_blank">示例与校验说明</a>
              </div>
              {batchPreview.pretty && (
                <div className="mt-3">
                  <div className="mb-1 text-xs text-gray-600">
                    预览：{batchPreview.stats ? `共 ${batchPreview.stats.total} 题 · 单选 ${batchPreview.stats.singles} · 多选 ${batchPreview.stats.multiples} · 判断 ${batchPreview.stats.booleans}` : ''}
                  </div>
                  <pre className="max-h-[40vh] overflow-auto rounded bg-gray-50 p-3 text-xs">{batchPreview.pretty}</pre>
                  {batchPreview.errors.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs text-red-600">
                      {batchPreview.errors.map((e, i) => (<li key={i}>{e}</li>))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

