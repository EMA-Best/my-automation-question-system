/*
 * 清理 .env 中已废弃的旧环境变量（例如 DEEPSEEK_*）。
 *
 * 当前后端只读取 AI_* 配置；为了避免混淆，建议把旧变量从 .env 里删除。
 *
 * 设计目标：
 * - 不依赖第三方 dotenv 包，避免新增依赖
 * - 尽量保持 .env 里的注释/空行
 * - 清理是“幂等”的：重复执行不会不断改写
 * - 安全：写入前会生成 .env.bak 备份
 *
 * 用法：
 * - pnpm ts-node -T scripts/migrate-ai-env.ts
 */

import fs from 'node:fs';
import path from 'node:path';

type EnvLine =
  | { kind: 'raw'; text: string }
  | { kind: 'kv'; key: string; value: string; raw: string };

function parseEnvLines(content: string): EnvLine[] {
  const lines = content.split(/\r?\n/);
  return lines.map((text) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith('#')) return { kind: 'raw', text };

    const eqIndex = text.indexOf('=');
    if (eqIndex < 0) return { kind: 'raw', text };

    const key = text.slice(0, eqIndex).trim();
    const value = text.slice(eqIndex + 1).trim();
    if (!key) return { kind: 'raw', text };

    return { kind: 'kv', key, value, raw: text };
  });
}

function ensureLineEnd(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}

function main(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    // 这里不创建 .env，避免把敏感配置写入仓库；只给出提示。
    console.log(
      '未找到 .env 文件，跳过迁移。你可以先从 env.example 复制生成 .env。',
    );
    return;
  }

  const original = fs.readFileSync(envPath, 'utf8');
  const lines = parseEnvLines(original);
  const hasDeprecated = lines.some(
    (line) => line.kind === 'kv' && line.key.startsWith('DEEPSEEK_'),
  );

  if (!hasDeprecated) {
    console.log('未检测到 DEEPSEEK_* 变量，无需清理。');
    return;
  }

  const bakPath = path.resolve(process.cwd(), '.env.bak');
  fs.writeFileSync(bakPath, ensureLineEnd(original), 'utf8');

  const nextLines = lines
    .filter((line) => !(line.kind === 'kv' && line.key.startsWith('DEEPSEEK_')))
    .map((line) => (line.kind === 'raw' ? line.text : line.raw))
    .join('\n');

  fs.writeFileSync(envPath, ensureLineEnd(nextLines), 'utf8');

  console.log(
    `清理完成：已删除 .env 中的 DEEPSEEK_* 变量；原文件备份为 ${path.basename(bakPath)}。`,
  );
}

main();
