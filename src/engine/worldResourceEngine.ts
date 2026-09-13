/**
 * 13. Yüzyıl Anadolu Beylikleri - Devasa Bereketli Kaynak Üretim ve Yerleşim Motoru
 * (High-Density Resource Generator & Balanced World Resource Grid Engine)
 */

import { ResourceNode, ResourceType } from '../types/game';
import { collisionDataMap, DATA_MAP_WIDTH, DATA_MAP_HEIGHT } from './collisionDataMap';
import { INITIAL_RESOURCE_NODES, INITIAL_RIVAL_VILLAGES, INITIAL_PLAYER_VILLAGES } from '../data/gameData';

const RESOURCE_TYPES: ResourceType[] = ['wood', 'stone', 'iron', 'grain', 'gold'];

const RESOURCE_NAMES: Record<ResourceType, string[]> = {
  wood: [
    'Ulu Meşe Koruluğu', 'Gürgen Ormanı', 'Karaçam Korusu', 'Ulu Çınar Havzası',
    'Sedir Ormanı', 'Domaniç Ormanı', 'Ilgaz Ormanlığı', 'Koru Sırtı',
    'Toros Sedirliği', 'Kazdağı Göknarlığı', 'Köroğlu Çamlığı', 'Küre Ormanı'
  ],
  stone: [
    'Kalker Kayalığı', 'Mermer Ocağı', 'Andezit Yatağı', 'Bazalt Ocağı',
    'Traverten Sırtı', 'Bilecik Taşlığı', 'Granit Kesim Sahası', 'Maden Kayası',
    'Afyon Mermerliği', 'Kapadokya Tüf Sahası', 'Toros Taş Ocağı', 'Kula Bazaltlığı'
  ],
  iron: [
    'Kızıl Demir Damarı', 'Cevher Ocağı', 'Manyetit Yatağı', 'Küre Madeni',
    'Demirci Sırtı', 'Dökümhane Ocağı', 'Közlü Maden Havzası', 'Pazaryeri Demirliği',
    'Divriği Demir Yatağı', 'Sivas Cevherliği', 'Toros Demir Ocağı', 'Ergani Bakır & Demiri'
  ],
  grain: [
    'Bereketli Alüvyon', 'Başak Tarlası', 'Nehir Vadisi', 'Buğday Harmanı',
    'Geniş Çiftlik', 'İnegöl Ovası', 'Sarı Ekin Tarlası', 'Değirmen Başı',
    'Konya Buğday Ambarı', 'Çukurova Bereketliği', 'Bafra Ekin Havzası', 'Harran Alüvyonu'
  ],
  gold: [
    'Altın Kum Havzası', 'Kuvars Altın Damarı', 'Dere Yatağı Simi', 'Kıymetli Maden Ocağı',
    'Sakarya Alüvyonu', 'Gümüş & Altın Yatağı', 'Sarı Sim Madeni', 'Hazine Damarı',
    'Paktolos Altın Çayı', 'Sart Altın Yatağı', 'Gümüşhane Sim Ocağı', 'Kızılırmak Simi'
  ],
};

/**
 * Belirli bir köyün etrafına (1 ile 3 kare mesafe içine) 5 temel kaynağın (Odun, Taş, Demir, Ekin, Altın)
 * her birinden zengin düğümler yerleştirir. Böylece köyün çeperi mutlaka kaynaklara değer.
 */
export function createClusterAroundCoords(
  cx: number,
  cy: number,
  clusterPrefix: string
): ResourceNode[] {
  const clusterOffsets: Array<{ dx: number; dy: number; type: ResourceType; tier: 1 | 2 | 3; yieldRate: number; nameSuffix: string }> = [
    // 1 Kare Mesafe (Doğrudan sınır teması)
    { dx: -1, dy: 0, type: 'wood', tier: 2, yieldRate: 420, nameSuffix: 'Köy Meşeliği' },
    { dx: 1, dy: 0, type: 'stone', tier: 2, yieldRate: 400, nameSuffix: 'Kalker Taşlığı' },
    { dx: 0, dy: -1, type: 'iron', tier: 2, yieldRate: 390, nameSuffix: 'Demir Cevheri' },
    { dx: 0, dy: 1, type: 'grain', tier: 3, yieldRate: 620, nameSuffix: 'Bereketli Buğday Tarlası' },
    { dx: 1, dy: 1, type: 'gold', tier: 3, yieldRate: 350, nameSuffix: 'Altın Kumluğu' },
    { dx: -1, dy: -1, type: 'wood', tier: 2, yieldRate: 410, nameSuffix: 'Karaçam Korusu' },
    { dx: -1, dy: 1, type: 'grain', tier: 3, yieldRate: 590, nameSuffix: 'Başak Tarlası' },
    { dx: 1, dy: -1, type: 'iron', tier: 2, yieldRate: 400, nameSuffix: 'Kızıl Maden Damarı' },

    // 2 Kare Mesafe (Gelişmiş Çeper Teması)
    { dx: 2, dy: 0, type: 'stone', tier: 2, yieldRate: 390, nameSuffix: 'Mermer Kayalığı' },
    { dx: 0, dy: 2, type: 'wood', tier: 2, yieldRate: 440, nameSuffix: 'Gürgen Ormanı' },
    { dx: -2, dy: 0, type: 'grain', tier: 3, yieldRate: 630, nameSuffix: 'Büyük Çiftlik' },
    { dx: 0, dy: -2, type: 'gold', tier: 3, yieldRate: 360, nameSuffix: 'Dere Simi' },
    { dx: 2, dy: 2, type: 'iron', tier: 3, yieldRate: 520, nameSuffix: 'Közlü Demir Ocağı' },
    { dx: -2, dy: -2, type: 'wood', tier: 3, yieldRate: 530, nameSuffix: 'Ulu Orman' },
    { dx: -2, dy: 2, type: 'grain', tier: 3, yieldRate: 650, nameSuffix: 'Nehir Boyu Harmanı' },
    { dx: 2, dy: -2, type: 'stone', tier: 3, yieldRate: 510, nameSuffix: 'Granit Yatağı' },
  ];

  return clusterOffsets.map((item, idx) => {
    const targetX = Math.max(2, Math.min(DATA_MAP_WIDTH - 3, cx + item.dx));
    const targetY = Math.max(2, Math.min(DATA_MAP_HEIGHT - 3, cy + item.dy));
    return {
      id: `${clusterPrefix}_res_${idx}_${targetX}_${targetY}`,
      type: item.type,
      name: `${clusterPrefix} ${item.nameSuffix}`,
      x: targetX,
      y: targetY,
      baseYieldPerHour: item.yieldRate,
      tier: item.tier,
      level: item.tier === 3 ? 8 : item.tier === 2 ? 6 : 4,
    };
  });
}

