/**
 * 13. Yüzyıl Anadolu Beylikleri - Umaykut Online Kaynak Toplama ve İşçi Yönetim Motoru
 * (Worker Assignment, Resource Node Capacity & Continuous Production Engine)
 * 
 * Umaykut Kuralları:
 * 1. Saatlik Verimlilik Değeri: Haritadaki kaynak noktalarının saatlik verimlilik değeri 2 ile 9 arasındadır.
 * 2. 10'arlı Grup Şartı: İşçiler yalnızca 10'arlı gruplar halinde atanabilir (assignWorkers(nodeId, 10)).
 * 3. Geri Çekilemezlik & Sürekli Gelir: Atanan işçiler geri çekilemez; sürekli saatlik gelir üretir (işçiSayısı * verimlilik).
 * 4. Kaynak Tavanı (Azami 1000): Bir kaynak noktasında çalışabilecek toplam işçi sayısı en fazla 1000'dir.
 *    İki köyün çemberi aynı kaynağa değiyorsa ortaklaşa işçi gönderebilirler.
 * 5. Merkez Binası İşçi Limiti: Bir köyün kaynaklarda çalıştırabileceği azami işçi sayısı Merkez Binası seviyesine bağlıdır:
 *    Azami İşçi = 200 + (merkezSeviyesi * 100)
 *    (Merkez Binası 8. seviyeye ulaştığında sınır 1000 olur ve kaynak tam kapasite kullanılabilir).
 */

import { ResourceNode, ResourceRate, Village } from '../types/game';
import { isNodeWithinRadius } from './radiusEngine';

export const MAX_WORKERS_PER_NODE = 1000;
export const WORKER_ASSIGNMENT_BATCH = 10;
export const MIN_EFFICIENCY = 2;
export const MAX_EFFICIENCY = 9;

/**
 * Kaynak noktasının saatlik verimlilik değerini 2 ile 9 arasında garantiler.
 */
export function getNodeEfficiency(node: ResourceNode): number {
  if (!node) return MIN_EFFICIENCY;

  if (typeof node.efficiency === 'number' && !isNaN(node.efficiency)) {
    return Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, Math.round(node.efficiency)));
  }

  if (typeof node.level === 'number' && node.level >= MIN_EFFICIENCY && node.level <= MAX_EFFICIENCY) {
    return node.level;
  }

  // Tier 1 -> 2..4, Tier 2 -> 5..7, Tier 3 -> 7..9
  const tier = node.tier || 1;
  const hash = Math.abs((node.x * 374761393) ^ (node.y * 668265263)) >>> 0;
  const offset = hash % 3; // 0, 1, 2

  let eff = 3;
  if (tier === 1) {
    eff = 2 + (offset % 3); // 2, 3, 4
  } else if (tier === 2) {
    eff = 5 + (offset % 3); // 5, 6, 7
  } else {
    eff = 7 + (offset % 3); // 7, 8, 9
  }

  return Math.max(MIN_EFFICIENCY, Math.min(MAX_EFFICIENCY, eff));
}

/**
 * Merkez binası seviyesine göre köyün çalıştırabileceği azami işçi sınırını hesaplar.
 * Formül: Azami İşçi = 200 + (merkezSeviyesi * 100)
 */
export function getTownHallWorkerLimit(townHallLevel: number): number {
  const level = Math.max(1, townHallLevel || 1);
  return 200 + (level * 100);
}

/**
 * Köyün kaynaklara atadığı toplam işçi sayısını hesaplar.
 */
export function getVillageAssignedWorkersCount(village: Village): number {
  if (!village) return 0;
  if (village.assignedWorkers && typeof village.assignedWorkers === 'object') {
    return Object.values(village.assignedWorkers).reduce((sum, count) => sum + (Number(count) || 0), 0);
  }
  return village.workingPopulation || 0;
}

/**
 * Bir köyün bu kaynakta çalışan işçi sayısını döndürür.
 */
export function getVillageWorkersOnNode(village: Village, nodeId: string): number {
  if (!village || !village.assignedWorkers) return 0;
  return Number(village.assignedWorkers[nodeId]) || 0;
}

/**
 * Kaynakta çalışan toplam işçi sayısını döndürür (0 - 1000).
 */
export function getNodeTotalWorkers(node: ResourceNode): number {
  if (!node) return 0;
  return Math.max(0, Math.min(MAX_WORKERS_PER_NODE, Number(node.assignedWorkers) || 0));
}

