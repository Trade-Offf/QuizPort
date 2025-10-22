import { NextResponse } from 'next/server';

// 基于 Playwright 的动态渲染抓取
// 需要在本地开发机安装：npx playwright install --with-deps

type ExtractResult = { title: string; author?: string | null; content: string; html?: string; ok: boolean; debug?: { matchedSelector?: string; titleSelector?: string; authorSelector?: string } };

async function extractWithPlaywright(url: string): Promise<ExtractResult> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // 等待网络稳定、主要容器出现
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
    const selectors = ['#article-root', 'article', '.markdown-body', '.article-content'];
    try { await page.waitForSelector(selectors.join(', '), { timeout: 8000 }); } catch {}
    // 触发懒加载
    try { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await new Promise(r=>setTimeout(r, 500)); } catch {}
    const data = await page.evaluate((sels) => {
      const getCleanText = (el: Element | null): string => {
        if (!el) return '';
        const clone = el.cloneNode(true) as HTMLElement;
        // 去除样式/脚本相关节点，避免把 CSS 文本带入正文
        clone.querySelectorAll('style,script,noscript,template').forEach((n) => n.remove());
        const html = clone.innerHTML || '';
        // 粗清洗：移除残余标签，再压缩空白
        return html
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      const getCleanHtml = (el: Element | null): string => {
        if (!el) return '';
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('style,script,noscript,template').forEach((n) => n.remove());
        // 移除重量级属性，保留基础语义标签
        const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
        while (walker.nextNode()) {
          const node = walker.currentNode as HTMLElement;
          node.removeAttribute('class');
          node.removeAttribute('style');
          node.removeAttribute('id');
          // 移除 on* 事件
          Array.from(node.attributes)
            .filter((a) => a.name.startsWith('on') || a.name.startsWith('data-'))
            .forEach((a) => node.removeAttribute(a.name));
        }
        return (clone.innerHTML || '').trim();
      };
      const getTitle = (root?: Element | Document): string => {
        // 先在全局找文章标题，再退到局部容器，再退到 document.title
        const globalTitleEl = document.querySelector('h1.article-title, #article-title');
        const globalTitle = globalTitleEl?.textContent?.trim();
        if (globalTitle && globalTitle.length > 0) return globalTitle;
        const scope = (root as Element) || document;
        const localEl = (scope as Element).querySelector?.('h1');
        const local = localEl?.textContent?.trim();
        return local && local.length > 0 ? local : (document.title || '未命名文章');
      };
      const getAuthor = (scope?: Element | Document): { value: string | null; selector: string } => {
        // 1) meta 优先
        const metaAuthor = document.querySelector('meta[name="author"], meta[property="article:author"]') as HTMLMetaElement | null;
        const metaVal = metaAuthor?.getAttribute('content')?.trim();
        if (metaVal) return { value: metaVal, selector: 'meta[name=author]|meta[property=article:author]' };
        // 2) 常见元素选择器（掘金等）
        const candidates = [
          '.author-name .name', // 掘金结构：.author-name 内部的 .name 才是作者
          '.author-name',
          '.author .name',
          '.article-author',
          'header .author',
          'a.author',
          'a[href*="user"] .name',
          'a[href*="/user/"]',
          '.username .name',
          'span.name',
        ];
        // 先在全局 document 查找
        for (const s of candidates) {
          const el = document.querySelector(s);
          const t = el?.textContent?.trim();
          if (t) return { value: t, selector: s + ' (global)' };
        }
        // 再在局部 scope 内兜底
        const base = (scope as Element) || document;
        if (base) {
          for (const s of candidates) {
            const el = (base as Element).querySelector?.(s);
            const t = el?.textContent?.trim();
            if (t) return { value: t, selector: s + ' (scoped)' };
          }
        }
        return { value: null, selector: '' };
      };

      for (const sel of sels) {
        const node = document.querySelector(sel);
        if (node) {
          const text = getCleanText(node);
          if (text && text.length > 400) {
            const a = getAuthor(node);
            return { title: getTitle(node), author: a.value, content: text, html: getCleanHtml(node), matchedSelector: sel, titleSelector: 'h1.article-title|#article-title|h1', authorSelector: a.selector };
          }
        }
      }
      const bodyNode = document.body;
      const a = getAuthor(bodyNode);
      return { title: getTitle(bodyNode), author: a.value, content: getCleanText(bodyNode), html: getCleanHtml(bodyNode), matchedSelector: 'body', titleSelector: 'fallback', authorSelector: a.selector };
    }, selectors);
    await browser.close();
    const ok = Boolean(data?.content && data.content.length > 400);
    return { title: data.title || '未命名文章', author: data.author || null, content: (data.content || '').slice(0, 20000), html: data.html, ok, debug: { matchedSelector: data.matchedSelector, titleSelector: data.titleSelector, authorSelector: data.authorSelector } };
  } catch (e) {
    return { title: '未命名文章', content: '', ok: false };
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    const result = await extractWithPlaywright(url);
    if (!result.ok) return NextResponse.json({ error: 'ContentExtractionFailed', title: result.title }, { status: 422 });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';


