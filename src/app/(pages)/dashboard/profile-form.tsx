"use client";
import { useState } from 'react';

export default function ProfileForm({ initial }: { initial: { username: string; avatarUrl: string } }) {
  const [username, setUsername] = useState(initial.username);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [resp, setResp] = useState<any>(null);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, avatarUrl }),
      });
      const data = await res.json();
      setResp(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded border p-4">
      <div className="text-lg font-semibold">资料编辑</div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm text-gray-600">昵称</label>
          <input className="mt-1 w-full rounded border p-2" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">头像 URL</label>
          <input className="mt-1 w-full rounded border p-2" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        </div>
      </div>
      <div className="mt-3">
        <button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" onClick={save} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
      {resp && <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs">{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
}

