import { getInspectionState, INSPECTION_LEVEL_LABELS } from "@/lib/domain/inspection";
import {
  MAINTENANCE_CATEGORY_LABELS,
  STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  type DateString,
  type MaintenanceRecord,
  type Vehicle,
} from "@/lib/types";

type Cell = string | number | null | undefined;

/** RFC 4180 準拠でエスケープする。数式インジェクション対策として先頭の = + - @ を無害化する */
export function escapeCsvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
}

export function vehiclesToCsv(vehicles: Vehicle[], today: DateString): string {
  const header = [
    "登録番号",
    "車名",
    "メーカー",
    "型式",
    "車種",
    "年式",
    "部署",
    "担当",
    "走行距離(km)",
    "車検満了日",
    "車検状況",
    "残日数",
    "保険満了日",
    "ステータス",
    "備考",
  ];
  const rows = vehicles.map((v) => {
    const state = getInspectionState(v.inspectionDueDate, today);
    return [
      v.plateNumber,
      v.name,
      v.maker,
      v.model,
      VEHICLE_TYPE_LABELS[v.vehicleType],
      v.year,
      v.department,
      v.assignee,
      v.mileage,
      v.inspectionDueDate,
      INSPECTION_LEVEL_LABELS[state.level],
      state.daysLeft,
      v.insuranceDueDate,
      STATUS_LABELS[v.status],
      v.notes,
    ];
  });
  return toCsv(header, rows);
}

export function maintenanceToCsv(records: MaintenanceRecord[], vehicles: Vehicle[]): string {
  const byId = new Map(vehicles.map((v) => [v.id, v]));
  const header = ["実施日", "登録番号", "車名", "区分", "内容", "費用(円)", "走行距離(km)", "実施業者"];
  const rows = records.map((r) => {
    const v = byId.get(r.vehicleId);
    return [
      r.performedOn,
      v?.plateNumber ?? "",
      v?.name ?? "",
      MAINTENANCE_CATEGORY_LABELS[r.category],
      r.description,
      r.cost,
      r.mileage,
      r.vendor,
    ];
  });
  return toCsv(header, rows);
}

/** Excel で文字化けしないよう UTF-8 BOM を付与してダウンロードさせる */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // 即時に破棄するとブラウザによってはファイル名が反映されないため少し待つ
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}

/** 端末・ブラウザによる文字化けを避けるためファイル名は ASCII にする */
export function csvFilename(prefix: string, today: DateString): string {
  return `${prefix}_${today.replace(/-/g, "")}.csv`;
}

