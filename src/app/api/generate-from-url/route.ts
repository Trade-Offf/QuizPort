import { NextResponse } from 'next/server';
import { requireUser, isAddressWhitelisted } from '@/lib/authz';
// Edge-safe crypto utilities
async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-1', enc.encode(input));
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
import { dbQueryOne, dbExecute } from '@/lib/db';

async function fetchArticle(
  url: string
): Promise<{ title: string; author?: string; content: string; ok: boolean }> {
  // 加 UA 与语言头，避免部分站点返回占位页；任何异常都返回兜底内容，避免 500
  let html = '';
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });
    if (res.ok) html = await res.text();
  } catch {
    // ignore network errors
  }
  // Juejin 等站点可能需要渲染，尝试通过 r.jina.ai 代理读取纯文本
  if (!html) {
    try {
      const proxyUrl = 'https://r.jina.ai/http://' + url.replace(/^https?:\/\//, '');
      const res = await fetch(proxyUrl, { cache: 'no-store' });
      if (res.ok) {
        const text = await res.text();
        const titleLine = text.split('\n').find((l) => /^#\s+/.test(l));
        const t = titleLine ? titleLine.replace(/^#\s+/, '').trim() : '未命名文章';
        const ok = text.trim().length > 150;
        return { title: t, author: undefined, content: ok ? text.slice(0, 20000) : '', ok };
      }
    } catch {}
    return { title: '未命名文章', author: undefined, content: '', ok: false };
  }
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || '未命名文章';
  // 提取作者（常见 meta）
  const authorMeta =
    html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(
      /<meta[^>]+property=["']article:author["'][^>]+content=["']([^"']+)["'][^>]*>/i
    )?.[1] ||
    html.match(/<meta[^>]+name=["']byl["'][^>]+content=["']by\s+([^"']+)["'][^>]*>/i)?.[1];
  let text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // 如果疑似反爬，占位或正文过短，尝试用 r.jina.ai 抓取可读文本
  if (text.toLowerCase().includes('please wait') || text.length < 400) {
    try {
      const proxyUrl = 'https://r.jina.ai/http://' + url.replace(/^https?:\/\//, '');
      const res = await fetch(proxyUrl, { cache: 'no-store' });
      if (res.ok) {
        const jr = await res.text();
        if (jr.trim().length > 150) {
          return { title, author: authorMeta?.trim(), content: jr.slice(0, 20000), ok: true };
        }
      }
    } catch {}
    return { title, author: authorMeta?.trim(), content: '', ok: false };
  }
  return { title, author: authorMeta?.trim(), content: text.slice(0, 20000), ok: true };
}

function naiveGenerateQuestions(text: string) {
  // MVP：占位生成三道题（判断/单选/多选），后续可接入模型。
  return [
    {
      id: 'q_bool',
      type: 'boolean',
      content: '这篇文章与前端开发相关（对/错）？',
      options: [
        { id: 'T', text: 'True' },
        { id: 'F', text: 'False' },
      ],
      answer: ['T'],
      explanation: '占位示例，可用模型判断主题。',
    },
    {
      id: 'q_single',
      type: 'single',
      content: '根据文章内容，下列哪项更贴切其主题？',
      options: [
        { id: 'A', text: '前端/框架' },
        { id: 'B', text: '后端/数据库' },
        { id: 'C', text: '操作系统' },
        { id: 'D', text: '计算机网络' },
      ],
      answer: ['A'],
      explanation: '占位示例，后续由模型生成。',
    },
    {
      id: 'q_multi',
      type: 'multiple',
      content: '文中提到的实践建议包括哪些？',
      options: [
        { id: 'A', text: '编写单元测试' },
        { id: 'B', text: '性能分析优化' },
        { id: 'C', text: '代码注释' },
        { id: 'D', text: '随机猜测' },
      ],
      answer: ['A', 'B'],
      explanation: '占位示例。',
    },
  ];
}

function stripCodeFences(s: string) {
  return s.replace(/```json[\s\S]*?\n|```/g, '').trim();
}

function cleanStem(raw: string, maxLen = 120): string {
  try {
    let s = String(raw || '');
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    s = s.replace(/https?:\/\/\S+/g, '');
    s = s.replace(/^\s*(Title:|URL Source:|Published Time:|Markdown Content:).*$\n?/gim, '');
    s = s.replace(/^\s*Image\s*\d+:[^\n]*\n?/gim, '');
    s = s.replace(/^\s*\d+\s*[\.|、]\s*/g, '');
    s = s.replace(/\(\s*\)/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length <= maxLen) return s;
    const cut = s.slice(0, maxLen + 1);
    const idx = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('？'), cut.lastIndexOf('！'), cut.lastIndexOf('，'), cut.lastIndexOf('.'));
    return (idx > 30 ? cut.slice(0, idx + 1) : s.slice(0, maxLen)).trim();
  } catch {
    return String(raw || '').slice(0, maxLen);
  }
}

function cleanOption(raw: string, maxLen = 60): string {
  const s = cleanStem(raw, maxLen);
  return s || '选项';
}

async function generateWithAI(text: string, title: string) {
  // 优先 DeepSeek；无则尝试 OpenAI；都没有返回 null
  const sys = '你是资深面试官与教学设计师，仅输出严格 JSON。';
  const user = `从文章中抽取核心知识点并设计3道高质量题（single/multiple/boolean）。题干不要抄原文，需能考察理解/应用/对比/权衡；每题给高质量干扰项。
字段：content（≤120字）、options（single 4项；multiple 4-6项；boolean T/F）、answer、explanation（8-40字给出理由/条件）。
仅输出：{"version":"1.0","title":"${title}","questions":[{"id":"q1","type":"single|multiple|boolean","content":"...","options":[{"id":"A","text":"..."}],"answer":["A"],"explanation":"..."}]}。
文章片段：\n${text.slice(0, 6000)}`;

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${deepseekKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content as string | undefined;
      if (content) {
        try {
          const json = JSON.parse(stripCodeFences(content));
          if (Array.isArray(json?.questions) && json.questions.length > 0) return json;
        } catch {}
      }
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content as string | undefined;
      if (content) {
        try {
          const json = JSON.parse(stripCodeFences(content));
          if (Array.isArray(json?.questions) && json.questions.length > 0) return json;
        } catch {}
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // 仅白名单地址允许生成
    if (!isAddressWhitelisted(user.walletAddress)) {
      return NextResponse.json({ error: 'Forbidden: Not whitelisted' }, { status: 403 });
    }
    const body = await req.json();
    const url = body?.url as string | undefined;
    if (!url || typeof url !== 'string')
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    const hasProvided = Array.isArray(body?.selectedQuestions) && body.selectedQuestions.length > 0;

    const article = await fetchArticle(url);
    if (!article.ok && !hasProvided) {
      return NextResponse.json(
        { error: 'ContentExtractionFailed', title: article.title },
        { status: 422 }
      );
    }
    const bodyTitle = (typeof body?.title === 'string' && body.title.trim()) || '';
    const bodyAuthor = (typeof body?.author === 'string' && body.author.trim()) || '';
    const resolvedTitle = bodyTitle || article.title || (() => {
      try { return new URL(url).hostname; } catch { return '未命名文章'; }
    })();
    const resolvedAuthor = bodyAuthor || article.author || undefined;
    const ai = body?.selectedQuestions
      ? null
      : await generateWithAI(article.content, article.title);

    // 规范化题目
    const normalize = (raw: any[]): any[] => {
      if (!Array.isArray(raw)) return [];
      return raw.flatMap((q, idx) => {
        const type =
          q?.type === 'multiple' ? 'multiple' : q?.type === 'boolean' ? 'boolean' : 'single';
        let options = Array.isArray(q?.options) ? q.options : [];
        if (type === 'boolean') {
          options = [
            { id: 'T', text: 'True' },
            { id: 'F', text: 'False' },
          ];
        }
        if (!Array.isArray(options) || options.length < 2) {
          options = [
            { id: 'A', text: '选项A' },
            { id: 'B', text: '选项B' },
          ];
        }
        options = options.map((op: any, i: number) => ({ id: String(op?.id || String.fromCharCode(65 + i)), text: cleanOption(String(op?.text || '选项')) })).slice(0, 6);
        let answer: string[] = Array.isArray(q?.answer) ? q.answer.map(String) : [];
        const optionIds = new Set(options.map((o: any) => String(o.id)));
        answer = answer.filter((a) => optionIds.has(String(a)));
        if (type === 'single') {
          if (answer.length !== 1) answer = [options[0].id];
        } else if (type === 'multiple') {
          if (answer.length < 2) answer = options.slice(0, 2).map((o: any) => o.id);
        } else {
          if (answer.length !== 1 || (answer[0] !== 'T' && answer[0] !== 'F')) answer = ['T'];
        }
        const content = cleanStem(String(q?.content || resolvedTitle || `根据文章出题 ${idx + 1}`));
        return [
          {
            id: q?.id || `q_${idx + 1}`,
            type,
            content,
            options,
            answer,
            explanation: q?.explanation || '',
          },
        ];
      });
    };

    let questions =
      body?.selectedQuestions ?? ai?.questions ?? naiveGenerateQuestions(article.content);
    questions = normalize(questions);
    if (questions.length === 0) questions = normalize(naiveGenerateQuestions(article.content));

    // 批量写入 Quiz（D1）
    const createdIds: string[] = [];
    for (const q of questions) {
      const mappedType =
        q.type === 'boolean'
          ? 'true_false'
          : q.type === 'single'
          ? 'single_choice'
          : 'multi_choice';
      const id = crypto.randomUUID();
      await dbExecute(
        'INSERT INTO quizzes (id, authorId, title, type, content, answer, explanation, tags, status, popularity, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id,
        user.id,
        cleanStem(q.content, 60),
        mappedType,
        JSON.stringify({ stem: cleanStem(q.content, 160), options: (q.options || []).map((op: any, i: number) => ({ id: String(op?.id || String.fromCharCode(65 + i)), text: cleanOption(String(op?.text || '选项')) })).slice(0, 6) }),
        JSON.stringify(
          mappedType === 'true_false'
            ? q.answer[0] === 'T'
            : mappedType === 'single_choice'
            ? q.answer[0]
            : q.answer,
        ),
        q.explanation ?? null,
        JSON.stringify(['auto', 'from-url']),
        'approved',
        0,
        new Date().toISOString(),
      );
      createdIds.push(id);
    }

    // 为该 URL 生成/复用题单（D1）
    const slug = 'u-' + (await sha1Hex(url)).slice(0, 10);
    const exists = await dbQueryOne<any>('SELECT id FROM quiz_sets WHERE slug = ?', slug);
    if (exists) {
      await dbExecute(
        'UPDATE quiz_sets SET title = ?, description = ?, quizIds = ?, updatedAt = ? WHERE slug = ? ',
        resolvedTitle,
        `来源：${url}${resolvedAuthor ? `\n作者：${resolvedAuthor}` : ''}`,
        JSON.stringify(createdIds),
        new Date().toISOString(),
        slug,
      );
    } else {
      const setId = crypto.randomUUID();
      await dbExecute(
        'INSERT INTO quiz_sets (id, slug, title, description, authorId, quizIds, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        setId,
        slug,
        resolvedTitle,
        `来源：${url}${resolvedAuthor ? `\n作者：${resolvedAuthor}` : ''}`,
        user.id,
        JSON.stringify(createdIds),
        'private',
        new Date().toISOString(),
      );
    }
    const set = await dbQueryOne<any>('SELECT * FROM quiz_sets WHERE slug = ?', slug);
    return NextResponse.json({ set, quizIds: createdIds });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Error' }, { status: 500 });
  }
}

 
