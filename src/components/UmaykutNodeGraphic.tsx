import React from 'react';
import { ResourceType } from '../types/game';

interface NodeGraphicProps {
  type: ResourceType;
  tier: number;
  isCaptured: boolean;
  size?: number;
}

export const UmaykutNodeGraphic: React.FC<NodeGraphicProps> = ({
  type,
  tier,
  isCaptured,
  size = 64,
}) => {
  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* 1. TAHIL TARLASI & DEĞİRMEN (Golden circular wheat field with animated windmill) */}
      {type === 'grain' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Altın sarısı buğday dairesi */}
          <div 
            className="absolute rounded-full shadow-lg transition-transform hover:scale-105"
            style={{
              width: size * 0.9,
              height: size * 0.9,
              background: 'radial-gradient(circle, #fde047 0%, #eab308 60%, #ca8a04 100%)',
              border: '2px solid #a16207',
              boxShadow: isCaptured ? '0 0 12px rgba(234, 179, 8, 0.7)' : '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {/* Buğday başak dokuları */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#854d0e_1px,transparent_1px)] [background-size:6px_6px]" />
          </div>

          {/* Rüzgar Değirmeni / Çiftlik Evi */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Değirmen Gövdesi */}
            <div className="w-5 h-6 bg-stone-200 border border-stone-600 rounded-t-sm relative shadow-md flex items-center justify-center">
              <div className="w-1.5 h-2 bg-amber-950 rounded-t-xs absolute bottom-0" />
              <div className="w-1 h-1 bg-amber-400 rounded-full absolute top-1" />
              
              {/* Dönen Değirmen Pervaneleri */}
              <div className="absolute -top-1 w-8 h-8 pointer-events-none animate-[spin_8s_linear_infinite]">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-stone-700 shadow-sm" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-stone-700 shadow-sm" />
                {/* Pervane Kanat Bezleri */}
                <div className="absolute top-1 left-4 w-2 h-1.5 bg-amber-100 border border-stone-500 text-[6px]" />
                <div className="absolute bottom-1 right-4 w-2 h-1.5 bg-amber-100 border border-stone-500 text-[6px]" />
              </div>
            </div>
            {/* Çit / Ahşap Kütükler */}
            <div className="w-7 h-1 bg-amber-900/80 rounded -mt-0.5" />
          </div>
        </div>
      )}

      {/* 2. TAŞ OCAĞI (Gray rock crags, stone blocks, crane) */}
      {type === 'stone' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Taşlık zemin lekesi */}
          <div 
            className="absolute rounded-full shadow-md"
            style={{
              width: size * 0.85,
              height: size * 0.85,
              background: 'radial-gradient(circle, #94a3b8 0%, #64748b 60%, #475569 100%)',
              border: '2px solid #334155',
              boxShadow: isCaptured ? '0 0 10px rgba(148, 163, 184, 0.6)' : '0 2px 5px rgba(0,0,0,0.4)',
            }}
          />
          {/* Kaya blokları ve ocak */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-end gap-0.5">
              <div className="w-3 h-4 bg-stone-400 border border-stone-700 rotate-[-8deg] shadow" />
              <div className="w-4 h-6 bg-stone-300 border border-stone-600 rounded-t-sm shadow-md" />
              <div className="w-3.5 h-3.5 bg-stone-500 border border-stone-800 rotate-[12deg] shadow" />
            </div>
            {/* Vinç / Ahşap İskele */}
            <div className="w-6 h-1.5 bg-amber-950 border border-amber-800 rounded-sm -mt-1" />
          </div>
        </div>
      )}

      {/* 3. KERESTE / ORMAN (Lush evergreen pine cluster, log stack, hut) */}
      {type === 'wood' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Yeşil çim / orman alt tabanı */}
          <div 
            className="absolute rounded-full shadow-md"
            style={{
              width: size * 0.85,
              height: size * 0.85,
              background: 'radial-gradient(circle, #4ade80 0%, #16a34a 60%, #15803d 100%)',
              border: '2px solid #14532d',
              boxShadow: isCaptured ? '0 0 10px rgba(74, 222, 128, 0.6)' : '0 2px 5px rgba(0,0,0,0.4)',
            }}
          />
          {/* Çam Ağaçları & Oduncu Kulübesi */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Sol Ağaç */}
            <div className="flex flex-col items-center -mr-1">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-emerald-800" />
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-emerald-900 -mt-2" />
              <div className="w-1.5 h-2 bg-amber-950" />
            </div>
            {/* Kulübe */}
            <div className="w-4 h-4 bg-amber-900 border border-amber-950 rounded-t-sm relative shadow-md z-20">
              <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[8px] border-b-amber-700 absolute -top-2 -left-1" />
              <div className="w-1 h-1.5 bg-amber-950 absolute bottom-0 left-1.5" />
            </div>
            {/* Sağ Ağaç */}
            <div className="flex flex-col items-center -ml-1">
              <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[11px] border-b-emerald-700" />
              <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[13px] border-b-emerald-800 -mt-2" />
              <div className="w-1.5 h-2 bg-amber-950" />
            </div>
          </div>
        </div>
      )}

      {/* 4. DEMİR OCAĞI / CEVHER (Dark ore furnace with smoking chimney) */}
      {type === 'iron' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Koyu maden zemini */}
          <div 
            className="absolute rounded-full shadow-md"
            style={{
              width: size * 0.85,
              height: size * 0.85,
              background: 'radial-gradient(circle, #71717a 0%, #3f3f46 60%, #18181b 100%)',
              border: '2px solid #27272a',
              boxShadow: isCaptured ? '0 0 10px rgba(161, 161, 170, 0.6)' : '0 2px 5px rgba(0,0,0,0.4)',
            }}
          />
          {/* Demir Dökümhanesi & Duman */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Duman animasyonu */}
            <div className="w-1.5 h-1.5 bg-stone-400/80 rounded-full animate-ping mb-0.5" />
            <div className="w-5 h-5 bg-stone-800 border-2 border-stone-600 rounded-t-md relative shadow-md flex items-center justify-center">
              {/* Baca */}
              <div className="w-2 h-2.5 bg-stone-900 border border-stone-700 absolute -top-2 left-1.5" />
              {/* Ateş Parıltısı */}
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_#f97316]" />
            </div>
            {/* Maden Arabası */}
            <div className="w-4 h-1.5 bg-zinc-950 border border-zinc-700 rounded-xs mt-0.5" />
          </div>
        </div>
      )}

      {/* 5. ALTIN MADENİ (Sparkling golden cavern) */}
      {type === 'gold' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Altın lekesi */}
          <div 
            className="absolute rounded-full shadow-md"
            style={{
              width: size * 0.85,
              height: size * 0.85,
              background: 'radial-gradient(circle, #fef08a 0%, #eab308 60%, #854d0e 100%)',
              border: '2px solid #713f12',
              boxShadow: isCaptured ? '0 0 12px rgba(250, 204, 21, 0.8)' : '0 2px 5px rgba(0,0,0,0.4)',
            }}
          />
          {/* Altın Külçeleri & Mağara */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-5 h-4 bg-amber-950 border border-amber-700 rounded-t-full relative flex items-center justify-center shadow">
              <div className="w-2 h-2 bg-yellow-300 rotate-45 animate-pulse shadow-[0_0_6px_#fde047]" />
            </div>
            <div className="flex gap-0.5 mt-0.5">
              <div className="w-2 h-1 bg-yellow-400 border border-yellow-600 rounded-xs shadow" />
              <div className="w-2.5 h-1 bg-yellow-300 border border-yellow-500 rounded-xs shadow" />
            </div>
          </div>
        </div>
      )}

      {/* UMAYKUT TARZI DAİRESEL TIER / SEVİYE ETİKETİ (Beyaz daire içinde siyah kalın rakam) */}
      <div 
        className="absolute top-0 right-0 z-30 w-5 h-5 rounded-full bg-stone-100 border-2 border-stone-900 shadow-md flex items-center justify-center font-bold font-mono text-[11px] text-stone-900 select-none"
        style={{
          boxShadow: '0 1px 4px rgba(0,0,0,0.7)',
        }}
      >
        {tier}
      </div>

      {/* Kapsandı Yeşil Parlama Rozeti */}
      {isCaptured && (
        <div 
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 px-1 py-0.2 bg-emerald-700 border border-emerald-400 text-white font-mono text-[8px] font-bold rounded shadow tracking-tighter uppercase whitespace-nowrap"
        >
          KAPSANDI
        </div>
      )}
    </div>
  );
};
