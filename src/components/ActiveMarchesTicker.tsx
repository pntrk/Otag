import React, { useState, useEffect } from 'react';
import { March, MarchMission } from '../types/game';
import { Swords, X, ChevronDown, ChevronUp, Clock, MapPin, Shield, Eye, Flame } from 'lucide-react';

export interface ActiveMarchesTickerProps {
  activeMarches?: March[];
  onFocusMarch?: (coords: { x: number; y: number }) => void;
  className?: string;
}

export const ActiveMarchesTicker: React.FC<ActiveMarchesTickerProps> = ({
  activeMarches = [],
  onFocusMarch,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Canlı saniye saniye geri sayım döngüsü
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Saldırıya giden orduların sayısı
  const attackMarches = activeMarches.filter(m => m.mission === 'attack' && m.status !== 'completed');
  const activeAttacksCount = attackMarches.length;
  const totalActiveMarches = activeMarches.filter(m => m.status !== 'completed').length;

  // Yeni bir saldırı veya sefer başladığında otomatik olarak kutuyu görünür yap
  useEffect(() => {
    if (activeAttacksCount > 0) {
      setIsClosed(false);
    }
  }, [activeAttacksCount]);

  // Kalan süre hesaplayıcı
  const getRemainingTimeFormatted = (march: March) => {
    const elapsedSec = Math.floor((now - march.startTime) / 1000);
    const remainingSec = Math.max(0, march.durationSec - elapsedSec);
    
    const h = Math.floor(remainingSec / 3600);
    const m = Math.floor((remainingSec % 3600) / 60);
    const s = remainingSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  // Görev türü bilgisi
  const getMissionInfo = (mission: MarchMission) => {
    switch (mission) {
      case 'attack':
        return { label: 'Saldırı', color: 'text-rose-400 bg-rose-950/60 border-rose-700/60', icon: '⚔️' };
      case 'raid':
        return { label: 'Yağma', color: 'text-amber-400 bg-amber-950/60 border-amber-700/60', icon: '🏇' };
      case 'support':
        return { label: 'Destek', color: 'text-sky-400 bg-sky-950/60 border-sky-700/60', icon: '🛡️' };
      case 'spy':
        return { label: 'Casusluk', color: 'text-purple-400 bg-purple-950/60 border-purple-700/60', icon: '👁️' };
      default:
        return { label: 'Sefer', color: 'text-amber-300 bg-amber-950/60 border-amber-700/60', icon: '⚔️' };
    }
  };

  // Eğer kullanıcı X ile tamamen kapattıysa, sol altta ufak bir yeniden açma rozeti göster
  if (isClosed) {
    return (
      <div className={`absolute bottom-6 left-6 z-30 pointer-events-auto ${className}`}>
        <button
          onClick={() => setIsClosed(false)}
          className="flex items-center gap-2 px-3 py-1.5 bg-black/85 backdrop-blur-md border border-[#caa05a] rounded-lg shadow-lg hover:border-amber-300 transition text-xs font-serif text-amber-200 cursor-pointer hover:scale-105 active:scale-95"
          title="Sefer Takip Kutusunu Aç"
        >
          <Swords className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="font-bold">Saldırılar ({activeAttacksCount})</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`absolute bottom-6 left-6 z-30 pointer-events-auto flex flex-col items-start gap-1 select-none font-serif ${className}`}>
      
      {/* 1. GENİŞLETİLMİŞ SEFER FERMAN LİSTESİ (AÇILDIĞINDA GÖRÜNÜR) */}
      {isExpanded && (
        <div className="w-72 sm:w-80 bg-gradient-to-b from-[#1c120a]/95 via-[#140b05]/95 to-[#0c0602]/95 border-2 border-[#caa05a] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] backdrop-blur-md p-3 mb-1.5 text-xs text-[#f3e5ce] animate-fade-in flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between border-b border-[#3d2915] pb-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>Yoldaki Ordular ({totalActiveMarches})</span>
            </span>
            <span className="text-[10px] text-[#a89476] font-mono">Canlı İntikal</span>
          </div>

          {totalActiveMarches === 0 ? (
            <div className="text-center py-3 text-[#a89476] italic text-[11px]">
              Şu anda yolda olan aktif bir ordu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeMarches
                .filter(m => m.status !== 'completed')
                .map((march) => {
                  const mInfo = getMissionInfo(march.mission);
                  const remainingStr = getRemainingTimeFormatted(march);
                  const totalUnits = Object.values(march.units || {}).reduce<number>((a: number, b) => a + (Number(b) || 0), 0);
                  const elapsedSec = (now - march.startTime) / 1000;
                  const progressPct = Math.min(100, Math.max(0, (elapsedSec / march.durationSec) * 100));

                  return (
                    <div 
                      key={march.id}
                      onClick={() => onFocusMarch && onFocusMarch(march.targetCoordinates)}
                      className="p-2 bg-[#120804]/90 border border-[#3e2715] hover:border-[#caa05a] rounded-lg transition cursor-pointer flex flex-col gap-1 shadow-inner group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold flex items-center gap-1 ${mInfo.color}`}>
                          <span>{mInfo.icon}</span>
                          <span>{mInfo.label}</span>
                        </span>
                        
                        <span className="font-mono font-bold text-rose-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-400" />
                          <span>{remainingStr}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#decab0]">
                        <span className="truncate max-w-[140px] text-amber-200 font-bold">
                          {march.targetName || 'Hedef Yerleşim'}
                        </span>
                        <span className="text-[10px] font-mono text-[#a89476]">
                          [{march.targetCoordinates.x}|{march.targetCoordinates.y}]
                        </span>
                      </div>

                      {/* İlerleme Çubuğu */}
                      <div className="w-full bg-[#0a0502] h-1.5 rounded-full overflow-hidden border border-[#2a1a0e] mt-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 via-rose-500 to-rose-400 transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-[#8c7457] pt-0.5">
                        <span>Çıkış: {march.originVillageName}</span>
                        <span className="font-mono">{totalUnits.toLocaleString()} asker</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 2. SOL ALT TEMEL SEFER KUTUSU (VİDEODAKİ KLASİK UMAYKUT DİKDÖRTGEN KUTUSU) */}
      <div 
        className="flex items-center gap-2.5 px-3 py-2 bg-black/85 backdrop-blur-md border border-[#caa05a] rounded-lg shadow-[0_8px_25px_rgba(0,0,0,0.85)] text-xs text-[#f3e5ce] transition-all hover:border-amber-300 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Sol: Çapraz Kırmızı Kılıçlar İkonu */}
        <div className="w-5 h-5 flex items-center justify-center text-rose-500 drop-shadow flex-shrink-0">
          <Swords className={`w-4 h-4 ${activeAttacksCount > 0 ? 'animate-pulse text-rose-400' : 'text-rose-600/80'}`} />
        </div>

        {/* Metin: Saldırıya giden ordu sayısı: X */}
        <div className="flex items-center gap-1.5 font-serif font-bold text-amber-100 text-[12px] whitespace-nowrap">
          <span>Saldırıya giden ordu sayısı:</span>
          <span className={`font-mono text-[13px] font-black ${activeAttacksCount > 0 ? 'text-rose-400' : 'text-amber-300'}`}>
            {activeAttacksCount}
          </span>
        </div>

        {/* Açma/Kapama Oku */}
        <div className="text-amber-400/80 hover:text-amber-200 transition ml-0.5">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>

        {/* Sağ: Kapatma / Daraltma [X] Butonu */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsClosed(true);
          }}
          className="w-4 h-4 ml-1 rounded text-[#a89476] hover:text-white hover:bg-rose-900/60 flex items-center justify-center transition cursor-pointer font-sans text-[11px]"
          title="Gizle"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

    </div>
  );
};
