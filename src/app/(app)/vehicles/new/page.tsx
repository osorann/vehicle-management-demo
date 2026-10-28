"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/session/session-provider";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/feedback";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { emptyVehicleForm } from "@/lib/validation";

export default function NewVehiclePage() {
  const router = useRouter();
  const { repository, notifyChanged } = useSession();
  // 保存後に画面が非表示で保持されても、次回は空のフォームから始める
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <PageHeader title="車両を登録" description="必須項目を入力して保存してください。" />
      <Card className="p-4 sm:p-6">
        <VehicleForm
          key={formKey}
          initialValues={emptyVehicleForm()}
          submitLabel="登録する"
          onCancel={() => router.back()}
          onSubmit={async (input) => {
            const created = await repository.createVehicle(input);
            notifyChanged();
            setFormKey((k) => k + 1);
            router.push(`/vehicles/${created.id}`);
          }}
        />
      </Card>
    </>
  );
}
