import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  BuildingType, 
  March, 
  ResourceRate, 
  Village 
} from '../types/game';
import { FACTIONS } from '../data/gameData';
import { getNextSpawnTimeRemaining, formatRemainingTime } from '../engine/populationEngine';
import { getVillageTotalPopulation, getVillageIdleWorkers, getVillageWorkingPopulation } from '../engine/workerEngine';
import { ResourceIcon } from './ResourceIcon';
import { 
  Plus, 
  Swords, 
  ShieldCheck, 
  Compass, 
  MessageSquare, 
  Users, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Send,
  Clock,
  Sparkles,
  Scroll,
  Crown
} from 'lucide-react';

interface UmaykutRightPanelProps {
  village: Village;
  playerVillages: Village[];
  rates: ResourceRate;
  activeMarches?: March[];
  onSelectVillage: (villageId: string) => void;
  onOpenFoundVillageModal?: () => void;
  onOpenBuilding?: (type: BuildingType) => void;
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onOpenFactionModal?: () => void;
  onOpenVictoryPanel?: () => void;
  onOpenWorkerDrawer?: () => void;
}

interface ChatMessage {
  sender: string;
  text: string;
  color: string;
  time: string;
}

export const UmaykutRightPanel: React.FC<UmaykutRightPanelProps> = ({
  village,
  playerVillages,
  rates,
  activeMarches = [],
  onSelectVillage,
  onOpenFoundVillageModal,
  onOpenBuilding,
  onSelectTab,
  onOpenFactionModal,
  onOpenVictoryPanel,
  onOpenWorkerDrawer,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [allianceMsgOpen, setAllianceMsgOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'Gündüz Alp', text: 'Kuzeydoğudaki 8. kademe buğday tarlalarını emniyete aldık.', color: 'text-amber-300', time: '14:20' },
    { sender: 'Ertuğrul', text: 'Sınır boyundaki Yarhisar tekfuru casus gönderdi, kuleleri yükseltelim.', color: 'text-yellow-400', time: '14:22' },
    { sender: 'Karamanoğlu', text: 'Merkez pazarında 50.000 tahıl satışta, takasa açığız.', color: 'text-emerald-300', time: '14:25' },
  ]);

  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;

  // Umaykut Formatı (Örn: 43.455.819)
  const formatUmaykutNum = (val: number) => {
    return Math.floor(val).toLocaleString('tr-TR');
  };

  // Saniyelik üretim hızı (+120/s)
  const formatRate = (rate: number) => {
    const r = Math.round(rate);
    return r >= 0 ? `+${r}/s` : `${r}/s`;
  };

  // Köyler Arası Gezinme Döngüsü
  const currentIndex = playerVillages.findIndex(v => v.id === village.id);
  
  const handlePrevVillage = () => {
    if (playerVillages.length <= 1) return;
    const prevIndex = (currentIndex - 1 + playerVillages.length) % playerVillages.length;
    onSelectVillage(playerVillages[prevIndex].id);
  };

  const handleNextVillage = () => {
    if (playerVillages.length <= 1) return;
    const nextIndex = (currentIndex + 1) % playerVillages.length;
    onSelectVillage(playerVillages[nextIndex].id);
  };

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      sender: village.ownerName || 'Hakan',
      text: chatInput.trim(),
      color: 'text-amber-300',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    setTimeout(() => {
      const bots = [
        { sender: 'Sancar Bey', text: 'Emredersiniz hakanım, atlı birlikler hazır bekliyor!', color: 'text-sky-300' },
        { sender: 'Gündüz Alp', text: 'Demir ocaklarının verimi artırıldı, silah üretimi hızlandı.', color: 'text-amber-200' }
      ];
      const botPick = bots[Math.floor(Math.random() * bots.length)];
      setChatMessages(prev => [...prev, {
        ...botPick,
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2500);
  };

  const [selectedResourceInfo, setSelectedResourceInfo] = useState<{type: 'wood' | 'stone' | 'iron' | 'grain' | 'gold', name: string, amount: number, rate: number} | null>(null);

  const handleResourceClick = (type: 'wood' | 'stone' | 'iron' | 'grain' | 'gold', name: string) => {
    setSelectedResourceInfo({
      type,
      name,
      amount: village.resources[type],
      rate: rates[type] * 3600 // Convert per-second to hourly rate
    });
  };

  return (
    <div className={`relative z-20 transition-all duration-300 ${isCollapsed ? 'w-0' : 'w-64 sm:w-72'} select-none font-serif`}>

      
      {/* 0. SOL DIŞ KENARDAKİ DİKEY FERMAN SEKME VE PERÇİNLERİ */}
      <div className="absolute -left-7 top-20 flex flex-col gap-2 z-30">
        {onOpenVictoryPanel && (
          <button
            onClick={onOpenVictoryPanel}
            title="Cihan Hâkimiyeti Zafer Divanı (Zafer Mabedi İttifak Zaferi)"
            className="bg-gradient-to-r from-[#633a0e] to-[#3d2005] text-[#fff2d1] border-l-2 border-y-2 border-[#ffd700] rounded-l-md px-1.5 py-3.5 text-[10px] font-serif font-black shadow-[inset_1px_1px_2px_rgba(255,255,255,0.3),-4px_4px_8px_rgba(0,0,0,0.9)] transition hover:brightness-135 cursor-pointer flex flex-col items-center group"
            style={{ writingMode: 'vertical-rl' }}
          >
            <span className="tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-[#ffe082]">ZAFER DİVANI</span>
          </button>
        )}

        <button
          onClick={() => setAllianceMsgOpen(v => !v)}
          title="Birlik Mesajı & Emirler"
          className="bg-gradient-to-r from-[#442a15] to-[#2a170a] text-[#f7e6c4] border-l-2 border-y-2 border-[#b8860b] rounded-l-md px-1.5 py-3.5 text-[10px] font-serif font-black shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),-4px_4px_8px_rgba(0,0,0,0.8)] transition hover:brightness-125 cursor-pointer flex flex-col items-center group"
          style={{ writingMode: 'vertical-rl' }}
        >
          <span className="tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-[#fedd87]">BİRLİK FERMANI</span>
        </button>

        <button
          onClick={() => setChatOpen(v => !v)}
          title="Oyun Sohbeti"
          className="bg-gradient-to-r from-[#442a15] to-[#2a170a] text-[#f7e6c4] border-l-2 border-y-2 border-[#b8860b] rounded-l-md px-1.5 py-3.5 text-[10px] font-serif font-black shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2),-4px_4px_8px_rgba(0,0,0,0.8)] transition hover:brightness-125 cursor-pointer flex flex-col items-center group"
          style={{ writingMode: 'vertical-rl' }}
        >
          <span className="tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-[#fedd87]">DİVAN SOHBETİ</span>
        </button>

        <button
          onClick={() => setIsCollapsed(c => !c)}
          title={isCollapsed ? 'Paneli Aç' : 'Paneli Gizle'}
          className="bg-[#24150b] text-[#f5d78a] border-l-2 border-y border-[#8b6534] rounded-l-md p-1.5 hover:bg-[#382010] transition cursor-pointer shadow-lg"
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* 1. DIŞ ÇERÇEVE VE ARKA PLAN: OYMA KOYU CEVİZ/MEŞE AHŞAP PANO */}
      {!isCollapsed && (
        <aside 
          className="w-full h-full min-h-[640px] bg-gradient-to-b from-[#2b1b10] via-[#1a0f08] to-[#120a05] border-l-4 border-[#6e4e2a] shadow-[inset_2px_0_10px_rgba(0,0,0,0.85),-8px_0_24px_rgba(0,0,0,0.7)] flex flex-col justify-between text-[#f3e5ca] relative overflow-hidden"
        >
          {/* Sol Pervaz Boyunca Dikey Pirinç Çivi / Perçin (Rivet) Süsleme Hattı */}
          <div className="absolute left-1 top-0 bottom-0 w-1 flex flex-col justify-between py-3 pointer-events-none opacity-40 z-10">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#ffd700] via-[#b8860b] to-[#4a3205] shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              />
            ))}
          </div>

          {/* ================================================================ */}
          {/* 2. ÜST PAYİTAHT & BEYLİK BAŞLIĞI (ORNATE GOLD HEADER)             */}
          {/* ================================================================ */}
          <div className="p-2.5 bg-gradient-to-b from-[#3d2716] via-[#28180c] to-[#1a0e07] border-b-2 border-[#5a3e1f] relative shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            
            {/* Altın Varaklı Oyma Kitabe Başlığı */}
            <div className="flex items-center justify-between pb-1.5 border-b border-[#6e4e26]/70">
              <button
                onClick={handlePrevVillage}
                title="Önceki Şehir"
                className="text-amber-400 hover:text-amber-100 p-1.5 hover:bg-[#523319] rounded-md transition cursor-pointer disabled:opacity-30 active:scale-95"
                disabled={playerVillages.length <= 1}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="text-center px-1">
                {/* Altın Kabartmalı Umaykut Logosu */}
                <div className="text-xs sm:text-sm font-serif font-black tracking-widest text-[#f5d78a] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] uppercase flex items-center justify-center gap-1.5">
                  <span className="text-amber-500 text-xs">❖</span>
                  <span>OTAĞ</span>
                  <span className="text-amber-500 text-xs">❖</span>
                </div>
                <div className="text-[10px] text-[#decab0] font-mono tracking-wider font-semibold">
                  {village.name} <span className="text-amber-400 font-bold">({village.x}|{village.y})</span>
                </div>
              </div>

              <button
                onClick={handleNextVillage}
                title="Sonraki Şehir"
                className="text-amber-400 hover:text-amber-100 p-1.5 hover:bg-[#523319] rounded-md transition cursor-pointer disabled:opacity-30 active:scale-95"
                disabled={playerVillages.length <= 1}
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* İçe Basık (Embossed) Parşömen Han & Devlet Şeridi + Parlayan Sancak Mührü */}
            <div className="flex items-center justify-between gap-2 mt-2 px-2 py-1.5 bg-[#120b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-md">
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a89070] text-[10px] font-serif uppercase tracking-wider font-bold">Hakan:</span>
                  <strong className="text-[#fff4df] font-serif font-bold text-xs drop-shadow">
                    {village.ownerName || 'Hakan'}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#a89070] text-[10px] font-serif uppercase tracking-wider font-bold">Beylik:</span>
                  <span 
                    onClick={onOpenFactionModal}
                    title="Devlet & Han Künyesini İncele"
                    className="text-[#f5d78a] hover:text-amber-200 underline decoration-dotted decoration-amber-600 font-serif font-bold text-[11px] cursor-pointer"
                  >
                    {faction.name}
                  </span>
                </div>
              </div>

              {/* Parlayan Beylik Sancağı Mührü */}
              <div 
                onClick={onOpenFactionModal}
                className="relative w-12 h-8 rounded-lg border-2 border-[#f5d78a] shadow-[0_2px_8px_rgba(245,215,138,0.3)] overflow-hidden cursor-pointer hover:scale-105 hover:brightness-110 active:scale-95 transition bg-black/60 shrink-0 flex items-center justify-center"
                title={`${faction.name} Sancağı • ${faction.leader}`}
              >
                {faction.flagImage ? (
                  <img 
                    src={faction.flagImage} 
                    alt={`${faction.name} Bayrağı`} 
                    className="w-full h-full object-cover object-center" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <span className="text-base">{faction.crestIcon || '🏹'}</span>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* 4. KAYNAKLAR TABLOSU (INLAID RESOURCE SLOTS)                      */}
          {/* ================================================================ */}
          <div className="px-2.5 pt-2 pb-1">
            {/* Kaynaklar Başlık Levhası */}
            <div className="bg-gradient-to-r from-[#4d3219] via-[#754a20] to-[#4d3219] border-t border-[#c69a53] border-b-2 border-[#1f1208] rounded px-2 py-0.5 shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-center">
              <span className="font-serif font-black text-[11px] tracking-widest text-[#fcedc7] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] uppercase">
                ORTAK KASA & KAYNAKLAR
              </span>
            </div>



            {/* İçe Oyulmuş Taş / Maden Yuvaları Grid'i */}
            <div className="mt-1.5 space-y-1.5">
              
              {/* Taş */}
              <div 
                onClick={() => handleResourceClick('stone', 'Taş')}
                title="Taş Rezervi & Taş Ocağı"
                className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2.5 py-1.5 hover:border-amber-600/60 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ResourceIcon type="stone" size="md" className="shrink-0" />
                  <span className="font-serif font-bold text-xs text-[#decab0] group-hover:text-amber-200">Taş</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-stone-200">
                    {formatUmaykutNum(village.resources.stone)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold leading-none">
                    {formatRate(rates.stone)}
                  </div>
                </div>
              </div>

              {/* Odun */}
              <div 
                onClick={() => handleResourceClick('wood', 'Odun')}
                title="Odun Rezervi & Kereste Fabrikası"
                className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2.5 py-1.5 hover:border-amber-600/60 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ResourceIcon type="wood" size="md" className="shrink-0" />
                  <span className="font-serif font-bold text-xs text-[#decab0] group-hover:text-amber-200">Odun</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-emerald-300">
                    {formatUmaykutNum(village.resources.wood)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold leading-none">
                    {formatRate(rates.wood)}
                  </div>
                </div>
              </div>

              {/* Tahıl */}
              <div 
                onClick={() => handleResourceClick('grain', 'Tahıl')}
                title="Tahıl Ambarı & Değirmen"
                className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2.5 py-1.5 hover:border-amber-600/60 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ResourceIcon type="grain" size="md" className="shrink-0" />
                  <span className="font-serif font-bold text-xs text-[#decab0] group-hover:text-amber-200">Tahıl</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-amber-300">
                    {formatUmaykutNum(village.resources.grain)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold leading-none">
                    {formatRate(rates.grain)}
                  </div>
                </div>
              </div>

              {/* Demir */}
              <div 
                onClick={() => handleResourceClick('iron', 'Demir')}
                title="Demir & Kılıçhane"
                className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2.5 py-1.5 hover:border-amber-600/60 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ResourceIcon type="iron" size="md" className="shrink-0" />
                  <span className="font-serif font-bold text-xs text-[#decab0] group-hover:text-amber-200">Demir</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-rose-300">
                    {formatUmaykutNum(village.resources.iron)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold leading-none">
                    {formatRate(rates.iron)}
                  </div>
                </div>
              </div>

              {/* Altın */}
              <div 
                onClick={() => handleResourceClick('gold', 'Altın')}
                title="Altın Hazinesi"
                className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2.5 py-1.5 hover:border-amber-600/60 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <ResourceIcon type="gold" size="md" className="shrink-0" />
                  <span className="font-serif font-bold text-xs text-[#decab0] group-hover:text-amber-200">Altın</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-yellow-300">
                    {formatUmaykutNum(village.resources.gold)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold leading-none">
                    {formatRate(rates.gold)}
                  </div>
                </div>
              </div>

              {/* At & Elmas Satırı (Kombine İki Bölümlü Slot) */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {/* At */}
                <div 
                  onClick={() => onOpenBuilding && onOpenBuilding('stables')}
                  title="Süvari Atları Harası"
                  className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2 py-1 hover:border-amber-600/60 transition cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <ResourceIcon type="horse" size="sm" className="shrink-0" />
                    <span className="font-serif font-bold text-[11px] text-[#decab0]">At</span>
                  </div>
                  <span className="font-mono font-bold text-[11px] text-orange-200">
                    4.451
                  </span>
                </div>

                {/* Elmas */}
                <div 
                  className="flex items-center justify-between bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] rounded-lg px-2 py-1"
                  title="Hükümdar Mücevheri (Elmas)"
                >
                  <div className="flex items-center gap-1.5">
                    <ResourceIcon type="gem" size="sm" className="shrink-0" />
                    <span className="font-serif font-bold text-[11px] text-[#decab0]">Elmas</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="font-mono font-bold text-[11px] text-cyan-300">10</span>
                    <span className="text-[9px] text-cyan-300 font-bold bg-cyan-950 px-1 rounded border border-cyan-800 cursor-pointer hover:bg-cyan-900">+</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ================================================================ */}
          {/* 3. AHŞAP TABELA (PLANK) ŞEHİRLER LİSTESİ (İKONİK ALAN)           */}
          {/* ================================================================ */}
          <div className="px-2.5 py-1 flex-1 flex flex-col min-h-0">
            {/* Şehirler Başlık Levhası */}
            <div className="bg-gradient-to-r from-[#4d3219] via-[#754a20] to-[#4d3219] border-t border-[#c69a53] border-b-2 border-[#1f1208] rounded px-2 py-0.5 shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-center flex items-center justify-between">
              <span className="font-serif font-black text-[11px] tracking-widest text-[#fcedc7] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] uppercase">
                ŞEHİRLER ({playerVillages.length})
              </span>
              {onOpenFoundVillageModal && (
                <button
                  onClick={onOpenFoundVillageModal}
                  title="Yeni Şehir / Beylik Köyü Kur"
                  className="text-[#f5d78a] hover:text-white text-[10px] font-bold flex items-center gap-0.5 cursor-pointer hover:scale-105 transition"
                >
                  <Plus className="w-3 h-3 text-amber-400" />
                  <span>Köy Kur</span>
                </button>
              )}
            </div>

            {/* Duvara Asılmış Yatay Ahşap Tahtalar (Wooden Planks) */}
            <div className="mt-1.5 space-y-1.5 overflow-y-auto max-h-40 pr-0.5 custom-scrollbar">
              {playerVillages.map(pv => {
                const isSelected = pv.id === village.id;
                const townHallLv = pv.buildings?.town_hall || 1;
                return (
                  <button
                    key={pv.id}
                    onClick={() => onSelectVillage(pv.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded transition cursor-pointer shadow-[0_3px_6px_rgba(0,0,0,0.7)] flex items-center justify-between border-t border-b-2 ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#6b4724] to-[#3a220e] border-t-[#f5d78a] border-b-[#1f1105] border-x border-x-[#d4af37] ring-1 ring-amber-400/80 shadow-[0_4px_10px_rgba(212,175,55,0.35)]'
                        : 'bg-gradient-to-b from-[#4d351d] via-[#362312] to-[#201408] border-t-[#a67c48]/50 border-b-[#100904] border-x border-x-[#2b190c] hover:border-t-amber-400 hover:brightness-110'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Sol Sancak Damgası */}
                      <span className={`text-xs ${isSelected ? 'text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]' : 'text-stone-400'}`}>
                        {isSelected ? '👑' : '🏛️'}
                      </span>
                      <div>
                        {/* Ahşap Oyma Köy Adı */}
                        <div className={`font-serif font-bold text-xs truncate max-w-[120px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] ${
                          isSelected ? 'text-[#fff4df] font-black' : 'text-[#fcedc7]'
                        }`}>
                          {pv.name}
                        </div>
                        <div className="text-[9px] font-mono text-[#d4b996] font-semibold flex items-center gap-1">
                          <span>({pv.x}|{pv.y})</span>
                          <span>•</span>
                          <span className="text-amber-300">🧑‍🌾 {pv.idlePopulation ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ Durum Rozeti */}
                    <div className="text-right">
                      <span className={`text-[10px] font-serif font-black px-2 py-0.5 rounded shadow-inner tracking-wider ${
                        isSelected 
                          ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-[#fcedc7] border border-[#f5d78a] drop-shadow'
                          : 'bg-[#140b06] text-[#a89070] border border-[#3d2714]'
                      }`}>
                        {isSelected ? 'AKTİF' : 'SEÇ'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Yeni Köy Kur Ferman Butonu */}
            {onOpenFoundVillageModal && (
              <button
                onClick={onOpenFoundVillageModal}
                className="mt-2 w-full py-1.5 px-2 bg-gradient-to-r from-[#1b3d1f] via-[#24542a] to-[#143317] hover:brightness-110 border-t border-[#4ade80]/60 border-b-2 border-[#091b0c] rounded shadow-[0_3px_6px_rgba(0,0,0,0.8)] flex items-center justify-center gap-1.5 text-[#e8fbe9] text-[11px] font-serif font-black tracking-wider transition cursor-pointer active:translate-y-0.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>+ YENİ KÖY KUR (FERMAN)</span>
              </button>
            )}
          </div>

          {/* ================================================================ */}
          {/* 5. ALT ASKERİ OLAYLAR VE DAİRESEL EYLEM MÜHÜRLERİ               */}
          {/* ================================================================ */}
          <div className="px-2.5 pb-2.5 pt-1.5 border-t-2 border-[#5a3e1f] bg-gradient-to-b from-[#201309] to-[#0f0703] relative">
            
            {/* Olaylar Başlık Levhası */}
            <div className="bg-gradient-to-r from-[#4d3219] via-[#754a20] to-[#4d3219] border-t border-[#c69a53] border-b-2 border-[#1f1208] rounded px-2 py-0.5 shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-center mb-1.5 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-[#f5d78a]" />
              <span className="font-serif font-black text-[11px] tracking-widest text-[#fcedc7] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] uppercase">
                SEFERLER & OLAYLAR
              </span>
            </div>

            {/* Seferler Listesi veya Boş Durum */}
            {activeMarches.length > 0 ? (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5 text-xs custom-scrollbar">
                {activeMarches.map(m => {
                  const now = Date.now();
                  const remainingSec = Math.max(0, Math.ceil((m.arrivalTime - now) / 1000));
                  const mins = Math.floor(remainingSec / 60);
                  const secs = remainingSec % 60;
                  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  
                  return (
                    <div 
                      key={m.id}
                      onClick={() => onSelectTab && onSelectTab('military')}
                      className="p-1.5 bg-[#170e08] border border-[#78350f] rounded text-[10px] text-amber-100 flex items-center justify-between cursor-pointer hover:bg-[#2b170c] transition shadow-inner"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-red-400 text-xs">⚔️</span>
                        <div className="truncate max-w-[110px]">
                          <strong className="text-[#fce7c8]">{m.targetName}</strong>
                          <div className="text-[9px] text-[#a89070] font-sans">{m.isReturning ? 'Dönüş' : 'Taarruz'}</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-[#f5d78a]">
                        {timeStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-2 text-center text-[10px] text-[#a89070] font-serif bg-[#130b06] border border-[#3d2714] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] rounded">
                Garnizonda yürüyen sefer bulunmuyor.
              </div>
            )}

            {/* Dairesel Bronz Döküm Eylem Mühürleri (Wax Seal Style Buttons) */}
            <div className="grid grid-cols-3 gap-2.5 mt-2.5 pt-2 border-t border-[#3d2714]">
              
              {/* 1. Kırmızı Mühür: Taarruz / Sefer Düzenle */}
              <button
                onClick={() => onSelectTab && onSelectTab('military')}
                title="Saldırı & Sefer Düzenle"
                className="w-9 h-9 mx-auto rounded-full bg-gradient-to-b from-[#8f2a1c] via-[#61160c] to-[#380905] border-2 border-[#d97736] shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:scale-105 active:translate-y-0.5 transition flex items-center justify-center text-white cursor-pointer group"
              >
                <Swords className="w-4 h-4 text-amber-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:text-white" />
              </button>

              {/* 2. Yeşil Mühür: Savunma & Hisar */}
              <button
                onClick={() => onSelectTab && onSelectTab('military')}
                title="Garnizon & Savunma Desteği"
                className="w-9 h-9 mx-auto rounded-full bg-gradient-to-b from-[#1b6b33] via-[#104721] to-[#072410] border-2 border-[#4ade80] shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:scale-105 active:translate-y-0.5 transition flex items-center justify-center text-white cursor-pointer group"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:text-white" />
              </button>

              {/* 3. Altın / Kehribar Mühür: Harita & Seferberlik */}
              <button
                onClick={() => onSelectTab && onSelectTab('map')}
                title="Anadolu Haritası & İntikal"
                className="w-9 h-9 mx-auto rounded-full bg-gradient-to-b from-[#a36814] via-[#6e4309] to-[#382003] border-2 border-[#fbbf24] shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:scale-105 active:translate-y-0.5 transition flex items-center justify-center text-white cursor-pointer group"
              >
                <Compass className="w-4 h-4 text-amber-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] group-hover:text-white" />
              </button>

              {/* 4. Bordo Mühür: Casusluk & Keşif */}
              <button
                onClick={() => onSelectTab && onSelectTab('military')}
                title="Casus Kolu & İstihbarat"
                className="w-9 h-9 mx-auto rounded-full bg-gradient-to-b from-[#7a1c1c] via-[#4d0d0d] to-[#260505] border-2 border-[#f87171] shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:scale-105 active:translate-y-0.5 transition flex items-center justify-center text-rose-200 cursor-pointer text-xs"
              >
                🗡️
              </button>

              {/* 5. Zümrüt Mühür: Kışla & Talim */}
              <button
                onClick={() => onOpenBuilding && onOpenBuilding('barracks')}
                title="Kışla Talimi & Birlik Eğitimi"
                className="w-9 h-9 mx-auto rounded-full bg-gradient-to-b from-[#0e5e40] via-[#083d29] to-[#031f14] border-2 border-[#34d399] shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:scale-105 active:translate-y-0.5 transition flex items-center justify-center text-emerald-200 cursor-pointer text-xs"
              >
                📯
              </button>

              {/* 6. Bronz Mühür: Savaş Raporları */}
              <button
                onClick={() => onSelectTab && onSelectTab('reports')}
                title="Savaş Raporları & Fermanlar"
                className="w-9 h-9 mx-auto rounded-full bg-gradient-to-b from-[#6b3811] via-[#452107] to-[#210e02] border-2 border-[#f59e0b] shadow-[0_3px_8px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.4)] hover:scale-105 active:translate-y-0.5 transition flex items-center justify-center text-amber-200 cursor-pointer text-xs"
              >
                📜
              </button>

            </div>
          </div>

        </aside>
      )}

      {/* ==================================================================== */}
      {/* KAYNAK DETAY MODALI                                                   */}
      {/* ==================================================================== */}
      {selectedResourceInfo && createPortal(
        <div 
          className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedResourceInfo(null)}
        >
          <div 
            className="bg-[#1e150e] border-2 border-[#b8860b] rounded-xl max-w-sm w-full p-4 shadow-2xl text-stone-200 font-serif"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#5c401f] pb-2 mb-3">
              <h3 className="font-bold text-[#f5d78a] text-lg flex items-center gap-2">
                <ResourceIcon type={selectedResourceInfo.type} size="md" />
                {selectedResourceInfo.name} Raporu
              </h3>
              <button
                onClick={() => setSelectedResourceInfo(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-[#130b06] border border-[#3d2714] rounded-lg p-3 text-center shadow-inner">
                <div className="text-[10px] text-[#a89070] uppercase tracking-widest mb-1">Sahip Olunan</div>
                <div className="text-2xl font-mono font-black text-amber-400 drop-shadow">
                  {formatUmaykutNum(selectedResourceInfo.amount)}
                </div>
              </div>

              <div className="bg-[#130b06] border border-[#3d2714] rounded-lg p-3 text-center shadow-inner">
                <div className="text-[10px] text-[#a89070] uppercase tracking-widest mb-1">Saatlik Üretim Hızı</div>
                <div className={`text-xl font-mono font-bold ${selectedResourceInfo.rate >= 0 ? 'text-emerald-400' : 'text-rose-400'} drop-shadow`}>
                  {selectedResourceInfo.rate >= 0 ? '+' : ''}{formatUmaykutNum(selectedResourceInfo.rate)} / saat
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedResourceInfo(null)}
              className="mt-4 w-full py-2 bg-gradient-to-r from-[#442a15] to-[#2a170a] border border-[#b8860b] text-[#f5d78a] rounded shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:brightness-110 transition cursor-pointer font-bold"
            >
              Anladım
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ==================================================================== */}
      {/* SOHBET AÇILIR DİVAN PENCERESİ                                         */}
      {/* ==================================================================== */}
      {chatOpen && (
        <div className="fixed sm:absolute right-2 sm:right-full top-20 w-[calc(100vw-1rem)] sm:w-72 max-w-sm bg-[#1e140d]/98 backdrop-blur-md border-2 border-[#b8860b] rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.9)] text-stone-200 z-[1000] text-xs animate-fade-in font-serif">
          <div className="flex items-center justify-between pb-2 border-b border-[#5c401f]">
            <span className="font-serif font-black text-[#f5d78a] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Oyun Meydanı & Divan Sohbeti
            </span>
            <button onClick={() => setChatOpen(false)} className="text-stone-400 hover:text-white cursor-pointer font-bold">✕</button>
          </div>

          <div className="h-48 overflow-y-auto my-2 space-y-2 text-[11px] pr-1 custom-scrollbar">
            {chatMessages.map((msg, i) => (
              <div key={i} className="bg-[#120b06]/90 border border-[#3e2814] p-2 rounded shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-[#a89070] mb-0.5 font-mono">
                  <strong className={msg.color}>{msg.sender}:</strong>
                  <span>{msg.time}</span>
                </div>
                <div className="text-[#fcedc7] font-sans leading-tight">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-1 mb-2 overflow-x-auto pb-1 text-[9px] font-sans custom-scrollbar">
            <button
              onClick={() => setChatInput('Madenleri koruyun, ordu intikal ediyor!')}
              className="px-1.5 py-0.5 bg-[#2e1d11] hover:bg-[#442c19] text-amber-300 rounded border border-[#6f5028] whitespace-nowrap cursor-pointer"
            >
              🛡️ Madenleri Koru
            </button>
            <button
              onClick={() => setChatInput('Pazarda tahıl takası açıldı!')}
              className="px-1.5 py-0.5 bg-[#2e1d11] hover:bg-[#442c19] text-emerald-300 rounded border border-[#6f5028] whitespace-nowrap cursor-pointer"
            >
              🌾 Pazar Takası
            </button>
          </div>

          <form onSubmit={handleSendChatMessage} className="flex gap-1">
            <input 
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Beyliklere ferman duyur..." 
              className="flex-1 bg-[#120b06] border border-[#5c401f] rounded px-2 py-1 text-[11px] text-amber-100 focus:outline-none focus:border-amber-500 font-sans"
            />
            <button 
              type="submit"
              className="px-2.5 py-1 bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-600 text-white rounded cursor-pointer transition flex items-center justify-center shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BİRLİK FERMANI AÇILIR DİVAN PENCERESİ                                 */}
      {/* ==================================================================== */}
      {allianceMsgOpen && (
        <div className="fixed sm:absolute right-2 sm:right-full top-28 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-[#1e140d]/98 backdrop-blur-md border-2 border-[#b8860b] rounded-xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.9)] text-stone-200 z-[1000] text-xs animate-fade-in font-serif">
          <div className="flex items-center justify-between pb-2 border-b border-[#5c401f]">
            <span className="font-serif font-black text-[#f5d78a] flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-amber-400" />
              Birlik Divanı Fermanı
            </span>
            <button onClick={() => setAllianceMsgOpen(false)} className="text-stone-400 hover:text-white cursor-pointer font-bold">✕</button>
          </div>
          
          <div className="p-3 bg-[#120b06] border border-[#5c401f] shadow-inner rounded-lg my-2.5 text-[11px] text-[#fcedc7] leading-relaxed font-serif space-y-2">
            <div>
              📜 <strong>Birlik Fermanı:</strong> Tüm beylerimiz etki alanlarındaki yüksek kademeli (Kademe 4-9) madenleri derhal kontrol altına alsın.
            </div>
            <div className="border-t border-[#3e2814] pt-2 text-[#decab0]">
              ⚔️ <strong>Ortak Akın:</strong> Komşu Bizans tekfurluklarına yapılacak ortak akın için kışlalarda süvari ve okçu eğitimlerine öncelik verilecektir.
            </div>
          </div>

          <div className="text-[10px] text-amber-400 font-serif font-bold text-right tracking-wider">
            Divan Katibi • Mühr-i Hümayun ✦
          </div>
        </div>
      )}

    </div>
  );
};
export default UmaykutRightPanel;
