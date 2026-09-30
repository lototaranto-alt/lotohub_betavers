---
id: METE-CONSIGLIATE-SPEC
tipo: regola
ambito: specifica-algoritmo-mete-consigliate
stato: Vivente
confidenza: Media
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - docs/storico_chat_vecchia.md:3555
  - docs/storico_chat_vecchia.md:3591
  - supabase/pure_cloud_queries/19_reimposta_mete_consigliate_e_aggiorna_get_pois_rpc.sql:1
  - components/PoiCard.tsx:30
  - app/(tabs)/index.tsx:857
  - supabase/migrations/20260825_whatsapp_bot_setup.sql:123
  - supabase/migrations/20260929120000_mete_consigliate_soft_sorting.sql:1
---

# Mete Consigliate — specifica dell'algoritmo

> **Stato:Vivente, con l'opzione C decisa e il codice scritto il 2026-09-29.**
> La decisione di prodotto e' presa (*l'algoritmo entra nel prodotto*), il conflitto
> con il marketing manuale e' risolto con `recommended_until`, e il raggio di **2000 m**
> e' confermato. La migration e' `supabase/migrations/20260929120000_mete_consigliate_soft_sorting.sql`.
> **Non e' ancora stata eseguita sul cloud**: richiede il tuo intervento nell'SQL Editor.

## 1. La buona notizia

L'algoritmo non ha bisogno di quasi nessuna cosa nuova. Le tre colonne di cui ha bisogno **esistono
già** su `pois`, e sono **già esposte dalla vista che l'app legge**:

| Colonna | Tipo su `pois` | Esposta da | Letta dal client |
|---|---|---|---|
| `loto_quota_max` | `number \| null` | `pois`, `vw_pois_frontend`, `vw_admin_pois` | no (corretto: il cliente non deve vedere la capienza) |
| `crowd_level` | `string \| null` | `pois`, `vw_pois_frontend`, `get_pois*` | **si** — `PoiCard.tsx:30` |
| `is_recommended` | `boolean \| null` | `pois`, `vw_pois_frontend`, `get_pois*` | **si** — `index.tsx:857` |

Quindi **manca una sola cosa: il codice che le scrive.** Non una tabella, non una vista, non una
colonna. Una funzione e un cron.

Ed è una buona notizia anche perché non serve toccare il client: `PoiCard.tsx:30` fa già
`item.crowd_level || 20` e lo mostra come percentuale. Scrivendo `crowd_level` l'interfaccia
si popola da sola.

## 2. Lo stato vero prima di decidere

Nessun file del repository **scrive** `is_recommended` o `crowd_level`. Le due colonne sono lette,
predefinite, e **mai scritte**: sono colonne morte con un reader già pronto.

L'unica scrittura in assoluto è un `UPDATE` manuale:

```sql
-- 19_reimposta_mete_consigliate_e_aggiorna_get_pois_rpc.sql
-- 1. Reimposta il flag is_recommended su alcune mete chiave.
UPDATE public.pois SET is_recommended = true
```

Una cosa da dire chiaramente, perché nel log vecchio è scritto il contrario
(`storico_chat_vecchia.md:3556`): **non è che "il sistema sta riposando perché non c'è massa
critica".** L'algoritmo non è mai stato scritto. Lo scaffale era vuoto perché non c'era niente
dietro, non perché una soglia non si fosse innescata.

## 3. L'algoritmo, come va scritto

L'intento originale (`storico_chat_vecchia.md:3591-3595`) è giusto e vale la pena implementarlo:
quando un posto pieno, **dirigere** le persone altrove invece di farle accumulare. È decongestione,
ed è anche la tesi del report per la PA.

```
INGRESSO   occupazione(P) = numero di check-in in user_pois
                            con poi_id = P, visited_at > now() - 1 ora,
                            is_shadowbanned = false

SOGLIA     P è "in eccesso"  se  occupazione(P) >= loto_quota_max * 0.8
           (se loto_quota_max è NULL, P non è mai in eccesso: si salta)

CANDIDATI  per ogni P in eccesso, i POI Q tali che:
             ST_DWithin(Q.coords, P.coords, 2000)              -- entro 2 km
             AND Q.is_active
             AND Q.category = 'free'                            -- culturali
             AND Q.id <> P.id
             AND Q non è in eccesso                            -- deve essere libero
             AND (Q.is_accessible OR esiste un'alternativa)    -- vedi 5.3

AZIONE     is_recommended = true  per i candidati
           crowd_level     = percentuale di occupazione, per ogni POI valutato
```

