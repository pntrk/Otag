// Görseli belleğe ön yükleme (Asset Cache)
export const grassImage = new Image();
grassImage.crossOrigin = 'anonymous';
grassImage.src = '/assets/environment/map_grass_tile.webp';

let cachedScaledGrassCanvas: HTMLCanvasElement | null = null;
let lastSourceImage: HTMLImageElement | null = null;

export function getScaledGrassCanvas(image: HTMLImageElement, scale: number = 0.20): HTMLCanvasElement {
  if (cachedScaledGrassCanvas && lastSourceImage === image) {
    return cachedScaledGrassCanvas;
  }
  const grassScale = Math.max(0.18, Math.min(0.22, scale)); // 0.18 - 0.22 mikro ölçek
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = Math.max(1, Math.round(image.width * grassScale));
  patternCanvas.height = Math.max(1, Math.round(image.height * grassScale));
  const pctx = patternCanvas.getContext('2d')!;
  pctx.imageSmoothingEnabled = true;
  pctx.imageSmoothingQuality = 'high';
  pctx.drawImage(image, 0, 0, patternCanvas.width, patternCanvas.height);
  cachedScaledGrassCanvas = patternCanvas;
  lastSourceImage = image;
  return patternCanvas;
}

export const renderMapTerrain = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: { x: number; y: number },
  zoom: number
) => {
  const tileSize = 40 * zoom;
  if (grassImage.complete && grassImage.naturalWidth > 0) {
    const patternCanvas = getScaledGrassCanvas(grassImage, 0.20);
    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    if (pattern) {
      ctx.save();
      // Kamera kaydırma ve zoom değerlerini desene matematiksel olarak pürüzsüz bağlama
      const offsetX = ((width / 2 - camera.x * tileSize) % patternCanvas.width + patternCanvas.width) % patternCanvas.width;
      const offsetY = ((height / 2 - camera.y * tileSize) % patternCanvas.height + patternCanvas.height) % patternCanvas.height;

      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = pattern;
      ctx.fillRect(-patternCanvas.width, -patternCanvas.height, width + patternCanvas.width * 2, height + patternCanvas.height * 2);
      ctx.restore();
      return;
    }
  }

  // Yüklenene kadar yedek doğal zemin
  ctx.fillStyle = '#4d7c2a';
  ctx.fillRect(0, 0, width, height);
};

