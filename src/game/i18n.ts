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
  "upgrade.next": { tr: "Sonraki", en: "Next" },
  "upgrade.needClanHall": { tr: "Klan Salonu gerek", en: "Need Clan Hall" },
  "common.level": { tr: "Seviye", en: "Level" },

  // Settings
  "settings.title": { tr: "Ayarlar", en: "Settings" },
  "settings.language": { tr: "Dil", en: "Language" },
  "settings.sound": { tr: "Ses Efektleri", en: "Sound Effects" },
  "settings.soundOn": { tr: "Açık", en: "On" },
  "settings.soundOff": { tr: "Kapalı", en: "Off" },
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
    tr: "İşçi Barınağı'na dokunup işçileri işe gönderirsen üretim hızlanır.",
    en: "Tap the Worker Shelter and send workers to work to boost production."
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
  "b.workerShelter": { tr: "İşçi Barınağı", en: "Worker Shelter" },
  "b.trainingNest": { tr: "Eğitim Yuvası", en: "Training Nest" },
  "b.watchTower": { tr: "Gözetleme Kulesi", en: "Watch Tower" },

  // Building effects
  "fx.capacity": { tr: "Kapasite", en: "Capacity" },
  "fx.fighterTraining": { tr: "Savaşçı eğitimi", en: "Fighter training" },
  "fx.defense": { tr: "Savunma", en: "Defense" },
  "fx.villageLevel": { tr: "Köy seviyesi", en: "Village level" },
  "fx.perSec": { tr: "/sn", en: "/s" },
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
    tr: "İşçi ve savaşçı üret; Eğitim Yuvası savaşçıları açar.",
    en: "Make workers and fighters; the Training Nest unlocks fighters."
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
  "camp.stronghold": { tr: "Korsan Kalesi", en: "Pirate Stronghold" },
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
  "raid.victoryText": {
    tr: "Düşman kampı yıkıldı. Ganimet köyüne eklendi.",
    en: "The enemy camp is broken. Spoils were added to your stores."
  },
  "raid.defeatText": {
    tr: "Baskın ekibin düştü. Daha çok savaşçı yetiştir ve tekrar dene.",
    en: "Your raid party fell. Train more fighters and try again."
  },
  "raid.loot": { tr: "Kazanılan Ganimet", en: "Won Loot" },
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
  "fb.workersSent": {
    tr: "İşçiler işe koyuldu! Üretim +%{n}",
    en: "Workers set off! Production +{n}%"
  },
  "fb.workersReturned": { tr: "İşçiler işten döndü", en: "The workers are back home" },
  "fb.noWorkers": { tr: "Çalışacak işçi yok", en: "No workers to send" },
  "shelter.send": { tr: "İşçileri İşe Gönder", en: "Send Workers to Work" },
  "shelter.working": { tr: "İşçiler çalışıyor · {time}", en: "Workers on the job · {time}" },
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
