# 🧠 AI 灵感提词器 (Next.js 架构 & 成本表)

## 💻 前端层 (Client Side / Next.js)

- **核心组件 (Components)**
  - `Recorder.tsx`: 处理麦克风权限、音频流采集
  - `Teleprompter.tsx`: 大字号显示 AI 问题 (Framer Motion 动画)
  - `CameraView`: 调用 `<video>` 标签显示用户自拍镜像
- **关键逻辑 (Logic)**
  - **VAD (静音检测)**: 浏览器端判断用户是否停止说话 (关键省钱点)
  - **WebSocket**: 使用 Deepgram SDK 直连云端 (绕过 Next.js 后端以降低延迟)
  - **Debounce (防抖)**: 用户停顿 800ms 后才触发 AI 提问请求

## ☁️ 服务端层 (Next.js API Routes)

- **API: /api/deepgram-token**
  - 作用: 生成临时 API Key (TTL 10 秒)
  - 安全: 防止前端暴露真实 Deepgram Key
- **API: /api/chat (Edge Runtime)**
  - 作用: 接收 STT 文本 -> 组装 Prompt -> 请求 Groq
  - 优势: Edge 模式启动快，无冷启动延迟
  - Prompt 策略: "你是采访者，只问不答，限制 15 字以内"

## 🔗 外部服务栈 (The Stack)

- **👂 听 (STT): Deepgram**
  - 模型: Nova-2 (General)
  - 模式: Streaming (WebSocket)
  - **成本: $0.0043 / min**
- **🧠 想 (LLM): Groq**
  - 模型: Llama 3-8B-8192
  - 速度: >800 Tokens/s (极速)
  - **成本: Input $0.05 / Output $0.10 (per 1M tokens)**

## 💰 1 小时连续使用成本拆解 (Cost Breakdown)

- **总计: $0.144 (约 ¥1.03 RMB)**
  - **1. STT (Deepgram)**: $0.129
    - 计算: 30 分钟有效语音 × $0.0043
    - 占比: 🔴 90% (成本大头)
  - **2. LLM (Groq)**: $0.005
    - 计算: 100 轮对话 × 1000 Context Tokens
    - 占比: 🟢 3% (几乎免费)
  - **3. Infrastructure (Vercel)**: ~$0.010
    - 计算: Serverless Function 调用费 + 流量
    - 占比: 🟡 7%

## 🚀 商业化与优化 (Optimization)

- **省钱策略**
  - 前端 VAD 必须灵敏，不说话时绝对不传数据
  - 设置每日免费额度 (如 15 分钟 = ¥0.25 成本)
- **定价建议**
  - 订阅制: ¥19.9 / 月
  - 盈亏平衡点: 用户每月使用时长 < 20 小时即盈利
