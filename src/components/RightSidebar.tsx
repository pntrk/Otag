import React, { useState } from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March, 
  ResourceRate, 
  TrainingQueueItem, 
  Village 
} from '../types/game';
import { FACTIONS, BUILDINGS, UNITS } from '../data/gameData';
import { calculateTotalSharedRates, calculateTotalSharedCapacity, calculateSharedTreasury } from '../engine/production';
import { ResourceIcon } from './ResourceIcon';
import { 
  Coins, 
  Landmark, 
  Compass, 
  Hammer, 
  Swords, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight, 
  Plus, 
  Clock, 
  ShieldAlert,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface RightSidebarProps {
  village: Village;
  playerVillages: Village[];
  rates: ResourceRate;
  constructionQueue?: ConstructionQueueItem[];
  trainingQueue?: TrainingQueueItem[];
  activeMarches?: March[];
  onSelectVillage: (villageId: string) => void;
  onOpenFoundVillageModal?: () => void;
  onOpenBuilding?: (type: BuildingType) => void;
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onOpenFactionModal?: () => void;
  onOpenVictoryPanel?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  village,
  playerVillages,
  rates,
  constructionQueue = [],
  trainingQueue = [],
  activeMarches = [],
  onSelectVillage,
  onOpenFoundVillageModal,
  onOpenBuilding,
  onSelectTab,
  onOpenFactionModal,
  onOpenVictoryPanel,
}) => {
  // Accordion state management
  const [openSections, setOpenSections] = useState<{
    treasury: boolean;
    villages: boolean;
    marches: boolean;
    queues: boolean;
  }>({
    treasury: true,
    villages: true,
    marches: true,
    queues: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev [key] }));
  };

  const sharedTreasury = calculateSharedTreasury(playerVillages);
  const sharedRates = calculateTotalSharedRates(playerVillages, []);
  const sharedCapacity = calculateTotalSharedCapacity(playerVillages);

  const formatNum = (val: number) => Math.floor(val).toLocaleString('tr-TR');
  const formatRate = (rate: number) => {
    const r = Math.round(rate);
    return r >= 0 ? `+${r}/s` : `${r}/s`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const now = Date.now();

  const qualifiedCount = playerVillages.filter(v => (v.buildings.town_hall || 0) >= 10).length;
  const maxAllowedVillages = Math.min(10, 1 + qualifiedCount);
  const canFoundNew = playerVillages.length < maxAllowedVillages && playerVillages.length < 10;

  return (
    <aside className="relative w-full lg:w-80 flex flex-col rounded-xl border-2 border-[#634524] bg-[#140d07] shadow-2xl overflow-hidden font-serif select-none">
      
      {/* Background Frame Layer using Right Sidebar Frame WebP */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url('/assets/ui/right_sidebar_frame.webp')` }}
      />

      {/* Header Plaque Banner Top */}
      <div className="relative z-10 px-3 py-2 bg-gradient-to-r from-[#29170a] via-[#452812] to-[#29170a] border-b-2 border-[#825c2f] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#523214] border border-[#d4af37] flex items-center justify-center text-xs text-amber-300 shadow-inner">
            🛡️
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-[#fde4a9] tracking-wider uppercase">
            Divan & İdare Paneli
          </h2>
        </div>
        <span className="text-[10px] font-mono text-amber-300/80 bg-black/60 px-1.5 py-0.5 rounded border border-[#5a3a19]">
          {playerVillages.length} Otağ
        </span>
      </div>

      <div className="relative z-10 p-2 space-y-2.5 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">

        {/* ==================================================================== */}
        {/* 1. AKORDEON: ORTAK KASA (Tüm Beylik Depoları & Toplam Gelirler)     */}
        {/* ==================================================================== */}
        <div className="rounded-lg border border-[#5c3e1e] bg-[#1a1109]/90 shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('treasury')}
            className="w-full px-2.5 py-1.5 bg-gradient-to-r from-[#331e0f] via-[#24140a] to-[#331e0f] border-b border-[#523518] flex items-center justify-between text-left hover:brightness-110 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-[#fedc97]">ORTAK KASA</span>
            </div>
            {openSections.treasury ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {openSections.treasury && (
            <div className="p-2 space-y-1.5 text-[11px]">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'wood', name: 'Odun', amount: sharedTreasury.resources.wood, rate: sharedRates.wood, color: 'text-amber-300' },
                  { key: 'stone', name: 'Taş', amount: sharedTreasury.resources.stone, rate: sharedRates.stone, color: 'text-stone-300' },
                  { key: 'iron', name: 'Demir', amount: sharedTreasury.resources.iron, rate: sharedRates.iron, color: 'text-cyan-300' },
                  { key: 'grain', name: 'Tahıl', amount: sharedTreasury.resources.grain, rate: sharedRates.grain, color: 'text-yellow-300' },
                ].map((item) => (
                  <div key={item.key} className="bg-[#120b06] border border-[#3b2612] p-1.5 rounded flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ResourceIcon type={item.key as any} size="sm" />
                      <span className="text-[10px] text-stone-300">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${item.color}`}>{formatNum(item.amount)}</div>
                      <div className="font-mono text-[9px] text-emerald-400">{formatRate(item.rate)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Altın Hazinesi */}
              <div className="bg-gradient-to-r from-[#291a0c] via-[#3d240e] to-[#291a0c] border border-[#7a5726] p-1.5 rounded flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ResourceIcon type="gold" size="sm" />
                  <span className="text-[11px] font-bold text-amber-200">Beylik Altını</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs text-amber-300">{formatNum(sharedTreasury.resources.gold)}</span>
                  <span className="font-mono text-[9px] text-emerald-400 ml-1.5">{formatRate(sharedRates.gold)}</span>
                </div>
              </div>

              <div className="text-[10px] text-stone-400 text-center font-mono pt-0.5">
                Ortak Depo Hacmi: <strong className="text-amber-300">{formatNum(sharedCapacity)}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 2. AKORDEON: ŞEHİRLER & HİSARLAR (Oyuncunun Tüm Mülkleri)            */}
        {/* ==================================================================== */}
        <div className="rounded-lg border border-[#5c3e1e] bg-[#1a1109]/90 shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('villages')}
            className="w-full px-2.5 py-1.5 bg-gradient-to-r from-[#331e0f] via-[#24140a] to-[#331e0f] border-b border-[#523518] flex items-center justify-between text-left hover:brightness-110 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-[#fedc97]">ŞEHİRLER & HİSARLAR ({playerVillages.length}/10)</span>
            </div>
            {openSections.villages ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {openSections.villages && (
            <div className="p-2 space-y-1.5">
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {playerVillages.map((v, idx) => {
                  const isCurrent = v.id === village.id;
                  const isCapital = idx === 0;

                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVillage(v.id)}
                      className={`p-1.5 rounded border transition flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'border-[#c2964a] bg-gradient-to-r from-[#422912] to-[#2b180a] shadow-inner text-amber-200'
                          : 'border-[#382310] bg-[#120b06] hover:bg-[#241508] text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isCapital ? 'bg-amber-600 text-black' : 'bg-[#2b1b0e] text-amber-300 border border-[#523517]'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-[11px] font-bold flex items-center gap-1">
                            <span>{v.name}</span>
                            {isCapital && <span className="text-[8px] text-amber-400 bg-black/60 px-1 rounded">Baş Otağ</span>}
                          </div>
                          <div className="text-[9px] font-mono text-stone-400">
                            ({v.x}|{v.y}) • Seviye {v.buildings.town_hall || 1}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="text-[9px] text-emerald-400 font-bold">Aktif</span>
                      ) : (
                        <ArrowRight className="w-3 h-3 text-stone-500 hover:text-amber-300" />
                      )}
                    </div>
                  );
                })}
              </div>

              {canFoundNew && onOpenFoundVillageModal && (
                <button
                  onClick={onOpenFoundVillageModal}
                  className="w-full mt-1 py-1.5 rounded border border-emerald-600/70 bg-gradient-to-r from-[#122b16] via-[#1a3d20] to-[#122b16] text-emerald-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition cursor-pointer hover:border-emerald-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Otağ / Köy Kur ({playerVillages.length + 1}. Köy)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 3. AKORDEON: SEFERLER & RADAR (Yaklaşan / Çıkan Ordular)             */}
        {/* ==================================================================== */}
        <div className="rounded-lg border border-[#5c3e1e] bg-[#1a1109]/90 shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('marches')}
            className="w-full px-2.5 py-1.5 bg-gradient-to-r from-[#331e0f] via-[#24140a] to-[#331e0f] border-b border-[#523518] flex items-center justify-between text-left hover:brightness-110 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-[#fedc97]">
                SEFERLER & RADAR ({activeMarches.length})
              </span>
            </div>
            {openSections.marches ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {openSections.marches && (
            <div className="p-2 space-y-1.5">
              {activeMarches.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-stone-500 font-mono italic">
                  Şu an ufukta faal bir ordu veya akıncı seferi yok.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {activeMarches.map((m) => {
                    const arrival = m.arrivalTime || (m as any).arriveTime || 0;
                    const remainingSec = Math.max(0, Math.ceil((arrival - now) / 1000));
                    const totalTroops = Object.values(m.units || {}).reduce<number>((a, b) => a + Number(b || 0), 0);
                    const isAttack = m.mission === 'attack' || m.mission === 'raid';
                    const targetX = m.targetCoordinates?.x ?? (m as any).targetCoords?.x ?? 0;
                    const targetY = m.targetCoordinates?.y ?? (m as any).targetCoords?.y ?? 0;

                    return (
                      <div 
                        key={m.id}
                        className={`p-1.5 rounded border text-[10px] flex items-center justify-between ${
                          isAttack 
                            ? 'bg-red-950/40 border-red-800/60 text-red-200' 
                            : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{isAttack ? '⚔️' : '🛡️'}</span>
                          <div>
                            <div className="font-bold flex items-center gap-1">
                              <span>{isAttack ? 'Taarruz' : 'Destek'}</span>
                              <span className="font-mono text-stone-400">({totalTroops} asker)</span>
                            </div>
                            <div className="font-mono text-[9px] text-stone-400">
                              Hedef: ({targetX}|{targetY})
                            </div>
                          </div>
                        </div>

                        <div className="font-mono font-bold flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded border border-[#4a2e13]">
                          <Clock className="w-2.5 h-2.5 text-amber-400" />
                          <span>{formatSeconds(remainingSec)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('military')}
                  className="w-full py-1 text-[10px] text-amber-300 hover:text-amber-100 font-bold bg-[#261509] hover:bg-[#3d2310] rounded border border-[#5e3b19] transition cursor-pointer text-center"
                >
                  Ordugâh ve Sefer Divanına Git →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* 4. AKORDEON: İNŞAAT & TALİM KUYRUĞU (Aktif Üretimler)               */}
        {/* ==================================================================== */}
        <div className="rounded-lg border border-[#5c3e1e] bg-[#1a1109]/90 shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('queues')}
            className="w-full px-2.5 py-1.5 bg-gradient-to-r from-[#331e0f] via-[#24140a] to-[#331e0f] border-b border-[#523518] flex items-center justify-between text-left hover:brightness-110 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Hammer className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-[#fedc97]">
                İNŞAAT & TALİM ({constructionQueue.length + trainingQueue.length})
              </span>
            </div>
            {openSections.queues ? <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {openSections.queues && (
            <div className="p-2 space-y-1.5">
              {constructionQueue.length === 0 && trainingQueue.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-stone-500 font-mono italic">
                  Şu anda faal inşaat veya asker talimi bulunmuyor.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {/* İnşaatlar */}
                  {constructionQueue.map((item, idx) => {
                    const bDef = BUILDINGS[item.buildingType];
                    const remainingSec = Math.max(0, Math.ceil((item.endTime - now) / 1000));
                    const elapsed = Math.max(0, (now - item.startTime) / 1000);
                    const progress = Math.min(100, Math.max(0, (elapsed / Math.max(1, item.durationSec)) * 100));

                    return (
                      <div key={`cq_${idx}`} className="bg-[#120b06] border border-[#3d2712] p-1.5 rounded space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-200 flex items-center gap-1">
                            <span>🏗️</span>
                            <span>{bDef?.name || item.buildingType}</span>
                            <span className="font-mono text-amber-400">Lv.{item.targetLevel}</span>
                          </span>
                          <span className="font-mono text-stone-300 bg-black/60 px-1 rounded">
                            {formatSeconds(remainingSec)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Asker Talimleri */}
                  {trainingQueue.map((item, idx) => {
                    const uDef = UNITS[item.unitType];
                    const remainingSec = Math.max(0, Math.ceil((item.endTime - now) / 1000));
                    const elapsed = Math.max(0, (now - item.startTime) / 1000);
                    const progress = Math.min(100, Math.max(0, (elapsed / Math.max(1, item.durationSec)) * 100));

                    return (
                      <div key={`tq_${idx}`} className="bg-[#120b06] border border-[#3d2712] p-1.5 rounded space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-amber-200 flex items-center gap-1">
                            <span>⚔️</span>
                            <span>{uDef?.name || item.unitType}</span>
                            <span className="font-mono text-emerald-400">x{item.count}</span>
                          </span>
                          <span className="font-mono text-stone-300 bg-black/60 px-1 rounded">
                            {formatSeconds(remainingSec)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </aside>
  );
};
