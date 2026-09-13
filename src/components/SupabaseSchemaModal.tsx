import React, { useState } from 'react';
import { Database, Copy, Check, ShieldCheck, Zap, X, Scroll } from 'lucide-react';

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const sqlCode = `-- ============================================================================
-- 13. YÜZYIL ANADOLU BEYLİKLERİ STRATEJİ OYUNU
-- SUPABASE (POSTGRESQL) PRODUCTION VERİTABANI ŞEMASI & TRİGGER YAPISI
-- ============================================================================

-- 1. Gerekli Uzantılar
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM Tipleri
CREATE TYPE beylik_faction_enum AS ENUM (
    'osmanogullari',
    'karamanogullari',
    'aydinogullari',
    'candarogullari',
    'dulkadirogullari'
);

-- 3. Profiller Tablosu
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(32) NOT NULL UNIQUE,
    faction beylik_faction_enum NOT NULL,
    max_villages_allowed INT DEFAULT 10 CHECK (max_villages_allowed <= 10),
    is_onboarded BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BEYLİK SEÇİMİNİN ASLA DEĞİŞTİRİLEMEMESİNİ SAĞLAYAN TRİGGER
CREATE OR REPLACE FUNCTION public.prevent_faction_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.faction IS NOT NULL AND NEW.faction <> OLD.faction THEN
        RAISE EXCEPTION 'KURAL İHLALİ: Beylik seçimi oyun boyunca yalnızca 1 kez yapılabilir ve sonradan değiştirilemez.';
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_immutable_faction
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_faction_change();

-- 4. 1000x500 Grid Köyler Tablosu
CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(48) NOT NULL,
    x INT NOT NULL CHECK (x >= 0 AND x <= 1000),
    y INT NOT NULL CHECK (y >= 0 AND y <= 500),
    is_capital BOOLEAN DEFAULT false,
    resources JSONB NOT NULL DEFAULT '{"wood":800,"stone":800,"iron":800,"grain":800,"gold":300}'::jsonb,
    buildings JSONB NOT NULL DEFAULT '{"town_hall":1,"barracks":0,"stable":0,"watchtower":0,"wall":0,"market":0,"hideout":1}'::jsonb,
    units JSONB NOT NULL DEFAULT '{"militia":15,"infantry":0,"archer":0,"cavalry":0,"heavy_cavalry":0,"siege_engine":0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_village_coordinates UNIQUE (x, y)
);

-- 5. Rastgele Doğuş (Spawn RPC Stored Procedure)
CREATE OR REPLACE FUNCTION public.rpc_spawn_new_player(
    p_user_id UUID,
    p_username VARCHAR(32),
    p_faction beylik_faction_enum,
    p_village_name VARCHAR(48)
)
RETURNS JSONB AS $$
DECLARE
    v_target_x INT;
    v_target_y INT;
    v_new_village_id UUID;
BEGIN
    -- Boş koordinat havuzu
    IF p_faction = 'osmanogullari' THEN
        v_target_x := floor(random() * 80 + 30)::INT;
        v_target_y := floor(random() * 60 + 20)::INT;
    ELSE
        v_target_x := floor(random() * 800 + 100)::INT;
        v_target_y := floor(random() * 400 + 50)::INT;
    END IF;

    -- Profili ve Köyü Atomik Olarak Oluştur
    INSERT INTO public.profiles (id, username, faction) VALUES (p_user_id, p_username, p_faction);
    INSERT INTO public.villages (owner_id, name, x, y, is_capital)
    VALUES (p_user_id, p_village_name, v_target_x, v_target_y, true)
    RETURNING id INTO v_new_village_id;

    RETURN json_build_object('success', true, 'x', v_target_x, 'y', v_target_y);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm font-serif">
      <div className="bg-[#1c1611] border-2 border-[#6b4f2c] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl text-stone-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]">
        
        <div className="shrink-0 bg-[#2a1f15] border-b border-[#5a4228] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-amber-200 font-serif">
              Supabase (PostgreSQL) Production Veritabanı Şeması & Triggers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#3d2f21] rounded text-stone-400 hover:text-stone-200 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 flex-1 min-h-0 overflow-y-auto font-sans text-xs custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-[#14100c] p-2.5 rounded border border-emerald-900/50 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Immutable Faction:</strong> Trigger ile kalıcı beylik garantisi.</span>
            </div>
            <div className="bg-[#14100c] p-2.5 rounded border border-amber-900/50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>1000x500 Grid:</strong> <code>CHECK(x&lt;=1000, y&lt;=500)</code></span>
            </div>
            <div className="bg-[#14100c] p-2.5 rounded border border-blue-900/50 flex items-center gap-2">
              <Scroll className="w-4 h-4 text-blue-400 shrink-0" />
              <span><strong>Spawn RPC:</strong> Çakışmasız atomik koordinat tahsisi.</span>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#0e0b08] p-3.5 rounded-lg border border-[#42311f] font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed max-h-96 custom-scrollbar">
              {sqlCode}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2.5 py-1 bg-[#2e2114] hover:bg-[#45321f] text-amber-300 rounded border border-[#63492c] flex items-center gap-1.5 transition text-[11px] font-mono cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı!' : 'SQL Kopyala'}</span>
            </button>
          </div>

        </div>

        <div className="shrink-0 bg-[#2a1f15] border-t border-[#5a4228] px-4 py-2.5 flex items-center justify-between text-xs font-mono text-stone-400">
          <span className="hidden sm:inline">PostgreSQL 15+ / Supabase RPC & RLS Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-800 hover:bg-amber-700 text-white rounded font-serif font-bold transition cursor-pointer ml-auto"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
