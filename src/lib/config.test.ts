import { describe, expect, it } from "vitest";
import { resolveAppConfig } from "./config";

describe("resolveAppConfig", () => {
  it("falls back to demo-only mode when Supabase is not configured", () => {
    expect(resolveAppConfig({})).toMatchObject({ supabaseConfigured: false, demoEnabled: true });
  });

  it("disables demo by default once Supabase is configured", () => {
    const config = resolveAppConfig({ supabaseUrl: "https://x.supabase.co", supabaseKey: "key" });
    expect(config).toMatchObject({ supabaseConfigured: true, demoEnabled: false });
  });

  it("allows explicitly enabling demo alongside production", () => {
    const config = resolveAppConfig({
      supabaseUrl: "https://x.supabase.co",
      supabaseKey: "key",
      enableDemo: "true",
    });
    expect(config.demoEnabled).toBe(true);
  });

  it("can disable demo even without Supabase", () => {
    expect(resolveAppConfig({ enableDemo: "false" }).demoEnabled).toBe(false);
  });

  it("treats an invalid URL as not configured", () => {
    expect(resolveAppConfig({ supabaseUrl: "not-a-url", supabaseKey: "key" }).supabaseConfigured).toBe(false);
  });
});
