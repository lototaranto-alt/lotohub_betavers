-- =============================================================================
--  FIX-BLOCK: schema reale, necessario prima di scrivere qualsiasi migration
--  Tutte in sola lettura. Nessuna scrittura.
--
--  Prima  Q5  lo schema REALE di impact_transactions, user_pois, profiles.
--  Poi    Q6  pg_get_viewdef delle 2 viste orfane (serve per il fix 4).
-- =============================================================================


-- =============================================================================
--  Q5  SCHEMA REALE
--
--  Non scrivero' una migration che inserisce in impact_transactions senza sapere
--  quali colonne esistono. Il documento che le definisce puo' essere superato
--  dal cloud: questo lo dice, per riga.
-- =============================================================================

select c.table_name,
       c.ordinal_position as pos,
       c.column_name,
       c.data_type,
       c.is_nullable,
       c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in ('impact_transactions', 'user_pois')
order by c.table_name, c.ordinal_position;

-- FINE Q5a


-- =============================================================================
--  Q5b  LE DUE TABELLE CHE MANCANO: colonne di profiles legate al tenant,
--        e il vincolo che impedisce le visite doppie.
--        Serve a B2: se (profile_id, poi_id) e' ancora UNIQUE, il ledger
--        registra una riga per utente x POI per sempre.
-- =============================================================================

select tc.table_name,
       tc.constraint_type,
       tc.constraint_name,
       string_agg(kcu.column_name, ' + ' order by kcu.ordinal_position) as colonne
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
       on kcu.constraint_name = tc.constraint_name
      and kcu.table_schema = tc.table_schema
where tc.table_schema = 'public'
  and tc.table_name in ('impact_transactions', 'user_pois', 'profiles')
group by tc.table_name, tc.constraint_type, tc.constraint_name
order by tc.table_name, tc.constraint_type, tc.constraint_name;

-- FINE Q5b


-- =============================================================================
--  Q5c  profiles: esiste tenant_id? E quanti profili hanno PTI valorizzato?
--        (era una delle "non verificate" di ESITO-QUERY.md sezione 6)
-- =============================================================================

select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='tenant_id')
  as profiles_ha_tenant_id,
  (select count(*) from public.profiles where coalesce(total_tokens,0) > 0)
  as profili_con_pti,
  (select count(*) from public.user_pois)
  as righe_user_pois,
  (select count(*) from public.user_pois where is_shadowbanned is not true)
  as righe_user_pois_pulite;

-- FINE Q5c


-- =============================================================================
--  Q6  LE DUE VISTE ORFANE - definizione viva, per portarle in Git (fix 4)
-- =============================================================================

select 'vw_pois_frontend' as vista, pg_get_viewdef('public.vw_pois_frontend'::regclass, true) as definizione
union all
select 'vw_collective_impact', pg_get_viewdef('public.vw_collective_impact'::regclass, true);

-- FINE Q6


-- =============================================================================
--  Q7  I GRANT vivi sulle due viste orfane, per sapere cosa revocare (fix 4)
-- =============================================================================

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('vw_pois_frontend', 'vw_collective_impact')
order by table_name, grantee, privilege_type;

-- FINE Q7


-- =============================================================================
--  Q8  IL TENANT REALE
--      Il ledger va scritto con il tenant vero: le viste DaaS raggruppano per
--      COALESCE(tenant_id,'unassigned') (hardening :146, :183, :195), quindi un
--      NULL non blocca i report, ma li etichetta 'unassigned' -- e quei report
--      si vendono. 'taranto' e' il valore hardcodato in utils/dbAggregation.ts:53
--      e il default di app_telemetry_events (hardening :337), ma va confermato
--      e non dedotto dalla convenzione del codice.
-- =============================================================================

select id, slug, display_name, city_name, status
from public.tenants
order by slug;

-- FINE Q8


-- =============================================================================
--  Q9  TRIGGER ATTIVI SU user_pois  -- BLOCCANTE
--      verify_checkin_speed_plausibility_fn (migration_v13:270) e' un SECONDO
--      layer anti-spoofing, server-side, che gira a ogni INSERT su user_pois.
--      Non filtra is_shadowbanned e, se legge come ultima riga quella di uno
--      spoof, calcola una velocita' impossibile e RAISES -> il check-in
--      legittimo viene ABBATTUTO, non solo mal punito.
--      Non posso correggere un trigger che non so di essere deployed.
--      Servono anche le funzioni trigger definite altrove (v13:60).
-- =============================================================================

