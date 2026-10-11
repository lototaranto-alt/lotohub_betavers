# RAPPORTO DI CHIUSURA - FASE 0

## 1. Oggetto
Chiusura della Fase 0 (read-only) con consolidamento delle misurazioni eseguite, registrazione delle decisioni assunte (P-D1–P-D6) e definizione dell'ordine di esecuzione per la Fase 1.

## 2. Stato Generale
- Modalità Piano ATTIVA: nessuna modifica ai file o al database fino a esplicito sollevamento da parte dell'utente.
- Safety Net verificato: HANDOFF.md, handoff.ps1 -Lock e SHA256SUMS.txt integri. handoff.ps1 -Lock ritorna EXIT 0.
- Metodo applicato: conforme a METODO-LAVORO.md (misura prima di modificare, nomi ≠ evidenza, correzioni registrate, one script = one result set).
- Autorità: docs_v2/tooling/autorita.json vigente; divergenze documentate in STATO-FASE-0.md. alidate.py (54 docs, 18 scopes, 0 errori) da rilanciare dopo aggiornamento brand.

## 3. Decisioni Assunte (P-D1 – P-D6)
Le decisioni sono state rinominate da D1–D6 a **P-D1 – P-D6** in PIANO-LAVORO-MODULARE.md per evitare collisioni con docs_v2/DECISIONI.md (D1–D15).

### P-D1 – Primo check-in fuori dal sistema standard
Trattamento isolato del primo check-in dell'utente, fuori dalla classificazione a tre fasce basata su velocità (scan_poi_gps).

| Campo | Valore | Giustificazione |
|---|---|---|
| xp_awarded | **20** | Premio fisso esplicito, costante letterale (non pois.xp_reward). |
| co2_saved | **0** | 1.5 kg presuppone classificazione "pedonale" verificata da velocità. Non misurabile al primo check-in. |
| 	okens_earned (PTI) | **0** | 10 PTI legati a fascia pedonale (speed-based). Non verificabile. |
| calculated_speed_kmh | **NULL** | "Velocità non misurabile". Elimina sentinello 9999 (codice morto). |
| is_shadowbanned | **FALSE** | Visibile in storico e avvia conteggio secondo check-in. |
| ction_type | **'tourist_checkin'** | Invariato. Distinzione via calculated_speed_kmh IS NULL. Preserva filtri su impact_transactions. |

Rischio accettato: XP fisso + supabase.auth.signInAnonymously() (pp/_layout.tsx:66) → potenziale farming via nuovi UUID. Non regressione; da registrare in DECISIONI.md.

### P-D2 – Cold-start e ramo anti-velocità
Con _speed_kmh IS NULL ramo ELSE esplicito (non caduta). Eliminato IF v_speed_kmh IS NULL THEN v_speed_kmh := 9999; END IF (~225–227): NULL > 130 non TRUE → nessuno shadowban su cold-start. 3 fasce invarianti 27/09–29/09 per check-in successivi.

### P-D3 – Coerenza curva livelli
**LV1 → LV2 = 30 XP** (utils/levelUtils.ts:81).

| Check-in | Cumulativo | Livello |
|---|---|---|
| #1 | 20 XP | LV1 (0 ≤ 20 < 30) |
| #2 pedonale | 20+15=35 XP | LV2 |
| #2 veicolare (20–130) | 20+2=22 XP | LV1 (corretto) |

+5 XP tappa 1→2 (cosmetico). EVENTS_UNLOCK_LEVEL=2 → REVEAL "LA VOCE DELLA CITTÀ" (/(tabs)/map) + WHISPER LEVEL_UP_LORE[2].

### P-D4 – Ledger e action_type
ction_type='tourist_checkin' invariato. Primo check-in in impact_transactions (non shadowbanned). Filtri xp_ledger preservati.

### P-D5 – Eliminazione sentinello 9999
Rimosso. IF v_speed_measurable THEN ... ELSE ... END IF con NULL semantica corretta.

### P-D6 – Non-regressione
Solo ramo cold-start. Soglie 130 km/h, 20–130, ELSE pedonale invarianti 27/09–29/09.

## 4. Misurazioni Fase 0 Eseguite
| Misura | Esito | Punti chiave |
|---|---|---|
| 04a scan_poi_gps | Eseguita | 7289 char, gate prossimità, init 0, ramo 9999 presente (n=2) ma dead, shadowban NOT TRUE. |
| 05a w_collective_impact | Eseguita | RLS off, owner postgres, 377, total_checkins da scans orfane→0, 1 riga zero. |
| 05b w_daas_heatmap_15min | Eseguita | 1068, anon_sel=false, k-anon >=5, grid ~111m, guard is_loto_admin(). |
| 06 is_loto_admin() | Eseguita (§7h) | SECURITY DEFINER, search_path public (pg_temp assente), ACL ok, body usa profiles.admin_role (bypassa RLS). |
| 06b utilizzo | Eseguita | 5 viste DaaS + vw_dev_telemetry_daily + vw_user_dashboard_metrics (2551). vw_collective_impact esclusa. |
| 07 profiles.admin_role scrivibile | Eseguita (§7i–§7k) | **APERTO**. UPDATE qual uid=id, with_check nessuna; has_column_privilege UPDATE true; CHECK consente dmin; polroles vuota PUBLIC; SELECT qual true. → escalation possibile a admin. |
| 08 guard vista | Pianificato (READ-ONLY) | SOLO SELECT. Rettifica §7j: w_user_dashboard_metrics ha OR public.is_loto_admin() (NON admin-only). |

