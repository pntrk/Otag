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
  baseAttack: number;          // Saldırı Gücü (0 - 100)
  attackInfantry?: number;     // Geriye uyumluluk için
  attackCavalry?: number;      // Geriye uyumluluk için
  baseDefenseInfantry: number; // Piyade Savunması (0 - 100)
  baseDefenseCavalry: number;  // Süvari Savunması (0 - 100)
  totalPoints?: number;       // Toplam Puan
  speedScore: number;         // Hız Puanı (0 - 100)
  plunderScore: number;       // Ganimet / Yağma Puanı (0 - 100)
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
  description: 'Söğüt ve Domaniç uç bölgesinde gaza ruhuyla parlayan; yıldırım intikal süratine ve akın kabiliyetine odaklanan, sefer hızıyla düşmanı gafil avlayan beylik.',
  unit: {
    id: 'akinci',
    name: 'Akıncı',
    image: '/drawable/akinci.webp',
    role: 'Yıldırım Sefer & Akın Süvarisi',
    category: 'suvari',
    description: 'Efsanevi sefer sürati ve yüksek ganimet heybeleriyle düşman köylerini yıldırım hızıyla vuran uç süvarileri (70 Saldırı, 55 Piyade Sav., 70 Süvari Sav., 95 Hız, 90 Ganimet).',
    baseAttack: 70,
    attackInfantry: 70,
    attackCavalry: 70,
    baseDefenseInfantry: 55,
    baseDefenseCavalry: 70,
    totalPoints: 380,
    speedScore: 95, // Süvari: Yıldırım intikal (Oyunun en hızlısı)
    plunderScore: 90, // Uç akını ve yüksek ganimet
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
    flagImage: '/assets/flags/karaman.webp?v=2',
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
      description: 'Saldırı ağırlıklı donatılmış, yalman kılıçlarıyla ön saflarda düşman hatlarını ezen çelik zırhlı ağır taarruz alpleri (95 Saldırı, 60 Piyade Sav., 55 Süvari Sav., 60 Hız, 70 Ganimet). Saf taarruz gücünde rakipsizdir.',
      baseAttack: 95,
      attackInfantry: 95,
      attackCavalry: 95,
      baseDefenseInfantry: 60,
      baseDefenseCavalry: 55,
      totalPoints: 340,
      speedScore: 60, // Piyade: Yalman Kılıçlı Taarruz Alpi
      plunderScore: 70, // Ordugah & Çadır Yağması
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
    flagImage: '/assets/flags/germiyan.webp?v=2',
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
      description: 'Aşılmaz kalkanları ve kargılarıyla kale kapılarını savunan, süvari taarruzlarını durduran müdafaa neferleri (50 Saldırı, 95 Piyade Sav., 95 Süvari Sav., 45 Hız, 65 Ganimet). Şehir savunmasında rakipsizdir.',
      baseAttack: 50,
      attackInfantry: 50,
      attackCavalry: 50,
      baseDefenseInfantry: 95,
      baseDefenseCavalry: 95,
      totalPoints: 350,
      speedScore: 45, // Piyade: Ağır Kalkanlı Sur Muhafızı
      plunderScore: 65, // Savunma Eri & Ambar Yükü
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
      role: 'Zırhlı Atlı Savunma & Yayla Muhafızı',
      category: 'suvari',
      description: 'Zırhlı atları ve menzilli ok atışlarıyla açık sahada ve siperlerde düşman taarruzlarını kıran savunma süvarileri (65 Saldırı, 85 Piyade Sav., 80 Süvari Sav., 80 Hız, 40 Ganimet). Atlı savunmada rakipsizdir.',
      baseAttack: 65,
      attackInfantry: 65,
      attackCavalry: 65,
      baseDefenseInfantry: 85,
      baseDefenseCavalry: 80,
      totalPoints: 350,
      speedScore: 80, // Süvari: Zırhlı Toros Atlısı
      plunderScore: 40, // Yayla Akın Yükü
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
      role: 'Ağır Baltacı, Kuşatma & Mutlak Ganimet',
      category: 'piyade',
      description: 'Çift ağızlı ağır madenci baltalarıyla kapıları parçalayan ve ambarları boşaltan zırh delici taarruz birliği (90 Saldırı, 60 Piyade Sav., 50 Süvari Sav., 50 Hız, 100 Ganimet). Ganimet taşımada rakipsizdir.',
      baseAttack: 90,
      attackInfantry: 90,
      attackCavalry: 90,
      baseDefenseInfantry: 60,
      baseDefenseCavalry: 50,
      totalPoints: 350,
      speedScore: 50, // Piyade: Madenci Ağır Baltacısı
      plunderScore: 100, // Oyunun en yüksek ganimet kapasitesi
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
  BEYLIKLER.karaman,
  BEYLIKLER.candar,
  BEYLIKLER.osmanogullari,
  BEYLIKLER.germiyan,
  BEYLIKLER.dulkadir,
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
