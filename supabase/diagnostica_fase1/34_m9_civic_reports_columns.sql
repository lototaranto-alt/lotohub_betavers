-- ============================================================================
-- FASE 1 - M9 - 34 - PRECHECK - civic_reports: colonne, nullabilita', default
-- ============================================================================
-- Sola lettura. UN SOLO result set (una riga per colonna).
-- Da eseguire PRIMA di modificare i client (nessuna migration in M9).
--
-- Cosa serve sapere:
--   1. status.column_default   -> decide come unificare i due client
--      (CivicReportSheet forza 'pending'; CivicDashboard omette).
--   2. tenant_id.is_nullable   -> se NOT NULL, CivicDashboard DEVE inviarlo.
--   3. tenant_id.column_default-> se esiste un default, si puo' omettere.
--   4. grid_cell / user_id     -> conferma nomi e nullabilita' reali.
--
-- Atteso (dai fatti misurati 08/10): esiste grid_cell, NON grid_cell_50m.
-- ============================================================================
SELECT
  c.ordinal_position      AS pos,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name   = 'civic_reports'
ORDER BY c.ordinal_position;
