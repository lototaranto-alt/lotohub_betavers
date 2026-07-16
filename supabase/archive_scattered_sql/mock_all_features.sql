-- ==========================================
-- SUPER MOCK DATA: ABILITA TUTTE LE FUNZIONI SU TUTTI I POI E AGGIUNGE EVENTI
-- ==========================================

-- 1. COPERTINE E DESCRIZIONI PER TUTTI I POI RIMANENTI
UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/tempio.jpg',
    description = 'Antico tempio greco con colonne doriche risalenti al VI sec. a.C. Un tuffo nella Magna Grecia.'
WHERE name ILIKE '%Tempio di Poseidone%';

UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/saturo.jpg',
    description = 'Vasto parco archeologico affacciato sul mare, culla dell antico insediamento spartano.'
WHERE name ILIKE '%Parco Archeologico di Saturo%';

UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/mudi.jpg',
    description = 'Museo Diocesano che custodisce tesori artistici e sacri di inestimabile valore.'
WHERE name ILIKE '%MuDi%';

UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/canneto.jpg',
    description = 'Oasi di relax e mare cristallino, perfetta per la famiglia e gli amanti dello sport.'
WHERE name ILIKE '%Canneto Beach%';

-- Assicuriamoci che tutti abbiano un'immagine di fallback se null
UPDATE public.pois SET image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/placeholder.jpg' WHERE image_url IS NULL;


-- 2. EVENTI MOCKATI (SFIDE ATTIVE NELLA HOME)
DELETE FROM public.tenant_events WHERE tenant_id = 'taranto';

INSERT INTO public.tenant_events (tenant_id, event_type, title, description, short_description, banner_url, icon_emoji, starts_at, ends_at, status) VALUES 
('taranto', 'cultural_night', 'Notte Bianca dei Musei', 'Apertura straordinaria dei musei di Taranto con visite guidate gratuite. Accumula token extra!', 'Musei aperti e performance live', 'https://lotohub.s3.amazonaws.com/events/taranto_notte_bianca.jpg', '???', now() - interval '1 day', now() + interval '5 days', 'active'),
('taranto', 'community_challenge', 'Eco-Passeggiata al Saturo', 'Aiutaci a ripulire il parco archeologico. Bonus XP x3 per tutti i check-in effettuati in questa zona.', 'Pulizia del parco con bonus XP x3', 'https://lotohub.s3.amazonaws.com/events/taranto_eco.jpg', '??', now() - interval '2 days', now() + interval '10 days', 'active'),
('taranto', 'timed_bonus', 'Happy Hour al Canneto', 'Raggiungi Canneto Beach oggi pomeriggio per sbloccare un badge esclusivo e sconti al bar.', 'Badge esclusivo e sconti al bar', 'https://lotohub.s3.amazonaws.com/events/taranto_happy_hour.jpg', '??', now(), now() + interval '2 days', 'active');


-- 3. CONTENUTI MULTIMEDIALI (MEDIA VAULT) PER I POI MANCANTI
DO $$
DECLARE 
    v_tempio_id UUID;
    v_mudi_id UUID;
    v_canneto_id UUID;
BEGIN
    SELECT id INTO v_tempio_id FROM public.pois WHERE name ILIKE '%Tempio di Poseidone%' LIMIT 1;
    SELECT id INTO v_mudi_id FROM public.pois WHERE name ILIKE '%MuDi%' LIMIT 1;
    SELECT id INTO v_canneto_id FROM public.pois WHERE name ILIKE '%Canneto Beach%' LIMIT 1;

    IF v_tempio_id IS NOT NULL THEN
        INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
        VALUES (v_tempio_id, 'Ricostruzione 3D del Tempio', 'video/tempio_3d.mp4', 20, 'video');
    END IF;

    IF v_mudi_id IS NOT NULL THEN
        INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
        VALUES (v_mudi_id, 'Intervista al Curatore', 'audio/mudi_intervista.mp3', 10, 'audio');
    END IF;

    IF v_canneto_id IS NOT NULL THEN
        INSERT INTO public.media_vault (poi_id, title, media_path, loto_cost, media_type)
        VALUES (v_canneto_id, 'Corso Base di Sup - Video Tutorial', 'video/canneto_sup.mp4', 15, 'video');
    END IF;
END $$;
