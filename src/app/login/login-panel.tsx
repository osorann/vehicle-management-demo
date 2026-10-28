"use client";

import { Car, FlaskConical, Info, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { endDemoSession, startDemoSession } from "@/lib/auth/demo-session";
import { safeNextPath } from "@/lib/auth/guard";
import { appConfig } from "@/lib/config";

function ProductionLogin({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("メールアドレスまたはパスワードが正しくありません");
        return;
      }
      // 本番ログイン時はデモセッションを必ず破棄する
      endDemoSession();
      router.replace(next);
      router.refresh();
    } catch {
      setError("ログインに失敗しました。時間をおいて再度お試しください");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="本番ログイン">
      {error ? <ErrorMessage message={error} /> : null}
      <Field id="login-email" label="メールアドレス">
        <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field id="login-password" label="パスワード">
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={submitting}>
        <LockKeyhole className="h-4 w-4" aria-hidden />
        {submitting ? "ログイン中…" : "ログイン"}
      </Button>
    </form>
  );
}

function DemoEntry({ next }: { next: string }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function start() {
    setStarting(true);
    // 本番セッションが残っていれば先に終了し、デモと本番が混在しないようにする
    if (appConfig.supabaseConfigured) {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      await getSupabaseBrowserClient().auth.signOut();
    }
    startDemoSession();
    router.replace(next);
    router.refresh();
  }

  return (
    <section
      aria-labelledby="demo-title"
      className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-amber-700" aria-hidden />
        <h2 id="demo-title" className="text-base font-bold text-amber-900">
          デモモードで試す
        </h2>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
        <li>ログイン不要で全機能を操作できます</li>
        <li>表示されるデータはすべて架空のサンプルです</li>
        <li>変更はこのブラウザ内にのみ保存され、サーバーには送信されません</li>
        <li>実在の個人情報・車両情報は入力しないでください</li>
      </ul>
      <Button
        variant={appConfig.supabaseConfigured ? "secondary" : "primary"}
        className="mt-4 w-full"
        onClick={start}
        disabled={starting}
      >
        {starting ? "準備中…" : "デモを開始する"}
      </Button>
    </section>
  );
}

export function LoginPanel() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { supabaseConfigured, demoEnabled } = appConfig;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white shadow">
            <Car className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">車両管理システム</h1>
          <p className="mt-1 text-sm text-slate-500">車検期限・整備履歴をまとめて管理</p>
        </div>

        <section aria-labelledby="prod-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="prod-title" className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <LockKeyhole className="h-5 w-5 text-blue-700" aria-hidden />
            本番ログイン
          </h2>
          {supabaseConfigured ? (
            <ProductionLogin next={next} />
          ) : (
            <p className="flex gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              本番ログインは未設定です。Supabase の環境変数を設定すると有効になります。
            </p>
          )}
        </section>

        {demoEnabled ? <DemoEntry next={next} /> : null}
      </div>
    </div>
  );
}
