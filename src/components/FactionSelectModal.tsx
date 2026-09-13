import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface FactionSelectModalProps {
  currentFaction: FactionId;
  onSelectFaction: (factionId: FactionId, playerName?: string) => void;
  onClose: () => void;
  isMandatory?: boolean;
}

export const FactionSelectModal: React.FC<FactionSelectModalProps> = ({
  currentFaction,
  onSelectFaction,
  onClose,
  isMandatory = false,
}) => {
  const initialKey = normalizeFactionKey(currentFaction);
  const [selectedKey, setSelectedKey] = useState<FactionKey>(initialKey);
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('beylikler_player_name') || 'Alp Arslan';
  });
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const selectedBeylik: BeylikDefinition = BEYLIKLER[selectedKey] || BEYLIKLER.osmanogullari;
  const isCurrentlyActive = normalizeFactionKey(currentFaction) === selectedKey;

  const handleConfirmChoice = () => {
    const finalName = playerName.trim() || 'Alp Arslan';
    localStorage.setItem('beylikler_player_name', finalName);

    if (isMandatory && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    onSelectFaction(selectedKey, finalName);
  };

  return (
    <div 
      id="faction-select-modal-overlay"
      className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
    >
      {/* Modal Çerçevesi (13. Yüzyıl Selçuklu & Beylikler Ahşap-Altın Sandığı) */}
      <div 
        id="faction-select-modal-container"
        className="relative w-full max-w-5xl bg-[#140e08] border-2 border-[#b8860b]/80 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95),inset_0_1px_3px_rgba(255,215,0,0.3)] overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]"
      >
        {/* Üst Başlık Barı (Pirinç Kabartma Çerçeve) */}
        <div 
          id="faction-modal-header"
          className="shrink-0 relative bg-gradient-to-r from-[#2a1708] via-[#4a2e12] to-[#2a1708] border-b-2 border-[#b8860b] px-4 py-3 flex items-center justify-between shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#ffd700] to-[#b8860b] p-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.6)] flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-[#2a1708]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-serif font-black tracking-wide text-[#fce8b3] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                {isMandatory ? 'BEYLİĞİNİ SEÇ VE AND İÇ' : '13. YÜZYIL ANADOLU BEYLİKLERİ VE SANCAK SEÇİMİ'}
              </h2>
              <p className="text-[11px] text-[#deb887] font-sans line-clamp-1 sm:line-clamp-none">
                Beyliğinizi seçin; özel elit biriminizi ve kalıcı beylik bonuslarınızı savaşa sürün.
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              id="close-faction-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#2a1708] hover:bg-[#5c1c1c] border border-[#b8860b]/60 text-[#fce8b3] flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-inner shrink-0"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 5 Beylik Seçim Sekmeleri (Yatay Kart Şeridi) */}
        <div 
          id="faction-tabs-list"
          className="shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 sm:p-3 bg-[#0d0905] border-b border-[#3d2817] overflow-x-auto"
        >
          {BEYLIK_LIST.map((beylik) => {
            const isSelected = beylik.id === selectedKey;
            const isUserCurrent = normalizeFactionKey(currentFaction) === beylik.id;

            return (
              <button
                key={beylik.id}
                id={`faction-tab-${beylik.id}`}
                onClick={() => setSelectedKey(beylik.id)}
                className={`relative group p-2.5 rounded-xl border text-left transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#382310] to-[#1e1208] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.2)] ring-1 ring-[#ffd700]/50'
                    : 'bg-[#181109] border-[#4a3520]/60 hover:border-[#b8860b]/60 hover:bg-[#24180d]'
                }`}
              >
                {/* Sol Üst Beylik Bayrağı & Sancak İkonu */}
                <div className="flex items-center justify-between mb-1.5 gap-1.5">
                  <div className="relative w-10 h-6 rounded-md overflow-hidden border border-[#b8860b]/70 shadow-sm shrink-0 bg-black/50">
                    <img 
                      src={beylik.flagImage} 
                      alt={`${beylik.name} Bayrağı`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {isUserCurrent ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/50">
                      Mevcut
                    </span>
                  ) : (
                    <span className="text-sm">{beylik.crestIcon}</span>
                  )}
                </div>

                <div>
                  <h3 className={`text-xs font-serif font-black tracking-tight ${isSelected ? 'text-[#ffd700]' : 'text-[#e6c994]'}`}>
                    {beylik.shortName}
                  </h3>
                  <div className="text-[10px] text-[#a89078] font-sans truncate">
                    {beylik.unit.name}
                  </div>
                </div>

                {/* Alt Bonus Rozeti */}
                <div className="mt-2 pt-1.5 border-t border-[#3d2817] flex items-center justify-between text-[10px] font-semibold text-[#f0caa0]">
                  <span className="truncate">{beylik.bonus.summary}</span>
                </div>

                {/* Seçili Işıltı Efekti */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-2 h-2 rounded-bl-md bg-[#ffd700]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Seçili Beylik Detay Alanı */}
        <div 
          id="faction-detail-content"
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-gradient-to-b from-[#140e08] via-[#100b06] to-[#0c0804] custom-scrollbar"
        >
          {/* Sol Kolon: Özel Elit Birim Kartı (webp Görseli ile) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="relative rounded-2xl bg-[#1c130b] border-2 border-[#b8860b]/70 overflow-hidden shadow-2xl flex flex-col">
              {/* Birim Başlığı */}
              <div className="bg-gradient-to-r from-[#3d230e] to-[#241508] px-3.5 py-2.5 border-b border-[#b8860b]/50 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#deb887] font-sans font-bold">
                    Özel Beylik Birimi
                  </div>
                  <div className="text-sm sm:text-base font-serif font-black text-[#ffd700]">
                    {selectedBeylik.unit.name}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40 capitalize">
                  {selectedBeylik.unit.category}
                </span>
              </div>

              {/* Birim Resmi (webp Portresi) */}
              <div className="relative w-full aspect-square bg-[#0b0805] overflow-hidden flex items-center justify-center group">
                <img 
                  src={selectedBeylik.unit.image} 
                  alt={selectedBeylik.unit.name}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to stylized SVG portrait if image missing
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Alt Gradient Gölgesi */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c130b] via-transparent to-transparent pointer-events-none" />

                {/* Birim Rolü Rozeti */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-sm border border-[#b8860b]/40 rounded-lg p-2 text-center">
                  <div className="text-[11px] font-serif font-bold text-[#fce8b3]">
                    {selectedBeylik.unit.role}
                  </div>
                </div>
              </div>

              {/* Birim İstatistik Değerleri - 4 Ana Unsur Sistemi (Toplam 300 Puan) */}
              <div className="p-2.5 bg-[#170f08] border-t border-[#3d2817] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-serif font-bold text-[#deb887]">
                  <span>4 Ana Muharebe Unsuru</span>
                  <span className="text-[#ffd700] font-mono font-black bg-[#2a1708] px-2 py-0.5 rounded border border-[#b8860b]/40">
                    ⭐ Toplam {selectedBeylik.unit.totalPoints || 300} Puan
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  <div className="p-1 rounded-lg bg-[#24180d] border border-[#4a3520]">
                    <div className="text-[9px] text-[#998066]">Piyade Sal.</div>
                    <div className="text-xs font-black text-red-400 font-mono">
                      {selectedBeylik.unit.attackInfantry}
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-[#24180d] border border-[#4a3520]">
                    <div className="text-[9px] text-[#998066]">Süvari Sal.</div>
                    <div className="text-xs font-black text-orange-400 font-mono">
                      {selectedBeylik.unit.attackCavalry}
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-[#24180d] border border-[#4a3520]">
                    <div className="text-[9px] text-[#998066]">Piyade Sav.</div>
                    <div className="text-xs font-black text-blue-400 font-mono">
                      {selectedBeylik.unit.baseDefenseInfantry}
                    </div>
                  </div>
                  <div className="p-1 rounded-lg bg-[#24180d] border border-[#4a3520]">
                    <div className="text-[9px] text-[#998066]">Süvari Sav.</div>
                    <div className="text-xs font-black text-emerald-400 font-mono">
                      {selectedBeylik.unit.baseDefenseCavalry}
                    </div>
                  </div>
                </div>
              </div>

              {/* Birim Açıklaması */}
              <div className="px-3.5 py-2.5 bg-[#120c06] text-[11px] text-[#c7af93] font-sans leading-relaxed border-t border-[#291b0f]">
                {selectedBeylik.unit.description}
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Oyuncu/Lider Adı, Beylik Tanıtımı ve Stratejik Bonuslar */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Oyuncu & Lider Adı Belirleme Kartı */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#2a1708] via-[#1d1106] to-[#2a1708] border-2 border-[#b8860b]/70 shadow-lg">
              <label className="text-xs font-serif font-bold text-[#ffd700] flex items-center gap-2 mb-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Oyuncu & Hükümdar Adınız:</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={playerName}
                  maxLength={24}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Örn: Alp Arslan"
                  className="flex-1 bg-[#0c0703] border-2 border-[#5a3e20] focus:border-[#ffd700] rounded-xl px-3.5 py-2 text-sm font-serif font-bold text-[#fef08a] outline-none shadow-inner transition"
                />
                <span className="text-[11px] text-[#deb887] font-sans self-center sm:self-auto bg-[#1a0f07] px-2.5 py-1.5 rounded-lg border border-[#4a3520]">
                  Otomatik Hakan & Lideriniz Olur
                </span>
              </div>
            </div>

            {/* Beylik Kimlik Parşömeni */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#24160a] via-[#1d1208] to-[#24160a] border border-[#8c6721]/60 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4a3520] pb-3 mb-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-11 sm:w-20 sm:h-13 rounded-xl overflow-hidden border-2 border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)] bg-black/60 shrink-0">
                    <img 
                      src={selectedBeylik.flagImage} 
                      alt={`${selectedBeylik.name} Sancak Bayrağı`}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-serif font-black text-[#ffd700] tracking-wide">
                        {selectedBeylik.name}
                      </h3>
                      <span className="text-sm">{selectedBeylik.crestIcon}</span>
                    </div>
                    <p className="text-xs text-[#deb887] font-sans">
                      {selectedBeylik.title}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#d1baa0] leading-relaxed font-sans">
                {selectedBeylik.description}
              </p>
            </div>

            {/* Beylik Özel Bonusları (Büyük Vurgu Kutusu) */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#2b1b0e] to-[#170e06] border-2 border-[#d4af37] shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#5c3e1e] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ffd700]" />
                  <span className="text-sm font-serif font-black text-[#ffd700] uppercase tracking-wider">
                    Kalıcı Stratejik Beylik Bonusları
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-serif font-bold bg-[#ffd700] text-[#241508] shadow-md">
                  {selectedBeylik.bonus.badge}
                </span>
              </div>

              {/* Bonus Maddeleri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {selectedBeylik.bonus.details.map((detail, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-[#1c1106] border border-[#8c6721]/50 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#ffd700]/20 text-[#ffd700] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-[11px] text-[#fce8b3] leading-snug font-sans">
                        {detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5 Beyliğin Karşılaştırmalı Strateji Özeti */}
            <div className="p-3.5 rounded-xl bg-[#120b06] border border-[#3d2817] text-[11px] text-[#a89078] leading-relaxed">
              <strong className="text-[#deb887] font-serif block mb-1">
                ⚖️ 13. Yüzyıl Anadolu Muharebe Doktrinleri:
              </strong>
              Karaman ve Candar saldırı ağırlıklı taarruz ve kuşatma kudretiyle; Germiyan ve Dulkadir savunma ağırlıklı aşılmaz hisar, sur ve yayla müdafaasıyla; Osman ise hem saldırıda hem savunmada orta ayarda dengeli ordu yapısı ve hızlı sefer intikaliyle öne çıkar.
            </div>
          </div>
        </div>

        {/* Alt Aksiyon & Onay Barı */}
        <div 
          id="faction-modal-footer"
          className="shrink-0 bg-gradient-to-r from-[#1c1208] via-[#2a1b0d] to-[#1c1208] border-t-2 border-[#b8860b]/60 px-4 sm:px-5 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl"
        >
          {showConfirm ? (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 bg-red-950/40 p-2 rounded-lg border border-red-900/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse shrink-0" />
                <div>
                  <h4 className="text-red-400 font-bold text-sm">Son Kararınız Mı?</h4>
                  <p className="text-red-200/80 text-[11px]">Dikkat: Seçtiğin beylik sancağı kaderini belirler ve bir daha <strong>asla değiştirilemez!</strong></p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-bold transition-all cursor-pointer"
                >
                  İptal Et
                </button>
                <button
                  onClick={handleConfirmChoice}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-xs font-black tracking-wide border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all cursor-pointer"
                >
                  And İç ve Beyliğini Kur
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-xs text-[#deb887]">
                <div className="w-8 h-5 rounded overflow-hidden border border-[#ffd700]/70 shadow-sm bg-black/50 shrink-0">
                  <img 
                    src={selectedBeylik.flagImage} 
                    alt={`${selectedBeylik.name} Bayrağı`} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span>
                  Seçilen Sancak: <strong className="text-[#ffd700]">{selectedBeylik.name}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {!isMandatory && (
                  <button
                    id="cancel-faction-select-btn"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-[#24180d] hover:bg-[#332212] border border-[#5c4026] text-[#deb887] text-xs font-bold transition-all cursor-pointer"
                  >
                    Vazgeç
                  </button>
                )}

                <button
                  id="confirm-faction-select-btn"
                  onClick={handleConfirmChoice}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-serif font-black tracking-wide transition-all duration-200 flex items-center gap-2 shadow-lg cursor-pointer ${
                    isCurrentlyActive
                      ? 'bg-[#2b2014] text-[#998066] border border-[#5c4026] cursor-default'
                      : 'bg-gradient-to-r from-[#ffd700] via-[#f59e0b] to-[#d97706] hover:from-[#ffe066] hover:to-[#f59e0b] text-[#241508] border border-[#fff59d] hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.35)]'
                  }`}
                >
                  {isCurrentlyActive ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Mevcut Sancağınız Bu
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      {isMandatory ? 'Bu Sancağa Biat Et' : 'Bu Sancağa Biat Et (Seç)'}
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
