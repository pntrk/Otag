import React, { useMemo } from 'react';
import { ResourceNode, Village } from '../types/game';
import { 
  getVillageTotalPopulation, 
  getVillageResourceWorkers, 
  getVillageIdleWorkers,
  getVillageWorkingPopulation,
  getWorkerProductionMultiplier,
} from '../engine/workerEngine';
import { 
  getCapturedNodesForVillage 
} from '../engine/simulation';
import { 
  getNodeEfficiency, 
  getNodeTotalWorkers, 
  getVillageWorkersOnNode,
  calculateNodeYieldPerHour,
  MAX_WORKERS_PER_NODE,
  WORKER_ASSIGNMENT_BATCH 
} from '../engine/resourceEngine';
import { 
  getNextSpawnTimeRemaining, 
  formatRemainingTime, 
  getPopulationSpawnProgress 
} from '../engine/populationEngine';
import { 
  Users, 
  UserPlus, 
  Sparkles, 
  Info, 
  Pickaxe, 
  CheckCircle2, 
  AlertTriangle,
  Clock
} from 'lucide-react';

interface WorkerAllocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  village: Village;
  nodes: ResourceNode[];
  onUpdateWorkerDelta: (villageId: string, resourceType: 'wood' | 'stone' | 'iron' | 'grain', delta: number) => void;
  onDistributeEqually?: (villageId: string) => void;
  onRecallAll?: (villageId: string) => void;
  onAssignWorkers?: (villageId: string, nodeId: string, count: number) => void;
  onApplyVillageUpdate?: (updatedVillage: Village) => void;
}

interface ResourceRowConfig {
  key: 'wood' | 'stone' | 'iron' | 'grain';
  name: string;
  subname: string;
  image: string;
  fallbackIcon: string;
  color: string;
  borderColor: string;
  bgGradient: string;
  unit: string;
}

const RESOURCE_CONFIGS: ResourceRowConfig[] = [
  {
    key: 'wood',
    name: 'Kereste & Odun',
    subname: 'Meşe ve Karaçam Ormanları',
    image: '/assets/environment/wood.webp',
    fallbackIcon: '🌲',
    color: 'text-amber-400',
    borderColor: 'border-amber-700/60',
    bgGradient: 'from-[#2b180a] via-[#1a0f06] to-[#120a04]',
    unit: 'odun/saat',
  },
  {
    key: 'stone',
    name: 'Kalker & Taş',
    subname: 'Mermer ve Granit Ocakları',
    image: '/assets/environment/stone.webp',
    fallbackIcon: '🪨',
    color: 'text-stone-300',
    borderColor: 'border-stone-600/60',
    bgGradient: 'from-[#262626] via-[#181818] to-[#0f0f0f]',
    unit: 'taş/saat',
  },
  {
    key: 'iron',
    name: 'Cevher & Demir',
    subname: 'Kızıl Damar ve Döküm Ocakları',
    image: '/assets/environment/iron.webp',
    fallbackIcon: '⛏️',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-800/60',
    bgGradient: 'from-[#10222e] via-[#0b1720] to-[#060e14]',
    unit: 'demir/saat',
  },
  {
    key: 'grain',
    name: 'Buğday & Tahıl',
    subname: 'Bereketli Başak Ovaları',
    image: '/assets/environment/grain.webp',
    fallbackIcon: '🌾',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-700/60',
    bgGradient: 'from-[#332508] via-[#211704] to-[#120d02]',
    unit: 'tahıl/saat',
  },
];

