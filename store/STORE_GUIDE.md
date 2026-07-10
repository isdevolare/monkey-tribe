# Monkey Tribe — App Store Teslim Rehberi

Yayın öncesi her şey tek yerde. Komutlar repo kökünden çalıştırılır.

## 1. Build & Submit Komutları

```bash
npm i -g eas-cli            # bir kere
eas login                   # Quickmoo Apple/Expo hesabı
eas build --platform ios --profile production
eas submit --platform ios   # build bitince App Store Connect'e yollar
```

TestFlight'a düşen build'i telefondan test etmeden Review'a gönderme.
Simülatör build'i gerekirse: `eas build --platform ios --profile preview`.

## 2. App Store Connect Metadata (kopyala-yapıştır taslak)

- **İsim:** `Monkey Tribe: Orman Baskını` (düz "Monkey Tribe" doluysa).
  Alternatifler: `Monkey Tribe: Jungle Raid`, `Monkey Tribe – Kabile Savaşı`
- **Alt başlık (30 kr):** `Köyünü kur, kabileni büyüt`
- **Kategori:** Games → Strategy (ikincil: Simulation)
- **Anahtar kelimeler:** `maymun,kabile,köy,baskın,strateji,orman,savaş,inşa,clash,rts`
- **Açıklama (TR):**
  > Ormanın derinliklerinde kendi maymun kabileni kur! Muz topla, köyünü
  > geliştir, savaşçılar eğit ve korsan kamplarına baskın düzenle.
  > 8 kamplık baskın merdivenini tırman, her zaferde güçlenen Korsan
  > Kalesi'ne meydan oku. Binaların her seviyede gözle görülür şekilde
  > büyüsün; günlük ödülleri topla, görevleri tamamla, sen yokken bile
  > kabilenin ürettiklerini geri döndüğünde kasana ekle.
- **Yaş derecelendirmesi:** Anketde her şeye "None", yalnızca
  *Cartoon or Fantasy Violence → Infrequent/Mild* → sonuç **9+**
- **Gizlilik Politikası URL'i:** `store/PRIVACY_POLICY.md` içeriğini bir
  web adresinde yayınla (GitHub Pages / Notion public sayfası yeterli) ve
  o URL'i gir. Politika reklam + IAP'yi şimdiden kapsıyor.

## 3. App Privacy Anketi (nutrition label)

Etiket, **yüklenen binary'nin gerçekte yaptığını** yansıtmalı:

**v1.0 (şu anki durum — reklam/IAP SDK'sı YOK):**
- "Do you collect data from this app?" → **No** ("Data Not Collected")
- Destek e-postası veri toplama sayılmaz (kullanıcı kendi mail uygulamasından gönderiyor)

**Reklam SDK'sı eklendiğinde (AdMob varsayımı) etiketi şuna GÜNCELLE:**
- Identifiers → Device ID → Third-Party Advertising ✓ (tracking ✓ ATT varsa)
- Usage Data → Advertising Data / Product Interaction ✓
- Location → Coarse Location (IP'den) → Advertising ✓
- Ek zorunlular: Info.plist'e `NSUserTrackingUsageDescription` + SKAdNetwork
  ID listesi, açılışta ATT istemi (`expo-tracking-transparency`)

**IAP eklendiğinde:** Purchases → App Functionality ✓ (Apple işlediği için
ödeme verisi bize gelmez; "linked to you" değil)

## 4. Ekran Görüntüsü Çekim Listesi (6.9" zorunlu, 6.5" önerilir)

Simülatör: iPhone 17 Pro Max, `xcrun simctl io booted screenshot`.
Çekilecek 5 kare: köy (yüksek seviyeli binalar + aksesuarlar) • baskın
haritası (8 kamp) • savaş anı (kıvılcım/hasar sayıları) • zafer paneli
(konfeti + yıldızlar) • görevler modalı.

## 5. Reklam + IAP Yol Haritası (v1.0.1+)

1. `react-native-google-mobile-ads` (config plugin ile) + ATT istemi
2. Banner değil **geçiş/ödüllü reklam** öner: baskın sonrası "ganimeti 2x
   yap" ödüllü videosu — oyun akışına en doğal yer
3. IAP: `expo-in-app-purchases` yerine RevenueCat (kolay makbuz doğrulama);
   gem paketleri zaten mağaza UI'sinde tanımlı
4. Her ikisi de eklendiğinde: privacy etiketi + politika sürümü güncelle
