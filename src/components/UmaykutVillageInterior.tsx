import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March, 
  ResourceNode, 
  ResourceRate, 
  TrainingQueueItem, 
  UnitType, 
  Village 
} from '../types/game';
import { 
  FACTIONS, 
  UNITS,
  BUILDINGS,
  BUILDING_IMAGE_MAP,
  getBuildingImage,
  getCapturedNodesForVillage, 
  getWallDefenseBonus, 
  getHideoutCapacity 
} from '../data/gameData';
import { AutoBuildingSprite } from './AutoBuildingSprite';
import { UmaykutRightPanel } from './UmaykutRightPanel';
import { RightSidebar } from './RightSidebar';
import { UnitCarousel } from './UnitCarousel';
import { UnitPortrait } from './UnitPortrait';
import { ParchmentTooltip } from './ParchmentTooltip';
import { 
  Hammer, 
  Swords, 
  Volume2, 
  VolumeX, 
  Eye,
  Info,
  Sparkles,
  ArrowUpRight,
  Clock,
  ChevronRight
} from 'lucide-react';

interface UmaykutVillageInteriorProps {
  village: Village;
  playerVillages?: Village[];
  onSelectVillage?: (villageId: string) => void;
  nodes: ResourceNode[];
  rates: ResourceRate;
  constructionQueue: ConstructionQueueItem[];
  trainingQueue: TrainingQueueItem[];
  activeMarches?: March[];
  onOpenBuilding: (type: BuildingType) => void;
  onUpgradeBuilding?: (type: BuildingType) => void;
  onAssignBuildingToPlot?: (plotId: string, buildingType: BuildingType) => void;
  onOpenFoundVillageModal?: () => void;
  onOpenFactionModal?: () => void;
  onNavigateToMap: () => void;
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onOpenVictoryPanel?: () => void;
}

// Köy İçi Binaları Tanımı
export interface BuildingPlotConfig {
  id: string;
  baseType: string;
  name: string;
  xPercent: number; // Sol kenardan %
  yPercent: number; // Üst kenardan %
  isGate?: boolean;
}

export const UMAYKUT_BUILDING_PLOTS: BuildingPlotConfig[] = [
  // 1. MERKEZ VE SAVUNMA
  { id: 'town_hall',       baseType: 'town_hall',   name: 'Merkez Otağ',            xPercent: 49.0, yPercent: 48.0 },
  { id: 'plot-wall',       baseType: 'wall',        name: 'Sur Kapısı',             xPercent: 18.8, yPercent: 74.0, isGate: true },

  // 2. KUZEY VE DOĞU PARSELLERİ (Tarım & Pazar)
  { id: 'plot-granary',    baseType: 'granary',     name: 'Tahıl Ambarı',          xPercent: 46.5, yPercent: 20.0 },
  { id: 'plot-field',      baseType: 'field',       name: 'Değirmen (Tarla)',       xPercent: 64.5, yPercent: 25.0 },
  { id: 'plot-market',     baseType: 'market',      name: 'Pazar Yeri',             xPercent: 77.0, yPercent: 36.5 },
  { id: 'plot-stables',    baseType: 'stables',     name: 'Bozkır Harası (Ahır)',   xPercent: 79.5, yPercent: 55.5 },

  // 3. GÜNEY PARSELLERİ (Askeri & Sanayi)
  { id: 'plot-hideout',    baseType: 'hideout',     name: 'Sığınak (Mahzen)',       xPercent: 76.5, yPercent: 70.5 },
  { id: 'plot-forge',      baseType: 'forge',       name: 'Demirci (Silahhane)',    xPercent: 61.0, yPercent: 78.5 },
  { id: 'plot-barracks',   baseType: 'barracks',    name: 'Alp Talimgahı (Kışla)',  xPercent: 40.5, yPercent: 78.5 },

  // 4. BATI PARSELLERİ (Gözetleme, Medrese/Okul & Umaykut Mabedi)
  { id: 'plot-watchtower', baseType: 'watchtower',  name: 'Gözetleme Kulesi',       xPercent: 21.0, yPercent: 59.5 },
  { id: 'plot-slot-west',  baseType: 'school',      name: 'Medrese (Okul)',         xPercent: 21.2, yPercent: 40.5 },
  { id: 'plot-slot-northw',baseType: 'umaykut',     name: 'Umaykut Mabedi',         xPercent: 32.0, yPercent: 26.0 },
];

// Geriye dönük uyumluluk için aliaslar
export type BuildingPlot = BuildingPlotConfig;
export const VILLAGE_BUILDING_SLOTS = UMAYKUT_BUILDING_PLOTS;

export interface ActiveBuildingPlot extends BuildingPlotConfig {
  badgeLevel: number;
  type?: BuildingType | 'granary';
  subTitle: string;
  isCenter?: boolean;
  image: string;
  description: string;
  isGateSlot?: boolean;
}

interface VillageBuildingPlotItemProps {
  plot: ActiveBuildingPlot;
  queueItem?: ConstructionQueueItem;
  onOpenBuilding: (type: BuildingType) => void;
  onOpenEmptyBuildMenu?: (plot: ActiveBuildingPlot) => void;
}

