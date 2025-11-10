'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguage, useTranslations } from '@/components/providers/LanguageProvider';
import type { Lang } from '@/i18n/translations';

export default function CapsuleNav() {
  const { lang, setLang } = useLanguage();
  const nav = useTranslations('nav');
  const common = useTranslations('common');

  return (
    <div className="mx-auto inline-flex items-center gap-4 rounded-full bg-black/40 backdrop-blur px-6 md:px-8 py-3 ring-1 ring-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <Link href="/" className="text-white font-extrabold text-[20px] md:text-[22px]">
        QuizPort
      </Link>
      <span className="text-white/30">|</span>
      <Link href="/guide" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        {nav.guide}
      </Link>
      <span className="text-white/30">·</span>
      <Link href="/upload" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        {nav.upload}
      </Link>
      <span className="text-white/30">·</span>

      <Link href="/history" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        {nav.history}
      </Link>
      <span className="text-white/30">·</span>
      <Link href="/remote" className="text-white text-[15px] md:text-[18px] hover:text-white/90">
        {nav.remote}
      </Link>

      <span className="ml-3 hidden md:inline-block">
        <div className="scale-95 md:scale-100">
          <ConnectButton />
        </div>
      </span>
      <div className="ml-3 flex items-center gap-2">
        <label htmlFor="language-selector" className="hidden text-xs text-white/60 md:block">
          {nav.languageLabel}
        </label>
        <select
          id="language-selector"
          value={lang}
          onChange={(event) => setLang(event.target.value as Lang)}
          className="rounded-full bg-black/50 px-3 py-1 text-sm text-white/80 outline-none ring-1 ring-white/20 hover:text-white"
        >
          <option value="zh">{common.languageOptions.zh}</option>
          <option value="en">{common.languageOptions.en}</option>
        </select>
      </div>
    </div>
  );
}
