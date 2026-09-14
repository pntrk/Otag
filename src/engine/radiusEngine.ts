/**
 * 13. Yüzyıl Anadolu Beylikleri - Umaykut Online Harita Etki Çemberi (Radius) Motoru
 * (Village Influence Radius & Periodic Growth Engine)
 * 
 * Umaykut Kuralları:
 * 1. Başlangıç Yarıçapı: 1.0 birim.
 * 2. Azami Yarıçap: 2.5 birim.
 * 3. Artış Miktarı: Periyodik olarak +0.1 birim.
 * 4. Beylik Taban Büyüme Süreleri (+0.1 için):
 *    - Candaroğulları: 120 saat (Okul ile min 40 saate iner)
 *    - Osmanoğulları: 150 saat (Okul ile min 50 saate iner)
 *    - Dulkadiroğulları: 160 saat (Okul ile min 50 saate iner)
 *    - Karamanoğulları: 180 saat (Okul ile min 60 saate iner)
 *    - Aydınoğulları: 180 saat (Okul ile min 60 saate iner)
 * 5. Okul (Medrese) Çarpanı: Köydeki Okul binasının her seviyesi büyüme süresini taban değerden minimum değere doğru orantılı olarak kısaltır.
 * 6. Yarıçap 2.5 birime ulaştığında büyüme kalıcı olarak durur.
 */

import { FactionId, Village } from '../types/game';

export const INITIAL_VILLAGE_RADIUS = 4.0;
export const MAX_VILLAGE_RADIUS = 15.0;
export const RADIUS_GROWTH_STEP = 0.25;
export const MAX_SCHOOL_LEVEL = 20;

export interface RadiusFactionConfig {
  baseHours: number;
  minHours: number;
}

export const RADIUS_FACTION_CONFIGS: Record<FactionId, RadiusFactionConfig> = {
  kayi: { baseHours: 150, minHours: 50 },
  osmanogullari: { baseHours: 150, minHours: 50 },
  karaman: { baseHours: 180, minHours: 60 },
  karamanogullari: { baseHours: 180, minHours: 60 },
  germiyan: { baseHours: 160, minHours: 50 },
  germiyanogullari: { baseHours: 160, minHours: 50 },
  aydinogullari: { baseHours: 180, minHours: 60 },
  candar: { baseHours: 120, minHours: 40 },
  candarogullari: { baseHours: 120, minHours: 40 },
  dulkadir: { baseHours: 160, minHours: 50 },
  dulkadirogullari: { baseHours: 160, minHours: 50 },
};

/**
 * İki nokta arasındaki Öklid mesafesini hesaplar
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Köydeki Okul seviyesini tespit eder (school veya okul anahtarlarını destekler)
 */
export function getVillageSchoolLevel(village: Village): number {
  if (!village || !village.buildings) return 0;
  return village.buildings.school || village.buildings.okul || 0;
}

/**
 * Köyün beylik türüne ve Okul seviyesine göre +0.1 yarıçap büyümesi için gereken süreyi (saat cinsinden) hesaplar.
 */
export function getRadiusGrowthDurationHours(faction: FactionId, schoolLevel: number): number {
  const cfg = RADIUS_FACTION_CONFIGS[faction] || RADIUS_FACTION_CONFIGS.osmanogullari;
  const clampedLevel = Math.max(0, Math.min(MAX_SCHOOL_LEVEL, schoolLevel));
  const ratio = clampedLevel / MAX_SCHOOL_LEVEL;
  
  // Orantılı kısaltma: Seviye 0 -> baseHours, Seviye 20 -> minHours
  return cfg.baseHours - (cfg.baseHours - cfg.minHours) * ratio;
}

/**
 * Büyüme süresini milisaniye cinsinden verir.
 */
export function getRadiusGrowthDurationMs(faction: FactionId, schoolLevel: number): number {
  // 100x Hızlandırma uygulanmış büyüme periyodu (ms)
  const baseMs = getRadiusGrowthDurationHours(faction, schoolLevel) * 3600 * 1000;
  return Math.max(1000, Math.round(baseMs / 100));
}

/**
 * Köyün geçerli etki yarıçapını hesaplar.
 * Otağ (town_hall) ve Medrese (school) seviyeleri ile genişleyen, ferah ve kaynaklara tam erişen yarıçap döner.
 */
export function getVillageRadius(village: Village): number {
  if (!village) return INITIAL_VILLAGE_RADIUS;
  const townHallLvl = (village.buildings && (village.buildings.town_hall || (village.buildings as any).merkez)) || 1;
  const schoolLvl = getVillageSchoolLevel(village);
  const baseTownRadius = 3.5 + (townHallLvl * 0.9) + (schoolLvl * 0.35);
  const customRadius = typeof village.radius === 'number' ? village.radius : baseTownRadius;
  const effective = Math.max(INITIAL_VILLAGE_RADIUS, customRadius, baseTownRadius);
  return Math.min(MAX_VILLAGE_RADIUS, Number(effective.toFixed(2)));
}

