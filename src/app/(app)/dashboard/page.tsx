"use client";

import { AlertOctagon, AlertTriangle, Car, ChevronRight, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { InspectionDueChart, MaintenanceCostChart } from "@/components/dashboard/charts";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { useRepositoryQuery } from "@/components/session/session-provider";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorMessage, PageHeader, Skeleton } from "@/components/ui/feedback";
import { InspectionBadge } from "@/components/vehicles/inspection-badge";
import { formatJaDate, todayString } from "@/lib/domain/dates";
import {
  attentionList,
  formatYen,
  inspectionDueByMonth,
  maintenanceCostByMonth,
  statusBreakdown,
  summarize,
} from "@/lib/domain/stats";
import { cn } from "@/lib/cn";
import { getInspectionState } from "@/lib/domain/inspection";

function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon: ReactNode;
  tone?: "default" | "danger" | "warning";
  href?: string;
}) {
  const body = (
    <Card
      className={cn(
        "h-full p-4 transition-shadow",
        href && "hover:shadow-md",
        tone === "danger" && "border-red-200 bg-red-50/40",
        tone === "warning" && "border-amber-200 bg-amber-50/40",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-600 sm:text-sm">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            tone === "danger" ? "bg-red-100 text-red-700" : tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700",
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-blue-600">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function DashboardPage() {
  const today = todayString();
  const { data, error, loading } = useRepositoryQuery(async (repo) => {
    const [vehicles, records] = await Promise.all([repo.listVehicles(), repo.listMaintenance()]);
    return { vehicles, records };
  });

  const view = useMemo(() => {
    if (!data) return null;
    const { vehicles, records } = data;
    return {
      summary: summarize(vehicles, records, today),
      alerts: attentionList(vehicles, today),
      dueByMonth: inspectionDueByMonth(vehicles, today),
      costByMonth: maintenanceCostByMonth(records, today),
      statuses: statusBreakdown(vehicles),
      recent: records.slice(0, 5),
      vehicles,
    };
  }, [data, today]);

  return (
    <>
      <PageHeader title="ダッシュボード" description={`${formatJaDate(today)} 時点の車両状況`} />
      {error ? <ErrorMessage message={error} /> : null}
      {loading && !view ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
          <Skeleton className="col-span-2 h-72 lg:col-span-4" />
        </div>
      ) : null}
      {view ? (
        <div className="space-y-5">
          <section aria-label="主要指標" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="登録車両"
              value={`${view.summary.totalVehicles}台`}
              sub={`稼働中 ${view.summary.activeVehicles}台`}
              icon={<Car className="h-4 w-4" aria-hidden />}
              href="/vehicles"
            />
            <StatTile
              label="車検期限切れ"
              value={`${view.summary.expired}台`}
              sub="至急対応が必要"
              tone={view.summary.expired > 0 ? "danger" : "default"}
              icon={<AlertOctagon className="h-4 w-4" aria-hidden />}
              href="/vehicles?inspection=expired"
            />
            <StatTile
              label="30日以内に期限"
              value={`${view.summary.urgent}台`}
              sub={`60日以内 ${view.summary.urgent + view.summary.warning}台`}
              tone={view.summary.urgent > 0 ? "warning" : "default"}
              icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
              href="/vehicles?inspection=urgent"
            />
            <StatTile
              label="今月の整備費用"
              value={formatYen(view.summary.costThisMonth)}
              sub={`先月 ${formatYen(view.summary.costLastMonth)}`}
              icon={<Wallet className="h-4 w-4" aria-hidden />}
              href="/maintenance"
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-5">
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader
                title="車検期限アラート"
                description="期限切れ・60日以内に満了する車両（廃車予定を除く）"
                action={
                  <Link href="/vehicles?sort=inspection" className="text-sm font-medium text-blue-700 hover:underline">
                    すべて見る
                  </Link>
                }
              />
              {view.alerts.length === 0 ? (
                <EmptyState title="期限が近い車両はありません" />
              ) : (
                <ul className="divide-y divide-slate-100" aria-label="車検期限アラート一覧">
                  {view.alerts.slice(0, 8).map((v) => (
                    <li key={v.id}>
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{v.plateNumber}</p>
                          <p className="truncate text-xs text-slate-500">
                            {v.name} ・ 満了日 {formatJaDate(v.inspectionDueDate)}（
                            {getInspectionState(v.inspectionDueDate, today).label}）
                          </p>
                        </div>
                        <InspectionBadge dueDate={v.inspectionDueDate} today={today} showDays={false} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="min-w-0 lg:col-span-2">
              <CardHeader title="ステータス別台数" />
              <ul className="space-y-3 p-4 sm:p-5">
                {view.statuses.map((s) => {
                  const pct = view.summary.totalVehicles ? (s.value / view.summary.totalVehicles) * 100 : 0;
                  return (
                    <li key={s.status}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-slate-700">{s.label}</span>
                        <span className="font-semibold tabular-nums text-slate-900">{s.value}台</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100" aria-hidden>
                        <div className="h-2 rounded-full bg-blue-700" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
            <Card>
              <CardHeader title="車検満了予定（今後12ヶ月）" description="月別の満了台数" />
              <div className="p-3 sm:p-4">
                <InspectionDueChart data={view.dueByMonth} />
              </div>
            </Card>
            <Card>
              <CardHeader title="整備費用の推移（過去6ヶ月）" description="点検・整備記録の費用合計" />
              <div className="p-3 sm:p-4">
                <MaintenanceCostChart data={view.costByMonth} />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="最近の点検・整備"
              action={
                <Link href="/maintenance" className="text-sm font-medium text-blue-700 hover:underline">
                  履歴一覧
                </Link>
              }
            />
            {view.recent.length === 0 ? (
              <EmptyState title="記録はまだありません" />
            ) : (
              <MaintenanceList records={view.recent} vehicles={view.vehicles} />
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
