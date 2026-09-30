---
id: LM-01-ONBOARDING-IDENTITA
tipo: analisi
ambito: loto-map-01-onboarding-e-identita
stato: Vivente
confidenza: Alta
owner: Agent
aggiornato: 2026-09-29
evidenza:
  - app/_layout.tsx:66
  - app/_layout.tsx:79
  - app/(tabs)/index.tsx:515
  - app/(tabs)/profile.tsx:77
  - app/admin/nfc-setup.tsx:71
  - loto-admin-v2/src/app/login/login-form.tsx:28
  - components/LotoPassCard.tsx:46
  - components/LotoPassRecoveryScanner.tsx:46
  - components/LotoPassRecoveryScanner.tsx:63
  - components/LotoPassBackupModal.tsx:25
  - docs_v2/COLLAUDO-ARCHIVIO.md:62
---

# Punto 1 — Onboarding & Identita' (Zero-PII)

> **Esito: due claim confermati, uno rotto.** La generazione del QR e il salvataggio in galleria
> esistono e funzionano. Il **recupero non esiste**: il codice viene verificato, ma l'account non
> viene ricollegato. E' il claim su cui `_layout.tsx:80` fonda l'identita' dell'utente.

## Le tre affermazioni a verifica

- Nessuna richiesta di dati personali: niente email, telefono o credenziali identificative.
- Autenticazione anonima al primo avvio, agganciata a `auth.users` e `profiles` via UUID.
- Ripristino locale tramite chiave/QR salvabile in galleria.

---

## Claim 1 — Zero-PII · SOVRADIMENSIONATO

Vero per il percorso del consumatore. Falso per il prodotto, che include le superfici admin.

| Superficie | Cosa fa | Prova |
|---|---|---|
| App consumatore | Nessun input di email o telefono. Il "battesimo" e' stato disabilitato | `index.tsx:515` |
| Pannello B2B/admin | **Raccoglie `b2b_phone`**, validato con regex E.164 | `nfc-setup.tsx:71` |
| Console admin v2 | **Login con `signInWithPassword({email, password})`** | `login-form.tsx:28` |
| Scheda profilo | Determina l'anonimato **leggendo `user.email`** | `profile.tsx:77` |

Il punto che pesa di piu' e' l'ultimo. `profiles.email` non e' una colonna morta: e' un ramo vivo
del codice. La colonna esiste, e' nullable ma UNIQUE (da `ESITO-QUERY.md`). Finche' quel ramo
resta, "zero-PII" e' una policy di UI, non un modello del dato.

C'e' anche una contraddizione dichiarata in `docs/LOTO_ENGINEERING_MANIFESTO.md:31`, gia' segnalata.

**Da decidere:** l'anonimato lo dichiariamo per l'app consumatrice e basta, e scriviamo il perimetro
onesto? Oppure chiudiamo davvero, e allora `profiles.email` e `b2b_phone` vanno fuori dal modello.

## Claim 2 — Autenticazione anonima · CONFERMATO, e meglio di quanto descritto

`app/_layout.tsx:58-86` fa esattamente cio' che dice il testo, e ha un merito in piu'.

```
:61  sessione corrente?  -> la riusa
:66  altrimenti          -> signInAnonymally()
:72  legge profiles.id per currentUserId
:78  se il profilo NON esiste:
:79      INVARIANTE: non creo un altro utente anonimo
:81      segno 'loto_profile_missing' e ATTENDO il recupero L.O.T.O. Pass
:93  se la rete fallisce: non creo un account, entro in offline
```

Le due invarianti delle righe 79 e 93 sono la parte solida, e non sono nel claim. Il motivo e'
scritto alla riga 80: **"L'identita' continua a essere quella del L.O.T.O. Pass"**.

Questo ribalta la gerarchia che il testo dava per scontata. L'utente anonimo non e' l'identita':
e' un **portatore di token**. L'identita' e' il profilo, e si aggancia a esso tramite la L.O.T.O.
Pass. Da qui discende il resto del documento: se il recupero non chiude, l'utente che rientra
senza profilo non ha modo di rientrare.

## Claim 3 — Ripristino locale · ROTTO

Il giro si spezza in tre punti. Il primo funziona, gli altri due no.

**(a) Generare il QR e salvarlo in galleria — funziona.**
`LotoPassCard.tsx:46` chiama `MediaLibrary.saveToLibraryAsync`, ed e' montato davvero in
`profile.tsx:421`.

**(b) Rileggerlo dall'app — disabilitato.**
`LotoPassRecoveryScanner.tsx:46` mostra un avviso: il parsing in-app della galleria e' spento, e
l'utente deve copiare a mano il testo sotto il QR e incollarlo. Le righe 47-48 lasciano il debito
scritto: serve `rn-qr-generator`, *"let me just use a placeholder here and fix the import"*.

