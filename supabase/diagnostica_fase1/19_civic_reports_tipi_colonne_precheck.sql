-- ============================================================================
-- FASE 1 - M4 - 19 - PRECHECK - tipi/nullabilita' colonne chiave di
--                    civic_reports (servono per scrivere la migration M4)
-- ============================================================================
-- Sola lettura. Un solo result set, una riga.
--
-- Perche' esiste: le policy M4 confrontano `auth.uid()` (uuid) con `user_id`.
-- Se in cloud `user_id` e' TEXT (lo schema cloud ha gia' dimostrato di
-- discostarsi dall'archivio: es. grid_cell vs grid_cell_50m), la CREATE POLICY
-- fallisce con "operator does not exist: uuid = text" e la migration si ferma
-- a metà. Con il tipo giusto si scrive `auth.uid()::text = user_id` o
-- l'uguaglianza direct.
--
-- Misura anche:
--   user_id / tenant_id NOT NULL?  (i due insert client devono soddisfarli:
--     community.tsx:292 passa userId=''  -> se NOT NULL+uuid, insert gia'
--     rotto oggi, vedi CB-17)
--   status tipo                     (la policy SELECT/UPDATE usa status)
--
-- ESITO: con 16 e 17 completa il baseline per la migration M4.
-- ============================================================================
SELECT
  (SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='user_id')                                   AS user_id_tipo,
  (SELECT is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='user_id')                                   AS user_id_nullabile,
  (SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='tenant_id')                                 AS tenant_id_tipo,
  (SELECT is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='tenant_id')                                 AS tenant_id_nullabile,
  (SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='status')                                    AS status_tipo,
  (SELECT data_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='grid_cell')                                 AS grid_cell_tipo,
  (SELECT is_nullable FROM information_schema.columns
    WHERE table_schema='public' AND table_name='civic_reports'
      AND column_name='grid_cell')                                 AS grid_cell_nullabile;
