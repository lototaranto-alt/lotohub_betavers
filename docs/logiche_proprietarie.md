# ⚙️ L.O.T.O. HUB: Logiche, Formule e Funzioni Proprietarie

Questo documento racchiude il cuore intellettuale dell'ecosistema L.O.T.O. HUB. Descrive in dettaglio le formule matematiche, i pattern architetturali e i modelli di convalida (algoritmi) che rendono la piattaforma sicura, gamificata e "Zero-Frode".

---

## 1. Algoritmi Geospaziali e di Validazione

### 1.1 Formula di Haversine (Distanza Sferica)
Utilizzata sia nel frontend (`utils/haversine.ts`) sia nel backend (funzione RPC `get_distance` in Supabase) per calcolare la distanza in metri tra due coordinate terrestri, tenendo conto della curvatura terrestre.
**Formula Matematica:**
```javascript
a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
c = 2 ⋅ atan2( √a, √(1−a) )
d = R ⋅ c
// Dove R = 6371e3 (Raggio della Terra in metri), φ = latitudine, λ = longitudine
```
**Impiego:** È il motore di base per verificare se un utente si trova effettivamente nel raggio di un Punto di Interesse (P.O.I.).

### 1.2 Triangolo di Convalida (Zero-Spoofing per Turisti)
Per evitare check-in falsi (GPS spoofing), il sistema incrocia tre parametri (ibridazione hardware/software):
1. **Presenza Fisica (NFC):** Lettura di un payload criptato tramite chip NTAG424. Il Deep Link lancia l'app.
2. **Prossimità GPS (Tollerante):** Verifica Haversine con un raggio allargato (es. 50-100 metri) per compensare il rimbalzo del segnale nei centri storici.
3. **Densità BLE (Proxy Ambientale):** Scansione fittizia di dispositivi Bluetooth Low Energy circostanti. Simula il calcolo dell'affollamento per certificare un contesto umano plausibile (es. "Rilevati 34 dispositivi").

### 1.3 Double GPS Handshake (Sicurezza Onboarding Partner)
Logica di attivazione sicura per gli esercenti (Nodi Civici). Non richiede l'invio di documenti cartacei.
**Funzione di Convalida Incrociata:**
```javascript
// Fase 1: Agenzia
GPS_Agency = saveCoordinatesAtInstallation();

// Fase 2: Partner
GPS_Partner = getCoordinatesAtFirstScan();

// Convalida
if (Haversine(GPS_Agency, GPS_Partner) <= TOLLERANZA_METRI) {
    status = 'AUTORIZZATO';
    unlockWhatsAppConcierge();
} else {
    flagForFraud();
}
```

---

## 2. Modelli di Gamification (Zero-Coercition)

### 2.1 Dualità Economica (XP vs PTI)
L'ecosistema non mischia turismo e impegno civico, ma li fa dialogare attraverso due valute:
- **Esperienza (XP):** Assegnata per scoperte culturali e turistiche (es. *Taranto Grand Tour*). Sblocca traguardi intimi nel Medagliere.
- **Contributo (PTI):** Token civico assegnato per azioni di impatto collettivo (es. Segnalazioni urbane, partecipazione a eventi di *Plasticaqquà* o *Diseducation*).

### 2.2 Sistema di Ponderazione Livelli
L'utente turistico progredisce su 3 Tiers calcolati matematicamente in `index.tsx`:
- **Bronzo (LOTO Explorer):** 0 - 99 Tokens (Stemma: Navigazione)
- **Argento (LOTO Voyager):** 100 - 499 Tokens (Stemma: Sicurezza)
- **Oro / Elite (LOTO Master):** 500+ Tokens (Stemma: Corona/Premium)

### 2.3 Progressione Civica a Soglie (Trigger SQL & Frontend)
I badge civili si sbloccano al raggiungimento di conteggi esatti (`count` SQL) di validazioni o segnalazioni, senza mostrare classifiche pubbliche.
**Logica delle Soglie:**
- `count == 1` ➔ *Osservatore Civico*
- `count == 5` ➔ *Esploratore Urbano*
- `count == 10` ➔ *Cittadino Attivo*

---

## 3. Dinamiche di Sviluppo Sostenibile (Motori ESG)

### 3.1 Filtro Cinematico (Tracking Passivo Camaleonte)
In esecuzione asincrona (Background Location), l'app filtra i micro-movimenti inutili per risparmiare batteria e non sporcare il database.
**Funzione di Smorzamento:**
Il sistema scarta i fix GPS se `Distanza(Ultimo_Sample, Nuovo_Sample) < DELTA_MINIMO_METRI` e scatta solo dopo un timer cinematico asincrono (`KINEMATIC_TIMER_MS`).

### 3.2 Motore Impatto Collettivo (Moltiplicatore Sponsor)
> [!WARNING]
> **FORMULA DEPRECATA / NON ATTIVA**
> Questo concetto architetturale è documentato a fini storici. Attualmente il modello di business ha eliminato il moltiplicatore sponsorizzato per semplificare l'economia e mantenere un impatto 1:1.

Originariamente, le azioni individuali riempivano una "Barra Pubblica" condivisa.
L'algoritmo applicava un moltiplicatore ai versamenti se l'azione avveniva in Nodi convenzionati:
```javascript
let contribution = base_xp;
if (poi.type === 'NODO_CIVICO') {
    contribution = base_xp * SPONSOR_MULTIPLIER; // es. 2x (Non più in uso)
}
updateCivicGoal(goal_id, contribution);
```

### 3.3 Calcolo Griglia (Privacy Spatial Hashing)
Nelle segnalazioni urbane (Civic Dashboard), per garantire l'anonimato esatto, le coordinate puntuali del cittadino vengono arrotondate a 3 cifre decimali, creando una cella di griglia di circa 100x100 metri.
**Funzione:**
```javascript
// Privacy by Design: Hashing spaziale
const gridCell = `${location.latitude.toFixed(3)}_${location.longitude.toFixed(3)}`;
saveReport(gridCell); // La posizione esatta non viene esposta ad altri utenti, solo all'Admin
```
