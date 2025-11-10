'use client';

import { Card, CardBody } from '@heroui/react';
import { useLanguage, useTranslations } from '@/components/providers/LanguageProvider';

function faviconUrl(domain: string, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

type JobBoard = {
  name: string;
  url: string;
  domain: string;
  group: 'zh' | 'global';
  descZh: string;
  descEn: string;
};

const JOB_BOARDS: JobBoard[] = [
  {
    name: 'Remote OK',
    url: 'https://remoteok.com/',
    domain: 'remoteok.com',
    group: 'global',
    descZh: '全球知名远程工作板，职位覆盖开发/设计/市场等多领域。',
    descEn: 'Well-known remote job board across dev/design/marketing.',
  },
  {
    name: 'We Work Remotely',
    url: 'https://weworkremotely.com/',
    domain: 'weworkremotely.com',
    group: 'global',
    descZh: '历史最久的远程社区之一，职位经人工筛选，质量较高。',
    descEn: 'One of the oldest remote communities; curated listings.',
  },
  {
    name: 'Remotive',
    url: 'https://remotive.com/',
    domain: 'remotive.com',
    group: 'global',
    descZh: '面向科技行业的远程职位与社区资源，筛选维度齐全。',
    descEn: 'Tech-focused remote jobs and community resources.',
  },
  {
    name: 'Remote.co',
    url: 'https://remote.co/remote-jobs',
    domain: 'remote.co',
    group: 'global',
    descZh: '专注远程办公的招聘与知识库，涵盖多个职能类别。',
    descEn: 'Remote work guides and jobs across many functions.',
  },
  {
    name: 'FlexJobs',
    url: 'https://www.flexjobs.com/remote-jobs',
    domain: 'flexjobs.com',
    group: 'global',
    descZh: '人工审核职位（付费订阅），远程/灵活用工为主。',
    descEn: 'Human‑vetted roles (paid subscription), remote/flexible.',
  },
  {
    name: 'Wellfound (AngelList Talent)',
    url: 'https://wellfound.com/remote',
    domain: 'wellfound.com',
    group: 'global',
    descZh: 'Startup 职位聚合，可筛选 Remote，偏初创与成长型公司。',
    descEn: 'Startup roles; filter by remote; early‑ to growth‑stage.',
  },
  {
    name: 'Himalayas',
    url: 'https://himalayas.app/jobs',
    domain: 'himalayas.app',
    group: 'global',
    descZh: '开发者友好的远程职位，看公司信息、时区、薪资范围等。',
    descEn: 'Developer‑friendly jobs with company, timezone, salary info.',
  },
  {
    name: 'NoDesk',
    url: 'https://nodesk.co/remote-jobs/',
    domain: 'nodesk.co',
    group: 'global',
    descZh: '远程职位与资源导航，适合数字游民与完全远程团队。',
    descEn: 'Remote jobs/resources for digital nomads and fully‑remote teams.',
  },
  {
    name: 'Working Nomads',
    url: 'https://www.workingnomads.com/jobs',
    domain: 'workingnomads.com',
    group: 'global',
    descZh: '每日精选远程职位，浏览便捷，可订阅邮件推送。',
    descEn: 'Daily curated remote jobs; convenient browsing and email digests.',
  },
  {
    name: 'Jobspresso',
    url: 'https://jobspresso.co/',
    domain: 'jobspresso.co',
    group: 'global',
    descZh: '人工精选高质量远程职位，偏产品/设计/开发/运营类。',
    descEn: 'Expertly curated high‑quality remote roles.',
  },
  {
    name: 'EU Remote Jobs',
    url: 'https://euremotejobs.com/',
    domain: 'euremotejobs.com',
    group: 'global',
    descZh: '聚焦欧洲时区的远程职位，适合在欧或可对齐欧时区的候选人。',
    descEn: 'Remote roles focused on or aligned with European time zones.',
  },
  {
    name: 'Arc.dev',
    url: 'https://arc.dev/remote-jobs',
    domain: 'arc.dev',
    group: 'global',
    descZh: '面向开发者的远程/全球职位市场，支持按技能和时区筛选。',
    descEn: 'Remote/global developer jobs, filter by skills and time zone.',
  },
  {
    name: '电鸭社区',
    url: 'https://eleduck.com/',
    domain: 'eleduck.com',
    group: 'zh',
    descZh: '中文远程/自由职业社区，涵盖全职/兼职/外包/驻场等多种形式。',
    descEn: 'Chinese remote/freelance community: full‑time, part‑time, contract.',
  },
  {
    name: '远程.work',
    url: 'https://yuancheng.work/',
    domain: 'yuancheng.work',
    group: 'zh',
    descZh: '中文远程工作聚合站，提供多岗位与公司信息。',
    descEn: 'Chinese remote jobs aggregator with multiple roles and companies.',
  },
];

export default function RemoteJobsPage() {
  const { lang } = useLanguage();
  const remote = useTranslations('remote');

  const zhSites = JOB_BOARDS.filter((s) => s.group === 'zh');
  const globalSites = JOB_BOARDS.filter((s) => s.group === 'global');

  const Cards = ({ items }: { items: JobBoard[] }) => (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((site) => (
        <a
          key={site.url}
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="h-full rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <img
                  src={faviconUrl(site.domain)}
                  alt={`${site.name} logo`}
                  className="h-8 w-8 rounded-md bg-white/80"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold truncate">{site.name}</div>
                  <div className="mt-1 text-xs text-white/60 truncate">{site.domain}</div>
                </div>
                <span className="text-white/60">↗</span>
              </div>
              <p className="mt-3 text-sm text-white/80 line-clamp-3">
                {lang === 'zh' ? site.descZh : site.descEn}
              </p>
            </CardBody>
          </Card>
        </a>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{remote.title}</h1>
        <p className="mt-2 text-sm md:text-base text-white/70">{remote.subtitle}</p>

        <h2 className="mt-8 text-xl font-bold">{remote.groups.zh}</h2>
        <Cards items={zhSites} />

        <h2 className="mt-8 text-xl font-bold">{remote.groups.global}</h2>
        <Cards items={globalSites} />
      </div>
    </main>
  );
}
