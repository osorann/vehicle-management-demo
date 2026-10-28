import {
  STATUS_LABELS,
  VEHICLE_STATUSES,
  type DateString,
  type MaintenanceRecord,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/types";
import { addMonths, monthKey } from "./dates";
import { getInspectionState, needsAttention, type InspectionLevel } from "./inspection";

export interface DashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  expired: number;
  urgent: number;
  warning: number;
  costThisMonth: number;
  costLastMonth: number;
}

export function summarize(
  vehicles: Vehicle[],
  records: MaintenanceRecord[],
  today: DateString,
): DashboardSummary {
  const counts: Record<InspectionLevel, number> = { expired: 0, urgent: 0, warning: 0, ok: 0 };
  for (const v of vehicles) {
    if (v.status === "retired") continue;
    counts[getInspectionState(v.inspectionDueDate, today).level] += 1;
  }
  const thisMonth = monthKey(today);
  const lastMonth = monthKey(addMonths(today, -1));
  let costThisMonth = 0;
  let costLastMonth = 0;
  for (const r of records) {
    const key = monthKey(r.performedOn);
    if (key === thisMonth) costThisMonth += r.cost;
    else if (key === lastMonth) costLastMonth += r.cost;
  }
  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v) => v.status === "active").length,
    expired: counts.expired,
    urgent: counts.urgent,
    warning: counts.warning,
    costThisMonth,
    costLastMonth,
  };
}

/** 期限切れ・接近中の車両を期限の近い順に返す */
export function attentionList(vehicles: Vehicle[], today: DateString): Vehicle[] {
  return vehicles
    .filter((v) => needsAttention(v, today))
    .sort((a, b) => a.inspectionDueDate.localeCompare(b.inspectionDueDate));
}

export interface MonthBucket {
  month: string; // YYYY-MM
  label: string; // 4月
  value: number;
}

function monthLabel(key: string): string {
  return `${Number(key.slice(5, 7))}月`;
}

/** 今月から先 months ヶ月の車検満了台数 */
export function inspectionDueByMonth(
  vehicles: Vehicle[],
  today: DateString,
  months = 12,
): MonthBucket[] {
  const buckets = Array.from({ length: months }, (_, i) => {
    const key = monthKey(addMonths(today.slice(0, 8) + "01", i));
    return { month: key, label: monthLabel(key), value: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.month, i]));
  for (const v of vehicles) {
    if (v.status === "retired") continue;
    const i = index.get(monthKey(v.inspectionDueDate));
    if (i !== undefined) buckets[i].value += 1;
  }
  return buckets;
}

/** 過去 months ヶ月（今月含む）の整備費用合計 */
export function maintenanceCostByMonth(
  records: MaintenanceRecord[],
  today: DateString,
  months = 6,
): MonthBucket[] {
  const buckets = Array.from({ length: months }, (_, i) => {
    const key = monthKey(addMonths(today.slice(0, 8) + "01", i - (months - 1)));
    return { month: key, label: monthLabel(key), value: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.month, i]));
  for (const r of records) {
    const i = index.get(monthKey(r.performedOn));
    if (i !== undefined) buckets[i].value += r.cost;
  }
  return buckets;
}

export interface StatusSlice {
  status: VehicleStatus;
  label: string;
  value: number;
}

export function statusBreakdown(vehicles: Vehicle[]): StatusSlice[] {
  return VEHICLE_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    value: vehicles.filter((v) => v.status === status).length,
  }));
}

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}
