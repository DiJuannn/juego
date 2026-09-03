# LUMI — GUÍA DE PRODUCCIÓN Y REGLAS DEL PROYECTO

Este documento es la referencia oficial para cualquier trabajo (humano o IA) sobre el
juego de Lumi. Claude Code debe leer este archivo ANTES de tocar cualquier código
relacionado con personajes, fondos, animaciones o assets visuales.

## 🎯 REGLA PRINCIPAL

**Claude Code NO dibuja, NO diseña y NO genera arte.**

Claude Code se encarga únicamente de:

- movimiento del personaje
- físicas
- cámara
- colisiones
- inventario
- diálogos
- puzzles
- menús
- guardado
- reproducción de animaciones (sprite sheets)
- lógica del mundo y parallax

Todo el arte (personaje, fondos, objetos, criaturas) se genera fuera del código, como
assets ya terminados, y se referencia en `/assets`.

### REGLA VISUAL IMPORTANTE

Claude nunca debe recrear o generar arte del juego proceduralmente.
No usar SVG genéricos, formas geométricas como placeholder de personajes,
ni gradientes/dibujos procedurales para el entorno.

Toda identidad visual debe venir de archivos en `/assets`.
Si un asset no existe, usar un placeholder claramente marcado
(ej. caja gris con texto "MISSING: swim_up") y reportarlo,
en vez de inventar un diseño nuevo.

## 🦎 PERSONAJE — LUMI

Diseño oficial, NO se rediseña bajo ninguna circunstancia.

**Debe conservar siempre:**

- cabeza redondeada, cuerpo pequeño y redondeado
- color base rosa pálido
- ojos pequeños, oscuros (morado/negro), forma simple
- boca simple, curva, sin dientes
- mejillas con sonrojado suave
- branquias externas rosa más oscuro, con detalle de "venas", a ambos lados de la cabeza
- extremidades cortas y redondeadas
- contorno azul/lavanda (nunca negro)
- cola rosa pálida con borde rosa más oscuro
- expresión simple y adorable
- estilo de ilustración pastel, dibujado a mano, colores planos, sin sombreado duro

**Prohibido:**

- rediseñar proporciones o anatomía
- estilo realista
- pixel art
- outlines negros
- aumentar el detalle anatómico
- accesorios o ropa no aprobados

## 🎬 ANIMACIONES BASE (ya generadas como poses clave)

| Animación | Descripción | Carpeta |
|---|---|---|
| Idle / flotando | Cuerpo flotando, brazos ligeramente extendidos, cola en curva suave (sin gravedad) | `/assets/characters/lumi/idle/` |
| Nadar izquierda | Espejo de nadar derecha | `/assets/characters/lumi/swim_left/` |
| Nadar derecha | Cuerpo lateral, cola curvada, branquias hacia atrás | `/assets/characters/lumi/swim_right/` |
| Nadar arriba | Cuerpo diagonal/vertical, cabeza arriba, cola abajo, burbujas debajo | `/assets/characters/lumi/swim_up/` |
| Nadar abajo | Cuerpo diagonal, cabeza abajo, cola arqueada hacia arriba/atrás, burbujas arriba | `/assets/characters/lumi/swim_down/` |
| Impulso (cola arriba) | Misma pose idle, cola en curva hacia arriba (frame de transición) | `/assets/characters/lumi/boost/` |
| Dormir | Sentado, curvado, ojos cerrados (^ ^), branquias relajadas hacia abajo, cozy | `/assets/characters/lumi/sleep/` |

Cada carpeta contendrá los frames intermedios (generados por interpolación en ComfyUI)
entre las poses clave, ya limpios y exportados como PNG con fondo transparente.

**Convención de nombres:**

```
/assets/characters/lumi/idle/idle_01.png
/assets/characters/lumi/idle/idle_02.png
/assets/characters/lumi/swim_up/swim_up_01.png
```

**Requisitos técnicos por animación:**

- mismo tamaño de canvas en todos los frames de una misma animación
- mismo punto de pivote/referencia (centro del cuerpo)
- fondo transparente
- loop limpio (el último frame conecta bien con el primero, salvo animaciones no
  cíclicas como "boost")

## 🌊 FONDOS

Los fondos NUNCA se generan como una sola imagen plana. Se separan en capas para
permitir parallax y pequeñas animaciones independientes.

**Estructura por escena/nivel:**

```
/assets/backgrounds/pond/
  background_far.png     (más lejano — se mueve más lento)
  distant_plants.png
  rocks_back.png
  water_overlay.png      (semi-transparente, efecto agua)
  lily_pads.png
  foreground_plants.png  (más cercano — se mueve más rápido)
  particles/             (burbujas, partículas sueltas, mini-loop 2-4 frames)
```

Cada capa es una ilustración fija (no requiere animación de IA). El movimiento
(parallax, balanceo de plantas, burbujas subiendo) lo implementa Claude Code
moviendo/animando las capas por código, nunca regenerando la imagen.

**Estilo de fondo (debe coincidir con el personaje):**

- ilustración 2D dibujada a mano, formas orgánicas, contornos suaves
- colores pastel: azul acuático predominante, verdes desaturados, rosas suaves
- textura de pincel, pequeñas imperfecciones dibujadas
- nada de estética 3D, realismo, pixel art ni outlines negros

## 🎮 CÁMARA Y ESCALA

- Cámara 2D lateral / ligeramente top-down (no top-down puro estilo Pokémon clásico)
- Lumi ocupa aproximadamente 10–15% de la pantalla
- El escenario es grande alrededor del personaje

## 📁 ESTRUCTURA COMPLETA DEL PROYECTO

```
/lumi-game
  /assets
    /characters/lumi/
      idle/
      swim_up/
      swim_down/
      swim_left/
      swim_right/
      boost/
      sleep/
    /backgrounds/pond/
    /objects/              (nenúfares, piedras, burbujas, estrellas, conchas)
  /reference               <- imágenes originales, "biblia visual", NO tocar
  STYLE_GUIDE.md            <- este documento
  CLAUDE.md                 <- este documento (mismo contenido, referenciado por Claude Code)
```

## 🔧 CÓMO PEDIRLE TAREAS A CLAUDE CODE

Una tarea concreta a la vez. Nunca "haz el juego completo".

**Ejemplo correcto:**

```
Implementa el sprite animado de Lumi en estado idle.
Usa los frames en /assets/characters/lumi/idle/ (idle_01.png a idle_04.png).
Reprodúcelos en loop a 8 FPS.
No generes ni modifiques ningún asset visual.
Si falta algún frame, repórtalo, no lo inventes.
```

**Orden sugerido de tareas:**

1. Cargar y reproducir animación idle
2. Cargar y reproducir animaciones de nado (arriba/abajo/izquierda/derecha)
3. Input del jugador → cambiar de animación según dirección
4. Fondo con parallax (capas del pond)
5. Colisiones básicas
6. Animación de dormir (trigger por inactividad)
7. Resto de sistemas (inventario, diálogos, puzzles, guardado)

## 🚫 REGLAS QUE NUNCA SE ROMPEN

- Claude Code no dibuja personajes ni fondos, bajo ninguna excusa
- Ningún asset se reemplaza por una versión "procedural" aunque sea temporal
- Si un asset falta, se reporta como faltante — nunca se inventa un reemplazo
- El diseño de Lumi (proporciones, colores, branquias, contorno) es inamovible
- Toda nueva pose o asset debe pasar primero por el flujo de generación de arte
  (ComfyUI/Gemini) y aprobación visual, antes de integrarse al código
