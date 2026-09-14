import React, { useState, useMemo, useEffect } from 'react';
import { 
  MarchMission, 
  UnitType, 
  Village, 
  FactionId 
} from '../types/game';
import { 
  FACTIONS, 
  UNITS, 
  calculateDistance 
} from '../data/gameData';
import { UnitPortrait } from './UnitPortrait';
import { 
  Swords, 
  ShieldAlert, 
  Eye, 
  Users, 
  Clock, 
  MapPin, 
  Zap, 
  RotateCcw, 
  X, 
  Package, 
  Flame,
  Plus, 
  Minus,
  Sparkles,
  Shield,
  Send
} from 'lucide-react';

export interface QuickMarchTarget {
  name: string;
  x: number;
  y: number;
  ownerName?: string;
  faction?: FactionId;
  villageId?: string;
}

interface QuickMarchModalProps {
  isOpen: boolean;
  onClose: () => void;
  originVillage: Village;
  target: QuickMarchTarget | null;
  onDispatch: (
    targetCoords: { x: number; y: number },
    targetName: string,
    mission: MarchMission,
    units: Partial<Record<UnitType, number>>
  ) => void;
}

export const QuickMarchModal: React.FC<QuickMarchModalProps> = ({
  isOpen,
  onClose,
  originVillage,
  target,
  onDispatch,
}) => {
  const [mission, setMission] = useState<MarchMission>('raid');
  const [selectedUnits, setSelectedUnits] = useState<Partial<Record<UnitType, number>>>({});

  // Hedef değiştiğinde veya modal açıldığında temizle
  useEffect(() => {
    if (isOpen) {
      setSelectedUnits({});
      setMission('raid');
    }
  }, [isOpen, target?.x, target?.y]);

  // ESC tuşuyla kapatma desteği
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  // Kuş uçuşu mesafe
  const distance = calculateDistance(originVillage.x, originVillage.y, target.x, target.y);

  // Garnizondaki mevcut birlikleri listele
  const availableUnitTypes = (Object.keys(UNITS) as UnitType[]).filter(uType => {
    const count = originVillage.units?.[uType] || 0;
    return count > 0;
  });

  // Seçilen birliklerin hesaplanması
  let totalTroops = 0;
  let totalAttackPower = 0;
  let totalLootCapacity = 0;
  let slowestSpeed = 999;
  let slowestSpeedScore = 100;

  for (const [uKey, countVal] of Object.entries(selectedUnits)) {
    const count = Number(countVal) || 0;
    if (count <= 0) continue;
    const uDef = UNITS[uKey as UnitType];
    if (!uDef) continue;

    totalTroops += count;
    totalAttackPower += uDef.attackPower * count;

    let unitCap = uDef.lootCapacity;
    const plunderMult = (originVillage.faction && FACTIONS[originVillage.faction]?.plunderCapacityMultiplier) || 1.0;
    unitCap *= plunderMult;
    totalLootCapacity += count * unitCap;

    if (uDef.speedTilesPerMin < slowestSpeed) {
      slowestSpeed = uDef.speedTilesPerMin;
      slowestSpeedScore = uDef.speedScore ?? 50;
    }
  }

  if (slowestSpeed === 999) {
    slowestSpeed = 2.0;
    slowestSpeedScore = 50;
  }

  const factionMarchMult = (originVillage.faction && FACTIONS[originVillage.faction]?.marchSpeedMultiplier) || 1.0;
  slowestSpeed *= factionMarchMult;

  // İntikal Süresi (100x Hızlandırma ile saniye ve format)
  const durationSec = Math.max(2, Math.round(((distance / slowestSpeed) * 60) / 100));
  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs} sn`;
    return `${mins} dk ${secs} sn`;
  };

  // Birlik Değiştirme
  const handleUnitChange = (uType: UnitType, val: number) => {
    const maxAvailable = originVillage.units?.[uType] || 0;
    const clamped = Math.max(0, Math.min(maxAvailable, Math.floor(val)));
    setSelectedUnits(prev => ({
      ...prev,
      [uType]: clamped,
    }));
  };

  const handleSetMax = (uType: UnitType) => {
    const maxAvailable = originVillage.units?.[uType] || 0;
    setSelectedUnits(prev => ({
      ...prev,
      [uType]: maxAvailable,
    }));
  };

  // ========================================================================
  // AKILLI HIZLI ŞABLONLAR (TEK TIKLA ORDU KURMA)
  // ========================================================================
  const handleTemplateFastRaid = () => {
    const newSelection: Partial<Record<UnitType, number>> = {};
    (Object.keys(UNITS) as UnitType[]).forEach(uType => {
      const uDef = UNITS[uType];
      const count = originVillage.units?.[uType] || 0;
      if (count > 0 && (uDef.category === 'suvari' || uType === 'akinci' || uType === 'bozok_suvarisi' || uType === 'hafif_suvari')) {
        newSelection[uType] = count;
      }
    });
    setSelectedUnits(newSelection);
    setMission('raid');
  };

  const handleTemplateAllArmy = () => {
    const newSelection: Partial<Record<UnitType, number>> = {};
    (Object.keys(UNITS) as UnitType[]).forEach(uType => {
      const count = originVillage.units?.[uType] || 0;
      if (count > 0 && uType !== 'casus') {
        newSelection[uType] = count;
      }
    });
    setSelectedUnits(newSelection);
    setMission('attack');
  };

  const handleTemplateSpyGroup = () => {
    const newSelection: Partial<Record<UnitType, number>> = {};
    const spyCount = originVillage.units?.['casus'] || 0;
    if (spyCount > 0) {
      newSelection['casus'] = spyCount;
    }
    setSelectedUnits(newSelection);
    setMission('spy');
  };

  const handleClearAll = () => {
    setSelectedUnits({});
  };

  // Seferi Yola Çıkar
  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalTroops <= 0) return;

    onDispatch(
      { x: target.x, y: target.y },
      target.name,
      mission,
      selectedUnits
    );

    onClose();
  };

  const originFactionInfo = originVillage.faction ? FACTIONS[originVillage.faction] : null;
  const targetFactionInfo = target.faction ? FACTIONS[target.faction] : null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-serif">
      <div 
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#231710] via-[#1a120c] to-[#120d09] border-2 border-[#8c6738] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.95)] text-[#f3e5ce] overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* 1. BAŞLIK & HEDEF KÜNYESİ BAR */}
        <div className="bg-gradient-to-r from-[#2c1b11] via-[#3a2517] to-[#2c1b11] border-b-2 border-[#8c6738]/70 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {originFactionInfo?.flagImage ? (
              <div className="w-8 h-6 rounded-lg overflow-hidden border border-amber-500/70 shadow-inner shrink-0">
                <img 
                  src={originFactionInfo.flagImage} 
                  alt={originFactionInfo.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#581c1c] border border-red-500/60 flex items-center justify-center shadow-inner shrink-0">
                <Swords className="w-5 h-5 text-red-300 animate-pulse" />
              </div>
            )}
            <div>
              <h2 className="text-sm sm:text-base font-bold text-amber-200 tracking-wide flex items-center gap-2">
                Hızlı Sefer Emri
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 font-mono">
                  {originVillage.name} → {target.name}
                </span>
              </h2>
              <p className="text-[11px] text-[#c4b59d]">
                Harita üzerinden anında ordu intikali ve akın tertibatı
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#2e1d13] hover:bg-[#4a2f1e] text-stone-400 hover:text-white border border-[#6b4c28] flex items-center justify-center cursor-pointer transition shrink-0"
            title="Kapat (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. İÇERİK KAYDIRILABİLİR ALANI */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-4 custom-scrollbar">
          
          {/* HEDEF KÜNYE KARTI */}
          <div className="bg-gradient-to-r from-[#1b120c] via-[#22170f] to-[#1b120c] border border-[#6d4c2b] rounded-xl p-3 shadow-inner flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7f1d1d] to-[#450a0a] border border-red-500/50 flex items-center justify-center text-lg shadow-md">
                ⚔️
              </div>
              <div>
                <div className="font-bold text-amber-100 text-sm flex items-center gap-1.5">
                  <span>{target.name}</span>
                  {target.ownerName && (
                    <span className="text-[#a89274] font-normal text-xs">({target.ownerName})</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#a89274] mt-0.5">
                  <span className="flex items-center gap-1 text-amber-300">
                    <MapPin className="w-3 h-3" /> ({target.x} | {target.y})
                  </span>
                  {targetFactionInfo && (
                    <span className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 flex items-center gap-1.5">
                      {targetFactionInfo.flagImage && (
                        <div className="w-4 h-3 rounded-sm overflow-hidden border border-amber-500/50 shrink-0">
                          <img 
                            src={targetFactionInfo.flagImage} 
                            alt={targetFactionInfo.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      )}
                      <span>{targetFactionInfo.name}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mesafe ve Canlı Süre Göstergesi */}
            <div className="flex items-center gap-4 bg-[#140d08] px-3 py-1.5 rounded-lg border border-[#4d351d]">
              <div className="text-right">
                <span className="block text-[10px] text-[#8c785f]">Kuş Uçuşu Mesafe</span>
                <span className="font-bold text-amber-200 font-mono text-xs">{distance.toFixed(1)} tile</span>
              </div>
              <div className="w-px h-6 bg-[#4d351d]" />
              <div className="text-right">
                <span className="block text-[10px] text-[#8c785f]">Tahmini Varış Süresi</span>
                <span className="font-bold text-emerald-300 font-mono text-xs flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {formatDuration(durationSec)}
                </span>
              </div>
            </div>
          </div>

          {/* SEFER AMACI SEÇİCİ (MISSION SELECTOR) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Sefer Amacı ve Harekât Türü
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              
              {/* Normal Taarruz */}
              <button
                type="button"
                onClick={() => setMission('attack')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'attack'
                    ? 'bg-gradient-to-b from-[#7c2d12]/90 to-[#431407]/95 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] text-white'
                    : 'bg-[#1a120c] border-[#4d351d] text-stone-300 hover:border-amber-600/60 hover:text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Taarruz
                  </span>
                  {mission === 'attack' && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                </div>
                <p className="text-[9px] text-stone-400 leading-tight">
                  Meydan savaşı ve mancınıkla bina yıkımı.
                </p>
              </button>

              {/* Yağma Seferi */}
              <button
                type="button"
                onClick={() => setMission('raid')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'raid'
                    ? 'bg-gradient-to-b from-[#9a3412]/90 to-[#431407]/95 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] text-white'
                    : 'bg-[#1a120c] border-[#4d351d] text-stone-300 hover:border-amber-600/60 hover:text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Yağma
                  </span>
                  {mission === 'raid' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                </div>
                <p className="text-[9px] text-stone-400 leading-tight">
                  Talan, esir köylü & at kaçırma.
                </p>
              </button>

              {/* Destek Seferi */}
              <button
                type="button"
                onClick={() => setMission('support')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'support'
                    ? 'bg-gradient-to-b from-[#1e3a8a]/90 to-[#0f172a]/95 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)] text-white'
                    : 'bg-[#1a120c] border-[#4d351d] text-stone-300 hover:border-amber-600/60 hover:text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    Destek
                  </span>
                  {mission === 'support' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                </div>
                <p className="text-[9px] text-stone-400 leading-tight">
                  Hedef köye garnizon yardımı.
                </p>
              </button>

              {/* Casusluk */}
              <button
                type="button"
                onClick={() => setMission('spy')}
                className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'spy'
                    ? 'bg-gradient-to-b from-[#581c87]/90 to-[#2e1065]/95 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)] text-white'
                    : 'bg-[#1a120c] border-[#4d351d] text-stone-300 hover:border-amber-600/60 hover:text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    Casusluk
                  </span>
                  {mission === 'spy' && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                </div>
                <p className="text-[9px] text-stone-400 leading-tight">
                  Garnizon ve ambar keşfi.
                </p>
              </button>

            </div>
          </div>

          {/* AKILLI HIZLI ŞABLON BUTONLARI (TEK TIKLA ORDU KURMA) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Hızlı Ordu Şablonları
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-[#b49e82] hover:text-amber-200 flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Sıfırla
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleTemplateFastRaid}
                className="px-2.5 py-1.5 bg-[#2a1d13] hover:bg-[#3d2a1b] active:scale-95 border border-[#6b4e2a] hover:border-amber-500 rounded-lg text-xs font-semibold text-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Hızlı Akın</span>
              </button>

              <button
                type="button"
                onClick={handleTemplateAllArmy}
                className="px-2.5 py-1.5 bg-[#2a1d13] hover:bg-[#3d2a1b] active:scale-95 border border-[#6b4e2a] hover:border-amber-500 rounded-lg text-xs font-semibold text-amber-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Swords className="w-3.5 h-3.5 text-red-400" />
                <span>⚔️ Tüm Ordu</span>
              </button>

              <button
                type="button"
                onClick={handleTemplateSpyGroup}
                className="px-2.5 py-1.5 bg-[#2a1d13] hover:bg-[#3d2a1b] active:scale-95 border border-[#6b4e2a] hover:border-sky-500 rounded-lg text-xs font-semibold text-sky-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>👁️ Casus Kolu</span>
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 bg-[#1f150e] hover:bg-[#2d1e14] active:scale-95 border border-[#4d351d] text-stone-400 hover:text-stone-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            </div>
          </div>

          {/* BİRLİK SEÇİM IZGARASI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Garnizon Birlikleri ({originVillage.name})
              </span>
              <span className="text-[11px] text-[#9c8971]">
                Garnizonda {availableUnitTypes.length} farklı birlik türü mevcut
              </span>
            </div>

            {availableUnitTypes.length === 0 ? (
              <div className="bg-[#19110b] border border-[#4d351d] rounded-xl p-6 text-center text-stone-400 space-y-2">
                <ShieldAlert className="w-8 h-8 text-amber-500/60 mx-auto" />
                <p className="text-xs font-bold text-amber-200">Köyde sefere hazır asker bulunmuyor!</p>
                <p className="text-[11px] text-stone-400">
                  Kışla veya Ahır binalarından yeni birlikler eğiterek ordu kurabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableUnitTypes.map(uType => {
                  const uDef = UNITS[uType];
                  const available = originVillage.units?.[uType] || 0;
                  const currentSelected = selectedUnits[uType] || 0;
                  const isSelected = currentSelected > 0;

                  return (
                    <div 
                      key={uType}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                        isSelected 
                          ? 'bg-gradient-to-r from-[#2c1d12] to-[#24170f] border-amber-600/80 shadow-md ring-1 ring-amber-500/30' 
                          : 'bg-[#17100b] border-[#4d351d] hover:border-[#6b4e2a]'
                      }`}
                    >
                      {/* Sol: Portre ve Detaylar */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-[#6b4e2a] bg-stone-900 shadow">
                          <UnitPortrait unitId={uType} size="sm" showModalOnClick={false} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-amber-100 truncate flex items-center gap-1">
                            {uDef.name}
                          </div>
                          <div className="text-[10px] text-[#a89274] flex items-center gap-2 mt-0.5">
                            <span>Mevcut: <strong className="text-amber-300 font-mono">{available}</strong></span>
                            <span>•</span>
                            <span title="Hız Puanı (0-100)">⚡ {uDef.speedScore ?? 50}/100</span>
                            <span title="Yağma Puanı (0-100)">💰 {uDef.plunderScore ?? 50}/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Sağ: Miktar Kontrolleri */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUnitChange(uType, currentSelected - 10)}
                          disabled={currentSelected <= 0}
                          className="w-6 h-6 rounded bg-[#2a1d13] hover:bg-[#3d2a1b] disabled:opacity-30 disabled:pointer-events-none text-stone-300 text-[10px] font-bold border border-[#523d24] flex items-center justify-center cursor-pointer transition"
                          title="-10"
                        >
                          -10
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUnitChange(uType, currentSelected - 1)}
                          disabled={currentSelected <= 0}
                          className="w-6 h-6 rounded bg-[#2a1d13] hover:bg-[#3d2a1b] disabled:opacity-30 disabled:pointer-events-none text-stone-300 border border-[#523d24] flex items-center justify-center cursor-pointer transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min={0}
                          max={available}
                          value={currentSelected === 0 ? '' : currentSelected}
                          placeholder="0"
                          onChange={e => handleUnitChange(uType, Number(e.target.value) || 0)}
                          className="w-12 h-6 text-center bg-[#100b07] border border-amber-600/50 rounded text-xs font-mono font-bold text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleUnitChange(uType, currentSelected + 1)}
                          disabled={currentSelected >= available}
                          className="w-6 h-6 rounded bg-[#2a1d13] hover:bg-[#3d2a1b] disabled:opacity-30 disabled:pointer-events-none text-stone-300 border border-[#523d24] flex items-center justify-center cursor-pointer transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetMax(uType)}
                          className="px-1.5 h-6 rounded bg-[#3d2817] hover:bg-[#523720] text-amber-300 text-[10px] font-bold border border-[#785328] flex items-center justify-center cursor-pointer transition"
                          title="Tümünü Seç"
                        >
                          Tümü
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* 3. CANLI SEFER ÖZETİ VE ÇIKIŞ AKSİYONU (BOTTOM BAR) */}
        <div className="bg-gradient-to-r from-[#1c120a] via-[#2a1b10] to-[#1c120a] border-t-2 border-[#8c6738]/80 p-3.5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Sefer İstatistikleri Rozetleri */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs w-full sm:w-auto justify-center sm:justify-start">
            <div className="px-2.5 py-1 rounded-lg bg-[#140c07] border border-[#523d24] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[#a89274]">Asker:</span>
              <strong className="text-amber-200 font-mono">{totalTroops}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-[#140c07] border border-[#523d24] flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[#a89274]">Güç:</span>
              <strong className="text-red-200 font-mono">{totalAttackPower}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-[#140c07] border border-[#523d24] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[#a89274]">Ganimet:</span>
              <strong className="text-emerald-200 font-mono">{totalLootCapacity}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-[#140c07] border border-[#523d24] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[#a89274]">Hız:</span>
              <strong className="text-amber-300 font-mono">{totalTroops > 0 ? slowestSpeedScore : '-'}/100</strong>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-[#140c07] border border-[#523d24] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[#a89274]">Varış:</span>
              <strong className="text-sky-200 font-mono">{formatDuration(durationSec)}</strong>
            </div>
          </div>

          {/* Butonlar */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-[#2a1d13] hover:bg-[#3d2a1b] text-stone-300 hover:text-white rounded-xl text-xs font-bold transition border border-[#523d24] cursor-pointer"
            >
              İptal
            </button>

            <button
              type="button"
              onClick={handleDispatchSubmit}
              disabled={totalTroops <= 0}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                totalTroops > 0
                  ? 'bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#991b1b] hover:brightness-110 text-white border border-red-400 shadow-red-950/60 ring-2 ring-red-500/30'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Orduyu Yola Çıkar ({totalTroops})</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
