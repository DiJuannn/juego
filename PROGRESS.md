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
  borde del mundo — la más nueva, pedido explícito del usuario: "objetos
  que salen por la izquierda o laterales... haciendo que el ajolote tenga
  que cambiar de ruta"), con 4 capas de profundidad (fondo/decoración/
  obstáculo/primer plano). Primera tanda de piezas (`coral_fan`/
  `rock_cluster`/`seaweed_frond`) rechazada por el usuario ("horribles, no
  funcionan como obstáculos de mapa") — sustituida por un conjunto nuevo
  generado ENCADENANDO referencias (cada pieza usa la anterior como ancla)
  para que se lean como un conjunto correlacionado y con más presencia
  visual: `coral_mass` (masa densa, pieza principal), `rock_formation`,
  `coral_mound`, `kelp_frond`. Moneda también rediseñada (perla dorada
  nacarada) y reducida de escala 0.11 a 0.08 — a la escala vieja medían
  más que la separación entre monedas del grupo y se solapaban. Verificado
  con Playwright: las 4 plantillas ciclan sin repetirse, piezas
  sustanciales y correlacionadas, monedas sin solape, la pared lateral se
  lee claramente "saliendo del borde" en ambos lados (izquierda/derecha).
  **Pendiente de aprobación visual del usuario antes de generalizarlo al
  resto de la Zona 1** — es el pedido explícito, no está aprobado todavía.
  Dirección de arquitectura ya confirmada por el usuario: el fondo pintado
  (ver siguiente punto) es decoración pura, `ReefCluster` sigue siendo el
  sistema real de colisión.
- Primer fondo de escena pintado con Gemini (formato vertical 9:16, sin
  transparencia — ver `scripts/gen_asset.py --background --aspect-ratio`,
  ambos flags nuevos) generado a partir de un prompt del usuario. Resultado
  aprobado visualmente pero **todavía no integrado en el juego** (solo en
  `/tmp`, no en `assets/`) — falta generar más secciones variadas para el
  scroll infinito y decidir cómo se ancla/recicla verticalmente.

# PENDIENTE

- Aprobación del usuario del prototipo de `ReefCluster` (ver EN PROGRESO).
- Generar más secciones del fondo pintado + integrarlo en el juego
  (reemplaza o complementa a `background_far.png`/`rocks_back.png`).
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

Dirección de arquitectura ya confirmada por el usuario (fondo pintado =
decoración pura, `ReefCluster` = colisión real, con piezas entrando desde
los laterales) — falta:

1. Generar más secciones del fondo pintado (formato vertical, mismo estilo
   que la primera aprobada) e integrarlas en el juego (`assets/`, wiring en
   `ParallaxLayer`/`BootScene`), decidiendo cómo se reciclan verticalmente
   para el scroll infinito.
2. Retomar el prototipo de `ReefCluster` (4 plantillas, ver EN PROGRESO):
   sigue pendiente de aprobación visual antes de generalizarlo al resto de
   la Zona 1 — no generalizar sin ese visto bueno explícito.

Después de eso: corregir la continuidad del fondo actual (franja decorada
seguida de un tramo largo vacío) — puede que quede resuelto de paso al
generar las nuevas secciones del punto 1. Ver detalle en GAME_DESIGN.md
(sección ENVIRONMENT).
