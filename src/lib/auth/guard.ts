export type GuardDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string; clearDemoCookie?: boolean };

export interface GuardInput {
  pathname: string;
  demoEnabled: boolean;
  hasDemoCookie: boolean;
  hasProductionUser: boolean;
}

export const LOGIN_PATH = "/login";
export const HOME_PATH = "/dashboard";

/**
 * ページ遷移の可否を決める純粋関数（proxy.ts から呼ばれる）。
 * デモセッションと本番セッションは別々に判定し、デモが無効な環境ではデモクッキーを破棄する。
 */
export function decideRoute(input: GuardInput): GuardDecision {
  const isLogin = input.pathname === LOGIN_PATH;

  if (input.hasDemoCookie && !input.demoEnabled) {
    return { action: "redirect", to: LOGIN_PATH, clearDemoCookie: true };
  }

  const authenticated = input.hasProductionUser || (input.hasDemoCookie && input.demoEnabled);

  if (isLogin) return { action: "allow" };
  if (!authenticated) {
    const next = input.pathname === "/" ? "" : `?next=${encodeURIComponent(input.pathname)}`;
    return { action: "redirect", to: `${LOGIN_PATH}${next}` };
  }
  return { action: "allow" };
}

/** ログイン後の遷移先として安全なパスかどうか（オープンリダイレクト対策） */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return HOME_PATH;
  }
  return next;
}
