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
- **Corte visible en las algas de decoración** (reportado con captura real
  por el usuario): `distant_plants`/`foreground_plants` (`CrossfadePlant`)
  se anclan a una posición fija del mundo sin tilear, así que su propio
  borde superior podía quedar al descubierto dentro de la ventana visible
  antes de que la cámara terminara de dejarlas atrás. No se pudo aislar la
  causa exacta pixel a pixel (varias hipótesis descartadas: recorte duro
  en el PNG — los bordes superiores son transparentes; solape entre
  `reef_maze_wall` de un mismo cluster — reproducido solo como artefacto
  de test, no en juego real), así que se aplicó el arreglo que el propio
  usuario pidió explícitamente ("baja las algas para que no se note eso"):
  `CrossfadePlant` ahora soporta `setScale()`, y ambas capas se agrandaron
  (1.4x/1.5x) y se bajaron más dentro del mundo (0.55/0.7 de la altura de
  cámara en vez de 0.38/0.55). Verificado sin hueco visible al inicio de
  partida y a lo largo de todo un barrido de `scrollY` congelado.
- **4ª variante de fondo de cielo/agua: `background_abyss`** (pedido
  explícito "hazas fondos para más arriba" — el recorrido escalable ya
  llega a offset ~38060 pero el fondo tope anterior, `background_deep`,
  entraba a los 20000 y no cambiaba más allá). Generado con Gemini con las
  mismas referencias y técnica que `background_shallow/mid/deep` (manchas
  de acuarela difusas, sin foco de luz ni horizonte, sin ningún trazo/
  línea dibujada encima — la primera generación sí traía líneas finas tipo
  grieta y se rechazó), en una paleta más oscura (índigo/morado casi
  negro, ~18% más oscura que `background_deep`). Se descubrió que los 3
  fondos existentes tienen el borde superior e inferior con el MISMO color
  exacto (diff 0.0 por canal) — una técnica de tileado sin costura ya
  usada pero no documentada — y se replicó aplicando un degradado lineal
  por fila (`fila/alto * diferencia`) que fuerza esa misma igualdad sin
  alterar visualmente el resto de la imagen (diff bajó de ~30 a <1 por
  canal). Verificado con un composite apilado (misma técnica que el
  arreglo histórico de `background_far.png`) sin salto visible, y en el
  propio juego, forzando la cámara a distintas altitudes: crossfade limpio
  `background_deep` → `background_abyss` entrando a offset 30000 (justo
  antes del tinte de la Zona 4 "Aguas profundas", a 37500).
- **Corte cuadrado en `reef_maze_wall_shell`/`reef_maze_wall_sponge`**
  (reportado con captura real: "estas cosas se ven el corte"). Causa real
  encontrada: a diferencia de `reef_maze_wall` (rectángulo 1344×768, borde
  irregular en un lado, pero on-screen ocupa casi toda `CORRIDOR_BAND_SPACING`
  así que sus otros 3 bordes duros casi nunca se ven), `reef_maze_wall_shell`/
  `_sponge` son un lienzo CUADRADO (1024×1024): con el mismo `edgeReach`,
  su extensión on-screen queda en ~384px, muy por debajo de
  `CORRIDOR_BAND_SPACING` (700) — dejando sus otros 3 bordes (duros, a
  sangre completa) muy expuestos contra el agua abierta. `reef_maze_wall_shell`
  encima solo tenía TRANSPARENCIA REAL en 0 de sus 4 bordes (ni siquiera el
  de "alcance") — el más roto de los dos. Arreglado en dos pasos: (1)
  generado con Gemini un borde festoneado limpio (conchas de altura
  desigual con hueco transparente real entre ellas, mismo criterio que
  `reef_maze_wall`/`_sponge`) tras 2 intentos fallidos (uno sin canal alpha,
  otro con relación de aspecto equivocada) — el 3er intento sí sirvió,
  recortado a cuadrado y reescalado a 1024×1024 preservando proporciones;
  (2) aplicado ese MISMO perfil de festoneado (reutilizado, no una nueva
  generación) también a los bordes izquierdo y derecho de AMBAS texturas
  (shell y sponge — sponge ya tenía su borde superior bien pero los otros 3
  igual de duros/expuestos), dejando solo el borde inferior a sangre
  completa (el que de verdad queda oculto contra el borde del mundo, ver
  `edgeFlush`). Verificado con composite en magenta y en el propio juego
  forzando `reefClusterSpawner.spawnExact` con las plantillas shellMaze/
  spongeMaze/reeflabyrinth una al lado de otra para comparar: ya no se lee
  un rectángulo con esquinas duras, silueta festoneada en los 3 lados
  expuestos igual que el resto de paredes de laberinto.
- **Moneda rediseñada**: pedido explícito "que sean doradas redonditas y
  que tengan el relieve de la cara de lumi frontal y que sean todas del
  mismo tamaño". Nuevo `coin.png` generado con Gemini (disco dorado
  metálico, cara de Lumi grabada en relieve en tonos dorados —no rosa—,
  contorno lavanda, mismo destello que la moneda anterior), usando el
  crop de la carita de Lumi de `idle_01.png` como referencia de qué
  grabar. Además, `CoinPickup.update()` tenía un "destello de giro" que
  oscilaba solo la escala X (simulando un spin) — eso hacía que dos
  monedas vistas en el mismo instante, cada una con su propia fase
  aleatoria, se leyeran de tamaño distinto; quitado del todo, ahora el
  tamaño es `COIN_SCALE` fijo siempre (verificado programáticamente: todas
  las monedas activas en juego con `scaleX === scaleY === COIN_SCALE`).
