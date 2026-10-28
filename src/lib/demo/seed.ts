import { addDays, addMonths } from "@/lib/domain/dates";
import type {
  DateString,
  MaintenanceCategory,
  MaintenanceRecord,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from "@/lib/types";

/**
 * デモモード用の架空データ。
 * - 実在の個人・企業・ナンバーを含めないよう、登録番号は「デモ」地名、担当者は「部署＋担当記号」で表記する。
 * - 期限警告が常に表示されるよう、車検満了日は「今日」からの相対日数で生成する。
 */

export const DEMO_COMPANY_NAME = "サンプル運輸株式会社（架空）";

interface VehicleSeed {
  plate: string;
  name: string;
  maker: string;
  model: string;
  type: VehicleType;
  year: number;
  department: string;
  assignee: string;
  mileage: number;
  inspectionInDays: number;
  insuranceInDays: number | null;
  status: VehicleStatus;
  notes: string;
}

const VEHICLE_SEEDS: VehicleSeed[] = [
  { plate: "デモ 300 あ 10-01", name: "営業車1号", maker: "サンプル自動車", model: "SX-100", type: "sedan", year: 2021, department: "営業部", assignee: "営業部 担当A", mileage: 48210, inspectionInDays: -6, insuranceInDays: 120, status: "active", notes: "車検予約の手配が必要" },
  { plate: "デモ 300 あ 10-02", name: "営業車2号", maker: "サンプル自動車", model: "SX-100", type: "sedan", year: 2022, department: "営業部", assignee: "営業部 担当B", mileage: 31555, inspectionInDays: 12, insuranceInDays: 200, status: "active", notes: "" },
  { plate: "デモ 300 あ 10-03", name: "営業車3号", maker: "テスト工業", model: "TC-Hybrid", type: "sedan", year: 2023, department: "営業部", assignee: "営業部 担当C", mileage: 15890, inspectionInDays: 410, insuranceInDays: 95, status: "active", notes: "ハイブリッド車" },
  { plate: "デモ 580 い 20-11", name: "軽バン1号", maker: "モデルモータース", model: "MV-Kei", type: "kei", year: 2020, department: "サービス部", assignee: "サービス部 担当A", mileage: 72340, inspectionInDays: 25, insuranceInDays: 40, status: "active", notes: "" },
  { plate: "デモ 580 い 20-12", name: "軽バン2号", maker: "モデルモータース", model: "MV-Kei", type: "kei", year: 2019, department: "サービス部", assignee: "サービス部 担当B", mileage: 98210, inspectionInDays: 48, insuranceInDays: 300, status: "maintenance", notes: "ブレーキ異音のため入庫中" },
  { plate: "デモ 580 い 20-13", name: "軽乗用1号", maker: "サンプル自動車", model: "SK-Mini", type: "kei", year: 2024, department: "総務部", assignee: "総務部 担当A", mileage: 6210, inspectionInDays: 690, insuranceInDays: 180, status: "standby", notes: "共用車" },
  { plate: "デモ 400 う 30-21", name: "配送バン1号", maker: "テスト工業", model: "TV-Cargo", type: "van", year: 2018, department: "物流部", assignee: "物流部 担当A", mileage: 152400, inspectionInDays: 3, insuranceInDays: 60, status: "active", notes: "走行距離多め。買い替え検討" },
  { plate: "デモ 400 う 30-22", name: "配送バン2号", maker: "テスト工業", model: "TV-Cargo", type: "van", year: 2021, department: "物流部", assignee: "物流部 担当B", mileage: 88800, inspectionInDays: 140, insuranceInDays: 22, status: "active", notes: "" },
  { plate: "デモ 400 う 30-23", name: "配送バン3号", maker: "モデルモータース", model: "MV-Van", type: "van", year: 2022, department: "物流部", assignee: "物流部 担当C", mileage: 64320, inspectionInDays: 57, insuranceInDays: 250, status: "active", notes: "" },
  { plate: "デモ 100 え 40-31", name: "2tトラック1号", maker: "サンプル重工", model: "HT-2000", type: "truck", year: 2017, department: "物流部", assignee: "物流部 担当D", mileage: 210500, inspectionInDays: -20, insuranceInDays: 15, status: "maintenance", notes: "車検切れ。運行停止中" },
  { plate: "デモ 100 え 40-32", name: "2tトラック2号", maker: "サンプル重工", model: "HT-2000", type: "truck", year: 2020, department: "物流部", assignee: "物流部 担当E", mileage: 132100, inspectionInDays: 85, insuranceInDays: 330, status: "active", notes: "" },
  { plate: "デモ 100 え 40-33", name: "4tトラック1号", maker: "サンプル重工", model: "HT-4000", type: "truck", year: 2019, department: "物流部", assignee: "物流部 担当F", mileage: 268900, inspectionInDays: 160, insuranceInDays: 75, status: "active", notes: "" },
  { plate: "デモ 300 お 50-41", name: "役員車", maker: "テスト工業", model: "TC-Luxe", type: "sedan", year: 2023, department: "総務部", assignee: "総務部 担当B", mileage: 21400, inspectionInDays: 520, insuranceInDays: 270, status: "active", notes: "" },
  { plate: "デモ 300 お 50-42", name: "来客送迎車", maker: "サンプル自動車", model: "SX-Wagon", type: "other", year: 2016, department: "総務部", assignee: "総務部 担当C", mileage: 118700, inspectionInDays: 230, insuranceInDays: null, status: "retired", notes: "年度末で廃車予定" },
  { plate: "デモ 580 か 60-51", name: "点検車1号", maker: "モデルモータース", model: "MV-Kei", type: "kei", year: 2021, department: "サービス部", assignee: "サービス部 担当C", mileage: 54300, inspectionInDays: 33, insuranceInDays: 110, status: "active", notes: "" },
  { plate: "デモ 400 か 60-52", name: "工事車両1号", maker: "サンプル重工", model: "HT-Work", type: "truck", year: 2018, department: "サービス部", assignee: "サービス部 担当D", mileage: 143200, inspectionInDays: 300, insuranceInDays: 190, status: "standby", notes: "" },
];

interface RecordSeed {
  vehicle: number; // VEHICLE_SEEDS のインデックス
  daysAgo: number;
  category: MaintenanceCategory;
  description: string;
  cost: number;
  mileageOffset: number;
  vendor: string;
}

const VENDOR_A = "サンプル整備工場（架空）";
const VENDOR_B = "テストオートサービス（架空）";
const VENDOR_C = "デモタイヤセンター（架空）";

const RECORD_SEEDS: RecordSeed[] = [
  { vehicle: 0, daysAgo: 3, category: "oil", description: "エンジンオイル・フィルター交換", cost: 8800, mileageOffset: 0, vendor: VENDOR_A },
  { vehicle: 1, daysAgo: 9, category: "periodic", description: "12ヶ月法定点検", cost: 24200, mileageOffset: -120, vendor: VENDOR_A },
  { vehicle: 4, daysAgo: 2, category: "repair", description: "ブレーキパッド交換・ローター研磨", cost: 46500, mileageOffset: 0, vendor: VENDOR_B },
  { vehicle: 6, daysAgo: 15, category: "tire", description: "タイヤ4本交換", cost: 68000, mileageOffset: -800, vendor: VENDOR_C },
  { vehicle: 9, daysAgo: 6, category: "repair", description: "排気系部品交換（車検前修理）", cost: 128000, mileageOffset: 0, vendor: VENDOR_B },
  { vehicle: 7, daysAgo: 38, category: "oil", description: "エンジンオイル交換", cost: 6600, mileageOffset: -1500, vendor: VENDOR_A },
  { vehicle: 10, daysAgo: 42, category: "periodic", description: "3ヶ月定期点検", cost: 18700, mileageOffset: -3200, vendor: VENDOR_B },
  { vehicle: 11, daysAgo: 50, category: "tire", description: "スタッドレスタイヤ履き替え", cost: 22000, mileageOffset: -4100, vendor: VENDOR_C },
  { vehicle: 2, daysAgo: 61, category: "oil", description: "エンジンオイル交換", cost: 7700, mileageOffset: -2200, vendor: VENDOR_A },
  { vehicle: 3, daysAgo: 70, category: "repair", description: "エアコンガス補充", cost: 15400, mileageOffset: -2800, vendor: VENDOR_B },
  { vehicle: 12, daysAgo: 75, category: "periodic", description: "12ヶ月法定点検", cost: 26400, mileageOffset: -1900, vendor: VENDOR_A },
  { vehicle: 8, daysAgo: 88, category: "shaken", description: "継続車検", cost: 98000, mileageOffset: -6000, vendor: VENDOR_A },
  { vehicle: 14, daysAgo: 95, category: "oil", description: "エンジンオイル交換", cost: 5500, mileageOffset: -3500, vendor: VENDOR_A },
  { vehicle: 6, daysAgo: 104, category: "repair", description: "バッテリー交換", cost: 32000, mileageOffset: -7800, vendor: VENDOR_B },
  { vehicle: 15, daysAgo: 112, category: "periodic", description: "3ヶ月定期点検", cost: 19800, mileageOffset: -2600, vendor: VENDOR_B },
  { vehicle: 1, daysAgo: 125, category: "tire", description: "パンク修理", cost: 3300, mileageOffset: -4300, vendor: VENDOR_C },
  { vehicle: 10, daysAgo: 133, category: "repair", description: "荷台ゲート修理", cost: 74800, mileageOffset: -9900, vendor: VENDOR_B },
  { vehicle: 5, daysAgo: 140, category: "oil", description: "エンジンオイル交換", cost: 5500, mileageOffset: -1200, vendor: VENDOR_A },
  { vehicle: 9, daysAgo: 150, category: "periodic", description: "3ヶ月定期点検", cost: 21000, mileageOffset: -11000, vendor: VENDOR_B },
  { vehicle: 0, daysAgo: 160, category: "periodic", description: "12ヶ月法定点検", cost: 23100, mileageOffset: -5200, vendor: VENDOR_A },
  { vehicle: 13, daysAgo: 168, category: "repair", description: "ドアミラー交換", cost: 28600, mileageOffset: -3100, vendor: VENDOR_B },
  { vehicle: 11, daysAgo: 176, category: "oil", description: "エンジンオイル・エレメント交換", cost: 16500, mileageOffset: -12800, vendor: VENDOR_A },
  { vehicle: 2, daysAgo: 180, category: "shaken", description: "新車1回目車検前点検", cost: 12000, mileageOffset: -6100, vendor: VENDOR_A },
  { vehicle: 7, daysAgo: 22, category: "periodic", description: "3ヶ月定期点検", cost: 20900, mileageOffset: -900, vendor: VENDOR_B },
  { vehicle: 3, daysAgo: 27, category: "oil", description: "エンジンオイル交換", cost: 4950, mileageOffset: -500, vendor: VENDOR_A },
];

/** 実行環境に依存せず決定的な ID を生成する（デモデータの再現性のため） */
function seedId(prefix: string, index: number): string {
  return `${prefix}-${String(index + 1).padStart(4, "0")}`;
}

export interface DemoDataset {
  vehicles: Vehicle[];
  records: MaintenanceRecord[];
}

export function createDemoDataset(today: DateString): DemoDataset {
  const timestamp = `${today}T09:00:00.000Z`;
  const vehicles: Vehicle[] = VEHICLE_SEEDS.map((s, i) => ({
    id: seedId("demo-vehicle", i),
    plateNumber: s.plate,
    name: s.name,
    maker: s.maker,
    model: s.model,
    vehicleType: s.type,
    year: s.year,
    department: s.department,
    assignee: s.assignee,
    mileage: s.mileage,
    inspectionDueDate: addDays(today, s.inspectionInDays),
    insuranceDueDate: s.insuranceInDays === null ? null : addDays(today, s.insuranceInDays),
    status: s.status,
    notes: s.notes,
    createdAt: `${addMonths(today, -12)}T09:00:00.000Z`,
    updatedAt: timestamp,
  }));

  const records: MaintenanceRecord[] = RECORD_SEEDS.map((s, i) => {
    const vehicle = vehicles[s.vehicle];
    const performedOn = addDays(today, -s.daysAgo);
    return {
      id: seedId("demo-record", i),
      vehicleId: vehicle.id,
      performedOn,
      category: s.category,
      description: s.description,
      cost: s.cost,
      mileage: Math.max(0, vehicle.mileage + s.mileageOffset),
      vendor: s.vendor,
      createdAt: `${performedOn}T09:00:00.000Z`,
    };
  });

  return { vehicles, records };
}
