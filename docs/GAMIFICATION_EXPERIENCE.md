<!-- Stato: Vivente -->
<!-- Scopo: Documentare l'esperienza gamification complessiva, i suoi scenari d'uso e le decisioni (Progressive Disclosure, Fog of War "Avventura") -->
<!-- SSOT: questo file è la "mappa dell'esperienza"; i vincoli testuali/narrativi stanno in gamification_struttura_narrativa.md; lo stato realizzato sta in REPORT_GAMIFICATION_STATUS.md -->
<!-- Owner: Gamification & UX -->
<!-- Ultimo aggiornamento: 2026-09-21 -->

# L.O.T.O. HUB — Esperienza Gamification: Scenari e Decisioni

> **Questo documento risponde a:** "come si sente l'esperienza nei diversi momenti del viaggio dell'utente, dove i blocchi aiutano e dove rischiano di rovinare, e come vogliamo gestire la Nebbia (Fog of War)."

---

## 1. Filosofia: Modello "Avventura senza coercizione"

- L'utente è un **viaggiatore** in una città che si *svela*: la scoperta è premiata (XP), non punita la mancata azione.
- 50 livelli in 5 Tier tematici: **Il Risveglio del Seme (1-10) · Le Radici Sommerse (11-20) · La Linfa Vitale (21-30) · Il Respiro Urbano (31-40) · La Fioritura del Loto (41-50)**.
- Ogni feature "bloccata" per livello è presentata come **anticipo di un mistero** (`??? (LV.N)`) e mai come un errore (energia: G7 → `FeatureLockSheet`, MAI `Alert`).
- **XP** guida crescita personale e sblocchi narrativi. **PTI** restano puro impatto civico collettivo, mai leva di sblocco (vincolo assoluto).

## 2. Il Viaggio in 5 atti

| Atto | Momento | Meccaniche in campo | Sensazione voluta |
|---|---|---|---|
| **1. Il Seme** | Onboarding → primo check-in | Wizard, gate tab reattivo, check-in NFC, LevelUpLore | "Appena piantato un seme: il primo germoglio" |
| **2. Le Radici** | Prime 1-2 esplorazioni | Vault, Badge tematici, online/offline sblocco media | "Sto costruendo la mia biblioteca" |
| **3. La Linfa** | Loop quotidiano (home) | **Fiore 3 Petali** (2km/1check-in/sfida), Fog of War, Memorie | "Un rito quotidiano leggero, non un compito" |
| **4. Il Respiro** | Progressione intermedia | Tier LV31+, Community LV5 (lock), Co-Experience LV20 | "La città risponde con me" |
| **5. La Fioritura** | Utente avanzato | Elite theme, integrazione civica, squadre | "Ho lasciato un segno misurabile" |

## 3. Scenari d'uso (verifica anti-danno)

### 3.1 Turista di passaggio (1-3 giorni)
- **Rischio:** tante soglie visibili = "gioco impossibile, app per residenti".
- **Mitigazione:**
  - Le soglie **basse** (LV1-2-5) scattano quasi subito: il primo giorno si vive già un Level-up.
  - Il **Fiore 3 Petali** mostra obiettivi fattibili in giornata (2km e 1 check-in).
  - Soglie alte (LV20/30/40) compaiono come **mistero** (`???`) e non come parete.
  - Fog of War **OFF di default** in questo scenario: il turista deve vedere la mappa "a vetrina", non un rompicapo.

### 3.2 Cittadino quotidiano (loop lungo)
- Obiettivo: **Zeigarnik** (chiave F4). Il Fiore riempito ogni giorno crea il ritmo.
- Il cittadino esplora per zone: qui **Fog of War ha senso come strumento volontario** per rendere "memoria" i luoghi già toccati e dare mistero ai nuovi.

### 3.3 Utente Premium/Elite
- È il "curatore": tema Elite, Co-Experience, Vault pieno. Meno sblocchi visibili, più impatto collettivo.

### 3.4 Guest senza account
- Nessun livello reale: gate mostrati come LV1 sempre superati o come `???`. Nessun dato PII.

## 4. FOCUS DECISIONE — Fog of War ("Nebbia della Memoria")

### 4.1 Stato attuale (implementato in F6)
- Toggle **"Nebbia della Memoria"** nel tab DIARIO del Profilo, persistito su `@loto_fog_of_war`.
- Effetto mappa: i POI non ancora scoperti (da `user_pois`) si velano (opacità bassa, icona ridotta). Quando si scopre un luogo il pin torna nitido.
- **Default: OFF.** La Nebbia è una scelta esplicita, non uno stato di partenza.

### 4.2 Analisi scenari (quando aiuta / quando rovinerebbe)
| Scenario | Aiuta | Rovinerebbe |
|---|---|---|
| Cittadino che esplora da settimane | Sì: rende "memoria" e mistero, guida la curiosità | — |
| Turista al primo giorno | — | Sì: la città sembra vuota; ostacola la "vetrina" e spinge a rinunciare |
| Utente che vuole pianificare un giro | Mediante: serve poter "spogliare" i veli per orientarsi | Sì se non si può disattivare al volo |
| Modalità batteria/solo GPS | Sì: mascherare i pin riduce il rumore visivo | — |
| QA / screenshot marketing | — | Sì: mappa morta = pessima prima impressione |

### 4.3 Decisione presa (da registrare in PARTE D del REPORT)
1. La Fog of War resta un **on/off** (già tale).
2. Per le situazioni "al volo" si aggiunge un **quick-toggle sulla Mappa**: icona `blur-on`/`blur-off` in appoggio alla UI mappa, che mostra lo stato corrente. Così non serve entrare nel Profilo per disattivarla.
3. **Proposta "Modalità Avventura"** (discussa, ancora aperta): un comando sulla Home ("Avventura On/Off") che attiva come PACCHETTO: Fog of War + testi/Whispers più evocativi + niente scorciatoie visive. Su toggle ON la Home diventa più "da diario"; su OFF l'app resta una "boutique" comoda. **Vantaggio**: una sola leva per il modo esplorativo. **Rischio**: scoperta solo se l'utente la trova; si propone un invito sottile la prima volta che si sblocca la Comunità (LV5) e mai prima.
4. In attesa della decisione sul pacchetto, il quick-toggle sulla mappa è **basso costo e ad alto valore**: va fatto.

### 4.4 Regole riviste (vincoli permanenti)
- Fog of War **sempre** OFF al primo avvio e per i nuovi tenant.
- Ogni pin velato resta **tappabile** (la Nebbia non blocca la navigazione: solo estetica).
- La Nebbia NON interagisce con l'economia: non nasconde PTI, non blocca punti di ricarica (fontane sempre visibili per l'idratazione).