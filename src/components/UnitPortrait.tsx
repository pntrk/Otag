import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UnitType, UnitDefinition } from '../types/game';
import { UNITS, UNIT_IMAGE_MAP, FACTIONS } from '../data/gameData';
import { Shield, Swords, Zap, Clock, Coins, X, ChevronRight, Sparkles } from 'lucide-react';
import { ResourceIcon } from './ResourceIcon';

interface UnitPortraitProps {
  unitId: UnitType | string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  showBadge?: boolean;
  badgeText?: string | number;
  showModalOnClick?: boolean;
  alt?: string;
  onClick?: () => void;
  grayscale?: boolean;
  isInactive?: boolean;
}

// Fallback high-fidelity SVG drawings representing the 10 units
export const UnitFallbackGraphic: React.FC<{ unitId: string; className?: string }> = ({ unitId, className = 'w-full h-full' }) => {
  switch (unitId) {
    case 'akinci':
      // Osmanoğulları Akıncısı (Kırmızı börklü, yalman kılıçlı, akıncı atlısı)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-akinci" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="100%" stopColor="#270a0a" />
            </radialGradient>
            <linearGradient id="gold-sword" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-akinci)" rx="6" />
          <path d="M10 85 Q50 65 90 90 L100 100 L0 100 Z" fill="#451a03" opacity="0.6" />
          {/* Akıncı Börkü */}
          <path d="M42 22 L50 8 L58 22 L62 38 L38 38 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          <rect x="36" y="36" width="28" height="6" rx="2" fill="#e5e5e5" />
          {/* Yüz ve Gövde */}
          <circle cx="50" cy="46" r="10" fill="#fbcfe8" />
          <path d="M42 56 Q50 54 58 56 L68 88 L32 88 Z" fill="#15803d" />
          <path d="M40 60 L60 60 L58 76 L42 76 Z" fill="#334155" />
          {/* Hilal Kılıç */}
          <path d="M65 35 Q85 30 82 55 Q78 45 68 45 Z" fill="url(#gold-sword)" stroke="#78350f" strokeWidth="1" />
          {/* Tuğ & Detay */}
          <line x1="50" y1="8" x2="50" y2="2" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="50" cy="2" r="2.5" fill="#ef4444" />
        </svg>
      );
    case 'karaman_alpi':
      // Karamanoğulları Alpi (Ağır çelik kılıçlı ve kalkanlı Türkmen alpi)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-karaman-alp" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#081028" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-karaman-alp)" rx="6" />
          <path d="M50 12 L64 34 L36 34 Z" fill="#94a3b8" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M36 34 L32 50 L68 50 L64 34 Z" fill="#1e40af" opacity="0.9" />
          <circle cx="50" cy="42" r="8" fill="#fed7aa" />
          <path d="M30 58 L70 58 L66 90 L34 90 Z" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1" />
          <path d="M68 30 Q88 25 82 55 Q78 45 68 45 Z" fill="#f8fafc" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="28" cy="65" r="14" fill="#1e40af" stroke="#f59e0b" strokeWidth="2" />
        </svg>
      );
    case 'gulam':
      // Karaman Gulam Muhafızı (Sivri çelik miğfer, mavi kaftan, ağır çelik gürz ve kalkan)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-gulam" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#081028" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-gulam)" rx="6" />
          {/* Selçuklu sivri miğfer & zırh */}
          <path d="M50 12 L64 34 L36 34 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M36 34 L32 50 L68 50 L64 34 Z" fill="#64748b" opacity="0.8" />
          <circle cx="50" cy="42" r="8" fill="#fed7aa" />
          {/* Mavi İşlemeli Kaftan ve Göğüslük */}
          <path d="M30 58 L70 58 L66 90 L34 90 Z" fill="#1e40af" stroke="#3b82f6" strokeWidth="1" />
          <path d="M42 62 L58 62 L55 82 L45 82 Z" fill="#475569" />
          {/* Ağır Gürz */}
          <line x1="72" y1="35" x2="82" y2="70" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="72" cy="35" r="7" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          {/* Yuvarlak Kalkan */}
          <circle cx="28" cy="65" r="14" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="28" cy="65" r="5" fill="#f59e0b" />
        </svg>
      );
    case 'levent':
      // Aydınoğlu Leventi (Denizci gazisi, sarık, palaska, denizci palası)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-levent" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="100%" stopColor="#082f49" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-levent)" rx="6" />
          {/* Dalga & Güverte */}
          <path d="M0 80 Q25 72 50 80 T100 80 L100 100 L0 100 Z" fill="#0369a1" opacity="0.5" />
          {/* Sarıklı Başlık */}
          <ellipse cx="50" cy="28" rx="14" ry="10" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          <circle cx="50" cy="38" r="9" fill="#fcd34d" />
          {/* Yelek & Şalvar */}
          <path d="M38 52 L62 52 L66 88 L34 88 Z" fill="#b91c1c" />
          <path d="M44 52 L56 52 L54 75 L46 75 Z" fill="#f8fafc" />
          {/* Kırmızı Kuşak */}
          <rect x="36" y="70" width="28" height="6" fill="#f59e0b" />
          {/* Denizci Eğri Palası */}
          <path d="M68 45 Q88 40 85 70 Q75 60 68 55 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
        </svg>
      );
    case 'kure_baltacisi':
      // Candaroğulları Küre Baltacısı (Küre madenleri zırhlısı, dev çift ağızlı balta)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-baltaci" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-baltaci)" rx="6" />
          {/* Madenci Miğferi */}
          <path d="M38 30 Q50 16 62 30 L64 42 L36 42 Z" fill="#78716c" stroke="#d6d3d1" strokeWidth="1.5" />
          <circle cx="50" cy="44" r="8" fill="#fed7aa" />
          {/* Sakal & Zırh */}
          <path d="M44 48 Q50 56 56 48 Z" fill="#44403c" />
          <path d="M30 56 L70 56 L66 90 L34 90 Z" fill="#15803d" />
          <rect x="38" y="60" width="24" height="22" fill="#57534e" stroke="#a8a29e" strokeWidth="1" />
          {/* Dev Çift Ağızlı Balta */}
          <line x1="78" y1="18" x2="68" y2="88" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <path d="M68 22 Q58 14 62 34 Q70 28 78 28 Z" fill="#e2e8f0" stroke="#44403c" strokeWidth="1" />
          <path d="M82 20 Q92 12 88 32 Q80 26 74 26 Z" fill="#e2e8f0" stroke="#44403c" strokeWidth="1" />
        </svg>
      );
    case 'tura':
      // Germiyanoğulları Tura Muhafızı (Ağır yeşil miğferli, aşılmaz çelik zırh ve büyük tura kalkanı)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-tura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14532d" />
              <stop offset="100%" stopColor="#052e16" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-tura)" rx="6" />
          {/* Germiyan Zırh & Miğfer */}
          <path d="M40 20 L50 8 L60 20 L64 36 L36 36 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="50" cy="42" r="8" fill="#fde047" />
          <path d="M32 54 L68 54 L64 90 L36 90 Z" fill="#166534" stroke="#22c55e" strokeWidth="1" />
          {/* Ağır Çelik Tura Kalkanı */}
          <ellipse cx="68" cy="62" rx="16" ry="22" fill="#334155" stroke="#eab308" strokeWidth="2.5" />
          <circle cx="68" cy="62" r="6" fill="#eab308" />
          {/* Ağır Muhafız Mızrağı */}
          <line x1="26" y1="4" x2="36" y2="96" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M26 2 L30 14 L22 14 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
        </svg>
      );
    case 'bozok_suvarisi':
      // Dulkadiroğulları Bozok Atlı Okçusu (Karlı dağlar, gergin yay, börk)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-bozok" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-bozok)" rx="6" />
          {/* Börk & Tüyler */}
          <path d="M40 24 L50 14 L60 24 L64 36 L36 36 Z" fill="#a16207" stroke="#ca8a04" strokeWidth="1.5" />
          <line x1="50" y1="14" x2="52" y2="4" stroke="#fef08a" strokeWidth="2" />
          <circle cx="50" cy="42" r="8" fill="#fde047" />
          {/* Kaftan */}
          <path d="M34 54 L66 54 L62 90 L38 90 Z" fill="#713f12" />
          {/* Gergin Kompozit Yay & Ok */}
          <path d="M72 25 Q90 50 72 75" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
          <line x1="72" y1="25" x2="72" y2="75" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" />
          <line x1="60" y1="50" x2="88" y2="50" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          <polygon points="88,47 94,50 88,53" fill="#ef4444" />
        </svg>
      );
    case 'mizrakli':
      // Mızraklı Muhafız (Uzun mızrak, IYI tamgalı kalkan)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-mizrak" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-mizrak)" rx="6" />
          {/* Miğfer */}
          <path d="M42 24 L50 14 L58 24 L60 38 L40 38 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="50" cy="42" r="8" fill="#fed7aa" />
          {/* Gövde */}
          <path d="M36 54 L64 54 L60 88 L40 88 Z" fill="#166534" />
          <rect x="42" y="58" width="16" height="20" fill="#475569" />
          {/* Uzun Mızrak */}
          <line x1="22" y1="6" x2="22" y2="94" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M22 4 L26 14 L18 14 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          {/* Kalkan ve Kayı Tamgası */}
          <circle cx="70" cy="62" r="16" fill="#78350f" stroke="#e2e8f0" strokeWidth="2" />
          <text x="70" y="66" fill="#fde047" fontSize="11" fontWeight="bold" textAnchor="middle">I Y I</text>
        </svg>
      );
    case 'kilicli':
      // Kılıçlı Piyade (Çelik zırh, yalman kılıç, Kayı kalkanı)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-kilic" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-kilic)" rx="6" />
          {/* Börk */}
          <path d="M38 24 L50 12 L62 24 L64 36 L36 36 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="50" cy="42" r="8" fill="#fcd34d" />
          {/* Lamellar Zırh */}
          <path d="M34 54 L66 54 L62 88 L38 88 Z" fill="#1e293b" />
          <rect x="38" y="58" width="24" height="22" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
          {/* Eğri Yalman Kılıç */}
          <path d="M68 38 Q88 34 84 62 Q75 52 68 48 Z" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5" />
          {/* Kayı Kalkanı */}
          <circle cx="30" cy="65" r="14" fill="#854d0e" stroke="#cbd5e1" strokeWidth="2" />
          <text x="30" y="69" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">I Y I</text>
        </svg>
      );
    case 'hafif_suvari':
      // Hafif Süvari (At üstünde sancaklı süvari)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-suvari" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#164e63" />
              <stop offset="100%" stopColor="#082f49" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-suvari)" rx="6" />
          {/* At silüeti */}
          <path d="M20 75 Q40 55 60 70 Q75 60 85 75 L85 92 L20 92 Z" fill="#78350f" />
          {/* Binici */}
          <circle cx="52" cy="36" r="8" fill="#fed7aa" />
          <path d="M44 26 L52 16 L60 26 Z" fill="#dc2626" />
          <path d="M42 46 L62 46 L60 70 L44 70 Z" fill="#0284c7" />
          {/* Flama / Sancak */}
          <line x1="66" y1="12" x2="66" y2="80" stroke="#fef08a" strokeWidth="2.5" />
          <polygon points="66,14 86,22 66,30" fill="#3b82f6" />
        </svg>
      );
    case 'casus':
      // Casus (Kukuletalı, hançerli, gölge istihbaratçı)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-casus" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-casus)" rx="6" />
          {/* Gece kayalıkları ve hilal */}
          <path d="M10 90 Q40 75 90 95 L100 100 L0 100 Z" fill="#292524" />
          <path d="M80 16 A 8 8 0 0 0 88 28 A 10 10 0 1 1 80 16 Z" fill="#fef08a" />
          {/* Pelerin ve Kukuleta */}
          <path d="M50 20 Q32 26 36 46 Q42 56 50 56 Q58 56 64 46 Q68 26 50 20 Z" fill="#14532d" stroke="#166534" strokeWidth="1.5" />
          {/* Gözler */}
          <ellipse cx="45" cy="40" rx="2.5" ry="1.5" fill="#fef08a" />
          <ellipse cx="55" cy="40" rx="2.5" ry="1.5" fill="#fef08a" />
          {/* Gövde */}
          <path d="M34 56 L66 56 L72 92 L28 92 Z" fill="#0f172a" />
          {/* Parlayan Hançer */}
          <path d="M72 65 L84 50 L81 48 L68 62 Z" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1" />
        </svg>
      );
    case 'kocbasi':
      // Koçbaşı (Ağır kuşatma koçbaşı, demir başlı kütük, ahşap siperlik)
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <radialGradient id="bg-koc" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c0a00" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#bg-koc)" rx="6" />
          {/* Ahşap A-Çerçeve Çatı */}
          <polygon points="50,15 15,65 25,65 50,28 75,65 85,65" fill="#78350f" stroke="#b45309" strokeWidth="1.5" />
          {/* Taşıyıcı Halatlar */}
          <line x1="38" y1="36" x2="32" y2="58" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3,2" />
          <line x1="62" y1="36" x2="68" y2="58" stroke="#ca8a04" strokeWidth="2" strokeDasharray="3,2" />
          {/* Dev Ağaç Kütüğü */}
          <rect x="20" y="56" width="60" height="14" rx="4" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
          {/* Demir Sivri Koç Başı */}
          <path d="M80 54 L96 63 L80 72 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          {/* Tekerlekler */}
          <circle cx="28" cy="80" r="10" fill="#451a03" stroke="#92400e" strokeWidth="2" />
          <circle cx="72" cy="80" r="10" fill="#451a03" stroke="#92400e" strokeWidth="2" />
        </svg>
      );
    default:
      return (
        <div className={`flex items-center justify-center bg-stone-900 border border-stone-800 text-amber-400 ${className}`}>
          <Swords className="w-1/2 h-1/2" />
        </div>
      );
  }
};

