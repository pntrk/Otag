import React, { useState, useEffect } from 'react';
import { FactionId } from '../types/game';
import { 
  BEYLIK_LIST, 
  BEYLIKLER, 
  BeylikDefinition, 
  FactionKey, 
  normalizeFactionKey 
} from '../types/faction';
import { 
  X, 
  ShieldCheck, 
  Swords, 
  Check, 
  Crown, 
  Shield, 
  Compass, 
  Flame, 
  Sparkles,
  MapPin,
  Scroll,
  TrendingUp,
  Percent,
  Wheat,
  Hammer,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Radar,
  Warehouse,
  Coins,
  Crosshair,
  Feather
} from 'lucide-react';

interface FactionSelectModalProps {
  currentFaction: FactionId;
  onSelectFaction: (factionId: FactionId, playerName?: string) => void;
  onClose: () => void;
  isMandatory?: boolean;
}

// Dövme Demir / Madeni Gravür Çentik Göstergesi (Metal Inlaid Ruler & Blade Notches)
const IronEngravedStat: React.FC<{
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  highlightColor?: string;
}> = ({ label, value, max, icon, highlightColor = 'text-[#ffd700]' }) => {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const totalNotches = 10;
  const activeNotches = Math.round((percent / 100) * totalNotches);

  return (
    <div className="bg-[#110a06] border border-[#3e2716] rounded-xl p-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85)] flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-[#deb887] font-serif font-medium">
          {icon}
          <span className="tracking-wide text-[11px] sm:text-xs">{label}</span>
        </span>
        <span className={`font-mono font-black text-xs sm:text-[13px] ${highlightColor}`}>
          {value} <span className="text-[10px] text-[#785b3e] font-sans font-normal">/ {max}</span>
        </span>
      </div>

      {/* Dövme Demir Cetvel & Madeni Çentikler */}
      <div className="relative h-3 w-full bg-gradient-to-r from-[#1b120a] via-[#2a1b10] to-[#1b120a] rounded-md border border-[#4d321c] p-0.5 shadow-inner flex items-center justify-between gap-1 overflow-hidden">
        {/* Çelik Cetvel Arka Hat */}
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_6px)] pointer-events-none" />
        
        {/* 10 Madeni Kılıç/Kalkan Çentiği */}
        {Array.from({ length: totalNotches }).map((_, i) => {
          const isActive = i < activeNotches;
          return (
            <div
              key={i}
              className={`flex-1 h-full rounded-[2px] transition-all duration-300 border ${
                isActive
                  ? 'bg-gradient-to-b from-[#ffe082] via-[#d4af37] to-[#8c6721] border-[#fff59d] shadow-[0_0_6px_rgba(255,215,0,0.5)]'
                  : 'bg-[#140c06] border-[#29170a]'
              }`}
              title={`${(i + 1) * 10}%`}
            />
          );
        })}
      </div>
    </div>
  );
};

