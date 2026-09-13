/**
 * 13. Yüzyıl Anadolu Beylikleri - Node.js Backend Otomatik Kaynak Toplama & Tick Motoru
 * (Serverless / Background Worker Tick Engine)
 * 
 * Mekanik:
 * - Köylerde iç üretim binası (tarla/oduncu vb.) YOKTUR. Tüm ekonomi haritaya dayalıdır.
 * - Her köyün Merkez Binası seviyesine göre haritada büyüyen bir 'Etki Çemberi' (Influence Radius) vardır.
 * - Çember içine giren kaynak düğümleri (Resource Nodes) otomatik olarak toplanır ve oyuncunun bakiyesine eklenir.
 * - Depo kapasitesi (Warehouse Cap) aşılamaz.
 * - Beylik pasif bonusları (Örn: Candaroğulları Taş/Demir +%20, Aydınoğulları Altın +%15) çarpan olarak uygulanır.
 */

import { FactionId, ResourceNode, ResourceRate, Resources, Village } from '../types/game';
import { FACTIONS } from '../data/gameData';
import { getVillageRadius, isNodeWithinRadius } from './radiusEngine';
import { getVillageMaxCapacity } from './simulation';

export interface TickCollectionResult {
  villageId: string;
  collectedNodesCount: number;
  hourlyRates: ResourceRate;
  previousResources: Resources;
  newResources: Resources;
  cappedOut: { [key in keyof Resources]: boolean };
  deltaTimeSeconds: number;
}

/**
 * İki koordinat arasındaki Öklid Mesafesini hesaplar
 */
export function calculateEuclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Bir köyün etki çapı (Radius) içerisine düşen kaynak düğümlerini filtreler
 */
export function getNodesInsideVillageRadius(village: Village, allNodes: ResourceNode[]): ResourceNode[] {
  const radius = getVillageRadius(village);
  return allNodes.filter(node => isNodeWithinRadius(village, node, radius));
}

/**
 * Bir köyün saatlik üretim oranlarını (Yield Per Hour) hesaplar
 */
export function calculateVillageYieldRates(village: Village, allNodes: ResourceNode[]): ResourceRate {
  const capturedNodes = getNodesInsideVillageRadius(village, allNodes);
  const faction = village.faction;

  // Temel Köy Asgari Yaşam Üretimi (Haritada düğüm olmasa bile minimum nefes payı)
  const baseYield: ResourceRate = {
    wood: 25,
    stone: 20,
    iron: 15,
    grain: 30,
    gold: 10
  };

  // Kapsama giren kaynak düğümlerinin saatlik verimlerini topla
  capturedNodes.forEach(node => {
    if (baseYield[node.type] !== undefined) {
      baseYield[node.type] += node.baseYieldPerHour;
    }
  });

  // Beylik Pasif Bonuslarını Uygula
  if (faction === 'candarogullari') {
    baseYield.iron = Math.round(baseYield.iron * 1.20);
    baseYield.stone = Math.round(baseYield.stone * 1.20);
  } else if (faction === 'aydinogullari') {
    baseYield.gold = Math.round(baseYield.gold * 1.15);
  } else if (faction === 'karamanogullari') {
    baseYield.stone = Math.round(baseYield.stone * 1.15);
  } else if (faction === 'osmanogullari') {
    baseYield.wood = Math.round(baseYield.wood * 1.10);
    baseYield.gold = Math.round(baseYield.gold * 1.10);
  } else if (faction === 'dulkadirogullari') {
    baseYield.grain = Math.round(baseYield.grain * 1.20);
  }

  return baseYield;
}

/**
 * Node.js Arka Plan Tick Motoru: Tek bir köy için delta zamanda kaynakları toplar
 */
export function processVillageTick(
  village: Village, 
  allNodes: ResourceNode[], 
  deltaTimeSeconds: number
): TickCollectionResult {
  const rates = calculateVillageYieldRates(village, allNodes);
  const capturedNodes = getNodesInsideVillageRadius(village, allNodes);
  const maxCapacity = getVillageMaxCapacity(village);

  const previousResources: Resources = { ...village.resources };
  const newResources: Resources = { ...village.resources };
  const cappedOut = {
    wood: false,
    stone: false,
    iron: false,
    grain: false,
    gold: false,
  };

  const deltaHours = Math.max(0, deltaTimeSeconds) / 3600;

  const resKeys: Array<keyof Resources> = ['wood', 'stone', 'iron', 'grain', 'gold'];
  resKeys.forEach(res => {
    const increment = rates[res] * deltaHours;
    const prospective = previousResources[res] + increment;

    if (prospective >= maxCapacity) {
      newResources[res] = maxCapacity;
      cappedOut[res] = true;
    } else {
      newResources[res] = prospective;
      cappedOut[res] = false;
    }
  });

  return {
    villageId: village.id,
    collectedNodesCount: capturedNodes.length,
    hourlyRates: rates,
    previousResources,
    newResources,
    cappedOut,
    deltaTimeSeconds
  };
}

/**
 * Node.js Sunucu için Çoklu Köy Batch Tick Döngüsü (Server-authoritative Batch Processing)
 */
export class NodeJsGameTickServer {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private lastTickTime: number = Date.now();
  private tickIntervalMs = 1000; // 1 saniyelik tick frekansı

  constructor(
    private getVillages: () => Village[],
    private getResourceNodes: () => ResourceNode[],
    private onBatchTickComplete: (results: TickCollectionResult[]) => void
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = Date.now();

    this.timer = setInterval(() => {
      this.executeTick();
    }, this.tickIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public executeTick(): void {
    const now = Date.now();
    const deltaTimeSeconds = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    const villages = this.getVillages();
    const nodes = this.getResourceNodes();

    const results: TickCollectionResult[] = villages.map(village => {
      return processVillageTick(village, nodes, deltaTimeSeconds);
    });

    this.onBatchTickComplete(results);
  }
}
