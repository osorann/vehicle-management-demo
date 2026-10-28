/**
 * デモモードのセッション。
 * 本番認証（Supabase Auth）とは独立したクッキーで管理し、
 * デモ中は Supabase クライアントを一切生成しない。
 */
export const DEMO_COOKIE_NAME = "vehicle-demo-session";
export const DEMO_COOKIE_VALUE = "1";
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24時間

export function hasDemoCookie(cookieString: string): boolean {
  return cookieString
    .split(";")
    .map((c) => c.trim())
    .some((c) => c === `${DEMO_COOKIE_NAME}=${DEMO_COOKIE_VALUE}`);
}

export function startDemoSession(): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${DEMO_COOKIE_NAME}=${DEMO_COOKIE_VALUE}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

export function endDemoSession(): void {
  document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function isDemoSessionActive(): boolean {
  return typeof document !== "undefined" && hasDemoCookie(document.cookie);
}