- **Nenúfar sobre un obstáculo**: pedido explícito con captura real ("si
  hay un obstáculo obstruyendo el propulsor del nenúfar, obviamente no se
  pone"). `LilyPadSpawner` colocaba nenúfares en X aleatoria sin ninguna
  noción de `ReefCluster`/`ReefClusterSpawner` — podía coincidir con un
  cúmulo o pared de laberinto real. Añadido `ReefClusterSpawner.
  overlapsObstacle(x, yTop, yBottom, halfWidth)`, que comprueba la caja de
  colisión REAL (ya rotada/escalada) de cada pieza de cada cúmulo activo
  contra un rectángulo — el nenúfar en sí MÁS toda la columna que recorre
  su propio impulso hacia arriba (`LILY_PAD_BOOST_DISTANCE`), no solo el
  punto donde se dibuja. `LilyPadSpawner` prueba hasta 8 posiciones X al
  azar por altura y usa la primera libre; si ninguna sirve, ese nenúfar
  simplemente no aparece esa vez (mejor saltarse uno que ponerlo mal). Los
  animales (medusa cerca de la salida de un laberinto, etc.) no se tocan
  — la petición del usuario explícitamente los deja fuera ("a no ser que
  sea un enemigo al final ese si se puede dejar"). Verificado con un
  stress test: 40 cúmulos/laberintos pegados cada 500px (mucho más denso
  que el juego real) + `LilyPadSpawner.update()` sobre todo ese rango —
  cero nenúfares solapando ningún obstáculo real, comprobado con la misma
  `overlapsObstacle` contra la caja física de cada pieza.
- **Segunda vuelta de feedback (con captura real) sobre la ronda
  anterior**: dos pedidos explícitos más.
  - "Las monedas... tienen que estar separadas todas la misma distancia
    una de la otra, MATEMÁTICAMENTE la misma": el paso recto (70) y el
    paso diagonal (hipotenusa ≈83.2, con 45 de paso horizontal fijo sobre
    el mismo paso vertical) no coincidían entre sí NI con
    `REEF_COIN_SPACING` (90, la separación real de los cúmulos de
    arrecife y del rastro de un nenúfar) — tres distancias distintas según
    qué sistema hubiera colocado la moneda. Unificado todo a la misma
    hipotenusa: recto usa paso vertical completo (90), diagonal reescala
    su vector al mismo ángulo de antes pero con longitud exactamente 90
    (`COIN_GROUP_DIAGONAL_DX/DY` en GameConfig.ts). Además, el balanceo
    vertical de cada moneda tenía una fase aleatoria por instancia —no
    afectaba dónde spawneaban, pero hacía que en cualquier captura
    congelada la distancia VISIBLE entre monedas vecinas pareciera variar
    (cada una en un punto distinto de su vaivén); quitada la fase, ahora
    todas comparten el mismo `sin(t)` y se mueven en bloque. Verificado
    programáticamente: distancia entre monedas consecutivas siempre 90.00
    exacto, tanto en grupos rectos como diagonales como en el rastro de un
    nenúfar.
  - "Los laberintos aún falta pulirlos más, parecen cuadrados todavía
    pegados. Que sea mucho mejor recortados": el arreglo de la ronda
    anterior (festonear los 3 bordes expuestos con un perfil fino) no fue
    suficiente — a la escala real en juego seguía leyéndose como un
    cuadrado con un mordisco pequeño. Encargadas piezas nuevas de cero:
    ya no son un mosaico cuadrado con las esquinas recortadas, son un
    MONTÍCULO de 3-4 lóbulos grandes y redondeados (mismo lenguaje visual
    que `reef_boulder_rock`), con margen transparente real de sobra
    alrededor — mismas conchas/esponjas, mismo estilo, solo la silueta
    exterior cambia. Como la silueta real ya no ocupa casi todo el lienzo
    (a diferencia de antes), `HITBOX_FRACTION` de ambas piezas en
    ReefCluster.ts se remidió sobre el contenido opaco real (antes
    asumía casi todo el lienzo) — necesario para que `edgeReach`/
    `edgeFlush` sigan calculando el alcance sobre la silueta
    redondeada de verdad y no dejen un hueco en el borde del mundo.
    Verificado en el propio juego: ya no se lee ningún cuadrado, y el
    body físico sigue llegando exactamente al borde del mundo (offset
    -10px de solape, igual que el resto de piezas `edgeFlush`).
- **Decimotercer enemigo: dragón marino** (pedido explícito: "un dragón
  marino Largo que vaya en vertical de lado a lado, pero que salga del
  mapa y reaparezca la otra parte en el otro lateral... que deje un hueco
  justo para que pase Lumi por ahí"). Arte nuevo con Gemini: un dragón/
  serpiente marina larga y sinuosa (referencias: mantarraya + caballito de
  mar, mismo estilo pastel/contorno lavanda), generado como un único
  dibujo de cabeza a cola y luego cortado en dos mitades (`sea_dragon_head`/
  `sea_dragon_tail`) por un punto estrecho del cuerpo en forma de S —
  `entities/SeaDragon.ts` las coloca compartiendo SIEMPRE la misma X, con
  un hueco vertical fijo (`SEA_DRAGON_GAP_HEIGHT`) entre ambas. Las dos
  mitades se deslizan juntas en X sin parar (`SEA_DRAGON_SPEED`) y NUNCA
  rebotan — al salir del todo por un lado del MUNDO (no solo de la cámara)
  la posición envuelve y reaparecen entrando por el lado contrario, un
  bucle infinito calculado con una única fórmula de módulo (sin guardar
  estado de "qué lado le toca ahora"). Dirección (izquierda/derecha) al
  azar por instancia, con el arte espejado a juego (mismo criterio que
  tiburón/caballito/mantarraya). Dos sprites físicos por instancia
  (`SeaDragonSpawner`, mismo patrón de reciclado que el resto de
  spawners, solo que añade/quita los DOS sprites juntos), con hitbox
  ajustada al bbox real de cada mitad (no al lienzo completo, que tiene
  mucho margen transparente por el serpenteo). Verificado: deslizamiento +
  envoltura (muestreo de X a lo largo de varios ciclos, sin saltos), hueco
  real en Y donde Lumi puede colarse (captura in-game), y colisión letal
  real contra cualquiera de las dos mitades (game over con mensaje propio).
- **Corrección del dragón marino: horizontal, hueco solo en la cola**
  (pedido explícito tras ver la ronda anterior: "me confundí, que sea
  horizontal. Y la separación sea de la cola nomas, no lo partas. Y hazlo
  animado bien bueno"). Rediseño completo, no un ajuste — tres cambios:
  - **Orientación**: el dragón ya no viaja vertical con el cuerpo de pie;
    ahora nada TUMBADO en horizontal, deslizándose de lado a lado como se
    pidió desde el principio, con la cabeza siempre por delante en la
    dirección de avance (rotación base ±90° según el signo de la
    dirección, derivado analíticamente de hacia dónde apunta el eje
    cabeza→cola del arte original y verificado en juego para ambos
    sentidos).
  - **El hueco es solo de la cola, no parte el cuerpo**: recorte nuevo del
    mismo dibujo (`sea_dragon_body.png`, cabeza+cuello+torso enteros sin
    cortar, reemplaza a `sea_dragon_head.png`) — el corte real ahora cae
    en la base de la cola (una sola hebra estrecha del serpenteo en S),
    no a media espalda como la primera versión. `sea_dragon_tail.png` es
    solo la punta de la cola enroscada. El hueco (`SEA_DRAGON_GAP_WIDTH`)
    separa cuerpo y cola, nunca corta dentro del cuerpo mismo.
  - **Animación real** ("hazlo animado bien bueno"): el cuerpo ondula
    suave alrededor de su ángulo base (`SEA_DRAGON_BODY_SWAY_AMPLITUDE`
    ±0.08 rad) mientras la cola azota con un latigazo mucho más marcado
    (`SEA_DRAGON_TAIL_WAG_AMPLITUDE` ±0.4 rad), cada una con su propio
    período y fase — ambas piezas usan origin por defecto (0.5/0.5) y
    recalculan cada frame el offset mundo→costura según su ángulo actual
    (`seamOffset`), así que la cola gira de verdad alrededor de su punto
    de unión con el cuerpo (bisagra), no alrededor de su propio centro
    geométrico. La hitbox física de cada pieza se calcula UNA sola vez
    sobre el ángulo BASE (sin el vaivén/latigazo) y solo su centro se
    reposiciona cada frame — mismo criterio que el resto de animales del
    juego, para no arriesgar una hitbox rota recalculando la AABB rotada
    en vivo sobre un ángulo que oscila constantemente.
  - Verificado en juego con Playwright: cuerpo horizontal con la cabeza
    liderando la dirección de avance (confirmado en ambos sentidos por
    separado, cada uno con una instancia distinta), cuerpo intacto sin
    ningún corte visible dentro de él, hueco real y legible únicamente
    entre el cuerpo y la cola (capturas), deslizamiento + envoltura sin
    saltos (una única transición limpia al cruzar el borde del mundo,
    igual que la versión anterior), vaivén del cuerpo y latigazo de la
    cola visibles frame a frame (ángulos muestreados a lo largo de varios
    segundos), y colisión letal confirmada contra el cuerpo (mensaje
    "¡Un dragón marino te ha atrapado!"). `npx tsc --noEmit` limpio, build
    de producción empaqueta `sea_dragon_body.png`/`sea_dragon_tail.png`.

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
- **Hueco visible en las piezas pegadas al lateral, arreglado de raíz** —
  pedido explícito del usuario tras varias rondas subiendo `EDGE_INSET` a
  ciegas (0.02→0.07→0.18) sin acertar: "A MI NO ME IMPORTA QUE TENGAN BASE
  Y SEAN LARGOS. LO QUE ME IMPORTABA ERA... QUE NO HAYA ESPACIOS VISIBLES
  SI TIENEN BASES ENTRE LA BASE Y EL LATERAL DE LA PANTALLA. ESA ES MI
  MAYOR PROBLEMA." Diagnóstico real (con `body.position.x`, no
  `getBounds()` — este último mide el frame completo del sprite,
  transparente incluido, y disimulaba el problema): con `EDGE_INSET=0.18`
  quedaba un hueco real de ~67px entre `reef_boulder_rock` y el borde del
  mundo. Una fracción fija nunca podía acertar porque el tamaño real de
  cada pieza cambia con `scale`, el jitter y la rotación.
  - Solución: `rotatedAABB()` (en `ReefCluster.ts`, compartida con el
    cálculo de hitbox ya existente) calcula la caja delimitadora real del
    recorte de textura ya rotado y escalado; `edgeFlushX()` usa eso para
    despejar la coordenada X exacta que deja el borde visible de la pieza
    tocando el límite del mundo, con un solape de 10px a propósito
    (invisible, fuera del mundo) para blindar contra el jitter de escala.
  - Nuevo campo `ReefPieceSpec.edgeFlush?: "left"|"right"` sustituye a los
    `edgeX()`/`fromEdge(...,EDGE_INSET)` que se ajustaban a ojo — los 4
    usos de `reef_boulder_rock` en `ReefTemplates.ts` (las 4 plantillas)
    lo usan ahora; `EDGE_INSET`/`edgeX` quedaron sin uso y se borraron.
  - Verificado con `body.position.x`/`width` (no capturas, que en esta
    sesión ya dieron falsos positivos y negativos varias veces): 36
    muestras independientes (las 4 plantillas × ambos lados × jitter de
    escala variado) dan exactamente el solape de 10px pedido, nunca un
    hueco. `npx tsc --noEmit` limpio, playtest automático sin errores.
- **Animación leve de "respiración" en las piezas de coral (no en las
  rocas)** — pedido explícito: "me gustaría que los que algunos tengan
  animación. LAS ROCAS NO. pero corales y tal estaria bien que tuvieran
  una leve animacion bonita." `reef_boulder_rock` y `decor_pebble` (las
  dos piezas que se leen como roca inerte) quedan fuera; el resto (las 4
  ramas de coral, anémona, abanico, esponja, balano, almeja, estrella,
  concha) pulsa de escala ±4% en un ciclo de 2.6-4.2s con fase aleatoria
  por pieza (para que no respiren todas sincronizadas).
  - Cuidado explícito con un bug ya conocido de esta sesión (#57, hitbox
    de medusa/erizo desincronizada de su sway visual): como el tamaño y
    offset del `StaticBody` de cada pieza son proporcionales a `scale` a
    rotación fija, `ReefCluster.update(time)` reescala el body por el
    mismo factor de pulso cada frame — sin repetir la trigonometría, y
    sin que la hitbox se quede fija mientras el dibujo respira.
  - Verificado midiendo `body.width`/`scaleX` en dos instantes separados
    por 1.2s en las 4 plantillas: el ratio de cambio del body coincide
    exactamente con el ratio de cambio de `scaleX`, confirmando que la
    hitbox sigue el pulso visual sin desincronizarse.
- **Composición del nivel enriquecida con el rol "background" ya existente
  pero sin usar** — pedido explícito: "MEJORARAS LA COMPOSICION DEL NIVEL
  TENIENDO EN CUENTA LAS NUEVAS MEJORAS... CREAME UN NIVEL ESPECTACULAR".
  `ReefCluster` ya tenía 4 capas de profundidad (fondo/decoración/
  obstáculo/primer plano) pero las 4 plantillas solo usaban "obstacle" —
  se añadió un acento de fondo (`bgAccent()`) por plantilla: una pieza
  pequeña, semitransparente (alpha 0.4) y sin colisión, en la esquina más
  despejada de cada composición, para sugerir que el arrecife sigue más
  allá del cúmulo jugable sin añadir dificultad ni amontonar el primer
  plano.
  - Verificado: `npx tsc --noEmit` limpio, playtest automático completa el
    recorrido sin errores, build de producción real
    (`GITHUB_PAGES=true vite build`) exitoso.
- **Variedad de rocas/corales en la pieza de pared lateral** — pedido
  explícito: "haz lo mismo con los corales... crea diferentes estilos de
  rocas... de distintos tamaños, más largas tmb pueden ser". Hasta ahora
  la pieza pegada al borde (`edgeFlush`) de las 4 plantillas era SIEMPRE
  `reef_boulder_rock`.
  - 2 estilos de roca nuevos generados con Gemini (mismas anclas de estilo:
    `boulder_rock.png` + `rocks_back.png`): `rock_slab` (repisa larga y
    plana, cresta de roca sumergida) y `rock_smooth` (un único bulto
    ovalado y liso, más simple que el cúmulo original) — bbox de
    `HITBOX_FRACTION` medido programáticamente sobre el alpha del PNG (no
    a ojo, para evitar el error de raspado que dejó pasar la textura del
    musgo transparente en `rock_slab` en el primer intento: `--report` de
    `fix_transparency.py` marcaba decenas de puntos sueltos del musgo como
    "agujero interior" — se aplicó solo `border_connected_mask`, sin el
    paso de agujeros interiores, tras confirmar con el composite en
    magenta que el musgo se veía perforado con el modo por defecto).
  - Nuevo `WALL_PIECE_POOL` en `ReefTemplates.ts`: cada uso de la antigua
    pieza fija ahora es `wallPiece(side, y, baseScale)`, que elige al azar
    entre las 2 rocas nuevas + `reef_boulder_rock` + los 4 corales rama
    (mismo criterio de "la base es la de abajo" que ya tenía la roca —
    `edgeRotation` gira la pieza entera, así que la base de fábrica de
    cualquier textura del pool queda contra el lateral sin necesitar
    flipX). `sizeMul` por pieza normaliza el tamaño visible entre texturas
    de proporción muy distinta (p.ej. `rock_slab` recorta a 1090×255px,
    casi el doble de ancho que el resto — bajado a `sizeMul: 0.6` para que
    no domine la banda vertical del cúmulo, quedando aun así claramente
    más larga y baja que las demás).
  - Verificado con el mismo método de esta sesión para el hueco lateral
    (nunca capturas): 60 muestras (`body.position`) repartidas en las 4
    plantillas y las 2 orientaciones, con las 7 piezas del pool
    representadas, dan siempre el solape de 10px exacto — cero huecos con
    ninguna combinación.
- **Dos tiburones patrullando en sentidos opuestos** — pedido explícito:
  "podemos poner dos tiburones seguidos en una zona con pocos obstáculos y
  que los dos patrullen pero vayan a la inversa". `Shark`/`SharkSpawner`
  aceptan ahora una `direction` opcional (antes siempre al azar 50/50);
  `Zone1LevelEntry` la expone para el nivel scripteado. El tramo entre los
  cúmulos de offset 7680 y 9920 (el más despejado del Tramo 1, ya tenía un
  único tiburón sin ningún otro peligro cerca) pasa a tener dos, uno con
  `direction: 1` y otro `direction: -1`. Verificado leyendo
  `body.velocity.x` tras un tick: signos opuestos, tal como se pidió.
- **Animación más visible en el erizo** — pedido explícito: "el erizo que
  tenga animación tmb". El bamboleo vertical que ya tenía (`BOB_AMPLITUDE`
  de solo 5px) era casi imperceptible a su escala; se añadió un pulso de
  escala leve (±6%, mismo criterio que la respiración de los corales) que
  reescala el `StaticBody` en la misma proporción cada frame para que la
  hitbox nunca se desincronice del dibujo (el bug que ya se arregló una
  vez para medusa/erizo, #57). La medusa (`Jellyfish.ts`) ya tenía bastante
  animación de fábrica (4 patrones de deriva + pulso de campana + balanceo
  + parpadeo) — no se tocó, se lo señalo al usuario por si se refería a
  otra cosa. Verificado midiendo `body.width`/`scaleX` en dos instantes:
  el ratio coincide exactamente, la hitbox sigue el pulso.
- **Erizos en línea más separados** — pedido explícito: "ponerlo un poco
  más separado del otro cuando están en línea que siguen muy juntos". El
  combo de 3 erizos (offset 4320, antes x=120/290/460, gap de 170px) dejaba
  solo ~26px de borde visible libre entre uno y el siguiente a
  `URCHIN_SCALE=0.17`; ahora x=100/300/500 (gap 200px) sube ese margen a
  ~56px. Mismo ensanche proporcional en el combo de 2 erizos (offset
  17440): x=220/470 → x=200/490.
  - Verificado: `npx tsc --noEmit` limpio, playtest automático completa el
    recorrido sin errores, build de producción real
    (`GITHUB_PAGES=true vite build`) incluye los 2 PNGs de roca nuevos.
- **Medusa "quieta" — diagnóstico real, no era un bug de verdad** — pedido
  explícito: "la medusa tiene animación pero se ve quieta, parece un bug".
  Medido en el motor (sprite.x/y/rotation/scale frame a frame): la
  animación SÍ corre — el problema es de percepción. Con
  `LUMI_SWIM_SPEED≈403px/s` y una cámara de ~720px de alto, una medusa
  pasa solo ~1.5-2s en pantalla (menos con impulso), mucho menos que el
  periodo original de sus ondas (`PULSE_SPEED=1.1` → ciclo de ~5.7s,
  `ROTATION_SPEED=0.4` → ~15.7s, patrones de deriva con periodos de
  11-18s). Si a una medusa le toca una fase inicial cerca de un pico/valle
  del seno (derivada ≈0), esa ventana tan corta de visibilidad cae en el
  tramo más plano de la curva y se percibe completamente quieta aunque el
  código sí la mueva. Arreglado subiendo la velocidad angular de las 4
  ondas (pulso, rotación, las 4 derivas) a periodos de 2.5-4s — nunca la
  amplitud, que ya se veía bien — para que el ciclo se note dentro de la
  ventana real de visibilidad pase lo que pase con la fase de spawn.
  Verificado: `sprite.x` de una medusa cambia ~84px en 1.5s tras el
  cambio (antes ~10px en el mismo intervalo).
- **Obstáculo "gauntlet" que ocupa casi todo el mapa** — pedido explícito:
  "uno que ocupe casi todo el mapa también y ese se coloque solito, que dé
  el espacio justo para que lumi tenga que recorrer un camino... como un
  pequeño recorrido al entrar al obstáculo". Nueva (5ª) plantilla de
  `ReefTemplates.ts`, `grandGauntlet`, deliberadamente distinta a las otras
  4 (que siempre dejan la mayor parte del ancho libre): 2 bloques enormes,
  uno entrando por la izquierda y otro por la derecha en una banda
  distinta, cada uno penetrando ~450px hacia el carril — cruzarla obliga a
  un recorrido diagonal real de un hueco al otro, no un simple esquive.
  - Nuevo mecanismo genérico en `ReefCluster.ts`: `edgeReach` — el
    complemento natural de `edgeFlush` (que calcula la X exacta a partir
    de un `scale` dado). `edgeReach` calcula el `scale` exacto a partir de
    una penetración (`reachPx`) deseada, midiendo `rotatedAABB` a escala 1
    y despejando — así el hueco libre siempre mide lo mismo sin importar
    qué textura le toque a cada banda.
  - Solo piezas de roca en el pool de esta plantilla
    (`reef_boulder_rock`/`reef_rock_smooth`/`reef_rock_spikes`) — nunca
    corales/ramas, que respiran con un pulso de escala en vivo: con un
    hueco ya de por sí ajustado, una hitbox que cambia de tamaño podría en
    el peor caso cerrar el paso. Con solo piezas sin animación de escala,
    el hueco es SIEMPRE exactamente el calculado, sin ninguna variable en
    vivo de por medio.
  - Verificado con `body.position` (nunca capturas, que en esta sesión ya
    dieron falsos resultados varias veces): 20 muestras dan un hueco
    mínimo de 227.6px (Lumi mide ~58px de hitbox, casi 4× de margen) y
    CERO solapamiento vertical entre las 2 bandas en todas las muestras —
    o sea, siempre existe un camino real. `edgeFlush` sigue exacto (0
    solape más allá de los 10px a propósito) en las 2 bandas.
- **Pieza nueva: `reef_rock_spikes`** — pedido explícito: "crea más rocas
  o pinchos en forma de obstáculo". Cúmulo de rocas puntiagudas (silueta
  claramente distinta de las otras 3 rocas, redondeadas/planas), generado
  con Gemini con las mismas anclas de estilo, añadido tanto al
  `WALL_PIECE_POOL` general como al pool exclusivo de `grandGauntlet`. Se
  generó también una variante de coral con puntas, pero se descartó por
  quedar demasiado parecida a `reef_coral_branch` ya existente — no
  aportaba variedad real.
  - Verificado: `npx tsc --noEmit` limpio, playtest automático sin
    errores, build de producción real incluye el PNG nuevo.
- **`grandGauntlet` corregido a `reefLabyrinth`: pasillo/laberinto de 3
  bandas, no "un obstáculo gigante"** — el usuario corrigió el diseño
  anterior: "yo me refiero que no sea un obstáculo en sí, sino como una
  especie de pasillos diseñados de manera igual bonita, que tenga que ir
  para al lado y luego arriba y luego lado otra vez y ya ahí salir...
  como un laberinto o algo así pero bien diseñado". El primer intento (2
  bandas, un único cruce en diagonal) se leía como "dos rocas enormes que
  esquivar", no como un pasadizo con recorrido propio.
  - Ahora son 3 bandas alternando de lado al azar (izquierda/derecha/
    izquierda o al revés, derivado del lado de la primera para garantizar
    el zigzag) en vez de 2 — el recorrido real es: hueco de la banda 1 →
    desplazamiento lateral + subida hasta el hueco de la banda 2 (lado
    contrario) → desplazamiento lateral + subida hasta el hueco de la
    banda 3 (vuelta al lado original) → salir. Reach bajado de 450 a
    400px (con 3 bandas ya no hacía falta ser tan extremo) y separación
    entre bandas subida a 700px, con margen de sobra para que ninguna
    banda vecina se pise en vertical (igual criterio de seguridad que
    antes, recalculado para 3 bandas).
  - Acentos de decoración (estrella, abanico de coral, concha — sin
    colisión) pegados a la punta de cada pared, junto a su hueco, para
    que se lea como un pasadizo cuidado y no como piedras sueltas — parte
    de "diseñados de manera igual bonita".
  - Verificado con `body.position` en las 3 bandas (20 muestras): hueco
    mínimo 281.7px (Lumi mide ~58px, ~4.9× de margen — aquí el reto es el
    recorrido en varios tramos, no la precisión del hueco), CERO
    solapamiento vertical entre bandas vecinas en las 40 comparaciones
    (banda1-2 y banda2-3 de cada muestra), y el patrón zigzag
    (izquierda/derecha/izquierda o al revés) se cumplió en las 20. `npx
    tsc --noEmit` limpio, playtest automático sin errores, build de
    producción real exitoso.
