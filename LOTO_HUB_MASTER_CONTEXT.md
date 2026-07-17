# 🧿 L.O.T.O. HUB - MASTER CONTEXT & SINGLE SOURCE OF TRUTH (SSOT)

> [!CAUTION]
> **DIRETTIVA DI SISTEMA PER L'IA:**
> Questo documento contiene i dogmi architetturali, le formule matematiche e le logiche di business intoccabili del progetto L.O.T.O. HUB. Non riassumere, non omettere e non modificare mai le regole e le equazioni qui presenti senza esplicita direttiva dell'utente.

---

## 1. DOGMI E MODELLO DI BUSINESS

### 1.1 Identità e Zero-Frode
L.O.T.O. HUB ("The Co-Xperience Engine") è un ecosistema B2B2G per la micro-rigenerazione urbana guidata dai flussi turistici.
* **Zero-Frode:** Nessuna trattenuta sulle donazioni civiche. Il 100% dei fondi versati dai Partner finanzia i micro-interventi.
* **Monetizzazione Core (SaaS/DaaS):** Estrazione dati aggregati, snappati a griglie di 110m (GDPR compliance totale), venduti in formato GeoJSON a Enti e Control Room (Città Attenta). L'app supporta la Multi-Tenancy ("Camaleonte") per adattarsi a diversi contesti urbani o eventi (es. Taranto 2026) eludendo i blocchi degli store.
* **Vault Mode (No UGC):** Nessun caricamento foto/video da parte degli utenti. Azzera costi Cloud e rischi legali di moderazione. Il sistema si basa esclusivamente sul "Proof of Action".

### 1.2 Ecosistema B2B Locale: La Coesistenza
Il sistema supporta due binari per i Partner commerciali, gestiti in logica **Zero-UI** tramite un bot WhatsApp (WhatsApp Concierge), rifiutando dashboard complesse:
1. **Adesione Civica (La Regola dei 3 Custodi):** L'esercente finanzia un obiettivo civico reale gestito da un'associazione (Nodo Civico). Genera scarsità ed evita l'inquinamento visivo.
2. **Gestione Eventi (Pay-Per-Footstep):** I partner possono gestire eventi a pagamento. I token vengono scalati all'esercente solo in base ai primi calpestii reali (Proof of Action validata). L'adesione agli eventi in app non è mai forzata ("Candidature Aperte").

---

## 2. ARCHITETTURA E LOGICHE ANTI-FRODE

L'infrastruttura territoriale è **Zero-IoT**: nessun sensore hardware alimentato. Si basa su "Segni del Luogo" (Tag fisici NTAG424 con crittografia nativa o QR Code crittografati in alternativa).
I protocolli di sicurezza sono nettamente separati tra Partner e Utente:

### 2.1 Onboarding Partner (Double GPS Handshake & RLS)
L'esercente NON subisce controlli ambientali. L'attivazione è a due fasi, blindata dalle Row Level Security di Supabase:
1. L'operatore L.O.T.O. posiziona il Tag NFC e registra le coordinate GPS sorgente.
2. Il partner effettua il suo primo scan, inserisce il proprio ID (protetto da RLS) e viene agganciato al bot WhatsApp. Se le coordinate coincidono, il Nodo è live.

### 2.2 Triangolo di Convalida (Solo Utente Turista - Anti-Spoofing)
Il check-in del turista è ibrido (hardware/software) per certificare la presenza fisica.
* **Fattore 1 (Hardware):** Lettura payload crittografato (NFC o QR Code).
* **Fattore 2 (Spaziale):** GPS Tollerante tramite **Formula di Haversine**. Il backend calcola la distanza radiale sferica. Tolleranza applicata (es. 50m) per il rimbalzo nei centri storici.

$$a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1) \cdot \cos(\varphi_2) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$
*(R = 6371000 metri, $\varphi$ = latitudine, $\lambda$ = longitudine).*

* **Fattore 3 (Ambientale):** Densità BLE (Proxy Ambientale). Scansione asincrona dei dispositivi Bluetooth Low Energy (RSSI) per confermare un contesto umano plausibile, smorzato da un filtro cinematico in background.

```javascript
// Logica Density Proxy
const scanEnvironment = async () => {
  const devices = await BleManager.scan([], 3, true);
  const validDevices = devices.filter(d => d.rssi > -80);
  if (validDevices.length >= MIN_CROWD_THRESHOLD) {
     return true; // Contesto umano confermato
  }
  return false; // Spoofing o area disabitata
}
```

---

## 3. GAMIFICATION E FLUSSO UTENTE (Zero-Coercition)

Rifiuto totale di classifiche pubbliche tossiche e competizione infantile.

### 3.1 Dualità Economica
* **Esperienza (XP):** Assegnata per scoperte turistico-culturali.
* **Contributo (PTI):** Token civico assegnato per azioni di impatto collettivo.

### 3.2 Modello B2C Premium vs Freemium
Il "Proof of Action" (scan fisico P.O.I.) rimane obbligatorio per tutti, Premium inclusi.
* **Cosa sblocca il Premium:** Accesso illimitato alla sezione media (audio/storie), sblocco "Skin Neon" per la UI, diritto a un numero prefissato di report e funzionalità extra (Status "Mete Segrete": Da definire).

### 3.3 Flusso Onboarding (Zero-PII)
L'approccio privilegia l'anonimato e l'abbattimento delle frizioni d'ingresso.
1. **Download & Play:** Accesso immediato e anonimo. I dati vengono aggregati localmente.
2. **Salvataggio Profilo:** Per mettere al sicuro l'XP accumulata, l'utente sceglie:
   * *Opzione A (Zero-PII):* Generazione di un QR Code crittografato e ID univoco da salvare/stampare (richiede modulo fotocamera per il ripristino).
   * *Opzione B (Tradizionale):* Creazione account via Cloud/Email.
