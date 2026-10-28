import type { DateString, Vehicle } from "@/lib/types";
import { daysBetween } from "./dates";

export const INSPECTION_LEVELS = ["expired", "urgent", "warning", "ok"] as const;
export type InspectionLevel = (typeof INSPECTION_LEVELS)[number];

/** 期限接近とみなす日数のしきい値 */
export const URGENT_DAYS = 30;
export const WARNING_DAYS = 60;

export const INSPECTION_LEVEL_LABELS: Record<InspectionLevel, string> = {
  expired: "期限切れ",
  urgent: "30日以内",
  warning: "60日以内",
  ok: "余裕あり",
};

export interface InspectionState {
  level: InspectionLevel;
  daysLeft: number;
  label: string;
}

export function getInspectionLevel(daysLeft: number): InspectionLevel {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= URGENT_DAYS) return "urgent";
  if (daysLeft <= WARNING_DAYS) return "warning";
  return "ok";
}

export function getInspectionState(dueDate: DateString, today: DateString): InspectionState {
  const daysLeft = daysBetween(today, dueDate);
  const level = getInspectionLevel(daysLeft);
  return { level, daysLeft, label: describeDaysLeft(daysLeft) };
}

export function describeDaysLeft(daysLeft: number): string {
  if (Number.isNaN(daysLeft)) return "日付不明";
  if (daysLeft < 0) return `${Math.abs(daysLeft)}日超過`;
  if (daysLeft === 0) return "本日期限";
  return `残り${daysLeft}日`;
}

/** 廃車予定の車両はアラート対象から除外する */
export function needsAttention(vehicle: Vehicle, today: DateString): boolean {
  if (vehicle.status === "retired") return false;
  return getInspectionState(vehicle.inspectionDueDate, today).level !== "ok";
}
