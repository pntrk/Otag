import React, { useState } from 'react';
import { NODEJS_SIMULATION_ENGINE_CODE, SUPABASE_POSTGRES_SCHEMA } from '../data/sqlSchema';
import { Database, Server, Cpu, Copy, Check, BookOpen, Layers } from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'node' | 'mechanics'>('sql');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 sm:p-5 text-stone-200">
        
        {/* Üst Sekmeler */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-800 mb-4">
          <div>
            <h3 className="text-base font-bold text-amber-300 font-serif flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-400" />
              Sistem Mimarisi, PostgreSQL / Supabase & Node.js Motoru
            </h3>
            <p className="text-xs text-stone-400">
              Doğrudan üretime hazır (production-ready) veritabanı şeması, spatial sorgular ve tick motoru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'sql' ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase / SQL DDL</span>
            </button>

            <button
              onClick={() => setActiveTab('node')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'node' ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Node.js Tick Motoru</span>
            </button>

            <button
              onClick={() => setActiveTab('mechanics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'mechanics' ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Matematik & Mekanikler</span>
            </button>
          </div>
        </div>

        {/* Tab 1: PostgreSQL / Supabase Schema */}
        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-400">
              <span>PostGIS <code>ST_DWithin</code> ve <code>ST_Distance</code> ile optimize edilmiş spatial şema:</span>
              <button
                onClick={() => handleCopy(SUPABASE_POSTGRES_SCHEMA)}
                className="self-start sm:self-auto px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center gap-1 cursor-pointer transition text-xs font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı!' : 'Tüm SQL Kodunu Kopyala'}</span>
              </button>
            </div>

            <pre className="p-3 sm:p-4 bg-stone-950 rounded-lg border border-stone-800 text-[11px] font-mono text-amber-200/90 overflow-x-auto max-h-[50vh] leading-relaxed select-text custom-scrollbar">
              {SUPABASE_POSTGRES_SCHEMA}
            </pre>
          </div>
        )}

        {/* Tab 2: Node.js Tick Engine */}
        {activeTab === 'node' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-400">
              <span>Node.js Arka Plan Simülasyon Motoru (İnşaat, Sefer ve Tick Çözümleyici):</span>
              <button
                onClick={() => handleCopy(NODEJS_SIMULATION_ENGINE_CODE)}
                className="self-start sm:self-auto px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center gap-1 cursor-pointer transition text-xs font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopyalandı!' : 'Node.js Kodunu Kopyala'}</span>
              </button>
            </div>

            <pre className="p-3 sm:p-4 bg-stone-950 rounded-lg border border-stone-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-[50vh] leading-relaxed select-text custom-scrollbar">
              {NODEJS_SIMULATION_ENGINE_CODE}
            </pre>
          </div>
        )}

        {/* Tab 3: Matematiksel Formüller ve Oyun Dengesi */}
        {activeTab === 'mechanics' && (
          <div className="space-y-4 text-xs">
            
            {/* 1. Harita ve Etki Çemberi Formülü */}
            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-2">
              <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5 font-serif">
                <Layers className="w-4 h-4 text-amber-400" />
                1. Coğrafi Etki Yarıçapı Formülü (Geographic Radius)
              </h4>
              <p className="text-stone-300 leading-relaxed">
                Köyün Merkez Binası seviyesine ($L$) bağlı olarak haritadaki etki yarıçapı ($R$) şu lineer formülle hesaplanır:
              </p>
              <div className="p-2.5 bg-stone-900 rounded font-mono text-emerald-400 text-sm font-bold text-center">
                R(L) = 2.0 + (L × 1.25) [Tile Cinsinden]
              </div>
              <ul className="list-disc list-inside text-stone-400 space-y-1 mt-2">
                <li><strong>Seviye 1:</strong> $R = 3.25$ tile (Başlangıç alanı)</li>
                <li><strong>Seviye 2:</strong> $R = 4.50$ tile</li>
                <li><strong>Seviye 5:</strong> $R = 8.25$ tile</li>
                <li><strong>Seviye 10:</strong> $R = 14.50$ tile (Bölgesel süper güç)</li>
              </ul>
              <p className="text-stone-400 mt-2 text-[11px]">
                Öklid uzaklığı d = √((X_düğüm - X_köy)² + (Y_düğüm - Y_köy)²) ≤ R olan tüm kaynak düğümleri otomatik olarak köye saatlik hammadde üretir. Köy içi kaynak binası (tarla/maden) inşa edilmez.
              </p>
            </div>

            {/* 2. Lanchester Savaş ve Kayıp Motoru */}
            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-2">
              <h4 className="font-bold text-red-400 text-sm flex items-center gap-1.5 font-serif">
                <Cpu className="w-4 h-4 text-red-400" />
                2. Lanchester Yasası Türevi Kayıp Oranı ve Sur Tahkimatı
              </h4>
              <p className="text-stone-300 leading-relaxed">
                Savaş motoru, tarafların toplam taarruz gücü (P_atk) ile efektif savunma gücünü (P_def) karşılaştırır:
              </p>
              <div className="p-2.5 bg-stone-900 rounded font-mono text-amber-300 text-xs text-center space-y-1">
                <div>Sur Çarpanı: M_sur = 1 + (Sur_Seviyesi × 0.05)</div>
                <div>Koçbaşı Yıkımı: Etkin_Sur = max(0, Sur_Seviyesi - ⌊Koçbaşı / 5⌋)</div>
                <div>Kayıp Oranı: Kayıp_Oranı = min(0.95, (Güç_Az / Güç_Çok)^1.45 × 0.85)</div>
              </div>
              <p className="text-stone-400 mt-2 text-[11px]">
                Koçbaşı birlikleri savunucunun sur çarpanını çatışma anında kırarak piyade ve süvari birliklerinin duvar ardındaki üstünlüğünü yok eder.
              </p>
            </div>

            {/* 3. Tahıl Freni (Upkeep) ve Yağma Sığınağı */}
            <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-2">
              <h4 className="font-bold text-stone-200 text-sm flex items-center gap-1.5 font-serif">
                <BookOpen className="w-4 h-4 text-stone-400" />
                3. Tahıl Freni (Upkeep) ve Sığınak Koruma Mekaniği
              </h4>
              <p className="text-stone-300 leading-relaxed">
                Garnizonda ve seferde bulunan her askeri birlik saatlik erzak tüketir (Piyadeler: 1 Tahıl/saat, Süvariler: 2 Tahıl/saat, Kuşatma: 3 Tahıl/saat). Eğer net tahıl üretimi negatife düşerse depolar tükenene kadar ordu beslenir. Depolar boşaldığında ise birlikler firar etmeye başlar.
              </p>
              <div className="p-2.5 bg-stone-900 rounded font-mono text-stone-300 text-xs">
                Sığınak Koruması = Sığınak_Seviyesi × 500 Birim (Her Kaynak İçin Ayrı Ayrı Korunur)
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