const VillageBuildingPlotItem: React.FC<VillageBuildingPlotItemProps> = ({
  plot,
  queueItem,
  onOpenBuilding,
  onOpenEmptyBuildMenu,
}) => {
  const currentLevel = plot.badgeLevel ?? 0;
  const isGate = Boolean(plot.isGate || plot.isGateSlot || plot.baseType === 'wall');
  const isTownHall = Boolean(plot.baseType === 'town_hall' || plot.isCenter);
  const isEmptyPlot = plot.baseType === 'empty' || (currentLevel === 0 && !isTownHall && !isGate);
  const isUpgrading = Boolean(queueItem);
  const rawImage = plot.image || `/assets/buildings/${plot.baseType}.webp`;

  // Kalan saniye ve ilerleme yüzdesi hesabı
  const now = Date.now();
  const remainingSec = queueItem ? Math.max(0, Math.ceil((queueItem.endTime - now) / 1000)) : 0;
  const elapsedSec = queueItem ? Math.max(0, (now - queueItem.startTime) / 1000) : 0;
  const durationSec = queueItem ? Math.max(1, queueItem.durationSec) : 1;
  const progressPercent = Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100));

  const spriteSizeClasses = isTownHall 
    ? 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 scale-110 drop-shadow-2xl' 
    : isGate 
      ? 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-lg' 
      : 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 drop-shadow-lg';

  const shadowClasses = isTownHall
    ? 'w-16 sm:w-24 h-6 sm:h-10 bg-black/55 blur-md'
    : isGate
      ? 'w-12 sm:w-20 h-4 sm:h-6 bg-black/45 blur-sm'
      : 'w-12 sm:w-16 h-5 sm:h-8 bg-black/45 blur-sm';

  const transformStyle = 'translate(-50%, -75%)'; // Taban merkezini arsa yuvarlağına oturtur

  const handleClick = () => {
    if (isEmptyPlot || plot.baseType === 'empty' || !plot.type) {
      if (onOpenEmptyBuildMenu) {
        onOpenEmptyBuildMenu(plot);
      }
    } else {
      onOpenBuilding(plot.type as BuildingType);
    }
  };

  const tooltipStats = [
    { label: 'Mevcut Kademe', value: `Seviye ${plot.badgeLevel || 1}` },
    { label: 'Sonraki Kademe', value: `Seviye ${(plot.badgeLevel || 1) + 1}`, color: 'text-amber-700' },
  ];

  return (
    <ParchmentTooltip
      title={isEmptyPlot ? 'Boş İnşaat Parseli' : plot.name}
      subtitle={isEmptyPlot ? 'Bina İnşa Et' : `Sv.${plot.badgeLevel || 1}`}
      description={isEmptyPlot ? 'Bu parsele dilediğiniz askeri, idari, iktisadi veya ilim binasını inşa edebilirsiniz.' : (plot.description || `${plot.name} binası beylik yerleşimini geliştirir ve yeni imkanlar sağlar.`)}
      stats={isEmptyPlot ? [] : tooltipStats}
      footer={isEmptyPlot ? 'Tıklayarak yeni bina inşaat divanını açın.' : 'Tıklayarak yönetim ve geliştirme divanını açın.'}
      className="absolute cursor-hammer"
      style={{
        position: 'absolute',
        left: `${plot.xPercent}%`,
        top: `${plot.yPercent}%`,
        transform: transformStyle,
        zIndex: Math.round((plot.yPercent || 1) * 10), // Aşağıdaki binalar yukarıdakilerin önüne geçer
      }}
    >
      <div
        onClick={handleClick}
        className={`${isTownHall ? 'z-30' : 'z-20'} flex flex-col items-center cursor-hammer group`}
      >
      {/* Boş parseller için render kodu (İSİM ETİKETİ YAZILMAZ): */}
      {isEmptyPlot ? (
        <div className="relative flex flex-col items-center group">
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-amber-400/60 bg-black/40 backdrop-blur-xs flex items-center justify-center hover:scale-115 hover:border-amber-300 hover:bg-amber-600/30 transition-all cursor-hammer shadow-lg group-hover:shadow-amber-500/20">
            <span className="text-amber-200/90 text-lg sm:text-2xl font-light group-hover:text-amber-100 group-hover:scale-110 transition-transform">
              +
            </span>
          </div>
          {/* Boş slotlarda kesinlikle isim plakası yazılmaz */}
        </div>
      ) : (
        <div className="relative flex flex-col items-center cursor-hammer">
          {/* 1. YUMUŞAK ZEMİN GÖLGESİ (Binayı toprağa bağlar) */}
          <div className={`absolute -bottom-1 ${shadowClasses} rounded-full -z-10 pointer-events-none`} />

          {/* 5. Geliştirme: Meşale & Demirci Ocak Işıltısı (Ambient Glow) */}
          {(isGate || plot.baseType === 'forge') && (
            <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-lg torch-flicker pointer-events-none -z-10" />
          )}

          {/* 5. Geliştirme: Tüten Duman Parçacıkları (Demirci ve Merkez Otağ) */}
          {(plot.baseType === 'forge' || isTownHall) && !isUpgrading && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-300/40 blur-[1px] smoke-puff-1 absolute" />
              <div className="w-3 h-3 rounded-full bg-stone-200/35 blur-[1.5px] smoke-puff-2 absolute" />
              <div className="w-2 h-2 rounded-full bg-stone-400/30 blur-[1px] smoke-puff-3 absolute" />
            </div>
          )}

          {/* 2. BİNA SPRITE'I (Otomatik şeffaflaştırılmış görsel bileşeni) */}
          <div className="relative">
            <AutoBuildingSprite 
              src={rawImage} 
              alt={plot.name} 
              threshold={230}
              fallbackSrc={isGate ? '/assets/buildings/wall_t1.webp' : `/drawable/${plot.baseType}.webp`}
              className={`${spriteSizeClasses} object-contain ${
                isUpgrading ? 'opacity-40 grayscale-[25%]' : 'group-hover:scale-115'
              } transition-all duration-200 pointer-events-auto cursor-hammer`}
              style={{
                filter: 'drop-shadow(0 8px 6px rgba(0, 0, 0, 0.55))',
              }}
            />

            {/* 2. İnşaat İskelesi Bindirmesi (Eğer bina inşa/yükseltme halindeyse) */}
            {isUpgrading && (
              <img 
                src="/assets/buildings/construction_site.webp" 
                alt="İnşaat İskelesi" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-md z-10 animate-pulse"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
          </div>

          {/* 2. İnşaat Geri Sayım Rozeti ve İlerleme Çubuğu */}
          {isUpgrading && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center bg-[#150d06]/95 border border-amber-500/90 rounded-md px-1.5 sm:px-2 py-0.5 shadow-xl min-w-[64px] sm:min-w-[76px]">
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-black text-amber-300 whitespace-nowrap">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 animate-spin shrink-0" />
                <span>{remainingSec}s</span>
                <span className="text-[8px] sm:text-[9px] text-amber-400/80">(Sv.{queueItem?.targetLevel})</span>
              </div>
              <div className="w-full bg-stone-900 rounded-full h-1 mt-0.5 overflow-hidden border border-amber-900/60">
                <div 
                  className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* 3. SEVİYE & İSİM PLAKASI (Sabit pozisyon - konumu yukarı kaydırmaz) */}
          <div className={`absolute top-[92%] left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap bg-[#1a140d]/95 border ${isTownHall ? 'border-amber-400 shadow-amber-900/40 bg-[#23170d]' : isGate ? 'border-[#e07a3c] group-hover:border-amber-400' : 'border-[#c29b38] group-hover:border-amber-400'} group-hover:bg-[#281b10] px-1 sm:px-2 py-0.5 rounded shadow-lg text-center transition-colors max-w-[100px] sm:max-w-none truncate`}>
            <span className={`text-[8px] sm:text-[10px] md:text-[11px] font-serif ${isTownHall ? 'text-amber-300 font-bold' : 'text-[#f3e5ab]'} group-hover:text-amber-200 tracking-wide block leading-none`}>
              {plot.name} (Sv.{plot.badgeLevel})
            </span>
          </div>
        </div>
      )}
      </div>
    </ParchmentTooltip>
  );
};


export const UmaykutVillageInterior: React.FC<UmaykutVillageInteriorProps> = ({
  village,
  playerVillages = [village],
  onSelectVillage = () => {},
  nodes,
  rates,
  constructionQueue,
  trainingQueue,
  activeMarches = [],
  onOpenBuilding,
  onUpgradeBuilding = () => {},
  onOpenFoundVillageModal = () => {},
  onOpenFactionModal = () => {},
  onNavigateToMap,
  onSelectTab,
  onOpenVictoryPanel,
  onAssignBuildingToPlot,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const townHallLevel = village.buildings.town_hall || 6;
  const { captured, radius } = getCapturedNodesForVillage(village, nodes);
  const wallBonus = getWallDefenseBonus(village.buildings.wall || 2);
  const hideoutCap = getHideoutCapacity(village.buildings.hideout || 3);

  // Toplam Garnizon Asker Sayısı (images(1).jpg'deki sol üst rozet)
  const totalGarrison: number = Object.values(village.units).reduce<number>((acc, count) => acc + (Number(count) || 0), 0);

  // Durumlar
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [inspectingPlot, setInspectingPlot] = useState<ActiveBuildingPlot | null>(null);
  const [selectedEmptyPlot, setSelectedEmptyPlot] = useState<ActiveBuildingPlot | null>(null);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [baseImageLoaded, setBaseImageLoaded] = useState<boolean>(true);

  // Aktif inşaat kontrolü
  const getQueueForType = (type: BuildingType) => {
    return constructionQueue.find(c => (!c.villageId || c.villageId === village.id) && c.buildingType === type);
  };

  // Bina detay ve alt başlık yardımcısı
  const getBuildingDetails = (bType: BuildingType, level: number) => {
    switch (bType) {
      case 'school':
        return { subTitle: `+${level * 3} Kapasite`, desc: 'Hendese, fen ve ilim merkezi. Birlik oyuncu kapasitesini (+3/seviye) ve çember büyümesini belirler.' };
      case 'hideout':
        return { subTitle: `${getHideoutCapacity(level).toLocaleString()} Koruma`, desc: 'Düşman yağmalarında ve kuşatmalarında çalınamayacak erzak ve madenleri gizleyen yeraltı gizli mahzenleri.' };
      case 'wall':
        return { subTitle: `+${getWallDefenseBonus(level)}% Savunma`, desc: 'Köyün etrafını çevreleyen kütük ve taş surların ana giriş kapısı ve hisar tahkimatı. Garnizon savunmasını güçlendirir.' };
      case 'barracks':
        return { subTitle: 'Piyade Talimi', desc: 'Standart piyade birlikleri (Mızraklı, Kılıçlı) ve beyliğinize özgü elit piyade sınıfının eğitildiği askeri garnizon tesisi.' };
      case 'stables':
        return { subTitle: 'Atlı & Süvari', desc: 'Hafif keşif süvarileri ve beyliğin seçkin atlı birliklerinin (Akıncı, Bozok vb.) yetiştirildiği at harası.' };
      case 'watchtower':
        return { subTitle: 'İstihbarat & Casus', desc: 'Casusların eğitildiği, ufuktaki düşman ordularını ve yaklaşan seferleri erkenden tespit eden istihbarat kulesi.' };
      case 'forge':
        return { subTitle: 'Kılıç & Zırh', desc: 'Ordunun kılıç, kalkan, zırh ve ok temin ettiği silahhane ve döküm ocağı.' };
      case 'market':
        return { subTitle: 'Takas & Kervan', desc: 'Eksik duyulan kaynakları takas etmek ve komşu ticaret kervanları göndermek için kullanılan ticaret merkezi.' };
      case 'field':
        return { subTitle: 'Buğday & Zahire', desc: 'Köy halkının ve garnizon ordusunun zahire ve buğday gereksinimini sağlayan tarım alanı.' };
      case 'granary':
        return { subTitle: 'Erzak & Mahsul', desc: 'Hasat edilen buğday ve tahılların bozulmadan depolandığı dev ambarlar.' };
      case 'warehouse':
        return { subTitle: 'Hammadde Deposu', desc: 'Maden, taş ve kerestenin saklandığı büyük ambar.' };
      case 'umaykut':
        return { subTitle: 'Sezon Zaferi', desc: 'Umaykut Online resmi sezon zafer mabedi. 3 farklı beylikten 10. seviyeye tamamlandığında cihan hâkimiyeti kazanılır.' };
      default:
        return { subTitle: `Seviye ${level}`, desc: BUILDINGS[bType]?.description || '' };
    }
  };

  // 10 Adet Esnek Parsel Koordinatları ve Varsayılan Eşleşmeleri
  const FLEXIBLE_PLOTS_META: { id: string; defaultType: BuildingType; xPercent: number; yPercent: number }[] = [
    { id: 'plot-granary',    defaultType: 'granary',    xPercent: 46.5, yPercent: 20.0 },
    { id: 'plot-field',      defaultType: 'field',      xPercent: 64.5, yPercent: 25.0 },
    { id: 'plot-market',     defaultType: 'market',     xPercent: 77.0, yPercent: 36.5 },
    { id: 'plot-stables',    defaultType: 'stables',    xPercent: 79.5, yPercent: 55.5 },
    { id: 'plot-hideout',    defaultType: 'hideout',    xPercent: 76.5, yPercent: 70.5 },
    { id: 'plot-forge',      defaultType: 'forge',      xPercent: 61.0, yPercent: 78.5 },
    { id: 'plot-barracks',   defaultType: 'barracks',   xPercent: 40.5, yPercent: 78.5 },
    { id: 'plot-watchtower', defaultType: 'watchtower', xPercent: 21.0, yPercent: 59.5 },
    { id: 'plot-slot-west',  defaultType: 'school',     xPercent: 21.2, yPercent: 40.5 },
    { id: 'plot-slot-northw',defaultType: 'umaykut',    xPercent: 32.0, yPercent: 26.0 },
  ];

  // Kullanıcının atadığı veya inşa ettiği binaların parsele yerleşimi (Tekillik ve 1-e-1 Eşleştirme):
  const userSlots = village.buildingSlots || {};

  // Hangi binaların hangi parsele yerleşeceğini kesin 1-e-1 (tekil) olarak çözümle
  const plotAssignments: Record<string, BuildingType | undefined> = {};
  const placedTypes = new Set<BuildingType>();

  // 1. Adım: Kullanıcının bu parsele açıkça atadığı geçerli binaları yerleştir
  FLEXIBLE_PLOTS_META.forEach(plotMeta => {
    const assigned = userSlots[plotMeta.id];
    if (assigned && !placedTypes.has(assigned)) {
      const level = village.buildings[assigned] || 0;
      const queue = getQueueForType(assigned);
      if (level > 0 || queue) {
        plotAssignments[plotMeta.id] = assigned;
        placedTypes.add(assigned);
      }
    }
  });

  // 2. Adım: Atanmamış parseller için, varsayılan bina (defaultType) eğer inşa edilmişse ve başka hiçbir parsele yerleştirilmemişse ata
  FLEXIBLE_PLOTS_META.forEach(plotMeta => {
    if (!plotAssignments[plotMeta.id]) {
      const defType = plotMeta.defaultType;
      if (defType && !placedTypes.has(defType)) {
        const defLevel = village.buildings[defType] || 0;
        const defQueue = getQueueForType(defType);
        if (defLevel > 0 || defQueue) {
          plotAssignments[plotMeta.id] = defType;
          placedTypes.add(defType);
        }
      }
    }
  });

  // 3. Adım: Eğer inşa edilmiş veya kuyrukta olan ancak henüz hiçbir parsele yerleşmemiş bir bina varsa, boş kalan ilk parsele tekil olarak yerleştir
  const ALL_BUILDING_TYPES: BuildingType[] = [
    'barracks', 'stables', 'school', 'watchtower', 'forge', 
    'market', 'hideout', 'granary', 'field', 'warehouse', 'umaykut'
  ];
  ALL_BUILDING_TYPES.forEach(bType => {
    if (!placedTypes.has(bType)) {
      const level = village.buildings[bType] || 0;
      const queue = getQueueForType(bType);
      if (level > 0 || queue) {
        const emptyPlot = FLEXIBLE_PLOTS_META.find(p => !plotAssignments[p.id]);
        if (emptyPlot) {
          plotAssignments[emptyPlot.id] = bType;
          placedTypes.add(bType);
        }
      }
    }
  });

  // Parselleri ActiveBuildingPlot objelerine dönüştür
  const flexibleActivePlots: ActiveBuildingPlot[] = FLEXIBLE_PLOTS_META.map(plotMeta => {
    const assignedType = plotAssignments[plotMeta.id];
    const level = assignedType ? (village.buildings[assignedType] || 0) : 0;
    const queue = assignedType ? getQueueForType(assignedType) : undefined;
    const isBuiltOrUpgrading = Boolean(assignedType && (level > 0 || queue));

    if (assignedType && isBuiltOrUpgrading) {
      const bDef = BUILDINGS[assignedType];
      const details = getBuildingDetails(assignedType, level);
      return {
        id: plotMeta.id,
        baseType: assignedType,
        type: assignedType,
        name: bDef?.name || assignedType,
        badgeLevel: level,
        subTitle: details.subTitle,
        description: details.desc,
        image: getBuildingImage(assignedType),
        xPercent: plotMeta.xPercent,
        yPercent: plotMeta.yPercent,
      };
    }

    // Boş Parsel (İsim etiketi yazılmaz, oyuncu dilediği binayı kurabilir)
    return {
      id: plotMeta.id,
      baseType: 'empty',
      type: undefined,
      name: 'Boş Parsel',
      badgeLevel: 0,
      subTitle: 'Bina İnşa Et',
      description: 'Bu parsele dilediğiniz askeri, idari, iktisadi veya ilim binasını inşa edebilirsiniz. Tıklayarak inşaat divanını açın.',
      image: '',
      xPercent: plotMeta.xPercent,
      yPercent: plotMeta.yPercent,
    };
  });

  // 12 Piksel Doğrulanmış Parsel ve Binaların Eşleştirmesi (UMAYKUT_BUILDING_PLOTS)
  const buildingPlots: ActiveBuildingPlot[] = [
    // 1. MERKEZ VE SAVUNMA (Sabit Merkez Otağı ve Sur Kapısı)
    {
      id: 'town_hall',
      type: 'town_hall',
      baseType: 'town_hall',
      name: 'Merkez Otağ',
      badgeLevel: village.buildings.town_hall ?? 1,
      subTitle: `Etki: ${radius} Kare`,
      xPercent: 49.0,
      yPercent: 48.0,
      isCenter: true,
      image: '/assets/buildings/town_hall.webp',
      description: 'Köyün idari kalbidir. Seviyesi arttıkça haritadaki etki yarıçapı (çember) genişler, daha fazla kaynak düğümünü yutar ve yeni askeri binaların kilidini açar.',
    },
    {
      id: 'plot-wall',
      type: 'wall',
      baseType: 'wall',
      name: 'Sur Kapısı',
      badgeLevel: village.buildings.wall ?? 0,
      subTitle: `+${wallBonus}% Savunma`,
      xPercent: 18.8,
      yPercent: 74.0,
      isGate: true,
      isGateSlot: true,
      image: (village.buildings.wall || 0) > 10 ? '/assets/buildings/wall_t2.webp' : '/assets/buildings/wall_t1.webp',
      description: 'Köyün etrafını çevreleyen kütük ve taş surların ana giriş kapısı ve hisar tahkimatı. Garnizon savunmasını güçlendirir.',
    },
    // 2. KULLANICININ ÖZGÜRCE DİLEDİĞİ BİNAYI KURABİLECEĞİ 10 ADET ESNEK PARSEL
    ...flexibleActivePlots,
  ];

  // Askeri Birlik Tepsisi: 7 Temel/Kışla Birliği (Mızraklı, Kılıçlı, Gulam, Levent, Hafif Süvari, Casus, Koçbaşı) + Kendi Özel Askeri + Yabancı Beylik Özel Askerleri
  const playerSpecialUnit = (faction.specialUnitId as UnitType) || 'akinci';
  
  // Tüm beylik özel birlikleri
  const ALL_SPECIAL_UNITS: UnitType[] = [
    'akinci',
    'karaman_alpi',
    'kure_baltacisi',
    'bozok_suvarisi',
    'tura'
  ];

  // Diğer beyliklerin özel birlikleri (kullanıcının kendi beylik özel askeri hariç)
  const foreignSpecialUnits = ALL_SPECIAL_UNITS.filter(u => u !== playerSpecialUnit);

  // Köyde savunma amaçlı konuşlu olan yabancı özel birlikleri öncelikli sırala
  const sortedForeignSpecials = [...foreignSpecialUnits].sort((a, b) => {
    const aStationed = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[a]) || 0), 0) + (Number(village.units[a]) || 0);
    const bStationed = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[b]) || 0), 0) + (Number(village.units[b]) || 0);
    if (aStationed > 0 && bStationed === 0) return -1;
    if (bStationed > 0 && aStationed === 0) return 1;
    return 0;
  });

  // 7 Temel / Kışla ve Otağ Birliği (Gulam ve Levent dahil)
  const standardUnitsList: { type: UnitType; building: BuildingType }[] = [
    { type: 'mizrakli', building: 'barracks' },
    { type: 'kilicli', building: 'barracks' },
    { type: 'gulam', building: 'barracks' },
    { type: 'levent', building: 'barracks' },
    { type: 'hafif_suvari', building: 'stables' },
    { type: 'casus', building: 'watchtower' },
    { type: 'kocbasi', building: 'barracks' },
  ];
  const foreignUnitsToShow = sortedForeignSpecials.slice(0, 4);

  const armyRibbonUnits: {
    type: UnitType;
    name: string;
    count: number;
    stationedSupportCount: number;
    totalDefenseCount: number;
    isForeignSpecial: boolean;
    hasDefensiveSupport: boolean;
    isRenksizFlu: boolean;
    building: BuildingType;
  }[] = [
    // 1. Kendi Beyliğinin Özel Birliği
    (() => {
      const uType = playerSpecialUnit;
      const ownCount = Number(village.units[uType]) || 0;
      const stationedCount = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[uType]) || 0), 0);
      return {
        type: uType,
        name: UNITS[uType]?.name || 'Özel Birlik',
        count: ownCount,
        stationedSupportCount: stationedCount,
        totalDefenseCount: ownCount + stationedCount,
        isForeignSpecial: false,
        hasDefensiveSupport: false,
        isRenksizFlu: false,
        building: UNITS[uType]?.buildingRequired || 'barracks',
      };
    })(),

    // 2-8. 7 Temel / Kışla Birliği (Mızraklı, Kılıçlı, Gulam, Levent, Hafif Süvari, Casus, Koçbaşı)
    ...standardUnitsList.map(item => {
      const uType = item.type;
      const ownCount = Number(village.units[uType]) || 0;
      const stationedCount = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[uType]) || 0), 0);
      return {
        type: uType,
        name: UNITS[uType]?.name || uType,
        count: ownCount,
        stationedSupportCount: stationedCount,
        totalDefenseCount: ownCount + stationedCount,
        isForeignSpecial: false,
        hasDefensiveSupport: false,
        isRenksizFlu: false,
        building: item.building,
      };
    }),

    // 9-12. 4 Yabancı Beylik Özel Birliği
    ...foreignUnitsToShow.map(uType => {
      const ownCount = Number(village.units[uType]) || 0;
      const stationedCount = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[uType]) || 0), 0);
      const totalDefense = ownCount + stationedCount;
      const hasDefense = totalDefense > 0;
      return {
        type: uType,
        name: UNITS[uType]?.name || uType,
        count: ownCount,
        stationedSupportCount: stationedCount,
        totalDefenseCount: totalDefense,
        isForeignSpecial: true,
        hasDefensiveSupport: hasDefense,
        isRenksizFlu: !hasDefense, // Köyde savunma desteği yoksa renksiz ve flu
        building: UNITS[uType]?.buildingRequired || ('barracks' as BuildingType),
      };
    }),
  ];

  return (
    <div className="relative w-full rounded-xl border-2 border-[#523e24] shadow-2xl bg-[#140e09] overflow-hidden font-serif select-none flex flex-col lg:flex-row">
      
      {/* ==================================================================== */}
      {/* SOL / ORTA BÖLGE: KÖY İÇİ ÇAYIR, BİNALAR, ÜST BANNER VE ALT ORDU BARI */}
      {/* ==================================================================== */}
      <div className="relative flex-1 flex flex-col min-w-0 bg-[#120d09]">
        
        {/* 1. ÜST BANNER: images(1).jpg ile Birebir */}
        <div className="relative z-30 w-full flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-[#1a120b] via-[#120c07] to-transparent pointer-events-auto">
          
          {/* Sol Üst Asker Rozeti: images(1).jpg'deki Oval Metal Kapsül (Minyatür Kalkan/Miğfer + 0) */}
          <div 
            onClick={() => onSelectTab && onSelectTab('military')}
            title={`Köy Garnizonu: ${totalGarrison} Asker`}
            className="flex items-center bg-gradient-to-r from-[#1c1510] via-[#2c1d13] to-[#1a110a] border-2 border-[#7a5528] rounded-full pl-1 pr-3 py-0.5 shadow-lg cursor-pointer hover:border-amber-400 transition"
          >
            <div className="w-5 h-5 rounded-full bg-[#3d2716] border border-[#a8793b] flex items-center justify-center text-xs shadow-inner mr-1.5">
              🛡️
            </div>
            <span className="font-mono font-black text-sm text-stone-100 tracking-wider">
              {totalGarrison.toLocaleString()}
            </span>
          </div>

          {/* ORTA: images(1).jpg'deki Orijinal Kıvrımlı Altın Varaklı "yeniçeri" Şeridi */}
          <div className="relative mx-auto flex items-center justify-center pointer-events-auto">
            {/* Kıvrımlı Varak Çerçeve */}
            <div className="relative px-8 py-1 bg-gradient-to-r from-[#21160e] via-[#352215] to-[#21160e] border-y-2 border-[#d4af37] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex items-center gap-2 group cursor-pointer hover:border-amber-300 transition">
              {/* Sol Varak Süsü */}
              <span className="text-amber-400 font-serif text-sm select-none">❧</span>
              
              {/* Köy Adı: images(1).jpg'de "yeniçeri" */}
              <span className="text-base sm:text-lg font-black tracking-widest text-[#fff4df] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] uppercase font-serif">
                {village.name}
              </span>

              {/* Sağ Varak Süsü */}
              <span className="text-amber-400 font-serif text-sm select-none">☙</span>
            </div>
          </div>

          {/* SAĞ KÖŞE: images(1).jpg'deki Yuvarlak Bronz [?] ve [✕ / Harita] Butonları */}
          <div className="flex items-center gap-2.5">
            
            {/* Ses Efekti Aç/Kapat */}
            <button
              onClick={() => setIsSoundMuted(m => !m)}
              title={isSoundMuted ? 'Oyun Sesini Aç' : 'Oyun Sesini Kapat'}
              className="w-7 h-7 rounded-full bg-gradient-to-b from-[#4a3520] to-[#24170d] border border-[#8a6838] hover:border-amber-400 text-amber-200 hover:text-white flex items-center justify-center shadow-md transition cursor-pointer"
            >
              {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* [?] Yardım ve Rehber Butonu (images(1).jpg'deki Yuvarlak Bronz ?) */}
            <button
              onClick={() => setShowHelpGuide(g => !g)}
              title="Köy Yönetim Rehberi"
              className="w-7 h-7 rounded-full bg-gradient-to-b from-[#6b4926] via-[#482d14] to-[#231407] border-2 border-[#caa05a] hover:border-amber-300 text-amber-100 hover:text-white font-serif font-black text-xs flex items-center justify-center shadow-lg transition cursor-pointer hover:scale-110 active:scale-95"
            >
              ?
            </button>

            {/* [✕] / Haritaya Dön Butonu (images(1).jpg'deki Yuvarlak Kırmızı/Bronz X) */}
            <button
              onClick={onNavigateToMap}
              title="Haritaya Çık (Anadolu Haritası)"
              className="w-7 h-7 rounded-full bg-gradient-to-b from-[#8f2415] via-[#5e1208] to-[#2d0702] border-2 border-[#d9553b] hover:border-red-400 text-amber-100 hover:text-white font-serif font-black text-xs flex items-center justify-center shadow-lg transition cursor-pointer hover:scale-110 active:scale-95"
            >
              ✕
            </button>

          </div>
        </div>

        {/* 2. SOL DİKEY TAKTİK EYLEM DÜĞMELERİ (Action Seals - Dövme Bronz Sikke Gövdesi) */}
        <div className="absolute left-3.5 top-16 z-20 flex flex-col items-center gap-2.5">
          {/* 1. Askeri / Kışla Butonu (Çapraz Kılıç) */}
          <button
            onClick={() => onOpenBuilding('barracks')}
            title="Kışla & Asker Eğitimi"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-2 border-[#a67c48] shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:border-amber-300 text-amber-200 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 active:translate-y-0.5 group"
          >
            <Swords className="w-5 h-5 text-amber-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:text-amber-100 group-hover:scale-110 transition-transform" />
          </button>

          {/* 2. Pazar / Ambar Vagonu Butonu */}
          <button
            onClick={() => onOpenBuilding('market')}
            title="Ambar & Pazar Takası"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-2 border-[#a67c48] shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:border-amber-300 text-amber-200 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 active:translate-y-0.5 group text-lg"
          >
            <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:scale-110 transition-transform">🛒</span>
          </button>

          {/* 3. İnşaat / Taşçı Çekici Butonu */}
          <button
            onClick={() => onOpenBuilding('town_hall')}
            title="Merkez Otağı & Köy Gelişimi"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-2 border-[#a67c48] shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:border-amber-300 text-amber-200 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 active:translate-y-0.5 group"
          >
            <Hammer className="w-5 h-5 text-amber-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:text-amber-100 group-hover:scale-110 transition-transform" />
          </button>

          {/* 4. Han / Lider Portresi Butonu */}
          <button
            onClick={onOpenFactionModal}
            title="Devlet & Han Künyesi"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-2 border-[#a67c48] shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:border-amber-300 text-amber-200 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 active:translate-y-0.5 text-lg group"
          >
            <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:scale-110 transition-transform">👑</span>
          </button>
        </div>

        {/* 3. ANA KÖY RESMİ / SAHNESİ */}
        <div className="relative w-full aspect-[16/9] max-w-[1200px] mx-auto overflow-hidden bg-[#2d4416] rounded-lg shadow-inner">
          
          {/* Yüksek Çözünürlüklü Arka Plan Zemin Resmi */}
          <img 
            src="/assets/environment/village_interior_base.webp"
            alt="Köy Yerleşimi"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />

          {/* Bina Sprite Kapsayıcısı (Arka planı otomatik saydamlaştırılmış binalar) */}
          {buildingPlots.map(plot => {
            const queueType = plot.baseType === 'granary' 
              ? 'field' 
              : (plot.baseType as BuildingType);
            const qItem = getQueueForType(queueType);

            return (
              <VillageBuildingPlotItem
                key={plot.id}
                plot={plot}
                queueItem={qItem}
                onOpenBuilding={onOpenBuilding}
                onOpenEmptyBuildMenu={(p) => setSelectedEmptyPlot(p)}
              />
            );
          })}
        </div>

        {/* ==================================================================== */}
        {/* 5. ALT ASKERİ BİRLİK TEPSİSİ / UNIT CAROUSEL                        */}
        {/* ==================================================================== */}
        <UnitCarousel 
          village={village}
          onOpenBuilding={onOpenBuilding}
        />

      </div>

      {/* ==================================================================== */}
      {/* SAĞ PANEL: DİVAN VE İDARE HUD PANELİ (RIGHT SIDEBAR)                 */}
      {/* ==================================================================== */}
      <div className="w-full lg:w-80 shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-[#523e24]">
        <RightSidebar
          village={village}
          playerVillages={playerVillages}
          rates={rates}
          constructionQueue={constructionQueue}
          trainingQueue={trainingQueue}
          activeMarches={activeMarches}
          onSelectVillage={onSelectVillage}
          onOpenFoundVillageModal={onOpenFoundVillageModal}
          onOpenBuilding={onOpenBuilding}
          onSelectTab={onSelectTab}
          onOpenFactionModal={onOpenFactionModal}
          onOpenVictoryPanel={onOpenVictoryPanel}
        />
      </div>

      {/* ==================================================================== */}
      {/* YARDIM VE REHBER POPUP MODALI ([?] Tıklandığında Açılır)             */}
      {/* ==================================================================== */}
      {showHelpGuide && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-[#1e150e] border-2 border-amber-600 rounded-xl max-w-md w-full p-4 shadow-2xl text-stone-200 space-y-3 font-serif animate-fade-in">
            <div className="flex items-center justify-between border-b border-amber-800/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="font-bold text-amber-300 text-base">Umaykut Köy İçi Rehberi</h3>
              </div>
              <button
                onClick={() => setShowHelpGuide(false)}
                className="text-stone-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-stone-300 leading-relaxed">
              <p>
                ✦ <strong>Merkez Otağı:</strong> Köyünüzün idari kalbidir. Seviyesini yükselterek haritadaki etki çemberinizi genişletebilir, madenleri köyünüze bağlayabilirsiniz.
              </p>
              <p>
                ✦ <strong>Bina Seviye Rozetleri:</strong> Binaların sol üstündeki altın çerçeveli sayılar bina seviyelerini belirtir. Bir binaya tıklayarak seviye yükseltebilir veya asker eğitebilirsiniz.
              </p>
              <p>
                ✦ <strong>Garnizon Ordusu:</strong> Alt kısımdaki 10 birlik yuvasından askerlerinizi görebilir, tıklayarak Kışla veya Ahır talimhanelerinde ordu üretebilirsiniz.
              </p>
              <p>
                ✦ <strong>Sağ Pervaz Paneli:</strong> Kaynaklarınızı saniyelik üretim hızlarıyla takip edebilir, birden çok köye hükmettiğinizde aralarında tek tıkla geçiş yapabilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setShowHelpGuide(false)}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs transition cursor-pointer"
            >
              Anladım, Savaşa Devam Et
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ==================================================================== */}
      {/* GERÇEK 3D BİNA DETAYLI İNCELEME MODALI (Tam Çözünürlüklü Sanat Eseri)  */}
      {/* ==================================================================== */}
      {inspectingPlot && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          style={{ zIndex: 9999 }}
          onClick={() => setInspectingPlot(null)}
        >
          <div 
            className="bg-gradient-to-b from-[#24170d] via-[#1a1009] to-[#0d0704] border-2 border-amber-600/90 rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-stone-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Üst Başlık Şeridi */}
            <div className="bg-gradient-to-r from-[#382010] via-[#2a170b] to-[#382010] px-4 py-3 border-b border-amber-700/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/80 flex items-center justify-center text-amber-300 font-mono font-black text-sm">
                  {inspectingPlot.badgeLevel}
                </span>
                <div>
                  <h3 className="font-serif font-black text-amber-300 text-base flex items-center gap-2">
                    {inspectingPlot.name}
                    <span className="text-[10px] uppercase font-sans tracking-wider px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700/60 text-amber-400">
                      Seviye {inspectingPlot.badgeLevel}
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400">{inspectingPlot.subTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingPlot(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Büyük 3D WebP Görseli (1024x1024 Sanat Eseri) */}
            <div className="px-4">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-[#543b22] bg-[#0d0704] shadow-inner group">
                <img
                  src={inspectingPlot.image}
                  alt={inspectingPlot.name}
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-300 font-mono pointer-events-none">
                  <span className="bg-black/70 px-2.5 py-1 rounded-md border border-amber-600/40 text-amber-300">
                    Köy Mimari Çizimi
                  </span>
                  <span className="bg-black/70 px-2.5 py-1 rounded-md border border-stone-700 text-stone-400">
                    Umaykut 3D
                  </span>
                </div>
              </div>
            </div>

            {/* Bilgi & Açıklama */}
            <div className="px-4 text-xs text-stone-300 leading-relaxed space-y-2">
              <p className="p-2.5 rounded-lg bg-[#140c06] border border-[#3e2716]">
                {inspectingPlot.description}
              </p>
            </div>

            {/* Aksiyon Butonları */}
            <div className="p-4 pt-0 flex gap-2">
              <button
                onClick={() => {
                  const targetType = inspectingPlot.baseType;
                  setInspectingPlot(null);
                  onOpenBuilding(targetType as BuildingType);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-500 text-amber-50 font-serif font-bold text-xs rounded-xl shadow-lg border border-amber-400/60 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Binayı Yönet & Geliştir</span>
              </button>
              <button
                onClick={() => setInspectingPlot(null)}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl transition cursor-pointer font-serif"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================================================================== */}
      {/* 4. BOŞ ARSA İNŞAAT SEÇİM MENÜSÜ MODALI                              */}
      {/* ==================================================================== */}
      {selectedEmptyPlot && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          style={{ zIndex: 9999 }}
          onClick={() => setSelectedEmptyPlot(null)}
        >
          <div 
            className="bg-gradient-to-b from-[#24170d] via-[#1a1009] to-[#0d0704] border-2 border-amber-600/90 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl text-stone-200 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Başlığı */}
            <div className="bg-gradient-to-r from-[#382010] via-[#2a170b] to-[#382010] px-5 py-3.5 border-b border-amber-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-amber-400/70 bg-amber-950/60 flex items-center justify-center text-amber-300 font-bold text-lg">
                  +
                </div>
                <div>
                  <h3 className="font-serif font-black text-amber-300 text-base flex items-center gap-2">
                    Yeni Bina İnşa Et
                    <span className="text-[10px] font-sans tracking-wider px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400">
                      {selectedEmptyPlot.name}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">
                    Bu parsele kurmak istediğiniz yeni mimari yapıyı veya askeri tesisi seçin.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEmptyPlot(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* İnşa Edilebilir Bina Seçenekleri Listesi */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
              {[
                { 
                  type: 'barracks' as BuildingType, 
                  name: 'Alp Talimgahı (Kışla)', 
                  desc: 'Mızraklı, Kılıçlı ve özel beylik piyadelerini yetiştiren askeri kışla.', 
                  icon: '⚔️',
                  image: '/assets/buildings/barracks.webp',
                  minTh: 1 
                },
                { 
                  type: 'stables' as BuildingType, 
                  name: 'Bozkır Harası (Ahır)', 
                  desc: 'Hafif keşif süvarileri ve elit beylik atlı birliklerini yetiştirir.', 
                  icon: '🐎',
                  image: '/assets/buildings/stables.webp',
                  minTh: 2 
                },
                { 
                  type: 'school' as BuildingType, 
                  name: 'Medrese (Okul)', 
                  desc: 'İttifak üye kapasitesini (+3/seviye) ve köy etki çemberi gelişimini sağlar.', 
                  icon: '📜',
                  image: '/assets/buildings/school.webp',
                  minTh: 1 
                },
                { 
                  type: 'watchtower' as BuildingType, 
                  name: 'Gözetleme Kulesi', 
                  desc: 'Casus yetiştirir, yaklaşan düşman ordularını ve seferleri gözetler.', 
                  icon: '👁️',
                  image: '/assets/buildings/watchtower.webp',
                  minTh: 1 
                },
                { 
                  type: 'forge' as BuildingType, 
                  name: 'Demirci (Silahhane)', 
                  desc: 'Kılıç, zırh ve ok dökümü yaparak tüm ordunun taarruz ve zırh gücünü artırır (+%3/sv).', 
                  icon: '⚒️',
                  image: '/assets/buildings/forge.webp',
                  minTh: 2 
                },
                { 
                  type: 'market' as BuildingType, 
                  name: 'Pazar Yeri', 
                  desc: 'Fazla kaynakları takas etmenizi ve ticaret kervanları göndermenizi sağlar.', 
                  icon: '⚖️',
                  image: '/assets/buildings/market.webp',
                  minTh: 2 
                },
                { 
                  type: 'hideout' as BuildingType, 
                  name: 'Sığınak (Gizli Mahzen)', 
                  desc: 'Kuşatma ve yağmalarda çalınamayacak erzak ve madenleri yeraltında saklar.', 
                  icon: '🚪',
                  image: '/assets/buildings/hideout.webp',
                  minTh: 1 
                },
                { 
                  type: 'granary' as BuildingType, 
                  name: 'Tahıl Ambarı', 
                  desc: 'Hasat edilen buğday ve erzakların güvenle depolandığı ambar.', 
                  icon: '🌾',
                  image: '/assets/buildings/granary.webp',
                  minTh: 1 
                },
                { 
                  type: 'field' as BuildingType, 
                  name: 'Değirmen & Tahıl Tarlası', 
                  desc: 'Köyün saatlik tahıl hasat verimini çarparak artırır (+%5/sv).', 
                  icon: '🌾',
                  image: '/assets/buildings/field.webp',
                  minTh: 1 
                },
                { 
                  type: 'warehouse' as BuildingType, 
                  name: 'Depo', 
                  desc: 'Ham maddelerin güvenle saklandığı büyük depo. Maksimum kaynak kapasitesini artırır.', 
                  icon: '📦',
                  image: '/assets/buildings/granary.webp',
                  minTh: 1 
                },
                { 
                  type: 'umaykut' as BuildingType, 
                  name: 'Umaykut Mabedi', 
                  desc: 'Sezon zafer mabedi. 10 köy ve 10. seviye Merkez Otağı ile yalnızca payitahtta kurulabilir.', 
                  icon: '🏛️',
                  image: '/assets/buildings/umaykut.webp',
                  minTh: 10 
                },
              ].map((b) => {
                const currentLv = village.buildings[b.type] || 0;
                const isThMet = (village.buildings.town_hall || 1) >= b.minTh;

                const handleSelectBuilding = () => {
                  if (selectedEmptyPlot && onAssignBuildingToPlot) {
                    onAssignBuildingToPlot(selectedEmptyPlot.id, b.type);
                  }
                  setSelectedEmptyPlot(null);
                  onOpenBuilding(b.type);
                };

                return (
                  <div
                    key={b.type}
                    onClick={handleSelectBuilding}
                    className="p-3 rounded-xl bg-[#140c06] hover:bg-[#20140b] border border-[#3e2716] hover:border-amber-500/80 transition cursor-pointer flex items-center justify-between gap-3 group shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-[#0d0704] border border-amber-900/60 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-inner">
                        <img 
                          src={b.image} 
                          alt={b.name} 
                          className="w-full h-full object-contain filter drop-shadow"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                        <span className="text-xl select-none absolute pointer-events-none">
                          {b.icon}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-amber-200 text-sm font-serif group-hover:text-amber-100 truncate">
                            {b.name}
                          </h4>
                          {currentLv > 0 ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 shrink-0">
                              Köyde Mevcut (Sv.{currentLv})
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-400 shrink-0">
                              Yeni İnşaat
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                          {b.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBuilding();
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-lg font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1 font-serif whitespace-nowrap"
                      >
                        <span>{currentLv > 0 ? 'Yönet / Geliştir' : 'Bu Parsele Kur'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Alt Kapat */}
            <div className="p-3 bg-[#110904] border-t border-[#382010] flex justify-end">
              <button
                onClick={() => setSelectedEmptyPlot(null)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg transition cursor-pointer font-serif"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
