"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { endDemoSession, isDemoSessionActive } from "@/lib/auth/demo-session";
import { appConfig } from "@/lib/config";
import { DemoRepository } from "@/lib/data/demo-repository";
import type { VehicleRepository } from "@/lib/data/repository";

export type AppMode = "demo" | "production";

interface SessionValue {
  mode: AppMode;
  userLabel: string;
  repository: VehicleRepository;
  /** データ変更や初期化のたびに増える。各画面の再読み込みのトリガーに使う */
  dataVersion: number;
  notifyChanged: () => void;
  resetDemoData: () => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

type State =
  | { status: "loading" }
  | { status: "ready"; mode: AppMode; userLabel: string; repository: VehicleRepository };

async function resolveSession(): Promise<State | null> {
  // 1. デモセッション（本番認証とは独立）
  if (appConfig.demoEnabled && isDemoSessionActive()) {
    return {
      status: "ready",
      mode: "demo",
      userLabel: "デモユーザー",
      repository: new DemoRepository({ latencyMs: 150 }),
    };
  }
  // 2. 本番セッション（Supabase Auth）。デモ時に Supabase SDK を読み込まないよう動的 import
  if (appConfig.supabaseConfigured) {
    const [{ getSupabaseBrowserClient }, { SupabaseRepository }] = await Promise.all([
      import("@/lib/supabase/client"),
      import("@/lib/data/supabase-repository"),
    ]);
    const client = getSupabaseBrowserClient();
    const { data } = await client.auth.getUser();
    if (data.user) {
      return {
        status: "ready",
        mode: "production",
        userLabel: data.user.email ?? "ログインユーザー",
        repository: new SupabaseRepository(client),
      };
    }
  }
  return null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then((resolved) => {
      if (cancelled) return;
      if (resolved) setState(resolved);
      else router.replace("/login");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const notifyChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  const value = useMemo<SessionValue | null>(() => {
    if (state.status !== "ready") return null;
    return {
      mode: state.mode,
      userLabel: state.userLabel,
      repository: state.repository,
      dataVersion,
      notifyChanged,
      resetDemoData: () => {
        if (state.repository instanceof DemoRepository) {
          state.repository.reset();
          notifyChanged();
        }
      },
      signOut: async () => {
        if (state.mode === "demo") {
          endDemoSession();
        } else {
          const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
          await getSupabaseBrowserClient().auth.signOut();
        }
        router.replace("/login");
        router.refresh();
      },
    };
  }, [state, dataVersion, notifyChanged, router]);

  if (!value) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700" />
          読み込み中…
        </div>
      </div>
    );
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}

/** リポジトリからデータを取得し、変更通知で自動再取得するフック */
export function useRepositoryQuery<T>(
  query: (repo: VehicleRepository) => Promise<T>,
  deps: readonly unknown[] = [],
) {
  const { repository, dataVersion } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 再取得時にローディング表示へ戻す
    setLoading(true);
    query(repository)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "データの取得に失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- query は deps で制御する
  }, [repository, dataVersion, ...deps]);

  return { data, error, loading };
}
