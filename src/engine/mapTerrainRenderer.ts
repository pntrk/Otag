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
  zoom: number,
  mode: string = 'umaykut_meadow'
) => {
  const tileSize = 40 * zoom;

  // Özel Stratejik Modlar İçin Zemin İşleme
  if (mode === 'parchment') {
    const pGrad = ctx.createLinearGradient(0, 0, width, height);
    pGrad.addColorStop(0, '#f5ecd7');
    pGrad.addColorStop(0.5, '#ede0c2');
    pGrad.addColorStop(1, '#dfceaa');
    ctx.fillStyle = pGrad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (mode === 'political') {
    const polGrad = ctx.createLinearGradient(0, 0, width, height);
    polGrad.addColorStop(0, '#ebe0ca');
    polGrad.addColorStop(0.5, '#ded1b6');
    polGrad.addColorStop(1, '#d1c2a3');
    ctx.fillStyle = polGrad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (mode === 'military') {
    const milGrad = ctx.createLinearGradient(0, 0, width, height);
    milGrad.addColorStop(0, '#15100c');
    milGrad.addColorStop(0.5, '#1e140d');
    milGrad.addColorStop(1, '#121914');
    ctx.fillStyle = milGrad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  if (mode === 'economic') {
    const ecoGrad = ctx.createLinearGradient(0, 0, width, height);
    ecoGrad.addColorStop(0, '#2d4424');
    ecoGrad.addColorStop(0.5, '#3b4e1e');
    ecoGrad.addColorStop(1, '#483c18');
    ctx.fillStyle = ecoGrad;
    ctx.fillRect(0, 0, width, height);
    return;
  }

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

