-- 43_crowd_ble_precheck.sql
-- Diagnosi lato DB del sottosistema crowd/BLE (un solo result set finale).
-- Verifica: esistenza crowd_predictions, colonne/NOT NULL, RLS, policy, grant,
-- righe; piu' tipo e valori di pois.crowd_level.
-- Nessuna scrittura.

create temporary table _crowd_diag(controllo text, esito text) on commit drop;

do $$
declare v_exists boolean; v_cnt text;
begin
  v_exists := to_regclass('public.crowd_predictions') is not null;
  insert into _crowd_diag values ('crowd_predictions', case when v_exists then 'ESISTE' else 'ASSENTE' end);
  if v_exists then
    execute 'select count(*)::text from public.crowd_predictions' into v_cnt;
  else
    v_cnt := 'n/d';
  end if;
  insert into _crowd_diag values ('righe', coalesce(v_cnt, '0'));
end $$;

insert into _crowd_diag
select 'colonne', coalesce(
  string_agg(column_name || ':' || data_type ||
             case when is_nullable = 'NO' then '!NN' else '' end,
             ', ' order by ordinal_position), 'n/d')
from information_schema.columns
where table_schema = 'public' and table_name = 'crowd_predictions';

insert into _crowd_diag
select 'RLS', coalesce(
  (select relrowsecurity::text from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'crowd_predictions'), 'n/d');

insert into _crowd_diag
select 'policy', coalesce(
  string_agg(policyname || '(' || cmd || ')', ', ' order by policyname), 'nessuna')
from pg_policies
where schemaname = 'public' and tablename = 'crowd_predictions';

insert into _crowd_diag
select 'grant authenticated', coalesce(
  string_agg(distinct privilege_type, ',' order by privilege_type), 'nessuno')
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'crowd_predictions'
  and grantee = 'authenticated';

insert into _crowd_diag
select 'grant anon', coalesce(
  string_agg(distinct privilege_type, ',' order by privilege_type), 'nessuno')
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'crowd_predictions'
  and grantee = 'anon';

insert into _crowd_diag
select 'crowd_level tipo', coalesce(
  (select data_type from information_schema.columns
   where table_schema = 'public' and table_name = 'pois' and column_name = 'crowd_level'), 'n/d');

insert into _crowd_diag
select 'crowd_level valori', coalesce(
  (select string_agg(distinct crowd_level::text, ', ') from public.pois), 'n/d');

select * from _crowd_diag;
