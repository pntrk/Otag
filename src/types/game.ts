/**
 * 13. Yüzyıl Anadolu ve Balkanlar Strateji Oyunu - Tip Tanımları
 */

import { ForgeResearchQueueItem, ForgeUpgrades } from './military';

export type FactionType = 
  | 'karaman'
  | 'germiyan'
  | 'kayi'
  | 'dulkadir'
  | 'candar'
  | 'osmanogullari' 
  | 'karamanogullari' 
  | 'germiyanogullari'
  | 'aydinogullari' 
  | 'candarogullari' 
  | 'dulkadirogullari';

export type FactionId = FactionType;

export interface FactionAttributes {
  id: FactionType;
  name: string;
  title: string;
  primaryResource: 'wood' | 'stone' | 'iron' | 'crop' | 'wood_iron' | 'crop_stone' | string;
  populationSpawnSeconds: number;     // Taban doğum süresi (Standart: 1200 sn)
  radiusGrowthBaseHours: number;      // Çember büyüme süresi (120-180 saat)
  radiusGrowthMinHours: number;       // Okul ile minimum süre (40-60 saat)
  bunkerCapacityPerLevel: number;     // Sığınak seviye başı koruma (Standart: 500)
  buildingSiegeResistance: number;    // Mancınık dayanımı çarpanı (Standart: 1.0)
  horseBreedingSpeedMultiplier: number;// Ahırda at yetiştirme hızı (Standart: 1.0)
  plunderCapacityMultiplier: number;  // Yağma taşıma kapasitesi
  infantryAttackBonus: number;
  cavalryAttackBonus: number;
  infantryDefenseBonus: number;
  cavalryDefenseBonus: number;
  marchSpeedMultiplier: number;
  villagerRaidRatio: number;          // Kaç askere 1 köylü kaçırılır (Standart: 10)
  horseRaidRatio: number;             // Kaç askere 1 at kaçırılır (Standart: 50)
}

export interface FactionInfo extends FactionAttributes {
  leader: string;
  capital: string;
  crestIcon: string;
  color: string;
  secondaryColor: string;
  description: string;
  passiveBonus: string;
  specialUnitId: string;
  flagImage?: string;
}

export type ResourceType = 'wood' | 'stone' | 'iron' | 'grain' | 'gold';

export interface Resources {
  wood: number;
  stone: number;
  iron: number;
  grain: number;
  gold: number;
}

export interface ResourceRate {
  wood: number;
  stone: number;
  iron: number;
  grain: number; // Net grain after troop upkeep
  gold: number;
}

export type BuildingType = 
  | 'town_hall'     // Merkez Binası
  | 'barracks'      // Kışla
  | 'stables'       // Ahır
  | 'watchtower'    // Gözcü Kulesi
  | 'wall'          // Sur
  | 'market'        // Pazar
  | 'hideout'       // Sığınak
  | 'field'         // Tahıl Tarlası
  | 'forge'         // Demirci Ocağı
  | 'warehouse'     // Depo
  | 'granary'       // Tahıl Ambarı
  | 'school'        // Okul (Medrese) - Çap Büyümesini Hızlandırır
  | 'umaykut';      // Umaykut Binası (Hükümdarlık ve Zafer Anıtı)

export interface BuildingPlot {
  id: string;
  baseType: 'town_hall' | 'barracks' | 'stables' | 'forge' | 'granary' | 'market' | 'field' | 'hideout' | 'watchtower' | 'wall' | 'warehouse' | 'school' | 'umaykut' | 'empty' | string;
  name: string;
  xPercent: number; // Sol kenardan %
  yPercent: number; // Üst kenardan %
  isGate?: boolean;
  isGateSlot?: boolean; // Kapı yuvası olduğunu belirten özel bayrak
}

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  description: string;
  icon: string;
  image?: string;
  minTownHallLevel: number;
  maxLevel: number;
  baseCost: Resources;
  costMultiplier: number;
  baseBuildTimeSec: number;
  buildTimeMultiplier: number;
}

export type UnitType = 
  | 'mizrakli'        // Mızraklı (Anti-Cavalry)
  | 'kilicli'         // Kılıçlı (Infantry)
  | 'hafif_suvari'    // Hafif Süvari (Light Cavalry)
  | 'casus'           // Casus (Spy)
  | 'kocbasi'         // Koçbaşı (Battering Ram)
  | 'gulam'           // Standart Kışla Lv 3 (Savunma Ağırlıklı Gulam Muhafızı)
  | 'levent'          // Standart Kışla Lv 4 (Dengeli Levent Piyadesi)
  | 'akinci'          // Osman Özel (Akıncı - 300 Puan)
  | 'karaman_alpi'    // Karaman Özel (Alp - 300 Puan)
  | 'tura'            // Germiyan Özel (Tura - 300 Puan)
  | 'kure_baltacisi'  // Candar Özel (Küre Baltacısı - 300 Puan)
  | 'bozok_suvarisi'; // Dulkadir Özel (Bozok Süvarisi - 300 Puan)

