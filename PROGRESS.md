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

# EN PROGRESO

- Zonas 2-8: existen como **datos** de progresión (altitud de inicio, tinte de
  color) en `ZoneConfig.ts`, pero reutilizan el arte/fauna de la Zona 1 — no
  tienen arte, obstáculos ni identidad visual propios todavía.
- Rediseño de los obstáculos ambientales de la Zona 1 (`ReefCluster`/
  `ReefClusterSpawner`, sustituye a `CoralWall`/`CoralSpawner`, que se
  quedan intactos sin usarse por si hay que revertir): **solo el prototipo
  de 2-3 composiciones está hecho** (diagonal desde un lado, masa central
  con dos caminos, curva en S entrando por los bordes), con 3 piezas nuevas
  generadas con Gemini (`coral_fan`, `rock_cluster`, `seaweed_frond`) y 4
  capas de profundidad (fondo/decoración/obstáculo/primer plano). Verificado
  con Playwright: las 3 plantillas ciclan sin repetirse, generan una
  composición orgánica de varias piezas (no una pared de un solo asset), y
  las monedas trazan la ruta curva real. **Pendiente de aprobación visual
  del usuario antes de generalizarlo al resto de la Zona 1** — es el pedido
  explícito, no está aprobado todavía. Nota menor detectada: en la
  plantilla "curva en S", los tramos de transición del trazado de monedas
  entre bandas pasan un poco cerca (visualmente, no de colisión) del
  obstáculo de la banda central — retocar si se aprueba el enfoque.

# PENDIENTE

- Aprobación del usuario del prototipo de `ReefCluster` de arriba, y si se
  aprueba, generalizarlo al resto de la Zona 1 (sustituyendo del todo al
  coral estrecho anterior) — más piezas de la librería si hacen falta.
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

Esperar la aprobación visual del usuario sobre el prototipo de `ReefCluster`
(ver EN PROGRESO) antes de tocar más Zona 1 — es un requisito explícito, no
generalizar el enfoque sin ese visto bueno. Si se aprueba: generalizarlo
(sustituir del todo el coral estrecho anterior) y de paso retocar la nota
menor del trazado de monedas en la plantilla "curva en S". Si se pide
cambiar el enfoque, iterar sobre las 3 plantillas antes de generar más.

Después de eso (o si el usuario prefiere dejar esto en pausa): corregir la
continuidad del fondo (`background_far.png` / `ParallaxLayer`) — la
decoración se concentra en una franja y deja un tramo largo vacío antes de
repetirse. Ver detalle en GAME_DESIGN.md (sección ENVIRONMENT).
