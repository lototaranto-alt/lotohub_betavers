#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Genera docs_v2/MANIFEST.json scansionando i file .md del contesto.

Il manifest e' l'indice leggibile da una macchina: serve al validatore per trovare gli
orfani, e serve a un agente per sapere cosa esiste senza elencare directory a mano.

Uso:  python docs_v2/tooling/build_manifest.py
"""

import json
import os
import re
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def parse_frontmatter(path):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    data, key = {}, None
    for raw in text[3:end].splitlines():
        if not raw.strip():
            continue
        m = re.match(r"^([a-z_]+):\s*(.*)$", raw)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            data[key] = val if val else []
        elif raw.strip().startswith("- ") and key:
            if isinstance(data.get(key), str):
                data[key] = []
            data[key].append(raw.strip()[2:].strip())
    return data


def h1(path):
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            s = line.strip()
            if s.startswith("# "):
                return s[2:].strip()
    return ""


ORDER = {"costituzione": 0, "regola": 1, "decisione": 2, "area": 3, "template": 4, "indice": 5}

docs = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d != "__pycache__"]
    for fn in sorted(filenames):
        if not fn.lower().endswith(".md"):
            continue
        path = os.path.join(dirpath, fn)
        rel = os.path.relpath(path, ROOT).replace("\\", "/")
        meta = parse_frontmatter(path)
        ev = meta.get("evidenza", [])
        if isinstance(ev, str):
            ev = [ev] if ev else []
        docs.append(
            {
                "path": rel,
                "id": meta.get("id", ""),
                "tipo": meta.get("tipo", ""),
                "ambito": meta.get("ambito", ""),
                "titolo": h1(path),
                "stato": meta.get("stato", ""),
                "confidenza": meta.get("confidenza", ""),
                "owner": meta.get("owner", ""),
                "aggiornato": meta.get("aggiornato", ""),
                "evidenza": ev,
            }
        )

docs.sort(key=lambda d: (ORDER.get(d["tipo"], 9), d["path"]))

manifest = {
    "contesto": "L.O.T.O. Map",
    "versione": 2,
    "generato": date.today().isoformat(),
    "radice": "docs_v2",
    "nota": (
        "Indice machine-readable del contesto v2. Generato da tooling/build_manifest.py. "
        "Non modificare a mano: il validatore controlla che corrisponda ai file su disco."
    ),
    "conteggi": {
        "totali": len(docs),
        "per_tipo": {t: sum(1 for d in docs if d["tipo"] == t) for t in sorted({d["tipo"] for d in docs})},
        "per_stato": {s: sum(1 for d in docs if d["stato"] == s) for s in sorted({d["stato"] for d in docs})},
    },
    "documenti": docs,
}

out = os.path.join(ROOT, "MANIFEST.json")
with open(out, "w", encoding="utf-8") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

print(f"MANIFEST.json aggiornato: {len(docs)} documenti")
print("  per tipo :", manifest["conteggi"]["per_tipo"])
print("  per stato:", manifest["conteggi"]["per_stato"])
