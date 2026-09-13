import React from 'react';
import { BattleReport, UnitType } from '../types/game';
import { UNITS, UNIT_IMAGE_MAP } from '../data/gameData';
import { Swords, Shield, Castle, Trophy, Skull, Package, Sparkles } from 'lucide-react';

interface Battlefield3DVisualizerProps {
  report: BattleReport;
}

export const Battlefield3DVisualizer: React.FC<Battlefield3DVisualizerProps> = ({ report }) => {
  const isVictory = report.attackerResult === 'victory';

  const attackerUnits = Object.entries(report.attackerCasualties.unitsBefore || {})
    .filter(([_, count]) => (count as number) > 0)
    .map(([id, count]) => ({
      id: id as UnitType,
      before: count as number,
      lost: report.attackerCasualties.unitsLost[id as UnitType] || 0,
    }));

  const defenderUnits = Object.entries(report.defenderCasualties.unitsBefore || {})
    .filter(([_, count]) => (count as number) > 0)
    .map(([id, count]) => ({
      id: id as UnitType,
      before: count as number,
      lost: report.defenderCasualties.unitsLost[id as UnitType] || 0,
    }));

  const totalAttackerBefore = attackerUnits.reduce((acc, u) => acc + u.before, 0);
  const totalAttackerLost = attackerUnits.reduce((acc, u) => acc + u.lost, 0);
  const totalDefenderBefore = defenderUnits.reduce((acc, u) => acc + u.before, 0);
  const totalDefenderLost = defenderUnits.reduce((acc, u) => acc + u.lost, 0);

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-stone-800 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 p-4 shadow-2xl">
      {/* 3D Battlefield Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/80">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h4 className="font-bold text-stone-100 font-serif text-sm flex items-center gap-2">
              3D Muharebe Meydanı Canlandırması
            </h4>
            <span className="text-[11px] text-stone-400">
              Gerçek 3D Savaşçı Modelleri ve Cephe Çarpışması
            </span>
          </div>
        </div>

        {/* Victory/Defeat Emblem */}
        <div
          className={`px-3 py-1 rounded-full font-bold font-mono text-xs uppercase flex items-center gap-1.5 shadow-md ${
            isVictory
              ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/80 ring-2 ring-emerald-500/20'
              : 'bg-red-900/80 text-red-200 border border-red-500/80 ring-2 ring-red-500/20'
          }`}
        >
          {isVictory ? (
            <>
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Muharebe Zaferi</span>
            </>
          ) : (
            <>
              <Skull className="w-3.5 h-3.5 text-red-300" />
              <span>Ağır Bozgun</span>
            </>
          )}
        </div>
      </div>

      {/* 3D Isometric Battle Stage */}
      <div className="relative min-h-[220px] rounded-xl bg-gradient-to-b from-stone-950 via-[#18120c] to-[#0d0906] border border-amber-900/30 overflow-hidden flex flex-col justify-between p-3">
        
        {/* Isometric Grid & Atmosphere Lights */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#d97706 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

        {/* Top Info Bar: Villages & Forces */}
        <div className="relative z-10 flex items-center justify-between text-xs">
          {/* Attacker Team Header */}
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-red-900/50 backdrop-blur-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <div>
              <div className="font-bold text-red-300 font-serif">{report.attackerVillageName}</div>
              <div className="text-[10px] text-stone-400 font-mono">
                Mevcut: {totalAttackerBefore} | Kayıp: -{totalAttackerLost}
              </div>
            </div>
          </div>

          {/* Clash Point Icon */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-stone-900 border border-amber-600 flex items-center justify-center text-amber-400 shadow-lg animate-pulse">
              <Swords className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono text-amber-500/80 mt-0.5">ÇARPIŞMA</span>
          </div>

          {/* Defender Team Header */}
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-lg border border-blue-900/50 backdrop-blur-xs text-right">
            <div>
              <div className="font-bold text-blue-300 font-serif">{report.defenderVillageName}</div>
              <div className="text-[10px] text-stone-400 font-mono">
                Garnizon: {totalDefenderBefore} | Kayıp: -{totalDefenderLost}
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Middle: 3D Warriors Facing Each Other in Battle Arena */}
        <div className="relative z-10 grid grid-cols-2 gap-4 my-3 items-end">
          
          {/* Left: Attacking 3D Warriors */}
          <div className="flex items-end justify-start gap-2 overflow-x-auto pb-2 pl-2 custom-scrollbar">
            {attackerUnits.map((u) => {
              const unitDef = UNITS[u.id];
              return (
                <div
                  key={u.id}
                  className="relative group shrink-0 flex flex-col items-center"
                >
                  {/* Unit Count Badge */}
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/80 border border-stone-700 text-stone-200 mb-1 shadow">
                    {u.before}
                  </span>

                  {/* 3D Warrior WebP Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 relative filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                    <img
                      src={unitDef?.image || UNIT_IMAGE_MAP[u.id as UnitType] || `/drawable/${u.id}.webp`}
                      alt={unitDef?.name || u.id}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    {u.lost > 0 && (
                      <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded bg-red-950/90 border border-red-800 text-[9px] font-mono font-bold text-red-300">
                        -{u.lost}
                      </span>
                    )}
                  </div>

                  {/* 3D Ground Shadow / Ellipse */}
                  <div className="w-16 h-3 bg-black/70 rounded-full blur-[2px] -mt-1" />

                  <span className="text-[10px] text-stone-300 font-medium truncate max-w-[80px] mt-1">
                    {unitDef?.name || u.id}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Defending 3D Warriors Behind Bastions */}
          <div className="flex items-end justify-end gap-2 overflow-x-auto pb-2 pr-2 custom-scrollbar">
            {defenderUnits.map((u) => {
              const unitDef = UNITS[u.id];
              return (
                <div
                  key={u.id}
                  className="relative group shrink-0 flex flex-col items-center"
                >
                  {/* Unit Count Badge */}
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/80 border border-stone-700 text-stone-200 mb-1 shadow">
                    {u.before}
                  </span>

                  {/* 3D Warrior WebP Image (Facing left) */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 relative filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 scale-x-[-1]">
                    <img
                      src={unitDef?.image || UNIT_IMAGE_MAP[u.id as UnitType] || `/drawable/${u.id}.webp`}
                      alt={unitDef?.name || u.id}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                    {u.lost > 0 && (
                      <span className="absolute bottom-0 left-0 px-1 py-0.2 rounded bg-red-950/90 border border-red-800 text-[9px] font-mono font-bold text-red-300 scale-x-[-1]">
                        -{u.lost}
                      </span>
                    )}
                  </div>

                  {/* 3D Ground Shadow */}
                  <div className="w-16 h-3 bg-black/70 rounded-full blur-[2px] -mt-1" />

                  <span className="text-[10px] text-stone-300 font-medium truncate max-w-[80px] mt-1">
                    {unitDef?.name || u.id}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom Banner: Wall Level & Loot Summary */}
        <div className="relative z-10 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-stone-400">
            <Castle className="w-3.5 h-3.5 text-amber-500" />
            <span>Sur Durumu:</span>
            <strong className="text-stone-200">
              Sv. {report.initialWallLevel} → Sv. {report.finalWallLevel}
            </strong>
          </div>

          <div className="flex items-center gap-2 text-emerald-400">
            <Package className="w-3.5 h-3.5" />
            <span>Taşınan Ganimet:</span>
            <strong className="text-emerald-300">
              {report.lootCarried.wood + report.lootCarried.stone + report.lootCarried.iron + report.lootCarried.grain + report.lootCarried.gold} birim
            </strong>
          </div>
        </div>

      </div>
    </div>
  );
};
