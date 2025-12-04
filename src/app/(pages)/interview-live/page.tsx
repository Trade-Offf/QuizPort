'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Video, VideoOff, Check, AlertCircle } from 'lucide-react';

type InterviewPhase = 'device-check' | 'ready' | 'interviewing' | 'ended';
type InterviewState = 'typing' | 'waiting' | 'recording' | 'thinking';

type Question = {
  id: string;
  text: string;
  round: number;
};

type QAHistory = {
  question: string;
  answer: string;
  duration: number;
  round: number;
};

// Typewriter Effect Component
function TypewriterText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block w-0.5 h-7 bg-white/80 ml-1 animate-pulse" />
      )}
    </span>
  );
}

// Thinking Dots Animation
function ThinkingDots() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-white/80 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Audio Waveform Animation
function AudioWaveform() {
  const bars = 5;
  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-white rounded-full"
          animate={{
            height: ['12px', '32px', '12px'],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function InterviewLive() {
  const router = useRouter();

  // Phase & State
  const [phase, setPhase] = useState<InterviewPhase>('device-check');
  const [state, setState] = useState<InterviewState>('typing');
  const [session, setSession] = useState<any>(null);

  // Device Check
  const [micReady, setMicReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true); // User toggle for camera
  const [micError, setMicError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCheckingDevices, setIsCheckingDevices] = useState(true);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');

  // Question & History
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef(''); // Use ref to avoid closure issues
  const [qaHistory, setQaHistory] = useState<QAHistory[]>([]);

  // Recording
  const [isRecording, setIsRecording] = useState(false);

  // Current feedback (shown after each answer)
  const [currentFeedback, setCurrentFeedback] = useState<{
    score: number;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
    suggestions?: string[];
    userAnswer?: string; // 用户的回答内容
  } | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Error state for rate limit
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStartTimeRef = useRef(0);
  const interviewStartTimeRef = useRef(0);

  // Initialize session and check devices
  useEffect(() => {
    const sessionData = localStorage.getItem('interviewSession');
    if (!sessionData) {
      router.push('/interview-prep');
      return;
    }
    setSession(JSON.parse(sessionData));
    checkDevices();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Check camera and microphone
  const checkDevices = async () => {
    setIsCheckingDevices(true);
    setMicError('');
    setCameraError('');

    // First request permission to get device list
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(track => track.stop());

      // Get all audio input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      setAudioDevices(mics);

      // Auto-select first device if none selected
      if (mics.length > 0 && !selectedMicId) {
        setSelectedMicId(mics[0].deviceId);
      }
      setMicReady(true);
    } catch (err: any) {
      setMicReady(false);
      if (err.name === 'NotAllowedError') {
        setMicError('请允许麦克风权限');
      } else if (err.name === 'NotFoundError') {
        setMicError('未找到麦克风设备');
      } else {
        setMicError('麦克风访问失败');
      }
    }

    // Check camera (optional)
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = videoStream;
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
      setCameraReady(true);
    } catch (err: any) {
      setCameraReady(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('摄像头权限被拒绝');
      } else if (err.name === 'NotFoundError') {
        setCameraError('未找到摄像头');
      } else {
        setCameraError('摄像头不可用');
      }
    }

    setIsCheckingDevices(false);
  };

  // Handle mic selection change
  const handleMicChange = async (deviceId: string) => {
    setSelectedMicId(deviceId);
  };

  // Toggle camera on/off
  const toggleCamera = async () => {
    if (cameraEnabled && cameraReady) {
      // Turn off camera - stop video tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setCameraEnabled(false);
      setCameraReady(false);
    } else {
      // Turn on camera - request new stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
        setCameraReady(true);
        setCameraError('');
      } catch (err: any) {
        setCameraEnabled(false);
        setCameraReady(false);
        setCameraError(err.name === 'NotAllowedError' ? '权限被拒绝' : '无法访问');
      }
    }
  };

  // Proceed to ready phase
  const proceedToReady = () => {
    if (micReady) {
      setPhase('ready');
    }
  };

  // Start interview
  const startInterview = () => {
    if (!session) return;
    setPhase('interviewing');
    interviewStartTimeRef.current = Date.now();

    const firstQuestion = session.language === 'zh'
      ? '请先做一个简单的自我介绍，包括你的工作经验和技术背景。'
      : 'Please introduce yourself briefly, including your work experience and technical background.';

    setCurrentQuestion({
      id: 'q_first',
      text: firstQuestion,
      round: 1,
    });
    setState('typing');
  };

  // Called when typewriter finishes
  const onTypewriterComplete = () => {
    setState('waiting');
  };

  // Initialize Deepgram for speech-to-text
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (stream: MediaStream) => {
    try {
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000); // Collect chunks every second
      mediaRecorderRef.current = recorder;
      console.log('[Recording] Started');
    } catch (err) {
      console.error('[Recording] Error:', err);
    }
  }, []);

  const transcribeAudio = useCallback(async (): Promise<string> => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('[Transcribe] Audio size:', audioBlob.size);

      if (audioBlob.size < 1000) {
        console.warn('[Transcribe] Audio too short');
        return '';
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', session.language === 'zh' ? 'zh-CN' : 'en-US');

      setTranscript('正在转录...');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('[Transcribe] Result:', data.transcript);

      return data.transcript || '';
    } catch (err) {
      console.error('[Transcribe] Error:', err);
      return '';
    }
  }, [session]);

  // Toggle recording (start/stop)
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setState('thinking');

      const duration = Date.now() - recordingStartTimeRef.current;

      // Stop MediaRecorder and wait for final chunk
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }

      // Wait for recorder to finish
      await new Promise(resolve => setTimeout(resolve, 300));

      // Transcribe the recorded audio
      const finalTranscript = await transcribeAudio();
      setTranscript(finalTranscript);
      transcriptRef.current = finalTranscript;
      console.log('[Submit] Final transcript:', finalTranscript);

      // Submit answer to API with retry logic
      const submitWithRetry = async (retryCount = 0): Promise<boolean> => {
        try {
          const response = await fetch('/api/interview/submit-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionId: currentQuestion?.id,
              question: currentQuestion?.text,
              answer: finalTranscript,
              duration,
              resumeAnalysis: session.resumeAnalysis,
              qaHistory,
              currentRound,
              currentQuestionIndex,
              language: session.language
            })
          });

          const data = await response.json();

          // Handle rate limit error
          if (response.status === 429 || data.error === 'rate_limit') {
            setRateLimitError(data.message || '😅 AI 模型额度用完啦！请稍后再试~');
            setState('waiting');
            return false;
          }

          if (!response.ok) {
            throw new Error(data.error || 'Submit failed');
          }

          // Clear any previous error
          setRateLimitError(null);

          // Show feedback immediately
          if (data.evaluation) {
            setCurrentFeedback({
              score: data.evaluation.score,
              strengths: data.evaluation.strengths || [],
              weaknesses: data.evaluation.weaknesses || [],
              feedback: data.evaluation.feedback || '',
              suggestions: data.evaluation.weaknesses?.length > 0
                ? data.evaluation.weaknesses.map((w: string) => `建议加强: ${w}`)
                : [],
              userAnswer: finalTranscript // 保存用户回答
            });
            setShowFeedback(true);
          }

          // Update history
          setQaHistory(prev => [...prev, {
            question: currentQuestion?.text || '',
            answer: finalTranscript,
            duration,
            round: currentRound
          }]);

          // Check if interview should end
          if (data.shouldEndInterview) {
            endInterview();
            return true;
          }

          // Update round if needed
          if (data.shouldAdvanceRound) {
            setCurrentRound(data.nextRound);
          }

          // Set next question
          setCurrentQuestion(data.nextQuestion);
          setCurrentQuestionIndex(prev => prev + 1);
          setState('typing');
          setTranscript('');
          transcriptRef.current = '';
          return true;
        } catch (err: any) {
          console.error('Submit error:', err);
          // Retry up to 2 times for non-rate-limit errors
          if (retryCount < 2) {
            console.log(`[Submit] Retrying... attempt ${retryCount + 2}`);
            await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
            return submitWithRetry(retryCount + 1);
          }
          setState('waiting');
          return false;
        }
      };

      await submitWithRetry();
    } else {
      // Start recording
      setIsRecording(true);
      setState('recording');
      setTranscript('录音中...');
      transcriptRef.current = '';
      recordingStartTimeRef.current = Date.now();

      try {
        // Use selected microphone
        const audioConstraints = selectedMicId
          ? { audio: { deviceId: { exact: selectedMicId } } }
          : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        mediaStreamRef.current = stream;
        await startRecording(stream);
      } catch (err) {
        console.error('Mic access error:', err);
        setIsRecording(false);
        setState('waiting');
      }
    }
  };

  // End interview
  const endInterview = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setShowFeedback(false);
    setPhase('ended');
  };

  // Exit and go back to prep page
  const exitWithoutFeedback = () => {
    router.push('/interview-prep');
  };

  const lang = session?.language || 'zh';
  const UI = lang === 'zh' ? {
    start: '开始面试',
    tapToAnswer: '点击回答',
    tapToStop: '点击结束',
    end: '结束',
    deviceCheck: '设备检测',
    micLabel: '麦克风',
    cameraLabel: '摄像头',
    ready: '就绪',
    notReady: '未就绪',
    optional: '（可选）',
    checking: '检测中...',
    retry: '重新检测',
    continue: '继续',
    micRequired: '需要麦克风权限才能进行面试',
    selectMic: '选择麦克风',
    interviewEnded: '面试已结束',
    generateFeedback: '生成面试反馈',
    exitDirectly: '直接退出',
    questionsAnswered: '已回答问题',
  } : {
    start: 'Start Interview',
    tapToAnswer: 'Tap to Answer',
    tapToStop: 'Tap to Stop',
    end: 'End',
    deviceCheck: 'Device Check',
    micLabel: 'Microphone',
    cameraLabel: 'Camera',
    ready: 'Ready',
    notReady: 'Not Ready',
    optional: '(Optional)',
    checking: 'Checking...',
    retry: 'Retry',
    continue: 'Continue',
    micRequired: 'Microphone permission is required for the interview',
    selectMic: 'Select Microphone',
    interviewEnded: 'Interview Ended',
    generateFeedback: 'Generate Feedback',
    exitDirectly: 'Exit',
    questionsAnswered: 'Questions Answered',
  };

  // Device Check Phase
  if (phase === 'device-check') {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
        {/* Camera Preview - always render, hide with CSS when disabled */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-30 transition-opacity duration-300 ${
            cameraReady && cameraEnabled ? 'visible' : 'invisible'
          }`}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {/* Title */}
            <h1 className="text-2xl font-medium text-white text-center mb-8">
              {UI.deviceCheck}
            </h1>

            {/* Device Status Cards */}
            <div className="space-y-4 mb-8">
              {/* Microphone (Required) */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      micReady ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {micReady ? (
                        <Mic className="w-6 h-6 text-green-400" />
                      ) : (
                        <MicOff className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{UI.micLabel}</p>
                      {micError && (
                        <p className="text-red-400 text-sm">{micError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCheckingDevices ? (
                      <span className="text-white/50 text-sm">{UI.checking}</span>
                    ) : micReady ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Microphone Selection Dropdown */}
                {micReady && audioDevices.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <select
                      value={selectedMicId}
                      onChange={(e) => handleMicChange(e.target.value)}
                      className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-white/40 cursor-pointer appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                    >
                      {audioDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId} className="bg-gray-800 text-white">
                          {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Camera (Optional) */}
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      cameraReady && cameraEnabled ? 'bg-green-500/20' : 'bg-white/10'
                    }`}>
                      {cameraReady && cameraEnabled ? (
                        <Video className="w-6 h-6 text-green-400" />
                      ) : (
                        <VideoOff className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {UI.cameraLabel}
                        <span className="text-white/40 text-sm ml-2">{UI.optional}</span>
                      </p>
                      {cameraError && (
                        <p className="text-white/40 text-sm">{cameraError}</p>
                      )}
                    </div>
                  </div>
                  {/* Camera Toggle Switch */}
                  <button
                    onClick={toggleCamera}
                    disabled={isCheckingDevices}
                    className={`relative w-12 h-7 rounded-full transition-all duration-200 ${
                      cameraEnabled && cameraReady
                        ? 'bg-green-500'
                        : 'bg-white/20'
                    } ${isCheckingDevices ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <motion.div
                      animate={{ x: cameraEnabled && cameraReady ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Mic Required Warning */}
            {!micReady && !isCheckingDevices && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400/80 text-sm text-center mb-6"
              >
                {UI.micRequired}
              </motion.p>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              {/* Continue Button */}
              <motion.button
                onClick={proceedToReady}
                disabled={!micReady || isCheckingDevices}
                whileHover={micReady ? { scale: 1.02 } : {}}
                whileTap={micReady ? { scale: 0.98 } : {}}
                className={`w-full py-4 rounded-full font-medium text-lg transition-all ${
                  micReady && !isCheckingDevices
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/20 text-white/40 cursor-not-allowed'
                }`}
              >
                {UI.continue}
              </motion.button>

              {/* Retry Button */}
              {!isCheckingDevices && !micReady && (
                <motion.button
                  onClick={checkDevices}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full py-3 rounded-full bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-all"
                >
                  {UI.retry}
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Interview Ended Phase - Simple exit
  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center"
          >
            {/* Check Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-green-400" />
            </motion.div>

            {/* Title */}
            <h1 className="text-2xl font-medium text-white mb-2">
              {UI.interviewEnded}
            </h1>

            {/* Stats */}
            <p className="text-white/50 mb-8">
              {UI.questionsAnswered}: {qaHistory.length}
            </p>

            {/* Exit Button Only */}
            <motion.button
              onClick={exitWithoutFeedback}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-full bg-green-500 text-white font-medium text-lg hover:bg-green-400 transition-all cursor-pointer"
            >
              {UI.exitDirectly}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Ready Phase - Show start button
  if (phase === 'ready') {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
        {/* Full-screen Camera Background (mirrored) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        {/* Start Button - Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            onClick={startInterview}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white/90 backdrop-blur-xl text-black font-medium text-lg rounded-full shadow-2xl transition-all duration-200 hover:bg-white"
          >
            {UI.start}
          </motion.button>
        </div>
      </div>
    );
  }

  // Interview Phase
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* Full-screen Camera Background (mirrored) - always render, hide with CSS */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
          cameraEnabled && cameraReady ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

      {/* End Button - Top Right (below nav) */}
      <motion.button
        onClick={endInterview}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-20 right-6 z-20 w-12 h-12 bg-red-500/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-red-600 hover:scale-105"
      >
        <X className="w-5 h-5 text-white" />
      </motion.button>

      {/* Question Counter - Top Left (below nav) */}
      <div className="absolute top-20 left-6 z-20">
        <div className="px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full">
          <span className="text-white/80 text-sm font-medium">
            Q{currentQuestionIndex + 1}
          </span>
        </div>
      </div>

      {/* AI Question Area - Upper middle area */}
      <div className="absolute top-32 left-0 right-0 px-6 z-10">
        <AnimatePresence mode="wait">
          {currentQuestion && (state === 'typing' || state === 'waiting' || state === 'recording') && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-5 shadow-2xl">
                <p className="text-white text-2xl md:text-3xl font-light leading-relaxed text-center">
                  {state === 'typing' ? (
                    <TypewriterText
                      text={currentQuestion.text}
                      onComplete={onTypewriterComplete}
                    />
                  ) : (
                    currentQuestion.text
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* Thinking State */}
          {state === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-black/60 backdrop-blur-xl rounded-2xl px-6 py-8 shadow-2xl">
                <ThinkingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Real-time Transcript Display */}
      <AnimatePresence>
        {(state === 'recording' || state === 'thinking') && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-44 left-4 right-4 z-10"
          >
            <div className="max-w-2xl mx-auto bg-black/40 backdrop-blur-xl rounded-2xl px-5 py-4 border border-white/10">
              <p className="text-white/90 text-base leading-relaxed">
                {transcript}
                {state === 'recording' && (
                  <span className="inline-block w-0.5 h-4 bg-white/60 ml-1 animate-pulse" />
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4 z-10">
        {/* Audio Waveform - Only when recording */}
        <AnimatePresence>
          {state === 'recording' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <AudioWaveform />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mic Button - Apple Style */}
        {(state === 'waiting' || state === 'recording') && (
          <motion.button
            onClick={toggleRecording}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
                : 'bg-white/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] hover:bg-white hover:scale-105'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-black" />
            )}
          </motion.button>
        )}

        {/* Button Hint Text */}
        {(state === 'waiting' || state === 'recording') && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/60 text-sm"
          >
            {isRecording ? UI.tapToStop : UI.tapToAnswer}
          </motion.p>
        )}
      </div>

      {/* Rate Limit Error Toast */}
      <AnimatePresence>
        {rateLimitError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30"
          >
            <div className="bg-orange-500/90 backdrop-blur-xl rounded-xl px-6 py-4 border border-orange-400/30 shadow-2xl max-w-md">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-white shrink-0" />
                <p className="text-white text-sm">{rateLimitError}</p>
                <button
                  onClick={() => setRateLimitError(null)}
                  className="ml-2 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Feedback Panel */}
      <AnimatePresence>
        {showFeedback && currentFeedback && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-32 right-4 w-80 z-20 max-h-[calc(100vh-160px)] overflow-y-auto"
          >
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setShowFeedback(false)}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3 text-white/60" />
              </button>

              {/* User's Answer - 放在最上面 */}
              {currentFeedback.userAnswer && (
                <div className="mb-4">
                  <div className="text-white/50 text-xs font-medium mb-2 flex items-center gap-1">
                    💬 你的回答
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-white/70 text-xs leading-relaxed">
                      {currentFeedback.userAnswer}
                    </p>
                  </div>
                </div>
              )}

              {/* Score */}
              <div className="text-center mb-4">
                <div className={`text-4xl font-bold ${
                  currentFeedback.score >= 70 ? 'text-green-400' :
                  currentFeedback.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {currentFeedback.score}
                </div>
                <div className="text-white/40 text-xs mt-1">本题评分</div>
              </div>

              {/* Feedback */}
              <p className="text-white/80 text-sm text-center mb-4 leading-relaxed">
                {currentFeedback.feedback}
              </p>

              {/* Strengths */}
              {currentFeedback.strengths.length > 0 && (
                <div className="mb-3">
                  <div className="text-green-400/80 text-xs font-medium mb-1.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 优点
                  </div>
                  <ul className="space-y-1">
                    {currentFeedback.strengths.slice(0, 2).map((s, i) => (
                      <li key={i} className="text-white/60 text-xs pl-2 leading-relaxed">• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses & Suggestions */}
              {currentFeedback.weaknesses.length > 0 && (
                <div>
                  <div className="text-orange-400/80 text-xs font-medium mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 需加强
                  </div>
                  <ul className="space-y-1">
                    {currentFeedback.weaknesses.slice(0, 2).map((w, i) => (
                      <li key={i} className="text-white/60 text-xs pl-2 leading-relaxed">• {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

