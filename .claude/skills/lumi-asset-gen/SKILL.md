---
name: lumi-asset-gen
description: Genera o corrige assets visuales del juego Lumi (criaturas, plantas, rocas, props, fondos de zona) usando Gemini Images manteniendo consistencia de estilo con el arte ya existente. Usa esta skill SIEMPRE que haya que crear un asset nuevo para una zona (2-8), reemplazar un frame de una animación existente, o arreglar un defecto visual (transparencia, boca/ojo mal dibujado, etc.) en cualquier imagen de assets/ — incluso si el usuario no menciona "Gemini" o "generar", con que pida "una criatura nueva", "arregla esta imagen", "haz que se vea mejor este alga/roca/pez", o cualquier cosa que implique tocar arte del juego. NO se aplica a cambios de código/gameplay (física, cámara, spawners) ni a redecidir el diseño canónico de Lumi (eso está prohibido, ver STYLE_BIBLE.md y CLAUDE.md).
---

# Generación y corrección de assets de Lumi

Este proyecto tiene un flujo YA PROBADO para generar arte nuevo o corregir arte
existente sin perder consistencia de estilo. Se construyó a fuerza de errores
reales en producción (frames descoordinados, transparencia mal limpiada,
personajes que cambiaban de pose sin querer) — seguirlo evita repetir esos
mismos errores.

Antes de nada: **Claude no diseña a Lumi**. Su cuerpo, cara, proporciones y
contorno son intocables (ver `CLAUDE.md` / `STYLE_BIBLE.md`). Todo lo demás
(criaturas nuevas, plantas, rocas, props) tiene libertad creativa siempre que
pertenezca al mismo universo visual: contorno lavanda/malva (nunca negro),
acuarela pastel, sin pixel art, sin 3D, sin fotorrealismo.

## 0. Anclas de estilo

Nunca generar solo con un prompt de texto. Mira `docs/style_anchors.md` y
elige 2-4 imágenes ya existentes en `assets/` que más se parezcan a lo que
vas a crear (una roca, una hoja, un pez, la medusa, Lumi idle, un fondo...).
Estas referencias se pasan a Gemini junto con el prompt — es lo que evita que
cada generación "reinvente" el estilo desde cero.

## 1. Generar

Usa `scripts/gen_asset.py` (ya tiene el prefijo de estilo y el manejo de
`GEMINI_API_KEY` resuelto):

```bash
python3 scripts/gen_asset.py \
  --prompt "descripción del CAMBIO MÍNIMO deseado, no una redescripción completa" \
  --ref assets/ruta/ancla1.png \
  --ref assets/ruta/ancla2.png \
  --out /tmp/gen_test/nombre_raw.png
```

**Si es un arreglo (no un asset nuevo):** el prompt debe pedir explícitamente
"no cambies el ángulo/pose/colores, esto es SOLO un arreglo puntual de la
zona X" — Gemini tiende a regenerar de más si no se le frena. Dale un
presupuesto de 2-3 intentos: si a la tercera sigue derivando (cambia de pose,
pierde detalles, mezcla el ángulo), para y reporta el problema al usuario en
vez de seguir gastando generaciones. Si el intento sobre la imagen completa
falla por deriva de pose, se puede probar recortando solo la región afectada
(por ejemplo solo la cabeza) como referencia — pero el recorte tiene sus
propios riesgos (puede espejar la imagen o igual derivar), así que no es una
solución garantizada, solo otra vía a intentar dentro del mismo presupuesto.

## 2. Limpiar transparencia

Gemini devuelve con frecuencia un "fondo transparente" que en realidad es
checkerboard u negro horneado con alpha=255. Usa `scripts/fix_transparency.py`,
**siempre primero en modo `--report`**:

```bash
python3 scripts/fix_transparency.py /tmp/gen_test/nombre_raw.png --report
```

Revisa `interior_components_found` antes de aplicar nada — un componente
grande e inesperado ahí puede ser un hueco real, no ruido. Solo después de
revisar el report, aplica de verdad:

