#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Validatore del contesto docs_v2.

Verifica le quattro cose che in v1 non erano controllabili e che hanno permesso a 45 documenti
di divergere senza che nulla lo segnalasse:

  1. frontmatter presente e completo su ogni .md
  2. `ambito:` univoco  -> conflitto di autorita' (la legge 1)
  3. `confidenza: Alta` implica `evidenza:` non vuota -> finzione di completezza (legge 2)
  4. nessun file orfano rispetto a MANIFEST.json, nessun link relativo rotto

Usa:  python docs_v2/tooling/validate.py            (esito 0 = pulito, 1 = violazioni)
      python docs_v2/tooling/validate.py --verbose  (mostra anche le verifiche superate)
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

VALID_STATO = {"Vivente", "Bozza", "Storico"}
VALID_CONF = {"Alta", "Media", "Bassa"}
VALID_TIPO = {"area", "regola", "costituzione", "decisione", "template", "indice", "analisi"}
REQUIRED = ["id", "tipo", "stato", "confidenza", "owner", "aggiornato"]
REQUIRED_AMBITO_TIPO = {"area", "regola"}


def parse_frontmatter(path):
    """Ritorna (dict, body_start_line) o (None, motivo)."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if not text.startswith("---"):
        return None, "nessun blocco YAML all'inizio del file"
    end = text.find("\n---", 3)
    if end == -1:
        return None, "blocco YAML non chiuso"
    block = text[3:end]
    body = text[end + 4 :]

    data = {}
    key = None
    for raw in block.splitlines():
        if not raw.strip() or raw.strip().startswith("#"):
            continue
        m = re.match(r"^([a-z_]+):\s*(.*)$", raw)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            if val in ("[]", "{}"):
                # lista/dizionario vuoto esplicito: e' una lista, non la stringa "[]"
                data[key] = []
            else:
                data[key] = val if val else []
        elif raw.strip().startswith("- ") and key:
            data.setdefault(key, [])
            if isinstance(data[key], str):
                data[key] = []
            data[key].append(raw.strip()[2:].strip())
    return data, body


def walk_docs():
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in ("__pycache__",)]
        for fn in sorted(filenames):
            if fn.lower().endswith(".md"):
                out.append(os.path.join(dirpath, fn))
    return sorted(out)


def main():
    verbose = "--verbose" in sys.argv
    problems = []
    notes = []

    files = walk_docs()

    # ---------- 1 e 2: frontmatter + univocita' di ambito ----------
    owners = {}
    meta_by_file = {}

    for path in files:
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        meta, err = parse_frontmatter(path)
        if meta is None:
            problems.append(f"[frontmatter] {rel}: {err}")
            continue
        meta_by_file[rel] = meta

        for field in REQUIRED:
            if field not in meta or meta[field] in ("", []):
                problems.append(f"[frontmatter] {rel}: campo '{field}' mancante")

        tipo = meta.get("tipo", "")
        if tipo and tipo not in VALID_TIPO:
            problems.append(f"[frontmatter] {rel}: tipo '{tipo}' non valido")

        stato = meta.get("stato", "")
        if stato and stato not in VALID_STATO:
            problems.append(f"[stato] {rel}: stato '{stato}' non valido")

        conf = meta.get("confidenza", "")
        if conf and conf not in VALID_CONF:
            problems.append(f"[confidenza] {rel}: '{conf}' non valido")

        if tipo in REQUIRED_AMBITO_TIPO:
            amb = meta.get("ambito")
            if not amb or amb == [] or (isinstance(amb, str) and not amb.strip()):
                problems.append(f"[ambito] {rel}: manca il campo obbligatorio 'ambito'")
            else:
                owners.setdefault(amb, []).append(rel)

        # legge 2: Alta richiede evidenza -- solo per i documenti di contenuto.
        # template e costituzione sono definizionali: non hanno affermazioni da provare,
        # quindi la regola non si applica (altrimenti si finirebbe per inventare prove).
        if conf == "Alta" and tipo in ("area", "regola", "decisione"):
            ev = meta.get("evidenza")
            if ev in (None, [], ""):
                problems.append(
                    f"[evidenza] {rel}: confidenza Alta ma lista 'evidenza' vuota (finzione di completezza)"
                )

        # legge 3: corpo con le 4 sezioni se e' un'area
        if tipo == "area":
            with open(path, encoding="utf-8") as fh:
                body = fh.read()
            for sec in ("Cosa dice il codice", "Cosa dice la documentazione", "Direzione"):
                if sec not in body:
                    problems.append(f"[struttura] {rel}: sezione '{sec}' mancante nel corpo")

    # ---------- 2b: conflitti di ambito ----------
    for amb, paths in owners.items():
        if len(paths) > 1:
            problems.append(
                "[conflitto] ambito '%s' rivendicato da %d documenti: %s"
                % (amb, len(paths), ", ".join(paths))
            )

    # ---------- 4a: manifest ----------
    manifest_path = os.path.join(ROOT, "MANIFEST.json")
    declared = set()
    if not os.path.exists(manifest_path):
        problems.append("[manifest] MANIFEST.json mancante: esegui tooling/build_manifest.py")
    else:
        try:
            with open(manifest_path, encoding="utf-8") as fh:
                manifest = json.load(fh)
            for entry in manifest.get("documenti", []):
                declared.add(entry["path"])
                if not os.path.exists(os.path.join(ROOT, entry["path"])):
                    problems.append(
                        "[manifest] dichiara un file inesistente: " + entry["path"]
                    )
        except Exception as exc:  # noqa: BLE001
            problems.append(f"[manifest] illeggibile o malformato: {exc}")

        real = {
            os.path.relpath(p, ROOT).replace("\\", "/")
            for p in files
            if "MANIFEST" not in p
        }
        for orphan in sorted(real - declared):
            problems.append(f"[orfano] presente su disco ma non nel manifest: {orphan}")
        for ghost in sorted(declared - real):
            problems.append(f"[fantasma] nel manifest ma non su disco: {ghost}")

    # ---------- 4b: link relativi ----------
    for path in files:
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        with open(path, encoding="utf-8") as fh:
            body = fh.read()
        for m in re.finditer(r"\]\((\.{0,2}/[^)\s]+)\)", body):
            target = m.group(1)
            if target.startswith("http"):
                continue
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), target))
            if not os.path.exists(resolved):
                problems.append(f"[link] {rel}: rotto -> {target}")
        for m in re.finditer(r"`(\.{0,2}/[\w\-./]+\.(?:ts|tsx|sql|json|py))`", body):
            target = os.path.normpath(os.path.join(os.path.dirname(path), m.group(1)))
            if not os.path.exists(target):
                notes.append(f"[rif. non risolto] {rel}: {m.group(1)}")

    # ---------- esito ----------
    print("=" * 74)
    print("VALIDATORE docs_v2")
    print("=" * 74)
    print(f"documenti analizzati : {len(files)}")
    print(f"con frontmatter      : {len(meta_by_file)}")
    print(f"ambiti distinti      : {len(owners)}")
    print(f"nel manifest         : {len(declared)}")
    print(f"errori               : {len(problems)}")
    if notes:
        print(f"avvertenze           : {len(notes)}")
    print("-" * 74)

    if verbose:
        for amb in sorted(owners):
            print(f"  ambito: {amb}  ->  {', '.join(owners[amb])}")
        print("-" * 74)
        for n in notes[:20]:
            print("  " + n)
        if notes:
            print("-" * 74)

    for p in problems:
        print("  " + p)

    print("=" * 74)
    if problems:
        print("ESITO: fallito. La struttura non e' coerente.")
        return 1
    print("ESITO: pulito. La struttura e' coerente.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
