import { normalizeShortAnswer } from '@/lib/schemas';

export type QuizLike = {
  id: string;
  type: 'single_choice' | 'multi_choice' | 'true_false' | 'short_answer';
  answer: unknown;
};

export type ScoreResult = {
  quizId: string;
  isCorrect: boolean;
};

export function scoreQuiz(quiz: QuizLike, userAnswer: unknown): boolean {
  switch (quiz.type) {
    case 'single_choice':
      return userAnswer === (quiz.answer as any);
    case 'multi_choice': {
      const a = Array.isArray(userAnswer) ? [...userAnswer].sort().join(',') : '';
      const b = Array.isArray(quiz.answer) ? [...(quiz.answer as any[])].sort().join(',') : '';
      return a === b;
    }
    case 'true_false':
      return Boolean(userAnswer) === Boolean(quiz.answer);
    case 'short_answer': {
      const norm = (s: string) => normalizeShortAnswer(s);
      const accepts = (quiz.answer as any)?.accepts as string[];
      const ua = typeof userAnswer === 'string' ? norm(userAnswer) : '';
      return Array.isArray(accepts) && accepts.map(norm).includes(ua);
    }
    default:
      return false;
  }
}

export function aggregateScore(results: ScoreResult[]) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const score = correctCount; // 每题 1 分
  return { score, correctCount };
}

