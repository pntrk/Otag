import { DivanPetition, HorseBreed, MarketBargain, ImperialQuest } from '../types/divanTypes';

export const DIVAN_PETITIONS: DivanPetition[] = [
  {
    id: 'divan_caravan_escort',
    title: 'İpek Yolu Kervansaray Fermanı',
    category: 'ekonomi',
    petitionerName: 'Defterdar Kemal Paşa',
    petitionerTitle: 'Hazine ve Maliye Nazırı',
    avatarIcon: '📜',
    description: 'Tebriz ve Semerkant\'tan gelen ipek kervanları, uç beyliklerindeki eşkıya baskınlarından muzdarip. Hazineye ilave akçe kazandırmak için kervan güvenliğini sağlamamızı arz ederler.',
    choices: [
      {
        id: 'escort_send',
        text: 'Akıncı Muhafızları Görevlendir (200 Erzak)',
        cost: { grain: 200 },
        rewardDescription: 'Kervanlar güvenle varır; +1.200 Altın Akçe ve 1 saat boyunca +%15 Vergi Geliri.',
        buff: {
          name: 'İpek Yolu Ticaret Bereketi',
          description: 'Hazineye saatlik altın akışı %15 artar.',
          durationMinutes: 60,
          type: 'tax',
          valuePercent: 15
        },
        instantReward: { gold: 1200, kudret: 250 }
      },
      {
        id: 'caravan_levy',
        text: 'Kervan Harcını Düşür ve Serbest Geçiş Tanı',
        rewardDescription: 'Pazar tüccarları canlanır; +1.500 Odun ve +1.500 Taş bağışlanır.',
        instantReward: { wood: 1500, stone: 1500, kudret: 150 }
      }
    ]
  },
  {
    id: 'divan_steppe_horses',
    title: 'Bozkır Harası ve Cins At Yetiştiriciliği',
    category: 'askeri',
    petitionerName: 'Mirahur İlyas Bey',
    petitionerTitle: 'Has Ahır Emiri',
    avatarIcon: '🐎',
    description: 'Bozkırın yiğit at yetiştiricileri, ordumuzun süvarileri için 10 baş cins Türkmen atını hümayun ahırına hediye etmek ister. Karşılığında yaylak otlaklarının tahsisini niyaz ederler.',
    choices: [
      {
        id: 'accept_horses',
        text: 'Otlakları Tahsis Et ve Atları Kabul Et',
        rewardDescription: '+10 Savaş Atı ve 45 dakika boyunca orduların intikal hızına +%20 Bozkır Rüzgarı buffı.',
        buff: {
          name: 'Bozkır Rüzgarı',
          description: 'Tüm seferler ve akın birlikleri %20 daha hızlı intikal eder.',
          durationMinutes: 45,
          type: 'march_speed',
          valuePercent: 20
        },
        instantReward: { horses: 10, kudret: 400 }
      },
      {
        id: 'train_infantry',
        text: 'Otlakları Çiftçilere Bırak ve Zahireyi Artır',
        rewardDescription: 'Tahıl hasadı bereketlenir; +3.000 Tahıl Erzak ambarlara doldurulur.',
        instantReward: { grain: 3000, kudret: 150 }
      }
    ]
  },
  {
    id: 'divan_blacksmith_steel',
    title: 'Şam Çeliği ve Pusatların Dövülmesi',
    category: 'askeri',
    petitionerName: 'Demirci Başı Gökbörü',
    petitionerTitle: 'Ocak Başı Usta',
    avatarIcon: '🔨',
    description: 'Demir ocaklarımızda dövülen kılıç ve temrenlerin su verilmesinde kadim bozkır tekniği uygulanmak istenir. Kaliteli kömür ve dövme demir tahsis edilirse ordunun silahları bileylenecektir.',
    choices: [
      {
        id: 'forge_steel',
        text: 'Demir ve Odun Tahsis Et (500 Odun, 500 Demir)',
        cost: { wood: 500, iron: 500 },
        rewardDescription: 'Tüm birliklerin saldırı kudreti 60 dakika boyunca +%15 artar.',
        buff: {
          name: 'Kutlu Çelik Keskinliği',
          description: 'Ordunun taarruz ve akın gücü %15 artar.',
          durationMinutes: 60,
          type: 'attack',
          valuePercent: 15
        },
        instantReward: { gold: 500, kudret: 350 }
      },
      {
        id: 'forge_shields',
        text: 'Sur Tahkimatlarına ve Kalkanlara Öncelik Ver',
        rewardDescription: 'Garnizon savunması 60 dakika boyunca +%20 güçlenir.',
        buff: {
          name: 'Tunç Kalkan Duvarı',
          description: 'Köy savunması ve garnizon dayanıklılığı %20 artar.',
          durationMinutes: 60,
          type: 'defense',
          valuePercent: 20
        },
        instantReward: { stone: 1000, kudret: 200 }
      }
    ]
  },
  {
    id: 'divan_harvest_festival',
    title: 'Ulu Kurultay ve Bozkır Toyu Fermanı',
    category: 'halk',
    petitionerName: 'Ulu Hatun & Aksakallılar Heyeti',
    petitionerTitle: 'Boy Temsilcileri',
    avatarIcon: '🎪',
    description: 'Halkımız son zaferleri ve bereketli hasadı kutlamak için meydanda toy kurulmasını, kazanların kaynatılmasını talep etmektedir. Toy kurmak halkın ve askerlerin gayretini şahlandıracaktır.',
    choices: [
      {
        id: 'hold_festival',
        text: 'Toy Kurulsun, Kımız ve Aş Dağıtılsın (800 Tahıl, 400 Altın)',
        cost: { grain: 800, gold: 400 },
        rewardDescription: '2 saat boyunca tüm maden ve tarla üretimi +%25 bereketlenir, +500 Kudret.',
        buff: {
          name: 'Kutlu Toy Bereketi',
          description: 'Tüm hammaddelerin saatlik üretimi %25 artar.',
          durationMinutes: 120,
          type: 'production',
          valuePercent: 25
        },
        instantReward: { kudret: 500 }
      },
      {
        id: 'frugal_celebration',
        text: 'Yalnızca Askerlere Bahşiş Dağıtılsın',
        rewardDescription: 'Kışla morali yükselir; +800 Demir ve +800 Taş kazanılır.',
        instantReward: { iron: 800, stone: 800, kudret: 150 }
      }
    ]
  }
];

