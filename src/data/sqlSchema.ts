/**
 * 13. Yüzyıl Anadolu Strateji Oyunu - Supabase / PostgreSQL Üretim Şeması & Node.js Motoru
 */

export const SUPABASE_POSTGRES_SCHEMA = `-- ========================================================================
-- 13. YÜZYIL ANADOLU & BALKANLAR STRATEJİ OYUNU
-- Üretim Standardında PostgreSQL / Supabase Veritabanı Şeması
-- Evren Boyutu: 0,0 - 1000,500 Devasa Anadolu Grid Izgarası
-- ========================================================================

-- Gerekli Eklentiler
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUM Tipleri
CREATE TYPE beylik_faction_enum AS ENUM (
  'osmanogullari',
  'karamanogullari',
  'aydinogullari',
  'candarogullari',
  'dulkadirogullari'
);

CREATE TYPE resource_type_enum AS ENUM ('wood', 'stone', 'iron', 'grain', 'gold');

-- 2. Oyuncu Profilleri (Profiles / Players)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(32) NOT NULL UNIQUE,
  faction beylik_faction_enum NOT NULL,
  avatar_url TEXT,
  max_villages_allowed INT DEFAULT 10 CHECK (max_villages_allowed <= 10),
  is_onboarded BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================================
-- KALICI BEYLİK SEÇİMİ GÜVENLİK TRİGGER'I (IMMUTABLE FACTION)
-- Kural: Veritabanına işlenen beylik sancağı ASLA sonradan değiştirilemez!
-- ========================================================================
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

-- 3. Köyler (Villages) - 1000x500 Izgara
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

  last_resource_tick TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_village_coordinates UNIQUE (x, y)
);

CREATE INDEX IF NOT EXISTS idx_villages_coords ON public.villages (x, y);

-- 4. Doğal Kaynak Düğümleri (Resource Nodes)
CREATE TABLE IF NOT EXISTS public.resource_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type resource_type_enum NOT NULL,
  name VARCHAR(64) NOT NULL,
  x INT NOT NULL CHECK (x >= 0 AND x <= 1000),
  y INT NOT NULL CHECK (y >= 0 AND y <= 500),
  base_yield_per_hour INT NOT NULL DEFAULT 150,
  tier INT NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_resource_node_coords UNIQUE (x, y)
);

-- ========================================================================
-- 5. RASTGELE BOŞ KOORDİNATA ATAMA & DOĞUŞ (SPAWN RPC)
-- ========================================================================
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
    v_found_coords BOOLEAN := FALSE;
    v_max_attempts INT := 100;
    v_attempt INT := 0;
    v_new_village_id UUID;
BEGIN
    -- Boş koordinat bul
    WHILE NOT v_found_coords AND v_attempt < v_max_attempts LOOP
        v_attempt := v_attempt + 1;
        IF p_faction = 'osmanogullari' THEN
            v_target_x := floor(random() * 80 + 30)::INT;
            v_target_y := floor(random() * 60 + 20)::INT;
        ELSIF p_faction = 'karamanogullari' THEN
            v_target_x := floor(random() * 100 + 140)::INT;
            v_target_y := floor(random() * 80 + 180)::INT;
        ELSIF p_faction = 'aydinogullari' THEN
            v_target_x := floor(random() * 70 + 30)::INT;
            v_target_y := floor(random() * 90 + 220)::INT;
        ELSIF p_faction = 'candarogullari' THEN
            v_target_x := floor(random() * 90 + 220)::INT;
            v_target_y := floor(random() * 60 + 40)::INT;
        ELSE
            v_target_x := floor(random() * 100 + 340)::INT;
            v_target_y := floor(random() * 90 + 300)::INT;
        END IF;

        IF NOT EXISTS(SELECT 1 FROM public.villages WHERE x = v_target_x AND y = v_target_y)
           AND NOT EXISTS(SELECT 1 FROM public.resource_nodes WHERE x = v_target_x AND y = v_target_y) THEN
            v_found_coords := TRUE;
        END IF;
    END LOOP;

    -- Profili ve Köyü Atomik Ekle
    INSERT INTO public.profiles (id, username, faction) VALUES (p_user_id, p_username, p_faction);
    INSERT INTO public.villages (owner_id, name, x, y, is_capital)
    VALUES (p_user_id, p_village_name, v_target_x, v_target_y, true)
    RETURNING id INTO v_new_village_id;

    RETURN json_build_object('success', true, 'x', v_target_x, 'y', v_target_y, 'village_id', v_new_village_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

export const NODEJS_SIMULATION_ENGINE_CODE = `/**
 * 13. Yüzyıl Anadolu Strateji Oyunu - Node.js Serverless Simulation Worker
 * Görevi: Seferleri (March) işlemek ve Köy Etki Çapı (Radius) Kaynak Hesaplamalarını Yönetmek
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// PostGIS / Öklid Etki Çapı Kaynak Tick Motoru
export async function processResourceTick() {
  const { data: villages, error } = await supabase.from('villages').select('*');
  if (error || !villages) return;

  for (const village of villages) {
    const townHallLvl = village.buildings.town_hall || 1;
    // Yarıçap formülü: r = 2.0 + Lvl * 1.25
    const radius = 2.0 + townHallLvl * 1.25;

    // Etki alanı içindeki doğal kaynak düğümlerini topla
    const { data: nodes } = await supabase.rpc('get_nodes_within_radius', {
      v_x: village.x,
      v_y: village.y,
      v_radius: radius
    });

    // Kaynakları güncelle
    // ...
  }
}
`;
