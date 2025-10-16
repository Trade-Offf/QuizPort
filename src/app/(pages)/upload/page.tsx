"use client";
import { useState } from 'react';

export default function UploadPage() {
  const [json, setJson] = useState('');
  const [resp, setResp] = useState<any>(null);
  const submit = async () => {
    try {
      const data = JSON.parse(json);
      const res = await fetch('/api/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      setResp(await res.json());
    } catch (e) {
      setResp({ error: String(e) });
    }
  };
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-xl font-semibold">上传题目（JSON）</h1>
        <textarea className="w-full rounded border p-2 font-mono" rows={12} value={json} onChange={(e) => setJson(e.target.value)} />
        <button className="rounded bg-black px-3 py-1 text-white" onClick={submit}>提交</button>
        {resp && <pre className="overflow-auto rounded bg-gray-100 p-3 text-sm">{JSON.stringify(resp, null, 2)}</pre>}
      </div>
    </main>
  );
}

