-- 車両管理システム 初期スキーマ
-- Supabase ダッシュボードの SQL Editor に貼り付けて実行するか、`supabase db push` で適用してください。

create extension if not exists pgcrypto;

-- 車両台帳 ------------------------------------------------------------------
create table if not exists public.vehicles (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plate_number        text not null check (char_length(plate_number) between 1 and 30),
  name                text not null check (char_length(name) between 1 and 50),
  maker               text not null default '' check (char_length(maker) <= 30),
  model               text not null default '' check (char_length(model) <= 30),
  vehicle_type        text not null default 'sedan'
                        check (vehicle_type in ('sedan', 'kei', 'van', 'truck', 'other')),
  year                integer check (year between 1950 and 2100),
  department          text not null default '' check (char_length(department) <= 30),
  assignee            text not null default '' check (char_length(assignee) <= 30),
  mileage             integer not null default 0 check (mileage between 0 and 9999999),
  inspection_due_date date not null,
  insurance_due_date  date,
  status              text not null default 'active'
                        check (status in ('active', 'maintenance', 'standby', 'retired')),
  notes               text not null default '' check (char_length(notes) <= 500),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists vehicles_owner_due_idx on public.vehicles (owner_id, inspection_due_date);

-- 点検・整備履歴 --------------------------------------------------------------
create table if not exists public.maintenance_records (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,
  performed_on date not null,
  category     text not null
                 check (category in ('shaken', 'periodic', 'repair', 'oil', 'tire', 'other')),
  description  text not null check (char_length(description) between 1 and 200),
  cost         integer not null default 0 check (cost between 0 and 99999999),
  mileage      integer check (mileage between 0 and 9999999),
  vendor       text not null default '' check (char_length(vendor) <= 50),
  created_at   timestamptz not null default now()
);

create index if not exists maintenance_owner_date_idx
  on public.maintenance_records (owner_id, performed_on desc);
create index if not exists maintenance_vehicle_idx on public.maintenance_records (vehicle_id);

-- updated_at 自動更新 ----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- Row Level Security: ログインユーザーは自分のデータのみ操作可能 ---------------
alter table public.vehicles enable row level security;
alter table public.maintenance_records enable row level security;

create policy "vehicles_select_own" on public.vehicles
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "vehicles_insert_own" on public.vehicles
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "vehicles_update_own" on public.vehicles
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "vehicles_delete_own" on public.vehicles
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "maintenance_select_own" on public.maintenance_records
  for select to authenticated using ((select auth.uid()) = owner_id);
-- 他人の車両に記録を紐づけられないよう、車両の所有者も確認する
create policy "maintenance_insert_own" on public.maintenance_records
  for insert to authenticated with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id and v.owner_id = (select auth.uid())
    )
  );
create policy "maintenance_delete_own" on public.maintenance_records
  for delete to authenticated using ((select auth.uid()) = owner_id);
