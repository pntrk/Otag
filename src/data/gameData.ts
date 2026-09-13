import { 
  BuildingDefinition, 
  BuildingType, 
  FactionAttributes,
  FactionId, 
  FactionInfo, 
  FactionType,
  ResourceNode, 
  Resources, 
  UnitDefinition, 
  UnitType, 
  Village 
} from '../types/game';

// 5 Ana Beylik Nitelik ve Denge Verileri
export const FACTION_ATTRIBUTES: Record<FactionType, FactionAttributes> = {
  osmanogullari: {
    id: 'osmanogullari',
    name: 'Osman',
    title: 'Gaza Sancağı & Akıncı Ocağı',
    primaryResource: 'wood',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 150,
    radiusGrowthMinHours: 50,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.0,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.20,
    infantryAttackBonus: 0.00,
    cavalryAttackBonus: 0.00,
    infantryDefenseBonus: 0.00,
    cavalryDefenseBonus: 0.00,
    marchSpeedMultiplier: 1.15,
    villagerRaidRatio: 8, // 8 askere 1 köylü
    horseRaidRatio: 50,
  },
  kayi: {
    id: 'kayi',
    name: 'Osman',
    title: 'Gaza Sancağı & Akıncı Ocağı',
    primaryResource: 'wood',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 150,
    radiusGrowthMinHours: 50,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.0,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.20,
    infantryAttackBonus: 0.05, // Dengeli Beylik: +%5 Saldırı
    cavalryAttackBonus: 0.05,
    infantryDefenseBonus: 0.05, // Dengeli Beylik: +%5 Savunma
    cavalryDefenseBonus: 0.05,
    marchSpeedMultiplier: 1.15,
    villagerRaidRatio: 8,
    horseRaidRatio: 50,
  },
  karamanogullari: {
    id: 'karamanogullari',
    name: 'Karaman',
    title: 'Selçuklu Mirasçısı & Nizam-ı Âlem',
    primaryResource: 'stone',
    populationSpawnSeconds: 960, // 960 sn (16 dk - En Hızlı)
    radiusGrowthBaseHours: 180,
    radiusGrowthMinHours: 60,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.25,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.20, // Saldırı Ağırlıklı: +%20 Taarruz Gücü
    cavalryAttackBonus: 0.20,
    infantryDefenseBonus: 0.00,
    cavalryDefenseBonus: 0.00,
    marchSpeedMultiplier: 1.00,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  karaman: {
    id: 'karaman',
    name: 'Karaman',
    title: 'Selçuklu Mirasçısı & Nizam-ı Âlem',
    primaryResource: 'stone',
    populationSpawnSeconds: 960,
    radiusGrowthBaseHours: 180,
    radiusGrowthMinHours: 60,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.25,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.20, // Saldırı Ağırlıklı: +%20 Taarruz Gücü
    cavalryAttackBonus: 0.20,
    infantryDefenseBonus: 0.00,
    cavalryDefenseBonus: 0.00,
    marchSpeedMultiplier: 1.00,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  germiyanogullari: {
    id: 'germiyanogullari',
    name: 'Germiyan',
    title: 'Kütahya Muhafızları & Sarsılmaz Sur',
    primaryResource: 'stone',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 160,
    radiusGrowthMinHours: 50,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.25,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.00,
    cavalryAttackBonus: 0.00,
    infantryDefenseBonus: 0.25, // Savunma Ağırlıklı: +%25 Savunma
    cavalryDefenseBonus: 0.25,
    marchSpeedMultiplier: 1.00,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  germiyan: {
    id: 'germiyan',
    name: 'Germiyan',
    title: 'Kütahya Muhafızları & Sarsılmaz Sur',
    primaryResource: 'stone',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 160,
    radiusGrowthMinHours: 50,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.25,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.00,
    cavalryAttackBonus: 0.00,
    infantryDefenseBonus: 0.25, // Savunma Ağırlıklı: +%25 Savunma
    cavalryDefenseBonus: 0.25,
    marchSpeedMultiplier: 1.00,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  aydinogullari: {
    id: 'aydinogullari',
    name: 'Aydınoğulları Beyliği',
    title: 'Ege Gazileri & Denizci Leventler',
    primaryResource: 'wood_iron',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 180,
    radiusGrowthMinHours: 60,
    bunkerCapacityPerLevel: 350,
    buildingSiegeResistance: 1.00,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.15,
    cavalryAttackBonus: 0.00,
    infantryDefenseBonus: 0.00,
    cavalryDefenseBonus: 0.00,
    marchSpeedMultiplier: 1.20,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  candarogullari: {
    id: 'candarogullari',
    name: 'Candar',
    title: 'Küre Madencileri & Ağır Baltacılar',
    primaryResource: 'iron',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 120,
    radiusGrowthMinHours: 40,
    bunkerCapacityPerLevel: 800,
    buildingSiegeResistance: 1.25, // Kuşatma Gücü +%25
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.20, // Saldırı Ağırlıklı: +%20 Taarruz Gücü
    cavalryAttackBonus: 0.15,
    infantryDefenseBonus: 0.00,
    cavalryDefenseBonus: 0.00,
    marchSpeedMultiplier: 0.85,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  candar: {
    id: 'candar',
    name: 'Candar',
    title: 'Küre Madencileri & Ağır Baltacılar',
    primaryResource: 'iron',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 120,
    radiusGrowthMinHours: 40,
    bunkerCapacityPerLevel: 800,
    buildingSiegeResistance: 1.25,
    horseBreedingSpeedMultiplier: 1.00,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.20, // Saldırı Ağırlıklı: +%20 Taarruz Gücü
    cavalryAttackBonus: 0.15,
    infantryDefenseBonus: 0.00,
    cavalryDefenseBonus: 0.00,
    marchSpeedMultiplier: 0.85,
    villagerRaidRatio: 10,
    horseRaidRatio: 50,
  },
  dulkadirogullari: {
    id: 'dulkadirogullari',
    name: 'Dulkadir',
    title: 'Toros Yaylacıları & Bozok Süvarileri',
    primaryResource: 'crop_stone',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 160,
    radiusGrowthMinHours: 50,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.00,
    horseBreedingSpeedMultiplier: 1.35,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.00,
    cavalryAttackBonus: 0.00,
    infantryDefenseBonus: 0.20, // Savunma Ağırlıklı: +%20 Savunma
    cavalryDefenseBonus: 0.20,
    marchSpeedMultiplier: 1.00,
    villagerRaidRatio: 10,
    horseRaidRatio: 40,
  },
  dulkadir: {
    id: 'dulkadir',
    name: 'Dulkadir',
    title: 'Toros Yaylacıları & Bozok Süvarileri',
    primaryResource: 'crop_stone',
    populationSpawnSeconds: 1200,
    radiusGrowthBaseHours: 160,
    radiusGrowthMinHours: 50,
    bunkerCapacityPerLevel: 500,
    buildingSiegeResistance: 1.00,
    horseBreedingSpeedMultiplier: 1.35,
    plunderCapacityMultiplier: 1.00,
    infantryAttackBonus: 0.00,
    cavalryAttackBonus: 0.00,
    infantryDefenseBonus: 0.20, // Savunma Ağırlıklı: +%20 Savunma
    cavalryDefenseBonus: 0.20,
    marchSpeedMultiplier: 1.00,
    villagerRaidRatio: 10,
    horseRaidRatio: 40,
  },
};

// 5 Ana Beylik Detaylı Bilgisi (FactionInfo extends FactionAttributes)
export const FACTIONS: Record<FactionId, FactionInfo> = {
  osmanogullari: {
    ...FACTION_ATTRIBUTES.osmanogullari,
    leader: 'Osman Gazi',
    capital: 'Söğüt',
    crestIcon: '🏹',
    flagImage: '/assets/flags/osman.webp',
    color: '#b91c1c',
    secondaryColor: '#fef2f2',
    description: 'Bizans ucunda gaza ve fütuhat ruhuyla yükselen, hem saldırıda hem savunmada orta ayarda dengeli ordu doktrini ve akıncı süratiyle tanınan beylik.',
    passiveBonus: 'Dengeli Ordu (+%5 Saldırı / +%5 Savunma), Sefer Hızı +%15, Özel Birim: Akıncı',
    specialUnitId: 'akinci',
  },
  kayi: {
    ...FACTION_ATTRIBUTES.kayi,
    leader: 'Osman Gazi',
    capital: 'Söğüt',
    crestIcon: '🏹',
    flagImage: '/assets/flags/osman.webp',
    color: '#b91c1c',
    secondaryColor: '#fef2f2',
    description: 'Söğüt ve Domaniç uç bölgesinde gaza ruhuyla parlayan, hem taarruzda hem savunmada orta ayarda dengeli yapısıyla cihan devleti temelini atan beylik.',
    passiveBonus: 'Dengeli Ordu (+%5 Saldırı / +%5 Savunma), Sefer Hızı +%15, Özel Birim: Akıncı',
    specialUnitId: 'akinci',
  },
  karamanogullari: {
    ...FACTION_ATTRIBUTES.karamanogullari,
    leader: 'Karamanoğlu Mehmed Bey',
    capital: 'Larende (Karaman)',
    crestIcon: '⚔️',
    flagImage: '/assets/flags/karaman.webp',
    color: '#1e3a8a',
    secondaryColor: '#eff6ff',
    description: 'Selçuklu mirasının kudretli varisi. Saldırı ağırlıklı çelik bilekli alpleri ve sarsılmaz taarruz gücüyle Orta Anadolu\'nun kalbi.',
    passiveBonus: 'Saldırı Ağırlıklı: Taarruz Gücü +%20, Nüfus: 16 dk, Özel Birim: Alp',
    specialUnitId: 'karaman_alpi',
  },
  karaman: {
    ...FACTION_ATTRIBUTES.karaman,
    leader: 'Karamanoğlu Mehmed Bey',
    capital: 'Larende (Karaman)',
    crestIcon: '⚔️',
    flagImage: '/assets/flags/karaman.webp',
    color: '#1e3a8a',
    secondaryColor: '#eff6ff',
    description: 'Selçuklu mirasının kudretli varisi. Saldırı ağırlıklı çelik bilekli alpleri ve sarsılmaz taarruz gücüyle Orta Anadolu\'nun kalbi.',
    passiveBonus: 'Saldırı Ağırlıklı: Taarruz Gücü +%20, Nüfus: 16 dk, Özel Birim: Alp',
    specialUnitId: 'karaman_alpi',
  },
  germiyanogullari: {
    ...FACTION_ATTRIBUTES.germiyanogullari,
    leader: 'I. Yakub Bey',
    capital: 'Kütahya',
    crestIcon: '🛡️',
    flagImage: '/assets/flags/germiyan.webp',
    color: '#059669',
    secondaryColor: '#ecfdf5',
    description: 'Kütahya Kalesi ve aşılmaz kalkan duvarlarıyla batı sınırlarını tutan, savunma ağırlıklı sur tahkimatında rakipsiz beylik.',
    passiveBonus: 'Savunma Ağırlıklı: Savunma +%25, Sur Dayanıklılığı +%25, Özel Birim: Tura',
    specialUnitId: 'tura',
  },
  germiyan: {
    ...FACTION_ATTRIBUTES.germiyan,
    leader: 'I. Yakub Bey',
    capital: 'Kütahya',
    crestIcon: '🛡️',
    flagImage: '/assets/flags/germiyan.webp',
    color: '#059669',
    secondaryColor: '#ecfdf5',
    description: 'Kütahya Kalesi ve aşılmaz kalkan duvarlarıyla batı sınırlarını tutan, savunma ağırlıklı sur tahkimatında rakipsiz beylik.',
    passiveBonus: 'Savunma Ağırlıklı: Savunma +%25, Sur Dayanıklılığı +%25, Özel Birim: Tura',
    specialUnitId: 'tura',
  },
  aydinogullari: {
    ...FACTION_ATTRIBUTES.aydinogullari,
    leader: 'Umur Bey',
    capital: 'Birgi',
    crestIcon: '⛵',
    flagImage: '/assets/flags/germiyan.webp',
    color: '#047857',
    secondaryColor: '#ecfdf5',
    description: 'Ege kıyılarında ve nehir vadilerinde denizci leventleriyle fırtına gibi esen, hücum gücü ve ticaret geliri yüksek beylik.',
    passiveBonus: 'Sefer Hızı +%20, Piyade Saldırısı +%15, Özel Birim: Levent',
    specialUnitId: 'levent',
  },
  candarogullari: {
    ...FACTION_ATTRIBUTES.candarogullari,
    leader: 'Şemseddin Demir Yaman Candar',
    capital: 'Kastamonu',
    crestIcon: '⛏️',
    flagImage: '/assets/flags/candar.webp',
    color: '#b45309',
    secondaryColor: '#fffbeb',
    description: 'Küre Dağları\'nın çeliğiyle saldırı ağırlıklı muharebe yürüten, zırh delen ağır baltacıları ve kuşatma gücüyle nam salmış beylik.',
    passiveBonus: 'Saldırı Ağırlıklı: Taarruz Gücü +%20, Kuşatma Gücü +%25, Demir & Taş +%20, Özel Birim: Baltacı',
    specialUnitId: 'kure_baltacisi',
  },
  candar: {
    ...FACTION_ATTRIBUTES.candar,
    leader: 'Şemseddin Demir Yaman Candar',
    capital: 'Kastamonu',
    crestIcon: '⛏️',
    flagImage: '/assets/flags/candar.webp',
    color: '#b45309',
    secondaryColor: '#fffbeb',
    description: 'Küre Dağları\'nın çeliğiyle saldırı ağırlıklı muharebe yürüten, zırh delen ağır baltacıları ve kuşatma gücüyle nam salmış beylik.',
    passiveBonus: 'Saldırı Ağırlıklı: Taarruz Gücü +%20, Kuşatma Gücü +%25, Demir & Taş +%20, Özel Birim: Baltacı',
    specialUnitId: 'kure_baltacisi',
  },
  dulkadirogullari: {
    ...FACTION_ATTRIBUTES.dulkadirogullari,
    leader: 'Zeyneddin Karaca Bey',
    capital: 'Maraş / Elbistan',
    crestIcon: '🏇',
    flagImage: '/assets/flags/dulkadir.webp',
    color: '#6d28d9',
    secondaryColor: '#f5f3ff',
    description: 'Toroslar ve Çukurova yaylalarında savunma ağırlıklı hatlar kuran, atlı müdafaası ve zengin tahıl ambarlarıyla tanınan beylik.',
    passiveBonus: 'Savunma Ağırlıklı: Savunma +%20, Ekin/Tahıl +%20, At İaşe İndirimi %25, Özel Birim: Bozok Süvarisi',
    specialUnitId: 'bozok_suvarisi',
  },
  dulkadir: {
    ...FACTION_ATTRIBUTES.dulkadir,
    leader: 'Zeyneddin Karaca Bey',
    capital: 'Maraş / Elbistan',
    crestIcon: '🏇',
    flagImage: '/assets/flags/dulkadir.webp',
    color: '#6d28d9',
    secondaryColor: '#f5f3ff',
    description: 'Toroslar ve Çukurova yaylalarında savunma ağırlıklı hatlar kuran, atlı müdafaası ve zengin tahıl ambarlarıyla tanınan beylik.',
    passiveBonus: 'Savunma Ağırlıklı: Savunma +%20, Ekin/Tahıl +%20, At İaşe İndirimi %25, Özel Birim: Bozok Süvarisi',
    specialUnitId: 'bozok_suvarisi',
  },
};

// 7 Temel Köy İçi Binası (Köy içi kaynak üretim binası YOKTUR!)
export const BUILDINGS: Record<BuildingType, BuildingDefinition> = {
  town_hall: {
    type: 'town_hall',
    name: 'Merkez Binası',
    description: 'Köyün idari kalbidir. Seviyesi arttıkça haritadaki etki yarıçapı (çember) genişler, daha fazla kaynak düğümünü yutar ve yeni askeri binaların kilidini açar.',
    icon: '🏰',
    image: '/assets/buildings/town_hall.webp',
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 120, stone: 150, iron: 90, grain: 60, gold: 40 },
    costMultiplier: 1.28,
    baseBuildTimeSec: 25,
    buildTimeMultiplier: 1.22,
  },
  barracks: {
    type: 'barracks',
    name: 'Kışla',
    description: 'Standart piyade birlikleri (Mızraklı, Kılıçlı) ve beyliğinize özgü elit piyade sınıfının eğitildiği askeri garnizon tesisi.',
    icon: '⚔️',
    image: '/assets/buildings/barracks.webp',
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 200, stone: 170, iron: 120, grain: 90, gold: 50 },
    costMultiplier: 1.26,
    baseBuildTimeSec: 35,
    buildTimeMultiplier: 1.20,
  },
  stables: {
    type: 'stables',
    name: 'Ahır',
    description: 'Hafif keşif süvarileri ve beyliğin seçkin atlı birliklerinin (Akıncı, Bozok vb.) yetiştirildiği at harası.',
    icon: '🐎',
    image: '/assets/buildings/stables.webp',
    minTownHallLevel: 3,
    maxLevel: 20,
    baseCost: { wood: 260, stone: 200, iron: 220, grain: 180, gold: 80 },
    costMultiplier: 1.27,
    baseBuildTimeSec: 50,
    buildTimeMultiplier: 1.20,
  },
  watchtower: {
    type: 'watchtower',
    name: 'Gözcü Kulesi',
    description: 'Casusların eğitildiği, ufuktaki düşman ordularını ve yaklaşan seferleri erkenden tespit eden istihbarat kulesi.',
    icon: '🔭',
    image: '/assets/buildings/watchtower.webp',
    minTownHallLevel: 2,
    maxLevel: 20,
    baseCost: { wood: 160, stone: 240, iron: 80, grain: 70, gold: 60 },
    costMultiplier: 1.25,
    baseBuildTimeSec: 30,
    buildTimeMultiplier: 1.20,
  },
  wall: {
    type: 'wall',
    name: 'Sur (Savunma Duvarı)',
    description: 'Köyü çevreleyen taş ve kütük tahkimat. Her seviyesinde garnizon ordusunun savunma gücüne doğrudan +%5 oranında çarpan bonusu sağlar.',
    icon: '🧱',
    image: '/assets/buildings/wall_t1.webp',
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 100, stone: 300, iron: 70, grain: 40, gold: 30 },
    costMultiplier: 1.30,
    baseBuildTimeSec: 40,
    buildTimeMultiplier: 1.22,
  },
  market: {
    type: 'market',
    name: 'Pazar',
    description: 'Eksik duyulan kaynakları takas etmek ve komşu ticaret kervanları göndermek için kullanılan ticaret merkezi.',
    icon: '⚖️',
    image: '/assets/buildings/market.webp',
    minTownHallLevel: 2,
    maxLevel: 20,
    baseCost: { wood: 180, stone: 130, iron: 110, grain: 100, gold: 120 },
    costMultiplier: 1.25,
    baseBuildTimeSec: 30,
    buildTimeMultiplier: 1.20,
  },
  hideout: {
    type: 'hideout',
    name: 'Sığınak (Gizli Mahzen)',
    description: 'Düşman yağmalarında ve çapulcu baskınlarında çalınamayacak güvenli kaynak kotasını korur. Seviye 1\'de her kaynaktan 400 adet korur, sonraki her seviyede ek +%50 koruma katlanarak artar.',
    icon: '🚪',
    image: '/assets/buildings/hideout.webp',
    minTownHallLevel: 1,
    maxLevel: 15,
    baseCost: { wood: 110, stone: 130, iron: 60, grain: 50, gold: 40 },
    costMultiplier: 1.24,
    baseBuildTimeSec: 20,
    buildTimeMultiplier: 1.18,
  },
  field: {
    type: 'field',
    name: 'Tahıl Tarlası',
    description: 'Köy halkının ve garnizon ordusunun zahire ve buğday ihtiyacını karşılayan tarım arazisi ve değirmen tesisi.',
    icon: '🌾',
    image: '/assets/buildings/field.webp',
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 100, stone: 80, iron: 40, grain: 20, gold: 30 },
    costMultiplier: 1.22,
    baseBuildTimeSec: 25,
    buildTimeMultiplier: 1.18,
  },
  forge: {
    type: 'forge',
    name: 'Demirci (Silahhane)',
    description: 'Ordunun kılıç, kalkan, zırh ve ok teçhizatını güçlendiren döküm ve zırh ocağı.',
    icon: '⚒️',
    image: '/assets/buildings/forge.webp',
    minTownHallLevel: 2,
    maxLevel: 20,
    baseCost: { wood: 180, stone: 220, iron: 250, grain: 60, gold: 90 },
    costMultiplier: 1.25,
    baseBuildTimeSec: 35,
    buildTimeMultiplier: 1.20,
  },
  warehouse: {
    type: 'warehouse',
    name: 'Depo',
    description: 'Ham maddelerin güvenle saklandığı büyük depo. Maksimum kaynak kapasitesini artırır.',
    icon: '📦',
    image: '/assets/buildings/granary.webp', // Can use granary image for now
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 150, stone: 150, iron: 100, grain: 80, gold: 50 },
    costMultiplier: 1.25,
    baseBuildTimeSec: 30,
    buildTimeMultiplier: 1.20,
  },
  granary: {
    type: 'granary',
    name: 'Zahire Ambarı (Tahıl Ambarı)',
    description: 'Hasat edilen buğday ve zahirenin çürümesini önleyen ve depolama tavanını katlayan büyük ambar tesisi. Seviye arttıkça buğday çürümesi engellenir ve depolama kapasitesi katlanır.',
    icon: '🌾',
    image: '/assets/buildings/granary.webp',
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 120, stone: 140, iron: 80, grain: 100, gold: 40 },
    costMultiplier: 1.25,
    baseBuildTimeSec: 25,
    buildTimeMultiplier: 1.18,
  },
  school: {
    type: 'school',
    name: 'Okul (Medrese)',
    description: 'Hendese ve ilim tahsil edilen medrese. Köyün etki çemberinin büyüme süresini kısaltır. Her seviyesi birliğin oyuncu kapasitesine +3 kontenjan kazandırır.',
    icon: '📚',
    image: '/assets/buildings/town_hall.webp',
    minTownHallLevel: 1,
    maxLevel: 20,
    baseCost: { wood: 140, stone: 120, iron: 80, grain: 90, gold: 70 },
    costMultiplier: 1.25,
    baseBuildTimeSec: 35,
    buildTimeMultiplier: 1.20,
  },
  umaykut: {
    type: 'umaykut',
    name: 'Umaykut Binası (Cihan Mabedi)',
    description: 'Beyliğin kudret ve hükümranlık timsali olan ulu mabet. Yalnızca 10 köyün tamamını kurmuş beylerin payitaht merkez köyünde Seviye 10 Merkez Binası üzerine kademeli inşa edilebilir. 3 farklı beylikten 10. seviyeye ulaştıran ittifak cihan hâkimiyetini ilan eder.',
    icon: '🦅',
    image: '/assets/buildings/town_hall.webp',
    minTownHallLevel: 10,
    maxLevel: 10,
    baseCost: { wood: 250000, stone: 300000, iron: 220000, grain: 180000, gold: 150000 },
    costMultiplier: 1.45,
    baseBuildTimeSec: 1800,
    buildTimeMultiplier: 1.30,
  },
};

