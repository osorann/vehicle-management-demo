import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appConfig } from "@/lib/config";

let client: SupabaseClient | null = null;

/** 本番モード専用。デモモードからは呼び出さないこと */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!appConfig.supabaseConfigured) {
    throw new Error("Supabase が設定されていません");
  }
  client ??= createBrowserClient(appConfig.supabaseUrl, appConfig.supabaseKey);
  return client;
}
