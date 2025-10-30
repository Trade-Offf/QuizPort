import { NextResponse } from 'next/server';

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
  
  const system = `你是资深面试官与教学设计师。
目标：从一篇技术文章中抽取“可考的知识点”，据此设计有价值的深层练习题，贴近真实面试/实战场景。

流程（仅在脑内完成，不要输出过程）：
1) 解析文章，归纳8-15个“原子知识点”（概念、原理、度量/阈值、步骤、权衡、最佳实践、常见坑等）。
2) 基于这些知识点，设计10-15道题；题干不要拷贝原文句子，要用自己的话抽象与迁移；干净、具体、可判定。
3) 设计高质量干扰项：常见误解/边界条件/反例；避免“以上皆是/以上都不是”。

出题规范：
- 题型混合：single（单选）、multiple（多选）、boolean（判断）
- 难度分布：easy 60%、medium 30%、hard 10%
- 语言：简体中文；题干≤120字，选项≤60字；避免口语与无意义赘词
- boolean 选项固定：T/True、F/False；single 4个选项；multiple 4-6个选项
- 每题 explanation（8-40字）：指出知识点与关键理由/条件
- tags：给出1-3个主题标签（如“性能指标”、“SSR”、“缓存策略”）

输出：仅输出严格 JSON（不要 Markdown/代码块/多余文字）。`;

  const user = `请基于下文生成10-15道高质量题目。题目应围绕作者想表达的“知识点本身”，而非机械摘抄句子；更偏面试可考查的思维与能力。

文章标题：${title}

文章内容：
${text.slice(0, 16000)}

请严格按以下 JSON 输出：
{"version":"1.0","title":"${title}","questions":[{"id":"q1","type":"single|multiple|boolean","content":"...","options":[{"id":"A","text":"..."}],"answer":["A"],"explanation":"...","difficulty":"easy|medium|hard","tags":["..."]}]}

附加要求：
- boolean 的 options 固定为 [{"id":"T","text":"True"},{"id":"F","text":"False"}]，answer 为 ["T"] 或 ["F"]
- single 仅1个正确答案；multiple 至少2个正确答案
- 不要生成“以上皆是/都不是”等低质量选项
- 不要输出除 JSON 以外的任何内容。`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
  
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0.2 }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content as string | undefined;
    if (!content) return null;
    try { return JSON.parse(stripCodeFences(content)); } catch { return null; }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('[generateWithDeepSeek] Error:', error);
    return null;
  }
}

function cleanStem(raw: string, maxLen = 120): string {
  try {
    let s = String(raw || '');
    // 移除 Markdown 图片与链接
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
    s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    // 移除裸露 URL
    s = s.replace(/https?:\/\/\S+/g, '');
    // 移除常见头部元信息行
    s = s.replace(/^\s*(Title:|URL Source:|Published Time:|Markdown Content:).*$\n?/gim, '');
    s = s.replace(/^\s*Image\s*\d+:[^\n]*\n?/gim, '');
    // 去除多余符号与编号
    s = s.replace(/^\s*\d+\s*[\.|、]\s*/g, '');
    s = s.replace(/\(\s*\)/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length <= maxLen) return s;
    // 优先在句号/问号/顿号/逗号处截断
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

function fallbackQuestions(text: string, fallbackTitle: string) {
  const sentences = (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[。！？.!?])\s+/)
    .map((s) => cleanStem(s))
    .filter((s) => s && s.length >= 8)
    .slice(0, 20);
  const qs = sentences.slice(0, 12).map((s, i) => ({
    id: `fb_${i + 1}`,
    type: 'boolean',
    content: s.trim(),
    options: [],
    answer: ['T'],
    explanation: '陈述取自原文',
    difficulty: i < 7 ? 'easy' : i < 10 ? 'medium' : 'hard',
    tags: []
  }));
  if (qs.length < 10) {
    // 兜底填充
    for (let i = qs.length; i < 10; i++) {
      qs.push({ id: `fb_${i + 1}`, type: 'boolean', content: `${fallbackTitle}：判断正误`, options: [], answer: ['T'], explanation: '基础兜底题', difficulty: 'easy', tags: [] });
    }
  }
  return qs;
}

function normalize(raw: any, fallbackTitle: string) {
  const questions = Array.isArray(raw?.questions) ? raw.questions : [];
  const arr = questions.flatMap((q: any, idx: number) => {
    const type = q?.type === 'multiple' ? 'multiple' : q?.type === 'boolean' ? 'boolean' : 'single';
    let options = Array.isArray(q?.options) ? q.options : [];
    if (type === 'boolean') options = [{ id: 'T', text: 'True' }, { id: 'F', text: 'False' }];
    if (!options?.length || options.length < 2) options = [{ id: 'A', text: '选项A' }, { id: 'B', text: '选项B' }];
    options = options.map((op: any, i: number) => ({ id: String(op?.id || String.fromCharCode(65 + i)), text: cleanOption(String(op?.text || '选项')) })).slice(0, 6);
    let answer: string[] = Array.isArray(q?.answer) ? q.answer.map(String) : [];
    const optionIds = new Set(options.map((o: any) => String(o.id)));
    answer = answer.filter((a) => optionIds.has(String(a)));
    if (type === 'single') { if (answer.length !== 1) answer = [options[0].id]; }
    else if (type === 'multiple') { if (answer.length < 2) answer = options.slice(0, 2).map((o: any) => o.id); }
    else { if (answer.length !== 1 || (answer[0] !== 'T' && answer[0] !== 'F')) answer = ['T']; }
    const content = cleanStem(String(q?.content || fallbackTitle || `根据文章出题 ${idx + 1}`));
    const difficulty = ['easy','medium','hard'].includes(q?.difficulty) ? q.difficulty : 'easy';
    const tags = Array.isArray(q?.tags) ? q.tags.slice(0, 3) : [];
    return [{ id: q?.id || `q_${idx + 1}`, type, content, options, answer, explanation: q?.explanation || '', difficulty, tags }];
  });
  // 确保至少有10道题目
  const result = arr.slice(0, 15);
  if (result.length < 10) {
    console.log(`[normalize] Only normalized ${result.length} questions, expected at least 10`);
  }
  return result;
}

export async function POST(req: Request) {
  try {
    console.log('[generate-from-url/preview] Starting...');
    const { title, content } = await req.json();
    if (!content || typeof content !== 'string') return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    const safeTitle = (typeof title === 'string' && title.trim()) ? title.trim() : '未命名文章';
    const ai = await generateWithDeepSeek(content, safeTitle);
    let questions = normalize(ai ?? { questions: [] }, safeTitle);
    if (questions.length < 10) {
      // 无 Key 或 AI 失败时，用规则兜底，保证不 422
      questions = normalize({ questions: fallbackQuestions(content, safeTitle) }, safeTitle);
    }
    
    // 确保至少有10道题目
    if (questions.length < 10) {
      console.log(`[generate-from-url/preview] Only generated ${questions.length} questions, need at least 10`);
    }
    
    // 理论上不会走到这里
    if (questions.length === 0) {
      questions = normalize({ questions: fallbackQuestions(content, safeTitle) }, safeTitle);
    }
    
    return NextResponse.json({ title: safeTitle, questions });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Error' }, { status: 500 });
  }
}

 

