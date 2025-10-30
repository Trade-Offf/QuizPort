import { PrismaClient } from '@prisma/client';

// Prisma 客户端单例（Vercel/本地使用 Postgres）
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
}

// 统一的数据查询接口（仅 Prisma/Postgres）
export async function dbQuery<T = any>(sql: string, ...binds: any[]): Promise<T[]> {
  return queryWithPrisma<T>(sql, binds);
}

// 查询单条记录
export async function dbQueryOne<T = any>(sql: string, ...binds: any[]): Promise<T | null> {
  const results = await queryWithPrisma<T>(sql, binds);
  return results[0] ?? null;
}

// 执行 INSERT/UPDATE/DELETE
export async function dbExecute(sql: string, ...binds: any[]): Promise<void> {
  return executeWithPrisma(sql, binds);
}

// 转换 SQL 占位符从 D1 风格 (?) 到 PostgreSQL 风格 ($1, $2, ...)
function convertPlaceholders(sql: string, binds: any[]): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// D1 相关兼容代码已移除；应用统一使用 Postgres。

// 使用 Prisma 查询（本地开发）
async function queryWithPrisma<T>(sql: string, binds: any[]): Promise<T[]> {
  const prisma = getPrismaClient();
  
  // 对于本地开发，直接使用 queryRaw 执行原始 SQL
  // 需要将 D1 的 ? 占位符转换为 PostgreSQL 的 $1, $2, ... 格式
  try {
    // 将 SQL 转换为使用美元符号占位符
    const convertedSql = convertPlaceholders(sql, binds);
    
    // 记录调试信息
    console.log('[queryWithPrisma] Original SQL:', sql);
    console.log('[queryWithPrisma] Converted SQL:', convertedSql);
    console.log('[queryWithPrisma] Binds:', binds);
    
    const result = await prisma.$queryRawUnsafe<T[]>(convertedSql, ...binds);
    
    console.log('[queryWithPrisma] Result count:', result.length);
    
    return result;
  } catch (error) {
    console.error('[queryWithPrisma] Error:', error);
    console.error('[queryWithPrisma] SQL:', sql);
    console.error('[queryWithPrisma] Converted SQL:', convertPlaceholders(sql, binds));
    console.error('[queryWithPrisma] Binds:', binds);
    throw error;
  }
}

