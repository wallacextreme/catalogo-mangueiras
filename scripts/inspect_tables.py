import docx

W_NS = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

def inspect_doc(doc_path):
    doc = docx.Document(doc_path)
    print(f"=== {doc_path} ===")
    curr_title = "Início"
    tbl_count = 0
    for el in doc._element.body:
        tag = el.tag.split("}")[-1]
        if tag == "p":
            txt = "".join(el.itertext()).strip()
            if txt and len(txt) < 120:
                curr_title = txt
        elif tag == "tbl":
            rows = el.findall(f"{W_NS}tr")
            print(f"  Table {tbl_count} (rows: {len(rows)}): previous text = {repr(curr_title)}")
            tbl_count += 1

inspect_doc("GRAMPOS,PRESILHAS,BATENTES E ACABAMENTOS...docx")
inspect_doc("PEÇAS (MIUDEZAS) CATALOGO 2.docx")
