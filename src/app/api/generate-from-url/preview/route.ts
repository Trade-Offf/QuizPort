import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authz';
import crypto from 'node:crypto';

function stripCodeFences(s: string) {
  return s.replace(/```json[\s\S]*?\n|```/g, '').trim();
}

type Article = { title: string; content: string; ok: boolean; debug: { source: 'direct'; matchedArticleRoot: boolean; excerpt: string; full: string } };

async function fetchArticle(url: string): Promise<Article> {
  let html = '';
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });
    if (res.ok) html = await res.text();
  } catch {}
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || '未命名文章';
  if (!html) {
    const full = '';
    return { title, content: '', ok: false, debug: { source: 'direct', matchedArticleRoot: false, excerpt: '', full } };
  }

  // 1) 优先尝试定位 #article-root
  let matchedArticleRoot = false;
  let baseText = '';
  const lower = html.toLowerCase();
  const idx = lower.indexOf('id="article-root"');
  if (idx >= 0) {
    // 简单窗口截取，避免复杂嵌套解析依赖；足以覆盖正文主要内容
    matchedArticleRoot = true;
    const windowSlice = html.slice(Math.max(0, idx - 200), Math.min(html.length, idx + 120000));
    baseText = windowSlice
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 2) 若未命中或文本过短，则退化为全文粗抽取
  if (!baseText || baseText.length < 400) {
    const coarse = html
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    baseText = coarse;
  }

  // 3) 若疑似占位或仍不足，判定为失败，避免浪费 AI Token
  if (baseText.toLowerCase().includes('please wait') || baseText.length < 400) {
    return { title, content: '', ok: false, debug: { source: 'direct', matchedArticleRoot, excerpt: '', full: '' } };
  }

  const full = baseText;
  const content = full.slice(0, 20000);
  return { title, content, ok: true, debug: { source: 'direct', matchedArticleRoot, excerpt: content.slice(0, 500), full } };
}

async function generateWithDeepSeek(text: string, title: string) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const system = '你是资深出题官。只输出严格 JSON，不要任何多余文字、解释、代码块标记或 Markdown。语言：简体中文；题型：single/multiple/boolean；数量：10-15。';
  const user = `请基于文章生成 10-15 道练习题，覆盖核心概念与易错点，难度分布：easy 60%、medium 30%、hard 10%。输出：{"version":"1.0","title":"${title}","questions":[{"id":"q1","type":"single|multiple|boolean","content":"...","options":[{"id":"A","text":"..."}],"answer":["A"],"explanation":"...","difficulty":"easy|medium|hard","tags":["..."]}]}
约束：boolean 使用 options=[{"id":"T","text":"True"},{"id":"F","text":"False"}] 且 answer 为 ["T"] 或 ["F"]；single 恰 1 个答案；multiple 至少 2 个答案；禁止无关内容；禁止 Markdown。
文章片段：\n${text.slice(0, 16000)}`;
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.2 })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content as string | undefined;
  if (!content) return null;
  try { return JSON.parse(stripCodeFences(content)); } catch { return null; }
}

function normalize(raw: any, fallbackTitle: string) {
  const questions = Array.isArray(raw?.questions) ? raw.questions : [];
  const arr = questions.flatMap((q: any, idx: number) => {
    const type = q?.type === 'multiple' ? 'multiple' : q?.type === 'boolean' ? 'boolean' : 'single';
    let options = Array.isArray(q?.options) ? q.options : [];
    if (type === 'boolean') options = [{ id: 'T', text: 'True' }, { id: 'F', text: 'False' }];
    if (!options?.length || options.length < 2) options = [{ id: 'A', text: '选项A' }, { id: 'B', text: '选项B' }];
    let answer: string[] = Array.isArray(q?.answer) ? q.answer.map(String) : [];
    const optionIds = new Set(options.map((o: any) => String(o.id)));
    answer = answer.filter((a) => optionIds.has(String(a)));
    if (type === 'single') { if (answer.length !== 1) answer = [options[0].id]; }
    else if (type === 'multiple') { if (answer.length < 2) answer = options.slice(0, 2).map((o: any) => o.id); }
    else { if (answer.length !== 1 || (answer[0] !== 'T' && answer[0] !== 'F')) answer = ['T']; }
    const content = String(q?.content || fallbackTitle || `根据文章出题 ${idx + 1}`);
    const difficulty = ['easy','medium','hard'].includes(q?.difficulty) ? q.difficulty : 'easy';
    const tags = Array.isArray(q?.tags) ? q.tags.slice(0, 3) : [];
    return [{ id: q?.id || `q_${idx + 1}`, type, content, options, answer, explanation: q?.explanation || '', difficulty, tags }];
  });
  return arr.slice(0, 15);
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { title, content } = await req.json();
    if (!content || typeof content !== 'string') return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    const safeTitle = (typeof title === 'string' && title.trim()) ? title.trim() : '未命名文章';
    const ai = await generateWithDeepSeek(content, safeTitle);
    const questions = normalize(ai ?? { questions: [] }, safeTitle);
    // 若空则构造占位3题
    const fallback = [
      { id: 'q_bool', type: 'boolean', content: '这篇文章与技术相关（对/错）？', options: [{ id: 'T', text: 'True' }, { id: 'F', text: 'False' }], answer: ['T'] },
      { id: 'q_single', type: 'single', content: '本文主题最贴近以下哪项？', options: [{ id: 'A', text: '前端/框架' }, { id: 'B', text: '后端/数据库' }, { id: 'C', text: '操作系统' }, { id: 'D', text: '计算机网络' }], answer: ['A'] },
      { id: 'q_multi', type: 'multiple', content: '文中可能涉及的实践包括哪些？', options: [{ id: 'A', text: '编写测试' }, { id: 'B', text: '性能优化' }, { id: 'C', text: '注释完善' }, { id: 'D', text: '随机猜测' }], answer: ['A', 'B'] },
    ];
    return NextResponse.json({ title: safeTitle, questions: questions.length ? questions : fallback });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Error' }, { status: 500 });
  }
}

export const runtime = 'nodejs';

