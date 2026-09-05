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
- **Ajustes tras probar en el móvil real** — pedido explícito: "LUMI VA
  MUY LENTO LE AUMENTARIA EL TAMAÑO", "LA CRUZETA LA SUBIRIA UN POCO
  MAS", "LAS BURBUJAS QUE PROPULSAN LAS QUITARIA NO ME GUSTAN", "LAS
  CONCHAS LAS QUITARIA". Cuatro cambios pequeños y mecánicos, hechos ya
  (el resto del mensaje — reestructurar obstáculos/enemigos, más orden,
  estrellas/piedras como obstáculos de nivel, monedas en fila/diagonal —
  es un pedido de PLAN, no de implementación; ver el plan mandado al
  usuario, pendiente de que lo apruebe antes de tocar código de nivel).
  - `LUMI_SCALE` (`GameConfig.ts`): de `0.075*3*1.2*0.9` (≈0.243) a
    `0.075*3*1.35` (≈0.304, +25%) — una Lumi más grande en pantalla se
    siente más rápida a igual velocidad real (`LUMI_SWIM_SPEED` sin
    tocar). Verificado leyendo `lumi.sprite.scale`/`displayWidth` en
    runtime.
  - `InputController.ts`: `PAD_MARGIN_Y` de 130 a 165 — la cruceta queda
    más arriba, más lejos del borde inferior.
  - Eliminado `LumiBubbleTrail` (el rastro de burbujas que seguía a Lumi
    al nadar, "las burbujas que propulsan") — se quita su instanciación
    en `PondScene.ts` y se borra el archivo entero (no queda ningún otro
    uso). El resto de burbujas del juego (fondo ambiental, ráfaga al
    recoger power-ups) no se toca, no es lo que el usuario señaló.
  - `decor_shell` eliminado del todo: de `DECOR_KEYS`
    (`BackgroundDecorSpawner.ts`, decoración ambiental aleatoria), de su
    carga en `BootScene.ts`, y de las 4 plantillas de `ReefTemplates.ts`
    que la usaban como decoración de cúmulo. `decor_pebble`/
    `decor_starfish` se quedan tal cual por ahora (pasarán a ser
    obstáculos de nivel según el plan, no en esta ronda).
  - `npx tsc --noEmit` limpio, sin referencias sueltas a `decor_shell` ni
    a `LumiBubbleTrail`. Playtest automático sigue completando el
    recorrido. Capturas confirman el tamaño nuevo de Lumi, la cruceta más
    arriba y la ausencia de burbujas de propulsión.
- **Ejecutado el plan de reestructuración aprobado por el usuario**
  ("vale hagamos eso"), más una corrección: "lumi ponlo del tamaño que
  estaba antes, me confundí, quería decir que lo hicieras más rápido un
  30% más rápido".
  - `LUMI_SCALE` vuelve a `0.075*3*1.2*0.9` (el aumento de la ronda
    anterior era un malentendido). `LUMI_SWIM_SPEED` sube un 30% real
    (310 → 403) — verificado leyendo `body.velocity.y` con la flecha
    arriba pulsada.
  - **Bug real encontrado de camino**: varias X de `ZONE1_LEVEL_ENTRIES`
    (700/1000/1050) eran herencia del `WORLD_WIDTH` viejo (1376px) y
    quedaron fuera de los límites físicos del mundo actual (600px, Lumi
    colisiona con los bordes — `physics.world.setBounds`) tras la ronda
    en que se achicó el mapa: esos peligros estaban colocados en el aire,
    inalcanzables. Todas las X del Tramo 1 se corrigieron a `[110,490]`;
    el combo final (3400-4000) además se reordenó en zigzag deliberado
    (350/150/450/250) en vez de valores sueltos — verificado leyendo la
    posición real de cada sprite en juego (0 fuera de rango).
  - **Tramo 2 (4000-6500) diseñado a mano**, mismo criterio que el Tramo
    1 (nunca un peligro solo, bandas de los ReefCluster respetadas con
    margen ~50-100px): 3 cúmulos de arrecife más, debut del calamar (dos
    apariciones) y un gauntlet final (medusa + pez grande) justo antes de
    la corriente de agua (6500). `SquidSpawner` no tenía `spawnExact` ni
    seguía el patrón de `ZONE1_LEVEL_END_OFFSET` (usaba su propio
    `SQUID_START_OFFSET` aparte) — se le añadió, igual que al resto.
  - **Más orden**: `SharkSpawner`/`BigFishSpawner`/`SquidSpawner` ahora
    reciben el mismo `isWithinAnyClusterBand` que ya tenían medusa/erizo,
    para que ningún peligro caiga por casualidad encima de la banda de un
    cúmulo de arrecife (antes solo aplicaba a 2 de los 6 peligros).
  - **Estrellas/piedras dejan de ser decoración ambiental aleatoria y
    pasan a ser obstáculos de nivel**: `BackgroundDecorSpawner.ts`
    (spawner de fondo puramente aleatorio) se retira del todo — import,
    instanciación y `update()` en `PondScene.ts`, archivo borrado, y el
    campo `decorKeys` (ya sin uso real, `ZoneManager` nunca lo leía) se
    quita de `ZoneConfig.ts`. Las piezas `decor_starfish`/`decor_pebble`
    que YA estaban colocadas a mano dentro de cada plantilla de
    `ReefTemplates.ts` (antes `role:"decoration"`, sin colisión) pasan a
    `role:"obstacle"` — bloquean como el resto del cúmulo, sin hacer daño
    (mismo collider ya wireado). Se añadieron sus `HITBOX_FRACTION` en
    `ReefCluster.ts`. Verificado que ninguna quedó encima de la ruta guía
    de su plantilla (a ojo contra las coordenadas del `path`) y con un
    test de colisión real (teletransportar a Lumi encima de una y correr
    física 30 frames: vidas intactas, `isGameOver` en `false`, posición
    de Lumi desplazada por el collider).
  - **Monedas en fila/diagonal con separación constante**
    (`CoinSpawner.ts`): el arco curvo (`COIN_GROUP_ARC_SPREAD`, cada
    moneda desplazada según su distancia al centro del grupo) se
    reemplaza por un paso horizontal CONSTANTE por moneda
    (`COIN_GROUP_DIAGONAL_STEP=45`) — 1/3 de los grupos en fila recta
    (paso 0), el resto en diagonal, siempre hacia el centro del mundo
    (nunca hacia el borde más cercano) para que ninguna moneda quede
    recortada contra el límite en un mundo tan angosto. Además, su
    cadencia aleatoria ya no arranca casi desde el inicio (`START_Y -
    200`) sino en `ZONE1_LEVEL_END_OFFSET` (6500): por debajo de eso las
    monedas ya las coloca cada `ReefCluster` siguiendo su propia ruta —
    tener los dos sistemas a la vez ahí era parte de lo que se veía
    desordenado. Verificado leyendo las monedas reales del grupo: filas
    con X idéntica, diagonales con paso de exactamente 45px entre moneda
    y moneda, ninguna fuera de `[110,490]`.
  - Las rutas curvas de cada `ReefCluster` (las monedas-guía que trazan
    el hueco seguro) NO se tocaron — son guía de navegación real, no solo
    decoración, y forzarlas a una línea recta arriesgaba romper su
    función de esquivar el obstáculo. Dentro de cada segmento ya tenían
    espaciado constante; el "desorden" percibido venía de los dos
    sistemas de monedas solapados (ya arreglado arriba), no de esto.
  - `npx tsc --noEmit` limpio. Playtest automático llegó a altura 669 sin
    game over (antes de esta ronda solía rondar 280-300 en la misma
    ventana de prueba) — mejora esperada: subida más rápida + arrecife/
    estrella/piedra ya no matan, solo bloquean.
