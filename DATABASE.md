# 数据库配置说明

本项目支持两种数据库存储方案：
- **本地开发**：使用 PostgreSQL + Prisma
- **生产环境**：使用 Cloudflare D1

## 本地开发环境

### 1. 启动 PostgreSQL 数据库

确保 Docker 正在运行，然后执行：

```bash
docker-compose up -d
```

### 2. 配置环境变量

创建 `.env` 文件（如果不存在）：

```bash
DATABASE_URL="postgresql://quizport:quizport@localhost:5432/quizport"
```

### 3. 运行数据库迁移

```bash
npx prisma migrate dev
```

如果遇到表名大小写不匹配的问题，可以先重置数据库：

```bash
npx prisma migrate reset
npx prisma migrate dev
```

### 4. 生成 Prisma 客户端

```bash
npx prisma generate
```

## 生产环境（Cloudflare D1）

项目会自动检测运行环境：
- 在 Cloudflare Workers/Pages 环境下使用 D1
- 在本地开发环境下使用 Prisma + PostgreSQL

### 数据库适配层

项目使用了统一的数据库适配层（`src/lib/db.ts`），会自动根据环境选择使用：

```typescript
import { dbQuery, dbQueryOne, dbExecute } from '@/lib/db';

// 查询多条记录
const users = await dbQuery('SELECT * FROM users WHERE role = ?', 'admin');

// 查询单条记录
const user = await dbQueryOne('SELECT * FROM users WHERE id = ?', userId);

// 执行插入/更新/删除
await dbExecute('INSERT INTO users (id, username) VALUES (?, ?)', id, username);
```

### 复杂查询

对于需要复杂查询的场景，可以使用 Prisma 客户端：

```typescript
import { getPrisma } from '@/lib/db';

const prisma = getPrisma();
const users = await prisma.user.findMany({
  where: { role: 'admin' },
  include: { quizzes: true }
});
```

## 开发注意事项

1. **本地开发**：所有 API 路由会自动使用 Prisma + PostgreSQL
2. **D1 限制**：生产环境的 D1 不支持某些 PostgreSQL 特性（如 JSON 字段），需要注意兼容性
3. **SQL 差异**：D1 使用 SQLite 语法，与 PostgreSQL 略有不同
4. **环境检测**：项目会自动检测是否在 Cloudflare 环境运行

## 数据库 Schema

数据库 schema 定义在 `prisma/schema.prisma` 文件中，包括：

- `User` - 用户表
- `Quiz` - 题目表
- `QuizSet` - 题集表
- `Submission` - 提交记录表
- `QuizAttempt` - 答题记录表
- `Report` - 举报记录表
- `PointsLog` - 积分日志表
- `SiweNonce` - SIWE 登录 nonce 表

## 迁移历史

Prisma migrations 位于 `prisma/migrations/` 目录，所有迁移记录都会保存。

## 工具命令

```bash
# 查看数据库状态
npx prisma studio

# 重置数据库（开发环境）
npx prisma migrate reset

# 应用迁移
npx prisma migrate deploy
```

