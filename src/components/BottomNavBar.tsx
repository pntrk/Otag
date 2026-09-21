import React from 'react';

export type NavTabType = 'village' | 'map' | 'military' | 'market' | 'ranking' | 'reports' | 'simulator' | 'architecture';

interface BottomNavBarProps {
  activeTab: NavTabType;
  onSelectTab: (tab: NavTabType) => void;
  activeMarchesCount?: number;
  unreadReportsCount?: number;
}

interface NavItemConfig {
  id: 'village' | 'map' | 'military' | 'market' | 'ranking' | 'reports';
  title: string;
  label: string;
  imageSrc: string;
  iconFallback: string;
  activeColor: string;
  activeBorder: string;
  activeGlow: string;
  activeTextColor: string;
  badgeCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  activeMarchesCount = 0,
  unreadReportsCount = 0,
}) => {
  const navItems: NavItemConfig[] = [
    {
      id: 'village',
      title: 'Köyüm & Otağ Yerleşimi',
      label: 'OTAĞ',
      imageSrc: '/assets/ui/otag_button.webp',
      iconFallback: '🏛️',
      activeColor: 'from-[#6b4724]/90 via-[#4a2e16]/50 to-transparent',
      activeBorder: 'border-[#f59e0b]',
      activeGlow: 'shadow-[0_0_16px_rgba(245,158,11,0.65)]',
      activeTextColor: 'text-[#fef08a]',
    },
    {
      id: 'map',
      title: 'Anadolu & Dünya Haritası',
      label: 'HARİTA',
      imageSrc: '/assets/ui/map_button.webp',
      iconFallback: '🗺️',
      activeColor: 'from-[#0e4823]/90 via-[#0a2e17]/50 to-transparent',
      activeBorder: 'border-[#10b981]',
      activeGlow: 'shadow-[0_0_16px_rgba(16,185,129,0.65)]',
      activeTextColor: 'text-[#a7f3d0]',
    },
    {
      id: 'military',
      title: 'Ordu Kışlası & Akın Seferleri',
      label: 'ORDU',
      imageSrc: '/assets/ui/military_button.webp',
      iconFallback: '⚔️',
      activeColor: 'from-[#6b1612]/90 via-[#450e0b]/50 to-transparent',
      activeBorder: 'border-[#ef4444]',
      activeGlow: 'shadow-[0_0_16px_rgba(239,68,68,0.65)]',
      activeTextColor: 'text-[#fca5a5]',
      badgeCount: activeMarchesCount,
    },
    {
      id: 'market',
      title: 'Kraliyet Pazarı & At Pazarı',
      label: 'PAZAR',
      imageSrc: '/assets/ui/market_button.webp',
      iconFallback: '🪙',
      activeColor: 'from-[#634211]/90 via-[#3b2707]/50 to-transparent',
      activeBorder: 'border-[#fbbf24]',
      activeGlow: 'shadow-[0_0_16px_rgba(251,191,36,0.65)]',
      activeTextColor: 'text-[#fef08a]',
    },
    {
      id: 'ranking',
      title: 'Liderlik & Kudret Sıralaması',
      label: 'SIRALAMA',
      imageSrc: '/assets/ui/ranking_button.webp',
      iconFallback: '👑',
      activeColor: 'from-[#4a2e0a]/90 via-[#2d1b05]/50 to-transparent',
      activeBorder: 'border-[#ffd700]',
      activeGlow: 'shadow-[0_0_16px_rgba(255,215,0,0.65)]',
      activeTextColor: 'text-[#ffd700]',
    },
    {
      id: 'reports',
      title: 'Fermanlar & Savaş Raporları',
      label: 'FERMAN',
      imageSrc: '/assets/ui/ferman_button.webp',
      iconFallback: '📯',
      activeColor: 'from-[#5c3a0e]/90 via-[#3a2408]/50 to-transparent',
      activeBorder: 'border-[#d97706]',
      activeGlow: 'shadow-[0_0_16px_rgba(217,119,6,0.65)]',
      activeTextColor: 'text-[#fde68a]',
      badgeCount: unreadReportsCount,
    },
  ];

  return (
    <nav 
      id="umaykut-bottom-nav"
      aria-label="Alt Menü Navigasyonu"
      className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-[#0a0705] via-[#170f09] to-[#24170d] border-t-3 border-[#7a552b] shadow-[0_-8px_30px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(255,255,255,0.15)] select-none"
    >
      {/* İki Uçtaki Minyatür Dövme Pirinç Perçinler */}
      <div className="absolute left-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#4a3205] shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-80 pointer-events-none hidden sm:block" />
      <div className="absolute right-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#4a3205] shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-80 pointer-events-none hidden sm:block" />

      <div className="max-w-4xl mx-auto px-1 sm:px-2 flex items-center justify-around h-16 sm:h-18">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              title={item.title}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 px-0.5 sm:px-1 transition-all duration-200 cursor-pointer font-serif group focus:outline-none ${
                isActive
                  ? `bg-gradient-to-t ${item.activeColor} border-t-2 ${item.activeBorder} ${item.activeGlow}`
                  : 'hover:bg-[#2e1d10]/50 text-[#9c8265] hover:text-[#ede3ce]'
              }`}
            >
              {/* Aktif Işık Çizgisi */}
              {isActive && (
                <span className="absolute top-0 inset-x-1 sm:inset-x-2 h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent animate-pulse" />
              )}

              {/* Buton Görseli ve Çerçevesi */}
              <div className="relative flex items-center justify-center">
                <div 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-active:scale-95 bg-[#170e08] border border-[#52371e] text-base sm:text-lg ${
                    isActive 
                      ? 'ring-2 ring-[#ffd700] ring-offset-1 ring-offset-[#170f09] shadow-[0_0_12px_rgba(255,215,0,0.6)]' 
                      : 'opacity-90 group-hover:opacity-100'
                  }`}
                >
                  <img 
                    src={item.imageSrc} 
                    alt={item.label}
                    className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback: render emoji
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `<span>${item.iconFallback}</span>`;
                      }
                    }}
                  />
                </div>

                {/* Rozet / Bildirim Sayacı */}
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span 
                    id={`badge-${item.id}`}
                    className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-gradient-to-br from-[#ef4444] via-[#dc2626] to-[#7f1d1d] border border-[#fca5a5] text-white font-mono font-bold text-[9px] flex items-center justify-center rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.9)] animate-pulse"
                  >
                    {item.badgeCount}
                  </span>
                )}
              </div>

              {/* Menü Etiketi */}
              <span 
                className={`text-[9px] sm:text-[10px] md:text-[11px] mt-0.5 tracking-wider transition-colors duration-150 whitespace-nowrap ${
                  isActive 
                    ? `${item.activeTextColor} drop-shadow-[0_1px_3px_rgba(0,0,0,1)] font-bold` 
                    : 'text-[#9c8265] group-hover:text-[#e8dcbe] font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;

