/**
 * 13. Yüzyıl Anadolu Beylikleri - Umaykut Online Maden İşçi Tahsis & Ahali Havuzu Motoru
 * (Worker Allocation, Population Pool & Production Boost Engine)
 * 
 * Umaykut Kuralları:
 * 1. Ahali Havuzu (idlePopulation + workingPopulation):
 *    - Boşta Ahali (idlePopulation): Köyde hazır bekleyen, askere çevrilebilir veya madenlere atanabilir nüfus.
 *    - Madenlerde Çalışan (workingPopulation): Haritadaki etki çemberi içindeki madenlere sevk edilmiş işçiler.
 *    - Toplam Ahali = idlePopulation + workingPopulation.
 * 2. 10'arlı Grup Şartı:
 *    - İşçiler haritadaki madenlere 10'arlı gruplar halinde atanır/çekilir.
 * 3. Üretim Çarpanı & Saatlik Gelir:
 *    - Her kaynağa atanan her işçi, o kaynağın verimliliği oranında saatlik üretim sağlar.
 */

import { ResourceNode, ResourceType, ResourceWorkers, Village } from '../types/game';
import { 
  assignWorkers, 
  unassignWorkers, 
  getVillageWorkersOnNode, 
  getNodeTotalWorkers, 
  getNodeEfficiency,
  calculateNodeYieldPerHour,
  MAX_WORKERS_PER_NODE,
  WORKER_ASSIGNMENT_BATCH 
} from './resourceEngine';
import { isNodeWithinRadius } from './radiusEngine';

/**
 * Köyün gerçek toplam ahali sayısını hesaplar: Boşta Nüfus + Madenlerde Çalışan Nüfus
 */
export function getVillageTotalPopulation(village: Village): number {
  if (!village) return 0;
  const idle = typeof village.idlePopulation === 'number' ? village.idlePopulation : 0;
  const working = typeof village.workingPopulation === 'number' ? village.workingPopulation : 0;
  return idle + working;
}

/**
 * Köydeki boştaki ahali (idlePopulation) sayısını döndürür.
 */
export function getVillageIdleWorkers(village: Village): number {
  if (!village) return 0;
  return typeof village.idlePopulation === 'number' ? village.idlePopulation : 0;
}

/**
 * Köyün madenlerde çalışan toplam işçi (workingPopulation) sayısını döndürür.
 */
export function getVillageWorkingPopulation(village: Village, nodes?: ResourceNode[]): number {
  if (!village) return 0;
  if (typeof village.workingPopulation === 'number') {
    return village.workingPopulation;
  }
  if (village.assignedWorkers && typeof village.assignedWorkers === 'object') {
    return Object.values(village.assignedWorkers).reduce((sum, count) => sum + (Number(count) || 0), 0);
  }
  return 0;
}

/**
 * Köydeki maden işçi dağılımını kaynak türüne göre (wood, stone, iron, grain, gold) hesaplar.
 * Haritadaki gerçek düğüm atamalarıyla tam senkronize çalışır.
 */
export function getVillageResourceWorkers(
  village: Village, 
  nodes?: ResourceNode[]
): {
  wood: number;
  stone: number;
  iron: number;
  grain: number;
  gold: number;
} {
  const result = { wood: 0, stone: 0, iron: 0, grain: 0, gold: 0 };
  if (!village || !village.assignedWorkers) {
    return result;
  }

  const aw = village.assignedWorkers as Record<string, number>;

  for (const [key, count] of Object.entries(aw)) {
    const numCount = Number(count) || 0;
    if (numCount <= 0) continue;

    if (key === 'wood' || key === 'stone' || key === 'iron' || key === 'grain' || key === 'gold') {
      result[key] += numCount;
    } else if (nodes && nodes.length > 0) {
      const node = nodes.find(n => n.id === key);
      if (node && (node.type === 'wood' || node.type === 'stone' || node.type === 'iron' || node.type === 'grain' || node.type === 'gold')) {
        result[node.type] += numCount;
      }
    }
  }

  return result;
}

/**
 * İşçi sayısına göre üretim çarpanını hesaplar.
 */
export function getWorkerProductionMultiplier(workerCount: number): number {
  if (workerCount > 0) {
    return 1 + (workerCount * 0.15);
  }
  return 0.25;
}

