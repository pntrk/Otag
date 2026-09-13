/**
 * Gerçek Türkiye / Anadolu Coğrafi Koordinat ve Vektör Veri Seti (Real Turkey GIS Dataset)
 * 
 * Coğrafi Sınırlar:
 * Enlem (Latitude): 35.7°N — 42.3°N
 * Boylam (Longitude): 25.5°E — 44.9°E
 * 
 * 1000x500 Grid Projeksiyon Formülü:
 * X = ((Longitude - 25.5) / (44.9 - 25.5)) * 1000
 * Y = ((42.3 - Latitude) / (42.3 - 35.7)) * 500
 */

export interface GeoPoint {
  lon: number; // Boylam (°E)
  lat: number; // Enlem (°N)
}

export interface ScreenPoint {
  x: number; // 0..1000
  y: number; // 0..500
}

/**
 * Coğrafi enlem/boylamı 1000x500 harita koordinatlarına dönüştürür
 */
export function geoToMap(lon: number, lat: number): ScreenPoint {
  const minLon = 25.5;
  const maxLon = 44.9;
  const minLat = 35.7;
  const maxLat = 42.3;

  const x = Math.round(((lon - minLon) / (maxLon - minLon)) * 1000);
  const y = Math.round(((maxLat - lat) / (maxLat - minLat)) * 500);

  return {
    x: Math.max(0, Math.min(1000, x)),
    y: Math.max(0, Math.min(500, y))
  };
}

