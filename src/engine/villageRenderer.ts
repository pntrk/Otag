import { Village } from '../types/game';

// 10 Görselin Önbelleğe Alınması (Faction & Tier Sprites)
export const FACTION_TIER_SPRITES: Record<string, HTMLImageElement> = {};
export const FACTION_CLEANED_SPRITES: Record<string, HTMLCanvasElement> = {};
const factions = ['karaman', 'osman', 'aydin', 'candar', 'germiyan'];
const tiers = ['t1', 't2'];

function cleanVillageImageAlpha(img: HTMLImageElement, key: string) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 256;
    canvas.height = img.naturalHeight || img.height || 256;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;
      if (r > 210 && g > 210 && b > 210) {
        data[i + 3] = 0;
      } else if (r > 195 && g > 195 && b > 195) {
        const factor = (210 - Math.min(r, g, b)) / 15;
        data[i + 3] = Math.round(a * Math.max(0, Math.min(1, factor)));
      }
    }
    ctx.putImageData(imgData, 0, 0);
    FACTION_CLEANED_SPRITES[key] = canvas;
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  factions.forEach((f) => {
    tiers.forEach((t) => {
      const key = `${f}_${t}`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `/assets/villages/village_${key}.webp`;
      img.onload = () => {
        cleanVillageImageAlpha(img, key);
      };
      img.onerror = () => {
        // Fallback to osman sprite if not loaded
        if (key !== 'osman_t1') {
          img.src = '/assets/villages/village_osman_t1.webp';
        }
      };
      FACTION_TIER_SPRITES[key] = img;
    });
  });
}

/**
 * Beylik ismini dosya adına uygun normalize etme yardımcısı
 */
export function normalizeFactionKey(faction?: string): string {
  if (!faction) return 'osman';
  const f = faction.toLowerCase();
  if (f.includes('karaman')) return 'karaman';
  if (f.includes('aydin')) return 'aydin';
  if (f.includes('candar')) return 'candar';
  if (f.includes('germiyan')) return 'germiyan';
  if (f.includes('dulkadir')) return 'germiyan'; // Dulkadir fallback to Germiyan/Anatolia
  if (f.includes('osman')) return 'osman';
  return 'osman';
}

