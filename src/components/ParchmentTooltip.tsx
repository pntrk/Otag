import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ParchmentTooltipProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
  costs?: Array<{ resource: 'wood' | 'stone' | 'iron' | 'grain' | 'gold' | 'gem'; amount: number | string }>;
  duration?: string | number;
  footer?: string;
  customContent?: ReactNode;
  delayMs?: number;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const ParchmentTooltip: React.FC<ParchmentTooltipProps> = ({
  children,
  title,
  subtitle,
  description,
  stats,
  costs,
  duration,
  footer,
  customContent,
  delayMs = 150,
  className = '',
  style,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 260;
    const tooltipHeight = 160;
    const padding = 12;

    // Yatay konum (Ekran taşması kontrolü)
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Dikey konum (Üstte yer varsa üste, yoksa alta)
    let top = rect.top - tooltipHeight - 10;
    if (top < padding) {
      top = rect.bottom + 10;
    }

    setCoords({ x: left, y: top });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delayMs);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hasContent = Boolean(title || subtitle || description || stats?.length || costs?.length || customContent);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block ${className}`}
      style={style}
    >
      {children}

      {isVisible && hasContent && !disabled && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            zIndex: 99999,
          }}
          className="pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
        >
          {/* Antik Yanık Parşömen Ferman Gövdesi */}
          <div className="relative bg-[#f7eedc] text-[#2a1a0e] border-2 border-[#7c562e] rounded-lg p-3 min-w-[220px] max-w-[280px] shadow-[0_12px_32px_rgba(0,0,0,0.92),inset_0_1px_3px_rgba(255,255,255,0.8)] font-serif select-none before:absolute before:inset-0 before:rounded-lg before:border before:border-[#dfc39a]/60 before:pointer-events-none">
            
            {/* Parşömen Köşe Süsleri */}
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-[#8c6534] border border-[#f5ebd7] shadow-sm" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#8c6534] border border-[#f5ebd7] shadow-sm" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#8c6534] border border-[#f5ebd7] shadow-sm" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-[#8c6534] border border-[#f5ebd7] shadow-sm" />

            {/* Başlık & Kitabe Şeridi */}
            {title && (
              <div className="border-b border-[#bfa075] pb-1.5 mb-1.5 flex items-center justify-between gap-2">
                <span className="font-serif font-black text-xs text-[#8c3b0d] tracking-wide uppercase drop-shadow-sm flex items-center gap-1">
                  📜 {title}
                </span>
                {subtitle && (
                  <span className="text-[10px] font-mono font-bold text-[#b45309] bg-[#ebd8ba] px-1.5 py-0.5 rounded border border-[#caa97d]">
                    {subtitle}
                  </span>
                )}
              </div>
            )}

            {/* Açıklama */}
            {description && (
              <p className="text-[11px] text-[#4a3219] leading-relaxed font-sans mb-1.5">
                {description}
              </p>
            )}

            {/* İstatistikler (Taarruz, Savunma, Üretim vb.) */}
            {stats && stats.length > 0 && (
              <div className="space-y-1 my-1.5 bg-[#ebd8ba]/70 rounded p-1.5 border border-[#cbb08b]">
                {stats.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#684724] font-medium">{s.label}:</span>
                    <span className={`font-mono font-bold ${s.color || 'text-[#1c1108]'}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Özel İçerik Slotu */}
            {customContent}

            {/* Bedel / Kaynak Şeridi */}
            {costs && costs.length > 0 && (
              <div className="mt-2 bg-[#e4d0b0] rounded p-1.5 border border-[#be9f77] flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
                <span className="text-[9px] font-serif uppercase tracking-wider text-[#7c562e] font-black w-full block border-b border-[#be9f77]/50 pb-0.5 mb-0.5">
                  Gereken Kaynaklar:
                </span>
                {costs.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-0.5 text-[#3b2310]">
                    <span>
                      {c.resource === 'wood' && '🌲'}
                      {c.resource === 'stone' && '🪨'}
                      {c.resource === 'iron' && '⛏️'}
                      {c.resource === 'grain' && '🌾'}
                      {c.resource === 'gold' && '🪙'}
                      {c.resource === 'gem' && '💎'}
                    </span>
                    <span>{c.amount}</span>
                  </div>
                ))}
                {duration && (
                  <div className="ml-auto text-[#8c3b0d] font-bold">
                    ⏱️ {duration}
                  </div>
                )}
              </div>
            )}

            {/* Alt Bilgi / Ferman Notu */}
            {footer && (
              <div className="mt-1.5 pt-1 border-t border-[#be9f77]/60 text-[9px] text-[#7a5937] italic text-center">
                {footer}
              </div>
            )}
          </div>
        </div>, document.body
      )}
    </div>
  );
};
