import React, { useState } from 'react';
import { ImperialQuest } from '../types/divanTypes';
import { Award, ChevronUp, ChevronDown, Check, ArrowRight, Sparkles } from 'lucide-react';
import { ResourceIcon } from './ResourceIcon';

interface ImperialQuestBannerProps {
  quest: ImperialQuest | null;
  onNavigateQuest: (quest: ImperialQuest) => void;
  onClaimReward: (questId: string) => void;
  onDismiss?: () => void;
}

export const ImperialQuestBanner: React.FC<ImperialQuestBannerProps> = ({
  quest,
  onNavigateQuest,
  onClaimReward,
  onDismiss
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!quest) return null;

  const currentCount = Number(quest.currentCount) || 0;
  const targetCount = Math.max(1, Number(quest.targetCount) || 1);
  const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
  const isReadyToClaim = currentCount >= targetCount && !quest.isClaimed;

  return (
    <div 
      id="imperial-quest-banner"
      className="fixed bottom-20 left-3 z-30 select-none max-w-sm sm:max-w-md w-[calc(100vw-24px)] pointer-events-auto transition-all"
    >
      <div className="relative rounded-2xl bg-gradient-to-r from-[#2c1a0e]/95 via-[#1d1108]/95 to-[#24150b]/95 border-2 border-[#b8860b] shadow-[0_8px_30px_rgba(0,0,0,0.95)] backdrop-blur-md overflow-hidden p-3 sm:p-3.5">
        
        {/* Minyatür Pirinç Perçinler */}
        <div className="absolute left-1.5 top-1.5 w-1 h-1 rounded-full bg-amber-400 opacity-60" />
        <div className="absolute right-1.5 top-1.5 w-1 h-1 rounded-full bg-amber-400 opacity-60" />

        {/* Üst Bar: Bölüm, Küçült/Büyüt ve Arayüzden Kaldır */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#52371e]/70">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-600 to-amber-950 border border-amber-400 flex items-center justify-center text-xs shadow">
              📜
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
              Hükümdar Görevi • Bölüm {quest.chapter}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-amber-300/80 hover:text-amber-200 p-1 hover:bg-[#3d2714]/80 rounded-lg transition cursor-pointer"
              title={isMinimized ? 'Genişlet' : 'Küçült'}
              aria-label={isMinimized ? 'Genişlet' : 'Küçült'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-amber-400/80 hover:text-red-400 p-1 hover:bg-[#3d2714]/80 rounded-lg transition cursor-pointer text-xs font-bold leading-none flex items-center justify-center w-6 h-6 border border-amber-800/40"
                title="Arayüzden Kaldır / Gizle"
                aria-label="Arayüzden Kaldır"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Görev Başlığı ve İlerleme */}
        {!isMinimized && (
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-serif font-black text-xs sm:text-sm text-[#fef3c7] leading-tight">
                  {quest.title}
                </h4>
                <span className="text-[10px] font-mono font-bold text-amber-300">
                  {quest.currentCount}/{quest.targetCount}
                </span>
              </div>
              <p className="text-[11px] text-[#decab0] font-serif mt-0.5 line-clamp-2 leading-tight">
                {quest.description}
              </p>
            </div>

            {/* İlerleme Çubuğu */}
            <div className="w-full h-2 bg-[#120b06] rounded-full overflow-hidden border border-[#422916] p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isReadyToClaim 
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Ödül Önizleme & Aksiyon Butonu */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono font-bold text-emerald-300">
                <span className="text-[#decab0] font-serif text-[10px]">Ödül:</span>
                {Object.entries(quest.reward.resources).map(([res, amt]) => (
                  <span key={res} className="inline-flex items-center gap-0.5 bg-black/40 px-1 py-0.2 rounded border border-[#52371e]">
                    <ResourceIcon type={res as any} size="sm" />
                    <span>+{amt}</span>
                  </span>
                ))}
                {quest.reward.kudret > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-yellow-300 bg-black/40 px-1 py-0.2 rounded border border-yellow-700/60">
                    <span>+{quest.reward.kudret} ⚔️</span>
                  </span>
                )}
              </div>

              {/* GİT veya Ödülü Al Butonu */}
              {isReadyToClaim ? (
                <button
                  onClick={() => onClaimReward(quest.id)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 border border-emerald-300 text-white text-xs font-serif font-black shadow-md flex items-center gap-1.5 animate-pulse cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>ÖDÜLÜ AL</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateQuest(quest)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#85531d] to-[#4e2f0d] hover:brightness-125 border border-amber-400 text-amber-100 text-xs font-serif font-bold shadow flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>GİT</span>
                  <ArrowRight className="w-3 h-3 text-amber-300" />
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
