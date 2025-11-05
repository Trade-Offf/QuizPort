export type Lang = 'zh' | 'en';

type NavTranslations = {
  guide: string;
  upload: string;
  history: string;
  languageLabel: string;
};

type LanguageOptions = {
  zh: string;
  en: string;
};

type HomeTranslations = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaGuide: string;
  tip1Prefix: string;
  tip1Guide: string;
  tip1Middle: string;
  tip1Suffix: string;
  tip2: string;
};

type GuideStepOne = {
  title: string;
  desc: string;
  actions: {
    chrome: string;
    firefox: string;
    opera: string;
  };
};

type GuideStepTwo = {
  title: string;
  descLoggedOut: string;
  descLoggedIn: string;
  signedInLabel: string;
};

type GuideStepWithDesc = {
  title: string;
  desc: string;
};

type GuideStepThree = GuideStepWithDesc & {
  buttons: {
    github: string;
    contact: string;
  };
};

type GuideStepFour = GuideStepWithDesc & {
  imageAlt: string;
};

type GuideTranslations = {
  title: string;
  subtitle: string;
  steps: {
    step1: GuideStepOne;
    step2: GuideStepTwo;
    step3: GuideStepThree;
    step4: GuideStepFour;
    step5: GuideStepWithDesc;
    step6: GuideStepWithDesc;
  };
  whitelistNote: string;
  contactModal: {
    title: string;
    close: string;
    qrAlt: string;
  };
};

type UploadTranslations = {
  title: string;
  subtitleBadge: string;
  placeholder: string;
  fetchButton: string;
  previewCard: {
    title: string;
    previewTitleFallback: string;
    sourceLabel: string;
    articleBodyLabel: string;
    titleLabel: string;
    titleEmpty: string;
    authorLabel: string;
    authorEmpty: string;
    contentLabel: string;
    contentEmpty: string;
    expandLabel: string;
    generateButton: string;
    generateHint: string;
  };
  selectionSummary: (selected: number, total: number, minimum: number) => string;
  actions: {
    selectAll: string;
    clearAll: string;
    create: string;
    creating: string;
    createHint: string;
  };
  toasts: {
    generating: string;
    generated: string;
    generateFailed: string;
    creating: string;
    loginRequired: string;
    existing: string;
    createFailed: string;
    created: string;
  };
  progressAria: string;
  questionTypes: Record<'single' | 'multiple' | 'boolean', string>;
  difficulty: Record<'easy' | 'medium' | 'hard', string>;
  explanationLabel: string;
  meta: {
    type: string;
    difficulty: string;
  };
  bottomNote: string;
  modal: {
    title: string;
    description: string;
    dismiss: string;
    confirm: string;
  };
};

type CommonTranslations = {
  languageOptions: LanguageOptions;
  yes: string;
  no: string;
  signedInFallback: string;
};

export type TranslationSchema = {
  nav: NavTranslations;
  home: HomeTranslations;
  guide: GuideTranslations;
  upload: UploadTranslations;
  common: CommonTranslations;
};

