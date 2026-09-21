import React, { useState } from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March,
  ResourceNode, 
  ResourceRate, 
  TrainingQueueItem, 
  Village 
} from '../types/game';
import { UmaykutVillageInterior } from './UmaykutVillageInterior';
import { OldschoolVillageCards } from './OldschoolVillageCards';
import { Scroll, Landmark } from 'lucide-react';

interface VillageViewProps {
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
  onTrainUnits?: (unitType: any, amount: number) => void;
}

export const VillageView: React.FC<VillageViewProps> = ({
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
  onAssignBuildingToPlot,
  onOpenFoundVillageModal = () => {},
  onOpenFactionModal = () => {},
  onNavigateToMap,
  onSelectTab = () => {},
  onOpenVictoryPanel,
  onTrainUnits,
}) => {
  // Varsayılan görünüm: 'umaykut' (Orijinal Umaykut Otağ ve Köy İçi Görünümü)
  const [viewStyle, setViewStyle] = useState<'umaykut' | 'cards'>('umaykut');

  return (
    <div className="space-y-2 font-serif w-full">
      
      {/* Görünüm Modu Seçici Butonları */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-[#191512] border border-[#523e24] rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs shadow-md">
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewStyle('umaykut')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 rounded font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer touch-manipulation active:scale-95 text-[11px] sm:text-xs ${
              viewStyle === 'umaykut'
                ? 'bg-gradient-to-r from-[#7a2e18] to-[#993b1f] text-[#fbf6ea] shadow-md border border-[#c57954]'
                : 'bg-[#2b2217] text-stone-300 hover:bg-[#3d3121] border border-transparent'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">Köy İçi Görünümü</span>
          </button>

          <button
            onClick={() => setViewStyle('cards')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1 rounded font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer touch-manipulation active:scale-95 text-[11px] sm:text-xs ${
              viewStyle === 'cards'
                ? 'bg-gradient-to-r from-[#7a2e18] to-[#993b1f] text-[#fbf6ea] shadow-md border border-[#c57954]'
                : 'bg-[#2b2217] text-stone-300 hover:bg-[#3d3121] border border-transparent'
            }`}
          >
            <Scroll className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Klasik Liste Modu</span>
          </button>
        </div>

        <div className="text-[10px] sm:text-[11px] font-mono text-[#d6c19f] flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto px-1 sm:px-0 pt-0.5 sm:pt-0 border-t border-[#382b1c] sm:border-t-0">
          <span>Köy Sayısı: <strong className="text-amber-300">{playerVillages.length} / 10</strong></span>
          <span className="text-stone-500">•</span>
          <span>Koordinat: <strong className="text-amber-300">({village.x}|{village.y})</strong></span>
        </div>
      </div>

      {/* 1. UMAYKUT KÖY İÇİ VE SAĞ PANEL GÖRÜNÜMÜ (VARSAYILAN) */}
      {viewStyle === 'umaykut' ? (
        <UmaykutVillageInterior 
          village={village}
          playerVillages={playerVillages}
          onSelectVillage={onSelectVillage}
          nodes={nodes}
          rates={rates}
          constructionQueue={constructionQueue}
          trainingQueue={trainingQueue}
          activeMarches={activeMarches}
          onOpenBuilding={onOpenBuilding}
          onUpgradeBuilding={onUpgradeBuilding}
          onAssignBuildingToPlot={onAssignBuildingToPlot}
          onOpenFoundVillageModal={onOpenFoundVillageModal}
          onOpenFactionModal={onOpenFactionModal}
          onNavigateToMap={onNavigateToMap}
          onSelectTab={onSelectTab}
          onOpenVictoryPanel={onOpenVictoryPanel}
          onTrainUnits={onTrainUnits}
        />
      ) : (
        /* 2. SADE OLDSCHOOL BİNA KARTLARI LİSTE MODU */
        <OldschoolVillageCards 
          village={village}
          playerVillages={playerVillages}
          onSelectVillage={onSelectVillage}
          nodes={nodes}
          rates={rates}
          constructionQueue={constructionQueue}
          trainingQueue={trainingQueue}
          onOpenBuilding={onOpenBuilding}
          onUpgradeBuilding={onUpgradeBuilding}
          onOpenFoundVillageModal={onOpenFoundVillageModal}
          onNavigateToMap={onNavigateToMap}
        />
      )}

    </div>
  );
};
