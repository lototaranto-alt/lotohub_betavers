-- ============================================================================
-- 41 | M17 - SCAN ORPHAN catena reward (read-only)
-- ============================================================================
-- Calcola, per ogni FK della catena reward misurata nel 40, quante righe del
-- figlio NON hanno una riga valida nel genitore (orfani reali, FK non NULL).
-- ROWCOUNT base (40): badge_templates 0 | badges 3 | impact_transactions 0 |
-- pois 69 | profiles 50 | user_badges 0 | user_pois 5.
-- Un solo result set:
--   ORPHAN child.col -> parent | <conteggio righe senza genitore>
--   NULLFK child.col            | <conteggio righe con FK NULL (non orfane)>
-- ============================================================================

select 'ORPHAN'::text as sezione,
       'user_pois.poi_id -> pois.id'::text as oggetto,
       count(*)::text as valore
from public.user_pois up
left join public.pois p on p.id = up.poi_id
where up.poi_id is not null and p.id is null

union all
select 'ORPHAN', 'user_pois.profile_id -> profiles.id',
       count(*)::text
from public.user_pois up
left join public.profiles pr on pr.id = up.profile_id
where up.profile_id is not null and pr.id is null

union all
select 'ORPHAN', 'user_badges.badge_id -> badges.id',
       count(*)::text
from public.user_badges ub
left join public.badges b on b.id = ub.badge_id
where ub.badge_id is not null and b.id is null

union all
select 'ORPHAN', 'user_badges.user_id -> profiles.id',
       count(*)::text
from public.user_badges ub
left join public.profiles pr on pr.id = ub.user_id
where ub.user_id is not null and pr.id is null

union all
select 'ORPHAN', 'impact_transactions.poi_id -> pois.id',
       count(*)::text
from public.impact_transactions it
left join public.pois p on p.id = it.poi_id
where it.poi_id is not null and p.id is null

union all
select 'ORPHAN', 'impact_transactions.profile_id -> profiles.id',
       count(*)::text
from public.impact_transactions it
left join public.profiles pr on pr.id = it.profile_id
where it.profile_id is not null and pr.id is null

union all
select 'NULLFK', 'user_pois.poi_id', count(*)::text
from public.user_pois where poi_id is null
union all
select 'NULLFK', 'user_pois.profile_id', count(*)::text
from public.user_pois where profile_id is null
union all
select 'NULLFK', 'user_badges.badge_id', count(*)::text
from public.user_badges where badge_id is null
union all
select 'NULLFK', 'user_badges.user_id', count(*)::text
from public.user_badges where user_id is null
union all
select 'NULLFK', 'impact_transactions.poi_id', count(*)::text
from public.impact_transactions where poi_id is null
union all
select 'NULLFK', 'impact_transactions.profile_id', count(*)::text
from public.impact_transactions where profile_id is null

order by sezione, oggetto;