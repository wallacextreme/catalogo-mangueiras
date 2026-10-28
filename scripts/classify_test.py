import re

def classify_hose_type(desc: str) -> str:
    d = desc.upper()
    if 'RADIADOR' in d and ('SUP' in d or 'SUPERIOR' in d):
        return 'Radiador Superior'
    if 'RADIADOR' in d and ('INF' in d or 'INFERIOR' in d):
        return 'Radiador Inferior'
    if 'RADIADOR' in d:
        return 'Radiador (Outras)'
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

with open('C:/Users/Usu/.gemini/antigravity/brain/d8804afd-118b-4b63-9b1c-991245f16234/scratch/mang_dump.txt', 'r', encoding='utf-8') as f:
    counts = {}
    for line in f:
        if '|' in line and not line.startswith('====='):
            desc = line.split('|', 1)[1].strip()
            if desc in ['DESCRIÇÃO', 'DESCRIÇAO', 'DESCRICAO'] or not desc:
                continue
            cat = classify_hose_type(desc)
            counts[cat] = counts.get(cat, 0) + 1

    print('Distribuição por tipo de mangueira:')
    for k, v in sorted(counts.items(), key=lambda x: -x[1]):
        print(f'  {k}: {v}')
    print(f'Total classificados: {sum(counts.values())}')
