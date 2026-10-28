"use client";

import { useParams, useRouter } from "next/navigation";
import { useRepositoryQuery, useSession } from "@/components/session/session-provider";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorMessage, PageHeader, Skeleton } from "@/components/ui/feedback";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { vehicleToForm } from "@/lib/validation";

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { repository, notifyChanged } = useSession();
  const { data: vehicle, error, loading } = useRepositoryQuery((repo) => repo.getVehicle(id), [id]);

  return (
    <>
      <PageHeader title="車両情報の編集" description={vehicle ? vehicle.plateNumber : undefined} />
      {error ? <ErrorMessage message={error} /> : null}
      {loading && !vehicle ? <Skeleton className="h-96" /> : null}
      {!loading && !vehicle && !error ? (
        <Card>
          <EmptyState title="車両が見つかりません" />
        </Card>
      ) : null}
      {vehicle ? (
        <Card className="p-4 sm:p-6">
          <VehicleForm
            key={`${vehicle.id}-${vehicle.updatedAt}`}
            initialValues={vehicleToForm(vehicle)}
            submitLabel="変更を保存"
            onCancel={() => router.back()}
            onSubmit={async (input) => {
              await repository.updateVehicle(vehicle.id, input);
              notifyChanged();
              router.push(`/vehicles/${vehicle.id}`);
            }}
          />
        </Card>
      ) : null}
    </>
  );
}