// 1. GERÇEK ANADOLU VE TRAKYA ANA KIYI SINIR VEKTÖRLERİ (Detailed Turkey Border Polygon)
// Karadeniz, Kafkas sınırı, Doğu Anadolu, Suriye/Irak sınırı, Akdeniz, Ege ve Trakya
export const REAL_TURKEY_COASTLINE_GEO: GeoPoint[] = [
  // Trakya & Kırklareli & İğneada (Karadeniz Başlangıcı)
  { lon: 27.98, lat: 41.98 },
  { lon: 28.35, lat: 41.60 },
  { lon: 28.85, lat: 41.35 },
  // İstanbul Boğazı Kuzey Kıyısı
  { lon: 29.08, lat: 41.25 },
  { lon: 29.35, lat: 41.18 },
  // Şile & Kocaeli & Sakarya (Karasu)
  { lon: 29.62, lat: 41.17 },
  { lon: 30.65, lat: 41.12 },
  { lon: 31.42, lat: 41.10 }, // Akçakoca
  // Zonguldak & Bartın & Amasra & İnebolu
  { lon: 31.80, lat: 41.45 },
  { lon: 32.38, lat: 41.75 },
  { lon: 33.75, lat: 41.98 },
  // Sinop İnceburun (Türkiye'nin En Kuzey Ucu: 42° 06' N)
  { lon: 34.95, lat: 42.10 },
  { lon: 35.15, lat: 42.02 },
  { lon: 35.25, lat: 41.70 }, // Gerze
  // Bafra & Kızılırmak Deltası & Samsun
  { lon: 35.95, lat: 41.72 },
  { lon: 36.33, lat: 41.30 },
  // Çarşamba (Yeşilırmak Deltası) & Ünye & Ordu
  { lon: 36.95, lat: 41.25 },
  { lon: 37.30, lat: 41.13 },
  { lon: 37.88, lat: 40.98 },
  // Giresun & Tirebolu & Trabzon
  { lon: 38.40, lat: 40.92 },
  { lon: 38.82, lat: 41.01 },
  { lon: 39.72, lat: 41.00 },
  // Rize & Hopa & Sarp (Gürcistan Sınırı)
  { lon: 40.52, lat: 41.03 },
  { lon: 41.42, lat: 41.40 },
  { lon: 41.55, lat: 41.52 }, // Sarp

  // Kafkas & Doğu Sınırı (Artvin, Ardahan, Kars, Iğdır)
  { lon: 42.50, lat: 41.50 },
  { lon: 43.10, lat: 41.30 },
  { lon: 43.60, lat: 40.90 }, // Kars & Ani
  { lon: 44.05, lat: 40.10 }, // Iğdır & Aras Nehri
  { lon: 44.80, lat: 39.65 }, // Doğubayazıt & Küçük Ağrı
  { lon: 44.40, lat: 38.80 }, // Van Sınırı / Kapıköy
  { lon: 44.55, lat: 37.90 }, // Yüksekova
  { lon: 44.80, lat: 37.40 }, // Şemdinli (En Güneydoğu Ucu)

  // Güneydoğu Sınırı (Hakkari, Şırnak, Cizre, Mardin, Nusaybin)
  { lon: 43.80, lat: 37.30 }, // Çukurca
  { lon: 42.70, lat: 37.35 }, // Uludere
  { lon: 42.18, lat: 37.32 }, // Cizre / Dicle Kıyısı
  { lon: 41.20, lat: 37.07 }, // Nusaybin
  { lon: 40.50, lat: 36.95 }, // Kızıltepe
  { lon: 39.30, lat: 36.90 }, // Ceylanpınar / Akçakale (Urfa)
  { lon: 38.00, lat: 36.85 }, // Birecik / Karkamış (Fırat)
  { lon: 36.90, lat: 36.60 }, // Kilis / Antep Sınırı

  // Hatay & İskenderun Körfezi & Akdeniz
  { lon: 36.20, lat: 35.85 }, // Yayladağı (En Güney Noktası: 35° 54' N)
  { lon: 35.95, lat: 36.05 }, // Samandağ / Asi Nehri Ağzı
  { lon: 35.85, lat: 36.60 }, // İskenderun
  { lon: 35.80, lat: 36.95 }, // Dörtyol / Yumurtalık Körfezi
  // Çukurova Deltası (Ceyhan & Seyhan) & Mersin
  { lon: 35.35, lat: 36.70 }, // Karataş Burnu
  { lon: 34.65, lat: 36.78 }, // Mersin
  { lon: 34.15, lat: 36.48 }, // Erdemli & Kızkalesi
  { lon: 33.95, lat: 36.25 }, // Silifke / Göksu Deltası
  { lon: 33.30, lat: 36.12 }, // Aydıncık
  { lon: 32.85, lat: 36.02 }, // Anamur Burnu
  // Alanya & Manavgat & Antalya Körfezi
  { lon: 32.00, lat: 36.54 }, // Alanya
  { lon: 31.45, lat: 36.78 }, // Side / Manavgat
  { lon: 30.70, lat: 36.88 }, // Antalya
  // Teke Yarımadası & Kemer & Finike & Kaş
  { lon: 30.55, lat: 36.60 }, // Kemer
  { lon: 30.48, lat: 36.22 }, // Gelidonya Burnu
  { lon: 30.15, lat: 36.30 }, // Finike
  { lon: 29.63, lat: 36.20 }, // Kaş
  { lon: 29.30, lat: 36.28 }, // Kalkan / Patara
  { lon: 29.12, lat: 36.62 }, // Fethiye / Ölüdeniz

  // Ege Kıyıları & Muğla & Menteşe & Körfezler
  { lon: 28.65, lat: 36.70 }, // Dalaman / Dalyan
  { lon: 28.27, lat: 36.85 }, // Marmaris
  { lon: 27.68, lat: 36.72 }, // Datça Yarımadası / Knidos (27.38)
  { lon: 27.43, lat: 37.03 }, // Bodrum
  { lon: 27.25, lat: 37.38 }, // Didim / Miletos
  { lon: 27.28, lat: 37.85 }, // Kuşadası / Efes
  // İzmir & Çeşme & Karaburun
  { lon: 26.85, lat: 38.15 }, // Seferihisar
  { lon: 26.30, lat: 38.32 }, // Çeşme Yarımadası
  { lon: 26.36, lat: 38.65 }, // Karaburun
  { lon: 27.14, lat: 38.42 }, // İzmir Körfezi
  { lon: 26.90, lat: 38.75 }, // Foça
  { lon: 26.95, lat: 38.95 }, // Çandarlı Körfezi
  { lon: 26.88, lat: 39.07 }, // Dikili
  // Edremit Körfezi & Ayvalık & Troas / Kaz Dağı
  { lon: 26.69, lat: 39.32 }, // Ayvalık
  { lon: 26.94, lat: 39.58 }, // Edremit / Akçay
  { lon: 26.05, lat: 39.48 }, // Bababurun (Anadolu'nun En Batı Ucu: 26° 04' E)
  { lon: 26.15, lat: 39.85 }, // Bozcaada Karşısı / Alexandria Troas
  // Çanakkale Boğazı & Gelibolu Yarımadası
  { lon: 26.24, lat: 40.03 }, // Troya / Kumkale
  { lon: 26.40, lat: 40.15 }, // Çanakkale Şehir Merkezi
  { lon: 26.70, lat: 40.38 }, // Lapseki / Çardak
  { lon: 27.05, lat: 40.40 }, // Karabiga
  // Bandırma, Erdek & Kapıdağ Yarımadası & Gemlik
  { lon: 27.80, lat: 40.40 }, // Erdek
  { lon: 28.15, lat: 40.45 }, // Kapıdağ Kuzeyi
  { lon: 28.80, lat: 40.35 }, // Mudanya
  { lon: 29.15, lat: 40.43 }, // Gemlik Körfezi
  { lon: 29.50, lat: 40.70 }, // Yalova & Karamürsel & İzmit Körfezi
  // Anadolu Yakası (İstanbul & Üsküdar & Beykoz)
  { lon: 29.02, lat: 41.02 }, // Üsküdar / Harem
  { lon: 29.08, lat: 41.13 }, // Beykoz / Boğaziçi

  // Trakya Batı / Meriç & Edirne Hattı
  { lon: 26.05, lat: 40.58 }, // Saros Körfezi
  { lon: 26.10, lat: 40.75 }, // İpsala / Meriç Deltası
  { lon: 26.55, lat: 41.67 }, // Edirne & Meriç / Tunca Kesişimi
  { lon: 27.22, lat: 41.74 }, // Kırklareli Kuzeyi
  { lon: 27.98, lat: 41.98 }  // İğneada (Çember Kapanışı)
];

