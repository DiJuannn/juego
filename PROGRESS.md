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

# EN PROGRESO

- Zonas 2-8: existen como **datos** de progresión (altitud de inicio, tinte de
  color) en `ZoneConfig.ts`, pero reutilizan el arte/fauna de la Zona 1 — no
  tienen arte, obstáculos ni identidad visual propios todavía.

# PENDIENTE

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

- **swim_up_01.png, swim_up_03.png y swim_up_04.png**: probablemente conservan un
  residuo de la mancha/sombra oscura cerca de la cabeza que el usuario reportó.
  `swim_up_02.png` ya se reemplazó por una referencia limpia que el usuario
  proporcionó directamente, pero los otros 3 frames solo pasaron por una
  limpieza heurística por píxeles que **no llegó a verificarse como
  satisfactoria** (el propio usuario indicó que el defecto seguía sin verse
  bien tras dos intentos). Necesitan revisión con el mismo estándar que 02
  (comparar contra fondo negro, no solo blanco/azul) antes de darlos por buenos.
- Fondo sin distribución continua de decoración (ver PENDIENTE arriba).

# PRÓXIMA TAREA

Revisar `swim_up_01.png`, `swim_up_03.png` y `swim_up_04.png` contra un
composite de fondo **negro** (no blanco/azul, que puede ocultar el defecto) para
confirmar si conservan el mismo residuo de sombra que tenía `swim_up_02.png`
antes de reemplazarlo; si lo tienen, pedir al usuario referencias limpias
equivalentes (el método que sí funcionó) en vez de reintentar la limpieza
heurística por píxeles, que ya falló dos veces.
