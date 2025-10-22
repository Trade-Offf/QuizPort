'use client';
import { useEffect } from 'react';

export function DebugMeta({
  title,
  author,
  sourceUrl,
  host,
  description,
}: {
  title: string;
  author?: string | null;
  sourceUrl?: string | null;
  host?: string | null;
  description?: string | null;
}) {
  useEffect(() => {
    // 统一打印到浏览器控制台，便于核对后端写入的数据
    // eslint-disable-next-line no-console
    console.log('[Set Debug]', { title, author, sourceUrl, host, description });
  }, [title, author, sourceUrl, host, description]);

  return null;
}


