import React from 'react';
import { FactionId, Village } from '../types/game';
import { FACTIONS } from '../data/gameData';

interface VillageGraphicProps {
  village: Village;
  isPlayer: boolean;
  influenceRadius?: number;
  isSelected?: boolean;
  size?: number;
  onInspect?: () => void;
  onAction?: () => void;
}

export const UmaykutVillageGraphic: React.FC<VillageGraphicProps> = ({
  village,
  isPlayer,
  influenceRadius,
  isSelected = false,
  size = 72,
  onInspect,
  onAction,
}) => {
  const faction = FACTIONS[village.faction] || FACTIONS.osmanogullari;
  const townHallLevel = village.buildings.town_hall || 1;
  const wallLevel = village.buildings.wall || 0;

  return (
    <div 
      className="relative flex flex-col items-center justify-end select-none pb-1"
      style={{ width: size, height: size }}
    >
      {/* 1. Geniş Organik Toprak & Çakıl Zemin Kaidesi (Feathered Earth & Stone Base) */}
      <div 
        className="absolute bottom-2 rounded-[50%]"
        style={{
          width: size * 1.05,
          height: size * 0.44,
          background: isPlayer 
            ? 'radial-gradient(ellipse at center, rgba(120, 92, 54, 0.85) 0%, rgba(95, 75, 42, 0.65) 45%, rgba(65, 80, 35, 0.30) 75%, transparent 100%)'
            : village.id.includes('bandit')
            ? 'radial-gradient(ellipse at center, rgba(68, 64, 60, 0.85) 0%, rgba(41, 37, 36, 0.65) 50%, transparent 100%)'
            : 'radial-gradient(ellipse at center, rgba(115, 60, 50, 0.85) 0%, rgba(85, 40, 35, 0.65) 45%, rgba(65, 80, 35, 0.25) 75%, transparent 100%)',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.45)',
        }}
      />

      {/* 1.1 İç Taş Meydan & Temas Gölgesi (Contact AO Shadow) */}
      <div 
        className="absolute bottom-3 rounded-[50%]"
        style={{
          width: size * 0.72,
          height: size * 0.26,
          background: 'rgba(15, 23, 42, 0.65)',
          filter: 'blur(1px)',
        }}
      />

      {/* 2. Otağ / Kale / Binalar Görseli (Zemine Tam Oturtulmuş) */}
      <div className="relative z-10 flex flex-col items-center mb-1">
        {/* Sancak / Bayrak */}
        <div className="flex items-center gap-1 -mb-1 z-20">
          <div className="w-0.5 h-3 bg-stone-900" />
          <div 
            className="w-3 h-2 -ml-1 text-[8px] flex items-center justify-center font-bold text-white shadow"
            style={{ backgroundColor: isPlayer ? '#d97706' : '#991b1b' }}
          >
            {faction.crestIcon || '🏹'}
          </div>
        </div>

        {/* Ana Yapı: Otağ Çadırı veya Taş Kale */}
        {isPlayer ? (
          <div className="relative flex items-center justify-center">
            {/* Sol Küçük Çadır */}
            <div className="w-4 h-3 bg-amber-100 border border-amber-900 rounded-t-full relative -mr-1 shadow">
              <div className="w-1 h-1.5 bg-amber-950 rounded-t-xs absolute bottom-0 left-1.5" />
            </div>

            {/* Bey Otağı (Ana Büyük Çadır / Kümbet) */}
            <div className="w-7 h-6 bg-amber-50 border-2 border-amber-900 rounded-t-full relative shadow-lg z-10 flex flex-col items-center justify-between">
              {/* Tepe Motifi */}
              <div className="w-2 h-1 bg-amber-600 rounded-t-sm" />
              {/* Kırmızı Kuşak */}
              <div className="w-full h-1 bg-red-700" />
              {/* Giriş Kapısı */}
              <div className="w-2 h-2.5 bg-stone-900 rounded-t-xs mb-0" />
            </div>

            {/* Sağ Küçük Çadır */}
            <div className="w-4 h-3 bg-amber-100 border border-amber-900 rounded-t-full relative -ml-1 shadow">
              <div className="w-1 h-1.5 bg-amber-950 rounded-t-xs absolute bottom-0 left-1.5" />
            </div>
          </div>
        ) : village.id.includes('bandit') ? (
          /* Haydut Kampı / Mağara */
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-5 bg-stone-700 border-2 border-stone-900 rounded-t-lg relative shadow-md flex items-center justify-center">
              <div className="w-2.5 h-3 bg-stone-950 rounded-t-sm absolute bottom-0" />
              <div className="w-1 h-1 bg-red-500 rounded-full absolute -top-1" />
            </div>
          </div>
        ) : (
          /* Düşman Tekfur Kalesi / Beylik Hisarı */
          <div className="relative flex items-center justify-center">
            {/* Sol Kule */}
            <div className="w-3 h-5 bg-stone-400 border border-stone-800 rounded-t-sm -mr-0.5 shadow">
              <div className="w-full h-1 bg-stone-600" />
            </div>
            {/* Ana Kale Kapısı */}
            <div className="w-5 h-6 bg-stone-300 border-2 border-stone-800 rounded-t-md relative shadow-lg z-10 flex items-center justify-center">
              <div className="w-2 h-3 bg-amber-950 rounded-t-xs absolute bottom-0" />
            </div>
            {/* Sağ Kule */}
            <div className="w-3 h-5 bg-stone-400 border border-stone-800 rounded-t-sm -ml-0.5 shadow">
              <div className="w-full h-1 bg-stone-600" />
            </div>
          </div>
        )}

        {/* Sur Tahkimatı Vurgusu */}
        {wallLevel > 0 && (
          <div className="w-10 h-1 bg-stone-600 border border-stone-900 rounded-full -mt-0.5" />
        )}
      </div>

      {/* UMAYKUT TARZI KÖY BİLGİ ETİKETİ (Screenshot'taki: "[31 | 4] base - friskym (i)" stili) */}
      <div className="absolute -bottom-5 z-30 flex items-center shadow-lg pointer-events-auto">
        {/* Sol Seviye & Nüfus Rozeti */}
        <div className="bg-stone-900 text-stone-200 border border-stone-700 px-1 py-0.2 text-[9px] font-mono font-bold rounded-l flex items-center gap-0.5">
          <span className="text-amber-300">{townHallLevel * 10 + 1}</span>
          <span className="text-stone-500">|</span>
          <span className="text-emerald-400">{wallLevel}</span>
        </div>

        {/* Orta Köy Adı & Sahip Adı */}
        <div 
          onClick={onInspect}
          className={`px-1.5 py-0.2 text-[9px] font-bold truncate max-w-[90px] cursor-pointer transition ${
            isPlayer 
              ? 'bg-amber-950/90 text-amber-200 border-y border-amber-700 hover:bg-amber-900' 
              : 'bg-stone-950/90 text-red-200 border-y border-red-800 hover:bg-red-950'
          }`}
          title={`${village.name} - ${village.ownerName} (${village.x}, ${village.y})`}
        >
          {village.name}
        </div>

        {/* Sağ İnfo (i) / Sefer Butonu */}
        <button
          onClick={onAction || onInspect}
          className={`px-1 py-0.2 text-[9px] font-mono rounded-r border transition cursor-pointer ${
            isPlayer
              ? 'bg-amber-800 hover:bg-amber-700 text-amber-100 border-amber-600'
              : 'bg-red-800 hover:bg-red-700 text-white border-red-600'
          }`}
          title={isPlayer ? 'Köyü Yönet' : 'Sefer Düzenle'}
        >
          {isPlayer ? 'i' : '⚔️'}
        </button>
      </div>

      {/* Seçili Varlık Vurgulama Halkası */}
      {isSelected && (
        <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping pointer-events-none" />
      )}
    </div>
  );
};
