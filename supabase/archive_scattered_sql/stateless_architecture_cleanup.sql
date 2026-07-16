-- ==========================================
-- PULIZIA ARCHITETTURALE E POPOLAMENTO VISIVO
-- ==========================================

-- 1. RIMOZIONE LOGICHE STATELESS E FUNZIONI OBSOLETE
DROP TABLE IF EXISTS public.active_sessions CASCADE;
DROP FUNCTION IF EXISTS the_reaper_cleanup CASCADE;
DROP FUNCTION IF EXISTS book_poi_visit CASCADE;
DROP FUNCTION IF EXISTS get_smart_pois CASCADE;

-- 2. ASSICURARSI CHE LE COLONNE VISIVE ESISTANO
ALTER TABLE public.pois
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. MOCK DATA VISIVI PER I P.O.I. DI TARANTO
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

UPDATE public.pois SET 
    image_url = 'https://lotohub.s3.amazonaws.com/tenants/taranto/placeholder.jpg' 
WHERE image_url IS NULL;

-- 4. RIPRISTINO MOCK EVENTI COMMUNITY (Sfide Attive)
DELETE FROM public.tenant_events WHERE tenant_id = 'taranto';

INSERT INTO public.tenant_events (tenant_id, event_type, title, short_description, icon_emoji, starts_at, ends_at)
VALUES 
    (
        'taranto', 
        'community_challenge', 
        'Sfida Templare NFC', 
        'Attivazione Patrimonio Fisico: trova i tag nascosti nella Città Vecchia.', 
        '??', 
        now() - interval '1 day', 
        now() + interval '7 days'
    ),
    (
        'taranto', 
        'community_challenge', 
        'Loto Clean-Up Rete Tracce', 
        'Monitoraggio del decoro nel quartiere Tamburi.', 
        '??', 
        now(), 
        now() + interval '3 days'
    ),
    (
        'taranto', 
        'partner_takeover', 
        'Aperitivo Zero-Friction', 
        'Incontro con gli esercenti (Startup Urbane) del centro storico.', 
        '??', 
        now(), 
        now() + interval '2 days'
    );
