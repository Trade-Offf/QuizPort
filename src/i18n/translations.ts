export type Lang = 'zh' | 'en';

type NavTranslations = {
  guide: string;
  remote: string;
  languageLabel: string;
};

type LanguageOptions = {
  zh: string;
  en: string;
};

type HomeTranslations = {
  heroTitle: string;
  heroSubtitle: string;
  ctaGuide: string;
  ctaRemote: string;
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
  };
  whitelistNote: string;
  contactModal: {
    title: string;
    close: string;
    qrAlt: string;
  };
};

type CommonTranslations = {
  languageOptions: LanguageOptions;
  yes: string;
  no: string;
  signedInFallback: string;
};

// Remote jobs page translations
type RemoteTranslations = {
  title: string;
  subtitle: string;
  groups: {
    zh: string;
    global: string;
  };
};


export type TranslationSchema = {
  nav: NavTranslations;
  home: HomeTranslations;
  guide: GuideTranslations;
  remote: RemoteTranslations;
  common: CommonTranslations;
};

export const translations: Record<Lang, TranslationSchema> = {
  zh: {
    nav: {
      guide: '使用说明',
      remote: 'Remote求职',
      languageLabel: '语言',
    },
    home: {
      heroTitle: '让每篇好文都有测验陪跑',
      heroSubtitle: 'QuizPort 1.0 以 AI 理解文章要点，生成多题型练习，帮助内容创作者与学习者实现读完即测',
      ctaGuide: '查看内测指南',
      ctaRemote: '浏览远程职位',
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
          title: '浏览远程职位导航',
          desc: '访问 Remote 求职导航页面，查找适合的远程工作机会。',
          imageAlt: '远程职位导航示意图',
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
    remote: {
      title: 'Remote 求职导航',
      subtitle:
        '精选远程/混合办公招聘网站与社区，点击卡片直达官网。建议结合时区、签证/合规与薪资范围筛选。',
      groups: {
        zh: '中文站点',
        global: '全球站点',
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
      remote: 'Remote Jobs',
      languageLabel: 'Language',
    },
    home: {
      heroTitle: 'Every great article deserves a quiz companion',
      heroSubtitle:
        'QuizPort 1.0 understands article key points with AI and generates multi-format exercises so creators and learners can test instantly.',
      ctaGuide: 'View beta guide',
      ctaRemote: 'Browse remote jobs',
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
          title: 'Browse remote job opportunities',
          desc: 'Visit the Remote Jobs navigation page to find suitable remote work opportunities.',
          imageAlt: 'Remote jobs navigation illustration',
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
    common: {
      languageOptions: {
        zh: '中文',
        en: 'English',
      },
      yes: 'Yes',
      no: 'No',
      signedInFallback: 'Signed in',
    },
    remote: {
      title: 'Remote Jobs Directory',
      subtitle:
        'Curated remote/hybrid job boards and communities. Click a card to visit. Consider time zone, work authorization/compliance, and salary range filters.',
      groups: {
        zh: 'Chinese sites',
        global: 'Global sites',
      },
    },

  },
};

