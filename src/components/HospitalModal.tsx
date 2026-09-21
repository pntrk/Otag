import React, { useState } from 'react';
import { UnitType, Resources } from '../types/game';
import { WoundedSoldierGroup } from '../types/divanTypes';
import { UNITS } from '../data/gameData';
import { HeartPulse, X, Shield, Sparkles, Check } from 'lucide-react';
import { ResourceIcon } from './ResourceIcon';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  woundedGroups: WoundedSoldierGroup[];
  villageResources: Resources;
  onHealUnits: (unitType: UnitType, count: number) => void;
}

export const HospitalModal: React.FC<HospitalModalProps> = ({
  isOpen,
  onClose,
  woundedGroups,
  villageResources,
  onHealUnits
}) => {
  if (!isOpen) return null;

  const totalWoundedCount = woundedGroups.reduce((acc, g) => acc + g.count, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2a170b] via-[#1d1007] to-[#120a05] border-3 border-[#8f693b] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Üst Başlık Barı */}
        <div className="p-4 sm:p-5 border-b-2 border-[#5a3a1f] flex items-center justify-between bg-[#1b0e06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-900 to-rose-950 border-2 border-rose-500 flex items-center justify-center text-xl shadow">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                  Otağ • Tabip Otağı
                </span>
                <span className="text-xs text-amber-300 font-serif">Sıhhiye</span>
              </div>
              <h2 className="text-lg sm:text-xl font-serif font-black text-[#fef3c7] flex items-center gap-2">
                <span>Şifahane (Yaralı Asker Tedavisi)</span>
                <HeartPulse className="w-5 h-5 text-rose-400" />
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#29170c] hover:bg-[#3d2313] border border-[#52351c] text-[#decab0] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orta Açıklama */}
        <div className="p-4 bg-[#150c06] border-b border-[#422814] text-xs font-serif text-[#decab0] flex items-center justify-between">
          <p className="max-w-md">
            Muharebelerden ağır yaralı dönen gaziler burada tabip ve hekimler tarafından şifalandırılır. Tedavi bedeli yeni asker basımının <strong>yarısı kadardır</strong>.
          </p>
          <div className="bg-[#26150a] px-3 py-1.5 rounded-lg border border-rose-800/60 font-mono text-xs font-bold text-rose-300 shrink-0 ml-2">
            Yaralı Asker: {totalWoundedCount}
          </div>
        </div>

        {/* Yaralı Asker Listesi */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {woundedGroups.length === 0 || totalWoundedCount === 0 ? (
            <div className="py-12 text-center text-[#decab0] space-y-2">
              <div className="text-4xl">🕊️</div>
              <div className="font-serif font-black text-base text-amber-200">
                Şifahanede Yaralı Asker Bulunmuyor
              </div>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Tüm gazileriniz ve ordunuz sıhhatte! Savaşlarda yaralanan birlikler otomatik olarak buraya intikal ettirilecektir.
              </p>
            </div>
          ) : (
            woundedGroups.filter(g => g.count > 0).map(group => {
              const uDef = UNITS[group.unitType];
              const totalGrainCost = group.grainHealCostPerUnit * group.count;
              const totalGoldCost = group.goldHealCostPerUnit * group.count;
              const canAffordAll = villageResources.grain >= totalGrainCost && villageResources.gold >= totalGoldCost;

              return (
                <div 
                  key={group.unitType}
                  className="bg-[#1b1008] border-2 border-[#54361c] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#100904] border border-[#52371e] flex items-center justify-center text-2xl shrink-0">
                      ⚔️
                    </div>
                    <div>
                      <div className="font-serif font-bold text-sm text-[#fef3c7] flex items-center gap-2">
                        <span>{uDef?.name || group.unitType}</span>
                        <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/70 px-2 py-0.2 rounded border border-rose-700/60">
                          {group.count} Yaralı
                        </span>
                      </div>
                      <div className="text-[11px] text-[#cfbda4] font-serif mt-0.5">
                        Birim Başı Tedavi: {group.grainHealCostPerUnit} Tahıl • {group.goldHealCostPerUnit} Altın
                      </div>
                    </div>
                  </div>

                  {/* Bedel ve Şifalandır Butonu */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right text-xs font-mono">
                      <div className="text-amber-300 font-bold flex items-center gap-1 justify-end">
                        <ResourceIcon type="grain" size="sm" />
                        <span>{totalGrainCost}</span>
                      </div>
                      <div className="text-yellow-400 font-bold flex items-center gap-1 justify-end mt-0.5">
                        <ResourceIcon type="gold" size="sm" />
                        <span>{totalGoldCost}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onHealUnits(group.unitType, group.count)}
                      disabled={!canAffordAll}
                      className={`px-4 py-2 rounded-xl font-serif font-black text-xs transition shadow flex items-center gap-1.5 cursor-pointer ${
                        canAffordAll
                          ? 'bg-gradient-to-b from-emerald-800 to-emerald-950 border border-emerald-400 text-emerald-100 hover:brightness-125'
                          : 'bg-[#29170c] border border-[#4a2e1a] text-[#806144] cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{canAffordAll ? 'Şifalandır' : 'Yetersiz Kaynak'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Kapat Butonu Alt Bar */}
        <div className="p-3 bg-[#170e07] border-t border-[#4a2e16] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#261509] hover:bg-[#38200e] border border-[#52371e] text-xs font-serif font-bold text-[#decab0] transition cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