// Beylik Totem Kabartması (Bozkurt, Çift Başlı Kartal, Şahin)
const getBeylikTotem = (key: FactionKey) => {
  switch (key) {
    case 'karaman':
      return {
        name: 'Çift Başlı Kartal',
        sub: 'Selçuklu Saray Kabartması',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-[#ffd700] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" fill="currentColor">
            <path d="M12 2a1 1 0 011 1v1.1c.5.1 1 .3 1.4.6l.8-.8a1 1 0 011.4 1.4l-.8.8c.3.4.5.9.6 1.4h1.1a1 1 0 011 1v.5c0 .3-.1.5-.3.7l-1 1c.5 1.2.8 2.5.8 3.9 0 3-1.6 5.6-4 7l-.5 2.5a1 1 0 01-2 0l-.5-2.5c-2.4-1.4-4-4-4-7 0-1.4.3-2.7.8-3.9l-1-1a1 1 0 01-.3-.7V7a1 1 0 011-1h1.1c.1-.5.3-1 .6-1.4l-.8-.8a1 1 0 011.4-1.4l.8.8c.4-.3.9-.5 1.4-.6V3a1 1 0 011-1zm-2.5 6.5a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        )
      };
    case 'germiyan':
      return {
        name: 'Akdeniz Levent Şahini',
        sub: 'Ege Uç Doğan Tuğrası',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-[#ffd700] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" fill="currentColor">
            <path d="M12 2.5l2 3 3.5-.5-1.5 3.5 4 1-3 2.5 1.5 4-3.5-1.5-2.5 5-2.5-5L6.5 16 8 12 5 9.5l4-1L7.5 5 11 5.5l1-3zm-2 7a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        )
      };
    case 'candar':
      return {
        name: 'Küre Dağları Kurdu',
        sub: 'Kastamonu Kurt Kabartması',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-[#ffd700] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" fill="currentColor">
            <path d="M4 4.5l3.5 2.5 2-3.5 3 4.5 4-2.5L16 11l4 2-2 3.5 2.5 4.5-5.5-1.5L12 22l-3-2.5-5.5 1.5 2.5-4.5L4 13l4-2L7.5 5.5 4 4.5zm5.5 7a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        )
      };
    case 'dulkadir':
      return {
        name: 'Bozok Yırtıcı Kartalı',
        sub: 'Maraş Kartal Kabartması',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-[#ffd700] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" fill="currentColor">
            <path d="M12 2.5l2 3 3.5-.5-1.5 3.5 4 1-3 2.5 1.5 4-3.5-1.5-2.5 5-2.5-5L6.5 16 8 12 5 9.5l4-1L7.5 5 11 5.5l1-3zm-2 7a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        )
      };
    case 'osmanogullari':
    case 'kayi':
    default:
      return {
        name: 'Kayı Bozkurdu',
        sub: 'Kayı Sancağı Kabartması',
        icon: (
          <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 text-[#ffd700] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]" fill="currentColor">
            <path d="M4 4.5l3.5 2.5 2-3.5 3 4.5 4-2.5L16 11l4 2-2 3.5 2.5 4.5-5.5-1.5L12 22l-3-2.5-5.5 1.5 2.5-4.5L4 13l4-2L7.5 5.5 4 4.5zm5.5 7a1 1 0 100 2 1 1 0 000-2zm5 0a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
        )
      };
  }
};

// Beylik Gerçek Stratejik Nitelikleri (Doğum Süresi, Çember Yayılma Sürati, Sığınak Hacmi)
interface BeylikStrategicInfo {
  birthTimeText: string;
  birthBadgeText?: string;
  birthBadgeColor?: string;
  ringSpeedText: string;
  ringBadgeText?: string;
  ringBadgeColor?: string;
  shelterCapacity: number;
  shelterDetailText: string;
  shelterBadgeColor?: string;
}

const getBeylikStrategicData = (key: FactionKey): BeylikStrategicInfo => {
  switch (key) {
    case 'karaman':
      return {
        birthTimeText: '16 dk',
        birthBadgeText: 'Yeşil Mühür (-4 dk)',
        birthBadgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70',
        ringSpeedText: '180 sa',
        shelterCapacity: 500,
        shelterDetailText: 'Taban 500',
      };
    case 'candar':
      return {
        birthTimeText: '20 dk',
        ringSpeedText: '120 sa',
        ringBadgeText: 'Altın Mühür (-60 sa)',
        ringBadgeColor: 'bg-amber-950/90 text-amber-300 border-amber-500/80',
        shelterCapacity: 1300,
        shelterDetailText: '+800 Ek Sığınak',
        shelterBadgeColor: 'bg-amber-950/80 text-amber-300 border-amber-600/70',
      };
    case 'germiyan':
      // Aydınoğulları / Germiyan
      return {
        birthTimeText: '20 dk',
        ringSpeedText: '180 sa',
        shelterCapacity: 350,
        shelterDetailText: 'Hızlı Sefer (-150 Hacim)',
        shelterBadgeColor: 'bg-sky-950/80 text-sky-300 border-sky-500/60',
      };
    case 'dulkadir':
      return {
        birthTimeText: '20 dk',
        ringSpeedText: '180 sa',
        shelterCapacity: 500,
        shelterDetailText: 'Taban 500 (+%20 Zahire İaşe)',
      };
    case 'osmanogullari':
    case 'kayi':
    default:
      return {
        birthTimeText: '20 dk',
        ringSpeedText: '180 sa',
        shelterCapacity: 500,
        shelterDetailText: 'Taban 500 (Dengeli Uç)',
      };
  }
};

// Beylik Muharebe Doktrini Rozet Tanımı (Dengeli, Saldırı Ağırlıklı, Savunma Ağırlıklı)
interface BeylikDoctrineBadge {
  type: 'balanced' | 'attack' | 'defense';
  categoryLabel: 'Dengeli' | 'Saldırı Ağırlıklı' | 'Savunma Ağırlıklı';
  icon: string;
  bonusSummary: string;
  badgeClass: string;
}

const getBeylikDoctrine = (key: FactionKey): BeylikDoctrineBadge => {
  switch (key) {
    case 'karaman':
      return {
        type: 'attack',
        categoryLabel: 'Saldırı Ağırlıklı',
        icon: '⚔️',
        bonusSummary: '+%20 Taarruz Gücü',
        badgeClass: 'bg-gradient-to-r from-[#3d0d0d] via-[#2d0808] to-[#1a0404] text-rose-200 border-[#991b1b] shadow-[0_2px_8px_rgba(153,27,27,0.4)]',
      };
    case 'candar':
      return {
        type: 'attack',
        categoryLabel: 'Saldırı Ağırlıklı',
        icon: '🏹',
        bonusSummary: '+%25 Kuşatma & Sefer',
        badgeClass: 'bg-gradient-to-r from-[#3b1704] via-[#290e02] to-[#170701] text-orange-200 border-[#c2410c] shadow-[0_2px_8px_rgba(194,65,12,0.4)]',
      };
    case 'germiyan':
      return {
        type: 'defense',
        categoryLabel: 'Savunma Ağırlıklı',
        icon: '🛡️',
        bonusSummary: '+%25 Savunma & Sur Direnci',
        badgeClass: 'bg-gradient-to-r from-[#062c18] via-[#031d10] to-[#011109] text-emerald-200 border-[#059669] shadow-[0_2px_8px_rgba(5,150,105,0.4)]',
      };
    case 'dulkadir':
      return {
        type: 'defense',
        categoryLabel: 'Savunma Ağırlıklı',
        icon: '🛡️',
        bonusSummary: '+%20 Savunma & İaşe İndirimi',
        badgeClass: 'bg-gradient-to-r from-[#17133f] via-[#0e0a2b] to-[#08051a] text-indigo-200 border-[#4f46e5] shadow-[0_2px_8px_rgba(79,70,229,0.4)]',
      };
    case 'osmanogullari':
    case 'kayi':
    default:
      return {
        type: 'balanced',
        categoryLabel: 'Dengeli',
        icon: '⚖️',
        bonusSummary: '+%5 Sal / +%5 Sav & +%15 Sürat',
        badgeClass: 'bg-gradient-to-r from-[#361e08] via-[#251404] to-[#170a02] text-amber-200 border-[#d97706] shadow-[0_2px_8px_rgba(217,119,6,0.4)]',
      };
  }
};

// Tematik İkonografik Beylik Doktrinleri (Hız/İntikal, Muharebe, İktisat)
interface ThematicDoctrineBonus {
  type: 'speed' | 'combat' | 'economy';
  title: string;
  value: string;
  detail: string;
  iconName: 'speed' | 'sword' | 'shield' | 'coin' | 'wheat' | 'siege';
}

const getBeylikThematicBonuses = (key: FactionKey): ThematicDoctrineBonus[] => {
  switch (key) {
    case 'osmanogullari':
    case 'kayi':
      return [
        {
          type: 'speed',
          title: 'Sefer Sürati',
          value: '+%15 İntikal',
          detail: 'Hızlı uç akınları & atlı gaza intikali',
          iconName: 'speed',
        },
        {
          type: 'combat',
          title: 'Dengeli Muharebe',
          value: '+%5 Sal / +%5 Sav',
          detail: 'Hem taarruzda hem müdafaada orta ayar',
          iconName: 'sword',
        },
        {
          type: 'economy',
          title: 'Ganimet Hacmi',
          value: '+%20 Akın Payı',
          detail: 'Uç seferlerinde bol ganimet ve yağma',
          iconName: 'coin',
        },
      ];
    case 'karaman':
      return [
        {
          type: 'combat',
          title: 'Çelik Taarruz',
          value: '+%20 Taarruz',
          detail: 'Yalman kılıçlı alplerle ön hat yarma',
          iconName: 'sword',
        },
        {
          type: 'speed',
          title: 'Alp Yetiştirme',
          value: '16 Dk Nüfus',
          detail: 'En hızlı taarruz birliği ikmali',
          iconName: 'speed',
        },
        {
          type: 'combat',
          title: 'Meydan Üstünlüğü',
          value: '-%15 Hat Zayiatı',
          detail: 'Düşman saflarını daha az kayıpla ezme',
          iconName: 'shield',
        },
      ];
    case 'germiyan':
      return [
        {
          type: 'combat',
          title: 'Hisar Müdafaası',
          value: '+%25 Savunma',
          detail: 'Sur ve garnizonda aşılmaz direnç',
          iconName: 'shield',
        },
        {
          type: 'combat',
          title: 'Sur Tahkimatı',
          value: '+%25 Sur Direnci',
          detail: 'Koçbaşı ve taarruzlara karşı kale zırhı',
          iconName: 'shield',
        },
        {
          type: 'economy',
          title: 'Kale İktisadı',
          value: '+%10 Taş İkmali',
          detail: 'Hisar inşasında usta duvarcılar',
          iconName: 'coin',
        },
      ];
    case 'dulkadir':
      return [
        {
          type: 'combat',
          title: 'Yayla Siperi',
          value: '+%20 Müdafaa',
          detail: 'Sarp vadilerde atlı okçu siperi',
          iconName: 'shield',
        },
        {
          type: 'economy',
          title: 'Zahire İaşe Payı',
          value: '+%20 Tahıl Üretimi',
          detail: 'Ambarlarda bol ekin ve un bereketi',
          iconName: 'wheat',
        },
        {
          type: 'speed',
          title: 'Süvari Tasarrufu',
          value: '%25 İaşe İndirimi',
          detail: 'Bozok atlılarında düşük tahıl tüketimi',
          iconName: 'speed',
        },
      ];
    case 'candar':
      return [
        {
          type: 'combat',
          title: 'Ağır Taarruz',
          value: '+%20 Balta Hücumu',
          detail: 'Zırh delici çift ağızlı madenci baltaları',
          iconName: 'sword',
        },
        {
          type: 'combat',
          title: 'Sur Yıkım Gücü',
          value: '+%25 Kuşatma',
          detail: 'Koçbaşı ve mancınıkla sur çökertme',
          iconName: 'siege',
        },
        {
          type: 'economy',
          title: 'Küre Madenleri',
          value: '+%20 Demir & Taş',
          detail: 'Cevher ocaklarında zengin hammadde',
          iconName: 'coin',
        },
      ];
    default:
      return [
        {
          type: 'speed',
          title: 'Sefer Sürati',
          value: '+%15',
          detail: 'Hızlı intikal',
          iconName: 'speed',
        },
        {
          type: 'combat',
          title: 'Taarruz Gücü',
          value: '+%10',
          detail: 'Sancak kuvveti',
          iconName: 'sword',
        },
        {
          type: 'economy',
          title: 'İktisat Hacmi',
          value: '+%15',
          detail: 'Zahire geliri',
          iconName: 'coin',
        },
      ];
  }
};

// Ses Efekti: Tok Ahşap / Ağır Balmumu Mührü Vuruş Sesi (Web Audio API)
const playWaxSealSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // 1. Tok Bas Vuruşu (Ahşap Damga Gövdesi)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(140, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.22);
    gain1.gain.setValueAtTime(0.9, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.26);

    // 2. Çıtırdayan Sıcak Mühür / Ahşap Rezonansı
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(80, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.5, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.22);
  } catch {
    // Ses desteği olmayan ortamlarda sessizce geç
  }
};

export const FactionSelectModal: React.FC<FactionSelectModalProps> = ({
  currentFaction,
  onSelectFaction,
  onClose,
  isMandatory = false,
}) => {
  const initialKey = currentFaction ? normalizeFactionKey(currentFaction) : BEYLIK_LIST[0].id;
  const [selectedKey, setSelectedKey] = useState<FactionKey>(initialKey);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('beylikler_player_name') || 'Alp Arslan';
  });
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const selectedBeylik: BeylikDefinition = BEYLIKLER[selectedKey] || BEYLIK_LIST[0];
  const beylikTotem = getBeylikTotem(selectedKey);
  const beylikStrategic = getBeylikStrategicData(selectedKey);
  const beylikDoctrine = getBeylikDoctrine(selectedKey);
  const thematicBonuses = getBeylikThematicBonuses(selectedKey);
  const isCurrentlyActive = !isMandatory && Boolean(currentFaction) && normalizeFactionKey(currentFaction) === selectedKey;

  const currentIndex = BEYLIK_LIST.findIndex(b => b.id === selectedKey);
  const handlePrevBeylik = () => {
    const nextIdx = (currentIndex - 1 + BEYLIK_LIST.length) % BEYLIK_LIST.length;
    setSelectedKey(BEYLIK_LIST[nextIdx].id);
  };
  const handleNextBeylik = () => {
    const nextIdx = (currentIndex + 1) % BEYLIK_LIST.length;
    setSelectedKey(BEYLIK_LIST[nextIdx].id);
  };

  // Klavye ok tuşları ile beylik geçişi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevBeylik();
      } else if (e.key === 'ArrowRight') {
        handleNextBeylik();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleConfirmChoice = () => {
    const finalName = playerName.trim() || 'Alp Arslan';
    localStorage.setItem('beylikler_player_name', finalName);

    // Mühür sesi çal ve ekrana taktil sarsıntı ver
    playWaxSealSound();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);

    if (isMandatory && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    // Sarsıntı ve ses etkisinden sonra hafif gecikmeyle geçiş sağla
    setTimeout(() => {
      onSelectFaction(selectedKey, finalName);
    }, 250);
  };

  return (
    <div 
      id="faction-select-modal-overlay"
      className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center sm:p-4 animate-fadeIn"
    >
      {/* Modal Çerçevesi (13. Yüzyıl Selçuklu & Beylikler Ahşap-Altın Sandığı + Ekran Sarsıntısı) */}
      <div 
        id="faction-select-modal-container"
        className={`relative w-full h-full sm:h-auto max-w-5xl bg-[#140e08] sm:border-2 border-[#b8860b]/90 sm:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95),inset_0_1px_4px_rgba(255,215,0,0.4)] overflow-hidden flex flex-col max-h-[100dvh] sm:max-h-[calc(100dvh-2.5rem)] transition-transform ${
          isShaking ? 'animate-screen-shake' : ''
        }`}
      >
        {/* Üst Başlık Barı (Pirinç Kabartma Çerçeve & Selçuklu Hakan Otağı) */}
        <div 
          id="faction-modal-header"
          className="shrink-0 relative bg-gradient-to-r from-[#201004] via-[#3a200b] to-[#201004] border-b border-[#b8860b]/60 px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-md pt-[max(env(safe-area-inset-top),0.5rem)] sm:pt-2.5"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-b from-[#ffd700] via-[#e5a93b] to-[#996515] p-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.7)] flex items-center justify-center shrink-0 border border-[#fff2a8]">
              <Crown className="w-4 h-4 text-[#241306] drop-shadow-sm" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-serif font-black tracking-wider text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                {isMandatory ? 'BEYLİĞİNİ SEÇ VE AND İÇ' : '13. YÜZYIL ANADOLU BEYLİKLERİ VE SANCAK TAYİNİ'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[#deb887] font-serif line-clamp-1 sm:line-clamp-none font-medium">
                Sancak askısından beyliğinizi seçin; elit biriminizi ve kalıcı beylik hasletlerinizi fetih sahasına sürün.
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              id="close-faction-modal-btn"
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#241306] hover:bg-[#5c1a1a] border border-[#b8860b]/70 text-[#ffd700] hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-inner shrink-0 ml-2 cursor-pointer"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Yatay "Sancak Askısı" (Tarihsel Ahşap Kiriş, Pirinç Askı Halkaları, Püsküllü Minyatür Kalkan & Sancaklar) */}
        <div 
          id="faction-compact-nav"
          className="shrink-0 relative bg-gradient-to-b from-[#180e06] via-[#100904] to-[#0a0502] border-b-2 border-[#b8860b]/70 pt-2.5 pb-3 px-3 sm:px-6 shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
        >
          {/* Ahşap Kiriş ve Askı Çubuğu (Wood Beam & Brass Hanging Rod) */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#2c1708] via-[#4d2c12] to-[#2c1708] border-b border-[#ffd700]/30 shadow-inner flex items-center justify-between px-6 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[#ffd700]/70 shadow-[0_0_4px_#ffd700]" />
            <span className="w-2 h-2 rounded-full bg-[#ffd700]/70 shadow-[0_0_4px_#ffd700]" />
          </div>

          <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto pt-1">
            <button
              onClick={handlePrevBeylik}
              className="p-1.5 sm:p-2 rounded-xl bg-[#221307] hover:bg-[#38200c] border border-[#6b4c27] hover:border-[#ffd700] text-[#deb887] hover:text-[#ffd700] transition-all active:scale-95 cursor-pointer shrink-0 shadow-md group"
              title="Önceki Sancak (←)"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* 5 Beyliğin Püsküllü ve İşlemeli Minyatür Kalkan / Sancak Askısı */}
            <div className="flex-1 flex items-start justify-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto py-1 px-1 custom-scrollbar">
              {BEYLIK_LIST.map((beylik) => {
                const isSelected = beylik.id === selectedKey;

                return (
                  <div 
                    key={beylik.id} 
                    className="flex flex-col items-center shrink-0 group cursor-pointer"
                    onClick={() => setSelectedKey(beylik.id)}
                  >
                    {/* Pirinç Askı İpi / Halkası */}
                    <div className="flex flex-col items-center">
                      <div className={`w-1.5 h-1.5 rounded-full border transition-colors duration-300 ${
                        isSelected 
                          ? 'bg-[#ffd700] border-[#fff59d] shadow-[0_0_6px_#ffd700]' 
                          : 'bg-[#5c4026] border-[#3a2716] group-hover:bg-[#a87d40]'
                      }`} />
                      <div className={`w-[2px] h-2.5 sm:h-3 transition-colors duration-300 ${
                        isSelected 
                          ? 'bg-gradient-to-b from-[#ffd700] to-[#d97706]' 
                          : 'bg-gradient-to-b from-[#5c4026] to-[#3a2716] group-hover:from-[#8c6721] group-hover:to-[#5c4026]'
                      }`} />
                    </div>

                    {/* Sancak & Kalkan Gövdesi */}
                    <button
                      type="button"
                      className={`relative flex flex-col items-center transition-all duration-300 transform rounded-b-2xl overflow-visible text-left cursor-pointer ${
                        isSelected
                          ? 'scale-110 -translate-y-0.5 z-20 drop-shadow-[0_0_18px_rgba(255,215,0,0.65)]'
                          : 'scale-95 opacity-75 hover:opacity-100 hover:scale-100 z-10 brightness-[0.8] hover:brightness-100 drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]'
                      }`}
                    >
                      {/* Sancak Bayrağı */}
                      <div className={`relative w-16 sm:w-20 md:w-24 h-11 sm:h-13 rounded-t-lg rounded-b-sm border-2 overflow-hidden transition-all duration-300 bg-black/80 ${
                        isSelected
                          ? 'border-[#ffd700] ring-2 ring-[#ffd700]/50 shadow-[inset_0_0_10px_rgba(255,215,0,0.3)]'
                          : 'border-[#5a3e20] group-hover:border-[#ffd700]/60'
                      }`}>
                        <img 
                          src={beylik.flagImage} 
                          alt={`${beylik.name} Sancağı`}
                          className="w-full h-full object-cover filter contrast-110"
                          referrerPolicy="no-referrer"
                        />
                        {/* Seçili Olmayanlar için Ahşap Gölgesi Kaplaması */}
                        {!isSelected && (
                          <div className="absolute inset-0 bg-[#120803]/40 backdrop-brightness-90 pointer-events-none transition-opacity duration-300 group-hover:opacity-10" />
                        )}
                        {/* Seçili Altın Işık Hüzmesi */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-t from-[#ffd700]/25 via-transparent to-transparent pointer-events-none animate-pulse" />
                        )}
                      </div>

                      {/* Alt Püsküller (Tassels) & Beylik Kısa İsmi */}
                      <div className="flex flex-col items-center w-full mt-0.5">
                        {/* 3'lü Selçuklu Altın Püskülü */}
                        <div className="flex items-start justify-center gap-1 sm:gap-1.5">
                          <span className={`w-1 h-2 sm:h-2.5 rounded-b-full transition-colors duration-300 ${
                            isSelected ? 'bg-[#ffd700] shadow-[0_2px_4px_rgba(255,215,0,0.5)]' : 'bg-[#785429]'
                          }`} />
                          <span className={`w-1.5 h-3 sm:h-3.5 rounded-b-full transition-colors duration-300 ${
                            isSelected ? 'bg-gradient-to-b from-[#ffd700] to-[#d97706] shadow-[0_2px_5px_rgba(255,215,0,0.7)]' : 'bg-[#8c6721]'
                          }`} />
                          <span className={`w-1 h-2 sm:h-2.5 rounded-b-full transition-colors duration-300 ${
                            isSelected ? 'bg-[#ffd700] shadow-[0_2px_4px_rgba(255,215,0,0.5)]' : 'bg-[#785429]'
                          }`} />
                        </div>

                        {/* Sancak İsmi Etiketi */}
                        <span className={`mt-0.5 text-[10px] sm:text-xs font-serif font-black tracking-wide text-center truncate max-w-[70px] sm:max-w-[90px] transition-colors duration-300 ${
                          isSelected
                            ? 'text-[#ffd700] drop-shadow-[0_1px_3px_rgba(0,0,0,1)] scale-105'
                            : 'text-[#a89078] group-hover:text-[#deb887]'
                        }`}>
                          {beylik.shortName}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleNextBeylik}
              className="p-1.5 sm:p-2 rounded-xl bg-[#221307] hover:bg-[#38200c] border border-[#6b4c27] hover:border-[#ffd700] text-[#deb887] hover:text-[#ffd700] transition-all active:scale-95 cursor-pointer shrink-0 shadow-md group"
              title="Sonraki Sancak (→)"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Seçili Beylik Detay Alanı - Dengeli Dağılım (5/12 Sol Birim - 7/12 Sağ Beylik & Ferman) */}
        <div 
          id="faction-detail-content"
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 bg-[#0a0603] custom-scrollbar"
        >
          {/* Sol Kolon: TEK PARÇA MASİF DERİ/AHŞAP ZIRH LEVHASI (Pirinç Perçinli & Gömülü Portre) */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#24160a] via-[#1a0e06] to-[#120803] border-2 border-[#7c5225] shadow-[0_12px_35px_rgba(0,0,0,0.9),inset_0_2px_6px_rgba(255,215,0,0.25)] flex flex-col p-3 sm:p-3.5 gap-3.5 h-full justify-between">
              {/* Masif Levha Köşe Pirinç Perçinleri */}
              <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#784d16] border border-[#ffecb3] shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#784d16] border border-[#ffecb3] shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#784d16] border border-[#ffecb3] shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#ffd700] to-[#784d16] border border-[#ffecb3] shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none" />

              {/* Levha Başlığı (Oyma Deri / Ahşap Damgası) */}
              <div className="border-b border-[#4d3219] pb-2 px-1">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-widest text-[#c49a6c] font-serif font-bold">
                  Sancak Özel Birliği
                </div>
                <div className="text-base sm:text-lg font-serif font-black text-[#ffd700] tracking-wide drop-shadow-sm">
                  {selectedBeylik.unit.name}
                </div>
              </div>

              {/* Masif Levhaya GÖMÜLÜ Askerî Portre (Derin Inset Shadow & Eskitilmiş Oyma Çerçeve) */}
              <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96 rounded-xl overflow-hidden bg-[#0a0502] shadow-[inset_0_8px_24px_rgba(0,0,0,0.95),0_4px_16px_rgba(0,0,0,0.8)] border-2 border-[#5c3e20] group">
                <img 
                  src={selectedBeylik.unit.image} 
                  alt={selectedBeylik.unit.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105 filter contrast-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Gömme Derinlik Gölgeleri */}
                <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.92)] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100904]/95 via-transparent to-black/30 pointer-events-none" />

                {/* Birim Unvanı Pirinç Plaketi - Sadece Kısa ve Öz Asker Adı */}
                <div className="absolute bottom-3 left-4 right-4 bg-gradient-to-r from-[#1a0f06]/95 via-[#2b180a]/95 to-[#1a0f06]/95 backdrop-blur-md border border-[#c49a45]/80 rounded-lg py-2 px-3 text-center shadow-[0_4px_14px_rgba(0,0,0,0.85)]">
                  <div className="text-sm sm:text-base font-serif font-black text-[#ffd700] tracking-widest uppercase drop-shadow">
                    {selectedBeylik.unit.name}
                  </div>
                </div>
              </div>

              {/* Askerî İstatistikler & Dövme Demir Cetveller (5 Temel Puan Gücü - Maks 100 Bar) */}
              <div className="space-y-2.5 px-1 pt-0.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <IronEngravedStat 
                    label="Saldırı Gücü" 
                    value={selectedBeylik.unit.baseAttack} 
                    max={100} 
                    icon={<Swords className="w-3.5 h-3.5 text-red-400" />} 
                    highlightColor="text-red-300"
                  />
                  <IronEngravedStat 
                    label="Piyade Savunması" 
                    value={selectedBeylik.unit.baseDefenseInfantry} 
                    max={100} 
                    icon={<Shield className="w-3.5 h-3.5 text-sky-400" />} 
                    highlightColor="text-sky-300"
                  />
                  <IronEngravedStat 
                    label="Süvari Savunması" 
                    value={selectedBeylik.unit.baseDefenseCavalry} 
                    max={100} 
                    icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />} 
                    highlightColor="text-emerald-300"
                  />
                  <IronEngravedStat 
                    label="Sefer Hızı" 
                    value={selectedBeylik.unit.speedScore || 50} 
                    max={100} 
                    icon={<Zap className="w-3.5 h-3.5 text-yellow-400" />} 
                    highlightColor="text-yellow-300"
                  />
                </div>

                {/* 5. Unsur: Ganimet Kapasitesi */}
                <div className="pt-1 border-t border-[#3a2512]">
                  <IronEngravedStat 
                    label="Ganimet Kapasitesi" 
                    value={selectedBeylik.unit.plunderScore || 50} 
                    max={100} 
                    icon={<TrendingUp className="w-3.5 h-3.5 text-amber-400" />} 
                    highlightColor="text-amber-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: FİLDİŞİ / YANIK KENARLI HARP FERMANI PARŞÖMENİ */}
          <div className="lg:col-span-7 flex flex-col gap-4 h-full">
            {/* Hükümdar Mahlası & Sezonluk Hakan Adı Seçimi */}
            <div 
              id="faction-hakan-name-card"
              className="shrink-0 relative p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#221206] via-[#190d04] to-[#221206] border border-[#8c6721]/80 shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2.5 shrink-0 px-1">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#f3c360] via-[#c99132] to-[#784d12] flex items-center justify-center shadow text-[#1c0f05] shrink-0 font-bold">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-xs sm:text-sm text-amber-200 tracking-wide leading-tight">
                    Hakan Mahlası
                  </h4>
                  <span className="text-[10.5px] text-[#a88a64] font-serif block">
                    Sezonluk Hükümdar Adı
                  </span>
                </div>
              </div>

              <div className="flex-1 relative flex items-center bg-[#fbf6ec] border border-[#a67c33] rounded-lg px-3 py-1.5 shadow-[inset_0_1px_4px_rgba(60,30,10,0.18)] focus-within:border-[#ffd700] focus-within:ring-2 focus-within:ring-[#ffd700]/50 transition-all">
                <span className="text-amber-950/70 mr-2 shrink-0 text-sm select-none" title="Hattat Diviti">
                  ✒️
                </span>
                <input
                  type="text"
                  value={playerName}
                  maxLength={24}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Hakanınızın adını girin (Örn: Alp Arslan)"
                  className="w-full bg-transparent font-serif font-black text-sm sm:text-base text-[#241306] placeholder:text-[#8f755a] placeholder:font-normal placeholder:italic outline-none tracking-wide selection:bg-[#a67c33] selection:text-white"
                />
                {playerName.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPlayerName('')}
                    className="text-stone-400 hover:text-stone-700 p-0.5 text-xs transition cursor-pointer"
                    title="Temizle"
                  >
                    ✕
                  </button>
                )}
                <span className="ml-2 font-mono text-[10px] text-stone-400 shrink-0 select-none">
                  {playerName.length}/24
                </span>
              </div>
            </div>

            {/* FİLDİŞİ VE YANIK KENARLI HARP FERMANI PARŞÖMENİ (Bütünleşik Tarihçe, Stratejik Parametreler ve Kalıcı Ferman Bonusları) */}
            <div className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-b from-[#f3e7cb] via-[#fbf5e7] to-[#edd6ae] text-[#241306] shadow-[0_12px_35px_rgba(0,0,0,0.85),inset_0_0_25px_rgba(140,90,30,0.45)] border-4 border-[#8c5e28] overflow-hidden flex flex-col justify-between flex-1 h-full gap-3.5">
              {/* Yanık Parşömen Kenar Kararmaları */}
              <div className="absolute inset-0 border-[6px] border-[#422108]/30 pointer-events-none rounded-2xl" />
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#422108]/25 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#422108]/35 to-transparent pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-[#422108]/25 to-transparent pointer-events-none" />
              <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-[#422108]/25 to-transparent pointer-events-none" />

              {/* Ferman Başlığı */}
              <div className="relative flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#8c6721]/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden border-2 border-[#8c5e28] shadow-md bg-black/40 shrink-0">
                    <img 
                      src={selectedBeylik.flagImage} 
                      alt={`${selectedBeylik.name} Sancak Bayrağı`}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-serif font-black text-[#2f1807] tracking-wide">
                        {selectedBeylik.name} Beyliği
                      </h3>
                      <span className="text-base sm:text-lg">{selectedBeylik.crestIcon}</span>
                    </div>
                    <p className="text-xs text-[#734a21] font-serif font-bold italic">
                      Ferman-ı Âli: {selectedBeylik.title}
                    </p>
                  </div>
                </div>

                {/* Sancak Muharebe Doktrini Rozeti (Kaymasız, Tek Satır & Tematik Rozet) */}
                <div className="shrink-0 flex items-center">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-serif font-bold whitespace-nowrap shadow-sm ${beylikDoctrine.badgeClass}`}>
                    <span className="text-sm select-none">{beylikDoctrine.icon}</span>
                    <span className="font-black tracking-wide">{beylikDoctrine.categoryLabel}</span>
                    <span className="text-[10.5px] opacity-85 font-mono tracking-tight hidden sm:inline">
                      ({beylikDoctrine.bonusSummary})
                    </span>
                  </div>
                </div>
              </div>

              {/* Beylik İdare & Hüküm Parametreleri (Sağ Panel Sembolik Gösterim) */}
              <div className="relative bg-[#ebd9b5]/90 border border-[#b89565] rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-serif font-black tracking-wider uppercase text-[#523010] flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span>Beyliğe Özel İdare & Sefer Parametreleri</span>
                  </span>
                  <span className="text-[9px] font-serif text-[#784d16] font-bold">Nizamî Beylik Değerleri</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* 1. Doğum Süresi */}
                  <div className="bg-[#fbf4e6] border border-[#c4a47c] p-2 rounded-lg flex items-center gap-2.5 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d97706] to-[#78350f] text-amber-100 flex items-center justify-center shrink-0 shadow-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-serif font-bold text-[#69421d] uppercase">
                        Doğum Süresi
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-mono font-black text-[#781f1f]">
                          {beylikStrategic.birthTimeText}
                        </span>
                        {beylikStrategic.birthBadgeText && (
                          <span className="text-[8px] font-serif font-black px-1 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-400">
                            Hızlı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Çember Yayılma Sürati */}
                  <div className="bg-[#fbf4e6] border border-[#c4a47c] p-2 rounded-lg flex items-center gap-2.5 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0c4a6e] text-sky-100 flex items-center justify-center shrink-0 shadow-sm">
                      <Radar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-serif font-bold text-[#69421d] uppercase">
                        Çember Yayılma
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-mono font-black text-[#781f1f]">
                          {beylikStrategic.ringSpeedText}
                        </span>
                        {beylikStrategic.ringBadgeText && (
                          <span className="text-[8px] font-serif font-black px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-400">
                            Atik
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Sığınak Hacmi */}
                  <div className="bg-[#fbf4e6] border border-[#c4a47c] p-2 rounded-lg flex items-center gap-2.5 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#16a34a] to-[#14532d] text-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                      <Warehouse className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-serif font-bold text-[#69421d] uppercase">
                        Sığınak Hacmi
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-mono font-black text-[#781f1f]">
                          {beylikStrategic.shelterCapacity}
                        </span>
                        <span className="text-[8.5px] font-serif text-[#664d36] font-medium truncate">
                          {beylikStrategic.shelterCapacity > 500 ? '+800 Ek' : beylikStrategic.shelterCapacity < 500 ? 'Akıncı' : 'Taban'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divan Kâtibi İtalik Mürekkepli Tarihçe Metni */}
              <div className="relative px-1.5 py-1 rounded-xl bg-[#ede0c2]/60 border border-[#c4a47c]/50">
                <div className="text-[11px] uppercase font-serif font-black tracking-widest text-[#7a4c1f] mb-1.5 flex items-center gap-1.5">
                  <span className="text-xs">📜</span>
                  <span>Tarihî Divan Kaydı & Soyağacı</span>
                </div>
                <p className="text-sm sm:text-[14.5px] font-serif italic leading-relaxed text-[#261508] font-medium selection:bg-[#c99f63] selection:text-[#231205]">
                  "{selectedBeylik.description}"
                </p>
              </div>

              {/* Ferman Kalıcı Beylik Bonusları (İkonografik Beylik Doktrinleri) */}
              <div className="relative pt-3 border-t-2 border-[#8c6721]/40">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#8c5e28] text-[#fef9c3] flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                      📜
                    </div>
                    <span className="text-xs sm:text-sm font-serif font-black tracking-wide uppercase text-[#381e0a] truncate">
                      Kalıcı Hükümdarlık Fermanı
                    </span>
                  </div>
                  <span className="text-[10.5px] font-serif font-bold text-[#7a4c1f] italic">
                    3 Temel Beylik Doktrini
                  </span>
                </div>

                {/* 3'lü Tematik İkonografik Doktrin Kartları */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {thematicBonuses.map((doctrine, idx) => {
                    // Tematik Mini Amblem Seçimi (Hız/İntikal, Muharebe, İktisat)
                    let emblemIcon: React.ReactNode;
                    let emblemBg: string;
                    let emblemBorder: string;
                    let badgeColor: string;

                    switch (doctrine.iconName) {
                      case 'speed':
                        // Hız / İntikal: Nal / Rüzgarlı Yay sembolizmi
                        emblemIcon = <Zap className="w-4 h-4 text-amber-950" />;
                        emblemBg = 'bg-gradient-to-br from-[#fde047] to-[#d97706]';
                        emblemBorder = 'border-[#b45309]';
                        badgeColor = 'text-[#713f12] bg-[#fef08a]/60 border-[#ca8a04]/50';
                        break;
                      case 'sword':
                        // Muharebe: Eğri Türkmen Kılıcı
                        emblemIcon = <Swords className="w-4 h-4 text-red-950" />;
                        emblemBg = 'bg-gradient-to-br from-[#f87171] to-[#b91c1c]';
                        emblemBorder = 'border-[#7f1d1d]';
                        badgeColor = 'text-[#7f1d1d] bg-[#fecaca]/60 border-[#f87171]/60';
                        break;
                      case 'shield':
                        // Muharebe: Çelik Zırh Plakası / Kalkan
                        emblemIcon = <ShieldCheck className="w-4 h-4 text-blue-950" />;
                        emblemBg = 'bg-gradient-to-br from-[#60a5fa] to-[#1d4ed8]';
                        emblemBorder = 'border-[#1e3a8a]';
                        badgeColor = 'text-[#1e3a8a] bg-[#dbeafe]/60 border-[#60a5fa]/60';
                        break;
                      case 'wheat':
                        // İktisat: Buğday Başağı / Zahire
                        emblemIcon = <Wheat className="w-4 h-4 text-emerald-950" />;
                        emblemBg = 'bg-gradient-to-br from-[#86efac] to-[#15803d]';
                        emblemBorder = 'border-[#14532d]';
                        badgeColor = 'text-[#14532d] bg-[#dcfce7]/60 border-[#86efac]/60';
                        break;
                      case 'siege':
                        // Kuşatma: Sur Kıran Koçbaşı / Mancınık
                        emblemIcon = <Crosshair className="w-4 h-4 text-orange-950" />;
                        emblemBg = 'bg-gradient-to-br from-[#fdba74] to-[#c2410c]';
                        emblemBorder = 'border-[#7c2d12]';
                        badgeColor = 'text-[#7c2d12] bg-[#ffedd5]/60 border-[#fb923c]/60';
                        break;
                      case 'coin':
                      default:
                        // İktisat: Madeni Sikke / Ganimet Kesesi
                        emblemIcon = <Coins className="w-4 h-4 text-amber-950" />;
                        emblemBg = 'bg-gradient-to-br from-[#fef08a] to-[#eab308]';
                        emblemBorder = 'border-[#a16207]';
                        badgeColor = 'text-[#854d0e] bg-[#fef9c3]/70 border-[#eab308]/60';
                        break;
                    }

                    return (
                      <div 
                        key={idx}
                        className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-b from-[#f7ecd5] to-[#ebd3a8] border border-[#b89565] shadow-sm flex flex-col justify-between hover:border-[#8c5e28] transition-all min-h-[98px]"
                      >
                        {/* Üst Kısım: Amblem + Doktrin Başlığı */}
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className={`w-6 h-6 rounded-md ${emblemBg} border ${emblemBorder} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                            {emblemIcon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10.5px] uppercase font-serif font-black tracking-wide text-[#633f1b] block truncate leading-tight">
                              {doctrine.title}
                            </span>
                            <span className="text-xs sm:text-[13px] font-mono font-black text-[#8b1818] block leading-tight tracking-tight mt-0.5 break-words">
                              {doctrine.value}
                            </span>
                          </div>
                        </div>

                        {/* Alt Kısım: Kısa ve Net Açıklama */}
                        <div className="pt-1.5 border-t border-[#cbb38d]/70 mt-auto">
                          <p className="text-[11px] sm:text-[11.5px] font-serif font-medium italic text-[#382312] leading-snug">
                            {doctrine.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alt Aksiyon & Onay Barı */}
        <div 
          id="faction-modal-footer"
          className="shrink-0 bg-gradient-to-r from-[#191007] via-[#2a1a0c] to-[#191007] border-t-2 border-[#b8860b]/70 p-3.5 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 shadow-2xl pb-[max(env(safe-area-inset-bottom),0.85rem)] sm:pb-3.5"
        >
          {showConfirm ? (
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-red-950/50 p-3 sm:p-3 rounded-xl border border-red-800 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                <AlertTriangle className="w-8 h-8 sm:w-7 sm:h-7 text-red-500 animate-pulse shrink-0" />
                <div>
                  <h4 className="text-red-400 font-serif font-black text-sm sm:text-base mb-0.5">Son Kararınız Mı?</h4>
                  <p className="text-red-200/90 text-xs sm:text-[13px] font-sans">
                    Dikkat: Seçtiğin beylik sancağı kaderini belirler ve bir daha <strong className="text-red-300 font-bold">asla değiştirilemez!</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 justify-center sm:justify-end mt-2 sm:mt-0 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 hover:text-white font-serif text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChoice}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#7f1d1d] hover:from-[#991b1b] hover:to-[#991b1b] text-[#fef2f2] font-serif font-black text-xs sm:text-sm shadow-[0_4px_20px_rgba(185,28,28,0.6),inset_0_1px_3px_rgba(255,215,0,0.4)] transition-all active:scale-95 cursor-pointer border-2 border-[#ffd700] flex items-center gap-2 whitespace-nowrap"
                >
                  <span className="w-4 h-4 rounded-full bg-[#450a0a] border border-[#f87171] flex items-center justify-center text-[10px] shrink-0">
                    🔥
                  </span>
                  <span>And İç ve Sancağı Çek!</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs sm:text-sm text-[#deb887] font-serif flex items-center gap-2.5">
                <div className="w-8 h-5 sm:w-9 sm:h-6 rounded overflow-hidden border border-[#ffd700] shadow-sm bg-black/60 shrink-0">
                  <img 
                    src={selectedBeylik.flagImage} 
                    alt={`${selectedBeylik.name} Bayrağı`} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span>
                  Seçilen Sancak: <strong className="text-[#ffd700] font-black text-sm sm:text-base">{selectedBeylik.name}</strong> ({selectedBeylik.unit.name})
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!isMandatory && (
                  <button
                    type="button"
                    id="faction-modal-close-btn"
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-[#20140a] hover:bg-[#342010] border border-[#5a3e20] text-[#deb887] hover:text-[#ffd700] font-serif font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Kapat
                  </button>
                )}

                <button
                  type="button"
                  id="faction-modal-confirm-btn"
                  onClick={handleConfirmChoice}
                  className={`group relative flex-1 sm:flex-initial px-6 sm:px-9 py-2.5 sm:py-3.5 rounded-2xl font-serif font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer overflow-hidden whitespace-nowrap shrink-0 ${
                    isShaking ? 'animate-seal-punch scale-95' : 'active:scale-95'
                  } ${
                    isCurrentlyActive
                      ? 'bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#1b4332] border-2 border-[#52b788] text-[#d8f3dc] shadow-[0_4px_20px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,0.3)]'
                      : 'bg-gradient-to-r from-[#6b0f0f] via-[#991b1b] to-[#5c0a0a] hover:from-[#7f1d1d] hover:via-[#b91c1c] hover:to-[#6b0f0f] text-[#fff1f2] border-2 border-[#ffd700] shadow-[0_6px_25px_rgba(153,27,27,0.7),inset_0_2px_4px_rgba(255,215,0,0.4),0_0_15px_rgba(255,215,0,0.25)]'
                  }`}
                >
                  {/* Balmumu Sıvı/Erimiş Işık Parıltısı */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

                  {isCurrentlyActive ? (
                    <>
                      {/* Erimiş Kırmızı/Zümrüt Balmumu Damgası */}
                      <div className="w-5 h-5 rounded-full bg-[#143627] border border-[#74c69d] text-[#74c69d] flex items-center justify-center text-xs shadow-inner shrink-0">
                        ✓
                      </div>
                      <span className="drop-shadow-sm font-black whitespace-nowrap">Bu Sancaktasınız</span>
                    </>
                  ) : (
                    <>
                      {/* Koyu Kırmızı Balmumu Yemin Mührü */}
                      <div className="relative w-6 h-6 rounded-full bg-gradient-to-br from-[#dc2626] to-[#450a0a] border border-[#fca5a5] shadow-[0_1px_3px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-[11px] select-none">🔥</span>
                      </div>
                      <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-[#fef2f2] font-black tracking-wide whitespace-nowrap">
                        {isMandatory ? 'And İç ve Sancağı Çek' : 'Gaza Meşalesini Yak'}
                      </span>
                      <span className="text-[#ffd700] text-xs group-hover:translate-x-0.5 transition-transform select-none shrink-0">
                        ✦
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

