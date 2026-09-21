import React, { useState, useMemo, useRef } from 'react';
import { Village, ResourceNode } from '../../types/game';
import { FACTIONS } from '../../data/gameData';
import { 
  Search, 
  Layers, 
  MapPin, 
  Bookmark, 
  BookmarkPlus, 
  Trash2, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Maximize2, 
  Minimize2,
  X,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  Shield,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export type StrategicMapMode = 'umaykut_meadow' | 'parchment' | 'political' | 'economic' | 'military';

export interface MapWaypoint {
  id: string;
  name: string;
  x: number;
  y: number;
  category: 'village' | 'resource' | 'military' | 'poi';
  createdAt: number;
}

interface MapStrategicControlsProps {
  currentMode: StrategicMapMode;
  onSelectMode: (mode: StrategicMapMode) => void;
  filterType: 'all' | 'grain' | 'iron' | 'wood' | 'stone' | 'rival' | 'gold';
  onSelectFilter: (filter: 'all' | 'grain' | 'iron' | 'wood' | 'stone' | 'rival' | 'gold') => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showInfluenceRings: boolean;
  onToggleInfluenceRings: () => void;
  showRadar: boolean;
  onToggleRadar: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFocusCapital: () => void;
  onJumpToCoords: (x: number, y: number) => void;
  playerVillage: Village;
  playerVillages: Village[];
  rivalVillages: Village[];
  selectedTile: { x: number; y: number } | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const MapStrategicControls: React.FC<MapStrategicControlsProps> = ({
  currentMode,
  onSelectMode,
  filterType,
  onSelectFilter,
  showGrid,
  onToggleGrid,
  showInfluenceRings,
  onToggleInfluenceRings,
  showRadar,
  onToggleRadar,
  zoom,
  onZoomIn,
  onZoomOut,
  onFocusCapital,
  onJumpToCoords,
  playerVillage,
  playerVillages,
  rivalVillages,
  selectedTile,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModesDropdownOpen, setIsModesDropdownOpen] = useState(false);
  const [isWaypointsOpen, setIsWaypointsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [newWaypointName, setNewWaypointName] = useState('');
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ambient Web Audio Synthesizer (Bozkır Rüzgarı & Esintisi)
  const toggleAudio = () => {
    if (isMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        setIsMuted(false);
      } catch (e) {
        setIsMuted(true);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setIsMuted(true);
    }
  };

  // Yer İmleri (LocalStorage ile kalıcı saklanır)
  const [waypoints, setWaypoints] = useState<MapWaypoint[]>(() => {
    try {
      const saved = localStorage.getItem('umaykut_map_waypoints');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: '1', name: 'Söğüt Payitahtı', x: 55, y: 45, category: 'village', createdAt: Date.now() },
      { id: '2', name: 'Yarhisar Tekfurluğu', x: 70, y: 38, category: 'military', createdAt: Date.now() },
      { id: '3', name: 'Küre Bakır Yatağı', x: 260, y: 70, category: 'resource', createdAt: Date.now() },
    ];
  });

  const saveWaypoints = (items: MapWaypoint[]) => {
    setWaypoints(items);
    try {
      localStorage.setItem('umaykut_map_waypoints', JSON.stringify(items));
    } catch (_) {}
  };

  const handleAddWaypoint = () => {
    if (!selectedTile) return;
    const name = newWaypointName.trim() || `Nokta (${selectedTile.x}, ${selectedTile.y})`;
    const newItem: MapWaypoint = {
      id: Date.now().toString(),
      name,
      x: selectedTile.x,
      y: selectedTile.y,
      category: 'poi',
      createdAt: Date.now()
    };
    const updated = [newItem, ...waypoints];
    saveWaypoints(updated);
    setNewWaypointName('');
  };

  const handleDeleteWaypoint = (id: string) => {
    const updated = waypoints.filter(w => w.id !== id);
    saveWaypoints(updated);
  };

  // Arama Önerileri (Koordinat, Köy İsmi, Sahip İsmi, Beylik)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    // Koordinat formatı kontrolü: "55, 45" veya "55 45"
    const coordMatch = q.match(/^(\d{1,4})[,\s|/]+(\d{1,4})$/);
    const results: Array<{ title: string; subtitle: string; x: number; y: number; type: string }> = [];

    if (coordMatch) {
      const x = parseInt(coordMatch[1], 10);
      const y = parseInt(coordMatch[2], 10);
      results.push({
        title: `Koordinata Git (${x}, ${y})`,
        subtitle: 'Haritada bu koordinata intikal et',
        x,
        y,
        type: 'coord'
      });
    }

    // Oyuncu Köyleri
    playerVillages.forEach(pv => {
      if (pv.name.toLowerCase().includes(q)) {
        results.push({
          title: `🏰 ${pv.name} (Kendi Otağınız)`,
          subtitle: `Konum: (${pv.x}|${pv.y}) • Merkez Lv.${pv.buildings.town_hall || 1}`,
          x: pv.x,
          y: pv.y,
          type: 'player_village'
        });
      }
    });

    // Rakip Köyler
    rivalVillages.forEach(rv => {
      const fName = FACTIONS[rv.faction]?.name || rv.faction;
      if (rv.name.toLowerCase().includes(q) || rv.ownerName.toLowerCase().includes(q) || fName.toLowerCase().includes(q)) {
        results.push({
          title: `⚔️ ${rv.name} (${rv.ownerName})`,
          subtitle: `${fName} • Konum: (${rv.x}|${rv.y})`,
          x: rv.x,
          y: rv.y,
          type: 'rival_village'
        });
      }
    });

    return results.slice(0, 7);
  }, [searchQuery, playerVillages, rivalVillages]);

  const mapModeLabels: Record<StrategicMapMode, { label: string; icon: string; desc: string }> = {
    umaykut_meadow: { label: 'Taktik Çayır', icon: '🌿', desc: 'Klasik Umaykut yüksek kontrastlı arazi & taktik ızgara' },
    parchment: { label: 'Tarihi Parşömen', icon: '📜', desc: '13. Yüzyıl Osmanlı/Selçuklu eskitme harita kartografyası' },
    political: { label: 'Siyasi Beylikler', icon: '🗺️', desc: 'Beylik egemenlik sınırları ve sancak nufuz hatları' },
    economic: { label: 'Ekonomik Isı', icon: '💎', desc: 'Verimli tarım ovaları ve zengin maden damarları' },
    military: { label: 'Askeri Tehdit', icon: '⚔️', desc: 'Düşman menzilleri, sefer hatları ve sınır alarmları' },
  };

  return (
    <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-4 sm:right-4 z-30 flex flex-col gap-1.5 font-serif select-none pointer-events-auto max-w-full">
      
      {/* 1. ANA KOMUTA DOCK'U (STRATEJİK HARİTA MODU, ARAMA, YER İMLERİ & ÜST AKSİYONLAR) */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-gradient-to-r from-[#2a1a0e]/95 via-[#1c1108]/95 to-[#2a1a0e]/95 border-2 border-[#8c6738] shadow-[0_8px_30px_rgba(0,0,0,0.92),inset_0_1px_2px_rgba(255,255,255,0.15)] text-xs backdrop-blur-md">
        
        {/* SOL GRUP: Harita Modları, Dikey Çizgi, Omnibox, Yer İmleri */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
          {/* HARİTA MODLARI AÇILIR BUTONU */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setIsModesDropdownOpen(v => !v);
                setIsSearchOpen(false);
                setIsWaypointsOpen(false);
                setIsHelpOpen(false);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-b from-[#3a2717] to-[#1a1109] border border-[#a67c48] hover:border-amber-400 text-amber-200 hover:text-white font-serif font-bold text-[11px] sm:text-xs transition cursor-pointer shadow active:scale-95 touch-manipulation"
            >
              <span>{mapModeLabels[currentMode].icon}</span>
              <span className="hidden sm:inline font-black tracking-wide">{mapModeLabels[currentMode].label}</span>
              <ChevronDown className="w-3 h-3 text-amber-400" />
            </button>

            {/* Harita Modları Menüsü */}
            {isModesDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" onClick={() => setIsModesDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-gradient-to-b from-[#24160d] via-[#1a0f07] to-[#120803] border-2 border-[#caa05a] rounded-xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.98)] z-50 animate-fade-in flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase font-bold text-amber-300 border-b border-[#4a341f]">
                    ✦ STRATEJİK HARİTA KATMANLARI
                  </div>
                  {(Object.keys(mapModeLabels) as StrategicMapMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => {
                        onSelectMode(mode);
                        setIsModesDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2 p-2 rounded-lg text-left transition cursor-pointer ${
                        currentMode === mode 
                          ? 'bg-gradient-to-r from-amber-900/70 to-amber-950/70 border border-amber-500 text-amber-100 font-bold' 
                          : 'hover:bg-[#2e1c10] text-[#c9ba9f] hover:text-[#fff0d0]'
                      }`}
                    >
                      <span className="text-base shrink-0 mt-0.5">{mapModeLabels[mode].icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-serif">{mapModeLabels[mode].label}</div>
                        <div className="text-[9.5px] text-[#9c8469] leading-tight mt-0.5 font-sans">
                          {mapModeLabels[mode].desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DİKEY AYIRAÇ */}
          <div className="w-[1px] h-4 bg-[#523d26] hidden sm:block shrink-0" />

          {/* OMNIBOX HIZLI ARAMA ÇUBUĞU */}
          <div className="relative flex-1 min-w-[120px] sm:min-w-[180px] max-w-sm">
            <div className="flex items-center gap-1 px-2 py-1 bg-[#120b06] border border-[#523d26] focus-within:border-amber-400 rounded-xl shadow-inner transition">
              <Search className="w-3 h-3 text-amber-400/80 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Koordinat veya köy ara... (örn: 55, 45)"
                className="w-full bg-transparent text-[11px] text-[#fef08a] placeholder-[#8c7659] focus:outline-none font-sans font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="text-[#8c7659] hover:text-white text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Arama Sonuçları Açılır Paneli */}
            {isSearchOpen && searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-gradient-to-b from-[#24160d] via-[#1a0f07] to-[#120803] border-2 border-[#caa05a] rounded-xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.98)] z-50 animate-fade-in flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onJumpToCoords(res.x, res.y);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#382415] border border-transparent hover:border-amber-700/60 transition cursor-pointer text-left group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-amber-100 group-hover:text-amber-300 truncate">
                          {res.title}
                        </div>
                        <div className="text-[10px] text-[#9c8469] truncate">
                          {res.subtitle}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold bg-[#120a05] px-1.5 py-0.5 rounded border border-[#4a341f] shrink-0">
                        ({res.x}|{res.y})
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* YER İMLERİ (BOOKMARKS) BUTONU */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setIsWaypointsOpen(v => !v);
                setIsModesDropdownOpen(false);
                setIsSearchOpen(false);
                setIsHelpOpen(false);
              }}
              title="Kayıtlı Yer İmleri & Taktik Noktalar"
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-serif font-bold transition cursor-pointer touch-manipulation ${
                isWaypointsOpen || waypoints.length > 0
                  ? 'bg-[#2b1c10] border-[#8c6738] text-amber-200 hover:border-amber-400'
                  : 'bg-[#150e08] border-[#523d26] text-[#a89476] hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-bold">İmler</span>
              <span className="text-[9px] font-mono bg-amber-950 px-1 rounded border border-amber-700 text-amber-300">
                {waypoints.length}
              </span>
            </button>

            {/* Yer İmleri Çekmecesi */}
            {isWaypointsOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" onClick={() => setIsWaypointsOpen(false)} />
                <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-72 bg-gradient-to-b from-[#24160d] via-[#1a0f07] to-[#120803] border-2 border-[#caa05a] rounded-xl p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.98)] z-50 animate-fade-in flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#523d26]">
                    <span className="font-bold text-xs text-amber-300 flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      Kayıtlı Taktik Noktalar
                    </span>
                    <button
                      onClick={() => setIsWaypointsOpen(false)}
                      className="text-[#9c8469] hover:text-white text-xs font-bold px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Seçili Kareyi Yer İmlerine Ekle */}
                  {selectedTile && (
                    <div className="flex items-center gap-1.5 bg-[#140b05] p-1.5 rounded-lg border border-[#4a341f]">
                      <input
                        type="text"
                        value={newWaypointName}
                        onChange={e => setNewWaypointName(e.target.value)}
                        placeholder={`Nokta (${selectedTile.x}, ${selectedTile.y})`}
                        className="flex-1 bg-[#0a0502] border border-[#3d2714] rounded px-1.5 py-1 text-xs text-amber-200 placeholder-[#786145] focus:outline-none"
                      />
                      <button
                        onClick={handleAddWaypoint}
                        className="px-2 py-1 bg-gradient-to-b from-amber-700 to-amber-900 hover:brightness-110 text-white rounded font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Kaydet</span>
                      </button>
                    </div>
                  )}

                  {/* Kayıtlı Noktalar Listesi */}
                  <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5">
                    {waypoints.length === 0 ? (
                      <div className="text-center py-4 text-xs text-[#8c7456] italic">
                        Henüz kayıtlı taktik nokta yok. Haritada bir kare seçip ekleyebilirsiniz.
                      </div>
                    ) : (
                      waypoints.map(w => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-[#150d06] hover:bg-[#29170a] border border-[#422d1a] group"
                        >
                          <button
                            onClick={() => {
                              onJumpToCoords(w.x, w.y);
                              setIsWaypointsOpen(false);
                            }}
                            className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer flex-1"
                          >
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="font-bold text-xs text-[#decab0] group-hover:text-amber-200 truncate">
                              {w.name}
                            </span>
                            <span className="text-[10px] font-mono text-[#a89476] ml-1 shrink-0">
                              ({w.x}|{w.y})
                            </span>
                          </button>

                          <button
                            onClick={() => handleDeleteWaypoint(w.id)}
                            title="İmi Sil"
                            className="text-rose-400 hover:text-rose-200 p-1 opacity-70 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SAĞ GRUP: Merkez Otağ Odak, Ses, Tam Ekran, Rehber */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* HIZLI MERKEZ ODAKLANMA */}
          <button
            onClick={onFocusCapital}
            title="Merkez Otağa Odaklan"
            className="p-1 sm:px-2.5 sm:py-1 rounded-xl bg-gradient-to-b from-[#801b0f] via-[#591006] to-[#360702] border border-[#f87171] hover:border-amber-300 text-white font-serif font-black text-xs transition cursor-pointer shadow flex items-center gap-1 shrink-0 active:scale-95 touch-manipulation"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Merkez</span>
          </button>

          {/* SES KONTROLÜ */}
          <button
            onClick={toggleAudio}
            title={isMuted ? 'Çayır Esintisi Sesini Aç' : 'Sesi Kapat'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-[#3a2718] to-[#120b06] border border-[#8c6738] text-amber-200 hover:text-white hover:border-amber-300 shadow flex items-center justify-center text-xs cursor-pointer transition active:scale-95 touch-manipulation"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* TAM EKRAN KONTROLÜ */}
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Normal Boyut' : 'Tam Ekran Görünüm'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-[#3a2718] to-[#120b06] border border-[#8c6738] text-amber-200 hover:text-white hover:border-amber-300 shadow flex items-center justify-center text-xs cursor-pointer transition active:scale-95 touch-manipulation"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* HARİTA REHBERİ (?) */}
          <div className="relative">
            <button
              onClick={() => setIsHelpOpen(v => !v)}
              title="Harita Kullanım Rehberi"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-b from-[#5c3c1b] to-[#24170d] border border-[#caa05a] text-[#fcedc7] hover:text-white hover:scale-105 shadow flex items-center justify-center font-serif font-black text-xs cursor-pointer transition active:scale-95 touch-manipulation"
            >
              ?
            </button>

            {/* Rehber Penceresi */}
            {isHelpOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent" onClick={() => setIsHelpOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-80 bg-gradient-to-b from-[#2b1b10]/98 via-[#1a0f08]/98 to-[#120a05]/98 backdrop-blur-md border-2 border-[#caa05a] rounded-xl p-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.95)] text-[#f0e2ca] z-50 text-xs font-serif animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#5c401f]">
                    <span className="font-black text-[#f5d78a] flex items-center gap-1.5 text-sm">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      Taktik Harita Rehberi
                    </span>
                    <button onClick={() => setIsHelpOpen(false)} className="text-amber-300 hover:text-white cursor-pointer text-sm font-bold">✕</button>
                  </div>
                  <div className="mt-2.5 space-y-2 text-[11px] text-[#decab0] leading-relaxed">
                    <p>• <strong>Köyler ve Otağlar:</strong> Kırmızı keçeli otağ çadırları ve dalgalanan beylik sancaklarıdır.</p>
                    <p>• <strong>Kaynaklar & Madenler:</strong> Buğday tarlaları, koruluklar, taş ocakları ve demir madenleridir.</p>
                    <p>• <strong>Mavi Rozetler (4-9):</strong> Madenin verimlilik kademesidir.</p>
                    <p>• <strong>Etki Çemberleri:</strong> Beyliğinize ait köylerin hasat menzilleridir.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. KEŞİF FİLTRELERİ & GÖRSEL KATMAN DÜĞMELERİ */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar p-1 rounded-xl bg-[#191008]/90 border border-[#6b4c2b]/60 text-[10.5px] backdrop-blur-md shadow">
        
        {/* Keşif Filtre Hapları */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] uppercase font-bold text-amber-300/80 px-1 shrink-0">Keşif:</span>
          
          <button
            onClick={() => onSelectFilter('all')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'all'
                ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-white shadow'
                : 'bg-[#120803] text-[#a89476] hover:text-amber-200'
            }`}
          >
            🌿 Tümü
          </button>
          <button
            onClick={() => onSelectFilter('grain')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'grain'
                ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-white shadow'
                : 'bg-[#120803] text-[#a89476] hover:text-amber-200'
            }`}
          >
            🌾 Buğday
          </button>
          <button
            onClick={() => onSelectFilter('iron')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'iron'
                ? 'bg-gradient-to-b from-cyan-700 to-cyan-900 text-white shadow'
                : 'bg-[#120803] text-[#a89476] hover:text-amber-200'
            }`}
          >
            ⛏️ Demir
          </button>
          <button
            onClick={() => onSelectFilter('wood')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'wood'
                ? 'bg-gradient-to-b from-emerald-700 to-emerald-900 text-white shadow'
                : 'bg-[#120803] text-[#a89476] hover:text-amber-200'
            }`}
          >
            🌲 Odun
          </button>
          <button
            onClick={() => onSelectFilter('stone')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'stone'
                ? 'bg-gradient-to-b from-stone-600 to-stone-800 text-white shadow'
                : 'bg-[#120803] text-[#a89476] hover:text-amber-200'
            }`}
          >
            🪨 Taş
          </button>
          <button
            onClick={() => onSelectFilter('gold')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'gold'
                ? 'bg-gradient-to-b from-yellow-600 to-yellow-800 text-white shadow'
                : 'bg-[#120803] text-[#a89476] hover:text-amber-200'
            }`}
          >
            🪙 Altın
          </button>
          <button
            onClick={() => onSelectFilter('rival')}
            className={`px-2 py-0.5 rounded-md font-bold transition shrink-0 cursor-pointer ${
              filterType === 'rival'
                ? 'bg-gradient-to-b from-rose-700 to-rose-900 text-white shadow'
                : 'bg-[#120803] text-[#e09191] hover:text-white'
            }`}
          >
            ⚔️ Düşmanlar
          </button>
        </div>

        {/* Görsel Katman Düğmeleri */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-[#523d26]">
          <button
            onClick={onToggleGrid}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition shrink-0 cursor-pointer ${
              showGrid ? 'text-amber-300 bg-[#2d1b0d] border border-amber-600/50' : 'text-[#786145] hover:text-[#bda688]'
            }`}
            title="Izgara Aç/Kapat"
          >
            📐 Izgara
          </button>
          <button
            onClick={onToggleInfluenceRings}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition shrink-0 cursor-pointer ${
              showInfluenceRings ? 'text-emerald-300 bg-[#0d2616] border border-emerald-600/50' : 'text-[#786145] hover:text-[#bda688]'
            }`}
            title="Etki Çemberleri Aç/Kapat"
          >
            ⭕ Çember
          </button>
          <button
            onClick={onToggleRadar}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition shrink-0 cursor-pointer ${
              showRadar ? 'text-cyan-300 bg-[#0c2333] border border-cyan-600/50' : 'text-[#786145] hover:text-[#bda688]'
            }`}
            title="Radar Göster/Gizle"
          >
            🧭 Radar
          </button>
        </div>
      </div>

    </div>
  );
};

