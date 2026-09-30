#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Verificatore di COERENZA fra docs_v2 e la realta' del codice.

Il validatore (validate.py) controlla la STRUTTURA: frontmatter, ambiti univoci, link.
Questo controlla la COERENZA: se cio' che i documenti affermano esiste davvero.

Per MODELLO_PREDITTIVO §5, i segnali di rottura sono:
  R1 oggetto citato che non esiste      -> stai documentando un'idea
  R2 oggetto che esiste e non e' documentato -> il modello e' indietro sul codice
  R3 numeri che divergono               -> due versioni della verita'
  R4 riferimento a file inesistente      -> la prova non e' riproducibile

Uso:  python docs_v2/tooling/verifica_coerenza.py [--verbose]
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                 # docs_v2
APP = os.path.dirname(ROOT)                  # C:\loto_app

VALID_TIPO = {"area", "regola", "costituzione", "decisione", "template", "indice", "analisi"}

# --- terra di confronto: cosa esiste davvero ---

def sql_files():
    out = []
    for sub in ("supabase", "supabase/migrations", "supabase/functions"):
        d = os.path.join(APP, sub)
        if os.path.isdir(d):
            for dp, dn, fn in os.walk(d):
                for f in fn:
                    if f.endswith(".sql") or f.endswith(".ts"):
                        out.append(os.path.join(dp, f))
    return out


def collect(sql, pattern, group=1, canonici=None):
    """Raccoglie identificatori. Se `canonici` e' True, ignora i file che stanno fuori da
    supabase/migrations e dalla root di supabase: un oggetto definito solo li' funziona ma
    non e' versionato, ed e' un problema DIVERSO e peggiore di un oggetto inesistente."""
    found = set()
    for p in sql:
        if canonici:
            rel = os.path.relpath(p, APP).replace("\\", "/")
            if not (rel.startswith("supabase/migrations/") or rel.startswith("supabase/") and rel.count("/") == 1):
                continue
        try:
            with open(p, encoding="utf-8", errors="replace") as fh:
                for line in fh:
                    for m in re.finditer(pattern, line):
                        found.add(m.group(group).lower())
        except OSError:
            pass
    return found


def app_files(exts=(".ts", ".tsx")):
    out = []
    for sub in ("app", "components", "utils", "context", "hooks", "constants", "types"):
        d = os.path.join(APP, sub)
        if os.path.isdir(d):
            for dp, dn, fn in os.walk(d):
                dn[:] = [x for x in dn if x != "node_modules"]
                for f in fn:
                    if f.endswith(exts):
                        out.append(os.path.join(dp, f))
    return out


def collect_columns(sql):
    """Le colonne contano come esistenza: un oggetto puo' essere una colonna, non solo
    una tabella. Copre i tre modi in cui una colonna viene dichiarata:
      - dentro CREATE TABLE:  nome  TIPO
      - con ALTER TABLE ADD:   ADD [COLUMN] [IF NOT EXISTS] nome  TIPO
      - tipi con spazio:      DOUBLE PRECISION, TIMESTAMP WITH TIME ZONE
    Senza questo, ogni colonna citata nei doc viene segnalata come inesistente."""
    tipi = (r"text|uuid|integer|boolean|double\s+precision|numeric|timestamp(\s+with(\s+without)?\s+time\s+zone)?|"
            r"jsonb|date|real|bigint|smallint|serial|bigserial|character\s+varying|bytea|interval")
    cols = set()
    for p in sql:
        try:
            with open(p, encoding="utf-8", errors="replace") as fh:
                t = fh.read()
        except OSError:
            continue
        # dichiarazione in-line:  nome  TIPO
        for m in re.finditer(r"\b([a-z_][a-z0-9_]{3,40})\s+(?:" + tipi + r")\b", t, re.I):
            cols.add(m.group(1).lower())
        # ADD COLUMN:  ADD [COLUMN] [IF NOT EXISTS] nome  TIPO
        for m in re.finditer(r"ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?([a-z_][a-z0-9_]{3,40})\s+(?:" + tipi + r")\b",
                             t, re.I):
            cols.add(m.group(1).lower())
    return cols


