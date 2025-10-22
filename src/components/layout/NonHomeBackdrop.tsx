'use client';
import { usePathname } from 'next/navigation';

export default function NonHomeBackdrop() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          'radial-gradient(1000px 600px at 80% 10%, rgba(99,102,241,0.15), transparent 60%), radial-gradient(800px 400px at 10% 20%, rgba(236,72,153,0.12), transparent 55%), #0b0912',
      }}
    />
  );
}


