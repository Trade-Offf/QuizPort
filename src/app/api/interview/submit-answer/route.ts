import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

// Helper: Call AI with fallback
async function callAIWithFallback(prompt: string, options: { json?: boolean; maxTokens?: number; temperature?: number } = {}) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'];

  // Try Groq models first
  for (const model of groqModels) {
    try {
      console.log('[AI] Trying Groq model:', model);
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens,
        ...(options.json ? { response_format: { type: 'json_object' as const } } : {})
      });
      console.log('[AI] Success with Groq:', model);
      return completion.choices[0].message.content || '';
    } catch (err: any) {
      const errStr = String(err.message || err);
      console.warn('[AI] Groq failed:', model, errStr.substring(0, 80));
      const isRateLimit = errStr.includes('429') || errStr.includes('rate_limit') || errStr.includes('Rate limit');
      if (!isRateLimit) throw err;
    }
  }

  // Fallback to OpenAI-compatible API
  if (process.env.FALLBACK_API_KEY && process.env.FALLBACK_API_BASE) {
    try {
      console.log('[AI] Trying fallback API...');
      const openai = new OpenAI({
        apiKey: process.env.FALLBACK_API_KEY,
        baseURL: process.env.FALLBACK_API_BASE,
      });
      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o-mini',
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens,
        ...(options.json ? { response_format: { type: 'json_object' as const } } : {})
      });
      console.log('[AI] Success with fallback API');
      return completion.choices[0].message.content || '';
    } catch (err: any) {
      console.error('[AI] Fallback API failed:', err.message);
      throw err;
    }
  }

  throw new Error('All AI providers rate limited');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionId,
      question,
      answer,
      duration,
      resumeAnalysis,
      qaHistory = [],
      currentRound = 1,
      currentQuestionIndex = 0,
      language = 'zh'
    } = body;

    console.log('[submit-answer] Received:', { questionId, question: question?.substring(0, 30) + '...', answerLength: answer?.length, currentRound });
    console.log('[submit-answer] Full answer:', answer);

    // 1. Evaluate current answer
    const evaluation = await evaluateAnswer({
      question,
      answer,
      resumeAnalysis,
      language
    });

    // 2. Determine if should advance round or end interview
    const questionsInRound = qaHistory.filter((qa: any) => qa.round === currentRound).length + 1;
    const shouldAdvanceRound = questionsInRound >= 4; // 4 questions per round
    const nextRound = shouldAdvanceRound ? currentRound + 1 : currentRound;
    const shouldEndInterview = currentRound === 3 && shouldAdvanceRound;

    // 3. Generate next question (if not ending)
    let nextQuestion = null;
    if (!shouldEndInterview) {
      nextQuestion = await generateNextQuestion({
        resumeAnalysis,
        qaHistory: [...qaHistory, { question, answer, score: evaluation.score, round: currentRound }],
        currentRound: nextRound,
        evaluation,
        language
      });
    }

    return NextResponse.json({
      nextQuestion,
      evaluation: {
        score: evaluation.score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        feedback: evaluation.feedback
      },
      shouldAdvanceRound,
      shouldEndInterview,
      nextRound
    });

  } catch (error: any) {
    console.error('Submit answer error:', error);
    const errStr = String(error.message || error);
    const isRateLimit = errStr.includes('429') || errStr.includes('rate_limit') || errStr.includes('Rate limit');

    if (isRateLimit) {
      return NextResponse.json(
        {
          error: 'rate_limit',
          message: '😅 AI 模型额度用完啦！这是免费 Demo，后续会补充额度，请稍后再试~',
          retryable: true
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process answer', details: error.message },
      { status: 500 }
    );
  }
}

async function evaluateAnswer({ question, answer, resumeAnalysis, language }: any) {
  const prompt = language === 'zh'
    ? `作为资深技术面试官，评估候选人的回答质量。

问题：${question}
回答：${answer}
候选人背景：${JSON.stringify(resumeAnalysis)}

评估标准：
- 技术准确性（是否正确）
- 深度（是否深入原理）
- 表达清晰度（是否条理清晰）
- 实践经验（是否有实际案例）

请返回JSON格式：
{
  "score": 0-100的分数,
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1"],
  "feedback": "简短反馈（30字内）"
}`
    : `As a senior technical interviewer, evaluate the candidate's answer quality.

Question: ${question}
Answer: ${answer}
Background: ${JSON.stringify(resumeAnalysis)}

Criteria:
- Technical accuracy
- Depth of knowledge
- Communication clarity
- Practical experience

Return JSON:
{
  "score": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1"],
  "feedback": "brief feedback (max 30 words)"
}`;

  const result = await callAIWithFallback(prompt, { json: true });
  return JSON.parse(result || '{}');
}

// 根据简历动态识别职位类型和生成面试题库
function analyzeRoleAndGenerateContext(resumeAnalysis: any, language: string) {
  const skills = resumeAnalysis?.skills || {};
  const allSkills = [
    ...(skills.languages || []),
    ...(skills.frameworks || []),
    ...(skills.tools || [])
  ].map(s => s.toLowerCase());

  const projects = resumeAnalysis?.projects || [];
  const projectDescriptions = projects.map((p: any) =>
    typeof p === 'string' ? p : `${p.name} ${p.description || ''} ${(p.techStack || []).join(' ')}`
  ).join(' ').toLowerCase();

  const combined = allSkills.join(' ') + ' ' + projectDescriptions;

  // 职位类型检测规则
  const rolePatterns = {
    frontend: /react|vue|angular|next|nuxt|taro|webpack|vite|css|sass|less|tailwind|antd|element|小程序|miniprogram|h5|typescript|javascript/i,
    backend: /java|spring|springboot|mybatis|python|django|flask|fastapi|golang|go|gin|rust|c\+\+|php|laravel|ruby|rails|node|express|nest|koa|微服务|microservice/i,
    fullstack: /(react|vue).*(node|express|spring|django)|(node|spring|django).*(react|vue)/i,
    mobile: /ios|swift|android|kotlin|flutter|react.native|uni-app|移动端/i,
    devops: /docker|kubernetes|k8s|jenkins|cicd|aws|azure|gcp|terraform|ansible|运维|devops|sre/i,
    data: /python|pandas|numpy|spark|hadoop|flink|机器学习|深度学习|数据分析|data.analyst|bi|tableau|sql|etl/i,
    product: /产品|product|需求|prd|用户研究|竞品分析|roadmap/i,
    design: /ui|ux|figma|sketch|设计|design|交互/i,
    operations: /运营|operation|增长|growth|用户运营|内容运营|活动运营|数据运营/i
  };

  let detectedRole = 'general';
  for (const [role, pattern] of Object.entries(rolePatterns)) {
    if (pattern.test(combined)) {
      detectedRole = role;
      break;
    }
  }

  // 根据职位类型生成经典面试题范围
  const interviewTopics: Record<string, Record<string, string>> = {
    frontend: {
      zh: `**前端核心面试题范围：**
- JavaScript: 事件循环机制、闭包与作用域链、原型链继承、Promise/async-await实现原理、this绑定规则
- 框架原理: React Fiber架构与reconciliation、Vue响应式原理与依赖收集、虚拟DOM diff算法、Hooks实现原理
- 工程化: Webpack打包原理与优化、Tree Shaking原理、模块联邦、Vite为什么快
- 性能优化: 首屏优化、长列表虚拟滚动、内存泄漏排查、Core Web Vitals
- 网络与安全: HTTP缓存策略、HTTPS原理、XSS/CSRF防御、跨域解决方案`,
      en: `**Frontend Core Interview Topics:**
- JavaScript: Event loop, closures & scope chain, prototype inheritance, Promise/async-await internals, this binding
- Framework internals: React Fiber & reconciliation, Vue reactivity & dependency tracking, Virtual DOM diff, Hooks implementation
- Engineering: Webpack bundling & optimization, Tree Shaking, Module Federation, why Vite is fast
- Performance: First paint optimization, virtual scrolling, memory leak detection, Core Web Vitals
- Network & Security: HTTP caching, HTTPS, XSS/CSRF prevention, CORS solutions`
    },
    backend: {
      zh: `**后端核心面试题范围：**
- 语言特性: Java JVM内存模型与GC、Go协程调度原理、Python GIL、多线程与并发
- 框架原理: Spring IoC/AOP实现、MyBatis缓存机制、ORM N+1问题
- 数据库: MySQL索引原理与优化、事务隔离级别、锁机制、分库分表、Redis数据结构与持久化
- 分布式: CAP理论、分布式事务(2PC/TCC/Saga)、一致性哈希、服务注册发现、限流熔断
- 系统设计: 高并发架构、消息队列选型、缓存穿透/击穿/雪崩、秒杀系统设计`,
      en: `**Backend Core Interview Topics:**
- Language: JVM memory model & GC, Go goroutine scheduling, Python GIL, multithreading & concurrency
- Framework: Spring IoC/AOP implementation, MyBatis caching, ORM N+1 problem
- Database: MySQL indexing & optimization, transaction isolation levels, locking, sharding, Redis data structures
- Distributed Systems: CAP theorem, distributed transactions (2PC/TCC/Saga), consistent hashing, service discovery, rate limiting
- System Design: High concurrency architecture, message queue selection, cache penetration/breakdown/avalanche`
    },
    mobile: {
      zh: `**移动端核心面试题范围：**
- iOS: Swift内存管理(ARC)、RunLoop机制、多线程(GCD/Operation)、UI渲染原理、启动优化
- Android: Activity生命周期、Handler机制、View绘制流程、内存优化、Kotlin协程
- 跨平台: Flutter渲染原理、React Native桥接机制、性能对比与选型
- 通用: 网络优化、离线缓存策略、热更新方案、包体积优化、Crash监控`,
      en: `**Mobile Core Interview Topics:**
- iOS: Swift memory management (ARC), RunLoop, multithreading (GCD/Operation), UI rendering, launch optimization
- Android: Activity lifecycle, Handler mechanism, View drawing, memory optimization, Kotlin coroutines
- Cross-platform: Flutter rendering, React Native bridge, performance comparison
- General: Network optimization, offline caching, hot update, app size optimization, crash monitoring`
    },
    devops: {
      zh: `**DevOps/SRE核心面试题范围：**
- 容器化: Docker原理(namespace/cgroup)、镜像分层、Kubernetes架构与调度、Service Mesh
- CI/CD: Pipeline设计、蓝绿/金丝雀发布、GitOps实践
- 监控告警: Prometheus指标设计、日志采集方案、链路追踪、SLI/SLO/SLA
- 云原生: IaC实践(Terraform)、多云架构、成本优化
- 故障处理: 故障定位方法论、容灾设计、混沌工程`,
      en: `**DevOps/SRE Core Interview Topics:**
- Containerization: Docker internals (namespace/cgroup), image layering, Kubernetes architecture, Service Mesh
- CI/CD: Pipeline design, blue-green/canary deployment, GitOps practices
- Monitoring: Prometheus metrics design, log collection, distributed tracing, SLI/SLO/SLA
- Cloud Native: IaC (Terraform), multi-cloud architecture, cost optimization
- Incident Response: Troubleshooting methodology, disaster recovery, chaos engineering`
    },
    data: {
      zh: `**数据/AI核心面试题范围：**
- 数据处理: SQL优化、ETL流程设计、数据仓库建模(星型/雪花)、实时vs离线架构
- 大数据: Spark执行原理、Flink状态管理、数据倾斜处理、Hadoop生态
- 机器学习: 特征工程、过拟合处理、模型评估指标、常用算法原理(LR/树模型/神经网络)
- 数据分析: 指标体系设计、A/B测试、归因分析、用户分层
- 工程实践: 特征平台、模型serving、数据质量监控`,
      en: `**Data/AI Core Interview Topics:**
- Data Processing: SQL optimization, ETL design, data warehouse modeling (star/snowflake), real-time vs batch
- Big Data: Spark execution, Flink state management, data skew handling, Hadoop ecosystem
- Machine Learning: Feature engineering, overfitting, evaluation metrics, algorithm principles (LR/tree/neural networks)
- Data Analysis: Metrics design, A/B testing, attribution analysis, user segmentation
- Engineering: Feature platform, model serving, data quality monitoring`
    },
    product: {
      zh: `**产品经理核心面试题范围：**
- 产品设计: 需求分析方法、用户故事编写、PRD撰写、原型设计
- 用户研究: 用户访谈技巧、可用性测试、数据分析驱动决策
- 商业思维: 商业模式分析、竞品分析框架、ROI评估
- 项目管理: 优先级排序方法(RICE/ICE)、跨部门协作、敏捷实践
- 行业知识: 所在行业的核心指标、增长模型、用户生命周期`,
      en: `**Product Manager Core Interview Topics:**
- Product Design: Requirements analysis, user stories, PRD writing, prototyping
- User Research: Interview techniques, usability testing, data-driven decisions
- Business Thinking: Business model analysis, competitive analysis frameworks, ROI evaluation
- Project Management: Prioritization methods (RICE/ICE), cross-functional collaboration, Agile practices
- Domain Knowledge: Industry core metrics, growth models, user lifecycle`
    },
    operations: {
      zh: `**运营核心面试题范围：**
- 用户运营: 用户分层运营、生命周期管理、留存提升策略、社群运营
- 内容运营: 内容策划、传播机制、爆款方法论、UGC/PGC策略
- 活动运营: 活动策划流程、预算分配、效果复盘、裂变增长
- 数据运营: 核心指标体系、漏斗分析、归因模型、增长实验
- 商业化: 变现模式、LTV/CAC、付费转化优化`,
      en: `**Operations Core Interview Topics:**
- User Operations: User segmentation, lifecycle management, retention strategies, community management
- Content Operations: Content planning, viral mechanics, hit-making methodology, UGC/PGC strategies
- Campaign Operations: Campaign planning, budget allocation, retrospectives, viral growth
- Data Operations: Core metrics system, funnel analysis, attribution models, growth experiments
- Monetization: Revenue models, LTV/CAC, conversion optimization`
    },
    general: {
      zh: `**通用面试题范围：**
- 根据简历中的具体技能和项目经历，深入追问实现细节和原理
- 询问项目中遇到的最大挑战及解决方案
- 考察问题分析和解决能力
- 了解学习方法和成长路径`,
      en: `**General Interview Topics:**
- Deep dive into specific skills and project details from resume
- Ask about biggest challenges and solutions in projects
- Assess problem-solving abilities
- Understand learning methods and growth path`
    }
  };

  return {
    role: detectedRole,
    topics: interviewTopics[detectedRole] || interviewTopics.general
  };
}

async function generateNextQuestion({ resumeAnalysis, qaHistory, currentRound, evaluation, language }: any) {
  // 处理 skills
  const formatSkills = (skills: any) => {
    if (!skills) return '未知';
    if (Array.isArray(skills)) return skills.join(', ');
    const allSkills = [
      ...(skills.languages || []),
      ...(skills.frameworks || []),
      ...(skills.tools || [])
    ];
    return allSkills.length > 0 ? allSkills.join(', ') : '未知';
  };

  // 处理 projects - 提取详细信息
  const formatProjectsDetailed = (projects: any) => {
    if (!projects || !Array.isArray(projects)) return '未知';
    return projects.map((p: any) => {
      if (typeof p === 'string') return p;
      return `${p.name}(${p.techStack?.join(',') || ''}): ${p.description || ''}`;
    }).join('; ');
  };

  // 动态识别职位类型并生成面试题范围
  const { role, topics } = analyzeRoleAndGenerateContext(resumeAnalysis, language);
  const topicsText = topics[language] || topics['zh'];

  console.log('[generateNextQuestion] Detected role:', role);

  const systemPrompt = language === 'zh'
    ? `你是一位来自大厂的资深面试官（10年+经验），正在进行严肃的专业面试。

## 候选人信息
- 识别的岗位类型：${role}
- 工作年限：${resumeAnalysis?.yearsOfExperience || '未知'}年
- 技能：${formatSkills(resumeAnalysis?.skills)}
- 项目经历：${formatProjectsDetailed(resumeAnalysis?.projects)}

## 面试历史
${qaHistory.length > 0 ? qaHistory.map((qa: any, i: number) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer?.substring(0, 150)}...`).join('\n\n') : '这是第一个问题'}

