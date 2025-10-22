'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link as UiLink, Button, Drawer } from '@heroui/react';

const links = [
  { href: '/upload', label: '生成测验' },
  { href: '/history', label: '历史题库' },
];

export function Header() {
  const pathname = usePathname();
  // 首页不显示全局顶部 Header（在首页内自定义胶囊导航）
  if (pathname === '/') return null;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 计算胶囊高亮的位置与宽度（精确跟随当前激活项）
  useEffect(() => {
    const active = itemRefs.current[pathname];
    const container = containerRef.current;
    if (active && container) {
      const a = active.getBoundingClientRect();
      const c = container.getBoundingClientRect();
      setPillStyle({ left: a.left - c.left, width: a.width });
    }
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      const active = itemRefs.current[pathname];
      const container = containerRef.current;
      if (active && container) {
        const a = active.getBoundingClientRect();
        const c = container.getBoundingClientRect();
        setPillStyle({ left: a.left - c.left, width: a.width });
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pathname]);
  return (
    <Navbar
      maxWidth="xl"
      className={`navbar-apple sticky top-0 z-50 h-16 border-b border-white/10 transition-[background-color,box-shadow] duration-300 ${
        scrolled ? 'bg-black/30 shadow-[0_1px_0_rgba(255,255,255,0.08)]' : 'bg-black/20'
      } backdrop-blur supports-backdrop-filter:bg-black/20 text-white`}
    >
      <NavbarBrand as={Link} href="/" className="group font-extrabold tracking-tight">
        <span className="!text-[18px] md:!text-[20px] text-white">QuizPort</span>
      </NavbarBrand>
      <NavbarContent justify="center" className="hidden md:flex gap-8">
        {links.map((l) => (
          <NavbarItem key={l.href} isActive={pathname === l.href}>
            <UiLink
              as={Link}
              href={l.href}
              className="px-3 py-1.5 text-[15px] font-semibold text-gray-200 hover:text-white data-[active=true]:text-white"
            >
              {l.label}
            </UiLink>
          </NavbarItem>
        ))}
      </NavbarContent>
      <NavbarContent justify="end" className="gap-2">
        <NavbarItem className="md:hidden">
          <Button isIconOnly variant="light" aria-label="打开菜单" onPress={() => setIsMenuOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </Button>
        </NavbarItem>
        <NavbarItem>
          <div className="scale-90 md:scale-100">
            <ConnectButton />
          </div>
        </NavbarItem>
      </NavbarContent>
      <Drawer isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} size="xs" placement="right">
        <div className="p-4 space-y-2">
          {links.map((l) => (
            <UiLink
              key={l.href}
              as={Link}
              href={l.href}
              className="block px-2 py-2 text-[15px] text-gray-800 hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {l.label}
            </UiLink>
          ))}
        </div>
      </Drawer>
    </Navbar>
  );
}
