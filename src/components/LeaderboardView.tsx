import React, { useState, useMemo } from 'react';
import { LeaderboardEntry } from '../types/divanTypes';
import { getGaziRank } from '../engine/kudretEngine';
import { 
  Trophy, 
  Crown, 
  Swords, 
  Star, 
  Search, 
  X, 
  ArrowUpDown, 
  Building2, 
  Flame,
  Medal,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  playerKudret: number;
}

type SortField = 'kudret' | 'victoryPoints' | 'villageCount';

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  playerKudret
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('kudret');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [onlyPlayerAndSurroundings, setOnlyPlayerAndSurroundings] = useState<boolean>(false);

  const gaziInfo = getGaziRank(playerKudret);
  const playerEntry = entries.find(e => e.isPlayer);

  // Sıralanmış ve Filtrelenmiş Liste
  const processedEntries = useMemo(() => {
    let list = [...entries];

    // Oyuncu ve Çevresi Filtresi
    if (onlyPlayerAndSurroundings && playerEntry) {
      const playerIdx = list.findIndex(e => e.isPlayer);
      if (playerIdx !== -1) {
        const start = Math.max(0, playerIdx - 3);
        const end = Math.min(list.length, playerIdx + 4);
        list = list.slice(start, end);
      }
    }

    // Beylik Filtresi
    if (selectedFaction !== 'all') {
      list = list.filter(e => e.faction === selectedFaction);
    }

    // Arama Filtresi
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.title.toLowerCase().includes(q) ||
        e.faction.toLowerCase().includes(q)
      );
    }

    // Sıralama
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === valB) {
        return a.rank - b.rank;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [entries, searchQuery, selectedFaction, sortField, sortAsc, onlyPlayerAndSurroundings, playerEntry]);

  // İlk 3 Lider (Zirve)
  const topThree = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.kudret - a.kudret);
    return {
      first: sorted[0],
      second: sorted[1],
      third: sorted[2]
    };
  }, [entries]);

  // Sıralama Değiştirme
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Beylik Listesi (Tekil)
  const factionsList = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => set.add(e.faction));
    return Array.from(set);
  }, [entries]);

  return (
    <div id="leaderboard-ranking-screen" className="max-w-5xl mx-auto space-y-4 pb-20 select-none text-[#eedec9]">
      
      {/* 1. KOMPAKT ÜST BAŞLIK & OYUNCU DURUM ÇUBUĞU */}
      <div className="bg-gradient-to-b from-[#2b180d] via-[#1a0f07] to-[#110904] border-2 border-[#80592f] rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Sol: Başlık & Rozet */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#85531d] to-[#3a200e] border border-[#f59e0b] flex items-center justify-center shadow-lg shrink-0">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-black text-[#fef08a] drop-shadow">
                Cihan Kudret Sıralaması
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 border border-amber-600 text-amber-300">
                {entries.length} Beylik
              </span>
            </div>
            <p className="text-xs text-[#bda688] font-serif">
              Anadolu beyliklerinin askeri, iktisadi ve fetih kudreti
            </p>
          </div>
        </div>

        {/* Sağ: Oyuncunun Hızlı İstatistik Kartı */}
        {playerEntry && (
          <div className="flex items-center gap-3 bg-[#170e08] px-3.5 py-2 rounded-xl border border-amber-500/60 shadow-inner self-start sm:self-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-400 flex items-center justify-center text-sm shadow">
              👑
            </div>
            <div className="text-xs font-serif">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#fef08a]">{playerEntry.name}</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold bg-black/40 px-1.5 py-0.2 rounded border border-amber-800/60">
                  #{playerEntry.rank}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#decab0]">
                Kudret: <strong className="text-yellow-300">{playerKudret.toLocaleString('tr-TR')} ⚔️</strong> • {gaziInfo.title}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 2. ZİRVE İLK 3 HAKAN KARTLARI (Podyum) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* 2. Sıra (Gümüş) */}
        {topThree.second && (
          <div className="order-2 md:order-1 bg-gradient-to-b from-[#1e1915] to-[#120d09] border-2 border-slate-500/60 rounded-2xl p-3.5 shadow-md flex items-center gap-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-400 to-slate-700 border border-slate-300 flex items-center justify-center text-lg shadow-inner shrink-0 text-white font-black">
              🥈
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wide">2. Sırada</span>
                <span className="text-xs font-mono font-black text-amber-300">{topThree.second.kudret.toLocaleString('tr-TR')} ⚔️</span>
              </div>
              <div className="font-serif font-black text-sm text-[#fef3c7] truncate">
                {topThree.second.name}
              </div>
              <div className="text-[10px] text-[#a89070] font-sans truncate">
                {topThree.second.faction.replace('ogullari', 'oğulları')} • {topThree.second.villageCount} Köy
              </div>
            </div>
          </div>
        )}

        {/* 1. Sıra (Altın Taç - Zirve) */}
        {topThree.first && (
          <div className="order-1 md:order-2 bg-gradient-to-b from-[#3a200e] via-[#24140a] to-[#140b05] border-2 border-amber-400 rounded-2xl p-4 shadow-xl flex items-center gap-3 relative overflow-hidden ring-2 ring-amber-500/30">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-yellow-400 via-amber-500 to-amber-700 border-2 border-yellow-200 flex items-center justify-center text-2xl shadow-lg shrink-0">
              👑
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  Cihan Hükümdarı
                </span>
                <span className="text-sm font-mono font-black text-yellow-300">{topThree.first.kudret.toLocaleString('tr-TR')} ⚔️</span>
              </div>
              <div className="font-serif font-black text-base text-[#fffbeb] truncate">
                {topThree.first.name}
              </div>
              <div className="text-[11px] text-amber-200/90 font-serif truncate">
                {topThree.first.title} ({topThree.first.faction.replace('ogullari', 'oğulları')})
              </div>
            </div>
          </div>
        )}

        {/* 3. Sıra (Bronz) */}
        {topThree.third && (
          <div className="order-3 md:order-3 bg-gradient-to-b from-[#24170f] to-[#120a06] border-2 border-amber-700/60 rounded-2xl p-3.5 shadow-md flex items-center gap-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-amber-700 to-amber-950 border border-amber-600 flex items-center justify-center text-lg shadow-inner shrink-0 text-white font-black">
              🥉
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wide">3. Sırada</span>
                <span className="text-xs font-mono font-black text-amber-300">{topThree.third.kudret.toLocaleString('tr-TR')} ⚔️</span>
              </div>
              <div className="font-serif font-black text-sm text-[#fef3c7] truncate">
                {topThree.third.name}
              </div>
              <div className="text-[10px] text-[#a89070] font-sans truncate">
                {topThree.third.faction.replace('ogullari', 'oğulları')} • {topThree.third.villageCount} Köy
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 3. ARAMA, FİLTRE VE SIRALAMA KONTROLLERİ */}
      <div className="bg-[#1a0f07] border border-[#52371e] rounded-xl p-3 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
        
        {/* Arama Kutusu */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#a89070] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lider adı veya beylik ara..."
            className="w-full bg-[#0d0704] border border-[#422a16] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#fef08a] placeholder-[#8c7457] outline-none focus:border-amber-400 font-serif"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a89070] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Beylik Filtresi Açılır Menüsü */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedFaction}
            onChange={(e) => setSelectedFaction(e.target.value)}
            className="bg-[#0d0704] border border-[#422a16] text-[#decab0] text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400 font-serif cursor-pointer capitalize"
          >
            <option value="all">Tüm Beylikler</option>
            {factionsList.map(f => (
              <option key={f} value={f}>
                {f.replace('ogullari', 'oğulları')}
              </option>
            ))}
          </select>

          {/* Sadece Benim Çevremi Göster Butonu */}
          <button
            onClick={() => setOnlyPlayerAndSurroundings(!onlyPlayerAndSurroundings)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-serif font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              onlyPlayerAndSurroundings
                ? 'bg-amber-900/80 border-amber-400 text-amber-200'
                : 'bg-[#120a05] border-[#422a16] text-[#a89070] hover:text-[#decab0]'
            }`}
          >
            <span>🎯 Benim Sıram</span>
          </button>
        </div>

      </div>

      {/* 4. SIRALAMA TABLOSU */}
      <div className="rounded-2xl bg-[#1c1007] border-2 border-[#5a3a20] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#120803] border-b border-[#472f18] text-[11px] font-serif font-bold text-amber-300 uppercase tracking-wider">
                
                <th className="py-2.5 px-3 text-center w-14">
                  Sıra
                </th>

                <th className="py-2.5 px-3">
                  Hükümdar / Lider
                </th>

                <th className="py-2.5 px-3">
                  Beylik
                </th>

                {/* Köy Sayısı (Sıralanabilir) */}
                <th className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => handleSort('villageCount')}
                    className="inline-flex items-center gap-1 hover:text-amber-100 transition cursor-pointer"
                  >
                    <span>Köyler</span>
                    {sortField === 'villageCount' ? (
                      sortAsc ? <ChevronUp className="w-3 h-3 text-amber-400" /> : <ChevronDown className="w-3 h-3 text-amber-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#73573e]" />
                    )}
                  </button>
                </th>

                {/* Zafer Puanı (Sıralanabilir) */}
                <th className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => handleSort('victoryPoints')}
                    className="inline-flex items-center gap-1 hover:text-amber-100 transition cursor-pointer ml-auto"
                  >
                    <span>Zafer</span>
                    {sortField === 'victoryPoints' ? (
                      sortAsc ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#73573e]" />
                    )}
                  </button>
                </th>

                {/* Kudret (Sıralanabilir) */}
                <th className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => handleSort('kudret')}
                    className="inline-flex items-center gap-1 hover:text-amber-100 transition cursor-pointer ml-auto"
                  >
                    <span>Kudret (Puan)</span>
                    {sortField === 'kudret' ? (
                      sortAsc ? <ChevronUp className="w-3 h-3 text-yellow-400" /> : <ChevronDown className="w-3 h-3 text-yellow-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#73573e]" />
                    )}
                  </button>
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-[#2e1c0e] text-xs font-serif">
              {processedEntries.map((entry) => {
                const isPlayer = entry.isPlayer;
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <tr 
                    key={entry.id}
                    className={`transition-colors ${
                      isPlayer
                        ? 'bg-[#3d2411] border-y-2 border-amber-400 font-bold shadow-inner'
                        : isTop1
                        ? 'bg-amber-950/20 hover:bg-[#26160a]'
                        : 'hover:bg-[#24150a]'
                    }`}
                  >
                    {/* Sıra Rozeti */}
                    <td className="py-2.5 px-3 text-center">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-yellow-300 to-amber-600 text-black font-black font-mono text-[11px] shadow">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-slate-200 to-slate-400 text-black font-black font-mono text-[11px] shadow">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 text-white font-black font-mono text-[11px] shadow">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-[#a89070]">
                          #{entry.rank}
                        </span>
                      )}
                    </td>

                    {/* Hükümdar / Lider */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{entry.avatar}</span>
                        <div>
                          <div className={`font-black flex items-center gap-1.5 ${isPlayer ? 'text-amber-200' : 'text-[#fef08a]'}`}>
                            <span>{entry.name}</span>
                            {isPlayer && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-900 border border-amber-400 text-[9px] text-amber-200 font-mono">
                                SİZ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#a89070] truncate max-w-[150px] sm:max-w-none">
                            {entry.title}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Beylik */}
                    <td className="py-2.5 px-3 text-[#decab0] capitalize font-medium">
                      {entry.faction.replace('ogullari', 'oğulları')}
                    </td>

                    {/* Köy Sayısı */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                      {entry.villageCount}
                    </td>

                    {/* Zafer Puanı */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                      {entry.victoryPoints.toLocaleString('tr-TR')}
                    </td>

                    {/* Kudret Puanı */}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-yellow-300 text-xs sm:text-sm">
                      {entry.kudret.toLocaleString('tr-TR')} ⚔️
                    </td>
                  </tr>
                );
              })}

              {processedEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#a89070] italic text-xs">
                    Aranan kriterlere uygun lider veya beylik bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
