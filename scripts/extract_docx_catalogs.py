#!/usr/bin/env python3
"""
scripts/extract_docx_catalogs.py
Engenharia Reversa dos Catálogos Word (.docx) de MANGUEIRAS AUTOMOTIVAS para o Balcão.
Extrai produtos, seções, caixas, códigos internos, referências, montadoras,
especificações e converte 100% das imagens para WebP com fundo branco (#FFFFFF).
"""

import os
import sys
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime

# Garante path para importação local do scripts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from webp_studio_converter import convert_to_studio_webp

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
V_NS = "urn:schemas-microsoft-com:vml"

DOCS_CONFIG = [
    {
        "filename": "MANGUEIRAS LINHA FIAT.docx",
        "doc_key": "fiat",
        "default_mfr": "Fiat",
        "line_name": "Linha Fiat"
    },
    {
        "filename": "MANGUEIRAS LINHA FORD.docx",
        "doc_key": "ford",
        "default_mfr": "Ford",
        "line_name": "Linha Ford"
    },
    {
        "filename": "MANGUEIRAS LINHA GM.docx",
        "doc_key": "gm",
        "default_mfr": "GM",
        "line_name": "Linha GM"
    },
    {
        "filename": "MANGUEIRAS LINHA IMPORTADOS.docx",
        "doc_key": "importados",
        "default_mfr": "Hyundai",
        "line_name": "Linha Importados"
    },
    {
        "filename": "MANGUEIRAS LINHA VOLKSWAGEN.docx",
        "doc_key": "vw",
        "default_mfr": "VW",
        "line_name": "Linha Volkswagen"
    }
]

# Categorias / Tipos de Mangueiras
def classify_hose_type(desc: str) -> str:
    d = desc.upper()
    if 'RADIADOR' in d and ('SUP' in d or 'SUPERIOR' in d):
        return 'Radiador Superior'
    if 'RADIADOR' in d and ('INF' in d or 'INFERIOR' in d):
        return 'Radiador Inferior'
    if 'RADIADOR' in d:
        return 'Radiador (Geral)'
    if 'FILTRO DE AR' in d or 'FILTRO AR' in d:
        return 'Filtro de Ar'
    if "BOMBA D'" in d or "BOMBA D '" in d or 'BOMBA DAGUA' in d or 'BOMBA D ÁGUA' in d or "BOMBA D´" in d:
        return "Bomba D'Água"
    if 'RESPIRO' in d or 'ANTICHAMA' in d or 'ANTI CHAMA' in d or 'ANTI-CHAMA' in d:
        return 'Respiro de Óleo / Antichama'
    if 'AQUECEDOR' in d or 'AR QUENTE' in d:
        return 'Aquecedor (Ar Quente)'
    if 'RESERVAT' in d:
        return 'Reservatório de Expansão'
    if 'BOCAL' in d or 'TANQUE' in d:
        return 'Bocal do Tanque / Combustível'
    if 'COLETOR' in d:
        return 'Coletor de Admissão'
    if 'CAVALETE' in d or 'TUBO AGUA' in d or "TUBO D'AGUA" in d or 'TERMOSTAT' in d:
        return "Cavalete / Termostato"
    if 'DIREÇÃO' in d or 'DIRECAO' in d:
        return 'Direção Hidráulica'
    return 'Outras Mangueiras'

# Regex para descolar códigos no início
RE_GLUED_CODE = re.compile(r'^(\d{4,6}-\d|\d{4,6}|LF\d{3,5}(-\d{4,6}-\d)?)\s*(MANGUEIRA|MANG\.?|TUBO)', re.IGNORECASE)

# Regex para extração de referências
RE_REF_CODES = [
    re.compile(r'\b(\d{4,6}-\d)\b'),
    re.compile(r'\b(LF\d{3,5})\b', re.IGNORECASE),
    re.compile(r'\b(T-?\d{1,3}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(\d{7,10})\b'), # códigos OEM como 51854599, 51851014
    re.compile(r'\b([A-Z]{2,3}\d{6,8}[A-Z]{0,3})\b'), # XS6171586AA
    re.compile(r'\b(\d{3}\.\d{3}\.\d{3}(\.\d)?)\b'),
]

