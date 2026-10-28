import { z } from "zod";
import { isValidDateString } from "@/lib/domain/dates";
import {
  MAINTENANCE_CATEGORIES,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  type MaintenanceInput,
  type VehicleInput,
} from "@/lib/types";

const requiredDate = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}を入力してください`)
    .refine(isValidDateString, `${label}の形式が正しくありません`);

const optionalDate = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || isValidDateString(v), `${label}の形式が正しくありません`)
    .transform((v) => (v === "" ? null : v));

const integer = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[,，]/g, "").normalize("NFKC"))
    .refine((v) => /^\d+$/.test(v), `${label}は0以上の整数で入力してください`)
    .transform(Number)
    .refine((v) => v <= max, `${label}が大きすぎます`);

const optionalInteger = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[,，]/g, "").normalize("NFKC"))
    .refine((v) => v === "" || /^\d+$/.test(v), `${label}は0以上の整数で入力してください`)
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || v <= max, `${label}が大きすぎます`);

export const vehicleFormSchema = z.object({
  plateNumber: z
    .string()
    .trim()
    .min(1, "登録番号を入力してください")
    .max(30, "登録番号は30文字以内で入力してください"),
  name: z
    .string()
    .trim()
    .min(1, "車名を入力してください")
    .max(50, "車名は50文字以内で入力してください"),
  maker: z.string().trim().max(30, "メーカーは30文字以内で入力してください"),
  model: z.string().trim().max(30, "型式は30文字以内で入力してください"),
  vehicleType: z.enum(VEHICLE_TYPES, "車種を選択してください"),
  year: optionalInteger("年式", 2100).refine(
    (v) => v === null || v >= 1950,
    "年式は1950年以降で入力してください",
  ),
  department: z.string().trim().max(30, "部署は30文字以内で入力してください"),
  assignee: z.string().trim().max(30, "担当は30文字以内で入力してください"),
  mileage: integer("走行距離", 9_999_999),
  inspectionDueDate: requiredDate("車検満了日"),
  insuranceDueDate: optionalDate("保険満了日"),
  status: z.enum(VEHICLE_STATUSES, "ステータスを選択してください"),
  notes: z.string().trim().max(500, "備考は500文字以内で入力してください"),
});

export type VehicleFormValues = z.input<typeof vehicleFormSchema>;

export const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, "車両を選択してください"),
  performedOn: requiredDate("実施日"),
  category: z.enum(MAINTENANCE_CATEGORIES, "区分を選択してください"),
  description: z
    .string()
    .trim()
    .min(1, "内容を入力してください")
    .max(200, "内容は200文字以内で入力してください"),
  cost: integer("費用", 99_999_999),
  mileage: optionalInteger("走行距離", 9_999_999),
  vendor: z.string().trim().max(50, "実施業者は50文字以内で入力してください"),
  nextInspectionDate: optionalDate("次回車検満了日"),
});

export type MaintenanceFormValues = z.input<typeof maintenanceFormSchema>;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

type ParseResult<Out, In> = { ok: true; data: Out } | { ok: false; errors: FieldErrors<In> };

function collectErrors<In>(error: z.ZodError): FieldErrors<In> {
  const errors: FieldErrors<In> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof In | undefined;
    if (key !== undefined && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function parseVehicleForm(
  values: VehicleFormValues,
): ParseResult<VehicleInput, VehicleFormValues> {
  const result = vehicleFormSchema.safeParse(values);
  if (!result.success) return { ok: false, errors: collectErrors(result.error) };
  return { ok: true, data: result.data };
}

export function parseMaintenanceForm(
  values: MaintenanceFormValues,
): ParseResult<MaintenanceInput & { nextInspectionDate: string | null }, MaintenanceFormValues> {
  const result = maintenanceFormSchema.safeParse(values);
  if (!result.success) return { ok: false, errors: collectErrors(result.error) };
  return { ok: true, data: result.data };
}

export function emptyVehicleForm(): VehicleFormValues {
  return {
    plateNumber: "",
    name: "",
    maker: "",
    model: "",
    vehicleType: "sedan",
    year: "",
    department: "",
    assignee: "",
    mileage: "0",
    inspectionDueDate: "",
    insuranceDueDate: "",
    status: "active",
    notes: "",
  };
}

export function vehicleToForm(v: VehicleInput): VehicleFormValues {
  return {
    plateNumber: v.plateNumber,
    name: v.name,
    maker: v.maker,
    model: v.model,
    vehicleType: v.vehicleType,
    year: v.year === null ? "" : String(v.year),
    department: v.department,
    assignee: v.assignee,
    mileage: String(v.mileage),
    inspectionDueDate: v.inspectionDueDate,
    insuranceDueDate: v.insuranceDueDate ?? "",
    status: v.status,
    notes: v.notes,
  };
}
