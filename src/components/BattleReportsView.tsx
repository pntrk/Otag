import React, { useState } from 'react';
import { BattleReport, UnitType } from '../types/game';
import { FACTIONS, UNITS, UNIT_IMAGE_MAP } from '../data/gameData';
import { ResourceIcon } from './ResourceIcon';
import { 
  ScrollText, 
  Trash2, 
  Clock,
  Eye,
  ShieldAlert,
  Castle,
  Shield,
  Users,
  Flame,
  Swords
} from 'lucide-react';

interface BattleReportsViewProps {
  reports: BattleReport[];
  onClearReports: () => void;
}

export const BattleReportsView: React.FC<BattleReportsViewProps> = ({
  reports,
  onClearReports,
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

  function renderTroopTrays(casualties: any) {
    const allKeys = Array.from(new Set([
      ...Object.keys(casualties.unitsBefore || {}),
      ...Object.keys(casualties.unitsLost || {}),
    ])) as UnitType[];

    if (allKeys.length === 0) {
      return (
        <div className="p-3 text-center text-[#9c8265] italic text-xs font-serif">
          Meydanda ordu bulunmuyordu.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {allKeys.map(uType => {
          const before = casualties.unitsBefore?.[uType] || 0;
          const lost = casualties.unitsLost?.[uType] || 0;
          const remaining = casualties.unitsRemaining?.[uType] || 0;
          const uDef = UNITS[uType];

          return (
            <div 
              key={uType}
              className="flex items-center justify-between p-2 rounded-lg bg-[#e8deca] border border-[#c6b497] text-xs font-serif"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border border-[#b58b4c] bg-[#1a1008] p-0.5 overflow-hidden shrink-0">
                  <img 
                    src={uDef?.image || UNIT_IMAGE_MAP[uType as UnitType] || `/drawable/${uType}.webp`} 
                    alt={uDef?.name || uType} 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <span className="font-bold text-[#3d2612] text-xs block">{uDef?.name || uType}</span>
                  <span className="text-[10px] text-[#785b3a] font-mono">
                    Başlangıç: <strong>{before}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-red-700 block font-serif">Kayıp</span>
                  <strong className="text-red-700">-{lost}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 block font-serif">Kalan</span>
                  <strong className="text-emerald-800 font-black">{remaining}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderSpyReport(report: BattleReport) {
    const isSuccess = report.attackerResult === 'victory';
    const defenderUnits = report.defenderCasualties.unitsBefore || {};
    const totalEnemyTroops = Object.values(defenderUnits).reduce<number>((a, b) => a + (Number(b) || 0), 0);
    const scoutedRes = report.scoutedResources;
    const scoutedBuildings = report.scoutedBuildings;
    const isDetected = report.detected;
    
    return (
      <div className="space-y-5">
        {!isSuccess ? (
          <div className="bg-[#7f1d1d] text-[#fca5a5] border-2 border-[#f87171] p-3 rounded font-serif text-center font-bold shadow-md transform -rotate-1 mx-4">
            Casuslarımız düşman muhafızlarınca fark edildi ve infaz edildi! İstihbarat toplanamadı.
          </div>
        ) : isDetected ? (
          <div className="bg-[#fef3c7] text-[#92400e] border-2 border-[#d97706] p-2.5 rounded font-serif text-center font-bold text-xs shadow-sm">
            ⚠️ Casuslarımız bilgileri başarıyla sızdırdı ancak düşman nöbetçileri sızmayı son anda fark etti!
          </div>
        ) : null}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#e8deca] border border-[#c6b497] p-3 rounded text-center shadow-sm">
            <Castle className="w-5 h-5 mx-auto text-[#8a683e] mb-1" />
            <div className="text-[10px] text-[#5c3e1e] uppercase tracking-wider font-bold mb-1">Tespit Edilen Sur</div>
            <div className="font-mono text-sm font-black text-[#24160b]">
              Seviye {report.initialWallLevel}
            </div>
          </div>
          
          <div className="bg-[#e8deca] border border-[#c6b497] p-3 rounded text-center shadow-sm">
            <Eye className="w-5 h-5 mx-auto text-[#8a683e] mb-1" />
            <div className="text-[10px] text-[#5c3e1e] uppercase tracking-wider font-bold mb-1">Ambar Durumu</div>
            <div className="font-mono text-sm font-black text-[#24160b]">
              {scoutedRes ? 'Ayrıntılı Tespit Edildi' : 'Dolu & Yağmaya Müsait'}
            </div>
          </div>
          
          <div className="bg-[#e8deca] border border-[#c6b497] p-3 rounded text-center shadow-sm">
            <ShieldAlert className="w-5 h-5 mx-auto text-[#8a683e] mb-1" />
            <div className="text-[10px] text-[#5c3e1e] uppercase tracking-wider font-bold mb-1">Tespit Edilen Garnizon</div>
            <div className="font-mono text-sm font-black text-[#8f2b18]">
              {totalEnemyTroops.toLocaleString()} Asker
            </div>
          </div>
        </div>

        {/* 1. Tespit Edilen Hammaddeler */}
        {isSuccess && scoutedRes && (
          <div className="bg-[#e2d3b5] border border-[#a88a61] rounded-lg p-3.5 shadow-sm">
            <h4 className="font-serif font-bold text-[#5c3e1e] border-b border-[#a88a61]/50 pb-2 mb-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#8a683e]" />
                <span>İstihbarat: Hedef Yerleşkedeki Hammadde Miktarları</span>
              </span>
              <span className="font-mono text-[11px] text-[#785b3a]">Yağmaya Açık Stok</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="flex items-center gap-2 bg-[#e8deca] border border-[#c6b497] p-2 rounded">
                <ResourceIcon type="wood" size="sm" />
                <div>
                  <span className="text-[10px] text-[#785b3a] block">Odun</span>
                  <strong className="font-mono text-xs text-[#24160b]">{Math.floor(scoutedRes.wood).toLocaleString()}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#e8deca] border border-[#c6b497] p-2 rounded">
                <ResourceIcon type="stone" size="sm" />
                <div>
                  <span className="text-[10px] text-[#785b3a] block">Taş</span>
                  <strong className="font-mono text-xs text-[#24160b]">{Math.floor(scoutedRes.stone).toLocaleString()}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#e8deca] border border-[#c6b497] p-2 rounded">
                <ResourceIcon type="iron" size="sm" />
                <div>
                  <span className="text-[10px] text-[#785b3a] block">Demir</span>
                  <strong className="font-mono text-xs text-[#24160b]">{Math.floor(scoutedRes.iron).toLocaleString()}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#e8deca] border border-[#c6b497] p-2 rounded">
                <ResourceIcon type="grain" size="sm" />
                <div>
                  <span className="text-[10px] text-[#785b3a] block">Tahıl</span>
                  <strong className="font-mono text-xs text-[#24160b]">{Math.floor(scoutedRes.grain).toLocaleString()}</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#e8deca] border border-[#c6b497] p-2 rounded">
                <ResourceIcon type="gold" size="sm" />
                <div>
                  <span className="text-[10px] text-[#785b3a] block">Altın</span>
                  <strong className="font-mono text-xs text-[#24160b]">{Math.floor(scoutedRes.gold).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Tespit Edilen Binalar */}
        {isSuccess && scoutedBuildings && Object.keys(scoutedBuildings).length > 0 && (
          <div className="bg-[#e2d3b5] border border-[#a88a61] rounded-lg p-3.5 shadow-sm">
            <h4 className="font-serif font-bold text-[#5c3e1e] border-b border-[#a88a61]/50 pb-2 mb-3 text-xs flex items-center gap-1.5">
              <Castle className="w-4 h-4 text-[#8a683e]" />
              <span>İstihbarat: Hedef Yerleşkedeki Bina Kademeleri</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(scoutedBuildings).map(([bType, level]) => (
                <div key={bType} className="flex items-center justify-between bg-[#e8deca] border border-[#c6b497] px-2.5 py-1.5 rounded text-xs">
                  <span className="font-serif font-bold text-[#3d2612] capitalize truncate">{bType}</span>
                  <span className="font-mono font-bold text-amber-900 ml-1">Sv. {level}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 3. Tespit Edilen Nöbetçi Birlikler */}
        {isSuccess && Object.keys(defenderUnits).length > 0 && (
          <div className="bg-[#e2d3b5] border border-[#a88a61] rounded-lg p-3 shadow-sm mt-4">
             <h4 className="font-serif font-bold text-[#5c3e1e] border-b border-[#a88a61]/50 pb-2 mb-3 text-xs">İstihbarat: İçerideki Nöbetçi Birlikler</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(defenderUnits).map(([uType, count]) => {
                  const uDef = UNITS[uType as UnitType];
                  return (
                    <div key={uType} className="flex items-center gap-3 bg-[#e8deca] border border-[#c6b497] p-2 rounded shadow-sm">
                      <div className="w-8 h-8 rounded-full border border-[#b58b4c] bg-[#1a1008] p-0.5 overflow-hidden shrink-0">
                        <img 
                          src={uDef?.image || UNIT_IMAGE_MAP[uType as UnitType] || `/drawable/${uType}.webp`} 
                          alt={uDef?.name || uType} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-serif font-bold text-[#3d2612] text-[11px] truncate">{uDef?.name || uType}</div>
                        <div className="font-mono font-black text-[#8f2b18] text-xs">{count} Mevcut</div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Sol Bölme: Ferman ve Rapor Listesi */}
      <div className="w-full lg:w-80 bg-gradient-to-b from-[#25170d] via-[#1a1008] to-[#120a05] border-3 border-[#6f4e28] rounded-2xl p-4 shadow-xl text-[#eddcc4]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#523d26] mb-3">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <h3 className="font-serif font-bold text-sm text-[#fef08a]">Harp Fermanları ({reports.length})</h3>
          </div>
          {reports.length > 0 && (
            <button
              onClick={onClearReports}
              className="text-[#a88a61] hover:text-red-400 transition p-1"
              title="Tüm Fermanları Arşivle"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {reports.map((rep) => {
            const isSelected = selectedReport && selectedReport.id === rep.id;
            const isVictory = rep.attackerResult === 'victory';

            const getMissionLabel = () => {
              switch(rep.mission) {
                case 'attack': return { text: '⚔️ Taarruz', bg: 'bg-red-950/80 text-red-300 border-red-700' };
                case 'raid': return { text: '🏇 Yağma', bg: 'bg-amber-950/80 text-amber-300 border-amber-700' };
                case 'support': return { text: '🛡️ Destek', bg: 'bg-blue-950/80 text-blue-300 border-blue-700' };
                case 'spy': return { text: '👁️ Casusluk', bg: 'bg-purple-950/80 text-purple-300 border-purple-700' };
                default: return { text: '⚔️ Sefer', bg: 'bg-stone-900 text-stone-300 border-stone-700' };
              }
            };
            const mBadge = getMissionLabel();

            const attackerFaction = rep.attackerFaction ? FACTIONS[rep.attackerFaction] : null;
            const defenderFaction = rep.defenderFaction ? FACTIONS[rep.defenderFaction] : null;

            return (
              <div
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-[#3d2714] border-[#caa05a] shadow-md'
                    : 'bg-[#150d06] border-[#382312] hover:border-[#694825]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${mBadge.bg}`}>
                    {mBadge.text}
                  </span>
                  <span className={`font-mono text-[10px] font-bold ${isVictory ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isVictory ? 'Zafer' : 'Hezimet'}
                  </span>
                </div>
                <div className="font-serif font-bold text-sm text-[#fef08a] truncate flex items-center gap-1.5">
                  {attackerFaction?.flagImage && (
                    <img 
                      src={attackerFaction.flagImage} 
                      alt="" 
                      className="w-4 h-3 rounded-sm object-cover shrink-0 border border-amber-500/50" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span>{rep.attackerVillageName}</span>
                  <span className="text-[#a89274] font-normal">→</span>
                  {defenderFaction?.flagImage && (
                    <img 
                      src={defenderFaction.flagImage} 
                      alt="" 
                      className="w-4 h-3 rounded-sm object-cover shrink-0 border border-amber-500/50" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span>{rep.defenderVillageName}</span>
                </div>
                <div className="text-[10px] text-[#9c8265] font-mono mt-0.5 flex items-center justify-between">
                  <span>{new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  {rep.damagedBuildings && rep.damagedBuildings.length > 0 && (
                    <span className="text-red-400 font-bold">🏰 Hasar Verildi</span>
                  )}
                </div>
              </div>
            );
          })}
          {reports.length === 0 && (
            <div className="text-center text-[#9c8265] italic text-xs font-serif p-4 border border-[#5a3e20] rounded-xl bg-[#160d07]">
              Henüz divana sunulmuş bir ferman yok.
            </div>
          )}
        </div>
      </div>

       {/* Sağ Bölme: Ana Harp Fermanı */}
      {selectedReport && (() => {
        const selAttackerFaction = selectedReport.attackerFaction ? FACTIONS[selectedReport.attackerFaction] : null;
        const selDefenderFaction = selectedReport.defenderFaction ? FACTIONS[selectedReport.defenderFaction] : null;

        return (
          <div className="flex-1 bg-[#f3ebd7] text-[#24160b] border-2 border-[#8a683e] rounded-xl p-3 sm:p-5 shadow-[inset_0_0_40px_rgba(138,104,62,0.15)] relative overflow-y-auto max-h-[650px] custom-scrollbar">
            <div className="bg-gradient-to-r from-[#8f2b18] via-[#a7351f] to-[#8f2b18] text-[#f3ebd7] border-y-2 border-[#d4af37] p-3 -mx-5 -mt-5 mb-5 flex flex-col sm:flex-row justify-between items-center shadow-md gap-2">
              <div className="font-serif font-bold text-sm sm:text-base text-center sm:text-left drop-shadow flex items-center gap-2">
                {selAttackerFaction?.flagImage && (
                  <div className="w-7 h-5 rounded overflow-hidden border border-[#d4af37] shadow-sm shrink-0">
                    <img 
                      src={selAttackerFaction.flagImage} 
                      alt={selAttackerFaction.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
                <span>{selectedReport.attackerVillageName}</span>
                <span className="text-[#fef08a] font-mono">⚔️</span>
                {selDefenderFaction?.flagImage && (
                  <div className="w-7 h-5 rounded overflow-hidden border border-[#d4af37] shadow-sm shrink-0">
                    <img 
                      src={selDefenderFaction.flagImage} 
                      alt={selDefenderFaction.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
                <span>{selectedReport.defenderVillageName}</span>
              </div>
              <div className="font-mono text-xs flex gap-3 text-[#fef08a] drop-shadow">
                <span>[Hedef: {selectedReport.defenderCoords.x}|{selectedReport.defenderCoords.y}]</span>
                <span className="hidden sm:inline">{new Date(selectedReport.timestamp).toLocaleString()}</span>
              </div>
            </div>

           <div className="bg-[#e5d8be] border-l-4 border-[#8f2b18] p-3 rounded text-xs italic font-serif leading-relaxed text-[#3d2612] mb-5 shadow-sm">
             "{selectedReport.summary}"
           </div>

           {selectedReport.mission === 'spy' ? (
             renderSpyReport(selectedReport)
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
               {/* Kızıl Kanat */}
               <div>
                 <h4 className="font-serif font-bold text-[#8f2b18] border-b-2 border-[#8f2b18]/30 pb-1 mb-3 uppercase tracking-wide text-xs">
                   Saldıran Ordu (Kızıl Kanat)
                 </h4>
                 {renderTroopTrays(selectedReport.attackerCasualties)}
               </div>
               
               {/* Demir Kanat */}
               <div>
                 <h4 className="font-serif font-bold text-[#1e3a8a] border-b-2 border-[#1e3a8a]/30 pb-1 mb-3 uppercase tracking-wide text-xs">
                   Savunan Garnizon (Demir Kanat)
                 </h4>
                 {renderTroopTrays(selectedReport.defenderCasualties)}
               </div>
             </div>
           )}

           {/* 1. Kuşatma ve Yıkılan Binalar (Mancınık & Top Hasarları) */}
           {selectedReport.damagedBuildings && selectedReport.damagedBuildings.length > 0 && (
             <div className="bg-[#f2e6cf] border-2 border-[#8f2b18] rounded-lg p-3.5 mt-5 shadow-sm">
               <h4 className="font-serif font-bold text-[#8f2b18] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                 <ShieldAlert className="w-4 h-4 text-[#8f2b18]" />
                 <span>Kuşatma & Mancınık/Top Hasar Raporu</span>
               </h4>
               <div className="space-y-1.5">
                 {selectedReport.damagedBuildings.map((db, idx) => (
                   <div key={idx} className="flex items-center justify-between text-xs bg-[#e5d8be] px-3 py-1.5 rounded border border-[#bfa57b] font-serif">
                     <span className="font-bold text-[#3d2612] capitalize">
                       {db.buildingType === 'wall' ? 'Sur (Hisar Duvarı)' : db.buildingType === 'umaykut' ? 'Umaykut Kut Binası' : db.buildingType}
                     </span>
                     <span className="font-mono text-red-700 font-bold">
                       Seviye {db.levelBefore} → <strong className="text-red-900 font-black">Seviye {db.levelAfter}</strong> ({db.destroyedLevels} Seviye Yıkıldı)
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           )}

           {/* 2. Yağma Koruması Bildirimi */}
           {selectedReport.isPlunderProtected && (
             <div className="bg-[#fef3c7] border-2 border-[#d97706] text-[#92400e] rounded-lg p-3 mt-4 font-serif text-xs flex items-center gap-2 shadow-sm">
               <Shield className="w-4 h-4 text-[#d97706] shrink-0" />
               <span>Bu köy 1 saatlik yağma koruması altında olduğundan hammadde ve nüfus talan edilemedi.</span>
             </div>
           )}

           {/* 2.1 Sığınak Kurtarma Raporu */}
           {((selectedReport.savedByHideout && selectedReport.savedByHideout > 0) || (selectedReport.hideoutProtection && selectedReport.hideoutProtection > 0)) && (
             <div className="bg-[#ecfdf5] border-2 border-[#059669] text-[#065f46] rounded-lg p-3.5 mt-4 font-serif text-xs flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-2.5">
                 <div className="w-8 h-8 rounded-full bg-[#d1fae5] border border-[#34d399] flex items-center justify-center shrink-0">
                   <Shield className="w-4 h-4 text-[#059669]" />
                 </div>
                 <div>
                   <div className="font-bold text-sm text-[#064e3b]">
                     Sığınak sayesinde {selectedReport.savedByHideout ? selectedReport.savedByHideout.toLocaleString() : (selectedReport.hideoutProtection! * 5).toLocaleString()} kaynak kurtarıldı!
                   </div>
                   <div className="text-[11px] text-[#047857] mt-0.5">
                     Gizli mahzenler her kaynaktan {selectedReport.hideoutProtection || 400} birimi çapulculardan koruyarak beylik kasasında tuttu.
                   </div>
                 </div>
               </div>
               <span className="px-2.5 py-1 rounded bg-[#a7f3d0] text-[#065f46] font-mono font-bold text-xs shrink-0 border border-[#6ee7b7]">
                 🔒 Güvende
               </span>
             </div>
           )}

           {/* 3. Kaçırılan Esir Köylüler ve Safkan Atlar */}
           {((selectedReport.capturedVillagers && selectedReport.capturedVillagers > 0) || (selectedReport.capturedHorses && selectedReport.capturedHorses > 0)) && (
             <div className="bg-[#ede4ce] border border-[#a88a61] rounded-lg p-3.5 mt-4 shadow-sm flex flex-wrap items-center gap-4">
               {selectedReport.capturedVillagers && selectedReport.capturedVillagers > 0 && (
                 <div className="flex items-center gap-2 bg-[#dfd3b9] px-3 py-1.5 rounded border border-[#beaa87]">
                   <Users className="w-4 h-4 text-amber-800" />
                   <span className="text-xs font-serif text-[#3d2612]">
                     Esir Köylü: <strong className="font-mono text-amber-900 font-black">+{selectedReport.capturedVillagers}</strong> (Köy Nüfusuna Katıldı)
                   </span>
                 </div>
               )}
               {selectedReport.capturedHorses && selectedReport.capturedHorses > 0 && (
                 <div className="flex items-center gap-2 bg-[#dfd3b9] px-3 py-1.5 rounded border border-[#beaa87]">
                   <span className="text-sm">🐎</span>
                   <span className="text-xs font-serif text-[#3d2612]">
                     Ganimet Safkan At: <strong className="font-mono text-amber-900 font-black">+{selectedReport.capturedHorses}</strong> (Ahırlara Katıldı)
                   </span>
                 </div>
               )}
             </div>
           )}

           {/* 4. Ganimet Sandığı */}
           {selectedReport.mission !== 'spy' && selectedReport.attackerResult === 'victory' && Object.values(selectedReport.lootCarried || {}).some((v: any) => Number(v) > 0) && (
             <div className="bg-[#e2d3b5] border border-[#a88a61] rounded-lg p-4 mt-5 shadow-sm relative overflow-hidden">
               <h4 className="font-serif font-bold text-[#5c3e1e] text-center mb-4 border-b border-[#a88a61]/50 pb-2 flex items-center justify-center gap-2">
                 <img src="/drawable/resource_chest.webp" alt="chest" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                 Beylik Hazinesine Aktarılan Ganimetler
               </h4>
               <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                 {['wood', 'stone', 'iron', 'grain', 'gold'].map((resType) => {
                   const amount = (selectedReport.lootCarried as any)[resType] || 0;
                   if (amount === 0) return null;
                   return (
                     <div key={resType} className="flex flex-col items-center justify-center bg-[#d8c5a1] border border-[#bfa57b] rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                       <ResourceIcon type={resType} size="sm" className="drop-shadow-none" />
                       <span className="font-mono font-bold text-[#3d2612] text-[10px] sm:text-xs mt-0.5">+{amount}</span>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
         </div>
       );
     })()}
   </div>
 );
};
