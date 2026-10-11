# PIANO - CHIUSURA FASE 0 - RIEPILOGO
## 1. Oggetto
Chiusura della Fase 0 (read-only) con consolidamento delle misurazioni, registrazione P-D1-P-D6 e ordine Fase 1.
## 2. Stato Generale
- Modalità Piano ATTIVA: nessuna modifica file/DB fino a esplicito sollevamento.
- Safety Net: HANDOFF.md, handoff.ps1 -Lock, SHA256SUMS.txt integri; handoff.ps1 -Lock EXIT 0.
- Metodo: conforme a METODO-LAVORO.md (misura prima, nomi≠evidenza, correzioni registrate, one script=one result set).
- Autorità: autorita.json vigente; divergenze in STATO-FASE-0.md. validate.py 54 docs/18 ambiti/0 errori da rilanciare dopo update brand.

## 3. Decisioni P-D1-P-D6
### P-D1 - Primo check-in fuori da sistema velocità
| Campo | Valore | Note |
|---|---|---|
| xp_awarded | 20 | fisso, letterale (non pois.xp_reward) |
| co2_saved | 0 | 1.5kg presuppone pedonale verificato; non misurabile |
| tokens_earned (PTI) | 0 | legati a fascia pedonale |
| calculated_speed_kmh | NULL | "non misurabile", elimina 9999 |
| is_shadowbanned | FALSE | resta visibile, avvia 2° check-in |
| action_type | 'tourist_checkin' | invariato; distinzione via NULL |

Rischio: XP fisso + signInAnonymously -> potenziale farming; da registrare in DECISIONI.md.

### P-D2 - Cold-start
v_speed_kmh NULL -> ELSE esplicito. Eliminato ramo 9999 (~225-227). Fasce (>130/20-130/ELSE pedonale) invarianti 27/09-29/09 per successivi.

### P-D3 - Curva livelli LV1->LV2=30 XP
| Check-in | Cumulativo | Livello |
|---|---|---|
| #1 | 20 XP | LV1 (0<=20<30) |
| #2 pedonale | 35 XP | LV2 |
| #2 veicolare 20-130 | 22 XP | LV1 |

+5XP cosmetico. EVENTS_UNLOCK_LEVEL=2 -> REVEAL "LA VOCE DELLA CITTÀ" (/(tabs)/map) + WHISPER LEVEL_UP_LORE[2].

### P-D4 - Ledger/action_type
action_type invariato; primo check-in in impact_transactions (non shadowbanned); filtri xp_ledger preservati.
### P-D5 - Elimina 9999
Con IF v_speed_measurable...ELSE, NULL semantica corretta.
### P-D6 - Non-regressione
Solo ramo cold-start; soglie invarianti 27/09-29/09.

## 4. Misurazioni Fase 0
04a scan_poi_gps; 05a vw_collective_impact; 05b vw_daas_heatmap_15min; 06 is_loto_admin; 06b utilizzo (5 viste); 07 profiles.admin_role scrivibile (APERTO); 08 guard vw_user_dashboard_metrics (solo SELECT, pianificato).

## 5. Azioni chiusura Fase 0
1. Crea/esegui supabase/diagnostica_fase0/08_vw_user_dashboard_metrics_guard.sql (SOLO SELECT)
2. STATO-FASE-0.md: §7j rettifica (OR), §7k 07 APERTO (4 pti + CHECK admin), §8 aggiornato
3. PIANO-LAVORO-MODULARE.md: P-D1-P-D6, M14-M17, M3 raccomandazione, M8 ANNULLATO, D2 risolto; matrice+dipendenze+ordine; A4:120 obsoleto, A3:76 pericolo; rinvia generalizzazione Plasticaqqua->CommunityEventSheet a Fase 2 (post M14-M16)
4. HANDOFF.md: 07 eseguito, aggiungi 08, PROSSIMA AZIONE "Fase 0 chiusa -> Fase 1 M14"
5. handoff.ps1 -Lock: rinnovo SHA256
6. A8_lessico_e_marchio.md: fix "Engine Engine"->"Engine", brand D15 corretto; run validate.py (0 errori atteso)

## 6. Fase 1 - M14 (avvio)
- profiles RLS: solo proprio id (USING/WITH CHECK auth.uid()=id), rimuovere SELECT globale
- admin_role: revoca UPDATE su admin_role, impedire impostazione pubblica
- RPC public.count_profiles() (copre PlasticaqquaEventSheet:24 e loto-admin-v2/(dashboard)/page.tsx:31)
- UNIQUE(nickname): precheck 0 duplicati + gestione 23505 in TouristBaptismModal
- swap global counts con RPC; note su user_badges (M10)
Rinvia generalizzazione UI a Fase 2 (post M14-M16). EventDetailSheet resta archetipo.
