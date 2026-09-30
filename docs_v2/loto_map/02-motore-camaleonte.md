---
id: LM-02-MOTORE-CAMALEONTE
tipo: analisi
ambito: loto-map-02-motore-camaleonte-multi-tenancy
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - context/TenantContext.tsx:214
  - context/TenantContext.tsx:220
  - context/TenantContext.tsx:163
  - context/TenantContext.tsx:116
  - context/ThemeContext.tsx:69
  - context/ThemeContext.tsx:77
  - app/(tabs)/index.tsx:286
  - app/(tabs)/map.tsx:133
  - types/database.ts:968
  - utils/BackgroundLocationTask.ts:38
  - supabase/pure_cloud_queries/62_untitled_query.sql:80
---

# Punto 2 — Il Motore "Camaleonte" (Multi-Tenancy & Geofencing)

> **Esito: l'architettura e' reale e ben fatta, il cablaggio e' a meta'.** Il multi-tenancy
> esiste davvero e puo' cambiare funzioni e nomi senza repubblicare. Ma l'auto-switch da GPS e'
> **commentato fuori**, i colori del tenant ne reggono 2 su 6, e chi e' Premium non vede il colore
> del suo tenant. Il "camaleonte", oggi, ha la pelle ma non cambia.

---

## Le due affermazioni

- **Adattamento dinamico:** UI (colori, logo, temi, mappa POI, sponsor) si adatta da sola per
  geolocalizzazione o per tag NFC.
- **Multi-Tenancy:** l'app interroga `tenants` e `territories` e diventa guida per una masseria, un
  porto o un evento, senza ripubblicare negli store.

---

## Cosa esiste ed e' solido

`context/TenantContext.tsx` (311 righe) e' un'implementazione seria, non un mock. Interroga
`tenants` con `tenant_localizations` (`:110-118`), espone `availableTenants`, e risolve il tenant
attivo con priorita' dichiarata (`:159-166`):

1. **Deep link** `loto://app?tenant=...`
2. **GPS** con Haversine, soglia 50 km
3. **Fallback** sul primo tenant attivo, Taranto per sicurezza (`:190`)

E il "senza ripubblicare" e' **vero sul serio**, perche' e' guidato dai dati:

| Cosa cambia senza uscire dagli store | Dove |
|---|---|
| 7 feature flag (`civic_module`, `events`, `ble_heatmap`, `premium_boost`…) | `TenantConfig.features` + `hooks/useFeatureFlags.ts` |
| 11 stringhe di localizzazione, incluso `points_name` | `tenant_localizations`, usato in `EventDetailSheet.tsx:28` |
| Tetto massimo di POI, partner, eventi attivi | `max_pois`, `max_partners`, `max_events_active` |
| Colori del tenant | `ThemeContext.tsx:75-76` |

E' l'unico claim dei primi due punti che regge per intero, e regge per il motivo giusto: il
cambiamento e' **dato, non compilato**.

---

## Cosa non funziona

### 1. L'auto-switch da GPS e' commentato fuori — CONFERMATO

Questo e' il punto che smentisce la prima affermazione, e sta scritto dentro al codice:

```tsx
// context/TenantContext.tsx:214
// --- DEBITO TECNICO DOC 1: HARD-LOCK SU TARANTO (Alpha) ---
// Sospensione temporanea della logica di auto-switch dinamico entro 50km
// if (minDist < 50) {
//   targetId = closest.id;
// }
targetId = fallbackTenant?.id;   // :220
```

Il ciclo Haversine delle righe 206-212 ** gira, calcola `closest` e `minDist`, e poi li butta via.**
Il risultato non e' "adatta con cautela": e' "taranta sempre", con un commento che spiega perche'.

Quindi oggi l'unico modo per ottenere un tenant diverso da Taranto e' il deep link.

**Un effetto collaterale che nessuno ha scritto da nessuna parte:** le righe 196-199 chiedono e
leggono comunque la posizione GPS, prima di scartare tutto. L'app chiede il permesso di
localizzazione per una computazione il cui output viene buttato. Dopo il punto 1, che promette
Zero-PII, e' un costo di fiducia che si paga per niente.

### 2. Il geofence esiste ma non c'entra con il tenant — CONFERMATO

Il geofencing e' implementato, in `utils/BackgroundLocationTask.ts`: registra le "bolle" attorno ai
monumenti (`:88-98`) e al `:38` reagisce con *"Entrato nel POI"*. Serve a notificare l'utente che e'
arrivato su un POI. **Non cambia tenant, non cambia tema.** E' una funzione diversa con un nome
che fa pensare a questa.

### 3. Il tag NFC non cambia tenant — NON TROVATO

Non esiste un percorso di codice che, leggendo un tag, risolva un tenant. Quello che esiste e'
`assign_and_validate_poi_territory_fn` (validazione di territorio) e `sblocca_media` (sblocco
contenuti). Sono cose diverse: il claim "o al tag NFC scansionato" non ha riscontro.

### 4. I colori del tenant ne reggono 2 su 6 — CONFERMATO

Il tipo `TenantColors` (`:9-12`) dichiara **solo** `primary` e `secondary`. E il popolamento dei
dati (`:128-131`) scrive **solo** `primary` e `secondary`. Poi il tema prova ad usarne sei:

