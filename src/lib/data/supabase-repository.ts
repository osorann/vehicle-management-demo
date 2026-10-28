import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MaintenanceCategory,
  MaintenanceInput,
  MaintenanceRecord,
  Vehicle,
  VehicleInput,
  VehicleStatus,
  VehicleType,
} from "@/lib/types";
import { RepositoryError, type VehicleRepository } from "./repository";

/** DB のカラム名（snake_case）。supabase/migrations の定義と一致させる */
export interface VehicleRow {
  id: string;
  plate_number: string;
  name: string;
  maker: string;
  model: string;
  vehicle_type: VehicleType;
  year: number | null;
  department: string;
  assignee: string;
  mileage: number;
  inspection_due_date: string;
  insurance_due_date: string | null;
  status: VehicleStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRow {
  id: string;
  vehicle_id: string;
  performed_on: string;
  category: MaintenanceCategory;
  description: string;
  cost: number;
  mileage: number | null;
  vendor: string;
  created_at: string;
}

export function rowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    name: row.name,
    maker: row.maker,
    model: row.model,
    vehicleType: row.vehicle_type,
    year: row.year,
    department: row.department,
    assignee: row.assignee,
    mileage: row.mileage,
    inspectionDueDate: row.inspection_due_date,
    insuranceDueDate: row.insurance_due_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function vehicleToRow(input: Partial<VehicleInput>): Partial<VehicleRow> {
  const row: Partial<VehicleRow> = {};
  if (input.plateNumber !== undefined) row.plate_number = input.plateNumber;
  if (input.name !== undefined) row.name = input.name;
  if (input.maker !== undefined) row.maker = input.maker;
  if (input.model !== undefined) row.model = input.model;
  if (input.vehicleType !== undefined) row.vehicle_type = input.vehicleType;
  if (input.year !== undefined) row.year = input.year;
  if (input.department !== undefined) row.department = input.department;
  if (input.assignee !== undefined) row.assignee = input.assignee;
  if (input.mileage !== undefined) row.mileage = input.mileage;
  if (input.inspectionDueDate !== undefined) row.inspection_due_date = input.inspectionDueDate;
  if (input.insuranceDueDate !== undefined) row.insurance_due_date = input.insuranceDueDate;
  if (input.status !== undefined) row.status = input.status;
  if (input.notes !== undefined) row.notes = input.notes;
  return row;
}

export function rowToMaintenance(row: MaintenanceRow): MaintenanceRecord {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    performedOn: row.performed_on,
    category: row.category,
    description: row.description,
    cost: row.cost,
    mileage: row.mileage,
    vendor: row.vendor,
    createdAt: row.created_at,
  };
}

function maintenanceToRow(input: MaintenanceInput): Omit<MaintenanceRow, "id" | "created_at"> {
  return {
    vehicle_id: input.vehicleId,
    performed_on: input.performedOn,
    category: input.category,
    description: input.description,
    cost: input.cost,
    mileage: input.mileage,
    vendor: input.vendor,
  };
}

function fail(action: string, error: { message: string } | null): never {
  throw new RepositoryError(`${action}に失敗しました`, { cause: error });
}

/** RLS により、ログインユーザー自身のデータのみ読み書きできる */
export class SupabaseRepository implements VehicleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listVehicles(): Promise<Vehicle[]> {
    const { data, error } = await this.client
      .from("vehicles")
      .select("*")
      .order("inspection_due_date", { ascending: true });
    if (error) fail("車両一覧の取得", error);
    return (data as VehicleRow[]).map(rowToVehicle);
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.client.from("vehicles").select("*").eq("id", id).maybeSingle();
    if (error) fail("車両の取得", error);
    return data ? rowToVehicle(data as VehicleRow) : null;
  }

  async createVehicle(input: VehicleInput): Promise<Vehicle> {
    const { data, error } = await this.client
      .from("vehicles")
      .insert(vehicleToRow(input))
      .select("*")
      .single();
    if (error) fail("車両の登録", error);
    return rowToVehicle(data as VehicleRow);
  }

  async updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle> {
    const { data, error } = await this.client
      .from("vehicles")
      .update(vehicleToRow(input))
      .eq("id", id)
      .select("*")
      .single();
    if (error) fail("車両の更新", error);
    return rowToVehicle(data as VehicleRow);
  }

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await this.client.from("vehicles").delete().eq("id", id);
    if (error) fail("車両の削除", error);
  }

  async listMaintenance(vehicleId?: string): Promise<MaintenanceRecord[]> {
    let query = this.client
      .from("maintenance_records")
      .select("*")
      .order("performed_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (vehicleId) query = query.eq("vehicle_id", vehicleId);
    const { data, error } = await query;
    if (error) fail("整備履歴の取得", error);
    return (data as MaintenanceRow[]).map(rowToMaintenance);
  }

  async createMaintenance(input: MaintenanceInput): Promise<MaintenanceRecord> {
    const { data, error } = await this.client
      .from("maintenance_records")
      .insert(maintenanceToRow(input))
      .select("*")
      .single();
    if (error) fail("整備履歴の登録", error);
    return rowToMaintenance(data as MaintenanceRow);
  }

  async deleteMaintenance(id: string): Promise<void> {
    const { error } = await this.client.from("maintenance_records").delete().eq("id", id);
    if (error) fail("整備履歴の削除", error);
  }
}
