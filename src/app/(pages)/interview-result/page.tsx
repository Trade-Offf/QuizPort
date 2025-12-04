'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Download, RotateCcw, Star } from 'lucide-react';

export default function InterviewResult() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  useEffect(() => {
    generateFinalReport();
  }, []);

  const generateFinalReport = async () => {
    const resultData = localStorage.getItem('interviewResult');
    if (!resultData) {
      router.push('/interview-prep');
      return;
    }

    const data = JSON.parse(resultData);
    setLanguage(data.language);

    try {
      const res = await fetch('/api/interview/final-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const reportData = await res.json();
      setReport(reportData);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([report.reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restartInterview = () => {
    localStorage.removeItem('interviewSession');
    localStorage.removeItem('interviewResult');
    router.push('/interview-prep');
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-2xl font-semibold text-gray-800">
            {language === 'zh' ? '🔄 正在生成面试报告...' : '🔄 Generating interview report...'}
          </p>
          <p className="text-gray-600 mt-2">
            {language === 'zh' ? '请稍候，这可能需要几秒钟' : 'Please wait, this may take a few seconds'}
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <p className="text-xl text-red-600">
            {language === 'zh' ? '❌ 生成报告失败' : '❌ Failed to generate report'}
          </p>
          <button
            onClick={restartInterview}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {language === 'zh' ? '返回首页' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const UI_TEXT = language === 'zh' ? {
    title: '面试完成！',
    overallScore: '综合评分',
    recommendation: '面试建议',
    breakdown: '各项得分',
    technical: '技术能力',
    communication: '沟通表达',
    problemSolving: '问题解决',
    strengths: '你的优势',
    improvements: '改进建议',
    detailedFeedback: '详细反馈',
    studyRecommendations: '学习建议',
    downloadReport: '下载完整报告',
    restartInterview: '重新面试',
    disclaimer: '提示：报告不会保存，请及时下载',
    recommendations: {
      'strong-hire': '🌟 强烈推荐',
      'hire': '✅ 推荐录用',
      'maybe': '🤔 待定',
      'no-hire': '❌ 不推荐'
    }
  } : {
    title: 'Interview Complete!',
    overallScore: 'Overall Score',
    recommendation: 'Recommendation',
    breakdown: 'Score Breakdown',
    technical: 'Technical Skills',
    communication: 'Communication',
    problemSolving: 'Problem Solving',
    strengths: 'Your Strengths',
    improvements: 'Areas for Improvement',
    detailedFeedback: 'Detailed Feedback',
    studyRecommendations: 'Study Recommendations',
    downloadReport: 'Download Full Report',
    restartInterview: 'New Interview',
    disclaimer: 'Note: Report is not saved, please download',
    recommendations: {
      'strong-hire': '🌟 Strong Hire',
      'hire': '✅ Hire',
      'maybe': '🤔 Maybe',
      'no-hire': '❌ No Hire'
    }
  };

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-600">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎉 {UI_TEXT.title}
          </h1>

          {/* Overall Score */}
          <div className="mb-8 text-center p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < Math.round(report.overallScore / 20)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {report.overallScore}/100
            </div>
            <div className="text-xl text-gray-600">
              {UI_TEXT.recommendations[report.recommendation as keyof typeof UI_TEXT.recommendations]}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{UI_TEXT.breakdown}</h2>
            <ScoreBar label={UI_TEXT.technical} score={report.breakdown.technical} />
            <ScoreBar label={UI_TEXT.communication} score={report.breakdown.communication} />
            <ScoreBar label={UI_TEXT.problemSolving} score={report.breakdown.problemSolving} />
          </div>

          {/* Strengths */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">💪 {UI_TEXT.strengths}</h2>
            <ul className="space-y-2">
              {report.strengths?.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">📚 {UI_TEXT.improvements}</h2>
            <ul className="space-y-2">
              {report.improvements?.map((i: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <span className="text-orange-500 text-xl">→</span>
                  <span className="text-gray-700">{i}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Detailed Feedback */}
          <div className="mb-8 p-6 bg-gray-50 rounded-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{UI_TEXT.detailedFeedback}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{report.detailedFeedback}</p>
          </div>

          {/* Study Recommendations */}
          {report.studyRecommendations?.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">🎯 {UI_TEXT.studyRecommendations}</h2>
              <ul className="space-y-2">
                {report.studyRecommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500 text-xl">📖</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={downloadReport}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {UI_TEXT.downloadReport}
            </button>
            <button
              onClick={restartInterview}
              className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-xl text-lg font-bold hover:bg-gray-300 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {UI_TEXT.restartInterview}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            💡 {UI_TEXT.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