export const HORSE_BREEDS: HorseBreed[] = [
  {
    id: 'bozkir_kosucusu',
    name: 'Bozkır Koşucusu',
    title: 'Çevik Göçebe Atı',
    origin: 'Altay Yaylaları',
    costGold: 250,
    costGrain: 400,
    speedBonusPercent: 10,
    cavalryAttackBonus: 5,
    image: '🐎',
    description: 'Zorlu bozkır iklimine son derece dayanıklı, az su ve yemle günlerce yol alabilen asil göçebe biniti.'
  },
  {
    id: 'karabag_ati',
    name: 'Karabağ Atı',
    title: 'Ceylan Asaleti',
    origin: 'Kafkas Dağları',
    costGold: 600,
    costGrain: 800,
    speedBonusPercent: 18,
    cavalryAttackBonus: 12,
    image: '🎠',
    description: 'Yüksek dağ geçitlerinde dahi sendeletmeyen ayakları ve çevik dönüş kabiliyetiyle ünlü akıncı atı.'
  },
  {
    id: 'akhal_teke',
    name: 'Akhal-Teke (Gök Atı)',
    title: 'Altın Yeleli Hakan Atı',
    origin: 'Karakum Çölü',
    costGold: 1200,
    costGrain: 1500,
    speedBonusPercent: 25,
    cavalryAttackBonus: 20,
    image: '✨🐎',
    description: 'Güneşte altın gibi parıldayan tüyleri, rüzgara meydan okuyan hızıyla hakanların ve komutanların gözdesi.'
  },
  {
    id: 'turkmen_yagizi',
    name: 'Türkmen Yağızı',
    title: 'Ağır Zırhlı Cenk Atı',
    origin: 'Merv / Horasan',
    costGold: 900,
    costGrain: 1200,
    speedBonusPercent: 12,
    cavalryAttackBonus: 28,
    image: '🛡️🐎',
    description: 'Zırhlı sipahileri ve mızrak darbelerini rahatlıkla taşıyan, düşman saflarını yarabilen heybetli cenk atı.'
  }
];

