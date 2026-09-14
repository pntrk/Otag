import { ResourceNode, Village } from '../types/game';
import { getVillageRadius } from './radiusEngine';
import { getNodeEfficiency } from './resourceEngine';
import { 
  REAL_TURKEY_COASTLINE_GEO, 
  REAL_LAKES_GEO, 
  REAL_RIVERS_GEO, 
  geoToMap 
} from '../data/realTurkeyGeoData';
import { grassImage, getScaledGrassCanvas } from './mapTerrainRenderer';
import { normalizeFactionKey } from './villageRenderer';

// Doğal Çevre Kaynak Sprite'ları (public/assets/environment/ & public/assets/villages/)
const rawResourceImages: Record<string, HTMLImageElement> = {};

// 1. KURAL: BEYAZ ARKA PLANLARI OTOMATİK TEMİZLEME (ALPHA MASKING / COLOR-KEYING CACHE)
// İşlenmiş şeffaf görselleri bellek önbelleğinde (Map<string, HTMLCanvasElement>) sakla
const cleanedCanvasCache: Map<string, HTMLCanvasElement> = new Map();
// Mipmap boyut önbelleği (Hızlı 60 FPS render için: 32, 64, 128, 256)
const mipmapCache: Map<string, Map<number, HTMLCanvasElement>> = new Map();

/**
 * Piksel Tarama ve Alpha Maskeleme Fonksiyonu
 * RGB değerleri 230'un üzerindeki tüm beyaz/kırık beyaz piksellerin alpha kanalını 0 yapar.
 * 215-230 aralığındaki sınır pikselleri için yumuşak anti-alias kenar geçişi uygular.
 */
function processAlphaMasking(img: HTMLImageElement | HTMLCanvasElement, key: string): HTMLCanvasElement {
  const width = img instanceof HTMLImageElement ? (img.naturalWidth || img.width || 256) : img.width;
  const height = img instanceof HTMLImageElement ? (img.naturalHeight || img.height || 256) : img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, width, height);

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue;

      // Tam beyaz veya kırık beyaz / açık gri pikseller (RGB > 210)
      if (r > 210 && g > 210 && b > 210) {
        data[i + 3] = 0;
      } else if (r > 195 && g > 195 && b > 195) {
        // Yumuşak kenar geçişi (Anti-aliasing)
        const minChannel = Math.min(r, g, b);
        const factor = (210 - minChannel) / 15;
        data[i + 3] = Math.round(a * Math.max(0, Math.min(1, factor)));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (_) {
    // Cross-origin fallback
  }

  // Temizlenmiş şeffaf canvas'ı sakla
  cleanedCanvasCache.set(key, canvas);

  // Mipmap piramidini oluştur
  const sizeMap = new Map<number, HTMLCanvasElement>();
  [32, 64, 128, 256, 512].forEach(bucket => {
    try {
      const mc = document.createElement('canvas');
      mc.width = bucket;
      mc.height = bucket;
      const mctx = mc.getContext('2d');
      if (mctx) {
        mctx.imageSmoothingEnabled = true;
        mctx.imageSmoothingQuality = 'high';
        mctx.drawImage(canvas, 0, 0, bucket, bucket);
        sizeMap.set(bucket, mc);
      }
    } catch (_) {}
  });
  mipmapCache.set(key, sizeMap);

  return canvas;
}

