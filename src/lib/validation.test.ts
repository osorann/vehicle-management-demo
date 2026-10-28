import { describe, expect, it } from "vitest";
import { emptyVehicleForm, parseMaintenanceForm, parseVehicleForm, vehicleToForm } from "./validation";

const valid = {
  ...emptyVehicleForm(),
  plateNumber: " デモ 300 あ 12-34 ",
  name: "営業車",
  year: "２０２２",
  mileage: "12,345",
  inspectionDueDate: "2027-03-31",
};

describe("parseVehicleForm", () => {
  it("normalizes and converts valid input", () => {
    const result = parseVehicleForm(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      plateNumber: "デモ 300 あ 12-34",
      year: 2022,
      mileage: 12345,
      insuranceDueDate: null,
      status: "active",
    });
  });

  it("reports Japanese error messages per field", () => {
    const result = parseVehicleForm({
      ...emptyVehicleForm(),
      mileage: "-1",
      inspectionDueDate: "2026-02-30",
      year: "1800",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.plateNumber).toBe("登録番号を入力してください");
    expect(result.errors.name).toBe("車名を入力してください");
    expect(result.errors.mileage).toBe("走行距離は0以上の整数で入力してください");
    expect(result.errors.inspectionDueDate).toBe("車検満了日の形式が正しくありません");
    expect(result.errors.year).toBe("年式は1950年以降で入力してください");
  });

  it("rejects unknown enum values", () => {
    const result = parseVehicleForm({ ...valid, status: "flying" as never });
    expect(result.ok).toBe(false);
  });

  it("round-trips through vehicleToForm", () => {
    const parsed = parseVehicleForm(valid);
    if (!parsed.ok) throw new Error("expected ok");
    expect(parseVehicleForm(vehicleToForm(parsed.data))).toEqual(parsed);
  });
});

describe("parseMaintenanceForm", () => {
  it("accepts a valid record", () => {
    const result = parseMaintenanceForm({
      vehicleId: "v1",
      performedOn: "2026-10-01",
      category: "shaken",
      description: "継続車検",
      cost: "98000",
      mileage: "",
      vendor: "",
      nextInspectionDate: "2028-10-01",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        vehicleId: "v1",
        performedOn: "2026-10-01",
        category: "shaken",
        description: "継続車検",
        cost: 98000,
        mileage: null,
        vendor: "",
        nextInspectionDate: "2028-10-01",
      },
    });
  });

  it("requires vehicle, description and cost", () => {
    const result = parseMaintenanceForm({
      vehicleId: "",
      performedOn: "2026-10-01",
      category: "oil",
      description: " ",
      cost: "abc",
      mileage: "",
      vendor: "",
      nextInspectionDate: "",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(["cost", "description", "vehicleId"]);
  });
});
