import React, { useState, useEffect, useRef } from 'react';
import { 
  BattleReport, 
  BuildingType, 
  ConstructionQueueItem, 
  FactionId, 
  March, 
  MarchMission, 
  ResourceNode, 
  Resources, 
  TrainingQueueItem, 
  UnitType, 
  Village,
  KhanHero
} from './types/game';
import { calculateReviveCost, calculateReviveDurationSec, calculateNextLevelXp, calculateBattleXp } from './engine/heroLogic';
import { 
  BUILDINGS, 
  FACTIONS, 
  GAME_SPEED_MULTIPLIER,
  INITIAL_PLAYER_VILLAGE, 
  INITIAL_PLAYER_VILLAGES, 
  INITIAL_RESOURCE_NODES, 
  INITIAL_RIVAL_VILLAGES, 
  UNITS, 
  canFoundNewVillage,
  getBuildingUpgradeCost, 
  getBuildingUpgradeDuration, 
  getCapturedNodesForVillage, 
  getInfluenceRadius,
  getMaxAllowedVillages,
  MAX_PLAYER_VILLAGES,
  TOWN_HALL_LEVEL_FOR_NEW_VILLAGE
} from './data/gameData';
import { 
  applyResourceGrowth, 
  calculateVillageResourceRates,
  getVillageMaxCapacity
} from './engine/simulation';
import { 
  processSharedTick, 
  calculateTotalSharedRates, 
  calculateTotalSharedCapacity, 
  calculateSharedTreasury 
} from './engine/production';
import { 
  processPopulationTick, 
  convertWorkerToTroop, 
  canConvertWorkerToTroop 
} from './engine/populationEngine';
import { processRadiusGrowthTick } from './engine/radiusEngine';
import { generateAllWorldResourceNodes, ensureNearbyResourcesForVillage } from './engine/worldResourceEngine';
import { assignWorkers, unassignWorkers } from './engine/resourceEngine';
import { simulateBattle } from './engine/lanchester';
import { 
  processMarchesTick, 
  processVillageSupportUpkeepAndStarvation, 
  recallSupportArmy 
} from './engine/marchTick';
import { collisionDataMap } from './engine/collisionDataMap';

// Bileşenler
import { ResourceHeader } from './components/ResourceHeader';
import { HeaderBar } from './components/HeaderBar';
import { VillageView } from './components/VillageView';
import { MapView } from './components/MapView';
import { MilitaryPanel } from './components/MilitaryPanel';
import { BattleReportsView } from './components/BattleReportsView';
import { CombatSimulatorView } from './components/CombatSimulatorView';
import { ArchitectureModal } from './components/ArchitectureModal';
import { BuildingModal } from './components/BuildingModal';
import { FactionSelectModal } from './components/FactionSelectModal';
import { FoundVillageModal, FOUND_VILLAGE_COST } from './components/FoundVillageModal';
import { BottomNavBar } from './components/BottomNavBar';
import { SupabaseSchemaModal } from './components/SupabaseSchemaModal';
import { KhanModal } from './components/KhanModal';
import { UmaykutVictoryPanel } from './components/UmaykutVictoryPanel';
import { WorkerAllocationDrawer } from './components/WorkerAllocationDrawer';
import { 
  updateWorkerAllocation, 
  allocateWorkersToResourceCategory,
  distributeWorkersEquallyAcrossNodes,
  recallAllWorkersFromNodes,
  getVillageTotalPopulation, 
  getVillageIdleWorkers, 
  getVillageResourceWorkers 
} from './engine/workerEngine';
import { 
  ForgeUpgradeType, 
  FORGE_UPGRADE_CONFIGS, 
  getForgeUpgradeCost, 
  getForgeUpgradeDuration, 
  getVillageForgeUpgrades,
  ForgeResearchQueueItem 
} from './types/military';
import { loadPlayerAlliance, savePlayerAlliance } from './engine/allianceEngine';
import { Alliance } from './types/game';
import { RoyalMarketView } from './components/RoyalMarketView';
import { LeaderboardView } from './components/LeaderboardView';
import { HospitalModal } from './components/HospitalModal';
import { calculatePlayerKudret, generateLeaderboard } from './engine/kudretEngine';
import { DIVAN_PETITIONS, INITIAL_MARKET_BARGAINS, INITIAL_IMPERIAL_QUESTS } from './data/divanData';
import { DivanPetition, ActiveDivanBuff, HorseBreed, MarketBargain, ImperialQuest, WoundedSoldierGroup } from './types/divanTypes';
import { ResourceType } from './types/game';

