export type Lang = "tr" | "en";

type Entry = { tr: string; en: string };

const dict: Record<string, Entry> = {
  // Main menu
  "menu.tagline": { tr: "Hayatta Kalma RTS Prototipi", en: "Survival RTS Prototype" },
  "menu.subtitle": {
    tr: "Ormanı topla, binalar kur, savaşçı yetiştir ve rakip kampı yık.",
    en: "Gather the jungle, raise buildings, train fighters, and break the rival camp."
  },
  "menu.start": { tr: "Oyna", en: "Start Game" },
  "menu.settings": { tr: "Ayarlar", en: "Settings" },
  "menu.credits": { tr: "Künye", en: "Credits" },
  "menu.bottomTag": { tr: "Kabile seni bekliyor, şef!", en: "The tribe awaits you, chief!" },

  // Clan / HUD
  "clan.subtitle": { tr: "Genç Klan", en: "Young Clan" },
  "res.bananas": { tr: "Muz", en: "Bananas" },
  "res.stones": { tr: "Taş", en: "Stone" },
  "res.wood": { tr: "Odun", en: "Wood" },
  "res.population": { tr: "Nüfus", en: "Pop" },

  // Units / dock
  "unit.worker": { tr: "İşçi", en: "Worker" },
  "unit.fighter": { tr: "Savaşçı", en: "Fighter" },
  "unit.archer": { tr: "Okçu", en: "Archer" },
  "unit.guardian": { tr: "Koruyucu", en: "Guardian" },
  "barracks.trainGuardian": { tr: "Koruyucu Eğit", en: "Train Guardian" },
  "dock.raid": { tr: "BASKIN", en: "RAID" },

  // Village interaction
  "hint.tapBuilding": {
    tr: "Geliştirmek için bir binaya dokun",
    en: "Tap a building to upgrade it"
  },
  "upgrade.button": { tr: "Geliştir", en: "Upgrade" },
  "upgrade.current": { tr: "Mevcut", en: "Current" },
  "upgrade.next": { tr: "Sonraki", en: "Next" },
  "upgrade.needClanHall": { tr: "Klan Salonu gerek", en: "Need Clan Hall" },
  "common.level": { tr: "Seviye", en: "Level" },
  "common.levelBadge": { tr: "Sv. {n}", en: "Lv. {n}" },

  // Settings
  "settings.title": { tr: "Ayarlar", en: "Settings" },
  "settings.language": { tr: "Dil", en: "Language" },
  "settings.sound": { tr: "Ses Efektleri", en: "Sound Effects" },
  "settings.music": { tr: "Müzik", en: "Music" },
  "settings.mute": { tr: "Sesi kapat", en: "Mute" },
  "settings.unmute": { tr: "Sesi aç", en: "Unmute" },
  "settings.support": { tr: "Yardım & Destek", en: "Help & Support" },
  "settings.reset": { tr: "Köyü Sıfırla", en: "Reset Village" },
  "support.title": { tr: "Yardım & Destek", en: "Help & Support" },
  "support.helpHeader": { tr: "Hızlı Yardım", en: "Quick Help" },
  "support.help1": {
    tr: "Asker eğitmek için alttaki kartlara dokun; Eğitim Yuvası savaşçıları açar.",
    en: "Tap the bottom cards to train units; the Training Nest unlocks fighters."
  },
  "support.help2": {
    tr: "BASKIN için önce en az bir savaşçı eğitmen gerekir.",
    en: "You need at least one trained fighter before you can RAID."
  },
  "support.help3": {
    tr: "İşçi Locası'nda işçi üret, ardından bir kaynak seferine gönder.",
    en: "Produce a worker at the Worker Lodge, then send them on a resource expedition."
  },
  "support.reportHeader": { tr: "Sorun Bildir", en: "Report a Problem" },
  "support.notePlaceholder": { tr: "İstersen kısaca anlat...", en: "Optionally add details..." },
  "support.send": { tr: "Bildir", en: "Send Report" },
  "support.sent": { tr: "Bildirimin alındı, sağ ol şef!", en: "Report received, thanks chief!" },
  "support.mailFail": {
    tr: "Posta uygulaması açılamadı — kaydı aldık, tekrar dener misin?",
    en: "Couldn't open a mail app — we logged it, please try again."
  },
  "issue.broken": { tr: "Bir özellik çalışmıyor", en: "A feature isn't working" },
  "issue.noSound": { tr: "Ses gelmiyor", en: "No sound" },
  "issue.freeze": { tr: "Oyun takılıyor / donuyor", en: "Game stutters / freezes" },
  "issue.lostProgress": { tr: "İlerlemem kayboldu", en: "My progress is gone" },
  "issue.other": { tr: "Başka bir sorun", en: "Something else" },
  "settings.close": { tr: "Kapat", en: "Close" },

  // Building names
  "b.clanHall": { tr: "Klan Salonu", en: "Clan Hall" },
  "b.lumberCamp": { tr: "Oduncu Kampı", en: "Lumber Camp" },
  "b.stoneQuarry": { tr: "Taş Ocağı", en: "Stone Quarry" },
  "b.bananaGrove": { tr: "Muz Bahçesi", en: "Banana Grove" },
  "b.workerShelter": { tr: "İşçi Locası", en: "Worker Lodge" },
  "b.trainingNest": { tr: "Eğitim Yuvası", en: "Training Nest" },
  "b.watchTower": { tr: "Gözetleme Kulesi", en: "Watch Tower" },

  // Building effects
  "fx.capacity": { tr: "Kapasite", en: "Capacity" },
  "fx.fighterTraining": { tr: "Savaşçı eğitimi", en: "Fighter training" },
  "fx.defense": { tr: "Savunma", en: "Defense" },
  "fx.campDamageReduction": {
    tr: "Kamp hasar azaltımı {n}",
    en: "Camp damage reduction {n}"
  },
  "fx.archerAttackBonus": {
    tr: "Okçu saldırısı +%{pct}",
    en: "Archer attack +{pct}%"
  },
  "fx.villageLevel": { tr: "Köy seviyesi", en: "Village level" },
  "fx.perSec": { tr: "/sn", en: "/s" },
  "fx.expeditionYield": {
    tr: "{res} seferi getirisi +%{pct}",
    en: "{res} expedition yield +{pct}%"
  },
  "fx.storage": { tr: "Depo", en: "Storage" },
  "fx.troopPower": { tr: "Asker gücü", en: "Troop power" },
  "fb.storageFull": {
    tr: "Depo dolu! Klan Salonu'nu geliştir.",
    en: "Storage full! Upgrade the Clan Hall."
  },
  "fx.muz": { tr: "muz", en: "bananas" },
  "fx.odun": { tr: "odun", en: "wood" },
  "fx.tas": { tr: "taş", en: "stone" },

  // Tutorial
  "tut.0": {
    tr: "Binalar zamanla muz, odun ve taş üretir.",
    en: "Buildings produce bananas, wood and stone over time."
  },
  "tut.1": {
    tr: "Bir binaya dokun ve Geliştir ile seviyesini yükselt.",
    en: "Tap a building and use Upgrade to raise its level."
  },
  "tut.2": {
    tr: "İşçi Locası'nda işçi üretip kaynak seferine gönder.",
    en: "Produce workers at the Worker Lodge and send them on resource expeditions."
  },
  "tut.3": {
    tr: "Savaşçın hazır olunca BASKIN ile düşman kampına saldır.",
    en: "When your fighters are ready, RAID an enemy camp."
  },
  "tut.quickStart": { tr: "Hızlı Başlangıç", en: "Quick Start" },
  "tut.skip": { tr: "Geç", en: "Skip" },
  "tut.next": { tr: "İleri", en: "Next" },
  "tut.play": { tr: "Oyna", en: "Play" },

  // Raid map
  "raidmap.title": { tr: "Baskın Hedefi", en: "Raid Target" },
  "raidmap.ready": { tr: "{n} savaşçı hazır", en: "{n} fighters ready" },
  "raidmap.attack": { tr: "Saldırı", en: "Attack" },
  "raidmap.needFighter": { tr: "Savaşçı gerek", en: "Need fighter" },
  "raidmap.close": { tr: "Köye Dön", en: "Back to Village" },
  "common.levelShort": { tr: "Sv", en: "Lv" },

  // Enemy camps
  "camp.patrol": { tr: "Korsan Devriyesi", en: "Pirate Patrol" },
  "camp.camp": { tr: "Korsan Kampı", en: "Pirate Camp" },
  "camp.fort": { tr: "Korsan Üssü", en: "Pirate Fort" },
  "camp.den": { tr: "Yağmacı Sığınağı", en: "Raider Den" },
  "camp.swamp": { tr: "Bataklık Karakolu", en: "Swamp Outpost" },
  "camp.skull": { tr: "Kafatası Tepesi", en: "Skull Hill" },
  "camp.harbor": { tr: "Gölge Limanı", en: "Shadow Harbor" },
  "camp.cove": { tr: "Kızıl Koy", en: "Crimson Cove" },
  "camp.venom": { tr: "Zehir Bataklığı", en: "Venom Marsh" },
  "camp.storm": { tr: "Fırtına Burnu", en: "Storm Point" },
  "camp.bones": { tr: "Kemik Vadisi", en: "Valley of Bones" },
  "camp.ember": { tr: "Kor Kayalıkları", en: "Ember Cliffs" },
  "camp.blackfort": { tr: "Kara Hisar", en: "Black Citadel" },
  "camp.armada": { tr: "Korsan Armadası", en: "Pirate Armada" },
  "camp.stronghold": { tr: "Korsan Kalesi", en: "Pirate Stronghold" },
  "raidmap.tier2": { tr: "2. KADEME — ZORLU SULAR", en: "TIER 2 — ROUGH WATERS" },
  "raidmap.tier2Note": {
    tr: "Daha sert savunma, çok daha dolgun ganimet",
    en: "Tougher defenses, far richer loot"
  },
  "raidmap.endless": {
    tr: "Her zaferden sonra güçlenerek geri döner",
    en: "Returns stronger after every victory"
  },

  // Raid board
  "raid.title": { tr: "Baskın Savaşı", en: "Raid Battle" },
  "raid.campHp": { tr: "Düşman Kamp Canı", en: "Enemy Camp HP" },
  "raid.power": { tr: "Baskın Gücü", en: "Raid Power" },
  "raid.victory": { tr: "Zafer!", en: "Victory!" },
  "raid.defeat": { tr: "Baskın Başarısız", en: "Raid Failed" },
  "raid.retreatResult": { tr: "Geri Çekildin", en: "Retreated" },
  "raid.victoryText": {
    tr: "Düşman kampı yıkıldı. Ganimet köyüne eklendi.",
    en: "The enemy camp is broken. Spoils were added to your stores."
  },
  "raid.defeatText": {
    tr: "Baskın ekibin düştü. Daha çok savaşçı yetiştir ve tekrar dene.",
    en: "Your raid party fell. Train more fighters and try again."
  },
  "raid.retreatText": {
    tr: "Baskın ekibi kayıpları büyümeden geri döndü.",
    en: "The raid party returned before the losses grew."
  },
  "raid.resourcesLost": { tr: "Kaybedilen kaynaklar", en: "Resources lost" },
  "raid.resourcesProtected": {
    tr: "Temel savaşçı rezervi korundu; kaynak kaybı olmadı.",
    en: "The base fighter reserve was protected; no resources were lost."
  },
  "raid.loot": { tr: "Kazanılan Ganimet", en: "Won Loot" },
  "raid.firstVictoryReward": { tr: "İlk zafer ödülü", en: "First victory reward" },
  "raid.repeatReward": { tr: "Tekrar ödülü · %{percent}", en: "Repeat reward · {percent}%" },
  "raid.strongholdReturn": {
    tr: "Korsan Kalesi güçlenerek geri döndü!",
    en: "The Pirate Stronghold returns stronger!"
  },
  "raid.newLevel": { tr: "Yeni Seviye: Sv {n}", en: "New Level: Lv {n}" },
  "raid.return": { tr: "Köye Dön", en: "Return to Village" },
  "raid.retreat": { tr: "Geri Çekil", en: "Retreat" },

  // Result screen
  "result.victoryKicker": { tr: "Düşman kampı yok edildi", en: "Enemy camp destroyed" },
  "result.defeatKicker": { tr: "Orman geri püskürttü", en: "The jungle pushed back" },
  "result.victory": { tr: "Zafer", en: "Victory" },
  "result.defeat": { tr: "Yenilgi", en: "Defeat" },
  "result.victoryText": {
    tr: "Kabile açıklığı koruyor. Muzlar şimdilik güvende.",
    en: "The tribe holds the clearing. The bananas are safe for now."
  },
  "result.defeatText": {
    tr: "Daha hızlı toparlan ve düşman kampının büyümesine izin verme.",
    en: "Rebuild faster and don't let the enemy camp snowball."
  },
  "result.retry": { tr: "Tekrar Dene", en: "Retry" },
  "result.menu": { tr: "Ana Menü", en: "Main Menu" },

  // Store feedback
  "fb.needTrainingNest": {
    tr: "Savaşçı için Eğitim Yuvası gerekli",
    en: "A Training Nest is needed for fighters"
  },
  "fb.needWatchTower": {
    tr: "Okçu için Gözetleme Kulesi gerekli",
    en: "A Watch Tower is needed for archers"
  },
  "fb.capacityFull": {
    tr: "İşçi Barınağı'nı geliştir, kapasite dolu",
    en: "Upgrade the Worker Shelter, capacity is full"
  },
  "fb.needCost": { tr: "{name} için {cost} gerek", en: "{name} needs {cost}" },
  "fb.trained.worker": { tr: "İşçi kabileye katıldı", en: "Worker joined the tribe" },
  "fb.trained.fighter": { tr: "Savaşçı eğitildi", en: "Fighter trained" },
  "fb.trained.archer": { tr: "Okçu eğitildi", en: "Archer trained" },
  "fb.trained.guardian": { tr: "Koruyucu eğitildi", en: "Guardian trained" },
  "fb.queued.worker": { tr: "İşçi kuyruğa alındı", en: "Worker queued" },
  "fb.queued.fighter": { tr: "Savaşçı kuyruğa alındı", en: "Fighter queued" },
  "fb.queued.archer": { tr: "Okçu kuyruğa alındı", en: "Archer queued" },
  "fb.queued.guardian": { tr: "Koruyucu kuyruğa alındı", en: "Guardian queued" },
  "fb.queueFull": { tr: "Üretim kuyruğu dolu", en: "Production queue is full" },
  "fb.needGems": { tr: "Yeterli gem yok", en: "Not enough gems" },
  "fb.rushed": { tr: "Üretim hızlandırıldı", en: "Production rushed" },
  "fb.questClaimed": { tr: "Görev ödülü alındı!", en: "Quest reward claimed!" },
  "offline.title": { tr: "Tekrar hoş geldin, şef!", en: "Welcome back, chief!" },
  "offline.subtitle": { tr: "Sen yokken kabile çalışmaya devam etti", en: "The tribe kept working while you were away" },
  "offline.away": { tr: "{time} uzaktaydın", en: "You were away for {time}" },
  "offline.collect": { tr: "Topla", en: "Collect" },
  "daily.title": { tr: "Günlük Ödül", en: "Daily Reward" },
  "daily.subtitle": { tr: "Her gün gel, ödül büyüsün!", en: "Come back daily — rewards grow!" },
  "daily.day": { tr: "{n}. Gün", en: "Day {n}" },
  "daily.claim": { tr: "Ödülü Al", en: "Claim Reward" },
  "daily.comeback": { tr: "Yarın tekrar gel!", en: "Come back tomorrow!" },
  "daily.claimed": { tr: "Günlük ödül alındı!", en: "Daily reward claimed!" },
  "shop.title": { tr: "Gem Mağazası", en: "Gem Shop" },
  "shop.subtitle": { tr: "Baskın ve görev gemlerini kaynağa çevir", en: "Turn raid & quest gems into resources" },
  "shop.buy": { tr: "Al", en: "Buy" },
  "shop.bought": { tr: "Satın alındı!", en: "Purchased!" },
  "shop.bananaPack": { tr: "Muz Paketi", en: "Banana Pack" },
  "shop.stonePack": { tr: "Taş Paketi", en: "Stone Pack" },
  "shop.woodPack": { tr: "Odun Paketi", en: "Wood Pack" },
  "shop.bountyChest": { tr: "Bereket Sandığı", en: "Bounty Chest" },
  "collection.title": { tr: "🐵 Maymun Koleksiyonu", en: "🐵 Monkey Collection" },
  "collection.subtitle": {
    tr: "Kabile portrelerini topla ve favorini kuşan.",
    en: "Collect tribe portraits and equip your favorite."
  },
  "collection.collected": { tr: "Toplanan", en: "Collected" },
  "collection.monkeys": { tr: "Maymun", en: "Monkeys" },
  "collection.completion": { tr: "%{percent} Tamamlandı", en: "{percent}% Complete" },
  "collection.progress.monkeysOwned": {
    tr: "Maymunlar: {owned} / {total}",
    en: "Monkeys owned: {owned} / {total}"
  },
  "collection.progress.skinsOwned": {
    tr: "Skinler: {owned} / {total}",
    en: "Skins owned: {owned} / {total}"
  },
  "collection.skinsProgress": {
    tr: "Skinler {owned}/{total} · %{percent}",
    en: "Skins {owned}/{total} · {percent}%"
  },
  "collection.diamonds": { tr: "Elmaslar", en: "Diamonds" },
  "collection.tab.monkeys": { tr: "Maymunlar", en: "Monkeys" },
  "collection.tab.skins": { tr: "Skinler", en: "Skins" },
  "collection.tab.shop": { tr: "Mağaza", en: "Shop" },
  "collection.skinsTitle": { tr: "Skin Koleksiyonu", en: "Skin Collection" },
  "collection.showMore": { tr: "Daha Fazla Göster", en: "Show More" },
  "collection.filter.all": { tr: "Tümü", en: "All" },
  "collection.filter.owned": { tr: "Sahip", en: "Owned" },
  "collection.filter.locked": { tr: "Kilitli", en: "Locked" },
  "collection.filter.allRarities": { tr: "Tüm Nadirlikler", en: "All Rarities" },
  "collection.filter.empty": { tr: "Bu filtreye uygun kozmetik yok.", en: "No cosmetics match this filter." },
  "collection.detail.villagePreview": { tr: "Köy Görünümü", en: "Village Appearance" },
  "collection.detail.availableSkins": { tr: "Mevcut Skinler", en: "Available Skins" },
  "collection.detail.close": { tr: "Kapat", en: "Close" },
  "collection.detail.equipNow": { tr: "Şimdi Kuşan", en: "Equip Now" },
  "collection.detail.tapToSkip": { tr: "Geçmek için dokun", en: "Tap to skip" },
  "collection.detail.missing": { tr: "{amount} elmas eksik", en: "{amount} diamonds short" },
  "collection.requiresMonkey": {
    tr: "Bu skini açmadan önce ait olduğu maymunu koleksiyonuna eklemelisin.",
    en: "Collect this skin's monkey before unlocking it."
  },
  "collection.requiresScout": {
    tr: "Önce Genç İzci Maymunu'nun kilidini aç.",
    en: "Unlock Young Scout Monkey first."
  },
  "collection.requiresWarrior": {
    tr: "Önce Orman Savaşçısı Maymunu'nun kilidini aç.",
    en: "Unlock Forest Warrior Monkey first."
  },
  "collection.requiresMonkeyShort": { tr: "Maymun gerekli", en: "Monkey required" },
  "collection.shop.title": { tr: "Kozmetik Mağaza", en: "Cosmetic Shop" },
  "collection.shop.featuredMonkey": { tr: "Öne Çıkan Maymun", en: "Featured Monkey" },
  "collection.shop.featuredSkin": { tr: "Öne Çıkan Skin", en: "Featured Skin" },
  "collection.shop.bestValue": { tr: "En İyi Değer", en: "Best Value" },
  "collection.shop.featured": { tr: "Öne Çıkan", en: "Featured" },
  "collection.shop.monkeys": { tr: "Maymunlar", en: "Monkeys" },
  "collection.shop.skins": { tr: "Skinler", en: "Skins" },
  "collection.shop.offers": { tr: "Özel Teklifler", en: "Special Offers" },
  "collection.shop.futureReady": { tr: "Yakında", en: "Future collections" },
  "collection.shop.seasonal": { tr: "Sezonluk", en: "Seasonal" },
  "collection.shop.limited": { tr: "Sınırlı Süre", en: "Limited Time" },
  "collection.shop.bundles": { tr: "Paketler", en: "Bundles" },
  "collection.shop.new": { tr: "Yeni", en: "New" },
  "collection.shop.comingSoon": { tr: "Çok Yakında", en: "Coming Soon" },
  "collection.unlocked": { tr: "Açıldı!", en: "Unlocked!" },
  "collection.profileLabel": {
    tr: "Maymun Koleksiyonunu Aç",
    en: "Open Monkey Collection"
  },
  "collection.locked": { tr: "🔒 Kilitli", en: "🔒 Locked" },
  "collection.owned": { tr: "✓ Sahip", en: "✓ Owned" },
  "collection.equipped": { tr: "✓ Kuşanıldı", en: "✓ Equipped" },
  "collection.equip": { tr: "Kuşan", en: "Equip" },
  "collection.cancel": { tr: "İptal", en: "Cancel" },
  "collection.unlock": { tr: "Kilidi Aç", en: "Unlock" },
  "collection.unlockPrompt": {
    tr: "Bu kozmetiğin kilidini 💎 {price} karşılığında aç?",
    en: "Unlock this cosmetic for 💎 {price}?"
  },
  "collection.notEnoughDiamonds": {
    tr: "Yeterli elmas yok.",
    en: "Not enough diamonds."
  },
  "collection.ok": { tr: "Tamam", en: "OK" },
  "collection.rarity.common": { tr: "Yaygın", en: "Common" },
  "collection.rarity.rare": { tr: "Nadir", en: "Rare" },
  "collection.rarity.epic": { tr: "Epik", en: "Epic" },
  "collection.rarity.legendary": { tr: "Efsanevi", en: "Legendary" },
  "collection.rarity.mythic": { tr: "Mitik", en: "Mythic" },
  "collection.monkey.scout.name": { tr: "Genç İzci Maymun", en: "Young Scout Monkey" },
  "collection.monkey.scout.description": {
    tr: "Her efsane bir yerden başlar.",
    en: "Every legend starts somewhere."
  },
  "collection.monkey.worker.name": { tr: "Orman İşçisi Maymun", en: "Jungle Worker Monkey" },
  "collection.monkey.worker.description": {
    tr: "Her büyük kabilenin bel kemiği.",
    en: "The backbone of every great tribe."
  },
  "collection.monkey.warrior.name": { tr: "Orman Savaşçısı Maymun", en: "Forest Warrior Monkey" },
  "collection.monkey.warrior.description": {
    tr: "Kadim ormanın koruyucusu.",
    en: "Guardian of the ancient jungle."
  },
  "collection.monkey.hunter.name": { tr: "Kabile Avcısı Maymun", en: "Tribal Hunter Monkey" },
  "collection.monkey.hunter.description": {
    tr: "Her düşmanın izini şaşmadan sürer.",
    en: "Tracks every enemy without fail."
  },
  "collection.monkey.chief.name": { tr: "Altın Şef Maymun", en: "Golden Chief Monkey" },
  "collection.monkey.chief.description": {
    tr: "Maymun Kabilesi'nin lideri.",
    en: "Leader of the Monkey Tribe."
  },
  "collection.monkey.king.name": { tr: "Maymun Kral", en: "Monkey King" },
  "collection.monkey.king.description": {
    tr: "Ormanın korktuğu efsanevi hükümdar.",
    en: "A legendary ruler feared across the jungle."
  },
  "collection.skin.default.name": { tr: "Varsayılan", en: "Default" },
  "collection.skin.default.description": {
    tr: "Maymunun özgün kabile görünümü.",
    en: "The monkey's original tribe appearance."
  },
  "collection.skin.bananaDeliveryWorker.name": {
    tr: "Muz Teslimat İşçisi",
    en: "Banana Delivery Worker"
  },
  "collection.skin.bananaDeliveryWorker.description": {
    tr: "Kabilenin muzlarını neşeyle ve tam zamanında ulaştırır.",
    en: "Delivers the tribe's bananas cheerfully and right on time."
  },
  "collection.skin.masterJungleBuilder.name": {
    tr: "Usta Orman Yapıcısı",
    en: "Master Jungle Builder"
  },
  "collection.skin.masterJungleBuilder.description": {
    tr: "En büyük kabile yapılarını ince işçilikle yükseltir.",
    en: "Raises the tribe's greatest structures with master craftsmanship."
  },
  "collection.skin.junglePathfinder.name": {
    tr: "Orman Yol Bulucusu",
    en: "Jungle Pathfinder"
  },
  "collection.skin.junglePathfinder.description": {
    tr: "En sık ormanlarda bile kabilenin yolunu bulur.",
    en: "Finds the tribe's path through even the wildest jungle."
  },
  "collection.skin.moonlightTracker.name": {
    tr: "Ay Işığı Takipçisi",
    en: "Moonlight Tracker"
  },
  "collection.skin.moonlightTracker.description": {
    tr: "Ay ışığında sessizce ilerler ve hiçbir izi kaçırmaz.",
    en: "Moves silently by moonlight and never misses a trail."
  },
  "collection.skin.savageJungleRaider.name": {
    tr: "Vahşi Orman Akıncısı",
    en: "Savage Jungle Raider"
  },
  "collection.skin.savageJungleRaider.description": {
    tr: "Savaş izlerini gururla taşıyan korkusuz bir orman akıncısı.",
    en: "A fearless jungle raider who wears every battle mark with pride."
  },
  "collection.skin.ancientWarChief.name": {
    tr: "Kadim Savaş Şefi",
    en: "Ancient War Chief"
  },
  "collection.skin.ancientWarChief.description": {
    tr: "Kadim rünlerle kabilesini zafere taşıyan seçkin bir komutan.",
    en: "An elite commander who leads the tribe with ancient runes."
  },
  "collection.skin.emeraldRanger.name": {
    tr: "Zümrüt Korucu",
    en: "Emerald Ranger"
  },
  "collection.skin.emeraldRanger.description": {
    tr: "Ormanın kalbini sessiz adımlarla koruyan seçkin bir korucu.",
    en: "An elite ranger who guards the jungle's heart with silent steps."
  },
  "collection.skin.royalEagleArcher.name": {
    tr: "Kraliyet Kartal Okçusu",
    en: "Royal Eagle Archer"
  },
  "collection.skin.royalEagleArcher.description": {
    tr: "Kristal okları ve asil duruşuyla kraliyet avcılarının en seçkini.",
    en: "The finest royal hunter, armed with crystal arrows and noble poise."
  },
  "collection.skin.goldenKing.name": { tr: "Altın Kral", en: "Golden King" },
  "collection.skin.goldenKing.description": { tr: "Orman tacının altın ihtişamı.", en: "Golden splendor of the jungle crown." },
  "collection.skin.pirateKing.name": { tr: "Korsan Kral", en: "Pirate King" },
  "collection.skin.pirateKing.description": { tr: "Yedi denizin muz hazinesini arar.", en: "Seeks the banana treasure of seven seas." },
  "collection.skin.samuraiKing.name": { tr: "Samuray Kral", en: "Samurai King" },
  "collection.skin.samuraiKing.description": { tr: "Onurla bilenmiş bir orman savaşçısı.", en: "A jungle warrior sharpened by honor." },
  "collection.skin.vikingKing.name": { tr: "Viking Kral", en: "Viking King" },
  "collection.skin.vikingKing.description": { tr: "Kuzey rüzgârıyla ormana geldi.", en: "Brought the northern wind to the jungle." },
  "collection.skin.cyberKing.name": { tr: "Siber Kral", en: "Cyber King" },
  "collection.skin.cyberKing.description": { tr: "Kabilenin geleceğinden gelen hükümdar.", en: "A ruler from the tribe's future." },
  "collection.skin.lavaKing.name": { tr: "Lav Kralı", en: "Lava King" },
  "collection.skin.lavaKing.description": { tr: "Volkanın sönmeyen ruhunu taşır.", en: "Carries the volcano's undying spirit." },
  "collection.skin.pharaohKing.name": { tr: "Firavun Kral", en: "Pharaoh King" },
  "collection.skin.pharaohKing.description": { tr: "Kayıp tapınakların ebedi hükümdarı.", en: "Eternal ruler of the lost temples." },
  "collection.skin.christmasKing.name": { tr: "Yılbaşı Kralı", en: "Christmas King" },
  "collection.skin.christmasKing.description": { tr: "Kabileye kış neşesi getirir.", en: "Brings winter cheer to the tribe." },
  "collection.skin.spiritKing.name": { tr: "Ruh Kralı", en: "Spirit King" },
  "collection.skin.spiritKing.description": { tr: "Kadim orman ruhlarıyla birlikte yürür.", en: "Walks with the ancient jungle spirits." },
  "time.hours": { tr: "{n} sa", en: "{n}h" },
  "time.minutes": { tr: "{n} dk", en: "{n}m" },
  "quests.title": { tr: "Görevler", en: "Quests" },
  "quests.claim": { tr: "Al", en: "Claim" },
  "quests.done": { tr: "Alındı", en: "Done" },
  "quests.empty": { tr: "Şimdilik hepsi bu kadar, şef!", en: "That's all for now, chief!" },
  "quest.train3": { tr: "3 birim üret", en: "Train 3 units" },
  "quest.upgrade1": { tr: "Bir bina geliştir", en: "Upgrade a building" },
  "quest.shift1": { tr: "İşçileri işe gönder", en: "Send workers to work" },
  "quest.raid1": { tr: "İlk baskını kazan", en: "Win your first raid" },
  "quest.train12": { tr: "12 birim üret", en: "Train 12 units" },
  "quest.upgrade5": { tr: "5 kez bina geliştir", en: "Upgrade buildings 5 times" },
  "quest.raid5": { tr: "5 baskın kazan", en: "Win 5 raids" },
  "workerLodge.eyebrow": { tr: "İŞÇİ YÖNETİMİ", en: "WORKER MANAGEMENT" },
  "workerLodge.capacity": {
    tr: "Loca kapasitesi · {used}/{max}",
    en: "Lodge capacity · {used}/{max}"
  },
  "workerLodge.idle": { tr: "Boşta", en: "Idle" },
  "workerLodge.producing": { tr: "Üretiliyor", en: "Producing" },
  "workerLodge.away": { tr: "Seferde", en: "Away" },
  "workerLodge.ready": { tr: "Hazır", en: "Ready" },
  "workerLodge.produceTitle": { tr: "Muz İşçisi Üret", en: "Produce Banana Workers" },
  "workerLodge.produceSubtitle": {
    tr: "İşçiler tek seferliktir; ödül alınınca locadan ayrılır.",
    en: "Workers are single-use and leave after their reward is collected."
  },
  "workerLodge.produce": { tr: "Üret", en: "Produce" },
  "workerLodge.returns": { tr: "Getiri", en: "Returns" },
  "workerLodge.queueTitle": { tr: "Üretim Kuyruğu", en: "Production Queue" },
  "workerLodge.queueSubtitle": {
    tr: "Kuyruk sırayla ilerler ve çevrimdışıyken de tamamlanır.",
    en: "The queue runs in order and completes while offline."
  },
  "workerLodge.queueEmpty": { tr: "Üretim kuyruğu boş.", en: "The production queue is empty." },
  "workerLodge.producingStatus": { tr: "Üretiliyor", en: "Producing" },
  "workerLodge.queuedStatus": { tr: "Kuyruk · {n}. sıra", en: "Queue · position {n}" },
  "workerLodge.idleTitle": { tr: "Boştaki İşçiler", en: "Idle Workers" },
  "workerLodge.idleSubtitle": {
    tr: "Hazır işçiyi doğrudan Muz Bahçesi'ne gönder.",
    en: "Send a ready worker directly to the Banana Grove."
  },
  "workerLodge.idleEmpty": { tr: "Gönderilmeye hazır işçi yok.", en: "No worker is ready to depart." },
  "workerLodge.expeditionsTitle": { tr: "Aktif Seferler", en: "Active Expeditions" },
  "workerLodge.expeditionsSubtitle": {
    tr: "Dönen ve tamamlanan işçileri buradan takip et.",
    en: "Track departing, returning, and completed workers here."
  },
  "workerLodge.expeditionsEmpty": { tr: "Aktif sefer yok.", en: "There are no active expeditions." },
  "workerLodge.expected": { tr: "Beklenen ödül: {amount}", en: "Expected reward: {amount}" },
  "workerLodge.collect": { tr: "Topla", en: "Collect" },
  "workerLodge.upgradeTitle": { tr: "İşçi Locası · Sv. {level}", en: "Worker Lodge · Lv. {level}" },
  "workerLodge.capacityUpgrade": {
    tr: "Kapasite {current} → {next}",
    en: "Capacity {current} → {next}"
  },
  "workerLodge.upgradeDuration": { tr: "Süre: {duration}", en: "Duration: {duration}" },
  "workerLodge.clanRequirement": { tr: "Klan Salonu Sv. {level} gerekli", en: "Requires Clan Hall Lv. {level}" },
  "workerLodge.upgradeActive": { tr: "Sv. {level} geliştiriliyor", en: "Upgrading to Lv. {level}" },
  "workerLodge.upgradeStarted": { tr: "İşçi Locası Sv. {level} geliştirmesi başladı.", en: "Worker Lodge Lv. {level} upgrade started." },
  "workerLodge.upgradeComplete": { tr: "İşçi Locası geliştirmesi tamamlandı!", en: "Worker Lodge upgrade complete!" },
  "workerLodge.upgradeAlreadyActive": { tr: "İşçi Locası zaten geliştiriliyor.", en: "The Worker Lodge is already upgrading." },
  "workerLodge.needClanLevel": { tr: "Önce Klan Salonu Sv. {level} gerekli.", en: "Clan Hall Lv. {level} is required first." },
  "workerLodge.needStorage": { tr: "Mevcut {amount} depo kapasitesi bu maliyeti tutamıyor.", en: "The current storage capacity of {amount} cannot hold this cost." },
  "workerLodge.storageTooSmall": { tr: "Depo kapasitesi yetersiz", en: "Storage capacity too small" },
  "workerLodge.maxLevel": { tr: "İşçi Locası maksimum seviyede.", en: "The Worker Lodge is at maximum level." },
  "workerLodge.maxLevelShort": { tr: "Maksimum Seviye", en: "Maximum Level" },
  "workerLodge.upgrading": { tr: "Geliştiriliyor", en: "Upgrading" },
  "duration.minute": { tr: "{n} dk", en: "{n} min" },
  "duration.hour": { tr: "{n} sa", en: "{n} hr" },
  "duration.day": { tr: "{n} gün", en: "{n} day" },
  "workerLodge.riskNote": {
    tr: "Seferlerin %97'si tam başarıyla döner; nadir aksilikler ödülü azaltabilir.",
    en: "97% of expeditions return in full; rare mishaps may reduce the reward."
  },
  "workerLodge.storageNote": {
    tr: "Toplanan ödüller mevcut {n} kaynak depo tavanına uyar.",
    en: "Collected rewards respect the current storage cap of {n} per resource."
  },
  "workerLodge.complete": { tr: "Sefer Tamamlandı", en: "Expedition Complete" },
  "workerLodge.returned": { tr: "{name} geri döndü.", en: "{name} returned." },
  "workerLodge.workerLeaves": {
    tr: "Ödül toplandıktan sonra işçi locadan kalıcı olarak ayrıldı.",
    en: "After collection, the worker permanently left the lodge."
  },
  "workerLodge.continue": { tr: "Harika!", en: "Great!" },
  "worker.gatherer.name": { tr: "Genç Muz Toplayıcısı", en: "Young Banana Gatherer" },
  "worker.skilled.name": { tr: "Deneyimli Muz Toplayıcısı", en: "Experienced Banana Gatherer" },
  "worker.master.name": { tr: "Usta Muz Hasatçısı", en: "Master Banana Harvester" },
  "worker.status.active": { tr: "Yolda", en: "On expedition" },
  "worker.status.returning": { tr: "Dönüyor", en: "Returning" },
  "worker.status.completed": { tr: "Tamamlandı", en: "Completed" },
  "worker.outcome.success": {
    tr: "Sefer sorunsuz tamamlandı.",
    en: "The expedition was completed successfully."
  },
  "worker.outcome.half": {
    tr: "Yolda bir aksilik oldu; işçi ödülün yarısıyla döndü.",
    en: "A mishap on the trail reduced the reward by half."
  },
  "worker.outcome.empty": {
    tr: "İşçi yolunu kaybetti ve eli boş döndü.",
    en: "The worker got lost and returned empty-handed."
  },
  "worker.capacityFull": {
    tr: "İşçi Locası kapasitesi dolu.",
    en: "The Worker Lodge is at capacity."
  },
  "worker.queued": { tr: "{name} üretim kuyruğuna alındı.", en: "{name} entered production." },
  "worker.productionReady": { tr: "Yeni işçi sefere hazır!", en: "A new worker is ready!" },
  "worker.expeditionSent": {
    tr: "{name}, {resource} seferine çıktı.",
    en: "{name} left on a {resource} expedition."
  },
  "worker.collected": {
    tr: "+{amount} {resource} toplandı.",
    en: "+{amount} {resource} collected."
  },
  "bananaGrove.send": { tr: "İşe Gönder", en: "Send to Work" },
  "bananaGrove.assigned": { tr: "Muz Bahçesi'nde", en: "At Banana Grove" },
  "bananaGrove.collectThere": { tr: "Muz Bahçesi'nden topla", en: "Collect at Banana Grove" },
  "bananaGrove.harvestReady": { tr: "Muz hasadı toplanmaya hazır!", en: "The banana harvest is ready to collect!" },
  "bananaGrove.storageFullFeedback": { tr: "Muz Bahçesi deposu dolu.", en: "Banana Grove storage is full." },
  "bananaGrove.busyFeedback": { tr: "Muz Bahçesi'nde üç işçi çalışıyor.", en: "Three workers are already working at the Banana Grove." },
  "bananaGrove.eyebrow": { tr: "MUZ ÜRETİMİ", en: "BANANA PRODUCTION" },
  "bananaGrove.storage": { tr: "Bahçe Deposu", en: "Grove Storage" },
  "bananaGrove.empty": { tr: "Boş", en: "Empty" },
  "bananaGrove.working": { tr: "Çalışıyor", en: "Working" },
  "bananaGrove.busy": { tr: "Meşgul", en: "Busy" },
  "bananaGrove.full": { tr: "Depo Dolu", en: "Storage Full" },
  "bananaGrove.ready": { tr: "Toplanmaya Hazır", en: "Ready to Collect" },
  "bananaGrove.workers": { tr: "Bahçedeki İşçiler", en: "Workers at the Grove" },
  "bananaGrove.noWorkers": { tr: "Bahçede çalışan işçi yok.", en: "No workers are assigned to the Grove." },
  "bananaGrove.harvestComplete": { tr: "Muz Hasadı Tamamlandı", en: "Banana Harvest Complete" },
  "bananaGrove.contractEnded": { tr: "Tamamlanan işçi sözleşmeleri sona erdi.", en: "The completed worker contracts have ended." },
  "bananaGrove.storageRemainder": { tr: "Ana depo dolu: {amount} muz bahçede kaldı.", en: "Main storage is full: {amount} bananas remain at the Grove." },
  "barracks.title": { tr: "Karargâh", en: "Barracks" },
  "barracks.empty": {
    tr: "Ordu boş — savaşçı eğit",
    en: "No army yet — train fighters"
  },
  "production.title": { tr: "Üretim Kuyruğu", en: "Production Queue" },
  "production.rush": { tr: "Hızlandır", en: "Rush" },
  "fb.clanHallFirst": {
    tr: "Önce Klan Salonu'nu geliştir",
    en: "Upgrade the Clan Hall first"
  },
  "fb.upgraded": { tr: "{name} Seviye {level}", en: "{name} Level {level}" },
  "fb.needFighter": { tr: "Önce savaşçı eğit", en: "Train a fighter first" },
  "fb.raidStarted": { tr: "{name} baskını başladı!", en: "Raid on {name} started!" },
  "fb.returned": {
    tr: "Baskın ekibi köye döndü",
    en: "Raid party returned to the village"
  },
  "fb.victoryLoot": {
    tr: "Zafer! +{b} muz, +{s} taş, +{w} odun",
    en: "Victory! +{b} bananas, +{s} stone, +{w} wood"
  },
  "fb.raidFailed": {
    tr: "Baskın başarısız. Daha fazla savaşçı eğit.",
    en: "Raid failed. Train more fighters."
  },
  "fb.raidRetreated": {
    tr: "Baskın ekibi geri çekildi.",
    en: "The raid party retreated."
  },
  "fb.hitEnemy": { tr: "Savaşçı düşmana vurdu", en: "Fighter hit the enemy" },
  "fb.enemyCounter": { tr: "Düşman karşılık verdi", en: "Enemy struck back" },
  "fb.towerBlocked": {
    tr: "Gözetleme Kulesi {n} hasar engelledi",
    en: "Watch Tower blocked {n} damage"
  },
  "fb.enemyHitVillage": { tr: "Düşman köyüne saldırdı", en: "Enemy attacked your village" },
  "fb.hitCamp": { tr: "Savaşçı düşman kampına vurdu", en: "Fighter hit the enemy camp" }
};

export function t(key: string, lang: Lang, params?: Record<string, string | number>): string {
  const entry = dict[key];
  let value = entry ? entry[lang] : key;
  if (params) {
    for (const name of Object.keys(params)) {
      value = value.replace(`{${name}}`, String(params[name]));
    }
  }
  return value;
}
