import { simulateBattle } from './lanchester';
import { 
  BattleReport, 
  March, 
  MarchMission, 
  StationedSupportArmy, 
  UnitType, 
  Village,
  Resources,
  FactionId
} from '../types/game';
import { calculateBattleXp, calculateNextLevelXp } from './heroLogic';
import { UNITS } from '../data/gameData';

export interface MarchTickInput {
  marches: March[];
  playerVillages: Village[];
  rivalVillages: Village[];
  khan: any;
  now: number;
}

export interface MarchTickResult {
  updatedMarches: March[];
  updatedPlayerVillages: Village[];
  updatedRivalVillages: Village[];
  newReports: BattleReport[];
  notifications: string[];
  updatedKhan: any;
}

/**
 * Destek Askerlerinin Tahıl Ambarı Tüketimi ve Açlık (Starvation) Motoru
 * - Köyde kaldıkları sürece gittikleri köyün tahıl ambarını tüketirler (asker başı saatte 1 tahıl).
 * - Hedef köyde tahıl ambarı 0 kalırsa İLK OLARAK DESTEK ASKERLERİ açlıktan ölmeye başlar.
 * - Destekler biterse yerel askerler ölür.
 */
export function processVillageSupportUpkeepAndStarvation(
  village: Village, 
  deltaSec: number = 1
): { updatedVillage: Village; starvationNotice?: string } {
  let v = { ...village };
  const stationedSupport = v.stationedSupport ? [...v.stationedSupport] : [];
  
  // Toplam destek askeri sayısı
  let totalSupportTroops = 0;
  stationedSupport.forEach(army => {
    Object.values(army.units).forEach(count => {
      totalSupportTroops += (count || 0);
    });
  });

  // Toplam yerel asker sayısı
  let totalLocalTroops = 0;
  Object.values(v.units || {}).forEach(count => {
    totalLocalTroops += (count || 0);
  });

  // Her asker saatte 1 tahıl tüketir
  const supportGrainRatePerSec = (totalSupportTroops * 1.0) / 3600;
  const grainNeeded = supportGrainRatePerSec * deltaSec;

  if (v.resources.grain > grainNeeded) {
    // Tahıl ambarından tüket
    v.resources = {
      ...v.resources,
      grain: Math.max(0, v.resources.grain - grainNeeded),
    };
    return { updatedVillage: v };
  }

  // Tahıl Tükendi (Açlık / Starvation Başladı!)
  v.resources = { ...v.resources, grain: 0 };
  let starvationNotice: string | undefined;

  // Açlık kaybı oranı: Her saniyede destek ordusundan asker kaybı
  if (totalSupportTroops > 0) {
    // 1. ÖNCELİK: İLK OLARAK DESTEK ASKERLERİ AÇLIKTAN ÖLÜR
    const updatedArmies: StationedSupportArmy[] = [];
    let supportCasualtiesCount = 0;

    for (const army of stationedSupport) {
      const armyUnits = { ...army.units };
      let armyAlive = 0;

      for (const [uType, countVal] of Object.entries(armyUnits)) {
        const count = countVal || 0;
        if (count <= 0) continue;
        // Yıldırım açlık: 1 asker veya %2 kayıp
        const starved = Math.max(1, Math.round(count * 0.02));
        const rem = Math.max(0, count - starved);
        armyUnits[uType as UnitType] = rem;
        supportCasualtiesCount += (count - rem);
        armyAlive += rem;
      }

      if (armyAlive > 0) {
        updatedArmies.push({ ...army, units: armyUnits });
      }
    }

    v.stationedSupport = updatedArmies;
    starvationNotice = `⚠️ ${v.name}: Tahıl ambarı sıfırlandı! ${supportCasualtiesCount} misafir destek askeri açlıktan veba olup şehit düştü!`;
  } else if (totalLocalTroops > 0) {
    // 2. ÖNCELİK: Destekler biterse yerel garnizon askerleri ölür
    const localUnits = { ...v.units };
    let localCasualtiesCount = 0;

    for (const [uType, countVal] of Object.entries(localUnits)) {
      const count = countVal || 0;
      if (count <= 0) continue;
      const starved = Math.max(1, Math.round(count * 0.015));
      const rem = Math.max(0, count - starved);
      localUnits[uType as UnitType] = rem;
      localCasualtiesCount += (count - rem);
    }

    v.units = localUnits;
    starvationNotice = `⚠️ ${v.name}: Tahıl ambarı boşaldı! Kıtlık sebebiyle garnizondan ${localCasualtiesCount} asker açlıktan kırıldı!`;
  }

  return { updatedVillage: v, starvationNotice };
}

