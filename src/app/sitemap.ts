import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env['NEXT_PUBLIC_SITE_URL'] || process.env['NEXTAUTH_URL'] || 'https://www.quizport.org';
  const abs = (p: string) => new URL(p, base).toString();

  const routes: MetadataRoute.Sitemap = [
    { url: abs('/') },
    { url: abs('/remote') },
    { url: abs('/history') },
    { url: abs('/leaderboard') },
  ];

  try {
    const res = await fetch(abs(`/api/history?page=1&pageSize=100`), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const items: Array<{ slug?: string; createdAt?: string }>
        = Array.isArray(data?.items) ? data.items : [];
      for (const it of items) {
        if (it.slug) {
          routes.push({
            url: abs(`/set/${it.slug}`),
            lastModified: it.createdAt ? new Date(it.createdAt) : undefined,
          });
        }
      }
    }
  } catch {}

  return routes;
}

