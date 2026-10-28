import { describe, expect, it } from "vitest";
import { rowToVehicle, vehicleToRow, type VehicleRow } from "./supabase-repository";

const row: VehicleRow = {
  id: "uuid-1",
  plate_number: "デモ 300 あ 10-01",
  name: "営業車",
  maker: "M",
  model: "X",
  vehicle_type: "sedan",
  year: 2020,
  department: "営業部",
  assignee: "営業部 担当A",
  mileage: 1000,
  inspection_due_date: "2027-01-01",
  insurance_due_date: null,
  status: "active",
  notes: "",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

describe("supabase row mapping", () => {
  it("maps snake_case rows to domain objects", () => {
    expect(rowToVehicle(row)).toMatchObject({
      plateNumber: "デモ 300 あ 10-01",
      vehicleType: "sedan",
      inspectionDueDate: "2027-01-01",
      insuranceDueDate: null,
    });
  });

  it("maps only provided fields for partial updates", () => {
    expect(vehicleToRow({ mileage: 5, inspectionDueDate: "2028-01-01" })).toEqual({
      mileage: 5,
      inspection_due_date: "2028-01-01",
    });
  });

  it("round-trips all fields", () => {
    const { id, created_at, updated_at, ...rest } = row;
    void id; void created_at; void updated_at;
    const v = rowToVehicle(row);
    expect(vehicleToRow(v)).toEqual(rest);
  });
});