export interface FactionVillageRenderData {
  name: string;
  faction?: string;
  townHallLevel?: number;
  ownerName?: string;
  isPlayer?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

/**
 * Kullanıcı tanımlı Çizim Fonksiyonu
 * Seviye Mantığı: 1-10 arası t1 (köy/oba), 11-20 arası t2 (hisar/başkent)
 * Etrafındaki kaynaklardan belirgin biçimde daha büyük (1.75x) ve şeffaf zeminle araziye doğal entegre
 */
export function drawFactionVillage(
  ctx: CanvasRenderingContext2D,
  village: FactionVillageRenderData,
  sx: number,
  sy: number,
  size: number
) {
  ctx.save();

  const townHallLevel = village.townHallLevel || 1;
  const tier = townHallLevel <= 10 ? 't1' : 't2';
  const factionKey = normalizeFactionKey(village.faction);
  const spriteKey = `${factionKey}_${tier}`;
  const sprite = FACTION_CLEANED_SPRITES[spriteKey] || FACTION_TIER_SPRITES[spriteKey] || FACTION_CLEANED_SPRITES['osman_t1'] || FACTION_TIER_SPRITES['osman_t1'];

  // Köy Boyutu: Etrafındaki kaynaklardan daha büyük (1.75x tile boyutu)
  const spriteSize = Math.max(40, Math.floor(size * 1.75));

  // Zemin Temas Çizgisi (Ground Baseline Y)
  const groundY = sy + size * 0.18;
  const groundRadiusX = spriteSize * 0.52;
  const groundRadiusY = spriteSize * 0.24;

  // 1. Zemin Tabanı & Doğal Temas Gölgesi (Harita çimenine ve topoğrafyaya pürüzsüz kaynaşır)
  // 1.1 Geniş Toprak/Çakıl Meydan Kaidesi
  const outerDirtGrad = ctx.createRadialGradient(
    sx, groundY, 2,
    sx, groundY, groundRadiusX * 1.30
  );
  outerDirtGrad.addColorStop(0, 'rgba(107, 79, 44, 0.65)');
  outerDirtGrad.addColorStop(0.45, 'rgba(120, 92, 54, 0.40)');
  outerDirtGrad.addColorStop(0.80, 'rgba(85, 105, 45, 0.20)');
  outerDirtGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = outerDirtGrad;
  ctx.beginPath();
  ctx.ellipse(sx, groundY, groundRadiusX * 1.30, groundRadiusY * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1.2 İç Taş Kaide
  const innerPlatGrad = ctx.createRadialGradient(
    sx - 2, groundY - 2, 1,
    sx, groundY, groundRadiusX * 0.82
  );
  innerPlatGrad.addColorStop(0, 'rgba(138, 115, 82, 0.70)');
  innerPlatGrad.addColorStop(0.70, 'rgba(84, 66, 46, 0.50)');
  innerPlatGrad.addColorStop(1, 'rgba(60, 45, 30, 0)');
  ctx.fillStyle = innerPlatGrad;
  ctx.beginPath();
  ctx.ellipse(sx, groundY, groundRadiusX * 0.82, groundRadiusY * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1.3 Güneş Açılı Projeksiyon Gölgesi (Sağ-aşağı)
  const castShadowX = sx + 4;
  const castShadowY = groundY + 2;
  const castShadowW = spriteSize * 0.46;
  const castShadowH = spriteSize * 0.22;
  const shadowGrad = ctx.createRadialGradient(
    castShadowX, castShadowY, 2,
    castShadowX, castShadowY, castShadowW
  );
  shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
  shadowGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.28)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(castShadowX, castShadowY, castShadowW, castShadowH, 0.12, 0, Math.PI * 2);
  ctx.fill();

  // 1.4 Güçlü Zemin Temas Gölgesi (Contact AO Shadow)
  ctx.fillStyle = 'rgba(10, 15, 20, 0.65)';
  ctx.beginPath();
  ctx.ellipse(sx, groundY + 1, spriteSize * 0.38, spriteSize * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 1.1 Seçili Köy Göstergesi (Altın Işıma)
  if (village.isSelected) {
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(sx, groundY, groundRadiusX * 1.15, groundRadiusY * 1.15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 1.2 Hedef / Savaş Vurgusu (Kırmızı Titreşimli Işıma)
  if (village.isHighlighted) {
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.14;
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.6;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(sx, groundY, (groundRadiusX * 1.25) * pulse, (groundRadiusY * 1.25) * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Köy Sprite'ı (Şeffaf Arka Planlı Oba veya Hisar Görseli - Tabanı Zemine Sıfırlanır)
  const isReady = sprite && (
    sprite instanceof HTMLCanvasElement || 
    (sprite instanceof HTMLImageElement && sprite.complete && sprite.naturalWidth > 0)
  );
  if (isReady && sprite) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const drawX = sx - spriteSize / 2;
    const drawY = groundY - spriteSize * 0.88;
    ctx.drawImage(sprite, drawX, drawY, spriteSize, spriteSize);
  }

  // 3. Seviye Rozeti (Top-Right Medallion: t1 için tunç, t2 için altın/bakır)
  const badgeR = Math.max(7.5, Math.floor(spriteSize * 0.10));
  const badgeX = sx + spriteSize * 0.28;
  const badgeY = groundY - spriteSize * 0.74;

  ctx.save();
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = tier === 't1' ? '#78350f' : '#b45309'; // Tunç / Altın-Bakır
  ctx.fill();
  ctx.strokeStyle = tier === 't1' ? '#f59e0b' : '#fbbf24';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(8, Math.floor(badgeR * 1.18))}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${townHallLevel}`, badgeX, badgeY + 0.5);
  ctx.restore();

  // 4. Zarif Parşömen İsim Şeridi (Köyün Tabanının Altında Sade ve Okunaklı)
  if (size >= 24) {
    const nameStr = village.name;
    const fontSize = Math.max(8.5, Math.floor(size * 0.24));
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(nameStr).width;
    const bannerW = Math.max(textWidth + 16, size * 1.1);
    const bannerH = Math.max(15, Math.floor(size * 0.32));
    const bannerX = sx - bannerW / 2;
    const bannerY = groundY + groundRadiusY * 0.45;

    ctx.save();
    // Parşömen arkaplanı (Yarı saydam koyu taş)
    ctx.fillStyle = 'rgba(18, 22, 28, 0.90)';
    ctx.strokeStyle = village.isPlayer ? '#f59e0b' : '#64748b';
    ctx.lineWidth = village.isSelected ? 1.5 : 1.0;

    // Yuvarlak köşeli etiket
    const r = 3;
    ctx.beginPath();
    ctx.moveTo(bannerX + r, bannerY);
    ctx.lineTo(bannerX + bannerW - r, bannerY);
    ctx.quadraticCurveTo(bannerX + bannerW, bannerY, bannerX + bannerW, bannerY + r);
    ctx.lineTo(bannerX + bannerW, bannerY + bannerH - r);
    ctx.quadraticCurveTo(bannerX + bannerW, bannerY + bannerH, bannerX + bannerW - r, bannerY + bannerH);
    ctx.lineTo(bannerX + r, bannerY + bannerH);
    ctx.quadraticCurveTo(bannerX, bannerY + bannerH, bannerX, bannerY + bannerH - r);
    ctx.lineTo(bannerX, bannerY + r);
    ctx.quadraticCurveTo(bannerX, bannerY, bannerX + r, bannerY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // İsim Metni
    ctx.fillStyle = village.isPlayer ? '#fef08a' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameStr, sx, bannerY + bannerH / 2);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Oyun içi Village modelini ekran koordinatlarına çizen ana fonksiyon
 */
export function drawMapVillage(
  ctx: CanvasRenderingContext2D,
  village: Village,
  sx: number,
  sy: number,
  size: number,
  isSelected: boolean = false,
  isHighlighted: boolean = false
) {
  const townHallLevel = village.buildings?.town_hall || 1;
  const renderData: FactionVillageRenderData = {
    name: village.name,
    faction: village.faction,
    townHallLevel,
    ownerName: village.ownerName,
    isPlayer: village.isPlayer,
    isSelected,
    isHighlighted,
  };

  drawFactionVillage(ctx, renderData, sx, sy, size);
}