// Bina Görselleri Haritası (Gerçek webp çizimleri)
export const BUILDING_IMAGE_MAP: Record<string, string> = {
  town_hall: '/assets/buildings/town_hall.webp',
  barracks: '/assets/buildings/barracks.webp',
  stables: '/assets/buildings/stables.webp',
  watchtower: '/assets/buildings/watchtower.webp',
  market: '/assets/buildings/market.webp',
  warehouse: '/assets/buildings/granary.webp',
  field: '/assets/buildings/field.webp',
  granary: '/assets/buildings/granary.webp',
  forge: '/assets/buildings/forge.webp',
  wall: '/assets/buildings/wall_t1.webp',
  hideout: '/assets/buildings/hideout.webp',
  school: '/assets/buildings/town_hall.webp',
  umaykut: '/assets/buildings/town_hall.webp',
};

export const getBuildingImage = (buildingType: string, level?: number): string => {
  if (buildingType === 'wall') {
    return (level && level > 10) ? '/assets/buildings/wall_t2.webp' : '/assets/buildings/wall_t1.webp';
  }
  return BUILDING_IMAGE_MAP[buildingType] || '/assets/buildings/town_hall.webp';
};

// Kaynak Görselleri Haritası (Drawable klasöründeki gerçek webp çizimleri)
export const RESOURCE_IMAGE_MAP: Record<string, string> = {
  wood: '/drawable/wood.webp',
  stone: '/drawable/stone.webp',
  iron: '/drawable/iron.webp',
  grain: '/drawable/grain.webp',
  gold: '/drawable/gold.webp',
  horse: '/drawable/horse.webp',
  gem: '/drawable/gem.webp',
};