export interface RadiusProgressInfo {
  currentRadius: number;
  nextRadius: number;
  progressPercent: number;
  elapsedMs: number;
  durationMs: number;
  remainingMs: number;
  isMax: boolean;
  durationHours: number;
  schoolLevel: number;
}

/**
 * Bir köyün etki çemberi büyüme durumunu ve bir sonraki adıma kalan süreyi detaylı hesaplar.
 */
export function getRadiusProgress(village: Village, now: number = Date.now()): RadiusProgressInfo {
  const currentRadius = getVillageRadius(village);
  const isMax = currentRadius >= MAX_VILLAGE_RADIUS;
  const schoolLevel = getVillageSchoolLevel(village);
  const durationHours = getRadiusGrowthDurationHours(village.faction, schoolLevel);
  const durationMs = durationHours * 3600 * 1000;

  if (isMax) {
    return {
      currentRadius: MAX_VILLAGE_RADIUS,
      nextRadius: MAX_VILLAGE_RADIUS,
      progressPercent: 100,
      elapsedMs: durationMs,
      durationMs,
      remainingMs: 0,
      isMax: true,
      durationHours,
      schoolLevel,
    };
  }

  const lastExpansion = village.lastRadiusExpansionTimestamp || now;
  const elapsedMs = Math.max(0, now - lastExpansion);
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));
  const nextRadius = Math.min(MAX_VILLAGE_RADIUS, Number((currentRadius + RADIUS_GROWTH_STEP).toFixed(2)));

  return {
    currentRadius,
    nextRadius,
    progressPercent,
    elapsedMs,
    durationMs,
    remainingMs,
    isMax: false,
    durationHours,
    schoolLevel,
  };
}

/**
 * Zaman döngüsünde köyün yarıçap büyümesini işler.
 * Gereken süre dolduysa yarıçapı +0.1 artırır (maksimum 2.5'a kadar).
 */
export function processRadiusGrowthTick(
  village: Village,
  now: number = Date.now()
): {
  village: Village;
  expanded: boolean;
  previousRadius: number;
  newRadius: number;
  progress: RadiusProgressInfo;
} {
  const previousRadius = getVillageRadius(village);
  if (previousRadius >= MAX_VILLAGE_RADIUS) {
    const progress = getRadiusProgress(village, now);
    return {
      village: {
        ...village,
        radius: MAX_VILLAGE_RADIUS,
      },
      expanded: false,
      previousRadius,
      newRadius: MAX_VILLAGE_RADIUS,
      progress,
    };
  }

  const lastTimestamp = village.lastRadiusExpansionTimestamp || now;
  const schoolLevel = getVillageSchoolLevel(village);
  const durationMs = getRadiusGrowthDurationMs(village.faction, schoolLevel);
  const elapsed = now - lastTimestamp;

  if (elapsed >= durationMs) {
    // Kaç adım büyüme gerçekleştiğini hesapla (uzun süre offline kalınsa bile)
    const steps = Math.floor(elapsed / durationMs);
    const growth = steps * RADIUS_GROWTH_STEP;
    const computedNewRadius = Math.min(MAX_VILLAGE_RADIUS, Number((previousRadius + growth).toFixed(2)));
    const remainderMs = elapsed % durationMs;
    const newLastTimestamp = now - remainderMs;

    const updatedVillage: Village = {
      ...village,
      radius: computedNewRadius,
      lastRadiusExpansionTimestamp: newLastTimestamp,
    };

    const progress = getRadiusProgress(updatedVillage, now);

    return {
      village: updatedVillage,
      expanded: computedNewRadius > previousRadius,
      previousRadius,
      newRadius: computedNewRadius,
      progress,
    };
  }

  // Süre henüz dolmamış, aynı yarıçap korunur
  const progress = getRadiusProgress(village, now);
  return {
    village: {
      ...village,
      radius: previousRadius,
      lastRadiusExpansionTimestamp: village.lastRadiusExpansionTimestamp || now,
    },
    expanded: false,
    previousRadius,
    newRadius: previousRadius,
    progress,
  };
}

/**
 * Bir hedef koordinatın köyün etki çemberi içinde (veya çembere teğet/temas halinde) olup olmadığını kontrol eder.
 * Umaykut kuralı: Köyün çemberi kaynağa değiyorsa mesafe <= yarıçap olmalıdır.
 */
export function isNodeWithinRadius(
  village: Village,
  target: { x: number; y: number },
  customRadius?: number
): boolean {
  const radius = customRadius !== undefined ? customRadius : getVillageRadius(village);
  const dist = calculateDistance(village.x, village.y, target.x, target.y);
  // Cömert temas toleransı (çember çizgisi değdiğinde doğrudan algılansın)
  return dist <= radius + 0.45;
}