export interface UnitDefinition {
  id: UnitType;
  name: string;
  category: 'piyade' | 'suvari' | 'istihbarat' | 'kusatma';
  factionRequired?: FactionId;
  allowedFactions?: FactionId[]; // Üretilebildiği beylikler listesi
  buildingRequired: BuildingType;
  minBuildingLevel: number;
  attackPower: number;        // Tekil Saldırı Gücü (0 - 100)
  attackInfantry?: number;    // Geriye uyumluluk için
  attackCavalry?: number;     // Geriye uyumluluk için
  defenseInfantry: number;    // Piyade Savunması (0 - 100)
  defenseCavalry: number;     // Süvari Savunması (0 - 100)
  isSpecialUnit?: boolean;    // Beylik Özel Askeri mi?
  speedScore: number;         // Hız Puanı (0 - 100)
  plunderScore: number;       // Ganimet Puanı (0 - 100)
  speedTilesPerMin: number;
  lootCapacity: number;
  grainUpkeepPerHour: number;
  cost: Resources;
  trainingTimeSec: number;
  description: string;
  image?: string;
  thumbnail?: string;
}

export interface ResourceNode {
  id: string;
  type: ResourceType;
  name: string;
  x: number;
  y: number;
  baseYieldPerHour: number;
  efficiency?: number;       // Saatlik verimlilik değeri (2 - 9)
  assignedWorkers?: number;  // Çalışan toplam işçi sayısı (Maks 1000)
  tier: 1 | 2 | 3;
  level?: number;
  reserve?: number;          // Rezerv miktarı
  isStartingNode?: boolean;  // Otağ başlangıç çekirdek kaynağı mı?
  clusterId?: string;        // Prosedürel sektör/küme kimliği
}

export type KhanStatus = 'idle' | 'marching' | 'dead' | 'reviving';

export interface KhanSkills {
  attackAura: number;     // Seviye başına ordunun saldırı gücüne +%1.5
  defenseAura: number;    // Seviye başına garnizon savunmasına +%1.5
  cavalrySpeed: number;   // Seviye başına sefer intikal hızına +%2.0
  governance: number;     // Seviye başına ikamet ettiği köyün tüm üretimine +%1.0
}

export interface KhanHero {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpNext: number;
  status: KhanStatus;
  currentVillageId: string;
  unspentSkillPoints: number;
  skills: KhanSkills;
  reviveFinishTimestamp?: number | null;
}

export interface SharedTreasury {
  resources: Resources;
  maxCapacity: number;
}

export interface UnitUpgradeLevel {
  attackLevel: number;  // 0 - 20 (Demirci talimi: her seviye +%1 saldırı gücü)
  defenseLevel: number; // 0 - 20 (Demirci talimi: her seviye +%1 savunma gücü)
}

export interface StationedSupportArmy {
  id: string;
  originVillageId: string;
  originVillageName: string;
  originOwnerName: string;
  originFaction: FactionId;
  units: Partial<Record<UnitType, number>>;
  stationedAt: number;
}

export interface ResourceWorkers {
  wood: number;
  stone: number;
  iron: number;
  grain: number;
  gold?: number;
}

export interface Village {
  id: string;
  name: string;
  ownerName: string;
  faction: FactionId;
  isPlayer: boolean;
  x: number;
  y: number;
  buildings: Record<string, number>;
  resources: Resources;
  maxCapacity: number;
  units: Partial<Record<UnitType, number>> & Record<string, number>;
  horses?: number; // Ahırdaki veya yağmalanan at sayısı
  // Umaykut Nüfus Modeli
  totalPopulation?: number;  // Otağ seviyesine bağlı toplam ahali
  idleWorkers?: number;      // Boştaki ahali (Madenlere veya askere atanabilir)
  workingPopulation: number; // Köyün etki çemberindeki kaynaklarda çalışan işçiler
  idlePopulation: number;    // Köy merkezinde boşta bekleyen, askere çevrilebilir işçiler
  lastPopulationSpawnTimestamp: number; // Son işçi doğumu zaman damgası (ms)
  lastPlunderedTimestamp?: number;     // Son yağmalanma zaman damgası (3600s / 1 saat yağma koruması)
  // Umaykut Etki Çemberi (Radius) ve İşçi Yönetimi
  radius?: number;                      // Köyün etki yarıçapı (Başlangıç 1.0, Maks 2.5)
  lastRadiusExpansionTimestamp?: number; // Son yarıçap genişleme zaman damgası (ms)
  assignedWorkers?: ResourceWorkers | Record<string, number>; // Kaynak türlerine veya düğümlere atanan işçi sayısı
  // Destek Birlikleri & Demirci Geliştirmeleri
  stationedSupport?: StationedSupportArmy[]; // Köyde konuşlanmış müttefik/kendi destek orduları
  unitUpgrades?: Partial<Record<UnitType, UnitUpgradeLevel>>; // Demirci talimleri (%1 - %20)
  forgeUpgrades?: ForgeUpgrades;        // Demirci Araştırmaları (Çelik Pusatlar, Örme Zırhlar, Koçbaşı Güçlendirmesi)
  forgeResearchQueue?: ForgeResearchQueueItem[]; // Demirci araştırma sırası
  isCapital?: boolean;                  // Merkez Köy (Payitaht) - Umaykut Binası yalnızca burada inşa edilebilir
  allianceId?: string;                 // Üye olduğu İttifak/Birlik kimliği
  buildingSlots?: Record<string, BuildingType>; // plotId -> BuildingType arsa yerleşim haritası
}

