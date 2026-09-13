export type ResourceType = 'wood' | 'stone' | 'iron' | 'grain' | 'gold';

export interface ResourceNode {
  id: string;
  type: ResourceType;
  name: string;
  x: number;
  y: number;
  reserve: number;
  isStartingNode: boolean;
  clusterId: string;
  baseYieldPerHour: number;
  efficiency?: number;
  assignedWorkers?: number;
  tier: 1 | 2 | 3;
  level?: number;
}

export interface PlayerSpawnHub {
  id: string;
  x: number;
  y: number;
  isOccupied: boolean;
  assignedPlayerId?: string;
  startingNodes: ResourceNode[];
}

export interface GeneratedWorld {
  width: number;
  height: number;
  spawnHubs: PlayerSpawnHub[];
  allResources: ResourceNode[];
  spatialHashIndex?: Map<string, ResourceNode[]>;
}

export const WORLD_CONFIG = {
  WIDTH: 24000,
  HEIGHT: 12000,
  CELL_SIZE: 420, // Her oyuncu için ayrılan sektör genişliği
  OTAĞ_RADIUS: 120,
  CORE_DISTANCE: 75,
  SPATIAL_BUCKET_SIZE: 500, // Spatial Hash Culling için kova boyutu
};

// Kaynak İsim & Özellik Şablonları
const RESOURCE_TEMPLATES: Record<ResourceType, { defaultName: string; baseYield: number; tier: 1 | 2 | 3; defaultReserve: number }> = {
  wood: { defaultName: 'Domaniç Meşe Koruluğu', baseYield: 240, tier: 2, defaultReserve: 10000 },
  iron: { defaultName: 'Pazaryeri Demir Damarı', baseYield: 220, tier: 2, defaultReserve: 10000 },
  stone: { defaultName: 'Bilecik Kalker Kayalığı', baseYield: 200, tier: 1, defaultReserve: 10000 },
  grain: { defaultName: 'Bereketli Ekin Tarlası', baseYield: 380, tier: 3, defaultReserve: 8000 },
  gold: { defaultName: 'Sakarya Altın Damarı', baseYield: 150, tier: 3, defaultReserve: 5000 },
};

/**
 * Binlerce oyuncuyu barındıran Hücresel Prosedürel Kümeleme (Jittered Cell Cluster) Dünyası Üreticisi
 */
