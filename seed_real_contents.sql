BEGIN;

-- CREIAMO BORGO ANTICO (Mancante in Alpha)
INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, xp_reward, coords)
VALUES (gen_random_uuid(), 'Borgo Antico', 'monument', 'layer-cultural', 'taranto', TRUE, 100, ST_SetSRID(ST_MakePoint(17.2289, 40.4746), 4326))
ON CONFLICT DO NOTHING;

DELETE FROM public.media_vault;
DELETE FROM public.whispers;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'audio/borgo_antico_guida.mp3', 'Audio-Guida: La Nascita della Capitale dei Due Mari', 1, false, 0 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Lo Scudo d'Acqua', $, 1 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Corrente Nuova', $, 3 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L'Ipogeo d'Acqua Dolce', $, 5 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Dumas_e_il_labirinto_del_Castello_Aragonese.m4a', 'Audio-Guida: La Rocca dei Due Mari', 1, false, 0 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Lo Scudo Bizantino', $, 1 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Forza di Resistere', $, 3 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Cella dOro del Conte', $, 5 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Dalla_tomba_romana_alla_Cripta_del_Redentore.m4a', 'Audio-Guida: La Cripta e la Statua Spezzata', 1, false, 0 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L'Acqua del Primo Culto', $, 1 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Carparo della Memoria', $, 3 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Leggenda del Pozzo Sacro', $, 5 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Taranto_tra_parchi_e_mura_greche.m4a', 'Audio-Guida: Le Mura dei Giganti Spartani', 1, false, 0 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Lo Scudo Verde', $, 1 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Barriera Comune', $, 3 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Riposo dei Campioni', $, 5 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'audio/museo_marta_guida.mp3', 'Audio-Guida: L'Oro Eterno della Magna Grecia', 1, false, 0 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L'Arte di Splendere', $, 1 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Via del Riuso', $, 3 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Nodo d'Ercole', $, 5 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Il_topazio_da_record_del_MuDi_Taranto.m4a', 'Audio-Guida: Il Silenzio Sacro del Chiostro', 1, false, 0 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L'Oro del Patrono', $, 1 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Trama Silente', $, 3 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Luce del Topazio', $, 5 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Masseria_Solito_il_salotto_culturale_di_Taranto.m4a', 'Audio-Guida: Il Salotto degli Illustri', 1, false, 0 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Le Radici degli Illustri', $, 1 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Rinascita della Pietra', $, 3 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Segreto del Pinnacolo', $, 5 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'I_segreti_dell_Ipogeo_Bellacicco_a_Taranto.m4a', 'Audio-Guida: Il Labirinto di Taras', 1, false, 0 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Roccia Eterna', $, 1 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L'Eco dei Due Mari', $, 3 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Passaggio del Mare', $, 5 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'audio/necropoli_magna_grecia_guida.mp3', 'Audio-Guida: La Città Invisibile dei Morti', 1, false, 0 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Dimora di Carparo', $, 1 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Viaggio Eterno', $, 3 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Le Stanze Dipinte', $, 5 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;

INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Palude_La_Vela_tra_fenicotteri_e_acciaierie.m4a', 'Audio-Guida: Il Canto Silenzioso della Palude', 1, false, 0 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L'Oasi dei Due Mari', $, 1 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'I Custodi dell'Acqua', $, 3 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;

INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Segreto del Fucarino', $, 5 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;

COMMIT;