export const getResourceImage = (resourceType: string): string => {
  const key = resourceType.toLowerCase();
  return RESOURCE_IMAGE_MAP[key] || '/drawable/wood.webp';
};

// Birlikler: Ortak Standart Birlikler + 5 Özel Beylik Birimi
export const UNIT_IMAGE_MAP: Record<UnitType, string> = {
  mizrakli: '/drawable/mizrakli.webp',
  kilicli: '/drawable/kilicli.webp',
  hafif_suvari: '/drawable/hafif_suvari.webp',
  casus: '/drawable/casus.webp',
  kocbasi: '/drawable/kocbasi.webp',
  mancinik: '/drawable/kocbasi.webp',
  top: '/drawable/kocbasi.webp',
  akinci: '/drawable/akinci.webp',
  karaman_alpi: '/drawable/alp.webp',
  gulam: '/drawable/gulam.webp',
  tura: '/drawable/mizrakli.webp',
  levent: '/drawable/levent.webp',
  kure_baltacisi: '/drawable/kure_baltacisi.webp',
  bozok_suvarisi: '/drawable/bozok_suvarisi.webp',
};

export const UNITS: Record<UnitType, UnitDefinition> = {
  mizrakli: {
    id: 'mizrakli',
    name: 'Mızraklı Muhafız',
    category: 'piyade',
    buildingRequired: 'barracks',
    minBuildingLevel: 1,
    attackPower: 15,
    attackInfantry: 15,
    attackCavalry: 15,
    defenseInfantry: 60,
    defenseCavalry: 110, // Süvarilere karşı ölümcül savunma (Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 1.8,
    lootCapacity: 25,
    grainUpkeepPerHour: 1,
    cost: { wood: 60, stone: 40, iron: 20, grain: 30, gold: 10 },
    trainingTimeSec: 15,
    description: 'Düşman atlı taarruzlarını karşılayan, süvarilere karşı muazzam savunma değerine sahip temel savunma askeri.',
    image: '/drawable/mizrakli.webp',
  },
  kilicli: {
    id: 'kilicli',
    name: 'Kılıçlı Piyade',
    category: 'piyade',
    buildingRequired: 'barracks',
    minBuildingLevel: 2,
    attackPower: 55,
    attackInfantry: 75,
    attackCavalry: 35,
    defenseInfantry: 60,
    defenseCavalry: 30, // Standart piyade saldırı ve müdafaası (Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 1.6,
    lootCapacity: 45,
    grainUpkeepPerHour: 1,
    cost: { wood: 80, stone: 50, iron: 90, grain: 40, gold: 20 },
    trainingTimeSec: 22,
    description: 'Sağlam zırhı ve yalman kılıcıyla hem taarruzda hem piyade savunmasında dengeli temel hücum gücü.',
    image: '/drawable/kilicli.webp',
  },
  hafif_suvari: {
    id: 'hafif_suvari',
    name: 'Hafif Süvari',
    category: 'suvari',
    buildingRequired: 'stables',
    minBuildingLevel: 1,
    attackPower: 70,
    attackInfantry: 70,
    attackCavalry: 70,
    defenseInfantry: 25,
    defenseCavalry: 35, // Çevik süvari hücumu (Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 3.5,
    lootCapacity: 80,
    grainUpkeepPerHour: 2,
    cost: { wood: 140, stone: 70, iron: 130, grain: 100, gold: 40 },
    trainingTimeSec: 35,
    description: 'Hızlı hareket kabiliyeti ve yüksek yük taşıma kapasitesiyle yağma seferlerinin vazgeçilmez atlısı.',
    image: '/drawable/hafif_suvari.webp',
  },
  casus: {
    id: 'casus',
    name: 'Casus',
    category: 'istihbarat',
    buildingRequired: 'watchtower',
    minBuildingLevel: 1,
    attackPower: 25,
    attackInfantry: 25,
    attackCavalry: 25,
    defenseInfantry: 75,
    defenseCavalry: 75, // İstihbarat ve gizlilik müdafaası (Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 4.5,
    lootCapacity: 0,
    grainUpkeepPerHour: 1,
    cost: { wood: 40, stone: 30, iron: 20, grain: 40, gold: 50 },
    trainingTimeSec: 18,
    description: 'Hedef köyün garnizonunu, hammadde ambarlarını ve bina seviyelerini saptayan gizli istihbarat elemanı.',
    image: '/drawable/casus.webp',
  },
  kocbasi: {
    id: 'kocbasi',
    name: 'Koçbaşı',
    category: 'kusatma',
    buildingRequired: 'barracks',
    minBuildingLevel: 5,
    attackPower: 80,
    attackInfantry: 100,
    attackCavalry: 60,
    defenseInfantry: 20,
    defenseCavalry: 20, // Ağır sur yarma ve taarruz (Saldırı: 160, Savunma: 40, Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 1.0,
    lootCapacity: 0,
    grainUpkeepPerHour: 3,
    cost: { wood: 350, stone: 200, iron: 280, grain: 120, gold: 80 },
    trainingTimeSec: 60,
    description: 'Düşman surlarını yerle bir ederek savunan ordunun duvar koruma çarpanını yıkan yüksek taarruz gücüne sahip ağır kuşatma aleti.',
    image: '/drawable/kocbasi.webp',
  },
  mancinik: {
    id: 'mancinik',
    name: 'Mancınık',
    category: 'kusatma',
    buildingRequired: 'barracks',
    minBuildingLevel: 6,
    attackPower: 80,
    attackInfantry: 100,
    attackCavalry: 60,
    defenseInfantry: 20,
    defenseCavalry: 20, // Muhasara gülle taarruzu (Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 1.2,
    lootCapacity: 0,
    grainUpkeepPerHour: 4,
    cost: { wood: 450, stone: 350, iron: 200, grain: 100, gold: 90 },
    trainingTimeSec: 65,
    description: 'Ağır kaya gülleleriyle düşman surlarını, Umaykut anıtlarını ve binalarını yerle bir eden muhasara makinesi.',
    image: '/drawable/kocbasi.webp',
  },
  top: {
    id: 'top',
    name: 'Şahi Topu',
    category: 'kusatma',
    buildingRequired: 'barracks',
    minBuildingLevel: 8,
    attackPower: 90,
    attackInfantry: 110,
    attackCavalry: 70,
    defenseInfantry: 10,
    defenseCavalry: 10, // Devasa tunç gülle tahribatı (Toplam: 200 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 0.9,
    lootCapacity: 0,
    grainUpkeepPerHour: 6,
    cost: { wood: 300, stone: 200, iron: 650, grain: 150, gold: 200 },
    trainingTimeSec: 90,
    description: 'Tunç döküm devasa muhasara topu. Sur ve kaleleri en yüksek tahribatla yerle bir eder.',
    image: '/drawable/kocbasi.webp',
  },
  // Özel Faction Birimleri (Her biri toplam tam 300 Puan)
  akinci: {
    id: 'akinci',
    name: 'Akıncı',
    category: 'suvari',
    factionRequired: 'osmanogullari',
    buildingRequired: 'stables',
    minBuildingLevel: 2,
    attackPower: 75,
    attackInfantry: 75,
    attackCavalry: 75,
    defenseInfantry: 75,
    defenseCavalry: 75, // Dengeli Beylik (Saldırı: 150, Savunma: 150, Toplam: 300 Puan)
    isSpecialUnit: true,
    speedTilesPerMin: 4.2, // Çok hızlı
    lootCapacity: 110, // Çok yüksek yağma
    grainUpkeepPerHour: 2,
    cost: { wood: 160, stone: 80, iron: 150, grain: 120, gold: 60 },
    trainingTimeSec: 40,
    description: 'Osmanoğulları\'nın efsanevi uç gazisi. Dengeli orta ayar yapısıyla (150 Saldırı / 150 Savunma) hem yıldırım taarruzunda hem meydan müdafaasında kusursuzdur.',
    image: '/drawable/akinci.webp',
  },
  gulam: {
    id: 'gulam',
    name: 'Gulam Muhafızı',
    category: 'piyade',
    buildingRequired: 'barracks',
    minBuildingLevel: 3,
    attackPower: 45,
    attackInfantry: 45,
    attackCavalry: 45,
    defenseInfantry: 80,
    defenseCavalry: 90, // Standart Savunma Ağırlıklı Piyade (Kışla Seviye 3 - 215 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 1.6,
    lootCapacity: 35,
    grainUpkeepPerHour: 1,
    cost: { wood: 100, stone: 80, iron: 140, grain: 60, gold: 40 },
    trainingTimeSec: 30,
    description: 'Ağır çelik zırhlı ve kalkanlı hassa muhafız piyadesi. Yüksek müdafaa gücüyle cepheyi sarsılmaz kılar.',
    image: '/drawable/gulam.webp',
  },
  levent: {
    id: 'levent',
    name: 'Levent Piyadesi',
    category: 'piyade',
    buildingRequired: 'barracks',
    minBuildingLevel: 4,
    attackPower: 65,
    attackInfantry: 70,
    attackCavalry: 65,
    defenseInfantry: 65,
    defenseCavalry: 70, // Standart Dengeli Piyade (Kışla Seviye 4 - 205 Puan)
    isSpecialUnit: false,
    speedTilesPerMin: 2.0,
    lootCapacity: 50,
    grainUpkeepPerHour: 1,
    cost: { wood: 110, stone: 60, iron: 130, grain: 70, gold: 45 },
    trainingTimeSec: 32,
    description: 'Mızrak ve pala kullanan çevik gazi piyade. Dengeli taarruz ve savunma kabiliyetiyle her türlü harekâta uyum sağlar.',
    image: '/drawable/levent.webp',
  },
  karaman_alpi: {
    id: 'karaman_alpi',
    name: 'Alp',
    category: 'piyade',
    factionRequired: 'karamanogullari',
    buildingRequired: 'barracks',
    minBuildingLevel: 2,
    attackPower: 95,
    attackInfantry: 105,
    attackCavalry: 85,
    defenseInfantry: 60,
    defenseCavalry: 50, // Karamanoğulları Özel Birimi (Saldırı: 190, Savunma: 110, Toplam: 300 Puan)
    isSpecialUnit: true,
    speedTilesPerMin: 1.6,
    lootCapacity: 40,
    grainUpkeepPerHour: 2,
    cost: { wood: 100, stone: 90, iron: 180, grain: 80, gold: 70 },
    trainingTimeSec: 36,
    description: 'Karamanoğulları\'nın çelik zırhlı taarruz alpi. Saldırı ağırlıklı donatımı ve yalman kılıcıyla düşman kalkanlarını yarmakta rakipsizdir.',
    image: '/drawable/alp.webp',
  },
  tura: {
    id: 'tura',
    name: 'Tura',
    category: 'piyade',
    factionRequired: 'germiyanogullari',
    buildingRequired: 'barracks',
    minBuildingLevel: 2,
    attackPower: 45,
    attackInfantry: 45,
    attackCavalry: 45,
    defenseInfantry: 95,
    defenseCavalry: 115, // Savunma Ağırlıklı Beylik (Savunma: 210, Saldırı: 90, Toplam: 300 Puan)
    isSpecialUnit: true,
    speedTilesPerMin: 1.6,
    lootCapacity: 35,
    grainUpkeepPerHour: 2,
    cost: { wood: 90, stone: 80, iron: 150, grain: 70, gold: 50 },
    trainingTimeSec: 35,
    description: 'Germiyan hisarlarının aşılmaz kalkan ve mızrak muhafızı. Savunma ağırlıklı yapısıyla kale kapılarını ve surlarını canı pahasına savunur.',
    image: '/drawable/mizrakli.webp',
  },
  kure_baltacisi: {
    id: 'kure_baltacisi',
    name: 'Baltacı',
    category: 'piyade',
    factionRequired: 'candarogullari',
    buildingRequired: 'barracks',
    minBuildingLevel: 3,
    attackPower: 98,
    attackInfantry: 110,
    attackCavalry: 85,
    defenseInfantry: 55,
    defenseCavalry: 50, // Saldırı Ağırlıklı Beylik (Saldırı: 195, Savunma: 105, Toplam: 300 Puan)
    isSpecialUnit: true,
    speedTilesPerMin: 1.5,
    lootCapacity: 40,
    grainUpkeepPerHour: 2,
    cost: { wood: 80, stone: 110, iron: 190, grain: 70, gold: 50 },
    trainingTimeSec: 36,
    description: 'Küre Dağları\'nın çeliğiyle dövülmüş çift ağızlı madenci baltalarına sahip saldırı ağırlıklı zırh delici ağır taarruz birliği.',
    image: '/drawable/kure_baltacisi.webp',
  },
  bozok_suvarisi: {
    id: 'bozok_suvarisi',
    name: 'Bozok Süvarisi',
    category: 'suvari',
    factionRequired: 'dulkadirogullari',
    buildingRequired: 'stables',
    minBuildingLevel: 2,
    attackPower: 55,
    attackInfantry: 55,
    attackCavalry: 55,
    defenseInfantry: 105,
    defenseCavalry: 85, // Savunma Ağırlıklı Beylik (Savunma: 190, Saldırı: 110, Toplam: 300 Puan)
    isSpecialUnit: true,
    speedTilesPerMin: 3.8,
    lootCapacity: 75,
    grainUpkeepPerHour: 2,
    cost: { wood: 180, stone: 70, iron: 120, grain: 130, gold: 60 },
    trainingTimeSec: 38,
    description: 'Dulkadir yaylalarının savunma ağırlıklı atlı muhafızı. Yayla siperlerinde at üstünde menzilli oklama ve müdafaa taktiğiyle düşman saflarını püskürtür.',
    image: '/drawable/bozok_suvarisi.webp',
  },
};

