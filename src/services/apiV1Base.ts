/**
 * 默认 `/api/v1` 走 Vite 代理到 FastAPI。
 * 若页面不经 Vite（或 XHR 一直 404），可在 `.env` / `.env.local` 设置：
 *   VITE_API_BASE=http://127.0.0.1:8711
 * （不要带 `/api/v1` 后缀）
 */
export function getApiV1Base(): string {
  const raw = import.meta.env.VITE_API_BASE;
  if (typeof raw === 'string' && raw.trim()) {
    return `${raw.replace(/\/+$/, '')}/api/v1`;
  }
  return '/api/v1';
}