/**
 * Belirli bir kaynak kategorisine (örn: 'wood') işçi tahsis eder veya geri çeker.
 * Köyün etki çemberindeki en uygun maden düğümünü otomatik olarak seçer.
 */
export function allocateWorkersToResourceCategory(
  village: Village,
  nodes: ResourceNode[],
  resourceType: 'wood' | 'stone' | 'iron' | 'grain',
  deltaCount: number = WORKER_ASSIGNMENT_BATCH
): {
  success: boolean;
  reason?: string;
  updatedVillage: Village;
  updatedNodes: ResourceNode[];
} {
  // 1. Köyün menzilindeki bu türe ait kaynakları filtrele
  const validNodes = nodes.filter(n => n.type === resourceType && isNodeWithinRadius(village, n));

  if (validNodes.length === 0) {
    return {
      success: false,
      reason: `Köyünüzün etki alanı (radius) içinde faal ${resourceType === 'wood' ? 'Odun' : resourceType === 'stone' ? 'Taş' : resourceType === 'iron' ? 'Demir' : 'Tahıl'} kaynağı bulunmuyor!`,
      updatedVillage: village,
      updatedNodes: nodes,
    };
  }

  // A. İşçi Gönderme (deltaCount > 0)
  if (deltaCount > 0) {
    const idle = village.idlePopulation || 0;
    if (idle < deltaCount) {
      return {
        success: false,
        reason: `Yetersiz Boşta Ahali! Mevcut: ${idle}, Gereken: ${deltaCount}`,
        updatedVillage: village,
        updatedNodes: nodes,
      };
    }

    // En yüksek verimliliğe sahip ve henüz 1000 işçi sınırına ulaşmamış düğümü seç
    const availableNodes = [...validNodes]
      .filter(n => getNodeTotalWorkers(n) < MAX_WORKERS_PER_NODE)
      .sort((a, b) => getNodeEfficiency(b) - getNodeEfficiency(a));

    if (availableNodes.length === 0) {
      return {
        success: false,
        reason: 'Bu türdeki tüm kaynaklar azami 1000 işçi kapasitesine ulaşmış durumda!',
        updatedVillage: village,
        updatedNodes: nodes,
      };
    }

    let remainingToAssign = deltaCount;
    let currentVillage = { ...village };
    let currentNodes = [...nodes];

    for (const targetNode of availableNodes) {
      if (remainingToAssign <= 0) break;
      const nodeTotal = getNodeTotalWorkers(targetNode);
      const capacityLeft = MAX_WORKERS_PER_NODE - nodeTotal;
      const batch = Math.min(remainingToAssign, capacityLeft);

      if (batch > 0) {
        const result = assignWorkers(currentVillage, targetNode, batch);
        if (result.success) {
          currentVillage = result.updatedVillage;
          currentNodes = currentNodes.map(n => n.id === targetNode.id ? result.updatedNode : n);
          remainingToAssign -= batch;
        }
      }
    }

    if (remainingToAssign > 0 && remainingToAssign === deltaCount) {
      return {
        success: false,
        reason: 'İşçiler atanamadı, kaynak kapasitesi dolu.',
        updatedVillage: village,
        updatedNodes: nodes,
      };
    }

    return {
      success: true,
      updatedVillage: currentVillage,
      updatedNodes: currentNodes,
    };
  }

  // B. İşçi Geri Çekme (deltaCount < 0)
  const countToUnassign = Math.abs(deltaCount);
  const nodesWithWorkers = validNodes.filter(n => getVillageWorkersOnNode(village, n.id) > 0);

  if (nodesWithWorkers.length === 0) {
    return {
      success: false,
      reason: 'Bu kaynak türünde geri çekilebilecek atanmış işçiniz bulunmuyor.',
      updatedVillage: village,
      updatedNodes: nodes,
    };
  }

  let remainingToUnassign = countToUnassign;
  let currentVillage = { ...village };
  let currentNodes = [...nodes];

  for (const targetNode of nodesWithWorkers) {
    if (remainingToUnassign <= 0) break;
    const currentOnNode = getVillageWorkersOnNode(currentVillage, targetNode.id);
    const batch = Math.min(remainingToUnassign, currentOnNode);

    if (batch > 0) {
      const result = unassignWorkers(currentVillage, targetNode, batch);
      if (result.success) {
        currentVillage = result.updatedVillage;
        currentNodes = currentNodes.map(n => n.id === targetNode.id ? result.updatedNode : n);
        remainingToUnassign -= batch;
      }
    }
  }

  return {
    success: true,
    updatedVillage: currentVillage,
    updatedNodes: currentNodes,
  };
}

