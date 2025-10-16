"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const links = [
  { href: '/quizzes', label: '题库' },
  { href: '/leaderboard', label: '排行榜' },
  { href: '/set/hello-world', label: '示例题单' },
  { href: '/creator/sets/new', label: '创建题单' },
  { href: '/upload', label: '上传题目' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          <span className="bg-gradient-brand bg-clip-text text-transparent">QuizPort</span>
        </Link>
        <nav className="hidden gap-4 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                pathname === l.href
                  ? 'text-gray-900'
                  : 'text-gray-700 hover:text-gray-900'
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