// 2. GERÇEK GÖLLER (Real Lake Polygons with Geo Coordinates)
export const REAL_LAKES_GEO = {
  vanGolu: {
    name: 'Van Gölü',
    points: [
      { lon: 42.70, lat: 38.65 },
      { lon: 42.85, lat: 38.95 },
      { lon: 43.35, lat: 39.00 }, // Erciş Körfezi
      { lon: 43.65, lat: 38.75 }, // Muradiye
      { lon: 43.40, lat: 38.50 }, // Van Kalesi Kıyısı
      { lon: 43.15, lat: 38.30 }, // Gevaş & Akdamar
      { lon: 42.80, lat: 38.45 }, // Tatvan Körfezi
      { lon: 42.50, lat: 38.55 }, // Ahlat Kıyısı
      { lon: 42.60, lat: 38.75 }  // Adilcevaz
    ]
  },
  tuzGolu: {
    name: 'Tuz Gölü',
    points: [
      { lon: 33.15, lat: 39.05 },
      { lon: 33.45, lat: 39.00 },
      { lon: 33.65, lat: 38.75 }, // Şereflikoçhisar Kıyısı
      { lon: 33.55, lat: 38.50 }, // Aksaray Sınırı
      { lon: 33.25, lat: 38.60 }, // Eskil
      { lon: 32.95, lat: 38.75 }, // Cihanbeyli
      { lon: 33.00, lat: 38.95 }
    ]
  },
  beysehirGolu: {
    name: 'Beyşehir Gölü',
    points: [
      { lon: 31.45, lat: 37.85 },
      { lon: 31.60, lat: 37.95 },
      { lon: 31.72, lat: 37.75 },
      { lon: 31.55, lat: 37.60 },
      { lon: 31.40, lat: 37.70 }
    ]
  },
  egirdirGolu: {
    name: 'Eğirdir Gölü',
    points: [
      { lon: 30.82, lat: 38.25 },
      { lon: 30.95, lat: 38.20 },
      { lon: 30.90, lat: 37.90 },
      { lon: 30.80, lat: 37.85 },
      { lon: 30.75, lat: 38.10 }
    ]
  },
  iznikGolu: {
    name: 'İznik Gölü',
    points: [
      { lon: 29.45, lat: 40.43 },
      { lon: 29.72, lat: 40.45 },
      { lon: 29.68, lat: 40.40 },
      { lon: 29.40, lat: 40.41 }
    ]
  },
  sapancaGolu: {
    name: 'Sapanca Gölü',
    points: [
      { lon: 30.15, lat: 40.72 },
      { lon: 30.32, lat: 40.71 },
      { lon: 30.28, lat: 40.69 },
      { lon: 30.12, lat: 40.70 }
    ]
  }
};

