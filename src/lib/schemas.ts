import { z } from 'zod';

export const quizTypeEnum = z.enum(['single_choice','multi_choice','true_false','short_answer']);
export type QuizType = z.infer<typeof quizTypeEnum>;

const optionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) });

export const contentSchema = z.union([
  z.object({
    stem: z.string().min(1),
    options: z.array(optionSchema).min(2).max(9).optional(),
  }),
]);

export const answerSchemaByType: Record<QuizType, z.ZodTypeAny> = {
  single_choice: z.string().min(1),
  multi_choice: z.array(z.string().min(1)).min(1),
  true_false: z.boolean(),
  short_answer: z.object({ accepts: z.array(z.string().min(1)).min(1) }),
};

export const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  type: quizTypeEnum,
  content: contentSchema,
  answer: z.union([
    answerSchemaByType.single_choice,
    answerSchemaByType.multi_choice,
    answerSchemaByType.true_false,
    answerSchemaByType.short_answer,
  ]),
  explanation: z.string().max(5000).optional(),
  tags: z.array(z.string().min(1)).max(10).default([]),
});

export const updateQuizSchema = createQuizSchema.partial();

export const listQuizzesQuerySchema = z.object({
  status: z.enum(['draft','pending','approved','rejected']).optional(),
  tags: z.array(z.string()).optional(),
  keyword: z.string().optional(),
  author: z.string().optional(),
  sort: z.enum(['new','popular']).default('new').optional(),
  page: z.coerce.number().min(1).default(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).default(20).optional(),
});

export const createSetSchema = z.object({
  slug: z.string().min(3).max(64).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  quizIds: z.array(z.string().uuid()).min(1),
});

export const updateSetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  quizIds: z.array(z.string().uuid()).min(1).optional(),
  status: z.enum(['draft','private','public']).optional(),
});

export const submissionSchema = z.object({
  quizSetId: z.string().uuid(),
  answers: z.record(z.string().uuid(), z.any()),
  durationSec: z.number().int().min(0).max(60 * 60 * 4).default(0).optional(),
});

export const leaderboardQuerySchema = z.object({
  range: z.enum(['weekly','monthly','all']).default('all').optional(),
  limit: z.coerce.number().min(1).max(100).default(100).optional(),
});

export const moderateSchema = z.object({
  action: z.enum(['approve','reject']),
  reason: z.string().max(500).optional(),
});

export const reportSchema = z.object({
  reason: z.string().min(3).max(500),
});

export function normalizeShortAnswer(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ');
}

