import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: NextRequest) {
  try {
    const {
      language,
      interviewType,
      resumeAnalysis,
      qaHistory,
      duration
    } = await req.json();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Calculate overall score
    const scores = qaHistory.map((qa: any) => qa.score || 0);
    const overallScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);

    // Determine recommendation
    let recommendation: string;
    if (overallScore >= 80) recommendation = 'strong-hire';
    else if (overallScore >= 65) recommendation = 'hire';
    else if (overallScore >= 50) recommendation = 'maybe';
    else recommendation = 'no-hire';

    // Generate detailed feedback
    const feedbackPrompt = language === 'zh'
      ? `作为资深技术面试官，为候选人生成详细的面试反馈报告。

候选人背景：${JSON.stringify(resumeAnalysis)}
面试类型：${interviewType}
面试时长：${Math.round(duration / 60)}分钟
综合得分：${overallScore}/100

问答记录：
${qaHistory.map((qa: any, i: number) => `
Q${i + 1}: ${qa.question}
A${i + 1}: ${qa.answer}
得分: ${qa.score}/100
`).join('\n')}

请生成JSON格式的反馈报告：
{
  "breakdown": {
    "technical": 0-100分数,
    "communication": 0-100分数,
    "problemSolving": 0-100分数
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "improvements": ["改进建议1", "改进建议2", "改进建议3"],
  "detailedFeedback": "详细反馈（200-300字）",
  "studyRecommendations": ["学习建议1", "学习建议2"]
}`
      : `As a senior technical interviewer, generate a detailed interview feedback report.

Background: ${JSON.stringify(resumeAnalysis)}
Interview Type: ${interviewType}
Duration: ${Math.round(duration / 60)} minutes
Overall Score: ${overallScore}/100

Q&A History:
${qaHistory.map((qa: any, i: number) => `
Q${i + 1}: ${qa.question}
A${i + 1}: ${qa.answer}
Score: ${qa.score}/100
`).join('\n')}

Generate JSON feedback:
{
  "breakdown": {
    "technical": 0-100,
    "communication": 0-100,
    "problemSolving": 0-100
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "detailedFeedback": "detailed feedback (200-300 words)",
  "studyRecommendations": ["recommendation1", "recommendation2"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: feedbackPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const feedback = JSON.parse(completion.choices[0].message.content || '{}');

    // Generate markdown report
    const reportMarkdown = generateMarkdownReport({
      language,
      overallScore,
      recommendation,
      feedback,
      qaHistory,
      duration
    });

    return NextResponse.json({
      overallScore,
      recommendation,
      breakdown: feedback.breakdown,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      detailedFeedback: feedback.detailedFeedback,
      studyRecommendations: feedback.studyRecommendations,
      reportMarkdown
    });

  } catch (error: any) {
    console.error('Final evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate evaluation', details: error.message },
      { status: 500 }
    );
  }
}

function generateMarkdownReport({ language, overallScore, recommendation, feedback, qaHistory, duration }: any) {
  const title = language === 'zh' ? '# AI 模拟面试报告' : '# AI Mock Interview Report';
  const scoreLabel = language === 'zh' ? '综合得分' : 'Overall Score';
  const recLabel = language === 'zh' ? '面试建议' : 'Recommendation';
  const strengthsLabel = language === 'zh' ? '优势' : 'Strengths';
  const improvementsLabel = language === 'zh' ? '改进建议' : 'Areas for Improvement';
  const detailsLabel = language === 'zh' ? '详细反馈' : 'Detailed Feedback';
  const qaLabel = language === 'zh' ? '问答记录' : 'Q&A History';

  const recText: Record<string, string> = {
    'strong-hire': language === 'zh' ? '强烈推荐' : 'Strong Hire',
    'hire': language === 'zh' ? '推荐录用' : 'Hire',
    'maybe': language === 'zh' ? '待定' : 'Maybe',
    'no-hire': language === 'zh' ? '不推荐' : 'No Hire'
  };

  return `${title}

## ${scoreLabel}: ${overallScore}/100
## ${recLabel}: ${recText[recommendation]}

---

## ${strengthsLabel}
${feedback.strengths.map((s: string) => `- ${s}`).join('\n')}

## ${improvementsLabel}
${feedback.improvements.map((i: string) => `- ${i}`).join('\n')}

## ${detailsLabel}
${feedback.detailedFeedback}

---

## ${qaLabel}
${qaHistory.map((qa: any, i: number) => `
### Q${i + 1}: ${qa.question}
**A:** ${qa.answer}
**${language === 'zh' ? '得分' : 'Score'}:** ${qa.score}/100
`).join('\n')}

---

*${language === 'zh' ? '报告生成时间' : 'Generated at'}: ${new Date().toLocaleString()}*
`;
}

