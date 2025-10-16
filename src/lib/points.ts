import { prisma } from '@/lib/prisma';

export const DEFAULT_POINTS = {
  submit_set: 10,
  correct_answer: 2,
  quiz_approved: 5,
};

export async function awardPoints(userId: string, type: 'submit_set'|'correct_answer'|'quiz_approved', amountOverride?: number, refId?: string) {
  const amount = amountOverride ?? DEFAULT_POINTS[type];
  await prisma.$transaction([
    prisma.pointsLog.create({ data: { userId, type, amount, refId } }),
    prisma.user.update({ where: { id: userId }, data: { points: { increment: amount } } }),
  ]);
}

