import { describe, expect, it } from "vitest";
import { addDays, addMonths, daysBetween, formatJaDate, isValidDateString, todayString } from "./dates";

describe("dates", () => {
  it("validates calendar dates strictly", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-13-01")).toBe(false);
    expect(isValidDateString("2026/01/01")).toBe(false);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("clamps the day when adding months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-05-15", -6)).toBe("2025-11-15");
  });

  it("computes signed day differences", () => {
    expect(daysBetween("2026-10-28", "2026-11-27")).toBe(30);
    expect(daysBetween("2026-10-28", "2026-10-20")).toBe(-8);
  });

  it("formats dates in Japanese", () => {
    expect(formatJaDate("2026-04-01")).toBe("2026年4月1日");
    expect(formatJaDate(null)).toBe("—");
  });

  it("uses the local calendar date for today", () => {
    expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
