import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { field, isMobile, startDemo } from "./helpers";

test("未ログインではログイン画面へ誘導され、デモと本番が分離表示される", async ({ page }) => {
  await page.goto("/vehicles");
  await expect(page).toHaveURL(/\/login\?next=%2Fvehicles/);
  await expect(page.getByRole("heading", { name: "本番ログイン" })).toBeVisible();
  await expect(page.getByText("本番ログインは未設定です")).toBeVisible();
  await expect(page.getByRole("heading", { name: "デモモードで試す" })).toBeVisible();
});

test("ダッシュボードに指標・期限アラート・グラフが表示される", async ({ page }) => {
  await startDemo(page);
  await expect(page.getByText("デモモード", { exact: true })).toBeVisible();
  await expect(page.getByText("登録車両")).toBeVisible();
  await expect(page.getByText("車検期限切れ")).toBeVisible();
  const alerts = page.getByRole("list", { name: "車検期限アラート一覧" });
  await expect(alerts.getByRole("listitem").first()).toContainText("期限切れ");
  await expect(page.getByRole("img", { name: "今後12ヶ月の車検満了台数（月別）" })).toBeVisible();
  await expect(page.getByRole("img", { name: "過去6ヶ月の整備費用（月別）" })).toBeVisible();
});

test("車両の登録・整備記録の追加・編集・削除ができる", async ({ page }) => {
  await startDemo(page);
  await page.goto("/vehicles/new");

  await page.getByRole("button", { name: "登録する" }).click();
  await expect(page.getByText("登録番号を入力してください")).toBeVisible();

  await field(page, /登録番号/).fill("デモ 500 さ 77-77");
  await field(page, /車名・管理名/).fill("E2Eテスト車");
  await field(page, /車検満了日/).fill("2030-04-01");
  await field(page, /走行距離/).fill("1000");
  await page.getByRole("button", { name: "登録する" }).click();

  await expect(page.getByRole("heading", { name: "デモ 500 さ 77-77" })).toBeVisible();

  // 整備記録を追加（車検 → 次回満了日で車両情報も更新）
  await page.getByRole("button", { name: "記録を追加" }).click();
  await field(page, /区分/).selectOption("shaken");
  await field(page, /^内容/).fill("継続車検（E2E）");
  await field(page, /費用/).fill("88000");
  await field(page, /実施時の走行距離/).fill("1500");
  await field(page, /次回車検満了日/).fill("2032-04-01");
  await page.getByRole("button", { name: "記録を追加" }).click();
  await expect(page.getByText("継続車検（E2E）")).toBeVisible();
  await expect(page.getByText("2032年4月1日")).toBeVisible();
  await expect(page.getByText("1,500 km").first()).toBeVisible();

  // 編集
  await page.getByRole("link", { name: "編集" }).click();
  await field(page, /車名・管理名/).fill("E2Eテスト車（更新）");
  await page.getByRole("button", { name: "変更を保存" }).click();
  await expect(page.getByText("E2Eテスト車（更新）")).toBeVisible();

  // 削除
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "削除する" }).click();
  await expect(page).toHaveURL(/\/vehicles$/);
  await field(page, "キーワード検索").fill("77-77");
  await expect(page.getByText("条件に一致する車両がありません")).toBeVisible();
});

test("検索・絞り込みとCSV出力ができる", async ({ page }) => {
  await startDemo(page);
  await page.goto("/vehicles");
  await expect(page.getByText(/全16台/)).toBeVisible();

  await field(page, "キーワード検索").fill("トラック");
  await expect(page).toHaveURL(/q=/);
  await expect(page.getByText(/4台を表示/)).toBeVisible();

  await field(page, "車検状況").selectOption("expired");
  await expect(page.getByText(/1台を表示/)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV出力" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^vehicles_\d{8}\.csv$/);
  const content = await readFile((await download.path())!, "utf8");
  expect(content.charCodeAt(0)).toBe(0xfeff);
  const lines = content.slice(1).split("\r\n");
  expect(lines[0]).toContain("登録番号,車名");
  expect(lines).toHaveLength(2);
  expect(lines[1]).toContain("2tトラック1号");

  await page.getByRole("button", { name: "条件をクリア" }).click();
  await expect(page.getByText(/16台を表示/)).toBeVisible();
});

test("ダッシュボードのアラートから期限切れ車両に絞り込める", async ({ page }) => {
  await startDemo(page);
  await page.getByRole("link", { name: /車検期限切れ/ }).click();
  await expect(page).toHaveURL(/inspection=expired/);
  await expect(field(page, "車検状況")).toHaveValue("expired");
  await expect(page.getByText(/2台を表示/)).toBeVisible();
});

test("スマホではタブバーとカード表示になる", async ({ page }) => {
  test.skip(!isMobile(page), "モバイル表示のみ");
  await startDemo(page);
  const tabbar = page.getByRole("navigation", { name: "モバイルメニュー" });
  await expect(tabbar).toBeVisible();
  await tabbar.getByRole("link", { name: "車両" }).click();
  await expect(page.getByRole("list", { name: "車両リスト" })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  // 横スクロールが発生していないこと
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("デモを終了するとログイン画面に戻る", async ({ page }) => {
  await startDemo(page);
  await page.getByRole("button", { name: /デモを終了|終了/ }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