/**
 * Köyün Merkez Binası Seviyesine göre Etki Yarıçapı (Çap) Hesaplama
 * R = 2.0 + (Level * 1.25)
 * Level 1: 3.25 tile
 * Level 2: 4.50 tile
 * Level 3: 5.75 tile
 * Level 5: 8.25 tile
 * Level 10: 14.50 tile
 */
export function getInfluenceRadius(townHallLevel: number): number {
  return Number((3.5 + (townHallLevel * 0.9)).toFixed(2));
}

/**
 * İki nokta arasındaki Öklid mesafesi
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Bir binanın istenen seviyeye yükseltme maliyetini hesaplama
 */
export function getBuildingUpgradeCost(type: BuildingType, currentLevel: number): Resources {
  const def = BUILDINGS[type];
  const mult = Math.pow(def.costMultiplier, currentLevel);
  return {
    wood: Math.round(def.baseCost.wood * mult),
    stone: Math.round(def.baseCost.stone * mult),
    iron: Math.round(def.baseCost.iron * mult),
    grain: Math.round(def.baseCost.grain * mult),
    gold: Math.round(def.baseCost.gold * mult),
  };
}

/**
 * Bir binanın yükseltme süresini (saniye) hesaplama
 */
export function getBuildingUpgradeDuration(type: BuildingType, currentLevel: number, townHallLevel: number): number {
  const def = BUILDINGS[type];
  const timeMult = Math.pow(def.buildTimeMultiplier, currentLevel);
  // Merkez binası her seviyede inşaat süresini %3 azaltır (min %20)
  const townHallDiscount = Math.max(0.2, 1 - (townHallLevel - 1) * 0.03);
  return Math.max(5, Math.round(def.baseBuildTimeSec * timeMult * townHallDiscount));
}

