import React, { useState } from 'react';
import { 
  KhanHero,
  March, 
  MarchMission, 
  UnitType, 
  Village,
  StationedSupportArmy
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
  Clock, 
  MapPin, 
  Users, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  Compass, 
  Flame, 
  Shield, 
  Scroll, 
  Crown,
  HeartCrack,
  Wheat,
  ShieldCheck,
  Hammer,
  HelpCircle
} from 'lucide-react';

interface MilitaryPanelProps {
  village: Village;
  khan?: KhanHero;
  activeMarches: March[];
  rivalVillages: Village[];
  playerVillages?: Village[];
  prefilledTarget: { village: Village | null; coords: { x: number; y: number } } | null;
  onDispatchMarch: (
    targetCoords: { x: number; y: number },
    targetName: string,
    mission: MarchMission,
    units: Partial<Record<UnitType, number>>,
    withKhan: boolean
  ) => void;
  onRecallSupport?: (supportArmyId: string) => void;
}

export const MilitaryPanel: React.FC<MilitaryPanelProps> = ({
  village,
  khan,
  activeMarches,
  rivalVillages,
  playerVillages = [],
  prefilledTarget,
  onDispatchMarch,
  onRecallSupport,
}) => {
  const [targetX, setTargetX] = useState<number>(prefilledTarget ? prefilledTarget.coords.x : 48);
  const [targetY, setTargetY] = useState<number>(prefilledTarget ? prefilledTarget.coords.y : 42);
  const [targetName, setTargetName] = useState<string>(
    prefilledTarget?.village?.name || 'Hedef Koordinat'
  );
  const [mission, setMission] = useState<MarchMission>('attack');
  const [selectedUnits, setSelectedUnits] = useState<Partial<Record<UnitType, number>>>({});
  const [sendKhan, setSendKhan] = useState<boolean>(false);

  const faction = FACTIONS[village.faction];

  // Mesafe ve Sefer Hızı Hesaplama
  const distance = calculateDistance(village.x, village.y, targetX, targetY);

  // Seçilen en yavaş birliğin hızı (tiles per min)
  let slowestSpeed = 999;
  let slowestSpeedScore = 100;
  let totalSelectedTroops = 0;
  let totalAttackPower = 0;
  let totalLootCapacity = 0;

  for (const [uKey, countVal] of Object.entries(selectedUnits)) {
    const count = Number(countVal) || 0;
    if (count <= 0) continue;
    const uDef = UNITS[uKey as UnitType];
    if (!uDef) continue;
    totalSelectedTroops += count;

    // Demirci Talimi Bonusu (+%1 / seviye)
    const forgeAtkLevel = Math.min(20, Math.max(0, village.unitUpgrades?.[uKey as UnitType]?.attackLevel || 0));
    const effectiveAtk = uDef.attackPower * (1.0 + forgeAtkLevel / 100);
    totalAttackPower += effectiveAtk * count;
    
    let unitCap = uDef.lootCapacity;
    if (village.faction === 'osmanogullari') {
      unitCap *= 1.20;
    }
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
  
  if (sendKhan && khan) {
    slowestSpeed *= (1.0 + (khan.skills.cavalrySpeed * 2.0) / 100);
    totalAttackPower *= (1.0 + (khan.skills.attackAura * 1.5) / 100);
  }

  // Sefer süresi (saniye)
  const durationSec = Math.max(8, Math.round((distance / slowestSpeed) * 60));

  const handleUnitChange = (uType: UnitType, val: number) => {
    const maxAvailable = village.units[uType] || 0;
    const clamped = Math.max(0, Math.min(maxAvailable, val));
    setSelectedUnits(prev => ({
      ...prev,
      [uType]: clamped,
    }));
  };

  const handleSelectAll = (uType: UnitType) => {
    const maxAvailable = village.units[uType] || 0;
    setSelectedUnits(prev => ({
      ...prev,
      [uType]: maxAvailable,
    }));
  };

  const handleClearAll = () => {
    setSelectedUnits({});
    setSendKhan(false);
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSelectedTroops <= 0) return;

    onDispatchMarch(
      { x: targetX, y: targetY },
      targetName,
      mission,
      selectedUnits,
      sendKhan
    );

    setSelectedUnits({});
    setSendKhan(false);
  };

  // Konuşlanmış destek birlikleri özeti
  const stationedArmies = village.stationedSupport || [];
  let totalStationedTroops = 0;
  stationedArmies.forEach(army => {
    Object.values(army.units).forEach(c => totalStationedTroops += (Number(c) || 0));
  });

  return (
    <div className="space-y-5">
      
      {/* 1. Üst Kısım: Canlı Seferler & Askeri İntikaller */}
      <div className="bg-gradient-to-b from-[#24170d] via-[#1a1008] to-[#120a05] border-3 border-[#6f4e28] rounded-2xl p-4 sm:p-5 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.12)] text-[#eddcc4]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#523d26] mb-3.5 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#5a3b1d] to-[#2c1a0c] border border-[#d4af37] flex items-center justify-center shadow">
              <Swords className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#fef08a] font-serif flex items-center gap-2 drop-shadow">
                Aktif Seferler ve Askeri İntikaller ({activeMarches.length})
              </h3>
              <p className="text-[11px] text-[#bda688] font-serif">
                Sefere çıkan beylik ordularının intikal güzergâhı ve dönüş fermanları.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#0c0703] border border-[#4a331c] text-[#d4af37] self-start sm:self-auto shadow-inner">
            {activeMarches.length === 0 ? 'Yolda ordu yok' : `${activeMarches.length} ordu seferde`}
          </span>
        </div>

        {activeMarches.length > 0 ? (
          <div className="space-y-3">
            {activeMarches.map(march => {
              const now = Date.now();
              const isReturning = march.isReturning;
              const targetTime = march.arrivalTime;
              const remSec = Math.max(0, Math.ceil((targetTime - now) / 1000));
              const progressPct = Math.min(100, Math.max(0, ((march.durationSec - remSec) / march.durationSec) * 100));

              const getMissionBadge = () => {
                if (isReturning) {
                  return { label: '🛡️ DÖNÜŞ YOLUNDA', style: 'bg-[#1e3a8a] border-[#60a5fa] text-[#dbeafe]' };
                }
                switch(march.mission) {
                  case 'attack':
                    return { label: '⚔️ TAARRUZ İNTİKALİ', style: 'bg-[#7f1d1d] border-[#ef4444] text-[#fee2e2]' };
                  case 'raid':
                    return { label: '🏇 YAĞMA AKINI', style: 'bg-[#b45309] border-[#f59e0b] text-[#fef3c7]' };
                  case 'support':
                    return { label: '🛡️ DESTEK İNTİKALİ', style: 'bg-[#1e3a8a] border-[#60a5fa] text-[#dbeafe]' };
                  case 'spy':
                    return { label: '👁️ CASUSLUK', style: 'bg-[#3b0764] border-[#c084fc] text-[#f3e8ff]' };
                  default:
                    return { label: '⚔️ SEFER İNTİKALİ', style: 'bg-[#b45309] border-[#f59e0b] text-[#fef3c7]' };
                }
              };
              const badge = getMissionBadge() || { label: '⚔️ SEFER İNTİKALİ', style: 'bg-[#b45309] border-[#f59e0b] text-[#fef3c7]' };

              return (
                <div 
                  key={march.id} 
                  className="bg-gradient-to-b from-[#2a1a0f] via-[#1a1008] to-[#120a05] p-3.5 rounded-xl border-2 border-[#6f4e28] space-y-2.5 text-xs shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-serif font-black tracking-wider flex items-center gap-1 shadow-sm border ${badge?.style || 'bg-[#b45309] border-[#f59e0b] text-[#fef3c7]'}`}>
                        {badge?.label || 'SEFER'}
                      </span>
                      <span className="text-[#fef08a] font-serif font-bold text-sm drop-shadow">{march.targetName}</span>
                      <span className="text-[#bda688] font-mono text-[11px] bg-[#0c0703] px-2 py-0.5 rounded border border-[#3d2714]">
                        ({march.targetCoordinates.x} | {march.targetCoordinates.y})
                      </span>
                    </div>

                    <span className="font-mono text-amber-300 font-black text-xs flex items-center gap-1.5 bg-[#0c0703] px-2.5 py-1 rounded-lg border border-[#523d26] shadow-inner self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Kalan Vakit: {remSec} sn</span>
                    </span>
                  </div>

                  <div className="w-full bg-[#0c0703] h-2.5 rounded-full overflow-hidden border border-[#3d2714] shadow-inner p-[1px]">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] ${
                        isReturning 
                          ? 'bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa]' 
                          : 'bg-gradient-to-r from-[#b45309] via-[#ea580c] to-[#f59e0b]'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#decab0] pt-1.5 border-t border-[#422d1a] font-serif">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-[#fef08a] mr-1">Birlikler:</span>
                      {Object.entries(march.units).map(([uKey, count]) => {
                        if (!count) return null;
                        return (
                          <span key={uKey} className="bg-[#120a05] px-2 py-0.5 rounded-lg border border-[#523d26] font-mono text-xs flex items-center gap-1.5 shadow-sm text-[#eddcc4]">
                            <UnitPortrait unitId={uKey as UnitType} size="xs" />
                            <span>{count}x {UNITS[uKey as UnitType]?.name || uKey}</span>
                          </span>
                        );
                      })}
                    </div>

                    {isReturning && (
                      <div className="flex items-center gap-2">
                        {march.capturedVillagers && march.capturedVillagers > 0 && (
                          <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-600 font-mono text-xs font-bold">
                            ⛓️ {march.capturedVillagers} Esir Köylü
                          </span>
                        )}
                        {march.capturedHorses && march.capturedHorses > 0 && (
                          <span className="bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-600 font-mono text-xs font-bold">
                            🐎 {march.capturedHorses} At
                          </span>
                        )}
                        {march.loot && (
                          <div className="text-emerald-300 font-mono text-xs font-bold bg-[#0c1f13] px-2 py-0.5 rounded border border-[#166534] shadow-inner">
                            Ganimet: {Object.entries(march.loot).map(([k, v]) => v ? `${v} ${k} ` : '').join('')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-5 text-center text-[#9c8265] italic text-xs font-serif bg-[#100904] rounded-xl border border-[#3d2714]">
            Şu anda intikal halinde olan bir ordu bulunmuyor.
          </div>
        )}
      </div>

      {/* 2. Köyde Konuşlanmış Destek Orduları (Misafir Garnizon & Tahıl Tüketimi) */}
      {stationedArmies.length > 0 && (
        <div className="bg-gradient-to-b from-[#1b1c2b] via-[#131422] to-[#0c0d17] border-3 border-[#3b4770] rounded-2xl p-4 sm:p-5 shadow-xl text-[#d4daf0]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#2b3558] mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-blue-200 font-serif">
                  Köyde Konuşlanmış Destek Orduları ({totalStationedTroops} Asker)
                </h3>
                <p className="text-[11px] text-blue-300/80">
                  Bu köyün savunmasına katılan dost birlikler. Köyün tahıl ambarını tüketirler (Asker başı 1 tahıl/saat).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono bg-[#090b14] px-3 py-1 rounded-lg border border-[#3b4770] text-amber-300">
              <Wheat className="w-3.5 h-3.5 text-amber-400" />
              <span>Tüketim: -{totalStationedTroops} tahıl/saat</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {stationedArmies.map(army => {
              let armyCount = 0;
              Object.values(army.units).forEach(c => armyCount += (Number(c) || 0));

              return (
                <div key={army.id} className="bg-[#0e101c] p-3 rounded-xl border border-[#2b3558] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-blue-100 font-serif flex items-center gap-2">
                      <span>{army.originVillageName}</span>
                      <span className="text-xs text-blue-300/70 font-sans font-normal">({army.originOwnerName})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {Object.entries(army.units).map(([uKey, count]) => {
                        if (!count) return null;
                        return (
                          <span key={uKey} className="text-xs bg-[#171b30] px-2 py-0.5 rounded border border-[#2e375d] font-mono text-blue-200">
                            {count}x {UNITS[uKey as UnitType]?.name || uKey}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {onRecallSupport && (
                    <button
                      type="button"
                      onClick={() => onRecallSupport(army.id)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-blue-100 border border-blue-500/50 rounded-lg text-xs font-serif font-bold transition shadow-sm cursor-pointer shrink-0"
                    >
                      Birlikleri Geri Çağır
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Sefer Düzenleme & Hedef Tayini (War Room) */}
      <div className="bg-gradient-to-b from-[#20140b] via-[#170e07] to-[#100904] border-4 border-[#7a552b] rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.15)] text-[#eddcc4]">
        <div className="pb-3 border-b-2 border-[#5c3e1e] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {faction?.flagImage ? (
              <div className="w-10 h-7 rounded-lg overflow-hidden border-2 border-[#caa05a] shadow-md bg-black/60 shrink-0">
                <img 
                  src={faction.flagImage} 
                  alt={`${faction.name} Bayrağı`} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-[#6b4724] to-[#3a2512] border border-[#d4af37] flex items-center justify-center shadow">
                <Compass className="w-4 h-4 text-amber-300" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-[#fef08a] font-serif flex items-center gap-2 drop-shadow">
                Harp Divanı: {faction?.name ? `${faction.name} Seferi` : 'Sefer Fermanı & Ordu Teşkilatı'}
              </h3>
              <p className="text-xs text-[#bda688] font-serif">
                Kadim Türkmen harp nizamına uygun sefer amacını seçin, ordunuzu düzenleyip yola çıkarın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-1 bg-[#120a05] hover:bg-[#2e1c10] border border-[#694825] hover:border-[#caa05a] rounded-lg text-xs text-[#decab0] hover:text-[#fef08a] transition cursor-pointer self-start sm:self-auto font-serif font-bold shadow-sm"
          >
            Seçimleri Sıfırla
          </button>
        </div>

        <form onSubmit={handleDispatch} className="space-y-4">
          
          {/* Sefer Türü 4 Butonlu Seçici (Harp Standartları) */}
          <div>
            <label className="text-xs font-bold text-amber-200 block mb-2 font-serif flex items-center gap-1.5">
              <Scroll className="w-4 h-4 text-amber-400" />
              <span>Sefer Türü (Harp Nizamı)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              
              {/* 1. Normal Taarruz */}
              <button
                type="button"
                onClick={() => setMission('attack')}
                className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'attack'
                    ? 'bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-red-400" />
                      Normal Taarruz
                    </span>
                    {mission === 'attack' && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Tam imha savaşı. Mancınık ve Top ile Sur & Zafer binaları yıkılır (Maks 2 bina).
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-red-300">
                  ⚔️ Biri tamamen yok olana kadar
                </div>
              </button>

              {/* 2. Yağma Seferi */}
              <button
                type="button"
                onClick={() => setMission('raid')}
                className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'raid'
                    ? 'bg-gradient-to-b from-[#9a3412] to-[#431407] border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Yağma Seferi
                    </span>
                    {mission === 'raid' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Kısmi zayiat, +%5 savunma bonusu. 10 askere 1 esir köylü, 50 askere 1 at kaçırır.
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-amber-300">
                  🛡️ 1 Saat Yağma Koruması
                </div>
              </button>

              {/* 3. Destek Seferi */}
              <button
                type="button"
                onClick={() => setMission('support')}
                className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'support'
                    ? 'bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      Destek Seferi
                    </span>
                    {mission === 'support' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Hedef köye konuşlanıp savunur. Gittiği köyün ambarından tahıl tüketir (1 tahıl/saat).
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-blue-300">
                  ⚠️ Tahıl 0 ise ilk destekler ölür
                </div>
              </button>

              {/* 4. Casusluk */}
              <button
                type="button"
                onClick={() => setMission('spy')}
                className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                  mission === 'spy'
                    ? 'bg-gradient-to-b from-[#581c87] to-[#2e1065] border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-purple-400" />
                      Casusluk
                    </span>
                    {mission === 'spy' && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Gizli keşif; hedef köyün garnizon, hammadde ve sur seviyelerini saptar.
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-purple-300">
                  🔍 Yalnızca Casus birliği gider
                </div>
              </button>

            </div>
          </div>

          {/* Hedef Koordinatlar ve Bölge Adı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-[#140c06] p-3.5 rounded-xl border-2 border-[#523d26] shadow-inner">
            <div>
              <label className="text-[11px] text-[#decab0] block mb-1 font-serif font-bold tracking-wide flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Hedef Koordinatlar (X | Y)</span>
              </label>
              <div className="flex items-center gap-1.5 bg-[#0a0502] px-2.5 py-1.5 rounded-lg border-2 border-[#5a3e20] shadow-inner">
                <span className="text-[#a89070] font-mono font-bold text-xs">X:</span>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={targetX}
                  onChange={(e) => setTargetX(parseInt(e.target.value) || 0)}
                  className="w-16 bg-transparent text-[#fde047] font-mono font-black outline-none text-center text-xs"
                />
                <span className="text-[#5a3e20]">|</span>
                <span className="text-[#a89070] font-mono font-bold text-xs">Y:</span>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={targetY}
                  onChange={(e) => setTargetY(parseInt(e.target.value) || 0)}
                  className="w-16 bg-transparent text-[#fde047] font-mono font-black outline-none text-center text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#decab0] block mb-1 font-serif font-bold tracking-wide flex items-center gap-1">
                <Scroll className="w-3.5 h-3.5 text-amber-400" />
                <span>Hedef Otağ / Bölge Adı</span>
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Örn: Karahisar Kalesi"
                className="w-full bg-[#0a0502] border-2 border-[#5a3e20] rounded-lg px-2.5 py-1.5 text-xs text-[#fef08a] font-serif font-bold outline-none focus:border-[#caa05a] shadow-inner"
              />
            </div>
          </div>

          {/* Hakan / Han Seçimi */}
          {khan && khan.currentVillageId === village.id && khan.status === 'idle' && (
            <div className="bg-gradient-to-r from-[#2a110a] to-[#160804] p-3.5 rounded-xl border-[3px] border-[#8b3117] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5),0_4px_15px_rgba(139,49,23,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 mb-3 relative overflow-hidden">
              <div className="flex items-center gap-3 relative z-10 mb-3 sm:mb-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#78350f] via-[#451a03] to-[#270e01] border-2 border-[#fcd34d] flex items-center justify-center shadow-lg relative">
                  <Crown className="w-5 h-5 text-[#fef08a]" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#991b1b] rounded-full border border-[#fcd34d] flex items-center justify-center shadow-md">
                    <span className="text-[9px] font-bold text-white">{khan.level}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#fef08a] font-serif flex items-center gap-2 drop-shadow">
                    {khan.name}
                  </h4>
                  <p className="text-[10px] text-[#decab0] font-mono mt-0.5">
                    Hücum Sancağı: <span className="text-red-400 font-bold">+{(khan.skills.attackAura * 1.5).toFixed(1)}%</span> • Süvari Hızı: <span className="text-blue-400 font-bold">+{(khan.skills.cavalrySpeed * 2.0).toFixed(1)}%</span>
                  </p>
                </div>
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border-2 border-[#f59e0b] px-3.5 py-1.5 rounded-lg hover:from-[#991b1b] hover:to-[#570f0f] transition shadow-md relative z-10 w-full sm:w-auto justify-center sm:justify-start">
                <input 
                  type="checkbox" 
                  checked={sendKhan}
                  onChange={(e) => setSendKhan(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-[#fef08a] font-serif uppercase tracking-wider">Hakan Ordunun Başında Gitsin</span>
              </label>
            </div>
          )}

          {/* 4. Garnizon Birlikleri Seçim Masası (Garrison Troop Trays) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#fef08a] font-serif font-bold flex items-center gap-1.5 drop-shadow">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Garnizondaki Mevcut Birlikler & Demirci Talimleri</span>
              </label>
              <span className="text-[11px] font-serif text-[#a89070]">
                Görevlendirilen Birlik: <strong className="text-amber-300 font-mono">{totalSelectedTroops}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(village.units).map(([uKey, countVal]) => {
                const count = Number(countVal) || 0;
                if (count <= 0) return null;
                const uDef = UNITS[uKey as UnitType];
                if (!uDef) return null;
                const selected = selectedUnits[uKey as UnitType] || 0;

                // Demirci Seviyeleri
                const upgradeAtk = village.unitUpgrades?.[uKey as UnitType]?.attackLevel || 0;
                const upgradeDef = village.unitUpgrades?.[uKey as UnitType]?.defenseLevel || 0;

                return (
                  <div 
                    key={uKey}
                    className="p-3 bg-gradient-to-b from-[#1b120a] to-[#0e0804] rounded-xl border-2 border-[#4a331c] hover:border-[#caa05a] flex flex-col justify-between transition shadow-md group"
                  >
                    <div className="flex gap-2.5 items-center">
                      <div className="shrink-0 border-2 border-[#a67c48] rounded-lg p-0.5 bg-[#080402] shadow-inner">
                        <UnitPortrait unitId={uKey as UnitType} size="sm" showModalOnClick={true} />
                      </div>
                      <div className="flex-1 min-w-0 font-serif">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-[#eddcc4] text-xs truncate group-hover:text-[#fef08a] transition">{uDef.name}</span>
                          <span className="text-[11px] text-amber-300 font-mono font-black ml-1 bg-[#100804] px-1.5 py-0.2 rounded border border-[#523d26]">x{count}</span>
                        </div>
                        <div className="text-[10px] text-[#a89070] font-mono space-y-0.5 mt-0.5">
                          <div className="flex items-center justify-between">
                            <span>Sal: <strong className="text-red-400 font-bold">{uDef.attackPower}</strong></span>
                            <span>Sav: <strong className="text-blue-400 font-bold">{uDef.defenseInfantry}P/{uDef.defenseCavalry}S</strong></span>
                          </div>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-amber-300 font-bold">⚡ {uDef.speedScore ?? 50}/100</span>
                            <span className="text-yellow-400 font-bold">💰 {uDef.plunderScore ?? 50}/100</span>
                          </div>
                        </div>
                        {(upgradeAtk > 0 || upgradeDef > 0) && (
                          <div className="text-[9px] text-amber-400/90 font-mono mt-0.5 flex gap-2">
                            <span>⚒️ Talim:</span>
                            {upgradeAtk > 0 && <span className="text-red-300 font-bold">+{upgradeAtk}% Atk</span>}
                            {upgradeDef > 0 && <span className="text-blue-300 font-bold">+{upgradeDef}% Def</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[#382312]">
                      <input
                        type="number"
                        min={0}
                        max={count}
                        value={selected}
                        onChange={(e) => handleUnitChange(uKey as UnitType, parseInt(e.target.value) || 0)}
                        className="w-20 bg-[#080402] border border-[#6b4724] rounded-md px-2 py-1 text-center font-mono font-black text-xs text-[#fde047] shadow-inner outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectAll(uKey as UnitType)}
                        className="flex-1 py-1 bg-[#382312] hover:bg-[#523319] text-[#fcd34d] hover:text-[#fff6e0] border border-[#caa05a] rounded-md text-[10px] font-serif font-black transition cursor-pointer shadow active:scale-95 text-center"
                      >
                        Tümünü Görevlendir
                      </button>
                    </div>
                  </div>
                );
              })}

              {Object.values(village.units).every(c => !c || Number(c) <= 0) && (
                <div className="col-span-full py-6 text-center text-[#9c8265] italic text-xs font-serif bg-[#100904] rounded-xl border border-[#422d1a]">
                  Köyünüzde sefere gönderecek asker bulunmuyor. Önce Kışla veya Ahır'dan ordu eğitin.
                </div>
              )}
            </div>
          </div>

          {/* 5. Harp Meclisi Sefer Özeti & Ferman Onayı */}
          <div className="bg-gradient-to-r from-[#180e07] via-[#100804] to-[#180e07] p-3 sm:p-4 rounded-xl border-2 border-[#8a6538] flex flex-col lg:flex-row items-center justify-between gap-4 text-xs shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 w-full lg:w-auto font-mono text-xs">
              <div className="bg-[#0c0703] p-2 sm:p-2.5 rounded-lg border border-[#523d26] text-center shadow-inner min-w-0">
                <span className="text-[10px] text-[#a89070] font-serif block truncate">Mesafe</span>
                <strong className="text-[#fef08a] font-black text-xs sm:text-sm block truncate">{distance.toFixed(1)} kare</strong>
              </div>
              <div className="bg-[#0c0703] p-2 sm:p-2.5 rounded-lg border border-[#523d26] text-center shadow-inner min-w-0">
                <span className="text-[10px] text-[#a89070] font-serif block truncate">İntikal Süresi</span>
                <strong className="text-amber-300 font-black text-xs sm:text-sm block truncate">{durationSec} saniye</strong>
              </div>
              <div className="bg-[#0c0703] p-2 sm:p-2.5 rounded-lg border border-[#523d26] text-center shadow-inner min-w-0">
                <span className="text-[10px] text-[#a89070] font-serif block truncate">Ordu Hızı</span>
                <strong className="text-amber-400 font-black text-xs sm:text-sm block truncate">{totalSelectedTroops > 0 ? slowestSpeedScore : '-'}/100</strong>
              </div>
              <div className="bg-[#0c0703] p-2 sm:p-2.5 rounded-lg border border-[#523d26] text-center shadow-inner min-w-0">
                <span className="text-[10px] text-[#a89070] font-serif block truncate">Toplam Taarruz</span>
                <strong className="text-red-400 font-black text-xs sm:text-sm block truncate">{Math.round(totalAttackPower).toLocaleString()}</strong>
              </div>
              <div className="bg-[#0c0703] p-2 sm:p-2.5 rounded-lg border border-[#523d26] text-center shadow-inner min-w-0">
                <span className="text-[10px] text-[#a89070] font-serif block truncate">Ganimet Kapasitesi</span>
                <strong className="text-emerald-400 font-black text-xs sm:text-sm block truncate">{totalLootCapacity.toLocaleString()}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={totalSelectedTroops <= 0}
              className="w-full lg:w-auto bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] hover:from-[#b91c1c] hover:to-[#dc2626] disabled:from-[#2e1d13] disabled:to-[#170e09] disabled:text-[#6e543e] disabled:border-[#422d1a] disabled:cursor-not-allowed text-[#fff7e6] font-serif font-black tracking-widest text-xs sm:text-sm py-3 px-6 sm:px-7 rounded-xl border-2 border-[#f59e0b] shadow-[0_8px_25px_rgba(185,28,28,0.6)] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2.5 shrink-0"
            >
              <Swords className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">ORDUYU YOLA ÇIKAR ({totalSelectedTroops} Birlik)</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};
