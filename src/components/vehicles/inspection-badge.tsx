import { AlertOctagon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  getInspectionState,
  INSPECTION_LEVEL_LABELS,
  type InspectionLevel,
} from "@/lib/domain/inspection";
import type { DateString } from "@/lib/types";

export const LEVEL_TONES: Record<InspectionLevel, BadgeTone> = {
  expired: "red",
  urgent: "amber",
  warning: "yellow",
  ok: "green",
};

const ICONS = {
  expired: AlertOctagon,
  urgent: AlertTriangle,
  warning: Clock,
  ok: CheckCircle2,
} as const;

export function InspectionBadge({
  dueDate,
  today,
  showDays = true,
}: {
  dueDate: DateString;
  today: DateString;
  showDays?: boolean;
}) {
  const state = getInspectionState(dueDate, today);
  const Icon = ICONS[state.level];
  return (
    <Badge tone={LEVEL_TONES[state.level]}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {INSPECTION_LEVEL_LABELS[state.level]}
      {showDays && state.level !== "ok" ? `（${state.label}）` : null}
    </Badge>
  );
}
