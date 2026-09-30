---
id: PIANO-DECISIONE
tipo: analisi
ambito: sequenza-consigliata-e-nodo-strategico-da-decidere
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - app/_layout.tsx:88
  - supabase/migrations/20260926120000_scan_chain_canonical.sql:157
  - supabase/migrations/20260927090000_scan_chain_shadowban_and_ledger.sql:149
  - docs_v2/NOTEBOOKLM-BRIEFING.md:1
  - docs_v2/ULTIMO-MIGLIO-BLOCKS.md:52
---

# Piano: in che ordine procedere

> Questo documento non aggiunge task. È l'**ordine** in cui affrontarli, e la ragione per cui due
> dei cinque passi costano quasi nulla ma validano tutto il resto.
>
> I task restano in [`TASKS-PER-AREA.md`](TASKS-PER-AREA.md). Qui non se ne duplica nessuno.
> Se questo piano e l'indice divergono, vale l'indice per *cosa* e questo per *quando*.

---

## Il ragionamento in una riga

Ho ordinato le cose per **correttezza**, non per impatto percepito. È una scelta, non un fatto, e
vale la pena dichiararla: chiude i buchi prima di costruire. Se l'obiettivo è un'altra cosa, la
sequenza va rovesciata — vedi §6, che è il nodo aperto.

---

## I blocchi, in una tabella

Il **metodo** è in [`METODICA.md`](METODICA.md): nessuna affermazione senza `file:linea`, e un blocco
si chiude solo con una prova, mai con un'intenzione. Qui sotto c'è solo *quale* blocco e *dove* siamo.

| | blocco | stato | criterio di uscita | chi |
|---|---|---|---|---|
| **B0** | integrità del profilo | **chiuso, L3** | identità e profili invariati offline | da committare |
| **B1** | integrità del check-in | **in corso** | entro il raggio passa, fuori viene respinto | io preparo, **tu applichi** |
| **B2** | le query cloud | in coda | un'area intera non è più ferma su un file di testo | **solo tu** |
| **B3** | offline, NFC, coda | dopo B1 | la catena regge senza rete | io + dispositivo |
| **B4** | accessibilità, archivio | dopo `Q26` | il banner dice il vero | io + cloud |
| **B5** | ricostruzione DB | **bloccata** | dipende da `Q4` | scommessa, non piano |

**La regola che tiene i blocchi separati** è in `METODICA.md` §4: ogni blocco dichiara cosa **non** è
in scope, e se serve altro si finisce questo e si apre il successivo. Un blocco che cresce mentre lo
esegui non finisce mai.

**Perché `B2` lo porti tu e non posso farlo io.** Il cloud non è ispezionabile dall'agente: vedo i 63
export e le 9 migration tracciate, non ciò che gira davvero. Le query le lanci tu, e **portami
l'output, non la risposta che ti aspetti**.

---

## 1. Un giro da telefono. Prima di tutto, e prima del commit.

**Perché è primo.** Verifica il fix del Blocco 0 *prima* che venga committato: si committa un fix
verificato, non uno sperato. E più in generale chiude lo scarto più grande di tutto il lavoro fin
qui, perché nessuna delle 47 affermazioni scritte ha mai visto l'app funzionare.

**Stato al 29/09 sera: FATTO.** Il giro è stato eseguito e documentato in
[`VERIFICA-RUNTIME-2026-09-29.md`](VERIFICA-RUNTIME-2026-09-29.md). Esito: il Blocco 0 regge offline,
il profilo non si ricrea, e tre nuovi difetti sono emersi. Le 47 affermazioni sono salite di livello
per una parte, non per tutte.

**Non generico.** "Vedere lo stato dell'app" non produce niente. Ogni osservazione va agganciata a
una domanda aperta. Vedi §1.1 per la checklist.

`A5-T5` (mai fatto) · il vincolo cloud resta: nessuna modifica senza autorizzazione

### 1.1 Cosa guardare, in ordine di valore

**Prevenzione perdita dati, 5 secondi.** `git add app/_layout.tsx` prima di iniziare. Non un commit,
lo staging: se durante il giro fai un cambio di branch o uno stash, il fix è protetto. Un fix perso
a metà è peggio di uno staging.

**Le due verifiche che contano di più.**

1. *Il fix del Blocco 0 funziona?* Modalità aereo, riavvia l'app, guarda l'`user_id` in
   AsyncStorage prima e dopo. Se è lo stesso, il fix regge. Se è cambiato, il ciclo è ancora vivo.
2. *I profili abbandonati sono aumentati?* Erano cinque il 26/09. Se ora sono di più, il fix non ha
   tenuto. È l'informazione più importante che il giro può portare.

**Le altre cinque, in ordine di rapidità.**

3. *Banner di accessibilità.* Apri un POI con stato sconosciuto. Secondo `A7-T10` non deve **mai**
   comparire. Tre secondi a occhio.
