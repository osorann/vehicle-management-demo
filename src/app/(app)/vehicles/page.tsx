"use client";

import { ChevronRight, Download, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRepositoryQuery } from "@/components/session/session-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, PageHeader, Skeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { InspectionBadge } from "@/components/vehicles/inspection-badge";
import { StatusBadge } from "@/components/vehicles/status-badge";
import { csvFilename, downloadCsv, vehiclesToCsv } from "@/lib/csv";
import { formatJaDate, todayString } from "@/lib/domain/dates";
import {
  DEFAULT_FILTER,
  filterFromParams,
  filterToParams,
  filterVehicles,
  listDepartments,
  SORT_KEYS,
  SORT_LABELS,
  type VehicleFilter,
} from "@/lib/domain/filters";
import { INSPECTION_LEVEL_LABELS, INSPECTION_LEVELS } from "@/lib/domain/inspection";
import {
  STATUS_LABELS,
  VEHICLE_STATUSES,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
} from "@/lib/types";

function VehicleList() {
  const today = todayString();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilter = useMemo(
    () => filterFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  // 日本語入力（IME 変換中）を妨げないよう、キーワードは手元の state で持ち URL へは遅延反映する
  const [keyword, setKeyword] = useState(urlFilter.keyword);
  const filter = useMemo(() => ({ ...urlFilter, keyword }), [urlFilter, keyword]);
  const { data: vehicles, error, loading } = useRepositoryQuery((repo) => repo.listVehicles());

  const update = (patch: Partial<VehicleFilter>) => {
    const query = filterToParams({ ...filter, ...patch }).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (keyword === urlFilter.keyword) return;
    const timer = setTimeout(() => {
      const query = filterToParams({ ...urlFilter, keyword }).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, urlFilter, pathname, router]);

  const departments = useMemo(() => listDepartments(vehicles ?? []), [vehicles]);
  const filtered = useMemo(
    () => (vehicles ? filterVehicles(vehicles, filter, today) : []),
    [vehicles, filter, today],
  );
  const isFiltered = filterToParams({ ...filter, sort: DEFAULT_FILTER.sort }).toString() !== "";

  return (
    <>
      <PageHeader
        title="車両一覧"
        description={vehicles ? `${filtered.length}台を表示（全${vehicles.length}台）` : undefined}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={filtered.length === 0}
              onClick={() => downloadCsv(csvFilename("vehicles", today), vehiclesToCsv(filtered, today))}
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV出力
            </Button>
            <LinkButton href="/vehicles/new">
              <Plus className="h-4 w-4" aria-hidden />
              車両を登録
            </LinkButton>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <div role="search" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              type="search"
              aria-label="キーワード検索"
              placeholder="登録番号・車名・部署・担当で検索"
              className="pl-9"
              value={filter.keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <Select aria-label="車検状況" value={filter.inspection} onChange={(e) => update({ inspection: e.target.value as VehicleFilter["inspection"] })}>
            <option value="all">車検状況：すべて</option>
            {INSPECTION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {INSPECTION_LEVEL_LABELS[l]}
              </option>
            ))}
          </Select>
          <Select aria-label="ステータス" value={filter.status} onChange={(e) => update({ status: e.target.value as VehicleFilter["status"] })}>
            <option value="all">ステータス：すべて</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Select aria-label="車種" value={filter.vehicleType} onChange={(e) => update({ vehicleType: e.target.value as VehicleFilter["vehicleType"] })}>
            <option value="all">車種：すべて</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {VEHICLE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
          <Select aria-label="部署" value={filter.department} onChange={(e) => update({ department: e.target.value })}>
            <option value="">部署：すべて</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Select aria-label="並び順" className="w-auto" value={filter.sort} onChange={(e) => update({ sort: e.target.value as VehicleFilter["sort"] })}>
            {SORT_KEYS.map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </Select>
          {isFiltered ? (
            <Button variant="ghost" size="sm" onClick={() => {
                setKeyword("");
                update({ ...DEFAULT_FILTER, sort: filter.sort });
              }}>
              <X className="h-4 w-4" aria-hidden />
              条件をクリア
            </Button>
          ) : null}
        </div>
      </Card>

      {error ? <ErrorMessage message={error} /> : null}
      {loading && !vehicles ? <Skeleton className="h-80" /> : null}

      {vehicles ? (
        filtered.length === 0 ? (
          <Card>
            <EmptyState title={vehicles.length === 0 ? "車両が登録されていません" : "条件に一致する車両がありません"}>
              {vehicles.length === 0 ? (
                <Link href="/vehicles/new" className="text-blue-700 hover:underline">
                  最初の車両を登録する
                </Link>
              ) : null}
            </EmptyState>
          </Card>
        ) : (
          <>
            {/* スマホ: カード表示 */}
            <ul className="space-y-2 md:hidden" aria-label="車両リスト">
              {filtered.map((v) => (
                <li key={v.id}>
                  <Link href={`/vehicles/${v.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{v.plateNumber}</p>
                        <p className="truncate text-sm text-slate-600">
                          {v.name}
                          {v.department ? ` ・ ${v.department}` : ""}
                        </p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <InspectionBadge dueDate={v.inspectionDueDate} today={today} />
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      車検満了 {formatJaDate(v.inspectionDueDate)} ・ {v.mileage.toLocaleString("ja-JP")} km
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {/* タブレット以上: テーブル表示 */}
            <Card className="hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <tr>
                      <th scope="col" className="px-4 py-3">登録番号 / 車名</th>
                      <th scope="col" className="px-4 py-3">部署・担当</th>
                      <th scope="col" className="px-4 py-3">車検満了日</th>
                      <th scope="col" className="px-4 py-3">車検状況</th>
                      <th scope="col" className="px-4 py-3 text-right">走行距離</th>
                      <th scope="col" className="px-4 py-3">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <Link href={`/vehicles/${v.id}`} className="font-medium text-blue-700 hover:underline">
                            {v.plateNumber}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {v.name} ・ {VEHICLE_TYPE_LABELS[v.vehicleType]}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {v.department || "—"}
                          <p className="text-xs text-slate-500">{v.assignee}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">{formatJaDate(v.inspectionDueDate)}</td>
                        <td className="px-4 py-3">
                          <InspectionBadge dueDate={v.inspectionDueDate} today={today} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-700">
                          {v.mileage.toLocaleString("ja-JP")} km
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={v.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )
      ) : null}
    </>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80" />}>
      <VehicleList />
    </Suspense>
  );
}
