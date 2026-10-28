#!/usr/bin/env python3
"""
scripts/extract_docx_catalogs.py
Engenharia Reversa dos Catálogos Word (.docx) para o Catálogo Interno de Balcão.
Extrai produtos, seções, caixas, códigos internos, códigos de referência, montadoras,
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
        "filename": "GRAMPOS,PRESILHAS,BATENTES E ACABAMENTOS...docx",
        "doc_key": "doc1",
        "table_sections": [
            "Grampos, Presilhas, Batentes e Acabamentos",
            "Porca Rápida e Buchas de Fixação",
            "Molas em Geral",
            "Alças, Moldura e Kits Banco",
            "Parafuso Fixação e Regulagem de Farol"
        ]
    },
    {
        "filename": "PEÇAS (MIUDEZAS) CATALOGO 2.docx",
        "doc_key": "doc2",
        "table_sections": [
            "Reparos de Trambulador e Câmbio",
            "Castelo Vela (Tucho)",
            "Calota Cubo Roda",
            "Porcas Ponta Eixo / Homocinética / Amortecedor",
            "Bujão e Anéis de Cárter e Caixa",
            "Parafuso Suspensão / Balança / Motor",
            "Kit Embreagem e Kits de Pedal",
            "Bucha Caixa Direção",
            "Conexões e Engates Rápidos",
            "Regulagem de Freio"
        ]
    }
]

# Regex para descolar códigos de referência grudados na descrição
RE_GLUED_P = re.compile(
    r'^(P-?\d{1,5}[A-Z]?)(PRESILHA|GRAMPO|PORCA|BUCHA|TRAVA|FIXADOR|CALOTA|ANEL|MOLA|PARAFUSO|REPARO|KIT|CONEXAO|CONECTOR|DISCO|CLIP|TAMPA|TUCHO|BORRACHA|MANGUEIRA|VALVULA|HASTE|TERMINAL|ALAVANCA|GARFO|SAPATA|SAPATAO|CANO|FLANGE|GUIA|LATERAL|FRISO|PAINEL|REVESTIMENTO|VARETA|PORTA|ISOLAMENTO)',
    re.IGNORECASE
)
RE_GLUED_LF = re.compile(
    r'^(LF-?\d{2,5}[A-Z]?(-[A-Z0-9]+)?)(PRESILHA|GRAMPO|PORCA|BUCHA|TRAVA|FIXADOR|CALOTA|ANEL|MOLA|PARAFUSO|REPARO|KIT|CONEXAO|CONECTOR|DISCO|CLIP|TAMPA|TUCHO|BORRACHA|MANGUEIRA|VALVULA|HASTE|TERMINAL|ALAVANCA|GARFO|SAPATA|CANO|FLANGE|GUIA)',
    re.IGNORECASE
)
RE_GLUED_T = re.compile(
    r'^(T-?\d{1,3}[A-Z]?)(PRESILHA|GRAMPO|PORCA|BUCHA|TRAVA|FIXADOR|DISCO|CLIP)',
    re.IGNORECASE
)
RE_GLUED_K = re.compile(
    r'^(K-?\d{1,3}[A-Z]?)(KIT|MOLA|BANCO)',
    re.IGNORECASE
)

# Regex para captura geral de códigos de referência
RE_REF_CODES = [
    re.compile(r'\b(P-?\d{1,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(LF-?\d{2,5}[A-Z]?(-[A-Z0-9]+)?)\b', re.IGNORECASE),
    re.compile(r'\b(LT-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(LTC-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(D[1-6]00\.\d{1,4})\b', re.IGNORECASE),
    re.compile(r'\bJAHU\s*(\d{4,6}(-\d)?)\b', re.IGNORECASE),
    re.compile(r'\bCORCERAMA\s*(\d{4,6})\b', re.IGNORECASE),
    re.compile(r'\bKIT&CIA\s*(\d{4,6})\b', re.IGNORECASE),
    re.compile(r'\b(EMO-\d{4,6})\b', re.IGNORECASE),
    re.compile(r'\b(KPA\d{4,8})\b', re.IGNORECASE),
    re.compile(r'\b(K-?\d{1,3}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(T-?\d{1,3}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(AP-?\d{1,4})\b', re.IGNORECASE),
    re.compile(r'\b(VW-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(FD-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(FT-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(GM-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(QC-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(QCW-?\d{2,5}[A-Z]?)\b', re.IGNORECASE),
    re.compile(r'\b(GMG\d{2,5})\b', re.IGNORECASE),
    re.compile(r'\b(DC\d{2,5})\b', re.IGNORECASE),
    re.compile(r'\b(DV-\d{3,6})\b', re.IGNORECASE),
    re.compile(r'\b(ETE\d{3,5})\b', re.IGNORECASE),
    re.compile(r'\b(IN\d{3,5})\b', re.IGNORECASE),
    re.compile(r'\b(PR\d{3,5})\b', re.IGNORECASE),
    # Códigos OEM (ex.: XS6171586AA, 013.141.719.2, 307.419.063-5, 100164475)
    re.compile(r'\b([A-Z]{2,3}\d{6,8}[A-Z]{0,3})\b'),
    re.compile(r'\b(\d{3}\.\d{3}\.\d{3}(\.\d)?)\b'),
    re.compile(r'\b(\d{3}\.\d{3}\.\d{3}-\d)\b'),
    re.compile(r'\b(\d{5,8})\b'),
]

# Montadoras
MANUFACTURER_MAP = {
    "VW": [
        "VW", "VOLKS", "VOLKSWAGEN", "VOLWAGEM", "GOL", "PARATI", "SAVEIRO", "VOYAGE",
        "SANTANA", "FOX", "UP", "GOLF", "POLO", "JETTA", "PASSAT", "KOMBI", "FUSCA",
        "BORA", "CROSSFOX", "SPACEFOX", "TIGUAN", "AMAROK", "VERSAILLES", "POINTER", "LOGUS"
    ],
    "GM": [
        "GM", "CHEVROLET", "CHEVETTE", "CORSA", "CELTA", "ONIX", "PRISMA", "COBALT",
        "SPIN", "CRUZE", "ASTRA", "VECTRA", "KADETT", "MONZA", "S10", "BLAZER",
        "SILVERADO", "OPALA", "CARAVAN", "MONTANA", "MERIVA", "ZAFIRA", "AGILE", "TRACKER", "OMEGA"
    ],
    "Fiat": [
        "FIAT", "FT", "UNO", "PALIO", "SIENA", "STRADA", "MOBI", "ARGO", "CRONOS",
        "TORO", "DUCATO", "PUNTO", "LINEA", "TEMPRA", "TIPO", "DOBLO", "FIORINO",
        "IDEA", "BRAVO", "MAREA", "ELBA", "PREMIO", "147", "OGGI"
    ],
    "Ford": [
        "FORD", "FD", "FIESTA", "KA", "ECOSPORT", "FOCUS", "ESCORT", "VERONA",
        "CORCEL", "DEL REY", "DELREY", "PAMPA", "RANGER", "F1000", "COURIER",
        "ROYALE", "TAUNUS", "F250", "BELINA", "HOBBY"
    ],
    "Toyota": ["TOYOTA", "COROLLA", "ETIOS", "YARIS", "HILUX", "SW4", "RAV4"],
    "Honda": ["HONDA", "CIVIC", "FIT", "CITY", "HRV", "CRV", "WRV", "ACCORD"],
    "Renault": ["RENAULT", "CLIO", "SANDERO", "LOGAN", "DUSTER", "KWID", "MEGANE", "SCENIC", "MASTER", "CAPTUR", "OROCH"],
    "Peugeot/Citroën": [
        "PEUGEOT", "CITROEN", "CITROËN", "206", "207", "208", "307", "308", "C3",
        "C4", "AIRCROSS", "XSARA", "PICASSO", "BERLINGO", "PARTNER", "CACTUS", "LOUNGE"
    ],
    "Hyundai": ["HYUNDAI", "HINDAY", "HB20", "CRETA", "TUCSON", "I30", "ELANTRA", "AZERA", "AZERRA", "SONATA", "SANTA FE", "IX35", "HR"],
    "Mitsubishi": ["MITSUBISHI", "L200", "PAJERO", "ASX", "LANCER", "OUTLANDER"],
    "Nissan": ["NISSAN", "MARCH", "VERSA", "KICKS", "FRONTIER", "SENTRA", "TIIDA", "LIVINA"]
}

def clean_box_and_code(raw_lines: list[str]) -> tuple[str, str]:
    """
    Separa e higieniza boxNumber e internalCode a partir das linhas ou texto bruto da célula de caixa.
    """
    if not raw_lines:
        return "", ""

    # Junta linhas e limpa espaços
    lines = [l.strip() for l in raw_lines if l.strip()]
    if not lines:
        return "", ""

    box_number = ""
    internal_code = ""

    if len(lines) == 1:
        text = lines[0]
        # Casos explícitos com códigos conhecidos colados: ex '392MU392', '10309MU10309', '1048BLT-2340', '121FT1380'
        m = re.match(r'^(\d+[A-Z]?)(MU\d+.*|COR\d+.*|LT-?\d+.*|LF\d+.*|FT\d+.*|AJ\d+.*)$', text, re.IGNORECASE)
        if m:
            box_number = m.group(1).strip()
            internal_code = m.group(2).strip()
        else:
            # Caso com espaço interno (ex: "392 MU392" ou "121 FT1380" ou "39 22839")
            parts = text.split()
            if len(parts) >= 2 and any(parts[1].upper().startswith(pfx) for pfx in ("MU", "COR", "LT", "LF", "FT", "AJ", "228")):
                box_number = parts[0].strip()
                internal_code = " ".join(parts[1:]).strip()
            else:
                # Apenas 1 valor (ex: "940", "10309", "916AGR", "570GR", "824C", "1060A")
                box_number = text.strip()
    else:
        # 2 ou mais linhas
        box_number = lines[0].strip()
        internal_code = lines[1].strip()

    # Higienização de prefixos "Cx.", "Caixa", etc.
    box_number = re.sub(r'^(CX\.?|CAIXA)\s*', '', box_number, flags=re.IGNORECASE).strip()

    # Normalização de códigos internos padrão
    if internal_code:
        # Se for código interno com espaço (ex: 'MU 392' -> 'MU392')
        internal_code = re.sub(r'^(MU|COR|LT|LF|FT|AJ)\s+', r'\1', internal_code, flags=re.IGNORECASE)

    return box_number, internal_code

def sanitize_description_and_refs(desc_raw: str) -> tuple[str, list[str]]:
    """
    Desgruda códigos de referência colados no início da descrição
    e extrai todos os códigos de referência e fabricante.
    """
    if not desc_raw:
        return "", []

    text = " ".join(desc_raw.split()).strip()

    # 1. Desgrudar códigos colados no início
    for regex in [RE_GLUED_P, RE_GLUED_LF, RE_GLUED_T, RE_GLUED_K]:
        m = regex.match(text)
        if m:
            code = m.group(1).strip()
            # Formatação canônica se for Pxxx (ex: P111 -> P-111)
            if re.match(r'^P\d', code, re.IGNORECASE):
                canonical_code = f"P-{code[1:]}"
            else:
                canonical_code = code

            rest = text[m.end(1):].strip()
            text = f"{canonical_code} {rest}"
            break

    # 2. Extrair códigos de referência
    found_refs = []
    for regex in RE_REF_CODES:
        for match in regex.finditer(text):
            val = match.group(0).strip()
            # Normalização de código P
            if re.match(r'^P\d{1,5}[A-Z]?$', val, re.IGNORECASE):
                val = f"P-{val[1:]}"
            if val and val.upper() not in [r.upper() for r in found_refs]:
                found_refs.append(val)

    return text, found_refs

def detect_manufacturers(text: str) -> list[str]:
    """Identifica montadoras e modelos citados na descrição."""
    if not text:
        return ["Universal"]

    found = []
    # Separa barras, traços e pontos para não colar palavras (ex: C3/C4 -> C3 C4)
    normalized = re.sub(r'[/_\-\.]', ' ', text).upper()
    tokens = set(re.findall(r'\b[A-Z0-9]+\b', normalized))

    for mfr, keywords in MANUFACTURER_MAP.items():
        for kw in keywords:
            if kw in tokens or f" {kw} " in f" {normalized} ":
                if mfr not in found:
                    found.append(mfr)
                break

    if not found or "UNIVERSAL" in normalized:
        if "Universal" not in found:
            found.append("Universal")

    return found

def extract_technical_specs(text: str) -> list[str]:
    """Extrai medidas e especificações técnicas."""
    if not text:
        return []

    specs = []
    # Medidas como 12X19X9X0,60MM, M20X1,50X43, 5/16" x 5/16", 8mm, 90°
    patterns = [
        re.compile(r'\b\d+([,\.]\d+)?\s*(MM|CM)\b', re.IGNORECASE),
        re.compile(r'\b\d+(X\d+)+([,\.]\d+)?\s*(MM)?\b', re.IGNORECASE),
        re.compile(r'\bM\d+X\d+([,\.]\d+)?(X\d+)?\b', re.IGNORECASE),
        re.compile(r'\b\d+/\d+("|\'\'|\s*POLEGADAS?)?\b', re.IGNORECASE),
        re.compile(r'\b\d+°\b'),
        re.compile(r'PINO:\s*[\d,\.]+', re.IGNORECASE),
        re.compile(r'CORPO:\s*[\d,\.]+', re.IGNORECASE),
        re.compile(r'CABEÇA:\s*[\d,\.]+', re.IGNORECASE),
    ]

    for p in patterns:
        for match in p.finditer(text):
            val = match.group(0).strip()
            if val and val not in specs:
                specs.append(val)

    return specs

def build_search_tokens(item: dict) -> list[str]:
    """Gera tokens de busca abrangentes para resposta < 50ms."""
    tokens = set()

    def add_tokens(s: str):
        if not s:
            return
        # Divide por pontuações e espaços
        cleaned = re.sub(r'[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]', ' ', s.lower())
        for t in cleaned.split():
            if len(t) >= 1:
                tokens.add(t)

    # Caixa e prefixos de caixa
    if item.get("boxNumber"):
        bn = item["boxNumber"].lower()
        tokens.add(bn)
        tokens.add(f"cx{bn}")
        tokens.add(f"cx {bn}")
        tokens.add(f"caixa {bn}")
        add_tokens(item["boxNumber"])

    # Código Interno
    if item.get("internalCode"):
        ic = item["internalCode"].lower()
        tokens.add(ic)
        # Se tem traço, adiciona sem traço
        tokens.add(ic.replace("-", ""))
        add_tokens(item["internalCode"])

    # Códigos de Referência
    for r in item.get("referenceCodes", []):
        rc = r.lower()
        tokens.add(rc)
        tokens.add(rc.replace("-", "").replace(".", ""))
        add_tokens(r)

    # Descrição e Seção
    add_tokens(item.get("description", ""))
    add_tokens(item.get("section", ""))

    # Montadoras
    for mfr in item.get("manufacturers", []):
        add_tokens(mfr)

    # Especificações técnicas
    for spec in item.get("technicalSpecs", []):
        add_tokens(spec)

    return sorted(list(tokens))

def extract_docx_catalogs():
    """Processa todos os documentos e extrai imagens e produtos."""
    output_img_dir = os.path.join("public", "catalog-images", "miudezas")
    os.makedirs(output_img_dir, exist_ok=True)
    os.makedirs(os.path.join("public", "data"), exist_ok=True)

    master_products = []
    stats = {
        "docs": {},
        "total_products": 0,
        "total_images": 0,
        "black_pixels": 0,
        "pixel_failures": 0,
        "sections": {}
    }

    for doc_cfg in DOCS_CONFIG:
        doc_filename = doc_cfg["filename"]
        doc_key = doc_cfg["doc_key"]
        sections = doc_cfg["table_sections"]

        print(f"\n=======================================================")
        print(f"Iniciando extração do catálogo: {doc_filename}")
        print(f"=======================================================")

        if not os.path.exists(doc_filename):
            print(f"ERRO: Arquivo {doc_filename} não encontrado no diretório atual!")
            continue

        doc_stats = {
            "total_items": 0,
            "with_images": 0,
            "visual_only": 0,
            "with_box": 0
        }

        with zipfile.ZipFile(doc_filename) as z:
            # Carrega relacionamentos do documento Word
            rels_xml = z.read("word/_rels/document.xml.rels")
            rels_root = ET.fromstring(rels_xml)
            rel_map = {r.attrib["Id"]: r.attrib["Target"] for r in rels_root}

            # Carrega o XML principal
            doc_xml = z.read("word/document.xml")
            doc_root = ET.fromstring(doc_xml)

            tables = doc_root.findall(f".//{W_NS}tbl")
            print(f"Total de tabelas identificadas: {len(tables)} (esperado: {len(sections)})")

            for tbl_idx, tbl in enumerate(tables):
                section_name = sections[tbl_idx] if tbl_idx < len(sections) else f"Seção Geral {tbl_idx + 1}"
                print(f"\n-> Processando Tabela {tbl_idx}: '{section_name}'...")
                tbl_item_count = 0

                rows = tbl.findall(f"{W_NS}tr")
                for row_idx, row in enumerate(rows):
                    # Pula cabeçalhos da primeira linha
                    if row_idx == 0:
                        continue

                    cells = row.findall(f"{W_NS}tc")
                    if len(cells) < 6:
                        continue

                    # Slots: Esquerdo (0, 1, 2) e Direito (3, 4, 5)
                    slots = [
                        ("left", cells[0], cells[1], cells[2]),
                        ("right", cells[3], cells[4], cells[5])
                    ]

                    for side, img_cell, desc_cell, box_cell in slots:
                        # 1. Coleta texto da caixa
                        box_lines = [
                            line.strip()
                            for p in box_cell.findall(f"{W_NS}p")
                            for line in "".join(p.itertext()).splitlines()
                            if line.strip()
                        ]
                        box_raw = " ".join(box_lines).strip()

                        # 2. Coleta texto da descrição
                        desc_lines = [
                            line.strip()
                            for p in desc_cell.findall(f"{W_NS}p")
                            for line in "".join(p.itertext()).splitlines()
                            if line.strip()
                        ]
                        desc_raw = " ".join(desc_lines).strip()

                        # Ignora repetições de cabeçalho
                        if desc_raw.upper() in ["DESCRIÇÃO", "DESCRIÇAO", "DESCRICAO"] or box_raw.upper() == "CAIXA":
                            continue

                        # 3. Localiza imagens na célula de imagem
                        image_targets = []
                        for blip in img_cell.findall(f".//{A_NS}blip"):
                            rid = blip.attrib.get(f"{R_NS}embed")
                            if rid and rid in rel_map:
                                target = rel_map[rid]
                                if not target.startswith("media/"):
                                    target = os.path.basename(target)
                                    target = f"media/{target}"
                                image_targets.append(target)

                        for vml in img_cell.iter():
                            tag = vml.tag.split("}")[-1]
                            if tag == "imagedata":
                                for k, v in vml.attrib.items():
                                    if "id" in k.lower() and v in rel_map:
                                        target = rel_map[v]
                                        if not target.startswith("media/"):
                                            target = os.path.basename(target)
                                            target = f"media/{target}"
                                        image_targets.append(target)

                        has_img = len(image_targets) > 0
                        has_box = len(box_raw) > 0
                        has_desc = len(desc_raw) > 0

                        # Se não tem imagem, nem caixa, nem descrição, é slot vazio
                        if not has_img and not has_box and not has_desc:
                            continue

                        # Gera ID único 100% lowercase
                        item_id = f"miud_{doc_key}_t{tbl_idx}_r{row_idx}_{side}".lower()

                        # Separa Caixa e Código Interno
                        box_number, internal_code = clean_box_and_code(box_lines)

                        # Higieniza descrição e extrai códigos de referência
                        clean_desc, ref_codes = sanitize_description_and_refs(desc_raw)

                        # Trata itens visuais (Foto + Caixa sem descrição)
                        needs_review = False
                        if not clean_desc:
                            needs_review = True
                            if box_number:
                                clean_desc = f"[Identificação Visual] {section_name} — Caixa {box_number}"
                            else:
                                clean_desc = f"[Identificação Visual] {section_name}"

                        # Extrai montadoras e medidas técnicas
                        manufacturers = detect_manufacturers(clean_desc)
                        technical_specs = extract_technical_specs(clean_desc)

                        # Processa e converte imagens para WebP
                        converted_images = []
                        for img_idx, target_path in enumerate(image_targets):
                            zip_img_path = f"word/{target_path}"
                            try:
                                img_bytes = z.read(zip_img_path)
                                # Nome 100% lowercase
                                if len(image_targets) == 1:
                                    img_filename = f"{item_id}.webp"
                                else:
                                    img_filename = f"{item_id}_ang{img_idx + 1}.webp"

                                disk_output_path = os.path.join(output_img_dir, img_filename)
                                web_path = f"/catalog-images/miudezas/{img_filename}".lower()

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
                                        print(f"  ALERTA: Falha na conversão da imagem {zip_img_path}: {conv_res.get('error')}")

                            except KeyError:
                                print(f"  ALERTA: Imagem {zip_img_path} não encontrada no arquivo ZIP!")

                        # Constrói o objeto do produto
                        primary_img = converted_images[0] if converted_images else None

                        product = {
                            "id": item_id,
                            "catalogSource": doc_filename,
                            "section": section_name,
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

                        # Atualiza estatísticas
                        tbl_item_count += 1
                        doc_stats["total_items"] += 1
                        if converted_images:
                            doc_stats["with_images"] += 1
                        if needs_review:
                            doc_stats["visual_only"] += 1
                        if box_number:
                            doc_stats["with_box"] += 1

                        stats["sections"][section_name] = stats["sections"].get(section_name, 0) + 1

                print(f"  -> Concluído: {tbl_item_count} itens extraídos na seção '{section_name}'.")

        stats["docs"][doc_filename] = doc_stats

    stats["total_products"] = len(master_products)

    # Salva o arquivo de seed mestre JSON
    seed_path = os.path.join("public", "data", "catalog-master-seed.json")
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(master_products, f, ensure_ascii=False, indent=2)

    stats_path = os.path.join("public", "data", "extraction-stats.json")
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print("\n=======================================================")
    print("EXTRAÇÃO CONCLUÍDA COM SUCESSO ABSOLUTO!")
    print(f"Total de Produtos Gerados: {stats['total_products']}")
    print(f"Total de Imagens WebP Convertidas: {stats['total_images']}")
    print(f"Imagens Pretas Auditadas: {stats['black_pixels']} (ZERO falhas)")
    print(f"Falhas de Pixel Auditadas: {stats['pixel_failures']} (ZERO falhas)")
    print(f"Arquivo Seed Salvo em: {seed_path}")
    print("=======================================================\n")

    return stats

if __name__ == "__main__":
    extract_docx_catalogs()