export const translations: Record<Lang, TranslationSchema> = {
  zh: {
    nav: {
      guide: '使用说明',
      upload: '生成测试',
      history: '历史题库',
      languageLabel: '语言',
    },
    home: {
      heroTitle: '让每篇好文都有测验陪跑',
      heroSubtitle: 'QuizPort 1.0 以 AI 理解文章要点，生成多题型练习，帮助内容创作者与学习者实现读完即测',
      ctaPrimary: '立即创建题单',
      ctaSecondary: '浏览历史题库',
      ctaGuide: '查看内测指南',
      tip1Prefix:
        'Tips：QuizPort 1.0 采用内测白名单制度，点击“',
      tip1Guide: '查看内测指南',
      tip1Middle: '”可了解申请流程，或掘金私信',
      tip1Suffix: '开通体验。',
      tip2: '当前支持「稀土掘金」文章生成，多平台适配与积分激励体系正在筹备中。',
    },
    guide: {
      title: '使用说明 · Getting Started',
      subtitle: '按以下步骤快速上手，从安装钱包到生成题单、发布与分享。',
      steps: {
        step1: {
          title: '安装钱包，准备生成题单',
          desc: '为浏览器安装 MetaMask 插件，完成创建题单所需的基础环境（已安装可跳过）。请选择你的浏览器：',
          actions: {
            chrome: '安装 Chrome 版',
            firefox: '安装 Firefox 版',
            opera: '安装 Opera 版',
          },
        },
        step2: {
          title: '连接钱包并完成登录',
          descLoggedOut:
            '点击右上角“连接钱包”，按照提示完成 SIWE 签名。首次登录会自动为你创建 QuizPort 账号。',
          descLoggedIn: '你已完成登录，可以继续申请内测白名单。',
          signedInLabel: '已登录',
        },
        step3: {
          title: '申请内测白名单',
          desc: '为保障题目质量与模型调用，我们采用白名单方式开放 QuizPort 1.0 内测。添加作者微信或为 GitHub 项目加星支持，即可申请免费生成额度。',
          buttons: {
            github: '前往 GitHub 项目',
            contact: '联系作者',
          },
        },
        step4: {
          title: '粘贴文章，AI 自动生成预览',
          desc: '进入“生成测试”页，粘贴稀土掘金文章链接 → 点击“获取文章内容” → 30–60 秒内 AI 将理解要点并生成多题型练习。',
          imageAlt: '复制链接示意图',
        },
        step5: {
          title: '挑选题目并创建题单',
          desc: '从预览中勾选至少 10 题，点击“创建”。系统会自动生成草稿题单，方便你校对与发布。',
        },
        step6: {
          title: '发布题单并分享学习成果',
          desc: '发布后题单转为公开，可复制链接或在历史题库中生成分享卡片，学习数据也会在题库中长期保存。',
        },
      },
      whitelistNote:
        '内测期白名单用户可免费体验题目生成功能，积分激励体系也在筹备中，将用于嘉奖优质题单与活跃答题者。',
      contactModal: {
        title: '微信扫码联系作者',
        close: '关闭',
        qrAlt: '微信二维码',
      },
    },
    upload: {
      title: '粘贴文章，AI 生成题单草稿',
      subtitleBadge: '粘贴稀土掘金文章链接，AI 自动提取标题与正文',
      placeholder: 'https://juejin.cn/post/xxxxxxxx',
      fetchButton: '获取文章内容',
      previewCard: {
        title: '文章预览',
        previewTitleFallback: '预览',
        sourceLabel: '抓取来源',
        articleBodyLabel: '命中文章主体',
        titleLabel: '标题',
        titleEmpty: '（空）',
        authorLabel: '作者',
        authorEmpty: '（未识别）',
        contentLabel: '正文（前 200 字）',
        contentEmpty: '（空）',
        expandLabel: '展开查看全文（纯文本，便于校对）',
        generateButton: '基于该文章生成题目预览',
        generateHint: 'AI 正在理解文章要点，通常需要 30–60 秒',
      },
      selectionSummary: (selected, total, minimum) =>
        `已选 ${selected} / ${total} · 至少选择 ${minimum} 题即可创建题单`,
      actions: {
        selectAll: '全选',
        clearAll: '清空',
        create: '创建',
        creating: '创建中…',
        createHint: '发布后可在历史题库查看答题进度，积分激励功能上线后将同步关联。',
      },
      toasts: {
        generating: 'AI 正在理解文章要点，预计 30–60 秒完成。',
        generated: '题目生成完成，请挑选想要发布的练习。',
        generateFailed: '生成失败，请稍后重试或添加作者获取支持。',
        creating: '正在创建题单并发布，稍候片刻…',
        loginRequired: '请先登录后再创建题目',
        existing: '该文章题单已存在，可直接进入测验页。',
        createFailed: '创建失败，请稍后重试或联系作者。',
        created: '题单创建完成，正在跳转至测验页。',
      },
      progressAria: '选题进度',
      questionTypes: {
        single: '单选',
        multiple: '多选',
        boolean: '判断',
      },
      difficulty: {
        easy: '简单',
        medium: '中等',
        hard: '困难',
      },
      explanationLabel: '解析：',
      meta: {
        type: '类型',
        difficulty: '难度',
      },
      bottomNote:
        'QuizPort 1.0 处于内测阶段，白名单用户可免费生成题目。若需开通权限或反馈需求，请在首页指南中添加作者微信。',
      modal: {
        title: '题单已存在',
        description: '该文章的题单已创建。你可以直接进入做题。',
        dismiss: '我知道了',
        confirm: '去做题',
      },
    },
    common: {
      languageOptions: {
        zh: '中文',
        en: 'English',
      },
      yes: '是',
      no: '否',
      signedInFallback: '已登录',
    },
  },
  en: {
    nav: {
      guide: 'Guide',
      upload: 'Generate',
      history: 'Library',
      languageLabel: 'Language',
    },
    home: {
      heroTitle: 'Every great article deserves a quiz companion',
      heroSubtitle:
        'QuizPort 1.0 understands article key points with AI and generates multi-format exercises so creators and learners can test instantly.',
      ctaPrimary: 'Create a quiz set',
      ctaSecondary: 'Browse the library',
      ctaGuide: 'View beta guide',
      tip1Prefix:
        'Tips: QuizPort 1.0 runs on a closed beta whitelist. Click “',
      tip1Guide: 'View beta guide',
      tip1Middle: '” to learn how to apply, or DM ',
      tip1Suffix: ' on Juejin to request access.',
      tip2: 'Currently supports Juejin articles. More sources and the points program are coming soon.',
    },
    guide: {
      title: 'Guide · Getting Started',
      subtitle: 'Follow these steps to go from wallet setup to quiz creation, publishing, and sharing.',
      steps: {
        step1: {
          title: 'Install a wallet to get ready',
          desc: 'Install the MetaMask extension for your browser to set up the quiz creation essentials (skip if already installed). Choose your browser:',
          actions: {
            chrome: 'Install for Chrome',
            firefox: 'Install for Firefox',
            opera: 'Install for Opera',
          },
        },
        step2: {
          title: 'Connect your wallet and sign in',
          descLoggedOut:
            'Click “Connect Wallet” in the top-right corner and complete the SIWE signature. Your QuizPort account is created automatically on first sign-in.',
          descLoggedIn: 'You are signed in—go ahead and apply for the closed beta whitelist.',
          signedInLabel: 'Signed in',
        },
        step3: {
          title: 'Apply for the closed beta whitelist',
          desc: 'To maintain quiz quality and manage model usage, QuizPort 1.0 is invite-only. Add the author on WeChat or star our GitHub repo to request free generation credits.',
          buttons: {
            github: 'Go to GitHub repo',
            contact: 'Contact author',
          },
        },
        step4: {
          title: 'Paste an article for AI preview',
          desc: 'Open “Generate Test”, paste a Juejin article link, click “Fetch article”, and within 30–60 seconds AI will create a multi-format preview.',
          imageAlt: 'Illustration: copy link',
        },
        step5: {
          title: 'Select questions and create your quiz set',
          desc: 'Choose at least 10 questions from the preview and click “Create”. A draft quiz set is generated for you to review and publish.',
        },
        step6: {
          title: 'Publish your quiz and share it',
          desc: 'After publishing, the quiz becomes public. Copy the link or generate a share card from the history library to keep results accessible.',
        },
      },
      whitelistNote:
        'Closed beta whitelist users can generate quizzes for free. A points incentive program is on the way to reward top quiz creators and active learners.',
      contactModal: {
        title: 'Scan the WeChat QR code to contact the author',
        close: 'Close',
        qrAlt: 'WeChat QR code',
      },
    },
    upload: {
      title: 'Paste an article, let AI draft your quiz',
      subtitleBadge: 'Paste a Juejin link and AI will extract the title and content automatically',
      placeholder: 'https://juejin.cn/post/xxxxxxxx',
      fetchButton: 'Fetch article',
      previewCard: {
        title: 'Article preview',
        previewTitleFallback: 'Preview',
        sourceLabel: 'Source',
        articleBodyLabel: 'Article body detected',
        titleLabel: 'Title',
        titleEmpty: '(empty)',
        authorLabel: 'Author',
        authorEmpty: '(not detected)',
        contentLabel: 'Content (first 200 chars)',
        contentEmpty: '(empty)',
        expandLabel: 'Expand to review the full text (plain text for proofreading)',
        generateButton: 'Generate quiz preview with AI',
        generateHint: 'AI is analysing the key points, this usually takes 30–60 seconds.',
      },
      selectionSummary: (selected, total, minimum) =>
        `Selected ${selected} / ${total} · Choose at least ${minimum} questions to create a quiz set`,
      actions: {
        selectAll: 'Select all',
        clearAll: 'Clear',
        create: 'Create',
        creating: 'Creating…',
        createHint: 'After publishing you can track progress in the history library. Points rewards will link up once the program launches.',
      },
      toasts: {
        generating: 'AI is analysing the article. This usually takes 30–60 seconds.',
        generated: 'Quiz preview generated. Pick the questions you want to publish.',
        generateFailed: 'Generation failed. Please retry later or contact the author for support.',
        creating: 'Creating and publishing your quiz set…',
        loginRequired: 'Please sign in before creating a quiz.',
        existing: 'A quiz for this article already exists—you can jump straight to it.',
        createFailed: 'Creation failed. Try again later or reach out to the author.',
        created: 'Quiz set created. Redirecting you to the quiz page.',
      },
      progressAria: 'Question selection progress',
      questionTypes: {
        single: 'Single choice',
        multiple: 'Multiple choice',
        boolean: 'True/False',
      },
      difficulty: {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
      },
      explanationLabel: 'Explanation:',
      meta: {
        type: 'Type',
        difficulty: 'Difficulty',
      },
      bottomNote:
        'QuizPort 1.0 is in closed beta. Whitelisted users can generate quizzes for free. To request access or share feedback, follow the guide on the homepage.',
      modal: {
        title: 'Quiz already exists',
        description: 'A quiz for this article is already created. You can jump straight in.',
        dismiss: 'Got it',
        confirm: 'Go to quiz',
      },
    },
    common: {
      languageOptions: {
        zh: '中文',
        en: 'English',
      },
      yes: 'Yes',
      no: 'No',
      signedInFallback: 'Signed in',
    },
  },
};