## 5. Divergenze Documentazione↔Misurazioni
| Riferimento | Stato | Note |
|---|---|---|
| A4:120 | Obsoleto | Hardening presente su 5 viste; eccezione vw_collective_impact (no gate, anon_sel=true). SSOT §6.2. |
| A4:66 | Confermato | is_loto_admin() unico gate + REVOKE FROM PUBLIC. |
| A3:76 | Pericolo | v22/v23/v24 drop+create senza gate + GRANT anon → annullano hardening. Vincolo M15. |
| D15 Brand | Da riaprire | → L.O.T.O. MAP (Life On The Outside) Co-Experience Engine in A8 + validate.py. |

## 6. Moduli Nuovi e Aggiornamenti
| Modulo | Priorità/Stato | Ambito |
|---|---|---|
| M14 | BLOCCANTE | Policy profiles ristrette + count_profiles() RPC + precondizioni nickname/UNIQUE. |
| M15 | ALTA | Guard DaaS 5 viste + protezione v22/v23/v24. |
| M16 | MEDIA | events RLS attivo + policy ristrette. |
| M17 | MEDIA | scans orfane + total_checkins=0. |
| M3 | Raccomandazione | Non bloccante. |
| M8 | ANNULLATO | Nessun trigger utente per confirmed. |
| D2 | Risolto su schema | Colonne già nullable. |

## 7. Ordine Fase 1
M14 → M4 → M5 → M15 → M11 → M6 → M7 → M9 → M10 → M16 → M17 → M12 → M13

**M7 (scan_poi_gps):**
`sql
IF v_speed_measurable THEN
  -- 3 fasce invariati
ELSE
  v_xp_awarded:=20; v_pti_awarded:=0; v_co2_saved:=0.0; v_is_shadowbanned:=FALSE; v_speed_kmh:=NULL;
END IF
-- action_type='tourist_checkin' invariato
`

## 8. Impatti Client
| Componente | Impatto policy ristrette | Mitigazione |
|---|---|---|
| Letture per uid (layout/theme/notifications/profile/index/PoiDetailSheet/server) | Ridotte a per-row | Sopravvivono. |
| Write proprio profilo (upgrade/profile/modal) | Ristrette | Sopravvivono (uid=id). |
| PlasticaqquaEventSheet:24 + admin/dashboard:31 (ghostUsers) | Count globale | count_profiles() RPC (M14). |
| TouristBaptismModal 41–46 (dedup nickname cross-user) | SELECT globale rimosso → 0 match | Precond: 0 duplicati; valutare UNIQUE + 23505. |
| daas.ts (anon+session), login-form (password) | Dipendenze guard | Come sopra. |

## 9. Punti Aperti (non bloccanti Fase 1)
1. civic_reports.status='confirmed' mai scritto da app → community/CivicDashboard vuoti → Fase 3.
2. Backfill user_pois.calculated_speed_kmh: esistenti 0, nuovi NULL → dichiarare in audit B2B.

## 10. Azioni Chiusura Fase 0
1. Scrivere/eseguire supabase/diagnostica_fase0/08_vw_user_dashboard_metrics_guard.sql (SOLO SELECT).
2. STATO-FASE-0.md: §7j rettifica (OR), §7k verdict 07 APERTO, §8 aggiornato.
3. PIANO-LAVORO-MODULARE.md: P-D1–P-D6, M14–M17, M3 raccomandazione, M8 ANNULLATO, D2 risolto, dipendenze+ordine, A4:120/A3:76.
4. HANDOFF.md: 07 eseguito, 08 in manifest, PROSSIMA AZIONE → Fase 0 chiusa → Fase 1 M14.
5. handoff.ps1 -Lock: rinnovo SHA256.
6. docs_v2/aree/A8_lessico_e_marchio.md: brand D15 → nuovo string; rilanciare alidate.py (0 errori atteso).

## 11. Prossimo Passo
Solo dopo esplicito sollevamento modalità Piano: **Fase 1 → M14** (sequenza §7).

Riferimenti: METODO-LAVORO.md, HANDOFF.md veto #8, utorita.json, SSOT 482/482, A4:66, levelUtils 79–81, 20260929160000:216–270.
