import { 
  BUILDINGS,
  FACTIONS, 
  UNITS, 
  getHideoutCapacity, 
  getWallDefenseBonus 
} from '../data/gameData';
import { 
  BattleCasualties, 
  BattleReport, 
  BuildingType,
  DamagedBuildingInfo,
  FactionId, 
  MarchMission, 
  Resources, 
  UnitType,
  UnitUpgradeLevel
} from '../types/game';
import { 
  ForgeUpgrades, 
  getForgeAttackMultiplier, 
  getForgeDefenseMultiplier, 
  getForgeRamMultiplier 
} from '../types/military';

export interface BattleInput {
  mission: MarchMission;
  attackerFaction: FactionId;
  attackerVillageName: string;
  attackerCoords: { x: number; y: number };
  attackerUnits: Partial<Record<UnitType, number>>;
  attackerPoints?: number;
  attackerKhanAura?: number;
  attackerUpgrades?: Partial<Record<UnitType, UnitUpgradeLevel>>;
  attackerForgeUpgrades?: ForgeUpgrades;

  defenderFaction: FactionId;
  defenderVillageName: string;
  defenderCoords: { x: number; y: number };
  defenderUnits: Partial<Record<UnitType, number>>;
  defenderBuildings?: Record<string, number>;
  defenderWallLevel: number;
  defenderHideoutLevel: number;
  defenderResources: Resources;
  defenderPoints?: number;
  defenderKhanAura?: number;
  defenderIdlePopulation?: number;
  defenderHorses?: number;
  defenderUpgrades?: Partial<Record<UnitType, UnitUpgradeLevel>>;
  defenderForgeUpgrades?: ForgeUpgrades;
  defenderLastPlundered?: number;
  nowTimestamp?: number;
}

/**
 * Resmi Umaykut Online Harp Nizamı & Kuşatma Motoru
 * - Normal Saldırı ('attack'): Ordulardan biri tamamen yok olana kadar savaş. Mancınık/Top bina yıkımı (Sur -> Umaykut -> Rastgele, Maks 2 bina). Karamanoğulları binaları +%25 dayanıklı.
 * - Yağma Seferi ('raid'): Kısmi zayiat, +%5 savunan savunma bonusu, 10 askere 1 esir köylü (Osmanoğulları 8'e 1), 50 askere 1 at (Dulkadiroğulları 40'a 1), 1 saat yağma koruması.
 * - Casus Seferi ('spy'): Karşılıklı casus sayısına göre bilgi sızdırma veya imha.
 * - Demirci Talimi: Birlik türü başına her seviye +%1 saldırı/savunma (Maksimum %20).
 */
