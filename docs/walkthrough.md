# Walkthrough: La Nuova Dashboard LOTO

Ho completato la ristrutturazione architetturale e stilistica, prendendo ispirazione dal tuo mockup ma infondendo tutto nello stile "Eco-Boutique". 

> [!TIP]
> **Consiglio per il testing:** Apri l'app su Expo Go e prova a scorrere tra le nuove schede in basso, e a espandere le "fisarmoniche" nella sezione Profilo!

## 1. La Nuova Tab Bar
La navigazione inferiore è stata completamente ridisegnata.
- **Home:** La dashboard principale.
- **Mappa:** Accesso diretto all'esplorazione geografica.
- **SCAN (Al centro):** Il tasto NFC ora è **Flottante** ed enorme, rialzato dal bordo della barra. Ha un colore verde scuro con un elegante bordo dorato e ombreggiatura profonda, che lo rende l'elemento focale ("Esplora Ora").
- **Community:** La nuova sezione per il social.
- **Profilo:** L'hub personale.

*(Le vecchie pagine nascoste esplora, mappa, eventi ed options sono state eliminate o assorbite per alleggerire il codice).*

## 2. La Home a Quadranti (Stile Boutique)
Addio ai vecchi bottoni, benvenuta struttura da RPG!
- **User Header (In alto):** L'Avatar, il Livello e il nome formano un compatto e lussuoso cruscotto personale in cima. Sotto al nome scorre la tua barra dell'esperienza (XP) verde brillante.
- **Widget Centrale:** Un enorme quadrante dorato e verde ti invita a interagire ("LA TUA PROSSIMA META" -> Bottone "ESPLORA ORA").
- **Griglia a 4 Quadranti:** Abbiamo ricreato l'effetto del mockup con 4 card eleganti:
  1. *Indizi Trovati* (con la barra di scorrimento dorata).
  2. *LOTO PTI* (e la distanza dal prossimo livello).
  3. *Mappa Locale* (un riepilogo dello stato dei luoghi attorno a te).
  4. *Traguardi* (le tue medaglie sbloccate, stile slot RPG).

## 3. Le Liste a Scorrimento (Scaffali & Fisarmoniche)
- **Community:** Ora è composta da **Scaffali Orizzontali** (tipo Netflix) fluidi e puliti, dove puoi scorrere verso destra gli Eventi, le Classifiche e le Sfide, tenendo tutto in una singola schermata.
- **Profilo & Diario:** Ho inventato un sistema ad **Accordion (Fisarmonica)**. Toccando un titolo (es. "Il Tuo Diario LOTO"), la sezione si apre dolcemente svelando i tuoi Badge (Eco Warrior, Pioniere) e la LOTO Pass Card rimane sempre fissa e gloriosa in cima. Il vecchio "Menu Impostazioni" è ora comodamente annidato qui dentro.

## Validazione
- [x] L'app compila ed Expo Server è nuovamente attivo.
- [x] I bottoni inferiori sono corretti e puntano alle nuove pagine.
- [x] L'overlap dell'header è stato risolto inglobando avatar e barra XP in modo ordinato.
