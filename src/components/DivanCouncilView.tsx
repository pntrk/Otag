import React, { useState } from 'react';
import { DivanPetition, ActiveDivanBuff } from '../types/divanTypes';
import { Resources } from '../types/game';
import { Scroll, Sparkles, Clock, CheckCircle, ShieldAlert, Award } from 'lucide-react';
import { ResourceIcon } from './ResourceIcon';

interface DivanCouncilViewProps {
  petitions: DivanPetition[];
  activeBuffs: ActiveDivanBuff[];
  villageResources: Resources;
  onEnactDecree: (petitionId: string, choiceId: string) => void;
  onSelectTab?: (tab: any) => void;
}

export const DivanCouncilView: React.FC<DivanCouncilViewProps> = ({
  petitions,
  activeBuffs,
  villageResources,
  onEnactDecree,
  onSelectTab
}) => {
  const [selectedPetitionIndex, setSelectedPetitionIndex] = useState<number>(0);
  const [sealedAnimationId, setSealedAnimationId] = useState<string | null>(null);

  const currentPetition = petitions[selectedPetitionIndex] || petitions[0];

  const handleChoose = (choiceId: string) => {
    if (!currentPetition) return;
    setSealedAnimationId(choiceId);
    setTimeout(() => {
      onEnactDecree(currentPetition.id, choiceId);
      setSealedAnimationId(null);
    }, 600);
  };

  const hasEnoughForCost = (cost?: Partial<Resources>) => {
    if (!cost) return true;
    for (const [resKey, amount] of Object.entries(cost)) {
      if (typeof amount === 'number') {
        const cur = (villageResources as any)[resKey] ?? 0;
        if (cur < amount) return false;
      }
    }
    return true;
  };

  return (
    <div id="divan-council-screen" className="max-w-6xl mx-auto space-y-4 pb-20 select-none">
      
      {/* 1. Üst Başlık & Divan Atmosferi */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#3a2010] via-[#24140a] to-[#140b05] border-3 border-[#946c3b] p-4 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Dekoratif Bozkır Deseni Arka Planı */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-2 left-3 text-amber-500/20 text-4xl select-none font-serif">🏛️</div>
        <div className="absolute top-2 right-3 text-amber-500/20 text-4xl select-none font-serif">⚖️</div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-900/60 border border-amber-500/60 text-amber-300 uppercase tracking-widest">
                Otağ • Devlet-i Âliyye
              </span>
              <span className="text-xs text-amber-400 font-serif">Hükümranlık Meclisi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#fef3c7] mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center gap-2.5">
              <span>Divan-ı Hümayun & Fermanlar</span>
              <Scroll className="w-6 h-6 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-[#decab0] max-w-2xl mt-1 leading-relaxed">
              Vezirler, beyler ve bozkır elçileri huzurunuza arz-ı hal sunmaktadır. Vereceğiniz kutlu kararlar ile devlet hazinesini, ordu süratini ve beylik bereketini şekillendirin.
            </p>
          </div>

          {/* Aktif Ferman Sayacı */}
          <div className="flex items-center gap-3 bg-[#190e07]/90 px-3.5 py-2 rounded-xl border border-[#6b4724] shadow-inner">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-amber-400">Bekleyen Arz</div>
              <div className="text-lg font-mono font-black text-amber-200">{petitions.length} Olay</div>
            </div>
            <div className="w-[1px] h-8 bg-[#422a16]" />
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Yürürlükte</div>
              <div className="text-lg font-mono font-black text-emerald-300">{activeBuffs.length} Ferman</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Yürürlükteki Kutlu Lütuflar / Aktif Bufflar Çubuğu */}
      {activeBuffs.length > 0 && (
        <div className="bg-[#1c1109] border-2 border-emerald-700/60 rounded-xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-serif font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Yürürlükteki Kutlu Lütuflar & Fermanlar
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">{activeBuffs.length} aktif etki</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeBuffs.map(buff => {
              const remainingSec = Math.max(0, Math.floor((buff.expiresAt - Date.now()) / 1000));
              const remainingMin = Math.ceil(remainingSec / 60);
              return (
                <div key={buff.id} className="flex items-center justify-between bg-[#120b06] border border-emerald-600/40 p-2 rounded-lg text-xs">
                  <div>
                    <div className="font-serif font-bold text-amber-200">{buff.name}</div>
                    <div className="text-[10px] text-emerald-300">{buff.description}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#24150a] px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 shrink-0 ml-2">
                    <Clock className="w-3 h-3" />
                    <span>{remainingMin} dk</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Ana Divan Masası & Arz Listesi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Sol Kolon: Gelen Arzlar Listesi (Petitions List) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-serif font-bold text-amber-200 px-1 flex items-center justify-between">
            <span>DİVAN GÜNDEMİ</span>
            <span className="text-[10px] text-amber-400/70 font-mono">1 Olay Seçiniz</span>
          </div>

          <div className="space-y-2">
            {petitions.map((pet, idx) => {
              const isSelected = idx === selectedPetitionIndex;
              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPetitionIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 shadow-md relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#4d2d14] to-[#301c0c] border-amber-400 ring-2 ring-amber-500/30'
                      : 'bg-gradient-to-r from-[#24160d] to-[#170e08] border-[#5a3b20] hover:border-amber-600/60'
                  }`}
                >
                  <div className="text-3xl p-1.5 bg-[#140b06] border border-[#52371e] rounded-lg shrink-0 shadow-inner">
                    {pet.avatarIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                        {pet.category.toUpperCase()}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-serif font-bold text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/60">
                          HUZURDA
                        </span>
                      )}
                    </div>
                    <div className="font-serif font-bold text-sm text-[#fef3c7] truncate mt-0.5">
                      {pet.title}
                    </div>
                    <div className="text-[11px] text-[#decab0] truncate">
                      {pet.petitionerName} • <span className="text-amber-300/80">{pet.petitionerTitle}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sağ Kolon: Arz Detayı ve Hükümdar Karar Masası */}
        <div className="lg:col-span-8">
          {currentPetition ? (
            <div className="rounded-2xl bg-[#21140b] border-3 border-[#805c31] p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[440px]">
              {/* Zemin Parşömen Doku Efekti */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#3a2211]/30 to-transparent pointer-events-none" />

              <div>
                {/* Arz Sahibi Başlığı */}
                <div className="flex items-center gap-3.5 pb-4 border-b border-[#5a3a1f]">
                  <div className="w-14 h-14 rounded-xl bg-[#140b06] border-2 border-amber-500 flex items-center justify-center text-3xl shadow-md">
                    {currentPetition.avatarIcon}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wide">
                      {currentPetition.category} Dilekçesi • {currentPetition.petitionerTitle}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black text-[#fff4df]">
                      {currentPetition.petitionerName}
                    </h2>
                    <div className="text-xs text-[#decab0] font-serif italic">
                      «Devletlü Hakanımızın huzuruna niyaz olunur...»
                    </div>
                  </div>
                </div>

                {/* Dilekçe Metni */}
                <div className="my-5 p-4 rounded-xl bg-[#170e08] border border-[#52371e] text-[#f2e6d0] font-serif text-sm sm:text-base leading-relaxed shadow-inner">
                  <div className="font-black text-amber-300 mb-1.5 flex items-center gap-1.5">
                    <Scroll className="w-4 h-4 text-amber-400" />
                    <span>{currentPetition.title}</span>
                  </div>
                  {currentPetition.description}
                </div>
              </div>

              {/* Hükümdar Karar Seçenekleri (Decree Choices) */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-serif font-black text-amber-300 tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>HÜKÜMDAR FERMANI VERİNİZ:</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentPetition.choices.map((choice, cIdx) => {
                    const affordable = hasEnoughForCost(choice.cost);
                    const isSealing = sealedAnimationId === choice.id;

                    return (
                      <div 
                        key={choice.id}
                        className={`p-3.5 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSealing
                            ? 'bg-amber-500/20 border-amber-300 scale-[0.99]'
                            : affordable
                            ? 'bg-gradient-to-r from-[#2c1c11] to-[#1e130b] border-[#6b4724] hover:border-amber-400'
                            : 'bg-[#190f08] border-[#422915] opacity-65'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-serif font-bold text-sm text-[#fef3c7] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-950 border border-amber-500 text-amber-300 text-xs flex items-center justify-center font-mono font-bold">
                              {cIdx === 0 ? 'A' : 'B'}
                            </span>
                            <span>{choice.text}</span>
                          </div>

                          <div className="text-xs text-emerald-300 font-serif mt-1 flex items-center gap-1">
                            <span>✨ {choice.rewardDescription}</span>
                          </div>

                          {choice.cost && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] uppercase font-bold text-[#bda273]">Masraf:</span>
                              {Object.entries(choice.cost).map(([res, amount]) => (
                                <span key={res} className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-300 bg-black/40 px-2 py-0.5 rounded border border-rose-900/60">
                                  <ResourceIcon type={res as any} size="sm" />
                                  <span>{amount}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Mühürle & Fermanı İmzala Butonu */}
                        <button
                          onClick={() => handleChoose(choice.id)}
                          disabled={!affordable || isSealing}
                          className={`px-4 py-2.5 rounded-xl font-serif font-black text-xs transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer ${
                            isSealing
                              ? 'bg-amber-400 text-black animate-pulse'
                              : affordable
                              ? 'bg-gradient-to-b from-[#85531d] via-[#633c14] to-[#452709] border border-amber-400 text-amber-100 hover:brightness-125'
                              : 'bg-[#291a10] border border-[#4a2e1a] text-[#806144] cursor-not-allowed'
                          }`}
                        >
                          <span className="text-base">📜</span>
                          <span>{isSealing ? 'MÜHÜRLENİYOR...' : affordable ? 'FERMANI MÜHÜRLE' : 'Yetersiz Kaynak'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-[#decab0] bg-[#1a1009] border-2 border-[#5a3a20] rounded-2xl">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <div className="font-serif font-black text-lg text-amber-200">Bütün Arzlar Karara Bağlandı!</div>
              <p className="text-xs text-stone-400 mt-1">
                Tüm dilekçeler mühürlendi. Yeni bir olay arz edildiğinde ulak haberdar edecektir.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
