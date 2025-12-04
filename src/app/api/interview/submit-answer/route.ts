import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const {
      questionId,
      question,
      answer,
      duration,
      resumeAnalysis,
      qaHistory,
      currentRound,
      currentQuestionIndex,
      language
    } = await req.json();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 1. Evaluate current answer
    const evaluation = await evaluateAnswer({
      question,
      answer,
      resumeAnalysis,
      language,
      groq
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
        language,
        groq
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
    return NextResponse.json(
      { error: 'Failed to process answer', details: error.message },
      { status: 500 }
    );
  }
}

async function evaluateAnswer({ question, answer, resumeAnalysis, language, groq }: any) {
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

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content || '{}');
}

async function generateNextQuestion({ resumeAnalysis, qaHistory, currentRound, evaluation, language, groq }: any) {
  const roundFocus: Record<number, Record<string, string>> = {
    1: { zh: '项目经验和技术栈', en: 'Project experience and tech stack' },
    2: { zh: '技术原理和深度', en: 'Technical principles and depth' },
    3: { zh: '系统设计和架构', en: 'System design and architecture' }
  };

  const focus = roundFocus[currentRound]?.[language] || '';

  const systemPrompt = language === 'zh'
    ? `你是资深技术面试官。当前是第${currentRound}轮面试，重点考察：${focus}。

候选人简历：
- 经验：${resumeAnalysis?.experience?.join(', ') || '未知'}
- 技能：${resumeAnalysis?.skills?.join(', ') || '未知'}
- 项目：${resumeAnalysis?.projects?.join(', ') || '未知'}

已问问题：${qaHistory.map((qa: any) => qa.question).join('; ')}
上一题评估：得分${evaluation.score}分，${evaluation.feedback}

要求：
1. 根据简历和之前的回答，提出针对性的问题
2. 如果上一题答得好（>70分），深入追问原理
3. 如果上一题答得一般（50-70分），换个角度问
4. 如果上一题答得不好（<50分），降低难度或换话题
5. 问题要简洁（不超过30字）
6. 只返回问题文本，不要其他内容

请提出下一个问题：`
    : `You are a senior technical interviewer. Current round: ${currentRound}, focus: ${focus}.

Resume:
- Experience: ${resumeAnalysis?.experience?.join(', ') || 'Unknown'}
- Skills: ${resumeAnalysis?.skills?.join(', ') || 'Unknown'}
- Projects: ${resumeAnalysis?.projects?.join(', ') || 'Unknown'}

Asked: ${qaHistory.map((qa: any) => qa.question).join('; ')}
Last evaluation: Score ${evaluation.score}, ${evaluation.feedback}

Requirements:
1. Ask targeted questions based on resume and previous answers
2. If last answer was good (>70), dig deeper into principles
3. If last answer was average (50-70), change angle
4. If last answer was poor (<50), reduce difficulty or change topic
5. Keep question concise (max 20 words)
6. Return only the question text

Next question:`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: systemPrompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 100
  });

  const questionText = completion.choices[0].message.content?.trim() || '';

  return {
    id: `q_${Date.now()}`,
    text: questionText,
    round: currentRound,
    focus
  };
}

