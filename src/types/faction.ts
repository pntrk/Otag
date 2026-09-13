/**
 * 13. Yüzyıl Anadolu Beylikleri - 5 Ana Beylik, Özel Birim Görselleri & Bonus Sistemi
 * 
 * Görsel Eşleştirmeleri:
 * 1. Osmanoğulları -> /drawable/akinci.webp (Osmanlı Akıncısı) - +%15 Sefer Hızı, Dengeli İktisat
 * 2. Karaman -> /drawable/alp.webp (Karamanoğlu Alpi) - +%20 Taarruz Gücü
 * 3. Germiyan -> /drawable/mizrakli.webp (Germiyan Muhafızı) - +%25 Savunma ve Sur Dayanıklılığı
 * 4. Dulkadir -> /drawable/bozok_suvarisi.webp (Bozok Süvarisi) - +%20 Ekin/Tahıl Üretimi & At İaşe İndirimi
 * 5. Candar   -> /drawable/kure_baltacisi.webp (Küre Baltacısı) - +%20 Demir/Taş Üretimi & Kuşatma Gücü
 */

export type FactionKey = 'osmanogullari' | 'karaman' | 'germiyan' | 'dulkadir' | 'candar' | 'kayi';

export type AnyFactionId = 
  | FactionKey
  | 'karamanogullari'
  | 'germiyanogullari'
  | 'aydinogullari'
  | 'osmanogullari'
  | 'candarogullari'
  | 'dulkadirogullari'
  | 'osman';

export interface FactionUnit {
  id: string;
  name: string;
  image: string;
  role: string;
  category: 'piyade' | 'suvari' | 'kusatma';
  description: string;
  baseAttack: number;
  attackInfantry: number;     // Piyade Saldırısı
  attackCavalry: number;      // Süvari Saldırısı
  baseDefenseInfantry: number; // Piyade Savunması
  baseDefenseCavalry: number;  // Süvari Savunması
  totalPoints: number;        // Toplam 4 Unsur Puanı (Özel Birimler için tam 300)
}

export interface FactionBonus {
  attackMultiplier: number;
  attackBonusPct: number;
  defenseMultiplier: number;
  defenseBonusPct: number;
  wallDefenseMultiplier: number;
  wallDefenseBonusPct: number;
  marchSpeedMultiplier: number;
  marchSpeedBonusPct: number;
  grainProductionMultiplier: number;
  grainBonusPct: number;
  cavalryUpkeepDiscount: number;
  cavalryUpkeepDiscountPct: number;
  ironProductionMultiplier: number;
  ironBonusPct: number;
  stoneProductionMultiplier: number;
  stoneBonusPct: number;
  siegePowerMultiplier: number;
  siegePowerBonusPct: number;
  summary: string;
  badge: string;
  details: string[];
}

export interface BeylikDefinition {
  id: FactionKey;
  legacyId: string;
  name: string;
  shortName: string;
  title: string;
  leader: string;
  capital: string;
  crestIcon: string;
  flagImage: string;
  color: string;
  accentColor: string;
  bgGradient: string;
  bannerBorder: string;
  crestBg: string;
  badge: string;
  description: string;
  unit: FactionUnit;
  bonus: FactionBonus;
}

