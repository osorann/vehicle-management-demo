import { expect, type Page } from "@playwright/test";

export async function startDemo(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: "デモを開始する" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible();
}

export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1280) < 768;
}

/**
 * Cache Components 有効時は直前の画面が非表示のまま DOM に残るため、表示中の要素だけを対象にする
 */
export function field(page: Page, label: string | RegExp) {
  return page.getByLabel(label).filter({ visible: true });
}
