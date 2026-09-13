import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ChevronRight, 
  MapPin, 
  Users, 
  Package, 
  Info, 
  CheckCircle2,
  X
} from 'lucide-react';
import { March, Village, UnitType } from '../types/game';
import { FACTIONS, UNITS } from '../data/gameData';
import { ResourceIcon } from './ResourceIcon';

interface CampaignRadarBarProps {
  activeMarches: March[];
  playerVillages: Village[];
  activeVillage: Village;
  onNavigateToMap?: (coords?: { x: number; y: number }) => void;
  onOpenMilitary?: () => void;
  onRecallSupport?: (villageId: string, armyId: string) => void;
}

export const CampaignRadarBar: React.FC<CampaignRadarBarProps> = ({
  activeMarches,
  playerVillages,
  activeVillage,
  onNavigateToMap,
  onOpenMilitary,
}) => {
  const [selectedMarch, setSelectedMarch] = useState<March | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // Canlı saniye sayacı
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Zaman Formatlayıcı (MM:SS)
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. GELEN SALDIRILAR / TEHDİTLER
  // (Oyuncu köylerine doğru gelen ve henüz dönmeyen akınlar)
  const incomingAttacks = activeMarches.filter(m => {
    if (m.isReturning) return false;
    const isTargetingPlayer = playerVillages.some(
      pv => pv.x === m.targetCoordinates.x && pv.y === m.targetCoordinates.y
    );
    return isTargetingPlayer && (m.mission === 'attack' || m.mission === 'raid' || m.isRivalAttack);
  });

  // 2. GİDEN SEFERLER (Taarruz, Akın, Casusluk, Destek)
  const outgoingMissions = activeMarches.filter(m => {
    return !incomingAttacks.includes(m);
  });

  const totalMovements = activeMarches.length;

  return (
    <div className="w-full bg-gradient-to-r from-[#1f130a] via-[#2c1a0e] to-[#1f130a] border-b-2 border-[#8c6534]/80 shadow-[0_4px_16px_rgba(0,0,0,0.85)] text-stone-200 select-none relative z-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        
        {/* SOL: Canlı Sefer Radarı İkonu ve Başlığı */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gradient-to-r from-[#4d3219] to-[#3a200d] border border-[#a67c48]/60 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                incomingAttacks.length > 0 ? 'bg-red-400' : totalMovements > 0 ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                incomingAttacks.length > 0 ? 'bg-red-500' : totalMovements > 0 ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
            </span>
            <span className="text-[11px] font-serif font-black tracking-wider text-[#fcedc7] uppercase">
              SEFER RADARI
            </span>
            {totalMovements > 0 && (
              <span className="text-[10px] font-mono font-bold bg-[#140b05] text-amber-300 px-1.5 py-0.2 rounded border border-amber-600/40">
                {totalMovements}
              </span>
            )}
          </div>
        </div>

        {/* ORTA: Aktif Sefer Bantları / Ticker */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 custom-scrollbar min-w-[260px]">
          {totalMovements === 0 ? (
            <div className="flex items-center justify-between w-full text-[11px] text-[#c9b191] font-serif italic py-0.5 px-2 bg-stone-950/40 rounded border border-stone-800/60">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">🛡️</span>
                <span>Sancak altında sükûnet hâkim — Aktif ordu seferi veya intikali yok.</span>
              </span>
              <div className="flex items-center gap-2">
                {onOpenMilitary && (
                  <button 
                    onClick={onOpenMilitary}
                    className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/60 text-amber-200 text-[10px] font-sans font-bold cursor-pointer transition shadow"
                  >
                    ⚔️ Akın Başlat
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 1. GELEN SALDIRILAR (KIRMIZI ALARM BANDI) */}
              {incomingAttacks.map(m => {
                const targetVil = playerVillages.find(pv => pv.x === m.targetCoordinates.x && pv.y === m.targetCoordinates.y);
                const watchtowerLvl = targetVil?.buildings.watchtower || 0;
                const remSec = Math.max(0, Math.round((m.arrivalTime - now) / 1000));
                
                // Gözcü kulesi 0 ise son saniyeye kadar kısıtlı görünür
                const isDetected = watchtowerLvl > 0 || remSec <= 45;
                if (!isDetected) return null;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarch(m)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-red-950/90 via-red-900/80 to-stone-950 border border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.35)] hover:brightness-125 cursor-pointer animate-pulse shrink-0 transition text-left"
                  >
                    <div className="w-5 h-5 rounded bg-red-900/80 border border-red-400 flex items-center justify-center text-xs">
                      ⚔️
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[10px] font-black text-red-300 font-serif tracking-wide uppercase">
                          DÜŞMAN SALDIRISI!
                        </span>
                        <span className="text-[10px] font-mono font-bold text-red-200 bg-red-950 px-1 rounded border border-red-500/60">
                          {formatTime(remSec)}
                        </span>
                      </div>
                      <div className="text-[9px] text-stone-300 font-mono mt-0.5">
                        Hedef: <strong className="text-amber-300">{targetVil?.name || m.targetName}</strong> ({m.targetCoordinates.x}|{m.targetCoordinates.y})
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* 2. GİDEN SEFERLER (ORDULAR / CASUSLAR) */}
              {outgoingMissions.map(m => {
                const remSec = Math.max(0, Math.round((m.arrivalTime - now) / 1000));
                const totalUnits = (Object.values(m.units) as (number | undefined)[]).reduce((a, b) => (a || 0) + (b || 0), 0) || 0;
                const isSpy = m.mission === 'spy';
                const isSupport = m.mission === 'support';
                const isRaid = m.mission === 'raid';
                const isReturning = m.isReturning;

                const missionIcon = isSpy ? '🦅' : isSupport ? '🛡️' : isRaid ? '🏇' : '⚔️';
                const missionTitle = isReturning 
                  ? 'DÖNÜŞ' 
                  : isSpy ? 'CASUSLUK' : isSupport ? 'DESTEK' : isRaid ? 'AKIN' : 'TAARRUZ';

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarch(m)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border shadow-md hover:brightness-120 cursor-pointer shrink-0 transition text-left ${
                      isReturning 
                        ? 'bg-gradient-to-r from-cyan-950/80 to-stone-950 border-cyan-700/60'
                        : isSpy 
                        ? 'bg-gradient-to-r from-purple-950/80 to-stone-950 border-purple-700/60'
                        : isSupport 
                        ? 'bg-gradient-to-r from-blue-950/80 to-stone-950 border-blue-700/60'
                        : 'bg-gradient-to-r from-amber-950/80 to-stone-950 border-amber-700/60'
                    }`}
                  >
                    <div className="w-5 h-5 rounded bg-stone-900 border border-stone-700 flex items-center justify-center text-xs">
                      {missionIcon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className="text-[10px] font-black text-amber-200 font-serif tracking-wide uppercase">
                          {missionTitle}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-300 bg-stone-950 px-1 rounded border border-stone-700">
                          {formatTime(remSec)}
                        </span>
                        <span className="text-[9px] font-mono text-stone-400">
                          ({totalUnits} {isSpy ? 'Casus' : 'Asker'})
                        </span>
                      </div>
                      <div className="text-[9px] text-stone-300 font-mono mt-0.5 truncate max-w-[140px]">
                        {isReturning ? `← ${m.originVillageName || 'Merkez'}` : `→ ${m.targetName}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* SAĞ: Hızlı Butonlar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onNavigateToMap && (
            <button
              onClick={() => onNavigateToMap()}
              title="Harita ve Strateji Görünümüne Git"
              className="px-2 py-1 rounded bg-gradient-to-r from-[#382010] to-[#25150a] border border-[#a67c48]/60 hover:border-amber-400 text-amber-200 text-xs font-serif font-bold cursor-pointer transition shadow flex items-center gap-1"
            >
              <span>🗺️</span>
              <span className="hidden md:inline">Harita</span>
            </button>
          )}
        </div>

      </div>

      {/* DETAY MODALI / SEFER BİLGİ KARTI */}
      {selectedMarch && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col bg-gradient-to-b from-[#2b1b10] via-[#1a0f08] to-[#120a05] border-2 border-[#caa05a] rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.95)] overflow-hidden text-stone-200 font-serif">
            
            {/* Modal Başlık */}
            <div className="p-3 shrink-0 bg-gradient-to-r from-[#4d3219] via-[#6e461f] to-[#4d3219] border-b-2 border-[#8b6534] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {selectedMarch.mission === 'trade' ? '🛒' : selectedMarch.mission === 'spy' ? '🦅' : selectedMarch.mission === 'support' ? '🛡️' : '⚔️'}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#fcedc7] uppercase tracking-wider">
                    {selectedMarch.mission === 'trade' 
                      ? 'TİCARET KERVANI DETAYI' 
                      : selectedMarch.mission === 'spy'
                      ? 'GİZLİ CASUSLUK SEFERİ'
                      : selectedMarch.mission === 'support'
                      ? 'DESTEK GARNİZON İNTİKALİ'
                      : 'AKIN VE TAARRUZ ORDUSU'}
                  </h3>
                  <div className="text-[10px] text-amber-300 font-mono">
                    {selectedMarch.isReturning ? 'Dönüş Yolculuğunda' : 'Hedefe Doğru İlerliyor'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMarch(null)}
                className="w-7 h-7 rounded-full bg-stone-900/80 border border-amber-600/60 flex items-center justify-center text-amber-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal İçerik */}
            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3 text-xs custom-scrollbar">
              
              {/* Güzergah ve Süre */}
              <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-stone-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Çıkış: <strong className="text-amber-200">{selectedMarch.originVillageName || 'Otağ'}</strong> ({selectedMarch.originCoordinates.x}|{selectedMarch.originCoordinates.y})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-red-400" />
                    <span>Hedef: <strong className="text-amber-200">{selectedMarch.targetName}</strong> ({selectedMarch.targetCoordinates.x}|{selectedMarch.targetCoordinates.y})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-900 flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-400">Kalan Varış Süresi:</span>
                  <span className="text-amber-300 font-bold text-sm bg-stone-900 px-2 py-0.5 rounded border border-amber-600/40">
                    ⏳ {formatTime(Math.max(0, Math.round((selectedMarch.arrivalTime - now) / 1000)))}
                  </span>
                </div>
              </div>

              {/* Birlik Listesi */}
              {selectedMarch.mission !== 'trade' && (
                <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                  <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Sefer Ordusu Birimleri:</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedMarch.units).map(([uKey, count]) => {
                      const cNum = Number(count) || 0;
                      if (cNum <= 0) return null;
                      const uDef = UNITS[uKey as UnitType];
                      return (
                        <div key={uKey} className="flex items-center justify-between p-1.5 bg-stone-900 rounded border border-stone-800 text-[11px] font-mono">
                          <span className="text-stone-300">{uDef?.name || uKey}</span>
                          <span className="text-amber-300 font-bold">{cNum}x</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ganimet (Dönüş Orduları İçin) */}
              {selectedMarch.isReturning && selectedMarch.loot && (
                <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-2">
                  <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span>Taşınan Savaş Ganimeti:</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    {Object.entries(selectedMarch.loot).map(([rKey, amt]) => {
                      const aNum = Number(amt) || 0;
                      if (aNum <= 0) return null;
                      return (
                        <div key={rKey} className="flex items-center gap-1.5 p-1.5 bg-stone-900 rounded border border-stone-800">
                          <ResourceIcon type={rKey as any} size="xs" />
                          <span className="text-amber-200 font-bold">{Math.floor(aNum).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                  {selectedMarch.capturedVillagers ? (
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      ⛓️ {selectedMarch.capturedVillagers} esir köylü köye getiriliyor.
                    </div>
                  ) : null}
                  {selectedMarch.capturedHorses ? (
                    <div className="text-[11px] text-yellow-400 font-mono">
                      🐎 {selectedMarch.capturedHorses} ganimet at ahırlara getiriliyor.
                    </div>
                  ) : null}
                </div>
              )}

              {/* Alt Aksiyon Butonları */}
              <div className="flex items-center gap-2 pt-2">
                {onNavigateToMap && (
                  <button
                    onClick={() => {
                      onNavigateToMap(selectedMarch.targetCoordinates);
                      setSelectedMarch(null);
                    }}
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs transition cursor-pointer shadow flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Haritada Hedefe Odaklan</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedMarch(null)}
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold text-xs transition cursor-pointer border border-stone-700"
                >
                  Kapat
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
