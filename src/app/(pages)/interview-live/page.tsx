'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mic, MicOff, Video, VideoOff, Pause, Play, Check, PhoneOff } from 'lucide-react';

type InterviewPhase = 'device-check' | 'interviewing';
type QuestionState = 'displaying' | 'ready' | 'recording' | 'paused' | 'processing';

type Question = {
  id: string;
  text: string;
  round: number;
  focus: string;
};

type QAHistory = {
  question: string;
  answer: string;
  duration: number;
  score: number | null;
  round: number;
};

export default function InterviewLive() {
  const router = useRouter();

  // Device check phase
  const [phase, setPhase] = useState<InterviewPhase>('device-check');
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Interview phase
  const [state, setState] = useState<QuestionState>('displaying');
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [qaHistory, setQaHistory] = useState<QAHistory[]>([]);
  const [liveEvaluation, setLiveEvaluation] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60 * 1000);
  const [error, setError] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const deepgramRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartTimeRef = useRef(0);
  const pausedDurationRef = useRef(0);
  const pauseStartTimeRef = useRef(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const interviewStartTimeRef = useRef(0);

  // Initialize devices and load session
  useEffect(() => {
    const sessionData = localStorage.getItem('interviewSession');
    if (!sessionData) {
      router.push('/interview-prep');
      return;
    }

    const parsedSession = JSON.parse(sessionData);
    setSession(parsedSession);

    // Request camera and microphone
    initializeDevices();

    return () => {
      // Cleanup media stream on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start interview timer when entering interview phase
  useEffect(() => {
    if (phase !== 'interviewing' || !session) return;

    interviewStartTimeRef.current = Date.now();
    generateFirstQuestion(session);

    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - interviewStartTimeRef.current;
      const remaining = Math.max(0, 30 * 60 * 1000 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        endInterview();
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [phase, session]);

  // Initialize camera and microphone
  const initializeDevices = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
      setMicReady(true);
      setDeviceError('');
    } catch (err: any) {
      console.error('Device access error:', err);
      if (err.name === 'NotAllowedError') {
        setDeviceError('请允许访问摄像头和麦克风');
      } else if (err.name === 'NotFoundError') {
        setDeviceError('未找到摄像头或麦克风设备');
      } else {
        setDeviceError('设备访问失败: ' + err.message);
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Join interview
  const joinInterview = () => {
    if (cameraReady && micReady) {
      setPhase('interviewing');
    }
  };

  const generateFirstQuestion = async (sessionData: any) => {
    setState('processing');
    
    const firstQuestionText = sessionData.language === 'zh'
      ? '请先做一个简单的自我介绍，包括你的工作经验和技术背景。'
      : 'Please introduce yourself briefly, including your work experience and technical background.';

    setCurrentQuestion({
      id: 'q_first',
      text: firstQuestionText,
      round: 1,
      focus: sessionData.language === 'zh' ? '自我介绍' : 'Self-introduction'
    });
    
    setState('displaying');
  };

  const initializeDeepgram = useCallback(async (stream: MediaStream) => {
    try {
      const response = await fetch('/api/deepgram/key');
      const data = await response.json();

      if (!data.key) {
        throw new Error('No Deepgram API key');
      }

      const deepgramLang = session.language === 'zh' ? 'zh-CN' : 'en-US';
      const wsUrl = `wss://api.deepgram.com/v1/listen?language=${deepgramLang}&smart_format=true&interim_results=true`;
      
      const socket = new WebSocket(wsUrl, ['token', data.key]);
      deepgramRef.current = socket;

      socket.onopen = () => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250);
        mediaRecorderRef.current = mediaRecorder;
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcriptText = received.channel?.alternatives?.[0]?.transcript;
        
        if (transcriptText && received.is_final) {
          setTranscript(prev => prev + ' ' + transcriptText);
        }
      };

      socket.onerror = (error) => {
        console.error('[Deepgram] Error:', error);
        setError('Transcription error occurred');
      };

      socket.onclose = (event) => {
        if (event.code !== 1000) {
          console.error('[Deepgram] Closed unexpectedly:', event.code);
        }
      };

    } catch (err: any) {
      console.error('Deepgram initialization error:', err);
      setError(err.message);
    }
  }, [session]);

  const startAnswering = async () => {
    setState('recording');
    setTranscript('');
    recordingStartTimeRef.current = Date.now();
    pausedDurationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await initializeDeepgram(stream);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - recordingStartTimeRef.current - pausedDurationRef.current;
        setRecordingDuration(elapsed);
      }, 100);

    } catch (err: any) {
      setError('Failed to access microphone');
      setState('displaying');
    }
  };

  const pauseAnswering = () => {
    setState('paused');
    pauseStartTimeRef.current = Date.now();
    
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
    }
  };

  const resumeAnswering = () => {
    setState('recording');
    
    if (pauseStartTimeRef.current > 0) {
      pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;
      pauseStartTimeRef.current = 0;
    }
    
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
    }
  };

  const finishAnswering = async () => {
    setState('processing');

    // Stop recording
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (deepgramRef.current?.readyState === WebSocket.OPEN) {
      deepgramRef.current.close(1000, 'Answer completed');
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    const actualDuration = Date.now() - recordingStartTimeRef.current - pausedDurationRef.current;

    // Submit answer
    try {
      const response = await fetch('/api/interview/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion?.id,
          question: currentQuestion?.text,
          answer: transcript,
          duration: actualDuration,
          resumeAnalysis: session.resumeAnalysis,
          qaHistory,
          currentRound,
          currentQuestionIndex,
          language: session.language
        })
      });

      const data = await response.json();

      // Update history
      setQaHistory(prev => [...prev, {
        question: currentQuestion?.text || '',
        answer: transcript,
        duration: actualDuration,
        score: data.evaluation.score,
        round: currentRound
      }]);

      // Update evaluation
      if (data.evaluation.strengths?.length > 0) {
        setLiveEvaluation(data.evaluation);
      }

      // Check if interview should end
      if (data.shouldEndInterview) {
        endInterview();
        return;
      }

      // Update round if needed
      if (data.shouldAdvanceRound) {
        setCurrentRound(data.nextRound);
      }

      // Set next question
      setCurrentQuestion(data.nextQuestion);
      setCurrentQuestionIndex(prev => prev + 1);
      setState('displaying');
      setRecordingDuration(0);

    } catch (err: any) {
      setError('Failed to submit answer');
      setState('displaying');
    }
  };

  const endInterview = () => {
    const finalData = {
      language: session.language,
      interviewType: session.interviewType,
      resumeAnalysis: session.resumeAnalysis,
      qaHistory,
      duration: Date.now() - interviewStartTimeRef.current
    };
    
    localStorage.setItem('interviewResult', JSON.stringify(finalData));
    router.push('/interview-result');
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const lang = session?.language || 'zh';

  const UI_TEXT = lang === 'zh' ? {
    pause: '暂停',
    resume: '继续',
    finish: '完成回答',
    startAnswer: '开始回答',
    recording: '正在录音...',
    paused: '已暂停',
    processing: 'Rick 正在思考下一个问题...',
    analyzing: '分析你的回答中',
    currentQuestion: '当前问题：',
    liveTranscript: '实时转录：',
    timeRemaining: '剩余时间',
    endInterview: '结束面试',
    hint: '提示：回答完毕后点击"完成回答"，Rick 会根据你的回答提出下一个问题',
    examFocus: '考察重点',
    lastAnswerGood: '上一题回答得不错！',
    // Device check
    deviceCheck: '准备加入面试',
    cameraLabel: '摄像头',
    micLabel: '麦克风',
    ready: '已就绪',
    notReady: '未就绪',
    joinInterview: '加入面试',
    waitingDevices: '正在检测设备...',
    retryDevices: '重试'
  } : {
    pause: 'Pause',
    resume: 'Resume',
    finish: 'Finish Answer',
    startAnswer: 'Start Answering',
    recording: 'Recording...',
    paused: 'Paused',
    processing: 'Rick is thinking...',
    analyzing: 'Analyzing your answer',
    currentQuestion: 'Current Question:',
    liveTranscript: 'Live Transcript:',
    timeRemaining: 'Time Left',
    endInterview: 'End Interview',
    hint: 'Tip: Click "Finish Answer" when done, Rick will ask next question based on your response',
    examFocus: 'Focus',
    lastAnswerGood: 'Great answer!',
    // Device check
    deviceCheck: 'Ready to join?',
    cameraLabel: 'Camera',
    micLabel: 'Microphone',
    ready: 'Ready',
    notReady: 'Not ready',
    joinInterview: 'Join Interview',
    waitingDevices: 'Checking devices...',
    retryDevices: 'Retry'
  };

  // Device Check Phase
  if (phase === 'device-check') {
    return (
      <div className="w-full h-screen bg-[#202124] flex items-center justify-center">
        <div className="max-w-2xl w-full px-6">
          {/* Title */}
          <h1 className="text-2xl font-medium text-white text-center mb-8">
            {UI_TEXT.deviceCheck}
          </h1>

          {/* Video Preview */}
          <div className="relative aspect-video bg-[#3c4043] rounded-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-[#5f6368] flex items-center justify-center">
                  <span className="text-4xl text-white">👤</span>
                </div>
              </div>
            )}

            {/* Camera/Mic Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMicOn ? 'bg-[#3c4043] hover:bg-[#5f6368]' : 'bg-[#ea4335] hover:bg-[#d33426]'
                }`}
              >
                {isMicOn ? (
                  <Mic className="w-5 h-5 text-white" />
                ) : (
                  <MicOff className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isCameraOn ? 'bg-[#3c4043] hover:bg-[#5f6368]' : 'bg-[#ea4335] hover:bg-[#d33426]'
                }`}
              >
                {isCameraOn ? (
                  <Video className="w-5 h-5 text-white" />
                ) : (
                  <VideoOff className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Device Status */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${micReady ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-white/70">{UI_TEXT.micLabel}</span>
              <span className={`text-sm ${micReady ? 'text-green-400' : 'text-red-400'}`}>
                {micReady ? UI_TEXT.ready : UI_TEXT.notReady}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${cameraReady ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-white/70">{UI_TEXT.cameraLabel}</span>
              <span className={`text-sm ${cameraReady ? 'text-green-400' : 'text-red-400'}`}>
                {cameraReady ? UI_TEXT.ready : UI_TEXT.notReady}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {deviceError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-red-400 text-sm mb-3">{deviceError}</p>
              <button
                onClick={initializeDevices}
                className="px-4 py-2 bg-[#3c4043] hover:bg-[#5f6368] text-white text-sm rounded-full transition-colors"
              >
                {UI_TEXT.retryDevices}
              </button>
            </div>
          )}

          {/* Join Button */}
          <div className="flex justify-center">
            <button
              onClick={joinInterview}
              disabled={!cameraReady || !micReady}
              className={`px-8 py-3 rounded-full text-base font-medium transition-all ${
                cameraReady && micReady
                  ? 'bg-[#1a73e8] hover:bg-[#1557b0] text-white'
                  : 'bg-[#3c4043] text-white/50 cursor-not-allowed'
              }`}
            >
              {cameraReady && micReady ? UI_TEXT.joinInterview : UI_TEXT.waitingDevices}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!session || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#202124]">
        <Loader2 className="w-12 h-12 text-white/50 animate-spin" />
      </div>
    );
  }

  // Interview Phase
  return (
    <div className="relative w-full h-screen bg-[#202124]">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="text-sm text-white/70">
          {lang === 'zh' ? '问题' : 'Q'} {currentQuestionIndex + 1} · Round {currentRound}/3
        </div>
        <div className="text-sm text-white/70">
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Self Video - Bottom Right */}
      <div className="absolute bottom-24 right-6 z-20">
        <div className="relative w-48 h-36 bg-[#3c4043] rounded-lg overflow-hidden shadow-lg border border-white/10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#5f6368] flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
            </div>
          )}
          {/* Mini controls */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            <button
              onClick={toggleMic}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isMicOn ? 'bg-[#3c4043]/80' : 'bg-[#ea4335]'
              }`}
            >
              {isMicOn ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5 text-white" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                isCameraOn ? 'bg-[#3c4043]/80' : 'bg-[#ea4335]'
              }`}
            >
              {isCameraOn ? <Video className="w-3.5 h-3.5 text-white" /> : <VideoOff className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Rick's question area */}
      <div className="absolute inset-0 flex items-center justify-center pt-16 pb-24 px-8">
        <AnimatePresence mode="wait">
          {/* Displaying Question */}
          {state === 'displaying' && (
            <motion.div
              key="displaying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl w-full"
            >
              {/* Rick's avatar and question */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#3c4043] flex items-center justify-center text-3xl">
                  🧑‍💻
                </div>
                <p className="text-white/60 text-sm mb-1">Rick</p>
              </div>

              <div className="bg-[#303134] rounded-2xl p-8">
                <p className="text-white text-2xl leading-relaxed text-center">
                  {currentQuestion.text}
                </p>

                {currentQuestion.focus && (
                  <p className="text-white/40 text-sm text-center mt-4">
                    {UI_TEXT.examFocus}: {currentQuestion.focus}
                  </p>
                )}
              </div>

              {liveEvaluation?.strengths?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                    <p className="text-green-400 text-sm text-center">{liveEvaluation.strengths[0]}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Recording/Paused */}
          {(state === 'recording' || state === 'paused') && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl w-full"
            >
              {/* Question reminder */}
              <div className="bg-[#303134] rounded-xl p-5 mb-6">
                <p className="text-white/50 text-xs mb-2">Rick:</p>
                <p className="text-white/80 text-base">{currentQuestion.text}</p>
              </div>

              {/* Recording status */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {state === 'recording' ? (
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                ) : (
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                )}
                <span className="text-white/70 text-sm">
                  {state === 'recording' ? UI_TEXT.recording : UI_TEXT.paused}
                </span>
                <span className="text-white font-mono text-sm">
                  {formatDuration(recordingDuration)}
                </span>
              </div>

              {/* Live transcript as subtitle */}
              {transcript && (
                <div className="bg-black/60 rounded-lg px-6 py-4 max-h-32 overflow-y-auto">
                  <p className="text-white text-lg text-center leading-relaxed">{transcript}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Processing */}
          {state === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#3c4043] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
              </div>
              <p className="text-white/70 text-base">{UI_TEXT.processing}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls - Google Meet style */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-[#202124] border-t border-white/10">
        <div className="h-full flex items-center justify-center gap-4">
          {/* Start Answer Button */}
          {state === 'displaying' && (
            <button
              onClick={startAnswering}
              className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Mic className="w-5 h-5" />
              {UI_TEXT.startAnswer}
            </button>
          )}

          {/* Recording Controls */}
          {state === 'recording' && (
            <>
              <button
                onClick={pauseAnswering}
                className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#5f6368] flex items-center justify-center transition-colors"
                title={UI_TEXT.pause}
              >
                <Pause className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={finishAnswering}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Check className="w-5 h-5" />
                {UI_TEXT.finish}
              </button>
            </>
          )}

          {/* Paused Controls */}
          {state === 'paused' && (
            <>
              <button
                onClick={resumeAnswering}
                className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#5f6368] flex items-center justify-center transition-colors"
                title={UI_TEXT.resume}
              >
                <Play className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={finishAnswering}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Check className="w-5 h-5" />
                {UI_TEXT.finish}
              </button>
            </>
          )}

          {/* End Interview Button */}
          <button
            onClick={endInterview}
            className="w-12 h-12 rounded-full bg-[#ea4335] hover:bg-[#d33426] flex items-center justify-center transition-colors"
            title={UI_TEXT.endInterview}
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <div className="bg-red-500/90 text-white text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

