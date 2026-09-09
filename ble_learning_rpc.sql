CREATE OR REPLACE FUNCTION public.log_ble_fingerprints(
    p_poi_id UUID,
    p_mac_addresses TEXT[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mac TEXT;
BEGIN
    FOREACH v_mac IN ARRAY p_mac_addresses
    LOOP
        -- Se esiste già, incrementiamo i contatori
        IF EXISTS (SELECT 1 FROM public.poi_ble_fingerprints WHERE poi_id = p_poi_id AND scanned_mac_address = v_mac) THEN
            UPDATE public.poi_ble_fingerprints
            SET 
                times_seen = times_seen + 1,
                last_seen_at = NOW(),
                -- Se viene visto più di 50 volte (da check-in diversi), diventa un'ancora!
                is_trusted_anchor = CASE WHEN times_seen + 1 >= 50 THEN true ELSE is_trusted_anchor END
            WHERE poi_id = p_poi_id AND scanned_mac_address = v_mac;
        ELSE
            -- Primo avvistamento
            INSERT INTO public.poi_ble_fingerprints (poi_id, scanned_mac_address, times_seen, last_seen_at, is_trusted_anchor)
            VALUES (p_poi_id, v_mac, 1, NOW(), false);
        END IF;
    END LOOP;
END;
$$;

-- Esempio di Cron/Trigger per il "Decadimento" (Dimenticare il vecchio)
-- DELETE FROM public.poi_ble_fingerprints WHERE last_seen_at < NOW() - INTERVAL '30 days';
