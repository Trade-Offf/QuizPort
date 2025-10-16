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

## 批量上传题目（JSON v1.0）

接口：`POST /api/quizzes/batch`

顶层结构：

- version: 模式版本号
- quizId: 本次上传题集 ID（可选）
- title/description/tags: 题集元信息（可选）
- questions: 题目数组（必填）

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
        {"id": "A", "text": "useState"},
        {"id": "B", "text": "useMemo"},
        {"id": "C", "text": "useCallback"},
        {"id": "D", "text": "useRef"}
      ],
      "answer": ["A"],
      "explanation": "useState 用于管理本地状态；useMemo/useCallback 为缓存；useRef 持有可变引用。",
      "difficulty": "easy",
      "tags": ["react", "hooks"]
    },
    {
      "id": "q2",
      "type": "multiple",
      "content": "下列哪些属于副作用，需要在 useEffect 中处理？",
      "options": [
        {"id": "A", "text": "订阅事件"},
        {"id": "B", "text": "更新 DOM"},
        {"id": "C", "text": "计算派生状态"},
        {"id": "D", "text": "网络请求"}
      ],
      "answer": ["A","B","D"],
      "explanation": "副作用包含与外部世界交互的操作，如订阅、DOM、请求；纯计算通常不应放入 effect。",
      "difficulty": "medium",
      "tags": ["react", "effects"]
    },
    {
      "id": "q3",
      "type": "boolean",
      "content": "React 组件的 props 是可变的（mutable）。",
      "options": [
        {"id": "T", "text": "True"},
        {"id": "F", "text": "False"}
      ],
      "answer": ["F"],
      "explanation": "props 应视为只读；状态用 state 管理。",
      "difficulty": "easy",
      "tags": ["react", "props"]
    }
  ]
}
```

字段规范：

- id: 题目/选项唯一标识（字符串）
- type: `single` | `multiple` | `boolean`
- content: 题干文本；如需富文本可加 `contentType: "markdown"`
- options: 统一为选项数组（判断题用 T/F 选项）
- answer: 正确选项 ID 列表（数组）
  - single: 恰好 1 个
  - multiple: ≥2 个
  - boolean: 必须是 `["T"]` 或 `["F"]`，且 options 中存在对应项
- explanation/difficulty/tags: 可选

校验要点（服务端已实现）：

- `questions` 为非空数组
- 每题包含 `id/type/content/options/answer`
- `answer` 中每个值必须存在于 `options[].id`
- 版本兼容：保留 `version` 字段；新增字段一律可选

判分逻辑（MVP）：严格集合匹配（用户选择集合 == answer 集合），不做部分得分。

最小可用模板：

```json
{
  "version": "1.0",
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "content": "题干……",
      "options": [{"id":"A","text":"选项1"},{"id":"B","text":"选项2"}],
      "answer": ["A"]
    }
  ]
}
```

前端使用：在“上传题目”页右侧的“批量上传（粘贴题集 JSON）”区域粘贴上述 JSON，点击“批量提交”即可。
