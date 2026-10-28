-- 本番環境の動作確認用サンプル（すべて架空データ）
-- 使い方: Authentication > Users でユーザーを作成し、その UUID を下記 owner に設定して
--         SQL Editor で実行してください。

do $$
declare
  owner uuid := '00000000-0000-0000-0000-000000000000'; -- ← 置き換える
  v1 uuid;
  v2 uuid;
begin
  insert into public.vehicles (owner_id, plate_number, name, maker, model, vehicle_type, year, department, assignee, mileage, inspection_due_date, status)
  values (owner, 'デモ 300 あ 10-01', '営業車1号', 'サンプル自動車', 'SX-100', 'sedan', 2021, '営業部', '営業部 担当A', 48210, current_date + 20, 'active')
  returning id into v1;

  insert into public.vehicles (owner_id, plate_number, name, maker, model, vehicle_type, year, department, assignee, mileage, inspection_due_date, status)
  values (owner, 'デモ 400 う 30-21', '配送バン1号', 'テスト工業', 'TV-Cargo', 'van', 2018, '物流部', '物流部 担当A', 152400, current_date - 5, 'maintenance')
  returning id into v2;

  insert into public.maintenance_records (owner_id, vehicle_id, performed_on, category, description, cost, mileage, vendor)
  values
    (owner, v1, current_date - 10, 'periodic', '12ヶ月法定点検', 24200, 48000, 'サンプル整備工場（架空）'),
    (owner, v2, current_date - 3, 'repair', 'ブレーキパッド交換', 46500, 152400, 'テストオートサービス（架空）');
end $$;
