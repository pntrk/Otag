import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  FactionId, 
  ResourceNode, 
  Resources, 
  UnitDefinition,
  UnitType, 
  Village 
} from '../types/game';
import { 
  BUILDINGS, 
  FACTIONS, 
  UNITS, 
  calculateDistance, 
  getBuildingUpgradeCost, 
  getBuildingUpgradeDuration, 
  getCapturedNodesForVillage, 
  getHideoutCapacity, 
  getInfluenceRadius, 
  getWallDefenseBonus,
  getBuildingImage,
  isUnitProducibleByFaction
} from '../data/gameData';
import { 
  getPopulationSpawnDuration, 
  getNextSpawnTimeRemaining, 
  getPopulationSpawnProgress, 
  formatRemainingTime, 
  canConvertWorkerToTroop 
} from '../engine/populationEngine';
import { getVillageHideoutProtection, PLUNDER_COOLDOWN_SEC } from '../engine/production';
import { getVillageMaxCapacity } from '../engine/simulation';
import { 
  ForgeUpgradeType, 
  FORGE_UPGRADE_CONFIGS, 
  getForgeUpgradeCost, 
  getForgeUpgradeDuration, 
  getVillageForgeUpgrades 
} from '../types/military';
import { useTransparentImage } from '../utils/imageUtils';
import { UnitPortrait } from './UnitPortrait';
import { ResourceIcon } from './ResourceIcon';
import { 
  X, 
  Radio, 
  ArrowUpCircle, 
  Clock, 
  ShieldCheck, 
  Compass, 
  Wheat, 
  Coins, 
  Trees, 
  Layers, 
  Swords, 
  Users, 
  ArrowRightLeft, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  Hammer
} from 'lucide-react';

interface BuildingModalProps {
  buildingType: BuildingType | null;
  village: Village;
  playerVillages?: Village[];
  nodes: ResourceNode[];
  onClose: () => void;
  onUpgradeBuilding: (type: BuildingType) => void;
  onTrainUnits: (unitType: UnitType, amount: number) => void;
  onMarketTrade: (fromResource: keyof Resources, toResource: keyof Resources, amount: number) => void;
  onOpenFoundVillageModal?: () => void;
  onStartForgeResearch?: (upgradeType: ForgeUpgradeType) => void;
  onCancelForgeResearch?: (queueItemId: string) => void;
  isUpgradingThisBuilding: boolean;
}

export const BuildingModal: React.FC<BuildingModalProps> = (props) => {
  if (!props.buildingType) return null;
  return <BuildingModalContent {...props} buildingType={props.buildingType} />;
};

