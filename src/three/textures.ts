import * as THREE from "three";
import { hashString, nextRandom } from "@/utils/rng";

/**
 * Procedural planet textures.
 *
 * No external image assets are used, so the application works completely
 * offline and never renders a broken texture. Each body gets a deterministic
 * 512×256 equirectangular canvas texture generated from a seeded generator,
 * so a given planet always looks the same.
 */

export type TextureStyle = "rocky" | "terrestrial" | "cloudy" | "gas" | "ice" | "star" | "ring";

const cache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function colorToCss(color: number, alpha = 1): string {
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((color >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((color >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((color & 255) * factor)));
  return (r << 16) | (g << 8) | b;
}

function drawStyle(
  canvas: HTMLCanvasElement,
  style: TextureStyle,
  baseColor: number,
  seed: number,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  let rngState = seed || 1;

  ctx.fillStyle = colorToCss(baseColor);
  ctx.fillRect(0, 0, width, height);

  const rand = () => {
    const result = nextRandom(rngState);
    rngState = result.state;
    return result.value;
  };

  if (style === "gas" || style === "ice") {
    // Horizontal bands with soft turbulence.
    const bandCount = style === "gas" ? 16 : 10;
    for (let band = 0; band < bandCount; band += 1) {
      const y = (band / bandCount) * height;
      const bandHeight = height / bandCount + rand() * 4;
      const factor = 0.82 + rand() * 0.36;
      ctx.fillStyle = colorToCss(shade(baseColor, factor));
      ctx.fillRect(0, y, width, bandHeight);
    }
    // Turbulent streaks.
    for (let i = 0; i < 90; i += 1) {
      const y = rand() * height;
      const h = 1 + rand() * 6;
      const factor = 0.7 + rand() * 0.6;
      ctx.fillStyle = colorToCss(shade(baseColor, factor), 0.28);
      ctx.fillRect(0, y, width, h);
    }
    if (style === "gas") {
      // A storm oval.
      const x = width * (0.2 + rand() * 0.6);
      const y = height * (0.25 + rand() * 0.5);
      ctx.fillStyle = colorToCss(shade(baseColor, 0.7), 0.75);
      ctx.beginPath();
      ctx.ellipse(x, y, width * 0.06, height * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === "terrestrial") {
    // Continents: irregular blobs over an ocean.
    ctx.fillStyle = colorToCss(shade(baseColor, 0.55));
    ctx.fillRect(0, 0, width, height);
    const land = shade(baseColor, 1.45);
    for (let i = 0; i < 26; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = 8 + rand() * 42;
      ctx.fillStyle = colorToCss(land, 0.85);
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.4) {
        const radius = r * (0.6 + rand() * 0.7);
        const px = x + Math.cos(a) * radius;
        const py = y + Math.sin(a) * radius * 0.6;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Polar caps.
    ctx.fillStyle = "rgba(240, 248, 255, 0.85)";
    ctx.fillRect(0, 0, width, height * 0.07);
    ctx.fillRect(0, height * 0.93, width, height * 0.07);
  } else if (style === "cloudy") {
    // Thick cloud deck with swirling structure.
    for (let i = 0; i < 220; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = 10 + rand() * 60;
      const factor = 0.85 + rand() * 0.4;
      ctx.fillStyle = colorToCss(shade(baseColor, factor), 0.16);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === "rocky") {
    // Craters and maria.
    for (let i = 0; i < 160; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = 2 + rand() * 16;
      const factor = 0.72 + rand() * 0.5;
      ctx.fillStyle = colorToCss(shade(baseColor, factor), 0.5);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 12; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = 18 + rand() * 44;
      ctx.fillStyle = colorToCss(shade(baseColor, 0.6), 0.4);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === "star") {
    const gradient = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      0,
      width * 0.5,
      height * 0.5,
      width * 0.5,
    );
    gradient.addColorStop(0, colorToCss(shade(baseColor, 1.25)));
    gradient.addColorStop(0.6, colorToCss(baseColor));
    gradient.addColorStop(1, colorToCss(shade(baseColor, 0.7)));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 160; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = 1 + rand() * 5;
      ctx.fillStyle = colorToCss(shade(baseColor, 1.6), 0.5);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Texture style appropriate to a body type. */
export function styleForType(type: string, name: string): TextureStyle {
  if (type === "star") return "star";
  if (type === "gas giant") return "gas";
  if (type === "ice giant") return "ice";
  if (name === "Earth") return "terrestrial";
  if (name === "Venus") return "cloudy";
  return "rocky";
}

/**
 * Get (and cache) the procedural texture for a body.
 */
export function getPlanetTexture(
  id: string,
  style: TextureStyle,
  baseColor: number,
  resolution: "low" | "medium" | "high" = "high",
): THREE.CanvasTexture {
  const key = `${id}-${style}-${resolution}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const width = resolution === "low" ? 256 : resolution === "medium" ? 512 : 1024;
  const height = width / 2;
  const canvas = makeCanvas(width, height);
  drawStyle(canvas, style, baseColor, hashString(id));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = resolution === "high" ? 8 : 4;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

/** Ring texture for the ringed planets. */
export function getRingTexture(id: string, resolution: "low" | "medium" | "high" = "high"): THREE.CanvasTexture {
  const key = `ring-${id}-${resolution}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const width = resolution === "low" ? 128 : 512;
  const height = 8;
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    let rngState = hashString(`ring-${id}`) || 7;
    const rand = () => {
      const result = nextRandom(rngState);
      rngState = result.state;
      return result.value;
    };
    ctx.clearRect(0, 0, width, height);
    for (let x = 0; x < width; x += 1) {
      const density = 0.25 + rand() * 0.6;
      const gap = rand() < 0.12 ? 0.08 : 1;
      ctx.fillStyle = `rgba(226, 214, 183, ${density * gap})`;
      ctx.fillRect(x, 0, 1, height);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  cache.set(key, texture);
  return texture;
}

/** Soft radial glow sprite used for the Sun's corona. */
export function getGlowTexture(resolution: "low" | "medium" | "high" = "high"): THREE.CanvasTexture {
  const key = `glow-${resolution}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = resolution === "low" ? 128 : 256;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255, 236, 190, 0.95)");
    gradient.addColorStop(0.25, "rgba(255, 186, 92, 0.45)");
    gradient.addColorStop(0.6, "rgba(255, 140, 60, 0.12)");
    gradient.addColorStop(1, "rgba(255, 120, 40, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

/** Release every cached texture — used when the graphics quality changes. */
export function disposeTextureCache(): void {
  cache.forEach((texture) => texture.dispose());
  cache.clear();
}
