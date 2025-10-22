'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function RouteLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 每次路径变化时，显示一个短暂的加载态，等下一帧渲染完成后自动隐藏
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!loading) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-gradient-brand animate-[shimmer_1.5s_linear_infinite]" />
  );
}
