import React, { useState } from 'react';
import { 
  Trophy, 
  Crown, 
  Users, 
  School, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  UserPlus, 
  X, 
  Building2, 
  ScrollText,
  Lock,
  Flame,
  Award
} from 'lucide-react';
import { 
  Alliance, 
  AllianceMember, 
  FactionType, 
  QualifiedVictoryMember, 
  VictoryCheckResult, 
  Village 
} from '../types/game';
import { FACTIONS } from '../data/gameData';
import { 
  getAllianceCapacityInfo, 
  canRecruitMember, 
  RECRUITABLE_CANDIDATES, 
  CAPACITY_PER_SCHOOL_LEVEL,
  BASE_ALLIANCE_CAPACITY
} from '../engine/allianceEngine';
import { 
  checkAllianceVictory, 
  getAllianceFactionProgress, 
  REQUIRED_DISTINCT_FACTIONS, 
  REQUIRED_UMAYKUT_LEVEL,
  setStoredVictoryState
} from '../engine/victoryEngine';

interface UmaykutVictoryPanelProps {
  alliance: Alliance;
  playerVillages: Village[];
  onClose: () => void;
  onUpdateAlliance: (updatedAlliance: Alliance) => void;
  onOpenBuildingModal?: (type: 'umaykut' | 'school' | 'town_hall') => void;
}

