import React from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March, 
  MarchMission,
  ResourceNode, 
  ResourceRate, 
  TrainingQueueItem, 
  UnitType,
  Village 
} from '../types/game';
import { AnatoliaCanvasMap } from './AnatoliaCanvasMap';

interface MapViewProps {
  playerVillage: Village;
  playerVillages?: Village[];
  rivalVillages: Village[];
  nodes: ResourceNode[];
  activeMarches: March[];
  rates: ResourceRate;
  constructionQueue: ConstructionQueueItem[];
  trainingQueue: TrainingQueueItem[];
  onSelectTargetForMarch: (targetVillage: Village | null, coords: { x: number; y: number }) => void;
  onDispatchMarch?: (
    targetCoords: { x: number; y: number },
    targetName: string,
    mission: MarchMission,
    units: Partial<Record<UnitType, number>>,
    withKhan?: boolean,
    originVillageId?: string,
    isBoosted?: boolean
  ) => void;
  onOpenTownHall: () => void;
  onOpenBuilding: (type: BuildingType) => void;
  onOpenFactionModal: () => void;
  onSelectTab: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onSelectVillage?: (villageId: string) => void;
  onOpenFoundVillageModal?: (coords?: { x: number; y: number }) => void;
  onAssignWorkers?: (villageId: string, nodeId: string, count?: number) => void;
  activeTab: string;
}

export const MapView: React.FC<MapViewProps> = ({
  playerVillage,
  playerVillages = [playerVillage],
  rivalVillages,
  nodes,
  activeMarches,
  rates,
  onSelectTargetForMarch,
  onDispatchMarch,
  onSelectVillage,
  onOpenFoundVillageModal,
  onOpenBuilding,
  onSelectTab,
  onOpenFactionModal,
  onAssignWorkers,
}) => {
  return (
    <div className="w-full font-serif animate-fade-in">
      {/* UMAYKUT TARZI KLASİK TAKTİK ANADOLU MOTORU & SAĞ AHŞAP PERVAZ PANOLARI */}
      <AnatoliaCanvasMap 
        playerVillage={playerVillage}
        playerVillages={playerVillages}
        rivalVillages={rivalVillages}
        nodes={nodes}
        activeMarches={activeMarches}
        rates={rates}
        onSelectTargetForMarch={onSelectTargetForMarch}
        onDispatchMarch={onDispatchMarch}
        onOpenFoundVillageModal={onOpenFoundVillageModal}
        onSelectVillage={onSelectVillage}
        onOpenBuilding={onOpenBuilding}
        onSelectTab={onSelectTab}
        onOpenFactionModal={onOpenFactionModal}
        onAssignWorkers={onAssignWorkers}
      />
    </div>
  );
};
