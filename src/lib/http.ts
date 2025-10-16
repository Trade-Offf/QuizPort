import { ZodError, ZodTypeAny } from 'zod';
import { NextResponse } from 'next/server';

export async function parseJson<T = any>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw badRequest('Invalid JSON');
  }
}

export function validate<T>(schema: ZodTypeAny, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (e) {
    if (e instanceof ZodError) {
      throw badRequest(e.flatten());
    }
    throw e;
  }
}

export function badRequest(message: unknown) {
  return createError(400, message);
}

export function unauthorized(message: unknown = 'Unauthorized') {
  return createError(401, message);
}

export function forbidden(message: unknown = 'Forbidden') {
  return createError(403, message);
}

export function notFound(message: unknown = 'Not Found') {
  return createError(404, message);
}

export function createError(status: number, message: unknown) {
  return NextResponse.json({ error: message }, { status });
}

export function okJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