/**
 * Sur seviyesine göre savunma bonusu yüzdesi
 */
export function getWallDefenseBonus(wallLevel: number): number {
  return wallLevel * 5; // Her seviye %5 bonus
}

/**
 * Sığınak koruma kapasitesi (her kaynak türü için güvenli kasa kotası)
 * Umaykut Mekaniği: Seviye 1'de her kaynaktan 400 adet, her seviyede ek +%50 koruma.
 */
export function getHideoutCapacity(hideoutLevel: number, faction?: FactionId): number {
  if (hideoutLevel <= 0) return 0;
  
  // Seviye 1: 400, Seviye 2: 600, Seviye 3: 900, Seviye 4: 1350... (Her seviyede +%50 ek koruma)
  let baseProtection = Math.round(400 * Math.pow(1.5, hideoutLevel - 1));

  // Beylik Özellikleri & Dağ/Kıyı Mahzen Bonusları
  if (faction === 'candarogullari') {
    baseProtection += 500; // Candaroğulları Küre madeni sığınak bonusu
  } else if (faction === 'aydinogullari') {
    baseProtection += 300; // Aydınoğulları gizli sahil mahzeni bonusu
  }

  return baseProtection;
}

/**
 * Köyün etki yarıçapı içindeki hammadde kaynak düğümlerini bulma
 */
