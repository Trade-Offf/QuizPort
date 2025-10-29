import crypto from 'node:crypto';
import { dbExecute } from '@/lib/db';

export const DEFAULT_POINTS = {
  submit_set: 10,
  correct_answer: 2,
  quiz_approved: 5,
} as const;

export async function awardPoints(
  userId: string,
  type: 'submit_set' | 'correct_answer' | 'quiz_approved',
  amountOverride?: number,
  refId?: string,
) {
  const amount = amountOverride ?? DEFAULT_POINTS[type];
  const id = crypto.randomUUID();
  await dbExecute(
    'INSERT INTO points_logs (id, "userId", type, amount, "refId", "createdAt") VALUES (?, ?, ?, ?, ?, ?::timestamp)',
    id,
    userId,
    type,
    amount,
    refId ?? null,
    new Date().toISOString(),
  );
  await dbExecute('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', amount, userId);
}

