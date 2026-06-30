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

  // Clan / HUD
  "clan.subtitle": { tr: "Genç Klan", en: "Young Clan" },
  "res.bananas": { tr: "Muz", en: "Bananas" },
  "res.stones": { tr: "Taş", en: "Stone" },
  "res.wood": { tr: "Odun", en: "Wood" },
  "res.population": { tr: "Nüfus", en: "Pop" },

  // Units / dock
  "unit.worker": { tr: "İşçi", en: "Worker" },
  "unit.fighter": { tr: "Savaşçı", en: "Fighter" },
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
  "settings.reset": { tr: "Köyü Sıfırla", en: "Reset Village" },
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
  "raidmap.loot": { tr: "Mevcut Ganimet", en: "Available Loot" },
  "raidmap.attack": { tr: "SALDIRI", en: "ATTACK" },
  "raidmap.needFighter": { tr: "Önce savaşçı eğit", en: "Train a fighter first" },
  "raidmap.close": { tr: "Köye Dön", en: "Back to Village" },
  "raidmap.fighters": { tr: "Savaşçı", en: "Fighters" },

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
  "result.menu": { tr: "Ana Menü", en: "Main Menu" }
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
