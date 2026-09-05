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
  3. `dark_rock_branch`/`dark_rock_plain`/`dark_rock_tall` (roca oscura
     tono pizarra, coral solo como acento mínimo) — rechazados de nuevo:
     "no se parece ni siquiera a las imágenes que mandé". Causa raíz real:
     el usuario pegaba imágenes de referencia en el chat, pero esas
     imágenes NUNCA llegaban a esta sesión como archivo — solo se veían
     en la conversación, sin ruta de disco real que pasarle a Gemini como
     `--ref`. Se generaba de memoria/descripción, no copiando el archivo.
  **Actual (4ª tanda)**: el usuario subió las 3 imágenes de referencia
  directamente al repo (`/reference/*.png`) para darles acceso real de
  archivo. Con eso: `coral_branch` (rama de roca cubierta densamente de
  coral ramificado de colores — rosa/azul/lila/menta — y musgo, ya
  diagonal de por sí) y `boulder_rock` (cúmulo de rocas redondeadas con
  musgo y acentos pequeños de coral rojo/rosa), ambas generadas usando
  los archivos reales como referencia de Gemini — coinciden con el estilo
  pedido mucho más de cerca que las tandas anteriores. Moneda también
  rediseñada (perla dorada nacarada) y reducida de escala 0.11 a 0.08.
  **Ajustes tras revisión del usuario sobre esta 4ª tanda**: la pared
  lateral por la derecha usaba `coral_branch` sin espejar, dejando la
  parte lisa pegada al borde y el coral apuntando hacia el interior (al
  revés de como se ve entrando por la izquierda) — arreglado con `flipX`
  en `lateralWall` y en la banda derecha de `sCurveEdges`. Además, pedido
  explícito de generar "muchos [obstáculos] e irlos poniendo de distintas
  formas": añadida una familia de 3 variantes de rama a partir de
  `coral_branch.png` como ancla — `branch_straight` (recta, coral en una
  punta), `branch_hook` (horizontal que se curva hacia arriba al final) y
  `branch_short` (más corta y compacta); las plantillas que usan una rama
  eligen una al azar en cada aparición (`pickBranch()` en
  `ReefTemplates.ts`) en vez de repetir siempre la misma. Las 3 variantes
  se generaron a partir de la descripción/memoria de la imagen de
  referencia que el usuario mostró en el chat (no llegó como archivo a
  tiempo) — el usuario subió esa misma imagen al repo justo después
  (`reference/branch_variety_ref.png`), así que si hace falta más
  fidelidad a esas 4 siluetas concretas, ya hay archivo real para
  regenerar con `--ref` en vez de memoria.
  Verificado con Playwright: las 4 plantillas ciclan sin repetirse, se
  integran visualmente con el fondo existente, la pared lateral se lee
  claramente "saliendo del borde" dejando espacio de sobra en el lado
  contrario y con el coral correctamente pegado al borde en ambos lados,
  playtest automatizado sigue pasando sin problema.
  **Pendiente de aprobación visual del usuario antes de generalizarlo al
  resto de la Zona 1** — es el pedido explícito, no está aprobado todavía.
  **Nota para futuras sesiones**: si el usuario adjunta imágenes de
  referencia en el chat para generar arte nuevo, comprobar primero si
  llegan como archivo real (buscar en `/root/.claude/uploads/<sessionId>/`
  por fecha) antes de generar nada — si no hay archivo, pedirle que las
  suba al repo (p.ej. a `/reference`) en vez de generar de memoria/
  descripción, que ya falló dos veces por este motivo.
  **5ª tanda, tras revisión de la 4ª por el usuario** (4 pedidos en un solo
  mensaje):
  1. "La textura la quitaste un poco mal": `fix_transparency.py` con su
     `interior_hole_mask` por defecto volvió a comerse textura clara
     legítima (bandas de brillo pastel) en las 3 variantes de rama nuevas
     — mismo bug ya visto una vez con `coral_branch`. Rehechas las 3
     (`branch_straight`/`branch_hook`/`branch_short`) limpiando solo el
     borde (`border_connected_mask`, sin tocar el interior) — verificado
     sin fantasmas ni textura perdida contra el fondo real del juego.
     **Lección para el futuro**: con este estilo de acuarela pastel, la
     limpieza de transparencia por defecto NO es segura — usar siempre
     solo borde salvo que un hueco interior concreto y verificado lo
     necesite.
  2. "El espejo se rompe con las otras": verificado con una rejilla
     Playwright que compara las 4 variantes lado a lado (sin espejo vs.
     `flipX`, la pieza pegada a una línea de "borde" simulada) — con las
     texturas ya limpias del punto 1, las 4 quedan correctamente
     espejadas (coral pegado al borde en ambos lados). La sensación de
     "roto" venía de las texturas dañadas del punto 1, no de la lógica de
     `flipX` en sí — no hizo falta ningún cambio de código adicional.
  3. "Las ramas largas más pequeñas": añadido `branchScale()` en
     `ReefTemplates.ts` — las 3 variantes largas (`reef_coral_branch`,
     `reef_branch_straight`, `reef_branch_hook`) se colocan al 85% de la
     escala pedida; `reef_branch_short` (ya compacta) se queda igual.
  4. "Girar `boulder_rock` 90º según el lado, para que la parte plana
     quede pegada al lateral": añadida rotación (`±90°` según el lado) en
     la pieza de roca pegada al borde de `lateralWall`. Esto exigió
     arreglar cómo `ReefCluster.ts` calcula la hitbox de piezas giradas:
     un `StaticBody` de Arcade Physics NO gira su rectángulo con
     `sprite.rotation`, y además `refreshBody()` deja el body en una
     posición ya desplazada (vía `sprite.getTopLeft()`, que sí tiene en
     cuenta la rotación para un único punto, pero sin girar ni
     intercambiar ancho/alto) — un primer intento de "intercambiar
     ancho/alto si la rotación es ~90°" (sin tener esto en cuenta)
     quedaba con la hitbox muy lejos del dibujo real. Arreglado con
     `rotatedFractionalBody()`: gira a mano los 4 vértices del recorte
     alrededor del centro del sprite para obtener su caja delimitadora en
     coordenadas de mundo, y le resta la posición base que `refreshBody()`
     ya dejó puesta, para que el offset final caiga exacto. Verificado con
     un probe numérico + captura (rectángulo de debug dibujado con
     `body.x/y/width/height` encima del sprite real, para cualquier
     ángulo) tanto de forma aislada como a través del spawner real
     (`ReefClusterSpawner`) — coincide con la silueta girada en ambos
     lados.
  Playtest automatizado (zigzag simple) sigue pasando sin golpes tras
  estos 4 cambios.
  **6ª tanda, revisión de la 5ª**: dos ajustes puntuales.
  1. `reef_coral_branch` queda FUERA de la reducción de escala del 85% —
     "el de coral... ese así grandote me gustaba", pedido explícito de
     mantenerlo en su tamaño grande original. Las otras dos ramas largas
     (`reef_branch_straight`, `reef_branch_hook`) se quedan al 85%.
  2. `reef_branch_straight` deja de espejarse por completo: viendo la
     versión con `flipX` en el lado derecho, el usuario pidió "el espejo
     de ese, y ponlo en ese mismo lado" — es decir, en la derecha usar
     también la orientación nativa (sin espejar), no la espejada. Es la
     única excepción a la convención "coral a la izquierda de fábrica,
     espejar para la derecha" que comparten las otras 3 ramas
     (`NEVER_FLIP_KEYS` en `ReefTemplates.ts`) — con esta rama en
     concreto, el coral queda apuntando al interior y la parte lisa toca
     el borde, al revés que las demás, por pedido explícito. Verificado
     con Playwright reproduciendo exactamente la posición/origen que usa
     `lateralWall` a cada lado. Playtest automatizado sigue pasando sin
     golpes.
  **7ª tanda**: "ahora haz lo mismo con el otro" — dos intentos fallidos
  (`reef_branch_hook`, luego `reef_branch_short`), ambos revertidos: el
  usuario aclaró en los dos casos que esa pieza ya estaba bien y no era a
  la que se refería. Las 3 ramas menos `reef_branch_straight` volvieron a
  la convención general (espejar hacia la derecha).
  **8ª tanda**: el usuario mandó una captura real del juego con dos
  `reef_branch_straight` (contexto izquierda y derecha, ambas nativas tras
  la 6ª tanda) y aclaró exactamente qué faltaba: "DERECHA BIEN, izquierda
  poner espejo. SOLO ESO" — es decir, la orientación nativa (sin espejar)
  SÍ es la correcta para el contexto derecha (ya lo teníamos), pero el
  contexto izquierda necesita el espejo — justo AL REVÉS de la convención
  general de las otras 3 ramas (que espejan a la derecha, no a la
  izquierda). `branchFlipX()` pasó de "nunca espejar esta clave" a
  "invertir la decisión general para esta clave" (`INVERT_FLIP_KEYS`):
  para `reef_branch_straight`, sin espejo cuando el resto pediría espejo
  (derecha) y con espejo cuando el resto NO lo pediría (izquierda).
  Verificado con un probe sobre los clusters reales generados por
  `ReefClusterSpawner` (filtrando por la extensión vertical del cúmulo
  para distinguir `lateralWall`/`sCurveEdges` de las plantillas que no
  gestionan flipX) — los 9 casos de `lateralWall` encontrados coinciden:
  izquierda con `flipX=true`, derecha con `flipX=false`, sin excepciones.
  Playtest automatizado sigue pasando sin golpes.
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