/**
 * Destek Birliklerini Geri Çekme (Recall)
 * - Köy sahibi veya asker sahibi birlikleri dilediği an geri gönderebilir/çekebilir.
 */
export function recallSupportArmy(
  targetVillage: Village,
  supportArmyId: string,
  allPlayerVillages: Village[],
  now: number = Date.now()
): { updatedTargetVillage: Village; returnMarch?: March; error?: string } {
  const stationed = targetVillage.stationedSupport || [];
  const armyIndex = stationed.findIndex(a => a.id === supportArmyId);
  if (armyIndex === -1) {
    return { updatedTargetVillage: targetVillage, error: 'Destek ordusu bulunamadı.' };
  }

  const army = stationed[armyIndex];
  const newStationed = stationed.filter(a => a.id !== supportArmyId);
  const updatedTargetVillage: Village = {
    ...targetVillage,
    stationedSupport: newStationed,
  };

  // Askerlerin ana köyünü bul
  const originVillage = allPlayerVillages.find(v => v.id === army.originVillageId);
  const targetCoords = originVillage ? { x: originVillage.x, y: originVillage.y } : { x: targetVillage.x, y: targetVillage.y };
  
  // Mesafe ve dönüş süresi
  const dx = targetVillage.x - targetCoords.x;
  const dy = targetVillage.y - targetCoords.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const durationSec = Math.max(10, Math.round(dist * 15));

  const returnMarch: March = {
    id: 'march_ret_' + now + '_' + Math.random().toString(36).substring(2, 6),
    originVillageId: army.originVillageId,
    originVillageName: army.originVillageName,
    originCoordinates: { x: targetVillage.x, y: targetVillage.y },
    targetVillageId: army.originVillageId,
    targetCoordinates: targetCoords,
    targetName: army.originVillageName,
    mission: 'support',
    units: army.units,
    startTime: now,
    durationSec,
    arrivalTime: now + (durationSec * 1000),
    isReturning: true,
  };

  return { updatedTargetVillage, returnMarch };
}

/**
 * Sefer ve Harp Yönetim Döngüsü (March Tick & Resolution)
 * - 'attack': Tam imha savaşı, Mancınık/Top ile Sur -> Umaykut -> Rastgele bina hasarı (maks 2 bina).
 * - 'raid': Kısmi zayiat, +%5 savunma bonusu, 10 askere 1 esir köylü (Osmanoğulları 8'e 1), 50 askere 1 at (Dulkadiroğulları 40'a 1), 1 saat yağma koruması.
 * - 'support': Hedef köye konuşlanma ve ambar tüketimine başlama.
 * - 'spy': Bilgi sızdırma / tespit.
 */
