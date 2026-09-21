import React, { useState } from 'react';
import { Village, ResourceNode, UnitType, MarchMission, FactionId } from '../../types/game';
import { FACTIONS, calculateDistance } from '../../data/gameData';
import { 
  getNodeEfficiency, 
  getNodeTotalWorkers, 
  getVillageWorkersOnNode, 
  getTownHallWorkerLimit, 
  getVillageAssignedWorkersCount, 
  canAssignWorkers 
} from '../../engine/resourceEngine';
import { 
  MapPin, 
  Crosshair, 
  Swords, 
  Eye, 
  Pickaxe, 
  Bookmark, 
  Clock, 
  ShieldAlert, 
  Check, 
  TrendingUp, 
  Castle, 
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';

interface MapSelectionInspectorProps {
  selectedTile: { x: number; y: number };
  playerVillage: Village;
  selectedNode: ResourceNode | null;
  selectedRival: Village | null;
  selectedPlayerV: Village | null;
  influenceRadius: number;
  isSelectedInsideInfluence: boolean;
  onClose: () => void;
  onFocusCoordinates: (x: number, y: number) => void;
  onAssignWorkers?: (villageId: string, nodeId: string, count?: number) => void;
  onOpenFoundVillageModal?: (coords: { x: number; y: number }) => void;
  onSelectVillage?: (villageId: string) => void;
  onOpenDispatchModal: (target: {
    name: string;
    x: number;
    y: number;
    ownerName?: string;
    faction?: FactionId;
    villageId?: string;
  }, initialMission?: MarchMission) => void;
}

export const MapSelectionInspector: React.FC<MapSelectionInspectorProps> = ({
  selectedTile,
  playerVillage,
  selectedNode,
  selectedRival,
  selectedPlayerV,
  influenceRadius,
  isSelectedInsideInfluence,
  onClose,
  onFocusCoordinates,
  onAssignWorkers,
  onOpenFoundVillageModal,
  onSelectVillage,
  onOpenDispatchModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'military'>('overview');
  const [copied, setCopied] = useState(false);

  // Mesafe ve Sefer Süreleri
  const distance = calculateDistance(playerVillage.x, playerVillage.y, selectedTile.x, selectedTile.y);
  // Süvari hızı: ~0.8 dk/kare, Piyade: ~1.4 dk/kare, Kuşatma: ~2.4 dk/kare
  const cavalryTimeMin = Math.max(1, Math.round(distance * 0.8));
  const infantryTimeMin = Math.max(1, Math.round(distance * 1.4));
  const siegeTimeMin = Math.max(2, Math.round(distance * 2.4));

  // Kaynak ve İşçi Durumu
  const nodeEfficiency = selectedNode ? getNodeEfficiency(selectedNode) : 0;
  const nodeTotalWorkers = selectedNode ? getNodeTotalWorkers(selectedNode) : 0;
  const villageWorkersOnNode = selectedNode ? getVillageWorkersOnNode(playerVillage, selectedNode.id) : 0;
  const townHallLimit = getTownHallWorkerLimit(playerVillage.buildings?.town_hall || 1);
  const villageAssignedTotal = getVillageAssignedWorkersCount(playerVillage);
  const workerCheck = selectedNode ? canAssignWorkers(playerVillage, selectedNode, 10) : null;
  const nodeYieldPerHour = villageWorkersOnNode * nodeEfficiency;

  const handleCopyCoords = () => {
    navigator.clipboard?.writeText(`${selectedTile.x}, ${selectedTile.y}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div 
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute bottom-3 right-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 left-3 z-30 max-w-full sm:max-w-2xl md:max-w-3xl w-auto bg-gradient-to-b from-[#25170d]/98 via-[#1a0f07]/98 to-[#120803]/98 border-2 border-[#caa05a] rounded-2xl p-3 sm:p-4 shadow-[0_16px_48px_rgba(0,0,0,0.96),inset_0_1px_2px_rgba(255,255,255,0.18)] text-[#f3e5ce] flex flex-col gap-2.5 backdrop-blur-md animate-fade-in font-serif select-none"
    >
      {/* 1. ÜST BAŞLIK VE KONTROLLER */}
      <div className="flex items-center justify-between gap-2 border-b border-[#523d26] pb-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex items-center gap-1 font-black text-sm text-[#fef08a]">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>({selectedTile.x} | {selectedTile.y})</span>
          </span>

          {/* Tür Rozeti */}
          {selectedNode && (
            <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/60 shadow-sm flex items-center gap-1">
              <span>💎 {selectedNode.name}</span>
              <span className="text-amber-400/80 font-mono">+{nodeEfficiency}/s</span>
            </span>
          )}

          {selectedRival && (
            <span className="text-[11px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-600/60 shadow-sm flex items-center gap-1">
              <span>⚔️ {selectedRival.name}</span>
              <span className="text-rose-400/80">({FACTIONS[selectedRival.faction]?.name || selectedRival.faction})</span>
            </span>
          )}

          {selectedPlayerV && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/60 shadow-sm flex items-center gap-1">
              <span>🏰 {selectedPlayerV.name}</span>
              <span className="text-emerald-400/80">(Merkez Otağ)</span>
            </span>
          )}

          {!selectedNode && !selectedRival && !selectedPlayerV && (
            <span className="text-[11px] font-bold text-[#bfa075] bg-[#1a110a] px-2 py-0.5 rounded-full border border-[#4a341f]">
              🌿 Verimli Boş Çayır
            </span>
          )}
        </div>

        {/* Eylem Düğmeleri (Odaklan, Kopyala, Kapat) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onFocusCoordinates(selectedTile.x, selectedTile.y)}
            title="Kamerayı bu kareye ortala"
            className="p-1 sm:px-2 sm:py-0.5 rounded-lg bg-[#3a2817] hover:bg-[#4d3620] text-amber-200 hover:text-white border border-[#6b4f2c] text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Odaklan</span>
          </button>

          <button
            onClick={handleCopyCoords}
            title="Koordinatları Kopyala"
            className="p-1 sm:px-2 sm:py-0.5 rounded-lg bg-[#1e140b] hover:bg-[#332213] text-[#decab0] hover:text-amber-200 border border-[#523d26] text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          <button
            onClick={onClose}
            title="Kapat"
            className="p-1 rounded-full text-[#a89476] hover:text-white hover:bg-[#3d2714] text-xs font-bold cursor-pointer transition ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. ORTA BÖLÜM: TAKTİK SEFER HIZI VE MESAFE ÇUBUĞU */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs bg-[#120a05] p-2 rounded-xl border border-[#3e2918]">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#9c8469] uppercase font-bold">Mesafe</span>
          <span className="font-mono font-black text-amber-300 text-sm">
            {distance.toFixed(1)} <span className="text-[10px] text-[#786145] font-normal">kare</span>
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-emerald-400/90 uppercase font-bold flex items-center gap-0.5">
            <span>🏇</span> Süvari İntikali
          </span>
          <span className="font-mono font-bold text-[#fbf6ea] text-xs">
            ~{cavalryTimeMin} dk
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-amber-400/90 uppercase font-bold flex items-center gap-0.5">
            <span>🛡️</span> Piyade Seferi
          </span>
          <span className="font-mono font-bold text-[#fbf6ea] text-xs">
            ~{infantryTimeMin} dk
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-rose-400/90 uppercase font-bold flex items-center gap-0.5">
            <span>🚜</span> Kuşatma Aletleri
          </span>
          <span className="font-mono font-bold text-[#fbf6ea] text-xs">
            ~{siegeTimeMin} dk
          </span>
        </div>
      </div>

      {/* 3. DİNAMİK İÇERİK (KAYNAK / DÜŞMAN / BOŞ ARAZİ) */}
      {selectedNode && (
        <div className="flex flex-col gap-2 bg-[#170e07] p-2.5 rounded-xl border border-[#4a341f]">
          {/* İstatistikler */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-[#120803] p-1.5 rounded-lg border border-[#382313]">
              <div className="text-[10px] text-[#9c8469]">Köyün Bu Madendeki İşçisi</div>
              <div className="text-amber-200 font-mono font-black text-sm mt-0.5">
                {villageWorkersOnNode} <span className="text-[10px] font-normal text-[#8c7456]">işçi</span>
              </div>
            </div>

            <div className="bg-[#120803] p-1.5 rounded-lg border border-[#382313]">
              <div className="text-[10px] text-[#9c8469]">Toplam Maden İşçisi</div>
              <div className="text-white font-mono font-bold text-sm mt-0.5">
                {nodeTotalWorkers} / 1000
              </div>
            </div>

            <div className="bg-[#120803] p-1.5 rounded-lg border border-[#382313]">
              <div className="text-[10px] text-[#9c8469]">Köyün Saatlik Kazancı</div>
              <div className="text-emerald-400 font-mono font-black text-sm mt-0.5">
                +{nodeYieldPerHour}/saat
              </div>
            </div>
          </div>

          {/* İşçi Atama Kontrolleri */}
          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap sm:flex-nowrap">
            <div className="text-[10.5px] text-[#c9ba9f] min-w-0">
              {isSelectedInsideInfluence ? (
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  ✓ Menzil İçinde (Etki Yarıçapı: {influenceRadius.toFixed(1)})
                </span>
              ) : (
                <span className="text-amber-400/90 font-medium">
                  ⚠️ Menzil Dışında (Merkez Konağını büyüterek etki çemberini genişletin)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* +10 İşçi */}
              <button
                onClick={() => onAssignWorkers && onAssignWorkers(playerVillage.id, selectedNode.id, 10)}
                disabled={!workerCheck?.allowed}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow ${
                  workerCheck?.allowed
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-800 hover:brightness-110 text-white border border-emerald-400 cursor-pointer active:scale-95'
                    : 'bg-[#211710] text-[#6b553d] border border-[#3e2c1c] opacity-60 cursor-not-allowed'
                }`}
                title={workerCheck?.allowed ? '10 İşçi Gönder' : workerCheck?.reason}
              >
                <Pickaxe className="w-3.5 h-3.5 text-amber-300" />
                <span>+10 İşçi</span>
              </button>

              {/* +50 İşçi */}
              {playerVillage.idlePopulation >= 50 && (
                <button
                  onClick={() => onAssignWorkers && onAssignWorkers(playerVillage.id, selectedNode.id, 50)}
                  disabled={!workerCheck?.allowed}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-900 hover:brightness-110 text-white border border-teal-400 font-bold text-xs flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
                >
                  <span>+50</span>
                </button>
              )}

              {/* -10 Geri Çek */}
              {villageWorkersOnNode > 0 && (
                <button
                  onClick={() => onAssignWorkers && onAssignWorkers(playerVillage.id, selectedNode.id, -10)}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#4a261a] to-[#2e150d] hover:brightness-125 text-amber-200 border border-amber-600/80 font-bold text-xs flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
                >
                  <span>↩️ -10 Çek</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRival && (
        <div className="flex items-center justify-between gap-3 bg-[#170e07] p-2.5 rounded-xl border border-[#4a341f]">
          <div>
            <div className="text-xs font-bold text-rose-200">
              ⚔️ {selectedRival.name} ({selectedRival.ownerName})
            </div>
            <div className="text-[10.5px] text-[#9c8469] mt-0.5">
              {FACTIONS[selectedRival.faction]?.name || selectedRival.faction} Beyliği Sancağı
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Casus Gönder */}
            <button
              onClick={() => onOpenDispatchModal({
                name: selectedRival.name,
                x: selectedRival.x,
                y: selectedRival.y,
                ownerName: selectedRival.ownerName,
                faction: selectedRival.faction,
                villageId: selectedRival.id,
              }, 'spy')}
              className="px-3 py-1.5 bg-gradient-to-b from-[#352540] to-[#1a0f21] hover:brightness-110 border border-purple-400/80 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shadow"
            >
              <Eye className="w-3.5 h-3.5 text-purple-300" />
              <span>Casus Gönder</span>
            </button>

            {/* Asker Gönder / Sefer */}
            <button
              onClick={() => onOpenDispatchModal({
                name: selectedRival.name,
                x: selectedRival.x,
                y: selectedRival.y,
                ownerName: selectedRival.ownerName,
                faction: selectedRival.faction,
                villageId: selectedRival.id,
              }, 'attack')}
              className="px-3.5 py-1.5 bg-gradient-to-b from-[#8f2415] to-[#541205] hover:brightness-110 border border-[#f87171] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            >
              <Swords className="w-3.5 h-3.5 text-yellow-300" />
              <span>Asker Gönder</span>
            </button>
          </div>
        </div>
      )}

      {selectedPlayerV && (
        <div className="flex items-center justify-between gap-3 bg-[#170e07] p-2.5 rounded-xl border border-[#2b3a4a]">
          <div>
            <div className="text-xs font-bold text-emerald-200">
              🏰 {selectedPlayerV.name} {selectedPlayerV.id === playerVillage.id ? '(Mevcut Başkentiniz)' : '(Kendi İkinci Otağınız)'}
            </div>
            <div className="text-[10.5px] text-[#9c8469] mt-0.5">
              Merkez Binası Kademe {selectedPlayerV.buildings?.town_hall || 1} • Toplam Ahali: {selectedPlayerV.totalPopulation ?? (selectedPlayerV.workingPopulation + selectedPlayerV.idlePopulation)}
            </div>
          </div>

          {selectedPlayerV.id !== playerVillage.id && onSelectVillage && (
            <button
              onClick={() => onSelectVillage(selectedPlayerV.id)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#1e40af] to-[#172554] hover:brightness-110 border border-blue-400 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow"
            >
              Bu Köye Geç
            </button>
          )}
        </div>
      )}

      {!selectedNode && !selectedRival && !selectedPlayerV && (
        <div className="flex items-center justify-between gap-3 bg-[#170e07] p-2.5 rounded-xl border border-[#4a341f]">
          <div className="text-xs text-[#decab0]">
            🌿 <strong className="text-amber-200">Açık Çayır ve İskan Arazisi:</strong> Bu bölge yeni bir Türkmen otağı ve ikinci köy kurmak için elverişlidir.
          </div>

          {onOpenFoundVillageModal && (
            <button
              onClick={() => onOpenFoundVillageModal({ x: selectedTile.x, y: selectedTile.y })}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#14532d] to-[#052e16] hover:brightness-110 border border-[#86efac] text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow shrink-0"
            >
              <Castle className="w-3.5 h-3.5 text-emerald-300" />
              <span>Yeni Otağ Kur</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
