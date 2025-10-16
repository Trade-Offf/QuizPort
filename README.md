# QuizPort

本地开发快速开始

1. 启动数据库（Docker）

```bash
docker compose up -d
```

2. 配置环境变量 `.env`

```env
DATABASE_URL="postgresql://quizport:quizport@localhost:5432/quizport?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="请填强随机串"
SIWE_DOMAIN="localhost"
NEXT_PUBLIC_SIWE_STATEMENT="Sign in to QuizPort"
```

3. 安装依赖并初始化数据库

```bash
npm i
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

4. 启动开发

```bash
npm run dev
```

访问：

- 首页：/
- 题单：/set/hello-world
- 上传：/upload
- 管理：/admin

SIWE 登录须知：

- 浏览器地址栏主机名需与 `SIWE_DOMAIN` 一致（本地为 localhost）。
- `NEXTAUTH_URL` 必须与实际访问的 origin 一致（本地为 http://localhost:3000）。
- 浏览器需安装钱包（注入式）。
