# LOG-LAVORO — prossimi passi

Aggiornato 2026-10-04. Compatto, per export.

## 1. process_crowd_radar — identità non verificata (il più aperto)

`p_reporter_id` arriva come parametro e nel corpo letto non c'è confronto con
`auth.uid()`. Se la conferma è nelle righe troncate, chiunque scrive dati
analitici a nome di altri.

Prima: finire di leggere il corpo. Poi: `v_reporter_id := auth.uid()` e ignorare
il parametro.

## 2. civic_reports — policy aperta a chiunque

`Civic access` ha `cmd=ALL`, `roles={public}`, `using=true`. Su una policy `ALL`
il `USING` vale anche come `WITH CHECK`, quindi scrittura e `UPDATE` sono
aperti. E l'`UPDATE` permette la self-conferma: un utente che fa
`status='confirmed'` sul proprio report sblocca la Doppia Convalida da solo.

`DROP` la policy, poi `SELECT` con `status='confirmed'` e tenant, `INSERT` con
`WITH CHECK (auth.uid() = user_id)`. Non basta aggiungere: le policy sono
permissive e si combinano in OR.

## 3. civic_reports — il match è circolare

Il trigger `civic_confirmed` cerca solo righe con `status='confirmed'`, ma
l'unico modo di diventare `confirmed` è il trigger stesso. Quindi nessuna riga
può essere la prima confermata e il match non può mai attivarsi.

Il filtro voleva essere `'pending_match'`? Ipotesi, non certezza. Non applicare
senza decisione: cambia chi riceve la ricompensa.

## 4. Ricompensa differita: non esiste

Niente PTI, niente XP al match. Il trigger non scrive in `impact_transactions` e
non chiama `process_esg_impact`. Manca l'intero passo 3 della specifica.

## 5. Badge — dopo civic_reports

- policy di lettura su `badges` (pubblica) e `user_badges` (solo `auth.uid()`)
- `user_badges.badge_id` ha FK verso `badge_templates`, che è **vuota**, mentre i
  3 id reali stanno in `badges`: correggere la FK
- assegnazione server-side su `badges.req_xp`
- cancellare `badgeAssignment.ts`, che scrive dal browser e ingoia l'errore

## 6. Tri-stato `is_shadowbanned` — decisione tua

Oggi `9999` è la sentinella del cold-start. Una query `WHERE calculated_speed_kmh
> 130` legge il primo check-in come falso GPS. Il calcolo è corretto, la
leggibilità no. Non è un bug di sicurezza e cambia la definizione della colonna.

## 7. HeatScore su dispositivo

`tsc` verde non basta: il cloud non vede i colori.

---

## Chiuso il 2026-10-04

- **shadowban**: verificato e funzionante. Soglia 130 km/h, delta temporale
  presente, cold-start gestito con `9999`, `is_shadowbanned` scritto su
  `user_pois`. Le mie due preoccupazioni erano infondate.
- **`calculate-esg-impact`**: non deployata (404 identico al controllo).
- **forgia ESG** e **borraccia lato utente**: committate.
- **HeatScore**: fondo reale su `user_pois` e decadimento del boost, committata.

## Metodo

Dopo quattro errori miei, la regola è: **non cercare per nome.** Per ogni
tabella chiedere "chi scrive e chi legge qui", enumerando trigger, funzioni e
policy.

I commenti del repo non sono affidabili. Quattro casi in cui promettevano
protezioni inesistenti: il cap anti-manomissioni di `process_crowd_radar`, la
"Doppia Convalida Civica" su una media a un solo reporter, la policy
`CivicReports Access`, e la promessa che XP e PTI passassero dal ledger.
