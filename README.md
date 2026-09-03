# Ajolote: Hacia la Luz

Runner vertical 3D: un ajolote nada sin parar hacia la superficie del mar,
esquivando peligros y recogiendo perlas de luz antes de quedarse sin
oxígeno.

Construido con Next.js, React Three Fiber (Three.js) y Zustand. Todo el
audio es sintetizado en el navegador con la Web Audio API (sin ficheros de
sonido).

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Controles

- **PC**: flechas / WASD para nadar, espacio para impulso.
- **Móvil**: arrastra el dedo para dirigirte, botón IMPULSO en pantalla.

## Estructura

- `components/Player.tsx` — el ajolote (geometría procedural, sin modelos externos).
- `components/World.tsx` + `components/Entity.tsx` — generación y colisión de obstáculos/coleccionables.
- `components/Environment.tsx` — niebla, luces y partículas por zona de profundidad.
- `components/GameCanvas.tsx` — cámara, bucle de juego y postprocesado.
- `lib/` — estado global (Zustand), constantes de balance, generación de patrones y audio procedural.

## Build

```bash
npm run build
```
