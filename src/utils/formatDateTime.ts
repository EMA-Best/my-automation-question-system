function pad2(num: number): string {
  return num < 10 ? `0${num}` : String(num);
}

export type FormatDateTimeOptions = {
  withSeconds?: boolean;
  emptyFallback?: string;
};

/**
 * 将后端返回的时间（如 ISO 字符串）格式化为 `YYYY-MM-DD HH:mm:ss`（默认带秒）。
 * - 支持：ISO string / 时间戳 number / Date
 * - 非法输入：返回 emptyFallback（默认 `-`）
 */
export function formatDateTime(
  input: unknown,
  options: FormatDateTimeOptions = {}
): string {
  const { withSeconds = true, emptyFallback = '-' } = options;

  if (input == null) return emptyFallback;

  const date = input instanceof Date ? input : new Date(input as any);
  const time = date.getTime();
  if (Number.isNaN(time)) return emptyFallback;

  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());

  return withSeconds
    ? `${y}-${m}-${d} ${hh}:${mm}:${ss}`
    : `${y}-${m}-${d} ${hh}:${mm}`;
}