- **Bugs reales encontrados probando en iPhone (Safari) real** — el
  usuario mandó una captura de su móvil muy distinta a las mías: la
  cruceta tapando a un erizo enorme, y por separado reportó que el juego
  "se ve lento" pese a moverse fluido (no es un problema de fps, es de
  ritmo). Diagnosticado sin acceso directo al dispositivo (el proxy de
  este entorno bloquea salir a la URL real), reproduciendo con Playwright
  emulando un iPhone 13 (390×664) en vez de mi viewport de prueba de
  escritorio (405×720) — con eso sí se reprodujo el problema de
  composición.
  - **`index.html`**: `#game` usaba `height: 100vh`. En Safari de iOS,
    `100vh` cuenta el área que tapa la barra de direcciones, no lo que
    realmente se ve — el juego se dibujaba más "alto" de lo visible de
    verdad. Arreglado añadiendo `height: 100dvh` justo después (mejora
    progresiva: los navegadores que no conocen `dvh` ignoran esa línea y
    se quedan con el `100vh` de siempre, así que no rompe nada en
    escritorio ni en Android).
  - **Bug real de solape Lumi/cruceta, no un caso raro de una muerte
    puntual**: Lumi se ancla en pantalla a `cam.height * 0.6` (60% hacia
    abajo) — con la cruceta fija cerca del borde inferior (pedido de la
    ronda anterior: "la cruceta la subiría un poco más"), en CUALQUIER
    pantalla de móvil real (650-850px de alto típico) la matemática da
    que Lumi y el botón "arriba" de la cruceta se solapan siempre, no
    solo cuando hay un enemigo grande cerca — confirmado con las medidas
    exactas del iPhone 13 emulado. Nuevo `LUMI_SCREEN_ANCHOR_Y=0.48`
    (`GameConfig.ts`, sustituye el `0.6` suelto en las dos líneas de
    `PondScene.ts` que posicionaban la cámara) — Lumi queda más arriba en
    pantalla, con hueco real antes de la cruceta. Verificado con captura
    en el mismo iPhone 13 emulado: ya no hay solape.
  - **Ritmo de la cámara nunca llegaba a acelerar** — pedido explícito:
    "todo se mueve fluido pero despacio". `CAMERA_RISE_RAMP_ALTITUDE`
    estaba en 10000 (calculado para una partida completa de las 8 zonas:
    10000 es literalmente el `altitudeStart` de la Zona 8 en
    `ZoneConfig.ts`), pero solo existe contenido jugable hasta la Zona 1
    (altura 650, ver `ZONE1_LEVEL_END_OFFSET`) — la cámara pasaba TODO el
    juego actual dentro del primer 6.5% de esa rampa, subiendo de 42 a
    apenas ~44px/s. Bajado a 650 para que la presión suba de verdad
    dentro del contenido que existe hoy (verificado: a altura ~640 la
    velocidad ya calcula ~75.5, casi el tope de 76). Nota dejada en el
    propio código: si se construyen las Zonas 2-8, este valor hay que
    revisarlo otra vez para una rampa más larga.
  - Aclarado aparte (sin cambio de código): el juego NO está hecho en
    Python — es Phaser (JavaScript/TypeScript) + Vite. No hace falta
    pasarlo a Unity; la sensación de lentitud era de ritmo (arreglado
    arriba), no del motor.
  - `npx tsc --noEmit` limpio. Playtest automático sigue completando el
    recorrido sin errores.
- **Canvas no llenaba la pantalla real en iPhone** — el usuario mandó una
  captura de Safari mostrando el juego correcto arriba pero con una
  franja azul en blanco debajo, entre el juego y la barra de Safari (el
  fix de `100dvh` de la ronda anterior no fue suficiente por sí solo).
  Causa: `Phaser.Scale.RESIZE` solo escucha el evento `resize` de
  `window`, pero Safari en iOS no siempre lo dispara cuando su propia
  barra de herramientas cambia de alto (el viewport visual cambia sin
  avisar por ahí) — el canvas se quedaba con una medida vieja. Arreglado
  en `main.ts`: si existe `window.visualViewport` (sí, en Safari
  moderno), se escucha su evento `resize` y se llama a
  `game.scale.refresh()` — es el mecanismo que SÍ se entera de los
  cambios de la barra de herramientas. No se pudo reproducir el bug exacto
  en este entorno (Playwright/Chromium no simula el comportamiento
  dinámico de la barra de Safari), así que queda pendiente de que el
  usuario confirme en su iPhone real.
  - El usuario también reportó que ni la cruceta actual ni el joystick
    flotante anterior le convencen del todo y pidió una recomendación de
    diseño — respondida como opinión (joystick flotante que aparece bajo
    el dedo al tocar, no fijo en un punto), sin implementar todavía a la
    espera de que la apruebe.
  - `npx tsc --noEmit` limpio.
