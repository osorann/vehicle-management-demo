"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  STATUS_LABELS,
  VEHICLE_STATUSES,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
  type VehicleInput,
} from "@/lib/types";
import { parseVehicleForm, type FieldErrors, type VehicleFormValues } from "@/lib/validation";

export function VehicleForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: VehicleFormValues;
  submitLabel: string;
  onSubmit: (input: VehicleInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<VehicleFormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<VehicleFormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 非表示で保持された別画面のフォームと id が衝突しないよう一意な接頭辞を付ける
  const uid = useId();

  const set =
    (key: keyof VehicleFormValues) =>
    (e: { target: { value: string } }) =>
      setValues((prev) => ({ ...prev, [key]: e.target.value }));

  const props = (key: keyof VehicleFormValues) => ({
    id: `${uid}-${key}`,
    name: key,
    value: values[key] as string,
    onChange: set(key),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${uid}-${key}-error` : undefined,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = parseVehicleForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      setSubmitError("入力内容を確認してください");
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {submitError ? <ErrorMessage message={submitError} /> : null}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold text-slate-900">基本情報</legend>
        <Field id={`${uid}-plateNumber`} label="登録番号" required error={errors.plateNumber} hint="例：デモ 300 あ 12-34">
          <Input {...props("plateNumber")} autoComplete="off" placeholder="デモ 300 あ 12-34" />
        </Field>
        <Field id={`${uid}-name`} label="車名・管理名" required error={errors.name}>
          <Input {...props("name")} placeholder="営業車1号" />
        </Field>
        <Field id={`${uid}-maker`} label="メーカー" error={errors.maker}>
          <Input {...props("maker")} />
        </Field>
        <Field id={`${uid}-model`} label="型式" error={errors.model}>
          <Input {...props("model")} />
        </Field>
        <Field id={`${uid}-vehicleType`} label="車種" required error={errors.vehicleType}>
          <Select {...props("vehicleType")}>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {VEHICLE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${uid}-year`} label="年式（西暦）" error={errors.year}>
          <Input {...props("year")} inputMode="numeric" placeholder="2022" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold text-slate-900">管理情報</legend>
        <Field id={`${uid}-inspectionDueDate`} label="車検満了日" required error={errors.inspectionDueDate}>
          <Input {...props("inspectionDueDate")} type="date" />
        </Field>
        <Field id={`${uid}-insuranceDueDate`} label="任意保険満了日" error={errors.insuranceDueDate}>
          <Input {...props("insuranceDueDate")} type="date" />
        </Field>
        <Field id={`${uid}-mileage`} label="走行距離（km）" required error={errors.mileage}>
          <Input {...props("mileage")} inputMode="numeric" />
        </Field>
        <Field id={`${uid}-status`} label="ステータス" required error={errors.status}>
          <Select {...props("status")}>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id={`${uid}-department`} label="管理部署" error={errors.department}>
          <Input {...props("department")} placeholder="営業部" />
        </Field>
        <Field
          id={`${uid}-assignee`}
          label="担当"
          error={errors.assignee}
          hint="個人名ではなく役割名での登録を推奨します"
        >
          <Input {...props("assignee")} placeholder="営業部 担当A" />
        </Field>
        <Field id={`${uid}-notes`} label="備考" error={errors.notes} className="sm:col-span-2">
          <Textarea {...props("notes")} rows={3} />
        </Field>
      </fieldset>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            キャンセル
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
