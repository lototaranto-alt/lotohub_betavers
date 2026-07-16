-- ============================================================
-- TASK 8: Test "Due Testimoni" (Modulo Civico)
-- ============================================================

-- INSERIMENTO MOCK: Simula 2 segnalazioni nella stessa cella da 2 utenti diversi
-- (Sostituisci gli UUID con ID reali presenti nella tua tabella profiles, oppure
--  lascia che il database generi errore se non esistono per vedere se la logica di base è in piedi)

/*
INSERT INTO civic_reports (user_id, tenant_id, category, description, latitude, longitude, grid_cell, status)
VALUES 
  ('USER_ID_1', 'taranto', 'barrier', 'Buca pericolosa', 40.470, 17.240, '40.470_17.240', 'pending_match'),
  ('USER_ID_2', 'taranto', 'barrier', 'Buca pericolosa in strada', 40.470, 17.240, '40.470_17.240', 'pending_match');

-- VERIFICA RISULTATO
-- Entrambe le segnalazioni dovrebbero ora avere status = 'confirmed'
SELECT id, user_id, category, status, grid_cell 
FROM civic_reports 
WHERE grid_cell = '40.470_17.240';
*/


-- ============================================================
-- TASK 9: Creazione Vista Report ESG (Architettura Stateless)
-- ============================================================

-- Abbiamo corretto la query originale che interrogava la vecchia tabella 'discoveries'.
-- Ora interroga 'scans' per l'affluenza, 'civic_reports' per il civico e 'profiles' per la CO2.
-- Usiamo le CTE (Common Table Expressions) per evitare moltiplicazioni errate della CO2.

CREATE OR REPLACE VIEW esg_report_monthly AS
WITH scan_stats AS (
  SELECT 
    tenant_id, 
    DATE_TRUNC('month', created_at) AS month, 
    COUNT(*) AS total_scans, 
    COUNT(DISTINCT user_id) AS active_users
  FROM scans
  GROUP BY tenant_id, DATE_TRUNC('month', created_at)
),
civic_stats AS (
  SELECT 
    tenant_id, 
    DATE_TRUNC('month', created_at) AS month, 
    COUNT(*) AS confirmed_reports
  FROM civic_reports
  WHERE status = 'confirmed'
  GROUP BY tenant_id, DATE_TRUNC('month', created_at)
),
co2_stats AS (
  -- La CO2 totale è calcolata sommando i valori attuali dei profili afferenti a quel tenant
  SELECT 
    tenant_id, 
    SUM(COALESCE(total_co2, 0)) AS co2_saved
  FROM profiles
  GROUP BY tenant_id
)
SELECT 
  s.tenant_id,
  s.month,
  s.active_users,
  s.total_scans,
  COALESCE(c.co2_saved, 0) AS co2_saved,
  COALESCE(civ.confirmed_reports, 0) AS confirmed_reports
FROM scan_stats s
LEFT JOIN civic_stats civ ON s.tenant_id = civ.tenant_id AND s.month = civ.month
LEFT JOIN co2_stats c ON s.tenant_id = c.tenant_id;

-- Verifica creazione della vista
SELECT * FROM esg_report_monthly;
