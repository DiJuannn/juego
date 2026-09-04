import Phaser from "phaser";

/**
 * Peces de fondo puramente decorativos, muy detrás de Lumi (parallax lento,
 * escala pequeña). El arte (16 peces) lo subió el usuario ya recortado con
 * matting ML; aquí solo se anima su nado (movimiento + balanceo), que es
 * lógica de juego, no arte nuevo.
 */
// fish_14 y fish_16 se descartaron: su aleta dorsal queda cortada en seco
// (el dibujo original se sale del recuadro de su celda en la hoja de
// referencia), no es un artefacto de recorte que se pueda arreglar sin
// inventar el trozo que falta.
const EXCLUDED_FISH = new Set([14, 16]);
export const FISH_KEYS = Array.from({ length: 16 }, (_, i) => i + 1)
  .filter((n) => !EXCLUDED_FISH.has(n))
  .map((n) => `fish_${String(n).padStart(2, "0")}`);

// Pedido explícito (revisión de Zona 1): fauna ambiental "en cardumen", no
// cada pez derivando de forma totalmente independiente. Se agrupan en
// grupos pequeños (2-4) que comparten dirección/velocidad — cada miembro
// mantiene un offset fijo respecto al "ancla" del grupo (que se mueve como
// llevaría el líder) más su propio balanceo individual, así el grupo se
// lee como una unidad sin necesitar boids de verdad para algo puramente
// decorativo.
const SCHOOL_SIZE_MIN = 2;
const SCHOOL_SIZE_MAX = 4;
const MEMBER_OFFSET_SPACING = 34;

interface School {
  anchorX: number;
  anchorY: number;
  speed: number;
  direction: 1 | -1;
}

interface FishState {
  sprite: Phaser.GameObjects.Image;
  school: School;
  offsetX: number;
  offsetY: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmplitude: number;
  wagPhase: number;
  wagSpeed: number;
}

export class BackgroundFishField {
  private fish: FishState[] = [];
  private schools: School[] = [];
  private worldWidth: number;
  private scrollFactor: number;

  constructor(
    scene: Phaser.Scene,
    worldWidth: number,
    initialViewHeight: number,
    depth: number,
    scrollFactor: number,
    count = 10,
  ) {
    this.worldWidth = worldWidth;
    this.scrollFactor = scrollFactor;

    let remaining = count;
    while (remaining > 0) {
      const size = Math.min(remaining, Phaser.Math.Between(SCHOOL_SIZE_MIN, SCHOOL_SIZE_MAX));
      remaining -= size;

      const school: School = {
        anchorX: Phaser.Math.Between(0, worldWidth),
        anchorY: Phaser.Math.Between(initialViewHeight * 0.15, initialViewHeight * 0.85),
        speed: Phaser.Math.FloatBetween(12, 26),
        direction: Math.random() < 0.5 ? 1 : -1,
      };
      this.schools.push(school);

      for (let i = 0; i < size; i++) {
        const key = Phaser.Utils.Array.GetRandom(FISH_KEYS);
        const scale = Phaser.Math.FloatBetween(0.12, 0.2);
        // Offsets en abanico alrededor del ancla, no en fila india — un
        // grupo real no nada en columna perfecta.
        const offsetX = (i - (size - 1) / 2) * MEMBER_OFFSET_SPACING + Phaser.Math.FloatBetween(-6, 6);
        const offsetY = Phaser.Math.FloatBetween(-16, 16);

        const sprite = scene.add
          .image(school.anchorX + offsetX, school.anchorY + offsetY, key)
          .setScale(scale)
          .setScrollFactor(scrollFactor)
          .setDepth(depth)
          .setAlpha(0.8)
          .setTint(0xcfe6ff);
        // El arte original mira a la derecha; si nada a la izquierda se voltea.
        sprite.setFlipX(school.direction === -1);

        this.fish.push({
          sprite,
          school,
          offsetX,
          offsetY,
          bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
          bobSpeed: Phaser.Math.FloatBetween(0.6, 1.1),
          bobAmplitude: Phaser.Math.FloatBetween(6, 14),
          wagPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
          wagSpeed: Phaser.Math.FloatBetween(2.5, 4),
        });
      }
    }
  }

  update(time: number, delta: number, cameraScrollY: number, viewHeight: number) {
    const margin = 150;

    for (const school of this.schools) {
      school.anchorX += school.speed * school.direction * (delta / 1000);
      if (school.direction === 1 && school.anchorX > this.worldWidth + margin) {
        school.anchorX = -margin;
      } else if (school.direction === -1 && school.anchorX < -margin) {
        school.anchorX = this.worldWidth + margin;
      }

      // Igual que antes: la cámara solo sube y esta capa tiene scrollFactor
      // < 1, así que el grupo se queda "atrás" — se recicla por delante de
      // la vista actual cuando cae por debajo, todo el grupo a la vez para
      // no romper la formación.
      const screenY = school.anchorY - cameraScrollY * this.scrollFactor;
      if (screenY > viewHeight + margin) {
        school.anchorY = cameraScrollY * this.scrollFactor - Phaser.Math.Between(20, 200);
        school.anchorX = Phaser.Math.Between(0, this.worldWidth);
      }
    }

    for (const f of this.fish) {
      f.sprite.x = f.school.anchorX + f.offsetX;
      f.sprite.y =
        f.school.anchorY + f.offsetY + Math.sin((time / 1000) * f.bobSpeed + f.bobPhase) * f.bobAmplitude;

      // Balanceo leve del cuerpo (rotación) para dar sensación de nado sin
      // necesitar frames nuevos: solo transforma la imagen existente.
      f.sprite.rotation = Math.sin((time / 1000) * f.wagSpeed + f.wagPhase) * 0.09;
    }
  }

  destroy() {
    for (const f of this.fish) f.sprite.destroy();
    this.fish = [];
    this.schools = [];
  }
}
