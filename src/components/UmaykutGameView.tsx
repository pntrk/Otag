import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  FactionId, 
  March, 
  ResourceNode, 
  ResourceRate, 
  Resources, 
  TrainingQueueItem, 
  UnitType, 
  Village 
} from '../types/game';
import { 
  BUILDINGS, 
  FACTIONS, 
  UNITS, 
  calculateDistance, 
  getCapturedNodesForVillage, 
  getInfluenceRadius 
} from '../data/gameData';
import { getVillageMaxCapacity } from '../engine/simulation';
import { UmaykutNodeGraphic } from './UmaykutNodeGraphic';
import { UmaykutVillageGraphic } from './UmaykutVillageGraphic';
import { ResourceIcon } from './ResourceIcon';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  Swords, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  Hammer, 
  ScrollText, 
  Calculator, 
  Database, 
  Trees, 
  Layers, 
  Wheat, 
  Coins, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Crosshair, 
  Info, 
  Sparkles,
  HelpCircle,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

interface UmaykutGameViewProps {
  playerVillage: Village;
  playerVillages?: Village[];
  rivalVillages: Village[];
  nodes: ResourceNode[];
  activeMarches: March[];
  rates: ResourceRate;
  constructionQueue: ConstructionQueueItem[];
  trainingQueue: TrainingQueueItem[];
  onOpenBuilding: (type: BuildingType) => void;
  onOpenFactionModal: () => void;
  onSelectTargetForMarch: (targetVillage: Village | null, coords: { x: number; y: number }) => void;
  onSelectTab: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onSelectVillage?: (villageId: string) => void;
  onOpenFoundVillageModal?: (coords?: { x: number; y: number }) => void;
  activeTab: string;
}

