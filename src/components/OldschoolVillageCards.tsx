import React from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  ResourceNode, 
  ResourceRate, 
  Resources, 
  TrainingQueueItem, 
  Village 
} from '../types/game';
import { 
  BUILDINGS, 
  FACTIONS, 
  getBuildingUpgradeCost, 
  getBuildingUpgradeDuration, 
  getCapturedNodesForVillage, 
  getHideoutCapacity, 
  getInfluenceRadius, 
  getWallDefenseBonus,
  getBuildingImage
} from '../data/gameData';
import { ResourceIcon } from './ResourceIcon';
import { AutoBuildingSprite } from './AutoBuildingSprite';
import { 
  Clock, 
  Radio, 
  Compass, 
  Users, 
  ArrowUpCircle, 
  CheckCircle2, 
  Swords, 
  ShieldCheck, 
  Layers, 
  Coins, 
  Wheat, 
  Trees,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface OldschoolVillageCardsProps {
  village: Village;
  playerVillages?: Village[];
  onSelectVillage?: (villageId: string) => void;
  nodes: ResourceNode[];
  rates: ResourceRate;
  constructionQueue: ConstructionQueueItem[];
  trainingQueue: TrainingQueueItem[];
  onOpenBuilding: (type: BuildingType) => void;
  onUpgradeBuilding: (type: BuildingType) => void;
  onOpenFoundVillageModal?: () => void;
  onNavigateToMap: () => void;
}

export const OldschoolVillageCards: React.FC<OldschoolVillageCardsProps> = ({
  village,
  playerVillages = [village],
  onSelectVillage,
  nodes,
  rates,
  constructionQueue,
  trainingQueue,
  onOpenBuilding,
  onUpgradeBuilding,
  onOpenFoundVillageModal,
  onNavigateToMap,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const { captured, radius } = getCapturedNodesForVillage(village, nodes);
  const townHallLevel = village.buildings.town_hall || 1;

  // 7 Temel Bina Türleri
  const buildingTypes: BuildingType[] = [
    'town_hall',
    'barracks',
    'stables',
    'watchtower',
    'wall',
    'market',
    'hideout'
  ];

  // Kaynak yetiyor mu kontrolü
  const canAfford = (cost: Resources) => {
    return (
      village.resources.wood >= cost.wood &&
      village.resources.stone >= cost.stone &&
      village.resources.iron >= cost.iron &&
      village.resources.grain >= cost.grain &&
      village.resources.gold >= cost.gold
    );
  };

  return (
    <div className="space-y-4 font-serif pb-28">
      
      {/* 1. ÜST KÖY KÜNYESİ VE COĞRAFİ ÖZET (PARŞÖMEN KART) */}
      <div className="bg-[#f5ebd9] text-[#2c1d11] border-2 border-[#7e5f35] rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        {/* Zarif arka plan süslemesi */}
        <div className="absolute -right-8 -bottom-8 opacity-5 text-9xl pointer-events-none select-none">
          🏰
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-8 rounded-lg overflow-hidden border-2 border-[#b8860b] shadow-md bg-stone-900 shrink-0 flex items-center justify-center">
                {faction.flagImage ? (
                  <img 
                    src={faction.flagImage} 
                    alt={`${faction.name} Bayrağı`} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <span className="text-xl">{faction.crestIcon || '🏹'}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black font-serif tracking-wide text-[#2b1b0e]">
                    {village.name}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#e8dac0] border border-[#a88a59] font-mono font-bold text-[#634825]">
                    Merkez Lv.{village.buildings.town_hall || 1}
                  </span>
                </div>
                <div className="text-xs text-[#634b2f] mt-0.5">
                  Bey: <strong>{village.ownerName}</strong> ({faction.name}) • Konum: <strong className="font-mono text-[#8f2b18]">({village.x} | {village.y})</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Etki Alanı ve Harita Bağlantısı */}
          <div className="flex flex-wrap items-center gap-2.5 bg-[#ebdcc2] border border-[#a88957] p-2.5 rounded-lg text-xs shadow-inner">
            <div className="flex items-center gap-1.5 text-[#1b4e20] font-bold">
              <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>Etki Çapı: {radius} tile</span>
            </div>
            <span className="text-[#a18760]">|</span>
            <div className="text-[#45321d]">
              Bağlı Maden: <strong className="font-mono text-[#822c18] font-bold">{captured.length} Kaynak</strong>
            </div>
            <button
              onClick={onNavigateToMap}
              className="px-3 py-1.5 bg-gradient-to-r from-[#7a2e18] to-[#92361d] hover:from-[#8f361c] hover:to-[#aa3f22] text-[#fbf6ea] rounded-md font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
            >
              <span>Haritada Gör</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. DEVAM EDEN İNŞAAT VE EĞİTİM KUYRUKLARI */}
      {(constructionQueue.length > 0 || trainingQueue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {constructionQueue.length > 0 && (
            <div className="bg-[#1f1a14] border-2 border-[#694e2b] rounded-lg p-3 text-stone-200 shadow">
              <div className="flex items-center justify-between text-amber-400 font-bold text-xs mb-2 pb-1 border-b border-[#4d381e]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Mimar Ocağı (Devam Eden İnşaat)
                </span>
              </div>
              {constructionQueue.map(item => {
                const bDef = BUILDINGS[item.buildingType];
                const remSec = Math.max(0, Math.ceil((item.endTime - Date.now()) / 1000));
                const progressPct = Math.min(100, Math.max(0, ((item.durationSec - remSec) / item.durationSec) * 100));

                return (
                  <div key={item.id} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-100 flex items-center gap-1.5">
                        <span>{bDef.icon}</span>
                        <span>{bDef.name}</span>
                        <span className="text-amber-400 font-mono">(Seviye {item.targetLevel})</span>
                      </span>
                      <span className="font-mono text-amber-300 font-bold">{remSec} sn kaldı</span>
                    </div>
                    <div className="w-full bg-[#120f0c] h-2 rounded overflow-hidden border border-[#523e24]">
                      <div 
                        className="bg-amber-600 h-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {trainingQueue.length > 0 && (
            <div className="bg-[#1f1a14] border-2 border-[#694e2b] rounded-lg p-3 text-stone-200 shadow">
              <div className="flex items-center justify-between text-blue-400 font-bold text-xs mb-2 pb-1 border-b border-[#4d381e]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Talimgah (Ordu Eğitimi)
                </span>
              </div>
              {trainingQueue.map(item => {
                const remSec = Math.max(0, Math.ceil((item.nextFinishTime - Date.now()) / 1000));
                return (
                  <div key={item.id} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-stone-200">
                      <strong className="text-blue-300">{item.remainingAmount}x</strong> {item.unitType.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-stone-400">{remSec} sn / birim</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. SADE, 'OLDSCHOOL' BİNA BİLGİ KARTLARI LİSTESİ */}
      <div className="space-y-3">
        {buildingTypes.map(type => {
          const bDef = BUILDINGS[type];
          const currentLevel = village.buildings[type] || (type === 'town_hall' ? 1 : 0);
          const nextCost = getBuildingUpgradeCost(type, currentLevel);
          const durationSec = getBuildingUpgradeDuration(type, currentLevel, townHallLevel);
          const affordable = canAfford(nextCost);
          const isUpgrading = constructionQueue.some(c => c.buildingType === type);

          // Seviye Özel Bilgileri
          let benefitText = '';
          if (type === 'town_hall') {
            benefitText = `Mevcut Etki Çapı: ${getInfluenceRadius(currentLevel)} tile → Seviye ${currentLevel + 1}: ${getInfluenceRadius(currentLevel + 1)} tile (Seviye 10'da yeni köy hakkı)`;
          } else if (type === 'barracks') {
            benefitText = `Piyade ve özel beylik birliklerinin eğitim merkezi. Seviye arttıkça eğitim hızlanır.`;
          } else if (type === 'stables') {
            benefitText = `Atlı akıncı ve süvari birliklerinin yetiştirildiği harman.`;
          } else if (type === 'watchtower') {
            benefitText = `Düşman seferlerini ve harita tehditlerini gözetleme kulesi.`;
          } else if (type === 'wall') {
            benefitText = `Garnizon savunma bonusu: +%${getWallDefenseBonus(currentLevel)} → Seviye ${currentLevel + 1}: +%${getWallDefenseBonus(currentLevel + 1)}`;
          } else if (type === 'market') {
            benefitText = `1:1 oranla anında kaynak takası. Tüm otağlar ortak hazine havuzunu paylaşır.`;
          } else if (type === 'hideout') {
            benefitText = `Yağmadan korunan kaynak miktarı: ${getHideoutCapacity(currentLevel)} birim → Seviye ${currentLevel + 1}: ${getHideoutCapacity(currentLevel + 1)} birim`;
          }

          return (
            <div 
              key={type}
              className="bg-[#fbf7ed] text-[#2c1e11] border-2 border-[#82653d] rounded-xl p-4 sm:p-4.5 shadow-md transition-all duration-200 hover:border-[#a8824f] hover:shadow-lg"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                
                {/* Sol: Bina Başlığı, Seviye & Açıklama */}
                <div className="flex-1">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg bg-[#ebdcc2] border-2 border-[#a68652] overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                      <AutoBuildingSprite
                        src={bDef.image || getBuildingImage(type)}
                        alt={bDef.name}
                        className="w-full h-full object-contain p-0.5"
                      />
                      <span className="text-2xl pointer-events-none select-none absolute opacity-30">
                        {bDef.icon}
                      </span>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base font-serif text-[#291a0d]">
                          {bDef.name}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#eadaaf] text-[#5c401e] border border-[#b29158]">
                          Seviye {currentLevel}
                        </span>
                        {isUpgrading && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[#92361d] text-[#fbf6ea] font-bold animate-pulse shadow-sm">
                            İnşa Ediliyor...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5e4529] mt-1 leading-relaxed">
                        {benefitText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sağ: Geliştirme Maliyeti ve Geliştir Butonu */}
                <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-[#ddcbac]">
                  
                  {/* Maliyet İkonları */}
                  <div className="flex items-center gap-2.5 text-xs font-mono bg-[#eddcc4] px-3 py-1.5 rounded-lg border border-[#baa075] shadow-inner">
                    <span className={`flex items-center gap-1 ${village.resources.wood >= nextCost.wood ? 'text-[#1d4d1e] font-semibold' : 'text-red-700 font-bold'}`} title="Gereken Odun">
                      <ResourceIcon type="wood" size="xs" /> {nextCost.wood}
                    </span>
                    <span className={`flex items-center gap-1 ${village.resources.stone >= nextCost.stone ? 'text-[#1d4d1e] font-semibold' : 'text-red-700 font-bold'}`} title="Gereken Taş">
                      <ResourceIcon type="stone" size="xs" /> {nextCost.stone}
                    </span>
                    <span className={`flex items-center gap-1 ${village.resources.iron >= nextCost.iron ? 'text-[#1d4d1e] font-semibold' : 'text-red-700 font-bold'}`} title="Gereken Demir">
                      <ResourceIcon type="iron" size="xs" /> {nextCost.iron}
                    </span>
                    <span className={`flex items-center gap-1 ${village.resources.grain >= nextCost.grain ? 'text-[#1d4d1e] font-semibold' : 'text-red-700 font-bold'}`} title="Gereken Tahıl">
                      <ResourceIcon type="grain" size="xs" /> {nextCost.grain}
                    </span>
                    {nextCost.gold > 0 && (
                      <span className={`flex items-center gap-1 ${village.resources.gold >= nextCost.gold ? 'text-[#1d4d1e] font-semibold' : 'text-red-700 font-bold'}`} title="Gereken Altın">
                        <ResourceIcon type="gold" size="xs" /> {nextCost.gold}
                      </span>
                    )}
                    <span className="text-[#6d5435] border-l border-[#baa075] pl-2">⏱️ {durationSec}s</span>
                  </div>

                  {/* Butonlar */}
                  <div className="flex items-center gap-2">
                    {/* Hızlı Detay / Yönet Butonu */}
                    <button
                      onClick={() => onOpenBuilding(type)}
                      className="px-3 py-1.5 bg-[#e0ceaf] hover:bg-[#d4be9c] text-[#3d2b17] border border-[#a18251] rounded-md font-bold text-xs transition cursor-pointer shadow-sm"
                    >
                      Yönet
                    </button>

                    {/* Ana Geliştir Butonu */}
                    <button
                      onClick={() => onUpgradeBuilding(type)}
                      disabled={!affordable || isUpgrading}
                      className={`px-4 py-1.5 rounded-md font-bold text-xs transition shadow cursor-pointer flex items-center gap-1.5 ${
                        isUpgrading
                          ? 'bg-[#827464] text-[#eee7db] cursor-not-allowed opacity-75'
                          : affordable
                          ? 'bg-gradient-to-r from-[#7a2e18] to-[#92361d] hover:from-[#8f361c] hover:to-[#aa3f22] text-[#fbf6ea] active:scale-95 shadow-sm'
                          : 'bg-[#b09e88] text-[#57493a] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>{isUpgrading ? 'İnşaatta' : 'Geliştir'}</span>
                    </button>
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
