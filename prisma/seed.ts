/*
  Minimal seed for local development. Requires DATABASE_URL.
*/
import { PrismaClient, QuizType, QuizStatus, QuizSetStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      role: 'admin',
    },
  });

  const q1 = await prisma.quiz.create({
    data: {
      authorId: alice.id,
      title: '2 + 2 = ?',
      type: QuizType.single_choice,
      content: {
        stem: '2 + 2 = ?','options': [
          { id: 'A', text: '3' },
          { id: 'B', text: '4' },
          { id: 'C', text: '5' }
        ]
      },
      answer: 'B',
      explanation: '基础算术题：2+2=4',
      tags: ['math','easy'],
      status: QuizStatus.approved,
    },
  });

  const q2 = await prisma.quiz.create({
    data: {
      authorId: alice.id,
      title: 'HTTP 是无状态协议（对/错）',
      type: QuizType.true_false,
      content: { stem: 'HTTP 是无状态协议（对/错）' },
      answer: true,
      explanation: 'HTTP 默认是无状态的',
      tags: ['web'],
      status: QuizStatus.approved,
    },
  });

  await prisma.quizSet.create({
    data: {
      slug: 'hello-world',
      title: '示例题单',
      description: '用于本地开发测试的示例题单',
      authorId: alice.id,
      quizIds: [q1.id, q2.id],
      status: QuizSetStatus.public,
    }
  });

  console.log('Seed completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

