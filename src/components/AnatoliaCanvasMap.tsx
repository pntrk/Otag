import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BuildingType, 
  ConstructionQueueItem, 
  March, 
  MarchMission,
  ResourceNode, 
  ResourceRate, 
  TrainingQueueItem, 
  UnitType,
  Village 
} from '../types/game';
import { 
  BUILDINGS, 
  FACTIONS, 
  calculateDistance, 
  INITIAL_RESOURCE_NODES
} from '../data/gameData';
import { getVillageRadius, isNodeWithinRadius } from '../engine/radiusEngine';
import { generateAllWorldResourceNodes } from '../engine/worldResourceEngine';
import { 
  getNodeEfficiency, 
  getNodeTotalWorkers, 
  getVillageWorkersOnNode, 
  getTownHallWorkerLimit, 
  getVillageAssignedWorkersCount, 
  canAssignWorkers, 
  MAX_WORKERS_PER_NODE,
  WORKER_ASSIGNMENT_BATCH
} from '../engine/resourceEngine';
import { collisionDataMap, PixelBiomeInfo } from '../engine/collisionDataMap';
import { AnatoliaMapRenderer, AnatoliaRenderOptions, AnatoliaMapMode } from '../engine/anatoliaMapRenderer';
import { UmaykutTacticalRenderer } from '../engine/umaykutTacticalRenderer';
import { renderMapTerrain } from '../engine/mapTerrainRenderer';
import { UmaykutRightPanel } from './UmaykutRightPanel';
import { TacticalMinimapRadar } from './map/TacticalMinimapRadar';
import { MapStrategicControls, StrategicMapMode } from './map/MapStrategicControls';
import { MapSelectionInspector } from './map/MapSelectionInspector';
import { QuickMarchModal, QuickMarchTarget } from './QuickMarchModal';
import { DispatchMarchModal, DispatchMarchTarget } from './DispatchMarchModal';
import { ActiveMarchesTicker } from './ActiveMarchesTicker';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  Layers, 
  Navigation, 
  Sparkles, 
  Swords, 
  Plus, 
  Check, 
  Search,
  Eye,
  Droplets,
  Globe,
  MapPin,
  Mountain,
  Waves,
  Satellite,
  Image as ImageIcon,
  Pickaxe,
  Users,
  TrendingUp,
  AlertCircle,
  X
} from 'lucide-react';

import { ParchmentTooltip } from './ParchmentTooltip';

interface AnatoliaCanvasMapProps {
  playerVillage: Village;
  playerVillages?: Village[];
  rivalVillages: Village[];
  nodes: ResourceNode[];
  activeMarches: March[];
  rates?: ResourceRate;
  onSelectTargetForMarch: (targetVillage: Village | null, coords: { x: number; y: number }) => void;
  onDispatchMarch?: (
    targetCoords: { x: number; y: number },
    targetName: string,
    mission: MarchMission,
    units: Partial<Record<UnitType, number>>,
    withKhan?: boolean,
    originVillageId?: string,
    isBoosted?: boolean
  ) => void;
  onOpenFoundVillageModal?: (coords?: { x: number; y: number }) => void;
  onSelectVillage?: (villageId: string) => void;
  onOpenBuilding?: (type: BuildingType) => void;
  onSelectTab?: (tab: 'village' | 'map' | 'military' | 'reports' | 'simulator' | 'architecture') => void;
  onOpenFactionModal?: () => void;
  onAssignWorkers?: (villageId: string, nodeId: string, count?: number) => void;
}

// 1000 x 500 Anadolu Harita Evreni Boyutları
const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 500;
const BASE_TILE_SIZE = 40; // 1.0 zoom'da 1 tile piksel genişliği
const CHUNK_SIZE = 25; // 25x25 spatial partitioning chunk boyutu

// Makro Anadolu Coğrafi Bölgeleri
const MACRO_REGIONS = [
  { name: 'BİLECİK & SÖĞÜT (UÇ BEYLİĞİ)', x: 55, y: 45, faction: 'Osmanoğulları', color: '#b91c1c' },
  { name: 'KONYA OVASI & PAYİTAHT', x: 180, y: 220, faction: 'Karamanoğulları', color: '#1e3a8a' },
  { name: 'EGE KIYILARI & MENDERES HAVZASI', x: 65, y: 260, faction: 'Aydınoğulları', color: '#047857' },
  { name: 'KÜRE DAĞLARI & KASTAMONU', x: 260, y: 70, faction: 'Candaroğulları', color: '#b45309' },
  { name: 'TOROSLAR & ÇUKUROVA', x: 380, y: 340, faction: 'Dulkadiroğulları', color: '#6d28d9' },
  { name: 'BİZANS İMPARATORLUK SINIR HATTI', x: 80, y: 30, faction: 'Bizans Tekfurları', color: '#854d0e' },
  { name: 'KAPADOKYA & ERCİYES YAYLASI', x: 420, y: 200, faction: 'Eretna Beyliği', color: '#4b5563' },
  { name: 'FIRAT & DİCLE NEHİR HAVZALARI', x: 750, y: 350, faction: 'Artuklular', color: '#374151' },
  { name: 'DOĞU KARADENİZ DAĞLARI', x: 650, y: 80, faction: 'Trabzon Rum', color: '#7c2d12' },
  { name: 'VAN GÖLÜ & ARARAT HAVZASI', x: 900, y: 230, faction: 'Karakoyunlular', color: '#1f2937' },
];

/**
 * 1000x500 Devasa Harita için Deterministik Kaynak Üretici
 */
function generateAnatoliaResourceNodes(seedNodes: ResourceNode[]): ResourceNode[] {
  const result: ResourceNode[] = [...seedNodes];
  const MIN_NODE_DISTANCE = 3.8; // Düğümler arası asgari ferahlık mesafesi (tile)

  // Mesafe kontrol fonksiyonu
  function isTooClose(x: number, y: number): boolean {
    return result.some(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < MIN_NODE_DISTANCE;
    });
  }

  const occupied = new Set<string>();
  seedNodes.forEach(n => occupied.add(`${n.x},${n.y}`));

  let seed = 133742;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const types: Array<'wood' | 'stone' | 'iron' | 'grain' | 'gold'> = ['wood', 'stone', 'iron', 'grain', 'gold'];
  const namesByType = {
    wood: ['Meşe Koruluğu', 'Gürgen Ormanı', 'Karaçam Korusu', 'Ulu Çınar Havzası', 'Sedir Ormanı'],
    stone: ['Kalker Kayalığı', 'Mermer Ocağı', 'Andezit Yatağı', 'Bazalt Ocağı', 'Traverten Sırtı'],
    iron: ['Kızıl Demir Damarı', 'Cevher Ocağı', 'Manyetit Yatağı', 'Küre Madeni', 'Demirci Sırtı'],
    grain: ['Bereketli Alüvyon', 'Başak Tarlası', 'Nehir Vadisi', 'Buğday Harmanı', 'Geniş Çiftlik'],
    gold: ['Altın Kum Havzası', 'Kuvars Altın Damarı', 'Dere Yatağı Simi', 'Kıymetli Maden Ocağı', 'Gümüş Damarı']
  };

  // Hedeflenen geçerli karasal kaynak düğümü sayısı (Tüm düz haritaya yayılır)
  const TARGET_NODES = 3500;
  let attempts = 0;
  while (result.length < TARGET_NODES && attempts < 40000) {
    attempts++;
    const x = Math.floor(pseudoRandom() * (WORLD_WIDTH - 10)) + 5;
    const y = Math.floor(pseudoRandom() * (WORLD_HEIGHT - 10)) + 5;
    const key = `${x},${y}`;

    if (occupied.has(key)) continue;
    occupied.add(key);
    if (isTooClose(x, y)) continue;

    const type = types[Math.floor(pseudoRandom() * types.length)];
    const nameList = namesByType[type];
    const name = nameList[Math.floor(pseudoRandom() * nameList.length)];
    const tier = pseudoRandom() > 0.75 ? 3 : pseudoRandom() > 0.4 ? 2 : 1;
    const baseYield = 100 + tier * 50 + Math.floor(pseudoRandom() * 40);
    const level = tier === 1 ? (3 + Math.floor(pseudoRandom() * 3)) : tier === 2 ? (6 + Math.floor(pseudoRandom() * 2)) : (8 + Math.floor(pseudoRandom() * 2));

    result.push({
      id: `gen_node_${x}_${y}`,
      type,
      name,
      x,
      y,
      baseYieldPerHour: baseYield,
      tier,
      level
    });
  }

  return result;
}

