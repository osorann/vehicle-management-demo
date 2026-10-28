import {
  VEHICLE_TYPE_LABELS,
  type DateString,
  type Vehicle,
  type VehicleStatus,
  type VehicleType,
} from "@/lib/types";
import { getInspectionState, type InspectionLevel } from "./inspection";

export const SORT_KEYS = ["inspection", "plate", "mileage", "updated"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  inspection: "車検期限が近い順",
  plate: "登録番号順",
  mileage: "走行距離が多い順",
  updated: "更新日が新しい順",
};

export interface VehicleFilter {
  keyword: string;
  status: VehicleStatus | "all";
  vehicleType: VehicleType | "all";
  inspection: InspectionLevel | "all";
  department: string;
  sort: SortKey;
}

export const DEFAULT_FILTER: VehicleFilter = {
  keyword: "",
  status: "all",
  vehicleType: "all",
  inspection: "all",
  department: "",
  sort: "inspection",
};

/** 全角英数・カナ表記ゆれをある程度吸収して比較する */
export function normalizeText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

export function matchesKeyword(vehicle: Vehicle, keyword: string): boolean {
  const needle = normalizeText(keyword);
  if (!needle) return true;
  const haystack = normalizeText(
    [
      vehicle.plateNumber,
      vehicle.name,
      vehicle.maker,
      vehicle.model,
      VEHICLE_TYPE_LABELS[vehicle.vehicleType],
      vehicle.department,
      vehicle.assignee,
      vehicle.notes,
    ].join(" "),
  );
  return haystack.includes(needle);
}

export function filterVehicles(
  vehicles: Vehicle[],
  filter: VehicleFilter,
  today: DateString,
): Vehicle[] {
  const result = vehicles.filter((v) => {
    if (!matchesKeyword(v, filter.keyword)) return false;
    if (filter.status !== "all" && v.status !== filter.status) return false;
    if (filter.vehicleType !== "all" && v.vehicleType !== filter.vehicleType) return false;
    if (filter.department && v.department !== filter.department) return false;
    if (
      filter.inspection !== "all" &&
      getInspectionState(v.inspectionDueDate, today).level !== filter.inspection
    ) {
      return false;
    }
    return true;
  });
  return sortVehicles(result, filter.sort);
}

export function sortVehicles(vehicles: Vehicle[], sort: SortKey): Vehicle[] {
  const copy = [...vehicles];
  switch (sort) {
    case "inspection":
      return copy.sort((a, b) => a.inspectionDueDate.localeCompare(b.inspectionDueDate));
    case "plate":
      return copy.sort((a, b) => a.plateNumber.localeCompare(b.plateNumber, "ja"));
    case "mileage":
      return copy.sort((a, b) => b.mileage - a.mileage);
    case "updated":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export function listDepartments(vehicles: Vehicle[]): string[] {
  return [...new Set(vehicles.map((v) => v.department).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
}

/** URL クエリから絞り込み条件を復元する（不正な値は既定値に戻す） */
export function filterFromParams(params: URLSearchParams): VehicleFilter {
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = params.get(key);
    return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  };
  return {
    keyword: params.get("q") ?? "",
    status: pick("status", ["all", "active", "maintenance", "standby", "retired"], "all"),
    vehicleType: pick("type", ["all", "sedan", "kei", "van", "truck", "other"], "all"),
    inspection: pick("inspection", ["all", "expired", "urgent", "warning", "ok"], "all"),
    department: params.get("dept") ?? "",
    sort: pick("sort", SORT_KEYS, "inspection"),
  };
}

export function filterToParams(filter: VehicleFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.keyword) params.set("q", filter.keyword);
  if (filter.status !== "all") params.set("status", filter.status);
  if (filter.vehicleType !== "all") params.set("type", filter.vehicleType);
  if (filter.inspection !== "all") params.set("inspection", filter.inspection);
  if (filter.department) params.set("dept", filter.department);
  if (filter.sort !== DEFAULT_FILTER.sort) params.set("sort", filter.sort);
  return params;
}
