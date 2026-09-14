import React, { useState } from 'react';
import { 
  ChevronDown,
  Plus,
  Crown,
  Sparkles,
  Trophy,
  Users
} from 'lucide-react';
import { FACTIONS } from '../data/gameData';
import { ResourceRate, Village } from '../types/game';
import { getVillageMaxCapacity } from '../engine/simulation';
import { getVillageHideoutProtection } from '../engine/production';
import { getVillageTotalPopulation, getVillageIdleWorkers } from '../engine/workerEngine';
import { ResourceIcon } from './ResourceIcon';
import { ParchmentTooltip } from './ParchmentTooltip';

interface HeaderBarProps {
  village: Village;
  playerVillages?: Village[];
  rates: ResourceRate;
  activeTab?: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture';
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onSelectVillage?: (villageId: string) => void;
  onOpenFoundVillageModal?: () => void;
  onOpenFactionModal?: () => void;
  onOpenSqlModal?: () => void;
  onOpenOnboardingModal?: () => void;
  onOpenKhanModal?: () => void;
  onOpenVictoryModal?: () => void;
  onOpenWorkerDrawer?: () => void;
  activeMarchesCount?: number;
  unreadReportsCount?: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  village,
  playerVillages = [village],
  rates,
  activeTab,
  onSelectTab,
  onSelectVillage,
  onOpenFoundVillageModal,
  onOpenFactionModal,
  onOpenSqlModal,
  onOpenOnboardingModal,
  onOpenKhanModal,
  onOpenVictoryModal,
  onOpenWorkerDrawer,
  activeMarchesCount,
  unreadReportsCount,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const [isVillageMenuOpen, setIsVillageMenuOpen] = useState(false);

  const qualifiedCount = playerVillages.filter(v => (v.buildings.town_hall || 0) >= 10).length;
  const maxAllowedVillages = Math.min(10, 1 + qualifiedCount);
  const canFoundNew = playerVillages.length < maxAllowedVillages && playerVillages.length < 10;

  // Format Helper
  const formatNum = (val: number) => Math.floor(val).toLocaleString('tr-TR');
  const maxCapacity = village.maxCapacity || getVillageMaxCapacity(village);
  const hideoutProtected = getVillageHideoutProtection(village);
  const totalPop = getVillageTotalPopulation(village);
  const idlePop = getVillageIdleWorkers(village);

