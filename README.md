<div align="center">

# QuizPort · 读完即测的在线题库

一键把文章变成测验，支持多题型、做题历史与分享卡片。

<br />

<img src="public/01-home.png" alt="首页预览" width="900" />

</div>

## 使用指南（面向用户）

1. 打开站点首页，连接钱包完成登录（SIWE）。

2. 进入“上传题目”页，粘贴题目或从文章生成；保存后系统会生成一个题库链接。

3. 在“历史题库”中找到你的题库，点击“开始测试”答题：

- 做题进度与答案会自动缓存，刷新页面不会丢失；
- 交卷后可按“错题/全部”筛选；
- 想重来就点“重新挑战”。

4. 分享传播：在历史题库卡片点击“分享”，支持两种形式：

- 卡片形式：包含标题、作者、前三道题、二维码；
- 复制链接：一键复制直达链接。

<div align="center">
  <img src="public/02-upload.png" alt="上传页预览" width="900" />
</div>

---

## 本地开发（面向开发者）

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

访问路径：`/`（首页）、`/upload`（上传）、`/history`（历史题库）、`/set/[slug]`（题库播放）。

SIWE 登录须知：

- 浏览器地址栏主机名需与 `SIWE_DOMAIN` 一致（本地为 localhost）。
- `NEXTAUTH_URL` 必须与实际访问的 origin 一致（本地为 http://localhost:3000）。
- 浏览器需安装注入式钱包（如 MetaMask）。

---

## 部署到 Vercel（推荐）

1. 创建数据库（推荐 Neon Postgres），拿到 `DATABASE_URL`。
2. 在 Vercel 新建项目，导入本仓库。
3. 在 Vercel 项目 Settings → Environment Variables 配置：

```
DATABASE_URL=你的生产库连接串
NEXTAUTH_URL=https://你的域名
NEXTAUTH_SECRET=强随机串
SIWE_DOMAIN=你的域名（不带协议）
NEXT_PUBLIC_SIWE_STATEMENT=Sign in to QuizPort
```

4. 构建：使用默认 `npm run build`（已内置 Tailwind 预编译）。
5. 绑定自定义域名（可选），上线验证以下页面：`/`、`/upload`、`/history`、`/set/[slug]`。

注意：不要为路由强制 `runtime = 'edge'`，保持 Node 运行时以兼容 next-auth/Prisma。


## 批量上传题目（JSON v1.0）

接口：`POST /api/quizzes/batch`

<details>
<summary>查看示例与字段说明</summary>

顶层结构：version / quizId / title / description / tags / questions[]

示例：

```json
{
  "version": "1.0",
  "quizId": "quiz_2025_001",
  "title": "React 基础测验",
  "description": "阅读完博客后即测：JSX/状态/生命周期",
  "tags": ["react", "frontend", "blog-embed"],
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "content": "以下哪个 Hook 用于管理函数组件内部状态？",
      "options": [
        { "id": "A", "text": "useState" },
        { "id": "B", "text": "useMemo" },
        { "id": "C", "text": "useCallback" },
        { "id": "D", "text": "useRef" }
      ],
      "answer": ["A"]
    }
  ]
}
```

判分逻辑（MVP）：严格集合匹配（用户选择集合 == answer 集合）。

</details>

前端使用：在“上传题目”页右侧的“批量上传（粘贴题集 JSON）”区域粘贴上述 JSON，点击“批量提交”即可。

---

## 功能特性

- 多题型：单选/多选/判断/简答
- 做题进度缓存与“重新挑战”
- 结果页筛选（错题/全部）
- 历史题库与分享（卡片 + 复制链接）
- 钱包登录（SIWE）与积分策略（可扩展）

## 许可证

MIT
