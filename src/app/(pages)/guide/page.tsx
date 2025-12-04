'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';
import { useTranslations } from '@/components/providers/LanguageProvider';

function Step({
  num,
  title,
  desc,
  actions,
  checked,
  extra,
}: {
  num: number;
  title: string;
  desc: string;
  actions?: React.ReactNode;
  checked?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl bg-white/5 border border-white/10 text-white">
      <CardBody className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {checked ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#16a34a" />
                <path
                  d="M7 12.5l3 3 7-7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <>{num}</>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base md:text-lg font-semibold leading-7 whitespace-pre-line">{title}</div>
            <p className="mt-1 text-sm text-white/80 leading-6 whitespace-pre-line">{desc}</p>
            {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
            {extra && <div className="mt-2">{extra}</div>}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function GuidePage() {
  const repo = (process.env as any)['NEXT_PUBLIC_GITHUB_REPO'] || '';
  const { data: session } = useSession();
  const { address: wagmiAddress } = useAccount();
  const [hasInjected, setHasInjected] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const guide = useTranslations('guide');

  useEffect(() => {
    try {
      const eth: any = (window as any).ethereum;
      const injected =
        !!eth &&
        (eth.isMetaMask ||
          eth.isBraveWallet ||
          eth.isCoinbaseWallet ||
          typeof eth.request === 'function');
      setHasInjected(injected);
    } catch {}
  }, []);

  // 加载白名单状态（已登录时）
  useEffect(() => {
    if (!session?.user) return; // 仅在已有登录态时请求，避免无意义的 401/500
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (!res.ok) return; // 容错：不阻塞 UI
        const data = await res.json();
        setIsWhitelisted(!!data?.user?.isWhitelisted);
        setWalletAddress((data?.user?.walletAddress as string) || null);
      } catch {}
    })();
  }, [session?.user]);

  const displayAddress = useMemo(() => {
    const addr = wagmiAddress || walletAddress || '';
    if (!addr) return '';
    const s = String(addr);
    return s.length > 10 ? `${s.slice(0, 4)}...${s.slice(-4)}` : s;
  }, [walletAddress, wagmiAddress]);
  const step1 = guide.steps.step1;
  const step2 = guide.steps.step2;
  const step3 = guide.steps.step3;
  const step4 = guide.steps.step4;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {guide.title}
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/70">
          {guide.subtitle}
        </p>

        <div className="mt-6 grid gap-4">
          <Step
            num={1}
            title={step1.title}
            desc={step1.desc}
            checked={hasInjected}
            actions={
              <>
                <Button
                  as={Link}
                  href="https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?utm_source=localhost"
                  target="_blank"
                  color="success"
                  radius="lg"
                >
                  {step1.actions.chrome}
                </Button>
                <Button
                  as={Link}
                  href="https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/?utm_source=localhost"
                  target="_blank"
                  color="secondary"
                  radius="lg"
                >
                  {step1.actions.firefox}
                </Button>
                <Button
                  as={Link}
                  href="https://addons.opera.com/en-gb/extensions/details/metamask-10/?utm_source=localhost"
                  target="_blank"
                  color="danger"
                  radius="lg"
                >
                  {step1.actions.opera}
                </Button>
              </>
            }
          />

          <Step
            num={2}
            title={step2.title}
            desc={
              !session?.user
                ? step2.descLoggedOut
                : step2.descLoggedIn
            }
            checked={!!session?.user}
            actions={null}
            extra={
              session?.user ? (
                <div className="flex items-center gap-3">
                  {/* 头像与省略地址 */}
                  {/* 与 BlockieAvatar 一致的 dicebear 方案 */}
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(wagmiAddress || walletAddress || 'guest')}`}
                    alt="avatar"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="font-mono text-sm text-white/80">
                    {displayAddress || step2.signedInLabel}
                  </span>
                </div>
              ) : null
            }
          />

          <Step
            num={3}
            title={step3.title}
            desc={step3.desc}
            checked={isWhitelisted}
            actions={
              <>
                <Button
                  as={Link}
                  href={repo || 'https://github.com/Trade-Offf/QuizPort'}
                  target="_blank"
                  radius="lg"
                  color="secondary"
                >
                  {step3.buttons.github}
                </Button>
                <Button radius="lg" color="primary" onPress={() => setContactOpen(true)}>
                  {step3.buttons.contact}
                </Button>
              </>
            }
            extra={null}
          />

          <Step
            num={4}
            title={step4.title}
            desc={step4.desc}
          />
        </div>
        <p className="mt-8 text-sm text-white/70">
          {guide.whitelistNote}
        </p>
      </div>
      {/* 联系作者二维码 Modal */}
      <Modal
        isOpen={contactOpen}
        onOpenChange={setContactOpen}
        size="md"
        classNames={{ base: 'text-black' }}
      >
        <ModalContent>
          <ModalHeader className="text-base font-semibold">{guide.contactModal.title}</ModalHeader>
          <ModalBody>
            <div className="w-full flex items-center justify-center">
              <img
                src="/03-wechat.JPG"
                alt={guide.contactModal.qrAlt}
                className="h-[300px] max-h-[70vh] w-auto max-w-[85vw] object-contain rounded-lg"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setContactOpen(false)}>
              {guide.contactModal.close}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
