import React, { useState, useEffect } from 'react';
import { KhanHero, Resources } from '../types/game';
import { Crown, Swords, Shield, Zap, Home, ChevronRight, Check, AlertCircle, Sparkles } from 'lucide-react';
import { calculateReviveCost, calculateReviveDurationSec } from '../engine/heroLogic';

interface KhanModalProps {
  khan: KhanHero;
  villageResources: Resources;
  onClose: () => void;
  onUpgradeSkill: (skillKey: keyof KhanHero['skills']) => void;
  onRevive: () => void;
}

export const KhanModal: React.FC<KhanModalProps> = ({ khan, villageResources, onClose, onUpgradeSkill, onRevive }) => {
  const isReviving = khan.status === 'reviving';
  const isDead = khan.status === 'dead';
  
  const [remSec, setRemSec] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReviving && khan.reviveFinishTimestamp) {
      interval = setInterval(() => {
        setRemSec(Math.max(0, Math.ceil((khan.reviveFinishTimestamp! - Date.now()) / 1000)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReviving, khan.reviveFinishTimestamp]);

  const getStatusText = () => {
    switch(khan.status) {
      case 'idle': return 'Garnizonda (Merkez Otağ)';
      case 'marching': return 'Seferde';
      case 'dead': return 'Şehit Düştü (Bekliyor)';
      case 'reviving': return 'Otağda Diriliyor';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusColor = () => {
    switch(khan.status) {
      case 'idle': return 'text-emerald-400 bg-[#0c1f13] border-emerald-900';
      case 'marching': return 'text-amber-400 bg-[#1f1a0c] border-amber-900';
      case 'dead': return 'text-red-500 bg-[#1f0c0c] border-red-900';
      case 'reviving': return 'text-blue-400 bg-[#0c131f] border-blue-900';
      default: return 'text-gray-400 bg-[#111] border-gray-800';
    }
  };

  const xpPercent = Math.min(100, Math.max(0, (khan.xp / khan.xpNext) * 100));
  const reviveCost = calculateReviveCost(khan.level);
  const reviveDuration = calculateReviveDurationSec(khan.level);
  
  const canAffordRevive = villageResources.grain >= reviveCost.grain && villageResources.gold >= reviveCost.gold;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1100] flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-[#1c1108] border-[4px] sm:border-[6px] border-[#4a2e15] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col font-serif overflow-hidden max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]">
        
        {/* Inner gold/wood frame */}
        <div className="absolute inset-0 border-2 border-[#d4af37]/30 rounded-lg pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-multiply pointer-events-none" />

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#2c1a0e] via-[#4d3219] to-[#2c1a0e] p-3.5 sm:p-5 flex items-center justify-between border-b-4 border-[#331c0a] relative z-10 shadow-xl">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-[#b45309] via-[#78350f] to-[#451a03] border-[2px] sm:border-[3px] border-[#d4af37] flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.8)] relative shrink-0">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-[#fef08a] drop-shadow-md" />
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-[#7f1d1d] border-2 border-[#d4af37] w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md">
                <span className="text-[10px] sm:text-xs font-black text-white">{khan.level}</span>
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-[#fcedc7] flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                {khan.name}
              </h2>
              <div className="text-xs sm:text-sm text-[#caa05a] font-black uppercase tracking-widest mt-0.5 sm:mt-1">
                Hakan Otağı
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#1a0f08] border-2 border-[#8b6534] text-[#fcedc7] hover:bg-[#8b6534] hover:text-[#1a0f08] rounded-md transition shadow-md font-bold text-sm sm:text-lg cursor-pointer shrink-0"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 bg-gradient-to-b from-[#140b06] to-[#0a0502] relative z-10 space-y-4 sm:space-y-6 custom-scrollbar">
          
          {/* Status & XP Module */}
          <div className="bg-[#120a05] p-5 rounded-lg border-2 border-[#3d2714] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-center mb-4">
              <div className={`px-4 py-1.5 rounded-md border-2 font-black text-sm uppercase tracking-wider shadow-sm flex items-center gap-2 ${getStatusColor()}`}>
                {isDead && <AlertCircle className="w-4 h-4" />}
                {getStatusText()}
                {isReviving && <span className="font-mono bg-black/30 px-2 py-0.5 rounded ml-1">{remSec}s</span>}
              </div>
              <div className="text-right">
                <div className="text-xs text-[#a89070] uppercase font-bold tracking-widest mb-1">Tecrübe Puanı</div>
                <div className="text-base font-black text-[#fcd34d] font-mono bg-[#0c0703] px-3 py-1 rounded border border-[#3d2714] shadow-inner">
                  {khan.xp.toLocaleString()} <span className="text-[#6b4724]">/</span> {khan.xpNext.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* XP Bar */}
            <div className="h-3 w-full bg-[#0c0703] rounded-full overflow-hidden border-2 border-[#2b190c] p-[1px] shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#92400e] via-[#d97706] to-[#fcd34d] rounded-full shadow-[0_0_10px_rgba(252,211,77,0.5)] transition-all duration-1000"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Revive Module */}
          {isDead && (
            <div className="bg-gradient-to-r from-[#2a0e0e] to-[#170505] p-5 rounded-lg border-[3px] border-[#991b1b] shadow-[0_5px_20px_rgba(153,27,27,0.3)] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-20">
                <Crown className="w-32 h-32 text-red-500" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Wax Seal */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#dc2626] to-[#7f1d1d] border-2 border-[#991b1b] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.2)] shrink-0">
                    <span className="text-3xl filter drop-shadow-md opacity-80">🦅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-red-400 mb-1">Han Şehit Düştü!</h3>
                    <p className="text-xs text-[#decab0]">
                      Yüce Han'ı Merkez Otağ'da diriltmek için erzak ve altın gereklidir. Dirilme süresi {reviveDuration} saniyedir.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 bg-[#110404] p-3 rounded-lg border border-[#570f0f] w-full md:w-auto">
                  <div className="flex gap-4 font-mono text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[#a89070]">Erzak Bedeli</span>
                      <span className={`font-black ${villageResources.grain >= reviveCost.grain ? 'text-amber-400' : 'text-red-500'}`}>
                        {reviveCost.grain.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-[1px] bg-[#3d1313]" />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[#a89070]">Altın Bedeli</span>
                      <span className={`font-black ${villageResources.gold >= reviveCost.gold ? 'text-yellow-400' : 'text-red-500'}`}>
                        {reviveCost.gold.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={onRevive}
                    disabled={!canAffordRevive}
                    className="w-full bg-gradient-to-b from-[#991b1b] to-[#570f0f] hover:from-[#b91c1c] hover:to-[#7f1d1d] disabled:from-[#2a0e0e] disabled:to-[#170505] disabled:text-gray-500 text-[#fcedc7] font-black uppercase tracking-widest text-xs py-2 px-4 rounded border-2 border-[#dc2626] disabled:border-[#570f0f] shadow-md transition disabled:cursor-not-allowed"
                  >
                    Hanı Otağda Dirilt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skills Tree */}
          <div className="bg-[#120a05] p-5 rounded-lg border-2 border-[#3d2714] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-end mb-5 border-b-2 border-[#2b190c] pb-3">
              <h3 className="text-xl font-black text-[#fcedc7] flex items-center gap-2 drop-shadow-md">
                <Sparkles className="w-6 h-6 text-[#d4af37]" />
                Nitelik Fermanları
              </h3>
              <div className="text-xs font-serif uppercase tracking-widest text-[#a89070] flex items-center gap-2">
                Kullanılabilir Puan: 
                <span className={`font-black text-lg px-2.5 py-0.5 rounded border-2 shadow-inner ${khan.unspentSkillPoints > 0 ? 'text-emerald-400 bg-[#0c1f13] border-emerald-900 animate-pulse' : 'text-gray-500 bg-[#0c0703] border-[#2b190c]'}`}>
                  {khan.unspentSkillPoints}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Attack Aura */}
              <div className="bg-gradient-to-b from-[#1c1108] to-[#120a05] p-4 rounded-lg border-2 border-[#3d2714] hover:border-[#8b6534] flex flex-col justify-between shadow-md transition group">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-gradient-to-b from-[#450a0a] to-[#2a0e0e] border-2 border-[#991b1b] flex items-center justify-center text-red-500 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <Swords className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-black text-[#fcedc7] text-sm uppercase tracking-wide">Hücum Sancağı</div>
                    <div className="text-[11px] text-[#a89070] mt-1.5 leading-relaxed">Han seferdeyken ordunun toplam taarruz gücünü artırır. Yıkıcı darbeler için elzemdir.</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2b190c] bg-[#0c0703] -mx-4 -mb-4 p-4 rounded-b-lg">
                  <div className="text-xs text-red-400 font-bold font-mono flex items-center gap-2">
                    <span className="text-[#fcedc7] bg-[#2a0e0e] px-2 py-1 rounded border border-[#991b1b] shadow-inner">Seviye {khan.skills.attackAura}</span>
                    <span className="text-sm">+{(khan.skills.attackAura * 1.5).toFixed(1)}%</span>
                  </div>
                  <button
                    disabled={khan.unspentSkillPoints <= 0 || isDead || isReviving}
                    onClick={() => onUpgradeSkill('attackAura')}
                    className={`w-8 h-8 rounded flex items-center justify-center border-2 transition shadow-md font-bold text-lg ${khan.unspentSkillPoints > 0 && !isDead && !isReviving ? 'bg-gradient-to-b from-[#d4af37] to-[#b45309] border-[#fef08a] text-[#2c1a0e] hover:brightness-110 cursor-pointer animate-pulse' : 'bg-[#1a1008] border-[#3d2714] text-[#3d2714] cursor-not-allowed'}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Defense Aura */}
              <div className="bg-gradient-to-b from-[#1c1108] to-[#120a05] p-4 rounded-lg border-2 border-[#3d2714] hover:border-[#8b6534] flex flex-col justify-between shadow-md transition group">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-gradient-to-b from-[#0f172a] to-[#020617] border-2 border-[#1e3a8a] flex items-center justify-center text-blue-500 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-black text-[#fcedc7] text-sm uppercase tracking-wide">Müdafaa Tuğu</div>
                    <div className="text-[11px] text-[#a89070] mt-1.5 leading-relaxed">Merkez Otağ'da bulunduğunda garnizonun nihai savunma direncini artırır.</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2b190c] bg-[#0c0703] -mx-4 -mb-4 p-4 rounded-b-lg">
                  <div className="text-xs text-blue-400 font-bold font-mono flex items-center gap-2">
                    <span className="text-[#fcedc7] bg-[#020617] px-2 py-1 rounded border border-[#1e3a8a] shadow-inner">Seviye {khan.skills.defenseAura}</span>
                    <span className="text-sm">+{(khan.skills.defenseAura * 1.5).toFixed(1)}%</span>
                  </div>
                  <button
                    disabled={khan.unspentSkillPoints <= 0 || isDead || isReviving}
                    onClick={() => onUpgradeSkill('defenseAura')}
                    className={`w-8 h-8 rounded flex items-center justify-center border-2 transition shadow-md font-bold text-lg ${khan.unspentSkillPoints > 0 && !isDead && !isReviving ? 'bg-gradient-to-b from-[#d4af37] to-[#b45309] border-[#fef08a] text-[#2c1a0e] hover:brightness-110 cursor-pointer animate-pulse' : 'bg-[#1a1008] border-[#3d2714] text-[#3d2714] cursor-not-allowed'}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cavalry Speed */}
              <div className="bg-gradient-to-b from-[#1c1108] to-[#120a05] p-4 rounded-lg border-2 border-[#3d2714] hover:border-[#8b6534] flex flex-col justify-between shadow-md transition group">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-gradient-to-b from-[#422006] to-[#170c01] border-2 border-[#b45309] flex items-center justify-center text-amber-500 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-black text-[#fcedc7] text-sm uppercase tracking-wide">Süvari Akını</div>
                    <div className="text-[11px] text-[#a89070] mt-1.5 leading-relaxed">Ordunun haritadaki intikal hızını artırır. Sürpriz baskınlar için idealdir.</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2b190c] bg-[#0c0703] -mx-4 -mb-4 p-4 rounded-b-lg">
                  <div className="text-xs text-amber-400 font-bold font-mono flex items-center gap-2">
                    <span className="text-[#fcedc7] bg-[#170c01] px-2 py-1 rounded border border-[#b45309] shadow-inner">Seviye {khan.skills.cavalrySpeed}</span>
                    <span className="text-sm">+{(khan.skills.cavalrySpeed * 2.0).toFixed(1)}%</span>
                  </div>
                  <button
                    disabled={khan.unspentSkillPoints <= 0 || isDead || isReviving}
                    onClick={() => onUpgradeSkill('cavalrySpeed')}
                    className={`w-8 h-8 rounded flex items-center justify-center border-2 transition shadow-md font-bold text-lg ${khan.unspentSkillPoints > 0 && !isDead && !isReviving ? 'bg-gradient-to-b from-[#d4af37] to-[#b45309] border-[#fef08a] text-[#2c1a0e] hover:brightness-110 cursor-pointer animate-pulse' : 'bg-[#1a1008] border-[#3d2714] text-[#3d2714] cursor-not-allowed'}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Governance */}
              <div className="bg-gradient-to-b from-[#1c1108] to-[#120a05] p-4 rounded-lg border-2 border-[#3d2714] hover:border-[#8b6534] flex flex-col justify-between shadow-md transition group">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded bg-gradient-to-b from-[#064e3b] to-[#022c22] border-2 border-[#059669] flex items-center justify-center text-emerald-500 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-black text-[#fcedc7] text-sm uppercase tracking-wide">İdare-i Mülk</div>
                    <div className="text-[11px] text-[#a89070] mt-1.5 leading-relaxed">Han'ın bulunduğu köydeki tüm hammadde ocaklarının saatlik bereketini artırır.</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#2b190c] bg-[#0c0703] -mx-4 -mb-4 p-4 rounded-b-lg">
                  <div className="text-xs text-emerald-400 font-bold font-mono flex items-center gap-2">
                    <span className="text-[#fcedc7] bg-[#022c22] px-2 py-1 rounded border border-[#059669] shadow-inner">Seviye {khan.skills.governance}</span>
                    <span className="text-sm">+{(khan.skills.governance * 1.0).toFixed(1)}%</span>
                  </div>
                  <button
                    disabled={khan.unspentSkillPoints <= 0 || isDead || isReviving}
                    onClick={() => onUpgradeSkill('governance')}
                    className={`w-8 h-8 rounded flex items-center justify-center border-2 transition shadow-md font-bold text-lg ${khan.unspentSkillPoints > 0 && !isDead && !isReviving ? 'bg-gradient-to-b from-[#d4af37] to-[#b45309] border-[#fef08a] text-[#2c1a0e] hover:brightness-110 cursor-pointer animate-pulse' : 'bg-[#1a1008] border-[#3d2714] text-[#3d2714] cursor-not-allowed'}`}
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
