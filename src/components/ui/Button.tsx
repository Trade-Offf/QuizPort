'use client';
import Link from 'next/link';
import type { ComponentProps, ElementType } from 'react';
import { Button as HButton } from '@heroui/react';

type Variant = 'solid' | 'bordered' | 'light';
type Color = 'primary' | 'default';
type Radius = 'sm' | 'md' | 'lg';

type ButtonProps<E extends ElementType> = {
  as?: E;
  href?: string;
  variant?: Variant;
  color?: Color;
  radius?: Radius;
  disableRipple?: boolean; // 保留 API 兼容
} & Omit<ComponentProps<E>, 'as'>;

export const Button = HButton;
