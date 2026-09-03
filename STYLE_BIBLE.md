# STYLE BIBLE — Mundo visual de Lumi

Este documento complementa a `CLAUDE.md`/`STYLE_GUIDE.md` (que rige el diseño de
Lumi, intocable) y define el lenguaje visual del **entorno**: fondos, plantas,
rocas, criaturas y props de las 8 zonas. Se ha extraído observando directamente
el arte ya existente en `assets/` — no es una preferencia estética nueva, es
una descripción de lo que ya está dibujado, para que cualquier generación
nueva (Gemini u otra) parezca hecha por el mismo artista.

Ver `docs/style_anchors.md` para el set de imágenes canónicas de referencia
que se deben adjuntar a Gemini en cada generación.

## Contorno

- Color lavanda/malva, nunca negro ni gris. Tono de referencia: el contorno de
  las rocas (`assets/backgrounds/pond/rocks_back.png`) y de Lumi.
- Grosor uniforme, moderado (ni fino tipo pluma, ni grueso tipo cómic).
- Esquinas siempre redondeadas. Ninguna línea recta perfecta ni ángulo agudo.
- Ligera imperfección de trazo (hecho a mano), nunca vectorial perfecto.

## Relleno

- Color plano pastel como base, nunca degradado digital limpio de un extremo
  a otro.
- 1–2 manchas de luz y 1–2 de sombra suaves, de forma irregular/orgánica
  (acuarela), aplicadas como "parches", no como sombreado direccional duro.
- Nada de cel-shading marcado ni bordes de sombra nítidos.

## Textura

- Grano/imperfección de pincel sutil a baja opacidad, sobre todo visible en
  fondos y rocas.
- Pequeñas imperfecciones artesanales son deseables (no buscar limpieza
  vectorial perfecta).

## Siluetas y escala

- Toda criatura/planta/prop debe leerse bien en miniatura (igual que los
  peces, la medusa y el nenúfar actuales funcionan a tamaño pequeño en
  pantalla).
- Composición centrada en el canvas con margen alrededor, pensada para poder
  escalarse sin recortar detalle importante.

## Paleta base (anclas ya en uso)

- Lumi: rosa pálido, ojos morado oscuro, branquias rosa coral con venas,
  contorno lavanda.
- Rocas: lavanda-gris con parches rosa coral en la base.
- Algas: verde salvia / verde azulado, contorno lavanda.
- Peces: azul pastel con contorno azul, lunares, vientre crema.
- Medusa: campana lavanda pastel, tentáculos translúcidos rosa/azul.
- Nenúfar: verde pastel, contorno lavanda.

## Evolución de paleta por profundidad

La paleta puede volverse más fría y oscura (azul, azul verdoso, lavanda
profundo) a medida que se desciende... en este juego, a medida que se
**asciende en altura de escalada** desde el fondo del estanque. Cerca de la
superficie (zona 8) los colores vuelven a ser claros y cálidos. El cambio de
paleta se implementa como tinte de escena (ver `ZoneManager`), no repintando
cada asset por zona.

## Prohibido (recordatorio, ya en CLAUDE.md)

Pixel art, 3D, fotorrealismo, anime, cel-shading fuerte, contornos negros,
colores muy saturados, fondos fotográficos, geometría perfecta, exceso de
detalle realista, estética genérica de videojuego móvil.

## Formato técnico obligatorio

- PNG-32, alpha recto, fondo realmente transparente.
- Todo asset generado con Gemini pasa por `scripts/fix_transparency.py` antes
  de integrarse — Gemini devuelve con frecuencia checkerboard u negro sólido
  "horneado" en vez de alpha=0 real, incluso en huecos interiores entre
  formas superpuestas.
