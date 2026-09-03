# Anclas canónicas de estilo

Set mínimo de imágenes ya existentes en el repo que se deben adjuntar como
referencia visual en toda llamada a Gemini para generar arte nuevo (ver
`scripts/gen_asset.py`). No son arte nuevo: son la fuente de verdad ya
aprobada, elegidas por representar mejor cada categoría de elemento.

| Categoría | Archivo |
|---|---|
| Personaje | `assets/characters/lumi/idle/idle_01.png` |
| Roca | `assets/backgrounds/pond/rocks_back.png` |
| Planta/alga | `assets/backgrounds/pond/distant_plants/distant_plants_01.png` |
| Pez | `assets/objects/fish/fish_01.png` |
| Criatura peligro | `assets/objects/enemies/jellyfish.png` |
| Prop interactivo | `assets/objects/lily_pad/lily_pad_01.png` |
| Partícula | `assets/backgrounds/pond/particles/bubble_big.png` |
| Fondo/cielo | `assets/backgrounds/pond/background_far.png` |

## Uso

Para cada asset nuevo, elegir 2-4 anclas de la tabla más cercanas a lo que se
va a generar (p.ej. para un coral nuevo: roca + planta + pez, para dar forma
orgánica + paleta + tratamiento de contorno). Nunca generar solo con prompt
de texto sin al menos una imagen de referencia — es la causa principal de
deriva de estilo.

Cuando una zona ya tenga su primer asset aprobado (p.ej. el coral principal
de la Zona 2), ese asset se añade como ancla adicional para el resto de esa
misma zona, para mantener coherencia interna además de coherencia global.
