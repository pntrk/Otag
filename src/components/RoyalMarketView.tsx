import React, { useState } from 'react';
import { Resources, ResourceType } from '../types/game';
import { ResourceIcon } from './ResourceIcon';
import { ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface RoyalMarketViewProps {
  resources: Resources;
  villageHorses?: number;
  bargains?: unknown[];
  onTradeResources: (giveType: ResourceType, giveAmount: number, receiveType: ResourceType, receiveAmount: number) => void;
  onBuyHorse?: (breed: unknown) => void;
  onBuyBargain?: (bargainId: string) => void;
}

export const RoyalMarketView: React.FC<RoyalMarketViewProps> = ({
  resources,
  onTradeResources,
}) => {
  // Takas Durumları
  const [giveType, setGiveType] = useState<ResourceType>('wood');
  const [receiveType, setReceiveType] = useState<ResourceType>('gold');
  const [tradeAmount, setTradeAmount] = useState<number>(2000);

  // Kur Oranı: 100 hammadde = 25 altın veya 100 hammadde A = 80 hammadde B
  const calculateReceiveAmount = () => {
    if (giveType === receiveType) return tradeAmount;
    if (giveType === 'gold') {
      return Math.floor(tradeAmount * 3.5); // 1 Altın = 3.5 Hammadde
    }
    if (receiveType === 'gold') {
      return Math.floor(tradeAmount * 0.25); // 4 Hammadde = 1 Altın
    }
    return Math.floor(tradeAmount * 0.80); // %20 Pazar lonca komisyonu
  };

  const receiveAmount = calculateReceiveAmount();
  const canAffordTrade = resources[giveType] >= tradeAmount && tradeAmount > 0;

  const handleExecuteTrade = () => {
    if (canAffordTrade) {
      onTradeResources(giveType, tradeAmount, receiveType, receiveAmount);
    }
  };

  return (
    <div id="royal-market-screen" className="max-w-5xl mx-auto space-y-4 pb-20 select-none">
      
      {/* HAMMADDE BORSASI & TAKAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-2xl bg-[#21140b] border-2 border-[#6e4e2a] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#52371e]">
            <h2 className="text-base sm:text-lg font-serif font-black text-amber-200 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-400" />
              <span>Hammadde Takası</span>
            </h2>
            <div className="text-xs font-mono text-amber-300">
              Hazine Altını: <strong className="text-yellow-400">{Math.floor(resources.gold).toLocaleString('tr-TR')}</strong>
            </div>
          </div>

          {/* Verilecek Kaynak */}
          <div className="bg-[#170e08] p-4 rounded-xl border border-[#52371e] space-y-2">
            <div className="text-xs font-serif font-bold text-amber-300 flex items-center justify-between">
              <span>1. VERİLECEK KAYNAK</span>
              <span className="font-mono text-[11px] text-[#bda273]">
                Mevcut: {Math.floor(resources[giveType]).toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(['wood', 'stone', 'iron', 'grain', 'gold'] as ResourceType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setGiveType(type)}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    giveType === type 
                      ? 'bg-[#5c3717] border-amber-400 ring-2 ring-amber-500/40' 
                      : 'bg-[#1e130a] border-[#422a16] hover:brightness-110'
                  }`}
                >
                  <ResourceIcon type={type} size="md" />
                  <span className="text-[11px] font-serif font-bold capitalize text-amber-200">
                    {type === 'wood' ? 'Odun' : type === 'stone' ? 'Taş' : type === 'iron' ? 'Demir' : type === 'grain' ? 'Tahıl' : 'Altın'}
                  </span>
                </button>
              ))}
            </div>

            {/* Miktar Seçimi */}
            <div className="pt-2 flex items-center gap-2">
              <input 
                type="number"
                min="100"
                max={resources[giveType]}
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-[#100904] border border-[#5a3a20] rounded-lg px-3 py-2 text-sm font-mono text-amber-200 focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1">
                {[1000, 5000, 10000, 25000].map(val => (
                  <button
                    key={val}
                    onClick={() => setTradeAmount(Math.min(resources[giveType], val))}
                    className="px-2 py-1.5 bg-[#2a1a0e] hover:bg-[#3d2716] border border-[#52371e] text-[10px] font-mono text-amber-200 rounded cursor-pointer"
                  >
                    {val / 1000}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alınacak Kaynak */}
          <div className="bg-[#170e08] p-4 rounded-xl border border-[#52371e] space-y-2">
            <div className="text-xs font-serif font-bold text-amber-300 flex items-center justify-between">
              <span>2. ALINACAK KAYNAK</span>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">
                Tahmini Alınacak: +{receiveAmount.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(['wood', 'stone', 'iron', 'grain', 'gold'] as ResourceType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setReceiveType(type)}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    receiveType === type 
                      ? 'bg-[#5c3717] border-amber-400 ring-2 ring-amber-500/40' 
                      : 'bg-[#1e130a] border-[#422a16] hover:brightness-110'
                  }`}
                >
                  <ResourceIcon type={type} size="md" />
                  <span className="text-[11px] font-serif font-bold capitalize text-amber-200">
                    {type === 'wood' ? 'Odun' : type === 'stone' ? 'Taş' : type === 'iron' ? 'Demir' : type === 'grain' ? 'Tahıl' : 'Altın'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Takası Onayla Butonu */}
          <button
            onClick={handleExecuteTrade}
            disabled={!canAffordTrade}
            className={`w-full py-3 rounded-xl font-serif font-black text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              canAffordTrade
                ? 'bg-gradient-to-r from-[#85531d] via-[#633c14] to-[#452709] border-2 border-amber-400 text-amber-100 hover:brightness-125'
                : 'bg-[#291a10] border border-[#4a2e1a] text-[#806144] cursor-not-allowed'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-amber-300" />
            <span>
              {canAffordTrade
                ? `${tradeAmount.toLocaleString('tr-TR')} ${giveType} Ver → ${receiveAmount.toLocaleString('tr-TR')} ${receiveType} Al`
                : 'Yetersiz Kaynak veya Geçersiz Miktar'}
            </span>
          </button>
        </div>

        {/* Sağ Kolon: Lonca Bilgi Kartı */}
        <div className="lg:col-span-4 rounded-2xl bg-[#1a1008] border-2 border-[#5a3a20] p-4 text-xs font-serif text-[#decab0] space-y-3">
          <div className="font-black text-sm text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pazar Nizamnamesi</span>
          </div>
          <p>
            Pazarda yapılan hammadde takasları anında teslim edilir. Kervan harcı ve pazar komisyonu hesaplamaya dahil edilmiştir.
          </p>
          <div className="p-3 bg-[#100904] rounded-lg border border-[#422a16] space-y-1.5 text-[11px]">
            <div className="text-amber-200 font-bold">Takas Kur Oranları:</div>
            <div>• 1 Altın Akçe = 3.5 Birim Hammadde</div>
            <div>• 4 Birim Hammadde = 1 Altın Akçe</div>
            <div>• Hammadde takaslarında %20 komisyon</div>
          </div>
        </div>
      </div>

    </div>
  );
};
