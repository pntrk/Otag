import React, { useState } from 'react';
import { FactionId, UnitType, MarchMission } from '../types/game';
import { FACTIONS, UNITS } from '../data/gameData';
import { UnitPortrait } from './UnitPortrait';
import { Warrior3DCard } from './Warrior3DCard';
import { Battlefield3DVisualizer } from './Battlefield3DVisualizer';
import { simulateBattle } from '../engine/lanchester';
import { 
  Calculator, 
  Swords, 
  ShieldAlert, 
  RotateCcw, 
  Play, 
  Castle,
  Shield,
  Sparkles,
  Flame,
  Scroll,
  Layers,
  Award
} from 'lucide-react';

const SIMULATOR_ORDERED_FACTIONS: { id: FactionId; name: string }[] = [
  { id: 'karamanogullari', name: 'Karamanoğulları Beyliği' },
  { id: 'candarogullari', name: 'Candaroğulları Beyliği' },
  { id: 'osmanogullari', name: 'Osmanoğulları Beyliği' },
  { id: 'germiyanogullari', name: 'Germiyanoğulları Beyliği' },
  { id: 'dulkadirogullari', name: 'Dulkadiroğulları Beyliği' },
];

export const CombatSimulatorView: React.FC = () => {
  const [attackerFaction, setAttackerFaction] = useState<FactionId>('osmanogullari');
  const [defenderFaction, setDefenderFaction] = useState<FactionId>('karamanogullari');
  const [wallLevel, setWallLevel] = useState<number>(3);
  const [hideoutLevel, setHideoutLevel] = useState<number>(2);
  const [mission, setMission] = useState<MarchMission>('attack');

  const [attackerUnits, setAttackerUnits] = useState<Partial<Record<UnitType, number>>>({
    mizrakli: 30,
    kilicli: 25,
    hafif_suvari: 10,
    kocbasi: 4,
    akinci: 15,
  });

  const [defenderUnits, setDefenderUnits] = useState<Partial<Record<UnitType, number>>>({
    mizrakli: 40,
    kilicli: 20,
    gulam: 15,
  });

  const [simResult, setSimResult] = useState<any | null>(null);

  const handleSimulate = () => {
    const report = simulateBattle({
      mission,
      attackerFaction,
      attackerVillageName: 'Saldıran Ordu',
      attackerCoords: { x: 45, y: 45 },
      attackerUnits,
      defenderFaction,
      defenderVillageName: 'Müstahkem Kale',
      defenderCoords: { x: 48, y: 42 },
      defenderUnits,
      defenderWallLevel: wallLevel,
      defenderHideoutLevel: hideoutLevel,
      defenderResources: { wood: 2000, stone: 2000, iron: 2000, grain: 2000, gold: 1000 },
    });
    setSimResult(report);
  };

  const handleReset = () => {
    setAttackerUnits({ mizrakli: 0, kilicli: 0, hafif_suvari: 0, kocbasi: 0 });
    setDefenderUnits({ mizrakli: 0, kilicli: 0 });
    setSimResult(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Ana Harp Masası Çerçevesi (Carved War Table Molding) */}
      <div className="bg-gradient-to-b from-[#25170d] via-[#180f08] to-[#0e0703] border-4 border-[#7a552b] rounded-2xl p-4 sm:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95),inset_0_2px_4px_rgba(255,255,255,0.1)] text-[#eddcc4]">
        
        {/* Üst Başlık Barı: Altın Varaklı Tuğra Kitabesi & Kontrol Düğmeleri */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b-2 border-[#5c3e1e] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#6b4724] to-[#3a2512] border-2 border-[#caa05a] flex items-center justify-center shadow">
              <Calculator className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fef08a] font-serif flex items-center gap-2 drop-shadow">
                Lanchester Harp Masası & Taktik Simülatörü
              </h3>
              <p className="text-xs text-[#bda688] font-serif">
                Ordu tertiplerini, sur tahkimat çarpanını ve Koçbaşı kuşatma etkisini çarpıştırarak test edin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Sıfırla Düğmesi */}
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-[#2b1f15] hover:bg-[#3d2c1e] text-[#c7b299] hover:text-[#fef08a] border border-[#5a4228] hover:border-[#caa05a] rounded-xl text-xs font-serif font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Sıfırla</span>
            </button>
            
            {/* Muharebeyi Hesapla Düğmesi (Ağır Balmumu Mühür Stili) */}
            <button
              onClick={handleSimulate}
              className="bg-gradient-to-r from-[#991b1b] via-[#b91c1c] to-[#991b1b] hover:brightness-110 text-[#fff7e6] font-serif font-black tracking-wider text-xs px-5 py-2.5 rounded-xl border-2 border-[#d4af37] shadow-[0_6px_20px_rgba(185,28,28,0.5)] active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>MUHAREBEYİ HESAPLA</span>
            </button>
          </div>
        </div>

        {/* 2. Karşılıklı Ordular: Saldıran ve Savunan Tabur Masaları (Dual Army Trays) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Sol Sütun: Taarruz Ordusu (Kızıl Akıncı Kanadı) */}
          <div className="bg-gradient-to-b from-[#1c0d09] to-[#100604] p-4 rounded-xl border-2 border-[#8a2b13] shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#5c1c0e]">
              <h4 className="font-bold text-[#fca5a5] flex items-center gap-1.5 text-xs font-serif uppercase tracking-wide drop-shadow">
                <Swords className="w-4 h-4 text-red-400" />
                <span>Taarruz Ordusu (Kızıl Sancak)</span>
              </h4>
              <select
                value={attackerFaction}
                onChange={(e) => setAttackerFaction(e.target.value as FactionId)}
                className="bg-[#0e0503] border border-[#6b2311] rounded-lg px-2.5 py-1 text-xs text-[#fca5a5] font-serif font-bold cursor-pointer outline-none focus:border-[#caa05a] shadow-inner"
              >
                {SIMULATOR_ORDERED_FACTIONS.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {Object.values(UNITS).map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#2d1109] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 border border-[#8a2b13] rounded-md p-0.5 bg-[#080302]">
                      <UnitPortrait unitId={u.id} size="xs" showModalOnClick={true} />
                    </div>
                    <div className="min-w-0 font-serif">
                      <span className="text-[#eddcc4] font-bold block truncate">{u.name}</span>
                      <span className="text-[10px] text-[#bda688] font-mono">
                        Taarruz: <strong className="text-red-400">{u.attackPower}</strong>
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={attackerUnits[u.id] || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setAttackerUnits(prev => ({ ...prev, [u.id]: val }));
                    }}
                    className="w-20 bg-[#080302] border border-[#6b2311] rounded-md px-2 py-1 text-center font-mono font-black text-[#fca5a5] text-xs shadow-inner outline-none focus:border-red-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sağ Sütun: Savunan Garnizon & Hisar Tahkimatı (Çelik Kalkan Kanadı) */}
          <div className="bg-gradient-to-b from-[#0c131d] to-[#060a10] p-4 rounded-xl border-2 border-[#1e3a8a] shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e3a8a]">
              <h4 className="font-bold text-[#93c5fd] flex items-center gap-1.5 text-xs font-serif uppercase tracking-wide drop-shadow">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                <span>Savunan Garnizon & Hisar</span>
              </h4>
              <select
                value={defenderFaction}
                onChange={(e) => setDefenderFaction(e.target.value as FactionId)}
                className="bg-[#05080c] border border-[#2b4c7e] rounded-lg px-2.5 py-1 text-xs text-[#93c5fd] font-serif font-bold cursor-pointer outline-none focus:border-[#caa05a] shadow-inner"
              >
                {SIMULATOR_ORDERED_FACTIONS.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Sur ve Sığınak Seviye Ayarı */}
            <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-[#05080c] rounded-xl border border-[#2b4c7e] text-xs font-serif shadow-inner">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-[#93c5fd] font-bold block">Sur Tahkimatı</label>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold">+{wallLevel * 5}% Sav.</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={wallLevel}
                  onChange={(e) => setWallLevel(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#030508] border border-[#1e3a8a] rounded-md px-2 py-1 text-[#93c5fd] font-mono font-black text-xs mt-1 outline-none text-center shadow-inner"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-amber-300 font-bold block">Gizli Sığınak</label>
                  <span className="text-[10px] text-[#a89070] font-mono">Koruma: {hideoutLevel * 200}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={hideoutLevel}
                  onChange={(e) => setHideoutLevel(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#030508] border border-[#1e3a8a] rounded-md px-2 py-1 text-amber-300 font-mono font-black text-xs mt-1 outline-none text-center shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {Object.values(UNITS).map(u => (
                <div key={u.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#0c1626] gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 border border-[#1e3a8a] rounded-md p-0.5 bg-[#04070c]">
                      <UnitPortrait unitId={u.id} size="xs" showModalOnClick={true} />
                    </div>
                    <div className="min-w-0 font-serif">
                      <span className="text-[#eddcc4] font-bold block truncate">{u.name}</span>
                      <span className="text-[10px] text-[#94a3b8] font-mono">
                        P: <strong className="text-blue-300">{u.defenseInfantry}</strong> | S: <strong className="text-blue-300">{u.defenseCavalry}</strong>
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={defenderUnits[u.id] || 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setDefenderUnits(prev => ({ ...prev, [u.id]: val }));
                    }}
                    className="w-20 bg-[#05080c] border border-[#2b4c7e] rounded-md px-2 py-1 text-center font-mono font-black text-[#93c5fd] text-xs shadow-inner outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 3. Muharebe Simülasyon Raporu & Zafer Fermanı */}
        {simResult && (
          <div className="mt-5 pt-4 border-t-2 border-[#5c3e1e] space-y-4">
            
            {/* 3D Muharebe Meydanı Canlandırması */}
            <Battlefield3DVisualizer report={simResult} />

            {/* Antik Ferman Parşömeni */}
            <div className="bg-gradient-to-b from-[#1f140c] via-[#140c06] to-[#0d0703] p-4 sm:p-5 rounded-2xl border-2 border-[#caa05a] shadow-2xl space-y-4 text-xs font-serif">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#523d26] gap-2">
                {/* Sonuç Mührü */}
                <span className={`px-3 py-1 rounded-full text-xs font-serif font-black tracking-wider uppercase shadow-md flex items-center gap-1.5 self-start sm:self-auto ${
                  simResult.attackerResult === 'victory' 
                    ? 'bg-[#14532d] border border-[#4ade80] text-[#86efac]' 
                    : 'bg-[#7f1d1d] border border-[#f87171] text-[#fca5a5]'
                }`}>
                  {simResult.attackerResult === 'victory' ? '❖ SONUÇ: TAARRUZ ZAFERİ' : '✕ SONUÇ: SAVUNMA BAŞARILI (BOZGUNA UĞRATILDI)'}
                </span>

                <span className="text-[#decab0] text-xs font-mono bg-[#0c0703] px-3 py-1 rounded-lg border border-[#52391c] shadow-inner flex items-center gap-1.5 self-start sm:self-auto">
                  <Castle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sur Değişimi: Seviye {simResult.initialWallLevel} → <strong className="text-blue-300 font-black">Seviye {simResult.finalWallLevel}</strong></span>
                </span>
              </div>

              {/* Divan Kâtibi Notu */}
              <div className="p-3 bg-[#0f0905] rounded-xl border border-[#422d1a] text-[#eddcc4] italic font-serif leading-relaxed shadow-inner">
                "{simResult.summary}"
              </div>

              {/* 4. 3D Birlik İnceleme Kartları Katmanı */}
              <div className="space-y-3 pt-1">
                <h5 className="font-bold text-xs text-[#fca5a5] flex items-center gap-1.5 font-serif">
                  <Swords className="w-4 h-4 text-red-400" />
                  <span>Taarruz Birlikleri 3D Kayıp İncelemesi</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(simResult.attackerCasualties.unitsBefore || {})
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([k, count]) => {
                      const before = count as number;
                      const lost = simResult.attackerCasualties.unitsLost[k as UnitType] || 0;
                      return (
                        <Warrior3DCard
                          key={k}
                          unitId={k}
                          before={before}
                          lost={lost}
                          side="attacker"
                        />
                      );
                    })}
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#3d2714]">
                <h5 className="font-bold text-xs text-[#93c5fd] flex items-center gap-1.5 font-serif">
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span>Savunan Garnizon 3D Kayıp İncelemesi</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(simResult.defenderCasualties.unitsBefore || {})
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([k, count]) => {
                      const before = count as number;
                      const lost = simResult.defenderCasualties.unitsLost[k as UnitType] || 0;
                      return (
                        <Warrior3DCard
                          key={k}
                          unitId={k}
                          before={before}
                          lost={lost}
                          side="defender"
                        />
                      );
                    })}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
