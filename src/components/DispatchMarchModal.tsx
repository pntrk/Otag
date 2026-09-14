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
  UNIT_IMAGE_MAP, 
  calculateDistance 
} from '../data/gameData';
import { 
  Swords, 
  ShieldAlert, 
  Eye, 
  Clock, 
  MapPin, 
  Zap, 
  X, 
  Check,
  Wheat,
  Shield,
  Flame,
  ChevronRight
} from 'lucide-react';

export interface DispatchMarchTarget {
  name: string;
  x: number;
  y: number;
  ownerName?: string;
  faction?: FactionId;
  villageId?: string;
}

export interface DispatchMarchModalProps {
  isOpen: boolean;
  onClose: () => void;
  originVillage: Village;
  playerVillages?: Village[];
  target: DispatchMarchTarget | null;
  initialMission?: MarchMission;
  onDispatch: (
    targetCoords: { x: number; y: number },
    targetName: string,
    mission: MarchMission,
    units: Partial<Record<UnitType, number>>,
    withKhan?: boolean,
    originVillageId?: string,
    isBoosted?: boolean
  ) => void;
}

export const DispatchMarchModal: React.FC<DispatchMarchModalProps> = ({
  isOpen,
  onClose,
  originVillage: initialOriginVillage,
  playerVillages = [initialOriginVillage],
  target,
  initialMission = 'attack',
  onDispatch,
}) => {
  const [selectedOriginVillageId, setSelectedOriginVillageId] = useState<string>(initialOriginVillage.id);
  const [mission, setMission] = useState<MarchMission>(initialMission);
  const [selectedUnits, setSelectedUnits] = useState<Partial<Record<UnitType, number>>>({});
  const [isBoosted, setIsBoosted] = useState<boolean>(false);

  // Aktif seçili çıkış köyünü bul
  const currentOriginVillage = useMemo(() => {
    return playerVillages.find(v => v.id === selectedOriginVillageId) || initialOriginVillage;
  }, [playerVillages, selectedOriginVillageId, initialOriginVillage]);

  // Modal veya hedef değiştiğinde sıfırla
  useEffect(() => {
    if (isOpen) {
      setSelectedOriginVillageId(initialOriginVillage.id);
      setMission(initialMission);
      setIsBoosted(false);
      
      // Eğer casus göreviyle açıldıysa otomatik olarak 10 veya mevcut kadar casus seç
      if (initialMission === 'spy') {
        const casusCount = initialOriginVillage.units?.casus || 0;
        setSelectedUnits({ casus: Math.min(casusCount, 10) || (casusCount > 0 ? casusCount : 0) });
      } else {
        setSelectedUnits({});
      }
    }
  }, [isOpen, target?.x, target?.y, initialOriginVillage.id, initialMission]);

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
  const distance = calculateDistance(
    currentOriginVillage.x, 
    currentOriginVillage.y, 
    target.x, 
    target.y
  );

  // Birlik listesi sıralaması
  const allUnitKeys = Object.keys(UNITS) as UnitType[];

  // Seçilen birliklerin hesaplanması
  let totalTroopCount = 0;
  let slowestSpeed = 999;
  let slowestSpeedScore = 100;
  let totalLootCapacity = 0;
  let totalPlunderScoreSum = 0;

  for (const [uKey, count] of Object.entries(selectedUnits)) {
    const num = Number(count) || 0;
    if (num > 0) {
      totalTroopCount += num;
      const unitDef = UNITS[uKey as UnitType];
      if (unitDef) {
        if (unitDef.speedTilesPerMin < slowestSpeed) {
          slowestSpeed = unitDef.speedTilesPerMin;
          slowestSpeedScore = unitDef.speedScore ?? 50;
        }
        totalLootCapacity += num * unitDef.lootCapacity;
        totalPlunderScoreSum += num * (unitDef.plunderScore ?? 50);
      }
    }
  }

  // Eğer hiçbir birlik seçilmediyse varsayılan piyade hızı
  if (slowestSpeed === 999) {
    slowestSpeed = 1.8;
    slowestSpeedScore = 50;
  }
  const avgPlunderScore = totalTroopCount > 0 ? Math.round(totalPlunderScoreSum / totalTroopCount) : 0;

  // Beylik sefer hızı çarpanı
  const factionMarchMult = (currentOriginVillage.faction && FACTIONS[currentOriginVillage.faction]?.marchSpeedMultiplier) || 1.0;
  const effectiveSpeed = slowestSpeed * factionMarchMult;

  // Süre hesaplama (100x Hızlandırma ile; Hızlandır seçildiyse 2 kat hızlı)
  const baseDurationSec = Math.max(2, Math.round(((distance / effectiveSpeed) * 60) / 100));
  const finalDurationSec = isBoosted ? Math.max(2, Math.round(baseDurationSec / 2)) : baseDurationSec;

  // Formatlı süre: SS:DD:SS (örn: 00:07:16)
  const formatTimeHMS = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Dinamik Tahıl Gereksinimi (Ordu mevcudu ve mesafeye bağlı erzak harcaması)
  const requiredGrain = totalTroopCount > 0 
    ? Math.max(1, Math.round(totalTroopCount * 0.15 * Math.max(1, distance * 0.2))) 
    : 0;

  // Birlik adedi değiştirici
  const handleUnitChange = (unitType: UnitType, val: number) => {
    const max = currentOriginVillage.units?.[unitType] || 0;
    const clamped = Math.max(0, Math.min(max, isNaN(val) ? 0 : val));
    setSelectedUnits(prev => ({
      ...prev,
      [unitType]: clamped
    }));
  };

  // Tümünü seç
  const handleSelectAllUnit = (unitType: UnitType) => {
    const max = currentOriginVillage.units?.[unitType] || 0;
    setSelectedUnits(prev => ({
      ...prev,
      [unitType]: max
    }));
  };

  // Gönderimi onayla
  const handleConfirmDispatch = () => {
    if (totalTroopCount <= 0) return;

    onDispatch(
      { x: target.x, y: target.y },
      target.name,
      mission,
      selectedUnits,
      false, // withKhan
      currentOriginVillage.id,
      isBoosted
    );
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-gradient-to-b from-[#24170d] via-[#1a1109] to-[#120a05] border-2 border-[#d4af37] rounded-xl shadow-[0_15px_60px_rgba(0,0,0,0.95)] flex flex-col text-[#f3e5ce] overflow-hidden max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* PENCERE BAŞLIĞI */}
        <div className="shrink-0 bg-gradient-to-r from-[#3d2412] via-[#543419] to-[#3d2412] border-b-2 border-[#caa05a] px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-300 drop-shadow" />
            <h2 className="font-serif font-black text-amber-100 text-base tracking-wider uppercase drop-shadow">
              Asker Gönder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#2a170b] hover:bg-[#4d2c16] border border-[#caa05a]/60 text-amber-200 hover:text-white flex items-center justify-center transition cursor-pointer font-bold shadow-inner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          
          {/* ÜST BÖLÜM (2 KOLON: ŞEHİR SEÇİMİ VE HEDEF/GÖREV AYARLARI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. ÜST SOL BÖLÜM: "Hangi şehrin askerleri yollanacak?" */}
            <div className="bg-[#150d06]/90 border border-[#523d26] rounded-xl p-3.5 flex flex-col shadow-inner">
              <h3 className="font-serif font-bold text-amber-300 text-xs border-b border-[#3d2915] pb-2 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Hangi şehrin askerleri yollanacak?</span>
              </h3>
              
              <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
                {playerVillages.map((v) => {
                  const isSelected = v.id === currentOriginVillage.id;
                  const totalGarrison = Object.values(v.units || {}).reduce((a: number, b) => a + (Number(b) || 0), 0);
                  
                  return (
                    <label 
                      key={v.id}
                      onClick={() => setSelectedOriginVillageId(v.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition cursor-pointer text-xs ${
                        isSelected 
                          ? 'bg-gradient-to-r from-[#4d2f14] to-[#2e1c0c] border-[#caa05a] text-[#fef08a] shadow-md font-bold'
                          : 'bg-[#1a1109]/80 border-[#382614] text-[#cfbe9e] hover:bg-[#281a0e] hover:border-[#6f4f2c]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="originVillage"
                          checked={isSelected}
                          onChange={() => setSelectedOriginVillageId(v.id)}
                          className="w-3.5 h-3.5 accent-[#d4af37] cursor-pointer"
                        />
                        <span className="font-serif">
                          {v.name}
                        </span>
                        <span className="text-[10px] font-mono opacity-80 text-amber-300/90">
                          ({v.x}|{v.y})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {v.isCapital && (
                          <span className="text-[9px] font-serif bg-amber-950 px-1.5 py-0.2 rounded border border-amber-600/60 text-amber-200">
                            Merkez
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#a89476]">
                          {totalGarrison.toLocaleString()} er
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 2. ÜST SAĞ BÖLÜM: "Askerler neden gönderilecek?" & Hedef Bilgileri */}
            <div className="bg-[#150d06]/90 border border-[#523d26] rounded-xl p-3.5 flex flex-col justify-between shadow-inner space-y-3">
              <div>
                <h3 className="font-serif font-bold text-amber-300 text-xs border-b border-[#3d2915] pb-2 mb-2.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Askerler neden gönderilecek?</span>
                </h3>

                {/* Görev Radyo Butonları */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'attack', label: 'Saldırı', icon: '⚔️', color: 'text-rose-300' },
                    { id: 'raid', label: 'Yağma', icon: '🏇', color: 'text-amber-300' },
                    { id: 'support', label: 'Destek', icon: '🛡️', color: 'text-sky-300' },
                    { id: 'spy', label: 'Casusluk', icon: '👁️', color: 'text-purple-300' },
                  ].map((mItem) => {
                    const isMSelected = mission === mItem.id;
                    return (
                      <label
                        key={mItem.id}
                        onClick={() => setMission(mItem.id as MarchMission)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs cursor-pointer font-serif transition ${
                          isMSelected
                            ? 'bg-gradient-to-r from-[#6b2513] to-[#45160b] border-[#caa05a] text-[#fef08a] font-bold shadow-md'
                            : 'bg-[#1b1108] border-[#3a2715] text-[#bda688] hover:bg-[#2a1b0e]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="marchMission"
                          checked={isMSelected}
                          onChange={() => setMission(mItem.id as MarchMission)}
                          className="sr-only"
                        />
                        <span>{mItem.icon}</span>
                        <span>{mItem.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* HEDEF VE SEFER HESAPLARI (VİDEODAKİ GİBİ YEŞİL VE KIRMIZI RENKLERLE) */}
              <div className="bg-[#0e0804] border border-[#3e2715] rounded-lg p-3 space-y-2 text-xs font-serif">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#a89476]">Hedef Şehir:</span>
                  <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm drop-shadow">
                    {target.name} {target.ownerName ? `(${target.ownerName})` : ''} [{target.x}|{target.y}]
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#a89476] flex items-center gap-1">
                    <Wheat className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Yolculuk için gerekli tahıl:</span>
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {requiredGrain.toLocaleString()} tahıl
                  </span>
                </div>

                {/* Ordu Hız ve Yağma Göstergeleri */}
                <div className="grid grid-cols-2 gap-2 border-t border-[#26170a] pt-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between bg-[#150d07] px-2 py-1 rounded border border-[#3e2715]">
                    <span className="text-amber-400/90 font-serif flex items-center gap-1">⚡ Ordu Hızı:</span>
                    <span className="text-amber-300 font-bold">{totalTroopCount > 0 ? slowestSpeedScore : '-'}/100</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#150d07] px-2 py-1 rounded border border-[#3e2715]">
                    <span className="text-yellow-400/90 font-serif flex items-center gap-1">💰 Yağma Kapasitesi:</span>
                    <span className="text-yellow-300 font-bold">{totalLootCapacity.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#26170a] pt-1.5">
                  <span className="text-[#a89476] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Yolculuk süresi:</span>
                  </span>
                  <span className="text-rose-400 font-mono font-bold text-sm sm:text-base tracking-wider animate-pulse">
                    {formatTimeHMS(finalDurationSec)}
                  </span>
                </div>

                {/* Hızlandır Onay Kutusu */}
                <div className="border-t border-[#26170a] pt-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-200">
                    <input
                      type="checkbox"
                      checked={isBoosted}
                      onChange={(e) => setIsBoosted(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
                    />
                    <span className="flex items-center gap-1 font-bold">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Hızlandır (2x Hızlı İntikal)</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    {isBoosted ? 'Süre yarıya indirildi' : 'Normal Hız'}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* 3. ALT BÖLÜM: BİRLİK SEÇİM TEPSİSİ (Troop Trays) */}
          <div className="bg-[#150d06]/90 border border-[#523d26] rounded-xl p-3.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-[#3d2915] pb-2 mb-3">
              <h3 className="font-serif font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>Sefer Ordusu Birlik Seçimi</span>
              </h3>
              <div className="text-[11px] text-[#decab0] font-mono">
                Seçilen Toplam: <strong className="text-amber-300">{totalTroopCount.toLocaleString()}</strong> asker
              </div>
            </div>

            {/* Birlik Kartları Izgarası */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {allUnitKeys.map((uKey) => {
                const uDef = UNITS[uKey];
                const availableCount = currentOriginVillage.units?.[uKey] || 0;
                const currentCount = selectedUnits[uKey] || 0;
                const unitImg = UNIT_IMAGE_MAP[uKey] || '/drawable/mizrakli.webp';

                return (
                  <div 
                    key={uKey}
                    className={`flex flex-col items-center bg-[#1c120a] border rounded-xl p-2 transition shadow-sm ${
                      availableCount > 0 
                        ? 'border-[#4a341f] hover:border-[#caa05a]/80' 
                        : 'border-[#2d1e11] opacity-50'
                    }`}
                  >
                    {/* Birlik Portresi */}
                    <div className="w-12 h-12 rounded-lg bg-[#0e0804] border border-[#523d26] p-1 flex items-center justify-center overflow-hidden mb-1.5 relative shadow-inner">
                      <img 
                        src={unitImg} 
                        alt={uDef.name}
                        className="w-full h-full object-contain filter drop-shadow"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>

                    {/* Birlik Adı */}
                    <span className="text-[10px] font-serif font-bold text-amber-100 text-center truncate w-full">
                      {uDef.name}
                    </span>

                    {/* Hız ve Yağma Puanı */}
                    <div className="flex items-center justify-center gap-1 text-[9px] font-mono mb-1 text-stone-400">
                      <span className="text-amber-300" title="Hız Puanı">⚡{uDef.speedScore ?? 50}</span>
                      <span className="text-stone-500">•</span>
                      <span className="text-yellow-400" title="Yağma Puanı">💰{uDef.plunderScore ?? 50}</span>
                    </div>

                    {/* Sayı Giriş Kutusu */}
                    <input
                      type="number"
                      min={0}
                      max={availableCount}
                      value={currentCount === 0 ? '' : currentCount}
                      placeholder="0"
                      disabled={availableCount <= 0}
                      onChange={(e) => handleUnitChange(uKey, parseInt(e.target.value, 10))}
                      className="w-full bg-[#0a0502] border border-[#5c4021] text-amber-300 font-mono font-bold text-center text-xs py-1 rounded focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />

                    {/* Mevcut Asker Sayısı (Parantez İçinde) */}
                    <div className="mt-1 flex items-center justify-between w-full text-[10px] font-mono px-0.5">
                      <span className="text-[#a89476]">
                        ({availableCount.toLocaleString()})
                      </span>
                      
                      {availableCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllUnit(uKey)}
                          title="Tümünü Seç"
                          className="text-[9px] text-amber-400 hover:text-amber-200 underline cursor-pointer font-sans"
                        >
                          Tümü
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* SAĞ ALT ONAY VE İPTAL BUTONLARI (Ağır Döküm Bronz [Tamam] Butonu Sabit Alt Bar) */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#140c06] border-t-2 border-[#523d26] flex items-center justify-between gap-3 shadow-2xl">
          <div className="text-xs text-[#deb887] font-serif flex items-center gap-2">
            <span>Sefer Gücü:</span>
            <span className="font-mono font-bold text-amber-300 text-sm bg-[#22150b] px-2.5 py-0.5 rounded border border-[#523d26]">
              {totalTroopCount.toLocaleString()} Asker
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2 rounded-lg bg-[#2b1b10] hover:bg-[#3d2616] text-[#decab0] hover:text-white border border-[#5a3f24] font-serif font-bold text-xs transition cursor-pointer"
            >
              İptal
            </button>

            <button
              type="button"
              onClick={handleConfirmDispatch}
              disabled={totalTroopCount <= 0}
              className={`px-6 sm:px-8 py-2 sm:py-2.5 rounded-lg font-serif font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-xl flex items-center gap-2 border-2 ${
                totalTroopCount > 0
                  ? 'bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#78350f] hover:from-[#d97706] hover:to-[#92400e] text-[#fef08a] border-[#d4af37] cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'bg-[#21150c] text-[#6b553e] border-[#422c19] cursor-not-allowed opacity-60'
              }`}
            >
              <Swords className="w-4 h-4 text-yellow-300" />
              <span>Tamam</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
