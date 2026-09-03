# Ajolote: Hacia la Luz

Runner vertical 2D con estética kawaii pastel: un ajolote nada sin parar
hacia la superficie del mar, esquivando peligros y recogiendo perlas de
luz antes de quedarse sin oxígeno.

Construido con Next.js, React (SVG + DOM animado por `requestAnimationFrame`,
sin motor 3D) y Zustand. Todo el audio es sintetizado en el navegador con
la Web Audio API (sin ficheros de sonido).

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Controles

- **PC**: flechas / WASD para nadar (izquierda/derecha), espacio para impulso.
- **Móvil**: arrastra el dedo para dirigirte, botón IMPULSO en pantalla.

## Estructura

- `components/AxolotlSprite.tsx` — el ajolote (SVG dibujado a mano, chibi/kawaii).
- `components/World2D.tsx` + `components/Entity2D.tsx` — generación y colisión de obstáculos/coleccionables 2D.
- `components/Background2D.tsx` — cielo con degradado, siluetas y partículas por zona de profundidad.
- `components/GameStage.tsx` — bucle de juego (requestAnimationFrame), física y posicionamiento.
- `lib/` — estado global (Zustand), constantes de balance, generación de patrones y audio procedural.

## Build

```bash
npm run build
```
