# Catálogo de Mangueiras Automotivas — Localizador Visual de Balcão

Sistema inteligente, ultra-rápido e **100% Offline-First (PWA + Desktop Windows nativo via Tauri v2)** para identificação visual e localização imediata de caixas, gavetas e códigos de mangueiras automotivas no balcão de autopeças.

Engenharia reversa e consolidação dos catálogos técnicos em Word (`.docx`) das montadoras **Fiat**, **Ford**, **General Motors (GM)**, **Volkswagen (VW)** e **Importados**.

---

## 🎯 Objetivo Central de Balcão

Projetado especificamente para a rotina intensa e ágil do balconista de autopeças:
1. **Identificação Visual Imediata:** Permite ao atendente comparar a foto de alta nitidez da mangueira (formato, curvatura, bocais) com a amostra que o cliente trouxe no balcão.
2. **Localização em menos de 1 segundo:** O balconista digita o nome do carro, código de referência ou aplicação e visualiza imediatamente o **Badge Gigante da CAIXA / GAVETA** (ex.: `CAIXA 940`, `CAIXA 10309`, `GAVETA 12`) e o **Código Interno**.
3. **Mural Visual de Comparação:** Modo de grade com fotos em tamanho expandido para varredura rápida quando o cliente não sabe o ano ou modelo exato do veículo.
4. **Daylight Counter Mode:** Design System de alto contraste industrial otimizado para ambientes com iluminação fluorescente e reflexos de balcão, com alternância para Dark Mode.
5. **100% Offline-First:** Funciona sem internet através de IndexedDB (`BalcaoMangueirasDB`) e Service Worker PWA (`balcao-mangueiras-v1`).

---

## 🚀 Tecnologias

- **Frontend & Runtime:** [Bun](https://bun.sh/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Design System & Estilização:** [Tailwind CSS](https://tailwindcss.com/) + Daylight Counter Mode (Industrial High Contrast)
- **Ícones:** SVG Inline sem dependências externas (Zero Emojis na UI)
- **Persistência Local:** IndexedDB nativo com busca tolerante a acentos e prefixos (tempo de busca < 1ms)
- **PWA & Cache:** Web App Manifest + Service Worker com estratégias Network-First para seed e Cache-First para WebP
- **Desktop Nativo:** [Tauri v2](https://v2.tauri.app/) (Rust) para gerar instaladores `.exe` e `.msi` Windows
- **Pipeline de Imagens:** Python (`python-docx` + `Pillow`) com conversão para WebP Studio (fundo `#FFFFFF`, trim inteligente e qualidade 96)

---

## 📦 Estrutura do Catálogo

O banco de dados consolidado (`public/data/catalog-master-seed.json`) contém **509 produtos técnicos** divididos por montadoras:

| Montadora | Arquivo Fonte | Itens Extraídos | Imagens WebP Geradas |
|---|---|---|---|
| **FIAT** | `MANGUEIRAS LINHA FIAT.docx` | 134 | 134 |
| **FORD** | `MANGUEIRAS LINHA FORD.docx` | 89 | 89 |
| **GENERAL MOTORS (GM)** | `MANGUEIRAS LINHA GM.docx` | 127 | 127 |
| **VOLKSWAGEN (VW)** | `MANGUEIRAS LINHA VOLKSWAGEN.docx` | 152 | 152 |
| **IMPORTADOS** | `MANGUEIRAS LINHA IMPORTADOS.docx` | 7 | 7 |
| **TOTAL** | **5 Documentos** | **509 mangueiras** | **509 WebP Studio** |

---

## ⌨️ Atalhos de Teclado no Balcão

- **`Ctrl + K`** ou **`/`**: Foca instantaneamente na barra de busca.
- **`Alt + 1`**: Alterna para o modo **Grade de Balcão** (compacto com badge de caixa gigante).
- **`Alt + 2`**: Alterna para o modo **Mural Visual de Identificação** (fotos grandes para comparação).
- **`Alt + 3`**: Alterna para o modo **Lista Rápida / Tabela**.
- **`F2`**: Abre o formulário de cadastro de novo item / mangueira.
- **`Esc`**: Limpa o filtro de busca ou fecha modais abertos.
- **`Ctrl + V`**: Cola imagens diretamente da área de transferência no modal de edição.

> *Nota de Ergonomia:* As teclas de navegação vertical (`ArrowUp` / `ArrowDown`) são 100% livres para rolagem natural da página.

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- [Bun](https://bun.sh/) (v1.0+)
- [Python 3.10+](https://www.python.org/) com `pillow` e `python-docx` (para reprocessamento de fontes)

### Instalação e Execução
```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento (Porta exclusiva 5180)
bun run dev
```

O navegador abrirá automaticamente em `http://localhost:5180`.

### Geração de Build PWA para Produção
```bash
bun run build
```
Os arquivos otimizados prontos para deploy estático (GitHub Pages, Vercel, Netlify ou servidor local) serão gerados na pasta `dist/`.

### Testes e Validação dos Quality Gates
```bash
# Testes unitários com Bun Test
bun test

# Verificação rigorosa dos 10 Quality Gates de Balcão
python scripts/verify_all_10_quality_gates.py
```

---

## 📄 Licença

Uso interno comercial e de balcão automotivo. Todos os direitos reservados.
