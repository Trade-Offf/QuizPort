'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { FileText, Loader2, ArrowRight, Check, Upload } from 'lucide-react';

type Language = 'zh' | 'en';
type InterviewType = 'frontend' | 'backend' | 'fullstack';

export default function InterviewPrep() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>('zh');
  const [interviewType, setInterviewType] = useState<InterviewType>('frontend');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setResumeFile(file);
        setError('');
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        handleFileUpload(file);
      }
    }
  });

  const handleFileUpload = async (file: File) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('interviewType', interviewType);

      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      // Handle rate limit error
      if (res.status === 429 || data.error === 'rate_limit') {
        setError(data.message || '😅 AI 模型额度用完啦！这是免费 Demo，后续会补充额度，请稍后再试~');
        setResumeFile(null);
        setPdfUrl('');
        return;
      }

      if (!res.ok) {
        if (data.suggestTextInput) {
          setError(data.error);
        }
        throw new Error(data.details || data.error || 'Failed to analyze resume');
      }

      console.log('📄 Resume Analysis Result:', JSON.stringify(data.analysis, null, 2));
      setResumeAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
      setResumeFile(null);
      setPdfUrl('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startInterview = () => {
    const sessionData = {
      language,
      interviewType,
      resumeAnalysis: resumeAnalysis || null
    };
    localStorage.setItem('interviewSession', JSON.stringify(sessionData));
    router.push('/interview-live');
  };

  const handleReupload = () => {
    setResumeFile(null);
    setPdfUrl('');
    setResumeAnalysis(null);
    setError('');
  };

  const UI_TEXT = {
    zh: {
      title: 'AI 模拟面试',
      subtitle: '上传简历，开始你的 AI 面试之旅',
      uploadTitle: '上传简历',
      dragText: '拖拽 PDF 文件到这里，或点击上传',
      analyzing: '正在分析简历...',
      pdfPreview: 'PDF 预览',
      noPdf: '暂无简历',
      noPdfHint: '上传 PDF 简历后将在此处预览',
      analysisTitle: '简历分析',
      startButton: '开始面试',
      reupload: '重新上传'
    },
    en: {
      title: 'AI Mock Interview',
      subtitle: 'Upload your resume to start your AI interview journey',
      uploadTitle: 'Upload Resume',
      dragText: 'Drag PDF file here, or click to upload',
      analyzing: 'Analyzing resume...',
      pdfPreview: 'PDF Preview',
      noPdf: 'No Resume',
      noPdfHint: 'PDF preview will appear here after upload',
      analysisTitle: 'Resume Analysis',
      startButton: 'Start Interview',
      reupload: 'Re-upload'
    }
  };

  const t = UI_TEXT[language];

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0b0912]" style={{ paddingTop: '100px' }}>
      <div className="w-full h-full px-8 pb-6 max-w-[1600px] mx-auto">
        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%', height: '100%' }}>
          {/* Left Panel - High density layout */}
          <div className="h-full flex flex-col gap-3">

            {/* Upload Section - Minimal */}
            <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
              {!resumeFile ? (
                <div
                  {...getRootProps()}
                  className={`rounded-lg p-5 text-center cursor-pointer transition-all duration-200 border border-dashed ${
                    isDragActive
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                      <Upload className={`w-5 h-5 ${isDragActive ? 'text-green-500' : 'text-white/30'}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-base text-white/80 font-medium">{t.dragText}</p>
                      <p className="text-sm text-white/40">PDF 格式</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{resumeFile.name}</p>
                      <p className="text-xs text-white/40">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <button
                    onClick={handleReupload}
                    className="px-4 py-2 text-sm text-white/70 bg-white/[0.06] hover:bg-white/[0.12] rounded-lg cursor-pointer transition-all duration-200"
                  >
                    {t.reupload}
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-2 flex items-center justify-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                  <p className="text-sm text-white/50">{t.analyzing}</p>
                </div>
              )}

              {error && (
                <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Analysis Results - 动态高度 */}
            {resumeAnalysis && (
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
                <h2 className="text-base font-medium text-white/90 mb-3">{t.analysisTitle}</h2>

                <div className="space-y-2.5">
                  {/* 基本信息 - 一行显示 */}
                  <div className="flex items-center gap-4 text-sm">
                    {resumeAnalysis.name && (
                      <div className="flex items-center gap-2">
                        <span className="text-white/40">{language === 'zh' ? '姓名' : 'Name'}:</span>
                        <span className="text-white font-medium">{resumeAnalysis.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">{language === 'zh' ? '经验' : 'Exp'}:</span>
                      <span className="text-white font-medium">{resumeAnalysis.yearsOfExperience}{language === 'zh' ? '年' : 'yrs'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40">{language === 'zh' ? '级别' : 'Level'}:</span>
                      <span className="text-white font-medium capitalize">{resumeAnalysis.suggestedDifficulty}</span>
                    </div>
                  </div>

                  {/* 技能栈 - 紧凑标签 */}
                  {resumeAnalysis.skills && (
                    <div>
                      <p className="text-xs text-white/40 mb-1.5">{language === 'zh' ? '技能栈' : 'Skills'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeAnalysis.skills.languages?.map((skill: string, i: number) => (
                          <span key={`lang-${i}`} className="px-2 py-0.5 text-xs rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {skill}
                          </span>
                        ))}
                        {resumeAnalysis.skills.frameworks?.map((skill: string, i: number) => (
                          <span key={`fw-${i}`} className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {skill}
                          </span>
                        ))}
                        {resumeAnalysis.skills.tools?.map((skill: string, i: number) => (
                          <span key={`tool-${i}`} className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 核心优势 + 教育背景 + 工作经历 - 两列布局 */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 左列：核心优势 */}
                    {resumeAnalysis.keyStrengths?.length > 0 && (
                      <div>
                        <p className="text-xs text-white/40 mb-1.5">{language === 'zh' ? '核心优势' : 'Key Strengths'}</p>
                        <div className="space-y-1">
                          {resumeAnalysis.keyStrengths.slice(0, 3).map((strength: string, i: number) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-white/70">
                              <span className="text-green-400">✓</span>
                              <span className="line-clamp-1">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 右列：教育 + 工作 */}
                    <div className="space-y-2">
                      {resumeAnalysis.education?.length > 0 && (
                        <div>
                          <p className="text-xs text-white/40 mb-1">{language === 'zh' ? '教育背景' : 'Education'}</p>
                          {resumeAnalysis.education.slice(0, 1).map((edu: any, i: number) => (
                            <p key={i} className="text-xs text-white/70 line-clamp-1">
                              {edu.school}{edu.degree && ` · ${edu.degree}`}
                            </p>
                          ))}
                        </div>
                      )}
                      {resumeAnalysis.workExperience?.length > 0 && (
                        <div>
                          <p className="text-xs text-white/40 mb-1">{language === 'zh' ? '工作经历' : 'Work'}</p>
                          {resumeAnalysis.workExperience.slice(0, 2).map((exp: any, i: number) => (
                            <p key={i} className="text-xs text-white/70 line-clamp-1">
                              {exp.company}{exp.position && ` · ${exp.position}`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 项目经验 - 横向滚动等宽卡片，独立区块 */}
            {resumeAnalysis?.projects?.length > 0 && (
              <div className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/40 mb-2">{language === 'zh' ? '项目经验' : 'Projects'} ({resumeAnalysis.projects.length})</p>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {resumeAnalysis.projects.map((project: any, i: number) => (
                    <div
                      key={i}
                      className="shrink-0 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                      style={{ width: 'calc((100% - 24px) / 3)', minWidth: '200px' }}
                    >
                      <p className="text-base text-white font-medium">{project.name}</p>
                      {project.role && (
                        <p className="text-xs text-green-400/80 mt-1">{project.role}</p>
                      )}
                      {project.techStack && project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.techStack.map((tech: string, j: number) => (
                            <span key={j} className="px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-300/80">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.description && (
                        <p className="text-sm text-white/60 mt-2 leading-relaxed">{project.description}</p>
                      )}
                      {/* Achievements */}
                      {project.achievements && project.achievements.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {project.achievements.map((a: string, j: number) => (
                            <p key={j} className="text-xs text-white/50 flex items-start gap-1.5">
                              <span className="text-green-400 shrink-0">✓</span>
                              <span>{a}</span>
                            </p>
                          ))}
                        </div>
                      )}
                      {/* Highlights fallback */}
                      {!project.achievements && project.highlights && project.highlights.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {project.highlights.map((h: string, j: number) => (
                            <p key={j} className="text-xs text-white/50 flex items-start gap-1.5">
                              <span className="text-green-400 shrink-0">✓</span>
                              <span>{h}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 开始面试按钮 */}
            {resumeAnalysis && (
              <div className="flex justify-center">
                  <button
                    onClick={startInterview}
                    className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-base font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2"
                  >
                    {t.startButton}
                    <ArrowRight className="w-5 h-5" />
                  </button>
              </div>
            )}
          </div>

          {/* Right Panel: PDF Preview */}
          <div className={`h-full rounded-xl overflow-hidden ${pdfUrl ? 'border border-transparent' : 'bg-white/[0.03] border border-white/[0.06]'}`}>
            {pdfUrl ? (
              <div className="w-full h-full bg-white relative" style={{ overflow: 'hidden' }}>
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  scrolling="no"
                  title="Resume"
                />
                {/* 遮盖右侧滚动条 */}
                <div className="absolute top-0 right-0 w-4 h-full bg-[#0b0912]" />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-xl bg-white/[0.03] flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-base text-white/40">{t.noPdf}</p>
                <p className="text-sm text-white/25 mt-1">{t.noPdfHint}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