export interface WorkerAssignmentCheck {
  allowed: boolean;
  reason?: string;
  townHallLimit: number;
  currentVillageWorkers: number;
  nodeTotalWorkers: number;
  villageWorkersOnNode: number;
  efficiency: number;
  availableIdle: number;
  withinRadius: boolean;
}

/**
 * Köyün belirtilen kaynağa işçi atayıp atayamayacağını doğrular.
 */
export function canAssignWorkers(
  village: Village,
  node: ResourceNode,
  count: number = WORKER_ASSIGNMENT_BATCH
): WorkerAssignmentCheck {
  const townHallLevel = village.buildings?.town_hall || 1;
  const townHallLimit = getTownHallWorkerLimit(townHallLevel);
  const currentVillageWorkers = getVillageAssignedWorkersCount(village);
  const nodeTotalWorkers = getNodeTotalWorkers(node);
  const villageWorkersOnNode = getVillageWorkersOnNode(village, node.id);
  const efficiency = getNodeEfficiency(node);
  const availableIdle = village.idlePopulation || 0;
  const withinRadius = isNodeWithinRadius(village, node);

  // 1. Grup Kontrolü (10'arlı katlar)
  if (count <= 0 || count % WORKER_ASSIGNMENT_BATCH !== 0) {
    return {
      allowed: false,
      reason: `İşçiler yalnızca ${WORKER_ASSIGNMENT_BATCH}'arlı gruplar halinde atanabilir.`,
      townHallLimit,
      currentVillageWorkers,
      nodeTotalWorkers,
      villageWorkersOnNode,
      efficiency,
      availableIdle,
      withinRadius,
    };
  }

  // 2. Etki Çemberi (Radius) Kontrolü
  if (!withinRadius) {
    return {
      allowed: false,
      reason: 'Bu kaynak noktası köyünüzün etki çemberi (yarıçapı) dışındadır!',
      townHallLimit,
      currentVillageWorkers,
      nodeTotalWorkers,
      villageWorkersOnNode,
      efficiency,
      availableIdle,
      withinRadius,
    };
  }

  // 3. Boşta Nüfus Kontrolü
  if (availableIdle < count) {
    return {
      allowed: false,
      reason: `Köy merkezinde yeterli boşta işçi yok! (Gereken: ${count}, Mevcut: ${availableIdle})`,
      townHallLimit,
      currentVillageWorkers,
      nodeTotalWorkers,
      villageWorkersOnNode,
      efficiency,
      availableIdle,
      withinRadius,
    };
  }

  // 4. Kaynak Tavanı Kontrolü (Maks 1000)
  if (nodeTotalWorkers + count > MAX_WORKERS_PER_NODE) {
    return {
      allowed: false,
      reason: `Bu kaynak azami işçi kapasitesine (${MAX_WORKERS_PER_NODE} işçi) ulaşmıştır. Kalan boş yer: ${MAX_WORKERS_PER_NODE - nodeTotalWorkers}`,
      townHallLimit,
      currentVillageWorkers,
      nodeTotalWorkers,
      villageWorkersOnNode,
      efficiency,
      availableIdle,
      withinRadius,
    };
  }

  // 5. Merkez Binası İşçi Limiti Kontrolü
  if (currentVillageWorkers + count > townHallLimit) {
    return {
      allowed: false,
      reason: `Merkez Binası işçi kotası aşıldı! (Çalışan: ${currentVillageWorkers} / Kota: ${townHallLimit}). Daha fazla işçi için Merkez Binasını yükseltin.`,
      townHallLimit,
      currentVillageWorkers,
      nodeTotalWorkers,
      villageWorkersOnNode,
      efficiency,
      availableIdle,
      withinRadius,
    };
  }

  return {
    allowed: true,
    townHallLimit,
    currentVillageWorkers,
    nodeTotalWorkers,
    villageWorkersOnNode,
    efficiency,
    availableIdle,
    withinRadius,
  };
}

/**
 * Kaynağa kalıcı olarak işçi atar.
 * - Köyün idlePopulation'ını azaltır.
 * - Köyün workingPopulation'ını ve assignedWorkers[nodeId] kaydını artırır.
 * - Kaynağın assignedWorkers sayısını artırır.
 */
