import { UNITS } from '../data/gameData';
import { UnitType } from '../types/game';

export function calculateReviveCost(level: number) {
  return {
    grain: level * 400,
    gold: level * 250
  };
}

export function calculateReviveDurationSec(level: number) {
  // 100x Hızlandırma (minimum 2 saniye)
  return Math.max(2, Math.round((level * 180) / 100));
}

export function calculateNextLevelXp(level: number) {
  return Math.floor(800 * Math.pow(level, 1.6));
}

export function calculateBattleXp(destroyedUnits: Partial<Record<UnitType, number>>) {
  let totalResourceCost = 0;
  for (const [uType, count] of Object.entries(destroyedUnits)) {
    if (!count) continue;
    const cost = UNITS[uType as UnitType].cost;
    totalResourceCost += (cost.wood + cost.stone + cost.iron + cost.grain + cost.gold) * count;
  }
  return Math.floor(totalResourceCost * 0.10); // 10% of total resource cost
}
