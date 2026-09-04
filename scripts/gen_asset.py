"""Genera un asset visual nuevo con Gemini Images, condicionado por imágenes
de referencia de estilo (ver docs/style_anchors.md) en vez de solo texto —
así cada generación parte del mismo lenguaje visual en vez de "reinventar"
el estilo cada vez.

Uso:
    python3 scripts/gen_asset.py \
        --prompt "coral pastel ramificado, mismo estilo que las referencias" \
        --ref assets/backgrounds/pond/rocks_back.png \
        --ref assets/objects/fish/fish_01.png \
        --out assets/plants/coral/coral_01_raw.png

Requiere GEMINI_API_KEY en el entorno (se carga automáticamente desde .env
en la raíz del proyecto si existe). La imagen generada se guarda "cruda":
SIEMPRE pasarla después por scripts/fix_transparency.py y por una revisión
visual (composite sobre magenta + captura in-game) antes de integrarla —
nunca integrar directo la salida de este script.
"""

import argparse
import base64
import os
import sys
from pathlib import Path

import requests

MODEL = "gemini-2.5-flash-image"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
MAX_ATTEMPTS = 3


def load_env(project_root: Path) -> None:
    env_path = project_root / ".env"
    if not env_path.exists() or os.environ.get("GEMINI_API_KEY"):
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


def build_parts(prompt: str, ref_paths: list[str]) -> list[dict]:
    parts: list[dict] = []
    for ref in ref_paths:
        data = Path(ref).read_bytes()
        parts.append({
            "inline_data": {
                "mime_type": "image/png",
                "data": base64.b64encode(data).decode("ascii"),
            }
        })
    parts.append({"text": prompt})
    return parts


def generate(prompt: str, ref_paths: list[str], api_key: str, aspect_ratio: str | None = None) -> bytes:
    payload = {"contents": [{"parts": build_parts(prompt, ref_paths)}]}
    if aspect_ratio:
        payload["generationConfig"] = {"imageConfig": {"aspectRatio": aspect_ratio}}
    resp = requests.post(
        API_URL,
        params={"key": api_key},
        json=payload,
        timeout=120,
    )
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise RuntimeError(f"Gemini no devolvió candidatos: {data}")
    for part in candidates[0]["content"]["parts"]:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            return base64.b64decode(inline["data"])
    raise RuntimeError(f"Gemini no devolvió ninguna imagen: {data}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--ref", action="append", default=[], help="Imagen de referencia de estilo (repetible)")
    parser.add_argument("--out", required=True)
    parser.add_argument("--attempts", type=int, default=MAX_ATTEMPTS)
    parser.add_argument(
        "--background",
        action="store_true",
        help="Genera una escena de fondo opaca (sin la instruccion de transparencia, que solo aplica a props/personajes recortados).",
    )
    parser.add_argument(
        "--aspect-ratio",
        default=None,
        help="Relacion de aspecto del lienzo, p.ej. 9:16 para una escena vertical (el modelo ignora la orientacion pedida solo por texto).",
    )
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent.parent
    load_env(project_root)
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: falta GEMINI_API_KEY (ni en el entorno ni en .env)", file=sys.stderr)
        return 1

    if args.background:
        style_prefix = (
            "Ilustracion 2D pintada a mano, estilo acuarela pastel, contorno "
            "lavanda/malva (nunca negro), formas organicas suaves, colores "
            "pastel desaturados, sin sombreado duro, sin pixel art, sin 3D, sin "
            "fotorrealismo. Debe parecer dibujado por el mismo artista que las "
            "imagenes de referencia adjuntas. Es un FONDO DE ESCENA completo: "
            "todo el lienzo debe estar pintado de borde a borde, sin ningun "
            "area transparente ni recortada. "
        )
    else:
        style_prefix = (
            "Ilustracion 2D pintada a mano, estilo acuarela pastel, contorno "
            "lavanda/malva (nunca negro), formas organicas suaves, colores "
            "pastel desaturados, sin sombreado duro, sin pixel art, sin 3D, sin "
            "fotorrealismo. Debe parecer dibujado por el mismo artista que las "
            "imagenes de referencia adjuntas. Fondo completamente transparente "
            "(alpha real, no checkerboard). "
        )
    full_prompt = style_prefix + args.prompt

    last_error: Exception | None = None
    for attempt in range(1, args.attempts + 1):
        try:
            image_bytes = generate(full_prompt, args.ref, api_key, args.aspect_ratio)
            out_path = Path(args.out)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_bytes(image_bytes)
            print(f"OK ({attempt}/{args.attempts}): {out_path}")
            print("Siguiente paso obligatorio: scripts/fix_transparency.py + revision visual.")
            return 0
        except Exception as exc:  # noqa: BLE001 - queremos reintentar cualquier fallo de red/API
            last_error = exc
            print(f"Intento {attempt}/{args.attempts} fallo: {exc}", file=sys.stderr)

    print(f"ERROR: se agotaron los intentos. Ultimo error: {last_error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
