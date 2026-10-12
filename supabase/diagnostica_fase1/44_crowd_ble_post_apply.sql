-- 44_crowd_ble_post_apply.sql
-- Post-apply: verifica che la RPC esista, che la vista aggregata esista/grants,
-- e lo stato dati. Un solo result set. Nessuna scrittura.

select 'function process_crowd_radar' as controllo,
       case when exists (
         select 1 from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
         where n.nspname = 'public' and p.proname = 'process_crowd_radar'
       ) then 'ESISTE' else 'ASSENTE' end as esito
union all
select 'exec authenticated sulla RPC', coalesce(
  (select string_agg(distinct privilege_type, ',')
   from information_schema.role_routine_grants
   where routine_schema = 'public' and routine_name = 'process_crowd_radar'
     and grantee = 'authenticated'), 'nessuno')
union all
select 'exec anon sulla RPC', coalesce(
  (select string_agg(distinct privilege_type, ',')
   from information_schema.role_routine_grants
   where routine_schema = 'public' and routine_name = 'process_crowd_radar'
     and grantee = 'anon'), 'nessuno')
union all
select 'righe crowd_predictions',
       (select count(*)::text from public.crowd_predictions)
union all
select 'RLS crowd_predictions',
       (select relrowsecurity::text from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname = 'crowd_predictions')
union all
select 'policy crowd_predictions', coalesce(
  (select string_agg(policyname, ',') from pg_policies
   where schemaname = 'public' and tablename = 'crowd_predictions'), 'nessuna')
union all
select 'vista vw_poi_crowd_now', case
  when to_regclass('public.vw_poi_crowd_now') is not null then 'ESISTE'
  else 'ASSENTE' end
union all
select 'grant authenticated vista', coalesce(
  (select string_agg(distinct privilege_type, ',')
   from information_schema.role_table_grants
   where table_schema = 'public' and table_name = 'vw_poi_crowd_now'
     and grantee = 'authenticated'), 'nessuno')
union all
select 'righe vista (poi con crowd)',
       (select count(*)::text from public.vw_poi_crowd_now);