Sorgente dell'occupazione: **`user_pois`**, non `crowd_predictions`. È la stessa fonte da cui legge
la heatmap, che funziona (`ESITO-QUERY.md:96`). `user_pois` ha `lat`, `lng`, `poi_id`,
`profile_id`, `visited_at`, `is_shadowbanned` — tutto quello che serve, e niente in più.

## 4. La parte che va fatta bene: la soglia k

Qui è il punto in cui l'algoritmo, scritto male, diventa un problema di privacy.

`user_pois` è **una riga per utente**. Se lo calcolo e lo pubblico così com'è, sto pubblicando il
fatto che **una persona specifica** era in un posto specifico nell'ultima ora. Con 5 check-in nel
Castello scrivo "80% pieno" e chiunque legga il valore sa che ci sono 5 persone, non 500.

Quindi la soglia k **non è un'aggiunta**: è parte della formula.

```
se occupazione(P) < 5:   P non viene valutato, crowd_level resta invariato,
                         e non può innescare niente
```

`5` non è un numero inventato qui: è lo stesso `k` che la heatmap già usa
(`vw_daas_heatmap_15min`, `k≥5`, verificata funzionante in `ESITO-QUERY.md:96`). **Un unico k in
tutto il prodotto**, o la privacy dipende da quale vista hai chiesto.

## 5. Le tre cose che vanno decise prima di scrivere il codice

### 5.1 Il conflitto con la mano — **RISOLTO: opzione C**

**Decisione 2026-09-29: opzione C**, `recommended_until`. Il testo originale resta qui sotto
perché spiega *perché* la C ha vinto, e perché A e B erano sbagliate.

L'algoritmo **e** la mano scrivono la stessa colonna, e non c'è modo di distinguere le due
provenienze. `storico_chat_vecchia.md:3597` dice esplicitamente che il flag a mano è uno
"strumento di marketing": *"vuoi spingere i turisti verso un partner specifico? Metti
`is_recommended = true`*.

Quindi se il cron fa il passo "resetta tutto e ricalcola", **una mattina cancella tutte le scelte
di marketing** che il pannello admin ha messo. Non con un errore: con un risultato plausibile e
sbagliato.

| | Come | Pro | Contro |
|---|---|---|---|
| A | il cron tocca solo le righe non manuali | separa le due provenienze | serve una colonna che dica quale |
| B | il cron non resetta, solo accende | zero modifiche | i flag spenti non si spengono mai, e la lista si allunga |
| **C** ✅ | `recommended_until`, con scadenza | una sola colonza, e la scelta scade da sola | una colonna in più, da gestire nell'admin |

**Perché una sola colonna basta.** La provenienza si legge nel valore:

```
recommended_until NOT NULL   ->  campagna manuale, l'algoritmo non la tocca MAI
recommended_until IS NULL    ->  dominio esclusivo dell'algoritmo
```

Le campagne scadute vengono **spente e restituite all'algoritmo** nella stessa passata. Quindi il
marketing non deve fare pulizia a mano, e ogni scelta ha una scadenza decisa da qualcuno, non
ereditata da un default. È l'unica delle tre che rende le campagne misurabili.

### 5.2 Il raggio — **CONFERMATO: 2000 m**

Il testo originale diceva "1-2 km", che è un intervallo, non un valore. Confermato **2000 m**:
abbastanza largo da coprire un centro storico a piedi, stretto da non mandare nessuno in un
quartiere diverso.

**Attenzione a un dettaglio che sembra di poco conto e non lo è.** `pois.coords` è dichiarato
`unknown` in `types/database.ts`, quindi non si sa se sia `geography` o `geometry`. Su `geography`
`ST_DWithin` ragiona in **metri**; su `geometry` ragiona in **gradi**, e 2000 gradi comprende
l'intero pianeta — cioè ogni POI del database diventerebbe "consigliato". Per questo la migration
scrive `ST_DWithin(c.coords::geography, e.coords::geography, v_radius_m)`: il cast non è
decorativo, è la cosa che impedisce un errore che non si vedrebbe.

