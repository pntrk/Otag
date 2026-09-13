import { useState, useEffect } from 'react';

/**
 * Küresel Saydamlaştırılmış Sprite Önbelleği
 * Modül seviyesinde tutulur, uygulama ömrü boyunca hafızada saklanır.
 */
export const TRANSPARENT_SPRITE_CACHE = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string>>();

/**
 * Beyaz veya beyaza çok yakın arka plan piksellerini saydamlaştırarak PNG DataURL üretir.
 * Alpha thresholding ve soft-feathering uygular.
 */
export async function getTransparentImage(imageSrc: string, threshold = 230): Promise<string> {
  if (!imageSrc) return '';
  const cacheKey = `${imageSrc}_${threshold}`;

  if (TRANSPARENT_SPRITE_CACHE.has(cacheKey)) {
    return TRANSPARENT_SPRITE_CACHE.get(cacheKey)!;
  }

  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey)!;
  }

  const promise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 256;
        canvas.height = img.naturalHeight || img.height || 256;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Piksel taraması: R, G ve B eşik değerin üzerindeyse Alpha'yı 0 yap
        // Yumuşak kenar geçişi (feathering) ile beyaz halo (hale) kalıntısını temizle
        const softThreshold = Math.max(0, threshold - 25);
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a === 0) continue;

          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (r >= threshold && g >= threshold && b >= threshold) {
            d[i + 3] = 0; 
          } else if (r >= softThreshold && g >= softThreshold && b >= softThreshold) {
            const minVal = Math.min(r, g, b);
            const ratio = Math.max(0, Math.min(1, (threshold - minVal) / (threshold - softThreshold)));
            d[i + 3] = Math.round(a * ratio);
          }
        }
        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        TRANSPARENT_SPRITE_CACHE.set(cacheKey, dataUrl);
        // Doğrudan imageSrc anahtarıyla da önbelleğe kaydet
        if (!TRANSPARENT_SPRITE_CACHE.has(imageSrc)) {
          TRANSPARENT_SPRITE_CACHE.set(imageSrc, dataUrl);
        }
        resolve(dataUrl);
      } catch (err) {
        console.warn('Saydamlaştırma hatası (fallback orijinal görsel):', err);
        resolve(imageSrc);
      } finally {
        pendingPromises.delete(cacheKey);
      }
    };
    img.onerror = () => {
      pendingPromises.delete(cacheKey);
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });

  pendingPromises.set(cacheKey, promise);
  return promise;
}

/**
 * Uygulama açılışında tüm kritik bina ve varlık sprite'larını önceden saydamlaştırıp hazırlar.
 */
export const CRITICAL_BUILDING_SPRITES = [
  '/assets/buildings/town_hall.webp',
  '/assets/buildings/barracks.webp',
  '/assets/buildings/stables.webp',
  '/assets/buildings/watchtower.webp',
  '/assets/buildings/market.webp',
  '/assets/buildings/granary.webp',
  '/assets/buildings/field.webp',
  '/assets/buildings/forge.webp',
  '/assets/buildings/wall_t1.webp',
  '/assets/buildings/wall_t2.webp',
  '/assets/buildings/hideout.webp',
  '/drawable/town_hall.webp',
  '/drawable/barracks.webp',
  '/drawable/stables.webp',
  '/drawable/watchtower.webp',
  '/drawable/market.webp',
  '/drawable/field.webp',
  '/drawable/forge.webp',
  '/drawable/hideout.webp',
];

export async function preloadVillageSprites(): Promise<void> {
  if (typeof window === 'undefined') return;
  const promises = CRITICAL_BUILDING_SPRITES.map(src => getTransparentImage(src, 230));
  await Promise.allSettled(promises);
}

// Otomatik başlat: Modül yüklendiği an arka planda ön işleme başlar
if (typeof window !== 'undefined') {
  preloadVillageSprites().catch(() => {});
}

/**
 * React bileşenlerinde saydamlaştırılmış görsel URL'sini kullanmak için Hook
 */
export function useTransparentImage(imageSrc: string, threshold = 230): string {
  const cacheKey = `${imageSrc}_${threshold}`;
  const [src, setSrc] = useState<string>(() => TRANSPARENT_SPRITE_CACHE.get(cacheKey) || TRANSPARENT_SPRITE_CACHE.get(imageSrc) || '');

  useEffect(() => {
    if (!imageSrc) return;

    if (TRANSPARENT_SPRITE_CACHE.has(cacheKey)) {
      setSrc(TRANSPARENT_SPRITE_CACHE.get(cacheKey)!);
      return;
    }
    if (TRANSPARENT_SPRITE_CACHE.has(imageSrc)) {
      setSrc(TRANSPARENT_SPRITE_CACHE.get(imageSrc)!);
      return;
    }

    let isMounted = true;
    getTransparentImage(imageSrc, threshold).then((transparentUrl) => {
      if (isMounted) {
        setSrc(transparentUrl);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [imageSrc, threshold, cacheKey]);

  return src;
}
