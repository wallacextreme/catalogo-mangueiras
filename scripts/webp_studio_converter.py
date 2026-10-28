#!/usr/bin/env python3
"""
webp_studio_converter.py
Módulo de conversão de imagens para WebP com fundo branco (#FFFFFF),
Smart Trim proporcional e auditoria rigorosa de integridade de pixels.
"""

import io
import os
from PIL import Image, ImageChops, ImageStat

def convert_to_studio_webp(
    image_bytes: bytes,
    output_path: str,
    quality: int = 96,
    method: int = 6,
    padding: int = 16
) -> dict:
    """
    Converte bytes de imagem bruta para WebP estúdio sobre fundo branco puro #FFFFFF.
    Aplica Smart Trim mantendo proporções e adicionando margem de padding.
    Audita integridade dos pixels para garantir zero imagens pretas ou corrompidas.
    """
    try:
        # Garante diretório de saída
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        with Image.open(io.BytesIO(image_bytes)) as img:
            # Converte transparências sobre fundo branco puro
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                rgba = img.convert("RGBA")
                background = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
                composited = Image.alpha_composite(background, rgba)
                rgb_img = composited.convert("RGB")
            else:
                rgb_img = img.convert("RGB")

            # Smart Trim com margem de padding
            # Detecta bbox de conteúdo diferente de branco puro (#FFFFFF)
            bg_white = Image.new("RGB", rgb_img.size, (255, 255, 255))
            diff = ImageChops.difference(rgb_img, bg_white)
            bbox = diff.getbbox()

            if bbox:
                left, top, right, bottom = bbox
                w_orig, h_orig = rgb_img.size

                # Expande com padding de 16px sem ultrapassar limites da imagem
                left = max(0, left - padding)
                top = max(0, top - padding)
                right = min(w_orig, right + padding)
                bottom = min(h_orig, bottom + padding)

                # Só recorta se a área recortada for significativa (> 20x20)
                if (right - left) >= 20 and (bottom - top) >= 20:
                    rgb_img = rgb_img.crop((left, top, right, bottom))

            # Normalização de dimensões máximas se muito grande (mantém nitidez no balcão)
            max_dim = 1200
            if rgb_img.width > max_dim or rgb_img.height > max_dim:
                rgb_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            # Salva em WebP de alta qualidade
            rgb_img.save(
                output_path,
                format="WEBP",
                quality=quality,
                method=method,
                exact=True
            )

            # Auditoria de pixels: verificar se a imagem não é preta ou corrompida
            file_size = os.path.getsize(output_path)
            stat = ImageStat.Stat(rgb_img)
            mean_vals = stat.mean  # [R_mean, G_mean, B_mean]
            stddev_vals = stat.stddev

            is_all_black = all(m < 5 for m in mean_vals) and all(s < 2 for s in stddev_vals)

            return {
                "success": not is_all_black and file_size > 0,
                "width": rgb_img.width,
                "height": rgb_img.height,
                "size_bytes": file_size,
                "is_black": is_all_black,
                "path": output_path
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "path": output_path
        }

if __name__ == "__main__":
    # Teste unitário simples
    test_img = Image.new("RGBA", (200, 200), (255, 255, 255, 0))
    # Desenha um quadrado azul
    for x in range(50, 150):
        for y in range(50, 150):
            test_img.putpixel((x, y), (0, 102, 204, 255))
    buf = io.BytesIO()
    test_img.save(buf, format="PNG")
    res = convert_to_studio_webp(buf.getvalue(), "public/test.webp")
    print("Test converter result:", res)
    if os.path.exists("public/test.webp"):
        os.remove("public/test.webp")