if (typeof window !== 'undefined') {
  const resourceFiles: Record<string, string> = {
    wood: '/assets/environment/wood.webp',
    stone: '/assets/environment/stone.webp',
    iron: '/assets/environment/iron.webp',
    grain: '/assets/environment/grain.webp',
    gold: '/assets/environment/gold.webp',
    village_fort: '/assets/environment/map_village_fort.webp',
    village_tent: '/assets/environment/map_village_tent.webp',
    village_osman_t1: '/assets/villages/village_osman_t1.webp',
    village_osman_t2: '/assets/villages/village_osman_t2.webp',
    village_karaman_t1: '/assets/villages/village_karaman_t1.webp',
    village_karaman_t2: '/assets/villages/village_karaman_t2.webp',
    village_aydin_t1: '/assets/villages/village_aydin_t1.webp',
    village_aydin_t2: '/assets/villages/village_aydin_t2.webp',
    village_candar_t1: '/assets/villages/village_candar_t1.webp',
    village_candar_t2: '/assets/villages/village_candar_t2.webp',
    village_germiyan_t1: '/assets/villages/village_germiyan_t1.webp',
    village_germiyan_t2: '/assets/villages/village_germiyan_t2.webp',
  };

  Object.entries(resourceFiles).forEach(([key, src]) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      processAlphaMasking(img, key);
    };

    img.onerror = () => {
      if (!img.src.includes('/drawable/')) {
        img.src = `/drawable/${key}.webp`;
      }
    };

    rawResourceImages[key] = img;
  });
}

/**
 * 1. KURAL ENTEGRASYONU: Temizlenmiş Şeffaf Mipmap Sprite Getirici
 */
function getCleanedResourceSprite(type: string, targetSize: number): CanvasImageSource | null {
  // Önce temizlenmiş mipmap önbelleğine bak
  const sizeMap = mipmapCache.get(type);
  if (sizeMap) {
    let bucket = 64;
    if (targetSize <= 42) bucket = 32;
    else if (targetSize <= 84) bucket = 64;
    else if (targetSize <= 160) bucket = 128;
    else bucket = 256;

    const cached = sizeMap.get(bucket);
    if (cached) return cached;
  }

  const cleaned = cleanedCanvasCache.get(type);
  if (cleaned) return cleaned;

  // Ham görsel yüklendiyse anında tara ve temizle
  const rawImg = rawResourceImages[type];
  if (rawImg && rawImg.complete && rawImg.naturalWidth > 0) {
    return processAlphaMasking(rawImg, type);
  }

  return rawImg || null;
}

/**
 * 3. KURAL: DOĞAL KAYNAK ÇİZİM FONKSİYONU (ZEMİN KAİDESİ & GÖLGE ENTEGRASYONU)
 * - Buğday: Altına dairesel altın-kehribar ezilmiş harman toprağı kaidesi (rgba(217, 119, 6, 0.4) -> saydam)
 * - Taş & Demir: Altına koyu gri-kahve oyulmuş maden ocağı toprağı (rgba(68, 64, 60, 0.45) -> saydam)
 * - Odun / Koru: Altına koyu orman altı gölgesi (rgba(20, 83, 45, 0.35) -> saydam)
 * - Altın: Yaldızlı sıcak kuvars toprağı (rgba(245, 158, 11, 0.45) -> saydam)
 */