// snake_case 转 camelCase（用于列名）
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// 使用 Prisma 执行（本地开发）
async function executeWithPrisma(sql: string, binds: any[]): Promise<void> {
  const prisma = getPrismaClient();
  const normalizedSql = sql.trim().toLowerCase();
  
  try {
    // INSERT INTO siwe_nonces (id, value, expiresAt, createdAt) VALUES (?, ?, ?, ?)
    if (normalizedSql.startsWith('insert into')) {
      const tableMatch = normalizedSql.match(/insert\s+into\s+(\w+)/);
      if (!tableMatch) return;
      
      const tableName = tableMatch[1];
      // 从原始 SQL 中提取列名（保持原始大小写）
      const columnsMatch = sql.match(/\(([^)]+)\)\s+values/i);
      if (!columnsMatch) return;
      
      const columns = columnsMatch[1].split(',').map(c => c.trim());
      const data = mapColumnsToData(columns, binds);
      
      console.log('[executeWithPrisma] Table:', tableName);
      console.log('[executeWithPrisma] Columns:', columns);
      console.log('[executeWithPrisma] Data:', data);
      
      switch (tableName) {
        case 'siwe_nonces':
          await prisma.siweNonce.create({ data });
          break;
        case 'users':
          await prisma.user.create({ data });
          break;
        case 'quizzes':
          await prisma.quiz.create({ data });
          break;
        case 'quiz_sets':
          await prisma.quizSet.create({ data });
          break;
        case 'submissions':
          await prisma.submission.create({ data });
          break;
        case 'quiz_attempts':
          await prisma.quizAttempt.create({ data });
          break;
        case 'reports':
          await prisma.report.create({ data });
          break;
        case 'points_logs':
          await prisma.pointsLog.create({ data });
          break;
      }
      return;
    }
    
    // DELETE FROM siwe_nonces WHERE value = ?
    if (normalizedSql.startsWith('delete from')) {
      const tableMatch = normalizedSql.match(/delete\s+from\s+(\w+)/);
      if (!tableMatch) return;
      
      const tableName = tableMatch[1];
      // 从原始 SQL 中提取 WHERE 子句（保持原始大小写）
      const whereClause = sql.match(/where\s+(.+)/i)?.[1];
      
      if (whereClause && binds.length > 0) {
        const where = parseWhereClause(whereClause, binds);
        
        switch (tableName) {
          case 'siwe_nonces':
            await prisma.siweNonce.deleteMany({ where });
            break;
          case 'users':
            await prisma.user.deleteMany({ where });
            break;
          case 'quizzes':
            await prisma.quiz.deleteMany({ where });
            break;
          case 'quiz_sets':
            await prisma.quizSet.deleteMany({ where });
            break;
          case 'submissions':
            await prisma.submission.deleteMany({ where });
            break;
          case 'quiz_attempts':
            await prisma.quizAttempt.deleteMany({ where });
            break;
          case 'reports':
            await prisma.report.deleteMany({ where });
            break;
          case 'points_logs':
            await prisma.pointsLog.deleteMany({ where });
            break;
        }
      }
      return;
    }
    
    // UPDATE queries
    if (normalizedSql.startsWith('update')) {
      const tableMatch = normalizedSql.match(/update\s+(\w+)/);
      if (!tableMatch) return;
      
      const tableName = tableMatch[1];
      // 从原始 SQL 中提取 SET 和 WHERE 子句
      const setClause = sql.match(/set\s+(.+?)(?:\s+where|$)/i)?.[1];
      const whereClause = sql.match(/where\s+(.+)/i)?.[1];
      
      // 简化处理：只处理简单的 UPDATE 语句
      // 对于复杂的情况，需要手动构建
      if (setClause && whereClause) {
        // 这里可以添加更复杂的解析逻辑
        // 现在先使用原始 SQL
        const convertedSql = convertPlaceholders(sql, binds);
        await prisma.$executeRawUnsafe(convertedSql, ...binds);
      }
      return;
    }
  } catch (error) {
    console.error('Prisma execute error:', error);
    console.error('SQL:', sql);
    console.error('Binds:', binds);
    throw error;
  }
}

// 解析 WHERE 子句
function parseWhereClause(whereClause: string, binds: any[]): Record<string, any> {
  const where: Record<string, any> = {};
  const parts = whereClause.split('and').map(p => p.trim());
  
  parts.forEach((part, index) => {
    const match = part.match(/(\w+)\s*=\s*\?/);
    if (match && binds[index] !== undefined) {
      const column = camelCase(match[1]);
      where[column] = binds[index];
    }
  });
  
  return where;
}

// 将列名映射到数据对象
function mapColumnsToData(columns: string[], binds: any[]): Record<string, any> {
  const data: Record<string, any> = {};
  columns.forEach((col, index) => {
    if (binds[index] !== undefined) {
      // 移除引号（如果有）
      const cleanCol = col.replace(/^["']|["']$/g, '');
      let value = binds[index];
      
      // 如果是字符串形式的结构化数据，尝试转换
      if (typeof value === 'string') {
        const trimmed = value.trim();
        // 解析数组或对象（用于 JSON/JSONB 字段，如 answers、content 等）
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
          try {
            value = JSON.parse(trimmed);
          } catch {
            // 解析失败，保持原值
          }
        }
        // 将时间字符串转换为 Date（Prisma DateTime 字段更稳妥）
        if (/At$/.test(cleanCol)) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            value = d;
          }
        }
      }
      
      data[cleanCol] = value;
    }
  });
  return data;
}

// 构建 SELECT 字段对象
function buildSelectFields(columns: string[]): Record<string, boolean> {
  const select: Record<string, boolean> = {};
  columns.forEach(col => {
    select[camelCase(col)] = true;
  });
  return select;
}

// snake_case 转 camelCase
function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// 导出 Prisma 客户端（用于复杂查询）
export function getPrisma() {
  return getPrismaClient();
}

