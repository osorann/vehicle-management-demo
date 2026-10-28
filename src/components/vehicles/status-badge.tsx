import { Badge, type BadgeTone } from "@/components/ui/badge";
import { STATUS_LABELS, type VehicleStatus } from "@/lib/types";

const STATUS_TONES: Record<VehicleStatus, BadgeTone> = {
  active: "blue",
  maintenance: "amber",
  standby: "slate",
  retired: "slate",
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