export function drawNaturalResourceNode(
  ctx: CanvasRenderingContext2D,
  node: ResourceNode,
  sx: number,
  sy: number,
  size: number,
  zoom: number = 1.0,
  isCaptured: boolean = false
) {
  ctx.save();

  // 0. UZAK ZOOM OPTİMİZASYONU (LOD: Level Of Detail)
  if (zoom < 0.35) {
    const dotRadius = Math.max(2.5, size * 0.28);
    let color = '#10b981';
    if (node.type === 'grain') color = '#eab308';
    else if (node.type === 'stone') color = '#94a3b8';
    else if (node.type === 'iron') color = '#f87171';
    else if (node.type === 'gold') color = '#fbbf24';

    ctx.fillStyle = isCaptured ? 'rgba(245, 158, 11, 0.45)' : 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(sx, sy, dotRadius + 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // 3. KURAL GEREĞİ: ZEMİN KAİDESİ (FOOTPRINT / DECALS)
  const groundW = size * 0.58;
  const groundH = size * 0.38;
  const groundY = sy + size * 0.12;

  const grad = ctx.createRadialGradient(sx, groundY, size * 0.04, sx, groundY, groundW);
  if (node.type === 'grain') {
    // Buğday / Tarla: Altına dairesel, altın-kehribar tonlarında ezilmiş harman toprağı kaidesi
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.40)');
    grad.addColorStop(0.55, 'rgba(217, 119, 6, 0.18)');
    grad.addColorStop(1, 'rgba(217, 119, 6, 0)');
  } else if (node.type === 'stone') {
    // Taş: Altına koyu gri-kahve oyulmuş maden ocağı toprağı
    grad.addColorStop(0, 'rgba(68, 64, 60, 0.45)');
    grad.addColorStop(0.55, 'rgba(50, 45, 40, 0.20)');
    grad.addColorStop(1, 'rgba(68, 64, 60, 0)');
  } else if (node.type === 'iron') {
    // Demir: Altına koyu gri-kızıl maden ocağı toprağı
    grad.addColorStop(0, 'rgba(68, 64, 60, 0.45)');
    grad.addColorStop(0.55, 'rgba(75, 40, 35, 0.22)');
    grad.addColorStop(1, 'rgba(68, 64, 60, 0)');
  } else if (node.type === 'gold') {
    // Altın Madeni
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    grad.addColorStop(0.55, 'rgba(217, 119, 6, 0.18)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  } else {
    // Odun / Koru: Altına koyu orman altı gölgesi
    grad.addColorStop(0, 'rgba(20, 83, 45, 0.35)');
    grad.addColorStop(0.55, 'rgba(20, 83, 45, 0.14)');
    grad.addColorStop(1, 'rgba(20, 83, 45, 0)');
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(sx, groundY, groundW, groundH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Yumuşak Temas Gölgesi (Contact Shadow)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.30)';
  ctx.beginPath();
  ctx.ellipse(sx + size * 0.02, groundY + size * 0.04, size * 0.34, size * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Köy Etki Alanı Sınır Vurgusu
  if (isCaptured) {
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.50)';
    ctx.lineWidth = Math.max(1, 1.2 * Math.min(1.2, zoom));
    ctx.beginPath();
    ctx.ellipse(sx, groundY, groundW * 0.95, groundH * 0.95, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 1. KURAL GEREĞİ: Şeffaf Alpha Masking Sprite Çizimi
  const sprite = getCleanedResourceSprite(node.type, size);
  if (sprite) {
    const spriteSize = size * 1.14;
    const drawX = sx - spriteSize / 2;
    const drawY = sy - spriteSize / 2 - size * 0.06;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, drawX, drawY, spriteSize, spriteSize);
  }

  // ========================================================================
  // 2. KURAL: BEYAZ DAİRESEL VERİMLİLİK ROZETİ (Radius: 9px, Beyaz Dolgu, Koyu Gri Kenarlık, Siyah Kalın 2-9 Rakamı)
  // ========================================================================
  if (zoom >= 0.38) {
    const efficiencyVal = getNodeEfficiency(node);
    const badgeR = Math.max(7.5, Math.min(10.5, 9 * Math.min(1.2, Math.max(0.85, zoom))));
    // Kaynağın sağ üst köşesinde net ve belirgin rozet konumu
    const badgeX = sx + size * 0.26;
    const badgeY = sy - size * 0.18;

    ctx.save();
    // Beyaz Dairesel Dolgu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fill();

    // Koyu Gri Kenarlık
    ctx.strokeStyle = isCaptured ? '#1e293b' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Siyah Kalın Verimlilik Rakamı (2 - 9)
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(9, Math.floor(badgeR * 1.25))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${efficiencyVal}`, badgeX, badgeY + 0.5);

    // Köyün etki çemberi içindeyse minik yeşil nokta vurgusu
    if (isCaptured) {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(badgeX + badgeR - 2, badgeY - badgeR + 2, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 3. & 4. KURAL: UMAYKUT KÖYÜ & OTAĞ ÇİZİMİ (TABAN HİZALAMA, ZEMİN KAİDESİ, GÖLGE, SUR ÇİTİ & HUD)
 * - 1. Taban Hizalama (Ground-Anchor): (groundX = sx + tileSize/2, groundY = sy + tileSize * 0.85).
 * - 2. Oba Meydanı Zemin Kaidesi (Trampled Earth Decal): scale(1.0, 0.55) basık doğal ezilmiş toprak elipsi.
 * - 3. Zemin Temas & Güneş Gölgesi (Contact AO & Sun-cast Shadow): +X: 3px, +Y: 2px güneş açılı temas gölgesi.
 * - 4. Sur / Çit Kaidesi (Wall Palisade Decal): village.buildings.wall > 0 ise kütük çit ve hendek çemberi.
 * - 5. İsim Plakası ve Bilgi Etiketi (Ground + 4px): Binanın taban çizgisinin hemen altına yerleştirilir.
 */
export function drawMapVillage(
  ctx: CanvasRenderingContext2D,
  village: Village,
  sx: number,
  sy: number,
  tileSize: number,
  zoom: number = 1.0,
  isCurrent: boolean = false,
  isPlayer: boolean = true,
  isHighlighted: boolean = false,
  isSelected: boolean = false,
  isHovered: boolean = false
) {
  // 1. KURAL: TABAN HİZALAMA (GROUND-ANCHOR / BOTTOM-CENTER OFFSET)
  const groundX = sx + tileSize / 2;
  const groundY = sy + tileSize * 0.72;
  const scale = Math.max(0.55, Math.min(2.2, zoom));

  ctx.save();

  const townHallLevel = village.buildings?.town_hall || 1;
  const tier = townHallLevel <= 10 ? 't1' : 't2';
  const fKey = normalizeFactionKey(village.faction);
  const factionSpriteKey = `village_${fKey}_${tier}`;

  // Köy Boyutu (1.65x tile boyutu)
  const spriteSize = Math.max(38, Math.floor(tileSize * 1.65));
  const sprite = getCleanedResourceSprite(factionSpriteKey, spriteSize) || 
                 getCleanedResourceSprite(tier === 't2' ? 'village_fort' : 'village_tent', spriteSize);

  // Zemin Kaidesi Yarıçapları (Yatay basık elips: scale(1.0, 0.52))
  const radiusX = spriteSize * 0.58;
  const radiusY = radiusX * 0.52;

  // ========================================================================
  // 2. KURAL: OBA MEYDANI ZEMİN KAİDESİ (TRAMPLED EARTH DECAL)
  // ========================================================================
  // 2.1 Geniş Doğal Ezilmiş Oba Toprağı (Çimen dokusunu kırarak yerleşim hissi veren sıcak ova tabanı)
  const dirtGrad = ctx.createRadialGradient(
    groundX, groundY, Math.max(2, radiusX * 0.05),
    groundX, groundY, radiusX
  );
  dirtGrad.addColorStop(0, 'rgba(115, 85, 45, 0.55)');   // Merkezde sıcak toprak / toz sarısı
  dirtGrad.addColorStop(0.45, 'rgba(100, 75, 40, 0.38)'); // Orta geçiş halkası
  dirtGrad.addColorStop(0.75, 'rgba(80, 60, 30, 0.18)');  // Çimen kaynaşma tonu
  dirtGrad.addColorStop(1, 'rgba(60, 45, 25, 0)');        // Pürüzsüz şeffaflaşma

  ctx.fillStyle = dirtGrad;
  ctx.beginPath();
  ctx.ellipse(groundX, groundY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2.2 İç Taş / Çakıl Oba Temeli (Otağ/bina altı sert zemin)
  const innerPlatGrad = ctx.createRadialGradient(
    groundX - 1 * scale, groundY - 1 * scale, 1,
    groundX, groundY, radiusX * 0.70
  );
  innerPlatGrad.addColorStop(0, 'rgba(138, 115, 82, 0.50)');
  innerPlatGrad.addColorStop(0.65, 'rgba(84, 66, 46, 0.35)');
  innerPlatGrad.addColorStop(1, 'rgba(60, 45, 30, 0)');

  ctx.fillStyle = innerPlatGrad;
  ctx.beginPath();
  ctx.ellipse(groundX, groundY, radiusX * 0.70, radiusY * 0.70, 0, 0, Math.PI * 2);
  ctx.fill();

  // ========================================================================
  // 4. KURAL: SUR / ÇİT KAİDESİ VE SEVİYE GÖRSELLEŞTİRMESİ
  // ========================================================================
  const wallLvl = village.buildings?.wall || 0;
  if (wallLvl > 0) {
    ctx.save();
    // Minyatür Dairesel Kütük Çit / Hendek Çizgisi
    ctx.strokeStyle = 'rgba(78, 53, 30, 0.65)';
    ctx.lineWidth = Math.max(1.2, 1.5 * Math.min(1.2, zoom));
    ctx.beginPath();
    ctx.ellipse(groundX, groundY, radiusX * 0.95, radiusY * 0.95, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Seviye 5 ve üzeri surlar için çift tahkimat / kütük kazık hendeği
    if (wallLvl >= 5) {
      ctx.strokeStyle = 'rgba(92, 64, 34, 0.50)';
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3 * scale, 3 * scale]);
      ctx.beginPath();
      ctx.ellipse(groundX, groundY, radiusX * 1.10, radiusY * 1.10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Seviye 10 ve üzeri surlar için taş burç takviyesi
    if (wallLvl >= 10) {
      ctx.strokeStyle = 'rgba(168, 140, 100, 0.40)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(groundX, groundY, radiusX * 0.85, radiusY * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ========================================================================
  // 3. ZEMİN GÖLGESİ (Basık ve çadırın tam altına)
  // ========================================================================
  const renderWidth = tileSize * 1.3;
  const renderHeight = tileSize * 1.3;
  
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(groundX, groundY, renderWidth * 0.38, renderHeight * 0.16, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 10, 5, 0.55)';
  ctx.fill();
  ctx.restore();

  // Vurgulama Halka Efekti (Filtrede veya Hedef Olarak Seçildiğinde)
  if (isHighlighted) {
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(groundX, groundY, (radiusX * 1.25) * pulse, (radiusY * 1.25) * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ HEDEF', groundX, groundY - renderHeight - 6);
    ctx.restore();
  }

  // Seçili Köy Vurgusu (Altın Kaide Işıması)
  if (isSelected || isCurrent) {
    ctx.save();
    ctx.strokeStyle = isCurrent ? '#fbbf24' : '#60a5fa';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = isCurrent ? '#f59e0b' : '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(groundX, groundY, radiusX * 1.15, radiusY * 1.15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ========================================================================
  // 1. KURAL GEREĞİ: ÇADIR SPRITE'I (Tabanı gölgenin tam ortasına gömülecek şekilde)
  // ========================================================================
  // Sprite altındaki şeffaf boşluk (padding) havada asılı hissi yarattığı için, 
  // çadırı oldukça aşağıya (renderHeight'ın %55-60'ı kadar) bastırıyoruz.
  const drawY = groundY - (renderHeight * 0.60);
  const drawX = groundX - (renderWidth / 2);

  if (sprite) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sprite, drawX, drawY, renderWidth, renderHeight);
  } else {
    // Prosedürel Otağ / Fallback
    const yx = groundX;
    const yy = groundY - 14 * scale;
    const yr = 15 * scale;

    ctx.fillStyle = 'rgba(30, 40, 15, 0.35)';
    ctx.beginPath();
    ctx.ellipse(yx + 2, groundY, yr * 0.9, yr * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    const roofGrad = ctx.createRadialGradient(yx, yy - yr * 0.3, 1, yx, yy, yr);
    roofGrad.addColorStop(0, '#c23333');
    roofGrad.addColorStop(0.6, '#991b1b');
    roofGrad.addColorStop(1, '#5c0f0f');
    ctx.fillStyle = roofGrad;
    ctx.beginPath();
    ctx.arc(yx, yy, yr * 0.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Beylik Sancağı / Flama (Direği çadırın sol kenarından zemine oturtalım)
  const poleX = groundX - 12 * scale;
  const poleY = groundY - renderHeight * 0.45; // Sancak tepesi
  const poleH = renderHeight * 0.45; // Direğin boyu tam zemine (groundY) kadar insin

  let flagColor = '#dc2626';
  if (village.faction === 'karamanogullari') flagColor = '#1e3a8a';
  else if (village.faction === 'aydinogullari') flagColor = '#047857';
  else if (village.faction === 'candarogullari') flagColor = '#b45309';
  else if (village.faction === 'dulkadirogullari') flagColor = '#7c2d12';

  ctx.strokeStyle = '#351602';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(poleX, poleY + poleH);
  ctx.lineTo(poleX, poleY);
  ctx.stroke();

  const flagW = 11 * scale;
  const flagH = 14 * scale;
  ctx.fillStyle = flagColor;
  ctx.beginPath();
  ctx.moveTo(poleX, poleY);
  ctx.lineTo(poleX + flagW, poleY + 2 * scale);
  ctx.lineTo(poleX + flagW * 0.7, poleY + flagH * 0.55);
  ctx.lineTo(poleX + flagW, poleY + flagH);
  ctx.lineTo(poleX, poleY + flagH - 2 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ========================================================================
  // 5. KURAL: İSİM PLAKASI VE BİLGİ ETİKETİ KONUMU
  // ========================================================================
  if (zoom >= 0.35) {
    const isDetailed = isSelected || isHovered;
    const labelHeight = 15;
    const r = 3;

    const mainText = `${village.name} - Sv.${townHallLevel}`;
    ctx.font = 'bold 9px sans-serif';
    const textW = ctx.measureText(mainText).width;
    const boxW = Math.max(textW + 14, 52);
    const boxH = isDetailed ? 28 : labelHeight;
    const boxX = groundX - boxW / 2;
    const boxY = groundY + 8; // Çadırın tepesine değil, gölgenin hemen altına yerleştirilir

    ctx.save();
    ctx.fillStyle = isCurrent 
      ? 'rgba(30, 24, 12, 0.92)' 
      : isPlayer 
      ? 'rgba(15, 23, 42, 0.88)' 
      : 'rgba(35, 15, 15, 0.88)';
    
    ctx.strokeStyle = isCurrent 
      ? '#f59e0b' 
      : isPlayer 
      ? 'rgba(245, 158, 11, 0.5)' 
      : 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(boxX + r, boxY);
    ctx.lineTo(boxX + boxW - r, boxY);
    ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
    ctx.lineTo(boxX + boxW, boxY + boxH - r);
    ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
    ctx.lineTo(boxX + r, boxY + boxH);
    ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
    ctx.lineTo(boxX, boxY + r);
    ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isCurrent ? '#fef08a' : isPlayer ? '#f8fafc' : '#fca5a5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainText, groundX, boxY + (isDetailed ? 8 : labelHeight / 2));

    if (isDetailed) {
      const subText = `${village.ownerName} (${village.x}|${village.y})`;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(subText, groundX, boxY + 20);
    }

    ctx.restore();
  }

  ctx.restore();
}

/**
 * Umaykut Klasik Taktik Harita Motoru Sınıfı
 */
export class UmaykutTacticalRenderer {
  private static grassPattern: CanvasPattern | null = null;
  private static patternCanvas: HTMLCanvasElement | null = null;

  // Gerçek Anadolu Kıyı Poligonu ve Gölleri
  private static cachedCoastline = REAL_TURKEY_COASTLINE_GEO.map(pt => geoToMap(pt.lon, pt.lat));
  private static cachedLakes = [
    { name: 'Van Gölü', points: REAL_LAKES_GEO.vanGolu.points.map(pt => geoToMap(pt.lon, pt.lat)), color: '#1a3e63', isSalt: false },
    { name: 'Tuz Gölü', points: REAL_LAKES_GEO.tuzGolu.points.map(pt => geoToMap(pt.lon, pt.lat)), color: '#7a92a6', isSalt: true },
    { name: 'Beyşehir Gölü', points: REAL_LAKES_GEO.beysehirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)), color: '#2563eb', isSalt: false },
    { name: 'Eğirdir Gölü', points: REAL_LAKES_GEO.egirdirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)), color: '#2563eb', isSalt: false },
    { name: 'İznik Gölü', points: REAL_LAKES_GEO.iznikGolu.points.map(pt => geoToMap(pt.lon, pt.lat)), color: '#2563eb', isSalt: false },
    { name: 'Sapanca Gölü', points: REAL_LAKES_GEO.sapancaGolu.points.map(pt => geoToMap(pt.lon, pt.lat)), color: '#2563eb', isSalt: false },
  ];
  private static cachedRivers = REAL_RIVERS_GEO.map(r => ({
    name: r.name,
    points: r.points.map(pt => geoToMap(pt.lon, pt.lat))
  }));

  /**
   * 2. KURAL: ZEMİN DOKUSU ÖLÇEK DÜZELTMESİ (MICRO-SCALE TILING)
   * Scale 0.18 - 0.22 oranında küçülterek mikro doku halinde döşer.
   */
  private static initGrassPattern(ctx: CanvasRenderingContext2D) {
    if (grassImage.complete && grassImage.naturalWidth > 0) {
      const pc = getScaledGrassCanvas(grassImage, 0.20);
      if (this.patternCanvas !== pc) {
        this.grassPattern = ctx.createPattern(pc, 'repeat');
        this.patternCanvas = pc;
      }
      return;
    }

    if (this.grassPattern) return;

    // Yüklenene kadar yedek prosedürel desen
    const pc = document.createElement('canvas');
    pc.width = 64;
    pc.height = 64;
    const pctx = pc.getContext('2d');
    if (!pctx) return;

    pctx.fillStyle = '#688c38';
    pctx.fillRect(0, 0, 64, 64);

    pctx.fillStyle = 'rgba(122, 163, 62, 0.35)';
    pctx.beginPath();
    pctx.arc(20, 20, 18, 0, Math.PI * 2);
    pctx.fill();

    pctx.fillStyle = 'rgba(84, 116, 42, 0.45)';
    pctx.beginPath();
    pctx.arc(48, 48, 22, 0, Math.PI * 2);
    pctx.fill();

    this.grassPattern = ctx.createPattern(pc, 'repeat');
    this.patternCanvas = pc;
  }

  /**
   * 1. ÇAYIR ZEMİNİ & GENİŞ DÜZ OVA HARİTASI ÇİZİMİ
   */
  public static renderTerrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    tileSize: number,
    worldToScreen: (wx: number, wy: number) => { sx: number; sy: number }
  ) {
    this.initGrassPattern(ctx);

    ctx.save();
    
    // Doğal Çayır Çimeni Tabanı (Tüm ekran alabildiğine düz ve kesintisiz yeşil ova)
    if (this.grassPattern) {
      ctx.fillStyle = this.grassPattern;
    } else {
      ctx.fillStyle = '#688c38';
    }
    ctx.fillRect(0, 0, width, height);

    // Çayır Çiçekleri ve Doğal Detaylar
    if (tileSize >= 16) {
      for (let tx = Math.floor(minX); tx <= Math.ceil(maxX); tx += 1) {
        for (let ty = Math.floor(minY); ty <= Math.ceil(maxY); ty += 1) {
          const hash = ((tx * 374761393) ^ (ty * 668265263)) >>> 0;
          if (hash % 23 === 0) {
            const { sx, sy } = worldToScreen(tx + 0.35, ty + 0.35);
            ctx.fillStyle = (hash % 2 === 0) ? '#fef08a' : '#ffffff';
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (hash % 41 === 0) {
            const { sx, sy } = worldToScreen(tx + 0.6, ty + 0.7);
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  }

  /**
   * 5. KURAL: ETKİ ÇEMBERLERİ VE IZGARA TEMİZLİĞİ
   * - Yalnızca seçili/aktif köyün etki çemberi belirgin olsun (rgba(245, 158, 11, 0.65) altın sarısı, ince çizgi).
   * - Diğer köylerin çember opaklığını maksimum %6 seviyesine çek (rgba(255, 255, 255, 0.06)) veya zoom out durumunda tamamen gizle.
   */
  public static renderInfluenceRings(
    ctx: CanvasRenderingContext2D,
    villages: Village[],
    currentVillageId: string,
    worldToScreen: (wx: number, wy: number) => { sx: number; sy: number },
    width: number,
    height: number,
    tileSize: number,
    zoom: number = 1.0,
    selectedVillageId?: string
  ) {
    villages.forEach(v => {
      const isSelected = selectedVillageId ? (v.id === selectedVillageId) : (v.id === currentVillageId);
      const isCurrent = v.id === currentVillageId;
      const isHighlighted = isSelected || isCurrent;

      // Zoom %50'nin altındayken seçili olmayan köylerin çemberlerini tamamen gizle
      if (!isHighlighted && zoom < 0.50) {
        return;
      }

      // Umaykut kuralı: Köyün etki yarıçapı 1.0 ile 2.5 birim arasındadır
      const radiusTiles = getVillageRadius(v);
      const { sx, sy } = worldToScreen(v.x + 0.5, v.y + 0.5);
      const radPx = radiusTiles * tileSize;

      if (sx + radPx < 0 || sx - radPx > width || sy + radPx < 0 || sy - radPx > height) return;

      ctx.save();

      if (isHighlighted) {
        // Yalnızca seçili/aktif köy: Altın yaldızlı kesikli çizgi (setLineDash([6, 6]))
        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
        ctx.beginPath();
        ctx.arc(sx, sy, radPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 6]);
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sx, sy, radPx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Diğer köyler: Maksimum %6 seviyesinde ince hat
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(sx, sy, radPx, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  /**
   * 3. & 4. KURAL UMAYKUT KÖY ÇİZİM KÖPRÜSÜ
   */
  public static renderVillage(
    ctx: CanvasRenderingContext2D,
    village: Village,
    sx: number,
    sy: number,
    tileSize: number,
    zoom: number,
    isCurrent: boolean,
    isPlayer: boolean,
    isHighlighted: boolean = false,
    isSelected: boolean = false,
    isHovered: boolean = false
  ) {
    drawMapVillage(
      ctx, 
      village, 
      sx, 
      sy, 
      tileSize, 
      zoom, 
      isCurrent, 
      isPlayer, 
      isHighlighted, 
      isSelected, 
      isHovered
    );
  }

  /**
   * 3. KURAL UMAYKUT KAYNAK DÜĞÜMÜ ÇİZİMİ
   */
  public static renderResourceNode(
    ctx: CanvasRenderingContext2D,
    node: ResourceNode,
    sx: number,
    sy: number,
    tileSize: number,
    zoom: number,
    isCaptured: boolean,
    isHighlighted: boolean = false
  ) {
    const cx = sx + tileSize / 2;
    const cy = sy + tileSize / 2;

    ctx.save();

    if (isHighlighted) {
      const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
      ctx.save();
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.0;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, (tileSize * 0.48) * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("▼", cx, cy - tileSize * 0.48);
      ctx.restore();
    }

    drawNaturalResourceNode(ctx, node, cx, cy, tileSize, zoom, isCaptured);

    ctx.restore();
  }
}