const BuildingModalContent: React.FC<BuildingModalProps & { buildingType: BuildingType }> = ({
  buildingType: initialBuildingType,
  village,
  playerVillages = [village],
  nodes,
  onClose,
  onUpgradeBuilding,
  onTrainUnits,
  onMarketTrade,
  onOpenFoundVillageModal,
  onStartForgeResearch,
  onCancelForgeResearch,
  isUpgradingThisBuilding,
}) => {
  const [activeType, setActiveType] = useState<BuildingType>(initialBuildingType);

  // Prop değiştiğinde aktif tipi güncelle
  React.useEffect(() => {
    setActiveType(initialBuildingType);
  }, [initialBuildingType]);

  const bDef = BUILDINGS[activeType];
  const currentLevel = village.buildings[activeType] || 0;
  const isMaxLevel = currentLevel >= bDef.maxLevel;
  const upgradeCost = getBuildingUpgradeCost(activeType, currentLevel);
  const townHallLevel = village.buildings.town_hall || 1;
  const upgradeDuration = getBuildingUpgradeDuration(activeType, currentLevel, townHallLevel);

  // Umaykut Binası İnşa Ön Şartları (3/3 Kuralı)
  const isCapitalVillage = !!village.isCapital || village.id === 'v_merkez' || village.id === playerVillages[0]?.id;
  const isTenVillagesFounded = playerVillages.length >= 10;
  const isTownHallLevelTen = (village.buildings.town_hall || 0) >= 10;
  const isUmaykutBuilding = activeType === 'umaykut';
  const canBuildUmaykut = !isUmaykutBuilding || (isTenVillagesFounded && isCapitalVillage && isTownHallLevelTen);

  // Kaynak yeterliliği kontrolü
  const canAffordUpgrade = 
    village.resources.wood >= upgradeCost.wood &&
    village.resources.stone >= upgradeCost.stone &&
    village.resources.iron >= upgradeCost.iron &&
    village.resources.grain >= upgradeCost.grain &&
    village.resources.gold >= upgradeCost.gold;

  const rawBuildingImg = bDef.image || getBuildingImage(activeType);
  const transparentBuildingImg = useTransparentImage(rawBuildingImg, 235);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-3xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col shadow-2xl overflow-hidden text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="shrink-0 p-3 sm:p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-stone-900 border border-amber-600/50 overflow-hidden shrink-0 shadow-lg flex items-center justify-center">
              <img 
                src={transparentBuildingImg} 
                alt={bDef.name} 
                className="w-full h-full object-contain p-1" 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <span className="text-2xl pointer-events-none select-none absolute">
                {bDef.icon}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-amber-300 font-serif">
                  {bDef.name}
                </h3>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 font-mono">
                  Seviye {currentLevel} / {bDef.maxLevel}
                </span>
                {isCapitalVillage && (activeType === 'town_hall' || activeType === 'umaykut') && (
                  <div className="flex items-center gap-1 bg-stone-800 p-0.5 rounded border border-stone-700">
                    <button
                      onClick={() => setActiveType('town_hall')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        activeType === 'town_hall' 
                          ? 'bg-amber-600 text-white shadow' 
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Merkez Otağ
                    </button>
                    <button
                      onClick={() => setActiveType('umaykut')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                        activeType === 'umaykut' 
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 shadow' 
                          : 'text-amber-400 hover:text-amber-300'
                      }`}
                    >
                      🦅 Zafer Mabedi
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5">
                {bDef.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 sm:space-y-5 flex-1 min-h-0 text-xs custom-scrollbar">
          
          {/* A. Bina Özel İçeriği */}
          {activeType === 'town_hall' && (
            <TownHallContent 
              village={village} 
              playerVillages={playerVillages}
              nodes={nodes} 
              onOpenFoundVillageModal={onOpenFoundVillageModal}
              onCloseModal={onClose}
              onSwitchToUmaykut={() => setActiveType('umaykut')}
            />
          )}

          {activeType === 'umaykut' && (
            <UmaykutContent 
              village={village} 
              playerVillages={playerVillages}
              isCapitalVillage={isCapitalVillage}
              isTenVillagesFounded={isTenVillagesFounded}
              isTownHallLevelTen={isTownHallLevelTen}
              canBuildUmaykut={canBuildUmaykut}
              onCloseModal={onClose}
            />
          )}

          {activeType === 'school' && (
            <SchoolContent 
              village={village} 
              playerVillages={playerVillages}
              onCloseModal={onClose}
            />
          )}

          {activeType === 'barracks' && (
            <BarracksContent 
              village={village} 
              onTrain={onTrainUnits} 
            />
          )}

          {activeType === 'stables' && (
            <StablesContent 
              village={village} 
              onTrain={onTrainUnits} 
            />
          )}

          {activeType === 'watchtower' && (
            <WatchtowerContent 
              village={village} 
              onTrain={onTrainUnits} 
            />
          )}

          {activeType === 'wall' && (
            <WallContent 
              village={village} 
            />
          )}

          {activeType === 'market' && (
            <MarketContent 
              village={village} 
              onTrade={onMarketTrade} 
            />
          )}

          {activeType === 'hideout' && (
            <HideoutContent 
              village={village} 
            />
          )}

          {(activeType === 'granary' || activeType === 'warehouse') && (
            <GranaryContent 
              village={village} 
            />
          )}

          {activeType === 'forge' && (
            <ForgeContent 
              village={village} 
              onStartResearch={onStartForgeResearch}
              onCancelResearch={onCancelForgeResearch}
            />
          )}

          {activeType === 'field' && (
            <FieldContent 
              village={village} 
            />
          )}

          {/* B. Seviye Yükseltme Paneli (Upgrade Section) */}
          <div className="border-t border-stone-800 pt-4 mt-4 bg-stone-950/60 p-3.5 rounded-lg border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="font-bold text-stone-200 text-sm flex items-center gap-1.5 font-serif">
                  <ArrowUpCircle className="w-4 h-4 text-amber-400" />
                  Seviye {currentLevel + 1} İçin İnşaat Gereksinimleri
                </h4>
                <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-stone-500" />
                  <span>İnşaat Süresi: <strong>{upgradeDuration} saniye</strong> (Merkez Binası indirimi uygulandı)</span>
                </div>
              </div>

              {!isMaxLevel && (
                <button
                  disabled={!canAffordUpgrade || isUpgradingThisBuilding || (isUmaykutBuilding && !canBuildUmaykut)}
                  onClick={() => onUpgradeBuilding(activeType)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                    isUpgradingThisBuilding
                      ? 'bg-amber-950 text-amber-400 border border-amber-800 cursor-not-allowed'
                      : isUmaykutBuilding && !canBuildUmaykut
                      ? 'bg-stone-800 text-amber-500/80 cursor-not-allowed border border-amber-900/60'
                      : canAffordUpgrade
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  }`}
                >
                  {isUpgradingThisBuilding ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>İnşa Ediliyor...</span>
                    </>
                  ) : isUmaykutBuilding && !canBuildUmaykut ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Ön Şartlar Eksik (Kilitli)</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="w-4 h-4" />
                      <span>Seviye {currentLevel + 1}'e Yükselt</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Maliyet İndikatörleri */}
            {!isMaxLevel ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <ResourceCostChip label="Odun" resourceType="wood" need={upgradeCost.wood} have={village.resources.wood} />
                <ResourceCostChip label="Taş" resourceType="stone" need={upgradeCost.stone} have={village.resources.stone} />
                <ResourceCostChip label="Demir" resourceType="iron" need={upgradeCost.iron} have={village.resources.iron} />
                <ResourceCostChip label="Tahıl" resourceType="grain" need={upgradeCost.grain} have={village.resources.grain} />
                <ResourceCostChip label="Altın" resourceType="gold" need={upgradeCost.gold} have={village.resources.gold} />
              </div>
            ) : (
              <div className="text-center py-2 text-amber-400 font-semibold text-xs">
                Bu bina en yüksek seviyesine (Seviye {bDef.maxLevel}) ulaşmıştır.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

// 1. MERKEZ BİNASI İÇERİĞİ: Etki Alanı, Kapsanan Kaynak Düğümleri ve İskan (Köy Kurma)
function TownHallContent({ 
  village, 
  playerVillages = [village],
  nodes, 
  onOpenFoundVillageModal,
  onCloseModal,
  onSwitchToUmaykut
}: { 
  village: Village; 
  playerVillages?: Village[];
  nodes: ResourceNode[]; 
  onOpenFoundVillageModal?: () => void;
  onCloseModal?: () => void;
  onSwitchToUmaykut?: () => void;
}) {
  const currentLvl = village.buildings.town_hall || 1;
  const currentRadius = getInfluenceRadius(currentLvl);
  const nextRadius = getInfluenceRadius(currentLvl + 1);
  const { captured } = getCapturedNodesForVillage(village, nodes);
  const isCapital = !!village.isCapital || village.id === 'v_merkez' || village.id === playerVillages[0]?.id;

  // İskan Kurma Hakları (Her Seviye 10 Merkez Binası yeni bir köy hakkı verir, maks 10)
  const qualifiedCount = playerVillages.filter(v => (v.buildings.town_hall || 0) >= 10).length;
  const maxAllowedVillages = Math.min(10, 1 + qualifiedCount);
  const canFoundNew = playerVillages.length < maxAllowedVillages && playerVillages.length < 10;

  // Bir sonraki seviyede kapsanacak yeni düğümler
  const potentialNewNodes = nodes.filter(n => {
    const dist = calculateDistance(village.x, village.y, n.x, n.y);
    return dist > currentRadius && dist <= nextRadius;
  });

  return (
    <div className="space-y-4">
      
      {/* 🏛️ Cihan Mabedi İnşaatı & Cihan Hâkimiyeti Bölümü (Merkez Binası Üzerine) */}
      <div className="bg-gradient-to-r from-amber-950/40 via-stone-950 to-amber-950/40 border border-amber-600/60 rounded-lg p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦅</span>
            <div>
              <h4 className="font-bold text-amber-300 text-xs">
                Cihan Hâkimiyeti: Zafer Mabedi (Seviye 1 - 10)
              </h4>
              <p className="text-[11px] text-stone-400">
                10 köy kurmuş beylerin payitahtında Seviye 10 Merkez Binası üzerine inşa edilir.
              </p>
            </div>
          </div>
          <span className="text-xs bg-stone-900 border border-amber-800 text-amber-300 font-mono px-2 py-0.5 rounded">
            Seviye {village.buildings.umaykut || 0} / 10 Mabet
          </span>
        </div>

        <div className="p-2.5 bg-stone-950 rounded border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-1">
            <div className="text-stone-300 text-[11px] flex flex-wrap items-center gap-2">
              <span className="text-stone-400 font-semibold">Ön Şartlar:</span>
              <span className={playerVillages.length >= 10 ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                {playerVillages.length >= 10 ? '✓ 10/10 Köy' : `✗ ${playerVillages.length}/10 Köy`}
              </span>
              <span className="text-stone-600">•</span>
              <span className={isCapital ? 'text-emerald-400' : 'text-red-400'}>
                {isCapital ? '✓ Merkez Otağ' : '✗ Taşra Köyü'}
              </span>
              <span className="text-stone-600">•</span>
              <span className={currentLvl >= 10 ? 'text-emerald-400 font-mono' : 'text-amber-400 font-mono'}>
                {currentLvl >= 10 ? '✓ Seviye 10 Otağ' : `✗ Seviye ${currentLvl}/10 Otağ`}
              </span>
            </div>
          </div>

          {onSwitchToUmaykut && (
            <button
              onClick={onSwitchToUmaykut}
              className="px-3 py-1.5 rounded font-bold text-xs bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-stone-950 transition cursor-pointer shrink-0 shadow flex items-center gap-1.5"
            >
              <span>🦅 Zafer Mabedini Gör</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
      
      {/* İskan & Yeni Köy Kurma Durum Kartı */}
      <div className="bg-amber-950/30 border border-amber-800/60 rounded-lg p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛺</span>
            <div>
              <h4 className="font-bold text-amber-200 text-xs">
                İskan & Yeni Köy Kurma (Maks 10 Köy)
              </h4>
              <p className="text-[11px] text-stone-400">
                Her Seviye 10 Merkez Binası +1 yeni köy kurma hakkı açar.
              </p>
            </div>
          </div>
          <span className="text-xs bg-stone-900 border border-amber-900 text-amber-300 font-mono px-2 py-0.5 rounded">
            {playerVillages.length} / 10 Köy
          </span>
        </div>

        <div className="p-2.5 bg-stone-950 rounded border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <div className="text-stone-300">
              Bu Köyün Merkez Binası: <strong className={currentLvl >= 10 ? "text-emerald-400 font-mono" : "text-amber-400 font-mono"}>Seviye {currentLvl} / 10</strong>
            </div>
            <div className="text-[10px] text-stone-500">
              {currentLvl >= 10 
                ? '✓ Bu köy 10. seviyeye ulaştı ve yeni köy kurma hakkı sağladı.'
                : `Seviye 10 olduğunda (${10 - currentLvl} seviye kaldı) yeni köy hakkı açılacaktır.`
              }
            </div>
          </div>

          {onOpenFoundVillageModal && (
            <button
              onClick={() => {
                if (onCloseModal) onCloseModal();
                onOpenFoundVillageModal();
              }}
              className={`px-3 py-1.5 rounded font-bold text-xs transition cursor-pointer shrink-0 ${
                canFoundNew 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md animate-pulse' 
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
              }`}
            >
              {canFoundNew ? 'Yeni Köy Kur →' : 'Köy Kurma Şartları'}
            </button>
          )}
        </div>
      </div>

      {/* Etki Alanı Metrik Kartı */}
      <div className="bg-stone-950 p-4 rounded-lg border border-amber-900/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Harita Etki Yarıçapı Çemberi (Radius)
            </span>
            <div className="text-xl font-bold text-stone-100 font-mono flex items-center gap-3">
              <span>{currentRadius} tile</span>
              <span className="text-stone-500 text-sm">→</span>
              <span className="text-emerald-400 text-sm">Seviye {currentLvl + 1}: {nextRadius} tile (+1.25)</span>
            </div>
            <p className="text-stone-400 text-[11px]">
              Köyün etrafındaki bu dairesel alan genişledikçe, içine giren tüm harita kaynak düğümleri köye otomatik ve daimi saatlik gelir sağlar.
            </p>
          </div>

          <div className="bg-stone-900 px-4 py-2 rounded-lg border border-stone-800 text-center shrink-0">
            <div className="text-xs text-stone-400">Aktif Kapsanan Düğüm</div>
            <div className="text-2xl font-bold text-amber-300 font-mono">{captured.length}</div>
          </div>
        </div>
      </div>

      {/* Şu Anda Kapsanan Kaynak Düğümleri Tablosu */}
      <div>
        <h4 className="font-bold text-stone-300 text-xs mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Kapsama Alanında Olan ve Gelir Sağlayan Düğümler ({captured.length})
        </h4>

        {captured.length > 0 ? (
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {captured.map(node => {
              const dist = calculateDistance(village.x, village.y, node.x, node.y);
              return (
                <div 
                  key={node.id} 
                  className="bg-stone-950 p-2 rounded border border-stone-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ResourceIcon type={node.type} size="sm" />
                    <div>
                      <div className="font-semibold text-stone-200">{node.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        ({node.x} | {node.y}) • Mesafe: {dist.toFixed(1)} tile
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-emerald-400 font-bold">+{node.baseYieldPerHour} / saat</div>
                    <div className="text-[10px] text-stone-400 capitalize">{node.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-stone-950 rounded border border-stone-800 text-stone-500 text-center italic">
            Etki alanında kaynak düğümü bulunmuyor. Merkez Binası seviyesini artırarak çemberi büyütün.
          </div>
        )}
      </div>

      {/* Bir Sonraki Seviyede Yutulacak Potansiyel Düğümler */}
      {potentialNewNodes.length > 0 && (
        <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg">
          <h4 className="font-bold text-emerald-400 text-xs mb-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Bir Sonraki Seviyede ({nextRadius} tile) Kapsanacak Yeni Düğümler:
          </h4>
          <div className="space-y-1">
            {potentialNewNodes.map(node => (
              <div key={node.id} className="flex items-center justify-between text-[11px] text-stone-300">
                <span className="flex items-center gap-1.5">
                  <ResourceIcon type={node.type} size="xs" /> 
                  <span>{node.name} ({node.x} | {node.y})</span>
                </span>
                <span className="text-emerald-300 font-mono font-semibold">+{node.baseYieldPerHour}/s {node.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Umaykut Online: Merkez Boşta Nüfus ve Asker Dönüştürme Bilgi Panosu
function PopulationRecruitmentBanner({ village }: { village: Village }) {
  const idle = village.idlePopulation ?? 0;
  const remainingSec = getNextSpawnTimeRemaining(village);
  const progressPct = getPopulationSpawnProgress(village);
  const spawnDurationSec = getPopulationSpawnDuration(village);

  return (
    <div className="p-3 bg-gradient-to-r from-[#2c1a0e] via-[#1a0f08] to-[#2c1a0e] rounded-xl border border-[#a67c48]/60 shadow-[0_3px_10px_rgba(0,0,0,0.7)] text-stone-200 mb-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#4d3219]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧑‍🌾</span>
          <div>
            <div className="text-xs font-serif font-black text-[#fcedc7] flex items-center gap-1.5">
              <span>MERKEZ BOŞTA NÜFUS:</span>
              <span className="text-amber-400 font-mono text-sm bg-stone-900/90 px-2 py-0.5 rounded border border-amber-500/40">
                {idle} Alp / İşçi
              </span>
            </div>
            <div className="text-[10px] text-stone-400">
              Beylik kuralı: Askerler sıfırdan üretilmez; her asker için <strong className="text-amber-300">1 Boşta İşçi + Hammadde</strong> gerekir.
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[10px] text-stone-400 font-serif">Yeni İşçi Doğumu:</div>
          <div className="text-xs font-mono font-bold text-emerald-400">
            ⏳ {formatRemainingTime(remainingSec)} (+1 İşçi)
          </div>
        </div>
      </div>

      {/* Doğum İlerleme Çubuğu */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 mb-0.5">
          <span>İşçi Doğum Döngüsü ({Math.round(spawnDurationSec / 60)} dk{village.faction === 'karamanogullari' ? ' • Karamanoğulları Bonusu' : ''})</span>
          <span className="text-amber-300 font-bold">%{progressPct}</span>
        </div>
        <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
          <div 
            className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-emerald-500 transition-all duration-500" 
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// 2. KIŞLA İÇERİĞİ: Piyade Eğitimi
function BarracksContent({ village, onTrain }: { village: Village; onTrain: (u: UnitType, a: number) => void }) {
  const faction = FACTIONS[village.faction];
  const bLvl = village.buildings.barracks || 0;

  // Bu beyliğin kışlasında üretilebilen piyade ve muhasara birlikleri
  const allBarracksUnits: UnitType[] = ['mizrakli', 'kilicli', 'gulam', 'levent', 'kocbasi', 'mancinik', 'top'];
  if (faction.specialUnitId && !allBarracksUnits.includes(faction.specialUnitId as UnitType)) {
    allBarracksUnits.push(faction.specialUnitId as UnitType);
  }
  const infantryUnits: UnitType[] = allBarracksUnits.filter(uId => isUnitProducibleByFaction(uId, village.faction));

  return (
    <div className="space-y-3">
      <PopulationRecruitmentBanner village={village} />

      <div className="text-[11px] text-stone-400 bg-stone-950 p-2 rounded border border-stone-800">
        Piyade eğitimi askerin türüne göre <strong>Tahıl Tüketimi (Upkeep)</strong> yaratır. Bu durum saatlik tahıl gelirinizi doğrudan frenler.
      </div>

      <div className="space-y-2">
        {infantryUnits.map(uId => {
          const uDef = UNITS[uId];
          const isUnlocked = bLvl >= uDef.minBuildingLevel;
          return (
            <UnitTrainingRow 
              key={uId} 
              unitDef={uDef} 
              village={village} 
              isUnlocked={isUnlocked} 
              onTrain={onTrain} 
            />
          );
        })}
      </div>
    </div>
  );
}

// 3. AHIR İÇERİĞİ: Süvari Eğitimi
function StablesContent({ village, onTrain }: { village: Village; onTrain: (u: UnitType, a: number) => void }) {
  const faction = FACTIONS[village.faction];
  const bLvl = village.buildings.stables || 0;

  const allStablesUnits: UnitType[] = ['hafif_suvari'];
  if (faction.specialUnitId && !allStablesUnits.includes(faction.specialUnitId as UnitType)) {
    allStablesUnits.push(faction.specialUnitId as UnitType);
  }
  const cavalryUnits: UnitType[] = allStablesUnits.filter(uId => isUnitProducibleByFaction(uId, village.faction));

  return (
    <div className="space-y-3">
      <PopulationRecruitmentBanner village={village} />

      <div className="text-[11px] text-stone-400 bg-stone-950 p-2 rounded border border-stone-800">
        Süvariler yüksek hareket hızına ve yağma kapasitesine sahiptir. Her süvari <strong>2 Tahıl/saat</strong> erzak tüketir.
      </div>

      <div className="space-y-2">
        {cavalryUnits.map(uId => {
          const uDef = UNITS[uId];
          const isUnlocked = bLvl >= uDef.minBuildingLevel;
          return (
            <UnitTrainingRow 
              key={uId} 
              unitDef={uDef} 
              village={village} 
              isUnlocked={isUnlocked} 
              onTrain={onTrain} 
            />
          );
        })}
      </div>
    </div>
  );
}

// 4. GÖZCÜ KULESİ: Casus Eğitimi
function WatchtowerContent({ village, onTrain }: { village: Village; onTrain: (u: UnitType, a: number) => void }) {
  const bLvl = village.buildings.watchtower || 0;
  const spyDef = UNITS.casus;
  const isUnlocked = bLvl >= 1;

  return (
    <div className="space-y-3">
      <PopulationRecruitmentBanner village={village} />

      <div className="text-[11px] text-stone-400 bg-stone-950 p-2 rounded border border-stone-800">
        Casuslar haritadaki hedef köylere gizlice sızarak hammadde depolarını, sur seviyesini ve içeride bekleyen garnizon askerlerini raporlar.
      </div>

      <UnitTrainingRow 
        unitDef={spyDef} 
        village={village} 
        isUnlocked={isUnlocked} 
        onTrain={onTrain} 
      />
    </div>
  );
}

// 5. SUR İÇERİĞİ: Savunma Bonusu
function WallContent({ village }: { village: Village }) {
  const wallLvl = village.buildings.wall || 0;
  const bonus = getWallDefenseBonus(wallLvl);
  const nextBonus = getWallDefenseBonus(wallLvl + 1);

  return (
    <div className="space-y-4">
      <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-400 font-semibold">Surun Orduya Savunma Katkısı</div>
            <div className="text-2xl font-bold text-blue-400 font-mono">
              +%{bonus} Garnizon Savunması
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">Seviye {wallLvl + 1}'de</div>
            <div className="text-base font-bold text-blue-300 font-mono">+%{nextBonus}</div>
          </div>
        </div>
      </div>

      <div className="text-stone-300 text-[11px] space-y-1 bg-stone-950 p-3 rounded border border-stone-800/60 leading-relaxed">
        <p>
          • <strong>Matematiksel Fonksiyon:</strong> Savaş motorunda garnizondaki tüm askerlerin efektif savunma puanı <code>(1 + SurSeviyesi * 0.05)</code> çarpanı ile çarpılır.
        </p>
        <p>
          • <strong>Koçbaşı Etkisi:</strong> Saldırgan ordusundaki Koçbaşı birlikleri, surun koruma çarpanını savaş anında kırar ve savaştan sonra sur seviyesini kalıcı olarak düşürebilir.
        </p>
      </div>
    </div>
  );
}

// 6. PAZAR İÇERİĞİ: Hızlı Kaynak Takası & Merkezi Ortak Hazine
function MarketContent({ 
  village, 
  onTrade,
}: { 
  village: Village; 
  onTrade: (f: keyof Resources, t: keyof Resources, a: number) => void;
}) {
  const [fromRes, setFromRes] = useState<keyof Resources>('wood');
  const [toRes, setToRes] = useState<keyof Resources>('iron');
  const [amount, setAmount] = useState<number>(500);

  const resList: (keyof Resources)[] = ['wood', 'stone', 'iron', 'grain', 'gold'];

  const handleTradeSubmit = () => {
    if (fromRes === toRes) return;
    if (village.resources[fromRes] < amount) return;
    onTrade(fromRes, toRes, amount);
  };

  return (
    <div className="space-y-4">
      {/* 1. MERKEZİ ORTAK KAYNAK HAVUZU BİLGİLENDİRMESİ */}
      <div className="bg-gradient-to-r from-[#21140a] via-[#2d1b0f] to-[#21140a] p-4 rounded-xl border-2 border-[#8c6738] shadow-md flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#3a2212] border border-[#d4af37] flex items-center justify-center text-xl shrink-0 shadow">
          🏛️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[#fcedc7] text-xs sm:text-sm font-serif tracking-wide uppercase">
              Merkezi Hazine & Ortak Kaynak Havuzu
            </h4>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-600/40">
              Aktif
            </span>
          </div>
          <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
            Hükmettiğiniz tüm otağlarda üretilen odun, taş, demir, tahıl ve altınlar ortak havuzda toplanır. Köyler arası kervan sevk etmeye gerek kalmadan tüm kaynaklar her otağınızda ortaklaşa kullanılır. Pazar Yeri ile ihtiyaç duyduğunuz kaynakları 1:1 oranında anında takas edebilirsiniz.
          </p>
        </div>
      </div>

      {/* 2. KAYNAK DÖNÜŞTÜRME & ANLIK TAKAS */}
      <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-3">
        <h4 className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
          Kaynak Dönüştürme & Takas (Birebir Oran)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Verilen */}
          <div>
            <label className="text-[10px] text-stone-400 block mb-1">Verilecek Kaynak</label>
            <select
              value={fromRes}
              onChange={(e) => setFromRes(e.target.value as keyof Resources)}
              className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-xs font-semibold text-stone-200 cursor-pointer"
            >
              {resList.map(r => (
                <option key={r} value={r}>
                  {r.toUpperCase()} (Mevcut: {Math.floor(village.resources[r])})
                </option>
              ))}
            </select>
          </div>

          {/* Miktar */}
          <div>
            <label className="text-[10px] text-stone-400 block mb-1">Takas Miktarı</label>
            <input
              type="number"
              min={100}
              max={Math.floor(village.resources[fromRes])}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-xs font-mono font-bold text-amber-300"
            />
          </div>

          {/* Alınan */}
          <div>
            <label className="text-[10px] text-stone-400 block mb-1">Alınacak Kaynak</label>
            <select
              value={toRes}
              onChange={(e) => setToRes(e.target.value as keyof Resources)}
              className="w-full bg-stone-900 border border-stone-700 rounded p-2 text-xs font-semibold text-stone-200 cursor-pointer"
            >
              {resList.filter(r => r !== fromRes).map(r => (
                <option key={r} value={r}>
                  {r.toUpperCase()} (Mevcut: {Math.floor(village.resources[r])})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          disabled={fromRes === toRes || village.resources[fromRes] < amount || amount <= 0}
          onClick={handleTradeSubmit}
          className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 font-bold rounded text-xs transition cursor-pointer text-white shadow"
        >
          {amount.toLocaleString()} {fromRes.toUpperCase()} Ver → {amount.toLocaleString()} {toRes.toUpperCase()} Al (Takası Onayla)
        </button>
      </div>
    </div>
  );
}

// 7. SIĞINAK İÇERİĞİ: Yağma Koruması
function HideoutContent({ village }: { village: Village }) {
  const hLvl = village.buildings.hideout || 0;
  const protectedAmount = getVillageHideoutProtection(village);
  const nextProtected = getHideoutCapacity(hLvl + 1, village.faction);

  return (
    <div className="space-y-4">
      <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-400 font-semibold">Korunan Güvenli Kasa Kotası (Her Kaynak İçin)</div>
            <div className="text-2xl font-bold text-amber-400 font-mono flex items-center gap-1.5">
              <span>🔒</span>
              <span>{protectedAmount.toLocaleString()} birim</span>
            </div>
            <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
              Formül: Seviye 1'de 400 adet, her seviyede ek +%50 koruma
            </div>
            {village.faction === 'candarogullari' && (
              <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">Candaroğulları Dağ Sığınağı: +500</span>
            )}
            {village.faction === 'aydinogullari' && (
              <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-0.5">Aydınoğulları Kıyı Mahzeni: +300</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">Seviye {hLvl + 1}'de</div>
            <div className="text-base font-bold text-amber-300 font-mono">{nextProtected.toLocaleString()} birim</div>
          </div>
        </div>
      </div>

      <div className="text-stone-300 text-[11px] bg-stone-950 p-3 rounded border border-stone-800/60 leading-relaxed space-y-1.5 font-serif">
        <p>
          <strong>Hazine Yağma ve Sığınak Kuralı:</strong> Düşman çapulcu ve akıncıları saldırdığında tüm ortak hazineyi yağmalayamaz. Ortak kasadaki kaynaklar oyuncunun toplam köy sayısına bölünür (Köy Payı).
        </p>
        <p>
          Sığınağınız bu pay içindeki <strong>{protectedAmount.toLocaleString()} Odun, Taş, Demir, Tahıl ve Altını</strong> koruma altına alır:
          <span className="block font-mono text-amber-400 text-[10.5px] mt-0.5">Yağmalanabilir = Math.max(0, Mevcut Kaynak - Korunan Kota)</span>
        </p>
        <p className="text-amber-300">
          🛡️ Yağmalanan köy 1 saat ({PLUNDER_COOLDOWN_SEC / 60} dakika) boyunca yağma koruması altına girer.
        </p>
      </div>
    </div>
  );
}

// 7.1 ZAHİRE AMBARI VE DEPO İÇERİĞİ: Depolama Tavanı & Çürüme Koruması
function GranaryContent({ village }: { village: Village }) {
  const granaryLvl = village.buildings.granary || 0;
  const warehouseLvl = village.buildings.warehouse || 0;
  const currentCap = getVillageMaxCapacity(village);
  const nextVillageState: Village = {
    ...village,
    buildings: {
      ...village.buildings,
      granary: granaryLvl + 1,
    }
  };
  const nextCap = getVillageMaxCapacity(nextVillageState);

  return (
    <div className="space-y-4">
      <div className="bg-stone-950 p-4 rounded-lg border border-stone-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-400 font-semibold">Toplam Kaynak Depolama Tavanı (Storage Cap)</div>
            <div className="text-2xl font-bold text-amber-400 font-mono flex items-center gap-1.5">
              <span>🌾</span>
              <span>{currentCap.toLocaleString()} birim</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-bold">
              Tahıl Çürümesi Engelleme: {granaryLvl > 0 ? '✓ Aktif (%100 Koruma)' : 'Ambar İnşa Edilmeli'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">Seviye {granaryLvl + 1}'de</div>
            <div className="text-base font-bold text-amber-300 font-mono">{nextCap.toLocaleString()} birim</div>
          </div>
        </div>
      </div>

      <div className="text-stone-300 text-[11px] bg-stone-950 p-3 rounded border border-stone-800/60 leading-relaxed space-y-1.5 font-serif">
        <p>
          <strong>Zahire & Depolama Mekaniği:</strong> Zahire Ambarı seviyesi arttıkça toplam kaynak depolama tavanınız katlanır ve tarladan toplanan buğdayın çürümesi engellenir.
        </p>
        <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono mt-1">
          <div className="bg-stone-900/80 p-2 rounded border border-stone-800">
            <span className="text-stone-400 block">Zahire Ambarı (Seviye {granaryLvl}):</span>
            <span className="text-amber-300 font-bold">{granaryLvl > 0 ? `+${(currentCap - 2000 - warehouseLvl * 1500).toLocaleString()} Kapasite` : '0 Kapasite'}</span>
          </div>
          <div className="bg-stone-900/80 p-2 rounded border border-stone-800">
            <span className="text-stone-400 block">Depo Desteği (Seviye {warehouseLvl}):</span>
            <span className="text-amber-300 font-bold">+{warehouseLvl * 1500} Kapasite</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tekil Birlik Eğitim Satırı Komponenti
interface UnitTrainingRowProps {
  unitDef: UnitDefinition;
  village: Village;
  isUnlocked: boolean;
  onTrain: (u: UnitType, a: number) => void;
}

const UnitTrainingRow: React.FC<UnitTrainingRowProps> = ({
  unitDef,
  village,
  isUnlocked,
  onTrain,
}) => {
  const [count, setCount] = useState<number>(5);

  const totalCost: Resources = {
    wood: unitDef.cost.wood * count,
    stone: unitDef.cost.stone * count,
    iron: unitDef.cost.iron * count,
    grain: unitDef.cost.grain * count,
    gold: unitDef.cost.gold * count,
  };

  const canAffordResources = 
    village.resources.wood >= totalCost.wood &&
    village.resources.stone >= totalCost.stone &&
    village.resources.iron >= totalCost.iron &&
    village.resources.grain >= totalCost.grain &&
    village.resources.gold >= totalCost.gold;

  const currentIdle = village.idlePopulation || 0;
  const canAffordWorkers = currentIdle >= count;
  const canAfford = canAffordResources && canAffordWorkers;

  // En fazla kaç asker eğitilebilir (hammadde ve boşta nüfus kesişimi)
  const maxAffordableByRes = Math.min(
    unitDef.cost.wood > 0 ? Math.floor(village.resources.wood / unitDef.cost.wood) : 999,
    unitDef.cost.stone > 0 ? Math.floor(village.resources.stone / unitDef.cost.stone) : 999,
    unitDef.cost.iron > 0 ? Math.floor(village.resources.iron / unitDef.cost.iron) : 999,
    unitDef.cost.grain > 0 ? Math.floor(village.resources.grain / unitDef.cost.grain) : 999,
    unitDef.cost.gold > 0 ? Math.floor(village.resources.gold / unitDef.cost.gold) : 999
  );
  const maxPossible = Math.max(1, Math.min(currentIdle, maxAffordableByRes));

  const handleSetMax = () => {
    setCount(maxPossible);
  };

  return (
    <div className={`p-3 rounded-lg border ${isUnlocked ? 'bg-stone-950 border-stone-800' : 'bg-stone-950/40 border-stone-800/50 opacity-60'}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <UnitPortrait unitId={unitDef.id} size="md" showModalOnClick={true} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {unitDef.isSpecialUnit && FACTIONS[village.faction]?.flagImage && (
                <div className="w-5 h-3.5 rounded overflow-hidden border border-amber-500/70 shadow-sm shrink-0">
                  <img 
                    src={FACTIONS[village.faction].flagImage} 
                    alt="Beylik Bayrağı" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <span className="font-bold text-stone-200 text-xs">{unitDef.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono text-stone-400 capitalize">
                {unitDef.category}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                unitDef.isSpecialUnit 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80' 
                  : 'bg-stone-900 text-stone-300 border border-stone-800'
              }`}>
                {unitDef.isSpecialUnit ? '⭐ Beylik Özel' : 'Standart Asker'}
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                Garnizonda: {village.units[unitDef.id as UnitType] || 0}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] text-stone-400 mt-1 font-mono">
              <span title="Taarruz gücü (0-100)">Saldırı: <strong className="text-red-400">{unitDef.attackPower}</strong></span>
              <span title="Piyade taarruzlarına karşı savunma">Piyade Sav: <strong className="text-blue-400">{unitDef.defenseInfantry}</strong></span>
              <span title="Süvari taarruzlarına karşı savunma">Süvari Sav: <strong className="text-cyan-400">{unitDef.defenseCavalry}</strong></span>
              <span title="Sefer Hız Puanı (0-100)">⚡ Hız: <strong className="text-amber-300">{unitDef.speedScore ?? 50}/100</strong></span>
              <span title="Ganimet Kapasite Puanı (0-100)">💰 Ganimet: <strong className="text-yellow-400">{unitDef.plunderScore ?? 50}/100</strong></span>
              <span>İaşe: <strong className="text-amber-400">-{unitDef.grainUpkeepPerHour}/s</strong></span>
            </div>
          </div>
        </div>

        {isUnlocked ? (
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 shrink-0">
            <button
              onClick={handleSetMax}
              title={`Maksimum Eğitilebilir: ${maxPossible} Asker`}
              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded font-mono text-[10px] font-bold border border-stone-700 transition cursor-pointer shrink-0"
            >
              Maks
            </button>
            <input
              type="number"
              min={1}
              max={Math.max(1, currentIdle)}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 bg-stone-900 border border-stone-700 rounded px-1.5 py-1 text-center font-mono text-xs font-bold text-stone-200 shrink-0"
            />
            <button
              disabled={!canAfford || count <= 0}
              onClick={() => onTrain(unitDef.id, count)}
              title={!canAffordWorkers ? 'Köy merkezinde yeterli boşta işçi yok!' : !canAffordResources ? 'Ortak kasada yeterli kaynak yok!' : ''}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-600 text-white rounded font-bold text-xs transition cursor-pointer shadow flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Silahlandır ({count}x)</span>
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-red-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Kilitli ({unitDef.buildingRequired} Seviye {unitDef.minBuildingLevel})</span>
          </div>
        )}
      </div>

      {isUnlocked && (
        <div className="mt-2 pt-2 border-t border-stone-900 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className={`flex items-center gap-1 font-semibold ${canAffordWorkers ? 'text-emerald-400' : 'text-red-400 font-bold'}`}>
              🧑‍🌾 {count} Boşta İşçi (Mevcut: {currentIdle})
            </span>
            <span className={`flex items-center gap-1 ${village.resources.wood >= totalCost.wood ? 'text-stone-300' : 'text-red-400 font-bold'}`}>
              <ResourceIcon type="wood" size="xs" /> {totalCost.wood}
            </span>
            <span className={`flex items-center gap-1 ${village.resources.stone >= totalCost.stone ? 'text-stone-300' : 'text-red-400 font-bold'}`}>
              <ResourceIcon type="stone" size="xs" /> {totalCost.stone}
            </span>
            <span className={`flex items-center gap-1 ${village.resources.iron >= totalCost.iron ? 'text-stone-300' : 'text-red-400 font-bold'}`}>
              <ResourceIcon type="iron" size="xs" /> {totalCost.iron}
            </span>
            <span className={`flex items-center gap-1 ${village.resources.grain >= totalCost.grain ? 'text-stone-300' : 'text-red-400 font-bold'}`}>
              <ResourceIcon type="grain" size="xs" /> {totalCost.grain}
            </span>
            <span className={`flex items-center gap-1 ${village.resources.gold >= totalCost.gold ? 'text-stone-300' : 'text-red-400 font-bold'}`}>
              <ResourceIcon type="gold" size="xs" /> {totalCost.gold}
            </span>
          </div>

          {!canAffordWorkers && (
            <span className="text-red-400 font-bold text-[10px]">
              ⚠️ Yetersiz Boşta İşçi!
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// 8. Demirci (Silahhane & Dökümhane) İçeriği
function ForgeContent({ 
  village,
  onStartResearch,
  onCancelResearch
}: { 
  village: Village;
  onStartResearch?: (upgradeType: ForgeUpgradeType) => void;
  onCancelResearch?: (queueItemId: string) => void;
}) {
  const forgeLevel = village.buildings.forge || 0;
  const currentUpgrades = getVillageForgeUpgrades(village);
  const researchQueue = village.forgeResearchQueue || [];
  const currentResearch = researchQueue[0];
  const now = Date.now();

  const upgradeTypes: ForgeUpgradeType[] = ['steel_weapons', 'chainmail_armor', 'ram_reinforcement'];

  return (
    <div className="space-y-4">
      {/* Demirci Başlık Kartı */}
      <div className="p-4 bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/40 rounded-xl border border-amber-600/40 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚒️</span>
            <div>
              <h4 className="font-bold text-amber-200 text-sm font-serif">
                Demirci Döküm Ocağı & Silahhane
              </h4>
              <p className="text-[11px] text-stone-400">
                Pusat, zırh dövme ve muhasara koçbaşı çelik takviyeleri merkezi (Kademe 1-10 Araştırma)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-900/60 border border-amber-600/60 text-amber-200 font-mono font-bold">
              Demirci Seviye {forgeLevel}
            </span>
          </div>
        </div>

        {/* 3 Temel Katkı Özeti */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3">
          <div className="bg-stone-950/80 p-2.5 rounded-lg border border-amber-900/50">
            <div className="flex items-center gap-1 text-red-400 font-bold text-[11px] mb-0.5">
              <Swords className="w-3.5 h-3.5" />
              <span>Çelik Pusatlar</span>
            </div>
            <div className="text-base font-mono font-black text-amber-300">
              +{currentUpgrades.steel_weapons * 4}%
            </div>
            <div className="text-[9.5px] text-stone-400">
              Kademe: <strong>{currentUpgrades.steel_weapons} / 10</strong> (Taarruz)
            </div>
          </div>

          <div className="bg-stone-950/80 p-2.5 rounded-lg border border-amber-900/50">
            <div className="flex items-center gap-1 text-blue-400 font-bold text-[11px] mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Örme Zırhlar</span>
            </div>
            <div className="text-base font-mono font-black text-blue-300">
              +{currentUpgrades.chainmail_armor * 4}%
            </div>
            <div className="text-[9.5px] text-stone-400">
              Kademe: <strong>{currentUpgrades.chainmail_armor} / 10</strong> (Savunma)
            </div>
          </div>

          <div className="bg-stone-950/80 p-2.5 rounded-lg border border-amber-900/50">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] mb-0.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Koçbaşı Güçlendirmesi</span>
            </div>
            <div className="text-base font-mono font-black text-yellow-300">
              +{currentUpgrades.ram_reinforcement * 10}%
            </div>
            <div className="text-[9.5px] text-stone-400">
              Kademe: <strong>{currentUpgrades.ram_reinforcement} / 10</strong> (Sur Yıkımı)
            </div>
          </div>
        </div>
      </div>

      {/* Aktif Araştırma Devam Ediyorsa */}
      {currentResearch && (
        <div className="p-3 bg-amber-950/60 border border-amber-600/60 rounded-xl space-y-2">
          {(() => {
            const cfg = FORGE_UPGRADE_CONFIGS[currentResearch.upgradeType];
            const totalDuration = currentResearch.durationSec * 1000;
            const elapsed = Math.max(0, now - currentResearch.startTime);
            const progressPct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
            const remainingSec = Math.max(0, Math.ceil((currentResearch.endTime - now) / 1000));

            return (
              <>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-200">
                    <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>Ocakta Dövülüyor: {cfg?.name} (Seviye {currentResearch.targetLevel})</span>
                  </div>
                  <span className="font-mono text-amber-300 text-[11px]">{remainingSec} sn kaldı</span>
                </div>
                <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-amber-800/60">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {onCancelResearch && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => onCancelResearch(currentResearch.id)}
                      className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* 3 Yükseltme Yolu Listesi */}
      <div className="space-y-3">
        <h5 className="font-bold text-stone-300 text-xs flex items-center gap-1.5 font-serif">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Demirci Ocağı Araştırma Yolları (1 - 10 Seviye)</span>
        </h5>

        <div className="space-y-2.5">
          {upgradeTypes.map(upType => {
            const cfg = FORGE_UPGRADE_CONFIGS[upType];
            const currentLevel = currentUpgrades[upType] || 0;
            const isMax = currentLevel >= cfg.maxLevel;
            const nextLevel = currentLevel + 1;
            const cost = getForgeUpgradeCost(upType, nextLevel);
            const durationSec = getForgeUpgradeDuration(upType, nextLevel, forgeLevel);

            const canAfford = 
              village.resources.wood >= cost.wood &&
              village.resources.stone >= cost.stone &&
              village.resources.iron >= cost.iron &&
              village.resources.grain >= cost.grain &&
              village.resources.gold >= cost.gold;

            const hasForgeLevel = forgeLevel >= nextLevel;
            const isQueueBusy = researchQueue.length > 0;
            const isThisUpgrading = currentResearch?.upgradeType === upType;

            return (
              <div 
                key={upType}
                className="p-3 bg-stone-950/70 rounded-xl border border-stone-800 hover:border-amber-900/60 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-stone-900 border border-amber-700/60 p-0.5 shrink-0 overflow-hidden relative">
                    <img 
                      src={cfg.image} 
                      alt={cfg.name} 
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-0 right-0 text-xs">{cfg.icon}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-200">{cfg.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono">
                        {isMax ? 'Maksimum' : `Sv. ${currentLevel}/${cfg.maxLevel}`}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-stone-400 mt-0.5">
                      {cfg.description}
                    </p>
                    <div className="text-[10.5px] font-mono mt-1 text-emerald-400">
                      Mevcut: <strong>+{currentLevel * cfg.bonusPerLevelPct}%</strong>
                      {!isMax && (
                        <span className="text-amber-300 ml-2">
                          → Sonraki: <strong>+{nextLevel * cfg.bonusPerLevelPct}%</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Buton ve Maliyetler */}
                <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                  {!isMax && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-300 flex-wrap justify-end">
                      <span className={village.resources.wood >= cost.wood ? 'text-stone-300' : 'text-red-400'}>
                        🪵 {cost.wood}
                      </span>
                      <span className={village.resources.stone >= cost.stone ? 'text-stone-300' : 'text-red-400'}>
                        🪨 {cost.stone}
                      </span>
                      <span className={village.resources.iron >= cost.iron ? 'text-stone-300' : 'text-red-400'}>
                        ⛏️ {cost.iron}
                      </span>
                      <span className={village.resources.grain >= cost.grain ? 'text-stone-300' : 'text-red-400'}>
                        🌾 {cost.grain}
                      </span>
                      <span className={village.resources.gold >= cost.gold ? 'text-stone-300' : 'text-red-400'}>
                        🪙 {cost.gold}
                      </span>
                      <span className="text-stone-500 ml-1">⏱️ {durationSec}s</span>
                    </div>
                  )}

                  {isMax ? (
                    <span className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-950/60 rounded border border-emerald-800">
                      Tamamlandı
                    </span>
                  ) : isThisUpgrading ? (
                    <span className="text-xs text-amber-300 font-bold px-2 py-1 bg-amber-950/60 rounded border border-amber-800 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                      Dövülüyor...
                    </span>
                  ) : onStartResearch ? (
                    <button
                      disabled={!canAfford || !hasForgeLevel || isQueueBusy || forgeLevel === 0}
                      onClick={() => onStartResearch(upType)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        canAfford && hasForgeLevel && !isQueueBusy && forgeLevel > 0
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                      }`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>
                        {!hasForgeLevel
                          ? `Demirci Sv. ${nextLevel} Gerekli`
                          : isQueueBusy
                            ? 'Ocak Meşgul'
                            : !canAfford
                              ? 'Kaynak Yetersiz'
                              : `Seviye ${nextLevel} Araştır`}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 9. Tahıl Tarlası & Değirmen İçeriği
function FieldContent({ village }: { village: Village }) {
  const currentLevel = village.buildings.field || 0;
  const yieldBonusPct = currentLevel * 5;
  const nextYieldBonusPct = (currentLevel + 1) * 5;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/40 rounded-xl border border-amber-600/40 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <div>
              <h4 className="font-bold text-amber-200 text-sm font-serif">
                Değirmen Tesisleri & Bereketli Tarlalar
              </h4>
              <p className="text-[11px] text-stone-400">
                Değirmen ve tarla seviyesi, köyün saatlik tahıl üretimine doğrudan çarpan katkısı sağlayarak (+%5 tahıl verimi/seviye) ordu iaşesini teminat altına alır.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-mono font-bold">
              +{yieldBonusPct}% Hasat Verimi
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="bg-stone-950/80 p-3 rounded-lg border border-amber-900/50">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs mb-1">
              <Wheat className="w-4 h-4" />
              <span>Saatlik Tahıl Verim Çarpanı</span>
            </div>
            <div className="text-xl font-mono font-black text-emerald-300">
              +{yieldBonusPct}%
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Seviye {currentLevel + 1}'de: <strong className="text-emerald-200">+{nextYieldBonusPct}%</strong>
            </div>
          </div>

          <div className="bg-stone-950/80 p-3 rounded-lg border border-amber-900/50">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs mb-1">
              <Coins className="w-4 h-4" />
              <span>Garnizon İaşe Kapasitesi</span>
            </div>
            <div className="text-xl font-mono font-black text-amber-300">
              {(currentLevel * 150 + 300).toLocaleString()} Asker
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Tarlalar ordunun zahire açlığını engeller.
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-stone-950 rounded-lg border border-stone-800 text-stone-300 text-xs leading-relaxed space-y-1">
        <div className="font-bold text-amber-300 flex items-center gap-1.5">
          <span>🥖</span>
          <span>Tahıl ve Lojistik Önemi:</span>
        </div>
        <p className="text-[11px] text-stone-400">
          Ordunuzdaki her asker saatlik tahıl tüketir (İaşe/Upkeep). Değirmen ve tarla seviyenizi yüksek tutarak negatif tahıl dengesinden korunabilir ve kalabalık orduları kolaylıkla besleyebilirsiniz.
        </p>
      </div>
    </div>
  );
}

// 10. UMAYKUT BİNASI İÇERİĞİ: Zafer Mabedi, 3 Ön Şart Kontrolü ve 10. Seviye Zafer Yolu
function UmaykutContent({
  village,
  playerVillages,
  isCapitalVillage,
  isTenVillagesFounded,
  isTownHallLevelTen,
  canBuildUmaykut,
  onCloseModal,
}: {
  village: Village;
  playerVillages: Village[];
  isCapitalVillage: boolean;
  isTenVillagesFounded: boolean;
  isTownHallLevelTen: boolean;
  canBuildUmaykut: boolean;
  onCloseModal?: () => void;
}) {
  const currentLvl = village.buildings.umaykut || 0;

  return (
    <div className="space-y-4">
      {/* Zafer Anıtı Başlık Kartı */}
      <div className="bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/60 border border-amber-600/60 rounded-xl p-4 shadow-lg text-stone-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-900/60 border border-amber-500/80 flex items-center justify-center text-2xl shadow">
            🦅
          </div>
          <div>
            <h4 className="font-bold text-amber-200 text-sm font-serif">
              Cihan Hâkimiyeti Zafer Mabedi (Seviye 1 - 10)
            </h4>
            <p className="text-[11px] text-stone-400">
              Sezon Zafer Koşulu: 3 Farklı Beylikten 10. Seviye Zafer Mabedi
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/70 p-3 rounded-lg border border-stone-800">
          Zafer Mabedi, beyliğinizin cihan hâkimiyetini tescilleyen en ulu mimari şaheserdir. Bu yapı yalnızca tüm beyliğini genişletmiş, payitaht merkez köyündeki otağını en üst seviyeye çıkarmış beylerce inşa edilebilir. Kademe kademe 10. seviyeye ulaştırılması astronomik hammadde ve büyük bir sabır gerektirir.
        </p>
      </div>

      {/* 3 İNŞA ÖN ŞARTI KONTROL LİSTESİ */}
      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
        <h5 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Zafer Mabedi İnşa Ön Şartları (3/3 Zorunlu)</span>
        </h5>

        <div className="space-y-2">
          {/* Şart 1: 10 Köy Kurulumu */}
          <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
            isTenVillagesFounded 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
              : 'bg-red-950/40 border-red-800/80 text-red-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {isTenVillagesFounded ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs">
                  1. Haritada 10 Köyün Tamamı Kurulmuş Olmalıdır
                </div>
                <div className="text-[10px] text-stone-400">
                  Cihan mabedi dikebilmek için tüm eyalet ve iskanlarınızı kurmuş olmanız şarttır.
                </div>
              </div>
            </div>
            <div className="text-right font-mono shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isTenVillagesFounded 
                  ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300' 
                  : 'bg-red-900/60 border-red-700 text-red-300'
              }`}>
                {playerVillages.length} / 10 Köy
              </span>
            </div>
          </div>

          {/* Şart 2: Yalnızca Merkez Köyde */}
          <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
            isCapitalVillage 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
              : 'bg-red-950/40 border-red-800/80 text-red-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {isCapitalVillage ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs">
                  2. Yalnızca Merkez Otağ'da İnşa Edilebilir
                </div>
                <div className="text-[10px] text-stone-400">
                  Mabet taşra köylerinde kurulamaz; beyliğin kalbi olan kadim merkezde yükselmelidir.
                </div>
              </div>
            </div>
            <div className="text-right font-mono shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isCapitalVillage 
                  ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300' 
                  : 'bg-red-900/60 border-red-700 text-red-300'
              }`}>
                {isCapitalVillage ? 'Merkez Otağ (Doğrulandı)' : 'Taşra Köyü (İnşa Edilemez)'}
              </span>
            </div>
          </div>

          {/* Şart 3: Merkez Binası Seviye 10 */}
          <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
            isTownHallLevelTen 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
              : 'bg-red-950/40 border-red-800/80 text-red-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {isTownHallLevelTen ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs">
                  3. Merkez Köydeki Merkez Binası 10. Seviye Olmalıdır
                </div>
                <div className="text-[10px] text-stone-400">
                  Zafer Mabedi, 10. seviyedeki Ulu Otağın temelleri üzerine kademeli inşa edilir.
                </div>
              </div>
            </div>
            <div className="text-right font-mono shrink-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isTownHallLevelTen 
                  ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300' 
                  : 'bg-red-900/60 border-red-700 text-red-300'
              }`}>
                Seviye {village.buildings.town_hall || 0} / 10
              </span>
            </div>
          </div>
        </div>

        {/* İnşa İzni Özeti */}
        <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
          canBuildUmaykut 
            ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/60' 
            : 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
        }`}>
          {canBuildUmaykut ? (
            <>
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Tüm Ön Şartlar Sağlandı:</strong> Zafer Mabedini Merkez Binası üzerine kademe kademe 1'den 10'a inşa edebilirsiniz.
              </span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>İnşaat Kilitli:</strong> Zafer Mabedini yükseltebilmek için yukarıda kırmızı ile gösterilen ön şartları tamamlamanız gerekmektedir.
              </span>
            </>
          )}
        </div>
      </div>

      {/* Kademe ve Zafer Durumu Kartı */}
      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">
            Mevcut Mabet Kademesi
          </div>
          <div className="text-xl font-bold font-mono text-stone-100 flex items-center gap-2 mt-0.5">
            <span>Seviye {currentLvl} / 10</span>
            {currentLvl >= 10 && (
              <span className="text-emerald-400 text-xs font-sans font-bold flex items-center gap-1">
                ✓ Zafer Mührü Tamamlandı
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            Her kademe beyliğinize muazzam prestij kazandırır. 10. kademeye ulaştığınızda beyliğinizin zafer mührü ittifak hanesine yazılır.
          </p>
        </div>

        <div className="bg-stone-900 px-4 py-3 rounded-xl border border-stone-800 text-center shrink-0">
          <div className="text-[10px] text-stone-400">Hedef Zafer</div>
          <div className="text-xs font-bold text-amber-300 font-mono">10. Seviye Mabet</div>
          <div className="text-[9px] text-stone-500 mt-0.5">3 Farklı Beylik</div>
        </div>
      </div>
    </div>
  );
}

// 11. OKUL (MEDRESE) İÇERİĞİ: Birlik Oyuncu Kapasitesi (+3/Seviye) ve Çember İlerlemesi
function SchoolContent({
  village,
  playerVillages,
  onCloseModal,
}: {
  village: Village;
  playerVillages: Village[];
  onCloseModal?: () => void;
}) {
  const currentLvl = village.buildings.school || 0;
  const villageBonus = currentLvl * 3;
  const totalPlayerBonus = playerVillages.reduce((sum, v) => sum + (v.buildings.school || 0), 0) * 3;

  return (
    <div className="space-y-4">
      {/* Okul & Birlik Kapasitesi Kartı */}
      <div className="bg-gradient-to-r from-blue-950/50 via-stone-900 to-indigo-950/50 border border-blue-600/50 rounded-xl p-4 shadow-lg text-stone-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-900/60 border border-blue-500/80 flex items-center justify-center text-2xl shadow">
            📚
          </div>
          <div>
            <h4 className="font-bold text-blue-200 text-sm font-serif">
              Okul (Medrese) & Birlik Oyuncu Kapasitesi
            </h4>
            <p className="text-[11px] text-stone-400">
              Hendese, fen ve ilim merkezi. Birlik kontenjanını ve çember büyümesini doğrudan belirler.
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/70 p-3 rounded-lg border border-stone-800">
          Beylik tüzüğü gereğince birliğin azami üye sayısı, üyelerin köylerindeki Okul binalarıyla tayin edilir:
          <br />
          <strong className="text-amber-300">★ Kural: Okul binasının her seviye artışı birliğin oyuncu kapasitesini 3 artırır.</strong>
        </p>
      </div>

      {/* Kapasite Katkı Göstergeleri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800">
          <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
            Bu Köyün Sağladığı Kontenjan
          </div>
          <div className="text-2xl font-mono font-bold text-blue-400 mt-1">
            +{villageBonus} <span className="text-stone-400 text-xs font-sans">Oyuncu</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            Mevcut Okul Seviyesi: Seviye {currentLvl} (× 3 = +{villageBonus})
          </div>
        </div>

        <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800">
          <div className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">
            Tüm Köylerinizin Toplam Katkısı
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            +{totalPlayerBonus} <span className="text-stone-400 text-xs font-sans">Oyuncu</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-1">
            {playerVillages.length} köydeki medreseler toplamı
          </div>
        </div>
      </div>

      {/* Seviye Artış Faydası */}
      <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
        <div className="font-bold text-amber-300 flex items-center gap-1.5">
          <ArrowUpCircle className="w-4 h-4 text-amber-400" />
          <span>Bir Sonraki Seviye (Seviye {currentLvl + 1}):</span>
        </div>
        <p className="text-[11px] text-stone-400">
          Bu okulu Seviye {currentLvl + 1}'e yükselttiğinizde, birliğinizin azami oyuncu kapasitesi anında <strong>+3 artarak</strong> toplamda {villageBonus + 3} kontenjana çıkacaktır.
        </p>
      </div>
    </div>
  );
}

// Yardımcı Maliyet Kutucuğu
function ResourceCostChip({ label, resourceType, need, have }: { label: string; resourceType?: string; need: number; have: number }) {
  const isEnough = have >= need;
  return (
    <div className={`p-2 rounded border text-center ${isEnough ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-red-950/40 border-red-800/60 text-red-300'}`}>
      <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400">
        {resourceType && <ResourceIcon type={resourceType} size="xs" />}
        <span>{label}</span>
      </div>
      <div className="text-xs font-mono font-bold mt-0.5">{need.toLocaleString()}</div>
      <div className={`text-[9px] font-mono ${isEnough ? 'text-emerald-400' : 'text-red-400'}`}>
        Mevcut: {Math.floor(have).toLocaleString()}
      </div>
    </div>
  );
}

function getResourceEmoji(type: string) {
  switch (type) {
    case 'wood': return '🌲';
    case 'stone': return '🪨';
    case 'iron': return '⛏️';
    case 'grain': return '🌾';
    case 'gold': return '🪙';
    default: return '📦';
  }
}