export const INITIAL_MARKET_BARGAINS: MarketBargain[] = [
  {
    id: 'bargain_wood_pack',
    title: 'Ormancı Loncası Kereste Sevkiyatı',
    gives: { wood: 5000 },
    costs: { gold: 350 },
    discountPercent: 30,
    stock: 3
  },
  {
    id: 'bargain_iron_reserve',
    title: 'Tavrida Dövme Demir Külçeleri',
    gives: { iron: 4000 },
    costs: { grain: 3000 },
    discountPercent: 25,
    stock: 2
  },
  {
    id: 'bargain_steed_duo',
    title: 'Cins Bozkır Atı Çiftliği Çifti',
    gives: { horses: 2 },
    costs: { gold: 400, grain: 600 },
    discountPercent: 20,
    stock: 4
  },
  {
    id: 'bargain_stone_caravan',
    title: 'Yontma Kale Taşı Kervanı',
    gives: { stone: 6000 },
    costs: { wood: 3500 },
    discountPercent: 35,
    stock: 2
  }
];

export const INITIAL_IMPERIAL_QUESTS: ImperialQuest[] = [
  {
    id: 'quest_th_lvl',
    chapter: 1,
    title: 'Payitahtı Yükselt',
    description: 'Şehir Merkezini (Otağ) Seviye 3 veya üzerine yükselt.',
    targetType: 'building_level',
    targetKey: 'town_hall',
    targetCount: 3,
    currentCount: 1,
    isCompleted: false,
    isClaimed: false,
    reward: {
      resources: { wood: 1000, stone: 1000, iron: 800, grain: 1200, gold: 500 },
      kudret: 450,
      title: 'Kutlu Bey'
    },
    navigationTab: 'village',
    navigationBuilding: 'town_hall'
  },
  {
    id: 'quest_divan_decree',
    chapter: 1,
    title: 'Divan-ı Hümayun Fermanı İmzala',
    description: 'Divan Olaylarına katıl ve devletin bekası için bir ferman onaylayarak halkı ve orduyu sevindir.',
    targetType: 'divan_decree',
    targetCount: 1,
    currentCount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: {
      resources: { gold: 800, grain: 1500 },
      kudret: 350
    },
    navigationTab: 'divan'
  },
  {
    id: 'quest_horse_bazaar',
    chapter: 1,
    title: 'At Pazarı Ziyareti',
    description: 'Kraliyet Pazarı bünyesindeki At Pazarından ordun için en az 1 cins bozkır savaş atı temin et.',
    targetType: 'horse_purchase',
    targetCount: 1,
    currentCount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: {
      resources: { gold: 600, iron: 1000 },
      kudret: 400
    },
    navigationTab: 'market'
  },
  {
    id: 'quest_train_army',
    chapter: 2,
    title: 'Bozkır Akıncıları Yetiştir',
    description: 'Kışla veya ahırda en az 25 hafif süvari veya akıncı birliğini talim ettir.',
    targetType: 'train_units',
    targetCount: 25,
    currentCount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: {
      resources: { wood: 2000, iron: 2000, grain: 2500 },
      kudret: 800,
      title: 'Akıncı Beyi'
    },
    navigationTab: 'military'
  },
  {
    id: 'quest_trade_market',
    chapter: 2,
    title: 'Kraliyet Pazarında Ticaret',
    description: 'Pazarda hammadde takası gerçekleştirerek kervansaray çarklarını döndür.',
    targetType: 'market_trade',
    targetCount: 1,
    currentCount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: {
      resources: { gold: 1000, wood: 1500 },
      kudret: 300
    },
    navigationTab: 'market'
  }
];
