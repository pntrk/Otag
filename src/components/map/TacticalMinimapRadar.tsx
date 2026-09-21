import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Village, March } from '../../types/game';
import { REAL_TURKEY_COASTLINE_GEO, REAL_LAKES_GEO, geoToMap } from '../../data/realTurkeyGeoData';
import { 
  Compass, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  MapPin, 
  Navigation,
  Shield,
  Swords,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';

interface TacticalMinimapRadarProps {
  camera: { x: number; y: number };
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  playerVillages: Village[];
  rivalVillages: Village[];
  activeMarches?: March[];
  selectedTile?: { x: number; y: number } | null;
  onPanToCoords: (x: number, y: number) => void;
  onSelectCoords?: (x: number, y: number) => void;
  currentRegionName?: string;
}

const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 500;
const BASE_TILE_SIZE = 40;

// Anadolu Tarihi Stratejik Hızlı İntikal Noktaları (Macro POIs)
export const STRATEGIC_WAYPOINTS = [
  { name: 'Söğüt & Domaniç', sub: 'Osmanlı Uç Beyliği', x: 55, y: 45, icon: '🛡️', color: 'border-red-600/70 text-red-300' },
  { name: 'Konya Payitaht', sub: 'Karamanoğulları & Selçuklu', x: 180, y: 220, icon: '👑', color: 'border-blue-600/70 text-blue-300' },
  { name: 'Ege & Menderes', sub: 'Aydınoğlu Donanması', x: 65, y: 260, icon: '🌊', color: 'border-emerald-600/70 text-emerald-300' },
  { name: 'Küre Dağları', sub: 'Candaroğulları Madenleri', x: 260, y: 70, icon: '⛏️', color: 'border-amber-600/70 text-amber-300' },
  { name: 'Kapadokya & Erciyes', sub: 'Eretna Devleti Yaylaları', x: 420, y: 200, icon: '⛰️', color: 'border-stone-500/70 text-stone-300' },
  { name: 'Çukurova & Toros', sub: 'Dulkadiroğulları Geçidi', x: 380, y: 340, icon: '🏰', color: 'border-purple-600/70 text-purple-300' },
  { name: 'Fırat & Dicle', sub: 'Artuklu İpek Yolu Havzası', x: 750, y: 350, icon: '🦅', color: 'border-cyan-600/70 text-cyan-300' },
  { name: 'Trabzon & Pontus', sub: 'Doğu Karadeniz Dağları', x: 650, y: 80, icon: '🏔️', color: 'border-rose-600/70 text-rose-300' },
  { name: 'Van Gölü & Ararat', sub: 'Karakoyunlu Sınır Boyu', x: 900, y: 230, icon: '❄️', color: 'border-indigo-600/70 text-indigo-300' },
];

export const TacticalMinimapRadar: React.FC<TacticalMinimapRadarProps> = ({
  camera,
  zoom,
  canvasWidth,
  canvasHeight,
  playerVillages,
  rivalVillages,
  activeMarches = [],
  selectedTile,
  onPanToCoords,
  onSelectCoords,
  currentRegionName = 'Anadolu Coğrafyası'
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(false);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingRadar, setIsDraggingRadar] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive radar boyutları
  const radarWidth = isMobile 
    ? (isExpanded ? 220 : 135) 
    : (isExpanded ? 280 : 185);
  const radarHeight = isMobile 
    ? (isExpanded ? 110 : 68) 
    : (isExpanded ? 140 : 92);

  // Önceden hesaplanmış kıyı şeridi ve göller
  const cachedCoastline = React.useMemo(() => {
    return REAL_TURKEY_COASTLINE_GEO.map(pt => geoToMap(pt.lon, pt.lat));
  }, []);

  const cachedLakes = React.useMemo(() => {
    return {
      vanGolu: REAL_LAKES_GEO.vanGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
      tuzGolu: REAL_LAKES_GEO.tuzGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
      beysehirGolu: REAL_LAKES_GEO.beysehirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
      iznikGolu: REAL_LAKES_GEO.iznikGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
    };
  }, []);

  // Minimap çizim fonksiyonu
  const drawRadar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina & High DPI
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== radarWidth * dpr || canvas.height !== radarHeight * dpr) {
      canvas.width = radarWidth * dpr;
      canvas.height = radarHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Arka Plan: Koyu Gece Denizi / Kartografik Zemin
    ctx.fillStyle = '#0a1017';
    ctx.fillRect(0, 0, radarWidth, radarHeight);

    // Deniz Dalga Izgarası
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < radarWidth; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, radarHeight);
      ctx.stroke();
    }
    for (let y = 0; y < radarHeight; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(radarWidth, y);
      ctx.stroke();
    }

    // 2. Kara Kütlesi (Anadolu ve Trakya Poligonu)
    if (cachedCoastline.length > 2) {
      ctx.beginPath();
      const first = cachedCoastline[0];
      ctx.moveTo((first.x / WORLD_WIDTH) * radarWidth, (first.y / WORLD_HEIGHT) * radarHeight);
      for (let i = 1; i < cachedCoastline.length; i++) {
        const pt = cachedCoastline[i];
        ctx.lineTo((pt.x / WORLD_WIDTH) * radarWidth, (pt.y / WORLD_HEIGHT) * radarHeight);
      }
      ctx.closePath();

      // Toprak / Taktik Gradyan
      const landGrad = ctx.createLinearGradient(0, 0, radarWidth, radarHeight);
      landGrad.addColorStop(0, '#1c2718');
      landGrad.addColorStop(0.5, '#243220');
      landGrad.addColorStop(1, '#2c2214');
      ctx.fillStyle = landGrad;
      ctx.fill();

      ctx.strokeStyle = '#5a7a44';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 3. Göller (Van, Tuz, Beyşehir, İznik)
    ctx.fillStyle = '#0a1017';
    ctx.strokeStyle = '#2d4a66';
    ctx.lineWidth = 0.6;
    (Object.values(cachedLakes) as { x: number; y: number }[][]).forEach(lakePoints => {
      if (lakePoints.length > 2) {
        ctx.beginPath();
        const f = lakePoints[0];
        ctx.moveTo((f.x / WORLD_WIDTH) * radarWidth, (f.y / WORLD_HEIGHT) * radarHeight);
        for (let i = 1; i < lakePoints.length; i++) {
          const pt = lakePoints[i];
          ctx.lineTo((pt.x / WORLD_WIDTH) * radarWidth, (pt.y / WORLD_HEIGHT) * radarHeight);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });

    // 4. Stratejik Beylik Hakimiyet Bölgeleri (Hafif Renk Işıltısı)
    const beylikSpheres = [
      { x: 55, y: 45, r: 24, color: 'rgba(220, 38, 38, 0.15)' },    // Osmanlı
      { x: 180, y: 220, r: 35, color: 'rgba(37, 99, 235, 0.14)' },  // Karaman
      { x: 65, y: 260, r: 25, color: 'rgba(16, 185, 129, 0.14)' },  // Aydın
      { x: 260, y: 70, r: 26, color: 'rgba(217, 119, 6, 0.14)' },   // Candar
      { x: 380, y: 340, r: 28, color: 'rgba(147, 51, 234, 0.14)' }, // Dulkadir
    ];
    beylikSpheres.forEach(b => {
      const rx = (b.x / WORLD_WIDTH) * radarWidth;
      const ry = (b.y / WORLD_HEIGHT) * radarHeight;
      const radPx = (b.r / WORLD_WIDTH) * radarWidth;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(rx, ry, radPx, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Rakip ve Düşman Köyleri (Kırmızı Tehlike İkonları)
    rivalVillages.forEach(rv => {
      const rx = (rv.x / WORLD_WIDTH) * radarWidth;
      const ry = (rv.y / WORLD_HEIGHT) * radarHeight;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(rx, ry, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Aktif Seferler (Çizgi & Hedef Yolu)
    activeMarches.forEach(m => {
      const ox = (m.originCoordinates.x / WORLD_WIDTH) * radarWidth;
      const oy = (m.originCoordinates.y / WORLD_HEIGHT) * radarHeight;
      const tx = (m.targetCoordinates.x / WORLD_WIDTH) * radarWidth;
      const ty = (m.targetCoordinates.y / WORLD_HEIGHT) * radarHeight;

      ctx.strokeStyle = m.mission === 'attack' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)';
      ctx.lineWidth = 0.9;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 7. Oyuncu Köyleri (Pulsating Zümrüt Yeşili)
    playerVillages.forEach(pv => {
      const px = (pv.x / WORLD_WIDTH) * radarWidth;
      const py = (pv.y / WORLD_HEIGHT) * radarHeight;

      // Dış Halka Işıma
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Merkez Nokta
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });

    // 8. Seçili Kare İşaretçisi (Altın Hedef Çaprazı)
    if (selectedTile) {
      const sx = (selectedTile.x / WORLD_WIDTH) * radarWidth;
      const sy = (selectedTile.y / WORLD_HEIGHT) * radarHeight;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy);
      ctx.lineTo(sx + 5, sy);
      ctx.moveTo(sx, sy - 5);
      ctx.lineTo(sx, sy + 5);
      ctx.stroke();
    }

    // 9. Görüş Alanı / Kamera Vizörü (Altın Çerçeveli Şeffaf Dikdörtgen)
    const tileSize = BASE_TILE_SIZE * zoom;
    const tilesInViewW = canvasWidth / tileSize;
    const tilesInViewH = canvasHeight / tileSize;

    const camBoxW = Math.max(8, (tilesInViewW / WORLD_WIDTH) * radarWidth);
    const camBoxH = Math.max(6, (tilesInViewH / WORLD_HEIGHT) * radarHeight);
    const camBoxX = Math.max(0, Math.min(radarWidth - camBoxW, ((camera.x - tilesInViewW / 2) / WORLD_WIDTH) * radarWidth));
    const camBoxY = Math.max(0, Math.min(radarHeight - camBoxH, ((camera.y - tilesInViewH / 2) / WORLD_HEIGHT) * radarHeight));

    // Vizör Zemin Işıltısı
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(camBoxX, camBoxY, camBoxW, camBoxH);

    // Vizör Sınır Çizgisi
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(camBoxX, camBoxY, camBoxW, camBoxH);
    ctx.setLineDash([]);

    // Köşe İşaretleyicileri
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    const cl = 2.5;
    // Sol üst
    ctx.beginPath();
    ctx.moveTo(camBoxX, camBoxY + cl); ctx.lineTo(camBoxX, camBoxY); ctx.lineTo(camBoxX + cl, camBoxY);
    // Sağ üst
    ctx.moveTo(camBoxX + camBoxW - cl, camBoxY); ctx.lineTo(camBoxX + camBoxW, camBoxY); ctx.lineTo(camBoxX + camBoxW, camBoxY + cl);
    // Sol alt
    ctx.moveTo(camBoxX, camBoxY + camBoxH - cl); ctx.lineTo(camBoxX, camBoxY + camBoxH); ctx.lineTo(camBoxX + cl, camBoxY + camBoxH);
    // Sağ alt
    ctx.moveTo(camBoxX + camBoxW - cl, camBoxY + camBoxH); ctx.lineTo(camBoxX + camBoxW, camBoxY + camBoxH); ctx.lineTo(camBoxX + camBoxW, camBoxY + camBoxH - cl);
    ctx.stroke();

    ctx.restore();
  }, [
    radarWidth, 
    radarHeight, 
    cachedCoastline, 
    cachedLakes, 
    camera, 
    zoom, 
    canvasWidth, 
    canvasHeight, 
    playerVillages, 
    rivalVillages, 
    activeMarches, 
    selectedTile
  ]);

  useEffect(() => {
    drawRadar();
  }, [drawRadar]);

  // Radar Tıklama & Sürükleme ile Kamera Konumlandırma
  const handleRadarInteract = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rx = Math.max(0, Math.min(radarWidth, clientX - rect.left));
    const ry = Math.max(0, Math.min(radarHeight, clientY - rect.top));

    const worldX = Math.round((rx / radarWidth) * WORLD_WIDTH);
    const worldY = Math.round((ry / radarHeight) * WORLD_HEIGHT);

    onPanToCoords(worldX, worldY);
    if (onSelectCoords) {
      onSelectCoords(worldX, worldY);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    setIsDraggingRadar(true);
    handleRadarInteract(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rx = Math.max(0, Math.min(radarWidth, e.clientX - rect.left));
    const ry = Math.max(0, Math.min(radarHeight, e.clientY - rect.top));
    const worldX = Math.round((rx / radarWidth) * WORLD_WIDTH);
    const worldY = Math.round((ry / radarHeight) * WORLD_HEIGHT);
    setHoverCoords({ x: worldX, y: worldY });

    if (isDraggingRadar) {
      handleRadarInteract(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingRadar(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      handleRadarInteract(t.clientX, t.clientY);
    }
  };

  return (
    <div 
      className={`absolute z-30 flex flex-col font-serif select-none pointer-events-auto transition-all duration-200 drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] ${
        selectedTile 
          ? 'bottom-28 right-2.5 sm:bottom-20 sm:right-4' 
          : 'bottom-12 right-2.5 sm:bottom-14 sm:right-4'
      }`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isMinimized ? (
        /* MOBİL KÜÇÜLTÜLMÜŞ RADAR BUTONU */
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#2a1a0e] via-[#382414] to-[#2a1a0e] border-2 border-[#b08848] rounded-full px-3 py-1.5 text-xs text-[#f5ebd7] shadow-[0_6px_20px_rgba(0,0,0,0.95)] hover:border-amber-300 hover:scale-105 active:scale-95 transition cursor-pointer touch-manipulation"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span className="font-bold text-[10.5px] uppercase tracking-wider text-amber-200">Taktik Radar</span>
          <span className="text-[9.5px] font-mono font-bold text-amber-300 bg-[#120a05] px-1.5 py-0.5 rounded border border-[#5a3e20]">
            ({Math.round(camera.x)}|{Math.round(camera.y)})
          </span>
        </button>
      ) : (
        <>
          {/* 1. ÜST RADAR BEZELİ & BAŞLIK */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#2a1a0e] via-[#382414] to-[#2a1a0e] border-t-2 border-x-2 border-[#a67c48] rounded-t-xl px-2 py-1 text-xs text-[#f5ebd7] shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0 animate-spin-slow" />
              <span className="font-bold text-[9.5px] sm:text-[10.5px] uppercase tracking-wider text-amber-200 truncate">
                {isExpanded ? 'Taktik Radar' : 'Radar'}
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold text-amber-300 bg-[#120a05] px-1 sm:px-1.5 py-0.5 rounded border border-[#5a3e20] shrink-0">
                {hoverCoords ? `(${hoverCoords.x}|${hoverCoords.y})` : `(${Math.round(camera.x)}|${Math.round(camera.y)})`}
              </span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-1">
              {/* Hızlı İntikal Noktaları Menüsü Aç/Kapat */}
              <button
                onClick={() => setShowWaypoints(v => !v)}
                title="Stratejik Anadolu Bölgeleri"
                className={`p-1 rounded text-[9px] sm:text-[10px] flex items-center gap-0.5 transition cursor-pointer touch-manipulation ${
                  showWaypoints ? 'bg-amber-800/90 text-amber-100 border border-amber-500' : 'bg-[#1a110a] text-[#c4ab8e] hover:text-white border border-[#4a341f]'
                }`}
              >
                <Navigation className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
                <span className="hidden sm:inline text-[9px] font-bold">Bölgeler</span>
              </button>

              {/* Boyut Büyüt/Küçült */}
              <button
                onClick={() => setIsExpanded(v => !v)}
                title={isExpanded ? 'Radarı Daralt' : 'Radarı Genişlet'}
                className="p-1 rounded bg-[#1a110a] hover:bg-[#382618] text-[#c4ab8e] hover:text-amber-200 transition cursor-pointer touch-manipulation border border-[#4a341f]"
              >
                {isExpanded ? <Minimize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Maximize2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              </button>

              {/* Mobilde Simge Durumuna Küçült */}
              <button
                onClick={() => setIsMinimized(true)}
                title="Radarı Gizle / Simge Yap"
                className="p-1 rounded bg-[#1a110a] hover:bg-[#382618] text-[#c4ab8e] hover:text-amber-200 transition cursor-pointer touch-manipulation text-[10px] leading-none border border-[#4a341f]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 2. RADAR CANVAS TUVALİ */}
          <div 
            className="relative bg-[#0a1017] border-2 border-[#a67c48] overflow-hidden cursor-crosshair shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_2px_8px_rgba(0,0,0,0.8)] touch-none"
            style={{ width: `${radarWidth}px`, height: `${radarHeight}px` }}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                setIsDraggingRadar(false);
                setHoverCoords(null);
              }}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  const t = e.touches[0];
                  handleRadarInteract(t.clientX, t.clientY);
                }
              }}
              onTouchMove={handleTouchMove}
              style={{ width: `${radarWidth}px`, height: `${radarHeight}px` }}
              className="block w-full h-full"
            />

            {/* Canlı Lejant / Mini İpuçları (Sadece genişletildiğinde) */}
            {isExpanded && (
              <div className="absolute bottom-1 right-1 pointer-events-none flex items-center gap-1.5 text-[8px] font-sans bg-[#0c0a07]/85 px-1.5 py-0.5 rounded border border-[#3e2918] text-[#decab0]">
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_4px_#34d399]" /> Otağ</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block shadow-[0_0_4px_#ef4444]" /> Rakip</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-[0_0_4px_#f59e0b]" /> Hedef</span>
              </div>
            )}
          </div>

          {/* 3. ALT BÖLGE VE FERMAN GÖSTERGESİ */}
          <div className="bg-gradient-to-b from-[#1c1108] to-[#120803] border-b-2 border-x-2 border-[#a67c48] rounded-b-xl px-1.5 sm:px-2 py-0.5 flex items-center justify-between text-[8.5px] sm:text-[9.5px] text-[#decab0] shadow-md">
            <span className="truncate text-amber-200/90 font-medium">
              📍 {currentRegionName}
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-mono text-[#a88960] ml-1 shrink-0">
              1000x500
            </span>
          </div>

          {/* 4. AÇILIR STRATEJİK HIZLI İNTİKAL LİSTESİ (POIs Drawer - Sağa Yaslı) */}
          {showWaypoints && (
            <div className="absolute right-0 bottom-full mb-1.5 w-64 sm:w-72 max-w-[calc(100vw-24px)] bg-gradient-to-b from-[#25170d] via-[#1c1108] to-[#140b05] border-2 border-[#caa05a] rounded-xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.96)] animate-fade-in text-xs text-[#f5ebd7] z-50">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#523d26]">
                <span className="font-bold text-[10.5px] sm:text-[11px] text-amber-300 flex items-center gap-1">
                  <span>✦</span> ANADOLU SANCAK HAVZALARI
                </span>
                <button 
                  onClick={() => setShowWaypoints(false)}
                  className="text-[#9e8770] hover:text-white text-xs font-bold px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1 max-h-52 sm:max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                {STRATEGIC_WAYPOINTS.map(wp => (
                  <button
                    key={wp.name}
                    onClick={() => {
                      onPanToCoords(wp.x, wp.y);
                      if (onSelectCoords) onSelectCoords(wp.x, wp.y);
                      setShowWaypoints(false);
                    }}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg bg-[#140b05] hover:bg-[#331f10] border ${wp.color} transition cursor-pointer text-left group touch-manipulation`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{wp.icon}</span>
                      <div className="truncate">
                        <div className="font-bold text-[10px] sm:text-[10.5px] text-[#fbf6ea] group-hover:text-amber-200 truncate">
                          {wp.name}
                        </div>
                        <div className="text-[8px] sm:text-[8.5px] text-[#9c8469] truncate">
                          {wp.sub}
                        </div>
                      </div>
                    </div>
                    <span className="text-[8.5px] sm:text-[9.5px] font-mono text-amber-400/90 font-bold bg-[#0a0502] px-1 sm:px-1.5 py-0.5 rounded border border-[#3d2714] shrink-0 ml-1">
                      ({wp.x}|{wp.y})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
