import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March, 
  ResourceNode, 
  ResourceRate, 
  TrainingQueueItem, 
  Village 
} from '../types/game';
import { 
  BUILDINGS, 
  FACTIONS, 
  calculateDistance, 
  getInfluenceRadius 
} from '../data/gameData';
import { renderMapTerrain } from '../engine/mapTerrainRenderer';
import { drawNaturalResourceNode, drawMapVillage } from '../engine/umaykutTacticalRenderer';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Radio, 
  MapPin, 
  Swords, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface CanvasMapGridProps {
  playerVillage: Village;
  playerVillages?: Village[];
  rivalVillages: Village[];
  nodes: ResourceNode[];
  activeMarches: March[];
  onSelectTargetForMarch: (targetVillage: Village | null, coords: { x: number; y: number }) => void;
  onOpenFoundVillageModal?: (coords?: { x: number; y: number }) => void;
  onSelectVillage?: (villageId: string) => void;
}

export const CanvasMapGrid: React.FC<CanvasMapGridProps> = ({
  playerVillage,
  playerVillages = [playerVillage],
  rivalVillages,
  nodes,
  activeMarches,
  onSelectTargetForMarch,
  onOpenFoundVillageModal,
  onSelectVillage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Kamera ve Görünüm Durumu
  const [zoom, setZoom] = useState<number>(1.2);
  const [centerCoords, setCenterCoords] = useState<{ x: number; y: number }>({
    x: playerVillage.x,
    y: playerVillage.y,
  });

  // Seçili Kare / Hedef
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>({
    x: playerVillage.x,
    y: playerVillage.y,
  });

  // Manuel Koordinat Atlama
  const [inputX, setInputX] = useState<number>(playerVillage.x);
  const [inputY, setInputY] = useState<number>(playerVillage.y);

  const townHallLevel = playerVillage.buildings.town_hall || 1;
  const influenceRadius = getInfluenceRadius(townHallLevel);

  // Canvas Çizim Fonksiyonu
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Yüksek DPI Desteği
    const width = canvas.parentElement?.clientWidth || 800;
    const height = 540;
    canvas.width = width;
    canvas.height = height;

    const tileSize = 32 * zoom;
    const originX = width / 2 - centerCoords.x * tileSize;
    const originY = height / 2 - centerCoords.y * tileSize;

    // 1. Organik Çimen & Taktik Topoğrafya Arka Planı
    renderMapTerrain(ctx, width, height, centerCoords, zoom);

    // 2. İnce Grid Çizgileri
    const startX = Math.floor((-originX) / tileSize) - 2;
    const endX = Math.ceil((width - originX) / tileSize) + 2;
    const startY = Math.floor((-originY) / tileSize) - 2;
    const endY = Math.ceil((height - originY) / tileSize) + 2;

    // Grid çizgileri - Zoom %70 altındayken tamamen silikleştirilmiş (rgba(0, 0, 0, 0.04))
    ctx.strokeStyle = zoom >= 0.7 ? '#26201a' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x <= endX; x++) {
      const px = originX + x * tileSize;
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
    }
    for (let y = startY; y <= endY; y++) {
      const py = originY + y * tileSize;
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
    }
    ctx.stroke();

    // 3. ETKİ ÇEMBERİ (Influence Radius)
    // Aktif Köy: Tek bir net beyaz/açık altın renkli 1.5px çember (rgba(255, 255, 255, 0.75))
    // Diğer Köyler: %8e çekilerek silikleştirilmiş (rgba(255, 255, 255, 0.08))
    playerVillages.forEach(v => {
      const vLvl = v.buildings.town_hall || 1;
      const vRad = getInfluenceRadius(vLvl);
      const isCur = v.id === playerVillage.id;

      const vPx = originX + v.x * tileSize + tileSize / 2;
      const vPy = originY + v.y * tileSize + tileSize / 2;
      const radPx = vRad * tileSize;

      // Çember Doldurma (Aktif köy için hafif zemin)
      if (isCur) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.arc(vPx, vPy, radPx, 0, Math.PI * 2);
        ctx.fill();
      }

      // Çember Kenar Çizgisi
      ctx.strokeStyle = isCur ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(vPx, vPy, radPx, 0, Math.PI * 2);
      ctx.stroke();

      // Etki Alanı Metin Rozeti
      if (isCur) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Etki Çapı: ${vRad} Tile`, vPx, vPy - radPx - 6);
      }
    });

    // 4. Kaynak Düğümleri (Orman, Taş, Demir, Tarla, Altın - Doğal Çevre Görselleri)
    nodes.forEach(node => {
      const nx = originX + node.x * tileSize;
      const ny = originY + node.y * tileSize;

      // Görünürlük kontrolü
      if (nx < -50 || nx > width + 50 || ny < -50 || ny > height + 50) return;

      const dist = calculateDistance(playerVillage.x, playerVillage.y, node.x, node.y);
      const isCaptured = dist <= influenceRadius;

      // Doğal Kaide, Sprite & Rozet ile çizim
      drawNaturalResourceNode(ctx, node, nx + tileSize / 2, ny + tileSize / 2, tileSize, zoom, isCaptured);
    });

    // 5. Rakip Köyler
    rivalVillages.forEach(rv => {
      const rx = originX + rv.x * tileSize;
      const ry = originY + rv.y * tileSize;

      if (rx < -100 || rx > width + 100 || ry < -100 || ry > height + 100) return;

      drawMapVillage(ctx, rv, rx, ry, tileSize, zoom, false, false, false);
    });

    // 6. Oyuncu Köyleri
    playerVillages.forEach(pv => {
      const px = originX + pv.x * tileSize;
      const py = originY + pv.y * tileSize;
      const isCur = pv.id === playerVillage.id;

      if (px < -100 || px > width + 100 || py < -100 || py > height + 100) return;

      drawMapVillage(ctx, pv, px, py, tileSize, zoom, isCur, true, false);
    });

    // 7. Aktif Seferler (Çizgisel Rota)
    activeMarches.forEach(m => {
      const orig = m.originCoordinates || (m as any).originCoords || { x: 0, y: 0 };
      const targ = m.targetCoordinates || (m as any).targetCoords || { x: 0, y: 0 };
      const fromPx = originX + orig.x * tileSize + tileSize / 2;
      const fromPy = originY + orig.y * tileSize + tileSize / 2;
      const toPx = originX + targ.x * tileSize + tileSize / 2;
      const toPy = originY + targ.y * tileSize + tileSize / 2;

      ctx.strokeStyle = m.mission === 'attack' ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(fromPx, fromPy);
      ctx.lineTo(toPx, toPy);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 8. Seçili Kare Vurgusu (Cursor / Reticle)
    if (selectedTile) {
      const sx = originX + selectedTile.x * tileSize;
      const sy = originY + selectedTile.y * tileSize;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, tileSize, tileSize);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(sx, sy, tileSize, tileSize);
    }

  }, [playerVillage, playerVillages, rivalVillages, nodes, activeMarches, zoom, centerCoords, selectedTile, influenceRadius]);

  useEffect(() => {
    drawCanvas();
    const handleResize = () => drawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  // Canvas Tıklama İşleyicisi
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const tileSize = 32 * zoom;
    const originX = canvas.width / 2 - centerCoords.x * tileSize;
    const originY = canvas.height / 2 - centerCoords.y * tileSize;

    const gridX = Math.floor((clickX - originX) / tileSize);
    const gridY = Math.floor((clickY - originY) / tileSize);

    setSelectedTile({ x: gridX, y: gridY });
    setInputX(gridX);
    setInputY(gridY);
  };

  // Seçili Nokta Bilgisi
  const selectedNode = nodes.find(n => n.x === selectedTile?.x && n.y === selectedTile?.y);
  const selectedRival = rivalVillages.find(v => v.x === selectedTile?.x && v.y === selectedTile?.y);
  const selectedPlayerVillage = playerVillages.find(v => v.x === selectedTile?.x && v.y === selectedTile?.y);

  const selectedDistance = selectedTile 
    ? calculateDistance(playerVillage.x, playerVillage.y, selectedTile.x, selectedTile.y)
    : 0;
  const isInsideInfluence = selectedDistance <= influenceRadius;

  return (
    <div className="space-y-3 font-serif">
      
      {/* Harita Kontrol Üst Çubuğu (Parşömen / Koyu Taş Tema) */}
      <div className="bg-[#1f1b16] border border-[#523e24] p-3 rounded-lg text-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-md">
        
        {/* Sol: Koordinat & Etki Çapı Künyesi */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#14120e] rounded border border-[#3d2e1b] text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-stone-400">Yeşil Etki Yarıçapı:</span>
            <strong className="text-emerald-300 font-mono">{influenceRadius} Tile</strong>
          </div>

          <div className="text-xs text-stone-400 hidden sm:block">
            Merkez: <strong className="text-amber-300 font-mono">{playerVillage.name} ({playerVillage.x}, {playerVillage.y})</strong>
          </div>
        </div>

        {/* Sağ: Koordinata Git & Yakınlaştırma Araçları */}
        <div className="flex items-center gap-2 text-xs">
          
          {/* Koordinat Girdileri */}
          <div className="flex items-center gap-1 bg-[#14120e] px-2 py-1 rounded border border-[#3d2e1b]">
            <span className="text-stone-500 font-mono">X:</span>
            <input 
              type="number" 
              value={inputX} 
              onChange={e => setInputX(Number(e.target.value))}
              className="w-12 bg-transparent text-amber-300 font-mono text-center focus:outline-none"
            />
            <span className="text-stone-500 font-mono">Y:</span>
            <input 
              type="number" 
              value={inputY} 
              onChange={e => setInputY(Number(e.target.value))}
              className="w-12 bg-transparent text-amber-300 font-mono text-center focus:outline-none"
            />
            <button
              onClick={() => {
                setCenterCoords({ x: inputX, y: inputY });
                setSelectedTile({ x: inputX, y: inputY });
              }}
              className="px-2 py-0.5 bg-[#42311c] hover:bg-[#5a4427] text-amber-200 rounded font-bold cursor-pointer transition"
            >
              Git
            </button>
          </div>

          {/* Merkeze Odaklan */}
          <button
            onClick={() => {
              setCenterCoords({ x: playerVillage.x, y: playerVillage.y });
              setSelectedTile({ x: playerVillage.x, y: playerVillage.y });
              setInputX(playerVillage.x);
              setInputY(playerVillage.y);
            }}
            title="Köye Odaklan"
            className="p-1.5 bg-[#2b2217] hover:bg-[#3d3121] border border-[#523e24] text-amber-300 rounded cursor-pointer transition"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Zoom In/Out */}
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
            title="Yakınlaştır"
            className="p-1.5 bg-[#2b2217] hover:bg-[#3d3121] border border-[#523e24] text-stone-300 rounded cursor-pointer transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
            title="Uzaklaştır"
            className="p-1.5 bg-[#2b2217] hover:bg-[#3d3121] border border-[#523e24] text-stone-300 rounded cursor-pointer transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HTML5 CANVAS X-Y GRID ALANI */}
      <div className="relative border-2 border-[#523e24] rounded-lg overflow-hidden bg-[#171411] shadow-xl">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full cursor-crosshair block"
          style={{ height: '520px' }}
        />

        {/* Canlı Canvas Lejantı (Sol Alt Rozet) */}
        <div className="absolute bottom-3 left-3 bg-[#171411]/90 backdrop-blur-sm border border-[#523e24] px-3 py-2 rounded text-xs space-y-1 text-stone-300 select-none pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/80 bg-white/10 inline-block" />
            <span className="text-stone-200 font-sans text-[11px]">Beyaz Daire: Aktif Köy Etki Çapı ({influenceRadius} tile)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🌲 🧱 ⚔️ 🌾 🪙</span>
            <span className="text-stone-400 font-sans text-[11px]">Doğal Kaynak Düğümleri</span>
          </div>
        </div>
      </div>

      {/* Seçili Kare Detay ve Eylem Paneli (Old-school Parşömen Kartı) */}
      {selectedTile && (
        <div className="bg-[#ebdcc4] text-[#2c1e11] border-2 border-[#7a5c32] rounded-lg p-3.5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7a5c32]" />
              <h4 className="font-bold text-sm tracking-wide">
                Seçili Koordinat: <span className="font-mono text-[#8f2b18]">X: {selectedTile.x} | Y: {selectedTile.y}</span>
              </h4>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-[#dfcba8] border border-[#aa8855]">
                Mesafe: {selectedDistance.toFixed(1)} tile
              </span>
            </div>

            <div className="text-xs mt-1 text-[#4a3520]">
              {selectedPlayerVillage ? (
                <span>🏰 <strong>{selectedPlayerVillage.name}</strong> (Kendi Köyünüz)</span>
              ) : selectedRival ? (
                <span className="text-[#8f2b18] font-semibold">⚔️ <strong>{selectedRival.name}</strong> (Düşman Otağı / Sahibi: {selectedRival.ownerName})</span>
              ) : selectedNode ? (
                <span>
                  Doğal Düğüm: <strong>{selectedNode.type.toUpperCase()}</strong> (+{selectedNode.baseYield}/saat) • 
                  {isInsideInfluence ? (
                    <strong className="text-emerald-800 ml-1">✓ Yeşil etki alanınızda (Gelir Aktif)</strong>
                  ) : (
                    <span className="text-stone-600 ml-1">✗ Etki alanı dışında</span>
                  )}
                </span>
              ) : (
                <span>Boş Arazi / İskana Uygun Toprak</span>
              )}
            </div>
          </div>

          {/* Eylem Butonları */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {selectedRival && (
              <button
                onClick={() => onSelectTargetForMarch(selectedRival, { x: selectedRival.x, y: selectedRival.y })}
                className="px-3 py-1.5 bg-[#8f2b18] hover:bg-[#aa341d] text-white rounded font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Sefer Düzenle</span>
              </button>
            )}

            {!selectedPlayerVillage && !selectedRival && !selectedNode && onOpenFoundVillageModal && (
              <button
                onClick={() => onOpenFoundVillageModal({ x: selectedTile.x, y: selectedTile.y })}
                className="px-3 py-1.5 bg-[#3a5a2a] hover:bg-[#487034] text-white rounded font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
              >
                <span>⛺</span>
                <span>Buraya Yeni Köy Kur</span>
              </button>
            )}

            {selectedPlayerVillage && selectedPlayerVillage.id !== playerVillage.id && onSelectVillage && (
              <button
                onClick={() => onSelectVillage(selectedPlayerVillage.id)}
                className="px-3 py-1.5 bg-[#2c4c68] hover:bg-[#396287] text-white rounded font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
              >
                <span>🏰</span>
                <span>Bu Köye Geç</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
