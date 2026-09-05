# LUMI — PROGRESS (estado real del proyecto)

Ver `GAME_DESIGN.md` para el diseño completo. Este archivo registra qué existe y
funciona **hoy**, verificado en el código — no lo que el diseño aspira a tener.

# COMPLETADO

- Movimiento de Lumi: teclado (flechas/WASD) + joystick virtual táctil
  (`InputController`), pensado para móvil.
- Animaciones: idle (3f), swim_right (4f, swim_left por flip), swim_up (4f,
  swim_down derivado), swim_diagonal (4f, las otras 3 diagonales por flip),
  muerte (1f fijo). Todas a 8 FPS vía `AnimationRegistry`.
- Cámara vertical infinita con rampa de velocidad progresiva (nunca retrocede,
  sigue a Lumi si sube más rápido que el techo automático).
- Fondo con parallax en capas (`ParallaxLayer`) + rocas/plantas con balanceo por
  crossfade + fauna de fondo agrupada en cardúmenes pequeños.
- Nenúfar (`LilyPad`): impulso al tocarlo, funciona.
- Sistema de monedas (`CoinPickup`/`CoinSpawner`): grupos en arco, guía de ruta,
  contador en HUD.
- Power-up de escudo (`ShieldPickup`): absorbe un golpe, con animación de
  activación (pop) y ruptura (expansión + fundido).
- Power-up de impulso vertical (`BoostPickup`): más fuerte/largo que el nenúfar,
  power-up independiente y escaso.
- Pez grande (`BigFish`): obstáculo tipo rebote, no quita vidas, bota al chocar.
- Coral estrecho (`CoralWall`/`CoralSpawner`): bloquea todo el ancho salvo un
  carril libre; garantizado sin animales estáticos encima del carril.
- Sistema de 3 vidas (`LivesSystem`) con invulnerabilidad temporal, knockback y
  parpadeo tras cada golpe no letal; corazones en HUD.
- Medusa: 4 patrones de deriva visual distintos por instancia.
- Tiburón: patrulla local + persecución puntual (una vez, solo cerca del final
  de la Zona 1), nunca permanente.
- Calamar: 3 patrones de patrulla (impulsos regulares, zigzag, acecho quieto).
- Erizo: obstáculo casi estático.
- Parpadeo de todas las criaturas con arte real generado por Gemini
  (`BlinkTimer` + texturas `*_blink.png`) — no es un Graphics dibujado por código.
- Progresión de la Zona 1 por tramos (`Zone1Segments.ts`): 5 bandas de descanso
  garantizado repartidas por la altura, verificadas numéricamente para no
  reducir demasiado la frecuencia de ningún peligro.
- Corriente de agua (`CurrentZone`) al final de la Zona 1.
- Sistema de zonas (`ZoneManager`/`ZoneConfig`): tinte de profundidad progresivo
  por altura — funciona como sistema, pero solo la Zona 1 tiene arte propio.
- Ciclo de animación swim_up regenerado por completo: `swim_up_02.png` (la
  referencia limpia del usuario) como ancla + 3 frames nuevos generados con
  Gemini a partir de ella (cola extendida / en S con brazos abiertos / enroscada
  arriba). Verificado sin residuo de sombra contra fondo negro y sin doble
  cabeza/fantasma (blend 50/50 contra el ancla) antes de integrar.
- **Bug crítico arreglado**: las hitboxes de Jellyfish/Urchin/Shark/Squid/
  BigFish (y el `ReefCluster` nuevo) medían 2 a 3.5 veces más que el dibujo
  visible en cada dimensión — Phaser no escala `body.setSize()/setOffset()`
  con el `setScale()` del sprite, y el código pasaba píxeles nativos sin
  corregir por la escala real. Lumi moría por golpes que visualmente
  esquivaba sin problema ("no se puede jugar, es imposible pasar",
  reportado por el usuario). Arreglado multiplicando por `scale` en las 6
  llamadas. Verificado con un probe numérico (hitbox ≈ 45-65% del sprite en
  los 5 casos, antes 200-350%) y un playtest automatizado (zigzag simple
  sin esquiva real, sobrevive sin un golpe hasta altura 516).

# EN PROGRESO

- Zonas 2-8: existen como **datos** de progresión (altitud de inicio, tinte de
  color) en `ZoneConfig.ts`, pero reutilizan el arte/fauna de la Zona 1 — no
  tienen arte, obstáculos ni identidad visual propios todavía.
