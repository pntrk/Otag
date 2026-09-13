import React, { useState, useMemo } from 'react';
import { Resources, Village } from '../types/game';
import { BUILDINGS, FACTIONS, calculateDistance } from '../data/gameData';
import { collisionDataMap } from '../engine/collisionDataMap';
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  X, 
  Compass, 
  Trees, 
  Layers, 
  ShieldCheck, 
  Wheat, 
  Coins,
  Crown,
  Waves,
  Navigation,
  ScrollText,
  Castle
} from 'lucide-react';
import { ResourceIcon } from './ResourceIcon';

interface FoundVillageModalProps {
  playerVillages: Village[];
  rivalVillages: Village[];
  activeVillage: Village;
  prefilledCoords?: { x: number; y: number } | null;
  onClose: () => void;
  onFoundVillage: (name: string, x: number, y: number) => void;
}

// Yeni Köy Kurma Sabit Maliyeti (İskan / Göç Seferi)
export const FOUND_VILLAGE_COST: Resources = {
  wood: 500,
  stone: 500,
  iron: 500,
  grain: 500,
  gold: 200,
};

export const FoundVillageModal: React.FC<FoundVillageModalProps> = ({
  playerVillages,
  rivalVillages,
  activeVillage,
  prefilledCoords,
  onClose,
  onFoundVillage,
}) => {
  // Kurulum şartları hesaplaması:
  const qualifiedVillagesCount = playerVillages.filter(v => (v.buildings.town_hall || 0) >= 10).length;
  const maxAllowedVillages = Math.min(10, 1 + qualifiedVillagesCount);
  const currentCount = playerVillages.length;
  const canFoundNew = currentCount < maxAllowedVillages && currentCount < 10;

  // Başlangıç koordinatı: prefilled yoksa aktif köyün yakınında geçerli bir kara noktası bul
  const initialCoord = useMemo(() => {
    if (prefilledCoords) return prefilledCoords;
    const testCoord = { x: activeVillage.x + 3, y: activeVillage.y + 2 };
    if (!collisionDataMap.isWater(testCoord.x, testCoord.y)) return testCoord;
    return collisionDataMap.findNearestValidLand(testCoord.x, testCoord.y);
  }, [prefilledCoords, activeVillage.x, activeVillage.y]);

  // Form durumları
  const [villageName, setVillageName] = useState<string>('');
  const [coordX, setCoordX] = useState<number>(initialCoord.x);
  const [coordY, setCoordY] = useState<number>(initialCoord.y);

  // Kaynak kontrolü (Aktif köyden karşılanır)
  const hasEnoughWood = activeVillage.resources.wood >= FOUND_VILLAGE_COST.wood;
  const hasEnoughStone = activeVillage.resources.stone >= FOUND_VILLAGE_COST.stone;
  const hasEnoughIron = activeVillage.resources.iron >= FOUND_VILLAGE_COST.iron;
  const hasEnoughGrain = activeVillage.resources.grain >= FOUND_VILLAGE_COST.grain;
  const hasEnoughGold = activeVillage.resources.gold >= FOUND_VILLAGE_COST.gold;
  const hasEnoughResources = hasEnoughWood && hasEnoughStone && hasEnoughIron && hasEnoughGrain && hasEnoughGold;

  // 1000x500 Harita Sınır ve Su Kontrolü
  const isOutOfBounds = coordX < 0 || coordX > 1000 || coordY < 0 || coordY > 500;
  const isOccupiedByPlayer = playerVillages.some(v => v.x === coordX && v.y === coordY);
  const isOccupiedByRival = rivalVillages.some(v => v.x === coordX && v.y === coordY);
  const isSpotOccupied = isOccupiedByPlayer || isOccupiedByRival;

  // Gerçek GIS Coğrafi Su / Kara Kontrolü
  const isWater = collisionDataMap.isWater(coordX, coordY);
  const biomeInfo = collisionDataMap.getPixelInfo(coordX, coordY);

  const isValidPlacement = !isOutOfBounds && !isSpotOccupied && !isWater && villageName.trim().length > 0;
  const canSubmit = canFoundNew && hasEnoughResources && isValidPlacement;

  // En yakın geçerli karayı bul ve koordinatları oraya zıplat
  const handleSnapToNearestLand = () => {
    const nearest = collisionDataMap.findNearestValidLand(coordX, coordY);
    setCoordX(nearest.x);
    setCoordY(nearest.y);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onFoundVillage(villageName.trim(), coordX, coordY);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/85 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md animate-fade-in font-serif">
      {/* Masif Ceviz Çerçeveli İskân Mülknâmesi Kasası */}
      <div className="bg-[#1c140c] border-4 border-[#7a552b] rounded-2xl max-w-xl w-full text-[#f2e6cf] shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] relative">
        
        {/* Başlık — Mülknâme Ferman Başlığı */}
        <div className="shrink-0 bg-gradient-to-r from-[#2c1a0e] via-[#3d2716] to-[#2c1a0e] px-4 sm:px-5 py-3.5 border-b-2 border-[#8c6738] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#5c3c1e] to-[#2b190a] border-2 border-[#caa05a] flex items-center justify-center text-xl shadow shrink-0">
              📜
            </div>
            <div>
              <h3 className="font-bold text-[#fef08a] text-base sm:text-lg tracking-wide drop-shadow flex items-center gap-2">
                İskân & Mülknâme Fermanı
              </h3>
              <p className="text-[11px] text-[#decab0] font-serif">
                13. Yüzyıl Anadolu Coğrafyası (1000x500 Grid) • Azami 10 Otağ İskânı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#2b1b10] hover:bg-[#432d1d] text-[#decab0] hover:text-[#fef08a] transition border border-[#6b4724] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parşömen Gövdesi */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 bg-gradient-to-b from-[#24170d] via-[#1a1008] to-[#140c06] custom-scrollbar">
            
            {/* 1. İlerleme ve Kural Durum Kartı (Altın Varaklı Mülknâme Şeridi) */}
            <div className="bg-[#f4ebd8] text-[#2c1d11] border-2 border-[#8c6738] rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#4a2e16] flex items-center gap-1.5 font-serif">
                  <Crown className="w-4 h-4 text-[#b45309]" />
                  Mevcut Oba Kapasitesi: {currentCount} / 10
                </span>
                <span className="text-xs font-mono bg-[#2a1a0e] px-3 py-0.5 rounded-full border border-[#d4af37] text-[#fef08a] font-black shadow self-start sm:self-auto">
                  Açık İskân Hakkı: {maxAllowedVillages} Oba
                </span>
              </div>

              {/* İlerleme Barı (Altın Varaklı Şerit) */}
              <div className="w-full bg-[#d5c2a1] h-3 rounded-full overflow-hidden border border-[#967448] p-[1px]">
                <div 
                  className="bg-gradient-to-r from-[#99521e] via-[#d97706] to-[#fbbf24] h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(217,119,6,0.6)]"
                  style={{ width: `${(currentCount / 10) * 100}%` }}
                />
              </div>

              <div className="text-[11px] text-[#543b23] leading-relaxed pt-0.5 font-serif">
                <strong>İskân Fermanı Şartı:</strong> Yeni bir oba mülkü açabilmek için mevcut köylerinizden birinin 
                <strong className="text-[#8a3319] font-bold"> Merkez Binası Seviye 10</strong> seviyesine erişmesi iktiza eder.
                Hâlihazırda <strong className="text-[#14532d] font-black">{qualifiedVillagesCount} adet</strong> 10. Seviye Merkez Otağınız mevcuttur.
              </div>

              {!canFoundNew && (
                <div className="bg-[#7f1d1d]/15 border-2 border-[#b91c1c] rounded-lg p-2.5 text-xs text-[#7f1d1d] flex items-start gap-2 mt-2 font-serif font-bold">
                  <AlertCircle className="w-4 h-4 text-[#b91c1c] shrink-0 mt-0.5" />
                  <div>
                    <span className="underline">Hüküm Eksik (İskân Hakkı Yok):</span> Bir sonraki otağı kurabilmek için mevcut köylerinizdeki Merkez Binasını Seviye 10'a yükseltmeniz ferman olunur.
                  </div>
                </div>
              )}
            </div>

            {/* 2. Form Alanları */}
            <div className="space-y-4">
              
              {/* Köy Adı */}
              <div>
                <label className="block text-xs font-bold text-[#fef08a] mb-1 font-serif drop-shadow">
                  Yeni Köy / Otağ Adı:
                </label>
                <input 
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="Örn: İnegöl Otağı, Domaniç, Akçakoca, Birgi..."
                  className="w-full px-3.5 py-2.5 bg-[#0e0704] border-2 border-[#5c3e1e] rounded-xl text-xs sm:text-sm text-[#fef08a] font-serif font-bold focus:border-[#caa05a] focus:outline-none shadow-inner"
                  disabled={!canFoundNew}
                />
              </div>

              {/* Koordinat Seçimi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#fef08a] flex items-center gap-1 font-serif">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Harita Koordinatları (0-1000 X | 0-500 Y):</span>
                  </label>
                  <span className="text-[11px] text-[#caa05a] font-mono">
                    Mesafe: {Math.round(calculateDistance(activeVillage.x, activeVillage.y, coordX, coordY))} kare
                  </span>
                </div>

                {/* Pirinç Pusula Kadranı Koordinat Yuvaları */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 bg-[#ebdcc2] px-3.5 py-2 rounded-xl border-2 border-[#826038] shadow-inner">
                    <span className="text-xs font-black text-[#7a2e18] font-mono">X:</span>
                    <input 
                      type="number"
                      min={0}
                      max={1000}
                      value={coordX}
                      onChange={(e) => setCoordX(Math.max(0, Math.min(1000, parseInt(e.target.value) || 0)))}
                      className="w-full bg-transparent text-sm text-[#7a2e18] font-mono font-black outline-none"
                      disabled={!canFoundNew}
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-[#ebdcc2] px-3.5 py-2 rounded-xl border-2 border-[#826038] shadow-inner">
                    <span className="text-xs font-black text-[#7a2e18] font-mono">Y:</span>
                    <input 
                      type="number"
                      min={0}
                      max={500}
                      value={coordY}
                      onChange={(e) => setCoordY(Math.max(0, Math.min(500, parseInt(e.target.value) || 0)))}
                      className="w-full bg-transparent text-sm text-[#7a2e18] font-mono font-black outline-none"
                      disabled={!canFoundNew}
                    />
                  </div>
                </div>

                {/* Biyom ve Su Durumu Canlı Bilgilendirmesi */}
                <div className="mt-2.5 space-y-1.5">
                  {isWater ? (
                    <div className="p-3 bg-gradient-to-r from-[#0c2238] to-[#061424] border-2 border-cyan-500/80 rounded-xl text-xs text-sky-200 flex items-start justify-between gap-3 shadow-lg animate-fade-in">
                      <div className="flex items-start gap-2">
                        <Waves className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-cyan-300 font-serif">
                            🌊 Deniz / Göl Suları Seçildi ({coordX} | {coordY})
                          </div>
                          <p className="text-[11px] text-sky-200/90 leading-relaxed font-serif mt-0.5">
                            Anadolu sahilleri ve gölleri üzerine yerleşim kurulamaz. Otağ yalnızca karasal araziye iskân edilebilir.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSnapToNearestLand}
                        className="shrink-0 px-3 py-1.5 bg-gradient-to-b from-[#0284c7] to-[#0369a1] hover:brightness-110 text-white rounded-lg text-xs font-serif font-black transition flex items-center gap-1 border border-cyan-300 cursor-pointer shadow active:scale-95"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Karaya Yerleş</span>
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-[#0c1c11] border-2 border-[#166534] rounded-xl text-xs text-emerald-300 flex items-center justify-between font-serif shadow-inner">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span><strong>Geçerli Karasal İskân Alanı:</strong> ({coordX}|{coordY}) verimli toprak.</span>
                      </div>
                      {biomeInfo.factionZone !== 'neutral' && biomeInfo.factionZone !== 'water' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 font-mono text-emerald-200 font-bold">
                          {FACTIONS[biomeInfo.factionZone]?.name || biomeInfo.factionZone} Toprağı
                        </span>
                      )}
                    </div>
                  )}

                  {/* Koordinat Doluluk Uyarıları */}
                  {isSpotOccupied && (
                    <p className="text-xs text-rose-300 flex items-center gap-1.5 font-serif bg-rose-950/80 p-2.5 rounded-xl border border-rose-700 shadow">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      Bu koordinatta ({coordX}|{coordY}) zaten bir beylik yerleşimi mevcut!
                    </p>
                  )}
                </div>
              </div>

              {/* 3. İskân Haracı & Sandık Gözleri (FOUND_VILLAGE_COST) */}
              <div className="bg-gradient-to-b from-[#2a1b10] via-[#1c1108] to-[#120a05] border-2 border-[#caa05a] rounded-2xl p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-[#fef08a] pb-1.5 border-b border-[#523d26] font-serif">
                  <span>Gereken İskân Hazinesi ({activeVillage.name} Ambarından):</span>
                  <span className="text-[10px] text-[#caa05a] font-mono bg-[#0c0703] px-2 py-0.5 rounded border border-[#52391c]">Tek Seferlik</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className={`p-2 rounded-xl border flex flex-col items-center justify-center shadow-inner ${hasEnoughWood ? 'bg-[#0c0703] border-emerald-700/60 text-emerald-300' : 'bg-red-950/60 border-red-800 text-red-300'}`}>
                    <ResourceIcon type="wood" size="sm" className="mb-1" />
                    <div className="font-bold font-mono text-sm">{FOUND_VILLAGE_COST.wood}</div>
                    <div className="text-[10px] text-[#baa485] font-serif">Odun</div>
                  </div>

                  <div className={`p-2 rounded-xl border flex flex-col items-center justify-center shadow-inner ${hasEnoughStone ? 'bg-[#0c0703] border-slate-700/60 text-slate-300' : 'bg-red-950/60 border-red-800 text-red-300'}`}>
                    <ResourceIcon type="stone" size="sm" className="mb-1" />
                    <div className="font-bold font-mono text-sm">{FOUND_VILLAGE_COST.stone}</div>
                    <div className="text-[10px] text-[#baa485] font-serif">Taş</div>
                  </div>

                  <div className={`p-2 rounded-xl border flex flex-col items-center justify-center shadow-inner ${hasEnoughIron ? 'bg-[#0c0703] border-zinc-700/60 text-zinc-300' : 'bg-red-950/60 border-red-800 text-red-300'}`}>
                    <ResourceIcon type="iron" size="sm" className="mb-1" />
                    <div className="font-bold font-mono text-sm">{FOUND_VILLAGE_COST.iron}</div>
                    <div className="text-[10px] text-[#baa485] font-serif">Demir</div>
                  </div>

                  <div className={`p-2 rounded-xl border flex flex-col items-center justify-center shadow-inner ${hasEnoughGrain ? 'bg-[#0c0703] border-amber-700/60 text-amber-300' : 'bg-red-950/60 border-red-800 text-red-300'}`}>
                    <ResourceIcon type="grain" size="sm" className="mb-1" />
                    <div className="font-bold font-mono text-sm">{FOUND_VILLAGE_COST.grain}</div>
                    <div className="text-[10px] text-[#baa485] font-serif">Tahıl</div>
                  </div>

                  <div className={`col-span-2 sm:col-span-1 p-2 rounded-xl border flex flex-col items-center justify-center shadow-inner ${hasEnoughGold ? 'bg-[#0c0703] border-yellow-700/60 text-yellow-300' : 'bg-red-950/60 border-red-800 text-red-300'}`}>
                    <ResourceIcon type="gold" size="sm" className="mb-1" />
                    <div className="font-bold font-mono text-sm text-[#fef08a]">{FOUND_VILLAGE_COST.gold}</div>
                    <div className="text-[10px] text-amber-300 font-serif font-bold">Altın</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sabit Alt Bar / Pinned Action Footer */}
          <div className="shrink-0 p-3 sm:p-4 bg-[#140c06] border-t-2 border-[#5c3e1e] flex items-center justify-end gap-3 shadow-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#2a1e14] hover:bg-[#3d2e1f] text-[#d6c4a8] rounded-xl text-xs font-serif font-bold transition border border-[#523d29] cursor-pointer"
            >
              Fermanı Kapat
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-serif font-black tracking-wider transition-all flex items-center gap-2 shadow-2xl ${
                canSubmit
                  ? 'bg-gradient-to-r from-[#8f2b18] via-[#a8351e] to-[#8f2b18] hover:from-[#a8351e] hover:to-[#be3e24] text-[#fff7e6] border-2 border-[#d4af37] shadow-[0_8px_25px_rgba(185,28,28,0.6)] cursor-pointer active:scale-98'
                  : 'bg-[#251b12] text-[#78644e] cursor-not-allowed border border-[#423120]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>{isWater ? 'Suya Otağ Kurulamaz' : 'KÖYÜ KUR VE İSKÂNI BAŞLAT'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
