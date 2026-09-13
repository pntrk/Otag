/**
 * Gerçek Harita Kiremit (Tile) & Web Mercator Projeksiyon Motoru (Real Map Tile Engine)
 * 
 * OpenStreetMap, ESRI World Shaded Relief, ESRI Satellite ve CartoDB Voyager
 * kiremitlerini (tiles) oyunun 1000x500 koordinat evreniyle gerçek zamanlı olarak eşleştirir.
 */

import { geoToMap } from '../data/realTurkeyGeoData';

export type MapTileProvider = 'esri_relief' | 'esri_satellite' | 'carto_voyager' | 'osm_standard';

export interface TileProviderConfig {
  id: MapTileProvider;
  name: string;
  urlTemplate: string;
  attribution: string;
  maxZoom: number;
}

export const TILE_PROVIDERS: Record<MapTileProvider, TileProviderConfig> = {
  esri_relief: {
    id: 'esri_relief',
    name: 'Gerçek Topoğrafik Rölyef (ESRI)',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    attribution: 'ESRI World Shaded Relief',
    maxZoom: 13,
  },
  esri_satellite: {
    id: 'esri_satellite',
    name: 'Gerçek Uydu Görüntüsü (ESRI)',
    urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'ESRI Satellite Imagery',
    maxZoom: 16,
  },
  carto_voyager: {
    id: 'carto_voyager',
    name: 'Gerçek Harita & Yollar (CartoDB)',
    urlTemplate: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: 'CartoDB / OpenStreetMap',
    maxZoom: 16,
  },
  osm_standard: {
    id: 'osm_standard',
    name: 'OpenStreetMap Standart',
    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 16,
  },
};

// Boylam / Enlem -> Web Mercator Tile (Z, X, Y)
export function lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
  return { x, y };
}

// Tile (Z, X, Y) -> Sol Üst Boylam / Enlem (Lon, Lat)
export function tileToLonLat(x: number, y: number, zoom: number): { lon: number; lat: number } {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  const lon = (x / Math.pow(2, zoom)) * 360 - 180;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lon, lat };
}

export class RealMapTileEngine {
  private static imageCache: Map<string, HTMLImageElement> = new Map();
  private static loadingTiles: Set<string> = new Set();

  /**
   * Belirtilen URL'den Tile görselini yükler veya önbellekten döner
   */
  public static getTileImage(url: string, onLoaded?: () => void): HTMLImageElement | null {
    if (this.imageCache.has(url)) {
      const img = this.imageCache.get(url)!;
      if (img.complete && img.naturalWidth > 0) return img;
      return null;
    }

    if (!this.loadingTiles.has(url)) {
      this.loadingTiles.add(url);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadingTiles.delete(url);
        if (onLoaded) onLoaded();
      };
      img.onerror = () => {
        this.loadingTiles.delete(url);
      };
      img.src = url;
    }

    return null;
  }

  /**
   * Türkiye Coğrafi Bounding Box'ı içindeki gerçek harita kiremitlerini çizer
   */
  public static renderRealTiles(
    ctx: CanvasRenderingContext2D,
    provider: MapTileProvider,
    worldToScreen: (wx: number, wy: number, width: number, height: number) => { sx: number; sy: number; tileSize: number },
    width: number,
    height: number,
    gameZoom: number,
    onRedrawNeeded?: () => void
  ): void {
    const config = TILE_PROVIDERS[provider];
    if (!config) return;

    // Oyun zoom seviyesine göre en uygun slippy tile zoom seviyesini belirle (z = 5 .. 9)
    let tileZoom = 6;
    if (gameZoom < 0.25) tileZoom = 5;
    else if (gameZoom < 0.6) tileZoom = 6;
    else if (gameZoom < 1.2) tileZoom = 7;
    else if (gameZoom < 2.0) tileZoom = 8;
    else tileZoom = 9;

    tileZoom = Math.min(tileZoom, config.maxZoom);

    // Türkiye Bounding Box: Lon 25.0°E..45.2°E, Lat 35.5°N..42.5°N
    const minLon = 25.5;
    const maxLon = 44.9;
    const minLat = 35.7;
    const maxLat = 42.3;

    const topLeftTile = lonLatToTile(minLon, maxLat, tileZoom);
    const bottomRightTile = lonLatToTile(maxLon, minLat, tileZoom);

    const minTileX = Math.min(topLeftTile.x, bottomRightTile.x);
    const maxTileX = Math.max(topLeftTile.x, bottomRightTile.x);
    const minTileY = Math.min(topLeftTile.y, bottomRightTile.y);
    const maxTileY = Math.max(topLeftTile.y, bottomRightTile.y);

    ctx.save();

    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        // Tile Köşelerinin Coğrafi Konumu
        const nwGeo = tileToLonLat(tx, ty, tileZoom);
        const seGeo = tileToLonLat(tx + 1, ty + 1, tileZoom);

        // 1000x500 Grid Koordinatları
        const nwMap = geoToMap(nwGeo.lon, nwGeo.lat);
        const seMap = geoToMap(seGeo.lon, seGeo.lat);

        // Ekran Koordinatları
        const nwScreen = worldToScreen(nwMap.x, nwMap.y, width, height);
        const seScreen = worldToScreen(seMap.x, seMap.y, width, height);

        const drawW = seScreen.sx - nwScreen.sx;
        const drawH = seScreen.sy - nwScreen.sy;

        // Ekranda görünürlük kontrolü
        if (
          nwScreen.sx + drawW < -50 ||
          nwScreen.sx > width + 50 ||
          nwScreen.sy + drawH < -50 ||
          nwScreen.sy > height + 50
        ) {
          continue;
        }

        const tileUrl = config.urlTemplate
          .replace('{z}', tileZoom.toString())
          .replace('{x}', tx.toString())
          .replace('{y}', ty.toString());

        const img = this.getTileImage(tileUrl, onRedrawNeeded);

        if (img) {
          ctx.drawImage(img, nwScreen.sx, nwScreen.sy, drawW, drawH);
        } else {
          // Yüklenene kadar hafif şeffaf yer tutucu
          ctx.fillStyle = 'rgba(40, 50, 60, 0.15)';
          ctx.fillRect(nwScreen.sx, nwScreen.sy, drawW, drawH);
        }
      }
    }

    ctx.restore();
  }
}
