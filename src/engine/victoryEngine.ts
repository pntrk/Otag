/**
 * Umaykut Online - Cihan Hâkimiyeti Zafer Motoru
 * 
 * Zafer Kuralı:
 * Bir birliğin çağı/sezonu kazanması için, o birlikte yer alan üyeler arasından
 * FARKLI BEYLİKLERE mensup en az 3 oyuncunun merkez köylerindeki
 * "Umaykut Binası"nı 10. Seviyeye ulaştırması gerekir.
 * 
 * Zafer sağlandığında:
 * Sunucu durdurulur ve tüm oyuncuların ekranında altın varaklı tuğralarla şampiyon birlik ilan edilir:
 * "[Birlik Adı] İttifakı, 10. Seviye Umaykut mabetlerini tamamlayarak cihan hâkimiyetini ilan etmiştir!"
 */

import { Alliance, FactionType, QualifiedVictoryMember, VictoryCheckResult, Village } from '../types/game';
import { FACTIONS } from '../data/gameData';

export const REQUIRED_DISTINCT_FACTIONS = 3;
export const REQUIRED_UMAYKUT_LEVEL = 10;
export const STORAGE_KEY_VICTORY = 'umaykut_season_victory';

export interface FactionVictoryProgress {
  factionId: FactionType;
  factionName: string;
  crestIcon: string;
  hasMemberInAlliance: boolean;
  memberName?: string;
  villageName?: string;
  umaykutLevel: number;
  isCompleted: boolean; // umaykutLevel >= 10
}

/**
 * Oyuncunun ve ittifak üyelerinin merkez köylerindeki Umaykut seviyelerini denetleyerek
 * 3 farklı beylik şartının sağlanıp sağlanmadığını kontrol eder.
 */
export function checkAllianceVictory(
  alliance: Alliance,
  playerVillages: Village[] = []
): VictoryCheckResult {
  const qualifiedMembers: QualifiedVictoryMember[] = [];
  const qualifiedFactionsSet = new Set<FactionType>();

  // 1. Oyuncunun merkez köyündeki Umaykut seviyesi
  const playerCapital = playerVillages.find(v => v.isCapital) || playerVillages[0];
  const playerFaction = (playerCapital?.faction || 'osmanogullari') as FactionType;
  const playerUmaykutLvl = playerCapital?.buildings?.umaykut || 0;

  if (playerUmaykutLvl >= REQUIRED_UMAYKUT_LEVEL) {
    qualifiedMembers.push({
      userId: 'player_main',
      userName: playerCapital?.ownerName || 'Barutozap',
      faction: playerFaction,
      villageName: playerCapital?.name || 'merkez',
      umaykutLevel: playerUmaykutLvl,
    });
    qualifiedFactionsSet.add(playerFaction);
  }

  // 2. Diğer birlik üyeleri
  for (const member of alliance.members) {
    if (member.id === 'player_main') continue;

    const memberLvl = member.umaykutLevel || 0;
    if (memberLvl >= REQUIRED_UMAYKUT_LEVEL || member.hasLevel10Umaykut) {
      // Sadece beylik daha önce eklenmemişse veya üyeyi kayıt altına al
      qualifiedMembers.push({
        userId: member.id,
        userName: member.name,
        faction: member.faction,
        villageName: member.capitalVillageName || `${member.name} Payitaht`,
        umaykutLevel: Math.max(memberLvl, 10),
      });
      qualifiedFactionsSet.add(member.faction);
    }
  }

  const uniqueFactionsCount = qualifiedFactionsSet.size;
  const isVictory = uniqueFactionsCount >= REQUIRED_DISTINCT_FACTIONS;
  const progressRatio = Math.min(1, uniqueFactionsCount / REQUIRED_DISTINCT_FACTIONS);

  return {
    isVictory,
    winningAllianceId: isVictory ? alliance.id : null,
    winningAllianceName: isVictory ? alliance.name : null,
    winningAllianceTag: isVictory ? alliance.tag : null,
    qualifiedMembers,
    uniqueFactionsCount,
    requiredFactionsCount: REQUIRED_DISTINCT_FACTIONS,
    progressRatio,
    victoryDate: isVictory ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
    announcementText: isVictory 
      ? `"${alliance.name} İttifakı, 10. Seviye Umaykut mabetlerini tamamlayarak cihan hâkimiyetini ilan etmiştir!"`
      : undefined,
  };
}

/**
 * 5 Anadolu Beyliğinin bu ittifaktaki Umaykut mabet ilerlemesini detaylandırır
 */
export function getAllianceFactionProgress(
  alliance: Alliance,
  playerVillages: Village[] = []
): FactionVictoryProgress[] {
  const allFactionKeys: FactionType[] = [
    'osmanogullari',
    'karamanogullari',
    'aydinogullari',
    'candarogullari',
    'dulkadirogullari',
  ];

  const playerCapital = playerVillages.find(v => v.isCapital) || playerVillages[0];
  const playerFaction = (playerCapital?.faction || 'osmanogullari') as FactionType;
  const playerUmaykutLvl = playerCapital?.buildings?.umaykut || 0;

  return allFactionKeys.map(factionKey => {
    const factionDef = FACTIONS[factionKey];
    
    // Oyuncu bu beylikte mi?
    if (playerFaction === factionKey) {
      return {
        factionId: factionKey,
        factionName: factionDef?.name || factionKey,
        crestIcon: factionDef?.crestIcon || '🏹',
        hasMemberInAlliance: true,
        memberName: `${playerCapital?.ownerName || 'Barutozap'} (Hükümdar)`,
        villageName: playerCapital?.name || 'merkez',
        umaykutLevel: playerUmaykutLvl,
        isCompleted: playerUmaykutLvl >= REQUIRED_UMAYKUT_LEVEL,
      };
    }

    // İttifakta bu beylikten üye var mı?
    const member = alliance.members.find(m => m.faction === factionKey);
    if (member) {
      const lvl = member.umaykutLevel || (member.hasLevel10Umaykut ? 10 : 0);
      return {
        factionId: factionKey,
        factionName: factionDef?.name || factionKey,
        crestIcon: factionDef?.crestIcon || '🏹',
        hasMemberInAlliance: true,
        memberName: member.name,
        villageName: member.capitalVillageName || `${member.name} Payitaht`,
        umaykutLevel: lvl,
        isCompleted: lvl >= REQUIRED_UMAYKUT_LEVEL || !!member.hasLevel10Umaykut,
      };
    }

    // Bu beylikten ittifakta henüz üye yok
    return {
      factionId: factionKey,
      factionName: factionDef?.name || factionKey,
      crestIcon: factionDef?.crestIcon || '🏹',
      hasMemberInAlliance: false,
      memberName: undefined,
      villageName: undefined,
      umaykutLevel: 0,
      isCompleted: false,
    };
  });
}

/**
 * Kaydedilmiş zafer durumunu getirir
 */
export function getStoredVictoryState(): VictoryCheckResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VICTORY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Zafer durumunu localStorage'a yazar
 */
export function setStoredVictoryState(state: VictoryCheckResult | null): void {
  try {
    if (!state) {
      localStorage.removeItem(STORAGE_KEY_VICTORY);
    } else {
      localStorage.setItem(STORAGE_KEY_VICTORY, JSON.stringify(state));
    }
  } catch {
    // ignore
  }
}