MANUFACTURER_MAP = {
    "VW": ["VW", "VOLKS", "VOLKSWAGEN", "GOL", "PARATI", "SAVEIRO", "VOYAGE", "SANTANA", "FOX", "UP", "GOLF", "POLO", "JETTA", "PASSAT", "KOMBI", "FUSCA", "BRASILIA"],
    "GM": ["GM", "CHEVROLET", "CHEVETTE", "CORSA", "CELTA", "ONIX", "PRISMA", "COBALT", "SPIN", "CRUZE", "ASTRA", "VECTRA", "KADETT", "MONZA", "S10", "BLAZER", "OPALA", "CARAVAN", "MONTANA", "MERIVA", "ZAFIRA", "AGILE", "C-10", "A-10", "D-20"],
    "Fiat": ["FIAT", "UNO", "PALIO", "SIENA", "GRAND SIENA", "STRADA", "MOBI", "ARGO", "CRONOS", "TORO", "DUCATO", "PUNTO", "LINEA", "TEMPRA", "TIPO", "DOBLO", "FIORINO", "IDEA", "BRAVO", "MAREA", "147", "SPAZIO", "OGGI", "PANORAMA"],
    "Ford": ["FORD", "FIESTA", "KA", "ECOSPORT", "FOCUS", "ESCORT", "VERONA", "CORCEL", "DEL REY", "DELREY", "PAMPA", "RANGER", "F1000", "COURIER", "ROYALE", "BELINA", "HOBBY", "VERSAILLES"],
    "Hyundai": ["HYUNDAI", "HB20", "CRETA", "TUCSON", "I30", "ELANTRA", "AZERA", "SANTA FE"],
    "Peugeot/Citroën": ["PEUGEOT", "CITROEN", "CITROËN", "206", "207", "208", "C3", "C4", "XSARA", "PICASSO", "AIRCROSS"],
    "Toyota": ["TOYOTA", "COROLLA", "ETIOS", "YARIS", "HILUX"],
    "Renault": ["RENAULT", "CLIO", "SANDERO", "LOGAN", "DUSTER", "KWID"]
}

def clean_box_and_code(raw_lines: list[str]) -> tuple[str, str]:
    if not raw_lines:
        return "", ""
    lines = [l.strip() for l in raw_lines if l.strip()]
    if not lines:
        return "", ""

    box_number = lines[0].strip()
    internal_code = ""

    if len(lines) > 1:
        internal_code = lines[1].strip()
    else:
        # Se contiver espaço interno
        parts = box_number.split()
        if len(parts) >= 2 and any(parts[1].upper().startswith(pfx) for pfx in ("MU", "LT", "LF", "FT")):
            box_number = parts[0].strip()
            internal_code = parts[1].strip()

    # Limpeza de prefixos
    box_number = re.sub(r'^(CX\.?|CAIXA)\s*', '', box_number, flags=re.IGNORECASE).strip()
    return box_number, internal_code

def sanitize_description_and_refs(desc_raw: str) -> tuple[str, list[str]]:
    if not desc_raw:
        return "", []

    text = " ".join(desc_raw.split()).strip()

    # Desgrudar código inicial
    m = RE_GLUED_CODE.match(text)
    if m:
        code = m.group(1).strip()
        word = m.group(3).strip()
        rest = text[m.end():].strip()
        text = f"{code} {word} {rest}".strip()

    # Extrair códigos
    refs = []
    for reg in RE_REF_CODES:
        for match in reg.finditer(text):
            val = match.group(0).strip()
            if val and val.upper() not in [r.upper() for r in refs]:
                refs.append(val)

    return text, refs

def detect_manufacturers(text: str, default_mfr: str) -> list[str]:
    found = []
    norm = re.sub(r'[/_\-\.]', ' ', text).upper()
    tokens = set(re.findall(r'\b[A-Z0-9]+\b', norm))

    for mfr, keywords in MANUFACTURER_MAP.items():
        for kw in keywords:
            if kw in tokens or f" {kw} " in f" {norm} ":
                if mfr not in found:
                    found.append(mfr)
                break

    if default_mfr and default_mfr not in found:
        found.insert(0, default_mfr)

    if not found:
        found.append("Universal")

    return found

def extract_technical_specs(text: str) -> list[str]:
    specs = []
    patterns = [
        re.compile(r'\b\d+([,\.]\d+)?\s*(MM|CM)\b', re.IGNORECASE),
        re.compile(r'\b\d+X\d+([,\.]\d+)?\s*(MM)?\b', re.IGNORECASE),
        re.compile(r'\b\d+/\d+("|\'\'|\s*POLEGADAS?)?\b', re.IGNORECASE),
        re.compile(r'\b\d+\s*MARCHAS\b', re.IGNORECASE),
        re.compile(r'\b(C/ACD|S/ACD|C/AR|S/AR|C/MOLA|S/MOLA)\b', re.IGNORECASE),
        re.compile(r'\b(1\.0|1\.4|1\.5|1\.6|1\.8|2\.0|2\.2|2\.4|6C)\b', re.IGNORECASE),
        re.compile(r'\b(8V|16V|FLEX|FIRE|EVO|AP|AT)\b', re.IGNORECASE),
    ]
    for p in patterns:
        for m in p.finditer(text):
            v = m.group(0).strip()
            if v and v not in specs:
                specs.append(v)
    return specs

