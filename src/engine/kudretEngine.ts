import { Village, KhanHero, UnitType } from '../types/game';
import { LeaderboardEntry } from '../types/divanTypes';
import { UNITS } from '../data/gameData';

export function calculatePlayerKudret(villages: Village[], khan?: KhanHero): number {
  let totalKudret = 0;

  // 1. Köy Binalarından Gelen Kudret (Her bina seviyesi ~150 - 500 Kudret)
  for (const v of villages) {
    for (const [bType, level] of Object.entries(v.buildings || {})) {
      if (typeof level === 'number' && level > 0) {
        const buildingWeight = bType === 'town_hall' || bType === 'umaykut' ? 500 : bType === 'barracks' || bType === 'stables' ? 350 : 200;
        totalKudret += level * buildingWeight;
      }
    }

    // 2. Ordulardan Gelen Kudret (Her askerin gücü)
    for (const [uType, count] of Object.entries(v.units || {})) {
      if (typeof count === 'number' && count > 0) {
        const uDef = UNITS[uType as UnitType];
        const unitPower = uDef ? (uDef.attackPower * 2 + uDef.defenseInfantry + uDef.defenseCavalry) : 10;
        totalKudret += Math.round(count * (unitPower / 8));
      }
    }

    // 3. At Varlığı (Her savaş atı 40 Kudret)
    if (v.horses && v.horses > 0) {
      totalKudret += v.horses * 40;
    }

    // 4. Demirci Ocağı Talimleri & Araştırmaları
    if (v.forgeUpgrades) {
      totalKudret += (v.forgeUpgrades.steel_weapons || 0) * 450;
      totalKudret += (v.forgeUpgrades.chainmail_armor || 0) * 450;
      totalKudret += (v.forgeUpgrades.ram_reinforcement || 0) * 600;
    }
  }

  // 5. Hakan Kahramanı (Seviye ve Beceriler)
  if (khan) {
    totalKudret += khan.level * 1200;
    const totalSkills = (khan.skills.attackAura || 0) + (khan.skills.defenseAura || 0) + 
                        (khan.skills.cavalrySpeed || 0) + (khan.skills.governance || 0);
    totalKudret += totalSkills * 350;
  }

  return Math.max(1500, totalKudret);
}

export function getGaziRank(kudret: number): { level: number; title: string; buffText: string } {
  if (kudret >= 250000) return { level: 6, title: 'Büyük Cihan Hakanı', buffText: '+25% Tüm Gelir & Sefer Hızı' };
  if (kudret >= 120000) return { level: 5, title: 'Kudretli Sultan', buffText: '+20% Tüm Gelir & Sefer Hızı' };
  if (kudret >= 60000) return { level: 4, title: 'Ulu Melik', buffText: '+15% Üretim' };
  if (kudret >= 30000) return { level: 3, title: 'Gazi Bey', buffText: '+10% Üretim' };
  if (kudret >= 10000) return { level: 2, title: 'Sancakbeyi', buffText: '+5% Üretim' };
  return { level: 1, title: 'Alp Başı', buffText: 'Temel Kademe' };
}

export function generateLeaderboard(playerKudret: number, playerName: string, playerFaction: string, playerVillageCount: number): LeaderboardEntry[] {
  const baseCompetitors: Omit<LeaderboardEntry, 'rank' | 'isPlayer'>[] = [
    {
      id: 'rival_alp_arslan',
      name: 'Sultan Alparslan',
      title: 'Büyük Selçuklu Hükümdarı',
      faction: 'osmanogullari',
      kudret: 184500,
      villageCount: 8,
      victoryPoints: 3420,
      avatar: '👑'
    },
    {
      id: 'rival_bilge_kagan',
      name: 'Bilge Kağan',
      title: 'Göktürk Ulu Şad',
      faction: 'karamanogullari',
      kudret: 142000,
      villageCount: 6,
      victoryPoints: 2890,
      avatar: '🦅'
    },
    {
      id: 'rival_ertugrul',
      name: 'Ertuğrul Gazi',
      title: 'Kayı Boyu Lideri',
      faction: 'osmanogullari',
      kudret: 98000,
      villageCount: 5,
      victoryPoints: 2150,
      avatar: '⚔️'
    },
    {
      id: 'rival_karaman_mehmet',
      name: 'Karamanoğlu Mehmet Bey',
      title: 'Konya Fatihi',
      faction: 'karamanogullari',
      kudret: 84000,
      villageCount: 4,
      victoryPoints: 1720,
      avatar: '🛡️'
    },
    {
      id: 'rival_yakup_bey',
      name: 'Germiyanoğlu I. Yakup',
      title: 'Kütahya Hükümdarı',
      faction: 'germiyanogullari',
      kudret: 67500,
      villageCount: 3,
      victoryPoints: 1350,
      avatar: '🐎'
    },
    {
      id: 'rival_candar_suleyman',
      name: 'Candaroğlu Süleyman Paşa',
      title: 'Kastamonu Emiri',
      faction: 'candarogullari',
      kudret: 42000,
      villageCount: 2,
      victoryPoints: 910,
      avatar: '🏹'
    },
    {
      id: 'rival_aladdin_keykubat',
      name: 'I. Alâeddin Keykubad',
      title: 'Rum Selçuklu Sultanı',
      faction: 'osmanogullari',
      kudret: 115000,
      villageCount: 5,
      victoryPoints: 2540,
      avatar: '🕌'
    },
    {
      id: 'rival_baybars',
      name: 'Sultan Baybars',
      title: 'Kıpçak Aslanı',
      faction: 'dulkadirogullari',
      kudret: 136000,
      villageCount: 6,
      victoryPoints: 2780,
      avatar: '🗡️'
    }
  ];

  const playerEntry: Omit<LeaderboardEntry, 'rank'> = {
    id: 'player_entry',
    name: playerName || 'Hükümdar',
    title: 'Gazi Beylik Lideri',
    faction: (playerFaction as any) || 'osmanogullari',
    kudret: playerKudret,
    villageCount: playerVillageCount,
    victoryPoints: Math.round(playerKudret / 40) + playerVillageCount * 250,
    avatar: '🌟',
    isPlayer: true
  };

  const allEntries = [...baseCompetitors, playerEntry];
  allEntries.sort((a, b) => b.kudret - a.kudret);

  return allEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
}