export interface AllianceMember {
  id: string;
  name: string;
  faction: FactionType;
  role: 'leader' | 'officer' | 'member';
  totalVillages: number;
  schoolLevels: number; // Üyenin köylerindeki Okul (Medrese) binalarının toplam seviyesi
  hasLevel10Umaykut: boolean;
  umaykutLevel: number;
  capitalVillageName?: string;
  joinedAt: number;
}

export interface Alliance {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  leaderName: string;
  description: string;
  members: AllianceMember[];
  createdAt: number;
}

export interface QualifiedVictoryMember {
  userId: string;
  userName: string;
  faction: FactionType;
  villageName: string;
  umaykutLevel: number;
}

export interface VictoryCheckResult {
  isVictory: boolean;
  winningAllianceId: string | null;
  winningAllianceName: string | null;
  winningAllianceTag?: string | null;
  qualifiedMembers: QualifiedVictoryMember[];
  uniqueFactionsCount: number;
  requiredFactionsCount: number; // 3
  progressRatio: number;
  victoryDate?: string;
  announcementText?: string;
}

export interface ConstructionQueueItem {
  id: string;
  villageId: string;
  buildingType: BuildingType;
  targetLevel: number;
  startTime: number;
  durationSec: number;
  endTime: number;
}

export interface TrainingQueueItem {
  id: string;
  villageId: string;
  unitType: UnitType;
  amount: number;
  remainingAmount: number;
  unitDurationSec: number;
  nextFinishTime: number;
}

export type MarchMission = 'attack' | 'raid' | 'support' | 'spy' | 'trade';

export interface March {
  id: string;
  originVillageId: string;
  originVillageName?: string;
  originCoordinates: { x: number; y: number };
  targetVillageId?: string;
  targetCoordinates: { x: number; y: number };
  targetName: string;
  mission: MarchMission;
  units: Partial<Record<UnitType, number>>;
  withKhan?: boolean;
  startTime: number;
  durationSec: number;
  arrivalTime: number;
  isReturning: boolean;
  loot?: Partial<Resources>;
  transportResources?: Partial<Resources>; // Kervanın taşıdığı takas/aktarım hammaddeleri
  capturedVillagers?: number; // Yağmada esir edilen boşta köylüler
  capturedHorses?: number;    // Yağmada kaçırılan atlar
  isRivalAttack?: boolean;    // Düşman akını / gelen saldırı
  attackerFaction?: FactionId; // Saldıran beylik
}

export interface BattleCasualties {
  unitsBefore: Partial<Record<UnitType, number>>;
  unitsLost: Partial<Record<UnitType, number>>;
  unitsRemaining: Partial<Record<UnitType, number>>;
}

export interface DamagedBuildingInfo {
  buildingType: string;
  buildingName: string;
  levelBefore: number;
  levelAfter: number;
}

export interface BattleReport {
  id: string;
  timestamp: number;
  mission: MarchMission;
  attackerVillageName: string;
  attackerFaction: FactionId;
  attackerCoords: { x: number; y: number };
  defenderVillageName: string;
  defenderFaction: FactionId;
  defenderCoords: { x: number; y: number };
  attackerResult: 'victory' | 'defeat' | 'draw';
  attackerCasualties: BattleCasualties;
  attackerLossRatio: number;
  defenderCasualties: BattleCasualties;
  defenderLossRatio: number;
  initialWallLevel: number;
  finalWallLevel: number;
  lootCarried: Resources;
  maxLootCapacity: number;
  damagedBuildings?: DamagedBuildingInfo[];
  capturedVillagers?: number;
  capturedHorses?: number;
  savedByHideout?: number;
  hideoutProtection?: number;
  isPlunderProtected?: boolean;
  scoutedResources?: Resources;
  scoutedBuildings?: Record<string, number>;
  defendingSpies?: number;
  detected?: boolean;
  summary: string;
}