def main():
    verbose = "--verbose" in sys.argv
    sql = sql_files()
    code = app_files()

    tabelle = collect(sql, r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)", canonici=True)
    viste = collect(sql, r"CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)", canonici=True)
    funzioni = collect(sql, r"CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:\w+\.)?(\w+)", canonici=True)
    funzioni |= collect(code, r"\.rpc\(\s*['\"](\w+)['\"]")
    colonne = collect_columns(sql)
    ident = tabelle | viste | funzioni | colonne

    # seconda passata: esiste DA QUALCHE PARTE, ma fuori dalle migration?
    viste_overo = collect(sql, r"CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)")
    solo_archivio = viste_overo - viste

    # nomi che il dominio usa spesso: li cerchiamo citati nei doc
    noti = {
        "vw_pois_frontend", "vw_collective_impact", "vw_daas_heatmap_15min",
        "vw_daas_esg_monthly", "vw_daas_event_attendance", "vw_user_dashboard_metrics",
        "vw_dev_telemetry_daily", "vw_admin_pois", "vw_admin_checkins_analytics",
        "user_pois", "impact_transactions", "b2b_feedbacks", "media_vault",
        "whispers", "user_badges", "territories", "tenants", "esg_raw_logs",
        "scans", "loto_squads", "poi_ble_fingerprints", "crowd_predictions",
        "calculated_speed_kmh", "user_unlocked_media", "user_itineraries",
        "app_telemetry_events", "is_premium_unlocked", "is_shadowbanned",
    }

    # --- raccoglie i documenti ---
    docs = []
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if d != "__pycache__"]
        for f in sorted(fn):
            if f.endswith(".md"):
                docs.append(os.path.join(dp, f))

    problemi = []
    citati, mancanti, solo_arch = set(), set(), set()

    for p in docs:
        rel = os.path.relpath(p, ROOT).replace("\\", "/")
        with open(p, encoding="utf-8", errors="replace") as fh:
            testo = fh.read()
        for nome in noti:
            if re.search(r"\b" + re.escape(nome) + r"\b", testo):
                citati.add(nome)
                if nome in solo_archivio:
                    solo_arch.add(nome)
                    problemi.append(
                        f"[R1b-solo-archivio] {rel}: `{nome}` definita SOLO in "
                        f"supabase/archive_scattered_sql o pure_cloud_queries, NON in "
                        f"supabase/migrations. Funziona se e' stata applicata a mano: non e' versionata"
                    )
                elif nome not in ident:
                    mancanti.add(nome)
                    problemi.append(
                        f"[R1-inesistente] {rel}: `{nome}` citato ma non definito in nessuna "
                        f"migration e non chiamato dal frontend"
                    )

    # R2: esiste ma nessun doc lo menziona
    non_documentati = sorted(n for n in ident if n not in citati and not n.startswith("daas_"))
    # R3: nomi di rank nel codice
    lu = os.path.join(APP, "utils", "levelUtils.ts")
    rank_reale = set()
    if os.path.exists(lu):
        with open(lu, encoding="utf-8", errors="replace") as fh:
            t = fh.read()
        for m in re.finditer(r"title:\s*[\"']([^\"']{4,40})[\"']", t):
            rank_reale.add(m.group(1).lower())
    # R4: riferimenti a file del progetto
    for p in docs:
        rel = os.path.relpath(p, ROOT).replace("\\", "/")
        with open(p, encoding="utf-8", errors="replace") as fh:
            testo = fh.read()
        # i template contengono segnaposto (xxx.md): non sono riferimenti reali
        if rel.startswith("template/"):
            continue
        for m in re.finditer(r"`((?:app|components|utils|context|hooks|supabase|types|docs)/[\w\-./]+\.\w+)`", testo):
            tgt = m.group(1)
            if "xxx" in tgt.lower():
                continue
            if not os.path.exists(os.path.join(APP, tgt.replace("/", os.sep))):
                problemi.append(f"[R4-riferimento] {rel}: `{tgt}` non esiste nel progetto")

    print("=" * 78)
    print("VERIFICATORE DI COERENZA  docs_v2  vs  codice")
    print("=" * 78)
    print(f"documenti analizzati : {len(docs)}")
    print(f"identificatori reali : {len(ident)}  (tabelle {len(tabelle)}, viste {len(viste)}, funzioni {len(funzioni)})")
    print(f"oggetti di dominio   : {len(noti)}  citati in almeno un doc: {len(citati)}")
    print(f"citati e INESISTENTI : {len(mancanti)}")
    print(f"problemi rilevati     : {len(problemi)}")
    print("-" * 78)

    if verbose:
        print("  oggetti esistenti e NON documentati (segnale R2):")
        for n in non_documentati[:30]:
            print(f"    - {n}")
        print("-" * 78)
        print("  rank reali in utils/levelUtils.ts:")
        for r in sorted(rank_reale)[:12]:
            print(f"    - {r}")
        print("-" * 78)

    for x in problemi:
        print("  " + x)
    if mancanti or solo_arch:
        print("-" * 78)
        if solo_arch:
            print("  ESISTONO SOLO IN ARCHIVIO (funzionano solo se applicate a mano):")
            for n in sorted(solo_arch):
                print(f"    * {n}")
        if mancanti:
            print("  CITATI MA INESISTENTI (da verificare in cloud):")
            for n in sorted(mancanti):
                print(f"    * {n}")
    print("=" * 78)
    return 0


if __name__ == "__main__":
    sys.exit(main())
