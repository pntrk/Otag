import React, { useState } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Crown, 
  Users, 
  Pickaxe, 
  ShieldAlert, 
  TrendingUp, 
  Compass,
  Trophy,
  Sparkles
} from 'lucide-react';
import { FACTIONS } from '../data/gameData';
import { ResourceRate, Village, KhanHero } from '../types/game';
import { getVillageMaxCapacity } from '../engine/simulation';
import { getVillageHideoutProtection } from '../engine/production';
import { getVillageTotalPopulation, getVillageIdleWorkers } from '../engine/workerEngine';
import { ResourceIcon } from './ResourceIcon';
import { ParchmentTooltip } from './ParchmentTooltip';

export interface ResourceHeaderProps {
  village: Village;
  playerVillages?: Village[];
  rates: ResourceRate;
  khan?: KhanHero;
  activeTab?: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture';
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onSelectVillage?: (villageId: string) => void;
  onOpenFoundVillageModal?: () => void;
  onOpenFactionModal?: () => void;
  onOpenKhanModal?: () => void;
  onOpenVictoryModal?: () => void;
  onOpenWorkerDrawer?: () => void;
  onAddTestResources?: () => void;
  activeMarchesCount?: number;
  unreadReportsCount?: number;
}

export const ResourceHeader: React.FC<ResourceHeaderProps> = ({
  village,
  playerVillages = [village],
  rates,
  khan,
  activeTab,
  onSelectTab,
  onSelectVillage,
  onOpenFoundVillageModal,
  onOpenFactionModal,
  onOpenKhanModal,
  onOpenVictoryModal,
  onOpenWorkerDrawer,
  onAddTestResources,
  activeMarchesCount = 0,
  unreadReportsCount = 0,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const [isVillageDropdownOpen, setIsVillageDropdownOpen] = useState(false);

  const maxCapacity = village.maxCapacity || getVillageMaxCapacity(village);
  const hideoutProtected = getVillageHideoutProtection(village);
  const totalPop = getVillageTotalPopulation(village);
  const idlePop = getVillageIdleWorkers(village);

  const qualifiedCount = playerVillages.filter(v => (v.buildings.town_hall || 0) >= 10).length;
  const maxAllowedVillages = Math.min(10, 1 + qualifiedCount);
  const canFoundNew = playerVillages.length < maxAllowedVillages && playerVillages.length < 10;

  // Format Helper
  const formatNum = (val: number) => Math.floor(val).toLocaleString('tr-TR');
  const formatRate = (rate: number) => {
    const r = Math.round(rate);
    const perSec = (rate / 3600);
    const perSecStr = Math.abs(perSec) >= 10 ? Math.round(perSec).toString() : perSec.toFixed(1);
    return {
      perHour: r >= 0 ? `+${r.toLocaleString('tr-TR')}/saat` : `${r.toLocaleString('tr-TR')}/saat`,
      perSec: perSec >= 0 ? `+${perSecStr}/sn` : `${perSecStr}/sn`,
    };
  };

  const resourcesList: {
    key: 'wood' | 'stone' | 'iron' | 'grain' | 'gold';
    name: string;
    amount: number;
    rate: number;
    color: string;
  }[] = [
    { key: 'wood', name: 'Odun', amount: village.resources.wood, rate: rates.wood, color: 'text-amber-300' },
    { key: 'stone', name: 'Taş', amount: village.resources.stone, rate: rates.stone, color: 'text-stone-300' },
    { key: 'iron', name: 'Demir', amount: village.resources.iron, rate: rates.iron, color: 'text-cyan-300' },
    { key: 'grain', name: 'Tahıl', amount: village.resources.grain, rate: rates.grain, color: 'text-yellow-300' },
    { key: 'gold', name: 'Altın', amount: village.resources.gold, rate: rates.gold, color: 'text-amber-400' },
  ];

  return (
    <header className="relative w-full select-none sticky top-0 z-40 bg-[#160e08] shadow-[0_8px_30px_rgba(0,0,0,0.9)] border-b-2 border-[#694825]">
      
      {/* Background Frame Layer using Top Header Board Asset */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url('/assets/ui/top_header_board.webp')` }}
      />
      
      {/* Subtle Ornate Gold Top Trim */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-1.5 sm:px-4 py-1 sm:py-1.5 flex flex-col gap-1 sm:gap-1.5">
        
        {/* ========================================================================= */}
        {/* 1. ÜST SATIR: 3 TEMEL YUVA (SANCAK / OTAĞ & KOORDİNAT / AHALİ & HAKAN)    */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          
          {/* SOL YUVA: Sancak / Beylik Kimliği */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div 
              onClick={onOpenFactionModal}
              title={`${faction.name} • ${faction.leader} (Beylik Bilgileri)`}
              className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 rounded-lg border border-[#8f6834] bg-gradient-to-r from-[#2e1c0e]/95 via-[#3f2714]/90 to-[#22140a]/95 shadow-[0_2px_8px_rgba(0,0,0,0.7)] cursor-pointer hover:border-[#e5b85a] transition group active:scale-95 touch-manipulation"
            >
              <div className="relative w-6 h-4.5 sm:w-8 sm:h-6 rounded overflow-hidden border border-[#d4af37]/80 bg-black/60 shrink-0">
                {faction.flagImage ? (
                  <img 
                    src={faction.flagImage} 
                    alt={faction.name} 
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {faction.crestIcon || '🏹'}
                  </div>
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] sm:text-xs font-serif font-bold text-[#fce5a3] tracking-wide group-hover:text-amber-200 transition truncate max-w-[70px] sm:max-w-none">
                  {faction.name}
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-200/60 hidden sm:inline">
                  {faction.leader}
                </span>
              </div>
            </div>
          </div>

          {/* ORTA YUVA: Otağ / Köy Adı & Koordinat Seçici */}
          <div className="relative flex items-center justify-center min-w-0">
            <div className="relative flex items-center">
              <button
                id="village-switcher-btn"
                onClick={() => setIsVillageDropdownOpen(!isVillageDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg border-2 border-[#b88628] bg-gradient-to-b from-[#3d2613] via-[#2a180b] to-[#1a0e06] shadow-[0_4px_12px_rgba(0,0,0,0.85)] hover:border-[#ffd700] hover:shadow-[0_0_12px_rgba(212,175,55,0.4)] transition cursor-pointer group active:scale-95 touch-manipulation"
              >
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#523315] border border-[#d4af37] flex items-center justify-center text-[9px] sm:text-[10px] shadow-inner text-amber-300 shrink-0">
                  🏛️
                </div>
                
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                  <span className="font-serif font-black text-[11px] sm:text-sm text-[#fff4db] tracking-wider uppercase group-hover:text-amber-200 transition truncate max-w-[80px] sm:max-w-[140px] md:max-w-none">
                    {village.name}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-mono text-amber-300/80 bg-black/50 px-1 sm:px-1.5 py-0.5 rounded border border-[#6b4720] shrink-0">
                    ({village.x}|{village.y})
                  </span>
                </div>

                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 transition-transform duration-200 shrink-0 ${isVillageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Köy Seçim Açılır Menüsü */}
              {isVillageDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/50 sm:bg-transparent"
                    onClick={() => setIsVillageDropdownOpen(false)}
                  />
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 sm:w-72 bg-[#1c1209] border-2 border-[#b88628] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.95)] z-50 overflow-hidden font-serif">
                    <div className="px-3 py-1.5 bg-[#2a1a0c] border-b border-[#5c3e1c] flex items-center justify-between text-[11px] text-amber-200">
                      <span>Mülkler & Otağlar ({playerVillages.length}/10)</span>
                      {canFoundNew && onOpenFoundVillageModal && (
                        <button
                          onClick={() => {
                            setIsVillageDropdownOpen(false);
                            onOpenFoundVillageModal();
                          }}
                          className="text-[10px] text-emerald-300 hover:text-emerald-100 flex items-center gap-0.5 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-600/50 transition cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Yeni Köy</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-[#3d2611]/60">
                      {playerVillages.map((v, idx) => {
                        const isCurrent = v.id === village.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              if (onSelectVillage) onSelectVillage(v.id);
                              setIsVillageDropdownOpen(false);
                            }}
                            className={`px-3 py-2 flex items-center justify-between transition cursor-pointer active:bg-amber-900/40 ${
                              isCurrent 
                                ? 'bg-gradient-to-r from-[#4a2e13] to-[#2c1908] text-amber-200 font-bold' 
                                : 'hover:bg-[#2e1d0e] text-stone-300 hover:text-amber-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-amber-400/80">#{idx + 1}</span>
                              <div className="flex flex-col">
                                <span className="text-xs">{v.name}</span>
                                <span className="text-[10px] font-mono text-stone-400">({v.x}|{v.y})</span>
                              </div>
                            </div>
                            {idx === 0 && (
                              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700/60 px-1.5 py-0.5 rounded">
                                Baş Otağ
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SAĞ YUVA: İşçi & Boşta İşçi + Hakan Butonu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* 100x Hızlandırma Test Modu Rozeti & Anında Kaynak Ekleme */}
            <button
              onClick={onAddTestResources}
              type="button"
              title="⚡ 100x Hızlandırma Aktif! Tıklayarak anında +100.000 Test Kaynağı ekleyebilirsiniz."
              className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border border-amber-400/90 bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 group"
            >
              <span className="text-amber-300 text-[10px] sm:text-xs group-hover:rotate-12 transition-transform">⚡</span>
              <span className="font-mono font-black text-[9px] sm:text-[11px] text-amber-300 tracking-wider">100x</span>
              <span className="text-[8px] text-amber-200/80 font-mono hidden md:inline group-hover:text-white transition-colors">+KAYNAK</span>
            </button>

            {/* İşçi & İşçi Tahsis Rozeti */}
            <div 
              onClick={onOpenWorkerDrawer}
              title={`Toplam İşçi: ${totalPop} • Boşta İşçi: ${idlePop} (İşçi tahsisi için tıkla)`}
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-lg border border-[#7a552b] bg-gradient-to-r from-[#26160a] to-[#1a0e06] shadow-md hover:border-amber-400 transition cursor-pointer group active:scale-95 touch-manipulation"
            >
              <Users className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
              <div className="flex items-center gap-0.5 sm:gap-1 font-mono text-[10px] sm:text-xs">
                <span className="text-amber-100 font-bold">{totalPop}</span>
                <span className="text-stone-500">/</span>
                <span className={`font-semibold ${idlePop > 0 ? 'text-emerald-400 animate-pulse' : 'text-stone-400'}`}>
                  {idlePop} <span className="hidden sm:inline">boş</span>
                </span>
              </div>
            </div>

            {/* Hakan / Kahraman Rozeti */}
            {khan && onOpenKhanModal && (
              <button
                onClick={onOpenKhanModal}
                title={`Ulu Hakan: ${khan.name} (Seviye ${khan.level})`}
                className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 rounded-lg border border-[#a17737] bg-gradient-to-r from-[#42250d] via-[#2f1807] to-[#1c0e04] shadow-md hover:border-[#ffd700] hover:shadow-[0_0_8px_rgba(255,215,0,0.3)] transition cursor-pointer group active:scale-95 touch-manipulation"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-400 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="font-serif font-bold text-[11px] sm:text-xs text-yellow-200 hidden md:inline">
                  {khan.name}
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] text-amber-300 bg-black/60 px-1 rounded border border-[#6b4c20]">
                  Lv.{khan.level}
                </span>
                {khan.unspentSkillPoints > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            )}

            {/* Zafer / Zafer Mabedi Rozeti */}
            {onOpenVictoryModal && (
              <button
                onClick={onOpenVictoryModal}
                title="Cihan Hâkimiyeti & Zafer Divanı"
                className="p-1 sm:px-2 sm:py-1 rounded-lg border border-[#855e2d] bg-[#221307] hover:border-amber-400 text-amber-300 hover:text-amber-100 transition cursor-pointer shadow-md flex items-center gap-1 active:scale-95 touch-manipulation"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] font-serif font-bold hidden lg:inline">Zafer</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. ALT SATIR: 5 TEMEL KAYNAK KASELERİ (ODUN, TAŞ, DEMİR, TAHIL, ALTIN)   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {resourcesList.map((res) => {
            const isFull = res.amount >= maxCapacity * 0.95;
            const isNearFull = res.amount >= maxCapacity * 0.85;

            const rateInfo = formatRate(res.rate);
            return (
              <div 
                key={res.key}
                title={`${res.name}: ${formatNum(res.amount)} / ${formatNum(maxCapacity)} (Hızlandırılmış Üretim: ${rateInfo.perHour} • ${rateInfo.perSec} • Sığınak Koruması: ${formatNum(hideoutProtected)})`}
                className={`relative px-1 sm:px-2 py-0.5 sm:py-1 rounded-lg border transition flex items-center justify-between overflow-hidden shadow-inner ${
                  isFull 
                    ? 'border-red-600/80 bg-gradient-to-b from-[#38110c] to-[#1c0806]' 
                    : isNearFull
                    ? 'border-amber-600/70 bg-gradient-to-b from-[#2b1b0e] to-[#170e07]'
                    : 'border-[#5e4123]/90 bg-gradient-to-b from-[#24170e] via-[#1a0f07] to-[#120a04]'
                }`}
              >
                {/* Sol: İkon & İsim */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center shrink-0 drop-shadow">
                    <ResourceIcon type={res.key} size="sm" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-serif font-semibold text-stone-300 hidden xl:inline">
                    {res.name}
                  </span>
                </div>

                {/* Sağ: Miktar & Üretim Oranı */}
                <div className="flex flex-col items-end leading-tight min-w-0">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <span className={`font-mono text-[10px] sm:text-xs md:text-[13px] font-bold tracking-tight bg-black/40 px-0.5 sm:px-1 rounded shadow-inner truncate ${
                      isFull ? 'text-red-300 animate-pulse' : res.color
                    }`}>
                      {formatNum(res.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] md:text-[10px] font-mono">
                    <span className={res.rate >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {rateInfo.perSec}
                    </span>
                    <span className="text-stone-500 hidden sm:inline">/ {formatNum(maxCapacity)}</span>
                  </div>
                </div>

                {/* Alt Kapasite İlerleme Çubuğu */}
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-black/60">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isFull ? 'bg-red-500' : isNearFull ? 'bg-amber-400' : 'bg-[#a3783c]'
                    }`}
                    style={{ width: `${Math.min(100, (res.amount / Math.max(1, maxCapacity)) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </header>
  );
};