select
  t.tgname,
  t.tgenabled,
  pg_get_triggerdef(t.oid) as definition,
  t.tgfoid::regproc as function_name
from pg_trigger t
where t.tgrelid = 'public.user_pois'::regclass
  and not t.tgisinternal
order by t.tgname;

-- FINE Q9


-- =============================================================================
--  Q10 PROFILI E RESIDUI ZERO-PII
--      create_profile_for_new_user_fn (v13:302) inserisce solo
--      (id, profile_completed, total_tokens): nessun trigger scrive
--      profiles.email. La colonna + il vincolo UNIQUE profiles_email_key sono
--      residuo puro di migration_master_reset.sql:136, pre Zero-PII.
--      Questa query conferma che il drop non rompe nulla.
-- =============================================================================

select
  count(*)                                            as total_profiles,
  count(*) filter (where email is not null)           as with_email,
  count(*) filter (where email is not null
                     and email <> '')                  as with_email_nonempty
from public.profiles;

-- Q10b: verifica che nessun oggetto di database dipenda da profiles.email
select
  c.relname      as object_name,
  c.relkind      as object_kind,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_depend d       on d.objid = p.oid
join pg_class c        on c.oid = d.refobjid
where d.refobjid = 'public.profiles'::regclass
  and c.relname = 'email'
  and c.relkind = 'c'
union all
select
  c.relname,
  c.relkind,
  null
from pg_class c
join pg_attribute a on a.attrelid = c.oid
where a.attname = 'email'
  and a.attrelid = 'public.profiles'::regclass
  and c.relkind = 'v';

-- FINE Q10


-- =============================================================================
--  Q11 DEFINIZIONE REALE DEL CHECK SU action_type  -- BLOCCANTE PER IL LEDGER
--      La migration scrive action_type = 'tourist_checkin'. Quel valore l'ho
--      letto nel TESTO di 20260925120000_admin_dashboard_hardening.sql, non nel
--      cloud. Q5b ha confermato che il vincolo esiste, non cosa ammette.
--      Se 'tourist_checkin' non e' nella lista, l'INSERT fallisce a RUNTIME,
--      dopo il deploy, e fa fallire l'intero check-in: il ledger deve stare
--      DENTRO la stessa transazione, quindi il rollback non lascia nulla a meta'.
--      pg_get_constraintdef restituisce la definizione reale.
-- =============================================================================

select
  con.conname,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
where con.conrelid = 'public.impact_transactions'::regclass
  and con.contype = 'c'
order by con.conname;

-- FINE Q11


-- =============================================================================
--  Q12 LA TERZA ORFANA: la tabella 'scans'
--      pg_get_viewdef di vw_collective_impact contiene:
--          (SELECT count(*) FROM scans) AS total_checkins
--      'scans' esiste nel cloud ma NESSUNA migration del repo la crea: i
--      riferimenti trovati in SQL sono il VALORE 'scans' dentro un CHECK su
--      civic_reports.target_type, non una CREATE TABLE. Quindi gli oggetti
--      orfani sono tre, non due, e questa vista non e' portabile in Git senza
--      definire anche scans.
-- =============================================================================

select c.table_name,
       c.ordinal_position as pos,
       c.column_name,
       c.data_type,
       c.is_nullable,
       c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'scans'
order by c.ordinal_position;

-- Q12b: chi dipende dalle 2 viste e da scans? Se un altro oggetto le usa,
--       revocarne il grant o ricrearle puo' rompere qualcosa.
select dependent.relname as oggetto,
       dependent.relkind as tipo,
       pg_get_viewdef(dependent.oid, true) as definizione
from pg_depend d
join pg_rewrite r       on r.oid = d.objid
join pg_class dependent on dependent.oid = r.ev_class
join pg_class referenced on referenced.oid = d.refobjid
where referenced.relname in ('vw_pois_frontend', 'vw_collective_impact', 'scans')
  and dependent.relname not in ('vw_pois_frontend', 'vw_collective_impact')
group by dependent.relname, dependent.relkind, dependent.oid;

-- FINE Q12