export const OSMANOGULLARI_BEYLIK: BeylikDefinition = {
  id: 'osmanogullari',
  legacyId: 'osmanogullari',
  name: 'Osman',
  shortName: 'Osman',
  title: 'Gaza Sancağı & Akıncı Ocağı',
  leader: 'Osman Gazi',
  capital: 'Söğüt',
  crestIcon: '🏹',
  flagImage: '/assets/flags/osman.webp',
  color: '#b91c1c',
  accentColor: 'text-red-400',
  bgGradient: 'from-[#2d1109] via-[#1c0a05] to-[#120503]',
  bannerBorder: 'border-[#b91c1c]',
  crestBg: 'bg-gradient-to-b from-[#8f2415] to-[#450a04] border-[#f87171]',
  badge: '⚖️ Dengeli',
  description: 'Söğüt ve Domaniç uç bölgesinde gaza ruhuyla parlayan; hem saldırıda hem savunmada orta ayarda dengeli muharebe doktrinine ve süratli sefer intikaline sahip beylik.',
  unit: {
    id: 'akinci',
    name: 'Akıncı',
    image: '/drawable/akinci.webp',
    role: 'Dengeli Gaza Süvarisi & Uç Akıncısı',
    category: 'suvari',
    description: 'Hem taarruzda hem savunmada eşit ve dengeli orta ayar güce sahip (150 Saldırı / 150 Savunma), yüksek manevra kabiliyetiyle her çatışmaya uyum sağlayan atlı gaziler.',
    baseAttack: 75,
    attackCavalry: 75,
    attackInfantry: 75,
    baseDefenseCavalry: 75,
    baseDefenseInfantry: 75,
    totalPoints: 300,
  },
  bonus: {
    attackMultiplier: 1.05,
    attackBonusPct: 5,
    defenseMultiplier: 1.05,
    defenseBonusPct: 5,
    wallDefenseMultiplier: 1.05,
    wallDefenseBonusPct: 5,
    marchSpeedMultiplier: 1.15,
    marchSpeedBonusPct: 15,
    grainProductionMultiplier: 1.0,
    grainBonusPct: 0,
    cavalryUpkeepDiscount: 0,
    cavalryUpkeepDiscountPct: 0,
    ironProductionMultiplier: 1.0,
    ironBonusPct: 0,
    stoneProductionMultiplier: 1.0,
    stoneBonusPct: 0,
    siegePowerMultiplier: 1.0,
    siegePowerBonusPct: 0,
    summary: 'Dengeli: +%5 Sal / +%5 Sav, +%15 Hız',
    badge: '⚖️ Dengeli & +%15 Hız',
    details: [
      'Dengeli muharebe doktrini: Hem saldırıda hem savunmada dengeli orta ayar (+%5 Saldırı, +%5 Savunma katkısı)',
      'Tüm taarruz, yağma, destek ve casus intikallerinde +%15 kalıcı sefer hızı',
      'Orta ayarlı dengeli ordu yapısı sayesinde her türlü meydan ve garnizon çatışmasında istikrarlı sonuç'
    ],
  },
};

