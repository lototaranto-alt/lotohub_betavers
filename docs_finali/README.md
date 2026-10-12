---
id: DOC-FINALI-INDICE
tipo: documentazione-definitiva
ambito: indice-documentazione-finale
stato: Vivente
confidenza: Alta
owner: Team
aggiornato: 2026-10-12
evidenza: []
---

# L.O.T.O. HUB — Documentazione Finale (`docs_finali/`)

> **Questa directory è l'unica fonte dei documenti definitivi da allegare alla
> consegna finale.** Qui dentro NON finisce la memoria storica dell'operazione
> (quella resta in `docs/`, `docs_v2/`, `docs_v3/`): finiscono solo i documenti che
> descrivono il prodotto **come è fatto e come si collauda**.
>
> Criterio di ingresso: il codice è l'unica autorità (`METODICA.md` §1). Un documento
> entra qui quando ogni sua affermazione è verificabile o dichiara esplicitamente
> cosa è "da fare".

## Contenuto

| Documento | Scopo | Stato |
|---|---|---|
| `ARCHITETTURA-FUNZIONALE-E-CATENA-DATI.md` | Come si articola il progetto: architettura, catena dati Crowd/BLE→Heat, metodo di ingegnerizzazione, stato accettazione, evoluzioni | Definitivo (12/10/2026) |
| `METODICA.md` | Il metodo vincolante di lavoro (misura-prima, una prova per affermazione, esecuzioni umane) | Vivente |
| `FORMULE-PROPRIETARIE.md` | Costanti BLE e formula proprietaria dell'heat (la SSOT delle formule) | Vivente |
| `ACCETTANZA-RUNTIME-APK.md` | Collaudo runtime della APK release sul 2° device | In preparazione (M12 aperta) |
| `fase2/DISALLINEAMENTO-PROGRESSIONE.md` | Blocchi Fase 2: disallineamento lvup/lore/transizioni/cronologia/contatori + mapping LISTA BUG TROVATI | Bozza (F2) |

## Gestione

- **Copie sincronizzate**: i documenti Viventi possono avere la fonte in `docs_v2/`;
  qui vivono le copie allegabili. Riusa il criterio "all'uso si rifà riferimento
  all'ultima versione qui".
- **Nuovi ingressi**: quando un documento diventa definitivo (o entra in preparazione
  per la finale), copiarlo qui e registrarlo in questa tabella.
- **Da completare (M13)**: igiene documentale — collaudare i riferimenti `file:linea`
  di ogni documento e consolidare qui il set finale da allegare.