export function getCapturedNodesForVillage(village: Village, nodes: ResourceNode[]): {
  captured: ResourceNode[];
  radius: number;
} {
  const radius = getInfluenceRadius(village.buildings.town_hall || 1);
  const captured = nodes.filter(n => {
    const dist = calculateDistance(village.x, village.y, n.x, n.y);
    return dist <= radius;
  });
  return { captured, radius };
}

// 13. Yüzyıl Gerçek Türkiye Coğrafyası Kaynak Düğümleri (1000x500 Grid)
// images (2).jpg ekran görüntüsündeki gibi zengin buğday, odun, taş ve demir madenleri
export const INITIAL_RESOURCE_NODES: ResourceNode[] = [
  // Merkez Köy (240, 172) Çevresi Doğrudan Temas Düğümleri (Mesafe: 1-2 Tile)
  { id: 'node_core_w', type: 'wood', name: 'Söğüt Meşe Koruluğu', x: 239, y: 172, baseYieldPerHour: 380, tier: 2, level: 6 },
  { id: 'node_core_s', type: 'stone', name: 'Bilecik Kalker Ocağı', x: 241, y: 172, baseYieldPerHour: 360, tier: 2, level: 6 },
  { id: 'node_core_i', type: 'iron', name: 'Pazaryeri Demir Damarı', x: 240, y: 171, baseYieldPerHour: 350, tier: 2, level: 6 },
  { id: 'node_core_g', type: 'grain', name: 'İnegöl Bereketli Ovası', x: 240, y: 173, baseYieldPerHour: 520, tier: 3, level: 8 },
  { id: 'node_core_au', type: 'gold', name: 'Sakarya Altın Havzası', x: 241, y: 173, baseYieldPerHour: 280, tier: 3, level: 7 },
  { id: 'node_core_w2', type: 'wood', name: 'Domaniç Karaçam Ormanı', x: 239, y: 171, baseYieldPerHour: 370, tier: 2, level: 6 },
  { id: 'node_core_g2', type: 'grain', name: 'Yenişehir Başak Çiftliği', x: 239, y: 173, baseYieldPerHour: 510, tier: 3, level: 8 },
  { id: 'node_core_i2', type: 'iron', name: 'Kozbükü Demir Ocağı', x: 241, y: 171, baseYieldPerHour: 360, tier: 2, level: 6 },

  // Oyuncu köyü çevresi (X: 232..253, Y: 164..182) - Yoğun ve bol maden düğümleri
  { id: 'node_w_1', type: 'wood', name: 'Domaniç Meşe Koruluğu', x: 238, y: 170, baseYieldPerHour: 340, tier: 2, level: 6 },
  { id: 'node_g_1', type: 'grain', name: 'İnegöl Bereketli Ovası', x: 242, y: 174, baseYieldPerHour: 480, tier: 3, level: 8 },
  { id: 'node_s_1', type: 'stone', name: 'Bilecik Kalker Kayalığı', x: 236, y: 173, baseYieldPerHour: 320, tier: 1, level: 7 },
  { id: 'node_i_1', type: 'iron', name: 'Pazaryeri Demir Damarı', x: 243, y: 169, baseYieldPerHour: 340, tier: 2, level: 4 },
  { id: 'node_au_1', type: 'gold', name: 'Sakarya Alüvyal Yatağı', x: 244, y: 176, baseYieldPerHour: 260, tier: 2, level: 5 },
  { id: 'node_w_2', type: 'wood', name: 'Söğüt Karaçam Ormanı', x: 235, y: 172, baseYieldPerHour: 210, tier: 2, level: 6 },
  { id: 'node_g_2', type: 'grain', name: 'Yenişehir Başak Çiftliği', x: 240, y: 168, baseYieldPerHour: 390, tier: 3, level: 9 },
  { id: 'node_i_2', type: 'iron', name: 'Kozbükü Demir Döküm Ocağı', x: 246, y: 171, baseYieldPerHour: 230, tier: 2, level: 7 },
  { id: 'node_s_2', type: 'stone', name: 'Gölpazarı Mermer Ocağı', x: 234, y: 175, baseYieldPerHour: 180, tier: 1, level: 3 },
  { id: 'node_au_2', type: 'gold', name: 'Karasu Altın Yıkama Havzası', x: 243, y: 178, baseYieldPerHour: 170, tier: 2, level: 7 },
  { id: 'node_g_3', type: 'grain', name: 'Alüvyon Değirmen Çiftliği', x: 239, y: 171, baseYieldPerHour: 420, tier: 3, level: 8 },
  { id: 'node_g_4', type: 'grain', name: 'Bereketli Başak Tarlası', x: 241, y: 175, baseYieldPerHour: 450, tier: 3, level: 9 },
  { id: 'node_w_3', type: 'wood', name: 'Karakaya Koru Ormanı', x: 237, y: 174, baseYieldPerHour: 260, tier: 2, level: 4 },
  { id: 'node_s_3', type: 'stone', name: 'Akçakaya Taş Ocağı', x: 240, y: 175, baseYieldPerHour: 200, tier: 1, level: 4 },
  { id: 'node_i_3', type: 'iron', name: 'Demirci Döküm Ocağı', x: 242, y: 170, baseYieldPerHour: 240, tier: 2, level: 4 },
  { id: 'node_g_5', type: 'grain', name: 'Poyraz Yel Değirmeni', x: 245, y: 169, baseYieldPerHour: 360, tier: 2, level: 6 },
  { id: 'node_s_4', type: 'stone', name: 'Bozkır Kaya Ocağı', x: 247, y: 173, baseYieldPerHour: 210, tier: 1, level: 7 },
  { id: 'node_g_6', type: 'grain', name: 'Yıldız Ovası Tahıl Ambarı', x: 248, y: 171, baseYieldPerHour: 410, tier: 2, level: 8 },
  { id: 'node_w_4', type: 'wood', name: 'Harmankaya Sedir Korusu', x: 241, y: 167, baseYieldPerHour: 250, tier: 2, level: 7 },
  { id: 'node_s_5', type: 'stone', name: 'Küplü Traverten Sırtı', x: 239, y: 166, baseYieldPerHour: 220, tier: 2, level: 4 },
  { id: 'node_i_4', type: 'iron', name: 'Pelitözü Derin Cevher Ocağı', x: 245, y: 166, baseYieldPerHour: 280, tier: 2, level: 7 },
  { id: 'node_g_7', type: 'grain', name: 'Gündüz Alp Başak Ovası', x: 236, y: 177, baseYieldPerHour: 460, tier: 3, level: 9 },
  { id: 'node_w_5', type: 'wood', name: 'Çukurca Gürgenliği', x: 245, y: 175, baseYieldPerHour: 270, tier: 2, level: 6 },
  { id: 'node_s_6', type: 'stone', name: 'Yarhisar Kaya Kesim Havzası', x: 248, y: 176, baseYieldPerHour: 240, tier: 2, level: 7 },
  { id: 'node_i_5', type: 'iron', name: 'Kurtköy Demir Eritme Ocağı', x: 237, y: 177, baseYieldPerHour: 260, tier: 2, level: 4 },
  { id: 'node_g_8', type: 'grain', name: 'Osmanoğulları Buğday Çiftliği', x: 247, y: 178, baseYieldPerHour: 430, tier: 3, level: 9 },
  { id: 'node_w_6', type: 'wood', name: 'Akçakoca Koru Şeridi', x: 249, y: 174, baseYieldPerHour: 280, tier: 2, level: 6 },
  { id: 'node_s_7', type: 'stone', name: 'Bozüyük Granit Taşlığı', x: 250, y: 171, baseYieldPerHour: 250, tier: 2, level: 7 },
  { id: 'node_i_6', type: 'iron', name: 'Dodurga Demirci Madeni', x: 251, y: 168, baseYieldPerHour: 290, tier: 2, level: 4 },
  { id: 'node_g_9', type: 'grain', name: 'Mekece Sarı Başak Harmanı', x: 233, y: 178, baseYieldPerHour: 440, tier: 3, level: 9 },
  { id: 'node_s_8', type: 'stone', name: 'Bayırköy Andezit Ocağı', x: 235, y: 174, baseYieldPerHour: 190, tier: 1, level: 3 },
  { id: 'node_w_7', type: 'wood', name: 'Kınık Meşeliği', x: 240, y: 179, baseYieldPerHour: 270, tier: 2, level: 6 },
  { id: 'node_i_7', type: 'iron', name: 'Osmaneli Kızıl Maden Damarı', x: 242, y: 179, baseYieldPerHour: 270, tier: 2, level: 4 },
  { id: 'node_g_10', type: 'grain', name: 'Geyve Alüvyon Vadisi', x: 234, y: 168, baseYieldPerHour: 400, tier: 3, level: 8 },
  { id: 'node_w_8', type: 'wood', name: 'Taraklı Çam Ormanı', x: 237, y: 166, baseYieldPerHour: 240, tier: 2, level: 6 },
  { id: 'node_au_3', type: 'gold', name: 'Köprühisar Altın Kumluğu', x: 246, y: 177, baseYieldPerHour: 190, tier: 3, level: 7 },

  // Anadolu Genelindeki Büyük Tarihi Maden ve Havzalar
  { id: 'node_11', type: 'wood', name: 'Uludağ Etekleri Orman Hattı', x: 187, y: 169, baseYieldPerHour: 250, tier: 2, level: 6 },
  { id: 'node_12', type: 'grain', name: 'Bursa Ovası Tahıl Ambarı', x: 183, y: 161, baseYieldPerHour: 260, tier: 2, level: 8 },
  { id: 'node_13', type: 'stone', name: 'İznik Sur Taşı Ocakları', x: 217, y: 142, baseYieldPerHour: 190, tier: 1, level: 7 },
  { id: 'node_14', type: 'iron', name: 'Küre Dağları Bakır Ocakları', x: 423, y: 38, baseYieldPerHour: 340, tier: 3, level: 8 },
  { id: 'node_15', type: 'wood', name: 'Kastamonu Ilgaz Ormanları', x: 425, y: 92, baseYieldPerHour: 310, tier: 3, level: 7 },
  { id: 'node_16', type: 'grain', name: 'Konya Ovası Bereket Kuşağı', x: 360, y: 336, baseYieldPerHour: 350, tier: 3, level: 9 },
  { id: 'node_17', type: 'gold', name: 'Larende Bey Hazinesi', x: 398, y: 388, baseYieldPerHour: 180, tier: 3, level: 8 },
  { id: 'node_18', type: 'iron', name: 'Toros Bolkar Madenleri', x: 469, y: 383, baseYieldPerHour: 300, tier: 3, level: 9 },
  { id: 'node_19', type: 'wood', name: 'Gülek Boğazı Sedir Ormanı', x: 490, y: 380, baseYieldPerHour: 260, tier: 2, level: 6 },
  { id: 'node_20', type: 'grain', name: 'Büyük Menderes Deltası', x: 105, y: 335, baseYieldPerHour: 320, tier: 3, level: 9 },
  { id: 'node_21', type: 'gold', name: 'Paktolos (Sart) Altın Yatağı', x: 130, y: 300, baseYieldPerHour: 210, tier: 3, level: 7 },
  { id: 'node_22', type: 'stone', name: 'Efes Beyaz Mermer Düğümü', x: 96, y: 330, baseYieldPerHour: 230, tier: 2, level: 7 },
  { id: 'node_23', type: 'wood', name: 'Amanos Orman Havzası', x: 550, y: 440, baseYieldPerHour: 280, tier: 2, level: 6 },
  { id: 'node_24', type: 'grain', name: 'Çukurova Bereket Düğümü', x: 506, y: 395, baseYieldPerHour: 330, tier: 3, level: 9 },
  { id: 'node_25', type: 'stone', name: 'Kapadokya Tüf Taşlığı', x: 450, y: 260, baseYieldPerHour: 200, tier: 2, level: 7 },
  { id: 'node_26', type: 'iron', name: 'Erciyes Etekleri Demir Damarı', x: 513, y: 286, baseYieldPerHour: 240, tier: 2, level: 7 },
];

