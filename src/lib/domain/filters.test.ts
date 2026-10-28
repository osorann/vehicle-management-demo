import { describe, expect, it } from "vitest";
import { createDemoDataset } from "@/lib/demo/seed";
import {
  DEFAULT_FILTER,
  filterFromParams,
  filterToParams,
  filterVehicles,
  listDepartments,
  normalizeText,
} from "./filters";

const TODAY = "2026-10-28";
const { vehicles } = createDemoDataset(TODAY);

describe("filterVehicles", () => {
  it("returns all vehicles sorted by inspection date by default", () => {
    const result = filterVehicles(vehicles, DEFAULT_FILTER, TODAY);
    expect(result).toHaveLength(vehicles.length);
    const dates = result.map((v) => v.inspectionDueDate);
    expect(dates).toEqual([...dates].sort());
  });

  it("searches across plate, name, department and assignee", () => {
    expect(filterVehicles(vehicles, { ...DEFAULT_FILTER, keyword: "トラック" }, TODAY).length).toBeGreaterThan(0);
    const byPlate = filterVehicles(vehicles, { ...DEFAULT_FILTER, keyword: "40-31" }, TODAY);
    expect(byPlate.map((v) => v.name)).toEqual(["2tトラック1号"]);
    const byAssignee = filterVehicles(vehicles, { ...DEFAULT_FILTER, keyword: "物流部 担当A" }, TODAY);
    expect(byAssignee).toHaveLength(1);
  });

  it("normalizes full-width characters and spaces", () => {
    expect(normalizeText("ＳＸ－１００　Ａ")).toBe(normalizeText("sx-100a"));
    const result = filterVehicles(vehicles, { ...DEFAULT_FILTER, keyword: "ＳＸ－１００" }, TODAY);
    expect(result.length).toBe(2);
  });

  it("filters by inspection level, status and department together", () => {
    const expired = filterVehicles(vehicles, { ...DEFAULT_FILTER, inspection: "expired" }, TODAY);
    expect(expired.length).toBeGreaterThan(0);
    expect(expired.every((v) => v.inspectionDueDate < TODAY)).toBe(true);

    const result = filterVehicles(
      vehicles,
      { ...DEFAULT_FILTER, status: "active", department: "物流部", vehicleType: "van" },
      TODAY,
    );
    expect(result.length).toBe(3);
    expect(result.every((v) => v.department === "物流部" && v.status === "active")).toBe(true);
  });

  it("sorts by mileage descending", () => {
    const result = filterVehicles(vehicles, { ...DEFAULT_FILTER, sort: "mileage" }, TODAY);
    expect(result[0].mileage).toBe(Math.max(...vehicles.map((v) => v.mileage)));
  });

  it("lists unique departments", () => {
    expect(listDepartments(vehicles)).toEqual(["サービス部", "営業部", "総務部", "物流部"].sort((a, b) => a.localeCompare(b, "ja")));
  });
});

describe("URL params", () => {
  it("round-trips a filter", () => {
    const filter = { ...DEFAULT_FILTER, keyword: "営業", inspection: "urgent" as const, sort: "plate" as const };
    expect(filterFromParams(filterToParams(filter))).toEqual(filter);
  });

  it("falls back to defaults for invalid values", () => {
    const filter = filterFromParams(new URLSearchParams("status=hacked&inspection=x&sort=evil"));
    expect(filter).toEqual(DEFAULT_FILTER);
  });
});
