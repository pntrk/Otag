-- ============================================================================
-- 13. YÜZYIL ANADOLU BEYLİKLERİ STRATEJİ OYUNU
-- SUPABASE (POSTGRESQL) PRODUCTION VERİTABANI ŞEMASI & TRİGGER YAPISI
-- ============================================================================
-- Mimari Özellikler:
-- 1. Kalıcı Beylik Seçimi (Trigger ile UPDATE engellemesi - Immutable Faction)
-- 2. 1000x500 Grid Koordinat Kontrolleri (CHECK Constraints & UNIQUE (x, y))
-- 3. Atomik Rastgele Doğuş (Spawn Stored Procedure / RPC)
-- 4. Supabase Row Level Security (RLS) Politikaları
-- ============================================================================

-- 1. Gerekli Uzantılar
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. ENUM TİPLERİ
-- ============================================================================
CREATE TYPE beylik_faction_enum AS ENUM (
    'osmanogullari',
    'karamanogullari',
    'aydinogullari',
    'candarogullari',
    'dulkadirogullari'
);

CREATE TYPE resource_type_enum AS ENUM (
    'wood',
    'stone',
    'iron',
    'grain',
    'gold'
);

CREATE TYPE march_mission_enum AS ENUM (
    'attack',
    'reinforce',
    'transport',
    'scout'
);

-- ============================================================================
-- 3. PROFİLLER TABLOSU (PROFILES / PLAYERS)
-- ============================================================================
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

-- BEYLİK SEÇİMİNİN ASLA DEĞİŞTİRİLEMEMESİNİ SAĞLAYAN GÜVENLİK TRİGGER'I
-- Kural: Bir kez seçilen beylik veritabanında asla güncellenemez (Immutable Faction)
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

-- ============================================================================
-- 4. KÖYLER TABLOSU (VILLAGES)
-- 0,0 ile 1000,500 Arasındaki Anadolu Grid'inde Yer Alır
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(48) NOT NULL,
    x INT NOT NULL CHECK (x >= 0 AND x <= 1000),
    y INT NOT NULL CHECK (y >= 0 AND y <= 500),
    is_capital BOOLEAN DEFAULT false,
    
    -- Kaynak Stokları
    resources JSONB NOT NULL DEFAULT '{
        "wood": 750,
        "stone": 750,
        "iron": 750,
        "grain": 750,
        "gold": 250
    }'::jsonb,

    -- Binalar Seviye Sözlüğü
    buildings JSONB NOT NULL DEFAULT '{
        "town_hall": 1,
        "barracks": 0,
        "stable": 0,
        "watchtower": 0,
        "wall": 0,
        "market": 0,
        "hideout": 1
    }'::jsonb,

    -- Askeri Birlikler Sözlüğü
    units JSONB NOT NULL DEFAULT '{
        "militia": 10,
        "infantry": 0,
        "archer": 0,
        "cavalry": 0,
        "heavy_cavalry": 0,
        "siege_engine": 0
    }'::jsonb,

    last_resource_tick TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- AYNI KOORDİNATTA İKİ FARKLI KÖY OLAMAZ
    CONSTRAINT uq_village_coordinates UNIQUE (x, y)
);

-- Koordinat Arama Hızlandırma İndeksi
CREATE INDEX IF NOT EXISTS idx_villages_coords ON public.villages (x, y);
CREATE INDEX IF NOT EXISTS idx_villages_owner ON public.villages (owner_id);

-- ============================================================================
-- 5. DOĞAL KAYNAK DÜĞÜMLERİ TABLOSU (RESOURCE NODES)
-- Haritaya Dağılmış Zengin Kaynak Damarları (Orman, Taş Ocağı vb.)
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_resource_nodes_coords ON public.resource_nodes (x, y);

-- ============================================================================
-- 6. ASKERİ SEFERLER TABLOSU (MARCHES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.marches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
    target_village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
    origin_x INT NOT NULL,
    origin_y INT NOT NULL,
    target_x INT NOT NULL,
    target_y INT NOT NULL,
    mission march_mission_enum NOT NULL,
    units JSONB NOT NULL,
    carried_resources JSONB DEFAULT '{"wood":0,"stone":0,"iron":0,"grain":0,"gold":0}'::jsonb,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'moving' -- 'moving', 'returning', 'completed'
);

-- ============================================================================
-- 7. SAKLI YORDAM: RASTGELE BOŞ KOORDİNATA ATAMA & DOĞUŞ (SPAWN RPC)
-- Atomik olarak yeni oyuncu oluşturur, boş koordinat bulur ve başkent köyünü kurar
-- ============================================================================
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
    v_profile_exists BOOLEAN;
    v_result JSONB;