export function assignWorkers(
  village: Village,
  node: ResourceNode,
  count: number = WORKER_ASSIGNMENT_BATCH
): {
  success: boolean;
  error?: string;
  updatedVillage: Village;
  updatedNode: ResourceNode;
  additionalYieldPerHour: number;
} {
  const check = canAssignWorkers(village, node, count);
  if (!check.allowed) {
    return {
      success: false,
      error: check.reason,
      updatedVillage: village,
      updatedNode: node,
      additionalYieldPerHour: 0,
    };
  }

  const currentAssignedToNode = getVillageWorkersOnNode(village, node.id);
  const updatedAssignedWorkers = {
    ...(village.assignedWorkers || {}),
    [node.id]: currentAssignedToNode + count,
  };

  const updatedVillage: Village = {
    ...village,
    idlePopulation: Math.max(0, (village.idlePopulation || 0) - count),
    workingPopulation: (village.workingPopulation || 0) + count,
    assignedWorkers: updatedAssignedWorkers,
  };

  const efficiency = getNodeEfficiency(node);
  const updatedNode: ResourceNode = {
    ...node,
    efficiency,
    assignedWorkers: (node.assignedWorkers || 0) + count,
  };

  const additionalYieldPerHour = count * efficiency;

  return {
    success: true,
    updatedVillage,
    updatedNode,
    additionalYieldPerHour,
  };
}

/**
 * Kaynaktan işçileri geri köye çeker (boşta nüfusa iade eder).
 */
export function unassignWorkers(
  village: Village,
  node: ResourceNode,
  count: number = WORKER_ASSIGNMENT_BATCH
): {
  success: boolean;
  error?: string;
  updatedVillage: Village;
  updatedNode: ResourceNode;
} {
  const currentAssignedToNode = getVillageWorkersOnNode(village, node.id);
  const actualCount = Math.min(count, currentAssignedToNode);

  if (actualCount <= 0) {
    return {
      success: false,
      error: 'Bu kaynakta geri çekilebilecek atanmış işçiniz bulunmuyor.',
      updatedVillage: village,
      updatedNode: node,
    };
  }

  const newAssignedCount = currentAssignedToNode - actualCount;
  const updatedAssignedWorkers = {
    ...(village.assignedWorkers || {}),
    [node.id]: newAssignedCount,
  };
  if (newAssignedCount <= 0) {
    delete updatedAssignedWorkers[node.id];
  }

  const updatedVillage: Village = {
    ...village,
    idlePopulation: (village.idlePopulation || 0) + actualCount,
    workingPopulation: Math.max(0, (village.workingPopulation || 0) - actualCount),
    assignedWorkers: updatedAssignedWorkers,
  };

  const updatedNode: ResourceNode = {
    ...node,
    assignedWorkers: Math.max(0, (node.assignedWorkers || 0) - actualCount),
  };

  return {
    success: true,
    updatedVillage,
    updatedNode,
  };
}

/**
 * Bir kaynağın saatlik getirisini hesaplar: işçiSayısı * verimlilik
 */
export function calculateNodeYieldPerHour(node: ResourceNode, workers?: number): number {
  const eff = getNodeEfficiency(node);
  const count = workers !== undefined ? workers : getNodeTotalWorkers(node);
  return count * eff;
}

/**
 * Oyuncunun köylerinin atanmış işçilerinden ürettiği toplam saatlik kaynakları hesaplar.
 */
export function calculateAssignedNodesProduction(
  villages: Village[],
  nodes: ResourceNode[]
): ResourceRate {
  let wood = 0;
  let stone = 0;
  let iron = 0;
  let grain = 0;
  let gold = 0;

  const nodeMap = new Map<string, ResourceNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  for (const v of villages) {
    if (!v.assignedWorkers) continue;

    for (const [nodeId, workerCount] of Object.entries(v.assignedWorkers)) {
      const count = Number(workerCount) || 0;
      if (count <= 0) continue;

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const eff = getNodeEfficiency(node);
      let yieldAmount = count * eff;

      // Beylik Üretim Bonusları
      const fKey = (v.faction || '').toLowerCase();
      // Candaroğulları demir ve taş bonusu (+%20)
      if (fKey.includes('candar') && (node.type === 'iron' || node.type === 'stone')) {
        yieldAmount *= 1.20;
      }
      // Dulkadiroğulları tahıl / ekin bonusu (+%20)
      if (fKey.includes('dulkadir') && node.type === 'grain') {
        yieldAmount *= 1.20;
      }

      switch (node.type) {
        case 'wood':
          wood += yieldAmount;
          break;
        case 'stone':
          stone += yieldAmount;
          break;
        case 'iron':
          iron += yieldAmount;
          break;
        case 'grain':
          grain += yieldAmount;
          break;
        case 'gold':
          gold += yieldAmount;
          break;
      }
    }
  }

  return {
    wood: Math.round(wood),
    stone: Math.round(stone),
    iron: Math.round(iron),
    grain: Math.round(grain),
    gold: Math.round(gold),
  };
}
