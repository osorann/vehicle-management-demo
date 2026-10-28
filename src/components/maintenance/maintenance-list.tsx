"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatJaDate } from "@/lib/domain/dates";
import { formatYen } from "@/lib/domain/stats";
import { MAINTENANCE_CATEGORY_LABELS, type MaintenanceRecord, type Vehicle } from "@/lib/types";

export function MaintenanceList({
  records,
  vehicles,
  onDelete,
}: {
  records: MaintenanceRecord[];
  /** 渡された場合は車両名を表示し、車両詳細へリンクする */
  vehicles?: Vehicle[];
  onDelete?: (record: MaintenanceRecord) => void;
}) {
  const byId = new Map((vehicles ?? []).map((v) => [v.id, v]));
  return (
    <ul className="divide-y divide-slate-100">
      {records.map((r) => {
        const vehicle = byId.get(r.vehicleId);
        return (
          <li key={r.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <time dateTime={r.performedOn} className="text-sm font-medium text-slate-900">
                  {formatJaDate(r.performedOn)}
                </time>
                <Badge tone="blue">{MAINTENANCE_CATEGORY_LABELS[r.category]}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-700">{r.description}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {vehicle ? (
                  <>
                    <Link href={`/vehicles/${vehicle.id}`} className="text-blue-700 hover:underline">
                      {vehicle.plateNumber}（{vehicle.name}）
                    </Link>
                    {" ・ "}
                  </>
                ) : null}
                {r.mileage !== null ? `${r.mileage.toLocaleString("ja-JP")} km` : "走行距離 —"}
                {r.vendor ? ` ・ ${r.vendor}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-semibold tabular-nums text-slate-900">{formatYen(r.cost)}</span>
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(r)}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`${formatJaDate(r.performedOn)}の${MAINTENANCE_CATEGORY_LABELS[r.category]}記録を削除`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
