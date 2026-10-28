import { describe, expect, it } from "vitest";
import { createDemoDataset } from "@/lib/demo/seed";
import { csvFilename, escapeCsvCell, maintenanceToCsv, toCsv, vehiclesToCsv } from "./csv";

const TODAY = "2026-10-28";

describe("csv", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(-5)).toBe("-5");
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(escapeCsvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvCell("+1")).toBe("'+1");
    expect(escapeCsvCell("@SUM")).toBe("'@SUM");
  });

  it("joins rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[1, 2]])).toBe("a,b\r\n1,2");
  });

  it("exports vehicles with Japanese headers and labels", () => {
    const { vehicles } = createDemoDataset(TODAY);
    const lines = vehiclesToCsv(vehicles, TODAY).split("\r\n");
    expect(lines).toHaveLength(vehicles.length + 1);
    expect(lines[0]).toMatch(/^登録番号,車名,メーカー/);
    expect(lines[1]).toContain("期限切れ");
    expect(lines[1]).toContain("稼働中");
  });

  it("exports maintenance records joined with vehicle info", () => {
    const { vehicles, records } = createDemoDataset(TODAY);
    const lines = maintenanceToCsv(records.slice(0, 1), vehicles).split("\r\n");
    expect(lines[1]).toContain("デモ 300 あ 10-01");
    expect(lines[1]).toContain("オイル交換");
  });

  it("builds a dated filename", () => {
    expect(csvFilename("vehicles", TODAY)).toBe("vehicles_20261028.csv");
  });
});