  return (
    <header 
      className="relative bg-gradient-to-b from-[#2a1a0e] via-[#1c1108] to-[#120a05] border-b-4 border-[#6e4e2a] shadow-[0_6px_20px_rgba(0,0,0,0.85)] text-[#ede3ce] select-none sticky top-0 z-30 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#d4af37]/40 before:to-transparent"
    >
      
      {/* Köşebent Metal Perçin Süsleri (Sol ve Sağ Uçlar) */}
      <div className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#4a3205] shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none opacity-60 hidden sm:block" />
      <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#4a3205] shadow-[0_1px_2px_rgba(0,0,0,0.9)] pointer-events-none opacity-60 hidden sm:block" />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
          
          {/* ================================================================ */}
          {/* 2. SOL: BEYLİK TUĞRASI & KÖY SEÇİCİ LEVHA (EMBOSSED CREST)        */}
          {/* ================================================================ */}
          <div className="flex items-center gap-2">
            
            {/* Otağ Rozeti / Beylik Sancağı (Kalıcı ve Tıklanamaz Sabit Rozet) */}
            <div 
              title={`${faction.name} • ${faction.leader} - Sancak Asla Değiştirilemez`}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border-2 border-[#caa05a] bg-gradient-to-br from-[#4a2e16] via-[#321c0b] to-[#1e1208] text-amber-200 font-serif shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.2)]"
            >
              <div className="relative w-8 h-6 rounded overflow-hidden border border-[#f5d78a] shadow-inner bg-black/60 shrink-0">
                {faction.flagImage ? (
                  <img 
                    src={faction.flagImage} 
                    alt={`${faction.name} Sancak Bayrağı`} 
                    className="w-full h-full object-cover object-center" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">
                    {faction.crestIcon || '🏹'}
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-black tracking-widest text-[#f5db99] font-serif uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {faction.name.split(' ')[0] || 'OTAĞ'}
                </div>
                <div className="text-[9px] text-[#decab0] font-mono font-semibold leading-none hidden sm:block">
                  13. Yüzyıl Sancağı
                </div>
              </div>
            </div>

            {/* Köy Seçici (Ahşap Plank Tabela) */}
            <div className="relative">
              <button
                onClick={() => setIsVillageMenuOpen(prev => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-b from-[#422d17] to-[#25170b] border border-[#a67c48]/60 rounded-md shadow-[inset_0_1px_2px_rgba(255,255,255,0.15),0_2px_5px_rgba(0,0,0,0.8)] hover:brightness-115 transition cursor-pointer group"
              >
                <div className="text-left">
                  <div className="text-xs font-bold text-[#fcedc7] flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
                    <span className="text-amber-400">🏛️</span>
                    <span className="font-serif font-black">{village.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                  </div>
                  <div className="text-[10px] text-[#d4b996] font-mono font-semibold">
                    ({village.x}|{village.y}) • <span className="text-amber-300">{playerVillages.length}/10 Köy</span>
                  </div>
                </div>
              </button>

              {/* Açılır Köy Menüsü (Yanık Kenarlı Parşömen Fermanı Dokusu) */}
              {isVillageMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 bg-gradient-to-b from-[#2b1b10] via-[#1a0f08] to-[#120a05] border-2 border-[#caa05a] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.95)] z-50 overflow-hidden animate-fade-in text-[#f0e2ca] font-serif">
                  <div className="p-2.5 bg-gradient-to-r from-[#4d3219] via-[#6e461f] to-[#4d3219] border-b-2 border-[#8b6534] flex items-center justify-between text-xs font-black text-[#fcedc7] tracking-wider drop-shadow">
                    <span>❖ BEYLİK KÖYLERİ ({playerVillages.length}/10)</span>
                    <button 
                      onClick={() => setIsVillageMenuOpen(false)}
                      className="text-amber-300 hover:text-white text-xs cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1.5 custom-scrollbar">
                    {playerVillages.map(v => {
                      const isCur = v.id === village.id;
                      const thLv = v.buildings.town_hall || 1;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            if (onSelectVillage) onSelectVillage(v.id);
                            setIsVillageMenuOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded transition cursor-pointer flex items-center justify-between text-xs border-t border-b ${
                            isCur 
                              ? 'bg-gradient-to-b from-[#6b4724] to-[#3a220e] border-[#d4af37] ring-1 ring-amber-400 shadow-[0_2px_6px_rgba(212,175,55,0.3)]' 
                              : 'bg-gradient-to-b from-[#3a2312] to-[#201309] border-[#6b4c2b]/60 hover:brightness-125 text-[#decab0]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{isCur ? '👑' : '🏛️'}</span>
                            <div>
                              <div className={`font-serif font-bold ${isCur ? 'text-[#fff4df] font-black' : 'text-[#fcedc7]'}`}>
                                {v.name}
                              </div>
                              <div className="text-[9px] text-[#bda273] font-mono font-semibold">
                                ({v.x}|{v.y}) • Kademe {thLv}
                              </div>
                            </div>
                          </div>
                          {isCur ? (
                            <span className="text-[9px] font-serif font-black px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-200">
                              AKTİF
                            </span>
                          ) : (
                            <span className="text-[9px] font-serif font-bold text-[#8c7352]">
                              SEÇ
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {onOpenFoundVillageModal && (
                    <div className="p-1.5 bg-[#140b06] border-t-2 border-[#5a3f24]">
                      <button
                        onClick={() => {
                          setIsVillageMenuOpen(false);
                          onOpenFoundVillageModal();
                        }}
                        className={`w-full py-1.5 px-2 rounded text-[11px] font-serif font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                          canFoundNew 
                            ? 'bg-gradient-to-r from-[#1b3d1f] to-[#24542a] hover:brightness-110 border border-emerald-500/60 text-[#e8fbe9]' 
                            : 'bg-[#26180d] border border-[#52381f] text-[#806447]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{canFoundNew ? 'Yeni Köy Kur (Ferman)' : 'Yeni Köy (Merkez Lv.10)'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Hakan Tuğrası (Khan Button) */}
            {onOpenKhanModal && (
              <button 
                onClick={onOpenKhanModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-[#78350f] to-[#451a03] border border-[#fcd34d]/60 rounded-md shadow-md hover:brightness-115 transition cursor-pointer group ml-1"
                title="Hakan (Kahraman) Otağı"
              >
                <Crown className="w-4 h-4 text-[#fef08a] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold font-serif text-[#fef08a] hidden sm:block">Hakan</span>
              </button>
            )}

            {/* İttifak & Cihan Hâkimiyeti Zafer Divanı Butonu */}
            {onOpenVictoryModal && (
              <button 
                onClick={onOpenVictoryModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-[#4a2e0a] via-[#331c05] to-[#1a0e02] border border-[#ffd700]/70 rounded-md shadow-md hover:brightness-125 transition cursor-pointer group ml-1"
                title="Cihan Hâkimiyeti: Zafer Mabedi İttifak Zaferi & Birlik Kapasitesi"
              >
                <Trophy className="w-4 h-4 text-[#ffd700] group-hover:scale-110 transition-transform drop-shadow" />
                <span className="text-xs font-bold font-serif text-[#fde68a] hidden sm:block">Zafer Divanı</span>
              </button>
            )}

            {/* Ahali & İşçi Tahsis Çekmecesi Butonu */}
            {onOpenWorkerDrawer && (
              <button 
                onClick={onOpenWorkerDrawer}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-[#1b3d1f] via-[#122e15] to-[#0a1c0d] border border-emerald-500/70 rounded-md shadow-md hover:brightness-125 transition cursor-pointer group ml-1"
                title={`Ahali Tahsis Paneli: ${idlePop} Boşta / ${totalPop} Toplam Ahali`}
              >
                <Users className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform drop-shadow" />
                <div className="text-left leading-tight hidden sm:block">
                  <div className="text-[11px] font-black font-serif text-emerald-200">
                    İşçi ({idlePop}/{totalPop})
                  </div>
                </div>
              </button>
            )}

          </div>

          {/* ================================================================ */}
          {/* 3. ORTA: OYMA MADEN YUVALARI (INLAID METAL COIN POUCHES)         */}
          {/* ================================================================ */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-2.5 bg-[#120a05] rounded-xl border-2 border-[#422a16] shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)]">
            
            {/* Odun */}
            <ParchmentTooltip
              title="Kereste Rezervi (Ortak Kasa)"
              subtitle={`%${Math.min(100, Math.round((village.resources.wood / (maxCapacity || 8000)) * 100))} Dolu`}
              description="Binaların inşası, sur tahkimatları ve ok imalatı için gereken kereste."
              stats={[
                { label: 'Mevcut Miktar', value: `${formatNum(village.resources.wood)} / ${formatNum(maxCapacity)}` },
                { label: 'Saatlik Üretim', value: `+${rates.wood}/saat`, color: 'text-emerald-700' },
                { label: 'Sığınak Koruması', value: `${formatNum(hideoutProtected)} Güvende`, color: 'text-amber-400' },
                { label: 'Ambar Dolum Süresi', value: `${Math.max(0, Math.round((maxCapacity - village.resources.wood) / Math.max(1, rates.wood)))} saat` }
              ]}
              footer="Kereste Fabrikasını yükselterek üretimi artırabilirsiniz."
            >
              <div 
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] min-w-[78px] sm:min-w-[88px] shrink-0 bg-[#100904] border border-[#422a16] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] rounded-lg hover:border-emerald-700/60 transition cursor-pointer" 
              >
                <ResourceIcon type="wood" size="md" className="shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-mono font-black text-[#fef08a] tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight">
                    {formatNum(village.resources.wood)}
                  </div>
                  <div className="flex items-center gap-1.5 leading-none mt-0.5">
                    <span className="text-[9px] font-mono text-[#4ade80] font-bold tabular-nums">
                      +{formatNum(rates.wood)}/s
                    </span>
                    <span 
                      className="text-[8px] font-mono text-amber-300 font-bold bg-[#241508] px-1 py-0.2 rounded border border-[#523d26] inline-flex items-center gap-0.5 tracking-tight"
                      title={`Sığınak Koruması: ${formatNum(hideoutProtected)} birim`}
                    >
                      🔒 {formatNum(hideoutProtected)}
                    </span>
                  </div>
                </div>
              </div>
            </ParchmentTooltip>

            {/* Dikey Ahşap Ayraç Fitili */}
            <div className="w-[2px] h-7 bg-[#3d2714] border-r border-[#1a0f08] shrink-0" />

            {/* Taş */}
            <ParchmentTooltip
              title="Taş Ocağı Rezervi (Ortak Kasa)"
              subtitle={`%${Math.min(100, Math.round((village.resources.stone / (maxCapacity || 8000)) * 100))} Dolu`}
              description="Kale surları, kuleler ve taş burçların inşasında kullanılan yontma taş."
              stats={[
                { label: 'Mevcut Miktar', value: `${formatNum(village.resources.stone)} / ${formatNum(maxCapacity)}` },
                { label: 'Saatlik Üretim', value: `+${rates.stone}/saat`, color: 'text-emerald-700' },
                { label: 'Sığınak Koruması', value: `${formatNum(hideoutProtected)} Güvende`, color: 'text-amber-400' },
                { label: 'Ambar Dolum Süresi', value: `${Math.max(0, Math.round((maxCapacity - village.resources.stone) / Math.max(1, rates.stone)))} saat` }
              ]}
              footer="Taş Ocağını geliştirerek rezerv akışını hızlandırın."
            >
              <div 
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] min-w-[78px] sm:min-w-[88px] shrink-0 bg-[#100904] border border-[#422a16] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] rounded-lg hover:border-slate-600/60 transition cursor-pointer" 
              >
                <ResourceIcon type="stone" size="md" className="shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-mono font-black text-[#fef08a] tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight">
                    {formatNum(village.resources.stone)}
                  </div>
                  <div className="flex items-center gap-1.5 leading-none mt-0.5">
                    <span className="text-[9px] font-mono text-[#4ade80] font-bold tabular-nums">
                      +{formatNum(rates.stone)}/s
                    </span>
                    <span 
                      className="text-[8px] font-mono text-amber-300 font-bold bg-[#241508] px-1 py-0.2 rounded border border-[#523d26] inline-flex items-center gap-0.5 tracking-tight"
                      title={`Sığınak Koruması: ${formatNum(hideoutProtected)} birim`}
                    >
                      🔒 {formatNum(hideoutProtected)}
                    </span>
                  </div>
                </div>
              </div>
            </ParchmentTooltip>

            {/* Dikey Ahşap Ayraç Fitili */}
            <div className="w-[2px] h-7 bg-[#3d2714] border-r border-[#1a0f08] shrink-0" />

            {/* Demir */}
            <ParchmentTooltip
              title="Maden & Dövme Demir (Ortak Kasa)"
              subtitle={`%${Math.min(100, Math.round((village.resources.iron / (maxCapacity || 8000)) * 100))} Dolu`}
              description="Zırhlar, kılıçlar, mızraklar ve savaş aletleri için kullanılan dövme demir cevheri."
              stats={[
                { label: 'Mevcut Miktar', value: `${formatNum(village.resources.iron)} / ${formatNum(maxCapacity)}` },
                { label: 'Saatlik Üretim', value: `+${formatNum(rates.iron)}/saat`, color: 'text-emerald-700' },
                { label: 'Sığınak Koruması', value: `${formatNum(hideoutProtected)} Güvende`, color: 'text-amber-400' },
                { label: 'Ambar Dolum Süresi', value: `${Math.max(0, Math.round((maxCapacity - village.resources.iron) / Math.max(1, rates.iron)))} saat` }
              ]}
              footer="Demir Madenini yükselterek askeri üretimi destekleyin."
            >
              <div 
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] min-w-[78px] sm:min-w-[88px] shrink-0 bg-[#100904] border border-[#422a16] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] rounded-lg hover:border-rose-700/60 transition cursor-pointer" 
              >
                <ResourceIcon type="iron" size="md" className="shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-mono font-black text-[#fef08a] tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight">
                    {formatNum(village.resources.iron)}
                  </div>
                  <div className="flex items-center gap-1.5 leading-none mt-0.5">
                    <span className="text-[9px] font-mono text-[#4ade80] font-bold tabular-nums">
                      +{formatNum(rates.iron)}/s
                    </span>
                    <span 
                      className="text-[8px] font-mono text-amber-300 font-bold bg-[#241508] px-1 py-0.2 rounded border border-[#523d26] inline-flex items-center gap-0.5 tracking-tight"
                      title={`Sığınak Koruması: ${formatNum(hideoutProtected)} birim`}
                    >
                      🔒 {formatNum(hideoutProtected)}
                    </span>
                  </div>
                </div>
              </div>
            </ParchmentTooltip>

            {/* Dikey Ahşap Ayraç Fitili */}
            <div className="w-[2px] h-7 bg-[#3d2714] border-r border-[#1a0f08] shrink-0" />

            {/* Tahıl (Upkeep kontrolü) */}
            <ParchmentTooltip
              title="Zahire Ambarı & Tahıl Rezervi (Ortak Kasa)"
              subtitle={`%${Math.min(100, Math.round((village.resources.grain / (maxCapacity || 8000)) * 100))} Dolu`}
              description="Nüfusun beslenmesi ve ordunun iaşesi için depolanan buğday rezervi. Zahire Ambarı çürümeyi önler."
              stats={[
                { label: 'Mevcut Miktar', value: `${formatNum(village.resources.grain)} / ${formatNum(maxCapacity)}` },
                { label: 'Net Üretim (İaşe Düşülmüş)', value: `${rates.grain >= 0 ? '+' : ''}${formatNum(rates.grain)}/saat`, color: rates.grain < 0 ? 'text-red-700' : 'text-emerald-700' },
                { label: 'Sığınak Koruması', value: `${formatNum(hideoutProtected)} Güvende`, color: 'text-amber-400' },
                { label: 'Tahıl Koruma Durumu', value: (village.buildings.granary || 0) > 0 ? 'Aktif (Çürüme Engellendi)' : 'Temel Ambar', color: (village.buildings.granary || 0) > 0 ? 'text-emerald-700' : 'text-amber-600' }
              ]}
              footer="Zahire Ambarını yükselterek depolama tavanını katlayın ve buğday çürümesini engelleyin."
            >
              <div 
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] min-w-[78px] sm:min-w-[88px] shrink-0 bg-[#100904] border border-[#422a16] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] rounded-lg hover:border-amber-700/60 transition cursor-pointer" 
              >
                <ResourceIcon type="grain" size="md" className="shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-mono font-black text-[#fef08a] tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight">
                    {formatNum(village.resources.grain)}
                  </div>
                  <div className="flex items-center gap-1.5 leading-none mt-0.5">
                    <span className={`text-[9px] font-mono font-bold tabular-nums ${rates.grain < 0 ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>
                      {rates.grain >= 0 ? `+${formatNum(rates.grain)}` : formatNum(rates.grain)}/s
                    </span>
                    <span 
                      className="text-[8px] font-mono text-amber-300 font-bold bg-[#241508] px-1 py-0.2 rounded border border-[#523d26] inline-flex items-center gap-0.5 tracking-tight"
                      title={`Sığınak Koruması: ${formatNum(hideoutProtected)} birim`}
                    >
                      🔒 {formatNum(hideoutProtected)}
                    </span>
                  </div>
                </div>
              </div>
            </ParchmentTooltip>

            {/* Dikey Ahşap Ayraç Fitili */}
            <div className="w-[2px] h-7 bg-[#3d2714] border-r border-[#1a0f08] shrink-0" />

            {/* Altın */}
            <ParchmentTooltip
              title="Beylik Hazinesi (Altın Akçe)"
              subtitle="Pazar & Vergi Geliri"
              description="Asker maaşları, teknoloji araştırmaları ve pazarda takas için kullanılan sikke."
              stats={[
                { label: 'Hazine Mevcudu', value: `${formatNum(village.resources.gold)} Akçe` },
                { label: 'Saatlik Gelir', value: `+${formatNum(rates.gold)}/saat`, color: 'text-yellow-700' },
                { label: 'Sığınak Koruması', value: `${formatNum(hideoutProtected)} Güvende`, color: 'text-amber-400' }
              ]}
              footer="Pazar Yeri ve ticaret kervanları ile hazineyi büyütün."
            >
              <div 
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[38px] min-w-[78px] sm:min-w-[88px] shrink-0 bg-[#100904] border border-[#422a16] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] rounded-lg hover:border-yellow-600/60 transition cursor-pointer" 
              >
                <ResourceIcon type="gold" size="md" className="shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-mono font-black text-[#fef08a] tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight">
                    {formatNum(village.resources.gold)}
                  </div>
                  <div className="flex items-center gap-1.5 leading-none mt-0.5">
                    <span className="text-[9px] font-mono text-yellow-400 font-bold tabular-nums">
                      +{formatNum(rates.gold)}/s
                    </span>
                    <span 
                      className="text-[8px] font-mono text-amber-300 font-bold bg-[#241508] px-1 py-0.2 rounded border border-[#523d26] inline-flex items-center gap-0.5 tracking-tight"
                      title={`Sığınak Koruması: ${formatNum(hideoutProtected)} birim`}
                    >
                      🔒 {formatNum(hideoutProtected)}
                    </span>
                  </div>
                </div>
              </div>
            </ParchmentTooltip>

            {/* Dikey Ahşap Ayraç Fitili */}
            <div className="w-[2px] h-7 bg-[#3d2714] border-r border-[#1a0f08] shrink-0" />

            {/* 100x Geliştirici Hızlandırma Modu Rozeti */}
            <div 
              title="Geliştirme & Test Modu: Tüm bina inşaatları, asker talimleri, nüfus doğumları, sefer intikalleri ve kaynak akışları 100 kat (100x) hızlandırılmıştır."
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 min-h-[36px] shrink-0 bg-gradient-to-r from-amber-950/80 via-yellow-900/60 to-amber-950/80 border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] rounded-lg animate-pulse"
            >
              <span className="text-amber-300 text-xs font-black">⚡</span>
              <div className="text-left leading-tight">
                <div className="text-[11px] font-mono font-black text-amber-300 tracking-wider">
                  100x HIZ
                </div>
                <div className="text-[8px] font-sans font-bold text-amber-200/80 uppercase tracking-tighter hidden sm:block">
                  Test Modu
                </div>
              </div>
            </div>

            {/* Elmas */}
            <ParchmentTooltip
              title="Hükümdar Mücevheri (Elmas)"
              subtitle="Nadir Hükümranlık Taşı"
              description="İnşaatları anında tamamlama, özel lütuflar ve askeri hızlandırmalar için kullanılır."
              stats={[
                { label: 'Elmas Bakiyesi', value: '10 Elmas', color: 'text-cyan-700' }
              ]}
              footer="Görevleri tamamlayarak veya beylik zaferleriyle kazanılır."
            >
              <div 
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[36px] min-w-[64px] shrink-0 bg-[#100904] border border-[#422a16] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95)] rounded-lg hover:border-cyan-600/60 transition cursor-pointer" 
              >
                <ResourceIcon type="gem" size="md" className="shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-mono font-black text-cyan-300 tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,1)] leading-tight">
                    10
                  </div>
                  <div className="text-[9px] font-mono text-cyan-400 font-bold leading-none">
                    Elmas
                  </div>
                </div>
              </div>
            </ParchmentTooltip>

          </div>

        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