export const UnitPortrait: React.FC<UnitPortraitProps> = ({
  unitId,
  className = '',
  size = 'md',
  showBadge = false,
  badgeText,
  showModalOnClick = false,
  alt,
  onClick,
  grayscale = false,
  isInactive = false,
}) => {
  const [imgErrorIndex, setImgErrorIndex] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const unitDef = UNITS[unitId as UnitType];
  const unitName = unitDef?.name || unitId;

  const customImg = unitDef?.image || UNIT_IMAGE_MAP[unitId as UnitType];

  // Possible image paths in order of preference:
  const candidateUrls = [
    ...(customImg ? [customImg] : []),
    `/drawable/${unitId}.webp`,
    `/drawable/alp.webp`,
    `/assets/units/${unitId}.webp`,
    `/${unitId}.webp`,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const currentUrl = candidateUrls[imgErrorIndex];
  const isExhausted = imgErrorIndex >= candidateUrls.length;

  const handleImgError = () => {
    setImgErrorIndex((prev) => prev + 1);
  };

  // Dimensions based on size preset
  const sizeClasses = {
    xs: 'w-8 h-8 rounded',
    sm: 'w-10 h-10 rounded-md',
    md: 'w-14 h-14 rounded-lg',
    lg: 'w-20 h-20 rounded-xl',
    xl: 'w-32 h-32 rounded-2xl',
    custom: '',
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    if (showModalOnClick) {
      e.stopPropagation();
      setModalOpen(true);
    }
  };

  const isDimmed = grayscale || isInactive;

  return (
    <>
      <div
        id={`unit-portrait-${unitId}`}
        onClick={handleClick}
        className={`relative overflow-hidden group cursor-pointer transition-transform duration-200 select-none bg-stone-950 border ${
          isDimmed 
            ? 'border-stone-800 opacity-50 grayscale contrast-75' 
            : 'border-amber-900/40 hover:border-amber-500/80'
        } shadow-md ${sizeClasses} ${className}`}
        title={unitName}
      >
        {!isExhausted ? (
          <img
            src={currentUrl}
            alt={alt || unitName}
            onError={handleImgError}
            loading="lazy"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-contain p-0.5 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.7)] transition-transform duration-300 ${
              isDimmed ? 'filter grayscale opacity-60 blur-[0.3px]' : 'group-hover:scale-110'
            }`}
          />
        ) : (
          <div className={isDimmed ? 'filter grayscale opacity-60' : ''}>
            <UnitFallbackGraphic unitId={unitId} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Subtle Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

        {/* Hover Highlight */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-amber-400/10 pointer-events-none transition-opacity" />

        {/* Badge (Count or special indicator) */}
        {showBadge && (
          <div className="absolute bottom-0 inset-x-0 bg-stone-950/90 border-t border-amber-900/60 py-0.5 text-center">
            <span className="text-[10px] font-mono font-bold text-amber-300 leading-none">
              {badgeText ?? 0}
            </span>
          </div>
        )}
      </div>

      {/* Unit Detail Modal */}
      {modalOpen && unitDef && (
        <UnitDetailModal unitDef={unitDef} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
};

// Unit Detail Modal Component
export const UnitDetailModal: React.FC<{ unitDef: UnitDefinition; onClose: () => void }> = ({ unitDef, onClose }) => {
  const faction = unitDef.factionRequired ? FACTIONS[unitDef.factionRequired] : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
      <div 
        id="unit-detail-modal-card"
        className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-600/60 rounded-2xl shadow-2xl overflow-hidden text-stone-200"
      >
        {/* Header Ribbon */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-b border-amber-600/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {faction?.flagImage ? (
              <div className="w-8 h-6 rounded overflow-hidden border border-amber-500/80 shadow-md bg-black/60 shrink-0">
                <img 
                  src={faction.flagImage} 
                  alt={`${faction.name} Bayrağı`} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <h2 className="text-lg font-bold text-amber-200 font-serif leading-tight flex items-center gap-2">
                <span>{unitDef.name}</span>
                {unitDef.isSpecialUnit && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-mono font-bold">
                    Beylik Özel
                  </span>
                )}
              </h2>
              <span className="text-xs text-stone-400 font-mono capitalize">
                {unitDef.category} Birliği {faction ? `• ${faction.name}` : '• Standart Ordu'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Portrait & Hero Lore Section */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-stone-950 p-4 rounded-xl border border-stone-800">
            <div className="relative w-36 h-36 shrink-0 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg">
              <UnitPortrait unitId={unitDef.id} size="custom" className="w-full h-full" />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 uppercase tracking-wide font-mono">
                {unitDef.buildingRequired.toUpperCase()} • SEVİYE {unitDef.minBuildingLevel}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed font-serif italic">
                "{unitDef.description}"
              </p>
            </div>
          </div>

          {/* Combat & Tactical Attributes Grid - 5 Temel Puan Gücü Sistemi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Swords className="w-4 h-4" /> 5 Temel Puan Gücü (Maksimum 100 Bar)
              </h3>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                unitDef.isSpecialUnit
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/70'
                  : 'bg-stone-800 text-stone-300 border-stone-700'
              }`}>
                {unitDef.isSpecialUnit ? '⭐ Özel Beylik Askeri' : 'Standart Ordu Askeri'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex flex-col">
                <span className="text-stone-400 text-[10px]">Saldırı Gücü</span>
                <span className="text-red-400 font-bold text-base mt-0.5">{unitDef.attackPower} <span className="text-[10px] text-stone-500 font-normal">/100</span></span>
                <div className="mt-1 h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                    style={{ width: `${Math.min(100, Math.max(0, unitDef.attackPower))}%` }}
                  />
                </div>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex flex-col">
                <span className="text-stone-400 text-[10px]">Piyade Savunması</span>
                <span className="text-blue-400 font-bold text-base mt-0.5">{unitDef.defenseInfantry} <span className="text-[10px] text-stone-500 font-normal">/100</span></span>
                <div className="mt-1 h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                    style={{ width: `${Math.min(100, Math.max(0, unitDef.defenseInfantry))}%` }}
                  />
                </div>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex flex-col">
                <span className="text-stone-400 text-[10px]">Süvari Savunması</span>
                <span className="text-cyan-400 font-bold text-base mt-0.5">{unitDef.defenseCavalry} <span className="text-[10px] text-stone-500 font-normal">/100</span></span>
                <div className="mt-1 h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-teal-400"
                    style={{ width: `${Math.min(100, Math.max(0, unitDef.defenseCavalry))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-2">
              <div className="p-2.5 bg-stone-950 rounded-lg border border-amber-900/40 flex flex-col justify-between">
                <div>
                  <span className="text-amber-300 text-[10px] flex items-center gap-1 font-sans font-bold">⚡ Sefer Hızı</span>
                  <span className="text-yellow-400 font-bold text-base mt-0.5 block">{unitDef.speedScore ?? 50} <span className="text-[10px] text-stone-500 font-normal">/100</span></span>
                </div>
                <div className="mt-1">
                  <div className="relative h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-amber-950 p-[1px]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, unitDef.speedScore ?? 50))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-stone-400 font-sans block mt-0.5">({unitDef.speedTilesPerMin} kare/dk)</span>
                </div>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-lg border border-amber-900/40 flex flex-col justify-between">
                <div>
                  <span className="text-yellow-400 text-[10px] flex items-center gap-1 font-sans font-bold">💰 Ganimet Kapasitesi</span>
                  <span className="text-emerald-400 font-bold text-base mt-0.5 block">{unitDef.plunderScore ?? 50} <span className="text-[10px] text-stone-500 font-normal">/100</span></span>
                </div>
                <div className="mt-1">
                  <div className="relative h-1.5 w-full bg-stone-900 rounded-full overflow-hidden border border-amber-950 p-[1px]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-amber-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, unitDef.plunderScore ?? 50))}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-stone-400 font-sans block mt-0.5">({unitDef.lootCapacity} yük/birim)</span>
                </div>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex flex-col">
                <span className="text-stone-400 text-[10px]">Tahıl İaşesi</span>
                <span className="text-amber-400 font-bold text-base mt-0.5">-{unitDef.grainUpkeepPerHour} <span className="text-[10px] text-stone-500 font-normal">/saat</span></span>
                <span className="text-[9px] text-stone-500 font-sans">Garnizon tüketimi</span>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-lg border border-stone-800 flex flex-col">
                <span className="text-stone-400 text-[10px]">Sınıf</span>
                <span className="text-stone-200 font-bold text-xs mt-1 capitalize">{unitDef.category}</span>
                <span className="text-[9px] text-stone-500 font-sans">{unitDef.category === 'suvari' ? 'Atlı Birlik' : unitDef.category === 'kusatma' ? 'Ağır Kuşatma' : 'Piyade Birlik'}</span>
              </div>
            </div>
          </div>

          {/* Resource & Training Cost */}
          <div>
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
              <Coins className="w-4 h-4" /> Birim Başına İkmal & Masraf
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-stone-950 p-3 rounded-lg border border-stone-800">
              <span className="flex items-center gap-1.5 text-amber-300"><ResourceIcon type="wood" size="xs" /> Odun: <strong>{unitDef.cost.wood}</strong></span>
              <span className="text-stone-600">|</span>
              <span className="flex items-center gap-1.5 text-stone-300"><ResourceIcon type="stone" size="xs" /> Taş: <strong>{unitDef.cost.stone}</strong></span>
              <span className="text-stone-600">|</span>
              <span className="flex items-center gap-1.5 text-slate-300"><ResourceIcon type="iron" size="xs" /> Demir: <strong>{unitDef.cost.iron}</strong></span>
              <span className="text-stone-600">|</span>
              <span className="flex items-center gap-1.5 text-yellow-300"><ResourceIcon type="grain" size="xs" /> Tahıl: <strong>{unitDef.cost.grain}</strong></span>
              <span className="text-stone-600">|</span>
              <span className="flex items-center gap-1.5 text-amber-400"><ResourceIcon type="gold" size="xs" /> Altın: <strong>{unitDef.cost.gold}</strong></span>
              <div className="w-full pt-1.5 text-stone-400 text-[11px] border-t border-stone-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Eğitim Süresi: <strong className="text-stone-200">{unitDef.trainingTimeSec} saniye</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold font-mono transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