- **`reefLabyrinth` restaurado** — se había retirado del todo interpretando
  "las dos rocas gigantes no, déjalas como estaban antes" como un rechazo
  al cúmulo especial completo; el usuario aclaró después que seguía
  esperando verlo ("no me sale el laberinto ese que te dije grandote") —
  el mensaje anterior no era un rechazo del todo. Restaurado con `git
  revert` del commit que lo quitaba (recupera exactamente la versión de 3
  bandas en zigzag, sin volver a escribir el código a mano, para no
  arriesgar una re-implementación ligeramente distinta). Verificado de
  nuevo tras el revert: 20 muestras, hueco mínimo 280.2px, cero
  solapamiento entre bandas — mismas garantías que antes.
- **`reefLabyrinth` garantizado al principio del juego** — preguntado
  explícitamente tras la restauración ("¿quieres que te lo garantice
  mucho antes, para que lo veas enseguida al jugar?"), el usuario
  confirmó que sí. Nuevo "Tramo 0" en `Zone1Level.ts`: una única entrada
  `{ type: "reef", offset: 1200, reefTemplate: 4 }` antes que nada más —
  el laberinto es ya de por sí "difícil desde el minuto uno" y trae su
  propia ruta de monedas, así que no se le amontona ningún otro peligro
  encima.
  - Todo el Tramo 1/2 original se desplazó +2240 (mismo valor que ya usaba
    el nivel entre cúmulos consecutivos, para mantener el mismo criterio
    de espaciado) para dejarle sitio sin solapar bandas: el laberinto
    ocupa el rango de banda [250,2150] y el primer cúmulo del Tramo 1
    original (antes en offset 960, ahora 3200) queda en [2950,3450] — casi
    800px de margen libre entre ambos.
  - `CURRENT_ZONE_START_OFFSET` (dónde arranca la corriente de agua, en
    `GameConfig.ts`) era una fórmula duplicada e independiente de
    `ZONE1_LEVEL_END_OFFSET` (los mismos números, `6500*1.6*2`,
    mantenidos a mano en dos sitios) — se habría desincronizado de verdad
    con este cambio (la corriente habría empezado antes de que terminara
    el gauntlet final scripteado). Ahora se deriva directamente de
    `ZONE1_LEVEL_END_OFFSET` para que no puedan volver a desincronizarse.
  - Verificado en el motor (no solo en la spec): tras arrancar la escena
    sin tocar nada, las 3 bandas del laberinto son literalmente lo primero
    que coloca `ReefClusterSpawner` (antes que cualquier otro cúmulo del
    Tramo 1), con el espaciado de banda esperado (700px entre bandas). El
    playtest automático (zigzag aleatorio, no una IA que apunte al hueco)
    a veces muere dentro del laberinto — esperado y correcto: es un reto
    real de navegación, no un fallo, el hueco en sí sigue garantizado por
    construcción (ver arriba). `npx tsc --noEmit` limpio, build de
    producción real exitoso.
- **Feedback positivo confirmado + 2 pedidos nuevos** — el usuario probó
  el laberinto garantizado y confirmó: "me gusta, ese tipo de obstáculos
  son los que quería". Dos ajustes explícitos sobre esa misma base:
  - "justo después de eso está muy vacío, dejemos medusas cerca de ahí":
    el hueco entre el final de la banda del laberinto (offset 2150) y el
    primer cúmulo del Tramo 1 (2950) — 800px de agua sin nada — ahora
    tiene 2 medusas (offset 2400 y 2750), dentro del hueco, no de
    ninguna banda.
  - "haz uno tipo que no sea un obstáculo en sí en solitario... tipo mini
    laberinto": nueva 6ª plantilla `miniLabyrinth` en `ReefTemplates.ts`
    — misma idea de `reefLabyrinth` (3 bandas alternando de lado, mismo
    mecanismo `corridorWall`/`edgeReach`) pero a escala reducida
    (`MINI_CORRIDOR_REACH_PX=200` vs 400, `MINI_CORRIDOR_BAND_SPACING=350`
    vs 700) para que la altura total del cúmulo (~1000px) quede en el
    mismo orden que las otras 5 plantillas, en vez de necesitar hueco
    scripteado especial como el laberinto grande — pensada para entrar en
    la ROTACIÓN NORMAL de `REEF_TEMPLATES`, ver también "menos
    importancia a los obstáculos sueltos" en EN PROGRESO más abajo.
  - Verificado con `body.position` (20 muestras): hueco mínimo 490px,
    cero solapamiento entre bandas, zigzag correcto en las 20. `npx tsc
    --noEmit` limpio, playtest automático sin errores (aparte de muertes
    normales del bot al no apuntar al hueco a propósito), build de
    producción real exitoso.
- **Séptimo enemigo: la almeja gigante ahora "come" a Lumi** — pedido
  explícito: "concentrarnos en mejorar los animales... son muy pacíficos
  algunos... la almeja podrías crearle una animación y que te coma y por
  ende una animación de que te comió la almeja a lumi". Antes `giant_clam`
  era solo una pieza decorativa estática de `ReefCluster` (plantilla
  `lateralWall`) sin colisión de peligro real (los `role: "obstacle"` de
  ReefCluster solo bloquean físicamente, nunca restan vida). Ahora:
  - Nueva entidad `entities/GiantClam.ts` y `systems/GiantClamSpawner.ts`,
    calcados del patrón ya probado de `Urchin`/`UrchinSpawner` (casi
    inmóvil, con el mismo balanceo/pulso de "respiración" que el resto de
    animales, reciclaje al salir de cámara, exclusión de banda de
    arrecife vía `isWithinAnyClusterBand`). Nuevas constantes en
    `GameConfig.ts`: `GIANT_CLAM_MIN_GAP`/`MAX_GAP` (3800-6000) y
    `GIANT_CLAM_SCALE`.
  - Arte nuevo generado con Gemini (misma ancla de estilo que el
    `giant_clam` ya aprobado): `giant_clam_closed.png`, la concha cerrada
    de golpe. `fix_transparency.py` con `border_connected_mask` únicamente
    (igual criterio que `rock_slab`/`rock_spikes` antes esta sesión) para
    no comerse la textura de la concha inferior. El archivo original se
    movió de `assets/objects/reef/` a `assets/objects/enemies/` (`git mv`)
    porque pasa de pieza decorativa a animal real — mismo criterio de
    carpetas que medusa/tiburón/calamar/erizo/cangrejo.
  - Nuevo `DeathReason` `"almeja"` en `PondScene.ts`, con mensaje propio
    y una secuencia de muerte propia: en vez del hundimiento genérico
    (`y: sprite.y + 40`), la almeja cambia su textura a `giant_clam_closed`
    (cierre visible) y el tween de muerte arrastra a Lumi hacia el centro
    exacto de la almeja (`x/y: sourceSprite.x/y`) en lugar de hundirla
    hacia abajo — se lee claramente como "la almeja se la tragó", sin
    tocar el arte de Lumi (reutiliza 100% la animación de ojos en cruz ya
    aprobada, solo cambia el destino del tween).
  - Retirada la pieza `giant_clam` de `ReefTemplates.ts` (`lateralWall`) y
    su entrada en `HITBOX_FRACTION` de `ReefCluster.ts` — ya no existe
    como obstáculo estático, solo como animal.
  - Verificado en el motor real (Playwright): las texturas `giant_clam`/
    `giant_clam_closed` cargan, la almeja bobea/respira igual que el
    erizo (8 muestras con variación continua de `y`/escala), y al
    forzar el contacto con Lumi se dispara `handleHazardHit("almeja", …)`
    → cambia a `giant_clam_closed`, `isDying`/`isGameOver` pasan a
    `true`, y el texto de game over muestra "¡Una almeja gigante te ha
    atrapado!" con la concha cerrada visible detrás de la tarjeta
    (captura confirmada). `npx tsc --noEmit` limpio, build de producción
    real exitoso con ambos PNGs nuevos bundleados
    (`dist/objects/enemies/giant_clam.png` y `giant_clam_closed.png`).
- **"Estas cosas ahí flotando me parecen feas" (captura real del usuario)**
  — respuesta a la pregunta pendiente sobre qué se veía "feo flotando
  solo" en `ReefTemplates.ts`. La captura mostraba dos problemas
  distintos, ambos de composición (no de arte nuevo, nada tocado en
  `/assets`):
  1. Una anémona sola en pantalla, sin ninguna otra pieza de su mismo
     cúmulo a la vista — causa real: en `diagonalLeft` estaba a 170px en Y
     Y a un x bien distinto de la rama más cercana (0.14 vs 0.23
     `fromEdge`), y en `lateralWall` el `coral_fan`/`decor_starfish`
     estaban a 200-260px de la rama/roca de esa misma composición. Con una
     cámara de ~640-720px de alto, esa separación bastaba para que la
     pieza saliera sola en pantalla sin sus vecinas, leyéndose como
     basura flotante suelta en vez de parte de un cúmulo. Acercadas: la
     anémona ahora a 94-119px de la rama (antes ~170-250px en la práctica,
     con eje X distinto), `coral_fan` a ~150px de la rama (antes ~200px)
     y `decor_starfish` a ~98px de la roca (antes ~260px) — medido en el
     motor real (`body`/sprite x,y), no a ojo.
  2. Un calamar apareciendo visualmente fusionado con un `coral_fan` (el
     tentáculo pegado a la pieza, como si fuera parte de ella) — causa
     real: `BAND_SAFETY_MARGIN` en `ReefClusterSpawner.ts` (el margen que
     impide que un animal aparezca dentro de la banda de un cúmulo) era
     de solo 60px, menos que la altura típica de un sprite de animal a su
     escala (~110-150px) — un spawn "seguro" por 61px de sobra igual podía
     solapar visualmente el borde del cúmulo con su propio cuerpo. Subido
     a 170px. Verificado en el motor: con un cúmulo de prueba aislado
     (lejos de cualquier otro contenido), `isWithinAnyClusterBand` pasa de
     `true` a `false` exactamente en el delta 171 respecto al borde de la
     banda — el margen nuevo está bien cableado.
  - Todas las plantillas siguen sin apeñuzcarse (la queja opuesta de una
    ronda anterior): las piezas se acercaron a su vecina más próxima, no
    se pegaron entre sí — verificado con capturas reales in-game
    mostrando la anémona+rama y el coral_fan+rama ya agrupados en la misma
    composición visible. `npx tsc --noEmit` limpio, build de producción
    real exitoso.
- **Corrección del usuario tras la ronda anterior + varios pedidos
  nuevos en el mismo mensaje**: "yo me refiero a los obstáculos en sí, se
  ven feos esos dos [anémona y coral_fan]... que no parezcan dos pngs ahí
  pegados quietos" — el problema NO era la separación/composición (ya
  arreglada), sino que se sentían estáticos a pesar de ya respirar
  (±4%, demasiado sutil para leerse como "vivo" en piezas con formas tan
  reconocibles). Además: más animales, mejor movimiento en los que ya
  hay, y más animales que obstáculos en el mapa. Todo sin tocar arte:
  - `BREATHE_AMPLITUDE_OVERRIDE` nuevo en `ReefCluster.ts`: anémona
    ±11% (antes ±4%) y coral_fan ±9% — el resto de piezas que respiran
    se quedan en la amplitud genérica. Verificado en el motor: rango de
    escala real de 0.89x-1.11x y 0.91x-1.09x respectivamente, coincide
    exacto con lo configurado.
  - `REEF_CLUSTER_MIN_GAP`/`MAX_GAP` en `GameConfig.ts`: se revierte del
    todo el ×0.6 de una ronda anterior ("crea más [obstáculos]") ya que
    el pedido ahora es el contrario — vuelve al valor base (~6400-10240px
    de hueco, antes ~3840-6144px), menos arrecife por el mismo tramo de
    mundo.
  - "Puedes poner más animales juntos": `JellyfishSpawner`/`UrchinSpawner`
    ganan un 30% de probabilidad de colocar una segunda medusa/erizo
    cerca de la primera en su cadencia al azar (nunca en el nivel
    scripteado de Zone1Level, que ya compone sus propios grupos a mano) —
    offset en Y pequeño + separación en X generosa para que sigan dejando
    hueco de sobra. Verificado con 60 llamadas de prueba: 30%/25% de
    tasa de "buddy" real, dentro de lo esperado por azar.
  - "Mejora el movimiento que sea más elaborado de los que ya tenemos":
    erizo y almeja eran los más pasivos (solo bamboleo+respiración en el
    mismo sitio). Erizo: giro lento y continuo (0.35 rad/s, dirección
    aleatoria por instancia) — su silueta es casi circular así que rotar
    no desincroniza su hitbox rectangular fija de forma perceptible.
    Almeja: balanceo angular sutil (±0.05 rad) además del bob/respiración
    que ya tenía — su hitbox está casi centrada en el sprite, así que un
    ángulo pequeño tampoco la desincroniza. Verificado en el motor:
    rotación del erizo avanzando linealmente en el tiempo, rotación de la
    almeja oscilando en seno entre los límites esperados.
  - "El laberinto que te dije sigues sin hacerlo": revisados los 33
    despliegues de GitHub Actions de esta rama — todos exitosos,
    incluyendo el que garantizó `reefLabyrinth` al principio (Tramo 0) y
    el que añadió `miniLabyrinth`. No hay ninguna señal de que el código
    en producción sea distinto del verificado en el motor (que sí lo
    muestra como lo primero que aparece en una partida nueva). Causa más
    probable: caché del navegador sirviendo un bundle viejo — se le pide
    al usuario un refresco forzado (Ctrl+Shift+R o pestaña privada) antes
    de investigar más a fondo, y se le pregunta si con "laberinto" se
    refiere a otra cosa (p.ej. una formación de animales, no de rocas).
  - Playtest automático de 20s sin errores ni cuelgues (zigzag aleatorio),
    `npx tsc --noEmit` limpio, build de producción real exitoso.
