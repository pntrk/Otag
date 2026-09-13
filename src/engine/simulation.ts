import { 
  BUILDINGS, 
  UNITS, 
  calculateDistance, 
  getInfluenceRadius 
} from '../data/gameData';
import { getVillageRadius, isNodeWithinRadius } from './radiusEngine';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March, 
  ResourceNode, 
  ResourceRate, 
  Resources, 
  TrainingQueueItem, 
  UnitType, 
  Village 
} from '../types/game';
import { getVillageResourceWorkers, getWorkerProductionMultiplier } from './workerEngine';

/**
 * Bir köyün etki çemberi içine giren kaynak düğümlerini tespit etme
 */
export function getCapturedNodesForVillage(village: Village, nodes: ResourceNode[]): {
  captured: ResourceNode[];
  radius: number;
} {
  const radius = getVillageRadius(village);
  const captured = nodes.filter(node => isNodeWithinRadius(village, node, radius));

  return { captured, radius };
}

/**
 * Köyün saatlik gelir oranını hesaplama
 * (Köy içinde kaynak binası YOKTUR! Gelir sadece harita düğümlerinden ve işçi tahsisinden gelir)
 */
export function calculateVillageResourceRates(
  village: Village, 
  nodes: ResourceNode[],
  khanGovernanceBonusPct: number = 0
): ResourceRate {
  const { captured } = getCapturedNodesForVillage(village, nodes);
  const workers = getVillageResourceWorkers(village);

  let woodPerHour = 0;
  let stonePerHour = 0;
  let ironPerHour = 0;
  let grainGrossPerHour = 0;
  let goldPerHour = 0;

  for (const node of captured) {
    let yieldAmount = node.baseYieldPerHour;
    
    // Beylik Üretim Bonusları
    const fKey = (village.faction || '').toLowerCase();
    if ((fKey.includes('candar')) && (node.type === 'iron' || node.type === 'stone')) {
      yieldAmount *= 1.20;
    }
    if (fKey.includes('dulkadir') && node.type === 'grain') {
      yieldAmount *= 1.20;
    }

    // Umaykut Online Maden İşçi Çarpanı:
    // Her kaynağa atanan her işçi +%15 toplama hızı çarpanı kazandırır.
    // İşçi atanmazsa taban üretim %25 verimle (0.25 çarpanı) çalışır.
    const workerCount = (workers as any)[node.type] ?? 0;
    const workerMultiplier = getWorkerProductionMultiplier(workerCount);
    yieldAmount *= workerMultiplier;

    switch (node.type) {
      case 'wood':
        woodPerHour += yieldAmount;
        break;
      case 'stone':
        stonePerHour += yieldAmount;
        break;
      case 'iron':
        ironPerHour += yieldAmount;
        break;
      case 'grain':
        grainGrossPerHour += yieldAmount;
        break;
      case 'gold':
        goldPerHour += yieldAmount;
        break;
    }
  }

  // Apply Khan Governance Bonus
  if (khanGovernanceBonusPct > 0) {
    const multiplier = 1.0 + (khanGovernanceBonusPct / 100);
    woodPerHour *= multiplier;
    stonePerHour *= multiplier;
    ironPerHour *= multiplier;
    grainGrossPerHour *= multiplier;
    goldPerHour *= multiplier;
  }

  // Askeri birliklerin saatlik tahıl tüketimi (upkeep freni)
  let totalGrainUpkeep = 0;
  for (const [uType, count] of Object.entries(village.units)) {
    if (!count || count <= 0) continue;
    const def = UNITS[uType as UnitType];
    totalGrainUpkeep += count * def.grainUpkeepPerHour;
  }

  const netGrainPerHour = grainGrossPerHour - totalGrainUpkeep;

  return {
    wood: Math.round(woodPerHour),
    stone: Math.round(stonePerHour),
    iron: Math.round(ironPerHour),
    grain: Math.round(netGrainPerHour),
    gold: Math.round(goldPerHour),
  };
}

/**
 * Umaykut Mekaniği: Zahire Ambarı (Granary) ve Depo (Warehouse) seviyelerine göre toplam kaynak depolama tavanı (Storage Cap)
 * Zahire Ambarı seviyesi arttıkça depolama kapasitesi katlanır ve buğday çürümesi engellenir.
 */
export function getVillageMaxCapacity(village: Village): number {
  const granaryLevel = village.buildings.granary || 0;
  const warehouseLevel = village.buildings.warehouse || 0;

  // Temel taban 2000; Zahire Ambarı seviyesiyle katlanan depolama tavanı
  let capacity = 2000;
  if (granaryLevel > 0) {
    capacity = Math.round(2400 * Math.pow(1.5, granaryLevel - 1)) + (granaryLevel * 1000);
  }
  capacity += warehouseLevel * 1500;
  return capacity;
}

/**
 * Tick başına kaynak birikimi hesaplama (delta saniye üzerinden)
 */
export function applyResourceGrowth(
  currentResources: Resources,
  rates: ResourceRate,
  deltaSec: number,
  maxCapacity: number
): Resources {
  const hours = deltaSec / 3600;

  return {
    wood: Math.min(maxCapacity, Math.max(0, currentResources.wood + rates.wood * hours)),
    stone: Math.min(maxCapacity, Math.max(0, currentResources.stone + rates.stone * hours)),
    iron: Math.min(maxCapacity, Math.max(0, currentResources.iron + rates.iron * hours)),
    grain: Math.min(maxCapacity, Math.max(0, currentResources.grain + rates.grain * hours)),
    gold: Math.min(maxCapacity, Math.max(0, currentResources.gold + rates.gold * hours)),
  };
}