BEGIN
    -- 1. Kullanıcının zaten bir profili var mı kontrol et
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;
    
    IF v_profile_exists THEN
        RAISE EXCEPTION 'Bu kullanıcı zaten bir beylik seçmiş ve oyuna başlamıştır.';
    END IF;

    -- 2. 1000x500 Grid üzerinde boş bir koordinat bul (Çakışma Kontrolü)
    WHILE NOT v_found_coords AND v_attempt < v_max_attempts LOOP
        v_attempt := v_attempt + 1;

        -- Beyliğin tarihi coğrafi merkezine yakın rastgele koordinat havuzu
        IF p_faction = 'osmanogullari' THEN
            v_target_x := floor(random() * 80 + 30)::INT;   -- Bilecik / Söğüt bölgesi
            v_target_y := floor(random() * 60 + 20)::INT;
        ELSIF p_faction = 'karamanogullari' THEN
            v_target_x := floor(random() * 100 + 140)::INT; -- Konya / Karaman ovası
            v_target_y := floor(random() * 80 + 180)::INT;
        ELSIF p_faction = 'aydinogullari' THEN
            v_target_x := floor(random() * 70 + 30)::INT;   -- Ege / Menderes
            v_target_y := floor(random() * 90 + 220)::INT;
        ELSIF p_faction = 'candarogullari' THEN
            v_target_x := floor(random() * 90 + 220)::INT;  -- Kastamonu / Karadeniz
            v_target_y := floor(random() * 60 + 40)::INT;
        ELSE -- dulkadirogullari
            v_target_x := floor(random() * 100 + 340)::INT; -- Toroslar / Maraş
            v_target_y := floor(random() * 90 + 300)::INT;
        END IF;

        -- Koordinatın boş olduğunu doğrula (Köy veya Kaynak Düğümü olmamalı)
        IF NOT EXISTS(SELECT 1 FROM public.villages WHERE x = v_target_x AND y = v_target_y)
           AND NOT EXISTS(SELECT 1 FROM public.resource_nodes WHERE x = v_target_x AND y = v_target_y) THEN
            v_found_coords := TRUE;
        END IF;
    END LOOP;

    -- Eğer dar bölgede bulunamadıysa tüm 1000x500 harita üzerinde ara
    IF NOT v_found_coords THEN
        v_target_x := floor(random() * 900 + 50)::INT;
        v_target_y := floor(random() * 400 + 50)::INT;
    END IF;

    -- 3. Profili Ekle (Kalıcı Beylik ile)
    INSERT INTO public.profiles (id, username, faction, is_onboarded)
    VALUES (p_user_id, p_username, p_faction, true);

    -- 4. Başkent Köyünü Oluştur
    INSERT INTO public.villages (
        owner_id,
        name,
        x,
        y,
        is_capital,
        resources,
        buildings,
        units
    )
    VALUES (
        p_user_id,
        COALESCE(NULLIF(p_village_name, ''), p_username || ' Otağı'),
        v_target_x,
        v_target_y,
        true,
        '{"wood": 800, "stone": 800, "iron": 800, "grain": 800, "gold": 300}'::jsonb,
        '{"town_hall": 1, "barracks": 0, "stable": 0, "watchtower": 0, "wall": 0, "market": 0, "hideout": 1}'::jsonb,
        '{"militia": 15, "infantry": 0, "archer": 0, "cavalry": 0, "heavy_cavalry": 0, "siege_engine": 0}'::jsonb
    )
    RETURNING id INTO v_new_village_id;

    -- 5. Sonuç JSON çıktısı hazırla
    SELECT json_build_object(
        'success', true,
        'user_id', p_user_id,
        'username', p_username,
        'faction', p_faction,
        'village', json_build_object(
            'id', v_new_village_id,
            'name', COALESCE(NULLIF(p_village_name, ''), p_username || ' Otağı'),
            'x', v_target_x,
            'y', v_target_y,
            'is_capital', true
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. SUPABASE ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marches ENABLE ROW LEVEL SECURITY;

-- Profiller: Herkes okuyabilir (Multiplayer liderlik / harita), sadece sahibi güncelleyebilir
CREATE POLICY "Profiles are readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Köyler: Haritada herkes görebilir (Koordinatlar, İsim), kaynakları ve inşaatları sadece sahibi günceller
CREATE POLICY "Villages are visible to all players" ON public.villages FOR SELECT USING (true);
CREATE POLICY "Users can update only their own villages" ON public.villages FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert villages" ON public.villages FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Kaynak Düğümleri: Herkes okuyabilir, sadece sistem yönetir
CREATE POLICY "Resource nodes are public" ON public.resource_nodes FOR SELECT USING (true);

-- Seferler: Sadece ilgili köylerin sahipleri görebilir
CREATE POLICY "Marches visible to owners" ON public.marches FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM public.villages WHERE id = origin_village_id AND owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.villages WHERE id = target_village_id AND owner_id = auth.uid())
);
