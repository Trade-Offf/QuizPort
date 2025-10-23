'use client';
import { useEffect, useMemo, useState } from 'react';
import { Button, RadioGroup, Radio, CheckboxGroup, Checkbox, Input, Card, CardBody, Progress, CardHeader, Chip, Select, SelectItem } from '@heroui/react';

type Quiz = {
  id: string;
  title: string;
  type: 'single_choice' | 'multi_choice' | 'true_false' | 'short_answer';
  content: any;
  answer: any;
  explanation?: string | null;
};

export function SetPlayer({ setId, quizzes }: { setId: string; quizzes: Quiz[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong'>('all');
  const storageKey = useMemo(() => `qp_set_progress:${setId}`, [setId]);

  const current = quizzes[index];
  const progress = `${index + 1} / ${quizzes.length}`;
  const atFirst = index === 0;
  const atLast = index === quizzes.length - 1;

  const breakdownById = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    const arr: Array<{ quizId: string; isCorrect: boolean }> | undefined = result?.breakdown;
    if (Array.isArray(arr)) {
      for (const r of arr) map[r.quizId] = r.isCorrect;
    }
    return map;
  }, [result]);

  const isUnanswered = (q: Quiz): boolean => {
    const v = answers[q.id];
    if (q.type === 'multi_choice') return !Array.isArray(v) || v.length === 0;
    if (q.type === 'single_choice') return !v;
    if (q.type === 'true_false') return !(v === true || v === false);
    return !v;
  };

  const updateAnswer = (qid: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  // 加载已完成缓存（如存在）
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.setId === setId) {
          setAnswers(data.answers || {});
          setResult(data.result || null);
          setResultFilter(data.resultFilter || 'all');
          setIndex(0);
        }
      }
    } catch {}
  }, [storageKey, setId]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSetId: setId, answers }),
      });
      const data = await res.json();
      setResult(data);
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ setId, answers, result: data, resultFilter })
        );
      } catch {}
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      {!result && (
        <div className="flex items-center justify-between text-sm text-white/70">
          <div className="flex items-center gap-3">
            <Progress aria-label="进度" size="md" radius="lg" color="success" value={((index + 1) / quizzes.length) * 100} className="w-48" />
            <span>{progress}</span>
          </div>
          {atLast && (
            <Button color="success" onPress={submit} isDisabled={submitting}>
              {submitting ? '提交中…' : '提交'}
            </Button>
          )}
        </div>
      )}

      {!result && (
      <Card className="mt-4 rounded-2xl bg-white/5 border border-white/10 text-white">
        <CardBody className="p-5">
          {current && (
            <>
              <div className="text-base md:text-lg font-medium leading-7">{current.title}</div>
              <Question
                quiz={current}
                value={answers[current.id]}
                onChange={(v) => updateAnswer(current.id, v)}
              />
            </>
          )}
          <div className="mt-4 flex items-center gap-2">
            {!atFirst && (
              <Button variant="bordered" className="border-white/20 text-white" onPress={() => setIndex((i) => Math.max(0, i - 1))}>
                上一题
              </Button>
            )}
            {!atLast && (
              <Button
                variant="bordered"
                className="border-white/20 text-white"
                onPress={() => setIndex((i) => Math.min(quizzes.length - 1, i + 1))}
              >
                下一题
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      )}

      {result && (
        <>
          <Card className="mt-6 rounded-2xl bg-white/5 border border-white/10 text-white">
            <CardBody className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-base md:text-lg font-semibold">
                  得分 {result.score} / {quizzes.length} · 正确 {result.correctCount}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="solid"
                    className="bg-white text-black"
                    onPress={() => {
                      setAnswers({});
                      setResult(null);
                      setIndex(0);
                      setResultFilter('all');
                      try { localStorage.removeItem(storageKey); } catch {}
                    }}
                  >
                    重新挑战
                  </Button>
                  <span className="text-sm text-white/70">筛选</span>
                  <Select
                    size="sm"
                    variant="bordered"
                    selectedKeys={[resultFilter]}
                    onSelectionChange={(k:any)=>setResultFilter((Array.from(k)[0] as any)||'all')}
                    classNames={{
                      base: 'w-28',
                      trigger: 'bg-white/10 border-white/20 text-white',
                      value: 'text-white',
                      popoverContent: 'bg-black/90 border-white/10 text-white',
                    }}
                  >
                    <SelectItem key="all">All</SelectItem>
                    <SelectItem key="wrong">错题</SelectItem>
                  </Select>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {quizzes.filter(q => resultFilter==='all' ? true : !breakdownById[q.id]).map((q, idx) => {
              const isCorrect = !!breakdownById[q.id];
              const options: Array<{ id: string; text: string }> =
                q.content?.options || (q.type === 'true_false' ? [{ id: 'T', text: '对' }, { id: 'F', text: '错' }] : []);

              // 归一化答案集合
              const correctSet = new Set<string>(
                q.type === 'true_false'
                  ? [q.answer ? 'T' : 'F']
                  : q.type === 'single_choice'
                  ? [String(q.answer)]
                  : Array.isArray(q.answer)
                  ? q.answer.map((a: any) => String(a))
                  : []
              );
              const userV = answers[q.id];
              const userSet = new Set<string>(
                q.type === 'true_false'
                  ? [userV === true ? 'T' : userV === false ? 'F' : ''].filter(Boolean)
                  : q.type === 'single_choice'
                  ? [String(userV || '')].filter(Boolean)
                  : Array.isArray(userV)
                  ? userV.map((a: any) => String(a))
                  : []
              );

              const unanswered = isUnanswered(q);
              const status = isCorrect ? 'correct' : unanswered ? 'unanswered' : 'wrong';
              const statusColor = status==='correct' ? 'success' : status==='wrong' ? 'danger' : 'warning';
              return (
                <Card key={q.id} className="rounded-2xl bg-white/5 border border-white/10 text-white">
                  <CardHeader className="flex items-start justify-between pb-0">
                    <div className="text-sm font-medium line-clamp-2">{idx + 1}. {q.title}</div>
                    <Chip size="sm" color={statusColor} variant="flat">
                      {status==='correct' ? '正确' : status==='wrong' ? '错误' : '未作答'}
                    </Chip>
                  </CardHeader>
                  <CardBody className="p-4 pt-2">
                    <ul className="space-y-2">
                      {options.map((op) => {
                        const chosen = userSet.has(String(op.id));
                        const correct = correctSet.has(String(op.id));
                        const stateClass = correct
                          ? 'border-green-500 text-green-300'
                          : 'border-white/20 text-white/90';
                        const mark = correct ? '✓' : '';
                        return (
                          <li key={op.id} className={`flex items-center gap-3 rounded-lg border p-2 ${stateClass}`}>
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-mono bg-white/70 text-black">
                              {op.id}
                            </span>
                            <span className="flex-1 text-sm leading-6 flex items-center">
                              {op.text}
                              {chosen && <span className="ms-2 inline-block h-2 w-2 rounded-full bg-blue-500" aria-label="已选择" />}
                            </span>
                            {mark && <span className="text-sm font-semibold">{mark}</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {q.explanation && (
                      <div className="mt-2 text-xs text-white/70 line-clamp-3">解析：{q.explanation}</div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Question({
  quiz,
  value,
  onChange,
}: {
  quiz: Quiz;
  value: any;
  onChange: (v: any) => void;
}) {
  if (quiz.type === 'single_choice') {
    const options = quiz.content?.options || [];
    return (
      <RadioGroup className="mt-3" value={value} onValueChange={(v) => onChange(v)}>
        {options.map((op: any) => (
          <Radio
            key={op.id}
            value={op.id}
            color="success"
            classNames={{
              base:
                'inline-flex items-center w-full gap-3 p-2 cursor-pointer rounded-lg',
              wrapper: 'mr-1',
              label: 'flex-1 text-white',
            }}
          >
            {op.text}
          </Radio>
        ))}
      </RadioGroup>
    );
  }
  if (quiz.type === 'multi_choice') {
    const options = quiz.content?.options || [];
    const set = new Set<string>(Array.isArray(value) ? value : []);
    return (
      <CheckboxGroup className="mt-3" value={Array.from(set)} onValueChange={(v) => onChange(v)}>
        {options.map((op: any) => (
          <Checkbox
            key={op.id}
            value={op.id}
            color="success"
            classNames={{
              base:
                'inline-flex items-center w-full gap-3 p-2 cursor-pointer rounded-lg',
              wrapper: 'mr-1',
              label: 'flex-1 text-white',
            }}
          >
            {op.text}
          </Checkbox>
        ))}
      </CheckboxGroup>
    );
  }
  if (quiz.type === 'true_false') {
    return (
      <RadioGroup className="mt-3" value={value === true ? 'T' : value === false ? 'F' : undefined} onValueChange={(v) => onChange(v === 'T')}>
        <Radio value="T" color="success" classNames={{ base: 'inline-flex items-center w-full gap-3 p-2 cursor-pointer rounded-lg', wrapper: 'mr-1', label: 'flex-1 text-white' }}>对</Radio>
        <Radio value="F" color="success" classNames={{ base: 'inline-flex items-center w-full gap-3 p-2 cursor-pointer rounded-lg', wrapper: 'mr-1', label: 'flex-1 text-white' }}>错</Radio>
      </RadioGroup>
    );
  }
  // short_answer
  return (
    <div className="mt-3">
      <Input radius="md" variant="bordered" value={value || ''} onChange={(e) => onChange((e.target as HTMLInputElement).value)} placeholder="输入答案" />
    </div>
  );
}

function formatUserAnswer(q: Quiz, v: any): string {
  if (q.type === 'single_choice') return String(v || '');
  if (q.type === 'multi_choice') return Array.isArray(v) ? v.join(', ') : '';
  if (q.type === 'true_false') return v === true ? 'T' : v === false ? 'F' : '';
  if (q.type === 'short_answer') return String(v || '');
  return '';
}

function formatCorrectAnswer(q: Quiz): string {
  if (q.type === 'true_false') return q.answer ? 'T' : 'F';
  if (q.type === 'single_choice') return String(q.answer);
  if (q.type === 'multi_choice') return Array.isArray(q.answer) ? q.answer.join(', ') : '';
  if (q.type === 'short_answer') return String(q.answer || '');
  return '';
}
