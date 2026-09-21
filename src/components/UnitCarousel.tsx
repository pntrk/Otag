import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BuildingType, UnitType, Village, UnitDefinition } from '../types/game';
import { 
  FACTIONS, 
  UNITS, 
  BUILDINGS, 
  isUnitProducibleByFaction, 
  GAME_SPEED_MULTIPLIER 
} from '../data/gameData';
import { UnitPortrait } from './UnitPortrait';
import { ResourceIcon } from './ResourceIcon';
import { 
  Swords, 
  Shield, 
  Zap, 
  Clock, 
  Users, 
  X, 
  Hammer, 
  Sparkles, 
  Check, 
  AlertCircle,
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';

export interface UnitCarouselProps {
  village: Village;
  onOpenBuilding: (type: BuildingType) => void;
  onSelectUnit?: (unitType: UnitType) => void;
  onTrainUnits?: (unitType: UnitType, amount: number) => void;
}

export const UnitCarousel: React.FC<UnitCarouselProps> = ({
  village,
  onOpenBuilding,
  onSelectUnit,
  onTrainUnits,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const playerSpecialUnit = (faction.specialUnitId as UnitType) || 'akinci';

  // Seçili eğitim modalı birliği
  const [selectedUnitForTraining, setSelectedUnitForTraining] = useState<UnitType | null>(null);
  const [trainAmount, setTrainAmount] = useState<number>(1);
  const [trainSuccessMessage, setTrainSuccessMessage] = useState<string | null>(null);

  // Tüm temel birlik adayları
  const rawStandardUnits: { type: UnitType; building: BuildingType }[] = [
    { type: playerSpecialUnit, building: (UNITS[playerSpecialUnit]?.buildingRequired as BuildingType) || 'barracks' },
    { type: 'mizrakli', building: 'barracks' },
    { type: 'kilicli', building: 'barracks' },
    { type: 'gulam', building: 'barracks' },
    { type: 'levent', building: 'barracks' },
    { type: 'hafif_suvari', building: 'stables' },
    { type: 'casus', building: 'watchtower' },
    { type: 'kocbasi', building: 'barracks' },
  ];

  // Sadece bu beylik tarafından üretilebilen veya köyde mevcut olan birlikler
  const seenTypes = new Set<UnitType>();
  const standardUnitsList = rawStandardUnits.filter(item => {
    if (seenTypes.has(item.type)) return false;
    seenTypes.add(item.type);
    const ownCount = Number(village.units[item.type]) || 0;
    const stationedCount = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[item.type]) || 0), 0);
    return isUnitProducibleByFaction(item.type, village.faction) || (ownCount + stationedCount) > 0;
  });

  // Diğer beyliklerin özel birlikleri
  const ALL_SPECIAL_UNITS: UnitType[] = [
    'akinci',
    'karaman_alpi',
    'kure_baltacisi',
    'bozok_suvarisi',
    'tura'
  ];
  const foreignSpecialUnits = ALL_SPECIAL_UNITS.filter(u => u !== playerSpecialUnit);

  // Birleştirilmiş liste
  const carouselUnits = [
    ...standardUnitsList.map(item => {
      const uType = item.type;
      const ownCount = Number(village.units[uType]) || 0;
      const stationedCount = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[uType]) || 0), 0);
      const total = ownCount + stationedCount;
      const uDef = UNITS[uType];
      const isProducible = isUnitProducibleByFaction(uType, village.faction);
      const bReq = item.building;
      const bLvl = village.buildings[bReq] || 0;
      const isUnlocked = isProducible && bLvl >= (uDef?.minBuildingLevel || 1);

      return {
        type: uType,
        name: uDef?.name || uType,
        count: ownCount,
        stationedCount,
        total,
        building: bReq,
        isForeign: false,
        isProducible,
        isUnlocked,
        isAvailable: total > 0 || isUnlocked,
      };
    }),
    ...foreignSpecialUnits.map(uType => {
      const ownCount = Number(village.units[uType]) || 0;
      const stationedCount = (village.stationedSupport || []).reduce((sum, s) => sum + (Number(s.units[uType]) || 0), 0);
      const total = ownCount + stationedCount;
      const uDef = UNITS[uType];

      return {
        type: uType,
        name: uDef?.name || uType,
        count: ownCount,
        stationedCount,
        total,
        building: (uDef?.buildingRequired as BuildingType) || 'barracks',
        isForeign: true,
        isProducible: false,
        isUnlocked: false,
        isAvailable: total > 0,
      };
    })
  ];

  // Aktif modal birim tanımı ve şart hesaplamaları
  const activeDef: UnitDefinition | undefined = selectedUnitForTraining ? UNITS[selectedUnitForTraining] : undefined;
  const activeBuildingReq: BuildingType = activeDef ? ((activeDef.buildingRequired as BuildingType) || 'barracks') : 'barracks';
  const activeBuildingLvl: number = activeDef ? (village.buildings[activeBuildingReq] || 0) : 0;
  const isBuildingMet: boolean = activeDef ? (activeBuildingLvl >= activeDef.minBuildingLevel) : false;
  const isFactionAllowed: boolean = selectedUnitForTraining ? isUnitProducibleByFaction(selectedUnitForTraining, village.faction) : false;

  const idlePop = village.idlePopulation || 0;
  const cost = activeDef?.cost || { wood: 0, stone: 0, iron: 0, grain: 0, gold: 0 };

  const maxFromWood = cost.wood > 0 ? Math.floor((village.resources.wood || 0) / cost.wood) : 999999;
  const maxFromStone = cost.stone > 0 ? Math.floor((village.resources.stone || 0) / cost.stone) : 999999;
  const maxFromIron = cost.iron > 0 ? Math.floor((village.resources.iron || 0) / cost.iron) : 999999;
  const maxFromGrain = cost.grain > 0 ? Math.floor((village.resources.grain || 0) / cost.grain) : 999999;
  const maxFromGold = cost.gold > 0 ? Math.floor((village.resources.gold || 0) / cost.gold) : 999999;
  const maxFromResources = Math.max(0, Math.min(maxFromWood, maxFromStone, maxFromIron, maxFromGrain, maxFromGold));
  
  const maxTrainable = isBuildingMet && isFactionAllowed ? Math.max(0, Math.min(maxFromResources, idlePop)) : 0;

  const safeAmount = Math.max(1, trainAmount);
  const totalCost = {
    wood: cost.wood * safeAmount,
    stone: cost.stone * safeAmount,
    iron: cost.iron * safeAmount,
    grain: cost.grain * safeAmount,
    gold: cost.gold * safeAmount,
  };

  const hasEnoughWood = (village.resources.wood || 0) >= totalCost.wood;
  const hasEnoughStone = (village.resources.stone || 0) >= totalCost.stone;
  const hasEnoughIron = (village.resources.iron || 0) >= totalCost.iron;
  const hasEnoughGrain = (village.resources.grain || 0) >= totalCost.grain;
  const hasEnoughGold = (village.resources.gold || 0) >= totalCost.gold;
  const hasEnoughWorkers = idlePop >= safeAmount;
  const hasEnoughAll = hasEnoughWood && hasEnoughStone && hasEnoughIron && hasEnoughGrain && hasEnoughGold && hasEnoughWorkers;

  const canExecuteTraining = isBuildingMet && isFactionAllowed && hasEnoughAll;

  // Hızlandırılmış talim süresi
  let singleUnitDuration = activeDef?.trainingTimeSec || 10;
  if (activeDef?.category === 'suvari') {
    const breedingMult = (village.faction && FACTIONS[village.faction]?.horseBreedingSpeedMultiplier) || 1.0;
    singleUnitDuration = Math.max(5, Math.round(singleUnitDuration / breedingMult));
  }
  const effectiveSingleDuration = Math.max(1, Math.round(singleUnitDuration / GAME_SPEED_MULTIPLIER));
  const totalDurationSec = effectiveSingleDuration * safeAmount;

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}sn`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}dk ${s > 0 ? `${s}sn` : ''}`;
  };

  const handleOpenUnitModal = (unitType: UnitType, building: BuildingType) => {
    if (onSelectUnit) onSelectUnit(unitType);
    setSelectedUnitForTraining(unitType);
    setTrainSuccessMessage(null);
    setTrainAmount(1);
  };

  const handleExecuteTrain = () => {
    if (!selectedUnitForTraining || !canExecuteTraining) return;
    if (onTrainUnits) {
      onTrainUnits(selectedUnitForTraining, safeAmount);
      setTrainSuccessMessage(`⚔️ ${safeAmount}x ${activeDef?.name || 'Asker'} talimine başlandı!`);
      setTimeout(() => {
        setTrainSuccessMessage(null);
      }, 3000);
    } else {
      onOpenBuilding(activeBuildingReq);
      setSelectedUnitForTraining(null);
    }
  };

  return (
    <div className="relative w-full z-20 bg-gradient-to-b from-[#24170e] via-[#170e08] to-[#100905] border-t-2 border-[#694825] p-2 sm:p-3 shadow-[0_-6px_20px_rgba(0,0,0,0.85)] select-none">
      
      {/* Yatay Kaydırılabilir / Genişletilmiş Asker Yuvaları */}
      <div className="flex overflow-x-auto custom-scrollbar scroll-smooth snap-x snap-mandatory gap-2 sm:gap-2.5 pb-1 sm:pb-0 px-0.5 sm:grid sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
        {carouselUnits.map((unit) => {
          const isZero = unit.total === 0;
          const isLocked = !unit.isAvailable;
          const hasTroops = unit.total > 0;

          return (
            <div
              key={unit.type}
              onClick={() => handleOpenUnitModal(unit.type, unit.building)}
              className={`group relative flex flex-col items-center rounded-xl border-2 transition-all cursor-pointer p-1.5 min-w-[78px] sm:min-w-0 w-[78px] sm:w-auto shrink-0 sm:shrink snap-start touch-manipulation hover:scale-105 active:scale-95 ${
                isLocked
                  ? 'border-stone-800/80 bg-[#0f0a06]/80 opacity-50 hover:opacity-80'
                  : isZero
                  ? 'border-[#5a3e22] bg-gradient-to-b from-[#1c120a] to-[#120b06] hover:border-amber-400 hover:bg-[#291a0f]'
                  : 'border-[#c59b4c] bg-gradient-to-b from-[#342013] via-[#20140b] to-[#140c06] hover:border-[#ffd700] shadow-[0_4px_12px_rgba(0,0,0,0.7)] hover:shadow-[0_0_16px_rgba(255,215,0,0.5)] ring-1 ring-[#ffd700]/30'
              }`}
              title={`${unit.name}: ${unit.total.toLocaleString()} Mevcut (${unit.isForeign ? 'Müttefik Desteği' : 'Köy Askeri'})${unit.isUnlocked ? ' • Tıklayarak Hızlı Eğit' : isLocked ? ' (Kilitli/Bina Gerekli)' : ''}`}
            >
              {/* Üretilebilir / Hazır Rozeti */}
              {unit.isUnlocked && (
                <div className="absolute -top-1.5 -right-1.5 z-30 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-amber-200 shadow-md group-hover:scale-110 transition-transform">
                  +
                </div>
              )}

              {/* Card Slot Frame Container (Büyük & Net Portre Çerçevesi) */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-black/60 border border-[#785328]/80 shadow-inner">
                {/* Unit Portrait */}
                <div className={`w-full h-full transition-transform duration-200 group-hover:scale-110 ${
                  isLocked ? 'filter grayscale brightness-70' : isZero ? 'filter brightness-90' : 'filter brightness-105'
                }`}>
                  <UnitPortrait 
                    unitId={unit.type} 
                    size="custom" 
                    className="w-full h-full"
                    grayscale={isLocked}
                    isInactive={isLocked}
                    showModalOnClick={false}
                  />
                </div>

                {/* Müttefik Desteği Rozeti */}
                {unit.isForeign && unit.stationedCount > 0 && (
                  <div className="absolute top-1 right-1 z-20 bg-emerald-950/95 text-emerald-300 text-[9px] font-black px-1 py-0.5 rounded border border-emerald-400 shadow-md">
                    🛡️
                  </div>
                )}
              </div>

              {/* Alt Plaket / Sayı ve İsim Kutusu (Büyük, Parlak ve Net) */}
              <div className={`relative z-20 w-full mt-1.5 px-1 py-0.5 rounded-md border text-center shadow-inner ${
                hasTroops
                  ? 'border-[#c59b4c] bg-gradient-to-r from-[#2a170a] via-[#3d2311] to-[#2a170a]'
                  : 'border-[#4a331c] bg-[#140c06]'
              }`}>
                {/* Asker Sayısı */}
                <div className="font-mono font-black text-[13px] sm:text-[14px] leading-tight tracking-tight">
                  <span className={
                    isLocked 
                      ? 'text-stone-500' 
                      : isZero 
                      ? 'text-stone-400' 
                      : 'text-[#ffe066] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]'
                  }>
                    {unit.total.toLocaleString('tr-TR')}
                  </span>
                </div>
                {/* Asker İsmi */}
                <div className={`text-[9px] sm:text-[10px] font-serif truncate w-full leading-tight font-bold ${
                  hasTroops ? 'text-amber-100 group-hover:text-white' : 'text-stone-400 group-hover:text-amber-200'
                }`}>
                  {unit.name}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* HIZLI ASKER EĞİTİMİ & TALİMGÂH MODALI (Hemen Üretim)                  */}
      {/* ==================================================================== */}
      {selectedUnitForTraining && activeDef && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setSelectedUnitForTraining(null)}
        >
          <div 
            className="bg-gradient-to-b from-[#24170d] via-[#1a1009] to-[#0d0704] border-2 border-amber-600/90 rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-stone-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Üst Başlık */}
            <div className="bg-gradient-to-r from-[#3a2211] via-[#2a170b] to-[#3a2211] px-4 py-3 border-b border-amber-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400 shadow-md shrink-0 bg-black">
                  <UnitPortrait 
                    unitId={selectedUnitForTraining} 
                    size="custom" 
                    className="w-full h-full"
                    showModalOnClick={false}
                  />
                </div>
                <div>
                  <h3 className="font-serif font-black text-amber-300 text-base sm:text-lg flex items-center gap-2">
                    <span>{activeDef.name}</span>
                    <span className="text-[10px] font-sans uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950/90 border border-amber-700/60 text-amber-400">
                      {activeDef.category === 'suvari' ? '🐎 Süvari' : activeDef.category === 'kusatma' ? '🎯 Kuşatma' : activeDef.category === 'istihbarat' ? '👁️ Casus' : '⚔️ Piyade'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-400 font-mono">
                    Garnizonda: <strong className="text-amber-200">{(Number(village.units[selectedUnitForTraining]) || 0).toLocaleString()}</strong> asker hazır
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUnitForTraining(null)}
                className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal İçeriği */}
            <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              
              {/* Başarı Bildirimi */}
              {trainSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 font-semibold flex items-center gap-2 animate-fade-in shadow-md">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{trainSuccessMessage}</span>
                </div>
              )}

              {/* Birlik Savaş İstatistikleri Tablosu */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-[#120b06] p-2.5 rounded-xl border border-[#3e2716]">
                <div className="text-center p-1 rounded bg-black/40 border border-[#2b1a0e]">
                  <div className="text-[9px] text-stone-400">⚔️ Taarruz</div>
                  <div className="font-mono font-bold text-amber-300 text-xs">{activeDef.attackPower}</div>
                </div>
                <div className="text-center p-1 rounded bg-black/40 border border-[#2b1a0e]">
                  <div className="text-[9px] text-stone-400">🛡️ Piyade Sav</div>
                  <div className="font-mono font-bold text-blue-300 text-xs">{activeDef.defenseInfantry}</div>
                </div>
                <div className="text-center p-1 rounded bg-black/40 border border-[#2b1a0e]">
                  <div className="text-[9px] text-stone-400">🐎 Süvari Sav</div>
                  <div className="font-mono font-bold text-indigo-300 text-xs">{activeDef.defenseCavalry}</div>
                </div>
                <div className="text-center p-1 rounded bg-black/40 border border-[#2b1a0e]">
                  <div className="text-[9px] text-stone-400">⚡ Hız</div>
                  <div className="font-mono font-bold text-emerald-300 text-xs">{activeDef.speedTilesPerMin} k/dk</div>
                </div>
                <div className="text-center p-1 rounded bg-black/40 border border-[#2b1a0e]">
                  <div className="text-[9px] text-stone-400">🎒 Yağma</div>
                  <div className="font-mono font-bold text-yellow-300 text-xs">{activeDef.lootCapacity}</div>
                </div>
                <div className="text-center p-1 rounded bg-black/40 border border-[#2b1a0e]">
                  <div className="text-[9px] text-stone-400">🌾 Erzak</div>
                  <div className="font-mono font-bold text-rose-300 text-xs">{activeDef.grainUpkeepPerHour}/sa</div>
                </div>
              </div>

              {/* Şartlar ve Gereksinim Kontrolü */}
              <div className="p-3 rounded-xl bg-[#140c06] border border-[#442c16] space-y-2">
                <div className="font-serif font-bold text-amber-200 text-xs flex items-center justify-between">
                  <span>Talim & Üretim Şartları</span>
                  <span className="text-[10px] font-mono text-stone-400">
                    Max Eğitilebilir: <strong className="text-emerald-400 text-xs font-bold">{maxTrainable}</strong>
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {/* 1. Bina Şartı */}
                  <div className="flex items-center justify-between p-1.5 rounded bg-black/30 border border-[#2b1b0e]">
                    <div className="flex items-center gap-2">
                      <Hammer className="w-3.5 h-3.5 text-amber-400" />
                      <span>{BUILDINGS[activeBuildingReq]?.name || activeBuildingReq}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>Gereken: Sv.{activeDef.minBuildingLevel}</span>
                      <span>(Mevcut: Sv.{activeBuildingLvl})</span>
                      {isBuildingMet ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-rose-400 font-bold">✗</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Boşta Alp / İşçi Şartı */}
                  <div className="flex items-center justify-between p-1.5 rounded bg-black/30 border border-[#2b1b0e]">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>Boşta Nüfus (Alp)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>Mevcut: <strong className="text-stone-200">{idlePop}</strong></span>
                      <span>İstenen: <strong className="text-amber-300">{safeAmount}</strong></span>
                      {hasEnoughWorkers ? (
                        <span className="text-emerald-400 font-bold">✓</span>
                      ) : (
                        <span className="text-rose-400 font-bold">✗ (Eksik: {safeAmount - idlePop})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bina Yetersizse Uyarı ve Hızlı Yönlendirme */}
                {!isBuildingMet && (
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Bu askeri yetiştirmek için Seviye {activeDef.minBuildingLevel} {BUILDINGS[activeBuildingReq]?.name || activeBuildingReq} gereklidir.</span>
                    </div>
                    <button
                      onClick={() => {
                        onOpenBuilding(activeBuildingReq);
                        setSelectedUnitForTraining(null);
                      }}
                      className="px-2 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-[10px] font-bold shrink-0 transition cursor-pointer"
                    >
                      Binayı Aç →
                    </button>
                  </div>
                )}
              </div>

              {/* Miktar Seçimi ve Ayarlama Bölümü */}
              <div className="p-3 rounded-xl bg-[#140c06] border border-[#442c16] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-amber-200">Eğitilecek Asker Miktarı</span>
                  <span className="text-[10px] font-mono text-stone-400">
                    Süre: <strong className="text-amber-300">{formatDuration(totalDurationSec)}</strong>
                  </span>
                </div>

                {/* Sayı Giriş & Butonları */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTrainAmount(a => Math.max(1, a - 1))}
                    disabled={safeAmount <= 1}
                    className="w-9 h-9 rounded-lg bg-[#2b1a0e] hover:bg-[#3d2514] disabled:opacity-40 disabled:pointer-events-none border border-[#633e1c] flex items-center justify-center text-amber-200 font-bold text-base transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, maxTrainable)}
                    value={trainAmount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTrainAmount(isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    className="flex-1 bg-black/70 border border-[#7a4e22] text-amber-200 font-mono font-bold text-center py-1.5 rounded-lg text-base focus:outline-none focus:border-amber-400"
                  />

                  <button
                    onClick={() => setTrainAmount(a => a + 1)}
                    className="w-9 h-9 rounded-lg bg-[#2b1a0e] hover:bg-[#3d2514] border border-[#633e1c] flex items-center justify-center text-amber-200 font-bold text-base transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Hızlı Miktar Düğmeleri */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 5, 10, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTrainAmount(preset)}
                      className={`py-1 rounded border text-[10px] font-mono font-bold transition cursor-pointer ${
                        trainAmount === preset
                          ? 'bg-amber-600 border-amber-400 text-black shadow'
                          : 'bg-[#1e130a] hover:bg-[#301e10] border-[#523518] text-amber-200'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>

                {/* MAKSİMUM BUTONU */}
                {maxTrainable > 0 && (
                  <button
                    type="button"
                    onClick={() => setTrainAmount(maxTrainable)}
                    className="w-full py-1 rounded border border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-[10px] font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Maksimum Üretim ({maxTrainable} Asker)</span>
                  </button>
                )}
              </div>

              {/* Toplam Hammadde Masrafı Özeti */}
              <div className="p-3 rounded-xl bg-[#120b06] border border-[#3e2716] space-y-1.5">
                <div className="font-serif font-bold text-amber-300/90 text-[11px] flex items-center justify-between">
                  <span>Toplam Hammadde Masrafı</span>
                  <span className="text-[10px] font-mono text-stone-400">1 Asker = {cost.wood}o / {cost.stone}t / {cost.iron}d / {cost.grain}e</span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center">
                  <div className={`p-1 rounded border ${hasEnoughWood ? 'bg-black/30 border-stone-800 text-stone-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <ResourceIcon type="wood" size="xs" />
                    </div>
                    <div className="font-bold">{totalCost.wood}</div>
                  </div>

                  <div className={`p-1 rounded border ${hasEnoughStone ? 'bg-black/30 border-stone-800 text-stone-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <ResourceIcon type="stone" size="xs" />
                    </div>
                    <div className="font-bold">{totalCost.stone}</div>
                  </div>

                  <div className={`p-1 rounded border ${hasEnoughIron ? 'bg-black/30 border-stone-800 text-stone-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <ResourceIcon type="iron" size="xs" />
                    </div>
                    <div className="font-bold">{totalCost.iron}</div>
                  </div>

                  <div className={`p-1 rounded border ${hasEnoughGrain ? 'bg-black/30 border-stone-800 text-stone-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <ResourceIcon type="grain" size="xs" />
                    </div>
                    <div className="font-bold">{totalCost.grain}</div>
                  </div>

                  <div className={`p-1 rounded border ${hasEnoughGold ? 'bg-black/30 border-stone-800 text-stone-300' : 'bg-red-950/40 border-red-800 text-red-300'}`}>
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <ResourceIcon type="gold" size="xs" />
                    </div>
                    <div className="font-bold">{totalCost.gold}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Aksiyon Düğmeleri */}
            <div className="p-4 pt-2 border-t border-amber-900/40 flex items-center gap-2 bg-[#120b06]">
              {canExecuteTraining ? (
                <button
                  type="button"
                  onClick={handleExecuteTrain}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-black font-serif font-black text-sm tracking-wide shadow-[0_4px_15px_rgba(217,119,6,0.4)] border border-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Swords className="w-4 h-4 text-black" />
                  <span>{safeAmount}x {activeDef.name} Eğit ({formatDuration(totalDurationSec)})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenBuilding(activeBuildingReq);
                    setSelectedUnitForTraining(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#382010] to-[#25150a] hover:from-[#482b18] hover:to-[#331c0e] text-amber-200 font-serif font-bold text-xs border border-[#7a4e22] flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Hammer className="w-4 h-4 text-amber-400" />
                  <span>
                    {!isBuildingMet 
                      ? `${BUILDINGS[activeBuildingReq]?.name || 'Kışla'} İnşa Et / Seviye Yükselt` 
                      : !hasEnoughWorkers 
                      ? 'Yetersiz Boşta Alp (Kışlayı Aç)' 
                      : 'Yetersiz Hammadde (Kışlayı Aç)'
                    }
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedUnitForTraining(null)}
                className="px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white font-serif text-xs transition cursor-pointer"
              >
                Vazgeç
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
