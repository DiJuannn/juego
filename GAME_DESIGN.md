# LUMI — GAME DESIGN (fuente de verdad)

Este documento describe el diseño del juego tal como existe hoy en el código y los
assets del repositorio. Es la referencia oficial de diseño — ver también
`AGENTS.md`/`CLAUDE.md` para las reglas de producción de arte (no se repiten aquí).

## ART STYLE

- Ilustración 2D acuarela/pastel, dibujada a mano, adorable.
- Colores suaves y desaturados; contornos finos en tonos azul/lavanda, **nunca negros**.
- Formas redondeadas y simples, sin sombreado duro, sin pixel art, sin 3D, sin realismo.
- Todo el arte se genera con Gemini Images (`scripts/gen_asset.py`) condicionado con
  imágenes de referencia de estilo ya existentes — nunca solo texto, nunca arte
  procedural/SVG genérico dibujado por código (ver skill `lumi-asset-gen`).
- Todo asset nuevo debe pasar por `scripts/fix_transparency.py` + revisión visual
  (composite sobre magenta/negro) antes de integrarse.

## MAIN CHARACTER — Lumi

Ajolote rosa pálido, cabeza redondeada, branquias externas con "venas", cola con
borde más oscuro, contorno lavanda. Diseño inamovible (ver `CLAUDE.md`).

**Frames reales en disco** (`assets/characters/lumi/`, ver `LumiAnimConfig.ts`):

| Pose | Carpeta | Frames | Notas |
|---|---|---|---|
| Idle / flotando | `idle/` | 3 | |
| Dormir | `sleep/` | 3 | Existe el asset; **no está conectado a ningún trigger de inactividad en código** (ver PROGRESS.md). |
| Nadar de lado (derecha) | `swim_right/` | 4 | `swim_left` se deriva por flip horizontal en código, no tiene carpeta propia. |
| Nadar arriba | `swim_up/` | 4 | `swim_down` se deriva por flip vertical/pose en código, no tiene carpeta propia. |
| Nadar en diagonal | `swim_diagonal/` | 4 | Pose propia (no un flip reciclado de swim_up); las otras 3 diagonales se derivan por flip de esta. |
| Muerte | `death/` | 1 | Frame fijo (ojos en X), no es un loop. |
| Impulso (`boost/`) | — | — | Asset existe en disco pero **no se usa**: el impulso del nenúfar reutiliza la animación `swim_up` (decisión ya tomada, ver comentario en `LumiAnimConfig.ts`). |

Todas las animaciones se reproducen vía `AnimationRegistry.ts` + `Lumi.ts`, a 8 FPS.

## GAMEPLAY

- Escalada vertical infinita (estilo Doodle Jump): la cámara sube sola sin parar
  (nunca retrocede) y además sigue a Lumi si ella sube más rápido.
- La velocidad de subida de la cámara **ya es progresiva**: empieza en
  `CAMERA_RISE_SPEED_START` y sube en rampa hasta `CAMERA_RISE_SPEED_MAX` conforme
  aumenta la altura (`CAMERA_RISE_RAMP_ALTITUDE`), sin saltos bruscos.
- Quedarse atrás (caer por debajo del borde inferior de la cámara, margen
  `GAME_OVER_MARGIN`) es game over instantáneo — no pasa por el sistema de vidas.
- Control: joystick virtual táctil (aparece donde el jugador apoya el dedo y sigue
  el arrastre) + teclado (flechas/WASD) en paralelo para pruebas de escritorio.
  **El juego está pensado para jugarse en móvil, en vertical** — el canvas usa
  `Phaser.Scale.RESIZE` y arranca en proporción de teléfono (9:16).

## LEVEL DESIGN — ZONA 1 ("Estanque")

Único tramo con arte y diseño propios ahora mismo (ver `ZoneConfig.ts` — las zonas
2-8 son solo datos de progresión con tinte, reutilizando el arte de la Zona 1; no
tienen arte propio todavía, ver PROGRESS.md).

**Progresión por tramos** (`src/config/Zone1Segments.ts`): la Zona 1 tiene 5 bandas
de "descanso" repartidas por la altura en las que TODOS los peligros pausan por
igual (no una lista blanca por tipo de peligro — se probó y recortaba demasiado la
frecuencia de cada uno). Cada peligro se introduce por primera vez en su propio
`*_START_OFFSET` (ver GameConfig.ts):

| Peligro | Aparece desde (altura ≈) |
|---|---|
| Nenúfar / monedas | Desde el inicio |
| Escudo (power-up) | ~40 |
| Medusa | ~60 |
| Erizo | ~150 |
| Coral estrecho | ~220 |
| Impulso vertical (power-up) | ~110 |
| Tiburón | ~300 |
| Pez grande (empuje) | ~400 |
| Calamar | ~500 |
| Corriente de agua | ~650 (cierre de Zona 1) |

## COLLECTIBLES — Monedas

`CoinPickup` / `CoinSpawner`: se colocan en **grupos de 3-5 en arco** (no sueltas al
azar) para sugerir rutas — la mayoría cerca del centro (ruta cómoda), un grupo
ocasional desplazado a un lado como recompensa de riesgo. Contador en el HUD.

## NENÚFAR (LilyPad)

