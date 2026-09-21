import React, { useState, useMemo } from 'react';
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
  RotateCcw, 
  Eye, 
  Compass, 
  Flame, 
  Shield, 
  Scroll, 
  Crown,
  Wheat,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Sparkles,
  Target,
  ArrowUpRight,
  Boxes,
  Percent
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
  // Aktif Sekme: 'dispatch' (Sefer Fermanı) | 'marches' (Canlı İntikaller) | 'stationed' (Destekler) | 'guide' (Rehber)
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'marches' | 'stationed' | 'guide'>('dispatch');

  // Hedef Bilgileri
  const [targetX, setTargetX] = useState<number>(prefilledTarget ? prefilledTarget.coords.x : (rivalVillages[0]?.x ?? 48));
  const [targetY, setTargetY] = useState<number>(prefilledTarget ? prefilledTarget.coords.y : (rivalVillages[0]?.y ?? 42));
  const [targetName, setTargetName] = useState<string>(
    prefilledTarget?.village?.name || (rivalVillages[0]?.name ?? 'Hedef Bölge')
  );
  const [mission, setMission] = useState<MarchMission>('attack');
  const [selectedUnits, setSelectedUnits] = useState<Partial<Record<UnitType, number>>>({});
  const [sendKhan, setSendKhan] = useState<boolean>(false);
  const [showQuickTargets, setShowQuickTargets] = useState<boolean>(false);

  const faction = FACTIONS[village.faction];

  // Mesafe ve Sefer Hızı Hesaplama
  const distance = useMemo(() => {
    return calculateDistance(village.x, village.y, targetX, targetY);
  }, [village.x, village.y, targetX, targetY]);

  // Yakın Hedefler Listesi (Mesafeye Göre Sıralı)
  const quickTargetList = useMemo(() => {
    const list: { id: string; name: string; x: number; y: number; type: 'player' | 'rival'; dist: number; factionName: string }[] = [];
    
    // Diğer Kendi Köylerim
    playerVillages.forEach(v => {
      if (v.id !== village.id) {
        list.push({
          id: v.id,
          name: v.name,
          x: v.x,
          y: v.y,
          type: 'player',
          dist: calculateDistance(village.x, village.y, v.x, v.y),
          factionName: 'Kendi Otağım'
        });
      }
    });

    // Rakip / Komşu Köyler
    rivalVillages.forEach(r => {
      list.push({
        id: r.id,
        name: r.name,
        x: r.x,
        y: r.y,
        type: 'rival',
        dist: calculateDistance(village.x, village.y, r.x, r.y),
        factionName: FACTIONS[r.faction]?.name || 'Beylik'
      });
    });

    return list.sort((a, b) => a.dist - b.dist);
  }, [playerVillages, rivalVillages, village.id, village.x, village.y]);

  // Seçilen Birliklerin Dinamik İstatistikleri
  const {
    totalSelectedTroops,
    totalAttackPower,
    totalInfantryDef,
    totalCavalryDef,
    totalLootCapacity,
    slowestSpeed,
    slowestSpeedScore,
    hourlyGrainConsumption
  } = useMemo(() => {
    let troops = 0;
    let atk = 0;
    let infDef = 0;
    let cavDef = 0;
    let loot = 0;
    let minSpeed = 999;
    let minSpeedScore = 100;
    let grain = 0;

    for (const [uKey, countVal] of Object.entries(selectedUnits)) {
      const count = Number(countVal) || 0;
      if (count <= 0) continue;
      const uDef = UNITS[uKey as UnitType];
      if (!uDef) continue;
      
      troops += count;

      // Demirci Talimi Bonusu (+%1 / seviye)
      const forgeAtkLevel = Math.min(20, Math.max(0, village.unitUpgrades?.[uKey as UnitType]?.attackLevel || 0));
      const forgeDefLevel = Math.min(20, Math.max(0, village.unitUpgrades?.[uKey as UnitType]?.defenseLevel || 0));

      const effectiveAtk = uDef.attackPower * (1.0 + forgeAtkLevel / 100);
      const effectiveInfDef = uDef.defenseInfantry * (1.0 + forgeDefLevel / 100);
      const effectiveCavDef = uDef.defenseCavalry * (1.0 + forgeDefLevel / 100);

      atk += effectiveAtk * count;
      infDef += effectiveInfDef * count;
      cavDef += effectiveCavDef * count;
      grain += (uDef.grainUpkeepPerHour || 1) * count;

      let unitCap = uDef.lootCapacity;
      if (village.faction === 'osmanogullari') {
        unitCap *= 1.20;
      }
      loot += count * unitCap;

      if (uDef.speedTilesPerMin < minSpeed) {
        minSpeed = uDef.speedTilesPerMin;
        minSpeedScore = uDef.speedScore ?? 50;
      }
    }

    if (minSpeed === 999) {
      minSpeed = 2.0;
      minSpeedScore = 50;
    }

    if (sendKhan && khan) {
      minSpeed *= (1.0 + (khan.skills.cavalrySpeed * 2.0) / 100);
      atk *= (1.0 + (khan.skills.attackAura * 1.5) / 100);
    }

    return {
      totalSelectedTroops: troops,
      totalAttackPower: atk,
      totalInfantryDef: infDef,
      totalCavalryDef: cavDef,
      totalLootCapacity: loot,
      slowestSpeed: minSpeed,
      slowestSpeedScore: minSpeedScore,
      hourlyGrainConsumption: grain
    };
  }, [selectedUnits, village.unitUpgrades, village.faction, sendKhan, khan]);

  // Sefer süresi (100x Hızlandırma ile saniye)
  const durationSec = Math.max(2, Math.round(((distance / slowestSpeed) * 60) / 100));

  // Birlik Değiştirme
  const handleUnitChange = (uType: UnitType, val: number) => {
    const maxAvailable = village.units[uType] || 0;
    const clamped = Math.max(0, Math.min(maxAvailable, val));
    setSelectedUnits(prev => ({
      ...prev,
      [uType]: clamped,
    }));
  };

  // Tekil Birlik Yüzdesi Seçme
  const handleUnitPercentage = (uType: UnitType, pct: number) => {
    const maxAvailable = village.units[uType] || 0;
    const count = Math.floor(maxAvailable * pct);
    handleUnitChange(uType, count);
  };

  // Hızlı Seçim Ön Tanımları (One-Click Presets)
  const handleSelectPreset = (preset: 'all' | 'attack' | 'raid' | 'defense' | 'half' | 'clear') => {
    if (preset === 'clear') {
      setSelectedUnits({});
      setSendKhan(false);
      return;
    }

    const next: Partial<Record<UnitType, number>> = {};

    Object.entries(village.units).forEach(([uKey, countVal]) => {
      const count = Number(countVal) || 0;
      if (count <= 0) return;
      const uDef = UNITS[uKey as UnitType];
      if (!uDef) return;

      if (preset === 'all') {
        next[uKey as UnitType] = count;
      } else if (preset === 'half') {
        next[uKey as UnitType] = Math.ceil(count * 0.5);
      } else if (preset === 'attack') {
        // Taarruz Birlikleri: Saldırı gücü savunmasından yüksek olanlar veya kuşatma
        if (uDef.attackPower >= uDef.defenseInfantry || uDef.category === 'kusatma') {
          next[uKey as UnitType] = count;
        }
      } else if (preset === 'raid') {
        // Hızlı Süvari ve Yüksek Ganimet Birlikleri
        if (uDef.category === 'suvari' || (uDef.plunderScore && uDef.plunderScore >= 60)) {
          next[uKey as UnitType] = count;
        }
      } else if (preset === 'defense') {
        // Savunma Ağırlıklı Birlikler
        if (uDef.defenseInfantry > uDef.attackPower || uDef.defenseCavalry > uDef.attackPower) {
          next[uKey as UnitType] = count;
        }
      }
    });

    setSelectedUnits(next);
  };

  // Sefer Gönderme
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
    setActiveSubTab('marches');
  };

  // Konuşlanmış destek birlikleri
  const stationedArmies = village.stationedSupport || [];
  let totalStationedTroops = 0;
  stationedArmies.forEach(army => {
    Object.values(army.units).forEach(c => totalStationedTroops += (Number(c) || 0));
  });

  return (
    <div id="military-command-panel" className="max-w-6xl mx-auto space-y-4 pb-20 select-none text-[#eedec9]">
      
      {/* 1. ÜST SEKME & KONTROL MERKEZİ */}
      <div className="bg-gradient-to-b from-[#2b180d] via-[#1a0f07] to-[#110904] border-2 border-[#80592f] rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Başlık & İntikal Rozeti */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#6b4724] to-[#2c1a0c] border border-[#f59e0b] flex items-center justify-center shadow-lg shrink-0">
            <Swords className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-black text-[#fef08a] drop-shadow">
                Ordu Komutanlığı & Harp Divanı
              </h2>
              {activeMarches.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-900/80 border border-amber-500 text-amber-200 animate-pulse">
                  {activeMarches.length} Seferde
                </span>
              )}
            </div>
            <p className="text-xs text-[#bda688] font-serif">
              {village.name} garnizonunu sevk ve idare edin, beylik sınırlarını koruyun ve akınlar düzenleyin.
            </p>
          </div>
        </div>

        {/* Sekme Butonları */}
        <div className="flex items-center gap-1.5 bg-[#0d0704] p-1 rounded-xl border border-[#4a331c] self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveSubTab('dispatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'dispatch'
                ? 'bg-gradient-to-b from-[#85531d] to-[#4e2f0d] text-amber-100 border border-amber-400 shadow'
                : 'text-[#a89070] hover:text-[#fef08a] hover:bg-[#1a1008]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Sefer Fermanı</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('marches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'marches'
                ? 'bg-gradient-to-b from-[#85531d] to-[#4e2f0d] text-amber-100 border border-amber-400 shadow'
                : 'text-[#a89070] hover:text-[#fef08a] hover:bg-[#1a1008]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>İntikaller ({activeMarches.length})</span>
          </button>

          {stationedArmies.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveSubTab('stationed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeSubTab === 'stationed'
                  ? 'bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] text-blue-100 border border-blue-400 shadow'
                  : 'text-[#a89070] hover:text-[#93c5fd] hover:bg-[#1a1008]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Dost Destekler ({totalStationedTroops})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSubTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'guide'
                ? 'bg-gradient-to-b from-[#85531d] to-[#4e2f0d] text-amber-100 border border-amber-400 shadow'
                : 'text-[#a89070] hover:text-[#fef08a] hover:bg-[#1a1008]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Harp Nizamı</span>
          </button>
        </div>
      </div>

      {/* 2. CANLI İNTİKALLER HIZLI ŞERİDİ (Her ekranda küçük özet) */}
      {activeSubTab === 'dispatch' && activeMarches.length > 0 && (
        <div className="bg-[#170e08] border border-[#5a3a20] rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="font-bold text-amber-300 font-serif shrink-0 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Yoldaki Ordular:</span>
            </span>
            {activeMarches.slice(0, 3).map(m => {
              const rem = Math.max(0, Math.ceil((m.arrivalTime - Date.now()) / 1000));
              return (
                <div key={m.id} className="bg-[#0b0502] px-2.5 py-1 rounded-lg border border-[#3d2714] font-mono text-[11px] text-[#decab0] shrink-0 flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">{m.targetName}</span>
                  <span className="text-[#a89070]">({m.targetCoordinates.x}|{m.targetCoordinates.y})</span>
                  <span className="text-emerald-400 font-black">⏳ {rem}s</span>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setActiveSubTab('marches')}
            className="text-amber-400 hover:text-amber-200 font-serif font-bold underline text-[11px] shrink-0 cursor-pointer"
          >
            Tümünü Gör →
          </button>
        </div>
      )}

      {/* 3. ANA BÖLÜM: SEFER FERMANI & ORDU DÜZENLEME */}
      {activeSubTab === 'dispatch' && (
        <form onSubmit={handleDispatch} className="space-y-4">
          
          {/* A. Sefer Amacı Seçici (4 Standart Görev) */}
          <div className="bg-[#1f1209] border-2 border-[#684725] rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#472f18]">
              <label className="text-xs font-bold text-amber-200 font-serif flex items-center gap-1.5">
                <Scroll className="w-4 h-4 text-amber-400" />
                <span>1. Sefer Amacı ve Harp Nizamı</span>
              </label>
              <span className="text-[11px] text-[#a89070] font-serif">
                Görev: <strong className="text-amber-300 uppercase">{mission === 'attack' ? 'Taarruz' : mission === 'raid' ? 'Yağma' : mission === 'support' ? 'Destek' : 'Casusluk'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              
              {/* Normal Taarruz */}
              <button
                type="button"
                onClick={() => setMission('attack')}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  mission === 'attack'
                    ? 'bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 font-serif">
                      <Swords className="w-4 h-4 text-red-400" />
                      Normal Taarruz
                    </span>
                    {mission === 'attack' && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Tam imha savaşı. Mancınık ve Koçbaşı ile düşmanın Sur ve Zafer binaları yıkılır.
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-red-300 flex items-center justify-between">
                  <span>⚔️ Topyekün Harp</span>
                  <span className="text-[10px]">Maks Zayiat</span>
                </div>
              </button>

              {/* Yağma Seferi */}
              <button
                type="button"
                onClick={() => setMission('raid')}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  mission === 'raid'
                    ? 'bg-gradient-to-b from-[#9a3412] to-[#431407] border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 font-serif">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Yağma Seferi
                    </span>
                    {mission === 'raid' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Hızlı ganimet akını. 10 askere 1 esir köylü, 50 askere 1 bozkır atı ele geçirir.
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-amber-300 flex items-center justify-between">
                  <span>💰 Yüksek Ganimet</span>
                  <span className="text-[10px]">Kısmi Savaş</span>
                </div>
              </button>

              {/* Destek Seferi */}
              <button
                type="button"
                onClick={() => setMission('support')}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  mission === 'support'
                    ? 'bg-gradient-to-b from-[#1e3a8a] to-[#0f172a] border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 font-serif">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
                      Dost Destek
                    </span>
                    {mission === 'support' && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Hedef köyün surları arkasında konuşlanır ve köyü ortaklaşa savunur.
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-blue-300 flex items-center justify-between">
                  <span>🛡️ Savunma Garnizonu</span>
                  <span className="text-[10px]">1 Tahıl/saat</span>
                </div>
              </button>

              {/* Casusluk */}
              <button
                type="button"
                onClick={() => setMission('spy')}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  mission === 'spy'
                    ? 'bg-gradient-to-b from-[#581c87] to-[#2e1065] border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white'
                    : 'bg-[#140c06] border-[#4a331c] text-[#d4c0a8] hover:border-amber-600/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1.5 font-serif">
                      <Eye className="w-4 h-4 text-purple-400" />
                      Gizli Casusluk
                    </span>
                    {mission === 'spy' && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                  </div>
                  <p className="text-[10px] text-[#bda688] leading-tight">
                    Düşman otağının asker sayısını, ambar hammaddelerini ve bina seviyelerini raporlar.
                  </p>
                </div>
                <div className="mt-2 text-[9px] font-mono text-purple-300 flex items-center justify-between">
                  <span>🔍 Gizli Keşif</span>
                  <span className="text-[10px]">Sadece Casus</span>
                </div>
              </button>

            </div>
          </div>

          {/* B. Hedef Koordinatlar & Hızlı Hedef Seçici */}
          <div className="bg-[#1f1209] border-2 border-[#684725] rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#472f18]">
              <label className="text-xs font-bold text-amber-200 font-serif flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>2. Hedef Tayini ve İstihbarat</span>
              </label>
              
              <button
                type="button"
                onClick={() => setShowQuickTargets(!showQuickTargets)}
                className="text-xs font-serif font-bold text-[#fde047] hover:text-white bg-[#301b0c] hover:bg-[#4d2d14] px-3 py-1 rounded-lg border border-[#7a552b] transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-sm"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>{showQuickTargets ? 'Hızlı Hedefleri Gizle' : 'Hızlı Hedef Seç (Köyler & Rakipler)'}</span>
              </button>
            </div>

            {/* Hızlı Hedefler Çekmecesi */}
            {showQuickTargets && (
              <div className="p-3 bg-[#120a05] border border-[#52371e] rounded-xl space-y-2">
                <div className="text-[11px] font-serif text-amber-300 font-bold flex items-center justify-between">
                  <span>HARİTADAKİ YAKIN HEDEFLER:</span>
                  <span className="text-[#a89070] font-normal">Tek tıkla koordinatları doldurun</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {quickTargetList.slice(0, 9).map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTargetX(t.x);
                        setTargetY(t.y);
                        setTargetName(t.name);
                        setShowQuickTargets(false);
                      }}
                      className="p-2 bg-[#1c1007] hover:bg-[#331e0f] border border-[#422a16] hover:border-amber-400 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="font-serif font-bold text-xs text-[#fef08a] truncate group-hover:text-amber-200">
                          {t.name}
                        </div>
                        <div className="text-[10px] text-[#a89070] font-sans">
                          {t.factionName}
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono text-[11px] pl-2">
                        <span className="text-amber-300">({t.x}|{t.y})</span>
                        <div className="text-[9px] text-[#8c7457]">{t.dist.toFixed(1)} km</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manuel Koordinat & İsim Girişi */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              
              <div className="sm:col-span-5 bg-[#120a05] p-2.5 rounded-xl border border-[#4a331c]">
                <label className="text-[10px] text-[#a89070] block mb-1 font-serif font-bold">
                  Hedef Koordinatlar:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#080402] px-2.5 py-1.5 rounded-lg border border-[#523d26]">
                    <span className="text-[#a89070] font-mono text-xs font-bold mr-1">X:</span>
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={targetX}
                      onChange={(e) => setTargetX(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-[#fde047] font-mono font-black text-xs outline-none"
                    />
                  </div>
                  <span className="text-[#523d26] font-bold">/</span>
                  <div className="flex-1 flex items-center bg-[#080402] px-2.5 py-1.5 rounded-lg border border-[#523d26]">
                    <span className="text-[#a89070] font-mono text-xs font-bold mr-1">Y:</span>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={targetY}
                      onChange={(e) => setTargetY(parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-[#fde047] font-mono font-black text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-5 bg-[#120a05] p-2.5 rounded-xl border border-[#4a331c]">
                <label className="text-[10px] text-[#a89070] block mb-1 font-serif font-bold">
                  Hedef Otağ / Bölge Adı:
                </label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="Örn: Karahisar Kalesi"
                  className="w-full bg-[#080402] border border-[#523d26] rounded-lg px-2.5 py-1.5 text-xs text-[#fef08a] font-serif font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2 bg-[#120a05] p-2.5 rounded-xl border border-[#4a331c] text-center">
                <span className="text-[10px] text-[#a89070] block font-serif font-bold">Mesafe:</span>
                <strong className="text-amber-300 font-mono text-sm block mt-0.5">
                  {distance.toFixed(1)} kare
                </strong>
              </div>

            </div>
          </div>

          {/* C. Hakan / Ordu Komutanı Sancağı */}
          {khan && khan.currentVillageId === village.id && khan.status === 'idle' && (
            <div className="bg-gradient-to-r from-[#38160c] via-[#240e07] to-[#170904] p-3.5 rounded-2xl border-2 border-[#a84420] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#78350f] via-[#451a03] to-[#270e01] border-2 border-[#fcd34d] flex items-center justify-center shadow-lg relative shrink-0">
                  <Crown className="w-6 h-6 text-[#fef08a]" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#991b1b] rounded-full border border-[#fcd34d] flex items-center justify-center shadow font-bold text-[9px] text-white">
                    {khan.level}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#fef08a] font-serif">
                      {khan.name}
                    </h4>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-amber-950 border border-amber-500 text-amber-300">
                      Ordu Sancak Beyi
                    </span>
                  </div>
                  <p className="text-[11px] text-[#decab0] font-serif mt-0.5">
                    Hücum Sancağı: <strong className="text-red-400">+{((khan.skills.attackAura || 1) * 1.5).toFixed(1)}% Taarruz</strong> • Süvari Hızı: <strong className="text-blue-400">+{((khan.skills.cavalrySpeed || 1) * 2.0).toFixed(1)}% Hız</strong>
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border-2 border-amber-400 px-4 py-2 rounded-xl hover:brightness-125 transition shadow-md shrink-0 w-full sm:w-auto justify-center">
                <input 
                  type="checkbox" 
                  checked={sendKhan}
                  onChange={(e) => setSendKhan(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-[#fef08a] font-serif uppercase tracking-wider">
                  Hakan Ordunun Başında Gitsin
                </span>
              </label>
            </div>
          )}

          {/* D. Garnizon Birlikleri & Hızlı Ön Tanım Masası */}
          <div className="bg-[#1f1209] border-2 border-[#684725] rounded-2xl p-4 shadow-lg space-y-3">
            
            {/* Hızlı Seçim Butonları (Presets) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#472f18]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-200 font-serif">
                  3. Garnizon Birlikleri ve Görevlendirme
                </span>
                <span className="text-xs font-mono text-amber-400 font-bold bg-[#120a05] px-2 py-0.5 rounded border border-[#422a16]">
                  Seçilen: {totalSelectedTroops}
                </span>
              </div>

              {/* Hızlı Butonlar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('all')}
                  className="px-2.5 py-1 bg-[#2e1c10] hover:bg-[#472c18] border border-[#694825] hover:border-amber-400 rounded-lg text-[11px] font-serif font-bold text-amber-200 transition cursor-pointer"
                >
                  ⚔️ Tüm Orduyu Seç
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('attack')}
                  className="px-2.5 py-1 bg-[#2e1c10] hover:bg-[#472c18] border border-[#694825] hover:border-red-400 rounded-lg text-[11px] font-serif font-bold text-red-300 transition cursor-pointer"
                >
                  🗡️ Taarruz Birlikleri
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('raid')}
                  className="px-2.5 py-1 bg-[#2e1c10] hover:bg-[#472c18] border border-[#694825] hover:border-amber-400 rounded-lg text-[11px] font-serif font-bold text-amber-300 transition cursor-pointer"
                >
                  🏇 Yağma Birliği
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('defense')}
                  className="px-2.5 py-1 bg-[#2e1c10] hover:bg-[#472c18] border border-[#694825] hover:border-blue-400 rounded-lg text-[11px] font-serif font-bold text-blue-300 transition cursor-pointer"
                >
                  🛡️ Savunma
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('half')}
                  className="px-2.5 py-1 bg-[#2e1c10] hover:bg-[#472c18] border border-[#694825] rounded-lg text-[11px] font-serif font-bold text-[#decab0] transition cursor-pointer"
                >
                  🌓 Yarısı (%50)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('clear')}
                  className="px-2.5 py-1 bg-[#140804] hover:bg-[#2e1208] border border-rose-900/60 rounded-lg text-[11px] font-serif font-bold text-rose-300 transition cursor-pointer"
                >
                  🔄 Sıfırla
                </button>
              </div>
            </div>

            {/* Birlik Kartları Tablosu */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className={`p-3 rounded-xl border-2 transition shadow-md flex flex-col justify-between ${
                      selected > 0 
                        ? 'bg-gradient-to-b from-[#2e1b0e] to-[#1a0f07] border-amber-400 ring-1 ring-amber-500/30' 
                        : 'bg-gradient-to-b from-[#180e07] to-[#0f0804] border-[#4a331c] hover:border-[#694825]'
                    }`}
                  >
                    <div>
                      <div className="flex gap-2.5 items-center">
                        <div className="shrink-0 border-2 border-[#80592f] rounded-lg p-0.5 bg-[#080402] shadow-inner">
                          <UnitPortrait unitId={uKey as UnitType} size="sm" showModalOnClick={true} />
                        </div>
                        <div className="flex-1 min-w-0 font-serif">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[#eddcc4] text-xs truncate">{uDef.name}</span>
                            <span className="text-[11px] text-amber-300 font-mono font-black ml-1 bg-[#0b0502] px-2 py-0.5 rounded border border-[#523d26]">
                              {count} Mevcut
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-[#a89070] font-mono space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span>Sal: <strong className="text-red-400">{uDef.attackPower}</strong></span>
                              <span>Sav: <strong className="text-blue-400">{uDef.defenseInfantry}P / {uDef.defenseCavalry}S</strong></span>
                            </div>
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-amber-300 font-bold">⚡ {uDef.speedScore ?? 50}/100</span>
                              <span className="text-yellow-400 font-bold">💰 {uDef.plunderScore ?? 50}/100</span>
                            </div>
                          </div>

                          {(upgradeAtk > 0 || upgradeDef > 0) && (
                            <div className="text-[9px] text-amber-400/90 font-mono mt-0.5 flex gap-2">
                              <span>⚒️ Demirci:</span>
                              {upgradeAtk > 0 && <span className="text-red-300">+{upgradeAtk}% Atk</span>}
                              {upgradeDef > 0 && <span className="text-blue-300">+{upgradeDef}% Def</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hızlı Miktar Ayarlayıcı & Butonlar */}
                    <div className="mt-3 pt-2 border-t border-[#382312] space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUnitChange(uKey as UnitType, selected - 10)}
                          className="px-2 py-1 bg-[#24140a] hover:bg-[#3d2311] border border-[#52371e] text-[10px] font-mono text-amber-300 rounded cursor-pointer"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitChange(uKey as UnitType, selected - 1)}
                          className="px-2 py-1 bg-[#24140a] hover:bg-[#3d2311] border border-[#52371e] text-[10px] font-mono text-amber-300 rounded cursor-pointer"
                        >
                          -1
                        </button>

                        <input
                          type="number"
                          min={0}
                          max={count}
                          value={selected}
                          onChange={(e) => handleUnitChange(uKey as UnitType, parseInt(e.target.value) || 0)}
                          className="flex-1 bg-[#080402] border border-[#6b4724] rounded-md px-2 py-1 text-center font-mono font-black text-xs text-[#fde047] shadow-inner outline-none focus:border-amber-400"
                        />

                        <button
                          type="button"
                          onClick={() => handleUnitChange(uKey as UnitType, selected + 1)}
                          className="px-2 py-1 bg-[#24140a] hover:bg-[#3d2311] border border-[#52371e] text-[10px] font-mono text-amber-300 rounded cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitChange(uKey as UnitType, selected + 10)}
                          className="px-2 py-1 bg-[#24140a] hover:bg-[#3d2311] border border-[#52371e] text-[10px] font-mono text-amber-300 rounded cursor-pointer"
                        >
                          +10
                        </button>
                      </div>

                      {/* Hızlı Yüzde Çipleri */}
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => handleUnitPercentage(uKey as UnitType, 0.25)}
                          className="flex-1 py-0.5 bg-[#140b05] hover:bg-[#2b170a] border border-[#3d2714] text-[#a89070] hover:text-amber-200 rounded cursor-pointer text-center"
                        >
                          %25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitPercentage(uKey as UnitType, 0.50)}
                          className="flex-1 py-0.5 bg-[#140b05] hover:bg-[#2b170a] border border-[#3d2714] text-[#a89070] hover:text-amber-200 rounded cursor-pointer text-center"
                        >
                          %50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitPercentage(uKey as UnitType, 1.0)}
                          className="flex-1 py-0.5 bg-[#382312] hover:bg-[#523319] border border-amber-600/70 text-amber-300 rounded font-bold cursor-pointer text-center"
                        >
                          Maks
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {Object.values(village.units).every(c => !c || Number(c) <= 0) && (
                <div className="col-span-full py-8 text-center text-[#a89070] italic text-xs font-serif bg-[#120a05] rounded-xl border border-[#422a16]">
                  Köyünüzde sefere çıkarılacak hazır asker bulunmuyor. Kışla ve Ahır binalarından yeni birlikler eğitebilirsiniz.
                </div>
              )}
            </div>

          </div>

          {/* E. Harp Meclisi Canlı Telemetri & Ferman Onayı (Floating / Sticky Bar) */}
          <div className="bg-gradient-to-r from-[#211207] via-[#140a04] to-[#211207] p-4 rounded-2xl border-2 border-amber-500 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
            
            {/* Canlı İstatistikler Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 w-full lg:w-auto font-mono">
              <div className="bg-[#0c0703] p-2 rounded-xl border border-[#472f18] text-center">
                <span className="text-[10px] text-[#a89070] font-serif block">Toplam Asker</span>
                <strong className="text-amber-300 font-black text-sm">{totalSelectedTroops}</strong>
              </div>
              <div className="bg-[#0c0703] p-2 rounded-xl border border-[#472f18] text-center">
                <span className="text-[10px] text-[#a89070] font-serif block">Taarruz Gücü</span>
                <strong className="text-red-400 font-black text-sm">{Math.round(totalAttackPower).toLocaleString('tr-TR')}</strong>
              </div>
              <div className="bg-[#0c0703] p-2 rounded-xl border border-[#472f18] text-center">
                <span className="text-[10px] text-[#a89070] font-serif block">Savunma (P/S)</span>
                <strong className="text-blue-400 font-black text-xs">{Math.round(totalInfantryDef)} / {Math.round(totalCavalryDef)}</strong>
              </div>
              <div className="bg-[#0c0703] p-2 rounded-xl border border-[#472f18] text-center">
                <span className="text-[10px] text-[#a89070] font-serif block">İntikal Vakti</span>
                <strong className="text-yellow-300 font-black text-sm">{durationSec} sn</strong>
              </div>
              <div className="bg-[#0c0703] p-2 rounded-xl border border-[#472f18] text-center">
                <span className="text-[10px] text-[#a89070] font-serif block">Ordu Hızı</span>
                <strong className="text-amber-400 font-black text-xs">{totalSelectedTroops > 0 ? `${slowestSpeedScore}/100` : '-'}</strong>
              </div>
              <div className="bg-[#0c0703] p-2 rounded-xl border border-[#472f18] text-center">
                <span className="text-[10px] text-[#a89070] font-serif block">Ganimet Kap.</span>
                <strong className="text-emerald-400 font-black text-sm">{totalLootCapacity.toLocaleString('tr-TR')}</strong>
              </div>
            </div>

            {/* Büyük Sefer Butonu */}
            <button
              type="submit"
              disabled={totalSelectedTroops <= 0}
              className={`w-full lg:w-auto py-3.5 px-8 rounded-xl font-serif font-black text-xs sm:text-sm tracking-widest transition shadow-2xl flex items-center justify-center gap-3 shrink-0 cursor-pointer ${
                totalSelectedTroops > 0
                  ? 'bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] border-2 border-amber-400 text-amber-100 hover:brightness-125 active:scale-95'
                  : 'bg-[#24150c] border border-[#472f18] text-[#73573e] cursor-not-allowed'
              }`}
            >
              <Swords className="w-5 h-5 text-amber-300" />
              <span>
                {totalSelectedTroops > 0
                  ? `ORDUYU YOLA ÇIKAR (${totalSelectedTroops} Birlik)`
                  : 'Önce Birlik Seçin'}
              </span>
            </button>
          </div>

        </form>
      )}

      {/* 4. SEKME: CANLI İNTİKALLER VE SEFER DETAYLARI */}
      {activeSubTab === 'marches' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#52371e]">
            <h3 className="font-serif font-black text-sm text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Devam Eden Askeri İntikaller ({activeMarches.length})</span>
            </h3>
            <span className="text-xs font-mono text-[#a89070]">
              Otomatik güncellenir
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

                const getBadge = () => {
                  if (isReturning) return { label: '🛡️ DÖNÜŞ YOLUNDA', bg: 'bg-blue-950/80 border-blue-500 text-blue-200' };
                  if (march.mission === 'attack') return { label: '⚔️ TAARRUZ İNTİKALİ', bg: 'bg-red-950/80 border-red-500 text-red-200' };
                  if (march.mission === 'raid') return { label: '🏇 YAĞMA AKINI', bg: 'bg-amber-950/80 border-amber-500 text-amber-200' };
                  if (march.mission === 'support') return { label: '🛡️ DOST DESTEK', bg: 'bg-blue-950/80 border-blue-500 text-blue-200' };
                  if (march.mission === 'spy') return { label: '👁️ GİZLİ CASUSLUK', bg: 'bg-purple-950/80 border-purple-500 text-purple-200' };
                  return { label: '⚔️ SEFER', bg: 'bg-amber-950 border-amber-600 text-amber-200' };
                };
                const badge = getBadge();

                return (
                  <div 
                    key={march.id}
                    className="p-4 rounded-2xl bg-[#1e1208] border-2 border-[#6b4724] space-y-3 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-serif font-black tracking-wider border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="font-serif font-bold text-sm text-[#fef08a]">
                          {march.targetName}
                        </span>
                        <span className="font-mono text-xs text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-[#422a16]">
                          ({march.targetCoordinates.x} | {march.targetCoordinates.y})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-xs text-amber-300 bg-[#0d0703] px-3 py-1 rounded-xl border border-[#4a331c] self-start sm:self-auto">
                        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Kalan Süre: <strong>{remSec} saniye</strong></span>
                      </div>
                    </div>

                    {/* İlerleme Çubuğu */}
                    <div className="w-full bg-[#0d0703] h-2.5 rounded-full overflow-hidden border border-[#3d2714] p-[1px]">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          isReturning 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-400' 
                            : 'bg-gradient-to-r from-amber-600 via-orange-500 to-red-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Birlikler ve Ganimet */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#382312] text-xs font-serif">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-amber-200 font-bold">Birlikler:</span>
                        {Object.entries(march.units).map(([uKey, count]) => {
                          if (!count) return null;
                          return (
                            <span key={uKey} className="bg-[#120a05] px-2 py-0.5 rounded-lg border border-[#422a16] font-mono text-[11px] text-[#eddcc4] flex items-center gap-1">
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
                              🐎 {march.capturedHorses} Bozkır Atı
                            </span>
                          )}
                          {march.loot && (
                            <div className="text-emerald-300 font-mono text-xs font-bold bg-[#0c1f13] px-2 py-0.5 rounded border border-[#166534]">
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
            <div className="py-12 text-center text-[#a89070] italic text-xs font-serif bg-[#180e07] rounded-2xl border border-[#472f18]">
              Şu anda yolda olan herhangi bir ordu veya intikal bulunmuyor.
            </div>
          )}
        </div>
      )}

      {/* 5. SEKME: KONUŞLANMIŞ DOST DESTEK ORDULARI */}
      {activeSubTab === 'stationed' && (
        <div className="space-y-4">
          <div className="bg-[#131726] border-2 border-[#2b3558] rounded-2xl p-4 text-[#d4daf0] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#232c4a]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-blue-200 font-serif">
                    Köyünüzde Konuşlanan Dost Destek Birlikleri ({totalStationedTroops} Asker)
                  </h3>
                  <p className="text-[11px] text-blue-300/80">
                    Saldırılara karşı köyünüzü savunan müttefik garnizonlar. Köyün tahıl ambarını tüketirler.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono bg-[#090b14] px-3 py-1 rounded-lg border border-[#3b4770] text-amber-300">
                <Wheat className="w-3.5 h-3.5 text-amber-400" />
                <span>Tüketim: -{totalStationedTroops} tahıl/saat</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {stationedArmies.map(army => (
                <div key={army.id} className="bg-[#0e101c] p-3 rounded-xl border border-[#2b3558] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-blue-100 font-serif flex items-center gap-2">
                      <span>{army.originVillageName}</span>
                      <span className="text-xs text-blue-300/70 font-sans font-normal">({army.originOwnerName})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {Object.entries(army.units).map(([uKey, count]) => {
                        if (!count) return null;
                        return (
                          <span key={uKey} className="text-xs bg-[#171b30] px-2.5 py-1 rounded border border-[#2e375d] font-mono text-blue-200 flex items-center gap-1.5">
                            <UnitPortrait unitId={uKey as UnitType} size="xs" />
                            <span>{count}x {UNITS[uKey as UnitType]?.name || uKey}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {onRecallSupport && (
                    <button
                      type="button"
                      onClick={() => onRecallSupport(army.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:brightness-125 text-blue-100 border border-blue-500 rounded-lg text-xs font-serif font-bold transition shadow cursor-pointer shrink-0"
                    >
                      Birlikleri Geri Çağır
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SEKME: HARP NİZAMI & ASKERİ REHBER */}
      {activeSubTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1f1209] border-2 border-[#684725] rounded-2xl p-4 space-y-2">
            <h3 className="font-serif font-black text-sm text-amber-300 flex items-center gap-2 pb-2 border-b border-[#472f18]">
              <Swords className="w-4 h-4 text-red-400" />
              <span>Savaş ve Taarruz Mekaniği</span>
            </h3>
            <p className="text-xs text-[#decab0] font-serif leading-relaxed">
              • <strong>Normal Taarruz:</strong> İki tarafın orduları karşı karşıya gelir. Ordunun toplam taarruz gücü, savunanın piyade/süvari savunma oranına göre hesaplanır. Koçbaşı ve mancınıklar sur ve binalara doğrudan hasar verir.
            </p>
            <p className="text-xs text-[#decab0] font-serif leading-relaxed">
              • <strong>Yağma Seferi:</strong> Amaç ambarları yağmalamaktır. Savunana +%5 bonus verilir ancak saldıranın kayıpları asgari düzeyde tutulur. Her 10 askere 1 esir köylü ve 50 askere 1 at kazanılır.
            </p>
          </div>

          <div className="bg-[#1f1209] border-2 border-[#684725] rounded-2xl p-4 space-y-2">
            <h3 className="font-serif font-black text-sm text-amber-300 flex items-center gap-2 pb-2 border-b border-[#472f18]">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Hakan ve Demirci Geliştirmeleri</span>
            </h3>
            <p className="text-xs text-[#decab0] font-serif leading-relaxed">
              • <strong>Hakan Sancak Beyi:</strong> Hakan sefere katıldığında tüm orduya Taarruz Aurası (+%X) ve Süvari Hızı (+%Y) sağlar.
            </p>
            <p className="text-xs text-[#decab0] font-serif leading-relaxed">
              • <strong>Demirci Talimleri:</strong> Demirci binasında her askeri sınıf için yapılan silah ve zırh dövme işlemleri kalıcı olarak +%1 / seviye bonus kazandırır.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
