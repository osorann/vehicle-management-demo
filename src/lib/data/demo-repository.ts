import { todayString } from "@/lib/domain/dates";
import { createDemoDataset, type DemoDataset } from "@/lib/demo/seed";
import type { MaintenanceInput, MaintenanceRecord, Vehicle, VehicleInput } from "@/lib/types";
import { RepositoryError, sortRecordsDesc, type VehicleRepository } from "./repository";

/** デモデータの保存先。本番データとは完全に別のキーで、このブラウザ内にのみ保存される */
export const DEMO_STORAGE_KEY = "vehicle-demo:data:v1";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function defaultStorage(): KeyValueStorage {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const probe = "vehicle-demo:probe";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    // プライベートブラウズ等で localStorage が使えない場合はメモリに保持する
  }
  return createMemoryStorage();
}

function generateId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}

export interface DemoRepositoryOptions {
  storage?: KeyValueStorage;
  today?: () => string;
  now?: () => Date;
  /** 通信待ちの雰囲気を出すための遅延（テストでは 0） */
  latencyMs?: number;
}

export class DemoRepository implements VehicleRepository {
  private readonly storage: KeyValueStorage;
  private readonly today: () => string;
  private readonly now: () => Date;
  private readonly latencyMs: number;

  constructor(options: DemoRepositoryOptions = {}) {
    this.storage = options.storage ?? defaultStorage();
    this.today = options.today ?? (() => todayString());
    this.now = options.now ?? (() => new Date());
    this.latencyMs = options.latencyMs ?? 0;
  }

  private async wait() {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  private load(): DemoDataset {
    const raw = this.storage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoDataset;
        if (Array.isArray(parsed.vehicles) && Array.isArray(parsed.records)) return parsed;
      } catch {
        // 壊れたデータは初期化する
      }
    }
    const fresh = createDemoDataset(this.today());
    this.save(fresh);
    return fresh;
  }

  private save(data: DemoDataset) {
    this.storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  }

  /** サンプルデータを今日の日付基準で作り直す */
  reset(): void {
    this.save(createDemoDataset(this.today()));
  }

  async listVehicles(): Promise<Vehicle[]> {
    await this.wait();
    return this.load().vehicles;
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    await this.wait();
    return this.load().vehicles.find((v) => v.id === id) ?? null;
  }

  async createVehicle(input: VehicleInput): Promise<Vehicle> {
    await this.wait();
    const data = this.load();
    const timestamp = this.now().toISOString();
    const vehicle: Vehicle = {
      ...input,
      id: generateId("vehicle"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    data.vehicles.push(vehicle);
    this.save(data);
    return vehicle;
  }

  async updateVehicle(id: string, input: Partial<VehicleInput>): Promise<Vehicle> {
    await this.wait();
    const data = this.load();
    const index = data.vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new RepositoryError("車両が見つかりません");
    const updated: Vehicle = {
      ...data.vehicles[index],
      ...input,
      id,
      updatedAt: this.now().toISOString(),
    };
    data.vehicles[index] = updated;
    this.save(data);
    return updated;
  }

  async deleteVehicle(id: string): Promise<void> {
    await this.wait();
    const data = this.load();
    if (!data.vehicles.some((v) => v.id === id)) throw new RepositoryError("車両が見つかりません");
    data.vehicles = data.vehicles.filter((v) => v.id !== id);
    // 本番 DB の ON DELETE CASCADE と同じ挙動にする
    data.records = data.records.filter((r) => r.vehicleId !== id);
    this.save(data);
  }

  async listMaintenance(vehicleId?: string): Promise<MaintenanceRecord[]> {
    await this.wait();
    const records = this.load().records;
    return sortRecordsDesc(vehicleId ? records.filter((r) => r.vehicleId === vehicleId) : records);
  }

  async createMaintenance(input: MaintenanceInput): Promise<MaintenanceRecord> {
    await this.wait();
    const data = this.load();
    if (!data.vehicles.some((v) => v.id === input.vehicleId)) {
      throw new RepositoryError("車両が見つかりません");
    }
    const record: MaintenanceRecord = {
      ...input,
      id: generateId("record"),
      createdAt: this.now().toISOString(),
    };
    data.records.push(record);
    this.save(data);
    return record;
  }

  async deleteMaintenance(id: string): Promise<void> {
    await this.wait();
    const data = this.load();
    data.records = data.records.filter((r) => r.id !== id);
    this.save(data);
  }
}
