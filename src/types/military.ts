import { Resources, UnitType, Village } from './game';

export type ForgeUpgradeType = 'steel_weapons' | 'chainmail_armor' | 'ram_reinforcement';

export interface ForgeUpgrades {
  steel_weapons: number;   // Seviye 0 - 10: Kademe başı +%4 Taarruz Gücü
  chainmail_armor: number; // Seviye 0 - 10: Kademe başı +%4 Savunma Gücü
  ram_reinforcement: number; // Seviye 0 - 10: Kademe başı +%10 Koçbaşı Sur Yıkma Hızı
}

export interface ForgeResearchQueueItem {
  id: string;
  villageId: string;
  upgradeType: ForgeUpgradeType;
  targetLevel: number;
  startTime: number;
  durationSec: number;
  endTime: number;
}

export interface ForgeUpgradeConfig {
  id: ForgeUpgradeType;
  name: string;
  description: string;
  icon: string;
  image: string;
  bonusPerLevelPct: number;
  maxLevel: number;
  baseCost: Resources;
  costMultiplier: number;
  baseDurationSec: number;
  durationMultiplier: number;
  unitTargetDescription: string;
}

export const FORGE_UPGRADE_CONFIGS: Record<ForgeUpgradeType, ForgeUpgradeConfig> = {
  steel_weapons: {
    id: 'steel_weapons',
    name: 'Çelik Pusatlar',
    description: 'Dökümhanede sertleştirilmiş çelik kılıçlar, mızrak uçları ve gürzlerle tüm askeri birimlerin taarruz gücünü artırır.',
    icon: '⚔️',
    image: '/drawable/kilicli.webp',
    bonusPerLevelPct: 4,
    maxLevel: 10,
    baseCost: { wood: 150, stone: 120, iron: 280, grain: 80, gold: 50 },
    costMultiplier: 1.35,
    baseDurationSec: 35,
    durationMultiplier: 1.25,
    unitTargetDescription: 'Tüm Askeri Birlikler (+%4 Taarruz / Kademe)',
  },
  chainmail_armor: {
    id: 'chainmail_armor',
    name: 'Örme Zırhlar',
    description: 'Halkalı örme çelik zırhlar ve perçinli göğüslüklerle tüm askeri birimlerin piyade ve süvariye karşı savunma gücünü artırır.',
    icon: '🛡️',
    image: '/drawable/mizrakli.webp',
    bonusPerLevelPct: 4,
    maxLevel: 10,
    baseCost: { wood: 120, stone: 220, iron: 300, grain: 70, gold: 60 },
    costMultiplier: 1.35,
    baseDurationSec: 35,
    durationMultiplier: 1.25,
    unitTargetDescription: 'Tüm Askeri Birlikler (+%4 Savunma / Kademe)',
  },
  ram_reinforcement: {
    id: 'ram_reinforcement',
    name: 'Koçbaşı Güçlendirmesi',
    description: 'Koçbaşı (kocbasi.webp) gövdesine çelik kaplama ve demir koç başı takarak sur (Savunma Duvarı) yıkma hızını ve zayıflatma etkisini artırır.',
    icon: '🪵',
    image: '/drawable/kocbasi.webp',
    bonusPerLevelPct: 10,
    maxLevel: 10,
    baseCost: { wood: 320, stone: 180, iron: 240, grain: 90, gold: 40 },
    costMultiplier: 1.30,
    baseDurationSec: 40,
    durationMultiplier: 1.25,
    unitTargetDescription: 'Koçbaşı Birlikleri (+%10 Sur Yıkma Hızı / Kademe)',
  },
};

/**
 * Belirtilen araştırma ve hedef seviye için hammadde maliyetini hesaplar.
 */
export function getForgeUpgradeCost(type: ForgeUpgradeType, targetLevel: number): Resources {
  const cfg = FORGE_UPGRADE_CONFIGS[type];
  if (!cfg) return { wood: 100, stone: 100, iron: 100, grain: 50, gold: 30 };
  const mult = Math.pow(cfg.costMultiplier, Math.max(0, targetLevel - 1));
  return {
    wood: Math.round(cfg.baseCost.wood * mult),
    stone: Math.round(cfg.baseCost.stone * mult),
    iron: Math.round(cfg.baseCost.iron * mult),
    grain: Math.round(cfg.baseCost.grain * mult),
    gold: Math.round(cfg.baseCost.gold * mult),
  };
}

/**
 * Belirtilen araştırma ve hedef seviye için araştırma süresini (saniye) hesaplar.
 * Demirci binasının seviyesi arttıkça araştırma süresi kısalır.
 */
export function getForgeUpgradeDuration(type: ForgeUpgradeType, targetLevel: number, forgeLevel = 1): number {
  const cfg = FORGE_UPGRADE_CONFIGS[type];
  if (!cfg) return 30;
  const mult = Math.pow(cfg.durationMultiplier, Math.max(0, targetLevel - 1));
  const rawSec = cfg.baseDurationSec * mult;
  // Demirci seviyesi indirimi: Her seviye %3 hızlandırır (Maksimum %50 indirim)
  const speedReduction = Math.max(0.5, 1.0 - (Math.max(1, forgeLevel) - 1) * 0.03);
  return Math.max(10, Math.round(rawSec * speedReduction));
}

/**
 * Köyün Demirci yükseltme durumunu güvenli şekilde çeker (Varsayılan 0 seviye)
 */
export function getVillageForgeUpgrades(village?: Village): ForgeUpgrades {
  if (!village) {
    return { steel_weapons: 0, chainmail_armor: 0, ram_reinforcement: 0 };
  }
  return {
    steel_weapons: village.forgeUpgrades?.steel_weapons ?? 0,
    chainmail_armor: village.forgeUpgrades?.chainmail_armor ?? 0,
    ram_reinforcement: village.forgeUpgrades?.ram_reinforcement ?? 0,
  };
}

/**
 * Çelik Pusatlar taarruz çarpanı: Her kademe +%4 (Seviye 10'da +%40 taarruz gücü)
 */
export function getForgeAttackMultiplier(forgeUpgrades?: ForgeUpgrades): number {
  const level = Math.min(10, Math.max(0, forgeUpgrades?.steel_weapons ?? 0));
  return 1.0 + level * 0.04;
}

/**
 * Örme Zırhlar savunma çarpanı: Her kademe +%4 (Seviye 10'da +%40 savunma gücü)
 */
export function getForgeDefenseMultiplier(forgeUpgrades?: ForgeUpgrades): number {
  const level = Math.min(10, Math.max(0, forgeUpgrades?.chainmail_armor ?? 0));
  return 1.0 + level * 0.04;
}

/**
 * Koçbaşı Güçlendirmesi sur yıkım çarpanı: Her kademe +%10 (Seviye 10'da +%100 sur yıkma hızı)
 */
export function getForgeRamMultiplier(forgeUpgrades?: ForgeUpgrades): number {
  const level = Math.min(10, Math.max(0, forgeUpgrades?.ram_reinforcement ?? 0));
  return 1.0 + level * 0.10;
}
