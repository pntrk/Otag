/**
 * 13. Yüzyıl Anadolu Beylikleri - Umaykut Online Ortak Kasa ve Üretim Motoru
 * (Shared Treasury, Resource Production & Plunder Engine)
 * 
 * Umaykut Mekaniği:
 * 1. Ortak Kasa (Shared Treasury):
 *    - Umaykut'ta her köyün bağımsız kaynak deposu yoktur.
 *    - Oyuncunun tüm köyleri tek bir ortak kasayı (SharedTreasury) paylaşır.
 *    - Toplam ambar kapasitesi, tüm köylerin ambar binalarının kapasitelerinin toplamıdır.
 * 
 * 2. Yağma & Sığınak (Plunder & Hideout):
 *    - Bir köye saldırılıp yağmalandığında, ortak kasadaki kaynaklar oyuncunun toplam köy sayısına bölünür!
 *    - Temel sığınak koruması: Sığınak seviyesi * 500.
 *    - Beylik sığınak bonusları: Candaroğulları +800, Aydınoğulları +350.
 *    - Yağmalanan köy 3600 saniye (1 saat) boyunca yağma koruması altına girer (`lastPlunderedTimestamp`).
 */

import { 
  BuildingType, 
  ResourceNode, 
  ResourceRate, 
  Resources, 
  SharedTreasury, 
  UnitType, 
  Village 
} from '../types/game';
import { UNITS, calculateDistance, getHideoutCapacity, GAME_SPEED_MULTIPLIER } from '../data/gameData';
import { getVillageRadius, isNodeWithinRadius } from './radiusEngine';
import { getNodeEfficiency } from './resourceEngine';
import { getVillageResourceWorkers, getWorkerProductionMultiplier } from './workerEngine';

export const PLUNDER_COOLDOWN_SEC = 3600; // 1 Saat yağma koruması

/**
 * Tek bir köyün ambar kapasitesi (Zahire Ambarı ve Depo)
 * Umaykut Mekaniği: Zahire Ambarı seviyesi arttıkça depolama tavanı (Storage Cap) katlanır ve buğday çürümesi önlenir.
 */
export function getSingleVillageCapacity(village: Village): number {
  const granaryLevel = village.buildings.granary || 0;
  const warehouseLevel = village.buildings.warehouse || 0;
  
  // Test ve geliştirme modunda (100x) kapasite tavanı genişletilir (5.000.000 taban)
  const baseCap = 5000000;
  let capacity = baseCap;
  if (granaryLevel > 0) {
    capacity = Math.round(baseCap * Math.pow(1.5, granaryLevel - 1)) + (granaryLevel * 500000);
  }
  // Depo desteği
  capacity += warehouseLevel * 500000;
  
  return capacity;
}

/**
 * Oyuncunun tüm köylerinin ortak ambar kapasitesini hesaplar
 */
export function calculateTotalSharedCapacity(villages: Village[]): number {
  if (!villages || villages.length === 0) return 5000000;
  return villages.reduce((total, v) => total + getSingleVillageCapacity(v), 0);
}

/**
 * Köy listesinden Ortak Kasa durumunu üretir
 */
export function calculateSharedTreasury(villages: Village[]): SharedTreasury {
  const maxCapacity = calculateTotalSharedCapacity(villages);
  if (!villages || villages.length === 0) {
    return {
      resources: { wood: 50000, stone: 50000, iron: 50000, grain: 50000, gold: 25000 },
      maxCapacity,
    };
  }

  // İlk köyün kaynaklarını baz al
  const primary = villages[0];
  const clampedResources: Resources = {
    wood: Math.min(maxCapacity, primary.resources?.wood ?? 50000),
    stone: Math.min(maxCapacity, primary.resources?.stone ?? 50000),
    iron: Math.min(maxCapacity, primary.resources?.iron ?? 50000),
    grain: Math.min(maxCapacity, primary.resources?.grain ?? 50000),
    gold: Math.min(maxCapacity, primary.resources?.gold ?? 25000),
  };

  return {
    resources: clampedResources,
    maxCapacity,
  };
}

/**
 * Tüm köylerin kaynaklarını ve ambar kapasitesini ortak kasa ile eşitler
 */
export function syncVillagesWithSharedTreasury(
  villages: Village[],
  sharedResources: Resources,
  maxCapacity: number
): Village[] {
  return villages.map(v => ({
    ...v,
    resources: { ...sharedResources },
    maxCapacity,
  }));
}

/**
 * Bir köyün etki çemberindeki kaynak düğümlerini bulma (Umaykut Radius Kuralı)
 */
export function getCapturedNodes(village: Village, nodes: ResourceNode[]): ResourceNode[] {
  const radius = getVillageRadius(village);
  return nodes.filter(node => isNodeWithinRadius(village, node, radius));
}

/**
 * Oyuncunun tüm köylerinin toplam saatlik kaynak üretim ve tahıl iaşe (upkeep) oranlarını hesaplar
 */