```bash
python3 scripts/fix_transparency.py /tmp/gen_test/nombre_raw.png /tmp/gen_test/nombre_clean.png
```

El script mismo aborta si el borrado elimina más de la mitad del contenido
opaco esperado — es una señal de que algo va mal, no lo fuerces sin revisar
manualmente primero (composite sobre magenta) por qué pasó. La única
situación donde eso es normal y esperado es cuando la salida cruda de Gemini
viene 100% opaca con el checkerboard horneado cubriendo todo el canvas
(común): ahí el borrado grande es correcto.

**Importante:** "toca el borde del canvas" no es sinónimo automático de "es
basura de fondo". En un asset ya compuesto (por ejemplo una hoja recortada a
propósito en el borde de una capa de foreground) el borde puede tener
transparencia real y deliberada. Esto ya causó una corrección accidental de
un asset bueno en esta sesión — revisa siempre el composite en magenta antes
de aceptar.

## 3. Si el asset reemplaza un frame de una animación existente

Esto es lo más delicado y donde más se falló esta sesión. Si el nuevo asset
va a **reemplazar un frame dentro de un ciclo de animación** (por ejemplo una
de las poses de sway de un alga, o una pose de un personaje con varios
frames), NO basta con alinear el nuevo frame contra su propio original por
caja delimitadora (bounding box) completa — el bounding box lo domina la
parte más grande del dibujo (el cuerpo, la cola, una hoja larga), así que un
frame puede "encajar" bien comparado aisladamente contra su original y aun
así tener la CABEZA o el elemento focal desplazado varios píxeles respecto a
los demás frames del mismo ciclo.

El síntoma es un "fantasma" — dos cabezas o dos caras superpuestas — visible
solo cuando se mezclan los frames (crossfade o animación), no al mirar cada
imagen por separado.

**Cómo evitarlo:** registra el frame nuevo usando un punto de referencia
estable y específico del elemento focal (por ejemplo la posición del ojo/
pupila — se puede detectar como el blob oscuro más grande en la región
superior de la imagen), no el bounding box completo. Y **antes de dar el
asset por bueno**, haz un blend sintético 50/50 con Python/PIL entre el
frame nuevo y el/los frames vecinos con los que se va a mezclar en el juego
(alpha a la mitad en ambos, compuestos sobre el mismo fondo) — si al 50%
aparecen dos caras o dos elementos focales claramente separados, el registro
está mal, no la generación en sí. Ajusta la traslación hasta que el 50%
muestre una sola silueta coherente en la zona focal (algo de doble contorno
en partes secundarias como una cola con sway intencional es normal y
esperado, no hay que perseguir un match pixel-perfecto en todo el dibujo).

## 4. Verificación final antes de integrar

Nunca integrar "a ciegas". Antes de reemplazar el archivo real en `assets/`:

1. Composite sobre fondo magenta (`(230,60,200,255)`) — confirma que no
   queda ningún resto de checkerboard ni halo raro en los bordes.
2. Si reemplaza un frame de animación, el blend 50/50 del paso 3.
3. Una captura real in-game (arrancar `npm run dev`, Playwright o similar) —
   un defecto de legibilidad a tamaño de juego (ej. una boca que se lee
   "doble" por estar muy pegada a otro trazo oscuro) a veces solo se nota
   ahí, no en el archivo aislado a tamaño completo.

Muestra estas verificaciones al usuario (o al menos repórtalas con claridad)
antes de dar el trabajo por terminado — es el mismo criterio que ya rige
todo el proyecto: el arte se aprueba visualmente, nunca se asume.

## Referencias

- `STYLE_BIBLE.md` — reglas de estilo del entorno (contorno, paleta, textura).
- `docs/style_anchors.md` — qué imágenes usar como referencia por categoría.
- `scripts/gen_asset.py` — generación vía Gemini con referencias.
- `scripts/fix_transparency.py` — limpieza de transparencia con las
  salvaguardas de esta sección.
- `CLAUDE.md` — reglas del proyecto que nunca se rompen (Lumi es intocable,
  nada de arte procedural/SVG como placeholder, assets faltantes se
  reportan, no se inventan).
