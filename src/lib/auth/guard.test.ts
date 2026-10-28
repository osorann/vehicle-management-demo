import { describe, expect, it } from "vitest";
import { hasDemoCookie } from "./demo-session";
import { decideRoute, safeNextPath } from "./guard";

const base = { demoEnabled: true, hasDemoCookie: false, hasProductionUser: false };

describe("decideRoute", () => {
  it("redirects anonymous users to login with next param", () => {
    expect(decideRoute({ ...base, pathname: "/vehicles" })).toEqual({
      action: "redirect",
      to: "/login?next=%2Fvehicles",
    });
  });

  it("allows the login page for anyone", () => {
    expect(decideRoute({ ...base, pathname: "/login" })).toEqual({ action: "allow" });
  });

  it("allows demo sessions only when demo is enabled", () => {
    expect(decideRoute({ ...base, hasDemoCookie: true, pathname: "/dashboard" })).toEqual({ action: "allow" });
    expect(
      decideRoute({ ...base, demoEnabled: false, hasDemoCookie: true, pathname: "/dashboard" }),
    ).toEqual({ action: "redirect", to: "/login", clearDemoCookie: true });
  });

  it("allows authenticated production users", () => {
    expect(decideRoute({ ...base, demoEnabled: false, hasProductionUser: true, pathname: "/vehicles/1" })).toEqual({
      action: "allow",
    });
  });
});

describe("safeNextPath", () => {
  it.each([
    [null, "/dashboard"],
    ["/vehicles?inspection=expired", "/vehicles?inspection=expired"],
    ["https://evil.example", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("hasDemoCookie", () => {
  it("detects the demo cookie among others", () => {
    expect(hasDemoCookie("a=1; vehicle-demo-session=1; b=2")).toBe(true);
    expect(hasDemoCookie("vehicle-demo-session=0")).toBe(false);
    expect(hasDemoCookie("")).toBe(false);
  });
});