/**
 * 1000x500 Harita için 10.000+ dengeli, bereketli ve her bölgede eşit dağıtılmış kaynak düğümü üretir.
 * Tüm oyuncu ve rakip köylerinin etrafında zengin kaynak kümeleri garanti edilir.
 */
export function generateAllWorldResourceNodes(): ResourceNode[] {
  const result: ResourceNode[] = [];
  const occupied = new Set<string>();

  const registerNode = (node: ResourceNode) => {
    const key = `${node.x},${node.y}`;
    if (!occupied.has(key)) {
      occupied.add(key);
      result.push(node);
    }
  };

  // 1. Statik tohum düğümler
  INITIAL_RESOURCE_NODES.forEach(registerNode);

  // 2. Oyuncunun başlangıç köyleri çevresine garantili temas kaynakları
  INITIAL_PLAYER_VILLAGES.forEach((v) => {
    const cluster = createClusterAroundCoords(v.x, v.y, v.name || 'Payitaht');
    cluster.forEach(registerNode);
  });

  // 3. Rakip köylerin etrafına da garantili kaynak kümeleri
  INITIAL_RIVAL_VILLAGES.forEach((v) => {
    const cluster = createClusterAroundCoords(v.x, v.y, v.name || 'Hisar');
    cluster.forEach(registerNode);
  });

  // 4. Deterministik Pseudo-Random & Stratified Grid Dağıtım
  let seed = 948215;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Izgara tabanlı (Stratified Grid) dengeli yerleşim:
  // Her 5x5 sektör taranarak karasal alanlara 5 temel kaynak türü sırayla ve dengeli dağıtılır.
  const GRID_STEP = 5;
  let typeRoundRobin = 0;

  for (let gx = 6; gx < DATA_MAP_WIDTH - 6; gx += GRID_STEP) {
    for (let gy = 6; gy < DATA_MAP_HEIGHT - 6; gy += GRID_STEP) {
      // Her sektör içinde 1 ila 2 adet dengeli kaynak yerleşimi
      const countInCell = pseudoRandom() > 0.3 ? 2 : 1;

      for (let c = 0; c < countInCell; c++) {
        const jx = Math.floor(gx + pseudoRandom() * GRID_STEP);
        const jy = Math.floor(gy + pseudoRandom() * GRID_STEP);
        const key = `${jx},${jy}`;

        if (occupied.has(key)) continue;
        if (collisionDataMap.isWater(jx, jy)) continue;

        occupied.add(key);

        // 5 temel kaynak türü arasında tam dengeli dönüşüm (Wood, Stone, Iron, Grain, Gold)
        const type = RESOURCE_TYPES[typeRoundRobin % RESOURCE_TYPES.length];
        typeRoundRobin++;

        const names = RESOURCE_NAMES[type];
        const name = names[Math.floor(pseudoRandom() * names.length)];
        
        // Zengin ve verimli tier dağılımı: %35 Tier 3, %45 Tier 2, %20 Tier 1
        const tierRoll = pseudoRandom();
        const tier: 1 | 2 | 3 = tierRoll > 0.65 ? 3 : tierRoll > 0.20 ? 2 : 1;
        const baseYieldPerHour = (tier === 3 ? 550 : tier === 2 ? 420 : 310) + Math.floor(pseudoRandom() * 120);
        const level = tier === 1 ? (3 + Math.floor(pseudoRandom() * 3)) : tier === 2 ? (6 + Math.floor(pseudoRandom() * 3)) : (8 + Math.floor(pseudoRandom() * 3));

        const newNode: ResourceNode = {
          id: `w_node_${jx}_${jy}`,
          type,
          name,
          x: jx,
          y: jy,
          baseYieldPerHour,
          tier,
          level,
        };

        result.push(newNode);
      }
    }
  }

  return result;
}

/**
 * Yeni kurulan bir köyün koordinatları etrafına hemen zengin kaynak kümesi ekler
 */
export function ensureNearbyResourcesForVillage(
  villageCoords: { x: number; y: number },
  villageName: string,
  currentNodes: ResourceNode[]
): ResourceNode[] {
  const existingKeys = new Set(currentNodes.map(n => `${n.x},${n.y}`));
  const cluster = createClusterAroundCoords(villageCoords.x, villageCoords.y, villageName);
  
  const toAdd: ResourceNode[] = [];
  cluster.forEach(node => {
    const key = `${node.x},${node.y}`;
    if (!existingKeys.has(key) && !collisionDataMap.isWater(node.x, node.y)) {
      existingKeys.add(key);
      toAdd.push(node);
    }
  });

  if (toAdd.length > 0) {
    return [...currentNodes, ...toAdd];
  }
  return currentNodes;
}