// Haritadaki Diğer Köyler & Düşman Yerleşimleri (images (2).jpg ile birebir uyumlu)
export const INITIAL_RIVAL_VILLAGES: Village[] = [
  {
    id: 'rival_osmanli_1',
    name: 'osmanli1',
    ownerName: 'crazycous',
    faction: 'osmanogullari',
    isPlayer: false,
    x: 234,
    y: 179,
    buildings: {
      town_hall: 2,
      barracks: 2,
      stables: 1,
      watchtower: 1,
      wall: 2,
      market: 1,
      hideout: 1,
    },
    resources: { wood: 4200, stone: 3800, iron: 2900, grain: 4500, gold: 1200 },
    maxCapacity: 10000,
    workingPopulation: 14,
    idlePopulation: 6,
    lastPopulationSpawnTimestamp: Date.now() - 300000,
    units: {
      mizrakli: 35,
      kilicli: 25,
      hafif_suvari: 12,
      casus: 2,
      kocbasi: 1,
      akinci: 5,
      gulam: 0,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
  {
    id: 'rival_osmanli_2',
    name: 'osmanli2',
    ownerName: 'crazycous',
    faction: 'osmanogullari',
    isPlayer: false,
    x: 248,
    y: 179,
    buildings: {
      town_hall: 3,
      barracks: 3,
      stables: 2,
      watchtower: 1,
      wall: 3,
      market: 2,
      hideout: 2,
    },
    resources: { wood: 5100, stone: 4600, iron: 3800, grain: 5200, gold: 1500 },
    maxCapacity: 12000,
    workingPopulation: 18,
    idlePopulation: 8,
    lastPopulationSpawnTimestamp: Date.now() - 450000,
    units: {
      mizrakli: 45,
      kilicli: 35,
      hafif_suvari: 18,
      casus: 3,
      kocbasi: 2,
      akinci: 8,
      gulam: 0,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
  {
    id: 'rival_dayii_ally',
    name: 'dayii',
    ownerName: 'dayii',
    faction: 'osmanogullari',
    isPlayer: false,
    x: 246,
    y: 166,
    buildings: {
      town_hall: 4,
      barracks: 3,
      stables: 2,
      watchtower: 2,
      wall: 4,
      market: 3,
      hideout: 2,
    },
    resources: { wood: 8900, stone: 7400, iron: 6100, grain: 9200, gold: 3400 },
    maxCapacity: 20000,
    workingPopulation: 25,
    idlePopulation: 12,
    lastPopulationSpawnTimestamp: Date.now() - 200000,
    units: {
      mizrakli: 60,
      kilicli: 50,
      hafif_suvari: 25,
      casus: 4,
      kocbasi: 3,
      akinci: 12,
      gulam: 0,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
  {
    id: 'rival_tekfur',
    name: 'Yarhisar Tekfurluğu',
    ownerName: 'Tekfur Manuel',
    faction: 'osmanogullari',
    isPlayer: false,
    x: 245,
    y: 168,
    buildings: {
      town_hall: 2,
      barracks: 2,
      stables: 1,
      watchtower: 1,
      wall: 3,
      market: 1,
      hideout: 2,
    },
    resources: { wood: 850, stone: 920, iron: 780, grain: 650, gold: 420 },
    maxCapacity: 3000,
    workingPopulation: 8,
    idlePopulation: 4,
    lastPopulationSpawnTimestamp: Date.now() - 500000,
    units: {
      mizrakli: 35,
      kilicli: 25,
      hafif_suvari: 8,
      casus: 2,
      kocbasi: 0,
      akinci: 0,
      gulam: 0,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
  {
    id: 'rival_bandit',
    name: 'Haydut & Moğol Kampı',
    ownerName: 'Çete Reisi Kara Noyan',
    faction: 'karamanogullari',
    isPlayer: false,
    x: 236,
    y: 175,
    buildings: {
      town_hall: 1,
      barracks: 1,
      stables: 0,
      watchtower: 0,
      wall: 1,
      market: 0,
      hideout: 1,
    },
    resources: { wood: 420, stone: 380, iron: 550, grain: 480, gold: 310 },
    maxCapacity: 2000,
    workingPopulation: 5,
    idlePopulation: 2,
    lastPopulationSpawnTimestamp: Date.now() - 600000,
    units: {
      mizrakli: 15,
      kilicli: 12,
      hafif_suvari: 4,
      casus: 0,
      kocbasi: 0,
      akinci: 0,
      gulam: 0,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
  {
    id: 'rival_karaman',
    name: 'Larende Kalesi Garnizonu',
    ownerName: 'Emir Bedreddin',
    faction: 'karamanogullari',
    isPlayer: false,
    x: 376,
    y: 363,
    buildings: {
      town_hall: 4,
      barracks: 4,
      stables: 2,
      watchtower: 2,
      wall: 6,
      market: 2,
      hideout: 3,
    },
    resources: { wood: 2400, stone: 3100, iron: 1900, grain: 2100, gold: 950 },
    maxCapacity: 6000,
    workingPopulation: 30,
    idlePopulation: 15,
    lastPopulationSpawnTimestamp: Date.now() - 400000,
    units: {
      mizrakli: 60,
      kilicli: 45,
      hafif_suvari: 20,
      casus: 5,
      kocbasi: 2,
      akinci: 0,
      gulam: 25,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
  {
    id: 'rival_aydin',
    name: 'Ayasuluk Sahil Hisarı',
    ownerName: 'Gazi İbrahim',
    faction: 'aydinogullari',
    isPlayer: false,
    x: 96,
    y: 330,
    buildings: {
      town_hall: 3,
      barracks: 3,
      stables: 2,
      watchtower: 2,
      wall: 4,
      market: 3,
      hideout: 2,
    },
    resources: { wood: 1800, stone: 1500, iron: 1400, grain: 1900, gold: 1200 },
    maxCapacity: 5000,
    workingPopulation: 22,
    idlePopulation: 9,
    lastPopulationSpawnTimestamp: Date.now() - 350000,
    units: {
      mizrakli: 40,
      kilicli: 35,
      hafif_suvari: 15,
      casus: 3,
      kocbasi: 1,
      akinci: 0,
      gulam: 0,
      levent: 20,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
];

// Başlangıç Oyuncu Köyü (Yalnızca 1 Adet Başkent ile Başlanır)
export const INITIAL_PLAYER_VILLAGES: Village[] = [
  {
    id: 'v_merkez',
    name: 'MERKEZ',
    ownerName: 'Barutozap',
    faction: 'osmanogullari',
    isPlayer: true,
    isCapital: true,
    x: 240,
    y: 172,
    buildings: {
      town_hall: 5,
      barracks: 4,
      stables: 3,
      watchtower: 3,
      wall: 5,
      market: 4,
      hideout: 3,
      school: 2,
    },
    resources: {
      wood: 28670066,
      stone: 43455819,
      iron: 277130,
      grain: 6496753,
      gold: 5001,
    },
    maxCapacity: 50000000,
    workingPopulation: 45,
    idlePopulation: 28,
    lastPopulationSpawnTimestamp: Date.now() - 300000,
    units: {
      mizrakli: 1200,
      kilicli: 850,
      hafif_suvari: 4451,
      casus: 120,
      kocbasi: 25,
      akinci: 380,
      gulam: 0,
      levent: 0,
      kure_baltacisi: 0,
      bozok_suvarisi: 0,
    },
  },
];

export const INITIAL_PLAYER_VILLAGE: Village = INITIAL_PLAYER_VILLAGES[0];

// Köy Kurma & İskan Kuralları
export const MAX_PLAYER_VILLAGES = 10;
export const TOWN_HALL_LEVEL_FOR_NEW_VILLAGE = 10;

/**
 * Oyuncunun sahip olabileceği maksimum köy sayısı:
 * 1 (Başkent) + (Town Hall seviyesi >= 10 olan köy sayısı), tavan: 10
 */
export const getMaxAllowedVillages = (villages: Village[]): number => {
  const qualifiedCount = villages.filter(v => (v.buildings.town_hall || 0) >= TOWN_HALL_LEVEL_FOR_NEW_VILLAGE).length;
  return Math.min(MAX_PLAYER_VILLAGES, 1 + qualifiedCount);
};

export const canFoundNewVillage = (villages: Village[]): { allowed: boolean; reason?: string } => {
  if (villages.length >= MAX_PLAYER_VILLAGES) {
    return { allowed: false, reason: `Maksimum köy sınırına (${MAX_PLAYER_VILLAGES} Köy) ulaşıldı.` };
  }
  const maxAllowed = getMaxAllowedVillages(villages);
  if (villages.length >= maxAllowed) {
    return { 
      allowed: false, 
      reason: `Yeni bir köy kurabilmek için mevcut köylerinizden en az birinde Merkez Otağ seviyesini ${TOWN_HALL_LEVEL_FOR_NEW_VILLAGE} yapmalısınız.` 
    };
  }
  return { allowed: true };
};