export const WorkerAllocationDrawer: React.FC<WorkerAllocationDrawerProps> = ({
  isOpen,
  onClose,
  village,
  nodes,
  onUpdateWorkerDelta,
  onDistributeEqually,
  onRecallAll,
  onAssignWorkers,
}) => {
  if (!isOpen) return null;

  const totalPopulation = getVillageTotalPopulation(village);
  const idleWorkers = getVillageIdleWorkers(village);
  const workingPopulation = getVillageWorkingPopulation(village, nodes);
  const resourceWorkers = getVillageResourceWorkers(village, nodes);
  const townHallLevel = village.buildings?.town_hall || 1;

  // Çemberdeki düğümleri ve taban üretimleri hesapla
  const { captured } = useMemo(() => {
    return getCapturedNodesForVillage(village, nodes);
  }, [village, nodes]);

  // Kaynak bazlı taban düğüm verileri ve detayları
  const nodeStats = useMemo(() => {
    const stats: Record<'wood' | 'stone' | 'iron' | 'grain', { 
      count: number; 
      baseYield: number; 
      nodes: Array<{ node: ResourceNode; assigned: number; efficiency: number }>;
      totalAssigned: number;
    }> = {
      wood: { count: 0, baseYield: 0, nodes: [], totalAssigned: 0 },
      stone: { count: 0, baseYield: 0, nodes: [], totalAssigned: 0 },
      iron: { count: 0, baseYield: 0, nodes: [], totalAssigned: 0 },
      grain: { count: 0, baseYield: 0, nodes: [], totalAssigned: 0 },
    };

    captured.forEach(node => {
      if (node.type === 'wood' || node.type === 'stone' || node.type === 'iron' || node.type === 'grain') {
        const assigned = getVillageWorkersOnNode(village, node.id);
        const eff = getNodeEfficiency(node);
        stats[node.type].count += 1;
        stats[node.type].totalAssigned += assigned;
        stats[node.type].nodes.push({ node, assigned, efficiency: eff });

        let y = node.baseYieldPerHour || 50;
        // Candaroğulları bonusu
        const fKey = (village.faction || '').toLowerCase();
        if (fKey.includes('candar') && (node.type === 'iron' || node.type === 'stone')) {
          y *= 1.20;
        }
        if (fKey.includes('dulkadir') && node.type === 'grain') {
          y *= 1.20;
        }
        stats[node.type].baseYield += y;
      }
    });

    return stats;
  }, [captured, village]);

  const totalAssigned = resourceWorkers.wood + resourceWorkers.stone + resourceWorkers.iron + resourceWorkers.grain;
  const employmentPct = totalPopulation > 0 ? Math.round((workingPopulation / totalPopulation) * 100) : 0;
  const spawnTimeRemaining = getNextSpawnTimeRemaining(village);
  const spawnProgress = getPopulationSpawnProgress(village);

  const handleEqualDistribute = () => {
    if (onDistributeEqually) {
      onDistributeEqually(village.id);
    } else {
      // Delta fallback
      const basePer = Math.floor(idleWorkers / 4 / 10) * 10;
      if (basePer > 0) {
        onUpdateWorkerDelta(village.id, 'wood', basePer);
        onUpdateWorkerDelta(village.id, 'stone', basePer);
        onUpdateWorkerDelta(village.id, 'iron', basePer);
        onUpdateWorkerDelta(village.id, 'grain', basePer);
      }
    }
  };

  const handleRecallAll = () => {
    if (onRecallAll) {
      onRecallAll(village.id);
    } else {
      onUpdateWorkerDelta(village.id, 'wood', -resourceWorkers.wood);
      onUpdateWorkerDelta(village.id, 'stone', -resourceWorkers.stone);
      onUpdateWorkerDelta(village.id, 'iron', -resourceWorkers.iron);
      onUpdateWorkerDelta(village.id, 'grain', -resourceWorkers.grain);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Çekmece Konteyneri */}
      <div 
        id="worker-allocation-drawer"
        className="w-full max-w-2xl bg-gradient-to-b from-[#24170d] via-[#1a0f07] to-[#120a04] border-t-2 sm:border-2 border-[#caa05a] sm:rounded-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.95)] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2.5rem)] flex flex-col overflow-hidden text-[#f0e2ca] font-serif transition-all transform duration-300"
      >
        {/* Başlık Barı */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#4d3219] via-[#6e461f] to-[#4d3219] border-b-2 border-[#8b6534] flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8a5b28] to-[#422a10] border border-[#f5d78a] flex items-center justify-center text-lg shadow-inner shrink-0">
              👥
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#fcedc7] uppercase tracking-wider drop-shadow flex items-center gap-2">
                <span>Ahali & Maden İşçi Tahsisi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/60 text-amber-200">
                  {village.name} (Otağ Lv.{townHallLevel})
                </span>
              </h2>
              <p className="text-[11px] text-[#decab0] font-sans font-medium">
                Menzildeki maden ve kaynaklara işçi sevk ederek saatlik üretimi katlayın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#241408] border border-[#7a5323] hover:bg-[#3d230e] hover:border-amber-400 text-amber-300 hover:text-white flex items-center justify-center text-sm font-bold transition cursor-pointer shrink-0"
            title="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Ana İçerik Kaydırma Alanı */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 custom-scrollbar flex-1 min-h-0">
          
          {/* Ahali / İşçi Havuzu Özeti (3 Bento Kart) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Toplam İşçi */}
            <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#382211] to-[#201309] border border-[#755027] shadow-inner text-center">
              <div className="text-[10px] sm:text-xs text-[#c4aa82] uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>İşçi</span>
              </div>
              <div className="text-lg sm:text-2xl font-mono font-black text-[#fcedc7] mt-0.5 drop-shadow">
                {totalPopulation}
              </div>
              <div className="text-[9px] text-[#9e835f] font-mono">
                Otağ Seviyesi: {townHallLevel}
              </div>
            </div>

            {/* Boştaki İşçi (Aktif Havuz) */}
            <div className={`p-2.5 rounded-xl border shadow-inner text-center transition-all ${
              idleWorkers > 0 
                ? 'bg-gradient-to-b from-[#1b381d] to-[#0f2411] border-emerald-500/80 ring-1 ring-emerald-400/40' 
                : 'bg-gradient-to-b from-[#382211] to-[#201309] border-[#755027]'
            }`}>
              <div className="text-[10px] sm:text-xs text-emerald-300 uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Boşta İşçi</span>
              </div>
              <div className={`text-lg sm:text-2xl font-mono font-black mt-0.5 drop-shadow ${
                idleWorkers > 0 ? 'text-emerald-300' : 'text-stone-400'
              }`}>
                {idleWorkers}
              </div>
              <div className="text-[9px] text-emerald-400/80 font-mono">
                {idleWorkers > 0 ? 'Maden & Asker Hazır' : 'Boşta Yok'}
              </div>
            </div>

            {/* Madenlerde Çalışan */}
            <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#382211] to-[#201309] border border-[#755027] shadow-inner text-center">
              <div className="text-[10px] sm:text-xs text-[#c4aa82] uppercase font-bold tracking-wider flex items-center justify-center gap-1">
                <Pickaxe className="w-3.5 h-3.5 text-amber-400" />
                <span>Madenlerde</span>
              </div>
              <div className="text-lg sm:text-2xl font-mono font-black text-amber-300 mt-0.5 drop-shadow">
                {workingPopulation}
              </div>
              <div className="text-[9px] text-amber-400/80 font-mono">
                %{employmentPct} İstihdam
              </div>
            </div>
          </div>

          {/* Yeni Ahali Doğum İlerlemesi */}
          <div className="p-2.5 rounded-xl bg-[#140b05] border border-[#4d3219] shadow-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-[#fcedc7] flex items-center gap-1.5">
                  <span>Yeni Nüfus Doğumu</span>
                  <span className="text-[9px] font-mono text-emerald-400 font-normal">
                    (Merkez Binası Lv.{townHallLevel})
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono">
                  Otomatik olarak boşta ahali havuzuna +1 eklenir.
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-mono font-black text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-emerald-600/40">
                ⏳ {formatRemainingTime(spawnTimeRemaining)}
              </div>
            </div>
          </div>

          {/* Hızlı Eylem Barı */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#140b05] border border-[#4d3219]">
            <span className="text-[11px] text-[#bda275] font-semibold hidden sm:inline">
              Hızlı İşçi Düzeni:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleEqualDistribute}
                disabled={idleWorkers < WORKER_ASSIGNMENT_BATCH}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition shadow flex items-center justify-center gap-1.5 ${
                  idleWorkers >= WORKER_ASSIGNMENT_BATCH
                    ? 'bg-gradient-to-b from-[#4d3219] to-[#291a0c] hover:brightness-125 border border-[#8b6534] text-amber-200 cursor-pointer'
                    : 'bg-[#1f1510] border-[#382417] text-stone-600 cursor-not-allowed opacity-50'
                }`}
                title={idleWorkers >= WORKER_ASSIGNMENT_BATCH ? 'Boşta ahaliyi menzildeki madenlere 10\'arlı eşit dağıt' : 'En az 10 boşta ahali gereklidir'}
              >
                <span>⚖️</span>
                <span>Ahaliyi Eşit Dağıt</span>
              </button>
              <button
                onClick={handleRecallAll}
                disabled={workingPopulation === 0}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                  workingPopulation > 0 
                    ? 'bg-gradient-to-b from-[#4a1c1c] to-[#2b0d0d] hover:brightness-125 border-rose-600/70 text-rose-200 cursor-pointer' 
                    : 'bg-[#1f1510] border-[#382417] text-stone-600 cursor-not-allowed opacity-50'
                }`}
                title="Tüm işçileri madenlerden geri çağır ve boşta nüfusa ekle"
              >
                <span>🔄</span>
                <span>Tümünü Boşalt (Geri Çek)</span>
              </button>
            </div>
          </div>

          {/* 4 Maden Tahsis Listesi */}
          <div className="space-y-2.5">
            {RESOURCE_CONFIGS.map((cfg) => {
              const assigned = resourceWorkers[cfg.key] || 0;
              const stats = nodeStats[cfg.key];
              const multiplier = getWorkerProductionMultiplier(assigned);
              const realYield = Math.round(stats.baseYield * multiplier);
              const hasNodes = stats.count > 0;

              return (
                <div 
                  key={cfg.key}
                  className={`p-3 rounded-xl border bg-gradient-to-r ${cfg.bgGradient} ${cfg.borderColor} shadow-lg transition-all`}
                >
                  <div className="flex flex-col gap-2">
                    
                    {/* Üst Kısım: Maden İkonu, Adı ve Butonlar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      
                      {/* Sol: Maden İkonu & Adı */}
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b2311] to-[#120a05] border border-[#96703b] flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                          <img 
                            src={cfg.image} 
                            alt={cfg.name} 
                            className="w-10 h-10 object-contain drop-shadow"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="text-xl absolute font-serif select-none pointer-events-none opacity-0" aria-hidden="true">
                            {cfg.fallbackIcon}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-black tracking-wide ${cfg.color}`}>
                              {cfg.name}
                            </h3>
                            {hasNodes ? (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300">
                                {stats.count} Düğüm Menzilde
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300">
                                Radius Dışı
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#b59e7a] font-sans">
                            {cfg.subname}
                          </div>
                          
                          {/* Üretim Çarpanı & Saatlik Gelir */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono font-bold text-[#fcedc7]">
                              Üretim: <span className="text-emerald-400 font-black">+{realYield}</span> {cfg.unit}
                            </span>
                            <span className="text-[10px] text-[#806846]">•</span>
                            {assigned > 0 ? (
                              <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3 text-amber-400 inline" />
                                +%{assigned * 15} Hız (x{multiplier.toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-amber-500/90 flex items-center gap-0.5">
                                ⚠️ %25 Taban Verim (İşçi Yok)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sağ: İşçi Sayacı ve (+ / -) Butonları */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#3d2714]">
                        <div className="flex items-center gap-1">
                          {/* -50 Butonu */}
                          {assigned >= 50 && (
                            <button
                              onClick={() => onUpdateWorkerDelta(village.id, cfg.key, -50)}
                              className="px-1.5 h-8 rounded-lg text-[10px] font-mono font-black transition flex items-center justify-center cursor-pointer shadow bg-gradient-to-b from-[#4a2215] to-[#291008] hover:brightness-125 border border-amber-700/80 text-amber-200 active:scale-95"
                              title="50 İşçi Çıkar"
                            >
                              -50
                            </button>
                          )}

                          {/* -10 Butonu */}
                          <button
                            onClick={() => onUpdateWorkerDelta(village.id, cfg.key, -10)}
                            disabled={assigned < 10}
                            className={`w-8 h-8 rounded-lg text-xs font-mono font-black transition flex items-center justify-center shadow ${
                              assigned >= 10 
                                ? 'bg-gradient-to-b from-[#4a2215] to-[#291008] hover:brightness-125 border border-amber-700/80 text-amber-200 active:scale-95 cursor-pointer' 
                                : 'bg-[#1a0f08] border border-[#331c0e] text-stone-600 cursor-not-allowed opacity-40'
                            }`}
                            title={assigned >= 10 ? '10 İşçi Çıkar' : 'Atanmış işçi yok'}
                          >
                            -10
                          </button>
                        </div>

                        {/* Atanan İşçi Göstergesi */}
                        <div className="min-w-[68px] px-2.5 py-1.5 rounded-lg bg-[#0d0704] border border-[#6b4721] text-center shadow-inner">
                          <div className="text-[9px] uppercase tracking-wider text-[#9e835f] font-bold">
                            İşçi
                          </div>
                          <div className="text-base font-mono font-black text-amber-300 drop-shadow leading-tight">
                            {assigned}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* +10 Butonu */}
                          <button
                            onClick={() => onUpdateWorkerDelta(village.id, cfg.key, 10)}
                            disabled={!hasNodes || idleWorkers < 10}
                            className={`w-8 h-8 rounded-lg text-xs font-mono font-black transition flex items-center justify-center shadow ${
                              hasNodes && idleWorkers >= 10 
                                ? 'bg-gradient-to-b from-[#1c4521] to-[#0d2611] hover:brightness-125 border border-emerald-600 text-emerald-200 active:scale-95 cursor-pointer' 
                                : 'bg-[#1a0f08] border border-[#331c0e] text-stone-600 cursor-not-allowed opacity-40'
                            }`}
                            title={!hasNodes ? 'Radius içinde faal maden yok' : idleWorkers >= 10 ? '10 İşçi Sevk Et' : 'Yetersiz Boşta Ahali (En az 10)'}
                          >
                            +10
                          </button>

                          {/* +50 Butonu */}
                          {idleWorkers >= 50 && hasNodes && (
                            <button
                              onClick={() => onUpdateWorkerDelta(village.id, cfg.key, 50)}
                              className="px-1.5 h-8 rounded-lg text-[10px] font-mono font-black transition flex items-center justify-center shadow bg-gradient-to-b from-[#1c4521] to-[#0d2611] hover:brightness-125 border border-emerald-600 text-emerald-200 active:scale-95 cursor-pointer"
                              title="50 İşçi Sevk Et"
                            >
                              +50
                            </button>
                          )}
                        </div>

                      </div>

                    </div>

                    {/* Alt Kısım: Menzildeki Gerçek Düğümlerin Dağılımı */}
                    {hasNodes && stats.nodes.length > 0 && (
                      <div className="mt-1 pt-1.5 border-t border-[#382312] grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {stats.nodes.map(({ node, assigned: nodeAssigned, efficiency }) => (
                          <div 
                            key={node.id}
                            className="px-2 py-1 rounded bg-black/40 border border-[#422b17] flex items-center justify-between text-[10px] font-mono"
                          >
                            <span className="text-[#decab0] truncate max-w-[140px]">
                              {node.name} ({node.x}|{node.y})
                            </span>
                            <div className="flex items-center gap-1.5 text-right shrink-0">
                              <span className="text-amber-400/90 font-bold">
                                ⚡{efficiency}/s
                              </span>
                              <span className="text-emerald-400 font-bold">
                                🧑‍🌾 {nodeAssigned}/{node.assignedWorkers || nodeAssigned}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

          {/* Beylik Kural ve Formül Bilgilendirme Kutusu */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1c1208] to-[#120a04] border border-[#5c3e1e] text-[11px] text-[#decab0] space-y-1.5 shadow-md">
            <div className="flex items-center gap-1.5 font-bold text-[#f5d78a] text-xs">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Maden ve Ahali Hüküm Kuralları</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#bfa988] leading-relaxed">
              <li>
                <strong className="text-[#fcedc7]">10'arlı Sevk Şartı:</strong> İşçiler haritadaki madenlere 10'arlı gruplar halinde atanır ve çekilir.
              </li>
              <li>
                <strong className="text-[#fcedc7]">Gerçek Üretim:</strong> Her kaynağın saatlik verimi, çalışan işçi sayısı ile maden verimliliğinin çarpımından oluşur.
              </li>
              <li>
                <strong className="text-[#fcedc7]">Ahali ve Asker Havuzu:</strong> Boşta bekleyen ahali hem madenlere atanabilir hem de Kışla / Ahır binalarında askere dönüştürülebilir.
              </li>
            </ul>
          </div>

        </div>

        {/* Alt Kapatma Çubuğu */}
        <div className="p-3 bg-[#170e07] border-t-2 border-[#5a3a19] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#bda273] font-mono flex items-center gap-2">
            <span>Boşta: <strong className="text-emerald-400">{idleWorkers}</strong></span>
            <span>•</span>
            <span>Madenlerde: <strong className="text-amber-300">{workingPopulation}</strong></span>
            <span>•</span>
            <span>Toplam: <strong className="text-[#fcedc7]">{totalPopulation}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gradient-to-b from-[#6b4721] to-[#3d240e] hover:brightness-125 border border-[#caa05a] text-[#fcedc7] font-serif font-black text-xs transition cursor-pointer shadow-lg active:scale-95"
          >
            Tamam (Kapat)
          </button>
        </div>

      </div>
    </div>
  );
};

export default WorkerAllocationDrawer;

