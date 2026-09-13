import React, { useState, useEffect, useRef } from 'react';
import { 
  BuildingType, 
  Village 
} from '../types/game';
import { 
  Shield, 
  HelpCircle, 
  Compass, 
  Crosshair, 
  Building2, 
  Swords, 
  Hammer, 
  ScrollText, 
  Skull,
  Award,
  Wheat,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Navigation,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface UmaykutTopHudProps {
  village: Village;
  camera: { x: number; y: number };
  zoom: number;
  onFocusCapital: () => void;
  onJumpToCoords?: (x: number, y: number) => void;
  onOpenBuilding?: (type: BuildingType) => void;
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onOpenHelpModal?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const UmaykutTopHud: React.FC<UmaykutTopHudProps> = ({
  village,
  camera,
  zoom,
  onFocusCapital,
  onJumpToCoords,
  onOpenBuilding,
  onSelectTab,
  onOpenHelpModal,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showCoordJump, setShowCoordJump] = useState(false);
  const [targetX, setTargetX] = useState(Math.round(camera.x).toString());
  const [targetY, setTargetY] = useState(Math.round(camera.y).toString());
  const [isMuted, setIsMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Toplam asker sayısı
  const totalTroops = (Object.values(village.units || {}) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  const displayTroops = 46780 + totalTroops * 10;
  const expPoints = 515833 + ((village.buildings.town_hall || 1) * 1250);

  // Ambient Web Audio Synthesizer (Hafif Rüzgar & Çayır Esintisi)
  const toggleAudio = () => {
    if (isMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        setIsMuted(false);
      } catch (e) {
        setIsMuted(true);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setIsMuted(true);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nx = Math.max(0, Math.min(1000, parseInt(targetX, 10) || 0));
    const ny = Math.max(0, Math.min(500, parseInt(targetY, 10) || 0));
    if (onJumpToCoords) {
      onJumpToCoords(nx, ny);
    }
    setShowCoordJump(false);
  };

  // Yön oklarıyla hızlı harita kaydırma
  const handlePanDirection = (dx: number, dy: number) => {
    if (onJumpToCoords) {
      const nx = Math.max(0, Math.min(1000, Math.round(camera.x) + dx));
      const ny = Math.max(0, Math.min(500, Math.round(camera.y) + dy));
      onJumpToCoords(nx, ny);
    }
  };

  return (
    <>
      {/* ==================================================================== */}
      {/* 1. SOL ÜST: UMAYKUT METALİK TECRÜBE PUANI & ASKER ÇEMBERİ            */}
      {/* ==================================================================== */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20 flex items-center select-none animate-fade-in pointer-events-auto">
        
        {/* Oyma Koyu Ceviz & Altın Metalik Kabartma Kapsül */}
        <div className="flex items-center bg-gradient-to-r from-[#2a1a0e] via-[#1c1108] to-[#2a1a0e] border sm:border-2 border-[#8c6738] rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 shadow-[0_6px_20px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)]">
          
          {/* Sol Dairesel Asker Rozeti */}
          <div 
            title="Garnizon & Toplam Sefer Gücü"
            className="flex items-center gap-1 sm:gap-1.5 bg-[#120a05] border border-[#523d26] rounded-full px-1.5 sm:px-2.5 py-0.5 shadow-inner"
          >
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400 drop-shadow" />
            <span className="font-mono font-black text-[10px] sm:text-xs text-[#fef08a] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {displayTroops.toLocaleString('tr-TR')}
            </span>
          </div>

          {/* Orta Kısım: Tecrübe Puanı Plaketi */}
          <div className="px-1.5 sm:px-3 text-center border-x border-[#523d26] mx-0.5 sm:mx-1">
            <div className="text-[8px] sm:text-[9px] font-serif text-[#bda688] uppercase tracking-wider leading-none font-bold hidden sm:block">
              Tecrübe Puanı
            </div>
            <div className="font-mono font-black text-[10px] sm:text-xs text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {expPoints.toLocaleString('tr-TR')}
            </div>
          </div>

          {/* Sağ Dairesel Sandık / Kasa Rozeti */}
          <div 
            title="Hazine & Beylik Kudreti"
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-b from-[#4d3219] to-[#24170d] border border-[#d4af37] flex items-center justify-center text-xs shadow cursor-pointer hover:scale-105 active:scale-95 transition"
          >
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300 drop-shadow" />
          </div>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SOL DİKEY ÇEMBER EYLEM DOCK'U (Dövme Bronz Sikke Numaralı Rozetler)*/}
      {/* ==================================================================== */}
      <div className="absolute left-2 sm:left-3 top-12 sm:top-20 z-20 flex flex-col gap-1.5 sm:gap-2.5 select-none pointer-events-auto">
        
        {/* 1. Köy & Otağ ([1] Rozeti) */}
        <div className="relative group">
          <button
            onClick={() => onSelectTab && onSelectTab('village')}
            title="Köy & Yapılar (Otağ Görünümü)"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border border-[#a67c48] sm:border-2 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center text-amber-300 cursor-pointer touch-manipulation"
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 drop-shadow" />
          </button>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-300 text-white font-mono font-bold text-[8px] sm:text-[10px] flex items-center justify-center shadow">
            1
          </span>
        </div>

        {/* 2. Ordu & Kışla */}
        <div className="relative group">
          <button
            onClick={() => onSelectTab && onSelectTab('military')}
            title="Ordu & Seferler"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border border-[#a67c48] sm:border-2 hover:border-rose-400 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center text-rose-300 cursor-pointer touch-manipulation"
          >
            <Swords className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 drop-shadow" />
          </button>
          {totalTroops > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-red-300 text-white font-mono font-bold text-[8px] sm:text-[10px] flex items-center justify-center shadow animate-pulse">
              {Math.min(99, totalTroops)}
            </span>
          )}
        </div>

        {/* 3. Zanaat & Pazar ([8] Rozeti) */}
        <div className="relative group">
          <button
            onClick={() => onOpenBuilding && onOpenBuilding('market')}
            title="Pazar & Takas"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border border-[#a67c48] sm:border-2 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center text-amber-200 cursor-pointer touch-manipulation"
          >
            <Hammer className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 drop-shadow" />
          </button>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-amber-700 to-amber-950 border border-amber-400 text-amber-100 font-mono font-bold text-[8px] sm:text-[10px] flex items-center justify-center shadow">
            8
          </span>
        </div>

        {/* 4. Tarım & Hasat ([9] Rozeti) */}
        <div className="relative group">
          <button
            onClick={() => onOpenBuilding && onOpenBuilding('town_hall')}
            title="Beylik Binaları & Hasat"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border border-[#a67c48] sm:border-2 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center text-emerald-300 cursor-pointer touch-manipulation"
          >
            <Wheat className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 drop-shadow" />
          </button>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-950 border border-emerald-300 text-white font-mono font-bold text-[8px] sm:text-[10px] flex items-center justify-center shadow">
            9
          </span>
        </div>

        {/* 5. Savaş Raporları */}
        <div className="relative group">
          <button
            onClick={() => onSelectTab && onSelectTab('reports')}
            title="Savaş Raporları & Olaylar"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border border-[#a67c48] sm:border-2 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center text-amber-200 cursor-pointer touch-manipulation"
          >
            <ScrollText className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 drop-shadow" />
          </button>
        </div>

        {/* 6. Savaş Simülatörü */}
        <div className="relative group">
          <button
            onClick={() => onSelectTab && onSelectTab('simulator')}
            title="Savaş Simülatörü"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border border-[#a67c48] sm:border-2 hover:border-sky-400 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center text-sky-300 cursor-pointer touch-manipulation"
          >
            <Skull className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 drop-shadow" />
          </button>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. ÜST ORTA: DÖVME PİRİNÇ USTURLAP & SEYİR PUSULASI (TOP HUD)       */}
      {/* ==================================================================== */}
      <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto select-none">
        
        {/* Ana Pusula & Seyir Çerçevesi */}
        <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-b from-[#2a1a0e] via-[#1c1108] to-[#120a05] border sm:border-2 border-[#caa05a] rounded-full px-2 sm:px-3 py-1 sm:py-1.5 shadow-[0_8px_25px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.2)] text-[11px] sm:text-xs font-serif text-amber-100">
          
          {/* Minyatür Usturlap Pusula Dairesi (4 Yönlü Navigasyon) */}
          <div className="relative w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-[#3a2717] to-[#170e08] border border-[#caa05a] shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] flex items-center justify-center shrink-0">
            <Compass className="w-3 h-3 sm:w-4 sm:h-4 text-[#f5d78a] drop-shadow animate-spin-slow" />
          </div>

          {/* Canlı Koordinat Oyma Yuvası (Tıklanınca Arama Açar) */}
          <button 
            onClick={() => setShowCoordJump(v => !v)}
            title="Haritada Koordinata Git / Işınlan"
            className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 bg-[#0e0804] border border-[#4d3319] rounded-md shadow-inner hover:border-amber-500 transition cursor-pointer group touch-manipulation active:scale-95"
          >
            <span className="text-[#a89070] text-[9px] sm:text-[10px] uppercase font-bold tracking-wider hidden md:inline">Konum:</span>
            <strong className="font-mono font-black text-amber-300 text-[10px] sm:text-xs tracking-wider group-hover:text-amber-100">
              ({Math.round(camera.x)}|{Math.round(camera.y)})
            </strong>
          </button>

          {/* Dikey Ahşap Fitil */}
          <div className="w-[1px] sm:w-[1.5px] h-3 sm:h-4 bg-[#523d26]" />

          {/* Başkent Yakut Mührü (Kırmızı Otağ / Merkez Düğmesi) */}
          <button
            onClick={onFocusCapital}
            title="Başkent Otağına Odaklan"
            className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-gradient-to-b from-[#801b0f] via-[#591006] to-[#360702] border border-[#f87171] hover:border-amber-300 text-[#fee2e2] hover:text-white font-serif font-black text-[10px] sm:text-[11px] shadow-[0_2px_6px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.3)] transition cursor-pointer hover:scale-105 active:scale-95 shrink-0 touch-manipulation"
          >
            <Crosshair className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-200" />
            <span>Merkez</span>
          </button>
        </div>

        {/* Hızlı Koordinat Arama & Pusula Seyir Formu */}
        {showCoordJump && (
          <form 
            onSubmit={handleJumpSubmit} 
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gradient-to-b from-[#2a1a0e] via-[#1c1108] to-[#120a05] border-2 border-[#caa05a] rounded-xl p-3 shadow-[0_12px_32px_rgba(0,0,0,0.95)] flex flex-col gap-2.5 text-xs font-mono animate-fade-in text-[#fcedc7] w-64 z-50"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#523d26] text-[11px] font-serif font-black text-[#f5d78a] tracking-wider">
              <span>❖ SEYİR KOORDİNATLARI</span>
              <button 
                type="button" 
                onClick={() => setShowCoordJump(false)}
                className="text-amber-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-bold text-xs">X:</span>
                <input 
                  type="number" 
                  value={targetX} 
                  onChange={e => setTargetX(e.target.value)} 
                  className="w-16 px-2 py-1 bg-[#0e0804] border border-[#4d3319] rounded text-center text-[#fcd34d] font-mono font-black text-xs focus:outline-none focus:border-amber-400 shadow-inner"
                  min={0}
                  max={1000}
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-bold text-xs">Y:</span>
                <input 
                  type="number" 
                  value={targetY} 
                  onChange={e => setTargetY(e.target.value)} 
                  className="w-16 px-2 py-1 bg-[#0e0804] border border-[#4d3319] rounded text-center text-[#fcd34d] font-mono font-black text-xs focus:outline-none focus:border-amber-400 shadow-inner"
                  min={0}
                  max={500}
                />
              </div>

              <button 
                type="submit"
                className="px-3 py-1 bg-gradient-to-b from-[#8f2415] to-[#541205] hover:brightness-110 border border-[#fca5a5]/80 text-white rounded font-serif font-black text-xs transition cursor-pointer shadow-md active:scale-95"
              >
                İntikal
              </button>
            </div>

            {/* Hızlı Pusula Yön Okları */}
            <div className="flex items-center justify-center gap-1 pt-1 border-t border-[#3d2714]">
              <button 
                type="button" 
                onClick={() => handlePanDirection(-25, 0)}
                title="Batıya Kaydır (-25 X)"
                className="p-1 rounded bg-[#1f130a] border border-[#523d26] hover:border-amber-400 text-amber-200 cursor-pointer touch-manipulation"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={() => handlePanDirection(0, -25)}
                title="Kuzeye Kaydır (-25 Y)"
                className="p-1 rounded bg-[#1f130a] border border-[#523d26] hover:border-amber-400 text-amber-200 cursor-pointer touch-manipulation"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={() => handlePanDirection(0, 25)}
                title="Güneye Kaydır (+25 Y)"
                className="p-1 rounded bg-[#1f130a] border border-[#523d26] hover:border-amber-400 text-amber-200 cursor-pointer touch-manipulation"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button 
                type="button" 
                onClick={() => handlePanDirection(25, 0)}
                title="Doğuya Kaydır (+25 X)"
                className="p-1 rounded bg-[#1f130a] border border-[#523d26] hover:border-amber-400 text-amber-200 cursor-pointer touch-manipulation"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. ÜST SAĞ: YARDIM (?), TAM EKRAN MODU & SES KONTROLÜ                */}
      {/* ==================================================================== */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20 pointer-events-auto select-none flex items-center gap-1 sm:gap-1.5">
        
        {/* Ses Butonu */}
        <button
          onClick={toggleAudio}
          title={isMuted ? 'Çayır Rüzgar Sesini Aç' : 'Sesi Kapat'}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border sm:border-2 border-[#a67c48] text-amber-200 hover:text-white hover:border-amber-300 shadow-xl flex items-center justify-center text-xs cursor-pointer transition hover:scale-105 active:scale-95 touch-manipulation"
        >
          {isMuted ? <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />}
        </button>

        {/* Tam Ekran / Taktik Ekran Genişletme */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Normal Görünüm' : 'Taktik Tam Ekran'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#3a2718] via-[#24170d] to-[#120b06] border sm:border-2 border-[#a67c48] text-amber-200 hover:text-white hover:border-amber-300 shadow-xl flex items-center justify-center text-xs cursor-pointer transition hover:scale-105 active:scale-95 touch-manipulation"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>
        )}

        {/* Yardım Butonu (?) */}
        <button
          onClick={() => setShowHelp(h => !h)}
          title="Umaykut Harita & Kaynak Rehberi"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#6b4724] via-[#45270f] to-[#201004] border sm:border-2 border-[#caa05a] text-[#fcedc7] hover:text-white hover:scale-105 shadow-xl flex items-center justify-center font-serif font-black text-xs sm:text-sm cursor-pointer transition active:scale-95 touch-manipulation"
        >
          ?
        </button>
      </div>

      {/* Yardım Modal Penceresi (Yanık Parşömen Fermanı) */}
      {showHelp && (
        <div className="absolute top-14 right-3 w-84 bg-gradient-to-b from-[#2b1b10]/98 via-[#1a0f08]/98 to-[#120a05]/98 backdrop-blur-md border-2 border-[#caa05a] rounded-xl p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-[#f0e2ca] z-40 text-xs font-serif animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#5c401f]">
            <span className="font-black text-[#f5d78a] flex items-center gap-1.5 text-sm">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Umaykut Taktik Harita Rehberi
            </span>
            <button onClick={() => setShowHelp(false)} className="text-amber-300 hover:text-white cursor-pointer text-sm font-bold">✕</button>
          </div>
          <div className="mt-2.5 space-y-2 text-[11px] text-[#decab0] leading-relaxed">
            <p>
              • <strong>Köyler ve Otağlar:</strong> Kırmızı keçeli otağ çadırları, kuleler ve dalgalanan beylik sancağından oluşur. Altındaki çift bölmeli ahşap metal plakette nüfus ve oyuncu/birlik künyesi yer alır.
            </p>
            <p>
              • <strong>Kaynaklar & Madenler:</strong> Dairesel altın buğday tarlaları, koruluklar, taş ocakları ve kor ateşli demir madenleri arazide yer alır.
            </p>
            <p>
              • <strong>Mavi Dairesel Rozetler (4-9):</strong> Her kaynağın yanındaki çelik-mavi rozette kaynağın verimlilik kademesi belirtilir. Yüksek kademeli madenler saatte kat kat fazla hammadde üretir.
            </p>
            <p>
              • <strong>Etki Çemberleri (Beyaz & Yeşil):</strong> Beyliğinize ait köylerin etki alanları beyaz ve yeşil ince dairelerle çizilmiştir. Halka içindeki tüm madenler otomatik hasat edilir.
            </p>
            <p>
              • <strong>Sağ Panel:</strong> Köy geçişleri, anlık kaynak miktarları, saatlik üretim hızları ve sefer durumları tek ekrandan yönetilir.
            </p>
          </div>
        </div>
      )}

    </>
  );
};

export default UmaykutTopHud;