// 3. GERÇEK NEHİR AĞLARI (Real Major Rivers Polyline Vectors)
export const REAL_RIVERS_GEO = [
  {
    name: 'Kızılırmak',
    points: [
      { lon: 38.25, lat: 39.85 }, // Sivas Kızıldağ
      { lon: 36.80, lat: 39.40 }, // Şarkışla
      { lon: 35.85, lat: 39.05 }, // Kayseri Avanos
      { lon: 34.60, lat: 38.90 }, // Nevşehir Gülşehir
      { lon: 33.70, lat: 39.30 }, // Kırşehir
      { lon: 33.45, lat: 39.80 }, // Kırıkkale
      { lon: 34.00, lat: 40.50 }, // Çankırı
      { lon: 34.80, lat: 40.90 }, // Çorum Osmancık
      { lon: 35.50, lat: 41.35 }, // Vezirköprü
      { lon: 35.95, lat: 41.72 }  // Bafra Deltası Karadeniz
    ]
  },
  {
    name: 'Yeşilırmak',
    points: [
      { lon: 38.50, lat: 39.95 }, // Köse Dağları
      { lon: 37.00, lat: 40.10 }, // Tokat
      { lon: 36.20, lat: 40.50 }, // Turhal
      { lon: 35.85, lat: 40.65 }, // Amasya
      { lon: 36.35, lat: 40.90 }, // Çarşamba Ovası
      { lon: 36.95, lat: 41.25 }  // Karadeniz Dökülüşü
    ]
  },
  {
    name: 'Sakarya Nehri',
    points: [
      { lon: 31.40, lat: 39.10 }, // Çifteler / Eskişehir Kaynağı
      { lon: 31.70, lat: 39.60 }, // Polatlı / Gordion
      { lon: 30.80, lat: 40.05 }, // Nallıhan
      { lon: 30.15, lat: 40.15 }, // Söğüt & Bilecik Kanyonu
      { lon: 30.35, lat: 40.50 }, // Geyve Boğazı
      { lon: 30.45, lat: 40.75 }, // Adapazarı
      { lon: 30.65, lat: 41.12 }  // Karasu Karadeniz
    ]
  },
  {
    name: 'Fırat Nehri',
    points: [
      { lon: 41.30, lat: 39.90 }, // Erzurum Karasu Kolu
      { lon: 39.50, lat: 39.75 }, // Erzincan
      { lon: 38.70, lat: 39.20 }, // Kemaliye
      { lon: 38.60, lat: 38.60 }, // Keban Barajı / Elazığ
      { lon: 38.40, lat: 37.90 }, // Malatya Kömürhan
      { lon: 38.00, lat: 37.40 }, // Samsat / Adıyaman
      { lon: 37.85, lat: 36.95 }  // Birecik / Zeugma
    ]
  },
  {
    name: 'Dicle Nehri',
    points: [
      { lon: 39.20, lat: 38.45 }, // Hazar Gölü Kaynağı
      { lon: 40.25, lat: 37.90 }, // Diyarbakır Hevsel
      { lon: 41.10, lat: 37.75 }, // Batman
      { lon: 41.45, lat: 37.70 }, // Hasankeyf
      { lon: 42.18, lat: 37.32 }  // Cizre
    ]
  },
  {
    name: 'Büyük Menderes',
    points: [
      { lon: 30.00, lat: 38.10 }, // Dinar Kaynağı
      { lon: 29.10, lat: 37.90 }, // Çivril
      { lon: 28.50, lat: 37.85 }, // Nazilli
      { lon: 27.85, lat: 37.85 }, // Aydın
      { lon: 27.25, lat: 37.55 }  // Ege Denizi (Bafa yanı)
    ]
  }
];

// 4. GERÇEK DAĞLAR VE COĞRAFİ ZİRVELER (Real Mountains & Peaks)
export const REAL_MOUNTAINS_GEO = [
  { name: 'Ağrı Dağı (5137m)', lon: 44.30, lat: 39.70, elevation: 5137, tier: 'massive' },
  { name: 'Cilo Dağı (4135m)', lon: 44.00, lat: 37.45, elevation: 4135, tier: 'massive' },
  { name: 'Süphan Dağı (4058m)', lon: 42.82, lat: 38.92, elevation: 4058, tier: 'high' },
  { name: 'Kaçkar Dağı (3932m)', lon: 41.15, lat: 40.85, elevation: 3932, tier: 'high' },
  { name: 'Erciyes Dağı (3917m)', lon: 35.45, lat: 38.53, elevation: 3917, tier: 'high' },
  { name: 'Aladağlar / Demirkazık (3756m)', lon: 35.15, lat: 37.80, elevation: 3756, tier: 'high' },
  { name: 'Bolkar Dağları (3524m)', lon: 34.60, lat: 37.25, elevation: 3524, tier: 'high' },
  { name: 'Hasan Dağı (3268m)', lon: 34.16, lat: 38.12, elevation: 3268, tier: 'medium' },
  { name: 'Nemrut Dağı (Volkan 2948m)', lon: 42.23, lat: 38.62, elevation: 2948, tier: 'medium' },
  { name: 'Uludağ (Keşiş Dağı 2543m)', lon: 29.13, lat: 40.07, elevation: 2543, tier: 'medium' },
  { name: 'Ilgaz Dağları (2587m)', lon: 33.75, lat: 41.08, elevation: 2587, tier: 'medium' },
  { name: 'Küre Dağları', lon: 33.15, lat: 41.70, elevation: 2100, tier: 'medium' },
  { name: 'Kaz Dağı (İda Dağı 1774m)', lon: 26.85, lat: 39.70, elevation: 1774, tier: 'low' },
  { name: 'Spil Dağı (1517m)', lon: 27.45, lat: 38.55, elevation: 1517, tier: 'low' }
];