export function processMarchesTick(input: MarchTickInput): MarchTickResult {
  const { marches, playerVillages, rivalVillages, khan, now } = input;
  
  if (marches.length === 0) {
    return {
      updatedMarches: marches,
      updatedPlayerVillages: playerVillages,
      updatedRivalVillages: rivalVillages,
      newReports: [],
      notifications: [],
      updatedKhan: khan,
    };
  }

  let curPlayerVillages = [...playerVillages];
  let curRivalVillages = [...rivalVillages];
  let curKhan = { ...khan };
  const updatedMarches: March[] = [];
  const newReports: BattleReport[] = [];
  const notifications: string[] = [];

  for (const march of marches) {
    // ----------------------------------------------------
    // DURUM A: HEDEFE VARIŞ ANI (Arrival at Target)
    // ----------------------------------------------------
    if (!march.isReturning && now >= march.arrivalTime) {
      // Hedef köyü bul (rakip veya oyuncu köyü olabilir)
      let targetVillage = curRivalVillages.find(
        rv => rv.x === march.targetCoordinates.x && rv.y === march.targetCoordinates.y
      );
      let isTargetRival = true;

      if (!targetVillage) {
        targetVillage = curPlayerVillages.find(
          pv => pv.x === march.targetCoordinates.x && pv.y === march.targetCoordinates.y
        );
        isTargetRival = false;
      }

      if (!targetVillage) {
        // Fallback: ilk rakip köy
        targetVillage = curRivalVillages[0];
        isTargetRival = true;
      }

      const originVillage = curPlayerVillages.find(v => v.id === march.originVillageId) || curPlayerVillages[0];

      // Eski kervan seferi varsa kaldır
      if ((march.mission as string) === 'trade') {
        continue;
      }

      // ==========================================
      // 1. DESTEK SEFERİ HEDEFE ULAŞTI
      // ==========================================
      if (march.mission === 'support') {
        const supportArmy: StationedSupportArmy = {
          id: 'support_' + now + '_' + Math.random().toString(36).substring(2, 6),
          originVillageId: originVillage.id,
          originVillageName: originVillage.name,
          originOwnerName: originVillage.ownerName,
          originFaction: originVillage.faction,
          units: { ...march.units },
          stationedAt: now,
        };

        if (isTargetRival) {
          curRivalVillages = curRivalVillages.map(rv => {
            if (rv.id === targetVillage!.id) {
              return {
                ...rv,
                stationedSupport: [...(rv.stationedSupport || []), supportArmy],
              };
            }
            return rv;
          });
        } else {
          curPlayerVillages = curPlayerVillages.map(pv => {
            if (pv.id === targetVillage!.id) {
              return {
                ...pv,
                stationedSupport: [...(pv.stationedSupport || []), supportArmy],
              };
            }
            return pv;
          });
        }

        notifications.push(`🛡️ Destek ordumuz ${march.targetName} hisarına ulaştı ve garnizona yerleşti.`);
        // Destek ordusu hedefte konuşlandığı için geri dönmez, sefer sonlanır.
        continue;
      }

      // ==========================================
      // 2. TAARRUZ ('attack'), YAĞMA ('raid') VEYA CASUSLUK ('spy')
      // ==========================================
      let attKhanAura = 0;
      if (march.withKhan && curKhan.status === 'marching') {
        attKhanAura = (curKhan.skills?.attackAura || 0) * 1.5;
      }

      let defKhanAura = 0;
      if (curKhan.status === 'idle' && curKhan.currentVillageId === targetVillage.id) {
        defKhanAura = (curKhan.skills?.defenseAura || 0) * 1.5;
      }

      // Hedef köydeki toplam savunma birlikleri (yerel garnizon + konuşlanmış destek orduları)
      const combinedDefenderUnits: Partial<Record<UnitType, number>> = { ...targetVillage.units };
      if (targetVillage.stationedSupport && targetVillage.stationedSupport.length > 0) {
        targetVillage.stationedSupport.forEach(supp => {
          Object.entries(supp.units).forEach(([uKey, count]) => {
            if (count) {
              const u = uKey as UnitType;
              combinedDefenderUnits[u] = (combinedDefenderUnits[u] || 0) + count;
            }
          });
        });
      }

      // Savaş Motorunu Çalıştır
      const report = simulateBattle({
        mission: march.mission,
        attackerFaction: originVillage.faction,
        attackerVillageName: originVillage.name,
        attackerCoords: { x: originVillage.x, y: originVillage.y },
        attackerUnits: march.units,
        attackerKhanAura: attKhanAura,
        attackerUpgrades: originVillage.unitUpgrades,
        attackerForgeUpgrades: originVillage.forgeUpgrades,
        defenderFaction: targetVillage.faction,
        defenderVillageName: march.targetName,
        defenderCoords: march.targetCoordinates,
        defenderUnits: combinedDefenderUnits,
        defenderBuildings: targetVillage.buildings,
        defenderWallLevel: targetVillage.buildings.wall || 0,
        defenderHideoutLevel: targetVillage.buildings.hideout || 0,
        defenderResources: targetVillage.resources,
        defenderKhanAura: defKhanAura,
        defenderIdlePopulation: targetVillage.idlePopulation || 0,
        defenderHorses: targetVillage.horses || 5,
        defenderUpgrades: targetVillage.unitUpgrades,
        defenderForgeUpgrades: targetVillage.forgeUpgrades,
        defenderLastPlundered: targetVillage.lastPlunderedTimestamp,
        nowTimestamp: now,
      });

      newReports.push(report);

      // Khan XP ve Hayatta Kalma Kontrolü
      if (march.withKhan && curKhan.status === 'marching') {
        if (report.attackerLossRatio > 0.85) {
          curKhan = {
            ...curKhan,
            status: 'dead',
            reviveFinishTimestamp: null,
          };
          notifications.push(`💔 Hakanınız muharebe meydanında ağır yaralanarak şehit düştü!`);
        } else {
          const gainedXp = calculateBattleXp(report.defenderCasualties.unitsLost);
          let newXp = curKhan.xp + gainedXp;
          let newLevel = curKhan.level;
          let newPoints = curKhan.unspentSkillPoints;
          let nextXp = curKhan.xpNext;
          while (newXp >= nextXp) {
            newLevel++;
            newPoints += 2;
            newXp -= nextXp;
            nextXp = calculateNextLevelXp(newLevel);
          }
          curKhan = {
            ...curKhan,
            xp: newXp,
            level: newLevel,
            unspentSkillPoints: newPoints,
            xpNext: nextXp,
          };
        }
      }

      // Savunan Köyün Durumunu Güncelle (Binalar, Birimler, Yağma, Esirler)
      const updateDefenderVillage = (v: Village): Village => {
        // Savunan birlik kayıplarını uygula
        const remUnits: any = { ...v.units };
        for (const [uType, lost] of Object.entries(report.defenderCasualties.unitsLost)) {
          if (lost) {
            remUnits[uType] = Math.max(0, (remUnits[uType] || 0) - lost);
          }
        }

        // Hammadde yağmasını düş
        const remRes: Resources = {
          wood: Math.max(0, v.resources.wood - report.lootCarried.wood),
          stone: Math.max(0, v.resources.stone - report.lootCarried.stone),
          iron: Math.max(0, v.resources.iron - report.lootCarried.iron),
          grain: Math.max(0, v.resources.grain - report.lootCarried.grain),
          gold: Math.max(0, v.resources.gold - report.lootCarried.gold),
        };

        // Bina yıkımını uygula
        const updatedBuildings = { ...v.buildings, wall: report.finalWallLevel };
        if (report.damagedBuildings) {
          for (const db of report.damagedBuildings) {
            updatedBuildings[db.buildingType] = db.levelAfter;
          }
        }

        // Kaçırılan köylü ve atları düş
        const newIdlePop = Math.max(0, (v.idlePopulation || 0) - (report.capturedVillagers || 0));
        const newHorses = Math.max(0, (v.horses || 5) - (report.capturedHorses || 0));

        // Yağma koruması zaman damgası (Yağma yapıldıysa 1 saat koruma)
        const newLastPlundered = (march.mission === 'raid' && !report.isPlunderProtected)
          ? now
          : v.lastPlunderedTimestamp;

        return {
          ...v,
          buildings: updatedBuildings,
          units: remUnits,
          resources: remRes,
          idlePopulation: newIdlePop,
          horses: newHorses,
          lastPlunderedTimestamp: newLastPlundered,
        };
      };

      if (isTargetRival) {
        curRivalVillages = curRivalVillages.map(rv => rv.id === targetVillage!.id ? updateDefenderVillage(rv) : rv);
      } else {
        curPlayerVillages = curPlayerVillages.map(pv => pv.id === targetVillage!.id ? updateDefenderVillage(pv) : pv);
      }

      // Saldıran Ordunun Akıbeti
      const survivingTroops = report.attackerCasualties.unitsRemaining;
      const hasSurviving = Object.values(survivingTroops).some(c => (c || 0) > 0);

      if (hasSurviving) {
        const returnDurationSec = march.durationSec;
        updatedMarches.push({
          ...march,
          units: survivingTroops,
          isReturning: true,
          loot: report.lootCarried,
          capturedVillagers: report.capturedVillagers,
          capturedHorses: report.capturedHorses,
          startTime: now,
          arrivalTime: now + (returnDurationSec * 1000),
        });

        if (march.mission === 'attack') {
          notifications.push(`⚔️ ${march.targetName} taarruzu tamamlandı! Ordu zaferle dönüşe geçti.`);
        } else if (march.mission === 'raid') {
          notifications.push(`🏇 ${march.targetName} akını tamamlandı! Ganimet ve esirlerle birliklerimiz dönüyor.`);
        } else {
          notifications.push(`🦅 ${march.targetName} keşif casuslarımız gizlice geri dönüyor.`);
        }
      } else {
        notifications.push(`💀 ${march.targetName} seferindeki tüm taarruz birliklerimiz imha oldu.`);
      }
    }
    // ----------------------------------------------------
    // DURUM B: KÖYE DÖNÜŞ ANI (Return to Home Village)
    // ----------------------------------------------------
    else if (march.isReturning && now >= march.arrivalTime) {
      if (march.withKhan) {
        curKhan = {
          ...curKhan,
          status: 'idle',
          currentVillageId: march.originVillageId,
        };
      }

      // Sağ kalan askerleri köye, ganimeti hazineye, esir köylüleri ve atları köye teslim et
      curPlayerVillages = curPlayerVillages.map(v => {
        const isOrigin = v.id === march.originVillageId;
        if (!isOrigin) return v;

        const updatedUnits = { ...v.units };
        for (const [uType, count] of Object.entries(march.units)) {
          if (count) {
            const k = uType as UnitType;
            updatedUnits[k] = (updatedUnits[k] || 0) + count;
          }
        }

        const updatedResources = { ...v.resources };
        if (march.loot) {
          updatedResources.wood = Math.min(v.maxCapacity, updatedResources.wood + (march.loot.wood || 0));
          updatedResources.stone = Math.min(v.maxCapacity, updatedResources.stone + (march.loot.stone || 0));
          updatedResources.iron = Math.min(v.maxCapacity, updatedResources.iron + (march.loot.iron || 0));
          updatedResources.grain = Math.min(v.maxCapacity, updatedResources.grain + (march.loot.grain || 0));
          updatedResources.gold = Math.min(v.maxCapacity, updatedResources.gold + (march.loot.gold || 0));
        }

        // Kaçırılan esir köylüler köy merkezindeki boşta işçilere eklenir!
        const addedVillagers = march.capturedVillagers || 0;
        const newIdlePop = (v.idlePopulation || 0) + addedVillagers;

        // Kaçırılan safkan atlar köyün at varlığına eklenir!
        const addedHorses = march.capturedHorses || 0;
        const newHorses = (v.horses || 0) + addedHorses;

        return {
          ...v,
          units: updatedUnits,
          resources: updatedResources,
          idlePopulation: newIdlePop,
          horses: newHorses,
        };
      });

      let retMessage = march.mission === 'trade' 
        ? `🛒 Ticaret kervanı tüccarlarımız ana otağa sağ salim geri döndü.`
        : `🏆 Sefer ordusu köye döndü! Birlikler garnizona, ganimetler hazineye aktarıldı.`;
      if (march.capturedVillagers && march.capturedVillagers > 0) {
        retMessage += ` ⛓️ ${march.capturedVillagers} esir köylü köy nüfusuna katıldı!`;
      }
      if (march.capturedHorses && march.capturedHorses > 0) {
        retMessage += ` 🐎 ${march.capturedHorses} ganimet at ahırlara bağlandı!`;
      }
      notifications.push(retMessage);
    } 
    // ----------------------------------------------------
    // DURUM C: YOLCULUK DEVAM EDİYOR (March in Progress)
    // ----------------------------------------------------
    else {
      updatedMarches.push(march);
    }
  }

  return {
    updatedMarches,
    updatedPlayerVillages: curPlayerVillages,
    updatedRivalVillages: curRivalVillages,
    newReports,
    notifications,
    updatedKhan: curKhan,
  };
}
