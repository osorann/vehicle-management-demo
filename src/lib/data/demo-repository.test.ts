import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_STORAGE_KEY, DemoRepository } from "./demo-repository";
import type { VehicleInput } from "@/lib/types";

const TODAY = "2026-10-28";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const input: VehicleInput = {
  plateNumber: "デモ 500 さ 99-99",
  name: "テスト車",
  maker: "",
  model: "",
  vehicleType: "van",
  year: 2024,
  department: "検証部",
  assignee: "検証部 担当A",
  mileage: 100,
  inspectionDueDate: "2027-01-01",
  insuranceDueDate: null,
  status: "active",
  notes: "",
};

describe("DemoRepository", () => {
  let storage: ReturnType<typeof memoryStorage>;
  let repo: DemoRepository;

  beforeEach(() => {
    storage = memoryStorage();
    repo = new DemoRepository({ storage, today: () => TODAY, now: () => new Date("2026-10-28T03:00:00Z") });
  });

  it("seeds sample data on first access under a dedicated key", async () => {
    const vehicles = await repo.listVehicles();
    expect(vehicles.length).toBeGreaterThan(10);
    expect([...storage.map.keys()]).toEqual([DEMO_STORAGE_KEY]);
  });

  it("creates, updates and deletes vehicles", async () => {
    const created = await repo.createVehicle(input);
    expect(await repo.getVehicle(created.id)).toMatchObject({ name: "テスト車" });

    const updated = await repo.updateVehicle(created.id, { mileage: 500 });
    expect(updated.mileage).toBe(500);
    expect(updated.updatedAt).toBe("2026-10-28T03:00:00.000Z");

    await repo.deleteVehicle(created.id);
    expect(await repo.getVehicle(created.id)).toBeNull();
  });

  it("persists across instances sharing storage", async () => {
    const created = await repo.createVehicle(input);
    const other = new DemoRepository({ storage, today: () => TODAY });
    expect(await other.getVehicle(created.id)).not.toBeNull();
  });

  it("cascades maintenance records when a vehicle is deleted", async () => {
    const [vehicle] = await repo.listVehicles();
    expect((await repo.listMaintenance(vehicle.id)).length).toBeGreaterThan(0);
    await repo.deleteVehicle(vehicle.id);
    expect(await repo.listMaintenance(vehicle.id)).toEqual([]);
  });

  it("adds maintenance records newest first", async () => {
    const created = await repo.createVehicle(input);
    await repo.createMaintenance({
      vehicleId: created.id, performedOn: "2026-09-01", category: "oil", description: "古い", cost: 1, mileage: null, vendor: "",
    });
    await repo.createMaintenance({
      vehicleId: created.id, performedOn: "2026-10-01", category: "tire", description: "新しい", cost: 2, mileage: null, vendor: "",
    });
    const list = await repo.listMaintenance(created.id);
    expect(list.map((r) => r.description)).toEqual(["新しい", "古い"]);
  });

  it("rejects records for unknown vehicles", async () => {
    await expect(
      repo.createMaintenance({
        vehicleId: "nope", performedOn: "2026-10-01", category: "oil", description: "x", cost: 0, mileage: null, vendor: "",
      }),
    ).rejects.toThrow("車両が見つかりません");
  });

  it("resets to the sample data and recovers from corrupted storage", async () => {
    await repo.createVehicle(input);
    repo.reset();
    expect((await repo.listVehicles()).some((v) => v.name === "テスト車")).toBe(false);

    storage.setItem(DEMO_STORAGE_KEY, "{broken");
    expect((await repo.listVehicles()).length).toBeGreaterThan(10);
  });
});