- Rediseño de los obstáculos ambientales de la Zona 1 (`ReefCluster`/
  `ReefClusterSpawner`, sustituye a `CoralWall`/`CoralSpawner`, que se
  quedan intactos sin usarse por si hay que revertir): **prototipo con 4
  composiciones** (diagonal desde un lado, masa central con dos caminos,
  curva en S entrando por los bordes, y pared lateral que crece desde un
  borde del mundo), con 4 capas de profundidad (fondo/decoración/
  obstáculo/primer plano). **Tercera tanda de piezas** tras dos rechazos
  del usuario:
  1. `coral_fan`/`rock_cluster`/`seaweed_frond` — "horribles, no funcionan
     como obstáculos de mapa".
  2. `coral_mass`/`rock_formation`/`coral_mound`/`kelp_frond` (tonos
     salmón/coral, generados encadenando referencias para que
     correlacionaran entre sí) — rechazados también: "elimina todos esos
     objetos de piedra, corales, etc." El usuario pidió en su lugar rocas
     oscuras que combinen con el fondo azul/pizarra YA existente
     (`background_far.png`), con coral solo como acento menor — "no solo
     corales".
  3. **Actual**: `dark_rock_branch` (repisa alargada en diagonal),
     `dark_rock_plain` (cúmulo de rocas sin coral), `dark_rock_tall`
     (peñasco vertical) — roca oscura tono pizarra/azul como protagonista
     en las tres, igual que los arcos de piedra del fondo, con pequeños
     acentos de coral/anémona de color como mucho. Moneda también
     rediseñada (perla dorada nacarada) y reducida de escala 0.11 a 0.08.
  Verificado con Playwright: las 4 plantillas ciclan sin repetirse, se
  integran visualmente con el fondo existente (en vez de destacar encima
  de él), la pared lateral se lee claramente "saliendo del borde" en
  ambos lados, playtest automatizado sigue pasando sin problema.
  **Pendiente de aprobación visual del usuario antes de generalizarlo al
  resto de la Zona 1** — es el pedido explícito, no está aprobado todavía.
- Se abandonó la idea de un fondo de escena pintado como imagen única
  (se había generado un primer ejemplo con Gemini, nunca integrado) — el
  usuario confirmó explícitamente que quiere mantener el fondo actual
  (`background_far.png`/`rocks_back.png`, sin cambios) y que los
  obstáculos de `ReefCluster` sean lo único que "sale" de vez en cuando.
  `scripts/gen_asset.py` conserva los flags `--background`/`--aspect-ratio`
  añadidos para ese intento (útiles para cualquier fondo futuro), pero no
  hay ningún plan activo de generar más secciones pintadas.

# PENDIENTE

- Aprobación del usuario del prototipo de `ReefCluster` (ver EN PROGRESO).
- Arte y diseño propios para la Zona 2 ("Arrecife") en adelante.
- Conectar la animación de "dormir" (`sleep/`, el asset ya existe) a un trigger
  real de inactividad del jugador — hoy no se usa en ningún sitio del código.
- Corregir la continuidad del fondo: la decoración (rocas/coral) se concentra en
  una franja y deja un tramo largo vacío antes de repetirse, así que no se lee
  como "infinito con decoración continua" (pedido explícito del usuario,
  encolado, no iniciado).
- Revisar el resto del checklist de animación por criatura de la revisión de
  Zona 1 (más allá del parpadeo, que ya está) si se retoma esa pasada.

# BUGS / PROBLEMAS

- Fondo sin distribución continua de decoración (ver PENDIENTE arriba).

# PRÓXIMA TAREA

Esperar la aprobación visual del usuario sobre la tercera tanda de piezas
de `ReefCluster` (rocas oscuras tono pizarra, ver EN PROGRESO) antes de
generalizar el sistema al resto de la Zona 1 — no hacerlo sin ese visto
bueno explícito. El fondo (`background_far.png`/`rocks_back.png`) se
queda tal cual, sin cambios — confirmado por el usuario, no tocar.

Si se aprueba: sustituir del todo `CoralWall`/`CoralSpawner` por
`ReefClusterSpawner` en el resto de la progresión de Zona 1. Si se pide
ajustar algo más (más piezas oscuras variadas, otra composición), iterar
sobre las 4 plantillas antes de generalizar.

Después de eso: corregir la continuidad del fondo actual (franja decorada
seguida de un tramo largo vacío antes de repetirse) — ver detalle en
GAME_DESIGN.md (sección ENVIRONMENT).
