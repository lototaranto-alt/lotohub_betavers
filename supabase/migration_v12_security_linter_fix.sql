-- =========================================================================
-- MIGRATION V12: SECURITY LINTER FIX
-- Risolve i warning di sicurezza mostrati dal Security Advisor di Supabase
-- =========================================================================

-- 1. FIX: RLS Disabled in Public -> location_pings
-- Questa tabella raccoglie i ping GPS offline, deve essere protetta!
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

-- Permettiamo agli utenti autenticati di inserire i propri ping
CREATE POLICY "Utenti inseriscono i propri ping" 
ON public.location_pings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = profile_id);

-- Permettiamo agli utenti autenticati di leggere solo i propri ping
CREATE POLICY "Utenti leggono i propri ping" 
ON public.location_pings FOR SELECT 
TO authenticated 
USING (auth.uid() = profile_id);


-- 2. FIX: Anonymous Sign-Ins Allowed
-- Molte tabelle usavano "TO authenticated, anon" omettevano il ruolo, 
-- esponendo i dati a utenti non loggati. Chiudiamo le falle.

-- PROFILES: Solo utenti loggati
DROP POLICY IF EXISTS "Gli utenti possono visualizzare solo il proprio profilo" ON public.profiles;
CREATE POLICY "Gli utenti possono visualizzare solo il proprio profilo" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- ACTIVE_SESSIONS: Solo utenti loggati
DROP POLICY IF EXISTS "Sessioni visibili a tutti" ON public.active_sessions;
CREATE POLICY "Utenti vedono solo le proprie sessioni" 
ON public.active_sessions FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- IMPACT_TRANSACTIONS: Solo utenti loggati
DROP POLICY IF EXISTS "Gli utenti vedono solo le proprie transazioni" ON public.impact_transactions;
CREATE POLICY "Gli utenti vedono solo le proprie transazioni" 
ON public.impact_transactions FOR SELECT 
TO authenticated
USING (auth.uid() = profile_id);

-- EVENTS: Solo utenti loggati
DROP POLICY IF EXISTS "Tutti possono vedere gli eventi" ON public.events;
CREATE POLICY "Solo utenti autenticati vedono gli eventi" 
ON public.events FOR SELECT 
TO authenticated
USING (true);

-- Nota per 'public.spatial_ref_sys':
-- È una tabella di sistema creata automaticamente da PostGIS per mappare la geometria terrestre.
-- NON abilitare la RLS su questa tabella altrimenti rompi i calcoli matematici del database. 
-- È un falso positivo del Security Advisor, puoi ignorarlo tranquillamente.

-- Nota per 'public.pois':
-- Lasciamo intenzionalmente la Policy aperta ad "anon" (Anonymous) su questa tabella,
-- perché vogliamo che i turisti possano vedere la mappa e i luoghi di Taranto
-- *prima* di essere costretti a fare login o registrarsi!
