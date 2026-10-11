-- ============================================================================
-- FASE 1 - M9 - 34b - PRECHECK - civic_reports: trigger presenti
-- ============================================================================
-- Sola lettura. UN SOLO result set (una riga per trigger).
-- Da eseguire insieme al 34.
--
-- Atteso: 0 righe. La misura M2 (STATO-FASE-0.md:145-146) ha rilevato
-- "0 trigger utente in public" e `civic_confirmed` inesistente. Se qui
-- compare un trigger, il gate di M9 ("il trigger cerca grid_cell = NEW.grid_cell")
-- torna vivo e va riletto prima di toccare i client.
-- ============================================================================
SELECT
  t.tgname                      AS trigger_name,
  t.tgenabled                   AS enabled,
  pg_get_triggerdef(t.oid)      AS definizione
FROM pg_trigger t
JOIN pg_class     c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'civic_reports'
  AND NOT t.tgisinternal
ORDER BY t.tgname;
