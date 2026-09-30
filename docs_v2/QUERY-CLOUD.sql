-- =============================================================================
--  QUERY DI CHIUSURA - L.O.T.O. Map
--  Progetto Supabase: fsuolbwsvpgiglwcaffh
--
--  TUTTE IN SOLA LETTURA. Nessuna scrittura. Nessun ALTER, nessun CREATE.
--
--  COME SI USA: questo file contiene 4 query. Copia SOLO il SQL di una query
--  alla volta (dalla riga contrassegnata -- Qn fino alla riga -- FINE Qn) e
--  incollalo nel SQL Editor. NON incollare tutto il file in un colpo solo:
--  l'editor mostrerebbe solo l'ultimo risultato e perderesti gli altri.
--
--  Se il pannello segnala "creates a table without enabling Row Level
--  Security": e' un falso positivo, sono SELECT. Clicca Run. NON abilitare RLS
--  (perche' spiegarlo: vedi docs_v2/QUERY-CLOUD.md sezione 0).
-- =============================================================================


-- =============================================================================
--  Q1  CHE COSA FA recover_loto_pass
--      Chiude A1. Decide se il Blocco 0 e' finito.
--
--      Cerca nel corpo:  auth.uid()   +   UPDATE public.profiles
--      - entrambi presenti -> il ricongiungimento esiste, va solo collegato al client
--      - solo SELECT       -> e' il corpo "mock pre-beta": il recupero non unisce nulla
--      - 0 righe           -> la funzione non e' nel cloud
-- =============================================================================

select p.oid::regprocedure as firma,
       pg_get_functiondef(p.oid) as corpo
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'recover_loto_pass'
order by p.oid;

-- FINE Q1


-- =============================================================================
--  Q2  CHE COSA FA scan_poi_gps
--      Chiude A2. Esistono 5 definizioni con la stessa firma: dice quale e' viva.
--
--      Discriminatore (numero, non nome):
--        v_co2_saved := 10.0            -> corpo 1, CO2 sporato di un fattore ~7
--        1.5  e  total_tokens          -> corpo 2, il piu' probabile
--        'cooldown_hours' nel RETURN   -> catena canonica, mai applicata
--
--      E in ogni caso cerca la riga:   INSERT INTO public.impact_transactions
--      Se non c'e', il ledger non riceve niente.
-- =============================================================================

select p.oid::regprocedure as firma,
       pg_get_functiondef(p.oid) as corpo
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'scan_poi_gps'
order by p.oid;

-- FINE Q2


-- =============================================================================
--  Q3  IL LEDGER ESISTE
--      Chiude A3. La domanda da 4 mesi di check-in.
--
--      0 righe            -> la catena 1 non ha mai prodotto il bene vendibile
--      > 0, max del 22/09 -> il ledger funzionava e si e' fermato
--      > 0, max recente   -> il corpo attivo scrive il ledger
-- =============================================================================

select count(*)      as righe_ledger,
       min(created_at) as prima_riga,
       max(created_at) as ultima_riga
from public.impact_transactions;

-- FINE Q3


-- =============================================================================
--  Q4  DIAGNOSTICA COMBINATA (una sola query, 3 controlli)
--      Chiude: hardening applicata? / viste aperte ad anon? / tabelle senza RLS?
--
--      Tre righe di lettura, un solo output. Se vuoi i dettagli delle viste o
--      delle tabelle, chiedi e te li do separati.
-- =============================================================================

select '1_hardening' as controllo,
       'is_loto_admin()' as oggetto,
       case when exists (select 1 from pg_proc where proname = 'is_loto_admin')
            then 'PRESENTE -> hardening APPLICATA. Non riapplicare mai v22/v23/v24'
            else 'ASSENTE  -> hardening NON applicata. In produzione stanno le viste di v22/v23'
       end as esito
union all
select '2_vista_anon',
       v.viewname,
       'GRANT ad anon -> leggibile da chiunque abbia la anon key (pubblica nell app)'
from pg_views v
where v.schemaname = 'public'
  and exists (select 1
              from information_schema.role_table_grants g
              where g.table_schema = 'public'
                and g.table_name = v.viewname
                and g.grantee = 'anon')
union all
select '3_senza_rls',
       c.relname,
       case when (select count(*) from pg_policies p
                   where p.schemaname = 'public' and p.tablename = c.relname) = 0
            then 'RLS OFF e 0 policy -> aperta in lettura E scrittura'
            else 'RLS OFF con ' || (select count(*) from pg_policies p
                                   where p.schemaname = 'public' and p.tablename = c.relname)::text
                 || ' policy (inerti senza RLS)'
       end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity
order by 1, 2;

-- FINE Q4


-- =============================================================================
--  NOTA SUL RISULTATO
--
--  Se una query restituisce 0 righe, NON e' un errore: e' la risposta.
--  "0 righe" su Q1 significa che la funzione non esiste nel cloud.
--  "0 righe" su Q2 idem.
--  Se invece l'editor segnala un errore di sintassi, hai incollato
--  l'intestazione YAML del file .md invece che questo file .sql.
-- =============================================================================
