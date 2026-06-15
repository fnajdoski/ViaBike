import type { MessageKey } from "./en";

/** Macedonian (Cyrillic). Brand wordmark stays Latin (brand names untranslated). */
export const mk: Record<MessageKey, string> = {
  "app.subtitle": "Планер за трошоци и застанувања за мотоциклисти",

  "lang.label": "Јазик",
  "lang.en": "English",
  "lang.mk": "Македонски",

  "unit.l": "Л",
  "unit.lper100": "Л/100км",
  "unit.km": "км",

  "picker.step1": "Чекор 1",
  "picker.title": "ИЗБЕРИ МОТОР",
  "picker.intro":
    "Дометот и трошоците се пресметуваат според твојот мотор — капацитет на резервоарот и реална потрошувачка, не фабричката бројка.",
  "picker.search": "Пребарај марка или модел…",
  "picker.rangeSuffix": "км домет",
  "picker.noMatch": "Нема резултат — додавањето мотор е измена од една линија во data/bikes.ts.",

  "hero.solo": "Соло",
  "hero.loaded": "Натоварен — багаж + патник (+10%)",
  "hero.changeBike": "Смени мотор",
  "hero.figures": "Податоци: {note}",

  "stat.tank": "Резервоар",
  "stat.consumption": "Потрошувачка",
  "stat.range": "Домет",
  "stat.distance": "Растојание",
  "stat.estTime": "Време (проц.)",
  "stat.estCost": "Трошок (проц.)",
  "stat.tankSub": "{liters} Л употребливо (90%)",
  "stat.consLoaded": "натоварен +10%",
  "stat.consSolo": "соло",
  "stat.rangeSub": "на употреблив резервоар",
  "stat.timeSub": "време на возење, без застанувања",
  "stat.costSub": "проценка — види разбивка",

  "planner.route": "Рута",
  "planner.loadDemo": "Вчитај демо: Скопје → Милано → Цирих",
  "planner.start": "Почеток — внеси место…",
  "planner.destination": "Дестинација",
  "planner.via": "Преку",
  "planner.searchPlace": "Пребарај место",
  "planner.noMatches": "Нема совпаѓања",
  "loc.use": "Користи ја мојата локација",
  "loc.locating": "Лоцирам…",
  "loc.myLocation": "Моја локација",
  "loc.denied": "Пристапот до локација е одбиен — внеси место рачно",
  "loc.error": "Не успеав да ја добијам локацијата — внеси место рачно",
  "planner.addWaypoint": "+ Додај точка",
  "planner.restStops": "Застанувања за одмор",
  "planner.byDistance": "По растојание",
  "planner.byTime": "По време",
  "planner.noStops": "Без застанувања",
  "planner.custom": "сопствено",
  "planner.restNote":
    "Застанувањата се препорачуваат само до ≤ 2 км од рутата — без големи отстапувања. Застанувањата за гориво се планираат одделно според твојот домет (полнење на 85%).",
  "planner.noStopsNote":
    "Застанувањата за одмор се исклучени — сепак ќе добиеш застанувања за гориво според твојот домет (за да не останеш без гориво).",
  "planner.planTrip": "Испланирај пат",
  "planner.planning": "Планирам…",
  "planner.offlineDisabled": "Планирање нова рута бара интернет — офлајн си.",
  "planner.lastSaved": "Последен план зачуван {date}",
  "planner.lastSavedSub": "испланирај повторно за тековни цени",
  "planner.replan": "Повторно",
  "planner.openInMaps": "Отвори во Google Maps",
  "export.gpx": "Преземи GPX",
  "export.includeFuel": "Вклучи застанувања за гориво",
  "export.includeRest": "Вклучи застанувања за одмор",
  "export.capped":
    "Google Maps собира ~{max} застанувања по линк — вклучени се твојата рута + {fuelInc}/{fuelTot} гориво и {restInc}/{restTot} одмор. Преземи GPX за сите застанувања.",
  "planner.savedTrips": "Зачувани патувања",
  "planner.tripName": "Име на патување…",
  "planner.save": "Зачувај",

  "planStep.starting": "Започнувам…",
  "planStep.routing": "Рутирам…",
  "planStep.findingStops": "Барам бензиски и места за одмор по рутата…",
  "planStep.costs": "Пресметувам трошоци…",

  "error.noBike": "Прво избери мотор.",
  "error.needTwoPoints": "Постави барем почеток и дестинација (пребарај или кликни на мапата).",

  "map.hint": "Кликни на мапата за да додадеш точки · влечи ги маркерите за да наместиш",

  "stops.fuelTitle": "Застанувања за гориво",
  "stops.fuelSub": "(полнење на 85% од дометот)",
  "stops.restTitle": "Застанувања за одмор",
  "stops.restEvery": "(на секои ~{km} км)",
  "stops.fuelNone": "Не е потребно — целиот пат собира во еден резервоар. 🎉",
  "stops.restNone": "Патот е пократок од еден интервал за одмор.",
  "stops.restOff": "Застанувањата за одмор се исклучени за овој пат — застанувањата за гориво подолу се според твојот домет.",
  "stops.recommendOnly": "Само препораки — v1 никогаш не ја преуредува рутата според застанувањата.",
  "stops.km": "км {km}",
  "stops.noPoi": "Нема пронајдено место тука",
  "stops.fuelUnnamed": "Бензиска (без име)",
  "stops.restUnnamed": "Место за одмор (без име)",
  "stops.detour": "отстапување {km} км",
  "stops.targetWas": "целта беше км {km}",
  "stops.doublesFuel": "служи и како застанување за гориво",

  "stopNote.fuelFallbackEarly":
    "Нема бензиска блиску до идеалната точка — застанување порано (подобро порано отколку без гориво).",
  "stopNote.fuelNone": "Нема пронајдена бензиска во рамки на дозволеното отстапување — испланирај го полнењето рачно.",
  "stopNote.restCombined": "Комбинирано со застанувањето за гориво тука.",
  "stopNote.restNone": "Нема место за одмор во рамки на дозволеното отстапување околу оваа точка.",

  "cost.title": "ТРОШОК ЗА ПАТ",
  "cost.estimate": "проценка",
  "cost.fuelHeading": "Гориво — цена по земја",
  "cost.fuelTotal": "Вкупно гориво",
  "cost.pricesLine": "Цени {date} · извор: {source}.",
  "cost.crosscheckAgree": "Проверка со TollGuru: {amount} — се совпаѓа во рамки на 25%.",
  "cost.crosscheckOff": "Проверка со TollGuru: {amount} — голема разлика, провери ја потрошувачката/цените.",
  "cost.tollsHeading": "Патарини — класа мотоцикл",
  "cost.tollsNone": "Нема патарински патишта на оваа рута.",
  "cost.tollsTotal": "Вкупно патарини",
  "cost.tollsTollguru": "Точни наплатни рампи од TollGuru, класа мотоцикл.",
  "cost.tollsEstimate": "Проценето само според патаринско растојание ({date}) — додај TollGuru клуч за точни рампи.",
  "cost.vignettesHeading": "Винети и пропусници — еднократно, не по пат",
  "cost.vignettesNone": "Нема земји со винета на оваа рута.",
  "cost.vignetteFree": "бесплатно",
  "cost.extrasHeading": "Дополнително (траекти, паркинг, храна…)",
  "cost.extraExample": "пр. Траект",
  "cost.add": "Додај",
  "cost.disclaimer":
    "⚠️ Сè тука е проценка — провери пред да се потпреш на тоа. Валутата е во ЕУР (курсеви {date}); износите во друга валута го прикажуваат оригиналот каде што е познато. Винетите се пропусници со фиксен период, наведени еднаш — не се трошок по пат.",
  "cost.fuelDataLabel": "Извор на цени за гориво:",

  "warn.demoRouting":
    "Рутирањето го користеше јавниот OSRM демо сервер (без ORS клуч) — добро за планирање, но со ограничувања.",
  "warn.stopLookupFailed": "Барањето места не успеа — маркерите за гориво/одмор покажуваат само идеални точки.",
  "warn.fuelPriceFallback": "Барањето цени за гориво не успеа — се користи вградената резервна табела.",
  "warn.tollEstimate": "Патарините се груба проценка (без TollGuru клуч) — провери пред да се потпреш.",

  "offline.banner":
    "Офлајн си — прикажани се зачувани податоци. Цените за гориво и патарини последно ажурирани {date}. Планирање нова рута бара интернет.",

  "install.title": "Инсталирај RideCost",
  "install.subtitle": "Додај го на уредот за цел екран и пристап со еден допир.",
  "install.ios": "Додај RideCost на почетниот екран — допри ја иконата Сподели, па „Додај на почетен екран“.",
  "install.button": "Инсталирај",
  "install.dismiss": "Затвори",

  "offlinePage.title": "Офлајн си.",
  "offlinePage.body":
    "RideCost бара интернет за рутирање во живо, цени за гориво и пребарување места — поврзи се и освежи за да планираш пат. Зачуваните патувања и последната сесија се сè уште на уредот.",
};