- **Segundo laberinto, distinto del primero (aclaración del usuario)**:
  "lo del laberinto me refiero a otro extra, no el que ya tenemos. El que
  ya tenemos está súper [no se toca]. Pero el que digo yo es hacer otro
  pero diferente. Que sea más grande y mejor diseñado... hueco de entrada
  y correr hacia al lado y luego hacia el frente y otra vez hacia al lado
  y por último hacia arriba, pero que tenga un diseño como de laberinto
  de verdad, laberinto submarino." Nueva 7ª plantilla `grandMaze` en
  `ReefTemplates.ts` (índice 6), deliberadamente distinta de
  `reefLabyrinth`/`miniLabyrinth`, no solo un reescalado:
  - 4 bandas (una más que `reefLabyrinth`) con más penetración (430px vs
    400px) y más separación vertical (820px vs 700px) — más grande de
    verdad.
  - Introduce un tipo de paso que ningún otro laberinto tenía: una
    "puerta" (`mazeGate`) con pared de roca a AMBOS lados y un hueco
    centrado (~320px) — hay que cruzar recto por el centro, no esquivar
    hacia un lado. Se intercala entre los corredores de un solo lado de
    siempre (entrada → puerta → corredor lado contrario → salida),
    mezclando dos "idiomas" de paso distintos dentro del mismo cúmulo —
    eso es lo que lo hace sentir como un laberinto real, pedido explícito
    del usuario, y no una repetición del mismo patrón.
  - Hornacina decorativa junto a la puerta (role "background", sin
    colisión): un "camino falso" que no lleva a ningún sitio, como en un
    laberinto de verdad, sin ningún riesgo real porque no colisiona.
  - Misma garantía de seguridad que los otros dos laberintos: solo piezas
    de roca sin animación de escala en vivo (`CORRIDOR_WALL_POOL`,
    reutilizado tal cual) en las 4 bandas y en la puerta.
  - Igual que `reefLabyrinth` en el Tramo 0: se garantiza en un nuevo
    "Tramo 3" al final de `ZONE1_LEVEL_ENTRIES` (offset 25330, justo
    después del gauntlet final de siempre) en vez de dejarlo solo a la
    generación al azar de después de `ZONE1_LEVEL_END_OFFSET` — mismo
    motivo que la vez pasada: así el usuario lo encuentra de verdad sin
    depender de una partida muy larga. `ZONE1_LEVEL_END_OFFSET` se
    recalculó para reflejar el nuevo final real del nivel scripteado
    (26820 + 800 de margen antes de la corriente), y
    `CURRENT_ZONE_START_OFFSET` en GameConfig.ts sigue derivándose de él
    automáticamente (no se desincroniza).
  - También añadido a la rotación normal de `REEF_TEMPLATES`, así que
    también puede volver a aparecer al azar más adelante.
  - Verificado con `body.position` (25 muestras aisladas): siempre 4
    bandas, hueco mínimo 249px (>4× el ancho real de Lumi), cero
    solapamiento vertical entre bandas en las 25, y el hueco de la puerta
    (~320-340px con jitter) claramente distinto de los huecos de un solo
    lado — confirma que el mecanismo de doble pared funciona. Confirmado
    también que el Tramo 3 se coloca de verdad al arrancar una partida
    nueva (10 cúmulos scripteados presentes desde el primer frame, el
    último con el rango de banda exacto esperado del `grandMaze`).
    Playtest automático sin errores, `npx tsc --noEmit` limpio, build de
    producción real exitoso.
- **Revertido: giro continuo del erizo**. Pedido explícito del usuario
  tras probarlo: "los erizos déjalos como estaban, la gracia de ellos es
  que siempre están quietos" — el `SPIN_SPEED` añadido en la ronda
  anterior (ver EN PROGRESO más arriba) era un error de lectura: "el
  animal más pasivo" no era un problema a arreglar en este caso concreto,
  es parte de su diseño. Quitado del todo (`Urchin.ts` vuelve a solo
  bamboleo+respiración) y documentado en el docblock de la clase para que
  no se reintroduzca sin querer en una futura pasada de "más movimiento".
  El resto de esa ronda (almeja con balanceo, medusa/erizo en pareja,
  animación de anémona/coral_fan, densidad de arrecife) no se tocó — el
  usuario solo señaló el erizo como excepción.
- **Arte nuevo generado con Gemini para el segundo laberinto**: pedido
  explícito — "el laberinto me imagino un diseño totalmente nuevo.
  Pídeselo a la api que te lo haga, que si sea estilo laberinto grande
  cozy". Nueva pieza `reef_maze_wall` (`assets/objects/reef/maze_wall.png`),
  un cúmulo de 9 rocas mucho más grande y compuesto que las piezas
  sueltas del pool clásico, generado con las mismas anclas de estilo que
  `boulder_rock` (rocas redondeadas gris-lavanda, musgo, acentos de
  coral) — mismo lenguaje visual, pero "grande y cozy" tal como se pidió.
  - Limpieza de transparencia: la salida cruda de Gemini venía 100%
    opaca (checkerboard horneado cubriendo todo el lienzo, el contenido
    real solo ocupa ~32% del canvas) — caso ya documentado en el propio
    script como "normal y esperado" para un borrado grande;
    `border_connected_mask` solo (sin `interior_hole_mask`, mismo
    criterio que rondas anteriores) y confirmado limpio con el composite
    sobre magenta antes de integrar.
  - Exclusiva del segundo laberinto (`grandMaze`): nuevo
    `GRAND_MAZE_WALL_POOL` en `ReefTemplates.ts` (la pieza nueva con el
    doble de peso + las 3 rocas clásicas), NUNCA mezclada en
    `CORRIDOR_WALL_POOL` — ese es el que usan `reefLabyrinth`/
    `miniLabyrinth`, que el usuario confirmó que "no se tocan".
    `corridorWall()` ahora acepta un pool opcional para esto sin afectar
    a los otros dos laberintos.
  - `HITBOX_FRACTION`/`NO_BREATHE_KEYS` en `ReefCluster.ts` actualizados
    (bbox medido programáticamente sobre el PNG, sin animación de escala
    en vivo — mismo criterio de seguridad que el resto del pool).
  - Verificado con `body.position` (40 muestras, la pieza nueva salió 76
    veces de las ~160 posibles ≈ 40%, coincide con su peso en el pool):
    sigue habiendo siempre 4 bandas, cero solapamiento vertical, y el
    hueco mínimo se mantiene en 249px incluso con la pieza nueva
    presente — no hizo falta re-ajustar `GRAND_MAZE_BAND_SPACING`.
    Confirmado visualmente en el motor real que se ve claramente más
    grande y elaborada que las rocas clásicas al lado. `npx tsc --noEmit`
    limpio, build de producción real exitoso con el nuevo PNG bundleado.