export const UmaykutGameView: React.FC<UmaykutGameViewProps> = ({
  playerVillage,
  playerVillages = [playerVillage],
  rivalVillages,
  nodes,
  activeMarches,
  rates,
  constructionQueue,
  trainingQueue,
  onOpenBuilding,
  onOpenFactionModal,
  onSelectTargetForMarch,
  onSelectTab,
  onSelectVillage,
  onOpenFoundVillageModal,
  activeTab,
}) => {
  const faction = FACTIONS[playerVillage.faction] || FACTIONS.osmanogullari;
  const townHallLevel = playerVillage.buildings.town_hall || 1;
  const currentRadius = getInfluenceRadius(townHallLevel);
  const nextRadius = getInfluenceRadius(townHallLevel + 1);

  // Yeni köy kurma kontrolü
  const qualifiedCount = playerVillages.filter(v => (v.buildings.town_hall || 0) >= 10).length;
  const maxAllowedVillages = Math.min(10, 1 + qualifiedCount);
  const canFoundNew = playerVillages.length < maxAllowedVillages && playerVillages.length < 10;

  // Harita Pan & Zoom Durumları
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({
    x: playerVillage.x,
    y: playerVillage.y,
  });
  const [zoom, setZoom] = useState<number>(1.1); // 0.8 ile 1.6 arası
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showNextRadius, setShowNextRadius] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [quickJumpInput, setQuickJumpInput] = useState<{ x: string; y: string }>({
    x: String(playerVillage.x),
    y: String(playerVillage.y),
  });

  // Seçilen Nesne (Köy veya Kaynak Düğümü İnceleme Kartı)
  const [inspectedEntity, setInspectedEntity] = useState<{
    type: 'player' | 'rival' | 'node' | 'empty';
    data?: any;
    x: number;
    y: number;
  } | null>(null);

  // Canlı Saat (Umaykut Sunucu Saati)
  const [serverTime, setServerTime] = useState<string>('');
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setServerTime(d.toTimeString().split(' ')[0]);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Harita Kapsama ve Düğüm Hesapları
  const { captured: capturedNodes } = useMemo(() => {
    return getCapturedNodesForVillage(playerVillage, nodes);
  }, [playerVillage, nodes]);

  // Görünür Alan Koordinat Sınırları (Harita 100x100 Izgarası)
  const viewSpan = Math.round(18 / zoom);
  const minX = Math.max(0, mapCenter.x - viewSpan);
  const maxX = Math.min(100, mapCenter.x + viewSpan);
  const minY = Math.max(0, mapCenter.y - viewSpan);
  const maxY = Math.min(100, mapCenter.y + viewSpan);

  // Haritada gösterilecek varlıklar
  const visibleNodes = useMemo(() => {
    return nodes.filter(n => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY);
  }, [nodes, minX, maxX, minY, maxY]);

  const visibleRivals = useMemo(() => {
    return rivalVillages.filter(v => v.x >= minX && v.x <= maxX && v.y >= minY && v.y <= maxY);
  }, [rivalVillages, minX, maxX, minY, maxY]);

  // Harita Sürükleme (Pan) Olayları
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      const stepX = dx > 0 ? -1 : 1;
      const stepY = dy > 0 ? -1 : 1;
      setMapCenter(prev => ({
        x: Math.max(0, Math.min(100, prev.x + stepX)),
        y: Math.max(0, Math.min(100, prev.y + stepY)),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Pusula Yön Tuşları
  const panMap = (dx: number, dy: number) => {
    setMapCenter(prev => ({
      x: Math.max(0, Math.min(100, prev.x + dx)),
      y: Math.max(0, Math.min(100, prev.y + dy)),
    }));
  };

  // Koordinata Git
  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    const x = Math.max(0, Math.min(100, parseInt(quickJumpInput.x) || playerVillage.x));
    const y = Math.max(0, Math.min(100, parseInt(quickJumpInput.y) || playerVillage.y));
    setMapCenter({ x, y });
  };

  const handleCenterOnHome = () => {
    setMapCenter({ x: playerVillage.x, y: playerVillage.y });
    setQuickJumpInput({ x: String(playerVillage.x), y: String(playerVillage.y) });
  };

  // Toplam Ordu Sayısı
  const totalTroops = (Object.values(playerVillage.units) as number[]).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="relative w-full h-[88vh] min-h-[640px] max-h-[920px] bg-stone-950 rounded-xl border-4 border-amber-950/80 shadow-2xl overflow-hidden flex flex-col select-none font-sans">
      
      {/* 1. ÜST HUD ŞERİDİ (Top Status Ribbon - Exp Points, Protection, Compass, Guide) */}
      <div className="relative z-30 h-14 bg-gradient-to-b from-stone-900 via-stone-900/95 to-stone-950 border-b-2 border-stone-800 flex items-center justify-between px-3 sm:px-5 shadow-lg">
        
        {/* Sol: Han Seviyesi & Exp Points Kapsülü */}
        <div className="flex items-center gap-3">
          {/* Beylik Sancak Bayrağı & Han Avatarı */}
          <div className="relative flex items-center justify-center">
            <div 
              className="w-11 h-8 rounded-lg overflow-hidden border-2 border-amber-500 shadow-md flex items-center justify-center cursor-pointer hover:scale-105 transition bg-black/60 shrink-0"
              onClick={onOpenFactionModal}
              title={`${faction.name} Sancağı • ${faction.leader} - İncele`}
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
            {/* Seviye 31 Rozeti */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-900 border border-amber-400 text-[10px] font-bold font-mono text-amber-300 flex items-center justify-center shadow">
              {townHallLevel * 10 + 1}
            </div>
          </div>

          {/* Exp Points Barı */}
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
              <span>Tecrübe & Şan</span>
              <span className="font-mono text-stone-300">{(townHallLevel * 320).toLocaleString()} / 5,000</span>
            </div>
            <div className="w-32 md:w-44 h-2 bg-stone-950 rounded-full border border-stone-700 overflow-hidden mt-0.5">
              <div 
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (townHallLevel * 6.4) * 10)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Orta: Pusula Yön Kontrolleri (Kuzey, Güney, Doğu, Batı) */}
        <div className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1 rounded-full border border-stone-800 shadow-inner">
          <button
            onClick={() => panMap(-3, 0)}
            className="w-7 h-7 rounded-full bg-stone-900 hover:bg-amber-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Batıya Kaydır"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => panMap(0, -3)}
            className="w-7 h-7 rounded-full bg-stone-900 hover:bg-amber-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Kuzeye Kaydır"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterOnHome}
            className="px-2 py-0.5 rounded-full bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 text-[10px] font-bold font-mono tracking-wider transition cursor-pointer"
            title="Köyüme Odaklan"
          >
            OTAĞ
          </button>
          <button
            onClick={() => panMap(0, 3)}
            className="w-7 h-7 rounded-full bg-stone-900 hover:bg-amber-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Güneye Kaydır"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => panMap(3, 0)}
            className="w-7 h-7 rounded-full bg-stone-900 hover:bg-amber-800 border border-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Doğuya Kaydır"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Sağ: Acemilik Koruması & Rehber Butonu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Koruma Kapsülü */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-950 to-stone-900 border border-emerald-700/60 rounded-full text-emerald-300 shadow-sm text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline font-bold">Acemilik Koruması:</span>
            <span className="font-bold">24:45:18</span>
          </div>

          {/* Rehber / Soru İşareti */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="w-8 h-8 rounded-full bg-stone-900 hover:bg-amber-800 border border-stone-700 text-amber-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow"
            title="Oyun Rehberi & Mekanikler"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 2. ORTA GÖVDE (Left Action Arc + Center Continuous Canvas Map + Right Umaykut Frame) */}
      <div className="relative flex-1 flex overflow-hidden">
        
        {/* ========================================================================= */}
        {/* A. SOL ORB EYLEM SÜTUNU (The Iconic Left Arc of Dark Metallic Action Seals)  */}
        {/* ========================================================================= */}
        <div className="relative z-20 w-16 sm:w-18 bg-gradient-to-r from-stone-950 via-stone-900/90 to-transparent flex flex-col items-center py-4 space-y-3.5 pointer-events-auto">
          
          {/* 1. Köy Görünümü / Otağ */}
          <button
            onClick={() => onSelectTab('village')}
            className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.85)] cursor-pointer active:translate-y-0.5 active:scale-95 ${
              activeTab === 'village'
                ? 'bg-gradient-to-b from-[#6b4724] via-[#4a2e16] to-[#24170d] border-[#d4af37] ring-2 ring-amber-400/80 scale-105 shadow-[0_4px_16px_rgba(212,175,55,0.5)]'
                : 'bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-[#a67c48] hover:border-amber-300 hover:scale-105'
            }`}
            title="Köy Binaları & Yerleşim Görünümü"
          >
            <img 
              src="/assets/ui/otag_button.webp" 
              alt="OTAĞ" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <span className="absolute left-14 bg-[#1a0f08] text-amber-200 border border-[#8a6838] text-[11px] font-serif font-bold px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
              OTAĞ
            </span>
          </button>

          {/* 2. Kışla & Ordu / Seferler */}
          <button
            onClick={() => onSelectTab('military')}
            className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.85)] cursor-pointer active:translate-y-0.5 active:scale-95 ${
              activeTab === 'military'
                ? 'bg-gradient-to-b from-[#8f2a1c] via-[#61160c] to-[#380905] border-[#f87171] ring-2 ring-red-400/80 scale-105 shadow-[0_4px_16px_rgba(239,68,68,0.5)]'
                : 'bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-[#a67c48] hover:border-red-400 hover:scale-105'
            }`}
            title="Ordu Seferleri & Askeri Birlikler"
          >
            <img 
              src="/assets/ui/military_button.webp" 
              alt="ORDU" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            {activeMarches.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white shadow-md animate-pulse">
                {activeMarches.length}
              </span>
            )}
            <span className="absolute left-14 bg-[#1a0f08] text-rose-200 border border-[#8a6838] text-[11px] font-serif font-bold px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
              ORDU ({totalTroops} Birlik)
            </span>
          </button>

          {/* 3. Binalar & İnşaat (Merkez Binası) */}
          <button
            onClick={() => onOpenBuilding('town_hall')}
            className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-2 border-[#a67c48] hover:border-yellow-400 text-stone-300 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-pointer hover:scale-105 active:translate-y-0.5 active:scale-95"
            title="Merkez Binası & Etki Alanı Genişletme"
          >
            <Hammer className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]" />
            {constructionQueue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-stone-950 text-[9px] font-mono font-bold flex items-center justify-center animate-pulse shadow">
                {constructionQueue.length}
              </span>
            )}
            <span className="absolute left-14 bg-[#1a0f08] text-amber-200 border border-[#8a6838] text-[11px] font-serif font-bold px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
              Merkez Binası (Lv.{townHallLevel})
            </span>
          </button>

          {/* 4. Savaş Raporları & Ferman */}
          <button
            onClick={() => onSelectTab('reports')}
            className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.85)] cursor-pointer active:translate-y-0.5 active:scale-95 ${
              activeTab === 'reports'
                ? 'bg-gradient-to-b from-[#6b4724] via-[#4a2e16] to-[#24170d] border-[#d4af37] ring-2 ring-amber-400/80 scale-105 shadow-[0_4px_16px_rgba(212,175,55,0.5)]'
                : 'bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-[#a67c48] hover:border-amber-300 hover:scale-105'
            }`}
            title="Savaş & Ferman Raporları"
          >
            <img 
              src="/assets/ui/ferman_button.webp" 
              alt="FERMAN" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <span className="absolute left-14 bg-[#1a0f08] text-amber-200 border border-[#8a6838] text-[11px] font-serif font-bold px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
              FERMAN
            </span>
          </button>

          {/* 5. Lanchester Muharebe Simülatörü */}
          <button
            onClick={() => onSelectTab('simulator')}
            className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.85)] cursor-pointer active:translate-y-0.5 active:scale-95 ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-b from-[#0284c7] via-[#075985] to-[#082f49] border-[#38bdf8] ring-2 ring-sky-400/80 scale-105 shadow-[0_4px_16px_rgba(56,189,248,0.5)]'
                : 'bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-[#a67c48] hover:border-sky-400 hover:scale-105'
            }`}
            title="Lanchester Yasası Savaş Simülatörü"
          >
            <img 
              src="/assets/ui/simulator_button.webp" 
              alt="SİMÜLATÖR" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <span className="absolute left-14 bg-[#1a0f08] text-sky-200 border border-[#8a6838] text-[11px] font-serif font-bold px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
              SİMÜLATÖR
            </span>
          </button>

          {/* 6. Mimari & PostGIS Şeması */}
          <button
            onClick={() => onSelectTab('architecture')}
            className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] cursor-pointer active:translate-y-0.5 active:scale-95 ${
              activeTab === 'architecture'
                ? 'bg-gradient-to-b from-[#4338ca] via-[#312e81] to-[#1e1b4b] border-[#818cf8] ring-2 ring-indigo-400/80 text-white scale-105 shadow-[0_4px_16px_rgba(129,140,248,0.4)]'
                : 'bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border-[#a67c48] text-stone-300 hover:border-indigo-400 hover:scale-105'
            }`}
            title="Oyun Mimarisi & SQL Şeması"
          >
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]" />
            <span className="absolute left-14 bg-[#1a0f08] text-indigo-200 border border-[#8a6838] text-[11px] font-serif font-bold px-2 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
              Sistem Mimarisi
            </span>
          </button>

        </div>

        {/* ========================================================================= */}
        {/* B. MERKEZ KESİNTİSİZ ÇİMLİK HARİTA SAHNESİ (The Majestic Umaykut Green Map) */}
        {/* ========================================================================= */}
        <div 
          className="relative flex-1 bg-[#4d7c2a] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Çim Dokusu & Zemin Gölgeleri (Authentic Grass Shading Pattern) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `
                radial-gradient(#3f6212 15%, transparent 16%),
                radial-gradient(#65a30d 15%, transparent 16%),
                linear-gradient(45deg, rgba(22, 101, 52, 0.2) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(22, 101, 52, 0.2) 25%, transparent 25%)
              `,
              backgroundSize: '48px 48px, 48px 48px, 32px 32px, 32px 32px',
              backgroundPosition: '0 0, 24px 24px, 0 0, 16px 16px',
            }}
          />

          {/* Hafif Arazi Yükseltileri (Hills & Contour) */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(132, 204, 22, 0.4) 0%, rgba(20, 83, 45, 0.7) 100%)',
            }}
          />

          {/* ===================================================================== */}
          {/* SVG KATMANI: ETKİ ALANI ÇEMBERLERİ (White/Gold Circular Rings) & SEFERLER */}
          {/* ===================================================================== */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Oyuncu Etki Çemberi Parlama Deseni */}
              <radialGradient id="playerRadiusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(254, 240, 138, 0.03)" />
                <stop offset="85%" stopColor="rgba(253, 224, 71, 0.08)" />
                <stop offset="100%" stopColor="rgba(250, 204, 21, 0.35)" />
              </radialGradient>
              <radialGradient id="rivalRadiusGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(248, 113, 113, 0.02)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.25)" />
              </radialGradient>
            </defs>

            {/* 1. Gelecek Seviye Çap Önizleme Çemberi (Yeşil Kesikli Çizgi) */}
            {showNextRadius && (
              <circle
                cx={playerVillage.x}
                cy={playerVillage.y}
                r={nextRadius}
                fill="none"
                stroke="rgba(16, 185, 129, 0.6)"
                strokeWidth="0.08"
                strokeDasharray="0.3 0.15"
              />
            )}

            {/* 2. OYUNCU KÖYÜ ETKİ ALANI ÇEMBERİ (Umaykut Beyaz/Altın Parlak Halka) */}
            <circle
              cx={playerVillage.x}
              cy={playerVillage.y}
              r={currentRadius}
              fill="url(#playerRadiusGlow)"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="0.16"
            />
            {/* İç Halka */}
            <circle
              cx={playerVillage.x}
              cy={playerVillage.y}
              r={currentRadius * 0.5}
              fill="none"
              stroke="rgba(253, 224, 71, 0.3)"
              strokeWidth="0.06"
              strokeDasharray="0.2 0.2"
            />

            {/* 3. Düşman & Komşu Köylerin Etki Çemberleri (Screenshot'taki m4a1 ve base2 çemberleri gibi) */}
            {visibleRivals.map(r => {
              const rRadius = getInfluenceRadius(r.buildings.town_hall || 1);
              return (
                <circle
                  key={r.id}
                  cx={r.x}
                  cy={r.y}
                  r={rRadius}
                  fill="url(#rivalRadiusGlow)"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="0.1"
                />
              );
            })}

            {/* 4. Aktif Askeri Sefer Çizgileri (March Lines with moving dashes) */}
            {activeMarches.map(m => (
              <g key={m.id}>
                <line
                  x1={m.originCoordinates.x}
                  y1={m.originCoordinates.y}
                  x2={m.targetCoordinates.x}
                  y2={m.targetCoordinates.y}
                  stroke={m.isReturning ? '#22c55e' : '#ef4444'}
                  strokeWidth="0.14"
                  strokeDasharray="0.4 0.2"
                />
              </g>
            ))}
          </svg>

          {/* ===================================================================== */}
          {/* HARİTA HÜCRELERİ & VARLIKLAR (Tiles, Villages, Resource Nodes) */}
          {/* ===================================================================== */}
          <div 
            className="relative w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${maxX - minX + 1}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${maxY - minY + 1}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: (maxY - minY + 1) * (maxX - minX + 1) }).map((_, idx) => {
              const col = idx % (maxX - minX + 1);
              const row = Math.floor(idx / (maxX - minX + 1));
              const cellX = minX + col;
              const cellY = minY + row;

              const playerVillAtCell = playerVillages.find(v => v.x === cellX && v.y === cellY);
              const isPlayer = Boolean(playerVillAtCell);
              const rival = visibleRivals.find(r => r.x === cellX && r.y === cellY);
              const node = visibleNodes.find(n => n.x === cellX && n.y === cellY);

              // Etki alanında mı?
              const distToPlayer = calculateDistance(playerVillage.x, playerVillage.y, cellX, cellY);
              const isCapturedByPlayer = distToPlayer <= currentRadius;

              return (
                <div
                  key={`${cellX}_${cellY}`}
                  onClick={() => {
                    if (playerVillAtCell) {
                      setInspectedEntity({ type: 'player', data: playerVillAtCell, x: cellX, y: cellY });
                    } else if (rival) {
                      setInspectedEntity({ type: 'rival', data: rival, x: cellX, y: cellY });
                    } else if (node) {
                      setInspectedEntity({ type: 'node', data: node, x: cellX, y: cellY });
                    } else {
                      setInspectedEntity({ type: 'empty', x: cellX, y: cellY });
                    }
                  }}
                  className="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                  style={{ minWidth: 32, minHeight: 32 }}
                >
                  {/* Oyuncu Köyü / Otağ */}
                  {playerVillAtCell && (
                    <div className="z-20 relative">
                      <UmaykutVillageGraphic 
                        village={playerVillAtCell}
                        isPlayer={true}
                        influenceRadius={getInfluenceRadius(playerVillAtCell.buildings.town_hall || 1)}
                        size={64}
                        onInspect={() => setInspectedEntity({ type: 'player', data: playerVillAtCell, x: cellX, y: cellY })}
                        onAction={() => {
                          if (onSelectVillage && playerVillAtCell.id !== playerVillage.id) {
                            onSelectVillage(playerVillAtCell.id);
                          }
                          onOpenBuilding('town_hall');
                        }}
                      />
                    </div>
                  )}

                  {/* Düşman Köy / Tekfur / Haydut Kampı */}
                  {!isPlayer && rival && (
                    <div className="z-20 relative">
                      <UmaykutVillageGraphic 
                        village={rival}
                        isPlayer={false}
                        size={56}
                        onInspect={() => setInspectedEntity({ type: 'rival', data: rival, x: cellX, y: cellY })}
                        onAction={() => onSelectTargetForMarch(rival, { x: rival.x, y: rival.y })}
                      />
                    </div>
                  )}

                  {/* Hammadde Kaynak Düğümü (Tahıl Değirmeni, Taş Ocağı, Kereste vs.) */}
                  {!isPlayer && !rival && node && (
                    <div className="z-20 relative">
                      <UmaykutNodeGraphic 
                        type={node.type}
                        tier={node.tier * 3 - (node.type === 'grain' ? 0 : 1)}
                        isCaptured={isCapturedByPlayer}
                        size={54}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ===================================================================== */}
          {/* HARİTA İÇİ ZOOM KONTROLLERİ */}
          {/* ===================================================================== */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 bg-stone-900/90 p-1 rounded border border-stone-700 shadow-md">
            <button
              onClick={() => setZoom(z => Math.min(1.6, z + 0.15))}
              className="p-1.5 hover:bg-stone-800 text-stone-200 rounded transition cursor-pointer"
              title="Yakınlaştır (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.7, z - 0.15))}
              className="p-1.5 hover:bg-stone-800 text-stone-200 rounded transition cursor-pointer"
              title="Uzaklaştır (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNextRadius(s => !s)}
              className={`p-1.5 rounded transition cursor-pointer ${
                showNextRadius ? 'bg-emerald-800 text-white' : 'hover:bg-stone-800 text-stone-400'
              }`}
              title="Sonraki Seviye Etki Çapı Önizlemesi"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>

          {/* ===================================================================== */}
          {/* İNCELENEN VARLIK DETAY KARTI (Interactive Modal Popup on Click) */}
          {/* ===================================================================== */}
          {inspectedEntity && (
            <div className="absolute top-4 right-4 z-40 w-72 bg-stone-950/95 border-2 border-amber-600/90 rounded-xl p-3.5 shadow-2xl text-stone-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
              
              {/* Başlık ve Kapatma Butonu */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    {inspectedEntity.type === 'player' && 'Kendi Otağınız'}
                    {inspectedEntity.type === 'rival' && 'Düşman Yerleşimi'}
                    {inspectedEntity.type === 'node' && 'Kaynak Düğümü'}
                    {inspectedEntity.type === 'empty' && 'Boş Coğrafya'}
                  </h4>
                </div>
                <button
                  onClick={() => setInspectedEntity(null)}
                  className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* İçerik */}
              <div className="py-2.5 space-y-2 text-xs">
                
                {/* Konum Bilgisi */}
                <div className="flex items-center justify-between text-stone-400 font-mono text-[11px] bg-stone-900/80 px-2 py-1 rounded">
                  <span>Koordinat: ({inspectedEntity.x} | {inspectedEntity.y})</span>
                  <span>Mesafe: {calculateDistance(playerVillage.x, playerVillage.y, inspectedEntity.x, inspectedEntity.y).toFixed(1)} tile</span>
                </div>

                {/* 1. Kaynak Düğümü Detayı */}
                {inspectedEntity.type === 'node' && (
                  (() => {
                    const node: ResourceNode = inspectedEntity.data;
                    const dist = calculateDistance(playerVillage.x, playerVillage.y, node.x, node.y);
                    const isEnclosed = dist <= currentRadius;

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <UmaykutNodeGraphic type={node.type} tier={node.tier * 3} isCaptured={isEnclosed} size={40} />
                          <div>
                            <div className="font-bold text-stone-100">{node.name}</div>
                            <div className="text-[11px] text-amber-400 capitalize">{node.type} Ocağı</div>
                          </div>
                        </div>

                        <div className="p-2 bg-stone-900 rounded border border-stone-800 font-mono space-y-1 text-[11px]">
                          <div className="flex justify-between text-stone-300">
                            <span>Saatlik Doğal Verim:</span>
                            <span className="font-bold text-emerald-400">+{node.baseYieldPerHour} / saat</span>
                          </div>
                          <div className="flex justify-between text-stone-400 text-[10px]">
                            <span>Etki Çapı Durumu:</span>
                            <span className={isEnclosed ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                              {isEnclosed ? '✓ Kapsandı (Aktif Gelir)' : '✕ Etki Alanı Dışında'}
                            </span>
                          </div>
                        </div>

                        {!isEnclosed && (
                          <button
                            onClick={() => {
                              setInspectedEntity(null);
                              onOpenBuilding('town_hall');
                            }}
                            className="w-full py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs transition cursor-pointer"
                          >
                            Merkez Binasını Yükselt →
                          </button>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* 2. Düşman Köy Detayı */}
                {inspectedEntity.type === 'rival' && (
                  (() => {
                    const rival: Village = inspectedEntity.data;
                    return (
                      <div className="space-y-2">
                        <div className="font-bold text-red-300 text-sm">{rival.name}</div>
                        <div className="text-[11px] text-stone-400">Bey / Lider: {rival.ownerName}</div>

                        <div className="p-2 bg-stone-900 rounded border border-stone-800 text-[11px] font-mono space-y-1">
                          <div className="flex justify-between text-stone-400">
                            <span>Sur Seviyesi:</span>
                            <span className="text-blue-400 font-bold">Seviye {rival.buildings.wall || 0}</span>
                          </div>
                          <div className="flex justify-between text-stone-400">
                            <span>Tahmini Sefer Süresi:</span>
                            <span className="text-yellow-400 font-bold">
                              ~{(calculateDistance(playerVillage.x, playerVillage.y, rival.x, rival.y) / 2).toFixed(1)} dk
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onSelectTargetForMarch(rival, { x: rival.x, y: rival.y });
                            setInspectedEntity(null);
                          }}
                          className="w-full py-2 bg-red-700 hover:bg-red-600 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                        >
                          <Swords className="w-4 h-4" />
                          <span>Bu Kaleye Sefer Düzenle</span>
                        </button>
                      </div>
                    );
                  })()
                )}

                {/* 3. Oyuncu Köyü Detayı */}
                {inspectedEntity.type === 'player' && (
                  <div className="space-y-2">
                    <div className="font-bold text-amber-300 text-sm">{playerVillage.name}</div>
                    <div className="text-[11px] text-stone-400">
                      Merkez Binası: Seviye {townHallLevel} • Etki Çapı: {currentRadius} tile
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono">
                      Kapsanan Kaynak Düğümü: {capturedNodes.length} Adet
                    </div>
                    <button
                      onClick={() => {
                        setInspectedEntity(null);
                        onOpenBuilding('town_hall');
                      }}
                      className="w-full py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs transition cursor-pointer"
                    >
                      Köyü ve Binaları Yönet →
                    </button>
                  </div>
                )}

                {/* 4. Boş Arazi */}
                {inspectedEntity.type === 'empty' && (
                  <div className="space-y-2">
                    <p className="text-stone-400 text-[11px]">
                      Bu koordinatta ({inspectedEntity.x}|{inspectedEntity.y}) henüz bir yerleşim bulunmuyor. İskan açarak yeni köyünüzü kurabilirsiniz.
                    </p>
                    
                    {onOpenFoundVillageModal && (
                      <button
                        onClick={() => {
                          const coords = { x: inspectedEntity.x, y: inspectedEntity.y };
                          setInspectedEntity(null);
                          onOpenFoundVillageModal(coords);
                        }}
                        className={`w-full py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md ${
                          canFoundNew
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
                        }`}
                      >
                        <span>⛺</span>
                        <span>{canFoundNew ? 'Buraya Yeni Köy Kur' : 'Köy Kur (Şartları Gör)'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectTargetForMarch(null, { x: inspectedEntity.x, y: inspectedEntity.y });
                        setInspectedEntity(null);
                      }}
                      className="w-full py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-semibold text-xs transition cursor-pointer"
                    >
                      Buraya Keşif / Sefer Düzenle
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* C. SAĞ UMAYKUT PANELİ (The Legendary Right HUD Frame - Resources, Cities, Events) */}
        {/* ========================================================================= */}
        <div className="relative z-20 w-64 sm:w-72 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border-l-2 border-stone-800 flex flex-col justify-between shadow-2xl p-3 overflow-y-auto space-y-3">
          
          {/* 1. ÜST BRONZ BAŞLIK & HAN BİLGİSİ */}
          <div className="bg-stone-950 p-2.5 rounded-lg border border-amber-900/60 shadow-md text-center relative overflow-hidden">
            {/* Arka plan beylik deseni */}
            <div className="absolute top-0 right-0 text-5xl opacity-5 pointer-events-none">🏹</div>
            <h2 className="text-xs font-black tracking-widest text-amber-400 uppercase font-serif">
              BEYLİKLER • UMAYKUT
            </h2>
            <div className="text-[11px] text-stone-300 mt-1 font-bold">
              Han: <span className="text-amber-200">{playerVillage.ownerName || 'Ertuğrul Gazi'}</span>
            </div>
            <div className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <span>Beylik:</span>
              <button 
                onClick={onOpenFactionModal}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                {faction.name}
              </button>
            </div>
          </div>

          {/* 2. KAYNAKLAR KUTUSU (RESOURCES TABLE with live amounts & hourly rates) */}
          <div className="bg-stone-950 rounded-lg border border-stone-800 p-2.5 shadow-inner space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800/80">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">KAYNAKLAR</span>
              <span className="text-[9px] font-mono text-stone-400">Depo: {getVillageMaxCapacity(playerVillage).toLocaleString()}</span>
            </div>

            {/* Taş */}
            <div className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-stone-900 transition">
              <div className="flex items-center gap-1.5">
                <ResourceIcon type="stone" size="sm" />
                <span className="text-stone-300 text-[11px]">Taş</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-stone-200 font-bold">{Math.floor(playerVillage.resources.stone).toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 ml-1">+{rates.stone}/s</span>
              </div>
            </div>

            {/* Odun */}
            <div className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-stone-900 transition">
              <div className="flex items-center gap-1.5">
                <ResourceIcon type="wood" size="sm" />
                <span className="text-stone-300 text-[11px]">Odun</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-stone-200 font-bold">{Math.floor(playerVillage.resources.wood).toLocaleString()}</span>
                <span className="text-[9px] text-emerald-400 ml-1">+{rates.wood}/s</span>
              </div>
            </div>

            {/* Tahıl */}
            <div className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-stone-900 transition">
              <div className="flex items-center gap-1.5">
                <ResourceIcon type="grain" size="sm" />
                <span className="text-stone-300 text-[11px]">Tahıl</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-stone-200 font-bold">{Math.floor(playerVillage.resources.grain).toLocaleString()}</span>
                <span className={`text-[9px] ml-1 font-bold ${rates.grain < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                  {rates.grain >= 0 ? `+${rates.grain}` : rates.grain}/s
                </span>
              </div>
            </div>

            {/* Demir */}
            <div className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-stone-900 transition">
              <div className="flex items-center gap-1.5">
                <ResourceIcon type="iron" size="sm" />
                <span className="text-stone-300 text-[11px]">Demir</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-stone-200 font-bold">{Math.floor(playerVillage.resources.iron).toLocaleString()}</span>
                <span className="text-[9px] text-zinc-400 ml-1">+{rates.iron}/s</span>
              </div>
            </div>

            {/* Altın */}
            <div className="flex items-center justify-between text-xs py-0.5 px-1 rounded hover:bg-stone-900 transition">
              <div className="flex items-center gap-1.5">
                <ResourceIcon type="gold" size="sm" />
                <span className="text-stone-300 text-[11px]">Altın</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-yellow-200 font-bold">{Math.floor(playerVillage.resources.gold).toLocaleString()}</span>
                <span className="text-[9px] text-yellow-400 ml-1">+{rates.gold}/s</span>
              </div>
            </div>

            {/* At & Mücevher (Umaykut Özel Kaynakları) */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-800/60 text-[10px] text-stone-400 font-mono">
              <span className="flex items-center gap-1"><ResourceIcon type="horse" size="xs" /> At: <strong className="text-amber-300">18</strong></span>
              <span className="flex items-center gap-1"><ResourceIcon type="gem" size="xs" /> Akçe: <strong className="text-cyan-300">50</strong></span>
            </div>
          </div>

          {/* 3. ŞEHİRLER & OVALAR (CITIES LIST - UMAYKUT ORIGINAL LIST) */}
          <div className="bg-stone-950 rounded-lg border border-stone-800 p-2.5 shadow-inner space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800/80">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">ŞEHİRLER / OVALAR</span>
              <span className="text-[9px] font-mono text-stone-400">{playerVillages.length} / 10</span>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {playerVillages.map(v => {
                const isActive = v.id === playerVillage.id;
                const vThLevel = v.buildings.town_hall || 1;
                return (
                  <div 
                    key={v.id}
                    onClick={() => {
                      if (onSelectVillage && !isActive) {
                        onSelectVillage(v.id);
                      }
                      setMapCenter({ x: v.x, y: v.y });
                    }}
                    className={`p-1.5 rounded flex items-center justify-between cursor-pointer transition ${
                      isActive 
                        ? 'bg-amber-950/60 border border-amber-600 shadow'
                        : 'bg-stone-900 hover:bg-stone-800/80 border border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-amber-200 flex items-center gap-1">
                        <span>🏰</span>
                        <span>{v.name}</span>
                        {isActive && (
                          <span className="text-[8px] bg-amber-800 text-amber-100 px-1 rounded font-mono">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-stone-400 font-mono">
                        ({v.x} | {v.y}) • Merkez Lv.{vThLevel}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapCenter({ x: v.x, y: v.y });
                      }}
                      className="text-[9px] bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono px-1.5 py-0.5 rounded transition"
                      title="Haritada Ortala"
                    >
                      GİT
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Yeni Köy Kur Butonu (Right HUD) */}
            {onOpenFoundVillageModal && (
              <button
                onClick={() => onOpenFoundVillageModal()}
                className={`w-full py-1.5 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer mt-1 ${
                  canFoundNew
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md animate-pulse'
                    : 'bg-stone-900 text-stone-500 border border-stone-800 hover:text-stone-400'
                }`}
              >
                <span>+</span>
                <span>{canFoundNew ? 'Yeni Köy Kur' : `Yeni Köy (${playerVillages.length}/10)`}</span>
              </button>
            )}
          </div>

          {/* 4. ASKERİ HAREKETLER & OLAYLAR (EVENTS & MARCHES) */}
          <div className="bg-stone-950 rounded-lg border border-stone-800 p-2.5 shadow-inner space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800/80">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">SEFERLER & OLAYLAR</span>
              <span className="text-[9px] font-mono text-red-400 font-bold">{activeMarches.length} Aktif</span>
            </div>

            {/* 3 Klasik Umaykut Eylem Rozeti */}
            <div className="flex items-center justify-around py-1 bg-stone-900/90 rounded border border-stone-800">
              <button 
                onClick={() => onSelectTab('military')}
                className="w-7 h-7 rounded-full bg-red-950 border border-red-700 text-red-300 hover:scale-110 transition flex items-center justify-center text-xs"
                title="Saldırı Seferleri"
              >
                ⚔️
              </button>
              <button 
                onClick={() => onSelectTab('military')}
                className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 hover:scale-110 transition flex items-center justify-center text-xs"
                title="Dönen Ordular"
              >
                ↩️
              </button>
              <button 
                onClick={() => onSelectTab('village')}
                className="w-7 h-7 rounded-full bg-amber-950 border border-amber-700 text-amber-300 hover:scale-110 transition flex items-center justify-center text-xs"
                title="Köy Savunması"
              >
                🛡️
              </button>
            </div>

            {/* Aktif Seferler Listesi */}
            {activeMarches.length > 0 ? (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {activeMarches.map(m => {
                  const now = Date.now();
                  const remainingSec = Math.max(0, Math.ceil((m.arrivalTime - now) / 1000));
                  return (
                    <div key={m.id} className="p-1.5 bg-stone-900 rounded border border-stone-800 text-[10px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200 truncate max-w-[120px]">
                          {m.isReturning ? '↩️ Dönüş: ' : '🚩 Sefer: '}{m.targetName}
                        </span>
                        <span className="font-mono text-yellow-400 font-bold">{remainingSec}s</span>
                      </div>
                      {/* İlerleme Barı */}
                      <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((m.durationSec - remainingSec) / m.durationSec) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[10px] text-stone-500 text-center py-1 italic">
                Şu an aktif sefer bulunmuyor.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. ALT DURUM ÇUBUĞU (Bottom Status Bar - Coordinates, Quick Jump, Server Clock) */}
      <div className="relative z-30 h-10 bg-gradient-to-t from-stone-950 via-stone-900 to-stone-900/95 border-t-2 border-stone-800 flex items-center justify-between px-3 sm:px-5 text-xs text-stone-300 shadow-lg">
        
        {/* Sol: Harita Merkez Koordinatı & Hızlı Atlama */}
        <form onSubmit={handleQuickJump} className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-amber-400 hidden sm:inline">Koordinat:</span>
          <div className="flex items-center gap-1 bg-stone-950 px-2 py-0.5 rounded border border-stone-700 font-mono text-xs">
            <span className="text-stone-500">X:</span>
            <input 
              type="number"
              value={quickJumpInput.x}
              onChange={(e) => setQuickJumpInput(prev => ({ ...prev, x: e.target.value }))}
              className="w-8 bg-transparent text-amber-300 font-bold text-center outline-none"
            />
            <span className="text-stone-500">Y:</span>
            <input 
              type="number"
              value={quickJumpInput.y}
              onChange={(e) => setQuickJumpInput(prev => ({ ...prev, y: e.target.value }))}
              className="w-8 bg-transparent text-amber-300 font-bold text-center outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-semibold text-[10px] transition cursor-pointer"
          >
            Git
          </button>
        </form>

        {/* Orta: Kapsanan Kaynak İstatistiği */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-stone-400">
          <span>Etki Çapı: <strong className="text-amber-300">{currentRadius} tile</strong></span>
          <span>•</span>
          <span>Kapsanan Madenler: <strong className="text-emerald-400">{capturedNodes.length} Adet</strong></span>
        </div>

        {/* Sağ: Sunucu Saati & Ses Aç/Kapa */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1 bg-stone-950 px-2.5 py-0.5 rounded border border-stone-800 text-amber-300">
            <span className="text-stone-500 text-[10px]">Sunucu:</span>
            <span className="font-bold">{serverTime || '12:00:00'}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-1 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200 transition cursor-pointer"
            title={soundEnabled ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. OYUN REHBERİ MODALI (Umaykut Mekanik Kılavuzu) */}
      {/* ========================================================================= */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border-2 border-amber-600 rounded-xl max-w-lg w-full p-5 text-stone-200 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏹</span>
                <h3 className="font-bold text-amber-400 text-base font-serif">
                  Umaykut Strateji & Harita Kılavuzu
                </h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-stone-300">
              <div className="p-2.5 bg-stone-950 rounded border border-amber-900/50 space-y-1">
                <h4 className="font-bold text-amber-300">1. Etki Çemberi (Influence Radius) Mekaniği</h4>
                <p>
                  Haritadaki hammadde madenleri (Tahıl, Taş, Kereste, Demir, Altın) köyünüzün Merkez Binası etki çemberi içine girdikçe otomatik yutulur ve saatlik üretiminize eklenir.
                </p>
                <div className="text-amber-400 font-mono text-[11px] pt-1">
                  Yarıçap Formülü: R = 2.0 + (Merkez_Seviyesi × 1.25) tile
                </div>
              </div>

              <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                <h4 className="font-bold text-stone-100">2. Haritada Gezinme ve Seferler</h4>
                <p>
                  Haritayı farenizle sürükleyerek kaydırabilir, sol üstteki <strong>+ / -</strong> butonlarıyla yakınlaşabilirsiniz. Herhangi bir düşman kalesine tıklayarak hemen sefer düzenleyebilirsiniz.
                </p>
              </div>

              <div className="p-2.5 bg-stone-950 rounded border border-stone-800 space-y-1">
                <h4 className="font-bold text-stone-100">3. Lanchester Savaş Motoru</h4>
                <p>
                  Orduların gücü karesel güç modeliyle hesaplanır. Sur seviyesi savunma tarafına doğrudan efektif kalkan çarpanı sağlar.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white rounded font-bold text-xs transition cursor-pointer"
            >
              Anladım, Haritaya Dön
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
