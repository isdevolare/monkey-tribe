import type { Lang } from "./locales";
import generatedTranslations from "./generatedReleaseTranslations.json";

type ReleaseTranslationTuple = readonly [
  es: string,
  ptBR: string,
  de: string,
  fr: string,
  ja: string,
  ko: string
];

const RELEASE_TRANSLATION_LOCALES = ["es", "pt-BR", "de", "fr", "ja", "ko"] as const;

/*
 * Curated v1.0 terminology. Values are kept next to each other so reviewers can
 * compare the same UI phrase across every release locale without chasing files.
 */
const translations: Record<string, ReleaseTranslationTuple> = {
  "menu.tagline": ["Crea tu reino de monos", "Construa seu Reino dos Macacos", "Baue dein Affenkönigreich", "Bâtissez votre royaume des singes", "モンキー王国を築こう", "원숭이 왕국을 건설하세요"],
  "menu.subtitle": ["Mejora tu aldea, forma tu ejército y domina la jungla.", "Evolua sua vila, forme seu exército e domine a selva.", "Baue dein Dorf aus, stelle eine Armee auf und beherrsche den Dschungel.", "Développez votre village, levez une armée et régnez sur la jungle.", "村を発展させ、軍を率いてジャングルを制覇しよう。", "마을을 성장시키고 군대를 모아 정글을 지배하세요."],
  "menu.start": ["Jugar", "Jogar", "Spielen", "Jouer", "プレイ", "플레이"],
  "menu.settings": ["Ajustes", "Configurações", "Einstellungen", "Réglages", "設定", "설정"],
  "menu.credits": ["Créditos", "Créditos", "Mitwirkende", "Crédits", "クレジット", "크레딧"],
  "menu.bottomTag": ["¡La tribu te espera, jefe!", "A tribo espera por você, chefe!", "Der Stamm wartet auf dich, Häuptling!", "La tribu vous attend, chef !", "族長、部族が待っている！", "족장님, 부족이 기다리고 있어요!"],

  "loading.gatheringBananas": ["Recogiendo bananas...", "Coletando bananas...", "Bananen werden gesammelt...", "Récolte des bananes...", "バナナを集めています...", "바나나를 모으는 중..."],
  "loading.preparingTribe": ["Preparando la tribu...", "Preparando a tribo...", "Der Stamm macht sich bereit...", "Préparation de la tribu...", "部族を準備しています...", "부족을 준비하는 중..."],
  "loading.buildingVillage": ["Construyendo la aldea...", "Construindo a vila...", "Das Dorf wird gebaut...", "Construction du village...", "村を建設しています...", "마을을 건설하는 중..."],
  "loading.trainingWarriors": ["Entrenando guerreros...", "Treinando guerreiros...", "Krieger werden ausgebildet...", "Entraînement des guerriers...", "戦士を訓練しています...", "전사를 훈련하는 중..."],
  "loading.exploringJungle": ["Explorando la jungla...", "Explorando a selva...", "Der Dschungel wird erkundet...", "Exploration de la jungle...", "ジャングルを探索しています...", "정글을 탐험하는 중..."],
  "loading.sharpeningSpears": ["Afilando lanzas...", "Afiando lanças...", "Speere werden geschärft...", "Affûtage des lances...", "槍を研いでいます...", "창을 다듬는 중..."],
  "loading.openingPalace": ["Abriendo el Palacio Real...", "Abrindo o Palácio Real...", "Der Königspalast wird geöffnet...", "Ouverture du Palais royal...", "王宮を開いています...", "왕궁을 여는 중..."],

  "res.bananas": ["Bananas", "Bananas", "Bananen", "Bananes", "バナナ", "바나나"],
  "res.stones": ["Piedra", "Pedra", "Stein", "Pierre", "石材", "석재"],
  "res.wood": ["Madera", "Madeira", "Holz", "Bois", "木材", "목재"],
  "res.population": ["Ejército", "Exército", "Armee", "Armée", "軍隊", "군대"],
  "res.gems": ["Gemas", "Gemas", "Juwelen", "Gemmes", "ジェム", "젬"],
  "unit.worker": ["Trabajador", "Trabalhador", "Arbeiter", "Ouvrier", "ワーカー", "작업자"],
  "unit.fighter": ["Luchador", "Lutador", "Kämpfer", "Combattant", "ファイター", "전사"],
  "unit.archer": ["Arquero", "Arqueiro", "Bogenschütze", "Archer", "アーチャー", "궁수"],
  "unit.shield_guardian": ["Guardián del Escudo", "Guardião do Escudo", "Schildwächter", "Gardien au bouclier", "シールドガーディアン", "방패 수호자"],
  "unit.crossbowman": ["Ballestero", "Besteiro", "Armbrustschütze", "Arbalétrier", "クロスボウ兵", "석궁병"],
  "dock.raid": ["INCURSIÓN", "INCURSÃO", "RAUBZUG", "RAID", "レイド", "습격"],

  "upgrade.button": ["Mejorar", "Melhorar", "Verbessern", "Améliorer", "アップグレード", "업그레이드"],
  "upgrade.current": ["Actual", "Atual", "Aktuell", "Actuel", "現在", "현재"],
  "upgrade.next": ["Siguiente", "Próximo", "Nächste", "Suivant", "次", "다음"],
  "upgrade.needClanHall": ["Necesitas el Salón del Clan", "Requer Salão do Clã", "Clansaal erforderlich", "Salle du clan requise", "クランホールが必要", "클랜 회관 필요"],
  "common.level": ["Nivel", "Nível", "Stufe", "Niveau", "レベル", "레벨"],
  "common.levelBadge": ["Nv. {n}", "Nv. {n}", "St. {n}", "Niv. {n}", "Lv. {n}", "Lv. {n}"],
  "common.levelShort": ["Nv.", "Nv.", "St.", "Niv.", "Lv.", "Lv."],
  "common.new": ["NUEVO", "NOVO", "NEU", "NOUVEAU", "NEW", "신규"],

  "settings.title": ["Ajustes", "Configurações", "Einstellungen", "Réglages", "設定", "설정"],
  "settings.sectionGame": ["Juego", "Jogo", "Spiel", "Jeu", "ゲーム", "게임"],
  "settings.sectionAudio": ["Audio", "Áudio", "Audio", "Audio", "オーディオ", "오디오"],
  "settings.sectionSupport": ["Soporte", "Suporte", "Support", "Assistance", "サポート", "지원"],
  "settings.sectionAbout": ["Información", "Sobre", "Info", "À propos", "情報", "정보"],
  "settings.sectionDeveloper": ["Herramientas de desarrollo", "Ferramentas de desenvolvimento", "Entwicklerwerkzeuge", "Outils de développement", "開発者ツール", "개발자 도구"],
  "settings.language": ["Idioma", "Idioma", "Sprache", "Langue", "言語", "언어"],
  "settings.notifications": ["Notificaciones", "Notificações", "Mitteilungen", "Notifications", "通知", "알림"],
  "settings.haptics": ["Vibración", "Resposta tátil", "Haptik", "Retour haptique", "触覚フィードバック", "햅틱"],
  "settings.performance": ["Modo de rendimiento", "Modo de desempenho", "Leistungsmodus", "Mode de performance", "パフォーマンスモード", "성능 모드"],
  "settings.balanced": ["Equilibrado", "Equilibrado", "Ausgeglichen", "Équilibré", "バランス", "균형"],
  "settings.highPerformance": ["Alto rendimiento", "Alto desempenho", "Hohe Leistung", "Haute performance", "高パフォーマンス", "고성능"],
  "settings.replayTutorial": ["Repetir tutorial", "Repetir tutorial", "Tutorial wiederholen", "Revoir le didacticiel", "チュートリアルを再開", "튜토리얼 다시 보기"],
  "settings.sound": ["Efectos de sonido", "Efeitos sonoros", "Soundeffekte", "Effets sonores", "効果音", "효과음"],
  "settings.music": ["Música", "Música", "Musik", "Musique", "音楽", "음악"],
  "settings.mute": ["Silenciar", "Silenciar", "Stummschalten", "Couper le son", "ミュート", "음소거"],
  "settings.unmute": ["Activar sonido", "Ativar som", "Ton einschalten", "Activer le son", "ミュート解除", "음소거 해제"],
  "settings.support": ["Ayuda y soporte", "Ajuda e suporte", "Hilfe & Support", "Aide et assistance", "ヘルプとサポート", "도움말 및 지원"],
  "settings.supportDetail": ["Informa de un problema o pide ayuda", "Relate um problema ou peça ajuda", "Problem melden oder Hilfe erhalten", "Signaler un problème ou obtenir de l'aide", "問題の報告やサポート依頼", "문제를 신고하거나 도움받기"],
  "settings.reset": ["Reiniciar aldea", "Reiniciar vila", "Dorf zurücksetzen", "Réinitialiser le village", "村をリセット", "마을 초기화"],
  "settings.version": ["Versión de la app", "Versão do app", "App-Version", "Version de l'app", "アプリのバージョン", "앱 버전"],
  "settings.privacy": ["Política de privacidad", "Política de Privacidade", "Datenschutzrichtlinie", "Politique de confidentialité", "プライバシーポリシー", "개인정보 처리방침"],
  "settings.terms": ["Términos de uso", "Termos de Uso", "Nutzungsbedingungen", "Conditions d'utilisation", "利用規約", "이용 약관"],
  "settings.restorePurchases": ["Restaurar compras", "Restaurar compras", "Käufe wiederherstellen", "Restaurer les achats", "購入を復元", "구매 복원"],
  "settings.supportShort": ["Soporte", "Suporte", "Support", "Assistance", "サポート", "지원"],
  "settings.opensBrowser": ["Se abre en el navegador", "Abre no navegador", "Wird im Browser geöffnet", "S'ouvre dans le navigateur", "ブラウザで開きます", "웹 브라우저에서 열립니다"],
  "settings.linkErrorTitle": ["No se pudo abrir el enlace", "Não foi possível abrir o link", "Link konnte nicht geöffnet werden", "Impossible d'ouvrir le lien", "リンクを開けません", "링크를 열 수 없음"],
  "settings.linkErrorBody": ["No se puede abrir {page} ahora. Comprueba tu conexión e inténtalo de nuevo.", "Não foi possível abrir {page} agora. Verifique sua conexão e tente novamente.", "{page} kann gerade nicht geöffnet werden. Prüfe deine Verbindung und versuche es erneut.", "Impossible d'ouvrir {page} pour le moment. Vérifiez votre connexion et réessayez.", "現在{page}を開けません。通信環境を確認して、もう一度お試しください。", "지금은 {page} 페이지를 열 수 없습니다. 인터넷 연결을 확인한 후 다시 시도하세요."],
  "settings.credits": ["Créditos", "Créditos", "Mitwirkende", "Crédits", "クレジット", "크레딧"],
  "settings.close": ["Cerrar", "Fechar", "Schließen", "Fermer", "閉じる", "닫기"],

  "b.clanHall": ["Salón del Clan", "Salão do Clã", "Clansaal", "Salle du clan", "クランホール", "클랜 회관"],
  "b.lumberCamp": ["Campamento Maderero", "Acampamento Madeireiro", "Holzfällerlager", "Camp de bûcherons", "伐採キャンプ", "벌목 캠프"],
  "b.stoneQuarry": ["Cantera", "Pedreira", "Steinbruch", "Carrière", "採石場", "채석장"],
  "b.bananaGrove": ["Plantación de Bananas", "Bananal", "Bananenhain", "Bananeraie", "バナナ園", "바나나 농장"],
  "b.workerShelter": ["Casa de Trabajadores", "Alojamento dos Trabalhadores", "Arbeiterhütte", "Loge des ouvriers", "ワーカーロッジ", "작업자 숙소"],
  "b.trainingNest": ["Nido de Entrenamiento", "Ninho de Treinamento", "Trainingsnest", "Nid d'entraînement", "訓練所", "훈련 둥지"],
  "b.watchTower": ["Torre de Vigilancia", "Torre de Vigia", "Wachturm", "Tour de guet", "見張り塔", "감시탑"],
  "b.royalPalace": ["Palacio Real", "Palácio Real", "Königspalast", "Palais royal", "王宮", "왕궁"],

  "offline.title": ["¡Qué bueno verte, jefe!", "Boas-vindas, chefe!", "Willkommen zurück, Häuptling!", "Bon retour, chef !", "おかえりなさい、族長！", "다시 오셨군요, 족장님!"],
  "offline.subtitle": ["La tribu siguió trabajando mientras no estabas", "A tribo continuou trabalhando enquanto você estava fora", "Der Stamm hat in deiner Abwesenheit weitergearbeitet", "La tribu a continué à travailler en votre absence", "留守の間も部族は働いていました", "자리를 비운 동안에도 부족은 계속 일했어요"],
  "offline.away": ["Estuviste fuera {time}", "Você ficou fora por {time}", "Du warst {time} weg", "Votre absence a duré {time}", "{time}留守にしていました", "{time} 동안 자리를 비웠어요"],
  "offline.collect": ["Recoger", "Coletar", "Einsammeln", "Récupérer", "受け取る", "받기"],

  "daily.title": ["Recompensa diaria", "Recompensa diária", "Tägliche Belohnung", "Récompense quotidienne", "デイリー報酬", "일일 보상"],
  "daily.claim": ["Reclamar", "Coletar", "Abholen", "Récupérer", "受け取る", "받기"],
  "daily.comeback": ["¡Vuelve mañana!", "Volte amanhã!", "Komm morgen wieder!", "Revenez demain !", "また明日！", "내일 다시 오세요!"],
  "daily.claimed": ["¡+{amount} Gemas!", "+{amount} Gemas recebidas!", "+{amount} Juwelen erhalten!", "+{amount} Gemmes récupérées !", "+{amount}ジェムを受け取りました！", "+{amount} 젬을 받았어요!"],
  "daily.done": ["Recibido", "Recebido", "Erhalten", "Récupéré", "受取済み", "받음"],

  "raid.victory": ["¡Victoria!", "Vitória!", "Sieg!", "Victoire !", "勝利！", "승리!"],
  "raid.defeat": ["Incursión fallida", "Incursão fracassada", "Raubzug gescheitert", "Échec du raid", "レイド失敗", "습격 실패"],
  "raid.retreatResult": ["Retirada", "Retirada", "Rückzug", "Retraite", "撤退", "후퇴"],
  "raid.retreat": ["Retirarse", "Recuar", "Rückzug", "Battre en retraite", "撤退", "후퇴"],
  "raid.return": ["Volver a la aldea", "Voltar à vila", "Zurück zum Dorf", "Retourner au village", "村へ戻る", "마을로 돌아가기"],
  "raid.confirm.continue": ["Continuar", "Continuar", "Weiter", "Continuer", "続ける", "계속"],
  "raid.confirm.cancel": ["Cancelar", "Cancelar", "Abbrechen", "Annuler", "キャンセル", "취소"],
  "raid.confirm.bestArmy": ["Elegir el mejor ejército", "Selecionar o melhor exército", "Beste Armee wählen", "Choisir la meilleure armée", "最強部隊を選択", "최적 부대 선택"],
  "raid.confirm.clear": ["Borrar selección", "Limpar seleção", "Auswahl löschen", "Effacer la sélection", "選択をクリア", "선택 초기화"],

  "gemStore.title": ["Tienda de Gemas", "Loja de Gemas", "Juwelenladen", "Boutique de Gemmes", "ジェムストア", "젬 상점"],
  "gemStore.balance": ["Saldo", "Saldo", "Guthaben", "Solde", "所持数", "보유량"],
  "gemStore.loadingPrice": ["Cargando precio", "Carregando preço", "Preis wird geladen", "Chargement du prix", "価格を読み込み中", "가격 불러오는 중"],
  "gemStore.unavailable": ["No disponible", "Indisponível", "Nicht verfügbar", "Indisponible", "利用できません", "이용 불가"],
  "gemStore.processing": ["Procesando", "Processando", "Wird verarbeitet", "Traitement en cours", "処理中", "처리 중"],
  "gemStore.purchaseCancelled": ["Compra cancelada. No se añadieron Gemas.", "Compra cancelada. Nenhuma Gema foi adicionada.", "Kauf abgebrochen. Es wurden keine Juwelen hinzugefügt.", "Achat annulé. Aucune Gemme n'a été ajoutée.", "購入をキャンセルしました。ジェムは追加されていません。", "구매가 취소되었습니다. 젬은 지급되지 않았습니다."],
  "gemStore.purchasePending": ["Compra pendiente. Las Gemas se añadirán cuando Apple la complete.", "Compra pendente. As Gemas serão adicionadas quando a Apple concluir a transação.", "Kauf ausstehend. Juwelen werden erst nach Abschluss durch Apple gutgeschrieben.", "Achat en attente. Les Gemmes seront ajoutées après validation par Apple.", "購入は保留中です。Appleで完了するまでジェムは追加されません。", "구매가 대기 중입니다. Apple에서 완료될 때까지 젬은 지급되지 않습니다."],
  "gemStore.purchaseSuccess": ["Compra completada. Se añadieron {amount} Gemas.", "Compra concluída. {amount} Gemas adicionadas.", "Kauf abgeschlossen. {amount} Juwelen hinzugefügt.", "Achat terminé. {amount} Gemmes ajoutées.", "購入完了。{amount}ジェムを追加しました。", "구매 완료. {amount} 젬이 지급되었습니다."],

  "workerLodge.collect": ["Recoger", "Coletar", "Einsammeln", "Récupérer", "受け取る", "받기"],
  "workerDispatch.total": ["Trabajadores totales", "Total de trabalhadores", "Arbeiter gesamt", "Total d'ouvriers", "ワーカー合計", "총 작업자"],
  "workerDispatch.expected": ["Recompensa estimada", "Recompensa estimada", "Geschätzte Belohnung", "Récompense estimée", "予想報酬", "예상 보상"],
  "workerDispatch.duration": ["Tiempo estimado", "Tempo estimado", "Geschätzte Dauer", "Durée estimée", "予想時間", "예상 시간"],
  "workerDispatch.risk": ["Riesgo", "Risco", "Risiko", "Risque", "リスク", "위험도"],
  "workerDispatch.send": ["Enviar a la misión", "Enviar em missão", "Auf Mission schicken", "Envoyer en mission", "任務に派遣", "임무 보내기"]
};

export function releaseTranslation(key: string, locale: Lang): string | undefined {
  const localeIndex = RELEASE_TRANSLATION_LOCALES.indexOf(locale as (typeof RELEASE_TRANSLATION_LOCALES)[number]);
  if (localeIndex < 0) return undefined;
  return translations[key]?.[localeIndex]
    ?? (generatedTranslations[locale as keyof typeof generatedTranslations] as Record<string, string> | undefined)?.[key];
}

export function curatedReleaseTranslationKeys() {
  return Object.keys(translations);
}
