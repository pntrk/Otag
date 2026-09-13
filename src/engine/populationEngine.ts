/**
 * 13. Yüzyıl Anadolu Beylikleri - Umaykut Online Nüfus ve Askere Alma Motoru
 * (Population & Troop Conversion Engine)
 * 
 * Umaykut Mekaniği:
 * - Askerler hammaddeyle sıfırdan üretilmez.
 * - Köy merkezinde belirli aralıklarla (temel 20 dakika / 1200 sn) "Boşta Nüfus" (İşçi / Alp adayı) doğar.
 * - Karamanoğulları beyliği pasif bonusuyla bu süre 16 dakikaya (960 sn) düşer.
 * - Merkez Binası (Town Hall) her seviyesinde doğum süresini %3 hızlandırır.
 * - Asker üretimi (convertWorkerToTroop): 1 Boşta İşçi + İlgili Birimin Hammaddesi harcanarak orduya katılır.
 */

import { FactionId, Resources, UnitType, Village } from '../types/game';
import { UNITS, FACTIONS } from '../data/gameData';

// Temel doğum süreleri (saniye)
export const BASE_SPAWN_DURATION_SEC = 1200; // 20 Dakika (1200 saniye)
export const KARAMAN_SPAWN_DURATION_SEC = 960; // 16 Dakika (960 saniye)
export const TOWN_HALL_SPAWN_REDUCTION_PER_LEVEL = 0.03; // Seviye başına -%3 indirim

/**
 * Köyün beylik ve bina seviyesine göre 1 yeni işçinin doğum süresini hesaplar (saniye)
 */
export function getPopulationSpawnDuration(village: Village): number {
  const baseDuration = (village.faction && FACTIONS[village.faction]?.populationSpawnSeconds) 
    || BASE_SPAWN_DURATION_SEC;

  // Merkez binası seviyesi (Lv. 1'den itibaren her seviye %3 hızlandırır, maksimum %70 hızlandırma tavanı)
  const townHallLevel = Math.max(1, village.buildings?.town_hall || 1);
  const discountMultiplier = Math.max(0.30, 1 - (townHallLevel - 1) * TOWN_HALL_SPAWN_REDUCTION_PER_LEVEL);

  return Math.round(baseDuration * discountMultiplier);
}

/**
 * Sonraki nüfus doğumuna kalan saniyeyi hesaplar
 */
export function getNextSpawnTimeRemaining(village: Village, now: number = Date.now()): number {
  const spawnDurationSec = getPopulationSpawnDuration(village);
  const lastSpawn = village.lastPopulationSpawnTimestamp || now;
  const elapsedSec = Math.max(0, (now - lastSpawn) / 1000);

  const remaining = spawnDurationSec - (elapsedSec % spawnDurationSec);
  return Math.max(0, Math.ceil(remaining));
}

/**
 * Bir sonraki nüfus doğumu için ilerleme yüzdesini (0-100) hesaplar
 */
export function getPopulationSpawnProgress(village: Village, now: number = Date.now()): number {
  const spawnDurationSec = getPopulationSpawnDuration(village);
  const remainingSec = getNextSpawnTimeRemaining(village, now);
  const progressSec = Math.max(0, spawnDurationSec - remainingSec);
  return Math.min(100, Math.max(0, Math.round((progressSec / spawnDurationSec) * 100)));
}

/**
 * Kalan süreyi okunabilir formata dönüştürür (Örn: "14:22 sonra +1 İşçi")
 */
export function formatRemainingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
}

/**
 * Nüfus Tick İşlemi: Delta sürede doğan boşta işçileri hesaplar ve köyü günceller
 */
