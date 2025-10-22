'use client';
import Link from 'next/link';
import { Button } from '@heroui/react';
import type { ComponentProps, ReactNode } from 'react';

type ButtonProps = ComponentProps<typeof Button> & { href: string; children: ReactNode };

export function LinkButton({ href, children, ...rest }: ButtonProps) {
  return (
    <Button as={Link as any} href={href} {...rest}>
      {children}
    </Button>
  );
}
