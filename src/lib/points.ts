import crypto from 'node:crypto';

export const DEFAULT_POINTS = {
  submit_set: 10,
  correct_answer: 2,
  quiz_approved: 5,
} as const;

import { d1Run } from '@/lib/cf';

export async function awardPoints(
  userId: string,
  type: 'submit_set' | 'correct_answer' | 'quiz_approved',
  amountOverride?: number,
  refId?: string,
) {
  const amount = amountOverride ?? DEFAULT_POINTS[type];
  const id = crypto.randomUUID();
  await d1Run(
    'INSERT INTO points_logs (id, user_id, type, amount, ref_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    userId,
    type,
    amount,
    refId ?? null,
    new Date().toISOString(),
  );
  await d1Run('UPDATE users SET points = COALESCE(points, 0) + ? WHERE id = ?', amount, userId);
}

