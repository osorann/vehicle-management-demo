"use client";

import { Car, FlaskConical, LayoutDashboard, LogOut, Plus, RotateCcw, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSession } from "@/components/session/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード", short: "ホーム", icon: LayoutDashboard },
  { href: "/vehicles", label: "車両一覧", short: "車両", icon: Car },
  { href: "/vehicles/new", label: "車両を登録", short: "登録", icon: Plus },
  { href: "/maintenance", label: "点検・整備履歴", short: "整備", icon: Wrench },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/vehicles") {
    return pathname === "/vehicles" || (pathname.startsWith("/vehicles/") && pathname !== "/vehicles/new");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DemoBanner() {
  const { resetDemoData } = useSession();
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">デモモード</strong>
            ：表示データはすべて架空です。変更はこのブラウザ内にのみ保存されます。
          </span>
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 font-medium text-amber-900 underline-offset-2 hover:underline"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          サンプルデータに戻す
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="サンプルデータに戻しますか？"
        message="このブラウザで行った追加・編集・削除はすべて破棄され、初期の架空データに戻ります。"
        confirmLabel="初期化する"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          resetDemoData();
          setConfirming(false);
        }}
      />
    </div>
  );
}

function ModeBadge() {
  const { mode } = useSession();
  return mode === "demo" ? (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      DEMO
    </span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
      本番
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode, userLabel, signOut } = useSession();

  return (
    <div className="min-h-dvh bg-slate-50 lg:pl-64">
      {/* デスクトップ: サイドバー */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white">
            <Car className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">車両管理システム</p>
            <ModeBadge />
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="メインメニュー">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive(pathname, href)
                  ? "bg-blue-50 text-blue-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <p className="truncate px-3 text-xs text-slate-500" title={userLabel}>
            {userLabel}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            {mode === "demo" ? "デモを終了" : "ログアウト"}
          </button>
        </div>
      </aside>

      {/* モバイル: ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Car className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-bold text-slate-900">車両管理</span>
            <ModeBadge />
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {mode === "demo" ? "終了" : "ログアウト"}
          </button>
        </div>
      </header>

      {mode === "demo" ? <DemoBanner /> : null}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>

      {/* モバイル: 下部タブバー */}
      <nav
        aria-label="モバイルメニュー"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map(({ href, short, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  isActive(pathname, href) ? "text-blue-700" : "text-slate-500",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
