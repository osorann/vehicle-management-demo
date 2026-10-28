import { describe, expect, it } from "vitest";
import { createDemoDataset } from "@/lib/demo/seed";
import { describeDaysLeft, getInspectionLevel, getInspectionState, needsAttention } from "./inspection";

const TODAY = "2026-10-28";

describe("inspection", () => {
  it.each([
    [-1, "expired"],
    [0, "urgent"],
    [30, "urgent"],
    [31, "warning"],
    [60, "warning"],
    [61, "ok"],
  ] as const)("days left %i → %s", (days, level) => {
    expect(getInspectionLevel(days)).toBe(level);
  });

  it("builds a readable state from dates", () => {
    expect(getInspectionState("2026-10-20", TODAY)).toEqual({
      level: "expired",
      daysLeft: -8,
      label: "8日超過",
    });
    expect(getInspectionState("2026-11-07", TODAY).label).toBe("残り10日");
    expect(describeDaysLeft(0)).toBe("本日期限");
  });

  it("excludes retired vehicles from alerts", () => {
    const [vehicle] = createDemoDataset(TODAY).vehicles;
    const expired = { ...vehicle, inspectionDueDate: "2026-01-01" };
    expect(needsAttention(expired, TODAY)).toBe(true);
    expect(needsAttention({ ...expired, status: "retired" }, TODAY)).toBe(false);
  });
});