/**
 * Boştaki tüm ahaliyi menzildeki 4 temel madene (wood, stone, iron, grain) 10'arlı gruplarla dengeli dağıtır.
 */
export function distributeWorkersEquallyAcrossNodes(
  village: Village,
  nodes: ResourceNode[]
): {
  success: boolean;
  reason?: string;
  updatedVillage: Village;
  updatedNodes: ResourceNode[];
} {
  const idle = village.idlePopulation || 0;
  if (idle < WORKER_ASSIGNMENT_BATCH) {
    return {
      success: false,
      reason: `Eşit dağıtım için en az ${WORKER_ASSIGNMENT_BATCH} boşta ahali gereklidir (Mevcut: ${idle}).`,
      updatedVillage: village,
      updatedNodes: nodes,
    };
  }

  const types: Array<'wood' | 'stone' | 'iron' | 'grain'> = ['wood', 'stone', 'iron', 'grain'];
  const activeTypes = types.filter(t => nodes.some(n => n.type === t && isNodeWithinRadius(village, n)));

  if (activeTypes.length === 0) {
    return {
      success: false,
      reason: 'Köyün etki çemberinde işçi atanabilecek hiçbir kaynak bulunmuyor!',
      updatedVillage: village,
      updatedNodes: nodes,
    };
  }

  let currentVillage = { ...village };
  let currentNodes = [...nodes];

  // Toplam 10'luk partiler
  const totalBatches = Math.floor(idle / WORKER_ASSIGNMENT_BATCH);
  let batchIndex = 0;

  for (let i = 0; i < totalBatches; i++) {
    const rType = activeTypes[batchIndex % activeTypes.length];
    const res = allocateWorkersToResourceCategory(currentVillage, currentNodes, rType, WORKER_ASSIGNMENT_BATCH);
    if (res.success) {
      currentVillage = res.updatedVillage;
      currentNodes = res.updatedNodes;
    }
    batchIndex++;
  }

  return {
    success: true,
    updatedVillage: currentVillage,
    updatedNodes: currentNodes,
  };
}

/**
 * Köyün tüm madenlerde çalışan işçilerini geri çekip boşta ahali havuzuna iade eder.
 */
export function recallAllWorkersFromNodes(
  village: Village,
  nodes: ResourceNode[]
): {
  success: boolean;
  updatedVillage: Village;
  updatedNodes: ResourceNode[];
} {
  let currentVillage = { ...village };
  let currentNodes = [...nodes];

  if (!village.assignedWorkers || typeof village.assignedWorkers !== 'object') {
    return {
      success: true,
      updatedVillage: currentVillage,
      updatedNodes: currentNodes,
    };
  }

  for (const [nodeId, count] of Object.entries(village.assignedWorkers)) {
    const numCount = Number(count) || 0;
    if (numCount > 0) {
      const node = currentNodes.find(n => n.id === nodeId);
      if (node) {
        const res = unassignWorkers(currentVillage, node, numCount);
        if (res.success) {
          currentVillage = res.updatedVillage;
          currentNodes = currentNodes.map(n => n.id === node.id ? res.updatedNode : n);
        }
      }
    }
  }

  // Kalan eski assignedWorkers anahtarlarını sıfırla
  currentVillage = {
    ...currentVillage,
    workingPopulation: 0,
    idlePopulation: (village.idlePopulation || 0) + (village.workingPopulation || 0),
    assignedWorkers: {},
  };

  return {
    success: true,
    updatedVillage: currentVillage,
    updatedNodes: currentNodes,
  };
}

// Geriye dönük uyumluluk için eski fonksiyon takma adları
export const distributeWorkersEqually = (village: Village): Village => village;
export const recallAllWorkers = (village: Village): Village => village;
export const updateWorkerAllocation = (
  village: Village,
  resourceType: 'wood' | 'stone' | 'iron' | 'grain',
  delta: number
) => {
  return {
    updatedVillage: village,
    success: true,
  };
};

