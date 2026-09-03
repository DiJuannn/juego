"""Pipeline reutilizable para arreglar el defecto recurrente de Gemini:
"fondo transparente" que en realidad vuelve como checkerboard gris/blanco o
negro casi puro horneado en RGB con alpha=255, a veces también en huecos
INTERIORES atrapados entre formas superpuestas del propio dibujo (no solo en
el borde del canvas).

Uso:
    python3 scripts/fix_transparency.py entrada.png salida.png [--report]

Con --report no escribe nada, solo imprime qué encontraría (para revisar
antes de aplicar). SIEMPRE revisar el composite sobre magenta que se guarda
junto a la salida antes de dar el asset por bueno — ver README de este
archivo más abajo.

Reglas de seguridad aprendidas a pulso esta sesión (no las rompas):
  1. scipy.ndimage.label() devuelve la etiqueta 0 para "no es parte de
     ninguna región detectada" — NUNCA generes una máscara con
     `labels == target` si `target == 0` sin comprobar antes que hay un
     borrado real e intencionado; `labels == 0` selecciona casi todo el
     dibujo real, no "nada".
  2. Antes de guardar cualquier máscara destructiva, imprime su `.sum()` y
     confirma que es un número pequeño y esperado.
  3. Nunca hacer un borrado por umbral de tamaño "a ciegas" sobre toda la
     imagen sin revisar el resultado compuesto sobre un fondo de color
     vivo (magenta) — un umbral demasiado alto se come detalles reales
     (vetas, brillos, líneas finas), confirmado dos veces esta sesión.
  4. "Conectado al borde del canvas" NO es sinónimo de "es basura de
     fondo": en un asset ya compuesto (p.ej. una hoja recortada a
     propósito en el borde inferior de un layer de foreground) el borde
     puede tener transparencia real y deliberada. Verificado en esta
     misma sesión: correr este script en modo --report sobre un asset ya
     terminado y verificado in-game marcó como "borde" tanto ruido
     invisible (alpha~1) como bordes de hoja con alpha~110-165 que sí se
     verían si se borraran. Por eso esta herramienta es para la SALIDA
     CRUDA de Gemini (que normalmente rellena todo el rectángulo exterior
     con checkerboard/negro hasta el borde), no para "revalidar" assets ya
     integrados — y siempre hay que mirar --report y el composite en
     magenta antes de aceptar cualquier borrado.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

CHECKER_SPREAD_MAX = 12
CHECKER_LIGHTNESS_MIN = 150
NEAR_BLACK_SUM_MAX = 60
DEFAULT_INTERIOR_HOLE_MAX_SIZE = 4000
FEATHER_RADIUS = 1.1


def _is_checker_like(rgb: np.ndarray) -> np.ndarray:
    spread = rgb.max(axis=-1).astype(int) - rgb.min(axis=-1).astype(int)
    lightness = rgb.mean(axis=-1)
    return (spread < CHECKER_SPREAD_MAX) & (lightness > CHECKER_LIGHTNESS_MIN)


def _is_near_black(rgb: np.ndarray) -> np.ndarray:
    return rgb.sum(axis=-1) < NEAR_BLACK_SUM_MAX


def detect_defect_mask(rgba: np.ndarray) -> np.ndarray:
    """Detecta candidatos a "falso opaco" (checker u negro horneado)."""
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    candidate = (_is_checker_like(rgb) | _is_near_black(rgb)) & (alpha > 0)
    return candidate


def border_connected_mask(candidate: np.ndarray) -> np.ndarray:
    """Componentes que TOCAN el borde del canvas. Suele ser fondo real que
    se escapó por fuera de la silueta en salida cruda de Gemini, PERO no es
    garantía — revisar siempre con --report antes de aplicar (ver punto 4
    del docstring del módulo)."""
    labels, n = ndimage.label(candidate)
    if n == 0:
        return np.zeros_like(candidate)
    border_labels = set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    border_labels.discard(0)
    if not border_labels:
        return np.zeros_like(candidate)
    return np.isin(labels, list(border_labels))


def interior_hole_mask(candidate: np.ndarray, max_size: int) -> tuple[np.ndarray, list[dict]]:
    """Componentes que NO tocan el borde (huecos atrapados entre formas
    superpuestas) pero son pequeños — se listan para revisión, y solo se
    incluyen en la máscara si están por debajo de max_size. Con max_size
    bajo (varios miles de px) es seguro; con un umbral alto puede comerse
    detalle real, así que el default es conservador a propósito."""
    labels, n = ndimage.label(candidate)
    mask = np.zeros_like(candidate)
    report = []
    if n == 0:
        return mask, report
    border_labels = set(labels[0, :]) | set(labels[-1, :]) | set(labels[:, 0]) | set(labels[:, -1])
    for label_id in range(1, n + 1):
        if label_id in border_labels:
            continue
        ys, xs = np.where(labels == label_id)
        size = len(ys)
        if size == 0:
            continue
        info = {
            "label": label_id,
            "size": size,
            "bbox": (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())),
        }
        report.append(info)
        if size <= max_size:
            mask |= labels == label_id
    return mask, report


def feather_alpha(alpha: np.ndarray, radius: float) -> np.ndarray:
    from scipy.ndimage import gaussian_filter

    return gaussian_filter(alpha.astype(float), sigma=radius).clip(0, 255).astype(np.uint8)


def fix_transparency(
    src_path: str,
    dst_path: str | None,
    interior_max_size: int = DEFAULT_INTERIOR_HOLE_MAX_SIZE,
    feather: bool = True,
    report_only: bool = False,
) -> dict:
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)
    alpha_before = arr[:, :, 3].copy()
    opaque_before = int((alpha_before == 255).sum())

    candidate = detect_defect_mask(arr)
    border_mask = border_connected_mask(candidate)
    interior_mask, interior_report = interior_hole_mask(candidate, interior_max_size)

    total_mask = border_mask | interior_mask
    removed = int(total_mask.sum())

    summary = {
        "opaque_before": opaque_before,
        "border_removed": int(border_mask.sum()),
        "interior_removed": int(interior_mask.sum()),
        "interior_components_found": interior_report,
        "total_removed": removed,
    }

    if report_only:
        return summary

    arr[:, :, 3][total_mask] = 0
    if feather:
        arr[:, :, 3] = feather_alpha(arr[:, :, 3], FEATHER_RADIUS)

    opaque_after = int((arr[:, :, 3] == 255).sum())
    summary["opaque_after"] = opaque_after

    # Salvaguarda: si el borrado se comió una fracción enorme de la imagen,
    # algo fue mal (mismo patrón que el bug de labels==0 de esta sesión) —
    # no escribir un resultado que probablemente esté corrupto.
    if opaque_before > 0 and opaque_after < opaque_before * 0.5:
        raise RuntimeError(
            f"Aborta: se habría borrado más de la mitad del contenido opaco "
            f"({opaque_before} -> {opaque_after}). Revisa manualmente antes "
            f"de forzar."
        )

    if dst_path:
        Image.fromarray(arr, "RGBA").save(dst_path)
        magenta_path = str(Path(dst_path).with_suffix("")) + "_check_magenta.png"
        bg = Image.new("RGBA", img.size, (230, 60, 200, 255))
        bg.alpha_composite(Image.fromarray(arr, "RGBA"))
        bg.save(magenta_path)
        summary["magenta_check"] = magenta_path

    return summary


if __name__ == "__main__":
    args = sys.argv[1:]
    report_only = "--report" in args
    args = [a for a in args if a != "--report"]
    if len(args) < 1:
        print(__doc__)
        sys.exit(1)
    src = args[0]
    dst = args[1] if len(args) > 1 and not report_only else None
    result = fix_transparency(src, dst, report_only=report_only)
    for k, v in result.items():
        print(f"{k}: {v}")
