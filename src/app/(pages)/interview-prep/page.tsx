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

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.suggestTextInput) {
          setError(errorData.error);
        }
        throw new Error(errorData.details || errorData.error || 'Failed to analyze resume');
      }

      const data = await res.json();
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
      <div className="w-full h-full px-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            {t.title}
          </h1>
          <p className="text-base text-white/50 mt-3">{t.subtitle}</p>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%', height: 'calc(100% - 120px)' }}>
          {/* Left Panel */}
          <div className="h-full overflow-y-auto space-y-5 pr-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

            {/* Upload Section */}
            <div className="rounded-xl p-5 bg-white/[0.03] border border-white/[0.06]">
              <h2 className="text-base font-medium text-white/90 mb-4">{t.uploadTitle}</h2>

              {!resumeFile ? (
                <div
                  {...getRootProps()}
                  className={`rounded-lg p-8 text-center cursor-pointer transition-all duration-200 border border-dashed ${
                    isDragActive
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <Upload className={`w-6 h-6 ${isDragActive ? 'text-green-500' : 'text-white/30'}`} />
                  </div>
                  <p className="text-sm text-white/70 font-medium mb-1">{t.dragText}</p>
                  <p className="text-xs text-white/40">PDF 格式</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{resumeFile.name}</p>
                      <p className="text-xs text-white/40">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <button
                    onClick={handleReupload}
                    className="w-full py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors"
                  >
                    {t.reupload}
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="mt-4 flex items-center justify-center gap-2 py-3">
                  <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                  <p className="text-sm text-white/50">{t.analyzing}</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {resumeAnalysis && (
              <div className="rounded-xl p-5 bg-white/[0.03] border border-white/[0.06]">
                <h2 className="text-base font-medium text-white/90 mb-4">{t.analysisTitle}</h2>

                <div className="space-y-4">
                  {/* 基本信息行 */}
                  <div className="grid grid-cols-3 gap-3">
                    {resumeAnalysis.name && (
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-xs text-white/40 mb-1">{language === 'zh' ? '姓名' : 'Name'}</p>
                        <p className="text-sm text-white font-medium">{resumeAnalysis.name}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-xs text-white/40 mb-1">{language === 'zh' ? '工作年限' : 'Experience'}</p>
                      <p className="text-sm text-white font-medium">{resumeAnalysis.yearsOfExperience} {language === 'zh' ? '年' : 'yrs'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-xs text-white/40 mb-1">{language === 'zh' ? '级别' : 'Level'}</p>
                      <p className="text-sm text-white font-medium capitalize">{resumeAnalysis.suggestedDifficulty}</p>
                    </div>
                  </div>

                  {/* 技能栈 */}
                  {resumeAnalysis.skills && (
                    <div>
                      <p className="text-xs text-white/40 mb-2">{language === 'zh' ? '技能栈' : 'Skills'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {resumeAnalysis.skills.languages?.map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs rounded bg-white/[0.05] text-white/70 border border-white/[0.08]">
                            {skill}
                          </span>
                        ))}
                        {resumeAnalysis.skills.frameworks?.map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs rounded bg-white/[0.05] text-white/70 border border-white/[0.08]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 项目经验 */}
                  {resumeAnalysis.projects?.length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 mb-2">{language === 'zh' ? '项目经验' : 'Projects'}</p>
                      <div className="space-y-2">
                        {resumeAnalysis.projects.slice(0, 3).map((project: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-sm text-white/90">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-white/40 mt-1 leading-relaxed">{project.description.substring(0, 80)}...</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 核心优势 */}
                  {resumeAnalysis.keyStrengths?.length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 mb-2">{language === 'zh' ? '核心优势' : 'Key Strengths'}</p>
                      <div className="space-y-1.5">
                        {resumeAnalysis.keyStrengths.slice(0, 3).map((strength: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 开始面试按钮 */}
                <button
                  onClick={startInterview}
                  className="w-full mt-5 py-3.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {t.startButton}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: PDF Preview */}
          <div className="h-full rounded-xl p-5 flex flex-col bg-white/[0.03] border border-white/[0.06]">
            <h2 className="text-base font-medium text-white/90 mb-4">{t.pdfPreview}</h2>

            {pdfUrl ? (
              <div className="flex-1 bg-white rounded-lg overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10">
                <div className="w-14 h-14 rounded-lg bg-white/[0.03] flex items-center justify-center mb-3">
                  <FileText className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-sm text-white/40">{t.noPdf}</p>
                <p className="text-xs text-white/25 mt-1">{t.noPdfHint}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