- **Implementado el joystick flotante recomendado** (usuario: "A ver" —
  visto como luz verde a la recomendación). `InputController.ts`
  reescrito de cero: en vez de una cruceta de 4 botones fija en el centro
  inferior, un joystick clásico (base + knob) aparece centrado justo
  donde cae el dedo al tocar, y desaparece del todo al soltar — a
  diferencia de la cruceta, no necesita multi-touch para diagonales (el
  ángulo del arrastre ya lo da un solo dedo), así que se simplifica
  también esa parte. Al no vivir en un punto fijo de la pantalla, no
  puede volver a solaparse de forma sistemática con Lumi como pasaba con
  la cruceta (ver ronda anterior, `LUMI_SCREEN_ANCHOR_Y`). `Lumi.update()`
  no necesitó cambios: ya normalizaba el vector de dirección, así que un
  vector no normalizado (proporcional al arrastre, recortado a
  `JOY_RADIUS=62`) funciona igual que el `{-1,0,1}` de antes.
  Verificado: sin tocar la pantalla no se dibuja nada (pantalla limpia);
  un arrastre de prueba (mouse down + move) hacia arriba-derecha dio un
  vector con signo correcto y Lumi giró/avanzó en esa dirección en
  pantalla; arrastrar mucho más lejos que `JOY_RADIUS` deja el knob
  recortado exactamente en `dist=62` (no se sale de la base visualmente);
  soltar devuelve el vector a `{0,0}` y borra el dibujo. Playtest
  automático (teclado, sin tocar) sigue completando el recorrido sin
  problemas. `npx tsc --noEmit` limpio.
- **Cuarto rediseño de control táctil: deslizar para FIJAR dirección**
  — pedido explícito: "si deslizo una vez hacia arriba va hacia arriba
  siempre hasta que cambie de movimiento". `InputController.ts` reescrito
  de nuevo: ya no hace falta mantener el dedo (ni un joystick, ni una
  cruceta) — un deslizamiento de al menos `MIN_SWIPE_DISTANCE=28px`
  fija una de las 8 direcciones (enganchada al ángulo más cercano, mismo
  criterio de 8 direcciones que el dial original) y esa dirección se
  mantiene sola en `getVector()` hasta el próximo deslizamiento que la
  cambie — un toque corto (por debajo del umbral) no cambia nada. No
  queda ningún widget permanente en pantalla: solo una flechita de
  confirmación que aparece donde se detectó el deslizamiento y se
  desvanece sola en 380ms (`drawFlash`), así que el problema de raíz de
  las dos rondas anteriores (algo fijo compitiendo por hueco con Lumi) no
  puede volver a pasar — no hay nada fijo que pueda solaparse.
  Verificado con una secuencia real de arrastres simulados: deslizar
  arriba fija `{0,-1}` y persiste tras soltar y esperar; deslizar
  arriba-derecha lo cambia a `{1,-1}`; un "toque" de 5px (por debajo del
  umbral) NO cambia nada; deslizar izquierda lo cambia a `{-1,0}` — los
  4 casos exactos que pedía el usuario. Playtest automático (teclado)
  sigue funcionando sin cambios (el teclado conserva el comportamiento
  clásico de "mantener pulsado", no el de fijar). `npx tsc --noEmit`
  limpio.