```tsx
// context/ThemeContext.tsx:77-81
background: (currentTenant?.colors as any)?.background || baseTheme.background,
surface:    (currentTenant?.colors as any)?.card      || baseTheme.surface,
card:       (currentTenant?.colors as any)?.card      || baseTheme.surface,
text:       (currentTenant?.colors as any)?.text       || baseTheme.text,
tint:       (currentTenant?.colors as any)?.tint       || baseTheme.primary,
```

Quei quattro `as any` sono l'avviso. Servono a far tacere TypeScript su un campo che **non esiste**:
`background`, `card`, `text` e `tint` sono sempre `undefined`, quindi il fallback parte sempre e in
silenzio. Il cast non e' stato messo perche' il campo fosse dinamico: e' stato messo perche' manca.

Conseguenza: **il whitelabel e' al 33%**, e non lo si vede.

### 5. Il Premium non vede il colore del suo tenant — CONFERMATO

```tsx
// context/ThemeContext.tsx:69-72
const baseTheme = isElite ? ELITE_THEME : FREEMIUM_THEME;
const theme = isElite ? baseTheme : { ...baseTheme, /* colori tenant qui */ };
```

La ternaria **scarta** i colori del tenant per chi e' Elite. E' una scelta consapevole, il commento
alla riga 67 la chiama "status symbol", e puo' anche essere giusta. Ma significa che **il partner
che paga per il whitelabel e vede il tema scuro di default**, non il suo. Se il tenant e' il
prodotto, il premium non dovrebbe essere l'eccezione che lo disattiva.

### 6. `id` e `slug` confusi sulla stessa colonna — CONFERMATO, con un buco silenzioso

`tenants` ha **sia** `id` **sia** `slug` (`:968`, `:973`), entrambi `string`: TypeScript non puo'
catturare la confusione. E intanto il codice li usa come se fossero la stessa cosa:

| Riga | Filtro | Usa |
|---|---|---|
| `map.tsx:133` | `.eq('tenant_id', currentTenant.slug)` | **slug** |
| `index.tsx:372` | `.eq('tenant_id', currentTenant?.slug \|\| 'taranto')` | **slug** |
| `index.tsx:286` | `.eq('tenant_id', currentTenant.id)` | **id** |

La colonna `pois.tenant_id` e' un `TEXT` creato a mano con default `'taranto'` (`62_untitled_query.sql:80`),
quindi **contiene slug**. Se `tenants.id` e' un UUID, `index.tsx:286` sta filtrando
`pois.tenant_id = '<uuid>'` e restituisce **zero righe senza errori**.

Stessa confusione nei deep link: il commento alla riga 163 documenta `loto://app?tenant=borgo-test`,
che ha l'aria di uno slug, ma il valore finisce in `fetchTenantById`, che filtra `.eq('id', tenantId)`
(`:116`). Chi segue il commento con un slug non trova il tenant.

Da confermare sul cloud con `Q17`: il tipo reale di `tenants.id` e cosa contiene davvero
`pois.tenant_id`.

---

## Il problema di fondo: il camaleonte non e' nelle migration

Tutto il sottosistema multi-tenanti nasce **solo** nei 63 export del SQL Editor e **mai** in
`supabase/migrations/`:

`tenants`, `tenant_localizations`, `tenant_associations`, `tenant_events`, `tenant_badge_overrides`,
`territories`, `media_vault`, `user_unlocked_media`, e le funzioni `sblocca_media`,
`assign_and_validate_poi_territory_fn`, `insert_poi_standardized`,
`verify_checkin_speed_plausibility_fn`.

Delle 11 migration, una sola la tocca: `idx_profiles_tenant`. Nessuna la crea.

Questa e' la forma piu' concentrata del problema S1: il pezzo di prodotto che dovrebbe rendere il
sistema "scalabile e replicabile senza store" e' **quello con la replicabilita' peggiore**, perche'
non e' riproducibile affatto. Se il DB venisse ricreato da `supabase/migrations/` domani, L.O.T.O.
Map partirebbe senza tenant: niente colori, niente localizzazione, niente feature flag.

---

## Che cosa chiedere a NotebookLM

Da porre a questa fonte, una domanda alla volta:

1. "Elenca gli oggetti che il motore camaleonte richiede e che non risultano creati da
   `supabase/migrations/`."
2. "Elenca le incongruenze id/slug che trovi in `TenantContext`, `index.tsx` e `map.tsx`."
3. "Quali affermazioni del punto 2 sono supportate da una prova con `path:line` e quali no?"

Se la terza risposta mescola le due cose, il documento ha un difetto: me lo segnali.

## Cosa blocca questo punto

- **`A7-T4`** — riattivare l'auto-switch da GPS o cancellare il codice morto. Il debito ha un
  commento che promette "temporaneo" senza data: o si riattiva, o si rimuove, e si smette di
  pagare il permesso GPS per niente.
- **`A7-T5`** — allineare i 6 colori: o si estende `TenantColors` e il popolamento, o si tagliano i
  4 campi e i 4 `as any`. Il cast non e' un workaround, e' una promessa non mantenuta.
- **`A7-T6`** — decidere se il Premium eredita i colori del tenant.
- **`A7-T7`** — scegliere `id` o `slug` come chiave univoca, e allineare le tre righe piu' il
  deep link. **Prima questo, poi tutto il resto del multi-tenancy.**
- **`A7-T8`** — portare il sottosistema tenant dentro la catena di migration. Senza questo, S1 non
  chiude.
- **`Q17`** — `tenants.id`: UUID o testo?
