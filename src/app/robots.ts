import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env['NEXT_PUBLIC_SITE_URL'] || process.env['NEXTAUTH_URL'] || 'https://www.quizport.org';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: new URL('/sitemap.xml', base).toString(),
  };
}

