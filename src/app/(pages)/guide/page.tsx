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
            <div className="text-base md:text-lg font-semibold leading-7">{title}</div>
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
  const contactUrl = (process.env as any)['NEXT_PUBLIC_CONTACT_URL'] || '';
  const { data: session } = useSession();
  const { address: wagmiAddress } = useAccount();
  const [hasInjected, setHasInjected] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

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

  const userName = useMemo(() => session?.user?.name || '', [session]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          使用说明 · Getting Started
        </h1>
        <p className="mt-2 text-sm md:text-base text-white/70">
          按以下步骤快速上手，从安装钱包到生成题单、发布与分享。
        </p>

        <div className="mt-6 grid gap-4">
          <Step
            num={1}
            title="安装 MetaMask 插件"
            desc="为你的浏览器安装 MetaMask 插件（已安装可跳过）。选择你的浏览器："
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
                  安装 Chrome 版
                </Button>
                <Button
                  as={Link}
                  href="https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/?utm_source=localhost"
                  target="_blank"
                  color="secondary"
                  radius="lg"
                >
                  安装 Firefox 版
                </Button>
                <Button
                  as={Link}
                  href="https://addons.opera.com/en-gb/extensions/details/metamask-10/?utm_source=localhost"
                  target="_blank"
                  color="danger"
                  radius="lg"
                >
                  安装 Opera 版
                </Button>
              </>
            }
          />

          <Step
            num={2}
            title="创建账户并登录"
            desc={
              !session?.user
                ? '请点击右上角“连接钱包”完成签名登录（SIWE）。首次登录会自动为你创建账号。'
                : ''
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
                  <span className="font-mono text-sm text-white/80">{displayAddress || '已登录'}</span>
                </div>
              ) : null
            }
          />

          <Step
            num={3}
            title="申请内测权限（白名单）"
            desc={
              '联系我开通生成权限（控制模型开销，内测期免费）。可选：给 GitHub 项目点个 Star 支持我们。'
            }
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
                  前往 GitHub 项目
                </Button>
                <Button radius="lg" color="primary" onPress={() => setContactOpen(true)}>
                  联系作者
                </Button>
              </>
            }
            extra={null}
          />

          <Step
            num={4}
            title="从文章生成题目预览（目前仅支持掘金）"
            desc={
              '进入“生成测试”页，粘贴文章 URL → 获取预览 → 点击“基于该文章生成题目预览”。模型会基于知识点理解出题。'
            }
            extra={
              <img
                src="/04-copyUrl.png"
                alt="复制链接示意图"
                className="rounded shadow-lg ring-1 ring-white/10 w-full max-w-3xl"
              />
            }
          />

          <Step
            num={5}
            title="勾选题目并创建题单"
            desc={'从预览中勾选 ≥ 10 题，点击“创建”。系统会新建一个题单（draft），然后你可以发布。'}
          />

          <Step
            num={6}
            title="发布题单并分享"
            desc={'发布后题单变为 public。你可以复制链接或在历史题库中生成分享卡片。'}
          />
        </div>
      </div>
      {/* 联系作者二维码 Modal */}
      <Modal
        isOpen={contactOpen}
        onOpenChange={setContactOpen}
        size="md"
        classNames={{ base: 'text-black' }}
      >
        <ModalContent>
          <ModalHeader className="text-base font-semibold">微信扫码联系作者</ModalHeader>
          <ModalBody>
            <div className="w-full flex items-center justify-center">
              <img
                src="/03-wechat.JPG"
                alt="微信二维码"
                className="h-[300px] max-h-[70vh] w-auto max-w-[85vw] object-contain rounded-lg"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setContactOpen(false)}>
              关闭
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </main>
  );
}