// 5. 13. YÜZYIL ANADOLU BEYLİKLERİ GERÇEK TARİHİ MERKEZ VE ŞEHİRLERİ (Historical Faction Bases)
export const REAL_FACTION_HISTORICAL_SITES = [
  // Osmanoğulları (Uç Boyu)
  { name: 'Söğüt (İlk Otağ)', faction: 'osmanogullari', lon: 30.18, lat: 40.02, type: 'capital' },
  { name: 'Bilecik Hisarı', faction: 'osmanogullari', lon: 29.98, lat: 40.14, type: 'fortress' },
  { name: 'Domaniç Yaylası', faction: 'osmanogullari', lon: 29.62, lat: 39.80, type: 'pasture' },
  { name: 'İznik (Nikaia)', faction: 'osmanogullari', lon: 29.72, lat: 40.43, type: 'city' },
  { name: 'Bursa (Prusa)', faction: 'osmanogullari', lon: 29.06, lat: 40.18, type: 'city' },

  // Karamanoğulları (Konya & Larende)
  { name: 'Konya (Payitaht)', faction: 'karamanogullari', lon: 32.48, lat: 37.87, type: 'capital' },
  { name: 'Karaman (Larende)', faction: 'karamanogullari', lon: 33.22, lat: 37.18, type: 'city' },
  { name: 'Ermenek Kalesi', faction: 'karamanogullari', lon: 32.89, lat: 36.63, type: 'fortress' },
  { name: 'Alâiye (Alanya)', faction: 'karamanogullari', lon: 32.00, lat: 36.54, type: 'port' },
  { name: 'Aksaray Hisarı', faction: 'karamanogullari', lon: 34.03, lat: 38.37, type: 'fortress' },

  // Aydınoğulları (Ege & Birgi)
  { name: 'Birgi Payitahtı', faction: 'aydinogullari', lon: 28.06, lat: 38.25, type: 'capital' },
  { name: 'Aydın (Güzelhisar)', faction: 'aydinogullari', lon: 27.85, lat: 37.85, type: 'city' },
  { name: 'Tire Sancağı', faction: 'aydinogullari', lon: 27.73, lat: 38.08, type: 'city' },
  { name: 'Ayasuluk (Selçuk/Efes)', faction: 'aydinogullari', lon: 27.37, lat: 37.95, type: 'port' },
  { name: 'İzmir Limanı (Umur Bey)', faction: 'aydinogullari', lon: 27.14, lat: 38.42, type: 'port' },

  // Candaroğulları (Kastamonu & Sinop)
  { name: 'Kastamonu Kalesi', faction: 'candarogullari', lon: 33.78, lat: 41.38, type: 'capital' },
  { name: 'Sinop Tersanesi', faction: 'candarogullari', lon: 35.15, lat: 42.02, type: 'port' },
  { name: 'Küre Bakır Ocakları', faction: 'candarogullari', lon: 33.71, lat: 41.80, type: 'mine' },
  { name: 'Safranbolu Hisarı', faction: 'candarogullari', lon: 32.68, lat: 41.25, type: 'city' },

  // Dulkadiroğulları (Maraş & Elbistan)
  { name: 'Elbistan Otağı', faction: 'dulkadirogullari', lon: 37.18, lat: 38.20, type: 'capital' },
  { name: 'Maraş Kalesi', faction: 'dulkadirogullari', lon: 36.93, lat: 37.58, type: 'city' },
  { name: 'Malatya Hisarı', faction: 'dulkadirogullari', lon: 38.32, lat: 38.35, type: 'city' },
  { name: 'Harput Kalesi', faction: 'dulkadirogullari', lon: 39.25, lat: 38.70, type: 'fortress' },

  // Diğer Tarihi Güçler
  { name: 'Sivas (Eretna / Danişmend)', faction: 'neutral', lon: 37.01, lat: 39.75, type: 'city' },
  { name: 'Trabzon (Komnenos)', faction: 'neutral', lon: 39.72, lat: 41.00, type: 'port' },
  { name: 'Diyarbakır (Âmid)', faction: 'neutral', lon: 40.23, lat: 37.91, type: 'city' },
  { name: 'Erzurum Hisarı', faction: 'neutral', lon: 41.27, lat: 39.90, type: 'city' }
];