export function calculateTotalSharedRates(
  villages: Village[],
  nodes: ResourceNode[],
  khanGovernanceBonusPct: number = 0
): ResourceRate {
  let totalWoodPerHour = 0;
  let totalStonePerHour = 0;
  let totalIronPerHour = 0;
  let totalGrainGrossPerHour = 0;
  let totalGoldPerHour = 0;
  let totalGrainUpkeepPerHour = 0;

  // Çift sayımı önlemek için yakalanan düğümleri küme olarak takip edelim
  const processedNodeIds = new Set<string>();

  for (const village of villages) {
    // Her köyün yerel temel arazisi ve otağından gelen taban üretim (100x test modunda saniyede +100 akış)
    totalWoodPerHour += 3600;
    totalStonePerHour += 3600;
    totalIronPerHour += 3600;
    totalGrainGrossPerHour += 4500;
    totalGoldPerHour += 2500;

    const captured = getCapturedNodes(village, nodes);
    const workers = getVillageResourceWorkers(village);

    for (const node of captured) {
      if (processedNodeIds.has(node.id)) continue;
      processedNodeIds.add(node.id);

      let yieldAmount = node.baseYieldPerHour || 50;

      // Beylik Üretim Bonusları
      const fKey = (village.faction || '').toLowerCase();
      // Candaroğulları demir ve taş bonusu (+%20)
      if ((fKey.includes('candar')) && (node.type === 'iron' || node.type === 'stone')) {
        yieldAmount *= 1.20;
      }
      // Dulkadiroğulları tahıl / ekin bonusu (+%20)
      if (fKey.includes('dulkadir') && node.type === 'grain') {
        yieldAmount *= 1.20;
      }

      // Umaykut Online Maden İşçi Çarpanı:
      // Her kaynağa atanan her işçi +%15 toplama hızı çarpanı kazandırır:
      // GerçekÜretim = TabanRadiusÜretimi * (1 + (İşçiSayısı * 0.15)) * BeylikBonusu
      // İşçi atanmazsa taban üretim %25 verimle (0.25) çalışır.
      const assignedCount = (workers as any)[node.type] ?? ((village.assignedWorkers && (village.assignedWorkers as any)[node.id]) || 0);
      const workerMultiplier = getWorkerProductionMultiplier(assignedCount);
      yieldAmount *= workerMultiplier;

      switch (node.type) {
        case 'wood':
          totalWoodPerHour += yieldAmount;
          break;
        case 'stone':
          totalStonePerHour += yieldAmount;
          break;
        case 'iron':
          totalIronPerHour += yieldAmount;
          break;
        case 'grain':
          totalGrainGrossPerHour += yieldAmount;
          break;
        case 'gold':
          totalGoldPerHour += yieldAmount;
          break;
      }
    }

    // Bu köydeki ordunun saatlik tahıl tüketimi (iaşe freni)
    const fKey = (village.faction || '').toLowerCase();
    const isDulkadir = fKey.includes('dulkadir');

    for (const [uType, count] of Object.entries(village.units || {})) {
      const troopCount = Number(count) || 0;
      if (troopCount <= 0) continue;
      const def = UNITS[uType as UnitType];
      if (def) {
        let troopUpkeep = def.grainUpkeepPerHour;
        // Dulkadiroğulları süvari iaşe indirimi: Atlı birliklerde %25 daha az tahıl tüketimi
        if (isDulkadir && (def.category === 'suvari' || uType === 'hafif_suvari' || uType === 'akinci' || uType === 'bozok_suvarisi')) {
          troopUpkeep *= 0.75;
        }
        totalGrainUpkeepPerHour += troopCount * troopUpkeep;
      }
    }
  }

  // Hakan İdari Yönetim Bonusu
  if (khanGovernanceBonusPct > 0) {
    const multiplier = 1.0 + (khanGovernanceBonusPct / 100);
    totalWoodPerHour *= multiplier;
    totalStonePerHour *= multiplier;
    totalIronPerHour *= multiplier;
    totalGrainGrossPerHour *= multiplier;
    totalGoldPerHour *= multiplier;
  }

  const netGrainPerHour = totalGrainGrossPerHour - totalGrainUpkeepPerHour;

  // 100x Hızlandırma Çarpanı (Test Modu)
  return {
    wood: Math.round(totalWoodPerHour * GAME_SPEED_MULTIPLIER),
    stone: Math.round(totalStonePerHour * GAME_SPEED_MULTIPLIER),
    iron: Math.round(totalIronPerHour * GAME_SPEED_MULTIPLIER),
    grain: Math.round(netGrainPerHour * GAME_SPEED_MULTIPLIER),
    gold: Math.round(totalGoldPerHour * GAME_SPEED_MULTIPLIER),
  };
}

