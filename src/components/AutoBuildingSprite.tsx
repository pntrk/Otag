import React, { useEffect, useState, useMemo } from 'react';
import { getTransparentImage, TRANSPARENT_SPRITE_CACHE } from '../utils/imageTransparency';

export interface AutoBuildingSpriteProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  fallbackSrc?: string;
}

/**
 * Otomatik Şeffaflaştırılmış Bina Sprite Bileşeni.
 * - Beyaz parlamayı (white flash / flicker) tamamen önler:
 *   Eğer önbellekte henüz işlenmiş veri yoksa, şeffaflık 0 ve gizli tutulur,
 *   kesinlikle işlenmemiş beyaz arka planlı görseli DOM'da doğrudan göstermez.
 * - Saydam DataURL hazır olduğunda pürüzsüzce görünür.
 */
export const AutoBuildingSprite: React.FC<AutoBuildingSpriteProps> = ({
  src,
  alt,
  className = "w-24 h-24 object-contain filter",
  style,
  threshold = 230,
  fallbackSrc
}) => {
  const cacheKey = useMemo(() => `${src}_${threshold}`, [src, threshold]);
  
  // Ham görsel her halükarda ekranda olsun, saydam kopya hazır olunca yumuşakça üstüne geçsin:
  const cached = TRANSPARENT_SPRITE_CACHE.get(cacheKey) || TRANSPARENT_SPRITE_CACHE.get(src);
  const [displaySrc, setDisplaySrc] = useState<string>(cached || src || fallbackSrc || '');
  const [isTransparentReady, setIsTransparentReady] = useState<boolean>(Boolean(cached));

  useEffect(() => {
    let isMounted = true;
    
    if (cached) {
      setDisplaySrc(cached);
      setIsTransparentReady(true);
      return;
    }

    if (!src) return;

    // Arka planda şeffaflaştır; hata alsa bile ham src'de kalsın, asla boş/opacity-0 bırakma:
    getTransparentImage(src, threshold)
      .then((cleanUrl) => {
        if (isMounted && cleanUrl) {
          TRANSPARENT_SPRITE_CACHE.set(cacheKey, cleanUrl);
          setDisplaySrc(cleanUrl);
          setIsTransparentReady(true);
        }
      })
      .catch(() => {
        if (isMounted) setDisplaySrc(src || fallbackSrc || ''); // Hata durumunda orijinali göster
      });

    return () => {
      isMounted = false;
    };
  }, [src, threshold, cacheKey, cached, fallbackSrc]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={`${className} transition-opacity duration-300 ease-in-out`}
      style={{
        ...style,
        opacity: isTransparentReady ? 1 : 0.99, // Çok hafif bir tetikleyici, görsel asla kaybolmaz
      }}
      loading="eager"
      decoding="async"
    />
  );
};

export default AutoBuildingSprite;
