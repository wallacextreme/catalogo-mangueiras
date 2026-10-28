# 📘 ARQUITETURA_CATALOGOS.md — GUIA MESTRE DE ENGENHARIA REVERSA, DESIGN SYSTEM AUTOMÁTICO (`UI-UX-PRO-MAX`) E QUALITY GATES (PADRÃO OURO 10/10)

> **Propósito deste Documento:** Este arquivo é ao mesmo tempo a **Especificação Arquitetural Definitiva** e o **Prompt-Mestre de Execução** para construir qualquer sistema de catálogo automotivo (de 1 ou múltiplos fabricantes) do zero. Ele transforma catálogos PDF brutos em uma aplicação de balcão **Offline-First (PWA + Windows Desktop Tauri v2)** com latência zero (0 ms), busca sub-50ms, fotos de estúdio extraídas via `XREF` em `.webp`, cruzamento inteligente entre marcas, galeria manual multi-ângulos (`Ctrl+V`), modo de privacidade no balcão e design de alto nível gerado via `ui-ux-pro-max-skill`.

---

## 🎨 0. PROTOCOLO AUTOMÁTICO DE DESIGN SYSTEM (`UI-UX-PRO-MAX-SKILL`)

Antes de criar qualquer componente visual, o agente DEVE instalar e consultar dinamicamente a skill oficial **`ui-ux-pro-max`**:

1. **Instalação Automática no Repositório:**
   ```bash
   bunx skills add [https://github.com/nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) --skill ui-ux-pro-max