- **Control táctil aprobado ("VALE AHORA SI ESA ERA LA MOVILIDAD QUE
  QUERÍA"). Reestructuración del nivel para darle espacio**: "hay que
  darle espacio a las cosas... que todo esté mucho más separado entre sí.
  Está todo muy pegado". Causa identificada: los huecos de
  `Zone1Level.ts` (y los `*_MIN_GAP`/`*_MAX_GAP` que rigen la cadencia
  aleatoria después del tramo scripteado) se diseñaron cuando
  `LUMI_SWIM_SPEED` era 220-310px/seg; al subirla a 403 en una ronda
  posterior sin re-tocar las distancias, el mismo hueco en píxeles se
  cruza mucho más rápido — de ahí la sensación de "pegado" aunque los
  números no habían cambiado.
  - Factor único ×1.6 aplicado a: todos los offsets de
    `ZONE1_LEVEL_ENTRIES`, `ZONE1_LEVEL_END_OFFSET` (6500→10400),
    `CURRENT_ZONE_START_OFFSET` (mismo valor, se mueve junto con el final
    de la Zona 1), `CAMERA_RISE_RAMP_ALTITUDE` (650→1040, para que la
    rampa siga llegando a tope justo al final de la Zona 1 ya reescalada),
    `SHARK_CHASE_MIN_OFFSET`, y los `MIN_GAP`/`MAX_GAP` de medusa/erizo/
    tiburón/calamar/pez grande/ReefCluster (cadencia aleatoria más allá
    del tramo scripteado). Las X laterales NO se tocaron (no dependen de
    la velocidad de Lumi, ya estaban dentro de los límites reales del
    mundo). Escudo/boost/monedas/nenúfares tampoco se tocaron — no son la
    fuente de la queja ("las cosas" se refería a obstáculos/enemigos).
  - Como los medios-anchos de banda de cada `ReefCluster` (±230/250/300px)
    son valores FIJOS que no escalan, el margen libre entre cúmulos y sus
    peligros compañeros creció en términos absolutos (antes 50-100px de
    margen, ahora 260-390px) — más espacio del que pedía como mínimo, no
    solo proporcional.
  - Verificado leyendo las posiciones reales de los sprites en juego
    (todas caen en las nuevas alturas esperadas, ninguna fuera de los
    límites del mundo) y con capturas del hueco entre el primer cúmulo de
    arrecife y la primera medusa: ahora hay un tramo claro de agua abierta
    entre ambos, no aparecen pegados. Playtest automático completó el
    recorrido (altura 705 sin game over en la ventana de prueba, frente a
    reef/densidad previa). `npx tsc --noEmit` limpio.
- **Tres pedidos explícitos más en la misma línea**: "Hazlo mucho mucho
  más separado y un 15% mas ancho. y el propulsor del nenúfar bájale un
  20%".
  - **Aún más espacio**: ×2 adicional sobre el ×1.6 de la ronda anterior
    (×3.2 acumulado desde el valor original) en `Zone1Level.ts` (todos
    los offsets y `ZONE1_LEVEL_END_OFFSET`) y en `GameConfig.ts`
    (`CAMERA_RISE_RAMP_ALTITUDE`, `CURRENT_ZONE_START_OFFSET`,
    `SHARK_CHASE_MIN_OFFSET`, y los `MIN_GAP`/`MAX_GAP` de medusa/erizo/
    tiburón/calamar/pez grande/ReefCluster). La Zona 1 ahora termina en
    altura ~2080 (antes ~1040, antes de eso ~650). Las X laterales de
    cada entrada NO se tocaron (no dependen del espaciado vertical).
  - **`WORLD_WIDTH` un 15% más ancho**: `600` → `600 * 1.15` (690).
    Verificado leyendo `physics.world.bounds.width` en juego (690 exacto,
    `camWidth` sigue en 405 — el mundo es más ancho que la pantalla, no
    al revés). Las X hardcodeadas de `Zone1Level.ts` (rango ~110-490)
    siguen dentro de los límites del mundo nuevo sin tocarlas — no hacía
    falta reescalarlas.
  - **Propulsor del nenúfar -20%**: nuevo `LILY_PAD_BOOST_MULT=0.8`
    (`GameConfig.ts`), usado SOLO en `Lumi.triggerBoost()` (el nenúfar) —
    `Lumi.triggerSuperBoost()` (el power-up de boost) sigue usando su
    propio `SUPER_BOOST_SPEED_MULT` sin tocar, ya que el usuario dijo
    específicamente "el propulsor del nenúfar", no el power-up. Antes
    `triggerBoost()` fijaba `boostSpeedMult=1`; ahora fija
    `LILY_PAD_BOOST_MULT`. Verificado en juego: velocidad del primer
    frame de impulso pasó de 1168.7 a 934.96 (exactamente ×0.8).
  - `npx tsc --noEmit` limpio. Playtest automático sigue completando el
    recorrido sin errores. Captura del mismo hueco reef→medusa muestra
    ahora agua completamente abierta (ni siquiera se alcanza a ver el
    cúmulo de arrecife en el mismo encuadre).
- **Cuatro pedidos más en la misma línea, tras responder "¿hasta qué
  capa/zona llevamos?" con: solo existe contenido propio de la Zona 1
  (Estanque) — Tramo 1+2 diseñados a mano llegan hasta altura ~2080, y
  más allá de eso los mismos peligros de Zona 1 siguen apareciendo al
  azar para siempre (Zonas 2-8 son solo datos de tinte/nombre en
  ZoneConfig.ts, sin arte ni diseño propio todavía).**
  - **Nenúfares -50% de frecuencia de spawn**: `LILY_PAD_MIN_GAP`/
    `LILY_PAD_MAX_GAP` ×2 (320→640, 520→1040) — el doble de separación es
    la mitad de frecuencia. Verificado midiendo los huecos reales entre
    nenúfares generados en juego (~937-943px, dentro del rango nuevo).
  - **Monedas encima de cada nenúfar, hasta donde propulsa**: pedido
    explícito: "encima de cada nenúfar pondría monedas hasta donde
    propulse". `LilyPadSpawner` gana su propio `coinGroup` (mismo patrón
    que `ReefClusterSpawner.coinGroup`: `consumeCoin`, filtrado/despawn en
    `update()`) — cada nenúfar nuevo (`spawnAt`) traza una columna de
    monedas en su misma X, desde justo encima hasta la distancia real que
    recorre el impulso. Esa distancia (`LILY_PAD_BOOST_DISTANCE`, nueva
    en `GameConfig.ts`) se CALCULA a partir de la velocidad/duración
    reales del boost (no a ojo): velocidad plena durante
    `BOOST_DURATION_MS - BOOST_EASE_MS`, luego velocidad media (75% de la
    plena) durante el resto por la rampa de bajada — para poder
    calcularla, `BOOST_BASE_SPEED`/`BOOST_DURATION_MS`/`BOOST_EASE_MS` se
    movieron de constantes locales sin exportar en `Lumi.ts` a
    exportadas en `GameConfig.ts`. Wireado en `PondScene.ts` con su
    propio `physics.add.overlap`. Verificado con captura: columna de
    monedas visible justo encima de un nenúfar real en juego.
  - **Propulsor del nenúfar, 20% más abajo todavía**: "le bajaría un 20%
    más su propulsor" — `LILY_PAD_BOOST_MULT` pasa de `0.8` a `0.8*0.8`
    (0.64). Sigue sin tocar el power-up de boost aparte
    (`SUPER_BOOST_SPEED_MULT`). Verificado: velocidad del primer frame de
    impulso bajó a 934.96 (con el 0.8 de la ronda anterior) → recalculado
    con el nuevo 0.64 dentro de `LILY_PAD_BOOST_DISTANCE` para que el
    camino de monedas siga terminando justo donde de verdad se para el
    impulso.
  - **Obstáculos laterales menos recortados**: "los obstáculos de los
    laterales empiezan muy recortados. Que no se recorten tanto".
    `reef_boulder_rock` se anclaba al borde con un inset de solo ∓0.02
    (`edgeX`/`fromEdge` en `ReefTemplates.ts`), dejando la mitad de la
    roca fuera del área jugable. Nueva constante compartida
    `EDGE_INSET=0.07` (∓0.07, más del triple) usada tanto por `edgeX`
    (diagonalLeft/centerTwoPaths/sCurveEdges) como por el inset de
    `lateralWall` — se ve bastante más roca de verdad dentro de la
    pantalla sin dejar de leerse pegada al borde. Verificado con captura
    de una roca real en juego.
  - `npx tsc --noEmit` limpio. Playtest automático sigue completando el
    recorrido sin errores.
