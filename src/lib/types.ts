export const VEHICLE_STATUSES = ["active", "maintenance", "standby", "retired"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_TYPES = ["sedan", "kei", "van", "truck", "other"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const MAINTENANCE_CATEGORIES = [
  "shaken",
  "periodic",
  "repair",
  "oil",
  "tire",
  "other",
] as const;
export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  active: "稼働中",
  maintenance: "整備中",
  standby: "待機",
  retired: "廃車予定",
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  sedan: "乗用車",
  kei: "軽自動車",
  van: "バン",
  truck: "トラック",
  other: "その他",
};

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  shaken: "車検",
  periodic: "法定点検",
  repair: "修理",
  oil: "オイル交換",
  tire: "タイヤ交換",
  other: "その他",
};

/** 日付はすべて "YYYY-MM-DD" 形式の文字列で扱う */
export type DateString = string;

export interface Vehicle {
  id: string;
  plateNumber: string;
  name: string;
  maker: string;
  model: string;
  vehicleType: VehicleType;
  year: number | null;
  department: string;
  assignee: string;
  mileage: number;
  inspectionDueDate: DateString;
  insuranceDueDate: DateString | null;
  status: VehicleStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type VehicleInput = Omit<Vehicle, "id" | "createdAt" | "updatedAt">;

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  performedOn: DateString;
  category: MaintenanceCategory;
  description: string;
  cost: number;
  mileage: number | null;
  vendor: string;
  createdAt: string;
}

export type MaintenanceInput = Omit<MaintenanceRecord, "id" | "createdAt">;