export function simulateBattle(input: BattleInput): BattleReport {
  const {
    mission,
    attackerFaction,
    attackerVillageName,
    attackerCoords,
    attackerUnits,
    attackerPoints = 500,
    attackerKhanAura = 0,
    attackerUpgrades,
    defenderFaction,
    defenderVillageName,
    defenderCoords,
    defenderUnits,
    defenderBuildings = {},
    defenderWallLevel,
    defenderHideoutLevel,
    defenderResources,
    defenderPoints = 500,
    defenderKhanAura = 0,
    defenderIdlePopulation = 0,
    defenderHorses = 0,
    defenderUpgrades,
    defenderForgeUpgrades,
    attackerForgeUpgrades,
    defenderLastPlundered = 0,
    nowTimestamp = Date.now(),
  } = input;

  const reportId = 'report_' + nowTimestamp + '_' + Math.random().toString(36).substring(2, 7);

  // ==========================================
  // 1. ÖZEL İSTİHBARAT (CASUSLUK) SEFERİ KONTROLÜ
  // ==========================================
  if (mission === 'spy') {
    const attackerSpies = Number(attackerUnits.casus) || 0;
    const defenderSpies = Number(defenderUnits.casus) || 0;

    let spyLossAttacker = 0;
    let spyLossDefender = 0;
    let spyVictory = false;
    let detected = false;

    if (attackerSpies <= 0) {
      spyVictory = false;
    } else if (defenderSpies === 0) {
      // Düşman köyde karşı casus yok -> %100 başarı, 0 kayıp, fark edilmeden bilgi toplandı
      spyVictory = true;
      spyLossAttacker = 0;
      spyLossDefender = 0;
      detected = false;
    } else {
      // Düşman köyde karşı casus nöbetçileri var -> İstihbarat çatışması
      detected = true;
      if (attackerSpies > defenderSpies) {
        // Casuslarımız düşman nöbetçilerini aşar ve bilgi toplar
        spyVictory = true;
        spyLossAttacker = Math.min(attackerSpies - 1, Math.max(1, Math.round(defenderSpies * 0.45)));
        spyLossDefender = Math.min(defenderSpies, Math.max(1, Math.round(attackerSpies * 0.40)));
      } else {
        // Savunan casuslar üstün gelir ve tüm saldıran casusları yok eder
        spyVictory = false;
        spyLossAttacker = attackerSpies;
        spyLossDefender = Math.min(defenderSpies, Math.max(0, Math.round(attackerSpies * 0.25)));
      }
    }

    const attackerRem = Math.max(0, attackerSpies - spyLossAttacker);
    const defenderRem = Math.max(0, defenderSpies - spyLossDefender);

    let spySummary = '';
    if (spyVictory) {
      if (detected) {
        spySummary = `Casuslarımız düşman gözetleme devriyeleriyle çatışmaya girdi (${spyLossAttacker} Casus şehit oldu, ${spyLossDefender} düşman casusu etkisiz kılındı). Kalan casuslar ambarlardaki hammadde miktarını ve garnizon mevcudunu başarıyla tespit etti.`;
      } else {
        spySummary = `Casuslarımız ${defenderVillageName} yerleşimine sessizce sızdı. Ambarlardaki hammadde miktarı, sur seviyesi ve garnizondaki tüm nöbetçi birlikler eksiksiz raporlandı.`;
      }
    } else {
      spySummary = `Casuslarımız düşman karşı-istihbarat nöbetçileri (${defenderSpies} Düşman Casusu) tarafından fark edildi ve tamamı imha edildi! İstihbarat elde edilemedi.`;
    }

    return {
      id: reportId,
      timestamp: nowTimestamp,
      mission: 'spy',
      attackerVillageName,
      attackerFaction,
      attackerCoords,
      defenderVillageName,
      defenderFaction,
      defenderCoords,
      attackerResult: spyVictory ? 'victory' : 'defeat',
      attackerCasualties: {
        unitsBefore: { casus: attackerSpies },
        unitsLost: { casus: spyLossAttacker },
        unitsRemaining: { casus: attackerRem },
      },
      attackerLossRatio: attackerSpies > 0 ? (spyLossAttacker / attackerSpies) : 0,
      defenderCasualties: {
        unitsBefore: spyVictory ? { ...defenderUnits } : { casus: defenderSpies },
        unitsLost: { casus: spyLossDefender },
        unitsRemaining: spyVictory 
          ? { ...defenderUnits, casus: defenderRem } 
          : { casus: defenderRem },
      },
      defenderLossRatio: defenderSpies > 0 ? (spyLossDefender / defenderSpies) : 0,
      initialWallLevel: defenderWallLevel,
      finalWallLevel: defenderWallLevel,
      lootCarried: { wood: 0, stone: 0, iron: 0, grain: 0, gold: 0 },
      maxLootCapacity: 0,
      scoutedResources: spyVictory ? { ...defenderResources } : undefined,
      scoutedBuildings: spyVictory ? { ...defenderBuildings, wall: defenderWallLevel } : undefined,
      defendingSpies: defenderSpies,
      detected,
      summary: spySummary,
    };
  }

  // ==========================================
  // 2. YAĞMA KORUMASI KONTROLÜ (1 Saat / 3600s)
  // ==========================================
  const ONE_HOUR_MS = 3600 * 1000;
  if (mission === 'raid' && defenderLastPlundered > 0 && (nowTimestamp - defenderLastPlundered) < ONE_HOUR_MS) {
    const minutesLeft = Math.ceil((ONE_HOUR_MS - (nowTimestamp - defenderLastPlundered)) / 60000);
    return {
      id: reportId,
      timestamp: nowTimestamp,
      mission: 'raid',
      attackerVillageName,
      attackerFaction,
      attackerCoords,
      defenderVillageName,
      defenderFaction,
      defenderCoords,
      attackerResult: 'draw',
      attackerCasualties: {
        unitsBefore: { ...attackerUnits },
        unitsLost: {},
        unitsRemaining: { ...attackerUnits },
      },
      attackerLossRatio: 0,
      defenderCasualties: {
        unitsBefore: { ...defenderUnits },
        unitsLost: {},
        unitsRemaining: { ...defenderUnits },
      },
      defenderLossRatio: 0,
      initialWallLevel: defenderWallLevel,
      finalWallLevel: defenderWallLevel,
      lootCarried: { wood: 0, stone: 0, iron: 0, grain: 0, gold: 0 },
      maxLootCapacity: 0,
      isPlunderProtected: true,
      summary: `Bu köy son 1 saat içinde zaten yağmalanmış! Yağma koruması devrede (${minutesLeft} dk kaldı). Akıncılarımız çarpışmaya girmeden geri dönüyor.`,
    };
  }

  // ==========================================
  // 3. KADEME: 4 Ana Unsur Taarruz Gücü & Demirci Talimi Bonusu
  // (Piyade Saldırı, Süvari Saldırı, Piyade Savunma, Süvari Savunma)
  // ==========================================
  let attackerInfAtkTotal = 0; // Hedef piyadelere yapılan saldırı gücü
  let attackerCavAtkTotal = 0; // Hedef süvarilere yapılan saldırı gücü
  let attackerInfCount = 0;
  let attackerCavCount = 0;

  const attFStr = (attackerFaction || '').toLowerCase();
  const isKaraman = attFStr.includes('karaman');

  for (const [unitKey, countVal] of Object.entries(attackerUnits)) {
    const count = Number(countVal) || 0;
    if (count <= 0) continue;
    const uType = unitKey as UnitType;
    const def = UNITS[uType];
    if (!def) continue;

    if (def.category === 'suvari') {
      attackerCavCount += count;
    } else {
      attackerInfCount += count;
    }

    let unitAtkInf = (def.attackInfantry ?? def.attackPower) * count;
    let unitAtkCav = (def.attackCavalry ?? def.attackPower) * count;

    // Demirci Talimi (+%1 saldırı gücü / seviye, maks %20)
    const forgeAtkLevel = Math.min(20, Math.max(0, attackerUpgrades?.[uType]?.attackLevel || 0));
    if (forgeAtkLevel > 0) {
      unitAtkInf *= (1.0 + forgeAtkLevel / 100);
      unitAtkCav *= (1.0 + forgeAtkLevel / 100);
    }

    // Beylik Hücum Bonusları (Karaman +%20 Doğrudan Taarruz)
    if (isKaraman) {
      unitAtkInf *= 1.20;
      unitAtkCav *= 1.20;
    }

    const attFactionDef = FACTIONS[attackerFaction];
    if (attFactionDef && !isKaraman) {
      if (def.category === 'suvari' && attFactionDef.cavalryAttackBonus > 0) {
        unitAtkInf *= (1.0 + attFactionDef.cavalryAttackBonus);
        unitAtkCav *= (1.0 + attFactionDef.cavalryAttackBonus);
      } else if (def.category === 'piyade' && attFactionDef.infantryAttackBonus > 0) {
        unitAtkInf *= (1.0 + attFactionDef.infantryAttackBonus);
        unitAtkCav *= (1.0 + attFactionDef.infantryAttackBonus);
      }
    }

    attackerInfAtkTotal += unitAtkInf;
    attackerCavAtkTotal += unitAtkCav;
  }

  // ==========================================
  // 4. KADEME: Garnizon Savunma Gücü (Piyade Savunma & Süvari Savunma)
  // ==========================================
  let dInfTotal = 0; // Piyade taarruzlarına karşı savunma
  let dCavTotal = 0; // Süvari taarruzlarına karşı savunma
  let defenderInfCount = 0;
  let defenderCavCount = 0;

  const defFStr = (defenderFaction || '').toLowerCase();
  const isGermiyan = defFStr.includes('germiyan');

  for (const [unitKey, countVal] of Object.entries(defenderUnits)) {
    const count = Number(countVal) || 0;
    if (count <= 0) continue;
    const uType = unitKey as UnitType;
    const def = UNITS[uType];
    if (!def) continue;

    if (def.category === 'suvari') {
      defenderCavCount += count;
    } else {
      defenderInfCount += count;
    }

    let infDef = def.defenseInfantry * count;
    let cavDef = def.defenseCavalry * count;

    // Demirci Zırh Talimi (+%1 savunma / seviye, maks %20)
    const forgeDefLevel = Math.min(20, Math.max(0, defenderUpgrades?.[uType]?.defenseLevel || 0));
    if (forgeDefLevel > 0) {
      infDef *= (1.0 + forgeDefLevel / 100);
      cavDef *= (1.0 + forgeDefLevel / 100);
    }

    // Germiyanoğulları Savunma Bonusu (+%25)
    if (isGermiyan) {
      infDef *= 1.25;
      cavDef *= 1.25;
    } else {
      // Diğer Beylik Savunma Bonusları (FactionAttributes: infantryDefenseBonus, cavalryDefenseBonus)
      const defFactionDef = FACTIONS[defenderFaction];
      if (defFactionDef) {
        if (def.category === 'piyade' && defFactionDef.infantryDefenseBonus > 0) {
          infDef *= (1.0 + defFactionDef.infantryDefenseBonus);
          cavDef *= (1.0 + defFactionDef.infantryDefenseBonus);
        } else if (def.category === 'suvari' && defFactionDef.cavalryDefenseBonus > 0) {
          infDef *= (1.0 + defFactionDef.cavalryDefenseBonus);
          cavDef *= (1.0 + defFactionDef.cavalryDefenseBonus);
        }
      }
    }

    dInfTotal += infDef;
    dCavTotal += cavDef;
  }

  // Taban köy halkı savunması (25 piyade / 25 süvari direnci)
  dInfTotal += 25;
  dCavTotal += 25;

  // Savunan garnizonun bileşimi: Saldıran ordunun Piyade Saldırısı piyadeleri, Süvari Saldırısı süvarileri vurur
  const defTroopTotal = defenderInfCount + defenderCavCount;
  let pAtkTotal = 0;
  if (defTroopTotal > 0) {
    const defInfRatio = defenderInfCount / defTroopTotal;
    const defCavRatio = defenderCavCount / defTroopTotal;
    pAtkTotal = (attackerInfAtkTotal * defInfRatio) + (attackerCavAtkTotal * defCavRatio);
  } else {
    // Düşman garnizonu boşsa ortalama taarruz gücü
    pAtkTotal = (attackerInfAtkTotal + attackerCavAtkTotal) / 2;
  }

  // Demirci Çelik Pusatlar Taarruz Bonusu (+%4 / seviye)
  const forgeAtkMult = getForgeAttackMultiplier(attackerForgeUpgrades);
  pAtkTotal *= forgeAtkMult;

  // Hakan/Han Taarruz Bonusu
  if (attackerKhanAura > 0) {
    pAtkTotal *= (1.0 + attackerKhanAura / 100);
  }

  // Efektif savunma: Saldıran ordunun piyade/süvari oranına göre ağırlıklandırılmış
  const attTroopTotal = attackerInfCount + attackerCavCount;
  let dEffective = 0;
  if (attTroopTotal > 0) {
    const attInfRatio = attackerInfCount / attTroopTotal;
    const attCavRatio = attackerCavCount / attTroopTotal;
    dEffective = (dInfTotal * attInfRatio) + (dCavTotal * attCavRatio);
  } else {
    dEffective = (dInfTotal + dCavTotal) / 2;
  }

  // Demirci Örme Zırhlar Savunma Bonusu (+%4 / seviye)
  const forgeDefMult = getForgeDefenseMultiplier(defenderForgeUpgrades);
  dEffective *= forgeDefMult;

  // Hakan/Han Savunma Bonusu
  if (defenderKhanAura > 0) {
    dEffective *= (1.0 + defenderKhanAura / 100);
  }

  // ==========================================
  // 5. KADEME: Sur Çarpanı ve Koçbaşı Zayıflatması
  // ==========================================
  const rawKocbasiCount = Number(attackerUnits.kocbasi) || 0;
  // Candaroğulları Kuşatma Gücü (+%25 koçbaşı sur yıkım etkisi)
  const isCandarAttacker = attFStr.includes('candar');
  // Demirci Koçbaşı Güçlendirmesi (+%10 sur yıkma hızı / seviye)
  const forgeRamMult = getForgeRamMultiplier(attackerForgeUpgrades);
  const effectiveKocbasi = (isCandarAttacker ? rawKocbasiCount * 1.25 : rawKocbasiCount) * forgeRamMult;
  const effectiveWallLevel = Math.max(0, defenderWallLevel - Math.floor(effectiveKocbasi / 4));
  
  let wallBonusPct = effectiveWallLevel * 5; // Her seviye +%5 savunma
  if (isGermiyan) {
    wallBonusPct += 25; // Germiyan: Aşılmaz Hisar & Sur dayanımı +%25
  } else if (defFStr.includes('dulkadir')) {
    wallBonusPct += 15; // Dulkadir: Savunma Odaklı Yayla Siperi +%15
  } else if (defFStr.includes('osman')) {
    wallBonusPct += 5; // Osman: Dengeli Savunma +%5
  }
  const wallMultiplier = 1.0 + (wallBonusPct / 100);
  let dNihai = dEffective * wallMultiplier;

  // Yağma Savunma Bonusu: Yağmaya uğrayan köye muharebe anında anlık +%5 savunma gücü eklenir!
  if (mission === 'raid') {
    dNihai *= 1.05;
  }

  // ==========================================
  // 6. KADEME: Moral Çarpanı (Anti-Bullying)
  // ==========================================
  const pRatio = Math.max(1, defenderPoints) / Math.max(1, attackerPoints);
  const moralMultiplier = Math.min(1.0, Math.max(0.40, Math.pow(pRatio, 0.45)));
  const pAtkFinal = pAtkTotal * moralMultiplier;

  // ==========================================
  // 7. KADEME: Muharebe Zayiatı Hesaplaması
  // ==========================================
  let attackerLossRatio = 0;
  let defenderLossRatio = 0;
  let attackerResult: 'victory' | 'defeat' | 'draw' = 'draw';

  if (pAtkFinal <= 0 && dNihai <= 0) {
    attackerResult = 'draw';
    attackerLossRatio = 0;
    defenderLossRatio = 0;
  } else if (pAtkFinal > dNihai) {
    attackerResult = 'victory';

    if (mission === 'attack') {
      // Normal Saldırı: İki tarafın ordularından biri tamamen yok olana kadar savaşılır.
      defenderLossRatio = 1.0; // Savunan tamamen imha oldu
      // Kazanan saldıranın Lanchester yıpranması
      attackerLossRatio = Math.min(0.95, Math.max(0.025, Math.pow(dNihai / pAtkFinal, 1.25) * 0.85));
    } else {
      // Yağma Seferi ('raid'): Askerler tamamen yok olana kadar vuruşulmaz; kuvvet oranına göre kısmi zayiat!
      attackerLossRatio = Math.min(0.30, Math.max(0.03, Math.pow(dNihai / pAtkFinal, 1.20) * 0.22));
      defenderLossRatio = Math.min(0.65, Math.max(0.15, Math.pow(pAtkFinal / dNihai, 0.45) * 0.38));
    }
  } else {
    // Savunan kazandı veya püskürttü
    attackerResult = 'defeat';

    if (mission === 'attack') {
      // Normal Saldırı: Saldıran ordu tamamen yok oldu
      attackerLossRatio = 1.0;
      defenderLossRatio = Math.min(0.95, Math.max(0.025, Math.pow(pAtkFinal / dNihai, 1.25) * 0.85));
    } else {
      // Yağma Seferi ('raid'): Püskürtüldü ama kısmi zayiatla çekildi
      attackerLossRatio = Math.min(0.65, Math.max(0.18, Math.pow(dNihai / (pAtkFinal || 1), 0.40) * 0.40));
      defenderLossRatio = Math.min(0.28, Math.max(0.03, Math.pow((pAtkFinal || 1) / dNihai, 1.20) * 0.20));
    }
  }

  // Birlik bazında kayıpları dağıtma
  const attackerCasualties: BattleCasualties = {
    unitsBefore: { ...attackerUnits },
    unitsLost: {},
    unitsRemaining: {},
  };

  let survivingLootCapacity = 0;
  let totalSurvivingAttackers = 0;

  for (const [unitKey, countVal] of Object.entries(attackerUnits)) {
    const count = Number(countVal) || 0;
    if (count <= 0) continue;
    const uType = unitKey as UnitType;
    const def = UNITS[uType];
    const lost = Math.min(count, Math.round(count * attackerLossRatio));
    const remaining = count - lost;
    attackerCasualties.unitsLost[uType] = lost;
    attackerCasualties.unitsRemaining[uType] = remaining;

    if (uType !== 'casus') {
      totalSurvivingAttackers += remaining;
    }

    // Taşıma Kapasitesi (Osmanoğulları +%20)
    if (def) {
      let unitCap = def.lootCapacity;
      if (attackerFaction === 'osmanogullari') {
        unitCap *= 1.20;
      }
      survivingLootCapacity += remaining * unitCap;
    }
  }

  const defenderCasualties: BattleCasualties = {
    unitsBefore: { ...defenderUnits },
    unitsLost: {},
    unitsRemaining: {},
  };

  for (const [unitKey, countVal] of Object.entries(defenderUnits)) {
    const count = Number(countVal) || 0;
    if (count <= 0) continue;
    const uType = unitKey as UnitType;
    const lost = Math.min(count, Math.round(count * defenderLossRatio));
    const remaining = count - lost;
    defenderCasualties.unitsLost[uType] = lost;
    defenderCasualties.unitsRemaining[uType] = remaining;
  }

  // ==========================================
  // 8. KUŞATMA VE BİNA YIKIMI ('attack' ve Mancınık / Top Varlığı)
  // ==========================================
  const damagedBuildings: DamagedBuildingInfo[] = [];
  let finalWallLevel = defenderWallLevel;

  const survivingMancinik = attackerCasualties.unitsRemaining.mancinik || 0;
  const survivingTop = attackerCasualties.unitsRemaining.top || 0;
  const survivingRams = attackerCasualties.unitsRemaining.kocbasi || 0;

  if (attackerResult === 'victory' && mission === 'attack') {
    // Kuşatma Gücü: Mancınık veya Top varsa binalar yıkılır
    const hasHeavySiege = survivingMancinik > 0 || survivingTop > 0;
    
    if (hasHeavySiege || survivingRams > 0) {
      // Ham Kuşatma Yıkım Puanı
      let rawSiegePoints = (survivingMancinik * 16) + (survivingTop * 36) + (survivingRams * 4);

      // Savunmacı beyliğin bina kuşatma dayanımı (FactionAttributes: buildingSiegeResistance, Karamanoğulları 1.25)
      const siegeResistance = FACTIONS[defenderFaction]?.buildingSiegeResistance || 1.0;
      if (siegeResistance > 1.0) {
        rawSiegePoints /= siegeResistance;
      }

      // Klon bina tablosu (orijinali bozmadan takip edelim)
      const currentBuildings: Record<string, number> = {
        ...defenderBuildings,
        wall: defenderWallLevel,
      };

      // Hedef Sıralaması:
      // 1. Köyde Sur varsa önce mutlaka Sur vurulur.
      // 2. Köyde Umaykut Binası dikilmişse Sur'dan sonra mutlaka Umaykut Binası vurulur.
      // 3. Diğer hallerde Sur'dan sonra rastgele bir bina vurulur.
      // Bir taarruzda en fazla 2 bina hasar görebilir!
      const damagedTypesSet = new Set<string>();

      for (let slot = 0; slot < 2; slot++) {
        if (rawSiegePoints <= 0) break;

        let targetBuilding: string | null = null;

        // 1. Öncelik: Sur (seviye > 0)
        if (!damagedTypesSet.has('wall') && (currentBuildings.wall || 0) > 0) {
          targetBuilding = 'wall';
        } 
        // 2. Öncelik: Umaykut Binası (seviye > 0)
        else if (!damagedTypesSet.has('umaykut') && (currentBuildings.umaykut || 0) > 0) {
          targetBuilding = 'umaykut';
        } 
        // 3. Öncelik: Diğer rastgele seviyesi > 0 olan bir bina
        else {
          const eligibleBuildings = Object.keys(currentBuildings).filter(bKey => {
            return !damagedTypesSet.has(bKey) && (currentBuildings[bKey] || 0) > 0;
          });

          if (eligibleBuildings.length > 0) {
            // Deterministik ama rastgele seçim
            const chosenIndex = Math.floor(Math.random() * eligibleBuildings.length);
            targetBuilding = eligibleBuildings[chosenIndex];
          }
        }

        if (!targetBuilding) break; // Hasar verilecek bina kalmadı

        damagedTypesSet.add(targetBuilding);
        const curLevel = currentBuildings[targetBuilding] || 0;
        const bDef = BUILDINGS[targetBuilding as BuildingType];
        const bName = bDef ? bDef.name : targetBuilding;

        // Seviye başına gereken kuşatma gücü
        const costPerLevel = targetBuilding === 'wall' ? 12 : targetBuilding === 'umaykut' ? 22 : 15;
        const levelsToDestroy = Math.min(curLevel, Math.max(1, Math.floor(rawSiegePoints / costPerLevel)));
        const newLevel = Math.max(0, curLevel - levelsToDestroy);

        currentBuildings[targetBuilding] = newLevel;
        rawSiegePoints = Math.max(0, rawSiegePoints - (levelsToDestroy * costPerLevel));

        if (targetBuilding === 'wall') {
          finalWallLevel = newLevel;
        }

        damagedBuildings.push({
          buildingType: targetBuilding,
          buildingName: bName,
          levelBefore: curLevel,
          levelAfter: newLevel,
        });
      }
    }
  }

  // ==========================================
  // 9. YAĞMA: GANİMET, ESİR KÖYLÜ VE AT KAÇIRMA
  // ==========================================
  const lootCarried: Resources = { wood: 0, stone: 0, iron: 0, grain: 0, gold: 0 };
  let capturedVillagers = 0;
  let capturedHorses = 0;
  let totalSavedByHideout = 0;
  let hideoutProtectionAmount = 0;

  if (attackerResult === 'victory' && survivingLootCapacity > 0) {
    const hideoutProtection = getHideoutCapacity(defenderHideoutLevel, defenderFaction);
    hideoutProtectionAmount = hideoutProtection;
    const plunderMultiplier = FACTIONS[attackerFaction]?.plunderCapacityMultiplier || 1.0;
    const effectiveLootCap = survivingLootCapacity * plunderMultiplier;

    // Umaykut Sığınak Koruması Formülü: Yağmalanabilir Miktar: Math.max(0, currentResource - protectedCap)
    const plunderableWood = Math.max(0, defenderResources.wood - hideoutProtection);
    const plunderableStone = Math.max(0, defenderResources.stone - hideoutProtection);
    const plunderableIron = Math.max(0, defenderResources.iron - hideoutProtection);
    const plunderableGrain = Math.max(0, defenderResources.grain - hideoutProtection);
    const plunderableGold = Math.max(0, defenderResources.gold - hideoutProtection);

    // Sığınak sayesinde kurtarılan kaynak miktarı (her kaynaktan korunan pay)
    const savedWood = Math.min(defenderResources.wood, hideoutProtection);
    const savedStone = Math.min(defenderResources.stone, hideoutProtection);
    const savedIron = Math.min(defenderResources.iron, hideoutProtection);
    const savedGrain = Math.min(defenderResources.grain, hideoutProtection);
    const savedGold = Math.min(defenderResources.gold, hideoutProtection);
    totalSavedByHideout = savedWood + savedStone + savedIron + savedGrain + savedGold;

    const totalPlunderable = plunderableWood + plunderableStone + plunderableIron + plunderableGrain + plunderableGold;

    if (totalPlunderable > 0) {
      const takeFraction = Math.min(1.0, effectiveLootCap / totalPlunderable);
      lootCarried.wood = Math.round(plunderableWood * takeFraction);
      lootCarried.stone = Math.round(plunderableStone * takeFraction);
      lootCarried.iron = Math.round(plunderableIron * takeFraction);
      lootCarried.grain = Math.round(plunderableGrain * takeFraction);
      lootCarried.gold = Math.round(plunderableGold * takeFraction);
    }
  }

  // Yağma Özel: Esir Köylü & At Kaçırma
  if (attackerResult === 'victory' && mission === 'raid' && totalSurvivingAttackers > 0) {
    // Köylü Kaçırma (FactionAttributes: villagerRaidRatio, Standart 10, Dulkadiroğulları 8)
    const villagerRatio = FACTIONS[attackerFaction]?.villagerRaidRatio || 10;
    const maxCapturableByTroops = Math.floor(totalSurvivingAttackers / villagerRatio);
    capturedVillagers = Math.min(10, maxCapturableByTroops, Math.max(0, defenderIdlePopulation));

    // At Kaçırma (FactionAttributes: horseRaidRatio, Standart 50, Osmanoğulları 40)
    const horseRatio = FACTIONS[attackerFaction]?.horseRaidRatio || 50;
    const maxHorsesByTroops = Math.floor(totalSurvivingAttackers / horseRatio);
    capturedHorses = Math.min(maxHorsesByTroops, Math.max(0, defenderHorses || 5)); // Köyde at varsa kaçır
  }

  // ==========================================
  // 10. DİVAN ÖZETİ (SUMMARY)
  // ==========================================
  let summary = '';
  if (attackerResult === 'victory') {
    if (mission === 'attack') {
      summary = `⚔️ ${attackerVillageName} ordusu ${defenderVillageName} hisarını yerle bir ederek tam zafer kazandı! Düşman garnizonu imha edildi.`;
    } else {
      summary = `🏇 ${attackerVillageName} akıncıları ${defenderVillageName} ovasını bastı, düşman hatlarını yararak ganimet topladı.`;
    }

    if (damagedBuildings.length > 0) {
      const bDesc = damagedBuildings
        .map(b => `${b.buildingName} (Seviye ${b.levelBefore} ➔ ${b.levelAfter})`)
        .join(', ');
      summary += ` 💥 Kuşatma makineleri binaları vurdu: ${bDesc}.`;
    }

    if (capturedVillagers > 0) {
      summary += ` ⛓️ ${capturedVillagers} esir köylü yakalanıp esir katarına bağlandı.`;
    }

    if (capturedHorses > 0) {
      summary += ` 🐎 Düşman haralarından ${capturedHorses} safkan at kaçırıldı.`;
    }

    const totalLoot = lootCarried.wood + lootCarried.stone + lootCarried.iron + lootCarried.grain + lootCarried.gold;
    if (totalLoot > 0) {
      summary += ` 💰 Toplam ${totalLoot.toLocaleString()} kaynak ele geçirildi.`;
    }
    if (totalSavedByHideout > 0) {
      summary += ` 🛡️ Sığınak sayesinde ${totalSavedByHideout.toLocaleString()} kaynak kurtarıldı! (Her kaynaktan ${hideoutProtectionAmount.toLocaleString()} birim güvende tutuldu).`;
    }
  } else {
    if (mission === 'attack') {
      summary = `🛡️ ${defenderVillageName} surları ve muhafızları taarruzu püskürttü. Taarruz ordumuz tamamen imha oldu!`;
    } else {
      summary = `🛡️ ${defenderVillageName} garnizonu akıncılarımızı sert bir direnişle geri püskürttü.`;
    }
  }

  return {
    id: reportId,
    timestamp: nowTimestamp,
    mission,
    attackerVillageName,
    attackerFaction,
    attackerCoords,
    defenderVillageName,
    defenderFaction,
    defenderCoords,
    attackerResult,
    attackerCasualties,
    attackerLossRatio,
    defenderCasualties,
    defenderLossRatio,
    initialWallLevel: defenderWallLevel,
    finalWallLevel,
    lootCarried,
    maxLootCapacity: survivingLootCapacity,
    damagedBuildings: damagedBuildings.length > 0 ? damagedBuildings : undefined,
    capturedVillagers: capturedVillagers > 0 ? capturedVillagers : undefined,
    capturedHorses: capturedHorses > 0 ? capturedHorses : undefined,
    savedByHideout: totalSavedByHideout > 0 ? totalSavedByHideout : undefined,
    hideoutProtection: hideoutProtectionAmount > 0 ? hideoutProtectionAmount : undefined,
    summary,
  };
}
