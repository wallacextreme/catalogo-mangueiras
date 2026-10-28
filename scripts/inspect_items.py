import zipfile
import xml.etree.ElementTree as ET

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
V_NS = "urn:schemas-microsoft-com:vml"

DOCS = [
    ("doc1", "GRAMPOS,PRESILHAS,BATENTES E ACABAMENTOS...docx"),
    ("doc2", "PEÇAS (MIUDEZAS) CATALOGO 2.docx")
]

for doc_id, doc_path in DOCS:
    with zipfile.ZipFile(doc_path) as z:
        rels_xml = z.read("word/_rels/document.xml.rels")
        rels_root = ET.fromstring(rels_xml)
        rel_map = {r.attrib["Id"]: r.attrib["Target"] for r in rels_root}
        
        doc_xml = z.read("word/document.xml")
        root = ET.fromstring(doc_xml)
        
        tables = root.findall(f".//{W_NS}tbl")
        print(f"=== {doc_path} ({len(tables)} tables) ===")
        
        total_items = 0
        with_img = 0
        with_box = 0
        with_desc = 0
        only_img_and_box = 0
        
        for ti, tbl in enumerate(tables):
            rows = tbl.findall(f"{W_NS}tr")
            tbl_items = 0
            for ri, row in enumerate(rows):
                if ri == 0:
                    continue # header
                cells = row.findall(f"{W_NS}tc")
                if len(cells) < 6:
                    continue
                
                # Left slot: 0 (img), 1 (desc), 2 (box)
                # Right slot: 3 (img), 4 (desc), 5 (box)
                for slot_idx, (img_c, desc_c, box_c) in enumerate([(cells[0], cells[1], cells[2]), (cells[3], cells[4], cells[5])]):
                    # Check text
                    desc_text = "".join(desc_c.itertext()).strip()
                    box_text = "".join(box_c.itertext()).strip()
                    
                    # Find images
                    img_targets = []
                    for blip in img_c.findall(f".//{A_NS}blip"):
                        rid = blip.attrib.get(f"{R_NS}embed")
                        if rid and rid in rel_map:
                            img_targets.append(rel_map[rid])
                    for vml in img_c.iter():
                        tag = vml.tag.split("}")[-1]
                        if tag == "imagedata":
                            for k, v in vml.attrib.items():
                                if "id" in k.lower() and v in rel_map:
                                    img_targets.append(rel_map[v])
                    
                    has_img = len(img_targets) > 0
                    has_box = len(box_text) > 0
                    has_desc = len(desc_text) > 0
                    
                    if not has_img and not has_box and not has_desc:
                        continue
                    
                    # Ignore header repeat lines
                    if desc_text.upper() in ["DESCRIÇÃO", "DESCRIÇAO", "DESCRICAO"] or box_text.upper() == "CAIXA":
                        continue
                        
                    total_items += 1
                    tbl_items += 1
                    if has_img: with_img += 1
                    if has_box: with_box += 1
                    if has_desc: with_desc += 1
                    if has_img and has_box and not has_desc:
                        only_img_and_box += 1
            print(f"  Table {ti}: {tbl_items} items")
        print(f"Summary for {doc_id}: Total={total_items}, WithImg={with_img}, WithBox={with_box}, WithDesc={with_desc}, VisualOnly={only_img_and_box}")
