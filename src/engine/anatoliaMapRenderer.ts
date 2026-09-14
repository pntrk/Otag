/**
 * Gerçek Türkiye / 13. Yüzyıl Anadolu Coğrafi Harita Çizim Motoru (Grand Strategy Map Renderer)
 * 
 * Gerçek GIS Enlem/Boylam Verilerini & Canlı Harita Kiremitlerini 1000x500 Grid Evrenine Yansıtır.
 */

import { 
  REAL_TURKEY_COASTLINE_GEO, 
  REAL_LAKES_GEO, 
  REAL_RIVERS_GEO, 
  REAL_MOUNTAINS_GEO, 
  REAL_FACTION_HISTORICAL_SITES, 
  geoToMap 
} from '../data/realTurkeyGeoData';
import { TURKEY_PROVINCES } from '../data/turkeyProvincesGeo';
import { RealMapTileEngine, MapTileProvider } from './realMapTileEngine';

export type AnatoliaMapMode = 'umaykut_meadow' | 'drawable_parchment' | 'real_relief' | 'real_satellite' | 'real_carto' | 'physical' | 'political' | 'parchment';

export interface AnatoliaRenderOptions {
  mapMode?: AnatoliaMapMode;
  showRivers?: boolean;
  showMountains?: boolean;
  showLakes?: boolean;
  showBorders?: boolean;
  showProvinces?: boolean;
  showHistoricalSites?: boolean;
  customMapImage?: HTMLImageElement | null;
  onRedrawNeeded?: () => void;
}

export class AnatoliaMapRenderer {
  // Önceden hesaplanmış 1000x500 grid noktaları (Performans için bir kez hesaplanır)
  private static cachedCoastline = REAL_TURKEY_COASTLINE_GEO.map(pt => geoToMap(pt.lon, pt.lat));
  
  private static cachedLakes = {
    vanGolu: REAL_LAKES_GEO.vanGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
    tuzGolu: REAL_LAKES_GEO.tuzGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
    beysehirGolu: REAL_LAKES_GEO.beysehirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
    egirdirGolu: REAL_LAKES_GEO.egirdirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
    iznikGolu: REAL_LAKES_GEO.iznikGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
    sapancaGolu: REAL_LAKES_GEO.sapancaGolu.points.map(pt => geoToMap(pt.lon, pt.lat)),
  };

  private static cachedRivers = REAL_RIVERS_GEO.map(r => ({
    name: r.name,
    points: r.points.map(pt => geoToMap(pt.lon, pt.lat))
  }));

  private static cachedMountains = REAL_MOUNTAINS_GEO.map(m => ({
    ...m,
    mapPt: geoToMap(m.lon, m.lat)
  }));

  private static cachedSites = REAL_FACTION_HISTORICAL_SITES.map(s => ({
    ...s,
    mapPt: geoToMap(s.lon, s.lat)
  }));

  private static cachedProvinces = TURKEY_PROVINCES.map(p => ({
    ...p,
    mapPt: geoToMap(p.lon, p.lat)
  }));

  /**
   * 1000x500 Anadolu Haritasını Dünya Koordinatlarından Ekran Koordinatlarına Çizer
   */
  public static renderAnatolia(
    ctx: CanvasRenderingContext2D,
    worldToScreen: (wx: number, wy: number, width: number, height: number) => { sx: number; sy: number; tileSize: number },
    width: number,
    height: number,
    zoom: number,
    options: AnatoliaRenderOptions = {}
  ): void {
    const mode = options.mapMode || 'real_relief';
    const showRivers = options.showRivers !== false;
    const showMountains = options.showMountains !== false;
    const showLakes = options.showLakes !== false;
    const showBorders = options.showBorders !== false;
    const showProvinces = options.showProvinces !== false;
    const showHistoricalSites = options.showHistoricalSites !== false;

    const toS = (wx: number, wy: number) => worldToScreen(wx, wy, width, height);
    const { sx: mapStartX, sy: mapStartY, tileSize } = toS(0, 0);
    const mapW = 1000 * tileSize;
    const mapH = 500 * tileSize;

    // ========================================================================
    // 0. TEMEL UMAYKUT ÇAYIR & DRAWABLE ANADOLU HARİTASI
    // ========================================================================
    if (mode === 'umaykut_meadow') {
      ctx.save();
      ctx.fillStyle = '#688c38';
      ctx.fillRect(mapStartX, mapStartY, mapW, mapH);
      ctx.restore();
    } else if (mode === 'drawable_parchment' || (mode === 'parchment' && options.customMapImage)) {
      ctx.save();
      if (options.customMapImage && options.customMapImage.complete && options.customMapImage.naturalWidth > 0) {
        ctx.drawImage(options.customMapImage, mapStartX, mapStartY, mapW, mapH);
      } else {
        // Doğal çayır / zemin
        ctx.fillStyle = '#688c38';
        ctx.fillRect(mapStartX, mapStartY, mapW, mapH);
      }
      ctx.restore();

      // İsteğe bağlı Vektörel Tarihi İşaretleyiciler ve 81 İl Merkezleri (Zoom'a göre)
      if (showHistoricalSites && zoom >= 0.35) {
        this.cachedSites.forEach(site => {
          const pt = toS(site.mapPt.x, site.mapPt.y);
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, Math.max(3, 4.5 * zoom), 0, Math.PI * 2);
          ctx.fillStyle = site.type === 'capital' ? '#991b1b' : '#78350f';
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#291809';
          ctx.shadowColor = 'rgba(255,255,255,0.85)';
          ctx.shadowBlur = 3;
          ctx.font = `${site.type === 'capital' ? 'bold' : 'normal'} ${Math.max(8, Math.floor(9 * zoom))}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(site.name, pt.sx, pt.sy + 12);
          ctx.restore();
        });
      }

      if (showProvinces && zoom >= 0.5) {
        this.cachedProvinces.forEach(p => {
          const pt = toS(p.mapPt.x, p.mapPt.y);
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, Math.max(2, 3 * zoom), 0, Math.PI * 2);
          ctx.fillStyle = '#854d0e';
          ctx.fill();

          ctx.fillStyle = '#291809';
          ctx.shadowColor = 'rgba(255,255,255,0.75)';
          ctx.shadowBlur = 3;
          ctx.font = `${Math.max(8, Math.floor(8.5 * zoom))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.name, pt.sx, pt.sy + 10);
          ctx.restore();
        });
      }

      return;
    }

