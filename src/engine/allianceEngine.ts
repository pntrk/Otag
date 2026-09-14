/**
 * Umaykut Online - İttifak (Birlik) ve Okul Kapasite Motoru
 * 
 * Kural: Bir birliğin azami oyuncu kapasitesi, üyelerinin köylerindeki Okul (Medrese)
 * binalarının toplam seviyesiyle belirlenir. Okul binasının her seviye artışı
 * birliğin oyuncu kapasitesini tam 3 artırır.
 */

import { Alliance, AllianceMember, FactionType, Village } from '../types/game';

// Temel Birlik Sabitleri
export const BASE_ALLIANCE_CAPACITY = 3; // Başlangıç birlik tüzüğü taban kontenjanı
export const CAPACITY_PER_SCHOOL_LEVEL = 3; // Okul binası seviye başına +3 üye kapasitesi

export interface AllianceCapacityInfo {
  baseCapacity: number;
  totalSchoolLevels: number;
  schoolBonusCapacity: number;
  totalCapacity: number;
  currentMembersCount: number;
  remainingSlots: number;
  isFull: boolean;
}

/**
 * Bir köy listesindeki toplam Okul (Medrese) seviyesini hesaplar
 */
export function calculateVillagesSchoolLevels(villages: Village[]): number {
  return villages.reduce((sum, v) => sum + (v.buildings?.school || 0), 0);
}

/**
 * Birliğin azami üye kapasitesini ve mevcut doluluk durumunu hesaplar
 */
export function getAllianceCapacityInfo(
  alliance: Alliance,
  playerVillages: Village[] = []
): AllianceCapacityInfo {
  // Birlik üyelerinin toplam okul seviyesi
  let totalSchoolLevels = 0;

  for (const member of alliance.members) {
    if (member.id === 'player_main' || member.role === 'leader') {
      // Oyuncunun gerçek köylerindeki güncel okul seviyeleri
      const playerSchoolTotal = calculateVillagesSchoolLevels(playerVillages);
      totalSchoolLevels += Math.max(member.schoolLevels || 0, playerSchoolTotal);
    } else {
      totalSchoolLevels += (member.schoolLevels || 0);
    }
  }

  const schoolBonusCapacity = totalSchoolLevels * CAPACITY_PER_SCHOOL_LEVEL;
  const totalCapacity = BASE_ALLIANCE_CAPACITY + schoolBonusCapacity;
  const currentMembersCount = alliance.members.length;
  const remainingSlots = Math.max(0, totalCapacity - currentMembersCount);
  const isFull = currentMembersCount >= totalCapacity;

  return {
    baseCapacity: BASE_ALLIANCE_CAPACITY,
    totalSchoolLevels,
    schoolBonusCapacity,
    totalCapacity,
    currentMembersCount,
    remainingSlots,
    isFull,
  };
}

/**
 * Birlik liderinin yeni üye alıp alamayacağını denetler
 */
export function canRecruitMember(
  alliance: Alliance,
  playerVillages: Village[] = []
): { allowed: boolean; reason?: string; capacityInfo: AllianceCapacityInfo } {
  const capacityInfo = getAllianceCapacityInfo(alliance, playerVillages);

  if (capacityInfo.isFull) {
    return {
      allowed: false,
      reason: `Birlik üye kontenjanı doludur (${capacityInfo.currentMembersCount}/${capacityInfo.totalCapacity})! Yeni üye alabilmek için üyelerinizin köylerindeki Okul (Medrese) binalarının seviyesini yükseltmelisiniz. (Her okul seviyesi +3 üye hakkı sağlar).`,
      capacityInfo,
    };
  }

  return {
    allowed: true,
    capacityInfo,
  };
}

/**
 * Birlik verisini localStorage'dan yükler veya başlangıç ittifakını döner
 */
export const STORAGE_KEY_ALLIANCE = 'umaykut_player_alliance';

