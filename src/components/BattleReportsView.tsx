import React, { useState, useMemo } from 'react';
import { BattleReport, UnitType } from '../types/game';
import { FACTIONS, UNITS } from '../data/gameData';
import { ResourceIcon } from './ResourceIcon';
import { UnitPortrait } from './UnitPortrait';
import { 
  ScrollText, 
  Trash2, 
  Clock,
  Eye,
  ShieldAlert,
  Castle,
  Shield,
  Users,
  Swords,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock
} from 'lucide-react';

interface BattleReportsViewProps {
  reports: BattleReport[];
  onClearReports: () => void;
  onDeleteReport?: (id: string) => void;
}

export const BattleReportsView: React.FC<BattleReportsViewProps> = ({
  reports,
  onClearReports,
  onDeleteReport,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );
  const [filterType, setFilterType] = useState<'all' | 'attack' | 'raid' | 'support' | 'spy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Tekilleştirilmiş Raporlar (Aynı ID'ye sahip mükerrer kayıtları engelleme)
  const uniqueReports = useMemo(() => {
    const seen = new Set<string>();
    return reports.filter(r => {
      if (!r || !r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [reports]);

  // Filtrelenmiş Raporlar
  const filteredReports = useMemo(() => {
    return uniqueReports.filter(r => {
      // Görev Tipi Filtresi
      if (filterType !== 'all' && r.mission !== filterType) {
        return false;
      }
      // Arama Filtresi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.attackerVillageName.toLowerCase().includes(q) ||
          r.defenderVillageName.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [uniqueReports, filterType, searchQuery]);

  // Seçili Rapor
  const selectedReport = useMemo(() => {
    if (selectedReportId) {
      const found = uniqueReports.find(r => r.id === selectedReportId);
      if (found) return found;
    }
    return filteredReports[0] || uniqueReports[0] || null;
  }, [uniqueReports, selectedReportId, filteredReports]);

  // Ordu Birlikleri ve Zayiat Listesi Render Fonksiyonu
  const renderTroopList = (casualties: any, side: 'attacker' | 'defender') => {
    const allKeys = Array.from(new Set([
      ...Object.keys(casualties.unitsBefore || {}),
      ...Object.keys(casualties.unitsLost || {}),
    ])) as UnitType[];

    if (allKeys.length === 0) {
      return (
        <div className="p-4 text-center text-[#a89070] italic text-xs font-serif bg-[#120a05] rounded-xl border border-[#3d2714]">
          Meydanda {side === 'attacker' ? 'taarruz' : 'savunma'} askeri bulunmuyordu.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2">
        {allKeys.map(uType => {
          const before = Number(casualties.unitsBefore?.[uType]) || 0;
          const lost = Number(casualties.unitsLost?.[uType]) || 0;
          const remaining = Number(casualties.unitsRemaining?.[uType]) || Math.max(0, before - lost);
          const uDef = UNITS[uType];

          return (
            <div 
              key={uType}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#170c06] via-[#1a0f07] to-[#120803] border border-[#5a381c] text-xs font-serif hover:border-amber-500/80 transition-all shadow-md group"
            >
              {/* Sol: Asker Portresi ve İsim Bilgileri */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-amber-600/70 bg-[#080402] overflow-hidden shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center group-hover:border-amber-400 transition-colors">
                  <UnitPortrait 
                    unitId={uType} 
                    size="custom" 
                    className="w-full h-full object-cover" 
                    showModalOnClick={true} 
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[#fef08a] text-xs sm:text-sm block truncate group-hover:text-amber-300 transition-colors">
                    {uDef?.name || uType}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#decab0]">
                    <span className="capitalize px-1.5 py-0.2 bg-[#2a170a] rounded border border-[#523318] text-amber-200">
                      {uDef?.category || 'Birlik'}
                    </span>
                    <span className="font-mono text-[#a89070]">
                      Mevcut: <strong className="text-amber-300">{before}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Sağ: Kayıp ve Kalan Asker Sayacı */}
              <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs shrink-0">
                {lost > 0 ? (
                  <div className="text-right bg-red-950/70 px-2 py-1 rounded-lg border border-red-800">
                    <span className="text-[9px] text-red-300 block font-serif leading-none">Kayıp</span>
                    <strong className="text-red-400 font-black text-xs sm:text-sm">-{lost}</strong>
                  </div>
                ) : (
                  <div className="text-right bg-emerald-950/50 px-2 py-1 rounded-lg border border-emerald-800/60">
                    <span className="text-[9px] text-emerald-300 block font-serif leading-none">Kayıp</span>
                    <strong className="text-emerald-400 text-xs sm:text-sm">0</strong>
                  </div>
                )}
                
                <div className="text-right bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-700/70">
                  <span className="text-[9px] text-amber-300 block font-serif leading-none">Kalan</span>
                  <strong className="text-amber-200 font-black text-xs sm:text-sm">{remaining}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Casusluk / İstihbarat Raporu
  const renderSpyReport = (report: BattleReport) => {
    const isSuccess = report.attackerResult === 'victory';
    const defenderUnits = report.defenderCasualties?.unitsBefore || {};
    const totalEnemyTroops = Object.values(defenderUnits).reduce<number>((a, b) => a + (Number(b) || 0), 0);
    const scoutedRes = report.scoutedResources;
    const scoutedBuildings = report.scoutedBuildings;
    const isDetected = report.detected;

    return (
      <div className="space-y-3.5">
        {/* Casus Durum Bildirimi */}
        {!isSuccess ? (
          <div className="bg-red-950/80 text-red-200 border-2 border-red-600 p-3 rounded-xl font-serif text-center font-bold shadow-lg">
            🚨 Casuslarımız düşman muhafızlarınca fark edildi ve imha edildi! İstihbarat toplanamadı.
          </div>
        ) : isDetected ? (
          <div className="bg-amber-950/80 text-amber-200 border-2 border-amber-500 p-2.5 rounded-xl font-serif text-center text-xs font-bold shadow-md">
            ⚠️ Casuslarımız bilgileri başarıyla sızdırdı ancak düşman nöbetçileri sızmayı son anda fark etti!
          </div>
        ) : (
          <div className="bg-purple-950/80 text-purple-200 border-2 border-purple-500 p-2.5 rounded-xl font-serif text-center text-xs font-bold shadow-md">
            👁️ Kusursuz Casusluk: Casuslarımız düşmana görünmeden tüm askeri ve iktisadi sırları sızdırdı!
          </div>
        )}

        {/* 3 Temel İstihbarat Kartı */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="bg-[#140b05] border border-[#52371e] p-2.5 rounded-xl text-center shadow-md">
            <Castle className="w-4 h-4 mx-auto text-amber-400 mb-0.5" />
            <div className="text-[10px] text-[#a89070] uppercase font-bold font-serif">Tespit Edilen Sur</div>
            <div className="font-mono text-sm font-black text-amber-300 mt-0.5">
              Seviye {report.initialWallLevel || 0}
            </div>
          </div>
          
          <div className="bg-[#140b05] border border-[#52371e] p-2.5 rounded-xl text-center shadow-md">
            <Eye className="w-4 h-4 mx-auto text-purple-400 mb-0.5" />
            <div className="text-[10px] text-[#a89070] uppercase font-bold font-serif">Ambar Durumu</div>
            <div className="font-mono text-sm font-black text-purple-300 mt-0.5">
              {scoutedRes ? 'Ayrıntılı Tespit Edildi' : 'Dolu & Yağmaya Müsait'}
            </div>
          </div>
          
          <div className="bg-[#140b05] border border-[#52371e] p-2.5 rounded-xl text-center shadow-md">
            <ShieldAlert className="w-4 h-4 mx-auto text-red-400 mb-0.5" />
            <div className="text-[10px] text-[#a89070] uppercase font-bold font-serif">Garnizon Askeri</div>
            <div className="font-mono text-sm font-black text-red-400 mt-0.5">
              {totalEnemyTroops.toLocaleString('tr-TR')} Asker
            </div>
          </div>
        </div>

        {/* Tespit Edilen Hammaddeler */}
        {isSuccess && scoutedRes && (
          <div className="bg-[#190e07] border border-[#5a3a20] rounded-xl p-3 shadow-md">
            <h4 className="font-serif font-bold text-amber-300 border-b border-[#472f18] pb-1.5 mb-2.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>İstihbarat: Hedef Otağdaki Hammadde Stokları</span>
              </span>
              <span className="font-mono text-[10px] text-[#a89070]">Yağmaya Açık</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {['wood', 'stone', 'iron', 'grain', 'gold'].map((res) => {
                const amount = (scoutedRes as any)[res] || 0;
                return (
                  <div key={res} className="bg-[#0e0703] border border-[#422915] rounded-xl p-1.5 flex items-center gap-2">
                    <ResourceIcon type={res as any} size="sm" />
                    <div>
                      <div className="text-[9px] text-[#a89070] capitalize font-serif">{res}</div>
                      <div className="font-mono font-black text-xs text-[#fef08a]">{amount.toLocaleString('tr-TR')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tespit Edilen Binalar */}
        {isSuccess && scoutedBuildings && Object.keys(scoutedBuildings).length > 0 && (
          <div className="bg-[#190e07] border border-[#5a3a20] rounded-xl p-3 shadow-md">
            <h4 className="font-serif font-bold text-amber-300 border-b border-[#472f18] pb-1.5 mb-2 text-xs flex items-center gap-1.5">
              <Castle className="w-4 h-4 text-amber-400" />
              <span>İstihbarat: Hedef Otağdaki Bina Seviyeleri</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-serif">
              {Object.entries(scoutedBuildings).map(([bKey, lvl]) => (
                <div key={bKey} className="bg-[#0e0703] p-1.5 rounded-lg border border-[#3d2714] flex items-center justify-between">
                  <span className="text-[#decab0] capitalize truncate">{bKey}</span>
                  <span className="font-mono font-bold text-amber-300">Sv. {lvl}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="battle-reports-screen" className="max-w-6xl mx-auto space-y-2.5 pb-16 select-none text-[#eedec9] -mt-1 sm:-mt-2">
      
      {/* 1. ÜST KONTROL & BAŞLIK BARI - Daha Kompakt ve Yukarı Taşınmış */}
      <div className="bg-gradient-to-b from-[#2b180d] via-[#1a0f07] to-[#110904] border-2 border-[#80592f] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        
        {/* Sol: Başlık & Rozet */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-b from-[#85531d] to-[#3a200e] border border-[#f59e0b] flex items-center justify-center shadow-lg shrink-0">
            <ScrollText className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-serif font-black text-[#fef08a] drop-shadow leading-tight">
                Harp Fermanları & Savaş Raporları
              </h2>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-950 border border-amber-600 text-amber-300">
                {reports.length} Ferman
              </span>
            </div>
            <p className="text-[11px] text-[#bda688] font-serif leading-tight">
              Akın, taarruz, yağma ve casusluk seferlerinin divan zabıtları
            </p>
          </div>
        </div>

        {/* Sağ: Tümünü Temizle Butonu */}
        {reports.length > 0 && (
          <button
            onClick={onClearReports}
            className="px-3 py-1.5 rounded-xl bg-[#2e1208] hover:bg-[#4d1d0c] border border-rose-800/80 text-rose-300 hover:text-white font-serif font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tüm Fermanları Arşivle</span>
          </button>
        )}

      </div>

      {/* 2. FİLTRE VE ARAMA ŞERİDİ */}
      <div className="bg-[#1a0f07] border border-[#52371e] rounded-xl px-3 py-2 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
        
        {/* Filtre Butonları */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-serif font-bold transition shrink-0 cursor-pointer text-xs ${
              filterType === 'all'
                ? 'bg-amber-900/90 border border-amber-400 text-amber-100 shadow'
                : 'bg-[#120a05] border border-[#422a16] text-[#a89070] hover:text-[#decab0]'
            }`}
          >
            Tümü ({uniqueReports.length})
          </button>
          <button
            onClick={() => setFilterType('attack')}
            className={`px-2.5 py-1 rounded-lg font-serif font-bold transition shrink-0 cursor-pointer flex items-center gap-1 text-xs ${
              filterType === 'attack'
                ? 'bg-red-950 border border-red-500 text-red-200 shadow'
                : 'bg-[#120a05] border border-[#422a16] text-[#a89070] hover:text-[#decab0]'
            }`}
          >
            <span>⚔️ Taarruz</span>
          </button>
          <button
            onClick={() => setFilterType('raid')}
            className={`px-2.5 py-1 rounded-lg font-serif font-bold transition shrink-0 cursor-pointer flex items-center gap-1 text-xs ${
              filterType === 'raid'
                ? 'bg-amber-950 border border-amber-500 text-amber-200 shadow'
                : 'bg-[#120a05] border border-[#422a16] text-[#a89070] hover:text-[#decab0]'
            }`}
          >
            <span>🏇 Yağma</span>
          </button>
          <button
            onClick={() => setFilterType('support')}
            className={`px-2.5 py-1 rounded-lg font-serif font-bold transition shrink-0 cursor-pointer flex items-center gap-1 text-xs ${
              filterType === 'support'
                ? 'bg-blue-950 border border-blue-500 text-blue-200 shadow'
                : 'bg-[#120a05] border border-[#422a16] text-[#a89070] hover:text-[#decab0]'
            }`}
          >
            <span>🛡️ Destek</span>
          </button>
          <button
            onClick={() => setFilterType('spy')}
            className={`px-2.5 py-1 rounded-lg font-serif font-bold transition shrink-0 cursor-pointer flex items-center gap-1 text-xs ${
              filterType === 'spy'
                ? 'bg-purple-950 border border-purple-500 text-purple-200 shadow'
                : 'bg-[#120a05] border border-[#422a16] text-[#a89070] hover:text-[#decab0]'
            }`}
          >
            <span>👁️ Casusluk</span>
          </button>
        </div>

        {/* Arama Kutusu */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-[#a89070] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Otağ veya rapor ara..."
            className="w-full bg-[#0d0704] border border-[#422a16] rounded-lg pl-7 pr-2.5 py-1 text-xs text-[#fef08a] placeholder-[#8c7457] outline-none focus:border-amber-400 font-serif"
          />
        </div>

      </div>

      {/* 3. ANA BÖLÜM: SOL LİSTE & SAĞ FERMAN DETAYI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        
        {/* Sol Kolon: Ferman Listesi */}
        <div className="lg:col-span-5 space-y-2 max-h-[calc(100vh-210px)] min-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredReports.map((rep) => {
            const isSelected = selectedReport && selectedReport.id === rep.id;
            const isVictory = rep.attackerResult === 'victory';
            const isDefeat = rep.attackerResult === 'defeat';

            const getMissionConfig = () => {
              switch(rep.mission) {
                case 'attack': return { icon: '⚔️', label: 'Taarruz', color: 'text-red-400 bg-red-950/60 border-red-800/80' };
                case 'raid': return { icon: '🏇', label: 'Yağma', color: 'text-amber-400 bg-amber-950/60 border-amber-800/80' };
                case 'support': return { icon: '🛡️', label: 'Destek', color: 'text-blue-400 bg-blue-950/60 border-blue-800/80' };
                case 'spy': return { icon: '👁️', label: 'Casusluk', color: 'text-purple-400 bg-purple-950/60 border-purple-800/80' };
                default: return { icon: '⚔️', label: 'Sefer', color: 'text-stone-400 bg-stone-900 border-stone-700' };
              }
            };
            const mCfg = getMissionConfig();

            // Toplam Ganimet Miktarı
            const totalLoot: number = rep.lootCarried 
              ? Object.values(rep.lootCarried).reduce<number>((a: number, b: unknown) => a + (Number(b) || 0), 0)
              : 0;

            // Savaşa katılan birliklerin listesi
            const attackerUnits = Object.entries(rep.attackerCasualties?.unitsBefore || {})
              .filter(([_, count]) => Number(count) > 0)
              .slice(0, 4);

            return (
              <div
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`group relative p-2.5 rounded-xl border transition cursor-pointer text-xs space-y-1.5 shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#3a200e] via-[#28150a] to-[#1c0d05] border-amber-400/90 ring-1 ring-amber-500/40 shadow-md'
                    : 'bg-[#150d06] border-[#3d2714] hover:border-[#694825] hover:bg-[#1a1008]'
                }`}
              >
                {/* Ana Başlık Satırı: Otağ İsimleri + Sonuç Rozeti */}
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <div className="font-serif font-bold text-xs text-[#fef08a] flex items-center gap-1.5 truncate">
                    <span className="truncate text-amber-200">{rep.attackerVillageName}</span>
                    <span className="text-amber-400 font-sans text-[10px] shrink-0">⚔️</span>
                    <span className="text-[#ebd7bf] truncate">{rep.defenderVillageName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isVictory ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px] font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Zafer</span>
                      </span>
                    ) : isDefeat ? (
                      <span className="text-red-400 flex items-center gap-1 font-mono text-[10px] font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/60">
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span>Hezimet</span>
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-mono text-[10px] font-bold bg-yellow-950/60 px-1.5 py-0.5 rounded border border-yellow-800/60">
                        Berabere
                      </span>
                    )}

                    {onDeleteReport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteReport(rep.id);
                        }}
                        title="Bu fermanı sil"
                        className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-red-900/60 text-[#a89070] hover:text-red-300 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Katılan Asker Görselleri Önizlemesi */}
                {attackerUnits.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {attackerUnits.map(([uType, count]) => (
                      <div 
                        key={uType} 
                        className="flex items-center gap-1 bg-[#0c0704] px-1.5 py-0.5 rounded-lg border border-[#4a2e16] text-[10px]"
                      >
                        <div className="w-4 h-4 rounded overflow-hidden shrink-0 border border-amber-600/50">
                          <UnitPortrait unitId={uType} size="custom" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-mono font-bold text-amber-300">{count}</span>
                      </div>
                    ))}
                    {Object.keys(rep.attackerCasualties?.unitsBefore || {}).length > 4 && (
                      <span className="text-[9px] font-mono text-[#a89070]">
                        +{Object.keys(rep.attackerCasualties?.unitsBefore || {}).length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Alt İstatistik & Saat Bilgisi */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#a89070] pt-1 border-t border-[#2e1c0d]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#8c7457]" />
                    <span>{new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {totalLoot > 0 && (
                      <span className="text-emerald-400 font-bold">
                        💰 +{totalLoot.toLocaleString('tr-TR')}
                      </span>
                    )}
                    {rep.damagedBuildings && rep.damagedBuildings.length > 0 && (
                      <span className="text-red-400 font-bold">
                        🏰 Hasar
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}

          {filteredReports.length === 0 && (
            <div className="p-8 text-center text-[#a89070] italic text-xs font-serif bg-[#120a05] rounded-2xl border border-[#422a16]">
              {reports.length === 0 ? 'Henüz divana sunulmuş bir harp fermanı yok.' : 'Arama kriterlerine uygun ferman bulunamadı.'}
            </div>
          )}
        </div>

        {/* Sağ Kolon: Detaylı Harp Fermanı */}
        <div className="lg:col-span-7">
          {selectedReport ? (() => {
            const isVictory = selectedReport.attackerResult === 'victory';
            const isDefeat = selectedReport.attackerResult === 'defeat';

            return (
              <div className="rounded-2xl bg-[#1e1208] border-2 border-[#805c31] p-3.5 sm:p-4 shadow-2xl space-y-3 max-h-[calc(100vh-210px)] min-h-[480px] overflow-y-auto custom-scrollbar">
                
                {/* 1. Ferman Başlığı & Otağ Karşılaşması */}
                <div className={`p-3 rounded-xl border-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-md ${
                  isVictory 
                    ? 'bg-gradient-to-r from-[#1e331b] via-[#122310] to-[#1e331b] border-emerald-500 text-emerald-100'
                    : isDefeat
                    ? 'bg-gradient-to-r from-[#3a1313] via-[#240a0a] to-[#3a1313] border-red-500 text-red-100'
                    : 'bg-gradient-to-r from-[#2c1d0f] to-[#170e08] border-amber-500 text-amber-100'
                }`}>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                      FERMAN PROTOKOLÜ • {new Date(selectedReport.timestamp).toLocaleString('tr-TR')}
                    </div>
                    <div className="font-serif font-black text-sm sm:text-base flex items-center gap-2 mt-0.5">
                      <span>{selectedReport.attackerVillageName}</span>
                      <span className="text-amber-400 font-sans text-xs">⚔️</span>
                      <span>{selectedReport.defenderVillageName}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#decab0]">
                      Hedef Koordinat: ({selectedReport.defenderCoords.x} | {selectedReport.defenderCoords.y})
                    </div>
                  </div>

                  <div className="shrink-0 text-center bg-black/40 px-3 py-1 rounded-xl border border-white/20">
                    <div className="text-[9px] font-serif uppercase font-bold text-amber-300">Netice</div>
                    <div className={`text-sm font-serif font-black ${
                      isVictory ? 'text-emerald-300' : isDefeat ? 'text-red-400' : 'text-yellow-300'
                    }`}>
                      {isVictory ? 'ŞANLI ZAFER 🏆' : isDefeat ? 'HEZİMET ⚔️' : 'YENİŞEMEDİ'}
                    </div>
                  </div>
                </div>

                {/* 2. Divan Zabıt Özeti (Alıntı) */}
                <div className="bg-[#120a05] border-l-4 border-amber-500 p-2.5 rounded-r-xl text-xs font-serif leading-relaxed text-[#f2e6d0] shadow-inner italic">
                  «{selectedReport.summary}»
                </div>

                {/* 3. Casusluk Raporu veya Normal Harp Raporu */}
                {selectedReport.mission === 'spy' ? (
                  renderSpyReport(selectedReport)
                ) : (
                  <div className="space-y-3">
                    
                    {/* Birlikler Tablosu: İki Kanat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      
                      {/* Kızıl Kanat (Saldıran Ordu) */}
                      <div className="bg-[#140b05] border border-red-900/60 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-red-900/40 pb-1">
                          <span className="font-serif font-bold text-xs text-red-300 flex items-center gap-1.5">
                            <Swords className="w-3.5 h-3.5 text-red-400" />
                            <span>Saldıran Ordu (Kızıl Kanat)</span>
                          </span>
                        </div>
                        {renderTroopList(selectedReport.attackerCasualties, 'attacker')}
                      </div>

                      {/* Demir Kanat (Savunan Garnizon) */}
                      <div className="bg-[#140b05] border border-blue-900/60 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between border-b border-blue-900/40 pb-1">
                          <span className="font-serif font-bold text-xs text-blue-300 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                            <span>Savunan Garnizon (Demir Kanat)</span>
                          </span>
                        </div>
                        {renderTroopList(selectedReport.defenderCasualties, 'defender')}
                      </div>

                    </div>

                    {/* Kuşatma & Mancınık Yıkım Raporu */}
                    {selectedReport.damagedBuildings && selectedReport.damagedBuildings.length > 0 && (
                      <div className="bg-[#241209] border-2 border-red-700/80 rounded-xl p-2.5 space-y-1.5 shadow-md">
                        <div className="font-serif font-bold text-xs text-red-300 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <span>Kuşatma ve Yıkım Raporu (Mancınık & Koçbaşı)</span>
                        </div>
                        <div className="space-y-1">
                          {selectedReport.damagedBuildings.map((db, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-[#140804] px-2.5 py-1 rounded-lg border border-[#4a2412] font-serif">
                              <span className="font-bold text-[#fde047] capitalize">
                                {db.buildingType === 'wall' ? 'Sur (Hisar Duvarı)' : db.buildingType === 'umaykut' ? 'Zafer Mabedi (Cihan Mabedi)' : db.buildingType}
                              </span>
                              <span className="font-mono text-red-400 font-bold">
                                Seviye {db.levelBefore} → <strong className="text-red-300 font-black">Seviye {db.levelAfter}</strong> ({db.destroyedLevels} Seviye Yıkıldı)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yağmalanan Ganimet Sandığı */}
                    {isVictory && Object.values(selectedReport.lootCarried || {}).some(v => Number(v) > 0) && (
                      <div className="bg-[#190e07] border-2 border-amber-600/70 rounded-xl p-3 shadow-md">
                        <div className="font-serif font-bold text-xs text-amber-300 text-center mb-2 flex items-center justify-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Beylik Hazinesine Aktarılan Ganimetler</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {['wood', 'stone', 'iron', 'grain', 'gold'].map((resType) => {
                            const amount = Number((selectedReport.lootCarried as any)[resType]) || 0;
                            if (amount === 0) return null;
                            return (
                              <div key={resType} className="bg-[#0e0703] border border-[#52371e] rounded-xl p-1.5 flex items-center gap-2">
                                <ResourceIcon type={resType as any} size="sm" />
                                <div>
                                  <div className="text-[9px] text-[#a89070] capitalize font-serif">{resType}</div>
                                  <div className="font-mono font-black text-xs text-emerald-300">+{amount.toLocaleString('tr-TR')}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Esir Köylü ve At Ganimeti */}
                    {((selectedReport.capturedVillagers && selectedReport.capturedVillagers > 0) || (selectedReport.capturedHorses && selectedReport.capturedHorses > 0)) && (
                      <div className="bg-[#190e07] border border-amber-700/60 rounded-xl p-2.5 flex flex-wrap items-center gap-2.5">
                        {selectedReport.capturedVillagers && selectedReport.capturedVillagers > 0 && (
                          <div className="flex items-center gap-2 bg-[#0e0703] px-2.5 py-1 rounded-lg border border-[#422915] text-xs font-serif">
                            <Users className="w-3.5 h-3.5 text-amber-400" />
                            <span>Esir Köylü: <strong className="font-mono text-amber-300">+{selectedReport.capturedVillagers}</strong></span>
                          </div>
                        )}
                        {selectedReport.capturedHorses && selectedReport.capturedHorses > 0 && (
                          <div className="flex items-center gap-2 bg-[#0e0703] px-2.5 py-1 rounded-lg border border-[#422915] text-xs font-serif">
                            <span className="text-xs">🐎</span>
                            <span>Safkan Bozkır Atı: <strong className="font-mono text-amber-300">+{selectedReport.capturedHorses}</strong></span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sığınak Koruması Bilgisi */}
                    {((selectedReport.savedByHideout && selectedReport.savedByHideout > 0) || (selectedReport.hideoutProtection && selectedReport.hideoutProtection > 0)) && (
                      <div className="bg-[#0a2318] border border-emerald-700 rounded-xl p-2.5 flex items-center justify-between text-xs font-serif text-emerald-200">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Gizli sığınak mahzenleri sayesinde hazinenin önemli bir kısmı korundu.</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-emerald-600/60 shrink-0 ml-2">
                          🔒 Korundu
                        </span>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })() : (
            <div className="p-10 text-center text-[#a89070] italic text-xs bg-[#170e08] rounded-2xl border-2 border-[#52371e]">
              İncelemek için sol menüden bir harp fermanı seçiniz.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