export default function App() {
  // 1. Köy ve Oyun Durumları (Local Storage Destekli Çoklu Köy Sistemi)
  const [playerVillages, setPlayerVillages] = useState<Village[]>(() => {
    const savedList = localStorage.getItem('beylikler_player_villages');
    if (savedList) {
      try { 
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((v: Village, index: number) => {
            let villageName = v.name;
            // İlk köy (başkent) adı otomatik MERKEZ olsun
            if (index === 0 && (villageName.toLowerCase() === 'merkez' || villageName === 'Otağ-ı Hümayun' || villageName === 'Otağ')) {
              villageName = 'MERKEZ';
            }
            return {
              ...v,
              name: villageName,
              radius: v.radius ?? 1.0,
              maxCapacity: Math.max(5000000, v.maxCapacity || 5000000),
              resources: {
                wood: Math.min(5000000, Math.max(25000, v.resources?.wood ?? 25000)),
                stone: Math.min(5000000, Math.max(25000, v.resources?.stone ?? 25000)),
                iron: Math.min(5000000, Math.max(20000, v.resources?.iron ?? 20000)),
                grain: Math.min(5000000, Math.max(30000, v.resources?.grain ?? 30000)),
                gold: Math.min(5000000, Math.max(10000, v.resources?.gold ?? 10000)),
              },
              lastRadiusExpansionTimestamp: v.lastRadiusExpansionTimestamp ?? Date.now(),
              assignedWorkers: v.assignedWorkers ?? {},
              workingPopulation: v.workingPopulation ?? 10,
              idlePopulation: v.idlePopulation ?? 25,
              lastPopulationSpawnTimestamp: v.lastPopulationSpawnTimestamp ?? Date.now(),
              lastPlunderedTimestamp: v.lastPlunderedTimestamp ?? undefined,
            };
          });
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PLAYER_VILLAGES;
  });

  const [activeVillageId, setActiveVillageId] = useState<string>(() => {
    const savedId = localStorage.getItem('beylikler_active_village_id');
    return savedId || (playerVillages[0] ? playerVillages[0].id : INITIAL_PLAYER_VILLAGES[0].id);
  });

  const [khan, setKhan] = useState<KhanHero>(() => {
    const saved = localStorage.getItem('beylikler_khan');
    const defaultPlayerName = localStorage.getItem('beylikler_player_name') || 'Alp Arslan';
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (!parsed.name || parsed.name === 'Ulu Hakan') {
          parsed.name = defaultPlayerName;
        }
        return parsed;
      } catch (e) { /* ignore */ }
    }
    return {
      id: 'khan_1',
      name: defaultPlayerName,
      level: 1,
      xp: 0,
      xpNext: 1000,
      status: 'idle',
      currentVillageId: playerVillages[0] ? playerVillages[0].id : INITIAL_PLAYER_VILLAGES[0].id,
      unspentSkillPoints: 1,
      skills: {
        attackAura: 0,
        defenseAura: 0,
        cavalrySpeed: 0,
        governance: 0
      }
    };
  });

  // Aktif Köy
  const village = playerVillages.find(v => v.id === activeVillageId) || playerVillages[0] || INITIAL_PLAYER_VILLAGES[0];

  const [rivalVillages, setRivalVillages] = useState<Village[]>(() => {
    const saved = localStorage.getItem('beylikler_rivals');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(v => v.name === 'osmanli1')) return parsed;
      } catch (e) { /* ignore */ }
    }
    return INITIAL_RIVAL_VILLAGES;
  });

  const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>(() => {
    return generateAllWorldResourceNodes();
  });

  const [activeMarches, setActiveMarches] = useState<March[]>(() => {
    const saved = localStorage.getItem('beylikler_marches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [constructionQueue, setConstructionQueue] = useState<ConstructionQueueItem[]>(() => {
    const saved = localStorage.getItem('beylikler_construction');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [trainingQueue, setTrainingQueue] = useState<TrainingQueueItem[]>(() => {
    const saved = localStorage.getItem('beylikler_training');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [battleReports, setBattleReports] = useState<BattleReport[]>(() => {
    const saved = localStorage.getItem('beylikler_reports');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.filter((r: BattleReport) => {
            if (!r || !r.id || seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
        }
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  // Navigasyon & Modal Durumları (Varsayılan: Geniş Temel Anadolu Haritası)
  const [activeTab, setActiveTab] = useState<any>('map');
  const [activeBuildingModal, setActiveBuildingModal] = useState<BuildingType | null>(null);
  const [isFoundVillageModalOpen, setIsFoundVillageModalOpen] = useState<boolean>(false);
  const [isKhanModalOpen, setIsKhanModalOpen] = useState<boolean>(false);
  const [isVictoryPanelOpen, setIsVictoryPanelOpen] = useState<boolean>(false);
  const [isWorkerDrawerOpen, setIsWorkerDrawerOpen] = useState<boolean>(false);
  const [alliance, setAlliance] = useState<Alliance>(() => loadPlayerAlliance());

  // Divan, Pazar, Sıralama, Şifahane ve Hükümdar Görevleri State'leri
  const [petitions, setPetitions] = useState<DivanPetition[]>(() => {
    const saved = localStorage.getItem('otag_petitions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DIVAN_PETITIONS;
  });

  const [activeBuffs, setActiveBuffs] = useState<ActiveDivanBuff[]>(() => {
    const saved = localStorage.getItem('otag_buffs');
    if (saved) {
      try { 
        const parsed: ActiveDivanBuff[] = JSON.parse(saved);
        return parsed.filter(b => b.expiresAt > Date.now());
      } catch (e) { /* ignore */ }
    }
    return [];
  });

  const [marketBargains, setMarketBargains] = useState<MarketBargain[]>(() => {
    const saved = localStorage.getItem('otag_bargains');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_MARKET_BARGAINS;
  });

  const [imperialQuests, setImperialQuests] = useState<ImperialQuest[]>(() => {
    const saved = localStorage.getItem('otag_quests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ImperialQuest[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initial quest definitions to guarantee latest targetType & keys
          return INITIAL_IMPERIAL_QUESTS.map(initQ => {
            const match = parsed.find(p => p.id === initQ.id);
            if (match) {
              return {
                ...initQ,
                currentCount: typeof match.currentCount === 'number' ? match.currentCount : initQ.currentCount,
                isCompleted: !!match.isCompleted,
                isClaimed: !!match.isClaimed,
              };
            }
            return initQ;
          });
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_IMPERIAL_QUESTS;
  });

  const [isQuestBannerDismissed, setIsQuestBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('otag_quest_banner_dismissed') === 'true';
  });

  const [woundedGroups, setWoundedGroups] = useState<WoundedSoldierGroup[]>(() => {
    const saved = localStorage.getItem('otag_wounded');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      { unitType: 'mizrakli', count: 4, grainHealCostPerUnit: 25, goldHealCostPerUnit: 10, healDurationSecPerUnit: 1 },
      { unitType: 'hafif_suvari', count: 2, grainHealCostPerUnit: 40, goldHealCostPerUnit: 20, healDurationSecPerUnit: 1 }
    ];
  });

  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState<boolean>(false);

  const [lockedFaction, setLockedFaction] = useState<FactionId | null>(() => {
    return localStorage.getItem('otag_locked_faction') as FactionId | null;
  });

  const handleInitialFactionSelect = (factionId: FactionId, chosenPlayerName?: string) => {
    const finalPlayerName = (chosenPlayerName && chosenPlayerName.trim()) || localStorage.getItem('beylikler_player_name') || 'Alp Arslan';
    localStorage.setItem('otag_locked_faction', factionId);
    localStorage.setItem('beylikler_player_name', finalPlayerName);
    setLockedFaction(factionId);
    
    // Hakan ve Lider Adını Kullanıcının Belirlediği Oyuncu Adı Yap
    setKhan(prev => ({
      ...prev,
      name: finalPlayerName,
    }));

    // Rastgele başlangıç koordinatı (200-800 X, 100-400 Y)
    const startX = 200 + Math.floor(Math.random() * 600);
    const startY = 100 + Math.floor(Math.random() * 300);

    const newCapitalVillage: Village = {
      id: `v_capital_${Date.now()}`,
      name: 'MERKEZ',
      x: startX,
      y: startY,
      ownerName: finalPlayerName,
      isPlayer: true,
      faction: factionId,
      resources: { wood: 800, stone: 800, iron: 800, grain: 800, gold: 300 },
      maxCapacity: 2000,
      buildings: {
        town_hall: 1,
        barracks: 0,
        stables: 0,
        watchtower: 0,
        wall: 0,
        market: 0,
        hideout: 1
      },
      units: {
        mizrakli: 15,
        kilicli: 0,
        hafif_suvari: 0,
        casus: 0,
        kocbasi: 0,
        gulam: 0,
        levent: 0,
        akinci: 0,
        karaman_alpi: 0,
        tura: 0,
        kure_baltacisi: 0,
        bozok_suvarisi: 0
      },
      workingPopulation: 10,
      idlePopulation: 25,
      lastPopulationSpawnTimestamp: Date.now(),
    };

    setPlayerVillages([newCapitalVillage]);
    setActiveVillageId(newCapitalVillage.id);
  };

  const handleUpdateAlliance = (updated: Alliance) => {
    setAlliance(updated);
    savePlayerAlliance(updated);
  };

  const handleUpdateWorkerDelta = (
    villageId: string, 
    resourceType: 'wood' | 'stone' | 'iron' | 'grain', 
    delta: number
  ) => {
    const targetVillage = playerVillages.find(v => v.id === villageId) || village;
    if (!targetVillage) return;

    const result = allocateWorkersToResourceCategory(targetVillage, resourceNodes, resourceType, delta);
    if (!result.success && result.reason) {
      showBanner(`⚠️ ${result.reason}`);
      return;
    }

    if (result.success) {
      setPlayerVillages(prev => prev.map(v => v.id === targetVillage.id ? result.updatedVillage : v));
      setResourceNodes(result.updatedNodes);
      if (delta > 0) {
        showBanner(`⛏️ ${targetVillage.name}: ${delta} işçi ${resourceType === 'wood' ? 'Odun' : resourceType === 'stone' ? 'Taş' : resourceType === 'iron' ? 'Demir' : 'Tahıl'} madenlerine sevk edildi!`);
      } else {
        showBanner(`↩️ ${targetVillage.name}: ${Math.abs(delta)} işçi madenlerden köye geri çağrıldı.`);
      }
    }
  };

  const handleDistributeWorkersEqually = (villageId: string) => {
    const targetVillage = playerVillages.find(v => v.id === villageId) || village;
    if (!targetVillage) return;
    const result = distributeWorkersEquallyAcrossNodes(targetVillage, resourceNodes);
    if (!result.success && result.reason) {
      showBanner(`⚠️ ${result.reason}`);
      return;
    }
    if (result.success) {
      setPlayerVillages(prev => prev.map(v => v.id === targetVillage.id ? result.updatedVillage : v));
      setResourceNodes(result.updatedNodes);
      showBanner(`⚖️ ${targetVillage.name}: Boşta ahali menzildeki madenlere eşit ve dengeli dağıtıldı.`);
    }
  };

  const handleRecallAllWorkers = (villageId: string) => {
    const targetVillage = playerVillages.find(v => v.id === villageId) || village;
    if (!targetVillage) return;
    const result = recallAllWorkersFromNodes(targetVillage, resourceNodes);
    if (result.success) {
      setPlayerVillages(prev => prev.map(v => v.id === targetVillage.id ? result.updatedVillage : v));
      setResourceNodes(result.updatedNodes);
      showBanner(`🔄 ${targetVillage.name}: Tüm maden işçileri geri çağrıldı ve boşta ahali havuzuna eklendi.`);
    }
  };

  const handleApplyVillageUpdate = (updatedVillage: Village) => {
    setPlayerVillages(prev => prev.map(v => v.id === updatedVillage.id ? updatedVillage : v));
  };

  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [foundVillagePrefilledCoords, setFoundVillagePrefilledCoords] = useState<{ x: number; y: number } | null>(null);
  const [prefilledMarchTarget, setPrefilledMarchTarget] = useState<{ village: Village | null; coords: { x: number; y: number } } | null>(null);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Canlı Kaynak Oranları (Ortak Kasa & Tüm Beylik Köyleri İçin Saatlik)
  const resourceRates = calculateTotalSharedRates(
    playerVillages, 
    resourceNodes,
    khan.status === 'idle' ? khan.skills.governance * 1.0 : 0
  );

  // Veri Saklama
  useEffect(() => {
    localStorage.setItem('beylikler_khan', JSON.stringify(khan));
  }, [khan]);

  useEffect(() => {
    localStorage.setItem('beylikler_player_villages', JSON.stringify(playerVillages));
    localStorage.setItem('beylikler_village', JSON.stringify(village));
  }, [playerVillages, village]);

  useEffect(() => {
    localStorage.setItem('beylikler_active_village_id', activeVillageId);
  }, [activeVillageId]);

  useEffect(() => {
    localStorage.setItem('beylikler_marches', JSON.stringify(activeMarches));
  }, [activeMarches]);

  useEffect(() => {
    localStorage.setItem('beylikler_construction', JSON.stringify(constructionQueue));
  }, [constructionQueue]);

  useEffect(() => {
    localStorage.setItem('beylikler_training', JSON.stringify(trainingQueue));
  }, [trainingQueue]);

  useEffect(() => {
    localStorage.setItem('beylikler_reports', JSON.stringify(battleReports));
  }, [battleReports]);

  // Divan & Kudret LocalStorage Kayıtları
  useEffect(() => {
    localStorage.setItem('otag_petitions', JSON.stringify(petitions));
  }, [petitions]);

  useEffect(() => {
    localStorage.setItem('otag_buffs', JSON.stringify(activeBuffs));
  }, [activeBuffs]);

  useEffect(() => {
    localStorage.setItem('otag_bargains', JSON.stringify(marketBargains));
  }, [marketBargains]);

  useEffect(() => {
    localStorage.setItem('otag_quests', JSON.stringify(imperialQuests));
  }, [imperialQuests]);

  useEffect(() => {
    localStorage.setItem('otag_wounded', JSON.stringify(woundedGroups));
  }, [woundedGroups]);

  // Bildirim zaman aşımı
  const showBanner = (msg: string) => {
    setBannerAlert(msg);
    setTimeout(() => setBannerAlert(null), 5000);
  };

  // Refs to avoid stale closures in tick interval
  const playerVillagesRef = useRef(playerVillages);
  playerVillagesRef.current = playerVillages;
  const rivalVillagesRef = useRef(rivalVillages);
  rivalVillagesRef.current = rivalVillages;
  const khanRef = useRef(khan);
  khanRef.current = khan;

  // 2. TICK-RATE SİMÜLASYON MOTORU (Her 1000ms / 1 Saniyede Bir)
  useEffect(() => {
    let lastTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      // Hakan Dirilme Kontrolü
      setKhan(prevKhan => {
        if (prevKhan.status === 'reviving' && prevKhan.reviveFinishTimestamp && now >= prevKhan.reviveFinishTimestamp) {
          showBanner(`👑 Hakan '${prevKhan.name}' iyileşti ve Merkez Otağ'a döndü.`);
          return {
            ...prevKhan,
            status: 'idle',
            reviveFinishTimestamp: null,
            currentVillageId: playerVillages[0]?.id || prevKhan.currentVillageId
          };
        }
        return prevKhan;
      });

      // A. Tüm Oyuncu Köyleri İçin Ortak Kasa Kaynak Artışı ve Nüfus Doğumu
      setPlayerVillages(prevVillages => {
        if (!prevVillages || prevVillages.length === 0) return prevVillages;

        // 1. Ortak Hazine Artışı (Tüm köyler tek bir ortak kasayı paylaşır, 100x hızlandırma)
        const governanceBonus = khan.status === 'idle' ? khan.skills.governance * 1.0 : 0;
        const tickResult = processSharedTick(
          prevVillages,
          resourceNodes,
          deltaSec,
          governanceBonus
        );

        // 2. Her Köyün Nüfus Doğumunu İşle (Karaman/Otağ bonuslu)
        // 3. Her Köyün Zamanla Yarıçap Genişlemesini İşle (Umaykut Okul/Beylik Kuralları)
        // 4. Garnizonda Bulunan Destek Birliklerinin Tahıl Tüketimi ve Açlık (Starvation)
        return tickResult.updatedVillages.map(v => {
          const popResult = processPopulationTick(v, now);
          // Artık doğan alplar için sürekli bildirim göstermiyoruz (kullanıcı talebi üzerine)
          const radResult = processRadiusGrowthTick(popResult.village, now);
          if (radResult.expanded) {
            showBanner(`⭕ ${v.name}: Etki çemberi genişledi! Yeni yarıçap: ${radResult.newRadius.toFixed(1)} birim.`);
          }

          const { updatedVillage: fedVillage } = processVillageSupportUpkeepAndStarvation(radResult.village, deltaSec * GAME_SPEED_MULTIPLIER);
          // Artık tahıl ambarı boşaldı veya açlık bildirimlerini arayüzde (banner) göstermiyoruz.

          // 5. Demirci Araştırma Kuyruğu Kontrolü
          let finalVillage = fedVillage;
          const forgeQueue = finalVillage.forgeResearchQueue || [];
          if (forgeQueue.length > 0) {
            const currentResearch = forgeQueue[0];
            if (now >= currentResearch.endTime) {
              const cfg = FORGE_UPGRADE_CONFIGS[currentResearch.upgradeType];
              const prevUpgrades = getVillageForgeUpgrades(finalVillage);
              const newUpgrades = {
                ...prevUpgrades,
                [currentResearch.upgradeType]: currentResearch.targetLevel,
              };
              showBanner(`⚒️ ${finalVillage.name}: Demirci Ocağında "${cfg.name}" Seviye ${currentResearch.targetLevel} araştırması tamamlandı! (+%${currentResearch.targetLevel * cfg.bonusPerLevelPct} muharebe katkısı aktif)`);
              finalVillage = {
                ...finalVillage,
                forgeUpgrades: newUpgrades,
                forgeResearchQueue: forgeQueue.slice(1),
              };
            }
          }

          return finalVillage;
        });
      });

      // B. İnşaat Kuyruğu Kontrolü
      setConstructionQueue(prevQueue => {
        if (prevQueue.length === 0) return prevQueue;
        const remaining: ConstructionQueueItem[] = [];

        for (const item of prevQueue) {
          if (now >= item.endTime) {
            // İnşaat tamamlandı!
            setPlayerVillages(prevVillages => prevVillages.map(v => {
              if (v.id === item.villageId || (!item.villageId && v.id === activeVillageId)) {
                const updatedBuildings = {
                  ...v.buildings,
                  [item.buildingType]: item.targetLevel,
                };

                if (item.buildingType === 'town_hall') {
                  const newRadius = getInfluenceRadius(item.targetLevel);
                  showBanner(`🏰 ${v.name}: Merkez Binası Seviye ${item.targetLevel}'e ulaştı! Harita etki alanınız ${newRadius} tile'a genişledi.`);
                } else {
                  showBanner(`🔨 ${v.name}: ${BUILDINGS[item.buildingType].name} Seviye ${item.targetLevel} inşaatı tamamlandı!`);
                }

                return {
                  ...v,
                  buildings: updatedBuildings,
                };
              }
              return v;
            }));
          } else {
            remaining.push(item);
          }
        }

        return remaining;
      });

      // C. Asker Eğitim Kuyruğu Kontrolü
      setTrainingQueue(prevTraining => {
        if (prevTraining.length === 0) return prevTraining;
        const updated: TrainingQueueItem[] = [];

        for (const item of prevTraining) {
          if (now >= item.nextFinishTime) {
            // 1 birim eğitildi
            setPlayerVillages(prevVillages => prevVillages.map(v => {
              if (v.id === item.villageId || (!item.villageId && v.id === activeVillageId)) {
                return {
                  ...v,
                  units: {
                    ...v.units,
                    [item.unitType]: (v.units[item.unitType] || 0) + 1,
                  },
                };
              }
              return v;
            }));

            const remainingAmount = item.remainingAmount - 1;
            if (remainingAmount > 0) {
              updated.push({
                ...item,
                remainingAmount,
                nextFinishTime: now + (item.unitDurationSec * 1000),
              });
            } else {
              showBanner(`⚔️ ${UNITS[item.unitType].name} birimlerinin eğitimi tamamlandı ve garnizona katıldı.`);
            }
          } else {
            updated.push(item);
          }
        }

        return updated;
      });

      // D. Seferler (Marches) ve Umaykut Savaş / Yağma / Destek Çözümleme Motoru
      setActiveMarches(prevMarches => {
        if (prevMarches.length === 0) return prevMarches;

        const tickRes = processMarchesTick({
          marches: prevMarches,
          playerVillages: playerVillagesRef.current,
          rivalVillages: rivalVillagesRef.current,
          khan: khanRef.current,
          now,
        });

        if (tickRes.newReports.length > 0) {
          setBattleReports(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const uniqueNew = tickRes.newReports.filter(r => !existingIds.has(r.id));
            if (uniqueNew.length === 0) return prev;
            return [...uniqueNew, ...prev];
          });
        }

        if (tickRes.notifications.length > 0) {
          tickRes.notifications.forEach(msg => showBanner(msg));
        }

        if (tickRes.updatedPlayerVillages !== playerVillagesRef.current) {
          setPlayerVillages(tickRes.updatedPlayerVillages);
        }

        if (tickRes.updatedRivalVillages !== rivalVillagesRef.current) {
          setRivalVillages(tickRes.updatedRivalVillages);
        }

        if (tickRes.updatedKhan !== khanRef.current) {
          setKhan(tickRes.updatedKhan);
        }

        return tickRes.updatedMarches;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [resourceNodes, rivalVillages, activeVillageId, village.faction, village.name, village.x, village.y]);

  // 3. Eylemler (İnşaat Başlatma, Asker Eğitme, Pazar Takası, Sefer Çıkarma, Köy Kurma, İşçi Atama)
  const handleAssignWorkers = (villageId: string, nodeId: string, count: number = 10) => {
    const targetVillage = playerVillages.find(v => v.id === villageId) || village;
    const targetNode = resourceNodes.find(n => n.id === nodeId);
    if (!targetVillage || !targetNode) return;

    if (count < 0) {
      const result = unassignWorkers(targetVillage, targetNode, Math.abs(count));
      if (!result.success) {
        showBanner(`⚠️ ${result.error || 'İşçi geri çekilemedi!'}`);
        return;
      }
      setPlayerVillages(prev => prev.map(v => v.id === targetVillage.id ? result.updatedVillage : v));
      setResourceNodes(prev => prev.map(n => n.id === targetNode.id ? result.updatedNode : n));
      showBanner(`↩️ ${targetVillage.name}: ${targetNode.name} kaynağından ${Math.abs(count)} işçi geri çağrıldı ve boşta nüfusa eklendi.`);
      return;
    }

    const result = assignWorkers(targetVillage, targetNode, count);
    if (!result.success) {
      showBanner(`⚠️ ${result.error || 'İşçi atanamadı!'}`);
      return;
    }

    setPlayerVillages(prev => prev.map(v => v.id === targetVillage.id ? result.updatedVillage : v));
    setResourceNodes(prev => prev.map(n => n.id === targetNode.id ? result.updatedNode : n));

    showBanner(`⛏️ ${targetVillage.name}: ${targetNode.name} kaynağına ${count} işçi sevk edildi! (+${result.additionalYieldPerHour}/saat üretim)`);
  };

  const handleUpgradeBuilding = (type: BuildingType) => {
    const currentLevel = village.buildings[type] || 0;
    const cost = getBuildingUpgradeCost(type, currentLevel);
    const townHallLevel = village.buildings.town_hall || 1;
    const durationSec = getBuildingUpgradeDuration(type, currentLevel, townHallLevel);

    // Kaynak kontrolü
    if (
      village.resources.wood < cost.wood ||
      village.resources.stone < cost.stone ||
      village.resources.iron < cost.iron ||
      village.resources.grain < cost.grain ||
      village.resources.gold < cost.gold
    ) {
      showBanner(`❌ Yetersiz kaynak: ${BUILDINGS[type].name} yükseltmesi için ortak kasada yeterli kaynak yok.`);
      return;
    }

    // Ortak kasadan kaynakları düş (tüm köylere yansır)
    setPlayerVillages(prevVillages => prevVillages.map(v => ({
      ...v,
      resources: {
        wood: Math.max(0, v.resources.wood - cost.wood),
        stone: Math.max(0, v.resources.stone - cost.stone),
        iron: Math.max(0, v.resources.iron - cost.iron),
        grain: Math.max(0, v.resources.grain - cost.grain),
        gold: Math.max(0, v.resources.gold - cost.gold),
      },
    })));

    // Kuyruğa ekle
    const now = Date.now();
    const newItem: ConstructionQueueItem = {
      id: 'cq_' + now,
      villageId: village.id,
      buildingType: type,
      targetLevel: currentLevel + 1,
      startTime: now,
      durationSec,
      endTime: now + (durationSec * 1000),
    };

    setConstructionQueue(prev => [...prev, newItem]);
    showBanner(`🔨 ${village.name}: ${BUILDINGS[type].name} (Seviye ${currentLevel + 1}) inşaatına başlandı.`);
  };

  const handleAssignBuildingToPlot = (villageId: string, plotId: string, buildingType: BuildingType) => {
    setPlayerVillages(prevVillages => prevVillages.map(v => {
      if (v.id === villageId) {
        const updatedSlots = { ...(v.buildingSlots || {}) };
        // Eğer bu bina daha önce başka bir parsele atanmışsa oradan temizle (tekillik garantisi)
        for (const [existingPlotId, existingType] of Object.entries(updatedSlots)) {
          if (existingType === buildingType && existingPlotId !== plotId) {
            delete updatedSlots[existingPlotId];
          }
        }
        updatedSlots[plotId] = buildingType;
        return {
          ...v,
          buildingSlots: updatedSlots,
        };
      }
      return v;
    }));
  };

  const handleTrainUnits = (unitType: UnitType, amount: number) => {
    const def = UNITS[unitType];
    const totalCost: Resources = {
      wood: def.cost.wood * amount,
      stone: def.cost.stone * amount,
      iron: def.cost.iron * amount,
      grain: def.cost.grain * amount,
      gold: def.cost.gold * amount,
    };

    // Umaykut Online kuralı: 
    // 1. Asker sıfırdan üretilmez, merkezdeki boşta nüfus (alp/işçi) silahlandırılarak orduya alınır!
    // 2. Hammadde ortak kasadan karşılanır.
    const check = canConvertWorkerToTroop(village, unitType, amount, village.resources);
    if (!check.canConvert) {
      showBanner(`❌ Asker Eğitimi Başarısız: ${check.reason || 'Yetersiz boşta nüfus veya hammadde.'}`);
      return;
    }

    const { updatedVillage, updatedTreasury } = convertWorkerToTroop(
      village,
      unitType,
      amount,
      village.resources
    );

    // Boşta nüfusu aktif köyden düş, ortak kaynakları tüm köylerde güncelle
    setPlayerVillages(prevVillages => prevVillages.map(v => {
      const isOrigin = v.id === village.id;
      return {
        ...v,
        idlePopulation: isOrigin ? updatedVillage.idlePopulation : v.idlePopulation,
        resources: updatedTreasury,
      };
    }));

    const now = Date.now();
    let finalTrainingTimeSec = def.trainingTimeSec;
    if (def.category === 'suvari') {
      const breedingMultiplier = (village.faction && FACTIONS[village.faction]?.horseBreedingSpeedMultiplier) || 1.0;
      finalTrainingTimeSec = Math.max(5, Math.round(def.trainingTimeSec / breedingMultiplier));
    }
    // 100x Hızlandırma (minimum 1 saniye)
    const effectiveTrainingTimeSec = Math.max(1, Math.round(finalTrainingTimeSec / GAME_SPEED_MULTIPLIER));

    const newItem: TrainingQueueItem = {
      id: 'tq_' + now,
      villageId: village.id,
      unitType,
      amount,
      remainingAmount: amount,
      unitDurationSec: effectiveTrainingTimeSec,
      nextFinishTime: now + (effectiveTrainingTimeSec * 1000),
    };

    setTrainingQueue(prev => [...prev, newItem]);
    showBanner(`⚔️ ${village.name}: ${amount} boşta alp silahlandırılarak ${amount}x ${def.name} talimine başlandı! (Kalan Boşta: ${updatedVillage.idlePopulation})`);
  };

  const handleStartForgeResearch = (upgradeType: ForgeUpgradeType) => {
    const forgeLevel = village.buildings.forge || 0;
    const currentUpgrades = getVillageForgeUpgrades(village);
    const currentLevel = currentUpgrades[upgradeType] || 0;
    const nextLevel = currentLevel + 1;
    const cfg = FORGE_UPGRADE_CONFIGS[upgradeType];

    if (forgeLevel === 0) {
      showBanner(`❌ Demirci binası inşa edilmelidir!`);
      return;
    }
    if (forgeLevel < nextLevel) {
      showBanner(`❌ Demirci seviyesi yetersiz! (${cfg.name} Seviye ${nextLevel} için Demirci Seviye ${nextLevel} gereklidir)`);
      return;
    }
    if (currentLevel >= cfg.maxLevel) {
      showBanner(`❌ ${cfg.name} son kademeye (10) ulaştı!`);
      return;
    }
    if ((village.forgeResearchQueue || []).length > 0) {
      showBanner(`❌ Demirci ocağı meşgul, devam eden araştırma bitmelidir!`);
      return;
    }

    const cost = getForgeUpgradeCost(upgradeType, nextLevel);
    if (
      village.resources.wood < cost.wood ||
      village.resources.stone < cost.stone ||
      village.resources.iron < cost.iron ||
      village.resources.grain < cost.grain ||
      village.resources.gold < cost.gold
    ) {
      showBanner(`❌ Yetersiz kaynak! Araştırma için ortak kasada hammadde eksik.`);
      return;
    }

    const durationSec = getForgeUpgradeDuration(upgradeType, nextLevel, forgeLevel);
    const now = Date.now();
    const newItem: ForgeResearchQueueItem = {
      id: 'frq_' + now,
      villageId: village.id,
      upgradeType,
      targetLevel: nextLevel,
      startTime: now,
      durationSec,
      endTime: now + (durationSec * 1000),
    };

    setPlayerVillages(prevVillages => prevVillages.map(v => {
      const isTarget = v.id === village.id;
      return {
        ...v,
        resources: {
          wood: Math.max(0, v.resources.wood - cost.wood),
          stone: Math.max(0, v.resources.stone - cost.stone),
          iron: Math.max(0, v.resources.iron - cost.iron),
          grain: Math.max(0, v.resources.grain - cost.grain),
          gold: Math.max(0, v.resources.gold - cost.gold),
        },
        forgeResearchQueue: isTarget ? [newItem] : (v.forgeResearchQueue || []),
      };
    }));

    showBanner(`🔥 ${village.name}: Demirci Ocağında "${cfg.name}" (Seviye ${nextLevel}) araştırmasına başlandı. (${durationSec} sn)`);
  };

  const handleCancelForgeResearch = (queueItemId: string) => {
    setPlayerVillages(prevVillages => prevVillages.map(v => {
      if (v.id === village.id) {
        return {
          ...v,
          forgeResearchQueue: (v.forgeResearchQueue || []).filter(item => item.id !== queueItemId),
        };
      }
      return v;
    }));
    showBanner(`🛑 Demirci araştırması iptal edildi.`);
  };

  const handleMarketTrade = (fromRes: keyof Resources, toRes: keyof Resources, amount: number) => {
    setPlayerVillages(prevVillages => {
      const totalCap = calculateTotalSharedCapacity(prevVillages);
      return prevVillages.map(v => ({
        ...v,
        resources: {
          ...v.resources,
          [fromRes]: Math.max(0, v.resources[fromRes] - amount),
          [toRes]: Math.min(totalCap, v.resources[toRes] + amount),
        },
        maxCapacity: totalCap,
      }));
    });
    showBanner(`⚖️ Ortak Kasa Pazar Takası: ${amount} ${fromRes.toUpperCase()} → ${amount} ${toRes.toUpperCase()} takas edildi.`);
  };

  const handleDispatchMarch = (
    targetCoords: { x: number; y: number },
    targetName: string,
    mission: MarchMission,
    units: Partial<Record<UnitType, number>>,
    withKhan: boolean = false,
    originVillageId?: string,
    isBoosted?: boolean
  ) => {
    // Khan durumu güncelle
    if (withKhan) {
      setKhan(prev => ({
        ...prev,
        status: 'marching'
      }));
    }

    const sourceVillage = (originVillageId ? playerVillages.find(v => v.id === originVillageId) : null) || village;

    // Askerleri garnizondan düş
    setPlayerVillages(prevVillages => prevVillages.map(v => {
      if (v.id === sourceVillage.id) {
        const updated = { ...v.units };
        for (const [uType, count] of Object.entries(units)) {
          if (count) {
            const k = uType as UnitType;
            updated[k] = Math.max(0, (updated[k] || 0) - count);
          }
        }
        return { ...v, units: updated };
      }
      return v;
    }));

    const dist = Math.sqrt(
      Math.pow(targetCoords.x - sourceVillage.x, 2) + Math.pow(targetCoords.y - sourceVillage.y, 2)
    );
    let slowestSpeed = 999;
    for (const [uKey, count] of Object.entries(units)) {
      if (count && count > 0) {
        const spd = UNITS[uKey as UnitType].speedTilesPerMin;
        if (spd < slowestSpeed) slowestSpeed = spd;
      }
    }
    if (slowestSpeed === 999) slowestSpeed = 2.0;

    const factionMarchMult = (sourceVillage.faction && FACTIONS[sourceVillage.faction]?.marchSpeedMultiplier) || 1.0;
    slowestSpeed *= factionMarchMult;

    if (withKhan) {
      slowestSpeed *= (1.0 + (khan.skills.cavalrySpeed * 2.0) / 100);
    }

    let durationSec = Math.max(8, Math.round((dist / slowestSpeed) * 60));
    if (isBoosted) {
      durationSec = Math.max(4, Math.round(durationSec / 2));
    }
    // 100x Hızlandırma (minimum 2 saniye)
    durationSec = Math.max(2, Math.round(durationSec / GAME_SPEED_MULTIPLIER));
    const now = Date.now();

    const newMarch: March = {
      id: 'march_' + now,
      originVillageId: sourceVillage.id,
      originVillageName: sourceVillage.name,
      originCoordinates: { x: sourceVillage.x, y: sourceVillage.y },
      targetCoordinates: targetCoords,
      targetName,
      mission,
      units,
      withKhan,
      startTime: now,
      durationSec,
      arrivalTime: now + (durationSec * 1000),
      isReturning: false,
    };

    setActiveMarches(prev => [...prev, newMarch]);
    const missionIcon = mission === 'attack' ? '⚔️ Taarruz' : mission === 'raid' ? '🏇 Yağma' : mission === 'support' ? '🛡️ Destek' : '👁️ Casusluk';
    showBanner(`${missionIcon} ordusu sefere çıktı! ${sourceVillage.name} otağından ${targetName} (${targetCoords.x}|${targetCoords.y}) hedefine intikal ${durationSec} sn sürecek.`);
  };

  const handleRecallSupportArmy = (supportArmyId: string) => {
    const { updatedTargetVillage, returnMarch, error } = recallSupportArmy(
      village,
      supportArmyId,
      playerVillages,
      Date.now()
    );

    if (error) {
      showBanner(`❌ ${error}`);
      return;
    }

    setPlayerVillages(prev => prev.map(v => v.id === village.id ? updatedTargetVillage : v));
    if (returnMarch) {
      setActiveMarches(prev => [...prev, returnMarch]);
      showBanner(`🛡️ Destek birliği geri çağrıldı ve intikale başladı.`);
    }
  };

  const handleSelectVillage = (vId: string) => {
    const targetV = playerVillages.find(v => v.id === vId);
    if (targetV) {
      setActiveVillageId(vId);
      showBanner(`🏰 '${targetV.name}' (${targetV.x}|${targetV.y}) otağına geçiş yapıldı.`);
    }
  };

  const handleFoundVillage = (name: string, x: number, y: number) => {
    // 0. Köy Kurma Şartı & Limit Kontrolü (Maksimum 10 Köy, Her yeni köy için Merkez Otağ Lv.10 gereklidir)
    const ruleCheck = canFoundNewVillage(playerVillages);
    if (!ruleCheck.allowed) {
      showBanner(`❌ İskan Hatası: ${ruleCheck.reason}`);
      return;
    }

    // 1. Sınır Kontrolü
    if (x < 0 || x > 1000 || y < 0 || y > 500) {
      showBanner(`❌ İskan Hatası: (${x}, ${y}) harita sınırları dışındadır.`);
      return;
    }

    const isOccupied = playerVillages.some(v => v.x === x && v.y === y) || rivalVillages.some(r => r.x === x && r.y === y);
    if (isOccupied) {
      showBanner(`❌ İskan Hatası: (${x}, ${y}) koordinatında zaten bir yerleşim yeri bulunmaktadır.`);
      return;
    }

    // 2. Maliyet kontrolü ve düşüşü
    const cost = FOUND_VILLAGE_COST;
    if (
      village.resources.wood < cost.wood ||
      village.resources.stone < cost.stone ||
      village.resources.iron < cost.iron ||
      village.resources.grain < cost.grain ||
      village.resources.gold < cost.gold
    ) {
      showBanner(`❌ Yeni köy kurmak için yeterli kaynak yok.`);
      return;
    }

    // Yeni köy oluştur
    const newVillageId = 'village_' + Date.now();
    const newVillage: Village = {
      id: newVillageId,
      name,
      x,
      y,
      ownerName: village.ownerName,
      faction: village.faction,
      isPlayer: true,
      buildings: {
        town_hall: 1,
        barracks: 0,
        stables: 0,
        watchtower: 0,
        wall: 0,
        market: 0,
        hideout: 0,
      },
      units: {
        mizrakli: 5,
        kilicli: 0,
        hafif_suvari: 0,
        casus: 2,
        kocbasi: 0,
        gulam: 0,
        levent: 0,
        akinci: 0,
        karaman_alpi: 0,
        tura: 0,
        kure_baltacisi: 0,
        bozok_suvarisi: 0,
      },
      workingPopulation: 5,
      idlePopulation: 15,
      lastPopulationSpawnTimestamp: Date.now(),
      resources: { ...village.resources },
      maxCapacity: village.maxCapacity,
    };

    setPlayerVillages(prev => {
      // Ortak kasadan maliyeti düş
      const updatedExisting = prev.map(v => ({
        ...v,
        resources: {
          wood: Math.max(0, v.resources.wood - cost.wood),
          stone: Math.max(0, v.resources.stone - cost.stone),
          iron: Math.max(0, v.resources.iron - cost.iron),
          grain: Math.max(0, v.resources.grain - cost.grain),
          gold: Math.max(0, v.resources.gold - cost.gold),
        },
      }));

      const newSharedRes = updatedExisting[0] ? updatedExisting[0].resources : newVillage.resources;
      const combined = [...updatedExisting, { ...newVillage, resources: newSharedRes }];
      const newTotalCap = calculateTotalSharedCapacity(combined);

      return combined.map(v => ({
        ...v,
        resources: newSharedRes,
        maxCapacity: newTotalCap,
      }));
    });

    // Yeni kurulan köyün çeperine garantili 5 temel kaynak yerleştir
    setResourceNodes(prevNodes => ensureNearbyResourcesForVillage({ x, y }, name, prevNodes));

    setActiveVillageId(newVillageId);
    setIsFoundVillageModalOpen(false);
    showBanner(`⛺ Yeni köyünüz '${name}' (${x}|${y}) kuruldu ve beyliğinize katıldı!`);
  };

  const handleAddTestResources = () => {
    setPlayerVillages(prevVillages => {
      const added = 100000;
      return prevVillages.map(v => ({
        ...v,
        resources: {
          wood: (v.resources?.wood || 0) + added,
          stone: (v.resources?.stone || 0) + added,
          iron: (v.resources?.iron || 0) + added,
          grain: (v.resources?.grain || 0) + added,
          gold: (v.resources?.gold || 0) + (added / 2),
        }
      }));
    });
    showBanner('⚡ +100.000 Test Kaynağı ortak hazineye aktarıldı!');
  };

  // Kudret & Sıralama
  const playerKudret = calculatePlayerKudret(playerVillages, khan);
  const leaderboardEntries = generateLeaderboard(playerKudret, khan?.name || 'Hükümdar', village.faction, playerVillages.length);
  const currentImperialQuest = imperialQuests.find(q => !q.isClaimed) || null;
  const totalWoundedCount = woundedGroups.reduce((acc, g) => acc + g.count, 0);

  // Otomatik Hükümdar Görev İlerlemesi Senkronizasyonu
  useEffect(() => {
    setImperialQuests(prev => prev.map(q => {
      if (q.isClaimed) return q;
      let newAmount = q.currentCount;

      // 1. Şehir Merkezi / Belirli Bina Seviyeleri (Tüm oyuncu köyleri kontrol edilir)
      if (q.targetType === 'building_level' || q.id === 'quest_th_lvl' || q.id === 'quest_townhall_2') {
        const targetBld = q.targetKey || 'town_hall';
        const maxLevel = Math.max(1, ...playerVillages.map(v => v.buildings?.[targetBld] || 0));
        newAmount = Math.max(newAmount, maxLevel);
      } 
      // 2. Asker Mevcudu (Tüm köylerdeki birlik toplamı)
      else if (q.targetType === 'train_units' || q.id === 'quest_train_army' || q.id === 'quest_army_1') {
        const totalUnits = playerVillages.reduce<number>((sum: number, v) => 
          sum + Object.values(v.units || {}).reduce<number>((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0), 0
        );
        newAmount = Math.max(newAmount, totalUnits);
      }
      // 3. Kışla Seviyesi
      else if (q.id === 'quest_barracks_1') {
        const maxBarracks = Math.max(0, ...playerVillages.map(v => v.buildings?.barracks || 0));
        newAmount = Math.max(newAmount, maxBarracks);
      }

      const isCompleted = newAmount >= q.targetCount;
      if (isCompleted !== q.isCompleted || newAmount !== q.currentCount) {
        if (isCompleted && !q.isCompleted) {
          showBanner(`📜 Hükümdar Görevi Tamamlandı: "${q.title}"! Ödülünüzü toplayabilirsiniz.`);
        }
        return { ...q, currentCount: Math.min(q.targetCount, newAmount), isCompleted };
      }
      return q;
    }));
  }, [playerVillages, village.buildings, village.units]);

  const advanceQuestProgress = (type: string, delta: number = 1) => {
    setImperialQuests(prev => prev.map(q => {
      if (q.isClaimed) return q;
      let matches = false;
      if (type === 'divan' && (q.targetType === 'divan_decree' || q.id === 'quest_divan_decree' || q.id === 'quest_divan_1' || q.title.includes('Ferman') || q.title.includes('Divan'))) matches = true;
      if (type === 'market' && (q.targetType === 'market_trade' || q.id === 'quest_trade_market' || q.id === 'quest_market_1' || q.title.includes('Ticaret') || q.title.includes('Pazar'))) matches = true;
      if (type === 'horse' && (q.targetType === 'horse_purchase' || q.id === 'quest_horse_bazaar' || q.id === 'quest_horse_1' || q.title.includes('At') || q.title.includes('Süvari'))) matches = true;
      if (type === 'train_units' && (q.targetType === 'train_units' || q.id === 'quest_train_army' || q.id === 'quest_army_1' || q.title.includes('Akıncı') || q.title.includes('Asker'))) matches = true;
      if (type === 'hospital' && (q.title.includes('Şifahane') || q.title.includes('Tedavi'))) matches = true;

      if (matches) {
        const newProgress = Math.min(q.targetCount, q.currentCount + delta);
        const isCompleted = newProgress >= q.targetCount;
        if (isCompleted && !q.isCompleted) {
          showBanner(`📜 Hükümdar Görevi Tamamlandı: "${q.title}"! Ödülünüzü toplayabilirsiniz.`);
        }
        return { ...q, currentCount: newProgress, isCompleted };
      }
      return q;
    }));
  };

  // Divan Fermanı Kabul Etme
  const handleEnactDecree = (petitionId: string, choiceId: string) => {
    const petition = petitions.find(p => p.id === petitionId);
    if (!petition) return;
    const choice = petition.choices.find(c => c.id === choiceId);
    if (!choice) return;

    const canAfford = 
      village.resources.gold >= (choice.cost?.gold || 0) &&
      village.resources.grain >= (choice.cost?.grain || 0) &&
      village.resources.wood >= (choice.cost?.wood || 0) &&
      village.resources.stone >= (choice.cost?.stone || 0) &&
      village.resources.iron >= (choice.cost?.iron || 0);

    if (!canAfford) {
      showBanner('❌ Bu fermanı yürürlüğe koymak için hazinede yeterli kaynak yok!');
      return;
    }

    setPlayerVillages(prev => prev.map(v => ({
      ...v,
      resources: {
        gold: Math.max(0, (v.resources?.gold || 0) - (choice.cost?.gold || 0) + (choice.instantReward?.gold || 0)),
        grain: Math.max(0, (v.resources?.grain || 0) - (choice.cost?.grain || 0) + (choice.instantReward?.grain || 0)),
        wood: Math.max(0, (v.resources?.wood || 0) - (choice.cost?.wood || 0) + (choice.instantReward?.wood || 0)),
        stone: Math.max(0, (v.resources?.stone || 0) - (choice.cost?.stone || 0) + (choice.instantReward?.stone || 0)),
        iron: Math.max(0, (v.resources?.iron || 0) - (choice.cost?.iron || 0) + (choice.instantReward?.iron || 0)),
      },
      horses: (v.horses || 0) + (choice.instantReward?.horses || 0)
    })));

    if (choice.buff) {
      const newBuff: ActiveDivanBuff = {
        id: `buff_${Date.now()}`,
        name: choice.buff.name,
        description: choice.buff.description,
        type: choice.buff.type,
        valuePercent: choice.buff.valuePercent,
        expiresAt: Date.now() + (choice.buff.durationMinutes * 60 * 1000)
      };
      setActiveBuffs(prev => [...prev.filter(b => b.expiresAt > Date.now()), newBuff]);
    }

    setPetitions(prev => {
      const remaining = prev.filter(p => p.id !== petitionId);
      const current = prev.find(p => p.id === petitionId);
      if (current) {
        return [...remaining, { ...current, isResolved: true }];
      }
      return remaining;
    });

    advanceQuestProgress('divan', 1);
    showBanner(`📜 Ferman Yürürlüğe Girdi: ${choice.text}!`);
  };

  // Pazar Kaynak Takası
  const handleTradeResources = (giveType: ResourceType, giveAmount: number, receiveType: ResourceType, receiveAmount: number) => {
    if ((village.resources[giveType] || 0) < giveAmount) {
      showBanner(`❌ Takas için yeterli ${giveType} kaynağınız yok!`);
      return;
    }

    setPlayerVillages(prev => prev.map(v => ({
      ...v,
      resources: {
        ...v.resources,
        [giveType]: Math.max(0, (v.resources[giveType] || 0) - giveAmount),
        [receiveType]: (v.resources[receiveType] || 0) + receiveAmount
      }
    })));

    advanceQuestProgress('market', 1);
    showBanner(`⚖️ Pazar Takası Başarılı: -${giveAmount} ${giveType} ➔ +${receiveAmount} ${receiveType}`);
  };

  // At Satın Alma
  const handleBuyHorse = (breed: HorseBreed) => {
    if (village.resources.gold < breed.costGold || village.resources.grain < breed.costGrain) {
      showBanner('❌ Bu cins atı almak için yeterli Altın veya Tahıl yok!');
      return;
    }

    setPlayerVillages(prev => prev.map(v => ({
      ...v,
      resources: {
        ...v.resources,
        gold: Math.max(0, v.resources.gold - breed.costGold),
        grain: Math.max(0, v.resources.grain - breed.costGrain)
      },
      horses: (v.horses || 0) + 1
    })));

    advanceQuestProgress('horse', 1);
    showBanner(`🐎 ${breed.name} beylik harasına katıldı!`);
  };

  // Pazar Fırsat Paketi
  const handleBuyBargain = (bargainId: string) => {
    const item = marketBargains.find(b => b.id === bargainId);
    if (!item || item.stock <= 0) {
      showBanner('❌ Bu kervan fırsatı tükenmiştir!');
      return;
    }

    const goldCost = item.costs?.gold || 0;
    if (village.resources.gold < goldCost) {
      showBanner('❌ Kervan paketi için yeterli Altınınız yok!');
      return;
    }

    setPlayerVillages(prev => prev.map(v => ({
      ...v,
      resources: {
        ...v.resources,
        gold: Math.max(0, v.resources.gold - goldCost),
        wood: (v.resources?.wood || 0) + (item.gives?.wood || 0),
        stone: (v.resources?.stone || 0) + (item.gives?.stone || 0),
        iron: (v.resources?.iron || 0) + (item.gives?.iron || 0),
        grain: (v.resources?.grain || 0) + (item.gives?.grain || 0),
      },
      horses: (v.horses || 0) + (item.gives?.horses || 0)
    })));

    setMarketBargains(prev => prev.map(b => b.id === bargainId ? { ...b, stock: b.stock - 1 } : b));
    advanceQuestProgress('market', 1);
    showBanner(`✨ Kervan Paketi '${item.title}' başarıyla satın alındı!`);
  };

  // Şifahane Tedavisi
  const handleHealUnits = (unitType: UnitType, count: number) => {
    const group = woundedGroups.find(g => g.unitType === unitType);
    if (!group || group.count < count) return;

    const totalGrainCost = group.grainHealCostPerUnit * count;
    const totalGoldCost = group.goldHealCostPerUnit * count;

    if (village.resources.grain < totalGrainCost || village.resources.gold < totalGoldCost) {
      showBanner('❌ Yaralıları iyileştirmek için yeterli Şifa Tahılı ve Tabip Altını yok!');
      return;
    }

    setPlayerVillages(prev => prev.map(v => {
      if (v.id === village.id) {
        return {
          ...v,
          resources: {
            ...v.resources,
            grain: Math.max(0, v.resources.grain - totalGrainCost),
            gold: Math.max(0, v.resources.gold - totalGoldCost)
          },
          units: {
            ...v.units,
            [unitType]: (v.units[unitType] || 0) + count
          }
        };
      }
      return v;
    }));

    setWoundedGroups(prev => prev.map(g => {
      if (g.unitType === unitType) {
        return { ...g, count: Math.max(0, g.count - count) };
      }
      return g;
    }).filter(g => g.count > 0));

    advanceQuestProgress('hospital', count);
    showBanner(`💚 ${count} adet ${UNITS[unitType]?.name || unitType} şifahanede tedavi edildi ve orduya katıldı!`);
  };

  // Görev Ödülü
  const handleClaimQuestReward = (questId: string) => {
    const quest = imperialQuests.find(q => q.id === questId);
    if (!quest || quest.isClaimed) return;
    const isReady = quest.isCompleted || (quest.currentCount >= quest.targetCount);
    if (!isReady) return;

    setPlayerVillages(prev => prev.map(v => ({
      ...v,
      resources: {
        gold: (v.resources?.gold || 0) + (quest.reward.resources?.gold || 0),
        wood: (v.resources?.wood || 0) + (quest.reward.resources?.wood || 0),
        stone: (v.resources?.stone || 0) + (quest.reward.resources?.stone || 0),
        iron: (v.resources?.iron || 0) + (quest.reward.resources?.iron || 0),
        grain: (v.resources?.grain || 0) + (quest.reward.resources?.grain || 0),
      }
    })));

    setImperialQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true, isCompleted: true } : q));
    showBanner(`🏆 Hükümdar Görevi Tamamlandı! +${quest.reward.kudret} Kudret ve ödüller ortak hazineye aktarıldı.`);
  };

  // Göreve Yönlendirme
  const handleNavigateQuest = (quest: ImperialQuest) => {
    if (quest.navigationTab) {
      setActiveTab(quest.navigationTab);
    }
    if (quest.navigationBuilding) {
      setActiveBuildingModal(quest.navigationBuilding as BuildingType);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-800 selection:text-white">
      
      {/* Üst Navigasyon ve Kaynak Göstergesi */}
      <ResourceHeader 
        village={village}
        playerVillages={playerVillages}
        rates={resourceRates}
        khan={khan}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectVillage={handleSelectVillage}
        onOpenFoundVillageModal={() => {
          setFoundVillagePrefilledCoords(null);
          setIsFoundVillageModalOpen(true);
        }}
        onOpenFactionModal={() => setLockedFaction(null)}
        onOpenKhanModal={() => setIsKhanModalOpen(true)}
        onOpenVictoryModal={() => setIsVictoryPanelOpen(true)}
        onOpenWorkerDrawer={() => setIsWorkerDrawerOpen(true)}
        onOpenHospitalModal={() => setIsHospitalModalOpen(true)}
        onAddTestResources={handleAddTestResources}
        activeMarchesCount={activeMarches.length}
        unreadReportsCount={battleReports.length}
        playerKudret={playerKudret}
        woundedSoldiersCount={totalWoundedCount}
      />

      {/* Canlı Sistem Bildirimi / Toast Banner (Layout zıplamasını önlemek için fixed overlay) */}
      {bannerAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[2000] pointer-events-none bg-gradient-to-r from-[#3a1a08]/95 via-[#54280e]/95 to-[#3a1a08]/95 border-2 border-[#d4af37] text-amber-100 px-5 py-2.5 rounded-xl text-xs font-semibold text-center transition-all shadow-[0_10px_35px_rgba(0,0,0,0.95)] max-w-lg backdrop-blur-md animate-fade-in">
          {bannerAlert}
        </div>
      )}

      {/* Ana Ekran İçeriği */}
      <main className={`relative z-10 flex-1 w-full mx-auto ${
        activeTab === 'map'
          ? 'max-w-none p-1 sm:p-2 pb-20'
          : activeTab === 'village'
          ? 'max-w-none p-1 sm:p-2 pb-28' 
          : 'max-w-7xl p-3 sm:p-4 pb-28'
      }`}>
        
        {activeTab === 'village' && (
          <VillageView 
            village={village}
            playerVillages={playerVillages}
            onSelectVillage={handleSelectVillage}
            nodes={resourceNodes}
            rates={resourceRates}
            constructionQueue={constructionQueue.filter(c => !c.villageId || c.villageId === village.id)}
            trainingQueue={trainingQueue.filter(t => !t.villageId || t.villageId === village.id)}
            activeMarches={activeMarches}
            onOpenBuilding={(bType) => setActiveBuildingModal(bType)}
            onUpgradeBuilding={handleUpgradeBuilding}
            onAssignBuildingToPlot={(plotId, bType) => handleAssignBuildingToPlot(village.id, plotId, bType)}
            onOpenFoundVillageModal={() => {
              setFoundVillagePrefilledCoords(null);
              setIsFoundVillageModalOpen(true);
            }}
            onNavigateToMap={() => setActiveTab('map')}
            onSelectTab={setActiveTab}
            onOpenVictoryPanel={() => setIsVictoryPanelOpen(true)}
            onTrainUnits={handleTrainUnits}
          />
        )}

        {activeTab === 'map' && (
          <MapView 
            playerVillage={village}
            playerVillages={playerVillages}
            rivalVillages={rivalVillages}
            nodes={resourceNodes}
            activeMarches={activeMarches}
            rates={resourceRates}
            constructionQueue={constructionQueue.filter(c => !c.villageId || c.villageId === village.id)}
            trainingQueue={trainingQueue.filter(t => !t.villageId || t.villageId === village.id)}
            onSelectTargetForMarch={(targetVillage, coords) => {
              setPrefilledMarchTarget({ village: targetVillage, coords });
              setActiveTab('military');
            }}
            onDispatchMarch={handleDispatchMarch}
            onOpenTownHall={() => setActiveBuildingModal('town_hall')}
            onOpenBuilding={(bType) => setActiveBuildingModal(bType)}
            onSelectTab={setActiveTab}
            onOpenFactionModal={() => setLockedFaction(null)}
            onSelectVillage={handleSelectVillage}
            onOpenFoundVillageModal={(coords) => {
              setFoundVillagePrefilledCoords(coords || null);
              setIsFoundVillageModalOpen(true);
            }}
            onAssignWorkers={handleAssignWorkers}
            activeTab={activeTab}
          />
        )}

        {activeTab === 'military' && (
          <MilitaryPanel 
            village={village}
            khan={khan}
            activeMarches={activeMarches}
            rivalVillages={rivalVillages}
            playerVillages={playerVillages}
            prefilledTarget={prefilledMarchTarget}
            onDispatchMarch={handleDispatchMarch}
            onRecallSupport={handleRecallSupportArmy}
          />
        )}

        {activeTab === 'reports' && (
          <BattleReportsView 
            reports={battleReports}
            onClearReports={() => setBattleReports([])}
            onDeleteReport={(id) => setBattleReports(prev => prev.filter(r => r.id !== id))}
          />
        )}

        {activeTab === 'simulator' && (
          <CombatSimulatorView />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureModal />
        )}

        {/* Has Bahçe & Kapalıçarşı / Bedesten (Kaynak Takası & At Harası) */}
        {activeTab === 'market' && (
          <RoyalMarketView 
            resources={village.resources}
            villageHorses={village.horses || 0}
            bargains={marketBargains}
            onTradeResources={handleTradeResources}
            onBuyHorse={handleBuyHorse}
            onBuyBargain={handleBuyBargain}
          />
        )}

        {/* Kudret Tahtı & Cihan Beylikleri Sıralaması */}
        {activeTab === 'ranking' && (
          <LeaderboardView 
            entries={leaderboardEntries}
            playerKudret={playerKudret}
          />
        )}

      </main>

      {/* 7 Temel Bina Yönetim Modalı */}
      {activeBuildingModal && (
        <BuildingModal 
          buildingType={activeBuildingModal}
          village={village}
          playerVillages={playerVillages}
          nodes={resourceNodes}
          onClose={() => setActiveBuildingModal(null)}
          onUpgradeBuilding={handleUpgradeBuilding}
          onTrainUnits={handleTrainUnits}
          onMarketTrade={handleMarketTrade}
          onOpenFoundVillageModal={() => {
            setActiveBuildingModal(null);
            setIsFoundVillageModalOpen(true);
          }}
          onStartForgeResearch={handleStartForgeResearch}
          onCancelForgeResearch={handleCancelForgeResearch}
          isUpgradingThisBuilding={constructionQueue.some(c => c.buildingType === activeBuildingModal && (!c.villageId || c.villageId === village.id))}
        />
      )}

      {/* Yeni Köy Kurma Modalı */}
      {isFoundVillageModalOpen && (
        <FoundVillageModal 
          playerVillages={playerVillages}
          rivalVillages={rivalVillages}
          activeVillage={village}
          prefilledCoords={foundVillagePrefilledCoords}
          onClose={() => setIsFoundVillageModalOpen(false)}
          onFoundVillage={handleFoundVillage}
        />
      )}

      {/* Oyun Başlangıcı Zorunlu Beylik Seçimi (Gatekeeper) */}
      {!lockedFaction && (
        <FactionSelectModal 
          currentFaction={undefined}
          onSelectFaction={handleInitialFactionSelect}
          onClose={() => {}}
          isMandatory={true}
        />
      )}

      {/* Supabase PostgreSQL Veritabanı Şeması & Triggers Modalı */}
      {isSqlModalOpen && (
        <SupabaseSchemaModal 
          isOpen={isSqlModalOpen}
          onClose={() => setIsSqlModalOpen(false)}
        />
      )}

      {/* Hakan (Kahraman) Modalı */}
      {isKhanModalOpen && khan && (
        <KhanModal 
          khan={khan}
          villageResources={village.resources}
          onClose={() => setIsKhanModalOpen(false)}
          onUpgradeSkill={(skillKey) => {
            if (khan.unspentSkillPoints > 0) {
              setKhan(prev => ({
                ...prev,
                unspentSkillPoints: prev.unspentSkillPoints - 1,
                skills: {
                  ...prev.skills,
                  [skillKey]: prev.skills[skillKey] + 1
                }
              }));
            }
          }}
          onRevive={() => {
            const cost = calculateReviveCost(khan.level);
            if (village.resources.grain >= cost.grain && village.resources.gold >= cost.gold) {
              setPlayerVillages(prev => prev.map(v => {
                if (v.id === village.id) {
                  return {
                    ...v,
                    resources: {
                      ...v.resources,
                      grain: v.resources.grain - cost.grain,
                      gold: v.resources.gold - cost.gold
                    }
                  };
                }
                return v;
              }));
              
              setKhan(prev => ({
                ...prev,
                status: 'reviving',
                reviveFinishTimestamp: Date.now() + calculateReviveDurationSec(prev.level) * 1000
              }));
            } else {
              showBanner('❌ Diriltme için yeterli Erzak veya Altın yok!');
            }
          }}
        />
      )}

      {/* Cihan Hâkimiyeti: Umaykut Binası İttifak Zaferi & Birlik Kapasitesi Divanı */}
      {isVictoryPanelOpen && (
        <UmaykutVictoryPanel 
          alliance={alliance}
          playerVillages={playerVillages}
          onClose={() => setIsVictoryPanelOpen(false)}
          onUpdateAlliance={handleUpdateAlliance}
          onOpenBuildingModal={(bType) => {
            setIsVictoryPanelOpen(false);
            setActiveBuildingModal(bType);
          }}
        />
      )}

      {/* Ahali & Maden İşçi Tahsis Çekmecesi */}
      <WorkerAllocationDrawer 
        isOpen={isWorkerDrawerOpen}
        onClose={() => setIsWorkerDrawerOpen(false)}
        village={village}
        nodes={resourceNodes}
        onUpdateWorkerDelta={handleUpdateWorkerDelta}
        onDistributeEqually={handleDistributeWorkersEqually}
        onRecallAll={handleRecallAllWorkers}
        onAssignWorkers={handleAssignWorkers}
        onApplyVillageUpdate={handleApplyVillageUpdate}
      />

      {/* Şifahane / Tabip Otağı (Yaralı Asker Tedavisi) */}
      {isHospitalModalOpen && (
        <HospitalModal 
          isOpen={isHospitalModalOpen}
          onClose={() => setIsHospitalModalOpen(false)}
          woundedGroups={woundedGroups}
          villageResources={village.resources}
          onHealUnits={handleHealUnits}
        />
      )}

      {/* Sabit Alt Navigasyon Çubuğu (Bottom Navigation Bar) */}
      <BottomNavBar 
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeMarchesCount={activeMarches.length}
        unreadReportsCount={battleReports.length}
      />

    </div>
  );
}

