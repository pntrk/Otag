/**
 * 13. Yüzyıl Anadolu Beylikleri - Gerçek GIS Tabanlı Gizli Veri Haritası (Collision & Biome Data Map)
 * 
 * 1000x500 Çözünürlüğünde Off-screen HTML5 Canvas üzerinde çalışır.
 * Gerçek Türkiye kıyı poligonu ve iç gölleriyle %100 uyumludur.
 * 
 * Renk Kodlaması:
 * - SİYAH rgb(0, 0, 0): Deniz, Göller ve Sınır Dışı Alanlar (Blacklist: Spawn ve İskan Kurulamaz)
 * - KIRMIZI rgb(220, 38, 38): Osmanoğulları Sancağı (Söğüt, Bilecik, Uç Boyu)
 * - LACİVERT rgb(30, 58, 138): Karamanoğulları Sancağı (Konya, Karaman, Payitaht)
 * - YEŞİL rgb(4, 120, 87): Aydınoğulları Sancağı (Birgi, Aydın, Ege Kıyıları)
 * - KEHRİBAR rgb(180, 83, 9): Candaroğulları Sancağı (Kastamonu, Sinop, Küre Dağları)
 * - MOR rgb(109, 40, 217): Dulkadiroğulları Sancağı (Elbistan, Maraş, Toroslar)
 * - TOPRAK TONU rgb(205, 185, 150): Genel Anadolu İskan Alanı (Tarafsız / Serbest Bölge)
 */

import { FactionId } from '../types/game';
import { 
  REAL_TURKEY_COASTLINE_GEO, 
  REAL_LAKES_GEO, 
  geoToMap 
} from '../data/realTurkeyGeoData';

export const DATA_MAP_WIDTH = 1000;
export const DATA_MAP_HEIGHT = 500;

export interface PixelBiomeInfo {
  x: number;
  y: number;
  isWater: boolean;
  isValidLand: boolean;
  factionZone: FactionId | 'neutral' | 'water';
  colorHex: string;
  r: number;
  g: number;
  b: number;
  a: number;
}

class CollisionDataMapEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private isInitialized = false;

  // Önceden hesaplanmış 1000x500 Coğrafi Poligonlar (Analitik ve Kesin Kontrol)
  private coastlinePoly: Array<{ x: number; y: number }> = REAL_TURKEY_COASTLINE_GEO.map(pt => geoToMap(pt.lon, pt.lat));
  private lakePolys: Array<{ name: string; points: Array<{ x: number; y: number }> }> = [
    { name: 'vanGolu', points: REAL_LAKES_GEO.vanGolu.points.map(pt => geoToMap(pt.lon, pt.lat)) },
    { name: 'tuzGolu', points: REAL_LAKES_GEO.tuzGolu.points.map(pt => geoToMap(pt.lon, pt.lat)) },
    { name: 'beysehirGolu', points: REAL_LAKES_GEO.beysehirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)) },
    { name: 'egirdirGolu', points: REAL_LAKES_GEO.egirdirGolu.points.map(pt => geoToMap(pt.lon, pt.lat)) },
    { name: 'iznikGolu', points: REAL_LAKES_GEO.iznikGolu.points.map(pt => geoToMap(pt.lon, pt.lat)) },
    { name: 'sapancaGolu', points: REAL_LAKES_GEO.sapancaGolu.points.map(pt => geoToMap(pt.lon, pt.lat)) },
  ];

  constructor() {
    this.initDataMap();
  }

  /**
   * Ray-Casting Algoritması ile Noktanın Çokgen İçinde Olup Olmadığını Kontrol Eder
   */
  public pointInPolygon(px: number, py: number, polygon: Array<{ x: number; y: number }>): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Bir noktanın doğrudan su (deniz, göl veya sınır dışı) olup olmadığını analitik olarak döner
   * (Deniz ve göl kısıtlamaları kaldırılmıştır - Tüm harita düz ve açıktır)
   */
  public isWater(x: number, y: number): boolean {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cx >= DATA_MAP_WIDTH || cy < 0 || cy >= DATA_MAP_HEIGHT) {
      return false; // Harita dışı durumları da serbest
    }
    return false;
  }

  /**
   * Bir noktanın geçerli iskan karası olup olmadığını döner
   */
  public isValidLand(x: number, y: number): boolean {
    return true;
  }

  /**
   * Verilen koordinat için geçerli harita koordinatını döner
   */
  public findNearestValidLand(x: number, y: number): { x: number; y: number } {
    const cx = Math.max(0, Math.min(DATA_MAP_WIDTH - 1, Math.round(x)));
    const cy = Math.max(0, Math.min(DATA_MAP_HEIGHT - 1, Math.round(y)));
    return { x: cx, y: cy };
  }

  /**
   * 1000x500 Gizli Veri Haritasını (Off-screen Canvas) Çizer ve Belleğe Alır
   */
  public initDataMap(): void {
    if (typeof document === 'undefined') return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = DATA_MAP_WIDTH;
    this.canvas.height = DATA_MAP_HEIGHT;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    if (!this.ctx) return;

    // 1. ZEMİN: TÜM HARİTA BAŞLANGIÇTA SU / DIŞ ALAN (SİYAH rgb(0,0,0))
    this.ctx.fillStyle = 'rgb(0, 0, 0)';
    this.ctx.fillRect(0, 0, DATA_MAP_WIDTH, DATA_MAP_HEIGHT);

    // 2. GERÇEK ANADOLU & TRAKYA ANA KARA POLİGONU (TOPRAK TONU rgb(205, 185, 150))
    const coastPts = REAL_TURKEY_COASTLINE_GEO.map(pt => geoToMap(pt.lon, pt.lat));
    if (coastPts.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(coastPts[0].x, coastPts[0].y);
      for (let i = 1; i < coastPts.length; i++) {
        this.ctx.lineTo(coastPts[i].x, coastPts[i].y);
      }
      this.ctx.closePath();
      this.ctx.fillStyle = 'rgb(205, 185, 150)'; // Geçerli İskan Karası
      this.ctx.fill();
    }

    // 3. İÇ GÖLLERİ SİYAH (SU) OLARAK KAZI
    this.ctx.fillStyle = 'rgb(0, 0, 0)';

    // A. Van Gölü
    const vanPts = REAL_LAKES_GEO.vanGolu.points.map(pt => geoToMap(pt.lon, pt.lat));
    if (vanPts.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(vanPts[0].x, vanPts[0].y);
      for (let i = 1; i < vanPts.length; i++) this.ctx.lineTo(vanPts[i].x, vanPts[i].y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // B. Tuz Gölü
    const tuzPts = REAL_LAKES_GEO.tuzGolu.points.map(pt => geoToMap(pt.lon, pt.lat));
    if (tuzPts.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(tuzPts[0].x, tuzPts[0].y);
      for (let i = 1; i < tuzPts.length; i++) this.ctx.lineTo(tuzPts[i].x, tuzPts[i].y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // C. Beyşehir Gölü
    const beyPts = REAL_LAKES_GEO.beysehirGolu.points.map(pt => geoToMap(pt.lon, pt.lat));
    if (beyPts.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(beyPts[0].x, beyPts[0].y);
      for (let i = 1; i < beyPts.length; i++) this.ctx.lineTo(beyPts[i].x, beyPts[i].y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // D. Eğirdir Gölü
    const egiPts = REAL_LAKES_GEO.egirdirGolu.points.map(pt => geoToMap(pt.lon, pt.lat));
    if (egiPts.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(egiPts[0].x, egiPts[0].y);
      for (let i = 1; i < egiPts.length; i++) this.ctx.lineTo(egiPts[i].x, egiPts[i].y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // E. İznik Gölü
    const iznPts = REAL_LAKES_GEO.iznikGolu.points.map(pt => geoToMap(pt.lon, pt.lat));
    if (iznPts.length > 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(iznPts[0].x, iznPts[0].y);
      for (let i = 1; i < iznPts.length; i++) this.ctx.lineTo(iznPts[i].x, iznPts[i].y);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // 4. BEYLİK SANCAK ALANLARI (RENKLİ BÖLGELER)
    // Osmanoğulları (Kırmızı)
    const osmPt = geoToMap(30.15, 40.05);
    this.ctx.fillStyle = 'rgb(220, 38, 38)';
    this.ctx.beginPath();
    this.ctx.ellipse(osmPt.x, osmPt.y, 35, 28, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Karamanoğulları (Lacivert)
    const karPt = geoToMap(32.80, 37.50);
    this.ctx.fillStyle = 'rgb(30, 58, 138)';
    this.ctx.beginPath();
    this.ctx.ellipse(karPt.x, karPt.y, 55, 45, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Aydınoğulları (Yeşil)
    const aydPt = geoToMap(27.60, 38.10);
    this.ctx.fillStyle = 'rgb(4, 120, 87)';
    this.ctx.beginPath();
    this.ctx.ellipse(aydPt.x, aydPt.y, 38, 42, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Candaroğulları (Kehribar)
    const canPt = geoToMap(33.70, 41.60);
    this.ctx.fillStyle = 'rgb(180, 83, 9)';
    this.ctx.beginPath();
    this.ctx.ellipse(canPt.x, canPt.y, 45, 32, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Dulkadiroğulları (Mor)
    const dulPt = geoToMap(37.30, 37.90);
    this.ctx.fillStyle = 'rgb(109, 40, 217)';
    this.ctx.beginPath();
    this.ctx.ellipse(dulPt.x, dulPt.y, 50, 40, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Pikselleri 1 kereye mahsus belleğe al
    this.imageData = this.ctx.getImageData(0, 0, DATA_MAP_WIDTH, DATA_MAP_HEIGHT);
    this.isInitialized = true;
  }

  /**
   * (X, Y) koordinatındaki piksel bilgisini ve biyom türünü döner
   */
  public getPixelInfo(x: number, y: number): PixelBiomeInfo {
    const cx = Math.max(0, Math.min(DATA_MAP_WIDTH - 1, Math.floor(x)));
    const cy = Math.max(0, Math.min(DATA_MAP_HEIGHT - 1, Math.floor(y)));

    const waterGeo = this.isWater(cx, cy);

    if (!this.imageData) {
      if (!this.isInitialized) this.initDataMap();
      if (!this.imageData) {
        return {
          x: cx,
          y: cy,
          isWater: waterGeo,
          isValidLand: !waterGeo,
          factionZone: waterGeo ? 'water' : 'neutral',
          colorHex: waterGeo ? '#000000' : '#cdb996',
          r: waterGeo ? 0 : 205,
          g: waterGeo ? 0 : 185,
          b: waterGeo ? 0 : 150,
          a: 255
        };
      }
    }

    const index = (cy * DATA_MAP_WIDTH + cx) * 4;
    const r = this.imageData.data[index];
    const g = this.imageData.data[index + 1];
    const b = this.imageData.data[index + 2];
    const a = this.imageData.data[index + 3];

    const isWater = false;
    const isValidLand = true;

    let factionZone: FactionId | 'neutral' | 'water' = 'neutral';

    if (r > 180 && g < 70 && b < 70) {
      factionZone = 'osmanogullari'; // Kırmızı
    } else if (r < 60 && g < 90 && b > 110) {
      factionZone = 'karamanogullari'; // Lacivert
    } else if (r < 40 && g > 100 && b < 100) {
      factionZone = 'aydinogullari'; // Yeşil
    } else if (r > 150 && g > 60 && g < 120 && b < 30) {
      factionZone = 'candarogullari'; // Kehribar
    } else if (r > 80 && g < 60 && b > 180) {
      factionZone = 'dulkadirogullari'; // Mor
    }

    const colorHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

    return {
      x: cx,
      y: cy,
      isWater,
      isValidLand,
      factionZone,
      colorHex,
      r, g, b, a
    };
  }

  /**
   * Belirtilen beylik için su olmayan, geçerli bir başlangıç koordinatı bulur
   */
  public findValidSpawnCoordinate(faction: FactionId): { x: number; y: number } {
    const centers: Record<FactionId, { lon: number; lat: number }> = {
      kayi: { lon: 30.15, lat: 40.05 },
      osmanogullari: { lon: 30.15, lat: 40.05 },
      karaman: { lon: 32.80, lat: 37.50 },
      karamanogullari: { lon: 32.80, lat: 37.50 },
      germiyan: { lon: 29.98, lat: 39.42 },
      germiyanogullari: { lon: 29.98, lat: 39.42 },
      aydinogullari: { lon: 27.60, lat: 38.10 },
      candar: { lon: 33.70, lat: 41.60 },
      candarogullari: { lon: 33.70, lat: 41.60 },
      dulkadir: { lon: 37.30, lat: 37.90 },
      dulkadirogullari: { lon: 37.30, lat: 37.90 }
    };

    const coord = centers[faction] || centers.osmanogullari || centers.kayi;
    const target = geoToMap(coord.lon, coord.lat);

    // Merkezin etrafında spiral olarak geçerli kara noktası ara
    for (let radius = 0; radius < 40; radius++) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
        const testX = Math.round(target.x + Math.cos(angle) * radius);
        const testY = Math.round(target.y + Math.sin(angle) * radius);
        const info = this.getPixelInfo(testX, testY);
        if (info.isValidLand) {
          return { x: testX, y: testY };
        }
      }
    }

    return target;
  }
}

export const collisionDataMap = new CollisionDataMapEngine();
