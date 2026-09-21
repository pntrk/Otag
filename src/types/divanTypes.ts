import { Resources, UnitType, FactionId } from './game';

export interface DivanPetition {
  id: string;
  title: string;
  category: 'ekonomi' | 'askeri' | 'diplomasi' | 'halk';
  petitionerName: string;
  petitionerTitle: string;
  avatarIcon: string;
  description: string;
  choices: {
    id: string;
    text: string;
    cost?: Partial<Resources>;
    rewardDescription: string;
    buff?: {
      name: string;
      description: string;
      durationMinutes: number;
      type: 'production' | 'march_speed' | 'defense' | 'attack' | 'tax';
      valuePercent: number;
    };
    instantReward?: Partial<Resources> & { kudret?: number; horses?: number };
  }[];
}

export interface ActiveDivanBuff {
  id: string;
  name: string;
  description: string;
  type: 'production' | 'march_speed' | 'defense' | 'attack' | 'tax';
  valuePercent: number;
  expiresAt: number;
}

export interface HorseBreed {
  id: string;
  name: string;
  title: string;
  origin: string;
  costGold: number;
  costGrain: number;
  speedBonusPercent: number;
  cavalryAttackBonus: number;
  image: string;
  description: string;
}

export interface MarketBargain {
  id: string;
  title: string;
  gives: Partial<Resources> & { horses?: number; speedBoostMin?: number };
  costs: Partial<Resources>;
  discountPercent: number;
  stock: number;
}

export interface WoundedSoldierGroup {
  unitType: UnitType;
  count: number;
  grainHealCostPerUnit: number;
  goldHealCostPerUnit: number;
  healDurationSecPerUnit: number;
}

export interface ImperialQuest {
  id: string;
  chapter: number;
  title: string;
  description: string;
  targetType: 'building_level' | 'train_units' | 'divan_decree' | 'market_trade' | 'conquer_node' | 'hero_level' | 'horse_purchase';
  targetKey?: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
  reward: {
    resources: Partial<Resources>;
    kudret: number;
    title?: string;
  };
  navigationTab?: 'village' | 'map' | 'military' | 'market' | 'divan' | 'ranking' | 'reports';
  navigationBuilding?: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  title: string;
  faction: FactionId;
  kudret: number;
  villageCount: number;
  victoryPoints: number;
  avatar: string;
  isPlayer?: boolean;
}
