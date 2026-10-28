"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { todayString } from "@/lib/domain/dates";
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceInput,
  type Vehicle,
} from "@/lib/types";
import {
  parseMaintenanceForm,
  type FieldErrors,
  type MaintenanceFormValues,
} from "@/lib/validation";

export interface MaintenanceSubmit {
  record: MaintenanceInput;
  nextInspectionDate: string | null;
}

function initialValues(vehicleId: string, mileage?: number): MaintenanceFormValues {
  return {
    vehicleId,
    performedOn: todayString(),
    category: "periodic",
    description: "",
    cost: "",
    mileage: mileage === undefined ? "" : String(mileage),
    vendor: "",
    nextInspectionDate: "",
  };
}

export function MaintenanceForm({
  vehicles,
  fixedVehicle,
  onSubmit,
  onCancel,
}: {
  /** fixedVehicle が無い場合に選択肢として表示する */
  vehicles?: Vehicle[];
  fixedVehicle?: Vehicle;
  onSubmit: (value: MaintenanceSubmit) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<MaintenanceFormValues>(() =>
    initialValues(fixedVehicle?.id ?? "", fixedVehicle?.mileage),
  );
  const [errors, setErrors] = useState<FieldErrors<MaintenanceFormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 非表示で保持された別画面のフォームと id が衝突しないよう一意な接頭辞を付ける
  const uid = useId();

  const props = (key: keyof MaintenanceFormValues) => ({
    id: `${uid}-${key}`,
    name: key,
    value: values[key] as string,
    onChange: (e: { target: { value: string } }) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value })),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${uid}-${key}-error` : undefined,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = parseMaintenanceForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { nextInspectionDate, ...record } = result.data;
      await onSubmit({
        record,
        nextInspectionDate: record.category === "shaken" ? nextInspectionDate : null,
      });
      // 画面が非表示で保持されても前回の入力が残らないようにリセットする
      setValues(initialValues(fixedVehicle?.id ?? "", fixedVehicle?.mileage));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {submitError ? <ErrorMessage message={submitError} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {fixedVehicle ? null : (
          <Field id={`${uid}-vehicleId`} label="車両" required error={errors.vehicleId} className="sm:col-span-2">
            <Select {...props("vehicleId")}>
              <option value="">選択してください</option>
              {(vehicles ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber}（{v.name}）
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field id={`${uid}-performedOn`} label="実施日" required error={errors.performedOn}>
          <Input {...props("performedOn")} type="date" />
        </Field>
        <Field id={`${uid}-category`} label="区分" required error={errors.category}>
          <Select {...props("category")}>
            {MAINTENANCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {MAINTENANCE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${uid}-description`} label="内容" required error={errors.description} className="sm:col-span-2">
          <Input {...props("description")} placeholder="12ヶ月法定点検、オイル交換 など" />
        </Field>
        <Field id={`${uid}-cost`} label="費用（円・税込）" required error={errors.cost}>
          <Input {...props("cost")} inputMode="numeric" placeholder="20000" />
        </Field>
        <Field id={`${uid}-mileage`} label="実施時の走行距離（km）" error={errors.mileage}>
          <Input {...props("mileage")} inputMode="numeric" />
        </Field>
        <Field id={`${uid}-vendor`} label="実施業者" error={errors.vendor}>
          <Input {...props("vendor")} />
        </Field>
        {values.category === "shaken" ? (
          <Field
            id={`${uid}-nextInspectionDate`}
            label="次回車検満了日"
            error={errors.nextInspectionDate}
            hint="入力すると車両の車検満了日を更新します"
          >
            <Input {...props("nextInspectionDate")} type="date" />
          </Field>
        ) : null}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            キャンセル
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中…" : "記録を追加"}
        </Button>
      </div>
    </form>
  );
}