### 5.3 L'inclusione accessibile

`storico_chat_vecchia.md:526` dice che `is_accessible` serve "per il soft-sorting inclusivo". Il
senso è giusto: **non deviare le persone verso un POI che non possono raggiungere.** Nella
specifica l'ho scritto in modo provvisorio, perché la versione seria è: se un candidato non è
accessibile, si cerca un'alternativa accessibile entro lo stesso raggio, e solo in subordine si
propone il non accessibile con l'indicazione. Questo merita una riga dedicated, non una condizione
in mezzo a un `AND`.

## 6. Quando gira, e da chi è difeso

**Ogni 5 minuti.** La soglia dell'80% su base oraria non ha bisogno di granularità fine, e 5 minuti
bastano a mantenere l'app reattiva senza carico.

Esiste già un precedente: `supabase/migrations/20260825_whatsapp_bot_setup.sql:123` usa
`cron.schedule` per il bot WhatsApp. **Attenzione però**: alla riga 120 l'estensione è
comentata (`-- CREATE EXTENSION IF NOT EXISTS pg_cron`). Va verificata, non data per scontata.

La funzione va creata **`SECURITY DEFINER`** con `search_path` fisso, come le altre del progetto,
e va negato l'eseguibile ad `anon` e `authenticated`: **è un processo di manutenzione, non una
API pubblica.** Scrivere `is_recommended` da client aprirebbe a chiunque la possibility di
dirigere tutti i turisti della città.

## 7. Ordine di esecuzione

```
1.  [FATTO]  Q23 — opzione C, raggio 2000 m confermati il 29/09
2.  [FATTO]  migration scritta: 20260929120000_mete_consigliate_soft_sorting.sql
3.  [DA FARE] eseguire la migration nell'SQL Editor
4.  [DA FARE] verificare i due tipi (crowd_level, coords) con le query in coda
5.  [DA FARE] seed di loto_quota_max sui POI reali
6.  [DA FARE] abilitare pg_cron se il NOTICE lo segnala, e rilanciare
7.  [DA FARE] il pannello admin deve scrivere recommended_until
```

**Il punto 5 è il più sottovalutato.** `loto_quota_max` è `nullable`, e se resta `NULL` su tutti i
POI la condizione di eccesso non si innesca mai: l'algoritmo gira, e non capita niente, e sembra
funzionante. È la stessa forma di fallimento silenzioso di `crowd_predictions`.

**Il punto 7 non è opzionale.** Senza, ogni scelta fatta a mano dal pannello admin entra nel
dominio dell'algoritmo e viene spenta al giro successivo. La colonna esiste, ma va usata:
`update pois set recommended_until = now() + interval '7 days' where id = '<poi>';`

## 8. Cosa resta non verificato

- `loto_quota_max` sui POI reali: **non so se è popolato**, e senza quello il punto 5 è il
  bloccante vero. Una query: `select count(*) filter (where loto_quota_max is not null), count(*) from pois;`
- Se `pg_cron` è abilitato su questo progetto: se manca, la migration lo dice con un `NOTICE` e
  la funzione resta valida, ma senza cron non gira da sola.
- Se `pois.coords` è `geography` o `geometry`: gestito con il cast, ma va visto.
- Se `crowd_level` è `text` o numerico: una riga da cambiare se è numerico.
- Il valore di `k` per la soglia: uso 5 per allinearmi alla heatmap, ma va confermato come unico
  valore in tutto il prodotto.

## 9. Un difetto del client, trovato strada facendo

`crowd_level` ha **due default diversi nello stesso file**:

```
components/PoiCard.tsx:30   const crowdLevel = item.crowd_level || 20;   // logica
components/PoiCard.tsx:86   ... (item.crowd_level || 85)                 // display
```

La logica considera "affollato" sopra 75, il display mostra 85 quando il valore manca. Quindi un
POI senza dato può essere **visualizzato come pieno al 85% e trattato come non affollato** nello
stesso render. Finché l'algoritmo scrive il campo il difetto è invisibile; il primo POI con
occupazione sotto k lo fa emergere. Serve un default solo. `A7-T9`.
