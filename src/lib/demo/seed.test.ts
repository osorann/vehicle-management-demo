import { describe, expect, it } from "vitest";
import { createDemoDataset } from "./seed";

const TODAY = "2026-10-28";

describe("demo seed data", () => {
  const { vehicles, records } = createDemoDataset(TODAY);

  it("is deterministic for the same day", () => {
    expect(createDemoDataset(TODAY)).toEqual(createDemoDataset(TODAY));
  });

  it("uses clearly fictional plate numbers and role-based assignees", () => {
    for (const v of vehicles) {
      expect(v.plateNumber.startsWith("デモ ")).toBe(true);
      expect(v.assignee).toMatch(/^.+部 担当[A-Z]$/);
    }
    for (const r of records) {
      expect(r.vendor).toContain("（架空）");
    }
  });

  it("contains no e-mail addresses or phone numbers", () => {
    const text = JSON.stringify({ vehicles, records });
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(/0\d{1,4}-\d{1,4}-\d{4}/);
  });

  it("always includes expired and upcoming inspections relative to today", () => {
    expect(vehicles.some((v) => v.inspectionDueDate < TODAY)).toBe(true);
    expect(vehicles.some((v) => v.inspectionDueDate >= TODAY && v.inspectionDueDate <= "2026-11-27")).toBe(true);
  });

  it("links every record to an existing vehicle", () => {
    const ids = new Set(vehicles.map((v) => v.id));
    expect(records.every((r) => ids.has(r.vehicleId))).toBe(true);
  });
});