export const UmaykutVictoryPanel: React.FC<UmaykutVictoryPanelProps> = ({
  alliance,
  playerVillages,
  onClose,
  onUpdateAlliance,
  onOpenBuildingModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'victory' | 'members' | 'recruit'>('victory');
  const [recruitFeedback, setRecruitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  // Kapasite bilgisi (Okul motoru)
  const capacityInfo = getAllianceCapacityInfo(alliance, playerVillages);

  // Zafer denetimi (3 farklı beylik Seviye 10 Umaykut kuralı)
  const victoryResult = checkAllianceVictory(alliance, playerVillages);
  const factionProgressList = getAllianceFactionProgress(alliance, playerVillages);

  // Yeni üye alma işleyicisi
  const handleRecruit = (candidate: typeof RECRUITABLE_CANDIDATES[0]) => {
    const check = canRecruitMember(alliance, playerVillages);
    if (!check.allowed) {
      setRecruitFeedback({
        type: 'error',
        message: check.reason || 'Birlik kapasitesi dolu!',
      });
      return;
    }

    // Üyeyi ekle
    const newMember: AllianceMember = {
      ...candidate,
      joinedAt: Date.now(),
    };

    const updated: Alliance = {
      ...alliance,
      members: [...alliance.members, newMember],
    };

    onUpdateAlliance(updated);
    setRecruitFeedback({
      type: 'success',
      message: `✓ ${candidate.name} (${FACTIONS[candidate.faction]?.name}) birliğe kabul edildi!`,
    });

    // Otomatik zafer kontrolü
    const newVictory = checkAllianceVictory(updated, playerVillages);
    if (newVictory.isVictory) {
      setStoredVictoryState(newVictory);
      setShowCelebrationModal(true);
    }
  };

  // Üye çıkarma işleyicisi
  const handleKickMember = (memberId: string) => {
    if (memberId === 'player_main' || alliance.leaderId === memberId) return;
    const updated: Alliance = {
      ...alliance,
      members: alliance.members.filter(m => m.id !== memberId),
    };
    onUpdateAlliance(updated);
    setRecruitFeedback({
      type: 'success',
      message: 'Üye birlikten ihraç edildi.',
    });
  };

  // Zaferi test etme / simüle etme (Hızlı test imkânı için)
  const handleSimulateVictory = () => {
    // 3 farklı beyliğe mensup üyelerin Umaykut seviyelerini 10 yap
    const updatedMembers = alliance.members.map((m, idx) => {
      if (idx < 3) {
        return {
          ...m,
          umaykutLevel: 10,
          hasLevel10Umaykut: true,
        };
      }
      return m;
    });

    const updated: Alliance = {
      ...alliance,
      members: updatedMembers,
    };
    onUpdateAlliance(updated);

    const vic = checkAllianceVictory(updated, playerVillages);
    setStoredVictoryState(vic);
    setShowCelebrationModal(true);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      
      {/* ================================================================ */}
      {/* ANA PANEL ÇERÇEVESİ (PARŞÖMEN & DÖVME PİRİNÇ DETAYLARI)          */}
      {/* ================================================================ */}
      <div 
        className="relative bg-gradient-to-b from-[#23150a] via-[#1a0f07] to-[#120803] border-4 border-[#8f6834] rounded-2xl w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col shadow-[0_15px_50px_rgba(0,0,0,0.95)] overflow-hidden text-[#ede3ce] font-serif select-none"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Pirinç Köşe Rozetleri */}
        <div className="absolute left-2.5 top-2.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffd700] to-[#5c3e0a] shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
        <div className="absolute right-2.5 top-2.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffd700] to-[#5c3e0a] shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
        <div className="absolute left-2.5 bottom-2.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffd700] to-[#5c3e0a] shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />
        <div className="absolute right-2.5 bottom-2.5 w-2 h-2 rounded-full bg-gradient-to-br from-[#ffd700] to-[#5c3e0a] shadow-[0_1px_3px_rgba(0,0,0,0.9)]" />

        {/* ÜST BAŞLIK (FERMAN TUĞRASI) */}
        <div className="shrink-0 p-3.5 sm:p-5 border-b-2 border-[#5e4120] bg-gradient-to-r from-[#2c1a0c] via-[#3a2210] to-[#2c1a0c] flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br from-[#8a2216] via-[#63140b] to-[#3a0b06] border-2 border-[#caa05a] flex items-center justify-center text-xl sm:text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.3)] shrink-0">
              🦅
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-xl font-black text-[#f7e4b5] tracking-wider uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  CİHAN HÂKİMİYETİ & ZAFER DİVANI
                </h2>
                <span className="bg-[#4d3215] text-[#fcd34d] border border-[#a87c3e] px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono font-bold shadow">
                  [{alliance.tag}] {alliance.name}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#d1b894] mt-0.5">
                Sezon Zaferi: 3 Farklı Beylikten 10. Seviye Zafer Mabetleri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#3d2311] hover:bg-[#5a3418] border border-[#855d2b] text-[#f4d9a3] hover:text-white transition cursor-pointer shadow shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEKME GEÇİŞLERİ */}
        <div className="shrink-0 flex border-b border-[#5e4120] bg-[#1a0e06] text-xs font-bold overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveSubTab('victory')}
            className={`flex-1 min-w-[130px] py-2.5 sm:py-3 flex items-center justify-center gap-2 transition cursor-pointer text-center ${
              activeSubTab === 'victory'
                ? 'bg-gradient-to-t from-[#3d2410] to-[#25150a] text-[#ffd700] border-b-2 border-[#ffd700]'
                : 'text-[#a89070] hover:text-[#e8dcbe]'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="whitespace-nowrap">Zafer İlerlemesi ({victoryResult.uniqueFactionsCount}/3)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('members')}
            className={`flex-1 min-w-[130px] py-2.5 sm:py-3 flex items-center justify-center gap-2 transition cursor-pointer text-center ${
              activeSubTab === 'members'
                ? 'bg-gradient-to-t from-[#3d2410] to-[#25150a] text-[#ffd700] border-b-2 border-[#ffd700]'
                : 'text-[#a89070] hover:text-[#e8dcbe]'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="whitespace-nowrap">Üyeler ({capacityInfo.currentMembersCount}/{capacityInfo.totalCapacity})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('recruit')}
            className={`flex-1 min-w-[130px] py-2.5 sm:py-3 flex items-center justify-center gap-2 transition cursor-pointer text-center ${
              activeSubTab === 'recruit'
                ? 'bg-gradient-to-t from-[#3d2410] to-[#25150a] text-[#ffd700] border-b-2 border-[#ffd700]'
                : 'text-[#a89070] hover:text-[#e8dcbe]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span className="whitespace-nowrap">Yeni Bey Katılımı</span>
          </button>
        </div>

        {/* BİLDİRİM BANNERI */}
        {recruitFeedback && (
          <div className={`shrink-0 px-4 py-2 text-xs flex items-center justify-between ${
            recruitFeedback.type === 'success' 
              ? 'bg-emerald-950/80 border-b border-emerald-800 text-emerald-200' 
              : 'bg-red-950/80 border-b border-red-800 text-red-200'
          }`}>
            <span>{recruitFeedback.message}</span>
            <button onClick={() => setRecruitFeedback(null)} className="text-stone-400 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* GÖVDE İÇERİĞİ */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 flex-1 min-h-0 text-xs custom-scrollbar">
          
          {/* ================================================================ */}
          {/* 1. ZAFER İLERLEMESİ SEKMESİ                                      */}
          {/* ================================================================ */}
          {activeSubTab === 'victory' && (
            <div className="space-y-4">
              
              {/* Zafer Durum Kartı (Hero Banner) */}
              <div className={`p-4 rounded-xl border-2 shadow-lg relative overflow-hidden ${
                victoryResult.isVictory 
                  ? 'bg-gradient-to-br from-[#4d2f09] via-[#382006] to-[#1c0f03] border-[#ffd700] text-[#fff6d6]'
                  : 'bg-gradient-to-br from-[#2b190c] via-[#1c0f06] to-[#120803] border-[#7d5628] text-[#ede3ce]'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Resmi Sezon Zaferi Koşulu</span>
                    </div>
                    <h3 className="text-lg font-black text-[#fde68a] mt-1 font-serif">
                      10. Seviye Zafer Mabedi İttifak Zaferi
                    </h3>
                    <p className="text-xs text-[#d1b894] max-w-xl mt-1 leading-relaxed">
                      İttifakınız bünyesindeki <strong>farklı beyliklere mensup en az 3 oyuncu</strong> payitaht merkez köylerindeki <strong>Zafer Mabedini 10. Seviyeye</strong> tamamladığında çağ sona erer ve ittifakınız cihan hâkimiyetini kazanır!
                    </p>
                  </div>

                  {/* İlerleme Rozeti */}
                  <div className="bg-[#120803]/90 border border-[#8f6834] rounded-xl px-4 py-3 text-center shrink-0 shadow-inner">
                    <div className="text-[10px] uppercase text-[#a89070] font-bold">Mühürlü Beylikler</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-[#ffd700] drop-shadow">
                      {victoryResult.uniqueFactionsCount} <span className="text-stone-500 text-lg">/ 3</span>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      {victoryResult.isVictory ? '✓ Zafer Kazanıldı!' : `${3 - victoryResult.uniqueFactionsCount} beylik kaldı`}
                    </div>
                  </div>
                </div>

                {/* Altın İlerleme Çubuğu */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-[#decab0]">Zafer İlerleme Oranı</span>
                    <span className="text-amber-300 font-mono font-bold">
                      %{Math.round((victoryResult.uniqueFactionsCount / 3) * 100)}
                    </span>
                  </div>
                  <div className="w-full bg-[#100904] h-3.5 rounded-full border border-[#6b4b24] overflow-hidden p-0.5 shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500"
                      style={{ width: `${Math.min(100, (victoryResult.uniqueFactionsCount / 3) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Zafer Bildirimi / Test Butonu */}
                {victoryResult.isVictory ? (
                  <div className="mt-4 p-3 bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border border-amber-500 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-amber-200">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400 shrink-0" />
                      <span className="font-bold text-xs">{victoryResult.announcementText}</span>
                    </div>
                    <button
                      onClick={() => setShowCelebrationModal(true)}
                      className="px-3 py-1.5 rounded bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 font-black text-xs hover:brightness-110 shadow cursor-pointer shrink-0"
                    >
                      🏆 Fermanı Gör
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#a89070]">
                    <span>💡 İpucu: Merkez köyünüzdeki Seviye 10 Merkez Binası üzerine Zafer Mabedini kurup 10. seviyeye ulaştırın.</span>
                    <button
                      onClick={handleSimulateVictory}
                      title="Zafer koşullarını ve altın varaklı tuğra kutlama ekranını test etmek için tıkla"
                      className="text-amber-400 hover:text-amber-300 underline cursor-pointer shrink-0 ml-2"
                    >
                      (Zaferi Simüle Et / Test Et)
                    </button>
                  </div>
                )}
              </div>

              {/* 5 ANADOLU BEYLİĞİ MABET MÜHÜRLERİ VİTRİNİ */}
              <div>
                <h4 className="text-xs font-bold text-[#decab0] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-amber-400" />
                  <span>Anadolu Beylikleri Zafer Mabet Durumu (5 Beylik)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {factionProgressList.map(item => (
                    <div
                      key={item.factionId}
                      className={`p-3.5 rounded-xl border-2 transition relative flex flex-col justify-between ${
                        item.isCompleted
                          ? 'bg-gradient-to-br from-[#3b270c] to-[#1f1304] border-[#ffd700] shadow-[0_4px_12px_rgba(255,215,0,0.25)]'
                          : item.hasMemberInAlliance
                          ? 'bg-[#1e1208] border-[#6b4b24]'
                          : 'bg-[#140b04]/70 border-[#422912] opacity-75'
                      }`}
                    >
                      {/* Üst Kısım: Beylik Başlığı ve İkon */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8f2a1c] to-[#450e07] border border-[#f5d78a] flex items-center justify-center text-sm shadow">
                            {item.crestIcon}
                          </div>
                          <div>
                            <div className="font-bold text-[#f7e4b5] text-xs">
                              {item.factionName}
                            </div>
                            <div className="text-[10px] text-[#a89070]">
                              {item.hasMemberInAlliance ? item.memberName : 'İttifakta Üye Yok'}
                            </div>
                          </div>
                        </div>

                        {/* Mühür / Rozet */}
                        {item.isCompleted ? (
                          <span className="bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> MÜHÜRLENDİ
                          </span>
                        ) : item.hasMemberInAlliance ? (
                          <span className="bg-[#382006] text-amber-300 border border-[#8a602c] text-[9px] px-1.5 py-0.5 rounded">
                            İnşaatta
                          </span>
                        ) : (
                          <span className="bg-stone-900 text-stone-500 border border-stone-800 text-[9px] px-1.5 py-0.5 rounded">
                            Eksik
                          </span>
                        )}
                      </div>

                      {/* Orta Kısım: Umaykut Seviye Göstergesi */}
                      <div className="bg-[#120803] p-2 rounded-lg border border-[#3b2410] space-y-1.5 my-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#a89070]">Mabet Kademesi</span>
                          <span className={`font-mono font-bold ${item.isCompleted ? 'text-[#ffd700]' : 'text-amber-400'}`}>
                            Seviye {item.umaykutLevel} / 10
                          </span>
                        </div>
                        <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden border border-stone-800">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.isCompleted
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                : 'bg-amber-600'
                            }`}
                            style={{ width: `${(item.umaykutLevel / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Alt Kısım: Aksiyon & Durum */}
                      <div className="text-[10px] text-right mt-1">
                        {item.isCompleted ? (
                          <span className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-400" /> Zafer Mührü Aktif
                          </span>
                        ) : item.hasMemberInAlliance ? (
                          <span className="text-amber-300/80">
                            10. seviyeye {10 - item.umaykutLevel} kademe kaldı
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveSubTab('recruit')}
                            className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            + Bu beylikten üye davet et
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BİRLİK OKUL KAPASİTESİ BİLGİ PLAKETİ */}
              <div className="p-3.5 bg-gradient-to-r from-[#21140a] via-[#1a0f07] to-[#21140a] rounded-xl border border-[#6b4b24] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#3b2410] border border-[#a87c3e] flex items-center justify-center text-lg text-amber-300">
                    <School className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#f7e4b5] text-xs">
                      Birlik Oyuncu Kapasitesi & Okul Binaları
                    </h5>
                    <p className="text-[11px] text-[#decab0]">
                      Üyelerin köylerindeki <strong>Okul (Medrese)</strong> binalarının her 1 seviyesi birliğe <strong>+3 oyuncu kontenjanı</strong> sağlar.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-[#a89070]">Toplam Okul Seviyesi</div>
                    <div className="text-sm font-mono font-bold text-amber-300">{capacityInfo.totalSchoolLevels} Seviye</div>
                  </div>
                  <div className="w-px h-8 bg-[#5e4120]" />
                  <div className="text-right">
                    <div className="text-[10px] text-[#a89070]">Üye / Kontenjan</div>
                    <div className="text-sm font-mono font-bold text-[#ffd700]">
                      {capacityInfo.currentMembersCount} / {capacityInfo.totalCapacity}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* 2. BİRLİK ÜYELERİ SEKMESİ                                        */}
          {/* ================================================================ */}
          {activeSubTab === 'members' && (
            <div className="space-y-4">
              
              {/* Kapasite Özet Kartı */}
              <div className="p-3.5 bg-[#190f07] rounded-xl border border-[#7d5628] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[#f7e4b5] text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    Divan Heyeti ({capacityInfo.currentMembersCount} / {capacityInfo.totalCapacity} Bey)
                  </h4>
                  <p className="text-[11px] text-[#decab0]">
                    Tüzük Tabanı: {BASE_ALLIANCE_CAPACITY} + Okul Bonusu ({capacityInfo.totalSchoolLevels} seviye × 3 = +{capacityInfo.schoolBonusCapacity})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    capacityInfo.isFull 
                      ? 'bg-red-950 text-red-300 border-red-800' 
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {capacityInfo.isFull ? 'Kontenjan Dolu' : `${capacityInfo.remainingSlots} Boş Kontenjan`}
                  </span>
                </div>
              </div>

              {/* Üye Listesi */}
              <div className="space-y-2">
                {alliance.members.map((member) => {
                  const fDef = FACTIONS[member.faction];
                  const isLeader = member.role === 'leader';
                  const isCurrentPlayer = member.id === 'player_main';

                  return (
                    <div
                      key={member.id}
                      className="p-3 bg-[#170e06] border border-[#523517] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-[#8f6834] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8f2a1c] to-[#450e07] border border-[#f5d78a] flex items-center justify-center text-sm shadow">
                          {fDef?.crestIcon || '🏹'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#f7e4b5] text-xs">{member.name}</span>
                            {isCurrentPlayer && (
                              <span className="bg-amber-900/60 border border-amber-600 text-amber-200 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                Siz
                              </span>
                            )}
                            <span className="text-[10px] text-[#a89070]">
                              ({fDef?.name || member.faction})
                            </span>
                          </div>
                          <div className="text-[10px] text-[#decab0] flex items-center gap-3 mt-0.5">
                            <span>Köy Sayısı: <strong className="font-mono text-amber-300">{member.totalVillages}</strong></span>
                            <span>•</span>
                            <span>Okul Seviyeleri: <strong className="font-mono text-emerald-400">+{member.schoolLevels}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {/* Zafer Mabedi Durumu */}
                        <div className="text-right">
                          <div className="text-[9px] text-[#a89070]">Zafer Mabedi</div>
                          <div className={`text-xs font-mono font-bold ${
                            member.umaykutLevel >= 10 ? 'text-[#ffd700]' : 'text-amber-400'
                          }`}>
                            {member.umaykutLevel >= 10 ? 'Seviye 10 (Mühürlü)' : `Seviye ${member.umaykutLevel || 0}/10`}
                          </div>
                        </div>

                        {/* İhraç Butonu */}
                        {!isLeader && !isCurrentPlayer && (
                          <button
                            onClick={() => handleKickMember(member.id)}
                            className="px-2 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded text-[10px] transition cursor-pointer"
                          >
                            İhraç Et
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* 3. YENİ BEY KATILIMI (RECRUIT) SEKMESİ                            */}
          {/* ================================================================ */}
          {activeSubTab === 'recruit' && (
            <div className="space-y-4">
              
              {/* Kapasite ve Okul Şartı Açıklaması */}
              <div className="p-3.5 bg-[#1f1307] rounded-xl border border-[#8a602c] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#f7e4b5] text-xs flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    Yeni İttifak Üyesi Kabulü (Birlik Kapasitesi)
                  </h4>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    capacityInfo.isFull 
                      ? 'bg-red-950 text-red-300 border-red-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {capacityInfo.currentMembersCount} / {capacityInfo.totalCapacity} Üye
                  </span>
                </div>
                <p className="text-[11px] text-[#decab0]">
                  Yeni bir beyi birliğinize davet edebilmeniz için birliğin azami üye kontenjanının boş olması gerekir.
                  Kontenjan dolduğunda, mevcut üyelerinizin <strong>Okul (Medrese)</strong> binalarını yükselterek kapasite açabilirsiniz.
                </p>

                {capacityInfo.isFull && (
                  <div className="p-2.5 bg-red-950/80 border border-red-800 rounded text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Kontenjan Dolu:</strong> Şu anda yeni üye kabul edilemez! Yeni kontenjan açmak için Okul binasını yükseltiniz (+3 kontenjan/seviye).
                    </span>
                  </div>
                )}
              </div>

              {/* Katılım Bekleyen Aday Beyler */}
              <div>
                <h4 className="text-xs font-bold text-[#decab0] uppercase tracking-wider mb-2">
                  İttifaka Katılmak İsteyen Anadolu Beyleri
                </h4>

                <div className="space-y-2">
                  {RECRUITABLE_CANDIDATES.map((cand) => {
                    const fDef = FACTIONS[cand.faction];
                    const isAlreadyMember = alliance.members.some(m => m.id === cand.id);

                    return (
                      <div
                        key={cand.id}
                        className="p-3 bg-[#170e06] border border-[#523517] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8f2a1c] to-[#450e07] border border-[#f5d78a] flex items-center justify-center text-base shadow">
                            {fDef?.crestIcon || '🏹'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#f7e4b5] text-xs">{cand.name}</span>
                              <span className="text-[10px] text-amber-300">({fDef?.name})</span>
                            </div>
                            <div className="text-[10px] text-[#decab0] flex items-center gap-2 mt-0.5">
                              <span>10/{cand.totalVillages} Köy</span>
                              <span>•</span>
                              <span>Okul: <strong>+{cand.schoolLevels}</strong></span>
                              <span>•</span>
                              <span>Mabet Seviyesi: <strong>{cand.umaykutLevel}/10</strong></span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isAlreadyMember ? (
                            <span className="text-stone-500 text-xs font-bold">✓ Halihazırda Üye</span>
                          ) : (
                            <button
                              disabled={capacityInfo.isFull}
                              onClick={() => handleRecruit(cand)}
                              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                                capacityInfo.isFull
                                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-115 text-white shadow'
                              }`}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Birliğe Kabul Et</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ALT BİLGİ DİVANI */}
        <div className="p-3 bg-[#140b04] border-t-2 border-[#5e4120] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#decab0]">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">📜</span>
            <span>Resmî İttifak Yasası: 3 Farklı Beylik × 10. Seviye Zafer Mabetleri</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBuildingModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBuildingModal('umaykut');
                }}
                className="px-3 py-1 bg-[#3d2410] hover:bg-[#5a3418] border border-[#a87c3e] text-[#ffd700] rounded font-bold transition cursor-pointer"
              >
                🏛️ Zafer Mabedini Aç
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ================================================================ */}
      {/* 4. ŞAMPİYON BİRLİK İLANI & ALTIN VARAKLI TUĞRA MODALI            */}
      {/* ================================================================ */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-lg animate-fade-in" style={{ zIndex: 10000 }}>
          <div className="relative bg-gradient-to-b from-[#3d2208] via-[#241303] to-[#120701] border-4 border-[#ffd700] rounded-2xl w-full max-w-2xl p-6 text-center text-[#fff6d6] shadow-[0_0_80px_rgba(255,215,0,0.6)] animate-scale-up font-serif">
            
            {/* Altın Parıltı Efekti */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ffd700]/15 via-transparent to-transparent" />
            
            {/* Altın Tuğra İkonu */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#ffd700] via-[#b8860b] to-[#78350f] border-4 border-[#fffbeb] flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(255,215,0,0.8)] animate-pulse">
              👑
            </div>

            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-[#ffd700] font-black">
                MÜBAREK ZAFER FERMANIDIR
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#ffd700] mt-1 font-serif drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                CİHAN HÂKİMİYETİ İLAN EDİLMİŞTİR!
              </h2>
              <div className="w-48 h-0.5 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent mx-auto my-3" />
            </div>

            {/* İttifak Şampiyonluk Ferman Metni */}
            <div className="p-4 bg-[#140b03]/90 rounded-xl border-2 border-[#b8860b] text-xs sm:text-sm text-[#fef3c7] leading-relaxed my-4 space-y-2 shadow-inner">
              <p className="font-bold text-base text-amber-200">
                "{alliance.name} [{alliance.tag}] İttifakı, 10. Seviye Zafer mabetlerini tamamlayarak cihan hâkimiyetini ilan etmiştir!"
              </p>
              <p className="text-xs text-[#d1b894]">
                Anadolu topraklarındaki 3 farklı ulu beyliğin kutlu beyleri el ele vererek Zafer mabetlerini göğe yükseltmiş, çağı zaferle noktalamışlardır.
              </p>
            </div>

            {/* Mühürlü Beyliklerin Listesi */}
            <div className="grid grid-cols-3 gap-2 my-4">
              {victoryResult.qualifiedMembers.slice(0, 3).map((m) => (
                <div key={m.userId} className="bg-[#1f1205] border border-[#ffd700]/60 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-amber-400 font-bold">{FACTIONS[m.faction]?.name}</div>
                  <div className="text-xs font-black text-[#fffbeb]">{m.userName}</div>
                  <div className="text-[9px] text-emerald-400 font-mono mt-0.5">Seviye 10 Mabet ✓</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCelebrationModal(false)}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#b8860b] text-stone-950 font-black text-sm hover:brightness-110 shadow-[0_4px_15px_rgba(255,215,0,0.5)] cursor-pointer transition"
            >
              Fermanı Tasdik Et ve Kapat
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
