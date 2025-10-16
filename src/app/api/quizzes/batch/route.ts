import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authz';
import { okJson, parseJson, unauthorized } from '@/lib/http';

type BatchInput = {
  version: string;
  quizId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  questions: Array<{
    id: string;
    type: 'single'|'multiple'|'boolean';
    content: string;
    options: { id: string; text: string }[];
    answer: string[];
    explanation?: string;
    difficulty?: 'easy'|'medium'|'hard';
    tags?: string[];
  }>;
};

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();
  const body = await parseJson<BatchInput>(req);

  if (!body?.questions?.length) return okJson({ created: 0, quizIds: [] }, { status: 400 });

  const createdIds: string[] = [];
  for (const q of body.questions) {
    if (!q.id || !q.type || !q.content || !Array.isArray(q.options) || !Array.isArray(q.answer)) continue;
    if (q.type === 'single' && q.answer.length !== 1) continue;
    if (q.type === 'multiple' && q.answer.length < 2) continue;
    if (q.type === 'boolean' && !(q.answer.length === 1 && (q.answer[0] === 'T' || q.answer[0] === 'F'))) continue;
    const optionIds = new Set(q.options.map(o => o.id));
    if (!q.answer.every(a => optionIds.has(a))) continue;

    const mappedType = q.type === 'boolean' ? 'true_false' : (q.type === 'single' ? 'single_choice' : 'multi_choice');
    const created = await prisma.quiz.create({
      data: {
        authorId: user.id,
        title: q.content.slice(0, 60),
        type: mappedType as any,
        content: { stem: q.content, options: q.options },
        answer: mappedType === 'true_false' ? (q.answer[0] === 'T') : (mappedType === 'single_choice' ? q.answer[0] : q.answer),
        explanation: q.explanation,
        tags: q.tags || body.tags || [],
        status: 'pending',
      }
    });
    createdIds.push(created.id);
  }

  return okJson({ created: createdIds.length, quizIds: createdIds });
}

export const runtime = 'nodejs';