    ctx.save();

    // ========================================================================
    // A. CANLI GERÇEK HARİTA KİREMİT KATMANI (Real Tile Layers)
    // ========================================================================
    if (mode === 'real_relief' || mode === 'real_satellite' || mode === 'real_carto') {
      let provider: MapTileProvider = 'esri_relief';
      if (mode === 'real_satellite') provider = 'esri_satellite';
      if (mode === 'real_carto') provider = 'carto_voyager';

      // Arka plan koyu deniz tonu
      ctx.fillStyle = mode === 'real_satellite' ? '#071626' : '#142c44';
      ctx.fillRect(mapStartX, mapStartY, mapW, mapH);

      // Gerçek Harita Kiremitlerini Çiz
      RealMapTileEngine.renderRealTiles(
        ctx,
        provider,
        worldToScreen,
        width,
        height,
        zoom,
        options.onRedrawNeeded
      );

      // Uydu / Rölyef üzerine antik parşömen / oyun atmosferi filtresi
      if (mode === 'real_relief') {
        ctx.fillStyle = 'rgba(217, 197, 161, 0.08)';
        ctx.fillRect(mapStartX, mapStartY, mapW, mapH);
      }
    } else {
      // ========================================================================
      // B. GENİŞ DÜZ VE AÇIK OVA ZEMİN ÇİZİMİ
      // ========================================================================
      const landGrad = ctx.createLinearGradient(mapStartX, mapStartY, mapStartX + mapW, mapStartY + mapH);
      if (mode === 'political') {
        landGrad.addColorStop(0, '#e8dcbe');
        landGrad.addColorStop(0.5, '#dfcfaf');
        landGrad.addColorStop(1, '#d5c29f');
      } else if (mode === 'parchment') {
        landGrad.addColorStop(0, '#f0e6cf');
        landGrad.addColorStop(0.5, '#e5d7b7');
        landGrad.addColorStop(1, '#dbcca7');
      } else {
        landGrad.addColorStop(0, '#688c38');
        landGrad.addColorStop(0.5, '#5e8031');
        landGrad.addColorStop(1, '#53732b');
      }
      ctx.fillStyle = landGrad;
      ctx.fillRect(mapStartX, mapStartY, mapW, mapH);

      // Nehirler
      if (showRivers) {
        ctx.strokeStyle = mode === 'parchment' ? '#3b6282' : '#23699b';
        ctx.lineWidth = Math.max(1.2, 2.2 * zoom);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        this.cachedRivers.forEach(river => {
          const pts = river.points.map(p => toS(p.x, p.y));
          if (pts.length > 1) {
            ctx.beginPath();
            ctx.moveTo(pts[0].sx, pts[0].sy);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
            ctx.stroke();
          }
        });
      }

      // Dağlar
      if (showMountains) {
        this.cachedMountains.forEach(m => {
          const pt = toS(m.mapPt.x, m.mapPt.y);
          const baseSize = m.tier === 'massive' ? 16 : m.tier === 'high' ? 13 : 9;
          const sz = baseSize * tileSize * 0.45;

          ctx.beginPath();
          ctx.moveTo(pt.sx, pt.sy - sz);
          ctx.lineTo(pt.sx - sz * 0.9, pt.sy + sz * 0.8);
          ctx.lineTo(pt.sx + sz * 0.9, pt.sy + sz * 0.8);
          ctx.closePath();
          ctx.fillStyle = '#7a6045';
          ctx.fill();
          ctx.strokeStyle = '#4a331e';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(pt.sx, pt.sy - sz);
          ctx.lineTo(pt.sx - sz * 0.4, pt.sy - sz * 0.1);
          ctx.lineTo(pt.sx + sz * 0.4, pt.sy - sz * 0.1);
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          if (zoom >= 0.35) {
            ctx.fillStyle = '#3a220e';
            ctx.font = `italic ${Math.max(8, Math.floor(9 * zoom))}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText(`⛰️ ${m.name}`, pt.sx, pt.sy + sz + 8);
          }
        });
      }
    }

    // ========================================================================
    // C. 13. YÜZYIL TARİHİ BEYLİK SANCAK & NÜFUZ ALANLARI
    // ========================================================================
    if (showBorders || mode === 'political') {
      const beylikler = [
        { name: 'OSMANOĞULLARI', faction: 'osmanogullari', lon: 30.15, lat: 40.05, rx: 35, ry: 28, color: 'rgba(220, 38, 38, 0.18)', stroke: 'rgba(220, 38, 38, 0.8)' },
        { name: 'KARAMANOĞULLARI', faction: 'karamanogullari', lon: 32.80, lat: 37.50, rx: 55, ry: 45, color: 'rgba(30, 58, 138, 0.16)', stroke: 'rgba(30, 58, 138, 0.8)' },
        { name: 'AYDINOĞULLARI', faction: 'aydinogullari', lon: 27.60, lat: 38.10, rx: 38, ry: 42, color: 'rgba(4, 120, 87, 0.16)', stroke: 'rgba(4, 120, 87, 0.8)' },
        { name: 'CANDAROĞULLARI', faction: 'candarogullari', lon: 33.70, lat: 41.60, rx: 45, ry: 32, color: 'rgba(180, 83, 9, 0.16)', stroke: 'rgba(180, 83, 9, 0.8)' },
        { name: 'DULKADİROĞULLARI', faction: 'dulkadirogullari', lon: 37.30, lat: 37.90, rx: 50, ry: 40, color: 'rgba(109, 40, 217, 0.16)', stroke: 'rgba(109, 40, 217, 0.8)' }
      ];

      beylikler.forEach(b => {
        const mapCoord = geoToMap(b.lon, b.lat);
        const pt = toS(mapCoord.x, mapCoord.y);

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(pt.sx, pt.sy, b.rx * tileSize, b.ry * tileSize, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = b.stroke;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 3]);
        ctx.stroke();

        if (zoom >= 0.22) {
          ctx.fillStyle = mode === 'real_satellite' ? '#ffffff' : '#2c1a0c';
          ctx.shadowColor = mode === 'real_satellite' ? '#000000' : 'rgba(255,255,255,0.6)';
          ctx.shadowBlur = 4;
          ctx.font = `bold ${Math.max(10, Math.floor(13 * zoom))}px serif`;
          ctx.textAlign = 'center';
          ctx.fillText(b.name, pt.sx, pt.sy - b.ry * tileSize * 0.4);
        }
        ctx.restore();
      });
    }

    // ========================================================================
    // D. GERÇEK TÜRKİYE İLLERİ & ŞEHİR MERKEZLERİ
    // ========================================================================
    if (showProvinces && zoom >= 0.55) {
      this.cachedProvinces.forEach(p => {
        const pt = toS(p.mapPt.x, p.mapPt.y);

        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, Math.max(2, 3.2 * zoom), 0, Math.PI * 2);
        ctx.fillStyle = mode === 'real_satellite' ? '#fde047' : '#854d0e';
        ctx.fill();

        ctx.fillStyle = mode === 'real_satellite' ? '#f8fafc' : '#1c1917';
        ctx.shadowColor = mode === 'real_satellite' ? '#000000' : 'rgba(255,255,255,0.7)';
        ctx.shadowBlur = 3;
        ctx.font = `${Math.max(8, Math.floor(8.5 * zoom))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.name, pt.sx, pt.sy + 10);
        ctx.restore();
      });
    }

    // ========================================================================
    // E. TARİHİ ŞEHİR VE KALE NOKTALARI
    // ========================================================================
    if (showHistoricalSites && zoom >= 0.4) {
      this.cachedSites.forEach(site => {
        const pt = toS(site.mapPt.x, site.mapPt.y);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, Math.max(3, 4.5 * zoom), 0, Math.PI * 2);
        ctx.fillStyle = site.type === 'capital' ? '#dc2626' : '#78350f';
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = mode === 'real_satellite' ? '#fef08a' : '#1c1917';
        ctx.shadowColor = mode === 'real_satellite' ? '#000000' : 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 3;
        ctx.font = `${site.type === 'capital' ? 'bold' : 'normal'} ${Math.max(8, Math.floor(9 * zoom))}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(site.name, pt.sx, pt.sy + 12);
        ctx.restore();
      });
    }

    ctx.restore();
  }
}
