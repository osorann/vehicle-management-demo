"use client";

import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { useRepositoryQuery, useSession } from "@/components/session/session-provider";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorMessage, Skeleton } from "@/components/ui/feedback";
import { InspectionBadge } from "@/components/vehicles/inspection-badge";
import { StatusBadge } from "@/components/vehicles/status-badge";
import { formatJaDate, todayString } from "@/lib/domain/dates";
import { getInspectionState } from "@/lib/domain/inspection";
import { formatYen } from "@/lib/domain/stats";
import { VEHICLE_TYPE_LABELS, type MaintenanceRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs font-medium text-slate-500 sm:text-sm">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 sm:col-span-2 sm:mt-0">{children || "—"}</dd>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const today = todayString();
  const { repository, notifyChanged } = useSession();
  const { data, error, loading } = useRepositoryQuery(
    async (repo) => {
      const [vehicle, records] = await Promise.all([repo.getVehicle(id), repo.listMaintenance(id)]);
      return { vehicle, records };
    },
    [id],
  );
  const [showForm, setShowForm] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<MaintenanceRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading && !data) return <Skeleton className="h-96" />;
  if (error) return <ErrorMessage message={error} />;
  const vehicle = data?.vehicle;
  if (!vehicle) {
    return (
      <Card>
        <EmptyState title="車両が見つかりません">
          <Link href="/vehicles" className="text-blue-700 hover:underline">
            車両一覧へ戻る
          </Link>
        </EmptyState>
      </Card>
    );
  }
  const records = data.records;
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const inspection = getInspectionState(vehicle.inspectionDueDate, today);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/vehicles" className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        車両一覧
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{vehicle.plateNumber}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {vehicle.name} ・ {VEHICLE_TYPE_LABELS[vehicle.vehicleType]}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <InspectionBadge dueDate={vehicle.inspectionDueDate} today={today} />
            <StatusBadge status={vehicle.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/vehicles/${vehicle.id}/edit`} variant="secondary" className="flex-1 sm:flex-none">
            <Pencil className="h-4 w-4" aria-hidden />
            編集
          </LinkButton>
          <Button variant="secondary" className="flex-1 text-red-600 sm:flex-none" onClick={() => setDeletingVehicle(true)}>
            <Trash2 className="h-4 w-4" aria-hidden />
            削除
          </Button>
        </div>
      </div>

      {actionError ? (
        <div className="mb-4">
          <ErrorMessage message={actionError} />
        </div>
      ) : null}

      {inspection.level === "expired" || inspection.level === "urgent" ? (
        <div
          role="alert"
          className={cn(
            "mb-5 rounded-xl border px-4 py-3 text-sm",
            inspection.level === "expired" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          {inspection.level === "expired"
            ? `車検満了日（${formatJaDate(vehicle.inspectionDueDate)}）を${Math.abs(inspection.daysLeft)}日過ぎています。運行を停止し、車検を受けてください。`
            : `車検満了日まで${inspection.label.replace("残り", "あと")}です。早めに車検の予約を行ってください。`}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader title="車両情報" />
          <dl className="divide-y divide-slate-100 px-4 sm:px-5">
            <Item label="車検満了日">{formatJaDate(vehicle.inspectionDueDate)}</Item>
            <Item label="任意保険満了日">{formatJaDate(vehicle.insuranceDueDate)}</Item>
            <Item label="走行距離">{`${vehicle.mileage.toLocaleString("ja-JP")} km`}</Item>
            <Item label="メーカー / 型式">{[vehicle.maker, vehicle.model].filter(Boolean).join(" / ")}</Item>
            <Item label="年式">{vehicle.year ? `${vehicle.year}年` : ""}</Item>
            <Item label="管理部署">{vehicle.department}</Item>
            <Item label="担当">{vehicle.assignee}</Item>
            <Item label="備考">
              <span className="whitespace-pre-wrap">{vehicle.notes}</span>
            </Item>
          </dl>
        </Card>

        <Card className="min-w-0 lg:col-span-3">
          <CardHeader
            title="点検・整備履歴"
            description={`${records.length}件 ・ 累計 ${formatYen(totalCost)}`}
            action={
              showForm ? null : (
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  記録を追加
                </Button>
              )
            }
          />
          {showForm ? (
            <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
              <MaintenanceForm
                fixedVehicle={vehicle}
                onCancel={() => setShowForm(false)}
                onSubmit={async ({ record, nextInspectionDate }) => {
                  await repository.createMaintenance(record);
                  const patch: { inspectionDueDate?: string; mileage?: number } = {};
                  if (nextInspectionDate) patch.inspectionDueDate = nextInspectionDate;
                  if (record.mileage !== null && record.mileage > vehicle.mileage) patch.mileage = record.mileage;
                  if (Object.keys(patch).length > 0) await repository.updateVehicle(vehicle.id, patch);
                  setShowForm(false);
                  notifyChanged();
                }}
              />
            </div>
          ) : null}
          {records.length === 0 ? (
            <EmptyState title="記録はまだありません" />
          ) : (
            <MaintenanceList records={records} onDelete={setDeletingRecord} />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={deletingVehicle}
        title="この車両を削除しますか？"
        message={`${vehicle.plateNumber}（${vehicle.name}）と、紐づく点検・整備履歴${records.length}件が削除されます。この操作は取り消せません。`}
        busy={busy}
        onCancel={() => setDeletingVehicle(false)}
        onConfirm={() =>
          run(async () => {
            await repository.deleteVehicle(vehicle.id);
            setDeletingVehicle(false);
            notifyChanged();
            router.replace("/vehicles");
          })
        }
      />
      <ConfirmDialog
        open={deletingRecord !== null}
        title="この記録を削除しますか？"
        message={deletingRecord ? `${formatJaDate(deletingRecord.performedOn)}「${deletingRecord.description}」を削除します。` : ""}
        busy={busy}
        onCancel={() => setDeletingRecord(null)}
        onConfirm={() =>
          run(async () => {
            if (deletingRecord) await repository.deleteMaintenance(deletingRecord.id);
            setDeletingRecord(null);
            notifyChanged();
          })
        }
      />
    </>
  );
}
