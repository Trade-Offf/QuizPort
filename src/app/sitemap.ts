import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env['NEXT_PUBLIC_SITE_URL'] || process.env['NEXTAUTH_URL'] || 'https://www.quizport.org';
  const abs = (p: string) => new URL(p, base).toString();

  const routes: MetadataRoute.Sitemap = [
    { url: abs('/') },
    { url: abs('/remote') },
    { url: abs('/leaderboard') },
  ];

  return routes;
}