export const INITIAL_DEFAULT_ALLIANCE: Alliance = {
  id: 'ally_cihan_fatihleri',
  name: 'Cihan Fatihleri',
  tag: 'FTH',
  leaderId: 'player_main',
  leaderName: 'Barutozap',
  description: 'Anadolu Beyliklerini tek sancak altında birleştirip 10. Seviye Zafer Mabetleriyle Cihan Hâkimiyetini kurmayı hedefleyen kutlu ittifak.',
  createdAt: Date.now() - 86400000 * 7,
  members: [
    {
      id: 'player_main',
      name: 'Barutozap',
      faction: 'osmanogullari',
      role: 'leader',
      totalVillages: 1,
      schoolLevels: 2,
      hasLevel10Umaykut: false,
      umaykutLevel: 0,
      capitalVillageName: 'merkez',
      joinedAt: Date.now() - 86400000 * 7,
    },
    {
      id: 'member_karaman_hakan',
      name: 'Hakan Alp',
      faction: 'karamanogullari',
      role: 'officer',
      totalVillages: 10,
      schoolLevels: 4,
      hasLevel10Umaykut: false,
      umaykutLevel: 6,
      capitalVillageName: 'Konya Hisarı',
      joinedAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'member_aydin_umurbey',
      name: 'Umur Gazi',
      faction: 'aydinogullari',
      role: 'member',
      totalVillages: 10,
      schoolLevels: 3,
      hasLevel10Umaykut: false,
      umaykutLevel: 5,
      capitalVillageName: 'Birgi Payitaht',
      joinedAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'member_candar_ismail',
      name: 'İsmail Bey',
      faction: 'candarogullari',
      role: 'member',
      totalVillages: 8,
      schoolLevels: 3,
      hasLevel10Umaykut: false,
      umaykutLevel: 2,
      capitalVillageName: 'Kastamonu Otağ',
      joinedAt: Date.now() - 86400000 * 2,
    },
  ],
};

/**
 * Kayıtlı birliği getirir
 */
export function loadPlayerAlliance(): Alliance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALLIANCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.members && parsed.members.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error
  }
  return INITIAL_DEFAULT_ALLIANCE;
}

/**
 * Birliği localStorage'a kaydeder
 */
export function savePlayerAlliance(alliance: Alliance): void {
  try {
    localStorage.setItem(STORAGE_KEY_ALLIANCE, JSON.stringify(alliance));
  } catch {
    // ignore write error
  }
}

/**
 * Hazır aday oyuncular (Yeni üye alma simülasyonu için)
 */
export const RECRUITABLE_CANDIDATES: Omit<AllianceMember, 'joinedAt'>[] = [
  {
    id: 'cand_dulkadir_korkut',
    name: 'Korkut Bey',
    faction: 'dulkadirogullari',
    role: 'member',
    totalVillages: 10,
    schoolLevels: 5,
    hasLevel10Umaykut: false,
    umaykutLevel: 7,
    capitalVillageName: 'Maraş Otağı',
  },
  {
    id: 'cand_candar_suleyman',
    name: 'Süleyman Paşa',
    faction: 'candarogullari',
    role: 'member',
    totalVillages: 10,
    schoolLevels: 4,
    hasLevel10Umaykut: false,
    umaykutLevel: 4,
    capitalVillageName: 'Sinop Kalesi',
  },
  {
    id: 'cand_osman_turgut',
    name: 'Turgut Alp',
    faction: 'osmanogullari',
    role: 'member',
    totalVillages: 7,
    schoolLevels: 3,
    hasLevel10Umaykut: false,
    umaykutLevel: 1,
    capitalVillageName: 'Söğüt Yaylası',
  },
  {
    id: 'cand_karaman_mehmet',
    name: 'Mehmet Bey',
    faction: 'karamanogullari',
    role: 'member',
    totalVillages: 10,
    schoolLevels: 6,
    hasLevel10Umaykut: false,
    umaykutLevel: 8,
    capitalVillageName: 'Larende Kalesi',
  },
  {
    id: 'cand_aydin_cunepe',
    name: 'Cüneyt Bey',
    faction: 'aydinogullari',
    role: 'member',
    totalVillages: 10,
    schoolLevels: 4,
    hasLevel10Umaykut: false,
    umaykutLevel: 9,
    capitalVillageName: 'Ayasuluk Limanı',
  },
];