/**
 * Köyün Sığınak Koruma Miktarı (Umaykut Korumalı Kasa)
 * Formül: Seviye 1'de her kaynaktan 400 adet, her seviyede ek +%50 koruma.
 */
export function getVillageHideoutProtection(village: Village): number {
  const hideoutLevel = village.buildings.hideout || 0;
  return getHideoutCapacity(hideoutLevel, village.faction);
}

/**
 * Bir köye saldırıldığında yağmalanabilir kaynak miktarı hesaplama (Umaykut Kuralı)
 * - Ortak kasadaki kaynaklar savunmacının toplam köy sayısına bölünür!
 * - Köyün sığınak koruması düşülür.
 * - Son 3600 saniye içinde yağmalandıysa koruma altındadır (0 kaynak).
 */
export function calculateVillageLootableResources(
  targetVillage: Village,
  allDefenderVillages: Village[],
  now: number = Date.now()
): {
  lootable: Resources;
  inCooldown: boolean;
  remainingCooldownSec: number;
  hideoutProtection: number;
  villageShareRatio: number;
} {
  // 1. Yağma koruması (Cooldown) kontrolü
  const lastPlundered = targetVillage.lastPlunderedTimestamp || 0;
  const elapsedSec = (now - lastPlundered) / 1000;
  const inCooldown = elapsedSec < PLUNDER_COOLDOWN_SEC;
  const remainingCooldownSec = inCooldown ? Math.ceil(PLUNDER_COOLDOWN_SEC - elapsedSec) : 0;

  const hideoutProt = getVillageHideoutProtection(targetVillage);
  const totalVillages = Math.max(1, allDefenderVillages.length);
  const villageShareRatio = 1 / totalVillages;

  if (inCooldown) {
    return {
      lootable: { wood: 0, stone: 0, iron: 0, grain: 0, gold: 0 },
      inCooldown: true,
      remainingCooldownSec,
      hideoutProtection: hideoutProt,
      villageShareRatio,
    };
  }

  // Ortak kasadaki kaynaklar (hedef oyuncunun köylerinden hesaplanan ortak kasa)
  const sharedTreasury = calculateSharedTreasury(allDefenderVillages);
  const perVillageShare: Resources = {
    wood: Math.floor(sharedTreasury.resources.wood / totalVillages),
    stone: Math.floor(sharedTreasury.resources.stone / totalVillages),
    iron: Math.floor(sharedTreasury.resources.iron / totalVillages),
    grain: Math.floor(sharedTreasury.resources.grain / totalVillages),
    gold: Math.floor(sharedTreasury.resources.gold / totalVillages),
  };

  // Sığınak koruması düşüldükten sonra kalan yağmalanabilir kaynak
  const lootable: Resources = {
    wood: Math.max(0, perVillageShare.wood - hideoutProt),
    stone: Math.max(0, perVillageShare.stone - hideoutProt),
    iron: Math.max(0, perVillageShare.iron - hideoutProt),
    grain: Math.max(0, perVillageShare.grain - hideoutProt),
    gold: Math.max(0, perVillageShare.gold - hideoutProt),
  };

  return {
    lootable,
    inCooldown: false,
    remainingCooldownSec: 0,
    hideoutProtection: hideoutProt,
    villageShareRatio,
  };
}

/**
 * Periyodik Ortak Tick İşlemi:
 * - Ortak kasadaki kaynak birikimini deltaSec üzerinden uygular
 * - Kapasite tavanını denetler
 * - Tüm oyuncu köylerini senkronize eder
 */
export function processSharedTick(
  villages: Village[],
  nodes: ResourceNode[],
  deltaSec: number,
  khanGovernanceBonusPct: number = 0
): {
  updatedVillages: Village[];
  sharedTreasury: SharedTreasury;
  rates: ResourceRate;
} {
  const currentTreasury = calculateSharedTreasury(villages);
  const totalCapacity = calculateTotalSharedCapacity(villages);
  const rates = calculateTotalSharedRates(villages, nodes, khanGovernanceBonusPct);

  const hours = deltaSec / 3600;

  const nextResources: Resources = {
    wood: Math.min(totalCapacity, Math.max(0, currentTreasury.resources.wood + rates.wood * hours)),
    stone: Math.min(totalCapacity, Math.max(0, currentTreasury.resources.stone + rates.stone * hours)),
    iron: Math.min(totalCapacity, Math.max(0, currentTreasury.resources.iron + rates.iron * hours)),
    grain: Math.min(totalCapacity, Math.max(0, currentTreasury.resources.grain + rates.grain * hours)),
    gold: Math.min(totalCapacity, Math.max(0, currentTreasury.resources.gold + rates.gold * hours)),
  };

  const sharedTreasury: SharedTreasury = {
    resources: nextResources,
    maxCapacity: totalCapacity,
  };

  const updatedVillages = syncVillagesWithSharedTreasury(villages, nextResources, totalCapacity);

  return {
    updatedVillages,
    sharedTreasury,
    rates,
  };
}
