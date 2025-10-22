'use client';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <span className="block h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        <p className="mt-3 text-sm text-gray-700">页面加载中…</p>
      </div>
    </div>
  );
}
