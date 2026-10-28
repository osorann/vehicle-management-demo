import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Vercel で 404 NOT_FOUND にならないための構成チェック。
 * （フレームワーク未検出・トップページ欠落・ビルドスクリプト誤りを防ぐ）
 */
const root = join(__dirname, "..");
const readJson = (file: string) => JSON.parse(readFileSync(join(root, file), "utf8"));

describe("deployment config", () => {
  it("pins the Vercel framework preset to Next.js", () => {
    const vercel = readJson("vercel.json");
    expect(vercel.framework).toBe("nextjs");
    expect(vercel.outputDirectory).toBeUndefined();
  });

  it("keeps the Next.js app at the repository root", () => {
    const pkg = readJson("package.json");
    expect(pkg.dependencies.next).toBeDefined();
    expect(pkg.scripts.build).toBe("next build");
    expect(existsSync(join(root, "src/app/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/app/layout.tsx"))).toBe(true);
    expect(existsSync(join(root, "src/proxy.ts"))).toBe(true);
  });

  it("does not use static export, which would drop the proxy and dynamic routes", () => {
    const config = readFileSync(join(root, "next.config.ts"), "utf8");
    expect(config).not.toMatch(/output:\s*["']export["']/);
  });
});
