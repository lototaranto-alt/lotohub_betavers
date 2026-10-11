-- ============================================================================
-- 40 | M17 - FK ANAGRAFE catena reward (misura di partenza, read-only) v2
-- ============================================================================
-- CORREZIONE 09/10: 'xp_ledger' NON ESISTE (0 match in tutto il repo SQL e
-- relazione assente in DB => il primo run e' fallito con 42P01). La catena
-- reward reale e': user_pois, badges, badge_templates, user_badges,
-- impact_transactions (+ genitori profiles, pois). Nota su PIANO M17.
--
-- Un solo result set (sezione | oggetto | valore).
-- ROWCOUNT  : conteggi esatti delle tabelle della catena reward + genitori
-- FK        : vincoli di chiave esterna a cui la catena reward partecipa
--             (child.col -> parent.col | child_nullable | ondelete)
-- Nota: gli eventuali orfani reali saranno calcolati nel 41.
-- ============================================================================

select 'ROWCOUNT'::text as sezione,
       'user_pois'::text as oggetto,
       count(*)::text as valore
from public.user_pois

union all
select 'ROWCOUNT', 'badges', count(*)::text from public.badges
union all
select 'ROWCOUNT', 'badge_templates', count(*)::text from public.badge_templates
union all
select 'ROWCOUNT', 'user_badges', count(*)::text from public.user_badges
union all
select 'ROWCOUNT', 'impact_transactions', count(*)::text from public.impact_transactions
union all
select 'ROWCOUNT', 'profiles', count(*)::text from public.profiles
union all
select 'ROWCOUNT', 'pois', count(*)::text from public.pois
union all
select 'FK',
       quote_ident(tc.relname) || '.' || quote_ident(ac.attname)
         || ' -> ' || quote_ident(pr.relname) || '.' || quote_ident(pa.attname)
         || ' | child_nullable=' || (not ac.attnotnull)::text
         || ' | ondelete=' || case con.confdeltype
                when 'c' then 'CASCADE'
                when 'n' then 'SET NULL'
                when 'r' then 'RESTRICT'
                when 'a' then 'NO ACTION'
                when 'd' then 'SET DEFAULT'
                else con.confdeltype::text
              end,
       con.conname
from pg_constraint con
join pg_class tc on tc.oid = con.conrelid
join pg_namespace tn on tn.oid = tc.relnamespace
join pg_class pr on pr.oid = con.confrelid
join pg_namespace pn on pn.oid = pr.relnamespace
join pg_attribute ac on ac.attrelid = con.conrelid and ac.attnum = any(con.conkey)
join pg_attribute pa on pa.attrelid = con.confrelid and pa.attnum = any(con.confkey)
where con.contype = 'f'
  and tn.nspname = 'public'
  and pn.nspname = 'public'
  and (tc.relname in ('user_pois', 'badges', 'badge_templates', 'user_badges',
                      'impact_transactions')
    or pr.relname in ('user_pois', 'badges', 'badge_templates', 'user_badges',
                      'impact_transactions'))
order by sezione, oggetto;