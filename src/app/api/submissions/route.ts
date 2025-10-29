import { okJson, parseJson, unauthorized, validate, notFound } from '@/lib/http';
import { submissionSchema } from '@/lib/schemas';
import { requireUser } from '@/lib/authz';
import { aggregateScore, scoreQuiz } from '@/lib/scoring';
import { awardPoints } from '@/lib/points';
import { startOfDayKey } from '@/lib/date';
import { dbQueryOne, dbQuery, dbExecute } from '@/lib/db';

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson(req);
  const data = validate(submissionSchema, body);

  const set = await dbQueryOne<any>(
    'SELECT id, "quizIds", status FROM quiz_sets WHERE id = ?',
    data.quizSetId,
  );
  if (!set || set.status !== 'public') return notFound('Set not found');
  const ids: string[] = Array.isArray(set.quizIds) ? set.quizIds : JSON.parse(set.quizIds || '[]');
  const placeholders = ids.map(() => '?').join(',');
  const quizzes = ids.length
    ? await dbQuery<any>(
        `SELECT id, type, content, answer FROM quizzes WHERE id IN (${placeholders})`,
        ...ids,
      )
    : [];

  const results = quizzes.map(q => ({ quizId: q.id, isCorrect: scoreQuiz(q, (data.answers as any)[q.id]) }));
  const { score, correctCount } = aggregateScore(results);

  const submissionId = crypto.randomUUID();
  await dbExecute(
    'INSERT INTO submissions (id, "userId", "quizSetId", answers, score, "correctCount", "durationSec", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?::timestamp)',
    submissionId,
    user.id,
    set.id,
    JSON.stringify(data.answers),
    score,
    correctCount,
    data.durationSec ?? 0,
    new Date().toISOString(),
  );

  // 积分规则
  let pointsAwarded = 0;
  const dayKey = startOfDayKey(new Date());
  const dailyExists = await dbQueryOne<any>(
    'SELECT id FROM points_logs WHERE "userId" = ? AND type = ?::"PointsLogType" AND "refId" = ? LIMIT 1',
    user.id,
    'submit_set',
    `${set.id}:${dayKey}`,
  );
  if (!dailyExists) {
    await awardPoints(user.id, 'submit_set', undefined, `${set.id}:${dayKey}`);
    pointsAwarded += 10;
  }

  if (correctCount > 0) {
    const perQuestion = 2 * correctCount;
    await awardPoints(user.id, 'correct_answer', perQuestion, submissionId);
    pointsAwarded += perQuestion;
  }

  return okJson({ score, correctCount, pointsAwarded, breakdown: results });
}

 

