# Monkey Tribe — Bina Seti Üretim Brief'i

Amaç: köyün "birkaç kulübeli orman" gibi değil, mockup'taki gibi **kurulmuş bir
kabile köyü** gibi görünmesi. Bunun sırrı tek tek güzel görsel değil — **tek
standarda üretilmiş uyumlu bir set**. Aşağıdaki kuralları her binada aynen uygula.

---

## 0) Tek önemli kural

Tüm binaları **aynı oturumda, aynı stil komutuyla** üret. Mockup güzel görünüyor
çünkü tek tabloda boyanmış; ışık, açı, ölçek, palet otomatik uyumlu. Biz de her
binayı **aynı kamera açısı + aynı ışık + aynı ölçek + aynı palet** ile üretirsek
oyunda yan yana geldiklerinde tek elden çıkmış gibi durur.

En kritik 3 bina şu an gerçek bina değil, sadece doğa sprite'ı (bir palmiye, bir
ağaç, bir kaya). Öncelik bunlar: **Muz Bahçesi, Oduncu Kampı, Taş Ocağı.**

---

## 1) Her komuta eklenecek stil önsözü (kopyala-yapıştır)

> Isometric 3/4 top-down mobile game building, "Clash of Clans" style, stylized
> cartoon 3D, warm hand-painted textures, thick clean silhouette, cute jungle
> monkey-tribe theme (bamboo, thatched roofs, wood, vines, tribal banners).
> Camera angle ~35° from above, sunlight from the top-left, soft ambient
> occlusion. Rich but readable at small size. **Transparent background, single
> centered object, no ground, no shadow baked in, no text.** Square canvas,
> 1024×1024, high detail. Palette: jungle greens, warm wood browns, gold trim
> (#e2b15a), leaf accents. Consistent scale and style across the whole set.

Sonra o binanın tarifini ekle (aşağıda).

---

## 2) 7 bina — tek tek tarifler

Öncelik sırası P1-P3 olarak işaretli 3 tanede (şu an eksik olanlar).

| # | Bina | Tarif (önsözden sonra ekle) |
|---|------|------|
| P1 | **Muz Bahçesi** | "a cultivated banana plantation hut: a small thatched-roof wooden shed with woven baskets overflowing with bananas, banana palms trained in neat rows beside it, a little harvest cart" |
| P2 | **Oduncu Kampı** | "a lumberjack's camp building: a timber lodge with a slanted log roof, a sawhorse with a two-man saw, stacked cut logs, an axe embedded in a chopping stump" |
| P3 | **Taş Ocağı** | "a stone quarry structure: a stout stone-and-timber building with a mine entrance, carved rock blocks on wooden sleds, a pickaxe and pulley crane, gravel piles" |
| 4 | **Klan Salonu** (Sv1/2/3) | "the grand clan hall: a large ceremonial thatched hut on a raised wooden platform, blue tribal banners, carved monkey totem over the door, torches" — 3 seviye: Sv1 sade, Sv2 daha büyük + ikinci kat, Sv3 gösterişli altın süslemeler |
| 5 | **İşçi Barınağı** | "a workers' shelter: a cozy round thatched hut with hammocks, a cooking pot, laundry line, small windows glowing warm" |
| 6 | **Eğitim Yuvası** | "a training nest / barracks: a fenced training ground with wooden dummies, a weapon rack (spears, shields), a banner pole, a covered drill hut" |
| 7 | **Gözetleme Kulesi** | "a watchtower: a tall bamboo-and-wood lookout tower with a thatched cap, a rope ladder, a warning drum, a red pennant on top" |

---

## 3) Seviye varyantları (opsiyonel ama etkili)

Oyun binaları geliştikçe büyütüyor ve aksesuar ekliyor. İdeal olarak her bina için
**3 varyant** üret: **Sv1 (sade) / Sv2 (büyümüş) / Sv3+ (gösterişli, altın süslü)**.
Zaman darsa v1 için **bina başına tek "hero" görsel** yeterli — oyun onu seviyeye
göre zaten hafifçe büyütüyor. Klan Salonu'nun 3 seviyesi zaten kodda kullanılıyor,
onu mutlaka 3 varyant yap.

---

## 4) Teknik çıktı kuralları (uymazsan oyunda bozuk görünür)

- **Şeffaf arka plan PNG.** JPG/beyaz zemin OLMAZ.
- **Kare tuval**, 1024×1024. Tek nesne, ortalanmış.
- **Zemin ve gölge çizme** — oyun gölgeyi kendi ekliyor (yeni eklendi). Baked gölge
  çift gölge yapar.
- Nesne çerçeveye değmesin, kenarda ~%8 boşluk bırak.
- Aynı ölçek: binaları hayali aynı zemine oturuyormuş gibi çiz (kule uzun, kulübe
  alçak ama hepsi aynı "birim maymun" boyuna göre).

---

## 5) Dosya adları ve nereye atılacak

Üretince şu **tam adlarla** kaydet ve şu klasöre at — kod bu adları bekliyor:

```
assets/game/buildings/
  building_banana_grove.png      ← Muz Bahçesi (YENİ)
  building_lumber_camp.png       ← Oduncu Kampı (YENİ)
  building_stone_quarry.png      ← Taş Ocağı (YENİ)
  building_player_camp.png       ← Klan Salonu Sv1 (mevcut, değiştir)
  building_hut.png               ← İşçi Barınağı (mevcut, değiştir)
  building_training_nest.png     ← Eğitim Yuvası (mevcut, değiştir)
  building_watch_post.png        ← Gözetleme Kulesi (mevcut, değiştir)

assets/game/generated/camps/
  camp_player_level2.png         ← Klan Salonu Sv2 (mevcut, değiştir)
  camp_player_level3.png         ← Klan Salonu Sv3 (mevcut, değiştir)
```

P1-P3 olarak işaretli 3 YENİ dosya en önemlisi — onlar gelince köy anında "bina" gibi olur.

---

## 6) Sen görselleri atınca ben ne yapacağım

3 yeni bina dosyası (`building_banana_grove/lumber_camp/stone_quarry`) geldiğinde:
1. `gameAssets.ts`'e 3 yeni asset kaydı eklerim.
2. `VillageBoard.tsx`'te Muz Bahçesi/Oduncu/Taş Ocağı eşlemesini ağaç/kaya yerine
   yeni binalara çeviririm.
3. Simülatörde doğrulayıp commit'lerim. Kaynak toplama ağaçları/kayaları köyün
   kenarına dekor olarak bırakırız — böylece binalar öne çıkar.

Mevcut 6 binayı daha iyi versiyonlarıyla değiştirirsen sadece aynı adla üstüne
yaz, kod otomatik kullanır.

---

## 7) Kabul kontrol listesi

- [ ] Şeffaf arka plan, kare, ortalanmış, gölgesiz
- [ ] 7 binanın hepsi aynı açı/ışık/palet/ölçekte (yan yana koyunca tek elden)
- [ ] Muz Bahçesi/Oduncu/Taş Ocağı artık **yapı** gibi (ağaç/kaya değil)
- [ ] Klan Salonu 3 seviye varyantı var
- [ ] Dosya adları yukarıdakiyle birebir aynı