- **Cinco pedidos más en un solo mensaje**: "Haz los animales un 20% más
  pequeños todos menos el erizo y la medusa. luego los objetos del
  lateral vuelvo y te digo ponlos más para dentro, no se ven nada de nada
  o solo lateral puntita se alcanza a ver en el cel. Y crea más. Luego
  obstáculos con erizos me gusta más, una zona donde haya dos erizos o
  tres en línea y solo haya como un hueco pequeño y ese hueco abajo un
  nenúfar. QUITA LAS BURBUJAS QUE SON PEQUEÑITAS que aún está ese power
  up, no lo quiero y la velocidad de la cámara un poco más rápida".
  - **Animales -20% (menos erizo y medusa)**: `SHARK_SCALE`,
    `SQUID_SCALE`, `BIG_FISH_SCALE` ×0.8 — `URCHIN_SCALE`/
    `JELLYFISH_SCALE` sin tocar, excluidos explícitamente. Verificado
    leyendo el `.scale` real de un sprite de cada uno en juego (con el
    jitter propio de cada spawner, todos caen dentro del rango esperado
    para el valor nuevo/viejo según corresponda).
  - **Objetos laterales bastante más adentro**: el `EDGE_INSET=0.07` de
    la ronda anterior seguía sin verse en un móvil real ("no se ven nada
    de nada o solo lateral puntita"). Subido a `0.18`, y además el resto
    de piezas "obstacle" de cada plantilla (ramas/estrella/piedra, no las
    de fondo/decoración lejana) suben su propio `fromEdge` un +0.08
    parejo — para que se meta más adentro toda la masa del cúmulo, no
    solo la roca. Comprobado que la ruta guía de cada plantilla sigue con
    margen de sobra respecto a las nuevas posiciones (a mano, revisando
    cada plantilla).
  - **"Y crea más"**: interpretado como más presencia de cúmulos de
    arrecife que el resto de peligros (no se deshizo el ×3.2 de espaciado
    general de la ronda anterior, que sí sigue aplicando a medusa/erizo/
    tiburón/calamar/pez grande) — `REEF_CLUSTER_MIN_GAP`/`MAX_GAP` bajan
    un 40% extra sobre ese valor. Si la intención era otra (más piezas
    por cúmulo en vez de más cúmulos), decírmelo para ajustar.
  - **Nuevo combo "erizos en línea + hueco + nenúfar"**: nuevo tipo
    `"lilypad"` en `Zone1LevelEntry`, nuevo `LilyPadSpawner.spawnExact(y,
    x)` (mismo criterio de nombre que el resto de spawners). Dos
    instancias en `Zone1Level.ts`: 3 erizos en línea (x=120/290/460) con
    un nenúfar marcando el hueco entre el 1º y 2º (x=205, justo antes en
    altura), y más adelante una versión de 2 erizos (x=220/470) con
    nenúfar en medio (x=345). Verificado leyendo las posiciones reales en
    juego (coinciden exactas con el diseño) y comprobando que el cuerpo
    físico de Lumi, colocada en el hueco marcado, NO se solapa con
    ninguno de los erizos de esa fila.
  - **Power-up de boost (burbujas pequeñas) eliminado del todo**:
    `BoostPickupSpawner.ts`/`BoostPickup.ts` borrados, toda su
    instanciación/overlap/update en `PondScene.ts` retirada,
    `Lumi.triggerSuperBoost` borrado, `boost_bubble` ya no se carga en
    `BootScene.ts`, y las constantes `BOOST_PICKUP_*`/`SUPER_BOOST_*` de
    `GameConfig.ts` se retiran (dejando solo un aviso de por qué). El
    nenúfar normal y su propio impulso (`triggerBoost`/
    `LILY_PAD_BOOST_MULT`) NO se tocan, son cosas distintas. Verificado:
    `"boostPickupSpawner" in scene` da `false` en juego, y ninguna
    referencia queda en el código (`grep` limpio salvo el comentario
    explicativo).
  - **Cámara un poco más rápida**: `CAMERA_RISE_SPEED_START`/`MAX` ×1.15
    (un empujón modesto, no otro salto grande).
  - `npx tsc --noEmit` limpio. Playtest automático sigue completando el
    recorrido sin errores.
- **Ronda de corrección tras feedback duro del usuario** ("le falta mucho
  mucho mucho... no sé qué le falta pero le falta algo"), a partir de dos
  capturas reales de móvil. En vez de seguir ajustando números a ciegas, se
  auditó el código en busca de bugs reales de comportamiento — se
  encontraron varios:
  - **Hitbox de medusa/erizo rota de verdad** (esto es probablemente lo que
    el usuario percibía como "las físicas no funcionan"): `Jellyfish`/
    `Urchin` usan `StaticBody` y movían `sprite.x/y` a mano para el vaivén
    (hasta ±95px en el patrón "deriva_amplia"), pero un `StaticBody` de
    Arcade Physics NO resincroniza su posición solo porque se mueva el
    `GameObject` — a diferencia de un body dinámico (tiburón/calamar/pez
    grande), que sí se resincroniza solo cada step y por eso esos tres iban
    bien. El body estático se quedaba clavado en el punto de spawn: Lumi
    podía morir lejos de la medusa visible, o cruzarla ilesa. Arreglado en
    `Jellyfish.update`/`Urchin.update`: en vez de asignar `sprite.x/y`
    directo, se llama a `body.reset(x, y)` (API de Phaser para
    `StaticBody`), que reposiciona GameObject+body a la vez conservando el
    `setSize`/`setOffset` ya ajustado al dibujo real. Verificado en juego:
    el centro del body ahora sigue al sprite frame a frame (antes se
    quedaba fijo).
  - **"El tiburón solo recorre un tramo muy pequeño"**: cierto —
    `SHARK_PATROL_RANGE` (260px a cada lado del spawn) quedaba recortado
    por los márgenes del mundo en la mayoría de puntos de aparición
    (spawnea entre 0.3-0.7 de `WORLD_WIDTH`), así que en la práctica
    cubría ~55% del ancho del mundo en vez de sentirse como una patrulla de
    punta a punta. Subido a 1000 (mayor que el propio `WORLD_WIDTH`), así
    el recorte a los márgenes garantiza que siempre cubre casi todo el
    ancho, sea cual sea su x de spawn. Verificado registrando su x cada
    200ms durante 4s: recorrió de 564 a 88 (casi todo el rango 80-610).
  - **"Piezas laterales que se ven como un glitch"**: las capturas del
    usuario mostraban un borrón translúcido superpuesto a Lumi/estrella —
    eran las piezas `role:"background"` de `reef_boulder_rock` (escala
    0.08-0.09, alpha 0.35-0.4) que se añadieron rondas atrás como "eco de
    profundidad" en `diagonalLeft`/`centerTwoPaths`/`lateralWall`. En la
    práctica, una roca borrosa y pequeña superpuesta al cúmulo principal se
    lee como un error de render, no como fondo lejano. Se retiraron las 3
    (el resto de cada plantilla, que ya eran obstáculos reales a opacidad
    completa, no se toca).
  - **Fondo sin sensación de continuidad** (tarea pendiente desde hace
    rondas, "no se lee como infinito con decoración continua"): confirmado
    que `rocks_back`/`distant_plants`/`foreground_plants` se colocan UNA
    sola vez cerca de `START_Y` y quedan atrás para siempre al subir (por
    diseño, como el suelo en Doodle Jump) — pero eso deja el resto de la
    escalada como solo el tile de cielo/agua más la fauna dispersa, sin
    ninguna decoración ambiental en los tramos largos entre cúmulos de
    arrecife. Nuevo `AmbientDecorSpawner.ts`: reutiliza EXACTAMENTE los
    mismos assets ya cargados para el arrecife (`reef_boulder_rock`,
    `decor_pebble`, `decor_starfish` — cero arte nuevo, cumpliendo
    CLAUDE.md), pegados de verdad al borde del mundo (0-5% del ancho, muy
    por fuera del `EDGE_INSET` de 0.18 de los obstáculos reales) a escala
    pequeña y opacidad 0.3-0.45, sin colisión, reciclándose con el mismo
    patrón que el resto de spawners (`highestY` + lookahead + despawn).
    Verificado en juego que aparecen solo pegados al borde (x=9/15/20/24/29
    sobre 690, y x=684 en el lado derecho) y que el playtest automático
    sigue completando el recorrido sin errores.
  - **Erizos más separados**: pedido explícito ("los pinchos un poco más
    separados") — `URCHIN_MIN_GAP`/`MAX_GAP` ×1.4. No afecta al combo
    "erizos en línea + hueco + nenúfar" scripteado a mano, que tiene sus
    propias posiciones fijas en `Zone1Level.ts`.
  - `npx tsc --noEmit` limpio. Playtest automático completa el recorrido
    sin errores en dos corridas distintas.
- **Línea horizontal dura en el fondo** (nueva captura del usuario tras la
  ronda anterior — "no me refiero a la medusa, el fondo es lo que digo yo,
  hay una línea en el fondo"). Diagnóstico con datos, no a ojo: el borde
  superior de `background_far.png` es notablemente más claro (RGB
  ~214,239,249) que el inferior (~160,200,216) — un salto real de ~50
  unidades por canal — y como `ParallaxLayer` lo repite (tile) verticalmente
  sin parar mientras la cámara sube, cada empalme entre una copia y la
  siguiente se ve como un corte de color duro. Reproducido en el juego a la
  misma altura de la captura del usuario (Altura 174) — sale idéntico.
  - Se probó primero corregir el borde vía el flujo de `lumi-asset-gen`
    (Gemini, 2 intentos con prompts cada vez más específicos) pero el
    modelo no puede garantizar un empalme EXACTO a nivel de píxel — ambos
    intentos dejaban un salto visible, más suave pero real.
  - Solución final: procesamiento de imagen determinista (no IA), sobre el
    asset original: los ~220px superiores e inferiores se funden hacia un
    color objetivo compartido (el promedio de ambos bordes), con una curva
    `smoothstep`, dejando el tercio central (los rayos de luz) intacto. Al
    converger ambos bordes exactamente al mismo color, la fila final de una
    copia y la fila inicial de la siguiente quedan matemáticamente
    idénticas — empalme perfecto por construcción, no por aproximación.
    Esto es corrección técnica de un asset ya existente (ajustar
    iluminación de sus bordes para que tilee), no diseño nuevo ni arte
    generado — respeta CLAUDE.md.
  - Verificado: capturas apiladas de dos copias antes/después (el salto
    desaparece del todo) y captura in-game a 4 alturas distintas cubriendo
    varios ciclos de repetición (incluida la altura exacta de la captura
    del usuario) — ninguna muestra ya la línea. `npx tsc --noEmit` limpio,
    playtest automático completa el recorrido.
  - Original respaldado en `/tmp/gen_test/background_far_ORIGINAL_BACKUP.png`
    (fuera del repo) por si hiciera falta comparar o revertir.
- **Rediseño de animales/obstáculos/monedas + nuevo enemigo** (pedido
  explícito: "REDISEÑA TODOS LOS ANIMALES Y OBSTACULOS, MONEDAS... VEAS QUE
  NUEVOS ENEMIGOS HACER"). Se mantiene la regla de siempre: Lumi intocable.
  Decisión deliberada de NO regenerar jellyfish/shark/squid/urchin/fish_05
  a ciegas: revisados uno a uno, ya cumplen el estilo y nunca recibieron
  una queja visual en toda la sesión (solo de comportamiento, ya
  arreglado) — redibujarlos sin un problema identificado arriesgaba una
  regresión y romper sus hitbox ya calibradas, sin beneficio claro. La
  libertad creativa se canalizó donde sí había hueco real: una moneda sin
  carácter, y "qué nuevos enemigos hacer" es en sí mismo contenido nuevo.
  - **Moneda rediseñada** (`coin.png`): antes una esfera/perla lisa sin
    lectura de "tesoro"; ahora perla nacarada cálida con un destello de 4
    puntas marcado — se lee como objeto valioso incluso a 41px (tamaño real
    en juego). 2 intentos previos descartados por perder la calidez de
    color o el destello; el 4º combinó ambos.
  - **Cangrejo, sexto enemigo nuevo** (`crab.png`/`crab_blink.png` +
    `entities/Crab.ts` + `systems/CrabSpawner.ts`): mecánica de movimiento
    propia, distinta a los 5 peligros existentes — quieto una pausa breve,
    ráfaga corta y rápida (con squash/stretch), quieto otra vez. Patrulla
    todo el ancho del mundo desde el primer momento (aprendida la lección
    del tiburón esta sesión, ver ronda anterior). Debut scripteado en
    `Zone1Level.ts` (offset 18500), tipo `"cangrejo"` añadido a
    `DeathReason`/`DEATH_MESSAGES`. Verificado en juego: patrón pausa/
    ráfaga confirmado leyendo su velocidad cada 200ms, hitbox correcta (ver
    bug de escalado más abajo).
  - **2 piezas nuevas de arrecife**: `decor_shell` (asset ya existente,
    aprobado en estilo, que se había quedado sin usar — se reintegra como
    obstáculo real en `centerTwoPaths`) y `anemone` (arte nuevo, un
    ramillete de tentáculos ondulados — añadida a `diagonalLeft`). Ninguna
    reemplaza `coral_branch`/`boulder_rock`, que el usuario ya aprobó
    explícitamente en rondas anteriores.
  - **Bug real encontrado al verificar el cangrejo, con impacto en
    tiburón/calamar/pez grande**: un `Body` dinámico de Arcade Physics
    sincroniza `width`/`height`/`offset` con el scale ACTUAL del sprite en
    cada `preUpdate` (multiplica `sourceWidth` por el scale vigente). El
    código de Shark/Squid/BigFish (y el Crab, escrito copiando el mismo
    patrón) pre-multiplicaba manualmente por `scale` en `setSize`/
    `setOffset` — el resultado quedaba al CUADRADO del scale desde el
    segundo frame en adelante. Verificado en el tiburón real: con
    scale~0.18, el hitbox esperado era ~103px de ancho y el real medía
    ~22px — casi 5 veces más pequeño de lo previsto, durante TODA la
    sesión. El "probe" que originalmente justificó pre-multiplicar (ver
    rondas antiguas) solo midió el primer frame, antes de que Phaser
    aplicara su propio ajuste automático. Corregido en los 4 archivos:
    ahora `setSize`/`setOffset` reciben las dimensiones NATIVAS sin
    multiplicar, dejando que Phaser aplique el scale correcto solo (esto
    también corrige, de regalo, que el pulso de cola del tiburón nunca
    afectaba a su hitbox — ahora sí, cada frame). Jellyfish/Urchin usan
    `StaticBody`, que no tiene este mecanismo — su multiplicación manual
    seguía y sigue siendo correcta, no se tocaron.
  - Verificado: `npx tsc --noEmit` limpio, build de producción real
    (`GITHUB_PAGES=true vite build`) incluye todos los assets nuevos,
    playtest automático completa el recorrido, capturas del cangrejo y las
    piezas nuevas en juego, y lectura directa de `body.width` antes/después
    del fix confirmando el valor correcto en tiburón y cangrejo.
- **Rediseño completo de obstáculos de arrecife** (pedido explícito:
  "REDISEÑAME TODOS LOS OBSTACULOS. PONLE UNA BASE O SIN BASE... CREA
  MUCHOS MAS OBSTACULOS. PERO NO LOS ACUMULES TODOS EN UN MISMO SITIO").
  - **`reef_boulder_rock` rediseñado**: el original era un montículo
    triangular con musgo solo arriba y una base plana clara de "apoyado en
    el suelo" — al rotarlo 90º/-90º para pegarlo a los laterales (pedido
    de rondas anteriores) se veía mal (musgo de lado, base plana vertical).
    Nuevo diseño: cúmulo de 4 rocas redondeadas en bloque compacto casi
    circular, musgo y coral repartidos por todo el contorno de forma
    pareja, sin base ni silueta de "apoyado en el suelo". Verificado
    rotando el PNG 90º y comprobando que se sigue leyendo bien.
  - **4 piezas nuevas** (todas omnidireccionales, sin base):
    `coral_fan` (abanico de coral radial), `sponge` (cúmulo de esponjas
    tubulares), `barnacle` (cúmulo de balanos, perfectamente circular),
    `giant_clam` (almeja gigante). Cada una pasó por el mismo pipeline de
    generación + limpieza de transparencia que las rondas anteriores
    (varios intentos descartados por huecos de fondo atrapados entre
    ramas, corregidos a mano con la misma técnica de la ronda del cangrejo).
  - **Redistribución de piezas entre las 4 plantillas** (pedido explícito:
    "no los acumules todos en un mismo sitio, piensa dónde poner cada
    uno"): antes `decor_starfish`/`decor_pebble` se repetían en las 4
    plantillas sin variar — ahora cada plantilla tiene su propio reparto
    único (`diagonalLeft`→anémona; `centerTwoPaths`→concha+piedra;
    `sCurveEdges`→esponja+balanos; `lateralWall`→abanico de coral+almeja+
    estrella), sin que ninguna pieza secundaria se repita en más de una
    plantilla. Primer intento de `diagonalLeft` con anémona+abanico juntos
    quedó demasiado amontonado (verificado con captura) — se corrigió
    dejando una sola pieza grande de acompañamiento por plantilla y
    moviendo el abanico a `lateralWall`, que tiene más banda vertical
    libre para repartir piezas sin agolparlas.
  - Verificado: `npx tsc --noEmit` limpio, build de producción real
    incluye las 5 imágenes nuevas, playtest automático completa el
    recorrido, y capturas de las 4 plantillas confirmando composición
    legible y sin amontonamiento.
- **Segunda pasada: seguía viéndose amontonado, y rediseño de los 4
  "corales rama"** (pedido explícito: "pones todos los obstaculos encima
  de otros todos juntos... no queda bonito asi todo apeñuzcado... REDISEÑA
  TODOS LOS CORALES TMB PARA QUE NO IMPORTA COMO SE PONGAN QUEDEN BIEN").
  - **`reef_coral_branch`/`reef_branch_straight`/`reef_branch_hook`/
    `reef_branch_short` rediseñados por completo**: los 4 eran un brazo
    largo y direccional con coral concentrado solo en una punta — el MISMO
    problema estructural que ya se arregló en `boulder_rock` (una
    composición pensada para un contexto fijo, no reutilizable en
    cualquier orientación). Nuevos diseños, todos cúmulos compactos y
    omnidireccionales: arbusto de coral rosa, coral cerebro lavanda/verde,
    bola de coral tubular, bola de coral de encaje fino. Dos de los 4
    tuvieron huecos de fondo atrapados entre ramas que se corrigieron con
    la misma técnica de rondas anteriores (uno necesitaba SOLO el borde
    limpio, el otro — el de encaje, con huecos intencionados entre
    ramitas — necesitaba también limpiar el interior, al revés que el
    resto de esta sesión: ahí el hueco blanco SÍ era el defecto, no un
    detalle real).
  - **Causa real del amontonamiento, encontrada con capturas**: las piezas
    viejas eran un brazo delgado — poca "masa" pintada por unidad de
    escala nominal. Las piezas nuevas (rediseñadas sin base + las 4
    piezas nuevas de la ronda anterior) son cúmulos redondos y rellenos:
    a la MISMA escala nominal ocupan muchísimo más espacio en pantalla —
    confirmado con una captura donde una sola pieza de coral llegaba a
    ocupar más de media altura de pantalla ella sola. Se añadió
    `GLOBAL_PACK_SCALE` (×0.5) en el único punto por el que pasan todas
    las piezas (`piece()`), en vez de recalcular a mano decenas de valores
    — deja cada pieza en ~110-150px de lado, similar al tamaño ya
    aceptado de un erizo/medusa.
  - **Reposicionamiento puntual** en las 4 plantillas: las piezas de
    acompañamiento (antes pegadas a 90-150px del cúmulo principal) se
    movieron a los extremos menos ocupados de cada banda vertical (p.ej.
    la anémona de `diagonalLeft` pasó de estar pegada a la roca+rama a ir
    arriba del todo, lejos de ambas).
  - Verificado con una nueva utilidad de captura que aísla una sola
    plantilla a la vez (forzando el cursor interno del spawner lejos antes
    de generarla, para que la cadencia automática no rellene cúmulos de
    más en el encuadre): las 4 plantillas se ven ahora con piezas
    separadas y legibles, ninguna domina la composición. `npx tsc
    --noEmit` limpio, build de producción real, playtest automático
    completa el recorrido.
- **El usuario reportó "otra vez ese bug" tras el fix anterior** — el
  workflow de GitHub Actions confirmó que el deploy de ese commit se
  completó bien (`success`), así que el archivo corregido SÍ estaba
  publicado. La causa real, más grave que el propio empalme: `vite.config.ts`
  sirve `/assets` como directorio público con nombres de archivo fijos (sin
  hash de contenido), así que cuando se corrige un PNG ya publicado, la URL
  no cambia — el navegador del móvil (y cualquier CDN delante de GitHub
  Pages) puede seguir sirviendo la versión vieja cacheada indefinidamente.
  Esto probablemente explica más de un "no veo el cambio" a lo largo de la
  sesión, no solo este caso. Arreglado de raíz: `vite.config.ts` inyecta
  `__ASSET_VERSION__` (timestamp del build) vía `define`, y `assetPath()`
  lo añade como `?v=...` a toda URL de asset — cada build/deploy nuevo
  fuerza a descargar todo de cero, sin tener que renombrar ningún archivo.
  Verificado: build de producción real (`GITHUB_PAGES=true vite build`)
  muestra las URLs con `?v=<timestamp>`, dev server sirve todos los
  assets con normalidad con el query string añadido, y el playtest
  automático completa el recorrido sin errores.
- **Rediseño del fondo de cielo/agua — libertad creativa total** (pedido
  explícito del usuario: "reestructurémoslo todo... te dejo el control
  creativo a ti para que con el API de Gemini crees lo que te venga en
  gana"). Se mantiene la única regla que el propio usuario escribió en un
  momento sereno (`CLAUDE.md`): Lumi no se rediseña bajo ninguna
  circunstancia — esta ronda toca solo el entorno.
  - Diagnóstico de por qué el fondo anterior (`background_far.png`, un haz
    de luz bajando desde un punto fijo arriba) seguía dando problemas de
    empalme incluso ya "arreglado": es una composición DIRECCIONAL (más
    clara arriba, más oscura abajo) — ese tipo de composición no puede
    tilear verticalmente sin costura por diseño, por bien que se ajusten
    los píxeles del borde. Cualquier parche era pan para hoy, hambre para
    mañana.
  - Solución de raíz: 3 fondos NUEVOS generados con Gemini
    (`background_shallow`/`_mid`/`_deep`), diseñados desde el prompt para
    ser manchas de acuarela sin foco de luz ni horizonte (composición
    "nebulosa/papel marmolado", iluminación pareja de esquina a esquina) —
    tilean bien por construcción, no por parche. Aun así, cada uno pasa
    por el mismo post-proceso determinista de la ronda anterior (bordes
    superior/inferior fundidos a un color objetivo compartido) como red de
    seguridad matemática, verificado con capturas apiladas de dos copias
    para las 3 (sin costura visible en ninguna).
  - `ParallaxLayer.ts` reescrito para soportar varias variantes con
    crossfade de alpha según la altura (offset de mundo), en vez de un
    único TileSprite fijo — cada variante se funde in/out en una banda de
    2000px alrededor de su propio umbral, usando los MISMOS umbrales que
    `ZoneConfig` (Arrecife a Altura 750 = offset 7500, Océano abierto a
    2000 = offset 20000), así el fondo ahora progresa en sintonía con el
    nombre de zona que ya se mostraba en el HUD. `background_far.png`
    retirado del todo (`git rm`), `BootScene.ts`/`PondScene.ts`
    actualizados a los 3 nuevos assets.
  - Verificado: `tsc --noEmit` limpio, build de producción real
    (`GITHUB_PAGES=true vite build`) incluye los 3 PNGs nuevos, playtest
    automático completa el recorrido, y capturas en 3 alturas (0, 900,
    2200) muestran la transición Estanque→Arrecife→Océano abierto fluida
    y sin ninguna costura, con el nombre de zona del HUD cambiando en
    sincronía.

# PENDIENTE

- Una vez el Tramo 1+2 esté aprobado y estable: variaciones del mismo
  esqueleto para que no sea idéntico entre intentos (pedido explícito,
  para después).
- Arte y diseño propios para la Zona 2 ("Arrecife") en adelante.
- Conectar la animación de "dormir" (`sleep/`, el asset ya existe) a un trigger
  real de inactividad del jugador — hoy no se usa en ningún sitio del código.
- Revisar el resto del checklist de animación por criatura de la revisión de
  Zona 1 (más allá del parpadeo, que ya está) si se retoma esa pasada.
- La continuidad del fondo tuvo una primera pasada (`AmbientDecorSpawner`,
  ver EN PROGRESO) reutilizando assets ya existentes — si al usuario le
  sigue faltando densidad/variedad tras probarlo en el móvil, iterar sobre
  `MIN_GAP`/`MAX_GAP`/`KEYS` de ese spawner antes que sobre nada más.

# BUGS / PROBLEMAS

(ninguno abierto conocido a fecha de esta ronda — ver EN PROGRESO para los
que se cerraron)

# PRÓXIMA TAREA

Esperar la reacción del usuario a esta ronda de correcciones (hitbox de
medusa/erizo, patrulla del tiburón, piezas-glitch retiradas, fondo con
`AmbientDecorSpawner`, erizos más separados) probada en su móvil real.
Según lo que diga:
- Si el juego ya "se siente vivo": retomar el roadmap normal — Tramo 2 en
  adelante, variaciones de esqueleto, Zona 2.
- Si sigue faltando algo puntual: pedir que describa el momento exacto
  (altura/zona/qué estaba haciendo) en vez de re-tunear números a ciegas —
  ya se agotó ese enfoque una vez esta sesión sin resultado.
