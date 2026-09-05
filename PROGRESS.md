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
- **`background_far.png` revertido a la versión "solo mar"**: la versión
  que había en el repo (desde el commit `8484ef7`, bastante anterior a
  todo el trabajo de `ReefCluster` de esta sesión) tenía arcos/columnas de
  piedra tipo ruinas dibujados directamente en la capa de fondo lejana —
  el usuario, tras aprobar los obstáculos de `ReefCluster`, pidió
  "mejora el fondo... que se vea solo mar como estaba antes". Restaurado
  con `git show <commit>:<path>` a la versión de `70c0da8` (gradiente de
  agua con rayos de luz, sin ninguna estructura dibujada — la versión
  inmediatamente anterior a que se añadieran esos arcos), que ya era la
  pensada para repetirse como `TileSprite` en `ParallaxLayer`. Sin cambios
  de código: `rocks_back.png` (el cúmulo de rocas redondeadas pequeño) no
  tenía este problema, se queda igual. Verificado con Playwright en varios
  puntos de scroll (incluido un salto de 20000px) sin costuras visibles;
  playtest automatizado sigue pasando (background es puramente visual, no
  toca colisiones).
- **Prototipo de `ReefCluster` aprobado** por el usuario ("MUY BIEN AHORA
  SI") tras las 8 tandas de ajustes documentadas arriba — ya no está
  pendiente de visto bueno.
- **Tramo 1 de la Zona 1 diseñado a mano** (`config/Zone1Level.ts`),
  pedido explícito: "un nivel como si fuera el Mario Maker" — sustituye a
  la generación al azar de medusa/erizo/tiburón/pez grande/`ReefCluster`
  SOLO en el rango 0–4000 (`ZONE1_LEVEL_END_OFFSET`); a partir de ahí esos
  mismos spawners retoman su cadencia aleatoria de siempre (todos arrancan
  justo en ese límite). Coins/nenúfar/escudo/boost no se tocan, siguen con
  su generación continua de siempre. Reglas de diseño (2ª versión, tras
  rechazar la 1ª por "no me cuadra"):
  - Dificultad desde el minuto uno — el primer `ReefCluster` aparece a
    altura 300, no hay tramo de agua vacía de bienvenida.
  - Nunca un peligro solo: cada criatura queda a menos de ~400px de un
    `ReefCluster` o de otra criatura.
  - El tramo dura hasta altura 4000 (antes cada peligro tenía su propio
    `*_START_OFFSET` bastante más bajo, 600-2200).
  Contenido: 5 `ReefCluster` (uno de cada plantilla + una repetida) con
  centros separados ~700px para que sus bandas de colisión no se solapen,
  y 8 criaturas (3 medusas, 3 erizos, 1 tiburón, 1 pez grande) colocadas en
  los huecos entre bandas (con ~50-100px de margen) — nunca dentro de la
  banda de un cúmulo, para no tapar sin querer su único carril seguro.
  Cada spawner (`Jellyfish/Urchin/Shark/BigFish/ReefClusterSpawner`) ganó
  un método público `spawnExact(y, ...)` que reutiliza toda su lógica
  interna (grupo, update, despawn, overlaps ya conectados en PondScene)
  sin las comprobaciones de banda/descanso — esas son solo para la
  generación al azar de más arriba. Verificado numéricamente (posiciones
  exactas de las 5 bandas + 8 criaturas, todas en los huecos esperados,
  cero solapes) y con capturas a ancho completo del mundo en cada punto de
  combo. Playtest automatizado (zigzag simple, sin esquiva real): muere de
  forma consistente cerca del primer `ReefCluster` (altura ~150-250) — es
  la primera vez que ese bot ciego se enfrenta a una masa que bloquea gran
  parte del ancho (antes solo esquivaba peligros puntuales por suerte);
  no es evidencia sólida de que sea injusto para un jugador real que sí ve
  el hueco, pero queda anotado para que el usuario lo juzgue jugando él
  mismo.
- **`reef_boulder_rock` ahora sale SIEMPRE de un lateral de verdad, en las
  4 plantillas** — el usuario vio una captura real con dos rocas flotando
  en agua abierta (`diagonalLeft` a un 12% del ancho, `centerTwoPaths` en
  el centro exacto, 47%) y pidió "las rocas esas solo que salgan en los
  laterales... y volteadas 90 grados". `diagonalLeft`/`centerTwoPaths`/
  las dos rocas de `sCurveEdges` se movieron al borde izquierdo real
  (mismo `edgeX`/`edgeRotation` que ya usaba `lateralWall`) — `diagonalLeft`
  y `sCurveEdges` ya crecían conceptualmente "desde la izquierda", así que
  encaja con su propio diseño; `centerTwoPaths` pierde parte de su
  simetría original pero se prioriza el pedido explícito. Esto reveló que
  esas 3 plantillas nunca espejaban su rama según el lado (a diferencia de
  `sCurveEdges`/`lateralWall`, que sí lo hacían) — pedido implícito ("el
  coral modo espejo") resuelto con una regla general nueva,
  `towardsRightEdge()`: si la rama cae en la mitad derecha del cúmulo,
  espejar (coral hacia ese lado); si cae en la izquierda, no — mismo
  criterio de "coral pegado al lado más cercano, parte lisa hacia el
  interior" que ya regía en las piezas pegadas a un borde de verdad.
  Verificado leyendo `sprite.flipX`/`sprite.rotation` directamente de las
  4 plantillas forzadas con `spawnExact` (no a ojo, que ya llevó a un
  diagnóstico equivocado en el propio proceso) — las 9 piezas de obstáculo
  coinciden exactamente con lo esperado. Playtest sigue en línea con antes
  (background/posición de piezas, no toca colisión salvo la rotación de
  las rocas, ya validada en rondas anteriores).
- **D-pad táctil fijo de 8 direcciones**, sustituye al joystick flotante
  (`InputController.ts`) — pedido explícito: "una flechas de arriba abajo
  e izquierda y los diagonales, que sea bonita y esté bien hecha medio
  transparente". Antes el joystick aparecía donde tocaras el dedo
  (arrastre libre); ahora es un mando fijo en la esquina inferior
  izquierda (independiente del tamaño de pantalla, recalculado cada frame
  desde `cam.height`): un círculo base translúcido con 8 flechas
  triangulares alrededor (arriba/abajo/izquierda/derecha + diagonales),
  la que esté activa se resalta en rosa. El teclado (flechas/WASD) sigue
  funcionando en paralelo para pruebas de escritorio, sin cambios.
  Paleta lavanda/rosa suave a juego con el resto de la UI. Alphas subidos
  tras comprobar que el diseño inicial ("medio transparente") se perdía
  casi por completo contra fondos ocupados (plantas de primer plano) —
  ahora lleva una sombra oscura muy sutil debajo de todo el pad y de cada
  flecha para que se lea igual sobre agua clara o fondo denso, sin dejar
  de ser translúcido.
  **Bug encontrado y arreglado durante la propia verificación**: un toque
  que empieza justo en el centro del pad (zona muerta, para poder soltar
  el dedo ahí sin que cuente como dirección) no capturaba el puntero, así
  que arrastrar el dedo desde ahí hacia una flecha no hacía nada — el
  juego se quedaba sin responder a ese dedo hasta soltarlo y volver a
  tocar. Arreglado separando "¿el toque cae dentro del alcance del pad?"
  (que sí captura el dedo) de "¿a qué dirección apunta?" (que puede ser
  ninguna, sin soltar la captura). Verificado con Playwright simulando
  mouse down/move/up sobre el pad (sostener una diagonal y leer
  `body.velocity` de Lumi directamente) y con capturas ampliadas de la
  zona del pad. Playtest de teclado sigue igual (código sin tocar).
- **Aviso de "gira tu móvil"** en horizontal (`index.html`, un
  `@media (orientation: landscape) and (pointer: coarse)`) — pedido
  explícito: "los niveles solo diséñalos para formato móvil, olvidemos el
  horizontal". El D-pad fijo y el ancho de mundo (`WORLD_WIDTH`, pensado
  para retrato) no tienen sentido en landscape, así que en vez de intentar
  adaptarlos se tapa el juego con un aviso hasta que el usuario gire el
  móvil — el filtro `pointer: coarse` evita que salte en una ventana de
  escritorio ancha y baja (verificado: sigue mostrando el juego a 900×400
  sin táctil; sí muestra el aviso a 780×360 con táctil).
- **Despliegue automático a GitHub Pages** (`.github/workflows/deploy-pages.yml`)
  — pedido explícito: "dime las instrucciones paso a paso para ponerlo en
  el móvil". Cada push a `claude/axolotl-3d-game-1rl3bw` recompila
  (`npm run build`) y publica en GitHub Pages, sin depender de tener un
  ordenador encendido ni compartir wifi con el móvil.
  **Bug real encontrado y arreglado antes de publicarlo**: GitHub Pages
  sirve el proyecto bajo `/juego/`, no en la raíz del dominio. Vite ya
  sabe aplicar ese prefijo a lo que él mismo procesa (el bundle JS, vía
  `base` en `vite.config.ts`, solo activo en el build de CI mediante la
  variable `GITHUB_PAGES`), pero las ~30 rutas de carga de Phaser
  (`this.load.image(...)` en `BootScene.ts`, más `framePath()` de
  `LumiAnimConfig.ts`) son strings sueltos en tiempo de ejecución que
  Vite no toca — probado sirviendo el build real bajo un subpath local
  (`python -m http.server` + carpeta `/juego`): 64 peticiones de assets a
  404 antes del arreglo, 0 después. Arreglado con un helper compartido,
  `assetPath()` (`src/config/assetPath.ts`), que antepone
  `import.meta.env.BASE_URL` a cada ruta — envuelve todas las llamadas de
  `BootScene.ts` y `framePath()`. Verificado de nuevo bajo el subpath
  simulado (0 peticiones fallidas, captura real del juego cargando bien)
  y en modo dev normal (`base` sigue siendo `/`, sin regresión).
  Paso manual pendiente del usuario (una vez): activar "GitHub Actions"
  como fuente en Settings → Pages del repo — después la URL
  `https://dijuannn.github.io/juego/` queda siempre actualizada.
- **Lumi -10%, mundo mucho más angosto, arrecife sin daño** — pedido
  explícito tras confirmar que el despliegue ya funciona: "toca
  empequeñar a lumi un 10% y que sea más pequeño el mapa, hacerlo más
  angosto el límite... ahora hay mucho mapa para desplazarse lateralmente
  que haya muchísimo menos. Y que los obstáculos no te hagan daño."
  - `LUMI_SCALE` (`GameConfig.ts`): `0.075 * 3 * 1.2` → `0.075 * 3 * 1.2 *
    0.9` (10% menos sobre el tamaño ya aprobado). Verificado leyendo
    `lumi.sprite.scale`/`displayWidth` en runtime.
  - `WORLD_WIDTH` (`GameConfig.ts`): `1376` → `600`. Antes coincidía con
    el ancho nativo de `background_far.png`/`rocks_back.png`, pero dejaba
    muchísimo margen lateral antes de tocar cualquier obstáculo de
    `ReefTemplates.ts` (que salen de los bordes del mundo). `background_far`
    no depende de este valor (TileSprite anclado a cámara); `rocks_back`
    sí, pero al ser una sola imagen centrada un mundo más angosto solo la
    recoloca. Riesgo evaluado antes de tocar nada: las posiciones de
    piezas en `ReefTemplates.ts` son fracciones de `worldWidth`
    (`worldWidth * 0.28`, etc.) así que el espacio absoluto entre piezas
    se redujo, pero la escala de render de cada pieza (independiente del
    ancho de mundo) se dejó intacta a propósito — verificado con capturas
    con la cámara en zoom `405/600` (ancho de mundo completo visible) de
    las 4 plantillas de `REEF_TEMPLATES` en sus posiciones reales del
    Tramo 1: ninguna se ve amontonada ni solapada de forma rota.
  - **Arrecife ya no hace daño** (`PondScene.ts`): el
    `physics.add.overlap(lumi, reefClusterSpawner.group, () =>
    handleHazardHit("coral"))` se cambió por un
    `physics.add.collider(lumi, reefClusterSpawner.group)` simple — sigue
    siendo un obstáculo físico sólido (Lumi no lo atraviesa, hay que
    rodearlo o pasar por el hueco de la composición), pero tocarlo ya no
    resta vidas ni dispara la secuencia de golpe/muerte. Se limpiaron los
    restos muertos de `"coral"` como `DeathReason` (el tipo, el mensaje en
    `DEATH_MESSAGES`, comentarios que lo mencionaban) ya que
    `reefClusterSpawner.group` es el único sitio que lo usaba
    (`CoralSpawner.ts`, código legado sin usar, no lo referenciaba).
    Verificado con Playwright: teletransportando a Lumi encima de una
    pieza real del grupo y dejando correr la física 30 frames, las vidas
    se mantienen en 3, `isGameOver`/`isDying` siguen en `false`, y la
    posición de Lumi se desplaza (el collider la empuja fuera de la
    pieza) — confirma bloqueo físico sin daño.
  - `npx tsc --noEmit` limpio. Playtest automático (bot con zigzag
    aleatorio) ya no muere cerca del primer cúmulo de arrecife como antes
    (llegaba a morir sobre altura ~150-250); en esta pasada superó altura
    292 sin game over dentro de la ventana de prueba.
- **Obstáculos laterales pegados al límite real + cruceta táctil
  tradicional** — pedido explícito tras ver el mapa angosto: "LOS
  OBSTACULOS DE LOS LATERALES TIENEN QUE IR PEGADOS AL LIMITE. PARA QUE
  NAZCAN DESDE AHI" + "LA CRUZETA AL MEDIO ABAJO... CAMBIA LA CRUZETA A
  UNA CRUZETA ESTILO TRADICIONAL SOLO CON ARRIBA ABAJO, DERECHA E
  IZQUIERDA. SI QUIEREN IR EN DIAGONAL QUE PRESIONEN LOS DOS A LA VEZ".
  - **`ReefTemplates.ts`**: `reef_boulder_rock` ya estaba pegado al borde
    (`edgeX`, de una corrección anterior), pero las piezas "branch" de
    3 de las 4 plantillas (`diagonalLeft`, `centerTwoPaths`,
    `sCurveEdges`) se colocaban a una fracción "media" de `worldWidth`
    (0.28/0.55/0.72 — pensadas para el `WORLD_WIDTH` viejo de 1376px).
    Con el mundo ya angosto (600px, ver ronda anterior) esas fracciones
    caían cerca del centro de la pantalla, no pegadas a ningún lado —
    exactamente lo que el usuario señaló. Se añadió un helper compartido
    `fromEdge(worldWidth, side, relX)` (0 = pegado al borde, hacia dentro
    conforme crece `relX`) y las 3 plantillas ahora anclan TODAS sus
    piezas de rol "obstacle" (roca + rama) a un borde real:
    - `diagonalLeft`: rama movida a `fromEdge(left, 0.15)` (antes
      `worldWidth*0.28`), pegada a la misma roca del borde izquierdo.
    - `centerTwoPaths`: rediseñada de "masa central con dos caminos" a
      "dos masas en bordes opuestos, en bandas de altura distinta" (roca
      en el borde izquierdo abajo, rama en el borde derecho arriba) — una
      masa a mitad de un mundo de 600px ya bloqueaba el paso entero, no
      se leía como "en un lado". La ruta ahora serpentea por el centro,
      siempre bien lejos de ambas masas.
    - `sCurveEdges`: la rama de la banda media (antes `worldWidth*0.72`)
      pasa a `fromEdge(right, 0.12)`, pegada de verdad al borde derecho
      (las bandas superior/inferior con roca ya estaban bien).
    - `lateralWall` no cambia de comportamiento (ya usaba este mismo
      criterio) — solo se centralizó su `fromEdge` local en el helper
      compartido.
    Verificado leyendo las posiciones reales de los sprites del grupo de
    colisión en juego (`reefClusterSpawner.group`): todas las piezas
    "obstacle" caen exactamente en `-12` (borde izquierdo, `-0.02*600`),
    `90`/`60` (ramas ancladas a la izquierda) o `516`/`528` (ramas
    ancladas a la derecha) — coincide con la fórmula al milímetro.
    Capturas de las 5 composiciones del Tramo 1 confirman que no queda
    ninguna pieza flotando en mitad del agua.
  - **`InputController.ts`**: rediseño completo de la cruceta táctil.
    - Fija en el CENTRO inferior de la pantalla (antes esquina inferior
      izquierda) — `padCenter()` ahora usa `cam.width / 2`.
    - De un dial circular de 8 direcciones a una cruceta tradicional: 4
      botones cuadrados independientes (arriba/abajo/izquierda/derecha)
      alrededor de un hub decorativo, sin botones diagonales.
    - Multi-touch real: cada botón es un dedo independiente
      (`Map<pointerId, dirección>` en vez de un único `activeDirIndex`) —
      presionar dos botones adyacentes a la vez (ej. arriba + derecha) da
      la diagonal, sumando igual que ya hacía el teclado
      (`cursors.up.isDown && cursors.right.isDown`). Se subió
      `scene.input.addPointer(2)` para tener margen de sobra a 2+ dedos
      simultáneos.
    Verificado: capturas confirman la cruceta centrada abajo con solo 4
    flechas (sin diagonales dibujadas); una prueba con dos "dedos"
    sintéticos (pointerId distintos) sobre los botones arriba+derecha dio
    `{x:1,y:-1}` (diagonal), soltar uno dio `{x:1,y:0}` (solo el que
    queda) y soltar el segundo dio `{x:0,y:0}` — exactamente el
    comportamiento aditivo pedido. Un evento de mouse real (down/up) de
    Playwright sobre el botón derecho confirmó además que el cableado
    DOM→Phaser→InputController sigue funcionando end-to-end (no solo la
    lógica interna) y que el botón se resalta en rosa al presionarlo.
  - `npx tsc --noEmit` limpio. Playtest automático (teclado) sigue
    completando el recorrido sin problemas (superó altura 300).

# PENDIENTE

- Diseñar el Tramo 2 de la Zona 1 (4000 en adelante: introducir el
  calamar, gauntlet final, corriente) — pendiente de que el usuario dé el
  visto bueno al Tramo 1 primero.
- Una vez el Tramo 1 esté aprobado y estable: variaciones del mismo
  esqueleto para que no sea idéntico entre intentos (pedido explícito,
  para después).
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

Esperar la validación del usuario sobre el Tramo 1 de la Zona 1
(`config/Zone1Level.ts`, ver EN PROGRESO) — le mandé fotos de cada combo y
un vídeo del recorrido. Según lo que diga:
- Si pide ajustar densidad/posiciones/qué criatura va con qué cúmulo,
  iterar sobre `ZONE1_LEVEL_ENTRIES` (son solo datos, cambios rápidos).
- Si el tramo 1 queda bien: diseñar el Tramo 2 (4000 en adelante, ver
  PENDIENTE) siguiendo el mismo patrón de `spawnExact` ya construido.
- Después: variaciones del mismo esqueleto para que no sea idéntico entre
  intentos (pedido explícito, para más adelante, no antes de que el
  esqueleto fijo esté aprobado).

El fondo (`background_far.png`/`rocks_back.png`) y el prototipo de
`ReefCluster` ya están aprobados y no se tocan salvo pedido explícito.

Pendiente aparte (no bloquea lo anterior): corregir la continuidad del
fondo actual (franja decorada seguida de un tramo largo vacío antes de
repetirse) — ver detalle en GAME_DESIGN.md (sección ENVIRONMENT).