## 上一题评估
得分：${evaluation.score}/100
反馈：${evaluation.feedback}

${topicsText}

## 出题原则

1. **深入原理，拒绝表面**
   - ❌ "你为什么选择这个技术？"、"介绍一下你的项目"
   - ✅ 直接问技术原理、实现细节、底层机制

2. **结合简历精准提问**
   - 根据候选人的技术栈和项目，问该领域的经典面试题
   - 结合候选人提到的具体项目追问实现细节

3. **根据得分动态调整**
   - 得分>80：追问更深的原理、边界情况、最佳实践
   - 得分60-80：换个角度问相关知识点
   - 得分<60：问该领域的基础概念

**格式要求：**
- 问题具体、有深度，直击核心
- 长度50字以内
- 只返回问题本身

请提出下一个面试问题：`
    : `You are a senior interviewer (10+ years) from a top company, conducting a serious professional interview.

## Candidate Info
- Detected Role: ${role}
- Experience: ${resumeAnalysis?.yearsOfExperience || 'Unknown'} years
- Skills: ${formatSkills(resumeAnalysis?.skills)}
- Projects: ${formatProjectsDetailed(resumeAnalysis?.projects)}

## Interview History
${qaHistory.length > 0 ? qaHistory.map((qa: any, i: number) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer?.substring(0, 150)}...`).join('\n\n') : 'This is the first question'}

## Last Answer Evaluation
Score: ${evaluation.score}/100
Feedback: ${evaluation.feedback}

${topicsText}

## Question Principles

1. **Deep principles, reject surface-level**
   - ❌ "Why did you choose this technology?", "Tell me about your project"
   - ✅ Ask about technical principles, implementation details, underlying mechanisms

2. **Precise questions based on resume**
   - Ask classic interview questions for their specific tech stack
   - Probe implementation details of their mentioned projects

3. **Adjust based on score**
   - Score >80: Ask deeper principles, edge cases, best practices
   - Score 60-80: Ask related concepts from different angle
   - Score <60: Ask fundamental concepts

**Format:**
- Specific, deep, to the point
- Under 50 words
- Return only the question

Next interview question:`;

  const questionText = await callAIWithFallback(systemPrompt, { maxTokens: 100, temperature: 0.7 });

  return {
    id: `q_${Date.now()}`,
    text: questionText.trim(),
    round: currentRound,
    focus: role // 使用检测到的角色作为 focus
  };
}

