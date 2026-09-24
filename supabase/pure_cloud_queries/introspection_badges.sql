-- ============================================================================
-- INTROSPECTION BADGES (fonte di verita': SOLO il DB cloud, NON i vecchi .sql)
-- ============================================================================

-- 1) Colonne REALI di user_badges e di badges (se esiste)
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('user_badges', 'badges')
ORDER BY table_name, ordinal_position;

-- 2) Valori badge_type DISTINTI realmente presenti (e quante righe per tipo)
SELECT badge_type, COUNT(*) AS righe
FROM user_badges
GROUP BY badge_type
ORDER BY righe DESC;

-- 3) Sample righe: come appare una riga di user_badges (con eventuale join badges)
SELECT ub.user_id, ub.badge_type, ub.earned_at,
       b.id AS badge_id, b.name AS badge_name
FROM user_badges ub
LEFT JOIN badges b ON b.id = ub.badge_id
LIMIT 20;

-- 4) La tabella badges esiste? Con che colonne e quanti record?
SELECT COUNT(*) AS n_badges FROM badges;

-- 5) Funzioni / trigger che scrivono su user_badges (chi assegna i badge?)
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('user_badges', 'civic_reports', 'user_pois')
ORDER BY event_object_table;

-- 6) Trigger/partenza: definizione della/e funzione/i di assegnazione (se esiste award_action_badges)
SELECT proname AS funzione, pg_get_functiondef(oid) AS definizione
FROM pg_proc
WHERE proname ILIKE '%badge%'
   OR proname ILIKE '%award%'
ORDER BY proname;

-- 7) Colonne REALI utili come metriche badge nel profilo (per rendere vivo il progresso)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('profiles', 'user_pois', 'impact_transactions', 'civic_reports', 'user_itineraries')
ORDER BY table_name, ordinal_position;