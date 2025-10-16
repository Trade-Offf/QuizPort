"use client";
import { useMemo, useState } from 'react';

type Quiz = {
  id: string;
  title: string;
  type: 'single_choice'|'multi_choice'|'true_false'|'short_answer';
  content: any;
  answer: any;
  explanation?: string | null;
};

export function SetPlayer({ setId, quizzes }: { setId: string; quizzes: Quiz[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const current = quizzes[index];
  const progress = `${index + 1} / ${quizzes.length}`;

  const updateAnswer = (qid: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizSetId: setId, answers }),
      });
      setResult(await res.json());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>进度：{progress}</div>
        <button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" onClick={submit} disabled={submitting}>
          {submitting ? '提交中…' : '提交'}
        </button>
      </div>

      <div className="mt-4 rounded border p-4">
        <div className="font-medium">{current.title}</div>
        <Question
          quiz={current}
          value={answers[current.id]}
          onChange={(v) => updateAnswer(current.id, v)}
        />
        <div className="mt-3 flex items-center gap-2">
          <button className="rounded border px-3 py-1" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
            上一题
          </button>
          <button className="rounded border px-3 py-1" onClick={() => setIndex((i) => Math.min(quizzes.length - 1, i + 1))}>
            下一题
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded border bg-gray-50 p-4 text-sm">
          <div>得分：{result.score}，正确：{result.correctCount}</div>
        </div>
      )}
    </div>
  );
}

function Question({ quiz, value, onChange }: { quiz: Quiz; value: any; onChange: (v: any) => void }) {
  if (quiz.type === 'single_choice') {
    const options = quiz.content?.options || [];
    return (
      <div className="mt-3 space-y-2">
        {options.map((op: any) => (
          <label key={op.id} className="flex items-center gap-2">
            <input type="radio" name={quiz.id} checked={value === op.id} onChange={() => onChange(op.id)} />
            <span>{op.text}</span>
          </label>
        ))}
      </div>
    );
  }
  if (quiz.type === 'multi_choice') {
    const options = quiz.content?.options || [];
    const set = new Set<string>(Array.isArray(value) ? value : []);
    return (
      <div className="mt-3 space-y-2">
        {options.map((op: any) => (
          <label key={op.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={set.has(op.id)}
              onChange={(e) => {
                const next = new Set(set);
                if (e.target.checked) next.add(op.id); else next.delete(op.id);
                onChange(Array.from(next));
              }}
            />
            <span>{op.text}</span>
          </label>
        ))}
      </div>
    );
  }
  if (quiz.type === 'true_false') {
    return (
      <div className="mt-3 space-x-4">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name={quiz.id} checked={value === true} onChange={() => onChange(true)} /> 对
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name={quiz.id} checked={value === false} onChange={() => onChange(false)} /> 错
        </label>
      </div>
    );
  }
  // short_answer
  return (
    <div className="mt-3">
      <input className="w-full rounded border p-2" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="输入答案" />
    </div>
  );
}

