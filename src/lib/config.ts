export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  /** Supabase の URL とキーが両方そろっているか */
  supabaseConfigured: boolean;
  /** デモモード（架空データ・ブラウザ内保存）を利用可能にするか */
  demoEnabled: boolean;
}

export interface RawEnv {
  supabaseUrl?: string;
  supabaseKey?: string;
  enableDemo?: string;
}

/**
 * 環境変数からアプリの動作モードを決める。
 * - Supabase 未設定: デモモードのみ（本番ログインは無効）
 * - Supabase 設定済み: 本番ログインが有効。デモは NEXT_PUBLIC_ENABLE_DEMO=true の場合のみ併設
 */
export function resolveAppConfig(env: RawEnv): AppConfig {
  const supabaseUrl = env.supabaseUrl?.trim() ?? "";
  const supabaseKey = env.supabaseKey?.trim() ?? "";
  const supabaseConfigured = /^https?:\/\//.test(supabaseUrl) && supabaseKey.length > 0;
  const flag = env.enableDemo?.trim().toLowerCase();
  const demoEnabled = flag === "true" ? true : flag === "false" ? false : !supabaseConfigured;
  return { supabaseUrl, supabaseKey, supabaseConfigured, demoEnabled };
}

// NEXT_PUBLIC_* はビルド時に埋め込まれるため、process.env.XXX の形で直接参照する必要がある
export const appConfig: AppConfig = resolveAppConfig({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  enableDemo: process.env.NEXT_PUBLIC_ENABLE_DEMO,
});
