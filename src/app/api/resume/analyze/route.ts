import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type');

    let resumeText = '';
    let language = 'zh';
    let interviewType = 'frontend';

    // Support both form data (PDF) and JSON (text input)
    if (contentType?.includes('application/json')) {
      // Text input mode
      const body = await req.json();
      resumeText = body.resumeText || '';
      language = body.language || 'zh';
      interviewType = body.interviewType || 'frontend';

      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json({
          error: language === 'zh'
            ? '简历内容太短，请至少输入50个字符'
            : 'Resume text is too short. Please enter at least 50 characters.'
        }, { status: 400 });
      }
    } else {
      // PDF upload mode - use simple text extraction
      const formData = await req.formData();
      const file = formData.get('file') as File;
      language = formData.get('language') as string;
      interviewType = formData.get('interviewType') as string;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Simple PDF text extraction using pdf-parse with proper error handling
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdfParse(buffer);
        resumeText = data.text;
      } catch (pdfError: any) {
        console.error('PDF parsing failed:', pdfError);

        // Fallback: suggest text input
        return NextResponse.json({
          error: language === 'zh'
            ? 'PDF解析失败。建议：点击下方"或者粘贴简历文本"按钮，直接粘贴简历内容。'
            : 'PDF parsing failed. Suggestion: Click "Or paste resume text" button below to paste your resume content directly.',
          suggestTextInput: true
        }, { status: 400 });
      }

      if (!resumeText || resumeText.trim().length < 50) {
        return NextResponse.json({
          error: language === 'zh'
            ? '无法从PDF中提取文本。建议：点击下方"或者粘贴简历文本"按钮，直接粘贴简历内容。'
            : 'Could not extract text from PDF. Suggestion: Click "Or paste resume text" button below to paste your resume content directly.',
          suggestTextInput: true
        }, { status: 400 });
      }
    }

    // 2. Analyze resume with LLM (comprehensive analysis)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const analysisPrompt = language === 'zh'
      ? `你是一位资深的${getInterviewTypeText(interviewType, 'zh')}技术面试官。请仔细分析以下简历，提取所有关键信息。

简历内容：
${resumeText}

请提取以下详细信息并返回JSON格式（必须是有效的JSON）：
{
  "name": "候选人姓名（如果有）",
  "yearsOfExperience": 总工作年限数字,
  "currentPosition": "当前或最近职位",
  "education": [
    {"school": "学校", "major": "专业", "degree": "学历", "year": "毕业年份"}
  ],
  "skills": {
    "languages": ["编程语言1", "编程语言2"],
    "frameworks": ["框架1", "框架2"],
    "tools": ["工具1", "工具2"],
    "databases": ["数据库1", "数据库2"],
    "other": ["其他技能1", "其他技能2"]
  },
  "workExperience": [
    {
      "company": "公司名称",
      "position": "职位",
      "duration": "时间段（如：2020.01-2022.12）",
      "responsibilities": ["主要职责1", "主要职责2", "主要职责3"]
    }
  ],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目简介（1-2句话）",
      "tech": ["使用的技术1", "使用的技术2"],
      "role": "你的角色",
      "achievements": ["项目成果1", "项目成果2"]
    }
  ],
  "achievements": ["获奖/认证/开源贡献等亮点"],
  "suggestedDifficulty": "junior|mid|senior|staff",
  "keyStrengths": ["核心优势1", "核心优势2", "核心优势3"],
  "focusAreas": ["面试重点考察领域1", "面试重点考察领域2"]
}

注意：
1. 项目经验是面试的重点，请尽可能详细提取
2. 如果简历中没有某项信息，该字段返回空数组[]或空字符串""
3. 确保返回的是有效的JSON格式`
      : `You are a senior ${getInterviewTypeText(interviewType, 'en')} technical interviewer. Please carefully analyze the following resume and extract all key information.

Resume:
${resumeText}

Extract the following detailed information and return valid JSON:
{
  "name": "Candidate name (if available)",
  "yearsOfExperience": total_years_number,
  "currentPosition": "Current or most recent position",
  "education": [
    {"school": "School", "major": "Major", "degree": "Degree", "year": "Graduation year"}
  ],
  "skills": {
    "languages": ["Programming language1", "Programming language2"],
    "frameworks": ["Framework1", "Framework2"],
    "tools": ["Tool1", "Tool2"],
    "databases": ["Database1", "Database2"],
    "other": ["Other skill1", "Other skill2"]
  },
  "workExperience": [
    {
      "company": "Company name",
      "position": "Position",
      "duration": "Duration (e.g., 2020.01-2022.12)",
      "responsibilities": ["Main responsibility1", "Main responsibility2", "Main responsibility3"]
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description (1-2 sentences)",
      "tech": ["Technology1", "Technology2"],
      "role": "Your role",
      "achievements": ["Achievement1", "Achievement2"]
    }
  ],
  "achievements": ["Awards/Certifications/Open source contributions"],
  "suggestedDifficulty": "junior|mid|senior|staff",
  "keyStrengths": ["Core strength1", "Core strength2", "Core strength3"],
  "focusAreas": ["Interview focus area1", "Interview focus area2"]
}

Note:
1. Project experience is the interview focus, extract as much detail as possible
2. If information is not available in resume, return empty array [] or empty string ""
3. Ensure valid JSON format`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // 3. Generate interview plan
    const interviewPlan = generateInterviewPlan(analysis, interviewType, language);

    return NextResponse.json({
      resumeText, // Return full resume text for display
      analysis,
      interviewPlan
    });

  } catch (error: any) {
    console.error('Resume analysis error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });

    return NextResponse.json(
      {
        error: 'Failed to analyze resume',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function getInterviewTypeText(type: string, lang: 'zh' | 'en'): string {
  const types: Record<string, Record<string, string>> = {
    frontend: { zh: '前端开发', en: 'Frontend Development' },
    backend: { zh: '后端开发', en: 'Backend Development' },
    fullstack: { zh: '全栈开发', en: 'Full-stack Development' },
    algorithm: { zh: '算法工程师', en: 'Algorithm Engineer' }
  };
  return types[type]?.[lang] || type;
}

function generateInterviewPlan(analysis: any, interviewType: string, language: string) {
  const roundFocus = language === 'zh' 
    ? {
        1: '自我介绍和项目经验',
        2: '技术深度和原理考察',
        3: '系统设计和架构思维'
      }
    : {
        1: 'Self-introduction and project experience',
        2: 'Technical depth and principles',
        3: 'System design and architecture'
      };

  // Extract skills array from skills object
  const skillsArray = analysis.skills
    ? [
        ...(analysis.skills.languages || []),
        ...(analysis.skills.frameworks || []),
        ...(analysis.skills.tools || [])
      ].slice(0, 5)
    : [];

  return {
    totalRounds: 3,
    questionsPerRound: 4,
    estimatedDuration: 20, // minutes
    rounds: [
      {
        round: 1,
        focus: roundFocus[1],
        topics: analysis.projects?.slice(0, 2).map((p: any) => p.name || p) || []
      },
      {
        round: 2,
        focus: roundFocus[2],
        topics: skillsArray
      },
      {
        round: 3,
        focus: roundFocus[3],
        topics: analysis.focusAreas || []
      }
    ]
  };
}

