SELECT 'COLONNE impact_transactions' AS sezione, column_name, data_type, is_nullable, coalesce(column_default,'') AS default_val FROM information_schema.columns WHERE table_schema='public' AND table_name='impact_transactions' ORDER BY ordinal_position;

SELECT 'ESISTE impact_transactions' AS sezione, to_regclass('public.impact_transactions')::text AS esito, (SELECT count(*) FROM public.impact_transactions) AS righe;

SELECT 'ESISTE location_pings' AS sezione, to_regclass('public.location_pings')::text AS esito;

SELECT 'ESISTE profiles.party_size' AS sezione, count(*)::text AS esito FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='party_size';

SELECT 'FIRME process_esg_impact' AS sezione, pg_get_function_identity_arguments(p.oid) AS firma, p.prosecdef::text AS secdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='process_esg_impact';

SELECT 'VINCOLI impact_transactions' AS sezione, conname, contype::text AS tipo FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname='impact_transactions';

SELECT 'POLICY impact_transactions' AS sezione, policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='impact_transactions';

SELECT 'TUTTE LE TABELLE public' AS sezione, string_agg(tablename, ', ' ORDER BY tablename) AS elenco FROM pg_tables WHERE schemaname='public';