export function generateMassiveWorld(seed: number = 12345): GeneratedWorld {
  // Deterministik Pseudo-Random Üretici (PRNG)
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const spawnHubs: PlayerSpawnHub[] = [];
  const allResources: ResourceNode[] = [];
  const spatialHashIndex = new Map<string, ResourceNode[]>();

  const cols = Math.floor(WORLD_CONFIG.WIDTH / WORLD_CONFIG.CELL_SIZE);
  const rows = Math.floor(WORLD_CONFIG.HEIGHT / WORLD_CONFIG.CELL_SIZE);

  let hubCounter = 0;
  let resCounter = 0;

  // Spatial bucket ekleme yardımcısı
  const addToSpatialHash = (node: ResourceNode) => {
    const bucketX = Math.floor(node.x / WORLD_CONFIG.SPATIAL_BUCKET_SIZE);
    const bucketY = Math.floor(node.y / WORLD_CONFIG.SPATIAL_BUCKET_SIZE);
    const key = `${bucketX}_${bucketY}`;
    const list = spatialHashIndex.get(key) || [];
    list.push(node);
    spatialHashIndex.set(key, list);
  };

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      hubCounter++;
      const hubId = `hub_${hubCounter}`;

      // Hücre içi hafif rastgelelik (Jitter)
      const jitterX = (pseudoRandom() - 0.5) * 80;
      const jitterY = (pseudoRandom() - 0.5) * 80;
      const centerX = Math.round(c * WORLD_CONFIG.CELL_SIZE + WORLD_CONFIG.CELL_SIZE / 2 + jitterX);
      const centerY = Math.round(r * WORLD_CONFIG.CELL_SIZE + WORLD_CONFIG.CELL_SIZE / 2 + jitterY);

      // 1. Otağ Etki Alanı İçi 3'lü Çekirdek Kaynaklar (120 derece aralıkla garantili üçgen çakımı)
      const startNodes: ResourceNode[] = [
        {
          id: `res_${++resCounter}`,
          type: 'wood',
          name: `${hubId} Meşe Koruluğu`,
          x: centerX,
          y: centerY - WORLD_CONFIG.CORE_DISTANCE,
          reserve: RESOURCE_TEMPLATES.wood.defaultReserve,
          isStartingNode: true,
          clusterId: hubId,
          baseYieldPerHour: RESOURCE_TEMPLATES.wood.baseYield,
          tier: RESOURCE_TEMPLATES.wood.tier,
          efficiency: 7,
          level: 5,
        },
        {
          id: `res_${++resCounter}`,
          type: 'iron',
          name: `${hubId} Demir Ocağı`,
          x: centerX + 65,
          y: centerY + 38,
          reserve: RESOURCE_TEMPLATES.iron.defaultReserve,
          isStartingNode: true,
          clusterId: hubId,
          baseYieldPerHour: RESOURCE_TEMPLATES.iron.baseYield,
          tier: RESOURCE_TEMPLATES.iron.tier,
          efficiency: 7,
          level: 4,
        },
        {
          id: `res_${++resCounter}`,
          type: 'stone',
          name: `${hubId} Kalker Kayalığı`,
          x: centerX - 65,
          y: centerY + 38,
          reserve: RESOURCE_TEMPLATES.stone.defaultReserve,
          isStartingNode: true,
          clusterId: hubId,
          baseYieldPerHour: RESOURCE_TEMPLATES.stone.baseYield,
          tier: RESOURCE_TEMPLATES.stone.tier,
          efficiency: 6,
          level: 4,
        },
      ];

      // 2. Çevre Dış Kaynaklar (Tahıl & Altın - 140px - 220px Dış Keşif Çemberi)
      const grainAngle = pseudoRandom() * Math.PI * 2;
      const grainDist = 145 + pseudoRandom() * 40;
      startNodes.push({
        id: `res_${++resCounter}`,
        type: 'grain',
        name: `${hubId} Ekin Tarlası`,
        x: Math.round(centerX + Math.cos(grainAngle) * grainDist),
        y: Math.round(centerY + Math.sin(grainAngle) * grainDist),
        reserve: RESOURCE_TEMPLATES.grain.defaultReserve,
        isStartingNode: false,
        clusterId: hubId,
        baseYieldPerHour: RESOURCE_TEMPLATES.grain.baseYield,
        tier: RESOURCE_TEMPLATES.grain.tier,
        efficiency: 8,
        level: 6,
      });

      if (pseudoRandom() > 0.65) {
        const goldAngle = grainAngle + Math.PI + (pseudoRandom() - 0.5);
        const goldDist = 160 + pseudoRandom() * 50;
        startNodes.push({
          id: `res_${++resCounter}`,
          type: 'gold',
          name: `${hubId} Altın Damarı`,
          x: Math.round(centerX + Math.cos(goldAngle) * goldDist),
          y: Math.round(centerY + Math.sin(goldAngle) * goldDist),
          reserve: RESOURCE_TEMPLATES.gold.defaultReserve,
          isStartingNode: false,
          clusterId: hubId,
          baseYieldPerHour: RESOURCE_TEMPLATES.gold.baseYield,
          tier: RESOURCE_TEMPLATES.gold.tier,
          efficiency: 6,
          level: 5,
        });
      }

      // 3. Serbest Vahşi Araziler (Sektör Kesişim Tampon Bölgelerindeki Zengin Madenler)
      if (pseudoRandom() > 0.78) {
        const wildAngle = pseudoRandom() * Math.PI * 2;
        const wildDist = 240 + pseudoRandom() * 70;
        const isWildIron = pseudoRandom() > 0.45;
        const wildType: ResourceType = isWildIron ? 'iron' : 'gold';

        const wildNode: ResourceNode = {
          id: `res_${++resCounter}`,
          type: wildType,
          name: isWildIron ? `Derin Demir Yatağı #${resCounter}` : `Kadim Altın Damarı #${resCounter}`,
          x: Math.round(centerX + Math.cos(wildAngle) * wildDist),
          y: Math.round(centerY + Math.sin(wildAngle) * wildDist),
          reserve: isWildIron ? 25000 : 15000,
          isStartingNode: false,
          clusterId: `wild_${hubId}`,
          baseYieldPerHour: isWildIron ? 350 : 220,
          tier: 3,
          efficiency: 9,
          level: 8,
        };
        allResources.push(wildNode);
        addToSpatialHash(wildNode);
      }

      const hub: PlayerSpawnHub = {
        id: hubId,
        x: centerX,
        y: centerY,
        isOccupied: false,
        startingNodes: startNodes,
      };

      spawnHubs.push(hub);
      allResources.push(...startNodes);
      startNodes.forEach(addToSpatialHash);
    }
  }

  return {
    width: WORLD_CONFIG.WIDTH,
    height: WORLD_CONFIG.HEIGHT,
    spawnHubs,
    allResources,
    spatialHashIndex,
  };
}

/**
 * Oyuncu Başlangıç Yerleşimi ve Merkezleme
 */
export function spawnPlayerSettlement(world: GeneratedWorld, playerId: string) {
  // Boş ve en dengeli spawn hücresini bul
  const availableHub = world.spawnHubs.find(h => !h.isOccupied);
  if (!availableHub) throw new Error("Haritada yerleşim yeri tükendi!");

  availableHub.isOccupied = true;
  availableHub.assignedPlayerId = playerId;

  return {
    settlementCoordinates: { x: availableHub.x, y: availableHub.y },
    autoHarvestedNodes: availableHub.startingNodes.filter(n => n.isStartingNode),
    hub: availableHub,
  };
}