-- =============================================================================
--  Q13 LA VISTA E' UN BYPASS DELL'RLS?  -- IL QUESITO PIU' GRAVE
--      Una vista Postgres creata prima di PG15 gira con i privilegi del
--      PROPRIETARIO, non di chi chiama: se creata da postgres, le policy RLS
--      su public.pois non vengono valutate. Inoltre _layout.tsx:95 avvia in
--      modalita' offline senza sessione e :131 fa replace('/(tabs)/map'), quindi
--      esiste un percorso che atterra sulla mappa non autenticato, e map.tsx:131
--      legge proprio vw_pois_frontend.
--      Se le due conteggi differiscono, la vista bypassa l'RLS di pois.
--      security_invoker (PG15+) e' il rimedio: ALTER VIEW ... SET (security_invoker = true).
--      NB: SET ROLE richiede superuser o membri del ruolo. Se fallisce, non
--      e' un errore della vista: segnalarlo e fermarsi su Q13.
-- =============================================================================

-- NOTA: la prima versione di Q13 usava RAISE NOTICE dentro un DO block, quindi
-- non restituiva righe e l'esito finiva in un NOTICE non visibile nella griglia
-- del SQL Editor. 'Nessuna riga' in quel caso NON e' un errore, e' la griglia
-- vuota. Qui sotto il risultato viene scritto in una tabella temporanea e
-- restituito come rowset.
create temporary table _q13 (etichetta text, valore bigint) on commit drop;

do $$
declare
  v_direct bigint;
  v_via_vista bigint;
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    insert into _q13 values ('ruolo_anon_assente', -1);
    return;
  end if;

  begin
    execute 'set local role anon';
    execute 'select count(*) from public.pois' into v_direct;
  exception when others then
    v_direct := -1;
  end;

  begin
    execute 'select count(*) from public.vw_pois_frontend' into v_via_vista;
  exception when others then
    v_via_vista := -1;
  end;

  insert into _q13 values
    ('pois_come_anon', v_direct),
    ('poi_via_vista_come_anon', v_via_vista),
    ('bypass_rls', case when v_direct >= 0 and v_via_vista > v_direct then 1 else 0 end);
end $$;

select etichetta, valore from _q13 order by etichetta desc;

-- Q13b: la vista e' creata con security_invoker? E su quali tabelle l'RLS
--       e' davvero attivo, con quali policy?
select c.relname,
       c.relrowsecurity,
       c.relforcerowsecurity
from pg_class c
where c.relname in ('pois', 'vw_pois_frontend', 'vw_collective_impact')
  and c.relnamespace = 'public'::regnamespace
order by c.relname;

select schemaname, tablename, policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'pois'
order by policyname;

-- FINE Q13


-- =============================================================================
--  Q14 CHI PUO' SCRIVERE IL LOG E IL LEDGER?  -- LA DOMANDA PIU' IMPORTANTE
--      Tutto il modello di sicurezza fin qui verificato presuppone che i
--      check-in passino da scan_poi_gps, che e' SECURITY DEFINER e calcola
--      is_shadowbanned, xp_awarded e co2_saved server-side. Ma se il ruolo
--      'authenticated' ha INSERT diretto su public.user_pois, un utente puo'
--      scrivere righe false saltando del tutto l'anti-spoofing. E se ha INSERT
--      su public.impact_transactions, puo' fabbricare direttamente le righe del
--      ledger che i comuni pagano: i report DaaS diventerebbero non verificabili.
--      Non ho ancora la risposta. E' il presupposto di tutto il resto.
-- =============================================================================

-- Q14a: grant a livello di TABELLA
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('user_pois', 'impact_transactions', 'profiles')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Q14b: grant a livello di COLONNA. Su user_pois, la INSERT diretta sarebbe
--       limitata alle colonne concesse: is_shadowbanned fuori significa che
--       l'anti-spoofing non e' aggirabile, dentro significa che lo e'.
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('user_pois', 'impact_transactions')
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'INSERT'
order by table_name, grantee, column_name;

-- Q14c: le policy RLS effettive su user_pois e impact_transactions.
--        Una policy INSERT con USING (true) o che non vincola profile_id
--        confermerebbe la scrittura diretta.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('user_pois', 'impact_transactions')
order by tablename, policyname;

-- FINE Q14
