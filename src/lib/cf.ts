import { getRequestContext } from '@cloudflare/next-on-pages';

export type EnvBindings = {
  DB: D1Database;
  QUIZPORT_KV: KVNamespace;
};

export function getEnv(): EnvBindings {
  return getRequestContext().env as unknown as EnvBindings;
}

export async function d1All<T = any>(sql: string, ...binds: any[]): Promise<T[]> {
  const { DB } = getEnv();
  const stmt = DB.prepare(sql);
  const bound = binds && binds.length > 0 ? (stmt as any).bind(...binds) : stmt;
  const res = await (bound as any).all<T>();
  return (res?.results as any) ?? [];
}

export async function d1Get<T = any>(sql: string, ...binds: any[]): Promise<T | null> {
  const rows = await d1All<T>(sql, ...binds);
  return rows[0] ?? null;
}

export async function d1Run(sql: string, ...binds: any[]): Promise<void> {
  const { DB } = getEnv();
  const stmt = DB.prepare(sql);
  const bound = binds && binds.length > 0 ? (stmt as any).bind(...binds) : stmt;
  await (bound as any).run();
}

export const nowIso = () => new Date().toISOString();