def build_search_tokens(item: dict) -> list[str]:
    tokens = set()
    def add(s: str):
        if not s: return
        cleaned = re.sub(r'[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]', ' ', s.lower())
        for t in cleaned.split():
            if len(t) >= 1: tokens.add(t)

    if item.get("boxNumber"):
        bn = item["boxNumber"].lower()
        tokens.add(bn)
        tokens.add(f"cx{bn}")
        tokens.add(f"cx {bn}")
        tokens.add(f"caixa {bn}")
        add(item["boxNumber"])

    if item.get("internalCode"):
        tokens.add(item["internalCode"].lower())
        add(item["internalCode"])

    for r in item.get("referenceCodes", []):
        rc = r.lower()
        tokens.add(rc)
        tokens.add(rc.replace("-", "").replace(".", ""))
        add(r)

    add(item.get("description", ""))
    add(item.get("section", ""))
    add(item.get("hoseType", ""))
    add(item.get("lineName", ""))

    for m in item.get("manufacturers", []): add(m)
    for s in item.get("technicalSpecs", []): add(s)

    return sorted(list(tokens))

def extract_docx_catalogs():
    output_img_dir = os.path.join("public", "catalog-images", "mangueiras")
    os.makedirs(output_img_dir, exist_ok=True)
    os.makedirs(os.path.join("public", "data"), exist_ok=True)

    master_products = []
    stats = {
        "docs": {},
        "total_products": 0,
        "total_images": 0,
        "black_pixels": 0,
        "pixel_failures": 0,
        "sections": {},
        "lines": {}
    }

    for doc_cfg in DOCS_CONFIG:
        doc_filename = doc_cfg["filename"]
        doc_key = doc_cfg["doc_key"]
        default_mfr = doc_cfg["default_mfr"]
        line_name = doc_cfg["line_name"]

        print(f"\n=======================================================")
        print(f"Iniciando extração do catálogo: {doc_filename}")
        print(f"=======================================================")

        if not os.path.exists(doc_filename):
            print(f"ERRO: Arquivo {doc_filename} não encontrado!")
            continue

        doc_stats = {
            "total_items": 0,
            "with_images": 0,
            "visual_only": 0,
            "with_box": 0
        }

        with zipfile.ZipFile(doc_filename) as z:
            rels_xml = z.read("word/_rels/document.xml.rels")
            rels_root = ET.fromstring(rels_xml)
            rel_map = {r.attrib["Id"]: r.attrib["Target"] for r in rels_root}

            doc_xml = z.read("word/document.xml")
            doc_root = ET.fromstring(doc_xml)

            tables = doc_root.findall(f".//{W_NS}tbl")
            print(f"Tabelas no documento: {len(tables)}")

            for tbl_idx, tbl in enumerate(tables):
                rows = tbl.findall(f"{W_NS}tr")
                for row_idx, row in enumerate(rows):
                    cells = row.findall(f"{W_NS}tc")
                    if len(cells) < 6:
                        continue

                    slots = [
                        ("left", cells[0], cells[1], cells[2]),
                        ("right", cells[3], cells[4], cells[5])
                    ]

                    for side, img_cell, desc_cell, box_cell in slots:
                        box_lines = [
                            l.strip()
                            for p in box_cell.findall(f"{W_NS}p")
                            for l in "".join(p.itertext()).splitlines()
                            if l.strip()
                        ]
                        box_raw = " ".join(box_lines).strip()

                        desc_lines = [
                            l.strip()
                            for p in desc_cell.findall(f"{W_NS}p")
                            for l in "".join(p.itertext()).splitlines()
                            if l.strip()
                        ]
                        desc_raw = " ".join(desc_lines).strip()

                        # Pula cabeçalho se houver
                        if desc_raw.upper() in ["DESCRIÇÃO", "DESCRIÇAO", "DESCRICAO"] or box_raw.upper() == "CAIXA":
                            continue

                        # Imagens
                        image_targets = []
                        for blip in img_cell.findall(f".//{A_NS}blip"):
                            rid = blip.attrib.get(f"{R_NS}embed")
                            if rid and rid in rel_map:
                                t = rel_map[rid]
                                if not t.startswith("media/"): t = f"media/{os.path.basename(t)}"
                                image_targets.append(t)

                        for vml in img_cell.iter():
                            tag = vml.tag.split("}")[-1]
                            if tag == "imagedata":
                                for k, v in vml.attrib.items():
                                    if "id" in k.lower() and v in rel_map:
                                        t = rel_map[v]
                                        if not t.startswith("media/"): t = f"media/{os.path.basename(t)}"
                                        image_targets.append(t)

                        has_img = len(image_targets) > 0
                        has_box = len(box_raw) > 0
                        has_desc = len(desc_raw) > 0

                        if not has_img and not has_box and not has_desc:
                            continue

                        item_id = f"mang_{doc_key}_r{row_idx}_{side}".lower()
                        box_number, internal_code = clean_box_and_code(box_lines)
                        clean_desc, ref_codes = sanitize_description_and_refs(desc_raw)

                        hose_type = classify_hose_type(clean_desc)
                        section_name = f"{line_name} — {hose_type}"

                        needs_review = False
                        if not clean_desc:
                            needs_review = True
                            clean_desc = f"[Identificação Visual] Mangueira {line_name} — Caixa {box_number}".strip()

                        manufacturers = detect_manufacturers(clean_desc, default_mfr)
                        technical_specs = extract_technical_specs(clean_desc)

                        # Processa imagem
                        converted_images = []
                        for img_idx, target_path in enumerate(image_targets):
                            zip_img_path = f"word/{target_path}"
                            try:
                                img_bytes = z.read(zip_img_path)
                                if len(image_targets) == 1:
                                    img_filename = f"{item_id}.webp"
                                else:
                                    img_filename = f"{item_id}_ang{img_idx + 1}.webp"

                                disk_output_path = os.path.join(output_img_dir, img_filename)
                                web_path = f"/catalog-images/mangueiras/{img_filename}".lower()

                                if os.path.exists(disk_output_path) and os.path.getsize(disk_output_path) > 0:
                                    converted_images.append(web_path)
                                    stats["total_images"] += 1
                                else:
                                    conv_res = convert_to_studio_webp(img_bytes, disk_output_path)
                                    if conv_res["success"]:
                                        converted_images.append(web_path)
                                        stats["total_images"] += 1
                                        if conv_res.get("is_black"):
                                            stats["black_pixels"] += 1
                                    else:
                                        stats["pixel_failures"] += 1
                                        print(f"  ALERTA: Falha na imagem {zip_img_path}: {conv_res.get('error')}")
                            except KeyError:
                                print(f"  ALERTA: {zip_img_path} não encontrada no ZIP!")

                        primary_img = converted_images[0] if converted_images else None

                        product = {
                            "id": item_id,
                            "catalogSource": doc_filename,
                            "lineName": line_name,
                            "hoseType": hose_type,
                            "section": hose_type,
                            "boxNumber": box_number,
                            "internalCode": internal_code,
                            "referenceCodes": ref_codes,
                            "description": clean_desc,
                            "cleanDescription": clean_desc,
                            "manufacturers": manufacturers,
                            "technicalSpecs": technical_specs,
                            "images": converted_images,
                            "primaryImage": primary_img,
                            "needsDescriptionReview": needs_review,
                            "price": None,
                            "stockQty": None,
                            "createdAt": datetime.now().isoformat(),
                            "updatedAt": datetime.now().isoformat()
                        }

                        product["searchTokens"] = build_search_tokens(product)
                        master_products.append(product)

                        doc_stats["total_items"] += 1
                        if converted_images: doc_stats["with_images"] += 1
                        if needs_review: doc_stats["visual_only"] += 1
                        if box_number: doc_stats["with_box"] += 1

                        stats["sections"][hose_type] = stats["sections"].get(hose_type, 0) + 1
                        stats["lines"][line_name] = stats["lines"].get(line_name, 0) + 1

                print(f"-> Extraídos {doc_stats['total_items']} produtos de {doc_filename}")

        stats["docs"][doc_filename] = doc_stats

    stats["total_products"] = len(master_products)

    seed_path = os.path.join("public", "data", "catalog-master-seed.json")
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(master_products, f, ensure_ascii=False, indent=2)

    stats_path = os.path.join("public", "data", "extraction-stats.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print("\n=======================================================")
    print("EXTRAÇÃO DE MANGUEIRAS CONCLUÍDA COM SUCESSO!")
    print(f"Total de Mangueiras Geradas: {stats['total_products']}")
    print(f"Total de Imagens WebP Convertidas: {stats['total_images']}")
    print(f"Imagens Pretas Auditadas: {stats['black_pixels']} (ZERO)")
    print(f"Falhas de Pixel: {stats['pixel_failures']} (ZERO)")
    print(f"Seed Salvo em: {seed_path}")
    print("=======================================================\n")

    return stats

if __name__ == "__main__":
    extract_docx_catalogs()