4. *Check-in senza rete.* Deve comparire l'Alert "Errore GPS" e il check-in va perso. Conferma
   `A5-T9`.
5. *La chiamata a `scan_poi_gps`.* Guarda che invii `p_lat` e `p_lng`, e annota la risposta.
6. *Il BLE.* Se parte, cerca il log `BLE Error`.
7. *La coda offline.* Sblocca un media senza rete e vedi se si accoda.

**Una cosa che è meglio non fare.** Il test che confermerebbe in modo definitivo il proximity
gate — check-in da casa verso un POI lontano — ha successo garantito, perché la funzione non
controlla la distanza. Ma **riempiresti una riga fasulla in `user_pois` che finisce nella heatmap
DaaS venduta alla PA.** L'evidenza dal codice è già schiacciante: cinque occorrenze del controllo
sono diventate una, e quella che resta serve all'anti-velocità. Non inquinare il dato per
confermare qualcosa che è già provato.

**Perché il giro è la verifica più economica del lavoro.** L'intera tesi del briefing è *nessuno di
questi difetti produce un errore*. Il giro da telefono è il test diretto di quella frase. Se trovi
errori dappertutto, la diagnosi è sbagliata e va rivista. Se trovi silenzio — check-in che riesce,
banner che non compare, nessun allarme — i 47 documenti sono confermati da un'osservazione reale e
la parte più fragile del lavoro diventa solida.

**Esito del giro, 29/09 sera.** La seconda possibilità si è verificata, ma solo in parte: nessun
errore visibile, e però è saltata fuori una classe di difetti nuova — l'errore *senza* allarme.
`Tenant resolution error:` a messaggio vuoto, `AuthApiError` ripetuto a ogni avvio, `loto_vault` mai
inizializzata. Sono tutti difetti che la documentazione aveva dichiarato chiusi. Vale la pena
sottolinearlo: **il silenzio dell'app confermava la documentazione solo finché non si è guardato il
sotto dietro.**

**Nota di rischio, non di rinvio.** Il Blocco 0 non committato e le migration non applicate
significano che il codice in esecuzione e il codice documentato possono divergere. Va bene: è
esattamente ciò che il giro serve a misurare.

`A3-T13` · `A3-T12` · dettaglio del Blocco 0 in
[`ULTIMO-MIGLIO-BLOCKS.md`](ULTIMO-MIGLIO-BLOCKS.md)

---

## 2. Committare il Blocco 0 — dopo il giro, non prima

**Stato reale, verificato il 29/09.** `AsyncStorage.clear()` non esiste più in nessun file di
`app/`, `components/`, `utils/`, `context`. Il ramo di errore di `app/_layout.tsx:88` entra in
modalità offline mantenendo l'identità corrente. `git diff --stat app/_layout.tsx` → 25 aggiunte,
23 rimozioni.

**Perché non è primo.** Non perché sia meno urgente: il motivo è che da solo è un fix *sperato*.
Dopo il giro di §1 è un fix *verificato*, e il commit documenta una cosa vista funzionare. Se il
giro mostra che il fix non regge, il commit aspetta e si corregge prima.

**Il costo dell'attesa è piccolo**, perché lo staging di §1.1 tiene il fix al sicuro per tutta la
durata. Il rischio reale — perdere il fix — è coperto; quello che resta è solo che il difetto è
chiuso su questa macchina per qualche ora in più.

**Cosa fare.** `git add app/_layout.tsx` e il commit. Il resto delle modifiche non le toccerei
finché `A3-T14` non è deciso.

---

## 3. Il briefing a NotebookLM, in parallelo — tenendolo come generatore di ipotesi

**Perché va fatto.** Le domande in fondo al briefing sono strutturali: cercano la causa comune a
quattro audit separati. È l'unica cosa che non posso rispondere leggendo il codice, perché la
risposta sta nel rapporto fra i quattro risultati, non in nessuno di essi.

**Il filtro, da tenere.** Ogni risposta che torna va passata per *"riesco a provarla con un
path:line?"*. Una proposta che non regge quel filtro non è un ritrovato, è un'opinione ben
formulata.

**Quello che non deve succedere.** Che il brainstorming diventi un altro elenco. A quel punto
avremmo 22 domande aperte più un piano in attesa, e il compito numero 33 non verrà mai fatto.
Questo piano esiste anche per evitare quello.

**Quello che va guardato con sospetto.** NotebookLM non ha accesso al cloud. Sui tipi delle colonne
e sull'esistenza delle funzioni risponderebbe inventando, e lo farebbe con la stessa sicurezza con
cui risponde alle domande valide. Tre domande su sette sono le uniche sicuramente utili senza
accesso; le altre danno una lettura strutturale, che è quello che serve.

`docs_v2/NOTEBOOKLM-BRIEFING.md` §7 e §8

---

## 4. Nel frattempo: ripristinare il proximity gate

