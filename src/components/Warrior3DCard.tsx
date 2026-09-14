import React, { useState } from 'react';
import { UnitType, UnitDefinition } from '../types/game';
import { UNITS, UNIT_IMAGE_MAP } from '../data/gameData';
import { 
  Shield, 
  Swords, 
  Skull, 
  Heart, 
  Zap, 
  Package, 
  Sparkles, 
  Info,
  Maximize2,
  X
} from 'lucide-react';

interface Warrior3DCardProps {
  unitId: UnitType | string;
  before: number;
  lost: number;
  remaining?: number;
  side?: 'attacker' | 'defender';
  interactive?: boolean;
  onInspect?: () => void;
}

export const Warrior3DCard: React.FC<Warrior3DCardProps> = ({
  unitId,
  before,
  lost,
  remaining,
  side = 'attacker',
  interactive = true,
  onInspect,
}) => {
  const [imgError, setImgError] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [tilt, setTilt] = useState<{ x: number; y: number; glareX: number; glareY: number }>({
    x: 0,
    y: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const unitDef: UnitDefinition | undefined = UNITS[unitId as UnitType];
  const unitName = unitDef?.name || unitId.replace('_', ' ');
  const calculatedRemaining = remaining ?? Math.max(0, before - lost);
  const lossPercentage = before > 0 ? Math.min(100, Math.round((lost / before) * 100)) : 0;
  const survivorPercentage = 100 - lossPercentage;

  const customImg = unitDef?.image || UNIT_IMAGE_MAP[unitId as UnitType];
  const candidateUrls = [
    ...(customImg ? [customImg] : []),
    `/drawable/${unitId}.webp`,
    `/drawable/alp.webp`,
    `/assets/units/${unitId}.webp`,
    `/${unitId}.webp`,
  ].filter((v, i, a) => a.indexOf(v) === i);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const imageSrc = candidateUrls[candidateIndex] || candidateUrls[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const handleCardClick = () => {
    if (onInspect) {
      onInspect();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
        }}
        className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer select-none group shadow-lg flex flex-col justify-between ${
          side === 'attacker'
            ? 'bg-gradient-to-b from-stone-900 via-stone-950 to-red-950/40 border-stone-700 hover:border-red-500/80'
            : 'bg-gradient-to-b from-stone-900 via-stone-950 to-blue-950/40 border-stone-700 hover:border-blue-500/80'
        }`}
      >
        {/* Dynamic Specular Glare Reflection */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 65%)`,
            }}
          />
        )}

        {/* Top Header / Unit Badge */}
        <div className="p-2.5 flex items-center justify-between border-b border-stone-800/80 bg-stone-950/60 z-10 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                side === 'attacker' ? 'bg-red-500' : 'bg-blue-500'
              }`}
            />
            <h4 className="font-bold text-xs text-stone-100 truncate font-serif">{unitName}</h4>
          </div>

          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800 text-stone-400">
            {unitDef?.category || 'Savaşçı'}
          </span>
        </div>

        {/* Real WebP 3D Warrior Render Showcase */}
        <div className="relative w-full aspect-square bg-radial from-stone-800/40 via-stone-950 to-black overflow-hidden flex items-center justify-center p-2">
          {!imgError ? (
            <img
              src={imageSrc}
              alt={unitName}
              referrerPolicy="no-referrer"
              onError={() => {
                if (candidateIndex < candidateUrls.length - 1) {
                  setCandidateIndex(prev => prev + 1);
                } else {
                  setImgError(true);
                }
              }}
              className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-center p-4 text-stone-500 text-xs font-mono">
              [3D WebP: {unitId}]
            </div>
          )}

          {/* 3D Model Badge at bottom corner */}
          <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-black/80 border border-amber-600/50 text-[9px] font-mono font-bold text-amber-400 flex items-center gap-1 shadow-sm backdrop-blur-xs">
            <Sparkles className="w-2.5 h-2.5" />
            <span>3D MODEL</span>
          </div>

          {/* Expand icon on hover */}
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/70 border border-stone-700 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 className="w-3 h-3" />
          </div>
        </div>

        {/* Casualty & Combat Telemetry Data */}
        <div className="p-3 space-y-2 bg-stone-950/80 border-t border-stone-800/80">
          
          {/* Numbers: Before, Lost, Remaining */}
          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="p-1.5 rounded bg-stone-900/90 border border-stone-800">
              <span className="text-[9px] text-stone-500 block">Ordu</span>
              <strong className="text-stone-200 text-xs">{before}</strong>
            </div>

            <div className="p-1.5 rounded bg-red-950/50 border border-red-900/60">
              <span className="text-[9px] text-red-400 flex items-center justify-center gap-0.5">
                <Skull className="w-2.5 h-2.5" />
                Kayıp
              </span>
              <strong className="text-red-300 text-xs font-bold">-{lost}</strong>
            </div>

            <div className="p-1.5 rounded bg-emerald-950/50 border border-emerald-900/60">
              <span className="text-[9px] text-emerald-400 flex items-center justify-center gap-0.5">
                <Heart className="w-2.5 h-2.5" />
                Sağ
              </span>
              <strong className="text-emerald-300 text-xs font-bold">{calculatedRemaining}</strong>
            </div>
          </div>

          {/* Loss / Survival Visual Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] font-mono text-stone-400 mb-0.5">
              <span>Zayiat Oranı:</span>
              <span className={lossPercentage > 50 ? 'text-red-400 font-bold' : 'text-stone-300'}>
                %{lossPercentage}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${lossPercentage}%` }}
                className="bg-red-500 transition-all duration-500"
              />
              <div
                style={{ width: `${survivorPercentage}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
            </div>
          </div>

          {/* Tactical Specs Footnote - 4 Ana Unsur Sistemi */}
          {unitDef && (
            <div className="pt-1.5 border-t border-stone-900 space-y-1 text-[10px] font-mono">
              <div className="flex items-center justify-between text-stone-300">
                <span className="flex items-center gap-1 text-red-400 font-bold">
                  <Swords className="w-3 h-3 text-red-400" />
                  Sal: {unitDef.attackPower}
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <Shield className="w-3 h-3 text-blue-400" />
                  Sav: {unitDef.defenseInfantry}P / {unitDef.defenseCavalry}S
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-amber-300 font-bold">
                  ⚡ Hız: {unitDef.speedScore ?? 50}/100
                </span>
                <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                  💰 Ganimet: {unitDef.plunderScore ?? 50}/100
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Warrior Full Inspection Modal */}
      {modalOpen && (
        <div 
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-stone-950 border-2 border-amber-600/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {unitDef?.category || 'Savaşçı'} • 3D MUHAREBE İNCELEMESİ
                </span>
                <h3 className="text-lg font-bold text-stone-100 font-serif mt-1">{unitName}</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3D WebP Full Character View */}
            <div className="p-6 bg-gradient-to-b from-stone-900 via-stone-950 to-black flex items-center justify-center relative">
              <div className="w-64 h-64 relative filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)]">
                <img
                  src={imageSrc}
                  alt={unitName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-stone-950/80 border border-stone-800 text-[11px] font-mono text-stone-300">
                Format: <strong className="text-emerald-400">WebP 3D Render</strong>
              </div>
            </div>

            {/* Tactical Information */}
            <div className="p-5 space-y-4 text-xs">
              {unitDef?.description && (
                <p className="text-stone-300 leading-relaxed italic border-l-2 border-amber-600 pl-3">
                  "{unitDef.description}"
                </p>
              )}

              {/* 5 Temel Puan Gücü Dağılımı */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-stone-400 font-mono text-[10px] uppercase tracking-wider font-bold">
                    5 Temel Puan Gücü (Maksimum 100 Bar)
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    unitDef?.isSpecialUnit
                      ? 'bg-amber-950/80 text-amber-300 border-amber-600/80'
                      : 'bg-stone-900 text-stone-300 border-stone-800'
                  }`}>
                    {unitDef?.isSpecialUnit ? '⭐ Özel Beylik Askeri' : 'Standart Ordu Askeri'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <div className="p-2 bg-stone-900 rounded border border-stone-800 text-center">
                    <span className="text-stone-400 block text-[10px]">Saldırı Gücü</span>
                    <strong className="text-red-400 text-sm">{unitDef?.attackPower} / 100</strong>
                    <div className="mt-1 h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                        style={{ width: `${Math.min(100, Math.max(0, unitDef?.attackPower || 0))}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-stone-900 rounded border border-stone-800 text-center">
                    <span className="text-stone-400 block text-[10px]">Piyade Savunması</span>
                    <strong className="text-blue-400 text-sm">{unitDef?.defenseInfantry} / 100</strong>
                    <div className="mt-1 h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                        style={{ width: `${Math.min(100, Math.max(0, unitDef?.defenseInfantry || 0))}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-stone-900 rounded border border-stone-800 text-center">
                    <span className="text-stone-400 block text-[10px]">Süvari Savunması</span>
                    <strong className="text-cyan-400 text-sm">{unitDef?.defenseCavalry} / 100</strong>
                    <div className="mt-1 h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-teal-400"
                        style={{ width: `${Math.min(100, Math.max(0, unitDef?.defenseCavalry || 0))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono mt-2">
                  <div className="p-2 bg-stone-900 rounded-lg border border-amber-900/40 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-amber-400 block text-[10px] font-bold">⚡ Sefer Hızı</span>
                      <strong className="text-amber-300 text-sm">{unitDef?.speedScore ?? 50} / 100</strong>
                    </div>
                    <div className="mt-1">
                      <div className="relative h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-amber-950 p-[1px]">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, unitDef?.speedScore ?? 50))}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-stone-400 block mt-1">({unitDef?.speedTilesPerMin} kare/dk)</span>
                    </div>
                  </div>
                  <div className="p-2 bg-stone-900 rounded-lg border border-amber-900/40 text-center flex flex-col justify-between">
                    <div>
                      <span className="text-yellow-400 block text-[10px] font-bold">💰 Ganimet Kapasitesi</span>
                      <strong className="text-emerald-400 text-sm">{unitDef?.plunderScore ?? 50} / 100</strong>
                    </div>
                    <div className="mt-1">
                      <div className="relative h-1.5 w-full bg-stone-950 rounded-full overflow-hidden border border-amber-950 p-[1px]">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-amber-400 to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, unitDef?.plunderScore ?? 50))}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-stone-400 block mt-1">({unitDef?.lootCapacity} yük/birim)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Battle Performance in this Report */}
              <div className="p-3 bg-stone-900/60 rounded-lg border border-stone-800 flex items-center justify-between font-mono">
                <div>
                  <span className="text-stone-400 block text-[11px]">Bu Savaştaki Başarımı:</span>
                  <span className="text-stone-200">
                    {before} nefer katıldı → <strong className="text-red-400">{lost} kayıp</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-400 block">Sağ Kalanlar:</span>
                  <strong className="text-emerald-400 text-sm">{calculatedRemaining} savaşçı</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
