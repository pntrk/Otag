import React, { useState } from 'react';
import { getResourceImage } from '../data/gameData';

export type ResourceIconType = 'wood' | 'stone' | 'iron' | 'grain' | 'gold' | 'horse' | 'gem' | string;

interface ResourceIconProps {
  type: ResourceIconType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  title?: string;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

const FALLBACK_EMOJIS: Record<string, string> = {
  wood: '🌲',
  stone: '🪨',
  iron: '⛏️',
  grain: '🌾',
  gold: '🪙',
  horse: '🐎',
  gem: '💎',
};

const TURKISH_NAMES: Record<string, string> = {
  wood: 'Odun',
  stone: 'Taş',
  iron: 'Demir',
  grain: 'Tahıl',
  gold: 'Altın',
  horse: 'At',
  gem: 'Elmas',
};

export const ResourceIcon: React.FC<ResourceIconProps> = ({
  type,
  size = 'md',
  className = '',
  alt,
  title,
}) => {
  const [hasError, setHasError] = useState(false);
  const normalizedType = type.toLowerCase();
  const rawImgSrc = getResourceImage(normalizedType);

  const resourceName = TURKISH_NAMES[normalizedType] || type;
  const computedAlt = alt || resourceName;
  const computedTitle = title || resourceName;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (hasError) {
    return (
      <span 
        className={`inline-flex items-center justify-center select-none bg-transparent ${sizeClass} ${className}`}
        title={computedTitle}
      >
        <span className="text-base leading-none drop-shadow">
          {FALLBACK_EMOJIS[normalizedType] || '📦'}
        </span>
      </span>
    );
  }

  return (
    <img
      src={rawImgSrc}
      alt={computedAlt}
      title={computedTitle}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
      loading="eager"
      className={`inline-block bg-transparent object-contain select-none shrink-0 ${sizeClass} ${className}`}
    />
  );
};

