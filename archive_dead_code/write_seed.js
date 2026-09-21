const fs = require("fs");
const content = `BEGIN;

-- CREIAMO BORGO ANTICO (Mancante in Alpha)
INSERT INTO public.pois (id, name, category, layer_name, tenant_id, is_active, xp_reward, coords)
VALUES (gen_random_uuid(), 'Borgo Antico', 'monument', 'layer-cultural', 'taranto', TRUE, 100, ST_SetSRID(ST_MakePoint(17.2289, 40.4746), 4326))
ON CONFLICT DO NOTHING;

DELETE FROM public.media_vault;
DELETE FROM public.whispers;

-- BORGO ANTICO
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'audio/borgo_antico_guida.mp3', 'Audio-Guida: La Nascita della Capitale dei Due Mari', 1, false, 0 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Lo Scudo d''Acqua', $content$IT: Ogni Refill è uno scudo forgiato contro la plastica. Dissetati alle nostre storiche fontanelle: è il gesto di una comunità che sceglie la purezza.\n\nEN: Every Refill is a shield forged against plastic. Quench your thirst at our historical fountains: it is the gesture of a community choosing purity.$content$, 1 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Corrente Nuova', $content$IT: Non seguire la corrente, guidala. I tuoi PTI si stanno trasformando in un impatto reale e misurabile. Continua a tracciare rotte al di fuori della folla.\n\nEN: Do not follow the current, guide it. Your PTI are transforming into a real, measurable impact. Keep charting routes away from the crowds.$content$, 3 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L''Ipogeo d''Acqua Dolce', $content$IT: **Sblocco Premium - Ipogeo Bellacicco**: scendi a sedici metri sotto il livello del mare tra cave spartane e sorgenti d'acqua dolce secrete. Rispetta l'invisibile: proteggi le falde acquifere di Taranto.\n\nEN: **Premium Unlock - Bellacicco Hypogeum**: descend sixteen meters below sea level among Spartan quarries and secret freshwater springs. Respect the invisible: protect Taranto's aquifers.$content$, 5 FROM public.pois WHERE name ILIKE '%Borgo Antico%' LIMIT 1;

-- CASTELLO ARAGONESE
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Dumas_e_il_labirinto_del_Castello_Aragonese.m4a', 'Audio-Guida: La Rocca dei Due Mari', 1, false, 0 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Lo Scudo Bizantino', $content$IT: Sulle antiche mura la rocca bizantina del 780 d.C. veglia sul canale. Proteggi la bellezza e la biodiversità marina riducendo la tua impronta quotidiana per un domani condiviso.\n\nEN: On the ancient walls, the Byzantine fortress of 780 AD watches over the canal. Protect marine beauty and biodiversity by reducing your daily footprint for a shared tomorrow.$content$, 1 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Forza di Resistere', $content$IT: Cinque imponenti torri aragonesi nate per resistere ai colpi dell'artiglieria pesante. Come questa fortezza, impara a resistere alle sfide del clima: trasforma le tue abitudini in uno scudo di energia pulita.\n\nEN: Five imposing Aragon towers built to withstand the blows of heavy artillery. Like this fortress, learn to withstand climate challenges: transform your habits into a shield of clean energy.$content$, 3 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Cella d''Oro del Conte', $content$IT: **[Premium] La Cella di Dumas & Muro di Crispano**: Negli oscuri passaggi sotterranei, la prigionia di Dumas ispirò il *Conte di Montecristo*. Rompi le catene dello spreco ed evita dispersioni energetiche inutili per liberare il futuro.\n\nEN: **[Premium] Dumas' Cell & Crispano Wall**: In the dark underground passages, Dumas' captivity inspired the *Count of Monte Cristo*. Break the chains of waste and prevent useless energy loss to free the future.$content$, 5 FROM public.pois WHERE name ILIKE '%Castello Aragonese%' LIMIT 1;

-- CRIPTA DEL REDENTORE
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Dalla_tomba_romana_alla_Cripta_del_Redentore.m4a', 'Audio-Guida: La Cripta e la Statua Spezzata', 1, false, 0 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L''Acqua del Primo Culto', $content$IT: Nel silenzio della tomba romana, il primo sussurro cristiano si accese presso la sorgente d'acqua dolce. Custodisci le fonti vitali della terra: risparmiare acqua è il primo passo per rigenerare la comunità.\n\nEN: In the silence of the Roman tomb, the first Christian whisper was lit by the fresh water spring. Safeguard Earth's vital sources: saving water is the first step to regenerate the community.$content$, 1 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Carparo della Memoria', $content$IT: Le pareti di roccia scavata racchiudono affreschi bizantini del XII secolo scampati al tempo. Scegli la via del riuso e difendi il nostro patrimonio materiale: ogni risorsa preservata dura nei secoli.\n\nEN: The carved rock walls enclose Byzantine frescoes of the 12th century that escaped time. Choose the path of reuse and defend our tangible heritage: every preserved resource lasts through the centuries.$content$, 3 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Leggenda del Pozzo Sacro', $content$IT: **Sblocco Premium - Il Pozzo di San Pietro**: Scopri l'antico pozzo sorgivo dove la leggenda vuole che l'Apostolo Pietro, facendosi il segno della croce, frantumò la colossale statua bronzea del dio pagano Zeus. Un segreto di fede che insegna a spezzare i consumi inutili e a proteggere il territorio.\n\nEN: **Premium Unlock - Saint Peter's Well**: Discover the ancient spring well where legend has it that Apostle Peter, by making the sign of the cross, shattered the colossal bronze statue of the pagan god Zeus. A secret of faith that teaches to break useless consumption and protect the land.$content$, 5 FROM public.pois WHERE name ILIKE '%Cripta del Redentore%' LIMIT 1;

-- MURA GRECHE
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Taranto_tra_parchi_e_mura_greche.m4a', 'Audio-Guida: Le Mura dei Giganti Spartani', 1, false, 0 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Lo Scudo Verde', $content$IT: Sotto l'ombra dei pini, i blocchi di pietra cantano di antiche sentinelle. Respira la freschezza di questo polmone urbano e proteggi gli spazi verdi: la natura in città è la nostra forza comune.\n\nEN: Under the shade of pines, the stone blocks sing of ancient sentinels. Breathe the freshness of this urban lung and protect green spaces: nature in the city is our shared strength.$content$, 1 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Barriera Comune', $content$IT: Come le mura erette nel V secolo a.C. per difendere la libertà di Taras, unisci le tue forze alla comunità. Ogni scelta eco-sostenibile è un blocco di pietra a difesa del clima.\n\nEN: Like the walls erected in the 5th century BC to defend Taras's freedom, join forces with the community. Every eco-friendly choice is a stone block defending our climate.$content$, 3 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Riposo dei Campioni', $content$IT: **Sblocco Premium - La Tomba degli Atleti**: sotto le radici del parco riposano i campioni di Taranto. Custodisci questo santuario: riduci i rifiuti e preserva la gloria della terra greca.\n\nEN: **Premium Unlock - The Athletes' Tomb**: beneath the park's roots rest the champions of Taranto. Safeguard this sanctuary: reduce waste and preserve the glory of the Greek land.$content$, 5 FROM public.pois WHERE name ILIKE '%Mura Greche%' LIMIT 1;

-- MAR.TA
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'audio/museo_marta_guida.mp3', 'Audio-Guida: L''Oro Eterno della Magna Grecia', 1, false, 0 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L''Arte di Splendere', $content$IT: Brilla di valore puro come gli Ori degli antichi maestri. Ogni tuo piccolo gesto virtuoso quotidiano, dalla raccolta differenziata al riciclo, è una gemma preziosa per la nostra comunità.\n\nEN: Shine with pure value like the Gold of the ancient masters. Every small virtuous daily act, from waste sorting to recycling, is a precious gem for our community.$content$, 1 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Via del Riuso', $content$IT: L'oro della Taras ellenistica veniva rigenerato infinite volte per plasmare manufatti eterni. Abbraccia la via del riuso per ridurre i consumi e dare nuova vita alla materia.\n\nEN: Hellenistic gold was recycled countless times to shape eternal masterpieces. Embrace the path of reuse to reduce consumption and give new life to matter.$content$, 3 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Nodo d''Ercole', $content$IT: **Sblocco Premium - Il Diadema Segreto**: Scopri la maestria del Nodo d'Ercole, antico amuleto protettivo dei gioielli tarantini. Un legame indissolubile con la terra: i tuoi PTI sono la trama d'oro che sostiene l'ambiente.\n\nEN: **Premium Unlock - The Secret Diadem**: Discover the mastery of the Hercules Knot, an ancient protective amulet on Taras jewelry. An unbreakable bond with the earth: your PTI are the golden weave supporting the environment.$content$, 5 FROM public.pois WHERE name ILIKE '%MAR.TA%' LIMIT 1;

-- DIOCESANO
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Il_topazio_da_record_del_MuDi_Taranto.m4a', 'Audio-Guida: Il Silenzio Sacro del Chiostro', 1, false, 0 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L''Oro del Patrono', $content$IT: Nel cuore del borgo antico, l'antica crocetta aurea di San Cataldo brilla di una fede eterna. Rifletti sul valore del tempo e delle risorse: custodisci e preserva ogni elemento dell'ecosistema per chi verrà dopo di te.\n\nEN: In the heart of the old town, Saint Cataldo's ancient golden pectoral cross shines with eternal faith. Reflect on the value of time and resources: protect and preserve every element of the ecosystem for those who follow.$content$, 1 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Trama Silente', $content$IT: Ammira la seta marina tessuta dal bisso, un rarissimo filo d'oro ricavato dal mare. La natura offre tesori inestimabili se la proteggiamo: rispetta la fauna marina e riduci il consumo di plastica per custodire la biodiversità dei due mari.\n\nEN: Admire the sea silk woven from byssus, a rare golden thread harvested from the sea. Nature offers priceless treasures if we protect it: respect marine life and reduce plastic consumption to preserve the biodiversity of the two seas.$content$, 3 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Luce del Topazio', $content$IT: **Sblocco Premium - Lo Sportello di Topazio**: Entra nel sancta sanctorum del MuDi e scopri lo sportello di tabernacolo scolpito in un unico topazio da 1,5 kg, la pietra preziosa lavorata più grande al mondo. Come questo cristallo puro, lascia che le tue scelte sostenibili riflettano una limpida onestà ecologica.\n\nEN: **Premium Unlock - The Topaz Door**: Enter the sancta sanctorum of MuDi and discover the tabernacle door carved from a single 1.5 kg topaz, the largest carved gemstone in the world. Like this pure crystal, let your sustainable choices reflect crystal-clear ecological honesty.$content$, 5 FROM public.pois WHERE name ILIKE '%Diocesano%' LIMIT 1;

-- MUDIT
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Masseria_Solito_il_salotto_culturale_di_Taranto.m4a', 'Audio-Guida: Il Salotto degli Illustri', 1, false, 0 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Le Radici degli Illustri', $content$IT: Cammina tra le antiche 'chianche' romane dove oggi pulsa il sapere. Custodisci la memoria culturale del territorio e riduci la tua impronta: la conoscenza è sostenibile solo quando è condivisa.\n\nEN: Walk among the ancient Roman 'chianche' where knowledge pulses today. Safeguard the cultural heritage of the area and reduce your footprint: knowledge is sustainable only when shared.$content$, 1 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Rinascita della Pietra', $content$IT: Da masseria agricola a casa del fondatore del MArTA, Luigi Viola. Come questo carparo locale recuperato dall'incuria, riduci gli sprechi e rigenera i tuoi consumi per dare nuova vita al territorio.\n\nEN: From an agricultural estate to the home of MArTA's founder, Luigi Viola. Like this local carparo stone saved from neglect, reduce waste and regenerate your consumption to renew the land.$content$, 3 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Segreto del Pinnacolo', $content$IT: **Sblocco Premium - La Croce dei Pellegrini**: guarda in alto, la croce in pietra sul tetto rivela un antico ospitale per i cavalieri diretti in Terra Santa. Unisci le forze per una cooperazione globale e pulita.\n\nEN: **Premium Unlock - The Pilgrims' Cross**: look up, the stone cross on the roof reveals an ancient hospice for knights bound for the Holy Land. Join forces for global, clean cooperation.$content$, 5 FROM public.pois WHERE name ILIKE '%MUDIT%' LIMIT 1;

-- SPARTANO
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'I_segreti_dell_Ipogeo_Bellacicco_a_Taranto.m4a', 'Audio-Guida: Il Labirinto di Taras', 1, false, 0 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Roccia Eterna', $content$IT: Cammina nella roccia viva scavata dagli antichi Spartani. Riduci l'uso delle materie prime oggi per onorare il carparo eterno che sostiene la storia della nostra città.\n\nEN: Walk in the raw rock carved by the ancient Spartans. Reduce the use of raw materials today to honor the eternal carparo stone that supports our city's history.$content$, 1 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L''Eco dei Due Mari', $content$IT: Tra condotte idriche e volte bizantine, l'ipogeo respira con i due mari. Sostieni gli ecosistemi costieri riducendo gli sprechi d'acqua: l'acqua di ieri è la vita di domani.\n\nEN: Through ancient water conduits and Byzantine vaults, the hypogeum breathes with the two seas. Support coastal ecosystems by reducing water waste: yesterday's water is tomorrow's life.$content$, 3 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Passaggio del Mare', $content$IT: **Sblocco Premium - Il Tunnel del Mare**: Sotto palazzo de Beaumont, un passaggio segreto sbuca direttamente tra i flutti. Custodisci le coste e mantieni il mare pulito: ogni mare nasce da una sorgente protetta.\n\nEN: **Premium Unlock - The Sea Tunnel**: Beneath de Beaumont palace, a secret passage leads directly into the waves. Safeguard the shores and keep the sea clean: every ocean begins with a protected source.$content$, 5 FROM public.pois WHERE name ILIKE '%Spartano%' LIMIT 1;

-- NECROPOLI
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'audio/necropoli_magna_grecia_guida.mp3', 'Audio-Guida: La Città Invisibile dei Morti', 1, false, 0 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'La Dimora di Carparo', $content$IT: Sulle antiche tombe la roccia di carparo custodisce il silenzio del passato. Rispetta la sacralità e la stabilità del suolo che calpesti: proteggere la terra di Taranto è un dovere civico per il nostro futuro comune.\n\nEN: On ancient tombs, the carparo stone safeguards the silence of the past. Respect the sacredness and stability of the soil you walk on: protecting Taranto's land is a civic duty for our shared future.$content$, 1 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Viaggio Eterno', $content$IT: I letti funebri in pietra venivano scolpiti come dimore immortali. Evita gli sprechi oggi per garantire un futuro durevole alle generazioni di domani: ogni risorsa preservata è un ponte che unisce le epoche.\n\nEN: Ancient stone funebre beds were carved as immortal dwellings. Avoid waste today to guarantee a lasting future for tomorrow's generations: every preserved resource is a bridge uniting the eras.$content$, 3 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Le Stanze Dipinte', $content$IT: **Sblocco Premium - Necropoli di Via Marche**: Varca la soglia delle esclusive tombe a camera dipinte. Gli antichi affreschi ricreavano la natura per il viaggio eterno del defunto. Custodisci gli ecosistemi viventi di oggi, vero capolavoro di biodiversità da salvare.\n\nEN: **Premium Unlock - Via Marche Necropolis**: Cross the threshold of the exclusive painted chamber tombs. Ancient frescoes recreated nature for the eternal journey. Protect today's living ecosystems, a true masterpiece of biodiversity to save.$content$, 5 FROM public.pois WHERE name ILIKE '%Necropoli Magna Grecia%' LIMIT 1;

-- PALUDE LA VELA
INSERT INTO public.media_vault (poi_id, media_type, media_path, title, required_level, is_premium_only, loto_cost)
SELECT id, 'audio', 'Palude_La_Vela_tra_fenicotteri_e_acciaierie.m4a', 'Audio-Guida: Il Canto Silenzioso della Palude', 1, false, 0 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'L''Oasi dei Due Mari', $content$IT: Sulle sponde del Mar Piccolo la riserva della Palude La Vela protegge l'avifauna e i salicorneti. Riduci le emissioni e cammina in silenzio per non disturbare questa culla di biodiversità selvatica.\n\nEN: On the shores of Mar Piccolo, the Palude La Vela reserve protects birdlife and samphire. Reduce your emissions and walk silently so as not to disturb this cradle of wild biodiversity.$content$, 1 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'I Custodi dell''Acqua', $content$IT: Nelle acque salmastre si nasconde la più grande popolazione mediterranea di cavallucci marini. Evita gli inquinanti e riduci i consumi idrici per preservare questa fragile e straordinaria riserva di vita.\n\nEN: In the brackish waters hides the largest Mediterranean population of seahorses. Avoid pollutants and reduce water consumption to preserve this fragile and extraordinary reserve of life.$content$, 3 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;
INSERT INTO public.whispers (poi_id, tenant_id, title, content, rarity)
SELECT id, 'taranto', 'Il Segreto del Fucarino', $content$IT: **Sblocco Premium - Pineta di Fucarino**: l'enorme pineta di pini d'Aleppo fu impiantata artificialmente a metà Novecento per nascondere i depositi militari dell'Aeronautica. Rispetta la natura selvaggia: non lasciare rifiuti e spezza l'uso della plastica.\n\nEN: **Premium Unlock - Fucarino Pine Forest**: this massive forest of Aleppo pines was planted in the mid-20th century to camouflage military depots. Respect the wilderness: do not litter and break plastic habits.$content$, 5 FROM public.pois WHERE name ILIKE '%Palude la Vela%' LIMIT 1;

COMMIT;
`;
fs.writeFileSync("C:/Users/Sem/.gemini/antigravity/brain/edf3a8e6-785a-4c0a-adf8-ccecfa355d1b/scratch/seed_real_contents.sql", content, "utf8");
