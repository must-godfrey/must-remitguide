/* RemitGuide i18n — language detection, read-aloud voice mapping, RTL, and a
   verified UI-label dictionary. Languages not in the dictionary fall back to
   English chrome (per key), while the conversation + voice + chip still work. */

(function () {
  const LANGS = [
    { code: "en", native: "English", bcp47: "en-US", rtl: false },
    { code: "ko", native: "한국어", bcp47: "ko-KR", rtl: false },
    { code: "zh", native: "中文", bcp47: "zh-CN", rtl: false },
    { code: "ja", native: "日本語", bcp47: "ja-JP", rtl: false },
    { code: "es", native: "Español", bcp47: "es-ES", rtl: false },
    { code: "fr", native: "Français", bcp47: "fr-FR", rtl: false },
    { code: "pt", native: "Português", bcp47: "pt-BR", rtl: false },
    { code: "de", native: "Deutsch", bcp47: "de-DE", rtl: false },
    { code: "ru", native: "Русский", bcp47: "ru-RU", rtl: false },
    { code: "ar", native: "العربية", bcp47: "ar-SA", rtl: true },
    { code: "hi", native: "हिन्दी", bcp47: "hi-IN", rtl: false },
    { code: "vi", native: "Tiếng Việt", bcp47: "vi-VN", rtl: false },
    { code: "id", native: "Bahasa Indonesia", bcp47: "id-ID", rtl: false },
    { code: "it", native: "Italiano", bcp47: "it-IT", rtl: false },
    { code: "tr", native: "Türkçe", bcp47: "tr-TR", rtl: false },
    { code: "tl", native: "Filipino", bcp47: "fil-PH", rtl: false },
    { code: "sw", native: "Kiswahili", bcp47: "sw-KE", rtl: false },
    { code: "yo", native: "Yorùbá", bcp47: "yo-NG", rtl: false },
    { code: "ig", native: "Igbo", bcp47: "ig-NG", rtl: false },
    { code: "ha", native: "Hausa", bcp47: "ha-NG", rtl: false },
    { code: "th", native: "ไทย", bcp47: "th-TH", rtl: false },
    { code: "bn", native: "বাংলা", bcp47: "bn-BD", rtl: false },
    { code: "ne", native: "नेपाली", bcp47: "ne-NP", rtl: false },
    { code: "ur", native: "اردو", bcp47: "ur-PK", rtl: true },
    { code: "km", native: "ខ្មែរ", bcp47: "km-KH", rtl: false },
    { code: "my", native: "မြန်မာ", bcp47: "my-MM", rtl: false },
  ];
  const byCode = Object.fromEntries(LANGS.map((l) => [l.code, l]));

  // ---- detection: script first (reliable), then Latin-script heuristics ----
  const SCRIPTS = [
    ["ko", /[가-힯ᄀ-ᇿ]/],
    ["ja", /[぀-ヿ]/], // kana (check before Han)
    ["th", /[฀-๿]/],
    ["km", /[ក-៿]/],
    ["my", /[က-႟]/],
    ["hi", /[ऀ-ॿ]/], // Devanagari (Hindi/Nepali share it; default hi)
    ["bn", /[ঀ-৿]/],
    ["ru", /[Ѐ-ӿ]/],
    ["ur", /[؀-ۿ].*[ٹپچڈڑںھہے]/],
    ["ar", /[؀-ۿ]/],
    ["zh", /[一-鿿]/], // Han (after kana so JP isn't misread)
  ];
  // Distinctive-token heuristics; more-distinctive languages first so shared
  // words (e.g. "casa") don't misroute. es/pt last as the broad romance fallback.
  const LATIN = [
    ["vi", /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủũứừửữựỳỵỷỹ]/i],
    ["it", /\b(ciao|voglio|inviare|mandare|soldi|denaro|grazie|sono|della|messaggio)\b/i],
    ["fr", /\b(bonjour|je|veux|envoyer|argent|combien|merci|pour|famille|maison)\b/i],
    ["de", /\b(ich|möchte|moechte|geld|senden|hallo|wie ?viel|danke|meine|nach|familie)\b/i],
    ["sw", /\b(habari|nataka|kutuma|pesa|kiasi|asante|kwa|familia|nyumbani|mama)\b/i],
    ["tr", /\b(merhaba|para|göndermek|gondermek|istiyorum|ne kadar|teşekkür|tesekkur|için|icin|aile)\b/i],
    ["tl", /\b(kumusta|gusto|magpadala|pera|magkano|salamat|pamilya|nanay)\b/i],
    ["id", /\b(saya|ingin|mau|mengirim|kirim|uang|halo|berapa|terima kasih|untuk|keluarga)\b/i],
    ["es", /\b(hola|quiero|enviar|dinero|cuánto|cuanto|gracias|para|familia)\b/i],
    ["pt", /\b(olá|ola|quero|enviar|dinheiro|quanto|obrigad[oa]|minha|família|familia)\b/i],
  ];

  function detect(text) {
    const t = String(text || "");
    for (const [code, re] of SCRIPTS) if (re.test(t)) return code;
    const low = t.toLowerCase();
    for (const [code, re] of LATIN) if (re.test(low)) return code;
    return "en";
  }

  // ---- label dictionary (verified). Missing key/lang → English fallback. ----
  const L = {};
  L.en = {
    tagline: "a friendly guide to sending money home",
    heroBadge: "simulated demo", heroTitle: "Send money home,", heroTitleEm: "without the worry.",
    heroIntro: "Talk to me in your language. I'll find the cheapest way, explain it plainly, protect your family from scams, and never move a won without your say-so.",
    starterSend: "Send money home", starterCompare: "Compare costs", starterTrack: "Where's my money?", starterSafe: "Stay safe",
    footer: "Demo only · all transfers are simulated · rates are illustrative",
    readAloud: "Read aloud", bestValue: "Best value", allInCost: "all-in cost",
    familyReceives: "Your family receives {amount}", optionsToSend: "Your options to send {amount}",
    saves: "The recommended option saves you {amount} vs the most expensive one.",
    whereGoes: "Where your money goes", familyKeeps: "Family keeps", fee: "Fee", fxMargin: "FX margin",
    confirm: "Please confirm before I send", amount: "Amount", method: "Method", to: "To", speed: "Speed",
    approve: "Approve & send", decline: "Not now", approved: "Approved",
    tracking: "Tracking your transfer", sent: "Sent", received: "Received", cashedOut: "Cashed out",
    statusSent: "On its way to your family.", statusReceived: "Arrived — your family can collect it now.",
    statusCashed: "Collected. All done!", collectingIn: "Collecting cash in {place}",
    staySafe: "Stay safe", copyFamily: "Copy this guide for my family", copied: "Copied — paste it to your family",
    scamWarning: "Scam warning", beCareful: "Be careful", safetyCheck: "Safety check", whatToDo: "What to do",
    placeholder: "Type a message…",
  };
  L.ko = {
    tagline: "고향에 돈을 보내는 친절한 안내자", readAloud: "소리내어 읽기", bestValue: "최선의 선택",
    allInCost: "총 비용", familyReceives: "가족이 받는 금액: {amount}", optionsToSend: "{amount} 보내기 옵션",
    saves: "추천 방법은 가장 비싼 방법보다 {amount}를 절약해 줍니다.", whereGoes: "내 돈이 어디로 가는지",
    familyKeeps: "가족이 받음", fee: "수수료", fxMargin: "환율 마진", confirm: "보내기 전에 확인해 주세요",
    amount: "금액", method: "방법", to: "받는 사람", speed: "속도", approve: "승인하고 보내기", decline: "나중에", approved: "승인됨",
    tracking: "송금 추적", sent: "보냄", received: "도착", cashedOut: "수령 완료",
    statusSent: "가족에게 가는 중입니다.", statusReceived: "도착했어요 — 이제 가족이 받을 수 있습니다.",
    statusCashed: "수령 완료. 모두 끝났어요!", collectingIn: "{place}에서 현금 받기", staySafe: "안전 수칙",
    copyFamily: "가족에게 보낼 안내 복사하기", copied: "복사됨 — 가족에게 붙여넣으세요",
    scamWarning: "사기 경고", beCareful: "주의하세요", safetyCheck: "안전 확인", whatToDo: "해야 할 일",
    placeholder: "메시지를 입력하세요…",
  };
  L.zh = {
    tagline: "帮你把钱安心寄回家的向导", readAloud: "朗读", bestValue: "最划算", allInCost: "总费用",
    familyReceives: "家人收到 {amount}", optionsToSend: "寄出 {amount} 的方式", saves: "推荐方式比最贵的方式为你省下 {amount}。",
    whereGoes: "你的钱去了哪里", familyKeeps: "家人收到", fee: "手续费", fxMargin: "汇率差价", confirm: "发送前请确认",
    amount: "金额", method: "方式", to: "收款人", speed: "速度", approve: "确认并发送", decline: "暂不", approved: "已确认",
    tracking: "追踪你的汇款", sent: "已发送", received: "已到账", cashedOut: "已取现",
    statusSent: "正在寄往你的家人。", statusReceived: "已到账 — 家人现在可以领取了。", statusCashed: "已领取，全部完成！",
    collectingIn: "在{place}取现", staySafe: "注意安全", copyFamily: "复制这份指南发给家人", copied: "已复制 — 发给你的家人",
    scamWarning: "诈骗警告", beCareful: "请小心", safetyCheck: "安全检查", whatToDo: "该怎么做", placeholder: "输入消息…",
  };
  L.ja = {
    tagline: "故郷へ安心して送金するための案内役", readAloud: "読み上げ", bestValue: "最もお得", allInCost: "総費用",
    familyReceives: "ご家族の受取額 {amount}", optionsToSend: "{amount} を送る方法", saves: "おすすめの方法は最も高い方法より {amount} 節約できます。",
    whereGoes: "お金の使われ方", familyKeeps: "家族の受取", fee: "手数料", fxMargin: "為替手数料", confirm: "送金前にご確認ください",
    amount: "金額", method: "方法", to: "受取人", speed: "速さ", approve: "承認して送金", decline: "今はしない", approved: "承認済み",
    tracking: "送金の追跡", sent: "送金済み", received: "到着", cashedOut: "受取完了",
    statusSent: "ご家族へ送金中です。", statusReceived: "到着しました — ご家族が受け取れます。", statusCashed: "受取完了。すべて完了です！",
    collectingIn: "{place}での現金受取", staySafe: "安全のために", copyFamily: "この案内を家族にコピー", copied: "コピーしました — 家族に送ってください",
    scamWarning: "詐欺の警告", beCareful: "ご注意ください", safetyCheck: "安全確認", whatToDo: "やるべきこと", placeholder: "メッセージを入力…",
  };
  L.es = {
    tagline: "una guía amable para enviar dinero a casa", readAloud: "Leer en voz alta", bestValue: "Mejor opción",
    allInCost: "costo total", familyReceives: "Tu familia recibe {amount}", optionsToSend: "Opciones para enviar {amount}",
    saves: "La opción recomendada te ahorra {amount} frente a la más cara.", whereGoes: "Adónde va tu dinero",
    familyKeeps: "La familia recibe", fee: "Comisión", fxMargin: "Margen de cambio", confirm: "Confirma antes de enviar",
    amount: "Monto", method: "Método", to: "Para", speed: "Velocidad", approve: "Aprobar y enviar", decline: "Ahora no", approved: "Aprobado",
    tracking: "Seguimiento de tu envío", sent: "Enviado", received: "Recibido", cashedOut: "Cobrado",
    statusSent: "En camino a tu familia.", statusReceived: "Llegó — tu familia ya puede cobrarlo.", statusCashed: "Cobrado. ¡Listo!",
    collectingIn: "Cobrar efectivo en {place}", staySafe: "Mantente seguro", copyFamily: "Copiar esta guía para mi familia", copied: "Copiado — envíalo a tu familia",
    scamWarning: "Alerta de estafa", beCareful: "Ten cuidado", safetyCheck: "Chequeo de seguridad", whatToDo: "Qué hacer", placeholder: "Escribe un mensaje…",
  };
  L.fr = {
    tagline: "un guide bienveillant pour envoyer de l'argent à la maison", readAloud: "Lire à voix haute", bestValue: "Meilleur choix",
    allInCost: "coût total", familyReceives: "Votre famille reçoit {amount}", optionsToSend: "Options pour envoyer {amount}",
    saves: "L'option recommandée vous fait économiser {amount} par rapport à la plus chère.", whereGoes: "Où va votre argent",
    familyKeeps: "La famille reçoit", fee: "Frais", fxMargin: "Marge de change", confirm: "Confirmez avant l'envoi",
    amount: "Montant", method: "Méthode", to: "Pour", speed: "Délai", approve: "Approuver et envoyer", decline: "Pas maintenant", approved: "Approuvé",
    tracking: "Suivi de votre transfert", sent: "Envoyé", received: "Reçu", cashedOut: "Retiré",
    statusSent: "En route vers votre famille.", statusReceived: "Arrivé — votre famille peut le retirer.", statusCashed: "Retiré. Terminé !",
    collectingIn: "Retirer de l'argent à {place}", staySafe: "Restez prudent", copyFamily: "Copier ce guide pour ma famille", copied: "Copié — envoyez-le à votre famille",
    scamWarning: "Alerte arnaque", beCareful: "Soyez prudent", safetyCheck: "Vérification de sécurité", whatToDo: "Que faire", placeholder: "Écrivez un message…",
  };
  L.pt = {
    tagline: "um guia gentil para enviar dinheiro para casa", readAloud: "Ler em voz alta", bestValue: "Melhor opção",
    allInCost: "custo total", familyReceives: "Sua família recebe {amount}", optionsToSend: "Opções para enviar {amount}",
    saves: "A opção recomendada economiza {amount} em relação à mais cara.", whereGoes: "Para onde vai seu dinheiro",
    familyKeeps: "A família recebe", fee: "Taxa", fxMargin: "Margem de câmbio", confirm: "Confirme antes de enviar",
    amount: "Valor", method: "Método", to: "Para", speed: "Velocidade", approve: "Aprovar e enviar", decline: "Agora não", approved: "Aprovado",
    tracking: "Acompanhe sua transferência", sent: "Enviado", received: "Recebido", cashedOut: "Sacado",
    statusSent: "A caminho da sua família.", statusReceived: "Chegou — sua família já pode receber.", statusCashed: "Sacado. Tudo pronto!",
    collectingIn: "Sacar dinheiro em {place}", staySafe: "Fique seguro", copyFamily: "Copiar este guia para minha família", copied: "Copiado — envie para sua família",
    scamWarning: "Alerta de golpe", beCareful: "Tenha cuidado", safetyCheck: "Verificação de segurança", whatToDo: "O que fazer", placeholder: "Digite uma mensagem…",
  };
  L.de = {
    tagline: "ein freundlicher Begleiter, um Geld nach Hause zu senden", readAloud: "Vorlesen", bestValue: "Beste Wahl",
    allInCost: "Gesamtkosten", familyReceives: "Deine Familie erhält {amount}", optionsToSend: "Optionen, um {amount} zu senden",
    saves: "Die empfohlene Option spart dir {amount} gegenüber der teuersten.", whereGoes: "Wohin dein Geld geht",
    familyKeeps: "Familie erhält", fee: "Gebühr", fxMargin: "Wechselkurs-Marge", confirm: "Bitte vor dem Senden bestätigen",
    amount: "Betrag", method: "Methode", to: "An", speed: "Dauer", approve: "Bestätigen und senden", decline: "Jetzt nicht", approved: "Bestätigt",
    tracking: "Verfolge deine Überweisung", sent: "Gesendet", received: "Angekommen", cashedOut: "Ausgezahlt",
    statusSent: "Unterwegs zu deiner Familie.", statusReceived: "Angekommen — deine Familie kann es abholen.", statusCashed: "Ausgezahlt. Fertig!",
    collectingIn: "Bargeld abholen in {place}", staySafe: "Bleib sicher", copyFamily: "Diese Anleitung für meine Familie kopieren", copied: "Kopiert — sende es an deine Familie",
    scamWarning: "Betrugswarnung", beCareful: "Sei vorsichtig", safetyCheck: "Sicherheitscheck", whatToDo: "Was zu tun ist", placeholder: "Nachricht eingeben…",
  };
  L.ru = {
    tagline: "добрый помощник, чтобы отправить деньги домой", readAloud: "Озвучить", bestValue: "Лучший вариант",
    allInCost: "полная стоимость", familyReceives: "Ваша семья получит {amount}", optionsToSend: "Способы отправить {amount}",
    saves: "Рекомендуемый способ экономит вам {amount} по сравнению с самым дорогим.", whereGoes: "Куда уходят ваши деньги",
    familyKeeps: "Семья получает", fee: "Комиссия", fxMargin: "Курсовая наценка", confirm: "Подтвердите перед отправкой",
    amount: "Сумма", method: "Способ", to: "Кому", speed: "Скорость", approve: "Подтвердить и отправить", decline: "Не сейчас", approved: "Подтверждено",
    tracking: "Отслеживание перевода", sent: "Отправлено", received: "Получено", cashedOut: "Обналичено",
    statusSent: "В пути к вашей семье.", statusReceived: "Пришло — семья может получить деньги.", statusCashed: "Получено. Готово!",
    collectingIn: "Получить наличные в {place}", staySafe: "Будьте осторожны", copyFamily: "Скопировать это руководство для семьи", copied: "Скопировано — отправьте семье",
    scamWarning: "Предупреждение о мошенничестве", beCareful: "Будьте осторожны", safetyCheck: "Проверка безопасности", whatToDo: "Что делать", placeholder: "Введите сообщение…",
  };
  L.ar = {
    tagline: "دليل ودود لإرسال المال إلى الوطن", readAloud: "اقرأ بصوت عال", bestValue: "الخيار الأفضل",
    allInCost: "التكلفة الإجمالية", familyReceives: "تستلم عائلتك {amount}", optionsToSend: "خيارات إرسال {amount}",
    saves: "الخيار المُوصى به يوفّر لك {amount} مقارنة بالأغلى.", whereGoes: "إلى أين تذهب أموالك",
    familyKeeps: "تحصل العائلة على", fee: "الرسوم", fxMargin: "هامش الصرف", confirm: "يرجى التأكيد قبل الإرسال",
    amount: "المبلغ", method: "الطريقة", to: "إلى", speed: "السرعة", approve: "الموافقة والإرسال", decline: "ليس الآن", approved: "تمت الموافقة",
    tracking: "تتبّع تحويلك", sent: "أُرسل", received: "وصل", cashedOut: "تم الاستلام",
    statusSent: "في طريقه إلى عائلتك.", statusReceived: "وصل — يمكن لعائلتك استلامه الآن.", statusCashed: "تم الاستلام. اكتمل كل شيء!",
    collectingIn: "استلام النقد في {place}", staySafe: "ابقَ آمناً", copyFamily: "انسخ هذا الدليل لعائلتي", copied: "تم النسخ — أرسله إلى عائلتك",
    scamWarning: "تحذير من الاحتيال", beCareful: "كن حذراً", safetyCheck: "فحص الأمان", whatToDo: "ماذا تفعل", placeholder: "اكتب رسالة…",
  };
  L.hi = {
    tagline: "घर पैसे भेजने के लिए एक मददगार साथी", readAloud: "ज़ोर से पढ़ें", bestValue: "सबसे अच्छा विकल्प",
    allInCost: "कुल लागत", familyReceives: "आपके परिवार को मिलते हैं {amount}", optionsToSend: "{amount} भेजने के विकल्प",
    saves: "सुझाया गया विकल्प सबसे महंगे की तुलना में आपके {amount} बचाता है।", whereGoes: "आपका पैसा कहाँ जाता है",
    familyKeeps: "परिवार को मिलता है", fee: "शुल्क", fxMargin: "विनिमय अंतर", confirm: "भेजने से पहले पुष्टि करें",
    amount: "राशि", method: "तरीका", to: "किसे", speed: "गति", approve: "स्वीकृत करें और भेजें", decline: "अभी नहीं", approved: "स्वीकृत",
    tracking: "अपने ट्रांसफ़र को ट्रैक करें", sent: "भेजा गया", received: "पहुँच गया", cashedOut: "नकद मिल गया",
    statusSent: "आपके परिवार के पास जा रहा है।", statusReceived: "पहुँच गया — अब आपका परिवार ले सकता है।", statusCashed: "मिल गया। सब हो गया!",
    collectingIn: "{place} में नकद लेना", staySafe: "सुरक्षित रहें", copyFamily: "यह गाइड परिवार के लिए कॉपी करें", copied: "कॉपी हो गया — परिवार को भेजें",
    scamWarning: "धोखाधड़ी चेतावनी", beCareful: "सावधान रहें", safetyCheck: "सुरक्षा जाँच", whatToDo: "क्या करें", placeholder: "संदेश लिखें…",
  };
  L.vi = {
    tagline: "người hướng dẫn thân thiện để gửi tiền về nhà", readAloud: "Đọc to", bestValue: "Lựa chọn tốt nhất",
    allInCost: "tổng chi phí", familyReceives: "Gia đình bạn nhận {amount}", optionsToSend: "Các cách gửi {amount}",
    saves: "Lựa chọn được đề xuất giúp bạn tiết kiệm {amount} so với cách đắt nhất.", whereGoes: "Tiền của bạn đi đâu",
    familyKeeps: "Gia đình nhận", fee: "Phí", fxMargin: "Chênh lệch tỷ giá", confirm: "Vui lòng xác nhận trước khi gửi",
    amount: "Số tiền", method: "Cách", to: "Đến", speed: "Tốc độ", approve: "Duyệt và gửi", decline: "Để sau", approved: "Đã duyệt",
    tracking: "Theo dõi khoản chuyển", sent: "Đã gửi", received: "Đã đến", cashedOut: "Đã nhận tiền",
    statusSent: "Đang trên đường đến gia đình bạn.", statusReceived: "Đã đến — gia đình bạn có thể nhận ngay.", statusCashed: "Đã nhận. Xong rồi!",
    collectingIn: "Nhận tiền mặt tại {place}", staySafe: "Giữ an toàn", copyFamily: "Sao chép hướng dẫn này cho gia đình", copied: "Đã sao chép — gửi cho gia đình bạn",
    scamWarning: "Cảnh báo lừa đảo", beCareful: "Hãy cẩn thận", safetyCheck: "Kiểm tra an toàn", whatToDo: "Cần làm gì", placeholder: "Nhập tin nhắn…",
  };
  L.id = {
    tagline: "panduan ramah untuk mengirim uang ke kampung halaman", readAloud: "Bacakan", bestValue: "Pilihan terbaik",
    allInCost: "total biaya", familyReceives: "Keluarga Anda menerima {amount}", optionsToSend: "Pilihan untuk mengirim {amount}",
    saves: "Pilihan yang disarankan menghemat {amount} dibanding yang termahal.", whereGoes: "Ke mana uang Anda pergi",
    familyKeeps: "Keluarga menerima", fee: "Biaya", fxMargin: "Margin kurs", confirm: "Mohon konfirmasi sebelum mengirim",
    amount: "Jumlah", method: "Metode", to: "Kepada", speed: "Kecepatan", approve: "Setujui & kirim", decline: "Nanti saja", approved: "Disetujui",
    tracking: "Lacak transfer Anda", sent: "Terkirim", received: "Tiba", cashedOut: "Dicairkan",
    statusSent: "Dalam perjalanan ke keluarga Anda.", statusReceived: "Tiba — keluarga Anda bisa mengambilnya sekarang.", statusCashed: "Sudah dicairkan. Selesai!",
    collectingIn: "Mencairkan uang di {place}", staySafe: "Tetap aman", copyFamily: "Salin panduan ini untuk keluarga saya", copied: "Tersalin — kirim ke keluarga Anda",
    scamWarning: "Peringatan penipuan", beCareful: "Hati-hati", safetyCheck: "Pemeriksaan keamanan", whatToDo: "Apa yang harus dilakukan", placeholder: "Ketik pesan…",
  };

  L.it = {
    tagline: "una guida gentile per inviare soldi a casa", readAloud: "Leggi ad alta voce", bestValue: "Scelta migliore",
    allInCost: "costo totale", familyReceives: "La tua famiglia riceve {amount}", optionsToSend: "Opzioni per inviare {amount}",
    saves: "L'opzione consigliata ti fa risparmiare {amount} rispetto alla più cara.", whereGoes: "Dove vanno i tuoi soldi",
    familyKeeps: "La famiglia riceve", fee: "Commissione", fxMargin: "Margine di cambio", confirm: "Conferma prima di inviare",
    amount: "Importo", method: "Metodo", to: "A", speed: "Velocità", approve: "Approva e invia", decline: "Non ora", approved: "Approvato",
    tracking: "Segui il tuo trasferimento", sent: "Inviato", received: "Arrivato", cashedOut: "Riscosso",
    statusSent: "In viaggio verso la tua famiglia.", statusReceived: "Arrivato — la tua famiglia può ritirarlo ora.", statusCashed: "Riscosso. Tutto fatto!",
    collectingIn: "Ritirare contanti a {place}", staySafe: "Resta al sicuro", copyFamily: "Copia questa guida per la mia famiglia", copied: "Copiato — invialo alla tua famiglia",
    scamWarning: "Allerta truffa", beCareful: "Fai attenzione", safetyCheck: "Controllo di sicurezza", whatToDo: "Cosa fare", placeholder: "Scrivi un messaggio…",
  };
  L.tr = {
    tagline: "eve para göndermek için samimi bir rehber", readAloud: "Sesli oku", bestValue: "En iyi seçenek",
    allInCost: "toplam maliyet", familyReceives: "Aileniz {amount} alır", optionsToSend: "{amount} göndermek için seçenekler",
    saves: "Önerilen seçenek, en pahalısına göre size {amount} kazandırır.", whereGoes: "Paranız nereye gidiyor",
    familyKeeps: "Aile alır", fee: "Ücret", fxMargin: "Kur farkı", confirm: "Göndermeden önce onaylayın",
    amount: "Tutar", method: "Yöntem", to: "Kime", speed: "Hız", approve: "Onayla ve gönder", decline: "Şimdi değil", approved: "Onaylandı",
    tracking: "Transferinizi takip edin", sent: "Gönderildi", received: "Ulaştı", cashedOut: "Çekildi",
    statusSent: "Ailenize doğru yolda.", statusReceived: "Ulaştı — aileniz şimdi alabilir.", statusCashed: "Çekildi. Her şey tamam!",
    collectingIn: "{place} konumunda nakit çekme", staySafe: "Güvende kalın", copyFamily: "Bu rehberi aileme kopyala", copied: "Kopyalandı — ailenize gönderin",
    scamWarning: "Dolandırıcılık uyarısı", beCareful: "Dikkatli olun", safetyCheck: "Güvenlik kontrolü", whatToDo: "Ne yapmalı", placeholder: "Bir mesaj yazın…",
  };
  L.tl = {
    tagline: "isang magiliw na gabay sa pagpapadala ng pera sa pamilya", readAloud: "Basahin nang malakas", bestValue: "Pinakamabuti",
    allInCost: "kabuuang gastos", familyReceives: "Tatanggap ang pamilya mo ng {amount}", optionsToSend: "Mga paraan para magpadala ng {amount}",
    saves: "Ang inirerekomendang paraan ay nakakatipid sa iyo ng {amount} kumpara sa pinakamahal.", whereGoes: "Saan napupunta ang pera mo",
    familyKeeps: "Natatanggap ng pamilya", fee: "Bayad", fxMargin: "Margin sa palitan", confirm: "Kumpirmahin bago ipadala",
    amount: "Halaga", method: "Paraan", to: "Kay", speed: "Bilis", approve: "Aprubahan at ipadala", decline: "Hindi muna", approved: "Naaprubahan",
    tracking: "Subaybayan ang iyong padala", sent: "Naipadala", received: "Dumating", cashedOut: "Nakuha na",
    statusSent: "Papunta na sa pamilya mo.", statusReceived: "Dumating na — pwede nang kunin ng pamilya mo.", statusCashed: "Nakuha na. Tapos na!",
    collectingIn: "Pagkuha ng pera sa {place}", staySafe: "Mag-ingat", copyFamily: "Kopyahin ang gabay na ito para sa pamilya ko", copied: "Nakopya na — ipadala sa pamilya mo",
    scamWarning: "Babala sa scam", beCareful: "Mag-ingat", safetyCheck: "Pagsusuri sa kaligtasan", whatToDo: "Ano ang gagawin", placeholder: "Mag-type ng mensahe…",
  };
  L.sw = {
    tagline: "mwongozo wa kirafiki wa kutuma pesa nyumbani", readAloud: "Soma kwa sauti", bestValue: "Chaguo bora",
    allInCost: "gharama jumla", familyReceives: "Familia yako inapokea {amount}", optionsToSend: "Njia za kutuma {amount}",
    saves: "Njia inayopendekezwa inakuokoa {amount} ikilinganishwa na ghali zaidi.", whereGoes: "Pesa yako inaenda wapi",
    familyKeeps: "Familia inapata", fee: "Ada", fxMargin: "Tofauti ya ubadilishaji", confirm: "Tafadhali thibitisha kabla ya kutuma",
    amount: "Kiasi", method: "Njia", to: "Kwa", speed: "Kasi", approve: "Idhinisha na tuma", decline: "Si sasa", approved: "Imeidhinishwa",
    tracking: "Fuatilia uhamisho wako", sent: "Imetumwa", received: "Imefika", cashedOut: "Imetolewa",
    statusSent: "Inaelekea kwa familia yako.", statusReceived: "Imefika — familia yako inaweza kuichukua sasa.", statusCashed: "Imetolewa. Imekamilika!",
    collectingIn: "Kuchukua pesa taslimu {place}", staySafe: "Kuwa salama", copyFamily: "Nakili mwongozo huu kwa familia yangu", copied: "Imenakiliwa — tuma kwa familia yako",
    scamWarning: "Onyo la ulaghai", beCareful: "Kuwa makini", safetyCheck: "Ukaguzi wa usalama", whatToDo: "Nini cha kufanya", placeholder: "Andika ujumbe…",
  };

  /* __SHELL_I18N__ */ // hero/footer strings, professionally translated
  const SHELL = {
    "ko": {
      "heroBadge": "체험용 데모",
      "heroTitle": "고향에 송금하세요,",
      "heroTitleEm": "걱정 없이.",
      "heroIntro": "편하신 언어로 말씀해 주세요. 제가 가장 저렴한 방법을 찾아 드리고, 쉽게 설명해 드리고, 가족이 사기를 당하지 않게 지켜 드릴게요. 그리고 허락 없이는 단 한 푼도 옮기지 않아요.",
      "starterSend": "고향에 송금하기",
      "starterCompare": "비용 비교하기",
      "starterTrack": "내 돈 어디까지 갔나요?",
      "starterSafe": "안전하게 지키기",
      "footer": "데모 전용 · 모든 송금은 가상입니다 · 환율은 예시입니다"
    },
    "zh": {
      "heroBadge": "模拟演示",
      "heroTitle": "把钱寄回家,",
      "heroTitleEm": "不再担心。",
      "heroIntro": "用你自己的语言跟我说话就行。我会帮你找最省钱的方式,把每件事讲清楚,保护你的家人不被骗,没有你的同意,我一分钱也不会动。",
      "starterSend": "把钱寄回家",
      "starterCompare": "比一比费用",
      "starterTrack": "我的钱到哪了?",
      "starterSafe": "安心防骗",
      "footer": "仅为演示 · 所有转账均为模拟 · 汇率仅供参考"
    },
    "ja": {
      "heroBadge": "デモ体験版",
      "heroTitle": "家族へ、お金を送ろう。",
      "heroTitleEm": "心配は、いりません。",
      "heroIntro": "あなたの言葉で話しかけてください。いちばん安く送れる方法を見つけて、わかりやすく説明します。ご家族を詐欺から守り、あなたの許可なしに1ウォンたりとも動かしません。",
      "starterSend": "家族にお金を送る",
      "starterCompare": "手数料をくらべる",
      "starterTrack": "送ったお金、どこ?",
      "starterSafe": "安全に使う",
      "footer": "デモ版です · 送金はすべて仮のものです · レートは目安です"
    },
    "es": {
      "heroBadge": "demostración simulada",
      "heroTitle": "Envía dinero a casa,",
      "heroTitleEm": "sin preocupaciones.",
      "heroIntro": "Háblame en tu idioma. Yo busco la forma más barata, te lo explico con palabras sencillas, protejo a tu familia de las estafas y nunca muevo ni un peso sin tu permiso.",
      "starterSend": "Enviar dinero a casa",
      "starterCompare": "Comparar costos",
      "starterTrack": "¿Dónde está mi dinero?",
      "starterSafe": "Mantente a salvo",
      "footer": "Solo demostración · todas las transferencias son simuladas · las tarifas son de ejemplo"
    },
    "fr": {
      "heroBadge": "démo simulée",
      "heroTitle": "Envoie de l'argent chez toi,",
      "heroTitleEm": "sans le souci.",
      "heroIntro": "Parle-moi dans ta langue. Je trouve le moyen le moins cher, je t'explique tout simplement, je protège ta famille des arnaques, et je ne touche jamais au moindre won sans ton accord.",
      "starterSend": "Envoyer de l'argent chez moi",
      "starterCompare": "Comparer les frais",
      "starterTrack": "Où est mon argent ?",
      "starterSafe": "Rester en sécurité",
      "footer": "Démo uniquement · tous les transferts sont simulés · les taux sont donnés à titre indicatif"
    },
    "pt": {
      "heroBadge": "demonstração simulada",
      "heroTitle": "Mande dinheiro pra casa,",
      "heroTitleEm": "sem preocupação.",
      "heroIntro": "Fale comigo no seu idioma. Eu acho o jeito mais barato, explico tudo de um jeito simples, protejo sua família contra golpes e nunca movo um won sem você autorizar.",
      "starterSend": "Mandar dinheiro pra casa",
      "starterCompare": "Comparar os custos",
      "starterTrack": "Cadê o meu dinheiro?",
      "starterSafe": "Ficar em segurança",
      "footer": "Apenas demonstração · todas as transferências são simuladas · as taxas são ilustrativas"
    },
    "de": {
      "heroBadge": "simulierte Demo",
      "heroTitle": "Schick Geld nach Hause,",
      "heroTitleEm": "ganz ohne Sorgen.",
      "heroIntro": "Sprich mit mir in deiner Sprache. Ich finde den günstigsten Weg, erkläre dir alles ganz einfach, schütze deine Familie vor Betrug und bewege keinen einzigen Won ohne deine Zustimmung.",
      "starterSend": "Geld nach Hause schicken",
      "starterCompare": "Kosten vergleichen",
      "starterTrack": "Wo ist mein Geld?",
      "starterSafe": "Sicher bleiben",
      "footer": "Nur eine Demo · alle Überweisungen sind simuliert · Kurse dienen nur als Beispiel"
    },
    "ru": {
      "heroBadge": "демо-режим",
      "heroTitle": "Отправляйте деньги домой",
      "heroTitleEm": "без лишних тревог.",
      "heroIntro": "Говорите со мной на своём родном языке. Я найду самый дешёвый способ, объясню всё простыми словами, защищу вашу семью от мошенников и не переведу ни копейки без вашего согласия.",
      "starterSend": "Отправить деньги домой",
      "starterCompare": "Сравнить расходы",
      "starterTrack": "Где мои деньги?",
      "starterSafe": "Защитить себя",
      "footer": "Только демо · все переводы смоделированы · курсы показаны для примера"
    },
    "ar": {
      "heroBadge": "نسخة تجريبية للعرض",
      "heroTitle": "أرسل المال إلى أهلك،",
      "heroTitleEm": "وأنت مطمئن البال.",
      "heroIntro": "تكلّم معي بلغتك. سأجد لك أرخص طريقة، وأشرح لك كل شيء ببساطة، وأحمي أهلك من النصب، ولن أحرّك ولا قرشاً واحداً إلا بإذنك.",
      "starterSend": "أرسل المال إلى أهلك",
      "starterCompare": "قارن التكاليف",
      "starterTrack": "وين وصلت فلوسي؟",
      "starterSafe": "ابقَ في أمان",
      "footer": "عرض تجريبي فقط · جميع التحويلات وهمية · الأسعار للتوضيح فقط"
    },
    "hi": {
      "heroBadge": "डेमो (नमूना)",
      "heroTitle": "घर पैसे भेजिए,",
      "heroTitleEm": "बिना किसी चिंता के।",
      "heroIntro": "मुझसे अपनी भाषा में बात कीजिए। मैं सबसे सस्ता तरीका ढूँढूँगा, आसान शब्दों में समझाऊँगा, आपके परिवार को धोखाधड़ी से बचाऊँगा, और आपकी इजाज़त के बिना एक रुपया भी नहीं भेजूँगा।",
      "starterSend": "घर पैसे भेजें",
      "starterCompare": "खर्च की तुलना करें",
      "starterTrack": "मेरा पैसा कहाँ है?",
      "starterSafe": "सुरक्षित रहें",
      "footer": "सिर्फ़ डेमो · सभी लेन-देन नकली हैं · दरें सिर्फ़ उदाहरण के लिए हैं"
    },
    "vi": {
      "heroBadge": "bản demo mô phỏng",
      "heroTitle": "Gửi tiền về nhà,",
      "heroTitleEm": "không còn lo lắng.",
      "heroIntro": "Cứ nói chuyện với tôi bằng tiếng của bạn. Tôi sẽ tìm cách gửi rẻ nhất, giải thích thật dễ hiểu, bảo vệ gia đình bạn khỏi kẻ lừa đảo, và sẽ không bao giờ chuyển một đồng nào khi chưa được bạn cho phép.",
      "starterSend": "Gửi tiền về nhà",
      "starterCompare": "So sánh chi phí",
      "starterTrack": "Tiền của tôi đến đâu rồi?",
      "starterSafe": "Giữ an toàn",
      "footer": "Chỉ là bản demo · mọi giao dịch đều là mô phỏng · tỷ giá chỉ mang tính minh họa"
    },
    "id": {
      "heroBadge": "demo simulasi",
      "heroTitle": "Kirim uang ke kampung halaman,",
      "heroTitleEm": "tanpa rasa khawatir.",
      "heroIntro": "Ngobrol saja dengan saya pakai bahasamu sendiri. Saya akan cari cara yang paling murah, menjelaskannya dengan sederhana, melindungi keluargamu dari penipuan, dan tidak akan memindahkan uangmu sepeser pun tanpa izinmu.",
      "starterSend": "Kirim uang ke rumah",
      "starterCompare": "Bandingkan biaya",
      "starterTrack": "Mana uang saya?",
      "starterSafe": "Tetap aman",
      "footer": "Hanya demo · semua transfer disimulasikan · kurs hanya sebagai contoh"
    },
    "it": {
      "heroBadge": "demo simulata",
      "heroTitle": "Manda i soldi a casa,",
      "heroTitleEm": "senza pensieri.",
      "heroIntro": "Parlami nella tua lingua. Troverò il modo più economico, te lo spiegherò in modo semplice, proteggerò la tua famiglia dalle truffe e non sposterò mai un centesimo senza il tuo permesso.",
      "starterSend": "Manda i soldi a casa",
      "starterCompare": "Confronta i costi",
      "starterTrack": "Dove sono i miei soldi?",
      "starterSafe": "Resta al sicuro",
      "footer": "Solo demo · tutti i trasferimenti sono simulati · le tariffe sono indicative"
    },
    "tr": {
      "heroBadge": "simülasyon demosu",
      "heroTitle": "Eve para gönder,",
      "heroTitleEm": "hiç endişelenmeden.",
      "heroIntro": "Benimle kendi dilinde konuş. En ucuz yolu bulurum, sana sade bir şekilde anlatırım, aileni dolandırıcılardan korurum ve sen izin vermeden tek kuruş bile aktarmam.",
      "starterSend": "Eve para gönder",
      "starterCompare": "Masrafları karşılaştır",
      "starterTrack": "Param nerede?",
      "starterSafe": "Güvende kal",
      "footer": "Sadece demo · tüm transferler simülasyondur · oranlar örnek amaçlıdır"
    },
    "tl": {
      "heroBadge": "demo lang ito",
      "heroTitle": "Magpadala ng pera sa pamilya,",
      "heroTitleEm": "nang walang aalalahanin.",
      "heroIntro": "Kausapin mo ako sa sarili mong wika. Hahanapin ko ang pinakamurang paraan, ipapaliwanag ko nang simple, iingatan ko ang pamilya mo sa mga manloloko, at hindi ako gagalaw ng kahit kapiranggot na pera nang wala kang pahintulot.",
      "starterSend": "Magpadala ng pera sa pamilya",
      "starterCompare": "Ihambing ang mga gastos",
      "starterTrack": "Nasaan na ang pera ko?",
      "starterSafe": "Manatiling ligtas",
      "footer": "Demo lang ito · pawang simulasyon ang lahat ng padala · halimbawa lang ang mga halaga"
    },
    "sw": {
      "heroBadge": "onyesho la mfano",
      "heroTitle": "Tuma pesa nyumbani,",
      "heroTitleEm": "bila wasiwasi.",
      "heroIntro": "Ongea nami kwa lugha yako. Nitatafuta njia ya bei nafuu zaidi, nikueleze kwa urahisi, nilinde familia yako dhidi ya walaghai, na sitatoa hata senti moja bila ruhusa yako.",
      "starterSend": "Tuma pesa nyumbani",
      "starterCompare": "Linganisha gharama",
      "starterTrack": "Pesa zangu ziko wapi?",
      "starterSafe": "Kaa salama",
      "footer": "Onyesho tu · miamala yote ni ya mfano · viwango ni vya mfano"
    }
  };
  for (const __c in SHELL) if (L[__c]) Object.assign(L[__c], SHELL[__c]);

  let current = "en";
  function setLang(code) { current = byCode[code] ? code : "en"; return current; }
  function getLang() { return current; }

  function t(key, vars) {
    const dict = L[current] || L.en;
    let s = (dict && dict[key] != null) ? dict[key] : L.en[key];
    if (s == null) return key;
    if (vars) for (const k in vars) s = s.replace("{" + k + "}", vars[k]);
    return s;
  }

  window.I18N = {
    detect,
    setLang,
    getLang,
    t,
    native: (c) => (byCode[c] ? byCode[c].native : c),
    name: (c) => ({ en: "English", ko: "Korean", zh: "Chinese", ja: "Japanese", es: "Spanish", fr: "French", pt: "Portuguese", de: "German", ru: "Russian", ar: "Arabic", hi: "Hindi", vi: "Vietnamese", id: "Indonesian", it: "Italian", tr: "Turkish", tl: "Filipino", sw: "Swahili", yo: "Yoruba", ig: "Igbo", ha: "Hausa", th: "Thai", bn: "Bengali", ne: "Nepali", ur: "Urdu", km: "Khmer", my: "Burmese" }[c] || c),
    bcp47: (c) => (byCode[c] ? byCode[c].bcp47 : "en-US"),
    isRTL: (c) => Boolean(byCode[c] && byCode[c].rtl),
    uiLocalized: (c) => Boolean(L[c]),
    languages: LANGS,
  };
})();
