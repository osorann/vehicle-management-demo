"use client";

import { Download, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { MaintenanceList } from "@/components/maintenance/maintenance-list";
import { useRepositoryQuery, useSession } from "@/components/session/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, ErrorMessage, PageHeader, Skeleton } from "@/components/ui/feedback";
import { Select } from "@/components/ui/form";
import { csvFilename, downloadCsv, maintenanceToCsv } from "@/lib/csv";
import { todayString } from "@/lib/domain/dates";
import { formatYen } from "@/lib/domain/stats";
import {
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceCategory,
  type MaintenanceRecord,
} from "@/lib/types";

export default function MaintenancePage() {
  const today = todayString();
  const { repository, notifyChanged } = useSession();
  const { data, error, loading } = useRepositoryQuery(async (repo) => {
    const [vehicles, records] = await Promise.all([repo.listVehicles(), repo.listMaintenance()]);
    return { vehicles, records };
  });
  const [category, setCategory] = useState<MaintenanceCategory | "all">("all");
  const [vehicleId, setVehicleId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<MaintenanceRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      (data?.records ?? []).filter(
        (r) => (category === "all" || r.category === category) && (!vehicleId || r.vehicleId === vehicleId),
      ),
    [data, category, vehicleId],
  );
  const total = filtered.reduce((sum, r) => sum + r.cost, 0);
  const sortedVehicles = useMemo(
    () => [...(data?.vehicles ?? [])].sort((a, b) => a.plateNumber.localeCompare(b.plateNumber, "ja")),
    [data],
  );

  return (
    <>
      <PageHeader
        title="点検・整備履歴"
        description={data ? `${filtered.length}件 ・ 合計 ${formatYen(total)}` : undefined}
        actions={
          <>
            <Button
              variant="secondary"
              disabled={filtered.length === 0}
              onClick={() =>
                downloadCsv(csvFilename("maintenance", today), maintenanceToCsv(filtered, data?.vehicles ?? []))
              }
            >
              <Download className="h-4 w-4" aria-hidden />
              CSV出力
            </Button>
            {showForm ? null : (
              <Button onClick={() => setShowForm(true)} disabled={!data || data.vehicles.length === 0}>
                <Plus className="h-4 w-4" aria-hidden />
                記録を追加
              </Button>
            )}
          </>
        }
      />
      {error ? <ErrorMessage message={error} /> : null}
      {loading && !data ? <Skeleton className="h-80" /> : null}

      {data ? (
        <div className="space-y-4">
          {showForm ? (
            <Card>
              <CardHeader title="点検・整備記録の追加" />
              <div className="p-4 sm:p-5">
                <MaintenanceForm
                  vehicles={sortedVehicles}
                  onCancel={() => setShowForm(false)}
                  onSubmit={async ({ record, nextInspectionDate }) => {
                    await repository.createMaintenance(record);
                    const vehicle = data.vehicles.find((v) => v.id === record.vehicleId);
                    const patch: { inspectionDueDate?: string; mileage?: number } = {};
                    if (nextInspectionDate) patch.inspectionDueDate = nextInspectionDate;
                    if (vehicle && record.mileage !== null && record.mileage > vehicle.mileage) patch.mileage = record.mileage;
                    if (Object.keys(patch).length > 0) await repository.updateVehicle(record.vehicleId, patch);
                    setShowForm(false);
                    notifyChanged();
                  }}
                />
              </div>
            </Card>
          ) : null}

          <Card className="grid gap-3 p-4 sm:grid-cols-2">
            <Select aria-label="区分で絞り込み" value={category} onChange={(e) => setCategory(e.target.value as MaintenanceCategory | "all")}>
              <option value="all">区分：すべて</option>
              {MAINTENANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {MAINTENANCE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
            <Select aria-label="車両で絞り込み" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">車両：すべて</option>
              {sortedVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber}（{v.name}）
                </option>
              ))}
            </Select>
          </Card>

          <Card>
            {filtered.length === 0 ? (
              <EmptyState title="該当する記録はありません" />
            ) : (
              <MaintenanceList records={filtered} vehicles={data.vehicles} onDelete={setDeleting} />
            )}
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="この記録を削除しますか？"
        message={deleting ? `「${deleting.description}」を削除します。この操作は取り消せません。` : ""}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await repository.deleteMaintenance(deleting.id);
            setDeleting(null);
            notifyChanged();
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
