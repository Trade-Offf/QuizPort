export type Lang = 'zh' | 'en';

type NavTranslations = {
  remote: string;
  interview: string;
  languageLabel: string;
};

type LanguageOptions = {
  zh: string;
  en: string;
};

type HomeTranslations = {
  heroTitle: string;
  heroSubtitle: string;
  ctaInterview: string;
  ctaRemote: string;
};

type CommonTranslations = {
  languageOptions: LanguageOptions;
  yes: string;
  no: string;
  signedInFallback: string;
};

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
  remote: RemoteTranslations;
  common: CommonTranslations;
};

export const translations: Record<Lang, TranslationSchema> = {
  zh: {
    nav: {
      remote: 'Remote求职',
      interview: 'AI面试',
      languageLabel: '语言',
    },
    home: {
      heroTitle: 'AI 模拟面试，助你拿下心仪 Offer',
      heroSubtitle: '上传简历，AI 实时语音面试，获取专业反馈报告，轻松备战技术面试',
      ctaInterview: '开始 AI 面试',
      ctaRemote: '浏览远程职位',
    },
    remote: {
      title: 'Remote 求职导航',
      subtitle: '精选远程/混合办公招聘网站与社区，点击卡片直达官网。建议结合时区、签证/合规与薪资范围筛选。',
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
      remote: 'Remote Jobs',
      interview: 'AI Interview',
      languageLabel: 'Language',
    },
    home: {
      heroTitle: 'AI Mock Interview, Land Your Dream Offer',
      heroSubtitle: 'Upload your resume, practice with real-time AI voice interview, get professional feedback report',
      ctaInterview: 'Start AI Interview',
      ctaRemote: 'Browse Remote Jobs',
    },
    remote: {
      title: 'Remote Jobs Directory',
      subtitle: 'Curated remote/hybrid job boards and communities. Click a card to visit. Consider time zone, work authorization/compliance, and salary range filters.',
      groups: {
        zh: 'Chinese sites',
        global: 'Global sites',
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

