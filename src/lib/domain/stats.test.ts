import { describe, expect, it } from "vitest";
import { createDemoDataset } from "@/lib/demo/seed";
import {
  attentionList,
  formatYen,
  inspectionDueByMonth,
  maintenanceCostByMonth,
  statusBreakdown,
  summarize,
} from "./stats";

const TODAY = "2026-10-28";
const { vehicles, records } = createDemoDataset(TODAY);

describe("stats", () => {
  it("summarizes inspection alerts excluding retired vehicles", () => {
    const summary = summarize(vehicles, records, TODAY);
    expect(summary.totalVehicles).toBe(vehicles.length);
    expect(summary.expired).toBe(2);
    expect(summary.urgent).toBe(3);
    expect(summary.warning).toBe(3);
    expect(summary.costThisMonth).toBeGreaterThan(0);
  });

  it("orders attention list by due date", () => {
    const list = attentionList(vehicles, TODAY);
    expect(list).toHaveLength(8);
    expect(list[0].inspectionDueDate < list[1].inspectionDueDate).toBe(true);
  });

  it("buckets upcoming inspections into 12 months", () => {
    const buckets = inspectionDueByMonth(vehicles, TODAY);
    expect(buckets).toHaveLength(12);
    expect(buckets[0]).toMatchObject({ month: "2026-10", label: "10月" });
    expect(buckets[11].month).toBe("2027-09");
  });

  it("sums maintenance costs for the last 6 months", () => {
    const buckets = maintenanceCostByMonth(records, TODAY);
    expect(buckets.map((b) => b.month)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    const inRange = records.filter((r) => r.performedOn >= "2026-05-01").reduce((s, r) => s + r.cost, 0);
    expect(buckets.reduce((s, b) => s + b.value, 0)).toBe(inRange);
  });

  it("counts every status", () => {
    const slices = statusBreakdown(vehicles);
    expect(slices.reduce((s, x) => s + x.value, 0)).toBe(vehicles.length);
  });

  it("formats yen", () => {
    expect(formatYen(1234567)).toBe("¥1,234,567");
  });
});
