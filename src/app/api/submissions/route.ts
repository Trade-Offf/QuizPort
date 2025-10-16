import { prisma } from '@/lib/prisma';
import { okJson, parseJson, unauthorized, validate, notFound } from '@/lib/http';
import { submissionSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/authz';
import { aggregateScore, scoreQuiz } from '@/lib/scoring';
import { awardPoints } from '@/lib/points';
import { startOfDayKey } from '@/lib/date';

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson(req);
  const data = validate(submissionSchema, body);

  const set = await prisma.quizSet.findUnique({ where: { id: data.quizSetId } });
  if (!set || set.status !== 'public') return notFound('Set not found');
  const quizzes = await prisma.quiz.findMany({ where: { id: { in: set.quizIds } } });

  const results = quizzes.map(q => ({ quizId: q.id, isCorrect: scoreQuiz(q, (data.answers as any)[q.id]) }));
  const { score, correctCount } = aggregateScore(results);

  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      quizSetId: set.id,
      answers: data.answers as any,
      score,
      correctCount,
      durationSec: data.durationSec ?? 0,
    },
  });

  // 积分规则
  let pointsAwarded = 0;
  const dayKey = startOfDayKey(new Date());
  const dailyExists = await prisma.pointsLog.findFirst({
    where: { userId: user.id, type: 'submit_set', refId: `${set.id}:${dayKey}` },
  });
  if (!dailyExists) {
    await awardPoints(user.id, 'submit_set', undefined, `${set.id}:${dayKey}`);
    pointsAwarded += 10;
  }

  if (correctCount > 0) {
    const perQuestion = 2 * correctCount;
    await awardPoints(user.id, 'correct_answer', perQuestion, submission.id);
    pointsAwarded += perQuestion;
  }

  return okJson({ score, correctCount, pointsAwarded, breakdown: results });
}

export const runtime = 'nodejs';

