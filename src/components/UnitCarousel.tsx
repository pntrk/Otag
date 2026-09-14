import React from 'react';
import { BuildingType, UnitType, Village } from '../types/game';
import { FACTIONS, UNITS, isUnitProducibleByFaction } from '../data/gameData';
import { UnitPortrait } from './UnitPortrait';
import { ParchmentTooltip } from './ParchmentTooltip';

export interface UnitCarouselProps {
  village: Village;
  onOpenBuilding: (type: BuildingType) => void;
  onSelectUnit?: (unitType: UnitType) => void;
}

export const UnitCarousel: React.FC<UnitCarouselProps> = ({
  village,
  onOpenBuilding,
  onSelectUnit,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const playerSpecialUnit = (faction.specialUnitId as UnitType) || 'akinci';

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
  const standardUnitsList = rawStandardUnits.filter(item => {
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

      return {
        type: uType,
        name: uDef?.name || uType,
        count: ownCount,
        stationedCount,
        total,
        building: item.building,
        isForeign: false,
        isAvailable: total > 0 || (village.buildings[item.building] || 0) > 0,
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
        isAvailable: total > 0,
      };
    })
  ];

  return (
    <div className="relative w-full z-20 bg-gradient-to-b from-[#24170e] via-[#170e08] to-[#100905] border-t-2 border-[#694825] p-1.5 sm:p-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.85)] select-none">
      
      {/* Şerit Başlığı */}
      <div className="flex items-center justify-between px-1.5 sm:px-2 pb-1 sm:pb-1.5 border-b border-[#472f17]/70 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-serif font-bold text-[#fce4a6]">
          <span>⚔️</span>
          <span>Garnizon & Askeri Birlik Kaseti</span>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono text-stone-400">
          <span className="hidden sm:inline">Eğitim veya detay için birlik yuvasına tıklayın</span>
          <span className="sm:hidden text-amber-300/80">⟵ Kaydırın ⟶</span>
        </span>
      </div>

      {/* Yatay Kaydırılabilir Asker Kaset Yuvaları - Mobil Touch Optimized */}
      <div className="flex overflow-x-auto custom-scrollbar scroll-smooth snap-x snap-mandatory gap-1.5 sm:gap-2 pb-1 sm:pb-0 px-0.5 sm:grid sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
        {carouselUnits.map((unit) => {
          const isZero = unit.total === 0;
          const isLocked = !unit.isAvailable;

          return (
            <div
              key={unit.type}
              onClick={() => {
                if (onSelectUnit) onSelectUnit(unit.type);
                onOpenBuilding(unit.building);
              }}
              className={`group relative flex flex-col items-center rounded-lg border transition cursor-pointer p-1 min-w-[62px] sm:min-w-0 w-[62px] sm:w-auto shrink-0 sm:shrink snap-start touch-manipulation active:scale-95 ${
                isLocked
                  ? 'border-stone-800 bg-[#0f0a06]/80 opacity-50 hover:opacity-75'
                  : isZero
                  ? 'border-[#4a3219] bg-[#1a110a] hover:border-amber-400 hover:bg-[#291a0f]'
                  : 'border-[#8f632d] bg-gradient-to-b from-[#2a1b10] to-[#140c06] hover:border-[#ffd700] shadow-md hover:shadow-[0_0_10px_rgba(212,175,55,0.3)]'
              }`}
              title={`${unit.name}: ${unit.total} Mevcut (${unit.isForeign ? 'Müttefik Desteği' : 'Köy Askeri'})${isLocked ? ' (Kilitli/Talimgah Gerekli)' : ''}`}
            >
              
              {/* Card Slot Frame Container */}
              <div className="relative w-full aspect-[4/5] rounded overflow-hidden flex items-center justify-center bg-black/50 border border-[#52381e]/60">
                {/* Unit Portrait */}
                <div className={`w-full h-full transition-transform duration-200 group-hover:scale-105 ${
                  isLocked ? 'filter grayscale brightness-75' : isZero ? 'filter brightness-90' : ''
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
                  <div className="absolute top-0.5 right-0.5 z-20 bg-emerald-950/90 text-emerald-300 text-[7px] sm:text-[8px] font-bold px-0.5 sm:px-1 rounded border border-emerald-500/70 shadow">
                    🛡️
                  </div>
                )}
              </div>

              {/* Alt Plaket / Sayı Kutusu (Gold Plaque Style) */}
              <div className="relative z-20 w-full mt-0.5 sm:mt-1 px-0.5 sm:px-1 py-0.5 rounded border border-[#61411f] bg-gradient-to-r from-[#170e07] via-[#2d1b0d] to-[#170e07] shadow-inner text-center">
                <div className="font-mono font-bold text-[11px] sm:text-[13px] leading-tight tracking-tight">
                  <span className={
                    isLocked 
                      ? 'text-stone-500' 
                      : isZero 
                      ? 'text-stone-400' 
                      : 'text-[#ffd700] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                  }>
                    {unit.total.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="text-[8px] sm:text-[9px] font-serif text-amber-200/80 truncate w-full group-hover:text-amber-100 leading-tight">
                  {unit.name}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