export const BEYLIKLER: Record<FactionKey, BeylikDefinition> = {
  osmanogullari: OSMANOGULLARI_BEYLIK,
  kayi: OSMANOGULLARI_BEYLIK,

  karaman: {
    id: 'karaman',
    legacyId: 'karamanogullari',
    name: 'Karaman',
    shortName: 'Karaman',
    title: 'Selçuklu Mirasçısı & Nizam-ı Âlem',
    leader: 'Karamanoğlu Mehmed Bey',
    capital: 'Larende (Karaman)',
    crestIcon: '⚔️',
    flagImage: '/assets/flags/karaman.webp',
    color: '#1e3a8a',
    accentColor: 'text-blue-400',
    bgGradient: 'from-[#0d1e38] via-[#081224] to-[#040914]',
    bannerBorder: 'border-[#1e3a8a]',
    crestBg: 'bg-gradient-to-b from-[#1e40af] to-[#0f172a] border-[#60a5fa]',
    badge: '⚔️ Saldırı Ağırlıklı (+%20 Taarruz)',
    description: 'Selçuklu tahtının kudretli varisi. Saldırı ağırlıklı muharebe doktrini, yalman kılıçlı alpleri ve çelik taarruz gücüyle düşman hatlarını yarmakta rakipsiz Orta Anadolu devleti.',
    unit: {
      id: 'karaman_alpi',
      name: 'Alp',
      image: '/drawable/alp.webp',
      role: 'Saldırı Ağırlıklı Kılıçlı Alp',
      category: 'piyade',
      description: 'Saldırı ağırlıklı donatılmış, yalman kılıçlarıyla ön saflarda düşman hatlarını ezen çelik zırhlı ağır taarruz alpleri (190 Saldırı / 110 Savunma).',
      baseAttack: 95,
      attackCavalry: 85,
      attackInfantry: 105,
      baseDefenseCavalry: 50,
      baseDefenseInfantry: 60,
      totalPoints: 300,
    },
    bonus: {
      attackMultiplier: 1.20,
      attackBonusPct: 20,
      defenseMultiplier: 1.0,
      defenseBonusPct: 0,
      wallDefenseMultiplier: 1.0,
      wallDefenseBonusPct: 0,
      marchSpeedMultiplier: 1.0,
      marchSpeedBonusPct: 0,
      grainProductionMultiplier: 1.0,
      grainBonusPct: 0,
      cavalryUpkeepDiscount: 0,
      cavalryUpkeepDiscountPct: 0,
      ironProductionMultiplier: 1.0,
      ironBonusPct: 0,
      stoneProductionMultiplier: 1.0,
      stoneBonusPct: 0,
      siegePowerMultiplier: 1.0,
      siegePowerBonusPct: 0,
      summary: 'Saldırı Ağırlıklı: +%20 Taarruz Gücü, 16 Dk Nüfus',
      badge: '⚔️ Saldırı Ağırlıklı: +%20 Taarruz',
      details: [
        'Saldırı ağırlıklı doktrin: Tüm ordu birliklerine (piyade ve süvari) +%20 doğrudan taarruz hasarı bonusu',
        'Nüfus doğumu 16 dakikada birdir (en hızlı taarruz alpi yetiştirme kabiliyeti)',
        'Meydan muharebelerinde düşman hatlarını daha az zayiatla ezme ve yarma üstünlüğü'
      ],
    },
  },

  germiyan: {
    id: 'germiyan',
    legacyId: 'germiyanogullari',
    name: 'Germiyan',
    shortName: 'Germiyan',
    title: 'Kütahya Muhafızları & Sarsılmaz Hisar',
    leader: 'I. Yakub Bey',
    capital: 'Kütahya',
    crestIcon: '🛡️',
    flagImage: '/assets/flags/germiyan.webp',
    color: '#059669',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-[#0a2618] via-[#05170e] to-[#020b07]',
    bannerBorder: 'border-[#059669]',
    crestBg: 'bg-gradient-to-b from-[#047857] to-[#064e3b] border-[#34d399]',
    badge: '🛡️ Savunma Ağırlıklı (+%25 Savunma)',
    description: 'Kütahya Kalesi ve dik yamaçlı hisarlarla batı sınırlarını tutan, savunma ağırlıklı aşılmaz kalkan duvarları ve sur tahkimatıyla tanınan beylik.',
    unit: {
      id: 'tura',
      name: 'Tura',
      image: '/drawable/mizrakli.webp',
      role: 'Savunma Ağırlıklı Tura & Sur Muhafızı',
      category: 'piyade',
      description: 'Savunma ağırlıklı uzun kargıları ve devasa kalkanlarıyla süvari hücumlarını durduran, kale kapılarını canı pahasına savunan aşılmaz müdafaa birliği (90 Saldırı / 210 Savunma).',
      baseAttack: 45,
      attackCavalry: 45,
      attackInfantry: 45,
      baseDefenseCavalry: 115,
      baseDefenseInfantry: 95,
      totalPoints: 300,
    },
    bonus: {
      attackMultiplier: 1.0,
      attackBonusPct: 0,
      defenseMultiplier: 1.25,
      defenseBonusPct: 25,
      wallDefenseMultiplier: 1.25,
      wallDefenseBonusPct: 25,
      marchSpeedMultiplier: 1.0,
      marchSpeedBonusPct: 0,
      grainProductionMultiplier: 1.0,
      grainBonusPct: 0,
      cavalryUpkeepDiscount: 0,
      cavalryUpkeepDiscountPct: 0,
      ironProductionMultiplier: 1.0,
      ironBonusPct: 0,
      stoneProductionMultiplier: 1.0,
      stoneBonusPct: 0,
      siegePowerMultiplier: 1.0,
      siegePowerBonusPct: 0,
      summary: 'Savunma Ağırlıklı: +%25 Savunma ve Sur Dayanıklılığı',
      badge: '🛡️ Savunma Ağırlıklı: +%25 Savunma',
      details: [
        'Savunma ağırlıklı doktrin: Köy garnizonundaki tüm savunma birliklerine +%25 savunma direnci',
        'Sur tahkimatlarına +%25 ekstra dayanıklılık ve savunma çarpanı',
        'Düşman koçbaşı ve taarruz hücumlarına karşı köyü aşılmaz bir kaleye dönüştürür'
      ],
    },
  },

  dulkadir: {
    id: 'dulkadir',
    legacyId: 'dulkadirogullari',
    name: 'Dulkadir',
    shortName: 'Dulkadir',
    title: 'Toros Yaylacıları & Bozok Süvarileri',
    leader: 'Zeyneddin Karaca Bey',
    capital: 'Maraş / Elbistan',
    crestIcon: '🏇',
    flagImage: '/assets/flags/dulkadir.webp',
    color: '#6d28d9',
    accentColor: 'text-purple-400',
    bgGradient: 'from-[#220d3d] via-[#140626] to-[#0a0214]',
    bannerBorder: 'border-[#6d28d9]',
    crestBg: 'bg-gradient-to-b from-[#7c3aed] to-[#4c1d95] border-[#c084fc]',
    badge: '🛡️ Savunma Ağırlıklı (Yayla Siperi & Müdafaa)',
    description: 'Torosların sarp vadilerinde savunma ağırlıklı müdafaa hatları kuran, zengin ekin depoları ve atlı müdafaasıyla düşmanı püskürten beylik.',
    unit: {
      id: 'bozok_suvarisi',
      name: 'Bozok Süvarisi',
      image: '/drawable/bozok_suvarisi.webp',
      role: 'Savunma Ağırlıklı Bozok Atlı Muhafızı',
      category: 'suvari',
      description: 'Savunma ağırlıklı donatılmış, yayla siperlerinde at üstünde menzilli oklama ile düşman taarruzlarını püskürten müdafaa süvarileri (110 Saldırı / 190 Savunma).',
      baseAttack: 55,
      attackCavalry: 55,
      attackInfantry: 55,
      baseDefenseCavalry: 85,
      baseDefenseInfantry: 105,
      totalPoints: 300,
    },
    bonus: {
      attackMultiplier: 1.0,
      attackBonusPct: 0,
      defenseMultiplier: 1.20,
      defenseBonusPct: 20,
      wallDefenseMultiplier: 1.15,
      wallDefenseBonusPct: 15,
      marchSpeedMultiplier: 1.0,
      marchSpeedBonusPct: 0,
      grainProductionMultiplier: 1.20,
      grainBonusPct: 20,
      cavalryUpkeepDiscount: 0.25,
      cavalryUpkeepDiscountPct: 25,
      ironProductionMultiplier: 1.0,
      ironBonusPct: 0,
      stoneProductionMultiplier: 1.0,
      stoneBonusPct: 0,
      siegePowerMultiplier: 1.0,
      siegePowerBonusPct: 0,
      summary: 'Savunma Ağırlıklı: +%20 Savunma, +%20 Tahıl, %25 İaşe',
      badge: '🛡️ Savunma Ağırlıklı: +%20 Savunma & İaşe',
      details: [
        'Savunma ağırlıklı doktrin: Garnizonda ve yayla siperlerinde +%20 müdafaa direnci',
        'Garnizondaki ve seferdeki süvarilerin tahıl iaşe tüketiminde %25 kalıcı tasarruf',
        'Tahıl tarlaları ve değirmenlerden +%20 daha fazla zahire ve ekin üretimi'
      ],
    },
  },

  candar: {
    id: 'candar',
    legacyId: 'candarogullari',
    name: 'Candar',
    shortName: 'Candar',
    title: 'Küre Madencileri & Ağır Baltacılar',
    leader: 'Şemseddin Demir Yaman Candar',
    capital: 'Kastamonu',
    crestIcon: '⛏️',
    flagImage: '/assets/flags/candar.webp',
    color: '#b45309',
    accentColor: 'text-amber-500',
    bgGradient: 'from-[#331806] via-[#1f0e03] to-[#120701]',
    bannerBorder: 'border-[#b45309]',
    crestBg: 'bg-gradient-to-b from-[#d97706] to-[#78350f] border-[#fde68a]',
    badge: '⚔️ Saldırı Ağırlıklı (+%20 Taarruz & Kuşatma)',
    description: 'Küre Dağları\'nın zengin cevherleriyle dövülen çelik baltalarıyla saldırı ağırlıklı muharebe yürüten, sur delen koçbaşları ve ağır taarruz gücüyle nam salmış beylik.',
    unit: {
      id: 'kure_baltacisi',
      name: 'Baltacı',
      image: '/drawable/kure_baltacisi.webp',
      role: 'Saldırı Ağırlıklı Ağır Baltacı & Kuşatma Fedaisi',
      category: 'piyade',
      description: 'Saldırı ağırlıklı çift ağızlı madenci baltalarıyla düşman kalkanlarını parçalayan, zırh delen ağır taarruz neferleri (195 Saldırı / 105 Savunma).',
      baseAttack: 98,
      attackCavalry: 85,
      attackInfantry: 110,
      baseDefenseCavalry: 50,
      baseDefenseInfantry: 55,
      totalPoints: 300,
    },
    bonus: {
      attackMultiplier: 1.20,
      attackBonusPct: 20,
      defenseMultiplier: 1.0,
      defenseBonusPct: 0,
      wallDefenseMultiplier: 1.0,
      wallDefenseBonusPct: 0,
      marchSpeedMultiplier: 0.85,
      marchSpeedBonusPct: -15,
      grainProductionMultiplier: 1.0,
      grainBonusPct: 0,
      cavalryUpkeepDiscount: 0,
      cavalryUpkeepDiscountPct: 0,
      ironProductionMultiplier: 1.20,
      ironBonusPct: 20,
      stoneProductionMultiplier: 1.20,
      stoneBonusPct: 20,
      siegePowerMultiplier: 1.25,
      siegePowerBonusPct: 25,
      summary: 'Saldırı Ağırlıklı: +%20 Taarruz, +%25 Kuşatma',
      badge: '⚔️ Saldırı Ağırlıklı: +%20 Taarruz & Kuşatma',
      details: [
        'Saldırı ağırlıklı doktrin: Zırh delici balta hücumlarıyla orduya +%20 taarruz hasarı',
        'Koçbaşı ve kuşatma taarruzlarında sur tahribatına +%25 ekstra yıkım gücü',
        'Demir madenleri ve taş ocaklarında +%20 sürekli hammadde üretimi'
      ],
    },
  },
};

export const BEYLIK_LIST: BeylikDefinition[] = [
  BEYLIKLER.osmanogullari,
  BEYLIKLER.karaman,
  BEYLIKLER.germiyan,
  BEYLIKLER.dulkadir,
  BEYLIKLER.candar,
];

/**
 * Gelen herhangi bir beylik ismini veya kimliğini standart FactionKey formatına dönüştürür.
 */
export function normalizeFactionKey(faction?: string): FactionKey {
  if (!faction) return 'osmanogullari';
  const f = faction.toLowerCase().trim();
  
  if (f.includes('osman') || f.includes('kayi')) return 'osmanogullari';
  if (f.includes('karaman')) return 'karaman';
  if (f.includes('germiyan')) return 'germiyan';
  if (f.includes('aydin')) return 'germiyan';
  if (f.includes('dulkadir')) return 'dulkadir';
  if (f.includes('candar')) return 'candar';
  
  return 'osmanogullari';
}

/**
 * Beylik ID'sine göre beylik tanımını döndürür.
 */
export function getBeylikDefinition(factionId?: string): BeylikDefinition {
  const key = normalizeFactionKey(factionId);
  return BEYLIKLER[key] || BEYLIKLER.osmanogullari;
}

/**
 * Beylik bonuslarını döndürür.
 */
export function getFactionBonus(factionId?: string): FactionBonus {
  return getBeylikDefinition(factionId).bonus;
}

/**
 * Beyliğin resmi bayrak dosya yolunu (/assets/flags/...) döndürür.
 */
export function getFactionFlagUrl(factionId?: string): string {
  const beylik = getBeylikDefinition(factionId);
  return beylik.flagImage || '/assets/flags/osman.webp';
}