export function processPopulationTick(
  village: Village,
  now: number = Date.now()
): { village: Village; spawnedCount: number } {
  const spawnDurationSec = getPopulationSpawnDuration(village);
  const spawnDurationMs = spawnDurationSec * 1000;

  let lastSpawn = village.lastPopulationSpawnTimestamp;
  if (!lastSpawn || lastSpawn <= 0) {
    return {
      village: {
        ...village,
        lastPopulationSpawnTimestamp: now,
        idlePopulation: typeof village.idlePopulation === 'number' ? village.idlePopulation : 5,
        workingPopulation: typeof village.workingPopulation === 'number' ? village.workingPopulation : 0,
      },
      spawnedCount: 0,
    };
  }

  const elapsedMs = now - lastSpawn;
  if (elapsedMs < spawnDurationMs) {
    return {
      village,
      spawnedCount: 0,
    };
  }

  // Geçen sürede kaç işçi doğdu?
  const spawnedCount = Math.floor(elapsedMs / spawnDurationMs);
  const newLastSpawn = lastSpawn + (spawnedCount * spawnDurationMs);
  const newIdle = (village.idlePopulation || 0) + spawnedCount;

  return {
    village: {
      ...village,
      idlePopulation: newIdle,
      lastPopulationSpawnTimestamp: newLastSpawn,
    },
    spawnedCount,
  };
}

/**
 * Asker Dönüştürme Yeterlilik Kontrolü
 */
export function canConvertWorkerToTroop(
  village: Village,
  unitType: UnitType,
  count: number,
  treasury: Resources
): {
  canConvert: boolean;
  reason?: string;
  missingWorkers: number;
  missingResources: Partial<Resources>;
} {
  const def = UNITS[unitType];
  const currentIdle = village.idlePopulation || 0;
  const missingWorkers = Math.max(0, count - currentIdle);

  const totalCost: Resources = {
    wood: def.cost.wood * count,
    stone: def.cost.stone * count,
    iron: def.cost.iron * count,
    grain: def.cost.grain * count,
    gold: def.cost.gold * count,
  };

  const missingResources: Partial<Resources> = {};
  if (treasury.wood < totalCost.wood) missingResources.wood = totalCost.wood - treasury.wood;
  if (treasury.stone < totalCost.stone) missingResources.stone = totalCost.stone - treasury.stone;
  if (treasury.iron < totalCost.iron) missingResources.iron = totalCost.iron - treasury.iron;
  if (treasury.grain < totalCost.grain) missingResources.grain = totalCost.grain - treasury.grain;
  if (treasury.gold < totalCost.gold) missingResources.gold = totalCost.gold - treasury.gold;

  const hasEnoughResources = Object.keys(missingResources).length === 0;

  if (missingWorkers > 0) {
    return {
      canConvert: false,
      reason: `Yetersiz Boşta Nüfus! ${count} asker yetiştirmek için ${count} boşta işçi gereklidir (Eksik: ${missingWorkers} İşçi).`,
      missingWorkers,
      missingResources,
    };
  }

  if (!hasEnoughResources) {
    return {
      canConvert: false,
      reason: 'Ortak kasada bu eğitim için yeterli hammadde bulunmuyor.',
      missingWorkers: 0,
      missingResources,
    };
  }

  return {
    canConvert: true,
    missingWorkers: 0,
    missingResources: {},
  };
}

/**
 * Asker Dönüştürme Eylemi (convertWorkerToTroop)
 * Boşta nüfusu askere çevirir, kasadan hammaddeleri düşer ve köyün garnizonunu veya kuyruğunu günceller.
 */
export function convertWorkerToTroop(
  village: Village,
  unitType: UnitType,
  count: number,
  treasury: Resources
): {
  updatedVillage: Village;
  updatedTreasury: Resources;
  cost: Resources;
} {
  const def = UNITS[unitType];
  const cost: Resources = {
    wood: def.cost.wood * count,
    stone: def.cost.stone * count,
    iron: def.cost.iron * count,
    grain: def.cost.grain * count,
    gold: def.cost.gold * count,
  };

  // 1. Boşta nüfustan düş
  const newIdle = Math.max(0, (village.idlePopulation || 0) - count);

  // 2. Ortak kasadan hammaddeyi düş
  const updatedTreasury: Resources = {
    wood: Math.max(0, treasury.wood - cost.wood),
    stone: Math.max(0, treasury.stone - cost.stone),
    iron: Math.max(0, treasury.iron - cost.iron),
    grain: Math.max(0, treasury.grain - cost.grain),
    gold: Math.max(0, treasury.gold - cost.gold),
  };

  const updatedVillage: Village = {
    ...village,
    idlePopulation: newIdle,
  };

  return {
    updatedVillage,
    updatedTreasury,
    cost,
  };
}