export const AnatoliaCanvasMap: React.FC<AnatoliaCanvasMapProps> = ({
  playerVillage,
  playerVillages = [playerVillage],
  rivalVillages,
  nodes,
  activeMarches,
  rates,
  onSelectTargetForMarch,
  onDispatchMarch,
  onOpenFoundVillageModal,
  onSelectVillage,
  onOpenBuilding,
  onSelectTab,
  onOpenFactionModal,
  onAssignWorkers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hızlı Sefer / Akın Emri & Orijinal Asker Gönder Modal Durumu
  const [quickMarchTarget, setQuickMarchTarget] = useState<QuickMarchTarget | null>(null);
  const [isQuickMarchModalOpen, setIsQuickMarchModalOpen] = useState<boolean>(false);
  const [dispatchTarget, setDispatchTarget] = useState<DispatchMarchTarget | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [dispatchInitialMission, setDispatchInitialMission] = useState<MarchMission>('attack');

  // 1. Tüm Anadolu Kaynak Düğümleri
  const allNodes = useMemo(() => {
    return nodes.length > 0 ? nodes : generateAllWorldResourceNodes();
  }, [nodes]);

  // Spatial Partitioning (Spatial Chunk Index) 25x25
  const spatialChunks = useMemo(() => {
    const chunks: Map<string, ResourceNode[]> = new Map();
    allNodes.forEach(node => {
      const cx = Math.floor(node.x / CHUNK_SIZE);
      const cy = Math.floor(node.y / CHUNK_SIZE);
      const key = `${cx},${cy}`;
      if (!chunks.has(key)) chunks.set(key, []);
      chunks.get(key)!.push(node);
    });
    return chunks;
  }, [allNodes]);

  // 2. Kamera & Görünüm Durumu (Kamera Merkez Koordinatı)
  const [camera, setCamera] = useState<{ x: number; y: number }>({
    x: playerVillage.x,
    y: playerVillage.y,
  });

  // Harita Modu: Stratejik Görünüm (Taktik Çayır, Tarihi Parşömen, Siyasi Beylikler, Ekonomik Isı, Askeri Tehdit)
  const [mapMode, setMapMode] = useState<StrategicMapMode>('umaykut_meadow');
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tileVersion, setTileVersion] = useState<number>(0);
  const customMapImageRef = useRef<HTMLImageElement | null>(null);

  // Taktik Görünüm & Keşif Filtreleri
  const [filterType, setFilterType] = useState<'all' | 'grain' | 'iron' | 'wood' | 'stone' | 'rival' | 'gold'>('all');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showInfluenceRings, setShowInfluenceRings] = useState<boolean>(true);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Zoom Seviyesi (0.12 = Makro Anadolu, 0.85 = Geniş Taktik Umaykut, 2.5 = Mikro)
  const [zoom, setZoom] = useState<number>(0.85);

  // 3. Etkileşim & Sürükleme (Pan/Drag)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; camX: number; camY: number } | null>(null);
  const isMovedRef = useRef<boolean>(false);

  // 4. Seçili Kare ve Hover Durumu
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>({
    x: playerVillage.x,
    y: playerVillage.y,
  });

  // Hızlı Koordinat Arama Formu Durumu
  const [searchX, setSearchX] = useState<string>(playerVillage.x.toString());
  const [searchY, setSearchY] = useState<string>(playerVillage.y.toString());
  const [showMinimap, setShowMinimap] = useState<boolean>(true);

  // UI Butonları Tıklama Alanları (Canvas İçi Butonlar İçin)
  const canvasUiButtonsRef = useRef<Array<{ id: string; rect: { x: number; y: number; w: number; h: number }; action: () => void }>>([]);
  const cameraAnimRef = useRef<number | null>(null);

  const townHallLevel = playerVillage.buildings?.town_hall || 1;
  // Umaykut Online Kuralı: Köyün etki yarıçapı 1.0 ile 2.5 birim arasındadır
  const influenceRadius = getVillageRadius(playerVillage);

  // Koordinat Dönüşümleri
  const worldToScreen = useCallback((wx: number, wy: number, width: number, height: number) => {
    const tileSize = BASE_TILE_SIZE * zoom;
    const sx = width / 2 + (wx - camera.x) * tileSize;
    const sy = height / 2 + (wy - camera.y) * tileSize;
    return { sx, sy, tileSize };
  }, [camera, zoom]);

  const screenToWorld = useCallback((sx: number, sy: number, width: number, height: number) => {
    const tileSize = BASE_TILE_SIZE * zoom;
    const wx = Math.floor(camera.x + (sx - width / 2) / tileSize);
    const wy = Math.floor(camera.y + (sy - height / 2) / tileSize);
    return { wx, wy };
  }, [camera, zoom]);

  // Kamera Odaklama Mantığı (Merkeze Dön & Hızlı Seyahat)
  const focusOnCoordinates = useCallback((targetX: number, targetY: number, smooth: boolean = true) => {
    if (cameraAnimRef.current) {
      cancelAnimationFrame(cameraAnimRef.current);
      cameraAnimRef.current = null;
    }

    if (!smooth) {
      setCamera({ x: targetX, y: targetY });
      setSelectedTile({ x: targetX, y: targetY });
      return;
    }
    
    const startX = camera.x;
    const startY = camera.y;
    
    // Eğer hedef zaten çok yakınsa veya aynıysa animasyon yapma
    if (Math.abs(startX - targetX) < 0.1 && Math.abs(startY - targetY) < 0.1) {
      setSelectedTile({ x: targetX, y: targetY });
      return;
    }

    const startTime = performance.now();
    const duration = 400; // ms pürüzsüz geçiş

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutCubic (yumuşak duruş)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCamera({ 
        x: startX + (targetX - startX) * easeProgress, 
        y: startY + (targetY - startY) * easeProgress 
      });
      
      if (progress < 1) {
        cameraAnimRef.current = requestAnimationFrame(animate);
      } else {
        setCamera({ x: targetX, y: targetY });
        setSelectedTile({ x: targetX, y: targetY });
        cameraAnimRef.current = null;
      }
    };
    
    cameraAnimRef.current = requestAnimationFrame(animate);
  }, [camera.x, camera.y]);

  // Hızlı Koordinata Işınlanma
  const handleJumpToCoords = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nx = Math.max(0, Math.min(WORLD_WIDTH, parseInt(searchX, 10) || 0));
    const ny = Math.max(0, Math.min(WORLD_HEIGHT, parseInt(searchY, 10) || 0));
    focusOnCoordinates(nx, ny, true);
  };

  // 5. ANA CANVAS ÇİZİM MOTORU
  const renderMap = useCallback((time: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || window.innerWidth || 1200;
    const height = isFullscreen ? window.innerHeight : Math.max(700, window.innerHeight - 80);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const tileSize = BASE_TILE_SIZE * zoom;
    canvasUiButtonsRef.current = [];

    // Bounding Box Optimizasyonu (Ekranda Görünen Koordinat Sınırları)
    const halfTilesW = (width / 2) / tileSize;
    const halfTilesH = (height / 2) / tileSize;
    const minX = Math.max(0, Math.floor(camera.x - halfTilesW) - 1);
    const maxX = Math.min(WORLD_WIDTH, Math.ceil(camera.x + halfTilesW) + 1);
    const minY = Math.max(0, Math.floor(camera.y - halfTilesH) - 1);
    const maxY = Math.min(WORLD_HEIGHT, Math.ceil(camera.y + halfTilesH) + 1);

    // ========================================================================
    // 1. ANADOLU UMAYKUT TAKTİK ÇAYIR ZEMİNİ & GEÇİRGEN DOĞAL SULAR
    // ========================================================================
    renderMapTerrain(ctx, width, height, camera, zoom, mapMode);

    UmaykutTacticalRenderer.renderTerrain(
      ctx,
      width,
      height,
      minX,
      maxX,
      minY,
      maxY,
      tileSize,
      (wx, wy) => worldToScreen(wx, wy, width, height)
    );

    // Dünya Haritası Dış Çeper Sınırı (0..1000, 0..500)
    const { sx: worldZeroX, sy: worldZeroY } = worldToScreen(0, 0, width, height);
    const worldW = WORLD_WIDTH * tileSize;
    const worldH = WORLD_HEIGHT * tileSize;

    ctx.strokeStyle = '#6e4c27';
    ctx.lineWidth = Math.max(2, 4 * zoom);
    ctx.strokeRect(worldZeroX, worldZeroY, worldW, worldH);

    // ========================================================================
    // 2. GRID SİSTEMİ (LOD KONTROLLÜ UMAYKUT IZGARASI - İSTEĞE BAĞLI AÇILIP KAPANIR)
    // Zoom %70 altındayken tamamen kapatılmalı veya opaklığı rgba(0, 0, 0, 0.04) seviyesine indirilmelidir.
    // ========================================================================
    if (showGrid) {
      if (zoom >= 0.7) {
        // 1x1 İnce Tile Grid
        ctx.strokeStyle = 'rgba(138, 107, 68, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = minX; x <= maxX; x++) {
          const { sx } = worldToScreen(x, 0, width, height);
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }
        for (let y = minY; y <= maxY; y++) {
          const { sy } = worldToScreen(0, y, width, height);
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        }
        ctx.stroke();

        // 10x10 Koordinat Grid Çizgileri
        ctx.strokeStyle = 'rgba(102, 75, 43, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const startX10 = Math.floor(minX / 10) * 10;
        const endX10 = Math.ceil(maxX / 10) * 10;
        const startY10 = Math.floor(minY / 10) * 10;
        const endY10 = Math.ceil(maxY / 10) * 10;

        for (let x = startX10; x <= endX10; x += 10) {
          const { sx } = worldToScreen(x, 0, width, height);
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }
        for (let y = startY10; y <= endY10; y += 10) {
          const { sy } = worldToScreen(0, y, width, height);
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        }
        ctx.stroke();

        // 10'luk Koordinat Numaraları
        ctx.fillStyle = '#6b4f2c';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let x = startX10; x <= endX10; x += 10) {
          if (x < 0 || x > WORLD_WIDTH) continue;
          const { sx } = worldToScreen(x, 0, width, height);
          ctx.fillText(`X:${x}`, sx + 3, 4);
        }
        for (let y = startY10; y <= endY10; y += 10) {
          if (y < 0 || y > WORLD_HEIGHT) continue;
          const { sy } = worldToScreen(0, y, width, height);
          ctx.fillText(`Y:${y}`, 4, sy + 3);
        }
      } else {
        // Zoom %70 altı: Çizgiler silikleştirilmiş asgari opaklıkta (rgba(0, 0, 0, 0.04))
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        const startX50 = Math.floor(minX / 50) * 50;
        const endX50 = Math.ceil(maxX / 50) * 50;
        const startY50 = Math.floor(minY / 50) * 50;
        const endY50 = Math.ceil(maxY / 50) * 50;

        for (let x = startX50; x <= endX50; x += 50) {
          const { sx } = worldToScreen(x, 0, width, height);
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }
        for (let y = startY50; y <= endY50; y += 50) {
          const { sy } = worldToScreen(0, y, width, height);
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        }
        ctx.stroke();
      }
    }

    // ========================================================================
    // 3. MAKRO COĞRAFİ BÖLGE İSİMLERİ & YAZILARI
    // ========================================================================
    MACRO_REGIONS.forEach(reg => {
      const { sx, sy } = worldToScreen(reg.x, reg.y, width, height);
      if (sx < -150 || sx > width + 150 || sy < -50 || sy > height + 50) return;

      ctx.save();
      ctx.fillStyle = reg.color;
      ctx.globalAlpha = zoom < 0.4 ? 0.85 : 0.40;
      ctx.font = `bold ${Math.max(10, Math.floor(13 * Math.min(1.2, zoom + 0.3)))}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🏛️ ${reg.name}`, sx, sy);
      ctx.fillStyle = '#4a3824';
      ctx.font = 'italic 10px serif';
      ctx.fillText(`(${reg.faction})`, sx, sy + 14);
      ctx.restore();
    });

    // ========================================================================
    // 4. KÖYLERİN ETKİ ALANI (RADİUS): UMAYKUT TAKTİK DÜZGÜN HALKALAR
    // ========================================================================
    if (showInfluenceRings) {
      const activeVId = (selectedTile && playerVillages.find(pv => pv.x === selectedTile.x && pv.y === selectedTile.y)?.id) || playerVillage.id;
      UmaykutTacticalRenderer.renderInfluenceRings(
        ctx,
        [...playerVillages, ...rivalVillages],
        playerVillage.id,
        (wx, wy) => worldToScreen(wx, wy, width, height),
        width,
        height,
        tileSize,
        zoom,
        activeVId
      );
    }

    // 4.1. Umaykut Online Kuralı: Seçili köyün çemberini altın yaldızlı kesikli çizgi (setLineDash([6, 6])) ile açıkça vurgula
    const activeCircleVillage = (selectedTile && playerVillages.find(pv => pv.x === selectedTile.x && pv.y === selectedTile.y)) || playerVillage;
    const vRadius = getVillageRadius(activeCircleVillage);
    const { sx: ringX, sy: ringY } = worldToScreen(activeCircleVillage.x + 0.5, activeCircleVillage.y + 0.5, width, height);
    const ringRadPx = vRadius * tileSize;

    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringRadPx, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 6]);
    ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ringX, ringY, ringRadPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ========================================================================
    // 5. 2D KAYNAK DÜĞÜMLERİ & VERİMLİLİK SEVİYESİ SAYILARI (TIER 1-3)
    // ========================================================================
    const minChunkX = Math.floor(minX / CHUNK_SIZE);
    const maxChunkX = Math.floor(maxX / CHUNK_SIZE);
    const minChunkY = Math.floor(minY / CHUNK_SIZE);
    const maxChunkY = Math.floor(maxY / CHUNK_SIZE);

    const visibleNodes: ResourceNode[] = [];
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      for (let cy = minChunkY; cy <= maxChunkY; cy++) {
        const chunk = spatialChunks.get(`${cx},${cy}`);
        if (chunk) {
          chunk.forEach(node => {
            if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
              visibleNodes.push(node);
            }
          });
        }
      }
    }

    if (zoom >= 0.15) {
      visibleNodes.forEach(node => {
        const { sx, sy } = worldToScreen(node.x, node.y, width, height);
        const dist = calculateDistance(playerVillage.x, playerVillage.y, node.x, node.y);
        const isCaptured = dist <= influenceRadius;
        const matchesFilter = filterType === 'all' || filterType === node.type;

        if (filterType !== 'all' && !matchesFilter) {
          ctx.save();
          ctx.globalAlpha = 0.22;
          UmaykutTacticalRenderer.renderResourceNode(
            ctx,
            node,
            sx,
            sy,
            tileSize,
            zoom,
            isCaptured,
            false
          );
          ctx.restore();
          return;
        }

        const isHighlighted = filterType !== 'all' && matchesFilter;
        UmaykutTacticalRenderer.renderResourceNode(
          ctx,
          node,
          sx,
          sy,
          tileSize,
          zoom,
          isCaptured,
          isHighlighted
        );
      });
    }

    // ========================================================================
    // 6. RAKİP KÖYLER & DÜŞMAN MERKEZLERİ
    // ========================================================================
    rivalVillages.forEach(rv => {
      if (rv.x < minX || rv.x > maxX || rv.y < minY || rv.y > maxY) return;
      const { sx, sy } = worldToScreen(rv.x, rv.y, width, height);
      const isRivalHighlighted = filterType === 'rival';
      if (filterType !== 'all' && filterType !== 'rival') {
        ctx.save();
        ctx.globalAlpha = 0.28;
        UmaykutTacticalRenderer.renderVillage(
          ctx,
          rv,
          sx,
          sy,
          tileSize,
          zoom,
          false,
          false,
          false
        );
        ctx.restore();
      } else {
        UmaykutTacticalRenderer.renderVillage(
          ctx,
          rv,
          sx,
          sy,
          tileSize,
          zoom,
          false,
          false,
          isRivalHighlighted
        );
      }
    });

    // ========================================================================
    // 7. OYUNCU KÖYLERİ (OTAĞ KÜMESİ & SANCAK & UMAYKUT METALİK İSİMLİK)
    // ========================================================================
    playerVillages.forEach(pv => {
      if (pv.x < minX || pv.x > maxX || pv.y < minY || pv.y > maxY) return;
      const { sx, sy } = worldToScreen(pv.x, pv.y, width, height);
      const isCur = pv.id === playerVillage.id;
      UmaykutTacticalRenderer.renderVillage(
        ctx,
        pv,
        sx,
        sy,
        tileSize,
        zoom,
        isCur,
        true
      );
    });

    // ========================================================================
    // 8. AKTİF SEFERLER (İNTİKAL ÇİZGİSİ & ORDU İKONU)
    // ========================================================================
    activeMarches.forEach(m => {
      const { sx: fx, sy: fy } = worldToScreen(m.originCoordinates.x + 0.5, m.originCoordinates.y + 0.5, width, height);
      const { sx: tx, sy: ty } = worldToScreen(m.targetCoordinates.x + 0.5, m.targetCoordinates.y + 0.5, width, height);

      ctx.save();
      ctx.strokeStyle = m.mission === 'attack' ? '#dc2626' : '#2563eb';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      const now = Date.now();
      const progress = Math.min(1, Math.max(0, (now - m.startTime) / (m.durationSec * 1000)));
      const curX = fx + (tx - fx) * progress;
      const curY = fy + (ty - fy) * progress;

      ctx.fillStyle = m.mission === 'attack' ? '#991b1b' : '#1e40af';
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = '10px sans-serif';
      ctx.fillText('⚔️', curX, curY - 10);
      ctx.restore();
    });

    // ========================================================================
    // 9. SEÇİLİ KARE, TAKTİK SEFER VEKTÖRÜ & HOVER HEDEF GÖSTERGESİ
    // ========================================================================
    if (selectedTile) {
      const { sx, sy } = worldToScreen(selectedTile.x, selectedTile.y, width, height);

      // Hedef Karesi Zemin ve Çerçeve
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(sx, sy, tileSize, tileSize);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fillRect(sx, sy, tileSize, tileSize);

      // Köşe Parantezleri (Corner Brackets)
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.4;
      const bLen = Math.min(10, tileSize * 0.28);
      const right = sx + tileSize;
      const bottom = sy + tileSize;
      ctx.beginPath();
      // Sol üst
      ctx.moveTo(sx, sy + bLen); ctx.lineTo(sx, sy); ctx.lineTo(sx + bLen, sy);
      // Sağ üst
      ctx.moveTo(right - bLen, sy); ctx.lineTo(right, sy); ctx.lineTo(right, sy + bLen);
      // Sol alt
      ctx.moveTo(sx, bottom - bLen); ctx.lineTo(sx, bottom); ctx.lineTo(sx + bLen, bottom);
      // Sağ alt
      ctx.moveTo(right - bLen, bottom); ctx.lineTo(right, bottom); ctx.lineTo(right, bottom - bLen);
      ctx.stroke();

      // Taktik Sefer İntikal Hattı (Eğer hedef merkez köy değilse)
      if (selectedTile.x !== playerVillage.x || selectedTile.y !== playerVillage.y) {
        const pScreen = worldToScreen(playerVillage.x, playerVillage.y, width, height);
        const pCenterX = pScreen.sx + tileSize / 2;
        const pCenterY = pScreen.sy + tileSize / 2;
        const tCenterX = sx + tileSize / 2;
        const tCenterY = sy + tileSize / 2;

        ctx.save();
        // Animasyonlu Kesikli Çizgi
        const dashOffset = -((time / 35) % 24);
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = dashOffset;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(1.8, 2.5 * zoom);
        ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.moveTo(pCenterX, pCenterY);
        ctx.lineTo(tCenterX, tCenterY);
        ctx.stroke();

        // Hat Ortası Taktik Mesafe ve Süre Rozeti
        const midX = (pCenterX + tCenterX) / 2;
        const midY = (pCenterY + tCenterY) / 2;
        const dist = Math.hypot(selectedTile.x - playerVillage.x, selectedTile.y - playerVillage.y);
        const cavTime = Math.max(1, Math.round(dist * 0.8));

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(20, 12, 6, 0.9)';
        ctx.strokeStyle = '#caa05a';
        ctx.lineWidth = 1;

        const badgeText = `⚔️ ${dist.toFixed(1)}k (~${cavTime}dk)`;
        ctx.font = 'bold 10.5px sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const badgeW = textWidth + 14;
        const badgeH = 20;

        ctx.beginPath();
        ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, midX, midY);

        ctx.restore();
      }
    }

    if (hoveredTile && (!selectedTile || hoveredTile.x !== selectedTile.x || hoveredTile.y !== selectedTile.y)) {
      const { sx, sy } = worldToScreen(hoveredTile.x, hoveredTile.y, width, height);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(sx, sy, tileSize, tileSize);
    }

    // ========================================================================
    // 10. SAĞ ALT MİNİMAP / RADAR (KÜÇÜK VE SADE - YALNIZCA TAKTİK RADAR KAPALIYSA)
    // ========================================================================
    if (showMinimap && !showRadar) {
      const miniW = 140;
      const miniH = 70;
      const miniX = width - miniW - 12;
      const miniY = height - miniH - 12;

      ctx.save();
      ctx.fillStyle = 'rgba(24, 18, 12, 0.92)';
      {/* Minimap Çerçeve & Köyleri (Eskitme Deri Harita Çerçevesi) */}
      ctx.fillStyle = '#0c0805';
      ctx.strokeStyle = '#8c6738';
      ctx.lineWidth = 1.8;
      ctx.fillRect(miniX, miniY, miniW, miniH);

      // Mini Temel Anadolu Harita Görseli
      if (customMapImageRef.current && customMapImageRef.current.complete) {
        ctx.drawImage(customMapImageRef.current, miniX, miniY, miniW, miniH);
      }
      ctx.strokeRect(miniX, miniY, miniW, miniH);

      // Minimap Köyleri
      playerVillages.forEach(pv => {
        const mx = miniX + (pv.x / WORLD_WIDTH) * miniW;
        const my = miniY + (pv.y / WORLD_HEIGHT) * miniH;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      rivalVillages.forEach(rv => {
        const mx = miniX + (rv.x / WORLD_WIDTH) * miniW;
        const my = miniY + (rv.y / WORLD_HEIGHT) * miniH;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Görüş Alanı Kutusu (Sarı Kesikli Altın İplik Çizgisi)
      const camBoxX = miniX + (minX / WORLD_WIDTH) * miniW;
      const camBoxY = miniY + (minY / WORLD_HEIGHT) * miniH;
      const camBoxW = Math.max(4, ((maxX - minX) / WORLD_WIDTH) * miniW);
      const camBoxH = Math.max(4, ((maxY - minY) / WORLD_HEIGHT) * miniH);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(camBoxX, camBoxY, camBoxW, camBoxH);
      ctx.setLineDash([]);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 8px serif';
      ctx.textAlign = 'left';
      ctx.fillText(`1000x500 Harita`, miniX + 4, miniY + 9);
      ctx.restore();
    }

  }, [
    playerVillage, 
    playerVillages, 
    rivalVillages, 
    allNodes, 
    spatialChunks, 
    activeMarches, 
    camera, 
    zoom, 
    showGrid,
    showInfluenceRings,
    filterType,
    tileVersion,
    selectedTile, 
    hoveredTile, 
    influenceRadius, 
    showMinimap,
    showRadar,
    mapMode,
    worldToScreen
  ]);

  // Canlı Animasyon Render Döngüsü
  useEffect(() => {
    let animId: number;
    const loop = (time: number) => {
      renderMap(time);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderMap]);

  // ========================================================================
  // FARE VE DOKUNMATİK ETKİLEŞİM İŞLEYİCİLERİ (PAN/DRAG & TOUCH PINCH-ZOOM)
  // ========================================================================
  const touchStateRef = useRef<{
    startX: number;
    startY: number;
    camX: number;
    camY: number;
    initialDistance?: number;
    initialZoom?: number;
    hasMoved: boolean;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDragging(true);
    isMovedRef.current = false;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      camX: camera.x,
      camY: camera.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isMovedRef.current = true;
      }

      const tileSize = BASE_TILE_SIZE * zoom;
      const newCamX = Math.max(0, Math.min(WORLD_WIDTH, dragStartRef.current.camX - dx / tileSize));
      const newCamY = Math.max(0, Math.min(WORLD_HEIGHT, dragStartRef.current.camY - dy / tileSize));

      setCamera({ x: newCamX, y: newCamY });
      return;
    }

    const { wx, wy } = screenToWorld(mouseX, mouseY, canvas.width, canvas.height);
    if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
      setHoveredTile(prev => (prev?.x === wx && prev?.y === wy ? prev : { x: wx, y: wy }));
    } else {
      setHoveredTile(prev => (prev === null ? null : null));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);

    if (!isMovedRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Minimap Tıklama
      if (showMinimap) {
        const miniW = 130;
        const miniH = 65;
        const miniX = canvas.width - miniW - 12;
        const miniY = canvas.height - miniH - 12;

        if (clickX >= miniX && clickX <= miniX + miniW && clickY >= miniY && clickY <= miniY + miniH) {
          const targetWorldX = Math.round(((clickX - miniX) / miniW) * WORLD_WIDTH);
          const targetWorldY = Math.round(((clickY - miniY) / miniH) * WORLD_HEIGHT);
          setCamera({ x: targetWorldX, y: targetWorldY });
          setSelectedTile({ x: targetWorldX, y: targetWorldY });
          return;
        }
      }

      const { wx, wy } = screenToWorld(clickX, clickY, canvas.width, canvas.height);
      if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
        setSelectedTile({ x: wx, y: wy });
      }
    }
  };

  // MOBİL DOKUNMATİK DESTEĞİ (1 Parmak Pan / Sürükleme, 2 Parmak Pinch-Zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStateRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        camX: camera.x,
        camY: camera.y,
        hasMoved: false,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStateRef.current = {
        startX: (t1.clientX + t2.clientX) / 2,
        startY: (t1.clientY + t2.clientY) / 2,
        camX: camera.x,
        camY: camera.y,
        initialDistance: Math.max(10, dist),
        initialZoom: zoom,
        hasMoved: true,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !touchStateRef.current) return;

    if (e.touches.length === 1 && touchStateRef.current) {
      const t = e.touches[0];
      const dx = t.clientX - touchStateRef.current.startX;
      const dy = t.clientY - touchStateRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        touchStateRef.current.hasMoved = true;
      }

      const tileSize = BASE_TILE_SIZE * zoom;
      const newCamX = Math.max(0, Math.min(WORLD_WIDTH, touchStateRef.current.camX - dx / tileSize));
      const newCamY = Math.max(0, Math.min(WORLD_HEIGHT, touchStateRef.current.camY - dy / tileSize));

      setCamera({ x: newCamX, y: newCamY });
    } else if (e.touches.length === 2 && touchStateRef.current?.initialDistance && touchStateRef.current.initialZoom) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDist / touchStateRef.current.initialDistance;
      const newZoom = Math.max(0.12, Math.min(2.8, touchStateRef.current.initialZoom * ratio));
      setZoom(newZoom);
      touchStateRef.current.hasMoved = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    if (touchStateRef.current && !touchStateRef.current.hasMoved) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = touchStateRef.current.startX - rect.left;
      const clickY = touchStateRef.current.startY - rect.top;

      const { wx, wy } = screenToWorld(clickX, clickY, canvas.width, canvas.height);
      if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
        setSelectedTile({ x: wx, y: wy });
      }
    }
    touchStateRef.current = null;
  };

  // Fare Tekerleği ile İmleç Odaklı Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.max(0.12, Math.min(2.8, zoom * zoomFactor));

    const currentTileSize = BASE_TILE_SIZE * zoom;
    const newTileSize = BASE_TILE_SIZE * newZoom;

    const worldMouseX = camera.x + (mouseX - canvas.width / 2) / currentTileSize;
    const worldMouseY = camera.y + (mouseY - canvas.height / 2) / currentTileSize;

    const newCamX = Math.max(0, Math.min(WORLD_WIDTH, worldMouseX - (mouseX - canvas.width / 2) / newTileSize));
    const newCamY = Math.max(0, Math.min(WORLD_HEIGHT, worldMouseY - (mouseY - canvas.height / 2) / newTileSize));

    setZoom(newZoom);
    setCamera({ x: newCamX, y: newCamY });
  };

    const isHoveringRival = hoveredTile ? rivalVillages.some(rv => rv.x === hoveredTile.x && rv.y === hoveredTile.y) : false;
    const canvasCursorClass = isDragging 
      ? 'cursor-grabbing-map' 
      : isHoveringRival 
        ? 'cursor-sword' 
        : 'cursor-grab-map';

    const selectedNode = selectedTile ? allNodes.find(n => n.x === selectedTile.x && n.y === selectedTile.y) : null;
  const selectedRival = selectedTile ? rivalVillages.find(rv => rv.x === selectedTile.x && rv.y === selectedTile.y) : null;
  const selectedPlayerV = selectedTile ? playerVillages.find(pv => pv.x === selectedTile.x && pv.y === selectedTile.y) : null;
  const selectedDistance = selectedTile ? calculateDistance(playerVillage.x, playerVillage.y, selectedTile.x, selectedTile.y) : 0;
  const isSelectedInsideInfluence = selectedNode 
    ? isNodeWithinRadius(playerVillage, selectedNode, influenceRadius)
    : selectedDistance <= influenceRadius;
  const selectedBiome: PixelBiomeInfo | null = selectedTile ? collisionDataMap.getPixelInfo(selectedTile.x, selectedTile.y) : null;

  // Umaykut Kaynak ve İşçi İstatistikleri
  const nodeEfficiency = selectedNode ? getNodeEfficiency(selectedNode) : 0;
  const nodeTotalWorkers = selectedNode ? getNodeTotalWorkers(selectedNode) : 0;
  const villageWorkersOnNode = selectedNode ? getVillageWorkersOnNode(playerVillage, selectedNode.id) : 0;
  const townHallLimit = getTownHallWorkerLimit(playerVillage.buildings?.town_hall || 1);
  const villageAssignedTotal = getVillageAssignedWorkersCount(playerVillage);
  const workerAssignCheck = selectedNode ? canAssignWorkers(playerVillage, selectedNode, WORKER_ASSIGNMENT_BATCH) : null;
  const nodeYieldPerHour = villageWorkersOnNode * nodeEfficiency;

  return (
    <div 
      ref={containerRef} 
      className={`${
        isFullscreen 
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none border-none' 
          : 'relative w-full rounded-xl border-2 border-[#523e24] min-h-[500px] sm:min-h-[620px] lg:min-h-[780px]'
      } overflow-hidden shadow-2xl bg-[#17100b] select-none font-serif flex flex-col lg:flex-row`}
    >
      
      {/* SOL / ORTA: CANVAS HARİTA ALANI */}
      <div className="relative flex-1 min-w-0">
        
      {/* 2. STRATEJİK HARİTA KONTROL DOCK'U (OMNIBOX, MODLAR, İŞARETLER, FİLTRELER) */}
      <MapStrategicControls
        currentMode={mapMode}
        onSelectMode={(mode) => setMapMode(mode)}
        filterType={filterType}
        onSelectFilter={(f) => setFilterType(f)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(g => !g)}
        showInfluenceRings={showInfluenceRings}
        onToggleInfluenceRings={() => setShowInfluenceRings(r => !r)}
        showRadar={showRadar}
        onToggleRadar={() => setShowRadar(r => !r)}
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(2.8, z * 1.2))}
        onZoomOut={() => setZoom(z => Math.max(0.12, z / 1.2))}
        onFocusCapital={() => {
          focusOnCoordinates(playerVillage.x, playerVillage.y, true);
          setZoom(1.0);
        }}
        onJumpToCoords={(x, y) => focusOnCoordinates(x, y, true)}
        playerVillage={playerVillage}
        playerVillages={playerVillages}
        rivalVillages={rivalVillages}
        selectedTile={selectedTile}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(f => !f)}
      />

      {/* 2.5 STRATEJİK TAKTİK RADAR (SAĞ ALT) */}
      {showRadar && (
        <TacticalMinimapRadar
          camera={camera}
          zoom={zoom}
          canvasWidth={canvasRef.current?.width || 1200}
          canvasHeight={canvasRef.current?.height || 700}
          playerVillages={playerVillages}
          rivalVillages={rivalVillages}
          activeMarches={activeMarches}
          selectedTile={selectedTile}
          onPanToCoords={(x, y) => focusOnCoordinates(x, y, true)}
          onSelectCoords={(x, y) => setSelectedTile({ x, y })}
          currentRegionName={selectedBiome ? (selectedBiome.factionZone && selectedBiome.factionZone !== 'neutral' && selectedBiome.factionZone !== 'water' ? `${FACTIONS[selectedBiome.factionZone]?.name || selectedBiome.factionZone} Sancağı` : 'Anadolu Bozkırı') : 'Anadolu Coğrafyası'}
        />
      )}


      {/* 2. SOL ALT FLOATING ZOOM & KAMERA KONTROLLERİ (ANTİK BRONZ SİKKE DOCK'U) */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        className={`absolute z-20 flex items-center gap-1.5 sm:gap-2 bg-gradient-to-b from-[#2a1c11] to-[#120a05] border sm:border-2 border-[#7a552b] rounded-2xl p-1 sm:p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)] text-xs transition-all duration-200 select-none ${
          selectedTile 
            ? 'bottom-28 left-2.5 sm:bottom-20 sm:left-4' 
            : 'bottom-12 left-2.5 sm:bottom-14 sm:left-4'
        }`}
      >
        <button
          onClick={() => setZoom(z => Math.min(2.8, z + 0.25))}
          title="Yakınlaş (+)"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#3a2718] to-[#1a1109] hover:border-amber-400 text-[#f5ebd7] border border-[#7a552b] shadow flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 touch-manipulation"
        >
          <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
        </button>

        <button
          onClick={() => setZoom(z => Math.max(0.12, z - 0.25))}
          title="Uzaklaş (-)"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#3a2718] to-[#1a1109] hover:border-amber-400 text-[#f5ebd7] border border-[#7a552b] shadow flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95 touch-manipulation"
        >
          <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
        </button>

        <button
          onClick={() => {
            focusOnCoordinates(playerVillage.x, playerVillage.y, true);
            setZoom(1.0);
          }}
          title="Merkez Otağa Dön"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-b from-[#8f2415] via-[#5e1208] to-[#2d0702] border sm:border-2 border-[#d9553b] hover:border-amber-400 text-[#fbf6ea] font-serif font-black text-[11px] sm:text-xs transition cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.9)] hover:scale-105 active:scale-95 touch-manipulation"
        >
          <Crosshair className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 drop-shadow-md" />
          <span className="hidden sm:inline">Merkez</span>
        </button>

        {/* Taktik Izgara Geçişi */}
        <button
          onClick={() => setShowGrid(g => !g)}
          title={showGrid ? "Izgarayı Gizle" : "Izgarayı Göster"}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-serif font-bold transition cursor-pointer hover:scale-105 active:scale-95 touch-manipulation ${
            showGrid 
              ? 'bg-gradient-to-b from-[#6b4724] to-[#3a2512] text-amber-200 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
              : 'bg-[#150e08] text-[#9e8770] border-[#523d26]'
          }`}
        >
          <span>📐</span>
          <span className="hidden md:inline">Izgara</span>
        </button>

        {/* Etki Halkaları Geçişi */}
        <button
          onClick={() => setShowInfluenceRings(r => !r)}
          title={showInfluenceRings ? "Etki Çemberlerini Gizle" : "Etki Çemberlerini Göster"}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs font-serif font-bold transition cursor-pointer hover:scale-105 active:scale-95 touch-manipulation ${
            showInfluenceRings 
              ? 'bg-gradient-to-b from-[#14532d] to-[#052e16] text-emerald-200 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
              : 'bg-[#150e08] text-[#9e8770] border-[#523d26]'
          }`}
        >
          <span>⭕</span>
          <span className="hidden md:inline">Etki</span>
        </button>
      </div>

      {/* 3. HTML5 CANVAS ANA ÇİZİM ALANI */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const { wx, wy } = screenToWorld(clickX, clickY, canvas.width, canvas.height);
          if (wx >= 0 && wx < WORLD_WIDTH && wy >= 0 && wy < WORLD_HEIGHT) {
            const rival = rivalVillages.find(rv => rv.x === wx && rv.y === wy);
            if (rival) {
              setQuickMarchTarget({
                name: rival.name,
                x: rival.x,
                y: rival.y,
                ownerName: rival.ownerName,
                faction: rival.faction,
                villageId: rival.id,
              });
              setIsQuickMarchModalOpen(true);
            }
          }
        }}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredTile(null);
        }}
        onWheel={handleWheel}
        className={`w-full block touch-none ${canvasCursorClass}`}
        style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 75px)', minHeight: '480px' }}
      />

      {/* 3.1 ÜZERİNE GELİNEN DÜŞMAN KÖYÜ PARŞÖMEN FERMANI */}
      {hoveredTile && isHoveringRival && (
        (() => {
          const hoveredRival = rivalVillages.find(rv => rv.x === hoveredTile.x && rv.y === hoveredTile.y);
          if (!hoveredRival) return null;
          return (
            <div className="absolute top-16 right-6 z-30 pointer-events-none animate-in fade-in zoom-in-95">
              <div className="bg-[#f7eedc] text-[#2a1a0e] border-2 border-[#805a30] rounded-lg p-3 w-64 shadow-[0_12px_32px_rgba(0,0,0,0.92)] font-serif">
                <div className="border-b border-[#bfa075] pb-1.5 mb-1.5 flex items-center justify-between">
                  <span className="font-serif font-black text-xs text-[#991b1b] tracking-wide uppercase flex items-center gap-1">
                    ⚔️ {hoveredRival.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-red-900 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                    Düşman
                  </span>
                </div>
                <div className="text-[11px] space-y-1 text-[#4a3219]">
                  <div><span className="text-[#7c562e] font-bold">Sahip Bey:</span> {hoveredRival.ownerName || 'Bilinmeyen Bey'}</div>
                  <div><span className="text-[#7c562e] font-bold">Beylik:</span> {hoveredRival.faction || 'Türkmen'}</div>
                  <div><span className="text-[#7c562e] font-bold">Koordinat:</span> ({hoveredRival.x} | {hoveredRival.y})</div>
                  <div><span className="text-[#7c562e] font-bold">Mesafe:</span> {calculateDistance(playerVillage.x, playerVillage.y, hoveredRival.x, hoveredRival.y).toFixed(1)} Kare</div>
                </div>
                <div className="mt-2 pt-1 border-t border-[#be9f77]/60 text-[10px] text-amber-900 font-bold italic text-center">
                  Çift tıklayarak akın veya sefer emri verin!
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 3.2 ÜZERİNE GELİNEN KAYNAK DÜĞÜMÜ BİLGİ TOOLTIP'İ (VERİMLİLİK & İŞÇİ DURUMU) */}
      {hoveredTile && !isHoveringRival && canvasRef.current && (
        (() => {
          const hoveredNode = allNodes.find(n => n.x === hoveredTile.x && n.y === hoveredTile.y);
          if (!hoveredNode) return null;

          const canvas = canvasRef.current;
          const { sx, sy, tileSize } = worldToScreen(hoveredNode.x, hoveredNode.y, canvas.width, canvas.height);

          // Ekranda görünürlük kontrolü
          if (sx < -80 || sx > canvas.width + 80 || sy < -80 || sy > canvas.height + 80) return null;

          const eff = getNodeEfficiency(hoveredNode);
          const totalWorkers = getNodeTotalWorkers(hoveredNode);
          const isInside = isNodeWithinRadius(playerVillage, hoveredNode, influenceRadius);

          const getResourceTypeName = (type: string) => {
            switch (type) {
              case 'wood': return { name: 'Odun Koruluğu', icon: '🌲', color: 'text-emerald-400' };
              case 'stone': return { name: 'Taş Madeni', icon: '⛰️', color: 'text-stone-300' };
              case 'iron': return { name: 'Demir Damarı', icon: '⛏️', color: 'text-cyan-400' };
              case 'grain': return { name: 'Tahıl Ovası', icon: '🌾', color: 'text-amber-400' };
              case 'gold': return { name: 'Altın Havzası', icon: '🪙', color: 'text-yellow-400' };
              default: return { name: 'Doğal Kaynak', icon: '💎', color: 'text-amber-300' };
            }
          };

          const resInfo = getResourceTypeName(hoveredNode.type);

          return (
            <div
              className="absolute pointer-events-none z-40 -translate-x-1/2 -translate-y-full mb-3 flex flex-col gap-1.5 p-3 rounded-xl bg-gradient-to-b from-[#24170d]/98 via-[#180e06]/98 to-[#0f0703]/98 border-2 border-[#caa05a] shadow-[0_12px_36px_rgba(0,0,0,0.95),0_0_15px_rgba(202,160,90,0.35)] backdrop-blur-md text-xs text-[#f3e5ce] select-none min-w-[190px] animate-scale-up font-serif"
              style={{
                left: `${sx + tileSize / 2}px`,
                top: `${sy - 6}px`,
              }}
            >
              {/* Başlık ve Koordinat */}
              <div className="flex items-center justify-between border-b border-[#4a341f] pb-1.5 gap-2">
                <div className="flex items-center gap-1.5 font-black text-amber-200 text-xs">
                  <span>{resInfo.icon}</span>
                  <span className={resInfo.color}>{resInfo.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#a89476] bg-[#120803] px-1.5 py-0.5 rounded border border-[#3e2715]">
                  ({hoveredNode.x}|{hoveredNode.y})
                </span>
              </div>

              {/* Verimlilik ve İşçi Detayları */}
              <div className="space-y-1 text-[11px] text-[#decab0] pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[#a89476]">Verimlilik:</span>
                  <span className="font-mono font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80 text-xs">
                    {eff} / 9
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#a89476]">Çalışan İşçi:</span>
                  <span className="font-mono font-bold text-white">
                    {totalWorkers} / 1000
                  </span>
                </div>
              </div>

              {/* Menzil Durumu */}
              <div className="pt-1.5 mt-0.5 border-t border-[#3e2916] text-[10.5px] font-bold">
                {isInside ? (
                  <div className="text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 rounded px-2 py-1 text-center flex items-center justify-center gap-1">
                    <span>✓</span>
                    <span>Menzil İçinde - İşçi Atanabilir</span>
                  </div>
                ) : (
                  <div className="text-[#a89476] bg-[#120803]/80 border border-[#332213] rounded px-2 py-1 text-center italic">
                    Menzil Dışında
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}

      {/* 3.5. HARİTA ÜZERİ KÖY HEDEF MENÜSÜ (TARGET CONTEXT POPUP - [ ASKER GÖNDER ] / [ CASUS GÖNDER ]) */}
      {selectedTile && (selectedRival || (selectedPlayerV && selectedPlayerV.id !== playerVillage.id)) && canvasRef.current && (
        (() => {
          const canvas = canvasRef.current;
          const targetV = selectedRival || selectedPlayerV!;
          const { sx, sy, tileSize } = worldToScreen(targetV.x, targetV.y, canvas.width, canvas.height);

          // Ekranda görünürlük kontrolü
          if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) return null;

          return (
            <div 
              className="absolute pointer-events-auto z-30 -translate-x-1/2 -translate-y-full mb-2 flex items-center gap-1.5 p-1.5 rounded-xl bg-gradient-to-b from-[#2a1b10]/95 via-[#1a1008]/95 to-[#120803]/95 border-2 border-[#caa05a] shadow-[0_10px_35px_rgba(0,0,0,0.95),0_0_15px_rgba(202,160,90,0.4)] backdrop-blur-md animate-scale-up select-none"
              style={{
                left: `${sx + tileSize / 2}px`,
                top: `${sy - 8}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Köy Başlığı */}
              <div className="px-2 py-0.5 text-center border-r border-[#4a341f] pr-2.5 mr-0.5">
                <div className="text-[11px] font-serif font-black text-[#fef08a] whitespace-nowrap drop-shadow">
                  {targetV.name}
                </div>
                <div className="text-[9px] font-mono text-[#a89476]">
                  ({targetV.x}|{targetV.y})
                </div>
              </div>

              {/* [ Asker Gönder ] Butonu (Kılıç ikonu, döküm metal zemin, altın çerçeve) */}
              <button
                onClick={() => {
                  setDispatchTarget({
                    name: targetV.name,
                    x: targetV.x,
                    y: targetV.y,
                    ownerName: targetV.ownerName,
                    faction: targetV.faction,
                    villageId: targetV.id,
                  });
                  setDispatchInitialMission('attack');
                  setIsDispatchModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-b from-[#4a3525] via-[#2f2015] to-[#1f140c] hover:from-[#6b4c33] hover:to-[#382618] text-[#fef08a] hover:text-white rounded-lg border border-[#caa05a] hover:border-amber-300 font-serif font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Swords className="w-3.5 h-3.5 text-yellow-400" />
                <span>Asker Gönder</span>
              </button>

              {/* [ Casus Gönder ] Butonu (Göz ikonu, döküm zemin, mor/altın çerçeve) */}
              <button
                onClick={() => {
                  setDispatchTarget({
                    name: targetV.name,
                    x: targetV.x,
                    y: targetV.y,
                    ownerName: targetV.ownerName,
                    faction: targetV.faction,
                    villageId: targetV.id,
                  });
                  setDispatchInitialMission('spy');
                  setIsDispatchModalOpen(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-b from-[#352540] via-[#22162b] to-[#140b1c] hover:from-[#4d335f] hover:to-[#2c1c38] text-purple-200 hover:text-white rounded-lg border border-purple-500/80 hover:border-purple-300 font-serif font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 text-purple-300" />
                <span>Casus Gönder</span>
              </button>

              {/* Kapat X */}
              <button
                onClick={() => setSelectedTile(null)}
                className="p-1 rounded-full text-[#a89476] hover:text-amber-200 hover:bg-[#3d2714] cursor-pointer transition text-xs font-bold ml-0.5"
                title="Kapat"
              >
                ✕
              </button>
            </div>
          );
        })()
      )}

      {/* 3.6. HARİTA ÜZERİ KAYNAK DÜĞÜMÜ HEDEF MENÜSÜ (RESOURCE NODE CONTEXT POPUP - [ +10 İŞÇİ GÖNDER ] / [ ↩️ -10 ÇEK ]) */}
      {selectedTile && selectedNode && canvasRef.current && (
        (() => {
          const canvas = canvasRef.current;
          const { sx, sy, tileSize } = worldToScreen(selectedNode.x, selectedNode.y, canvas.width, canvas.height);

          if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) return null;

          return (
            <div 
              className="absolute pointer-events-auto z-30 -translate-x-1/2 -translate-y-full mb-2 flex items-center gap-1.5 p-1.5 rounded-xl bg-gradient-to-b from-[#2a1b10]/95 via-[#1a1008]/95 to-[#120803]/95 border-2 border-[#caa05a] shadow-[0_10px_35px_rgba(0,0,0,0.95),0_0_18px_rgba(245,158,11,0.5)] backdrop-blur-md animate-scale-up select-none"
              style={{
                left: `${sx + tileSize / 2}px`,
                top: `${sy - 8}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Kaynak Başlığı */}
              <div className="px-2 py-0.5 text-center border-r border-[#4a341f] pr-2.5 mr-0.5">
                <div className="text-[11px] font-serif font-black text-[#fef08a] whitespace-nowrap drop-shadow flex items-center gap-1">
                  <span>💎 {selectedNode.name}</span>
                </div>
                <div className="text-[9px] font-mono text-emerald-400">
                  +{nodeEfficiency}/saat/işçi
                </div>
              </div>

              {/* [ +10 İşçi Gönder ] Butonu */}
              <button
                onClick={() => {
                  if (workerAssignCheck?.allowed && onAssignWorkers) {
                    onAssignWorkers(playerVillage.id, selectedNode.id, 10);
                  }
                }}
                disabled={!workerAssignCheck?.allowed}
                className={`px-3 py-1.5 rounded-lg border font-serif font-bold text-xs flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap ${
                  workerAssignCheck?.allowed
                    ? 'bg-gradient-to-b from-[#1b6135] via-[#104323] to-[#0a2c16] hover:from-[#258248] text-emerald-100 border-emerald-400 cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-[#251a10] text-[#786145] border-[#523d26] opacity-60 cursor-not-allowed'
                }`}
                title={workerAssignCheck?.allowed ? '10 Boşta İşçiyi Bu Kaynağa Sevk Et' : workerAssignCheck?.reason}
              >
                <Pickaxe className="w-3.5 h-3.5 text-amber-300" />
                <span>+10 İşçi Gönder</span>
              </button>

              {/* [ -10 İşçi Çek ] Butonu (Eğer bu madende işçi çalışıyorsa) */}
              {villageWorkersOnNode > 0 && (
                <button
                  onClick={() => {
                    if (onAssignWorkers) {
                      onAssignWorkers(playerVillage.id, selectedNode.id, -10);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-b from-[#4a261a] via-[#33180f] to-[#1f0d08] hover:from-[#663220] text-amber-200 hover:text-white rounded-lg border border-amber-600/80 hover:border-amber-400 font-serif font-bold text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
                  title="10 İşçiyi Geri Köye Çağır"
                >
                  <span>↩️ -10 Çek</span>
                </button>
              )}

              {/* Kapat X */}
              <button
                onClick={() => setSelectedTile(null)}
                className="p-1 rounded-full text-[#a89476] hover:text-amber-200 hover:bg-[#3d2714] cursor-pointer transition text-xs font-bold ml-0.5"
                title="Kapat"
              >
                ✕
              </button>
            </div>
          );
        })()
      )}

      {/* 4. SEÇİLİ KARE/KÖY/MADEN BİLGİ VE AKSİYON KARTI (ALT ORTA) */}
      {selectedTile && (
        <MapSelectionInspector
          selectedTile={selectedTile}
          playerVillage={playerVillage}
          selectedNode={selectedNode}
          selectedRival={selectedRival}
          selectedPlayerV={selectedPlayerV}
          influenceRadius={influenceRadius}
          isSelectedInsideInfluence={isSelectedInsideInfluence}
          onClose={() => setSelectedTile(null)}
          onFocusCoordinates={(x, y) => focusOnCoordinates(x, y, true)}
          onAssignWorkers={onAssignWorkers}
          onOpenFoundVillageModal={onOpenFoundVillageModal}
          onSelectVillage={onSelectVillage}
          onOpenDispatchModal={(target, mission) => {
            setDispatchTarget(target);
            if (mission) setDispatchInitialMission(mission);
            setIsDispatchModalOpen(true);
          }}
        />
      )}

      {/* 5. ORİJİNAL 3 BÖLÜMLÜ "ASKER GÖNDER" MODALI */}
      <DispatchMarchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setDispatchTarget(null);
        }}
        originVillage={playerVillage}
        playerVillages={playerVillages}
        target={dispatchTarget}
        initialMission={dispatchInitialMission}
        onDispatch={(targetCoords, targetName, mission, units, withKhan, originVillageId, isBoosted) => {
          if (onDispatchMarch) {
            onDispatchMarch(targetCoords, targetName, mission, units, withKhan, originVillageId, isBoosted);
          } else {
            onSelectTargetForMarch(
              dispatchTarget?.villageId ? rivalVillages.find(r => r.id === dispatchTarget.villageId) || null : null,
              targetCoords
            );
          }
          setIsDispatchModalOpen(false);
          setDispatchTarget(null);
        }}
      />

      {/* 6. HARİTA ÜZERİ HIZLI SEFER / AKIN EMRİ MODALI */}
      <QuickMarchModal 
        isOpen={isQuickMarchModalOpen}
        onClose={() => {
          setIsQuickMarchModalOpen(false);
          setQuickMarchTarget(null);
        }}
        originVillage={playerVillage}
        target={quickMarchTarget}
        onDispatch={(targetCoords, targetName, mission, units) => {
          if (onDispatchMarch) {
            onDispatchMarch(targetCoords, targetName, mission, units);
          } else {
            onSelectTargetForMarch(
              quickMarchTarget?.villageId ? rivalVillages.find(r => r.id === quickMarchTarget.villageId) || null : null,
              targetCoords
            );
          }
          setIsQuickMarchModalOpen(false);
          setQuickMarchTarget(null);
        }}
      />

      {/* 7. SOL ALT CANLI SEFER SAYACI & FERMAN KUTUSU (UMAYKUT SALDIRIYA GİDEN ORDU SAYISI) */}
      <ActiveMarchesTicker 
        activeMarches={activeMarches}
        onFocusMarch={(targetCoords) => {
          setCamera(targetCoords);
          setSelectedTile(targetCoords);
        }}
      />

      </div>

      {/* SAĞ: UMAYKUT ORNATE YAN HUD PANELİ (images.jpg Birebir Tasarımı) */}
      <UmaykutRightPanel
        village={playerVillage}
        playerVillages={playerVillages}
        rates={rates || { wood: 100, stone: 100, iron: 50, grain: 100, gold: 20 }}
        activeMarches={activeMarches}
        onSelectVillage={onSelectVillage || (() => {})}
        onOpenFoundVillageModal={onOpenFoundVillageModal ? () => onOpenFoundVillageModal({ x: playerVillage.x, y: playerVillage.y }) : undefined}
        onOpenBuilding={onOpenBuilding}
        onSelectTab={onSelectTab}
        onOpenFactionModal={onOpenFactionModal}
      />

    </div>
  );
};
