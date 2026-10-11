-- ============================================================================
-- M11 - process_crowd_radar: rimozione scrittura su colonna inesistente
--       (`pois.heat`) - ramo R2
-- Data: 08/10/2026
-- Severita': MEDIA (di fatto BLOCCANTE: la RPC falliva a runtime)
-- ============================================================================
-- Misurato 08/10 (probe REST, anon):
--   `GET /rest/v1/pois?select=heat` -> 400 (colonna inesistente), mentre
--   `select=id/name/crowd_level` -> 200. Enumerazione `select=*`: le colonne
--   reali di public.pois NON includono `heat` (id, name, category, layer_name,
--   coords, loto_quota_max, xp_reward, checkin_radius, crowd_level, has_water,
--   is_accessible, is_active, is_recommended, image_url, p_iva, pec, tenant_id,
--   created_at, updated_at, description, base_xp, base_co2).
--   Nessuna migration crea `heat`; l'unico riferimento e' l'UPDATE dentro
--   process_crowd_radar (pre-M5 e M5). La CREATE FUNCTION non esegue il corpo:
--   l'UPDATE falliva alla PRIMA chiamata ("column heat does not exist").
--   Il chiamante (app/p/[id].tsx:88) ha un try/catch (riga 99) -> errore
--   SILENZIOSO: nessun dato in crowd_predictions, nessuna heat.
--
-- Perche' R2 (vedi PIANO M11):
--   - R1 (pois.heat come fonte): il client non legge MAI la colonna; la mappa
--     calcola l'HeatScore in locale (app/(tabs)/map.tsx). Nessun consumatore.
--   - R3 (doppio consumatore): idem, nessun consumatore della colonna.
--   - La DaaS heatmap (vw_daas_heatmap_15min) e' costruita da `user_pois`,
--     NON da pois.heat. La colonna e' orfana.
--   => si smette di scriverla: rimosso l'UPDATE. Il resto della funzione resta
--      identico a M5 (identita' da auth.uid(), guardia anonima, cap, INSERT).
--
-- Cosa fa questa migration (idempotente, rieseguibile): CREATE OR REPLACE della
--   funzione SENZA il blocco "UPDATE public.pois SET heat = ...". Nessun'altra
--   modifica di corpo. Re-include GRANT/REVOKE di M5 (idempotenti).
--
-- Cosa NON risolve (registrato):
--   - CB-20: cap incoerente (1500 -> 100, 999 passa) e v_certified su dato
--     dichiarato -> resta; D5 (geofence server) resta aperta.
--   - Le colonne di `crowd_predictions` NON sono state verificate (anon non le
--     legge). Se una colonna dell'INSERT manca, la RPC fallirebbe ancora:
--     verificare con diagnostica_fase1/26_crowd_predictions_colonne.sql.
--
-- DOPO l'apply:
--   diagnostica_fase1/25_m11_post_apply_verifica.sql  (atteso:
--     corpo_usa_auth_uid=true, corpo_guardia=true, corpo_update=false,
--     corpo_tocca_pois=false, exec_anon=false, exec_authenticated=true)
--   diagnostica_fase1/26_crowd_predictions_colonne.sql (colonne della tabella)
--
-- ROLLBACK: ripristinare il corpo da risultato 20_process.txt (con il bug) o
--   da 20261008140000_process_crowd_radar_m5.sql (M5 con la scrittura rotta).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_crowd_radar(
    p_poi_id uuid,
    p_reporter_id uuid,
    p_raw_count integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_reporter_id uuid := auth.uid();
    v_certified INT;
    v_recent_avg INT;
    v_confidence INT := 1;
BEGIN
    -- Sicurezza: l'identita' viene dal JWT, non dal parametro
    IF v_reporter_id IS NULL THEN
        RAISE EXCEPTION 'chiamata anonima non consentita';
    END IF;

    -- Sicurezza: Taglio (Cap) sui numeri esagerati (NOTA CB-20: incoerente)
    IF p_raw_count > 1000 THEN
        p_raw_count := 100;
    END IF;

    -- Doppia Convalida Civica: Media dello storico negli ultimi 15 minuti
    SELECT AVG(certified_count) INTO v_recent_avg
      FROM crowd_predictions
     WHERE poi_id = p_poi_id AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_recent_avg IS NOT NULL THEN
        v_certified := (p_raw_count + v_recent_avg) / 2;
        v_confidence := 2;
    ELSE
        v_certified := p_raw_count;
    END IF;

    -- Salvataggio nella tabella di Analytics B2B
    INSERT INTO crowd_predictions (poi_id, reporter_id, raw_count, certified_count, confidence_score)
    VALUES (p_poi_id, v_reporter_id, p_raw_count, v_certified, v_confidence);

    RETURN v_certified;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.process_crowd_radar(uuid, uuid, integer)
  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_crowd_radar(uuid, uuid, integer)
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.process_crowd_radar(uuid, uuid, integer)
  FROM anon;