- **Investigación de una captura real + segunda versión del arte del
  laberinto + retirada de 2 piezas que "no convencen"**: el usuario
  mandó una captura mostrando una anémona encima de un cúmulo verde/gris
  con rayas onduladas, preguntando "¿por qué desapareció los pinchos del
  principio?" y pidiendo "elimina esos dos obstáculos". Identificación
  (comparando la captura contra cada PNG de `assets/objects/reef/` uno a
  uno, no a ojo): el piso NO era `reef_maze_wall` — era la combinación de
  `anemone` (plantilla `diagonalLeft`) y `reef_branch_hook` (una de las 4
  variantes de `BRANCH_VARIANTS`, el "coral cerebro" de rayas onduladas),
  que quedaron muy pegadas entre sí tras el ajuste de composición de una
  ronda anterior (la anémona se acercó a la rama para dejar de "flotar
  sola" — con `reef_branch_hook` en concreto, esa cercanía se lee como
  una sola pieza fusionada fea). Sobre "los pinchos desaparecidos":
  verificado en el código que `reef_rock_spikes` sigue presente en los 3
  pools donde siempre estuvo (`WALL_PIECE_POOL`, `CORRIDOR_WALL_POOL`,
  `GRAND_MAZE_WALL_POOL`) — no se quitó nada, lo más probable es que no
  tocara salir en esa parte concreta de esa partida (solo ~12-14% de
  probabilidad por posición).
  - Retiradas del todo: `anemone` (pieza única en `diagonalLeft`,
    eliminada del array de piezas) y `reef_branch_hook` (fuera de
    `BRANCH_VARIANTS` y de `WALL_PIECE_POOL`, sus dos únicos usos). Ambas
    siguen cargadas en `BootScene.ts` por si hay que revertir, mismo
    criterio que `CoralWall`/`CoralSpawner` en su día.
  - Pedido explícito adicional: "lo que quiero es tener varias piezas
    para poner durante todo el tramo, no reemplazar la que ya teníamos"
    — principio general para rondas futuras: sumar variedad al pool, no
    sustituir piezas ya aceptadas por una sola nueva.
  - Segunda versión del arte del laberinto grande: "la nueva pieza me la
    imagino totalmente diferente que no sean rocas. Que sea como los
    laberintos reales pues de hojas, pero acuático" — `reef_maze_wall`
    (misma clave, mismo archivo, contenido nuevo) pasa de ser un cúmulo
    de rocas a un seto denso de hojas/algas, generado con las mismas
    anclas de estilo que `foreground_plants` (nunca con las rocas como
    referencia esta vez). `GRAND_MAZE_WALL_POOL` ya no mezcla rocas
    clásicas — todo el laberinto grande es ahora de un único lenguaje
    visual (hojas).
  - El nuevo lienzo (1344x768, casi a sangre completa, mucho más "ancho
    que alto" que las rocas) tiene una extensión a lo largo de la pared
    bastante mayor una vez rotado 90º a igual `reachPx` — recalculado con
    la geometría real: `GRAND_MAZE_BAND_SPACING` subido de 820 a 1000
    para mantener el margen de seguridad de siempre. Recalculado también
    el offset del Tramo 3 en `Zone1Level.ts` (25330→25600) y
    `ZONE1_LEVEL_END_OFFSET` (el cúmulo ahora es más alto: banda
    [23840,27360] en vez de [23840,26820]).
  - Verificado con `body.position` (30 muestras): siempre 4 bandas, cero
    solapamiento vertical, hueco mínimo 249px (igual que antes) y margen
    vertical mínimo real entre bandas de 279px (por encima del ~250px de
    diseño). Confirmado visualmente en el motor que el seto se lee como
    una pared de hojas densa y gruesa, distinta del resto de plantas de
    fondo pero del mismo lenguaje visual del juego. Playtest automático
    sin errores/cuelgues, `npx tsc --noEmit` limpio, build de producción
    real exitoso con el PNG nuevo bundleado.
- **Limpieza de obstáculos + 2 animales nuevos + 1 vida + rediseño de
  Zona 1** (pedido explícito, mensaje con 2 capturas de `reef_coral_branch`
  y `coral_fan`: "quita tmb todos los caracoles... vamos a hacer limpieza
  de obstáculos que no quedan bien solos... GENÉRAME MUCHOS MÁS ANIMALES...
  animales que parezcan obstáculos como la concha... cambiemos que sea
  solo 1 vida... genérame el mapa de nuevo de la fase 1"):
  - **Limpieza de obstáculos estáticos.** Se retiraron de todo uso activo
    en `ReefTemplates.ts` tres piezas señaladas como "que no quedan bien
    solos": `decor_shell` (el "caracol", usado como obstáculo en
    `centerTwoPaths()`), `reef_coral_branch` (usado en `BRANCH_VARIANTS`,
    `WALL_PIECE_POOL` y `diagonalLeft()` — reemplazado por
    `reef_boulder_rock`) y `coral_fan` (usado como obstáculo en
    `lateralWall()`). Ninguna se borró del disco ni de `BootScene.ts`
    (mismo criterio que `anemone`/`reef_branch_hook` de la ronda
    anterior, "por si hay que revertir"). Las decoraciones ambientales que
    usaban estas claves dentro de `reefLabyrinth()`, `miniLabyrinth()` y
    `grandMaze()` (que NO se tocan en su mecánica, solo en qué pieza
    decorativa dibujan) se sustituyeron por `sponge`/`barnacle`/
    `decor_pebble`, ya aprobadas y sin usar ahí antes.
  - **`CoralTrap` (8º animal, "animal que parezca obstáculo como la
    concha").** En vez de descartar el arte de `coral_fan` al quitarlo
    como obstáculo estático, se reutilizó tal cual (cero arte nuevo) para
    un animal nuevo: se queda quieto leyéndose como parte del arrecife
    (mismo "breathe" sutil que ya tenían los obstáculos de coral) hasta
    que Lumi se acerca a menos de 220px, momento en que "se estira" hacia
    ella con un pulso de escala extra (`lunge`, 350ms + 1.2s de cooldown,
    puramente una transformación de escala sobre el mismo sprite, sin
    tween nuevo ni arte nuevo) y tocarla es golpe letal. Nuevo
    `DeathReason "coral"` → "¡Un coral trampa te ha atrapado!". Mismo
    patrón Entity+Spawner+overlap que los 7 animales anteriores
    (`CoralTrap.ts` + `CoralTrapSpawner.ts`, hitbox medido por numpy sobre
    `coral_fan.png`: bbox `749x610` offset `(139,191)` a escala 1).
  - **`Seahorse` (9º animal, arte nuevo de verdad).** Primer animal de
    esta ronda con arte generado desde cero vía Gemini (caballito de mar
    pastel melocotón/crema, cola enroscada, contorno lavanda — anclado en
    el estilo ya aprobado del resto de enemigos). Salió con checkerboard
    horneado cubriendo todo el canvas (mismo caso límite ya documentado
    con `reef_maze_wall`); se limpió con el modo "solo borde" de
    `fix_transparency.py` para no perder el punto de brillo del ojo
    (122px, se habría confundido con un hueco interior a detectar). Se
    generó también `seahorse_blink.png` (mismo parpadeo que el resto de
    criaturas) partiendo del `seahorse.png` ya limpio como única
    referencia, verificado por alineación de centro de bounding box
    (<0.5px de diferencia). Patrón de movimiento deliberadamente distinto
    a todos los anteriores: deriva en "ocho perezoso" con proporción de
    frecuencias 1:2 entre ejes (`dx = sin(t·0.9+fase)·36`,
    `dy = sin(t·1.8+fase)·22`) más un balanceo de rotación atado al eje
    horizontal — no es un círculo ni comparte ritmo con los patrones ya
    usados por la medusa. Nuevo `DeathReason "caballito"` → "Un caballito
    de mar te ha rozado...".
  - **1 sola vida (antes 3).** `LUMI_LIVES_START` cambiado de `3` a `1` en
    `GameConfig.ts`. `LivesSystem.ts` ya estaba escrito de forma genérica
    (recibe `maxLives` por constructor y crea esa cantidad de corazones),
    así que no hizo falta tocar ninguna lógica, solo la constante y su
    comentario.
  - **Rediseño de `Zone1Level.ts` ("que no se vea tan vacío").** Con
    libertad creativa del usuario, se añadieron 12 entradas nuevas
    rellenando huecos que antes estaban completamente vacíos entre los
    tramos ya scripteados, verificando uno por uno que ninguna coincide
    con el rango de ninguna banda de `ReefCluster` ya documentada:
    2 pares medusa+caballito y 3 corales trampa sueltos en los primeros
    tramos, un caballito dentro del zigzag final ya existente, el
    **debut scripteado de la almeja** (`clam`, hasta ahora solo aparecía
    por generación aleatoria — nunca en un punto fijo del nivel), y una
    combinación caballito+almeja justo en el hueco de ~800px que quedaba
    totalmente vacío antes de la entrada al segundo laberinto (`grandMaze`,
    banda desde offset 23840). `Zone1LevelEntryType` ampliado con
    `"clam" | "coraltrap" | "seahorse"`, con su `case` correspondiente en
    el switch de `PondScene.ts`.
  - **Verificación:** playtest automático (bot en zigzag) sin errores ni
    cuelgues con las 12 entradas nuevas activas, conteo de entidades
    scripteadas vs. `grep` de `Zone1Level.ts` coincidente para los 6
    tipos nuevos/existentes, `npx tsc --noEmit` limpio, build de
    producción real con `seahorse.png`/`seahorse_blink.png` bundleados
    confirmado.

- **Almeja gigante: boca mucho más abierta, secuencia de mordisco real y
  sprite propio de Lumi siendo comida** (pedido explícito: "la almeja no
  parece que haga la animación... boca abierta muy abierta del inicio y
  al tocarla se cierre y coma a lumi", "lumi haz otro Sprite de siendo
  comido por la almeja"):
  - `giant_clam.png` regenerado con Gemini: mismo diseño/paleta/contorno
    de la concha ya aprobada, pero con la boca dramáticamente más abierta
    (valva de arriba casi vertical, "lengua"/perla mucho más expuesta) —
    limpieza de transparencia con el caso ya documentado de "checkerboard
    llena todo el lienzo", verificado que el hueco de la boca es real
    (conectado al fondo transparente por los lados, no un agujero
    interior falso). Hitbox de `GiantClam.ts` remedida sobre el nuevo arte
    (bbox `671x658` offset `(194,178)`, antes `757.76x604.16`/`(133,215)`).
  - **Secuencia de mordisco de 3 fases** (`GiantClam.triggerBite()`):
    anticipación (se abre un pelín más) → cierre de golpe con "squash" de
    escala justo cuando cambia a `giant_clam_closed` → asentamiento.
    Primer intento implementado como matemática manual dentro de
    `update(time)` — **bug real encontrado y corregido**: `PondScene.
    update()` deja de llamarse por completo en cuanto empieza la
    secuencia de muerte (`if (this.isDying || this.isGameOver) return;`
    al principio de la función), así que `GiantClamSpawner.update()` (y
    con él, `clam.update(time)`) nunca se volvía a ejecutar después de
    `triggerBite()` — la concha se quedaba abierta para siempre, exacto
    el bug que reportó el usuario ("no se ve cuando se cierra"). Reescrito
    como una cadena de `Phaser.Tweens` reales dentro de `triggerBite()`
    (igual criterio que el hundimiento de Lumi, que sí sigue avanzando
    porque los tweens del TweenManager no dependen del `update()` de la
    escena) — confirmado con un test real en el motor: la textura cambia
    a `giant_clam_closed` ~150ms después del golpe y se queda cerrada.
  - **Nuevo sprite de Lumi: "eaten"** (`assets/characters/lumi/eaten/
    eaten_01.png`, generado con Gemini a partir de `idle_01`+`death_01`
    como anclas) — ojos muy abiertos, boca en O de sorpresa, bracitos
    encogidos hacia adelante, sin las X de la pose de muerte genérica.
    `Lumi.prepareForDeath()` ahora acepta una variante (`"death"|"eaten"`,
    por defecto `"death"`); `PondScene.startDeathSequence` la pasa según
    el motivo (`"eaten"` solo para `"almeja"`). El tween de hundimiento ya
    no gira a la almeja (un giro se lee como "cayendo", no como "tragada")
    — solo se encoge, se acerca al centro de la concha y se desvanece.
  - **Verificación:** test real en el motor disparando el mordisco vía
    `triggerBite()` con Playwright (textura, escala y timing exactos en
    cada fase), y un segundo test forzando la colisión real Lumi↔almeja a
    través del spawner de verdad (overlap → `handleHazardHit` →
    `startDeathSequence` → cierre + game over), ambos limpios. `npx tsc
    --noEmit` limpio, build de producción confirmado.
- **Limpieza de "obstáculos pequeños" en las 7 plantillas de
  `ReefTemplates.ts`** (pedido explícito con 3 capturas reales — un
  coral en abanico, un cúmulo con perlas/balano, una rama de coral —
  "que no haya esos obstáculos pequeños al lado de la roca en zigzag del
  inicio... solo con las rocas grandes, los pequeñitos sobran"):
  - **`reefLabyrinth`/`miniLabyrinth`/`grandMaze`** (los 3 "laberintos"):
    se retiraron TODAS las decoraciones pegadas a la punta de cada pared
    (estrella/esponja/balano/guijarro) — se quedan solo las paredes de
    roca en sí (el mecanismo no se tocó, mismo criterio de rondas
    anteriores) y un único acento de fondo lejano por plantilla. La
    hornacina del "camino falso" de `grandMaze` se mantuvo (no es un
    acento pegado a una pared, es parte del propio diseño de laberinto).
  - **`diagonalLeft`/`centerTwoPaths`/`sCurveEdges`/`lateralWall`**: la
    familia de "rama de coral" (`reef_branch_straight`/`reef_branch_
    short`, usada como segunda pieza de cada composición) se retiró por
    completo — reemplazada por una segunda `wallPiece()` (roca/pincho,
    pegada al borde igual que la principal). Los pequeños "obstáculo"
    sueltos que acompañaban a cada plantilla (`decor_pebble` en
    centerTwoPaths, `sponge`/`barnacle` en sCurveEdges, `decor_starfish`
    en lateralWall) también se retiraron. Los 4 assets de rama siguen
    cargados en `BootScene.ts` por si hay que revertir; `pickBranch`/
    `branchScale`/`INVERT_FLIP_KEYS`/`branchFlipX`/`towardsRightEdge` se
    borraron del todo (código muerto de verdad, no un asset).
  - **2 variaciones nuevas de `reef_rock_spikes`** generadas con Gemini
    (pedido explícito: "en vez de esos obstáculos haya más obstáculos de
    los pinchos de piedra que son más bonitos... crea variaciones"):
    `rock_spikes_b` (picos altos y torcidos, alturas desiguales) y
    `rock_spikes_c` (cresta baja y ancha, muchos picos parejos). Ambas
    limpiadas con el mismo caso de "checkerboard llena el lienzo" ya
    documentado. Sumadas a `WALL_PIECE_POOL` (duplicando de facto el peso
    de "pincho" frente a las 3 rocas clásicas). `rock_spikes_b` también se
    sumó a `CORRIDOR_WALL_POOL` (el pool seguro de los laberintos) tras
    verificar con la misma trigonometría de `ReefCluster.ts` que su
    extensión a lo largo de la pared (~342px al reach del laberinto
    grande) queda por debajo del peor caso ya cubierto por
    `reef_boulder_rock` (~538px) — `rock_spikes_c` se quedó FUERA de ese
    pool a propósito: su proporción tan ancha dispararía esa extensión a
    ~1111px, muy por encima del margen ya calculado (700px/350px de
    separación entre bandas).
  - **Verificación:** construidos los 7 `ReefClusterSpec` reales (20
    muestras cada uno) con el motor cargado de verdad, midiendo el hueco
    libre máximo por banda a partir de `body.position`/`body.width` reales
    — mínimo 555-582px en las 4 plantillas simples, 280px en
    `reefLabyrinth`, 490px en `miniLabyrinth`, 249px en `grandMaze` (estos
    3 últimos coinciden con los márgenes ya documentados en rondas
    anteriores, confirmando que las piezas nuevas no los estrecharon).
    `npx tsc --noEmit` limpio (incluida la limpieza del código muerto),
    build de producción con los 2 PNGs nuevos bundleados confirmado.
- **Zona 1 "muy suave"**: con libertad creativa del usuario, se rellenaron
  los 2 huecos genuinamente vacíos que quedaban en el tramo más jugado
  (offset 0-12000, el que de verdad se ve con 1 sola vida): un cangrejo en
  el hueco 6560-7450 (adelantando su debut, antes solo aparecía en offset
  20740 — más variedad de enemigos mucho antes) y un coral trampa en el
  hueco 10220-11040. Se explica también, para responder "el laberinto de
  algas no lo he visto, en qué zona lo has puesto": `grandMaze` está en el
  offset 25600, dentro del rango [23840,27360] — muy cerca del final del
  tramo scripteado (`ZONE1_LEVEL_END_OFFSET=28160`). Con solo 1 vida
  (cambio de la ronda anterior), es esperable que la mayoría de intentos
  no lleguen tan lejos; ver PENDIENTE.
- **Piezas laterales con variación real de tamaño** (pedido explícito:
  "los objetos laterales como las rocas pincho que cambien de tamaño tmb,
  algunas más grandes, otras medianas otras así"): `wallPiece()` en
  `ReefTemplates.ts` ahora aplica un tier de tamaño adicional
  (`WALL_PIECE_SIZE_TIERS = [0.72, 0.72, 1, 1, 1, 1.35]`, con más peso en
  el mediano) encima del jitter sutil que ya tenía — nunca en
  `corridorWall()` (los 3 laberintos, que necesitan el hueco EXACTO de
  `edgeReach`). Reverificado el hueco libre de las 4 plantillas simples
  con el tier más grande activo en las 40 muestras: mínimo 528-560px,
  de sobra por encima del margen ya aceptado en el resto del juego.
- **Laberintos repetidos, más arriba, más difíciles, con animales dentro**
  (pedido explícito: "la gracia es hacerlo más veces pero estén más
  arriba pero estén más difíciles, que hayan erizos o caballitos de mar
  etc"): `ReefClusterSpec` ganó un campo opcional `animalHints` —
  posiciones de animales REALES (Urchin/Seahorse, no arte de
  `ReefCluster`) descentradas dentro del propio hueco ya calculado para
  las paredes, nunca en su centro exacto, para obligar a esquivarlos sin
  tocar la garantía de paso. `miniLabyrinth()` los genera según
  `labyrinthAnimalTier(centerY)` (0/1/2 según cuánto se ha subido,
  derivado de `START_Y - centerY` — coincide con el offset para las
  instancias scripteadas). `ReefClusterSpawner` recibe 2 callbacks nuevos
  (`spawnUrchin`/`spawnSeahorse`, perezosos: apuntan a
  `this.urchinSpawner`/`this.seahorseSpawner` de `PondScene`, que aún no
  existen en la línea donde se construye `ReefClusterSpawner` pero sí
  para cuando de verdad se llaman) y los invoca al colocar cada cúmulo.
  3 de los 8 `reef` scripteados de Zona 1 (antes plantillas simples en
  offset 12160/16320/21440) pasaron a `miniLabyrinth` (tiers 1/1/2,
  subiendo en altura) — "más veces, más arriba, más difíciles" tal cual
  se pidió. Verificado con 15 muestras a distintas alturas: siempre
  dentro de [0,690], nunca fuera del mundo.
- **Caballito de mar: giro circular + animación real con Gemini** (pedido
  explícito): `Seahorse.ts` cambió su "ocho perezoso" por una órbita
  circular de verdad (`ORBIT_RADIUS`/`ORBIT_SPEED`) con inclinación
  atada al giro. Segunda pose real generada con Gemini
  (`seahorse_swim.png`) — dos intentos de un ciclo de 3 frames con
  variaciones sutiles de aleta/cola salieron casi indistinguibles del
  original (Gemini sobre-ancla al detalle pedido como "cambio mínimo");
  la tercera generación, pidiendo una ACCIÓN DE IMPULSO bien distinta
  (cola estirada en vez de enroscada, cuerpo inclinado), sí dio un
  resultado claramente diferente. Se quedó como ciclo de 2 poses,
  alternando según el signo de `cos(angle)` — sincronizado con el propio
  giro, no un temporizador aparte — con el parpadeo (`seahorse_blink`)
  con prioridad visual sobre ambas.
- **Medusa: rastro de burbujas** (pedido explícito: "la medusa que deje
  partículas de burbujas tmb"): cada `Jellyfish` crea su propio
  `Phaser.GameObjects.Particles.ParticleEmitter` (reutiliza
  `bubble_small`, ya cargado) con `startFollow(this.sprite)`, escala
  0.28→0.06 y alpha 0.65→0 en ~1.3s, cadencia de ~320ms. Verificado a
  nivel de objeto (posición/alpha/escala de partículas vivas siguiendo al
  sprite correctamente) — la verificación visual por captura de pantalla
  con Playwright no mostraba NADA, ni siquiera con una ráfaga exagerada
  (escala 1.2, alpha 1, depth 100) ni con el `boostBurst` ya existente y
  confirmado en producción, así que es una limitación conocida del
  entorno de test headless con el sistema de partículas de Phaser, no un
  bug de esta ronda. `Jellyfish.destroy()` nuevo, llamado desde
  `JellyfishSpawner` al despawnear, para no dejar emisores huérfanos en
  una escalada infinita.
- **Décimo animal: balano** (pedido explícito: "crea más animales si") —
  mismo patrón "animal disfrazado de obstáculo" que la almeja/coral
  trampa, reutilizando el arte ya aprobado de `barnacle` (antes solo
  decoración de fondo). En vez de un "lunge" suave, hace un doble
  chasquido rápido y seco (`SNAP_PULSE_MS`×2 con hueco entre medio) al
  acercarse Lumi, con un rango de disparo más corto que el coral trampa
  (los balanos no "alcanzan" tan lejos). `DeathReason "balano"` nuevo.
  2 apariciones scripteadas en huecos vacíos de Zona 1 (offset 13050 y
  15100).
- **Caballito de mar: patrulla el mapa de verdad** (corrección explícita
  de la ronda anterior: "el caballito de mar que se mueva en el mapa me
  refería tmb" — el giro en círculo sobre el punto de aparición no era lo
  pedido). El CENTRO de la órbita circular ahora barre el ancho del mundo
  con un seno suave (`PATROL_SPEED`), conservando el propio giro en bucle
  como capa extra encima — se lee como un nado en bucles que además
  atraviesa el mapa, no un vaivén recto ni un giro fijo. Nuevo parámetro
  `patrolRadius` (opcional): cuando un caballito se coloca como
  `animalHint` dentro del hueco seguro de un mini laberinto (ver
  `ReefTemplates.ts`), se confina a un vaivén corto alrededor de su punto
  de aparición en vez de patrullar el mundo entero — si no, se saldría del
  hueco casi al instante y el "esquívalo dentro del pasillo" dejaría de
  tener sentido. `SeahorseSpawner.spawnConfined()` nuevo para ese caso;
  `spawnExact()` (nivel scripteado) y la generación al azar siguen con
  patrulla completa.
- **Más densidad en Zona 1** (pedido explícito: "al principio puedes poner
  incluso más medusas que sean 3 o 4 y ya entre más arriba más animales en
  combo colocados estratégicamente"): el grupo de medusas de apertura subió
  de 2 a 4 (offsets 2350/2500/2650/2850, escalonadas en X e Y); 3 combos ya
  existentes ganaron un animal más (medusa añadida en offset 17550 junto al
  debut del calamar; medusa añadida en offset 20500 junto al segundo combo
  de calamar/cangrejo; coral trampa añadido en offset 23300 al combo final
  antes del segundo laberinto).
- **Dos animales nuevos, ambos con dinámica de movimiento real y
  genuinamente distinta a los 10 anteriores** (pedido explícito, con
  mucho énfasis: "CREA MÁS ANIMALES MÁS MÁS...con animación de que muevan
  por el mapa tmb o que tengan dinámicas distintas"). Arte generado con
  Gemini a partir de `jellyfish.png` + `squid.png`/`fish_01.png` como
  anclas de estilo; limpieza de transparencia con el bypass manual ya
  habitual (salida cruda 100% opaca con checkerboard horneado en todo el
  lienzo) — el modo automático de `fix_transparency.py` además se comió
  detalle real (aletas/vientre) en el pez volador la primera vez, así que
  ese asset se limpió solo con la máscara de borde, sin el filtro de
  huecos interiores.
  - **Undécimo: mantarraya** (`entities/MantaRay.ts`). Ningún animal
    anterior recorre distancia real en dos ejes a la vez (el tiburón solo
    patrulla en X con un bob de Y fijo; el caballito gira mientras su
    centro barre en X). La mantarraya usa dos senos independientes con
    periodos distintos para X e Y (patrón tipo Lissajous, amplitud
    vertical ±360px) — cruza el mapa en ángulos que cambian con el
    tiempo, nunca el mismo trayecto dos veces. Se inclina (banking) según
    la componente vertical de su movimiento y aletea (pulso de escala
    suave) para leerse como un planeo real. `DeathReason "mantarraya"`
    nuevo. 2 apariciones scripteadas (offset 10850 junto al coral trampa
    de esa zona, y offset 18050 uniéndose al combo de calamar/medusa/
    caballito).
  - **Duodécimo: pez volador** (`entities/FlyingFish.ts`). Primer animal
    con ritmo de reposo+salto en vez de movimiento continuo: se queda
    quieto un rato (con un balanceo leve) y luego hace un salto rápido en
    arco parabólico (sube y vuelve a bajar) hasta un nuevo punto antes de
    volver a reposar — imitando el salto real de un pez volador. El morro
    se inclina arriba al despegar y abajo al aterrizar, siguiendo la
    derivada del propio arco. Hitbox casi a lienzo completo (las alas
    gigantes SON el cuerpo real, no margen vacío). `DeathReason
    "pezvolador"` nuevo. 2 apariciones scripteadas (offset 4200, muy
    pronto en el Tramo 1 para que se note el contraste de ritmo frente al
    resto; offset 23550 en el combo final antes del segundo laberinto).
  - Ambos verificados: `npx tsc --noEmit` limpio, muestreo de posición/
    rotación/flip por Playwright a lo largo de ~12s confirmando el barrido
    diagonal real de la mantarraya y el ciclo reposo/salto del pez
    volador, captura de pantalla in-game confirmando arte correcto sin
    residuo de checkerboard ni artefactos, y build de producción
    (`GITHUB_PAGES=true vite build`) confirmando que ambos PNG se
    empaquetan.
- **2 tipos nuevos de erizo + colocación en columna VERTICAL** (pedido
  explícito: "haz más erizos de otros tipos que se coloquen en vertical en
  línea para cuando haya más dificultad aparezcan en vertical y en
  paralelo puede ser una zona"). Hasta ahora todas las líneas de erizo
  eran horizontales (mismo offset, distinta x) — el pedido es lo
  contrario: misma x, offsets escalonados, así que hay que esquivar la
  columna entera pasando por un lado mientras se sube, no elegir un hueco
  lateral.
  - **Arte**: `urchin_long` (cuerpo ovalado, púas muy largas y finas, azul
    pastel con puntas moradas) y `urchin_round` (cuerpo compacto casi
    esférico, púas cortas y densas, coral con puntas crema) — ambos
    generados con Gemini a partir de `urchin.png` como ancla de estilo,
    pidiendo explícitamente un tipo de erizo distinto (no una variación
    mínima). Limpieza de transparencia con el bypass manual habitual
    (salida cruda 100% opaca con checkerboard horneado); verificados por
    composite en magenta antes de integrar. Ninguno de los dos tiene pose
    de parpadeo propia (mismo criterio que Barnacle/CoralTrap — no todos
    los animales la necesitan).
  - **Código**: `Urchin.ts` ahora toma un `variant` opcional
    (`"default"|"long"|"round"`) con textura e hitbox propias por tipo
    (medida sobre cada PNG, igual criterio que siempre — región de
    densidad real, no el lienzo completo). `UrchinSpawner.spawnExact()`
    admite el mismo parámetro; la generación al azar también mezcla los 3
    tipos (60% original, 20%/20% los nuevos) para que no sea exclusivo del
    nivel scripteado.
  - **Nivel scripteado** (`Zone1Level.ts`): debut de una columna corta (2
    erizos, offset 16920/17120, x=350) en el hueco entre el segundo mini
    laberinto y el debut del calamar; más arriba, una "zona" de 2 columnas
    EN PARALELO (offset 18950-19350, x=140 y x=550, 3 filas cada una,
    tipos mezclados por fila) con un pasillo libre de ~260-320px en medio
    (verificado por hitbox real vía Playwright) — pedido explícito: "en
    paralelo puede ser una zona tmb". Colocada más arriba que el debut
    (más difícil, 2 columnas en vez de 1), tal como se pidió ("cuando haya
    más dificultad aparezcan en vertical").
  - Verificado: `npx tsc --noEmit` limpio, spawn manual + medición de
    hitbox por Playwright confirmando tamaño/textura correctos por tipo,
    captura in-game confirmando arte y estilo correctos, build de
    producción empaquetando ambos PNG nuevos.
- **Tiburón: persecución repetible + más frecuente + más agresiva más
  arriba** (pedido explícito: "que los tiburones salgan más a menudo, que
  persigan y te dejen de perseguir etc" + "entre más arriba los animales
  hagan distintos movimientos... para que sean más difíciles").
  - `SHARK_MIN_GAP`/`SHARK_MAX_GAP` bajados ~35% — aparecen bastante más a
    menudo.
  - `Shark.ts`: la persecución YA NO es un evento de una sola vez por
    tiburón (`hasChased` retirado) — ahora un ciclo repetible con
    enfriamiento (`nextChaseAllowedMs`, contado desde que ESA persecución
    termina): persigue, vuelve a patrullar, y si Lumi se le acerca otra
    vez más tarde (pasado el enfriamiento), puede lanzarse de nuevo,
    indefinidamente. `wasChasing` sustituye al chequeo `hasChased &&
    chasingUntil !== 0` para decidir cuándo recentrar el radio de patrulla
    tras cada persecución.
  - Segundo umbral de altura (`SHARK_CHASE_MIN_OFFSET_HARD=22000`): pasado
    ese punto, la persecución es más rápida (`SHARK_CHASE_SPEED_HARD=290`
    vs 240) y con menos enfriamiento (`SHARK_CHASE_COOLDOWN_MS_HARD=2000`
    vs 4000) — la progresión ya no es solo "puede perseguir sí/no", sino
    "cuán agresiva es esa persecución", calculada en `SharkSpawner.place()`
    a partir de la altura escalada (`START_Y - y`) y pasada al
    constructor de `Shark`.
  - Verificado con un probe dedicado (Playwright, tiburón colocado junto a
    Lumi a una altura escalada por encima del umbral duro, con
    `handleHazardHit` neutralizado solo para el probe): 2 ciclos completos
    de persecución→patrulla→persecución observados de verdad (velocidad
    -290/130/-290, distancia cerrándose y volviendo a abrirse), confirmando
    que el enfriamiento y el nuevo disparo funcionan como se pidió.
- **Nuevo estilo de laberinto: zigzag doble** (pedido explícito: "crea más
  estilos de laberintos con otros diseños que aparezcan más arriba o
  diferentes combinaciones de los ya existentes"). `doubleZigzagMaze`
  (índice 7 en `REEF_TEMPLATES`, `ReefTemplates.ts`) reutiliza el mismo
  mecanismo de seguridad que los otros 3 laberintos (`corridorWall`/
  `edgeReach`, hueco EXACTO garantizado por banda) pero con un ritmo de
  paso distinto: en vez de alternar de lado en CADA banda (A/B/A, como
  `reefLabyrinth`/`miniLabyrinth`) o mezclar corredores con una "puerta"
  central (`grandMaze`), aquí se insiste DOS bandas seguidas en el MISMO
  lado antes de cruzar del todo al otro extremo (A/A/B/B) — un pasillo
  largo pegado a un borde, luego un cruce completo, en vez de un zigzag
  constante. Mismos animales reales dentro según altura
  (`labyrinthAnimalTier`, reutilizado tal cual).
  - Verificado matemáticamente (misma garantía que `reefLabyrinth`: una
    sola pared por banda, `CORRIDOR_REACH_PX=400±5%` como máximo, nunca
    más de 420px de penetración en un mundo de 690px → al menos 270px
    libres siempre) y con un probe de Playwright: 6 instancias generadas a
    distintas alturas, midiendo el hueco libre real de cada banda por
    hitbox — todas entre 280-340px, dentro de lo esperado. Captura in-game
    confirmando que se ve y se lee igual que `reefLabyrinth` (mismo pool de
    rocas), solo con la secuencia de lados distinta.
- **Tramo 4: "gran final" de laberintos** (misma tanda de pedido,
  "diferentes combinaciones de los ya existentes" + "más arriba") —
  extiende el nivel scripteado con 2 laberintos más después de `grandMaze`,
  cada uno más arriba y distinto: un tiburón ya en el umbral agresivo
  (offset 27560) → `reefLabyrinth` REPETIDO (índice 4, hasta ahora solo
  usado una vez al principio de todo, offset 1200 — literalmente "una
  combinación de los ya existentes" en un punto muy distinto del nivel) en
  offset 28710 → un pez volador en el hueco → `doubleZigzagMaze`, el
  estilo nuevo, en offset 31360, cerrando el nivel scripteado en el punto
  más alto y difícil de todos. `ZONE1_LEVEL_END_OFFSET` subido de 28160 a
  33460 en consecuencia (cambio puramente aditivo: ningún offset anterior
  se tocó, solo se extendió la cola). Igual que el resto de repeticiones de
  laberinto, ya no depende de la generación al azar para que el usuario lo
  vea — está garantizado dentro del nivel diseñado a mano.
- **Erizos: nunca combinar tipos distintos "juntos"** (pedido explícito:
  "no combines erizos de distintos tipos juntos"). La ronda anterior
  mezclaba `default`/`long`/`round` dentro de la misma columna vertical y
  dentro de la misma "zona en paralelo" (una fila con un tipo, otra fila
  con otro) — corregido: la columna debut (offset 16920/17120) y las 3
  filas × 2 columnas de la zona en paralelo (offset 18950-19350) usan
  ahora un único tipo cada una. `UrchinSpawner.spawnAt()` (generación al
  azar) también corregido: antes tiraba `randomVariant()` dos veces
  (erizo + su "buddy" cercano), pudiendo salir distinto tipo aunque
  aparecieran a menos de 280px el uno del otro — ahora se sortea una sola
  vez y se reutiliza para ambos.
- **2 estilos de laberinto más, con arte nuevo generado con Gemini**
  (pedido explícito: "crea con Gemini distintos laberintos para
  colocarlos tmb que sean así como los que tenemos pero diferentes").
  Mismo mecanismo EXACTO que `reefLabyrinth` (3 bandas alternando de lado
  A/B/A, hueco EXACTO garantizado por `edgeReach`, animales reales dentro
  según altura vía `labyrinthAnimalTier`) factorizado en un helper
  compartido (`alternatingWallMaze`) — la variedad aquí es de ARTE, no de
  recorrido (ya hay plantillas con recorridos distintos:
  `doubleZigzagMaze`, `grandMaze`).
  - **Arte**: `reef_maze_wall_shell` (muro de conchas/percebes apilados,
    tonos crema/rosa/lavanda) y `reef_maze_wall_sponge` (muro de esponjas
    marinas abultadas, tonos coral/amarillo/naranja pastel), ambos
    generados con Gemini a partir de `maze_wall.png` (el seto de hojas del
    laberinto grande) + `jellyfish.png` + `boulder_rock.png` como anclas,
    pidiendo explícitamente una pared a sangre completa (borde a borde,
    sin huecos) como la referencia. Limpieza de transparencia con el flujo
    normal (sin necesitar el bypass manual esta vez — ninguna de las dos
    salidas crudas disparó la salvaguarda de "más de la mitad borrado").
    Canvas cuadrado 1024×1024 en ambas (a diferencia del 1344×768 de
    `reef_maze_wall`), con bbox medido programáticamente y añadido a
    `HITBOX_FRACTION` en `ReefCluster.ts` (imprescindible: sin esa entrada
    `edgeReach` no sabe calcular el hueco real de la pared) — también
    añadidas a `NO_BREATHE_KEYS` (paredes de laberinto nunca deben
    "respirar": una hitbox que cambia de tamaño en vivo podría cerrar el
    paso).
  - **Nivel scripteado**: Tramo 5 nuevo tras `doubleZigzagMaze`
    (offset 32660) — mantarraya → `shellMaze` (offset 34010, índice 8) →
    balano → `spongeMaze` (offset 36310, índice 9), cerrando el nivel en
    el punto más alto de todos. `ZONE1_LEVEL_END_OFFSET` subido de 33460 a
    38060 (cambio puramente aditivo, igual que el Tramo 4 de la ronda
    anterior).
  - Verificado: `npx tsc --noEmit` limpio, generación de 5 instancias de
    cada plantilla con medición de hueco libre real por hitbox
    (Playwright) — todas entre 283-320px, dentro de lo esperado
    matemáticamente (canvas cuadrado ⇒ penetración a lo largo de la pared
    ronda el propio `reachPx`, muy por debajo del margen de seguridad de
    `CORRIDOR_BAND_SPACING`), captura in-game confirmando arte correcto,
    build de producción empaquetando ambos PNG.
- **Lumi: duplicar frames de idle/swim_right/swim_up/swim_diagonal**
  (pedido explícito: "tan pocos frames se ve cortado, mejoremos y
  agreguemos mucho más frames para su movilidad... agrégale muchos más
  frames para que sea más fluido sus movimientos y saltos entre movimiento
  y otro"). idle pasó de 3 a 6 frames, swim_right/swim_up/swim_diagonal de
  4 a 8 cada una (swim_left/swim_down/boost siguen sin carpeta propia, se
  derivan por flip de swim_right/swim_up; sleep se dejó fuera a propósito,
  ver PRÓXIMA TAREA).
  - **Método**: un frame INTERMEDIO nuevo entre cada par de frames
    consecutivos del ciclo, incluida la vuelta del último al primero (las
    4 animaciones hacen loop con `repeat:-1`, así que esa "costura" final
    también necesitaba su intermedio). Cada frame se generó con Gemini
    pasando SUS DOS VECINOS reales como referencia y pidiendo
    explícitamente "el frame a medio camino entre A y B, no una pose
    nueva" — mismo flujo de `lumi-asset-gen` que ya se usaba para
    correcciones puntuales, aplicado aquí a generación de intermedios.
  - **Registro sin fantasma**: siguiendo la advertencia ya documentada en
    el skill (un frame puede encajar por bounding box completo y aun así
    tener la cabeza desplazada respecto al resto del ciclo), cada frame
    nuevo se realineó sobre un punto focal estable — el OJO — detectado
    programáticamente como el blob oscuro más circular de la cabeza
    (`fill area/bbox ≈0.8, aspecto ≈1`), no por bounding box. En las poses
    de perfil (`swim_up`, `swim_diagonal`) hay una ceja/nariz cercana que
    también sale oscura pero es un trazo fino y alargado (fill bajo,
    aspecto muy distinto de 1) — promediarla con el ojo real (intento
    inicial) desplazaba el punto de registro de forma inconsistente entre
    frames y se notaba como un parpadeo del ojo en el blend de prueba;
    corregido filtrando por circularidad para quedarse solo con el ojo de
    verdad. Verificado con un blend sintético 50% entre cada frame nuevo y
    sus dos vecinos reales (toda la cadena de cada animación, incluida la
    costura del bucle) — cabeza/cara/cuerpo coinciden en una sola silueta
    limpia en los 24 blends, el doble contorno solo aparece en las partes
    que de verdad se mueven (brazos, patas, cola), que es lo esperado.
  - **Un frame crudo de Gemini vino con fondo sólido en vez de
    checkerboard/negro** (un lavado verde-grisáceo cubriendo el lienzo
    entero) que `fix_transparency.py` no detecta (su heurística busca gris
    casi neutro o negro, no cualquier color liso) — se añadió un limpiador
    alternativo (flood-fill tolerante a degradado desde los bordes,
    parando en el salto de contraste real del contorno lavanda del propio
    dibujo) para ese caso puntual, sin tocar el script compartido.
  - `LUMI_FPS` (usado por todas las animaciones de Lumi) se mantiene en 8,
    pero ahora hay una excepción explícita por animación
    (`LUMI_ANIM_FPS` en `LumiAnimConfig.ts`, leída por
    `AnimationRegistry.ts`): idle/swim_right/swim_up/swim_diagonal pasan a
    16 FPS — al doble de frames Y doble de framerate, el ciclo dura
    exactamente lo mismo en tiempo real que antes, solo con el doble de
    resolución temporal (doblar solo los frames sin doblar también el
    framerate habría dejado el mismo ciclo reproduciéndose el doble de
    lento). `sleep` se queda tal cual, a 8 FPS con sus 3 frames de
    siempre.
  - Verificado en juego con Playwright: `game.anims.get(key)` confirma
    8/8/8/6 frames en el orden correcto y 16 FPS para las 4 animaciones
    tocadas, 3 frames/8 FPS sin cambios para `sleep`; capturas in-game de
    Lumi en idle y nadando (arriba/derecha) confirmando que el diseño
    (proporciones, colores, contorno) no cambió, solo la cantidad de
    frames; sin errores de consola nuevos (el único aviso de "MISSING
    asset" es `water_overlay.png`, preexistente y ajeno a esta ronda).
    `npx tsc --noEmit` y build de producción limpios, con los 30 PNG
    nuevos/renumerados empaquetados en `dist/characters/lumi/`.
- **Dragón marino: TERCERA corrección — una sola pieza, sin recortar**
  (pedido explícito: "Me entendiste mal, que el dragón vaya lateralmente
  y en horizontal pero no lo recortes, que ESTE COMPLETO y el nado sea
  muy fluido. QUE VAYA LATERALMENTE TAPANDO TODO PERO SIEMPRE QUE DEJE UN
  ESPACIO POR DONDE PASAR"). La versión anterior (cuerpo+cola como dos
  sprites separados por un hueco fijo) seguía leyéndose como "cortada" —
  el usuario quería la ilustración ENTERA como una sola pieza. Reconstruida
  `sea_dragon.png` (768x1344) apilando verticalmente los dos recortes que
  existían (`sea_dragon_body.png` + `sea_dragon_tail.png`, cortados sin
  solape en el punto exacto de unión, así que la reconstrucción es
  pixel-perfecta y sin costura visible) — ambos archivos viejos borrados.
  `entities/SeaDragon.ts` reescrito de cero: UN solo `Phaser.Physics.Arcade.Image`
  en vez de dos, misma trigonometría de rotación (`rotatedAabb`/
  `rotatePoint`, ya documentada en ReefCluster.ts) pero sobre el bbox
  completo. El "espacio para pasar" ya no es un recorte del propio
  dragón: `SEA_DRAGON_SCALE` se eligió (0.38) para que la longitud
  renderizada (1344×0.38≈511px) quede por debajo de `WORLD_WIDTH` (690px)
  con un margen de ~180px — el mismo espacio de antes, pero ahora
  GARANTIZADO por geometría (longitud fija < ancho del mundo) en vez de
  por un hueco recortado a mano. "El nado sea muy fluido": con una sola
  pieza no hay forma de animar un latigazo de cola independiente, así que
  se combinaron dos oscilaciones simples desfasadas (vaivén de rotación +
  balanceo vertical a otra frecuencia, `SEA_DRAGON_SWAY_*`/`BOB_*` en
  GameConfig.ts) — se lee como un movimiento bastante más orgánico que
  una sola oscilación.
  - Verificado en juego con Playwright: capturas confirmando el cuerpo
    ENTERO visible sin ningún corte (cabeza, cuello, torso serpenteante y
    la cola enroscada, todo de una pieza), `sprite.rotation`/`.y`
    oscilando dentro de los rangos esperados (vaivén ±0.12 rad, balanceo
    ±14px), y colisión letal confirmada de nuevo (mensaje "¡Un dragón
    marino te ha atrapado!"). `npx tsc --noEmit` y build de producción
    limpios, con `sea_dragon.png` empaquetado.
- **Nuevo movimiento: Dash (doble pulsación de dirección)** (pedido
  explícito: "si haces dos veces una misma dirección hace un Dash hacia
  esa dirección, entonces hay que agregarle como un Sprite animado de él
  haciendo el Dash"). Mecánica nueva de punta a punta:
  - **Detección** (`InputController.ts`): registra CUÁNDO empieza cada
    pulsación/deslizamiento nuevo (el flanco de bajada, no que se
    mantenga pulsado) — si la misma dirección vuelve a empezar dentro de
    `DASH_DOUBLE_TAP_WINDOW_MS` (350ms), cuenta como doble toque. En
    teclado son las 4 teclas cardinales (flechas/WASD); en táctil,
    cualquiera de los 8 deslizamientos ya reconocidos por el dial
    existente. `consumeDash()` entrega la petición una vez por frame,
    igual que `getVector()`.
  - **Movimiento** (`Lumi.ts`): `triggerDash()` fija una dirección
    normalizada durante `DASH_DURATION_MS` (280ms) a `DASH_SPEED`
    (2.2× la velocidad normal de nado) con una rebajada final suave
    (`DASH_EASE_MS`) — misma estructura que el impulso del nenúfar. Un
    `dashCooldownRemainingMs` (dash + `DASH_COOLDOWN_MS` extra) evita
    encadenar dashes sin parar con una ráfaga de dobles toques.
  - **Sprite nuevo**: pose de Dash generada con Gemini (NO interpolada de
    ninguna existente) — Lumi estirada como una flecha/torpedo, brazos
    pegados al cuerpo, cola recta y rígida, con líneas de velocidad y
    burbujas comprimidas, vista diagonal desde atrás (mismo ángulo que
    swim_up). 3 frames (vibración sutil de cola/estela por la velocidad)
    a 20 FPS — pedido explícito: "tenlo en cuenta tmb para los sprites
    animados", el mismo criterio de "varios frames = fluido" de la ronda
    anterior aplicado aquí desde el principio, no como retoque posterior.
    Verificado con blend 50% entre los 3 frames: cabeza/cuerpo alineados,
    sin fantasma.
  - **Orientación por rotación, no por flip**: a diferencia de las poses
    de nado (que usan flips + arte propio por eje), el Dash es UNA sola
    pose que se ROTA por código (`sprite.setRotation`, misma trigonometría
    que SeaDragon.ts) para apuntar a las 8 direcciones — posible porque la
    pose está dibujada como un torpedo relativamente simétrico alrededor
    de su eje de avance. Compromiso consciente: en la dirección "abajo"
    (rotación 180°) el personaje queda boca abajo respecto a su pose
    normal — se lee igual como "lanzándose rápido hacia abajo" pero es
    la orientación menos perfecta de las 8, a diferencia de arriba/
    derecha/izquierda que leen limpiamente. Si no convence, la solución
    sería un segundo frame dedicado para el eje vertical, mismo criterio
    que swim_right/swim_up ya tienen arte separado en vez de compartir
    por rotación.
  - Verificado en juego con Playwright: doble toque en las 4 direcciones
    cardinales dispara el Dash con la velocidad/duración/rotación
    correctas (velocidad pico exacta = `DASH_SPEED`, con la rebajada
    final visible en el muestreo), un solo toque NO dispara nada, dos
    direcciones DISTINTAS seguidas no cuentan como doble toque, un doble
    toque más lento que la ventana tampoco — y tras terminar, vuelve
    limpiamente al estado normal (idle o nado según el input del momento,
    sin quedarse pegado en "dash"). Capturas confirmando la pose/rotación
    en las 4 direcciones cardinales. `npx tsc --noEmit` y build de
    producción limpios, con los 3 PNG de dash empaquetados.
- **Pulido de los frames nuevos de idle/swim_up** (pedido explícito: "Vale
  mucho mejor lumi pero púlelo más porque si se nota mucho cambio entre
  frame, más que todo los nuevos frames que agregaste"). Investigado a
  fondo en vez de solo regenerar a ciegas — dos bugs reales distintos,
  ambos con causa raíz identificada antes de tocar nada:
  - **Bug real: lienzo de los 3 frames nuevos de `idle` con ancho/alto
    invertidos.** Las imágenes originales de `idle` miden 1047×1024
    (ancho×alto); al registrar `idle_02`/`04`/`06` se pasaron los
    argumentos de tamaño de lienzo AL REVÉS (1024×1047) en la llamada
    manual de la primera ronda — un sprite de Phaser con origin 0.5/0.5
    centra su textura según las dimensiones de ESE frame, así que cada
    vez que el ciclo entraba en uno de los 3 frames nuevos, el personaje
    saltaba ~11px en X e Y respecto a los frames originales (1047×1024)
    antes de volver a saltar de vuelta — un "tembleque" real cada dos
    frames, justo en la animación de reposo (la que más tiempo se ve).
    `swim_right`/`swim_up`/`swim_diagonal` NO tenían este bug (esas
    llamadas sí leían el tamaño real del archivo original). Arreglado
    re-registrando los 3 frames de `idle` sobre un lienzo de 1047×1024
    (mismo desplazamiento ya calculado, solo cambia el tamaño del lienzo
    final).
  - **Bug real: frames "intermedios" no caían a medio camino, se quedaban
    más cerca del vecino SIGUIENTE que del anterior.** Verificado con una
    métrica objetiva (diferencia de canal alfa acumulada entre frames
    consecutivos, sin depender del ojo): en varios ciclos, el salto hacia
    el frame nuevo era 1.5-6× más grande que el salto desde el frame nuevo
    al siguiente frame real — un ritmo desigual que se lee como "avance
    grande, luego casi nada", justo lo que describe el pedido. El peor
    caso, `swim_up_08` (el frame que cierra el bucle), estaba a un ratio
    de ~5.8:1 — prácticamente un duplicado del frame 1 en vez de un punto
    medio real entre el frame 7 (cola muy enroscada) y el frame 1 (cola
    recta). Regenerado con un prompt mucho más explícito ("EXACTAMENTE a
    medio camino, ni más cerca de A ni de B") — el ratio bajó a ~1.9:1 y
    el blend contra ambos vecinos ahora muestra doble-exposición real en
    los dos lados, no solo en uno. Los desequilibrios menores de
    idle/swim_right/swim_diagonal (ratios ~1.5-2.4:1) se dejaron tal cual
    — un reintento de idle no mejoró la métrica, y perseguir un 50/50
    perfecto en los 30 frames tiene rendimientos decrecientes frente al
    tembleque real que sí se corrigió.
  - Verificado: montaje visual de los 6 frames de `idle` y blends 50%
    de la cadena completa (antes/después) confirmando el mismo silueta
    limpia; `npx tsc --noEmit` y build de producción limpios con los
    4 PNG corregidos empaquetados (`idle_02/04/06.png`, `swim_up_08.png`).

# PENDIENTE

- **"Mejora las animaciones de los animales... vuelvo y te digo"** —
  pedido explícito de la ronda anterior, atendido ahora para el caballito
  de mar (giro circular + segunda pose real con Gemini, ver EN PROGRESO).
  El resto (medusa —aparte del rastro de burbujas—, tiburón, calamar,
  erizo, cangrejo, pez grande, coral trampa, balano) siguen con su
  animación actual (breathe/sway/patrulla por código, sin frames de
  sprite nuevos).
- **"Crea más animales"** — el recuento de animales reales subió a 12 esta
  ronda (mantarraya y pez volador, ambos con arte nuevo y dinámica de
  movimiento propia). Quedan candidatas obvias sin convertir con el
  patrón "animal disfrazado de obstáculo" (cero arte nuevo): `sponge`,
  `decor_pebble`, `decor_starfish` siguen siendo piezas puramente
  decorativas/estáticas.
- **Zona 1 sigue con `grandMaze` muy al final** (offset 25600 de 28160) —
  mover el laberinto de hojas a una posición más temprana (para que se
  vea sin necesitar una carrera muy larga con 1 sola vida) sería un
  cambio de mayor alcance: requiere recalcular todos los offsets
  posteriores del array, no solo insertar una entrada. No se ha hecho
  todavía — si el usuario confirma que quiere verlo antes, conviene
  hacerlo como tarea dedicada en vez de mezclado con otros cambios.
- "Mejora el movimiento... más elaborado" se aplicó a la almeja
  (balanceo) y se probó en el erizo (giro continuo), pero el usuario pidió
  revertir el del erizo explícitamente ("la gracia de ellos es que
  siempre están quietos" — ver EN PROGRESO). El resto (medusa, tiburón,
  calamar, cangrejo, pez grande) ya tenían varios patrones de movimiento
  de rondas anteriores y no se tocaron. Si el usuario sigue viendo alguno
  "muy pacífico" tras esta ronda, pedir cuál en concreto en vez de
  retocar a ciegas — el erizo ya demostró que "pasivo" a veces es a
  propósito.
- El protagonismo visual de los obstáculos de arrecife frente a los
  animales ya se atendió por dos vías: la anémona/coral_fan ahora animan
  mucho más (lectura "se ven quietos") y el hueco entre cúmulos de
  arrecife volvió a su valor base, ~el doble de separado que antes
  (lectura "menos obstáculos que animales") — ver EN PROGRESO. Pendiente
  de la reacción del usuario para saber si esto ya cierra el pedido o si
  quería algo más (p.ej. bajar también su escala/opacidad).
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
que se cerraron, incluido el bug real de la ronda anterior: la mordida de
la almeja nunca llegaba a cerrarse porque `PondScene.update()` deja de
llamarse en cuanto empieza `isDying`, así que cualquier lógica que
dependiera de update(time) después de ese punto nunca se ejecutaba —
solucionado moviendo la secuencia a Phaser.Tweens reales, que sí siguen
avanzando)

# PRÓXIMA TAREA

Esperar la reacción del usuario al pulido de Lumi ("vale mucho mejor
pero púlelo más") — se corrigieron dos bugs reales con causa raíz
identificada (lienzo invertido en 3 frames de idle, frame de cierre de
swim_up muy desequilibrado hacia un lado), pero quedan desequilibrios
menores sin tocar en swim_right/swim_diagonal (ratios ~1.5-2.4:1, un
reintento no mejoró la métrica) — si el usuario TODAVÍA nota "saltos"
después de este arreglo, lo más probable es que apunten a esos, y ahí sí
tocaría o bien regenerar con más intentos o cambiar de estrategia
(frame duration por frame en vez de framerate uniforme, ver
`Phaser.Types.Animations.AnimationFrame.duration`, que permitiría alargar
la duración de los frames "cerca de un extremo" y acortar la de los que
están a medio camino sin tocar el arte).

Esperar también la reacción del usuario a las otras rondas recientes:

1. **Dragón marino, TERCERA corrección** (ahora una sola pieza sin
   cortar, longitud fija menor que WORLD_WIDTH para garantizar espacio
   libre por geometría, vaivén + balanceo vertical para el nado). Las dos
   rondas anteriores del dragón NO acertaron lo que el usuario pedía a la
   primera — la más reciente corrige explícitamente "no lo recortes, que
   ESTE COMPLETO". Verificado en juego que el cuerpo se ve entero sin
   ningún corte y que la animación/colisión funcionan, pero dado el
   historial de esta función concreta, prestar especial atención a la
   próxima reacción del usuario antes de dar esto por cerrado.
2. **Lumi: idle/swim_right/swim_up/swim_diagonal con el doble de frames**
   (3→6 y 4→8, ronda anterior a esta). Verificado programáticamente que
   las 4 animaciones reproducen el número de frames correcto a 16 FPS y
   sin fantasma de cabeza duplicada — pero "se siente más fluido de
   verdad" es inherentemente subjetivo. `sleep` se dejó fuera a propósito.
3. **Dash nuevo (doble pulsación de dirección)**. Mecánica verificada a
   fondo por Playwright (velocidad/duración/rotación exactas, cooldown,
   rechazo correcto de toques simples/direcciones distintas/dobles toques
   lentos, vuelta limpia al estado normal) y sprite nuevo de 3 frames
   verificado sin fantasma — pero quedan dos cosas que solo el usuario
   puede juzgar jugando de verdad: (a) si `DASH_DOUBLE_TAP_WINDOW_MS`
   (350ms), `DASH_SPEED` (2.2×) y `DASH_COOLDOWN_MS` (400ms) SE SIENTEN
   bien (una ventana de doble toque muy corta puede costar de ejecutar a
   propósito; una muy larga puede disparar dashes sin querer durante un
   cambio de dirección normal); (b) la pose rotada se lee bien en
   arriba/derecha/izquierda pero queda "boca abajo" en la dirección
   "abajo" (compromiso documentado en EN PROGRESO) — si el usuario lo
   nota raro, la solución es un frame dedicado para el eje vertical en
   vez de compartir por rotación.

Si el usuario sigue viendo algo "cuadrado" en las paredes de laberinto de
una ronda anterior,
probablemente haga falta ver la captura exacta para saber si es una
plantilla concreta (`reef_maze_wall` de hojas, que sigue siendo casi a
sangre completa por diseño) o un ángulo/escala donde el montículo nuevo
aún no convence. Líneas abiertas explícitas (rondas anteriores, sin
resolver todavía):

0. **Confirmar que la "zona en paralelo" de erizos se lee bien en el
   móvil** — el pasillo libre entre las 2 columnas (offset 18950-19350)
   mide ~260-320px verificado por hitbox real, pero solo se probó en el
   viewport de escritorio de este entorno de test; pedir confirmación real
   en pantalla táctil antes de repetir el patrón en más sitios.
0b. **La partida completa ya es bastante larga** — dos rondas seguidas
   extendieron la cola del nivel scripteado de forma puramente aditiva
   (Tramo 4: 27560-32660; Tramo 5: 32960-37260; `ZONE1_LEVEL_END_OFFSET`
   pasó de 28160 a 38060 en total). Cada extensión por separado es segura
   (nada anterior se movió), pero convendría preguntar al usuario si el
   ritmo de la partida completa hasta el final se sigue sintiendo bien, en
   vez de seguir alargando la cola sin más en la próxima ronda de
   contenido nuevo.
1. **"Mejora las animaciones de los animales"** — atendido para el
   caballito en la ronda anterior; el resto (medusa aparte del rastro de
   burbujas, tiburón, calamar, erizo, cangrejo, pez grande, coral trampa,
   balano, mantarraya, pez volador) sigue con animación por código, sin
   frames de sprite nuevos. Pedir cuál en concreto antes de generar arte a
   ciegas para tantos animales.
2. **"Crea más animales"** — 12 animales reales ya, con las dos últimas
   incorporaciones cubriendo dinámicas de movimiento que no existían
   (barrido diagonal real por el mapa, reposo+salto en arco). Si el
   usuario sigue pidiendo más, las candidatas para el patrón "animal
   disfrazado de obstáculo" (cero arte nuevo) son `sponge`,
   `decor_pebble`, `decor_starfish`.
3. **Mover `grandMaze` a una posición más temprana** — sigue en offset
   25600 (casi al final del tramo scripteado); es una tarea de mayor
   alcance (recalcular offsets posteriores) que merece su propia ronda si
   el usuario confirma que la quiere.
4. **Verificación visual del rastro de burbujas de la medusa** — el código
   está verificado a nivel de objeto (posición/alpha/escala correctos),
   pero no se pudo confirmar por captura de pantalla en este entorno de
   test (limitación general del headless con partículas de Phaser, no
   algo específico de esta función — el `boostBurst` ya confirmado en
   producción tiene el mismo problema de captura). Pedir confirmación
   visual real al usuario en el próximo turno.
