# 車両管理システム（デモ）

企業向けの車両管理Webアプリです。車両台帳、車検期限アラート、点検・整備履歴、CSV出力、管理ダッシュボードの機能があります。**データベースや認証を設定しなくても、架空データを使う「デモモード」ですぐに動かせます。**

- フレームワーク: Next.js 16（App Router）/ React 19 / TypeScript
- UI: Tailwind CSS v4 / lucide-react / Recharts
- バックエンド: Supabase（Auth + Postgres + RLS）※任意
- テスト: Vitest + Testing Library（単体・コンポーネント）/ Playwright（E2E、PC・iPhone表示）
- CI: GitHub Actions　/　ホスティング: Vercel（無料枠で運用できる構成）

## 主な機能

| 機能 | 内容 |
| --- | --- |
| ログイン | Supabase Auth（メール + パスワード）。未ログインのアクセスは `proxy.ts` でログイン画面へ転送 |
| 車両の登録・編集・削除 | 入力チェック（必須項目、日付、数値。全角数字・カンマも可）、削除前の確認ダイアログ |
| 車検期限の管理 | 「期限切れ」「30日以内」「60日以内」「余裕あり」の4段階で色分け表示。詳細画面に警告を表示 |
| 点検・整備履歴 | 区分・費用・走行距離・業者を記録。車検の記録を付けると、次回満了日で車両情報も更新 |
| 検索・絞り込み | キーワード（登録番号・車名・部署・担当・車種）、車検状況、ステータス、車種、部署、並び替え。条件はURLに保存 |
| CSV出力 | 絞り込み結果をUTF-8（BOM付き）で出力するのでExcelでも文字化けしない。数式インジェクション対策済み |
| ダッシュボード | 主要指標、期限アラート一覧、今後12ヶ月の車検満了数、過去6ヶ月の整備費用、ステータス別台数 |
| スマホ対応 | 下部タブバー、カード型の一覧、44px以上のタップ領域、iOSで自動ズームしない入力欄、ノッチ（safe-area）対応 |

## クイックスタート（デモモード）

```bash
npm ci
npm run dev
# http://localhost:3000 → 「デモを開始する」
```

環境変数を設定していない場合は、自動でデモモードだけが使える状態になります。

## デモモードと本番モードの分離

| | デモモード | 本番モード |
| --- | --- | --- |
| 有効になる条件 | Supabase 未設定、または `NEXT_PUBLIC_ENABLE_DEMO=true` | Supabase の URL とキーを設定 |
| 認証 | ログイン不要（専用クッキー `vehicle-demo-session`） | Supabase Auth のセッション |
| データの保存先 | ブラウザの localStorage（`vehicle-demo:data:v1`）だけ | Supabase Postgres（RLS で本人のデータのみ） |
| データ内容 | 架空のサンプル（登録番号は「デモ」地名、担当者は「部署 担当A」形式、業者名には「（架空）」） | 実データ |
| 画面上の表示 | 「DEMO」バッジ + 黄色の注意バナー | 「本番」バッジ |

分離の仕組み:

- デモ中は Supabase SDK を読み込まず、Supabase には一切通信しません（`SessionProvider` と `proxy.ts` で分岐）
- 本番でログインするとデモ用クッキーを破棄し、デモを始めると本番のセッションをサインアウトします
- Supabase を設定した環境では、デモは**初期状態で無効**です。デモを無効にした環境にデモ用クッキーが残っていても、`proxy.ts` が破棄します
- 画面からは `VehicleRepository` インターフェースだけを使います。デモ用（`DemoRepository`）と本番用（`SupabaseRepository`）の実装を切り替えています

## 本番モードのセットアップ

1. [Supabase](https://supabase.com/) で無料プロジェクトを作成します
2. SQL Editor で `supabase/migrations/20261028000000_init.sql` を実行します（テーブル、制約、RLS ポリシーが作成されます）
3. Authentication > Sign In / Providers で **「Allow new users to sign up」を OFF** にします（社内利用を想定し、管理者がユーザーを招待する運用）
4. Authentication > Users でユーザーを作成または招待します
5. `.env.example` を `.env.local` にコピーし、`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定します
6. （任意）`supabase/seed.sql` で動作確認用の架空データを投入します

> RLS により、各ユーザーは自分が登録した車両と履歴だけを読み書きできます。部署やチームで共有したい場合は、`organization_id` 列と所属テーブルを追加してポリシーを拡張してください。

## Vercel へのデプロイ

1. Vercel で GitHub リポジトリをインポートします（Framework Preset: Next.js。ビルド設定は既定のままで構いません）
2. **デモ公開用**: 環境変数を設定せずにデプロイすると、デモモードだけのサイトになります
3. **本番運用**: Environment Variables に Supabase の 2 変数を設定します。デモも並べて公開したい場合は `NEXT_PUBLIC_ENABLE_DEMO=true` も設定します
4. Supabase の Authentication > URL Configuration の Site URL に Vercel の URL を登録します

`NEXT_PUBLIC_*` はビルド時に埋め込まれるため、値を変えたら再デプロイが必要です。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` / `npm start` | 本番ビルド / 起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 型チェック |
| `npm test` | Vitest（単体・コンポーネントテスト） |
| `npm run test:e2e` | Playwright E2E（事前に `npm run build`。初回は `npx playwright install chromium`） |
| `npm run check` | lint + typecheck + test |

GitHub Actions（`.github/workflows/ci.yml`）では、push と PR のたびに lint、型チェック、単体テスト、ビルド、E2E（デスクトップと iPhone 表示）を実行します。

## ディレクトリ構成

```
src/
├─ app/
│  ├─ login/                 ログイン画面（本番ログインとデモ入口を別枠で表示）
│  └─ (app)/                 ログイン後の画面（dashboard / vehicles / maintenance）
├─ components/               UI 部品・レイアウト・フォーム・グラフ
├─ lib/
│  ├─ domain/                日付・車検判定・絞り込み・集計（純粋関数、テストあり）
│  ├─ data/                  Repository インターフェースとデモ / Supabase 実装
│  ├─ demo/seed.ts           架空サンプルデータ（今日の日付を基準に生成）
│  ├─ auth/                  デモセッション・ルーティングガード
│  ├─ csv.ts, validation.ts  CSV 生成、入力チェック（zod）
│  └─ config.ts              環境変数からモードを判定
└─ proxy.ts                  認証ガード（Next.js 16 の Proxy。旧 Middleware）
supabase/                    マイグレーション SQL・サンプル投入 SQL
e2e/                         Playwright テスト
```

## セキュリティ上の配慮

- Supabase の RLS で、データへのアクセスをユーザー本人に限定（記録の追加時は車両の所有者も確認）
- DB 側でも CHECK 制約で値の範囲と文字数を検証
- ログイン後の遷移先（`?next=`）はアプリ内のパスだけを許可し、オープンリダイレクトを防止
- CSV の数式インジェクション対策、セキュリティヘッダー（`X-Frame-Options` など）の付与
- 検索エンジンにインデックスさせない（`robots: noindex`）