**(c) Il recupero — verifica, non ripristina. Questo e' il buco.**

```
LotoPassRecoveryScanner.tsx:59  supabase.rpc('recover_loto_pass', {recovery_code})
LotoPassRecoveryScanner.tsx:63  if (data?.success) -> Alert + onClose()
```

Il client, ricevuto un esito positivo, **chiude il pannello e basta**. Non ricollega niente.

### ⚠️ Correzione 2026-09-29: il server funziona

Questo documento, alla prima stesura, diceva che `recover_loto_pass` fosse **in sola lettura** e che
il giro andasse costruito da zero. **E' sbagliato**, e a farlo sbagliare era stato il file su
file, non il cloud.

Le query del 27/09 (`ESITO-QUERY.md:51-52`, N2 e N3) hanno risposto: nel cloud e' attivo il **corpo
B**, che contiene `v_current_uid := auth.uid()` e fa
`UPDATE public.profiles SET total_xp, is_premium WHERE id = v_current_uid`. La funzione
**ricongiunge**. N1 ha verificato anche la firma: `recover_loto_pass(text) -> json`.

Quindi il buco e' **un buco diverso, e piu' stretto**:

```
   lato server   ricongiunge        CONFERMATO per query (ESITO-QUERY.md:51-52)
   lato client   scarta la risposta  ROTTO      (LotoPassRecoveryScanner.tsx:63)
   in git        0 definizioni      ROTTO      (N4)
```

Tre cose da tenere distinte, perche' una rende le altre due invisibili:

1. **Il server e' a posto.** Non va riscritto.
2. **Il client butta via il risultato.** Anche se la funzione scrive, `LotoPassRecoveryScanner`
   mostra un `Alert` e chiude: l'utente non vede il ripristino e non viene invitato a
   rientrare nell'app. Il giro non si chiude **lato utente**, per quanto sia corretto lato DB.
3. **La funzione non e' in git** (N4: 0 definizioni in `supabase/`). Funziona oggi, e domani
   non si puo' ricostruire. E' lo stesso difetto di `A7-T8`: un oggetto fuori da Git non e' solo
   non riproducibile, e' **non protetto**.

`A1-T10` non e' piu' "costruire il giro". E' "far usare al client la risposta che la funzione
già produce, e portare la funzione in Git".

### Un rischio che si vede solo guardando i due punti insieme

Il corpo della funzione filtra con `WHERE nickname = recovery_code OR id::text = recovery_code`
(`COLLAUDO-ARCHIVIO.md:155`). Se la chiave di recupero puo' essere un **nickname**, allora non e'
un segreto: e' conoscibile. E per `_layout.tsx:80` quella e' proprio l'ancora dell'identita'.
Una chiave di recupero pubblica che regge l'identita' e' il contrario di una chiave.

Da verificare sul cloud prima di trarne conclusioni: e' una lettura che voglio vedere confermata
o smentita da `Q16`.

## File orfano che contraddice il punto

`components/LotoPassBackupModal.tsx` non e' importato da nessuna parte viva: l'unico riferimento e'
`archive_dead_code/.temp_profile_modal.tsx:6`. E contiene un **"Opzione B (Email)"** con
`signIn` per email e password (righe 25-38, 106-118).

Non e' un file innocuo dimenticato: e' il file che reintroduce esattamente cio' che questo punto
dichiara di non avere. Va archiviato, e va scritto il motivo, cosi' non viene "recuperato" fra un
anno.

---

## Cosa blocca questo punto

1. **`Q16` — CHIUSA.** Il corpo reale scrive e ricongiunge (`ESITO-QUERY.md:51-52`). Resta pero' da
   mettere la funzione in Git (`A1-T10`) e far leggere la risposta al client.
2. **Decisione sul modello di recupero** (`A1-T11`): giro chiuso, oppure accettazione esplicita
   che chi cambia telefono riparte da zero. La seconda e' legittima, ma va scritta, e va detto
   all'utente.
3. **Perimetro dello Zero-PII** (`Q1`): app consumatrice, o prodotto intero con le superfici admin.

Fino a che il punto 3 non ha risposta, questo documento non e' una verifica: e' un audit con
tre eccezioni aperte.

## Costo per l'utente, detto chiaramente

Oggi "niente email" significa che **chi reinstalla perde i progressi**. La privacy e' promessa,
ma il prezzo lo paga l'utente, in silenzio, senza avviso. Non sto dicendo che la scelta sia
sbagliata. Sto dicendo che oggi non e' la scelta che il testo descrive.