Ya existe y funciona: cuerpo estático flotante, da un impulso hacia arriba al
tocarlo (`Lumi.triggerBoost`, reutiliza la animación `swim_up`). No modificado en
esta pasada de documentación.

## POWER-UPS (ya implementados)

Estas dos funcionalidades **ya están implementadas y funcionando**, no son trabajo
futuro:

- **Escudo de burbuja** (`ShieldPickup`/`ShieldPickupSpawner`): absorbe UN golpe de
  cualquier peligro letal. Animación de activación (se "infla" con pop) y de
  ruptura (expansión + fundido) al absorber un golpe.
- **Impulso vertical** (`BoostPickup`/`BoostPickupSpawner`): power-up independiente
  del nenúfar — empujón más fuerte y largo (`triggerSuperBoost`), recompensa
  puntual y escasa, no una ayuda de terreno siempre disponible.

## BOUNCE OBSTACLE — Pez grande (BigFish)

No quita vidas: solo empuja a Lumi lejos y bota él mismo (squash/stretch +
frenazo) al chocar. Reutiliza el arte de pez decorativo a mayor escala.

## OBSTÁCULO — Coral estrecho

`CoralWall`/`CoralSpawner`: pared hecha de varios trozos de coral que bloquea todo
el ancho del mundo salvo un carril libre de ancho fijo en un lado (izquierda o
derecha al azar). Tocar cualquier trozo cuesta una vida. El carril libre está
garantizado sin animales estáticos (medusa/erizo) encima — esos spawners consultan
`CoralSpawner.isWithinAnyCoralBand` antes de colocar uno nuevo.

## LIVES

`LivesSystem`: 3 corazones en el HUD. Cada golpe peligroso (medusa/tiburón/
calamar/erizo/coral) resta 1 vida, con una ventana breve de invulnerabilidad
(parpadeo + empujón hacia atrás) tras cada golpe no letal. A la última vida sigue
la secuencia de muerte definitiva. El pez grande y la corriente NO quitan vidas.

## ENEMIES

Todos con cuerpos físicos ajustados a su silueta real (no al rectángulo del
lienzo) y parpadeo con arte real generado por Gemini (`BlinkTimer` + texturas
`*_blink.png`, nunca dibujado por código).

- **Jellyfish**: estática (cuerpo físico fijo en el punto de spawn); 4 patrones de
  deriva visual distintos elegidos al azar por instancia (calma, amplia, pulso
  vertical, órbita lenta) — el movimiento es solo visual, no afecta la hitbox.
- **Shark**: cuerpo dinámico, patrulla de lado a lado en un radio local. Los que
  aparecen ya cerca del final de la Zona 1 pueden lanzar **una vez**, si Lumi pasa
  cerca, una persecución corta a mayor velocidad antes de volver a patrullar —
  nunca de forma permanente.
- **Squid**: cuerpo dinámico, 3 patrones de patrulla (impulsos regulares tipo
  "jet", zigzag impredecible, acecho quieto con un único impulso fuerte).
- **Urchin**: casi inmóvil, obstáculo "plantado" a esquivar (no persigue).

## ENVIRONMENT

- Fondo con parallax en capas (`ParallaxLayer`): `background_far` (lejano, tiling
  vertical), `rocks_back`, `distant_plants`/`foreground_plants` (con balanceo por
  crossfade entre frames).
- Fauna de fondo ambiental (`BackgroundFishField`): peces decorativos agrupados en
  **cardúmenes pequeños (2-4)** que comparten dirección/velocidad, no cada uno
  derivando por separado.
- **Problema conocido**: la decoración del fondo no se distribuye de forma pareja
  en todo el alto del tile — hay una franja decorada seguida de un tramo largo
  vacío, así que no se lee como "infinito con decoración continua" (ver
  PROGRESS.md, tarea pendiente).

## CÁMARA / DIFICULTAD

Ver GAMEPLAY arriba (rampa de velocidad) y LEVEL DESIGN (bandas de descanso). La
dificultad sube por variedad de patrones y combinación de peligros, no solo por
cantidad.

---

# REGLAS PARA CLAUDE CODE

- `GAME_DESIGN.md` es la fuente de verdad del diseño.
- `PROGRESS.md` es la fuente de verdad del estado de implementación.
- Antes de realizar cambios importantes, consultar estos dos archivos.
- No analizar todo el proyecto innecesariamente. Para cada tarea, inspeccionar
  únicamente los archivos relevantes.
- No modificar funcionalidades que no estén relacionadas con la tarea.
- No rehacer sistemas que ya funcionan.
- No cambiar el estilo artístico existente sin una petición explícita.
- No sustituir assets existentes si no es necesario.
- No crear una arquitectura nueva si la actual funciona.
- Priorizar cambios pequeños, aislados y comprobables.
- Después de implementar una tarea, actualizar `PROGRESS.md`.
- No marcar como completada una tarea que no haya sido comprobada (typecheck +
  prueba real, no solo lectura del código).
- Si una tarea requiere modificar varias partes del proyecto, explicar brevemente
  qué archivos son necesarios antes de modificarlos.
- Evitar repetir información que ya esté documentada en `GAME_DESIGN.md`.
- Si el usuario dice "continúa con el proyecto", leer primero `GAME_DESIGN.md` y
  `PROGRESS.md`, y continuar desde la sección PRÓXIMA TAREA de `PROGRESS.md`.
