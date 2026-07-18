export type Lang = "tr" | "en";

type Entry = { tr: string; en: string };

const dict: Record<string, Entry> = {
  // Main menu
  "menu.tagline": { tr: "Kendi Maymun Krallığını Kur", en: "Build Your Monkey Kingdom" },
  "menu.subtitle": {
    tr: "Köyünü geliştir, ordunu kur ve ormana hükmet.",
    en: "Grow your village, raise your army, and rule the jungle."
  },
  "menu.start": { tr: "Oyna", en: "Start Game" },
  "menu.settings": { tr: "Ayarlar", en: "Settings" },
  "menu.credits": { tr: "Künye", en: "Credits" },
  "menu.bottomTag": { tr: "Kabile seni bekliyor, şef!", en: "The tribe awaits you, chief!" },
  "loading.gatheringBananas": { tr: "Muzlar toplanıyor...", en: "Gathering bananas..." },
  "loading.preparingTribe": { tr: "Kabile hazırlanıyor...", en: "Preparing the tribe..." },
  "loading.buildingVillage": { tr: "Köy kuruluyor...", en: "Building the village..." },
  "loading.trainingWarriors": { tr: "Savaşçılar eğitiliyor...", en: "Training warriors..." },
  "loading.exploringJungle": { tr: "Orman keşfediliyor...", en: "Exploring the jungle..." },
  "loading.sharpeningSpears": { tr: "Mızraklar bileniyor...", en: "Sharpening spears..." },
  "loading.openingPalace": { tr: "Kraliyet Sarayı açılıyor...", en: "Opening the Royal Palace..." },

  // Clan / HUD
  "clan.subtitle": { tr: "Genç Klan", en: "Young Clan" },
  "res.bananas": { tr: "Muz", en: "Bananas" },
  "res.stones": { tr: "Taş", en: "Stone" },
  "res.wood": { tr: "Odun", en: "Wood" },
  "res.population": { tr: "Ordu", en: "Army" },

  // Units / dock
  "unit.worker": { tr: "İşçi", en: "Worker" },
  "unit.fighter": { tr: "Savaşçı", en: "Fighter" },
  "unit.archer": { tr: "Okçu", en: "Archer" },
  "unit.shield_guardian": { tr: "Kalkan Muhafızı", en: "Shield Guardian" },
  "unit.crossbowman": { tr: "Arbaletçi", en: "Crossbowman" },
  "dock.raid": { tr: "BASKIN", en: "RAID" },

  // Village interaction
  "hint.tapBuilding": {
    tr: "Geliştirmek için bir binaya dokun",
    en: "Tap a building to upgrade it"
  },
  "shortcut.select": { tr: "Bir bina seç", en: "Choose a building" },
  "shortcut.quickAccess": { tr: "Hızlı Erişim", en: "Quick Access" },
  "shortcut.defaultAction": { tr: "Yönetmek için bir binaya dokun.", en: "Tap a building to manage it." },
  "shortcut.clan": { tr: "Klan", en: "Clan" },
  "shortcut.workers": { tr: "İşçiler", en: "Workers" },
  "shortcut.banana": { tr: "Muz", en: "Banana" },
  "shortcut.wood": { tr: "Odun", en: "Wood" },
  "shortcut.stone": { tr: "Taş", en: "Stone" },
  "shortcut.training": { tr: "Eğitim", en: "Training" },
  "shortcut.tower": { tr: "Kule", en: "Tower" },
  "shortcut.palace": { tr: "Saray", en: "Palace" },
  "shortcut.action.clanHall": { tr: "Köyünü geliştir ve baskına çık.", en: "Upgrade your village and launch raids." },
  "shortcut.action.workerShelter": { tr: "İşçi üret ve göreve gönder.", en: "Produce workers and send missions." },
  "shortcut.action.bananaGrove": { tr: "Muz üretimini yönet.", en: "Manage banana production." },
  "shortcut.action.lumberCamp": { tr: "Odun üretimini yönet.", en: "Manage wood production." },
  "shortcut.action.stoneQuarry": { tr: "Taş üretimini yönet.", en: "Manage stone production." },
  "shortcut.action.trainingNest": { tr: "Askerlerini eğit.", en: "Train your troops." },
  "shortcut.action.watchTower": { tr: "Savunma ve keşif bonuslarını yönet.", en: "Manage defense and scouting bonuses." },
  "shortcut.action.royalPalace": { tr: "Hanedanını ve saray sakinlerini yönet.", en: "Manage your dynasty and palace residents." },
  "upgrade.button": { tr: "Geliştir", en: "Upgrade" },
  "upgrade.current": { tr: "Mevcut", en: "Current" },
  "upgrade.next": { tr: "Sonraki", en: "Next" },
  "upgrade.needClanHall": { tr: "Klan Salonu gerek", en: "Need Clan Hall" },
  "common.level": { tr: "Seviye", en: "Level" },
  "common.levelBadge": { tr: "Sv. {n}", en: "Lv. {n}" },

  // Settings
  "settings.title": { tr: "Ayarlar", en: "Settings" },
  "settings.sectionGame": { tr: "Oyun", en: "Game" },
  "settings.sectionAudio": { tr: "Ses", en: "Audio" },
  "settings.sectionSupport": { tr: "Destek", en: "Support" },
  "settings.sectionAbout": { tr: "Hakkında", en: "About" },
  "settings.sectionDeveloper": { tr: "Geliştirici Araçları", en: "Developer Tools" },
  "settings.language": { tr: "Dil", en: "Language" },
  "settings.notifications": { tr: "Bildirimler", en: "Notifications" },
  "settings.haptics": { tr: "Titreşim", en: "Haptics" },
  "settings.performance": { tr: "Performans Modu", en: "Performance Mode" },
  "settings.balanced": { tr: "Dengeli", en: "Balanced" },
  "settings.highPerformance": { tr: "Yüksek Performans", en: "High Performance" },
  "settings.replayTutorial": { tr: "Öğreticiyi Tekrar Göster", en: "Replay Tutorial" },
  "settings.sound": { tr: "Ses Efektleri", en: "Sound Effects" },
  "settings.music": { tr: "Müzik", en: "Music" },
  "settings.mute": { tr: "Sesi kapat", en: "Mute" },
  "settings.unmute": { tr: "Sesi aç", en: "Unmute" },
  "settings.support": { tr: "Yardım & Destek", en: "Help & Support" },
  "settings.supportDetail": { tr: "Sorun bildir veya yardım al", en: "Report a problem or get help" },
  "settings.reset": { tr: "Köyü Sıfırla", en: "Reset Village" },
  "settings.version": { tr: "Sürüm", en: "Version" },
  "settings.privacy": { tr: "Gizlilik Politikası", en: "Privacy Policy" },
  "settings.terms": { tr: "Kullanım Şartları", en: "Terms" },
  "settings.supportShort": { tr: "Destek", en: "Support" },
  "settings.credits": { tr: "Krediler", en: "Credits" },
  "settings.creditsBody": {
    tr: "Monkey Tribe — Quick Moo Digital. Ses efektleri: Kenney (CC0).",
    en: "Monkey Tribe — Quick Moo Digital. Sound effects: Kenney (CC0)."
  },
  "support.title": { tr: "Yardım & Destek", en: "Help & Support" },
  "support.back": { tr: "Geri", en: "Back" },
  "support.intro": {
    tr: "Sorununu seç ve istersen kısa bir açıklama ekle.",
    en: "Choose the issue and optionally add a short description."
  },
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
  "support.diagnosticsNote": {
    tr: "Rapora yalnızca sürüm, yapı, platform, cihaz modeli ve seçilen kategori eklenir.",
    en: "Only app version, build, platform, device model, and the selected category are attached."
  },
  "issue.broken": { tr: "Bir özellik çalışmıyor", en: "A feature isn't working" },
  "issue.noSound": { tr: "Ses gelmiyor", en: "No sound" },
  "issue.freeze": { tr: "Oyun takılıyor / donuyor", en: "Game stutters / freezes" },
  "issue.lostProgress": { tr: "İlerlemem kayboldu", en: "My progress is gone" },
  "issue.purchase": { tr: "Satın alma sorunu", en: "Purchase issue" },
  "issue.other": { tr: "Başka bir sorun", en: "Something else" },
  "qa.title": { tr: "Test Kodu", en: "Test Code" },
  "qa.help": { tr: "Yalnızca dahili test bakiyesi için.", en: "For internal test balance only." },
  "qa.placeholder": { tr: "Kodu gir", en: "Enter code" },
  "qa.use": { tr: "Kullan", en: "Redeem" },
  "qa.success": { tr: "5.000 Gem test bakiyesi eklendi.", en: "5,000 test Gems added." },
  "qa.invalid": { tr: "Geçersiz kod.", en: "Invalid code." },
  "qa.used": { tr: "Bu kod daha önce kullanıldı.", en: "This code has already been used." },
  "settings.close": { tr: "Kapat", en: "Close" },

  // Building names
  "b.clanHall": { tr: "Klan Salonu", en: "Clan Hall" },
  "b.lumberCamp": { tr: "Oduncu Kampı", en: "Lumber Camp" },
  "b.stoneQuarry": { tr: "Taş Ocağı", en: "Stone Quarry" },
  "b.bananaGrove": { tr: "Muz Bahçesi", en: "Banana Grove" },
  "b.workerShelter": { tr: "İşçi Locası", en: "Worker Lodge" },
  "b.trainingNest": { tr: "Eğitim Yuvası", en: "Training Nest" },
  "b.watchTower": { tr: "Gözetleme Kulesi", en: "Watch Tower" },
  "b.royalPalace": { tr: "Kraliyet Sarayı", en: "Royal Palace" },

  "royalPalace.description": {
    tr: "Hanedanını kur, seçkin maymunlarını sarayda sergile ve kraliyet itibarını yükselt.",
    en: "Build your dynasty, display your finest monkeys and raise your royal prestige."
  },
  "royalPalace.prestige": { tr: "Kraliyet İtibarı", en: "Royal Prestige" },
  "royalPalace.overview": { tr: "Saray Görünümü", en: "Palace Overview" },
  "royalPalace.characters": { tr: "Karakterler", en: "Characters" },
  "royalPalace.skins": { tr: "Skinler", en: "Skins" },
  "royalPalace.oneAppearance": { tr: "Her karakter için tek aktif görünüm", en: "One active appearance per character" },
  "royalPalace.activeAppearance": { tr: "Aktif Görünüm", en: "Active Appearance" },
  "royalPalace.select": { tr: "Seç", en: "Select" },
  "royalPalace.visible": { tr: "Sarayda gösteriliyor", en: "Visible in the Palace" },
  "royalPalace.hidden": { tr: "Sarayda gizli", en: "Hidden from the Palace" },
  "royalPalace.show": { tr: "Göster", en: "Show" },
  "royalPalace.hide": { tr: "Gizle", en: "Hide" },
  "royalPalace.residents": { tr: "Saray Sakinleri", en: "Palace Residents" },
  "royalPalace.characterSelector": { tr: "Karakter Seçici", en: "Character Selector" },
  "royalPalace.place": { tr: "Karakter Yerleştir", en: "Place Character" },
  "royalPalace.change": { tr: "Karakteri Değiştir", en: "Change Character" },
  "royalPalace.remove": { tr: "Saraydan Kaldır", en: "Remove from Palace" },
  "royalPalace.emptySlot": { tr: "Karakter Yerleştir", en: "Place Character" },
  "royalPalace.levelRequired": { tr: "Saray Sv. {level} gerekli", en: "Palace Lv. {level} required" },
  "royalPalace.monkeyNotOwned": { tr: "Bu karaktere sahip değilsin", en: "You do not own this character" },
  "royalPalace.parentRequired": { tr: "Parent karakter gerekli", en: "Parent character required" },
  "royalPalace.skinNotOwned": { tr: "Bu skin'e sahip değilsin", en: "You do not own this skin" },
  "royalPalace.throneKingOnly": { tr: "Taht yalnız Monkey King içindir", en: "The throne is for Monkey King only" },
  "royalPalace.residentPlaced": { tr: "Karakter saraya yerleştirildi.", en: "Character placed in the palace." },
  "royalPalace.residentRemoved": { tr: "Karakter saraydan kaldırıldı.", en: "Character removed from the palace." },
  "royalPalace.skinSelected": { tr: "Saray görünümü güncellendi.", en: "Palace appearance updated." },
  "royalPalace.characterShown": { tr: "Karakter sarayda gösteriliyor.", en: "Character is now visible in the Palace." },
  "royalPalace.characterHidden": { tr: "Karakter sarayda gizlendi.", en: "Character hidden from the Palace." },
  "royalPalace.upgrade": { tr: "Saray Geliştirme", en: "Palace Upgrade" },
  "royalPalace.upgradeStarted": { tr: "Saray Sv. {level} geliştirmesi başladı.", en: "Palace Lv. {level} upgrade started." },
  "royalPalace.upgrading": { tr: "Saray Sv. {level} geliştiriliyor", en: "Palace Lv. {level} is upgrading" },
  "royalPalace.upgradeComplete": {
    tr: "Kraliyet Sarayı geliştirmesi tamamlandı. Yeni sınıf ve yeni saray alanı açıldı.",
    en: "Royal Palace upgrade complete. A new class and palace area are unlocked."
  },
  "royalPalace.maxLevel": { tr: "Kraliyet Sarayı maksimum seviyede.", en: "Royal Palace is at maximum level." },
  "royalPalace.otherUpgradeActive": { tr: "Başka bir bina geliştirmesi devam ediyor.", en: "Another building upgrade is already active." },
  "royalPalace.needClanHall": { tr: "Klan Salonu Sv. {level} gerekli.", en: "Clan Hall Lv. {level} required." },
  "royalPalace.needGems": { tr: "{amount} Gem gerekli.", en: "{amount} Gems required." },
  "royalPalace.finishNow": { tr: "Gem ile Hemen Bitir · {amount}", en: "Finish Now with Gems · {amount}" },
  "royalPalace.rushComplete": { tr: "Kraliyet Sarayı geliştirmesi tamamlandı.", en: "Royal Palace upgrade completed." },
  "royalPalace.needResources": { tr: "Eksik kaynak: {cost}", en: "Missing resources: {cost}" },
  "royalPalace.needResourcesShort": { tr: "Yeterli kaynak yok.", en: "Not enough resources." },
  "royalPalace.clanRequirement": { tr: "Klan Salonu Sv. {level}", en: "Clan Hall Lv. {level}" },
  "royalPalace.unlocksClass": { tr: "Yeni sınıf: {class} · Yeni saray alanı", en: "New class: {class} · New palace area" },
  "royalPalace.unlocksCharacters": { tr: "Açılacak karakterler: {names}", en: "Unlocks characters: {names}" },
  "royalPalace.level.unbuilt": { tr: "İnşa Edilmedi", en: "Not Built" },
  "royalPalace.level.1": { tr: "Kraliyet Bahçesi", en: "Royal Garden" },
  "royalPalace.level.2": { tr: "Kraliyet Avlusu", en: "Royal Courtyard" },
  "royalPalace.level.3": { tr: "Altın Taht Sarayı", en: "Golden Throne Palace" },
  "royalPalace.level.4": { tr: "Avcı Terası", en: "Hunter Terrace" },
  "royalPalace.level.5": { tr: "Şefler Divanı", en: "Chiefs' Court" },
  "royalPalace.level.6": { tr: "Altın Taht Sarayı", en: "Golden Throne Palace" },
  "royalPalace.class.worker": { tr: "Worker", en: "Worker" },
  "royalPalace.class.scout": { tr: "Scout", en: "Scout" },
  "royalPalace.class.warrior": { tr: "Warrior", en: "Warrior" },
  "royalPalace.class.hunter": { tr: "Hunter", en: "Hunter" },
  "royalPalace.class.chief": { tr: "Chief", en: "Chief" },
  "royalPalace.class.king": { tr: "King", en: "King" },
  "royalPalace.area.palaceGarden": { tr: "Saray Bahçesi", en: "Palace Garden" },
  "royalPalace.area.scoutPath": { tr: "Scout Yolu", en: "Scout Path" },
  "royalPalace.area.guardGate": { tr: "Muhafız Kapısı", en: "Guard Gate" },
  "royalPalace.area.hunterTerrace": { tr: "Avcı Terası", en: "Hunter Terrace" },
  "royalPalace.area.royalCourt": { tr: "Kraliyet Divanı", en: "Royal Court" },
  "royalPalace.area.goldenThrone": { tr: "Altın Taht", en: "Golden Throne" },

  // Building effects
  "fx.capacity": { tr: "Kapasite", en: "Capacity" },
  "fx.fighterTraining": { tr: "Savaşçı eğitimi", en: "Fighter training" },
  "fx.defense": { tr: "Savunma", en: "Defense" },
  "fx.campDamageReduction": {
    tr: "Kamp hasar azaltımı {n}",
    en: "Camp damage reduction {n}"
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
  "fb.resourcesCapped": {
    tr: "Depoya alınan: {received} · Kapasite nedeniyle alınamayan: {lost}",
    en: "Received: {received} · Not received due to capacity: {lost}"
  },
  "fx.muz": { tr: "muz", en: "bananas" },
  "fx.odun": { tr: "odun", en: "wood" },
  "fx.tas": { tr: "taş", en: "stone" },

  // Tutorial
  "tut.0": {
    tr: "Bir binaya veya alttaki kısayol simgesine dokunarak yönetim panelini aç. Klan Salonu köyünün merkezidir.",
    en: "Tap a building or a shortcut below to open its controls. The Clan Hall is the heart of your village."
  },
  "tut.1": {
    tr: "İşçi Locası'nda Muz, Odun veya Taş işçisi üret. İşçiyi ilgili kaynak binasından sefere gönder; dönüşte ödülü topla.",
    en: "Produce Banana, Wood, or Stone workers at the Worker Lodge. Send them from the matching resource building and collect their return."
  },
  "tut.2": {
    tr: "Topladığın kaynaklarla binaları geliştir. Klan Salonu seviyesi yeni binaların ve seçeneklerin ana kilididir.",
    en: "Use collected resources to upgrade buildings. Clan Hall level is the main requirement for new buildings and options."
  },
  "tut.3": {
    tr: "Eğitim Yuvası'nda birlik yetiştir. Klan Salonu'ndan Baskın Haritası'nı aç, düşman kampını yık ve ganimet kazan.",
    en: "Train units at the Training Nest. Open the Raid Map from the Clan Hall, destroy an enemy camp, and earn loot."
  },
  "tut.title.0": { tr: "Köyünü Tanı", en: "Know Your Village" },
  "tut.title.1": { tr: "İşçi ve Kaynak", en: "Workers and Resources" },
  "tut.title.2": { tr: "Kabileni Geliştir", en: "Grow Your Tribe" },
  "tut.title.3": { tr: "Ordu ve Baskın", en: "Army and Raids" },
  "tut.quickStart": { tr: "Köy Rehberi", en: "Village Guide" },
  "tut.skip": { tr: "Rehberi Geç", en: "Skip Guide" },
  "tut.next": { tr: "Devam", en: "Continue" },
  "tut.play": { tr: "Köye Başla", en: "Enter Village" },

  // Raid map
  "raidmap.title": { tr: "Baskın Hedefi", en: "Raid Target" },
  "raidmap.ready": { tr: "{n} savaşçı hazır", en: "{n} fighters ready" },
  "raidmap.attack": { tr: "Saldırı", en: "Attack" },
  "raidmap.needFighter": { tr: "Savaşçı gerek", en: "Need fighter" },
  "raidmap.close": { tr: "Köye Dön", en: "Back to Village" },
  "raidmap.recommendedPower": { tr: "Önerilen güç: {n}", en: "Recommended power: {n}" },
  "raidmap.armyPower": { tr: "Ordu Gücü: {n}", en: "Army Power: {n}" },
  "raidmap.enemyPower": { tr: "Düşman Gücü: {n}", en: "Enemy Power: {n}" },
  "raidmap.compositionFull": { tr: "Düşman: {fighters} savaşçı · {guardians} muhafız · {archers} okçu · {crossbows} arbaletçi", en: "Enemy: {fighters} fighters · {guardians} guardians · {archers} archers · {crossbows} crossbowmen" },
  "raidmap.unlockNest": { tr: "Eğitim Yuvası Sv. {level} gerekli", en: "Training Nest Lv. {level} required" },
  "raidmap.locked": { tr: "Kilitli", en: "Locked" },
  "raidmap.composition": { tr: "Düşman: {melee} yakın · {archers} okçu", en: "Enemy: {melee} melee · {archers} archers" },
  "raidmap.rewardsLocked": { tr: "Tahmini ödüller için Gözetleme Kulesi Sv. 4", en: "Watch Tower Lv. 4 reveals estimated rewards" },
  "common.levelShort": { tr: "Sv", en: "Lv" },
  "trainingNest.units": { tr: "Birim Eğitimi", en: "Unit Training" },
  "trainingNest.title": { tr: "Eğitim Yuvası", en: "Training Nest" },
  "trainingNest.armyCapacity": { tr: "Ordu {used}/{max}", en: "Army {used}/{max}" },
  "trainingNest.armyPower": { tr: "Ordu Gücü {n}", en: "Army Power {n}" },
  "trainingNest.armyPowerLabel": { tr: "Ordu Gücü", en: "Army Power" },
  "trainingNest.nextCapacity": { tr: "Sonraki kapasite: {n}", en: "Next capacity: {n}" },
  "trainingNest.role.fighter": { tr: "Hızlı ve dengeli yakın dövüşçü", en: "Fast, balanced melee damage" },
  "trainingNest.role.shield_guardian": { tr: "Ağır ön saf tankı", en: "Heavy frontline tank" },
  "trainingNest.role.archer": { tr: "Hızlı ve kırılgan menzilli saldırı", en: "Fast, fragile ranged damage" },
  "trainingNest.role.crossbowman": { tr: "Zırha karşı ağır menzilli hasar", en: "Heavy ranged anti-armor damage" },
  "trainingNest.cardMeta": { tr: "{housing} yer · {seconds} sn · Güç {power}", en: "{housing} space · {seconds}s · Power {power}" },
  "trainingNest.owned": { tr: "Orduda: {n}", en: "In army: {n}" },
  "trainingNest.unlockLevel": { tr: "Eğitim Yuvası Sv. {level} gerekli", en: "Training Nest Lv. {level} required" },
  "trainingNest.lockedFeedback": { tr: "Bu birlik için Eğitim Yuvası Sv. {level} gerekli", en: "Training Nest Lv. {level} is required for this troop" },
  "trainingNest.train": { tr: "Eğit", en: "Train" },
  "trainingNest.full": { tr: "Ordu Dolu", en: "Army Full" },
  "trainingNest.currentArmy": { tr: "Mevcut Ordu", en: "Current Army" },
  "trainingNest.upgrades": { tr: "Birlik Geliştirmeleri", en: "Troop Upgrades" },
  "trainingNest.stat.health": { tr: "Can", en: "Health" },
  "trainingNest.stat.attack": { tr: "Saldırı", en: "Attack" },
  "trainingNest.stat.resistance": { tr: "Hasar Direnci", en: "Damage Resistance" },
  "trainingNest.stat.attackSpeed": { tr: "Saldırı Hızı", en: "Attack Speed" },
  "trainingNest.stat.armorPenetration": { tr: "Zırh Delme", en: "Armor Penetration" },
  "trainingNest.max": { tr: "Maks.", en: "Max" },
  "trainingNest.upgradeMax": { tr: "Bu geliştirme en yüksek seviyede", en: "This upgrade is at maximum level" },
  "trainingNest.upgradeLocked": { tr: "Bu geliştirme için Eğitim Yuvası Sv. {level} gerekli", en: "Training Nest Lv. {level} is required for this upgrade" },
  "trainingNest.upgradeComplete": { tr: "{name} geliştirmesi Sv. {level} oldu", en: "{name} upgrade reached Lv. {level}" },
  "trainingNest.queueEmpty": { tr: "Eğitim kuyruğu boş; tüm tamamlanan birimler orduya katıldı.", en: "Training queue empty; all completed units have joined the army." },
  "watchTower.scoutingTitle": { tr: "Savunma ve Keşif Kilitleri", en: "Defense & Scouting Unlocks" },
  "watchTower.unlock.damage": { tr: "Kamp hasarı azaltma", en: "Camp damage reduction" },
  "watchTower.unlock.rewards": { tr: "Tahmini baskın ödüllerini göster", en: "Show estimated raid rewards" },
  "watchTower.unlock.composition": { tr: "Düşman birim dağılımını göster", en: "Show enemy unit composition" },
  "clanHall.raidHeadquarters": { tr: "Baskın Karargâhı", en: "Raid Headquarters" },
  "clanHall.storageSummary": { tr: "Depo {current} → {next}", en: "Storage {current} → {next}" },
  "clanHall.unlockedCamps": { tr: "Açık Kamp", en: "Camps" },
  "clanHall.victories": { tr: "Zafer", en: "Victories" },
  "clanHall.stronghold": { tr: "Kale Sv.", en: "Stronghold" },
  "clanHall.repeatRewards": { tr: "Tekrar ödülleri: ilk %100 · ikinci %60 · üçüncü %35 · sonrası %20", en: "Repeat rewards: first 100% · second 60% · third 35% · later 20%" },

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
  "raid.risk.veryEasy": { tr: "Çok Kolay", en: "Very Easy" },
  "raid.risk.favorable": { tr: "Avantajlı", en: "Favorable" },
  "raid.risk.balanced": { tr: "Dengeli", en: "Balanced" },
  "raid.risk.risky": { tr: "Riskli", en: "Risky" },
  "raid.risk.veryRisky": { tr: "Çok Riskli", en: "Very Risky" },
  "raid.confirm.warning": { tr: "Güçsüz bir orduyla da saldırabilirsin; kaybedilen askerler kalıcıdır.", en: "You may attack while underpowered; defeated troops are lost permanently." },
  "raid.confirm.eyebrow": { tr: "BASKIN HAZIRLIĞI", en: "RAID PREPARATION" },
  "raid.confirm.armyCount": { tr: "Ordu / Alan", en: "Army / Space" },
  "raid.confirm.enemyPower": { tr: "Düşman Gücü", en: "Enemy Power" },
  "raid.confirm.recommended": { tr: "Önerilen", en: "Recommended" },
  "raid.confirm.chooseArmy": { tr: "Gönderilecek Ordu", en: "Raid Party" },
  "raid.confirm.capacity": { tr: "Kapasite {used}/{max}", en: "Capacity {used}/{max}" },
  "raid.confirm.available": { tr: "Mevcut {n}", en: "Available {n}" },
  "raid.confirm.space": { tr: "alan", en: "space" },
  "raid.confirm.remove": { tr: "{unit} azalt", en: "Remove {unit}" },
  "raid.confirm.add": { tr: "{unit} ekle", en: "Add {unit}" },
  "raid.confirm.bestArmy": { tr: "En İyi Orduyu Seç", en: "Select Best Army" },
  "raid.confirm.clear": { tr: "Seçimi Temizle", en: "Clear Selection" },
  "raid.confirm.warningShort": { tr: "Kaybedilen askerler kalıcıdır.", en: "Lost troops are permanent." },
  "raid.confirm.invalidSelection": { tr: "Geçerli bir baskın ordusu seç.", en: "Choose a valid raid party." },
  "raid.confirm.estimatedLoss": { tr: "Tahmini kayıp: yaklaşık {min}–{max}", en: "Estimated losses: about {min}–{max}" },
  "raid.riskBand.safe": { tr: "Güvenli", en: "Safe" },
  "raid.riskBand.balanced": { tr: "Dengeli", en: "Balanced" },
  "raid.riskBand.risky": { tr: "Riskli", en: "Risky" },
  "raid.riskBand.veryRisky": { tr: "Çok Riskli", en: "Very Risky" },
  "raid.confirm.continue": { tr: "Devam", en: "Continue" },
  "raid.confirm.cancel": { tr: "İptal", en: "Cancel" },
  "raid.result.survivors": { tr: "Dönen askerler: {n}", en: "Survivors: {n}" },
  "raid.result.losses": { tr: "Kayıplar: {n}", en: "Losses: {n}" },
  "raid.hud.troops": { tr: "Asker", en: "Troops" },
  "raid.hud.hp": { tr: "Ordu Canı", en: "Army HP" },
  "raid.hud.camp": { tr: "Kamp Canı", en: "Camp HP" },
  "raid.firstVictoryBadge": { tr: "İlk Zafer Bonusu", en: "First Victory Bonus" },
  "raid.gemReason.firstVictory": { tr: "İlk zafer: {stars} yıldız = {gems} Gem", en: "First victory: {stars} stars = {gems} Gems" },
  "raid.gemReason.firstRepeat": { tr: "İlk tekrar zaferi bonusu: 1 Gem", en: "First repeat victory bonus: 1 Gem" },
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
  "fb.capacityFull": {
    tr: "Eğitim Yuvası'nı geliştir, ordu kapasitesi dolu",
    en: "Upgrade the Training Nest, army capacity is full"
  },
  "fb.needCost": { tr: "{name} için {cost} gerek", en: "{name} needs {cost}" },
  "fb.trained.worker": { tr: "İşçi kabileye katıldı", en: "Worker joined the tribe" },
  "fb.trained.fighter": { tr: "Savaşçı eğitildi", en: "Fighter trained" },
  "fb.trained.archer": { tr: "Okçu eğitildi", en: "Archer trained" },
  "fb.trained.shield_guardian": { tr: "Kalkan Muhafızı eğitildi", en: "Shield Guardian trained" },
  "fb.trained.crossbowman": { tr: "Arbaletçi eğitildi", en: "Crossbowman trained" },
  "fb.queued.worker": { tr: "İşçi kuyruğa alındı", en: "Worker queued" },
  "fb.queued.fighter": { tr: "Savaşçı kuyruğa alındı", en: "Fighter queued" },
  "fb.queued.archer": { tr: "Okçu kuyruğa alındı", en: "Archer queued" },
  "fb.queued.shield_guardian": { tr: "Kalkan Muhafızı kuyruğa alındı", en: "Shield Guardian queued" },
  "fb.queued.crossbowman": { tr: "Arbaletçi kuyruğa alındı", en: "Crossbowman queued" },
  "fb.queueFull": { tr: "Üretim kuyruğu dolu", en: "Production queue is full" },
  "fb.needGems": { tr: "Yeterli Gem yok", en: "Not enough Gems" },
  "fb.rushed": { tr: "Üretim hızlandırıldı", en: "Production rushed" },
  "fb.questClaimed": { tr: "Görev ödülü alındı!", en: "Quest reward claimed!" },
  "offline.title": { tr: "Tekrar hoş geldin, şef!", en: "Welcome back, chief!" },
  "offline.subtitle": { tr: "Sen yokken kabile çalışmaya devam etti", en: "The tribe kept working while you were away" },
  "offline.away": { tr: "{time} uzaktaydın", en: "You were away for {time}" },
  "offline.collect": { tr: "Topla", en: "Collect" },
  "daily.title": { tr: "Günlük Ödül", en: "Daily Reward" },
  "daily.subtitleScout": { tr: "{amount} Gem topla ve 7. günde Genç İzci'yi aç!", en: "Earn {amount} Gems and unlock Young Scout on Day 7!" },
  "daily.subtitleRepeat": { tr: "7 günlük seride toplam {amount} Gem kazan!", en: "Earn {amount} Gems across the 7-day streak!" },
  "daily.day": { tr: "{n}. Gün", en: "Day {n}" },
  "daily.claim": { tr: "Ödülü Al", en: "Claim Reward" },
  "daily.comeback": { tr: "Yarın tekrar gel!", en: "Come back tomorrow!" },
  "daily.claimed": { tr: "+{amount} Gem alındı!", en: "+{amount} Gems claimed!" },
  "daily.scout": { tr: "Genç İzci", en: "Young Scout" },
  "daily.scoutUnlocked": { tr: "Genç İzci kalıcı olarak açıldı!", en: "Young Scout permanently unlocked!" },
  "daily.done": { tr: "Alındı", en: "Done" },
  "shop.title": { tr: "Kaynak Mağazası", en: "Resource Shop" },
  "shop.subtitle": { tr: "Baskın ve görev Gemlerini kaynağa çevir", en: "Turn raid & quest Gems into resources" },
  "gemStore.title": { tr: "Gem Mağazası", en: "Gem Store" },
  "gemStore.subtitle": { tr: "Festival hazineni Gem paketleriyle güçlendir", en: "Stock up on Gems for the festival" },
  "gemStore.balance": { tr: "Bakiye", en: "Balance" },
  "gemStore.bonus": { tr: "+%{percent} Bonus", en: "+{percent}% Bonus" },
  "gemStore.bestValue": { tr: "En İyi Değer", en: "Best Value" },
  "gemStore.gemsLabel": { tr: "Gem", en: "Gems" },
  "gemStore.comingSoon": { tr: "Yakında", en: "Coming Soon" },
  "gemStore.unavailableNote": { tr: "Satın alma sistemi hazırlanıyor", en: "Purchases coming soon" },
  "gemStore.loadingPrice": { tr: "Fiyat yükleniyor", en: "Loading price" },
  "gemStore.unavailable": { tr: "Kullanılamıyor", en: "Unavailable" },
  "gemStore.processing": { tr: "İşleniyor", en: "Processing" },
  "gemStore.purchaseSuccess": {
    tr: "Satın alma tamamlandı. {amount} Gem eklendi.",
    en: "Purchase complete. {amount} Gems added."
  },
  "gemStore.purchaseCancelled": {
    tr: "Satın alma iptal edildi. Gem eklenmedi.",
    en: "Purchase cancelled. No Gems were added."
  },
  "gemStore.purchasePending": {
    tr: "Satın alma beklemede. Apple işlemi tamamlayana kadar Gem eklenmeyecek.",
    en: "Purchase pending. Gems will not be added until Apple completes it."
  },
  "gemStore.purchaseError": {
    tr: "App Store'a ulaşılamadı veya ürün kullanılamıyor. Lütfen daha sonra tekrar dene.",
    en: "The App Store could not be reached or this product is unavailable. Please try again later."
  },
  "gemStore.deliveryPending": {
    tr: "Satın alma durumu kontrol ediliyor. Ödeme tamamlandıysa Gemler uygulama yeniden açıldığında güvenle teslim edilecek.",
    en: "Purchase delivery is being checked. If payment completed, Gems will be delivered safely when the app reopens."
  },
  "gemStore.priceNote": {
    tr: "Fiyatlar mağaza tarafından yerelleştirilir; ödeme ekranında gösterilir.",
    en: "Prices are localized by the store and shown at checkout."
  },
  "gemStore.open": { tr: "Gem Mağazasına Git", en: "Open Gem Store" },
  "gemStore.buy": { tr: "Gem Satın Al", en: "Buy Gems" },
  "gemStore.purchase": { tr: "Satın Al", en: "Buy" },
  "gemStore.referencePrice": { tr: "Referans fiyat", en: "Reference price" },
  "gemStore.comingSoonMessage": {
    tr: "Satın alma sistemi çok yakında aktif olacak.",
    en: "In-app purchases are coming soon."
  },
  "gemStore.usageTitle": {
    tr: "Gemler aşağıdaki alanlarda kullanılabilir:",
    en: "Gems can be used for:"
  },
  "gemStore.usage.festivalChest": { tr: "Festival Sandığı", en: "Festival Chest" },
  "gemStore.usage.monkeyCollection": { tr: "Maymun Koleksiyonu", en: "Monkey Collection" },
  "gemStore.usage.resourceShop": { tr: "Kaynak Mağazası", en: "Resource Shop" },
  "gemStore.resourceShop": { tr: "Kaynak Mağazası", en: "Resource Shop" },
  "gemStore.pack.gem_pouch": { tr: "Gem Kesesi", en: "Gem Pouch" },
  "gemStore.pack.gem_bundle": { tr: "Gem Destesi", en: "Gem Bundle" },
  "gemStore.pack.gem_crate": { tr: "Gem Sandığı", en: "Gem Crate" },
  "gemStore.pack.gem_vault": { tr: "Gem Kasası", en: "Gem Vault" },
  "gemStore.pack.gem_treasury": { tr: "Gem Hazinesi", en: "Gem Treasury" },
  "gemStore.pack.gem_hoard": { tr: "Gem Yığını", en: "Gem Hoard" },
  "shopHub.title": { tr: "Mağaza", en: "Shop" },
  "shopHub.subtitle": { tr: "Gem, sandık, maymun ve kaynak paketleri", en: "Gems, chests, monkeys and resource packs" },
  "shopHub.gemStoreDesc": { tr: "Gem paketleri satın al", en: "Buy Gem packs" },
  "shopHub.festivalDesc": { tr: "Festival skin parçaları kazan", en: "Win Festival skin fragments" },
  "shopHub.monkeysDesc": { tr: "Yeni profil maymunları aç", en: "Unlock new profile monkeys" },
  "shopHub.resourceDesc": { tr: "Gemleri kaynağa çevir", en: "Turn Gems into resources" },
  "shop.buy": { tr: "Al", en: "Buy" },
  "shop.bought": { tr: "Satın alındı!", en: "Purchased!" },
  "shop.storageShort": { tr: "Depoda yer yok", en: "Not enough storage" },
  "shop.storageNeed": {
    tr: "{resource}: {free} boş · {required} gerekli",
    en: "{resource}: {free} free · {required} required"
  },
  "shop.storageInsufficient": {
    tr: "{resource} deposunda {free} boş alan var; {required} gerekli. Gem harcanmadı.",
    en: "{resource} storage has {free} free; {required} required. No Gems were spent."
  },
  "shop.storageStatus": {
    tr: "{resource} {current}/{capacity}",
    en: "{resource} {current}/{capacity}"
  },
  "shop.insufficientGems": { tr: "Yetersiz Gem", en: "Not enough Gems" },
  "shop.insufficientMessage": {
    tr: "Bu paket için daha fazla Gem gerekiyor. Gem Mağazasını açmak ister misin?",
    en: "You need more Gems for this pack. Open the Gem Store?"
  },
  "shop.bananaPack": { tr: "Muz Paketi", en: "Banana Pack" },
  "shop.stonePack": { tr: "Taş Paketi", en: "Stone Pack" },
  "shop.woodPack": { tr: "Odun Paketi", en: "Wood Pack" },
  "shop.bountyChest": { tr: "Bereket Sandığı", en: "Bounty Chest" },
  "collection.title": { tr: "Maymun Koleksiyonu", en: "Monkey Collection" },
  "collection.subtitle": {
    tr: "Kabile portrelerini, sahipliği ve fragment ilerlemesini incele.",
    en: "Browse tribe portraits, ownership and fragment progress."
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
  "collection.gems": { tr: "Gem", en: "Gems" },
  "collection.tab.monkeys": { tr: "Maymunlar", en: "Monkeys" },
  "collection.tab.skins": { tr: "Skinler", en: "Skins" },
  "collection.tab.festival": { tr: "Festival", en: "Festival" },
  "collection.detail.inShop": { tr: "Mağazadan satın alınabilir", en: "Available in the Shop" },
  "collection.detail.manageInPalace": { tr: "Kraliyet Sarayı'nda yönet", en: "Manage in the Royal Palace" },
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
  "collection.detail.missing": { tr: "{amount} Gem eksik", en: "{amount} Gems short" },
  "collection.requiresNamedMonkey": { tr: "{name} gerekli", en: "Requires {name}" },
  "collection.day7Scout": { tr: "7. günde ücretsiz", en: "Free on Day 7" },
  "collection.badge.festival": { tr: "Festival", en: "Festival" },
  "festival.collection.title": { tr: "Festival Koleksiyonu", en: "Festival Collection" },
  "festival.chest.name": { tr: "Festival Sandığı", en: "Festival Chest" },
  "festival.chest.launchEvent": { tr: "Çıkış Etkinliği", en: "Launch Event" },
  "festival.chest.discount": { tr: "%50 İNDİRİM", en: "50% OFF" },
  "festival.chest.open": { tr: "50 Gem ile Aç", en: "Open for 50 Gems" },
  "festival.chest.pending": { tr: "Ödülü Gör", en: "View Reward" },
  "festival.chest.completed": { tr: "Festival Koleksiyonu Tamamlandı", en: "Festival Collection Completed" },
  "festival.chest.details": { tr: "Olasılıklar", en: "Odds" },
  "festival.chest.fragments": { tr: "Parça", en: "Fragments" },
  "festival.chest.eligible": { tr: "Uygun ödüller: {count}", en: "Eligible rewards: {count}" },
  "festival.chest.poolRule": { tr: "Tamamlanan skinler ödül havuzundan çıkarılır.", en: "Completed skins are removed from the reward pool." },
  "festival.progress": { tr: "{current} / {required} Parça", en: "{current} / {required} Fragments" },
  "festival.reward.fragments": { tr: "+{amount} Parça • {current}/{required}", en: "+{amount} Fragments • {current}/{required}" },
  "festival.reward.unlocked": { tr: "+{amount} Parça • Skin açıldı!", en: "+{amount} Fragments • Skin unlocked!" },
  "festival.reward.newSkin": { tr: "Yeni Skin Açıldı", en: "New Skin Unlocked" },
  "festival.reward.claim": { tr: "Ödülü Al", en: "Claim" },
  "collection.unlocked": { tr: "Açıldı!", en: "Unlocked!" },
  "collection.profileLabel": {
    tr: "Maymun Koleksiyonunu Aç",
    en: "Open Monkey Collection"
  },
  "collection.locked": { tr: "Kilitli", en: "Locked" },
  "collection.unavailable": { tr: "Kullanılamıyor", en: "Unavailable" },
  "collection.owned": { tr: "Sahip Olundu", en: "Owned" },
  "collection.equipped": { tr: "Kuşanıldı", en: "Equipped" },
  "collection.equip": { tr: "Kuşan", en: "Equip" },
  "collection.cancel": { tr: "İptal", en: "Cancel" },
  "collection.unlock": { tr: "Satın Al", en: "Buy" },
  "collection.unlockPrompt": {
    tr: "Bu maymunu {price} Gem karşılığında kalıcı olarak aç?",
    en: "Permanently unlock this monkey for {price} Gems?"
  },
  "collection.notEnoughGems": {
    tr: "Yeterli Gem yok.",
    en: "Not enough Gems."
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
  "collection.skin.festivalWorker.name": {
    tr: "Festival İşçisi",
    en: "Festival Worker"
  },
  "collection.skin.festivalWorker.description": {
    tr: "Çiçekler, yüz boyaları ve süslü muz sepetiyle kabile festivalinin neşesini taşır.",
    en: "Carries the tribe festival's joy with flowers, face paint, and a decorated banana basket."
  },
  "collection.skin.sunParadeWorker.name": {
    tr: "Güneş Geçidi İşçisi",
    en: "Sun Parade Worker"
  },
  "collection.skin.sunParadeWorker.description": {
    tr: "Güneş maskesi, festival fenerleri ve çember muz taşıyıcısıyla geçide öncülük eder.",
    en: "Leads the parade with a sun mask, festival lanterns, and a circular banana carrier."
  },
  "collection.skin.watermelonFeastWorker.name": {
    tr: "Karpuz Şöleni İşçisi",
    en: "Watermelon Feast Worker"
  },
  "collection.skin.watermelonFeastWorker.description": {
    tr: "Karpuz kabuğunu iş sepetine çevirmiş; ödül gelmeden ziyafete başlamış bile.",
    en: "Turned a watermelon rind into a work basket—and started the feast before the reward arrived."
  },
  "collection.skin.bananaDj.name": { tr: "Muz DJ", en: "Banana DJ" },
  "collection.skin.bananaDj.description": {
    tr: "Muz kasalarından kurduğu pikapla ormanın ritmini yükseltir.",
    en: "Turns banana crates into turntables and raises the jungle beat."
  },
  "collection.skin.fireDancer.name": { tr: "Ateş Dansçısı", en: "Fire Dancer" },
  "collection.skin.fireDancer.description": {
    tr: "Parlayan meşalelerle festival gecesine kıvılcımlar saçar.",
    en: "Spins glowing torches and sends sparks across the festival night."
  },
  "collection.skin.beachWarrior.name": { tr: "Sahil Savaşçısı", en: "Beach Warrior" },
  "collection.skin.beachWarrior.description": {
    tr: "Hindistan cevizi zırhı ve sörf kalkanıyla kıyıyı korur.",
    en: "Guards the shore in coconut armor with a surfboard shield."
  },
  "collection.skin.tropicalArcher.name": { tr: "Tropik Okçu", en: "Tropical Archer" },
  "collection.skin.tropicalArcher.description": {
    tr: "Renkli tüyleri ve sarmaşık yayıyla festival hedeflerini vurur.",
    en: "Hits festival targets with bright feathers and a vine-wrapped bow."
  },
  "collection.skin.sunsetChief.name": { tr: "Gün Batımı Şefi", en: "Sunset Chief" },
  "collection.skin.sunsetChief.description": {
    tr: "Gün batımı renklerindeki tören tacıyla geçide önderlik eder.",
    en: "Leads the parade beneath a ceremonial crown painted in sunset colors."
  },
  "collection.skin.fireMonkey.name": { tr: "Ateş Maymunu", en: "Fire Monkey" },
  "collection.skin.fireMonkey.description": {
    tr: "Köz desenleri ve alevli festival maskesiyle gecenin yıldızıdır.",
    en: "Steals the night with ember markings and a blazing festival mask."
  },
  "collection.skin.goldenFestivalKing.name": { tr: "Altın Festival Kralı", en: "Golden Festival King" },
  "collection.skin.goldenFestivalKing.description": {
    tr: "Altın ışıklarla süzülen, festival koleksiyonunun mitik hükümdarı.",
    en: "The Mythic ruler of the Festival Collection, floating in golden light."
  },
  "collection.skin.goldenEmperor.name": {
    tr: "Altın İmparator",
    en: "Golden Emperor"
  },
  "collection.skin.goldenEmperor.description": {
    tr: "Işıldayan altın kürkü, imparatorluk tacı ve kadim kabile zırhıyla Altın Şef'in nihai ihtişamı.",
    en: "Golden Chief's ultimate splendor, with luminous golden fur, an imperial crown, and ancient tribal armor."
  },
  "collection.skin.celestialMonkeyKing.name": {
    tr: "Göksel Maymun Kral",
    en: "Celestial Monkey King"
  },
  "collection.skin.celestialMonkeyKing.description": {
    tr: "Havada süzülen kraliyet tahtı, dev pelerini ve ışık saçan asasıyla kabilenin en prestijli hükümdarı.",
    en: "The tribe's most prestigious ruler, enthroned above the ground with a grand cape and radiant staff."
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
  "quests.title": { tr: "Günlük Görevler", en: "Daily Missions" },
  "quests.claim": { tr: "Al", en: "Claim" },
  "quests.inProgress": { tr: "Devam Ediyor", en: "In Progress" },
  "quests.done": { tr: "Alındı", en: "Done" },
  "quests.empty": { tr: "Şimdilik hepsi bu kadar, şef!", en: "That's all for now, chief!" },
  "quest.dailyTrain3": { tr: "3 birlik veya işçi üret", en: "Train 3 troops or workers" },
  "quest.dailyWork2": { tr: "2 kaynak seferi başlat", en: "Start 2 resource expeditions" },
  "quest.dailyRaid1": { tr: "1 baskın kazan", en: "Win 1 raid" },
  "quest.dailyTrain8": { tr: "Toplam 8 birlik veya işçi üret", en: "Train 8 troops or workers total" },
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
  "workerLodge.produceWithCost": { tr: "Üret · {amount} {resource}", en: "Produce · {amount} {resource}" },
  "workerLodge.producingCountdown": { tr: "Üretiliyor · {time}", en: "Producing · {time}" },
  "workerLodge.productionValue": { tr: "Üretim: {amount}", en: "Production: {amount}" },
  "workerLodge.unlockLevelRequired": { tr: "Loca Sv. {level} gerekli", en: "Lodge Lv. {level} required" },
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
  "workerLodge.requirementsMet": { tr: "Gereksinimler karşılandı", en: "Requirements met" },
  "workerLodge.resourceMissing": { tr: "{amount} {resource} eksik", en: "Missing {amount} {resource}" },
  "workerLodge.blockedButton": { tr: "Geliştirilemiyor", en: "Unavailable" },
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
  "worker.worker_lumber_apprentice.name": { tr: "Çırak Oduncu", en: "Apprentice Woodcutter" },
  "worker.worker_lumber_skilled.name": { tr: "Yetenekli Oduncu", en: "Skilled Lumberjack" },
  "worker.worker_lumber_master.name": { tr: "Usta Kereste İşçisi", en: "Master Timber Worker" },
  "worker.worker_stone_apprentice.name": { tr: "Taş Ocağı Çırağı", en: "Quarry Apprentice" },
  "worker.worker_stone_experienced.name": { tr: "Deneyimli Madenci", en: "Experienced Miner" },
  "worker.worker_stone_master.name": { tr: "Usta Taş Ocağı İşçisi", en: "Master Quarry Worker" },
  "workerLodge.lumberTitle": { tr: "Odun İşçileri", en: "Lumber Workers" },
  "workerLodge.lumberSubtitle": { tr: "Oduncu Kampı için tek kullanımlık uzmanlar üret.", en: "Produce single-use specialists for the Lumber Camp." },
  "workerLodge.stoneTitle": { tr: "Taş İşçileri", en: "Stone Workers" },
  "workerLodge.stoneSubtitle": { tr: "Taş Ocağı için tek kullanımlık uzmanlar üret.", en: "Produce single-use specialists for the Stone Quarry." },
  "workerLodge.baseYield": { tr: "Temel", en: "Base" },
  "workerLodge.unlockLevel": { tr: "Loca Sv. {level}", en: "Lodge Lv. {level}" },
  "lumberCamp.eyebrow": { tr: "ODUN ÜRETİMİ", en: "LUMBER PRODUCTION" },
  "lumberCamp.storage": { tr: "Kamp Deposu", en: "Camp Storage" },
  "lumberCamp.empty": { tr: "Boş", en: "Empty" },
  "lumberCamp.full": { tr: "Depo Dolu", en: "Storage Full" },
  "lumberCamp.ready": { tr: "Toplanmaya Hazır", en: "Ready to Collect" },
  "lumberCamp.levelBonus": { tr: "Oduncu Kampı Seviye Bonusu: +%{amount}", en: "Lumber Camp Level Bonus: +{amount}%" },
  "lumberCamp.activeMission": { tr: "Aktif Kereste Seferi", en: "Active Lumber Mission" },
  "lumberCamp.assignTitle": { tr: "Odun İşçisi Ata", en: "Assign Lumber Worker" },
  "lumberCamp.noWorkers": { tr: "Atanacak hazır Odun İşçisi yok.", en: "No Lumber Worker is ready to assign." },
  "lumberCamp.openLodge": { tr: "İşçi Locasına Git", en: "Open Worker Lodge" },
  "lumberCamp.chooseMission": { tr: "Görev Seç", en: "Choose Mission" },
  "lumberCamp.potential": { tr: "Olası ödül", en: "Potential reward" },
  "lumberCamp.assignThere": { tr: "Oduncu Kampı'ndan ata", en: "Assign at Lumber Camp" },
  "lumberCamp.collectThere": { tr: "Oduncu Kampı'ndan topla", en: "Collect at Lumber Camp" },
  "lumberCamp.storageFullFeedback": { tr: "Oduncu Kampı deposu dolu.", en: "Lumber Camp storage is full." },
  "lumberCamp.busyFeedback": { tr: "Oduncu Kampı zaten meşgul.", en: "The Lumber Camp is already busy." },
  "lumberCamp.invalidWorker": { tr: "Buraya yalnızca Odun İşçisi atanabilir.", en: "Only a Lumber Worker can be assigned here." },
  "lumberCamp.workerLocked": { tr: "İşçi Locası Sv. {level} gerekli.", en: "Worker Lodge Lv. {level} is required." },
  "lumberCamp.missionStarted": { tr: "Kereste seferi başladı.", en: "The lumber expedition has started." },
  "lumberCamp.harvestReady": { tr: "Kereste sevkiyatı toplanmaya hazır!", en: "The timber shipment is ready to collect!" },
  "lumberCamp.storageRemainder": { tr: "Ana depo dolu: kampta {amount} odun kaldı.", en: "Main storage is full: {amount} wood remains at camp." },
  "lumberMission.safe.name": { tr: "Güvenli Sefer", en: "Safe Run" },
  "lumberMission.safe.risk": { tr: "Çok düşük risk", en: "Very low risk" },
  "lumberMission.risky.name": { tr: "Riskli Sefer", en: "Risky Run" },
  "lumberMission.risky.risk": { tr: "Orta risk", en: "Medium risk" },
  "lumberMission.dangerous.name": { tr: "Tehlikeli Sefer", en: "Dangerous Run" },
  "lumberMission.dangerous.risk": { tr: "Yüksek risk", en: "High risk" },
  "lumberResult.success": { tr: "TAM BAŞARI", en: "FULL SUCCESS" },
  "lumberResult.partial": { tr: "KISMİ KAYIP", en: "PARTIAL LOSS" },
  "lumberResult.failed": { tr: "BAŞARISIZ", en: "FAILED" },
  "lumberResult.storage": { tr: "DEPO TOPLANDI", en: "STORAGE COLLECTED" },
  "lumberResult.success.body": { tr: "Kereste seferi tamamlandı.", en: "Lumber expedition completed." },
  "lumberResult.half.body": { tr: "Kereste sevkiyatının bir kısmı kayboldu.", en: "Part of the timber shipment was lost." },
  "lumberResult.empty.body": { tr: "Taşıma rotası kapandı.", en: "The transport route was blocked." },
  "lumberResult.storage.body": { tr: "Kampta kalan odun ana depoya taşındı.", en: "Stored wood was moved into the main depot." },
  "lumberResult.clamped": { tr: "Kamp alanına sığan ödül: {amount}.", en: "Reward fitted to camp storage: {amount}." },
  "stoneQuarry.eyebrow": { tr: "TAŞ ÜRETİMİ", en: "STONE PRODUCTION" },
  "stoneQuarry.storage": { tr: "Ocak Deposu", en: "Quarry Storage" },
  "stoneQuarry.empty": { tr: "Boş", en: "Empty" },
  "stoneQuarry.full": { tr: "Depo Dolu", en: "Storage Full" },
  "stoneQuarry.ready": { tr: "Toplanmaya Hazır", en: "Ready to Collect" },
  "stoneQuarry.levelBonus": { tr: "Taş Ocağı Seviye Bonusu: +%{amount}", en: "Stone Quarry Level Bonus: +{amount}%" },
  "stoneQuarry.activeMission": { tr: "Aktif Taş Seferi", en: "Active Stone Mission" },
  "stoneQuarry.assignTitle": { tr: "Taş İşçisi Ata", en: "Assign Stone Worker" },
  "stoneQuarry.noWorkers": { tr: "Atanacak hazır Taş İşçisi yok.", en: "No Stone Worker is ready to assign." },
  "stoneQuarry.openLodge": { tr: "İşçi Locasına Git", en: "Open Worker Lodge" },
  "stoneQuarry.chooseMission": { tr: "Görev Seç", en: "Choose Mission" },
  "stoneQuarry.potential": { tr: "Olası ödül", en: "Potential reward" },
  "stoneQuarry.assignThere": { tr: "Taş Ocağı'ndan ata", en: "Assign at Stone Quarry" },
  "stoneQuarry.collectThere": { tr: "Taş Ocağı'ndan topla", en: "Collect at Stone Quarry" },
  "stoneQuarry.storageFullFeedback": { tr: "Taş Ocağı deposu dolu.", en: "Stone Quarry storage is full." },
  "stoneQuarry.busyFeedback": { tr: "Taş Ocağı zaten meşgul.", en: "The Stone Quarry is already busy." },
  "stoneQuarry.invalidWorker": { tr: "Buraya yalnızca Taş İşçisi atanabilir.", en: "Only a Stone Worker can be assigned here." },
  "stoneQuarry.workerLocked": { tr: "İşçi Locası Sv. {level} gerekli.", en: "Worker Lodge Lv. {level} is required." },
  "stoneQuarry.missionStarted": { tr: "Taş seferi başladı.", en: "The stone expedition has started." },
  "stoneQuarry.harvestReady": { tr: "Taş sevkiyatı toplanmaya hazır!", en: "The stone shipment is ready to collect!" },
  "stoneQuarry.storageRemainder": { tr: "Ana depo dolu: ocakta {amount} taş kaldı.", en: "Main storage is full: {amount} stone remains at the quarry." },
  "stoneMission.safe.name": { tr: "Güvenli Sefer", en: "Safe Run" },
  "stoneMission.safe.risk": { tr: "%96 tam · %3 yarım · %1 boş", en: "96% full · 3% half · 1% empty" },
  "stoneMission.risky.name": { tr: "Riskli Sefer", en: "Risky Run" },
  "stoneMission.risky.risk": { tr: "%82 tam · %12 yarım · %6 boş", en: "82% full · 12% half · 6% empty" },
  "stoneMission.dangerous.name": { tr: "Tehlikeli Sefer", en: "Dangerous Run" },
  "stoneMission.dangerous.risk": { tr: "%62 tam · %23 yarım · %15 boş", en: "62% full · 23% half · 15% empty" },
  "stoneResult.success": { tr: "TAM BAŞARI", en: "FULL SUCCESS" },
  "stoneResult.partial": { tr: "KISMİ KAYIP", en: "PARTIAL LOSS" },
  "stoneResult.failed": { tr: "BAŞARISIZ", en: "FAILED" },
  "stoneResult.storage": { tr: "DEPO TOPLANDI", en: "STORAGE COLLECTED" },
  "stoneResult.success.body": { tr: "Taş seferi tamamlandı.", en: "Stone expedition completed." },
  "stoneResult.half.body": { tr: "Taş sevkiyatının bir kısmı kayboldu.", en: "Part of the stone shipment was lost." },
  "stoneResult.empty.body": { tr: "Kazı rotası kapandı.", en: "The quarry route was blocked." },
  "stoneResult.storage.body": { tr: "Ocakta kalan taş ana depoya taşındı.", en: "Stored stone was moved into the main depot." },
  "stoneResult.clamped": { tr: "Ocak deposuna sığan ödül: {amount}.", en: "Reward fitted to quarry storage: {amount}." },
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
  "worker.alreadyProducing": { tr: "{name} zaten üretiliyor.", en: "{name} is already in production." },
  "worker.productionStarted": { tr: "{name} üretime alındı", en: "{name} entered production" },
  "worker.productionReadyIn": { tr: "{seconds} saniye sonra hazır", en: "Ready in {seconds} seconds" },
  "worker.invalidSelection": { tr: "Geçerli bir işçi seçimi yap.", en: "Choose a valid worker selection." },
  "worker.workplaceCapacityFull": { tr: "Kaynak binası en fazla {n} işçi kabul ediyor.", en: "This workplace accepts at most {n} workers." },
  "worker.batchSent": { tr: "{n} işçi {resource} görevine gönderildi.", en: "{n} workers were sent on a {resource} mission." },
  "workerDispatch.tierAvailable": { tr: "Tier {tier} mevcut: {n}", en: "Tier {tier} available: {n}" },
  "workerDispatch.remaining": { tr: "Boşta kalacak: {n}", en: "Remaining idle: {n}" },
  "workerDispatch.total": { tr: "Gönderilecek", en: "Sending" },
  "workerDispatch.duration": { tr: "Görev süresi", en: "Duration" },
  "workerDispatch.expected": { tr: "Beklenen ödül", en: "Expected reward" },
  "workerDispatch.consumedWarning": { tr: "Gönderilen işçi sözleşmeleri görev sonunda sona erer.", en: "Dispatched worker contracts end when the mission finishes." },
  "workerDispatch.workerCount": { tr: "{n} İşçi", en: "{n} Workers" },
  "workerDispatch.send": { tr: "Göreve Gönder", en: "Send on Mission" },
  "workerHarvest.completedBody": { tr: "{resource} görevi tamamlandı ve ödül ana depoya taşındı.", en: "The {resource} mission is complete and its reward was moved to main storage." },
  "workerHarvest.oneContractEnded": { tr: "Tamamlanan işçi sözleşmesi sona erdi.", en: "The completed worker contract has ended." },
  "workerHarvest.contractsEnded": { tr: "{n} işçi sözleşmesi sona erdi.", en: "{n} worker contracts have ended." },
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
  "bananaGrove.assignTitle": { tr: "Muz İşçisi Ata", en: "Assign Banana Workers" },
  "bananaGrove.noIdleWorkers": { tr: "Gönderilmeye hazır Muz İşçisi yok.", en: "No Banana Workers are ready to send." },
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
  "raid.lootReceived": { tr: "Depoya alınan", en: "Received" },
  "raid.lootNotReceived": {
    tr: "Kapasite nedeniyle alınamayan",
    en: "Not received due to capacity"
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