**Perché è questo e non un altro.** Non aspetta nessuna decisione e non aspetta il cloud. È
un'ora di lavoro. Ed è l'unica unità del repository che chiude un buco di integrità reale **senza
aggiungere nulla di nuovo**.

**Il buco.** `scan_poi_gps` in produzione restituisce `{success: true}` a un utente che potrebbe
essere dall'altra parte dell'Italia. Nessun errore, nessun avviso. La riga scritta in `user_pois`
finisce nella heatmap DaaS e nel report che si vende alla PA.

**Perché non è rimediabile con le formule già presenti.** Anti-velocità a 130 km/h, cooldown di 12
ore e shadowban sono tutti corretti, ma proteggono il *valore* di una visita che, senza il
controllo di prossimità, non è avvenuta. La velocità richiede un check-in precedente: al primo
check-in della vita non c'è nulla da confrontare.

**Il resto della catena va bene**, e va detto: la ricompensa prende `xp_reward` e `base_co2` dal
POI, il cooldown non scrive righe con XP=0 per non inquinare la heatmap, l'ombra è silenziosa ma
reversibile. Sono scelte corrette. Il proximity gate è quello che manca.

`A3-T12` · `Q24` (solo per il raggio, non per il ripristino) · dettaglio in
[`loto_map/03-zero-iot-e-offline.md`](loto_map/03-zero-iot-e-offline.md) §4.1

---

## 5. E solo dopo, in un colpo solo, tutte le query cloud

**Cosa c'è in coda.** Una decina di interrogazioni di sola lettura, quasi tutte già scritte in
`supabase/schema/introspection.sql` e mai eseguite: tipo delle colonne, esistenza di funzioni,
definizioni mancanti, soglie civiche.

**Perché in un colpo solo.** È il blocco con il miglior rapporto fra tempo tuo e sblocco. Ogni
sessione ne aprirebbe cinque, ma le sessioni hanno un costo di avvio. In una sola passata si
sblocca un'area intera che oggi è ferma su un file di testo.

**Cosa va detto a NotebookLM** perché non perda tempo su questo: il cloud è l'unica parte che non
posso vedere, e le risposte che inventa su questi punti sono indistinguibili da quelle vere.

`Q17` · `Q18` · `Q19` · `Q20` · `Q22` · `Q26` · `Q27` · `QUERY-CLOUD.md` · `FIX-BLOCK.sql`

---

## 6. Quello che non farei adesso — e il nodo che ti spetta

### La ricostruzione del database dagli export: non adesso

È il lavoro S0–S6, ed è un impegno di settimane che poggia su una domanda a cui nessuno ha
risposto.

Se i 63 export sono l'autorità, la catena di migration va **rigenerata**. Se sono spazzatura, sono
trenta migration da scrivere a mano. Sono due settimane perse in un caso, nell'altro. Finché `Q4` è
aperta, quella è una scommessa, non un piano.

Lo stesso vale, in scala minore, per l'Accessibilità: `A7-T10`–`A7-T12` sono codice, ma senza
`Q26` non si sa quale colonna scrivere. Scrivere la migration sbagliata costa più di aspettare la
query.

### Il nodo: due strategie, non una

Ho ordinato per **correttezza**: chiudo i buchi, poi costruisco.

Se invece serve una **demo vendibile entro un mese**, l'ordine si rovescia. La priorità passa da
"chiudere i buchi" a "far funzionare il percorso principale", e i buchi restano aperti.

**Le due non si fanno insieme**, perché la seconda richiede esattamente quello che la prima chiude.
Non è un compromesso: è una scelta, e va fatta prima del passo 4.

| | Correttezza | Demo |
|---|---|---|
| Ordine | buchi, poi feature | percorso principale, poi buchi |
| Cosa chiude per primo | `A3-T12` | il check-in e il ledger |
| Cosa resta aperto | le feature assenti | i buchi di integrità |
| Costo se sbagliato | demo in ritardo | buco in produzione |

Il nodo è questo, ed è tuo. La sequenza dei cinque passi vale per entrambe, cambia il **quando**
del punto 4.

---

## In sintesi

Il primo passo costa un pomeriggio e converte 47 documenti in fatti osservati: è il giro da
telefono, ed è anche il modo per committare un fix verificato invece che sperato. Il secondo e il
terzo — il commit del Blocco 0 e il proximity gate — sono i due interventi più economici di tutta
la lista: una riga e un'ora.

**Aggiornamento del 29/09 sera.** Il primo passo è fatto e il Blocco 0 è committato-ready. Il
terzo è in corso: la migration è scritta e in attesa che tu la applichi. Il secondo non aspetta
nulla — è un `git commit` quando lo vuoi dire.

Il quinto sblocca in una sessione quello che oggi è fermo su un file di testo.

E la ricostruzione del database, che è la cosa più grande, è anche l'unica che non ha una
premessa ancora verificata.
