import type { MaintenanceInput, MaintenanceRecord, Vehicle, VehicleInput } from "@/lib/types";

/**
 * 画面からはこのインターフェースだけを使う。
 * デモモードはブラウザ内ストレージ、本番モードは Supabase の実装が注入される。
 */
export interface VehicleRepository {
  listVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | null>;
  createVehicle(input: VehicleInput): Promise<Vehicle>;
  updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<void>;
  listMaintenance(vehicleId?: string): Promise<MaintenanceRecord[]>;
  createMaintenance(input: MaintenanceInput): Promise<MaintenanceRecord>;
  deleteMaintenance(id: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RepositoryError";
  }
}

export function sortRecordsDesc(records: MaintenanceRecord[]): MaintenanceRecord[] {
  return [...records].sort(
    (a, b) =>
      b.performedOn.localeCompare(a.performedOn) || b.createdAt.localeCompare(a.createdAt),
  );
}
