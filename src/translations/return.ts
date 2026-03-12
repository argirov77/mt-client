import type { Lang } from "@/components/common/LanguageProvider";

export const dateLocaleMap: Record<Lang, string> = {
  ru: "ru-RU",
  bg: "bg-BG",
  en: "en-US",
  ua: "uk-UA",
};

type ReturnPageCopy = {
  checkingTitle: string;
  checkingPayment: string;
  awaitingConfirmation: string;
  attemptCounter: (current: number, max: number) => string;

  paymentSuccess: string;
  ticketsReady: string;

  passengerCount: (n: number) => string;
  ticketCount: (n: number) => string;
  roundTrip: string;

  route: string;
  date: string;
  from: string;
  to: string;
  passengers: string;
  outbound: string;
  returnDir: string;
  seat: string;
  defaultPassengerName: string;

  downloadAllTickets: (count: number) => string;
  downloadingTickets: string;
  downloadError: string;
  noEmailWarning: string;

  paidNoDetailsMessage: string;

  paymentProcessing: string;
  pendingTimeoutMessage: string;

  paymentError: string;
  failedMessage: string;
  orderNotFound: string;
  httpError: (status: number) => string;

  goHome: string;
  retryPayment: string;
};

function slavicPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

export const returnTranslations: Record<Lang, ReturnPageCopy> = {
  ru: {
    checkingTitle: "Возврат после оплаты",
    checkingPayment: "Проверяем оплату…",
    awaitingConfirmation: "Ожидаем подтверждение платежа…",
    attemptCounter: (c, m) => `Попытка ${c} / ${m}`,

    paymentSuccess: "Оплата прошла успешно!",
    ticketsReady: "Ваши билеты готовы. Копия также будет отправлена вам на email.",

    passengerCount: (n) => slavicPlural(n, "пассажир", "пассажира", "пассажиров"),
    ticketCount: (n) => slavicPlural(n, "билет", "билета", "билетов"),
    roundTrip: "туда и обратно",

    route: "Маршрут",
    date: "Дата",
    from: "Откуда",
    to: "Куда",
    passengers: "Пассажиры",
    outbound: "Туда",
    returnDir: "Обратно",
    seat: "место",
    defaultPassengerName: "Пассажир",

    downloadAllTickets: (n) => `Скачать все билеты (${n} PDF)`,
    downloadingTickets: "Загрузка билетов…",
    downloadError: "Не удалось скачать некоторые билеты. Попробуйте позже.",
    noEmailWarning: "Email не указан — скачивание недоступно",

    paidNoDetailsMessage:
      "Билеты будут отправлены на ваш email. Если вы не получите их в течение нескольких минут, проверьте папку «Спам» или обратитесь в поддержку.",

    paymentProcessing: "Оплата обрабатывается",
    pendingTimeoutMessage:
      "Подтверждение от платёжной системы ещё не пришло. Билеты будут отправлены на ваш email, как только оплата будет подтверждена.",

    paymentError: "Ошибка оплаты",
    failedMessage: "Платёж отклонён или отменён. Попробуйте оплатить ещё раз.",
    orderNotFound: "Не удалось определить номер заказа.",
    httpError: (s) => `Ошибка запроса (HTTP ${s}). Попробуйте позже или обратитесь в поддержку.`,

    goHome: "На главную",
    retryPayment: "Вернуться к оформлению",
  },

  en: {
    checkingTitle: "Returning after payment",
    checkingPayment: "Verifying payment…",
    awaitingConfirmation: "Waiting for payment confirmation…",
    attemptCounter: (c, m) => `Attempt ${c} / ${m}`,

    paymentSuccess: "Payment successful!",
    ticketsReady: "Your tickets are ready. A copy will also be sent to your email.",

    passengerCount: (n) => `${n} passenger${n === 1 ? "" : "s"}`,
    ticketCount: (n) => `${n} ticket${n === 1 ? "" : "s"}`,
    roundTrip: "round trip",

    route: "Route",
    date: "Date",
    from: "From",
    to: "To",
    passengers: "Passengers",
    outbound: "Outbound",
    returnDir: "Return",
    seat: "seat",
    defaultPassengerName: "Passenger",

    downloadAllTickets: (n) => `Download all tickets (${n} PDF)`,
    downloadingTickets: "Downloading tickets…",
    downloadError: "Failed to download some tickets. Please try again later.",
    noEmailWarning: "No email provided — download unavailable",

    paidNoDetailsMessage:
      "Tickets will be sent to your email. If you don't receive them within a few minutes, check your Spam folder or contact support.",

    paymentProcessing: "Payment is being processed",
    pendingTimeoutMessage:
      "Confirmation from the payment system has not arrived yet. Tickets will be sent to your email once the payment is confirmed.",

    paymentError: "Payment error",
    failedMessage: "Payment was declined or cancelled. Please try again.",
    orderNotFound: "Could not determine the order number.",
    httpError: (s) => `Request error (HTTP ${s}). Please try again later or contact support.`,

    goHome: "Go to home page",
    retryPayment: "Back to checkout",
  },

  bg: {
    checkingTitle: "Връщане след плащане",
    checkingPayment: "Проверяваме плащането…",
    awaitingConfirmation: "Очакваме потвърждение на плащането…",
    attemptCounter: (c, m) => `Опит ${c} / ${m}`,

    paymentSuccess: "Плащането е успешно!",
    ticketsReady: "Вашите билети са готови. Копие ще бъде изпратено и на вашия имейл.",

    passengerCount: (n) => `${n} ${n === 1 ? "пътник" : "пътници"}`,
    ticketCount: (n) => `${n} ${n === 1 ? "билет" : "билета"}`,
    roundTrip: "двупосочно",

    route: "Маршрут",
    date: "Дата",
    from: "Откъде",
    to: "Накъде",
    passengers: "Пътници",
    outbound: "Отиване",
    returnDir: "Връщане",
    seat: "място",
    defaultPassengerName: "Пътник",

    downloadAllTickets: (n) => `Изтегли всички билети (${n} PDF)`,
    downloadingTickets: "Изтегляне на билети…",
    downloadError: "Неуспешно изтегляне на някои билети. Моля, опитайте по-късно.",
    noEmailWarning: "Имейлът не е посочен — изтеглянето не е възможно",

    paidNoDetailsMessage:
      "Билетите ще бъдат изпратени на вашия имейл. Ако не ги получите в рамките на няколко минути, проверете папка \u201EСпам\u201C или се свържете с поддръжката.",

    paymentProcessing: "Плащането се обработва",
    pendingTimeoutMessage:
      "Потвърждението от платежната система все още не е пристигнало. Билетите ще бъдат изпратени на вашия имейл, когато плащането бъде потвърдено.",

    paymentError: "Грешка при плащане",
    failedMessage: "Плащането е отхвърлено или отменено. Моля, опитайте отново.",
    orderNotFound: "Не може да се определи номерът на поръчката.",
    httpError: (s) => `Грешка в заявката (HTTP ${s}). Моля, опитайте по-късно или се свържете с поддръжката.`,

    goHome: "Към началната страница",
    retryPayment: "Обратно към плащане",
  },

  ua: {
    checkingTitle: "Повернення після оплати",
    checkingPayment: "Перевіряємо оплату…",
    awaitingConfirmation: "Очікуємо підтвердження платежу…",
    attemptCounter: (c, m) => `Спроба ${c} / ${m}`,

    paymentSuccess: "Оплата пройшла успішно!",
    ticketsReady: "Ваші квитки готові. Копія також буде надіслана на ваш email.",

    passengerCount: (n) => slavicPlural(n, "пасажир", "пасажири", "пасажирів"),
    ticketCount: (n) => slavicPlural(n, "квиток", "квитки", "квитків"),
    roundTrip: "туди і назад",

    route: "Маршрут",
    date: "Дата",
    from: "Звідки",
    to: "Куди",
    passengers: "Пасажири",
    outbound: "Туди",
    returnDir: "Назад",
    seat: "місце",
    defaultPassengerName: "Пасажир",

    downloadAllTickets: (n) => `Завантажити всі квитки (${n} PDF)`,
    downloadingTickets: "Завантаження квитків…",
    downloadError: "Не вдалося завантажити деякі квитки. Спробуйте пізніше.",
    noEmailWarning: "Email не вказано — завантаження недоступне",

    paidNoDetailsMessage:
      "Квитки будуть надіслані на ваш email. Якщо ви не отримаєте їх протягом кількох хвилин, перевірте папку «Спам» або зверніться до підтримки.",

    paymentProcessing: "Оплата обробляється",
    pendingTimeoutMessage:
      "Підтвердження від платіжної системи ще не надійшло. Квитки будуть надіслані на ваш email, щойно оплату буде підтверджено.",

    paymentError: "Помилка оплати",
    failedMessage: "Платіж відхилено або скасовано. Спробуйте оплатити ще раз.",
    orderNotFound: "Не вдалося визначити номер замовлення.",
    httpError: (s) => `Помилка запиту (HTTP ${s}). Спробуйте пізніше або зверніться до підтримки.`,

    goHome: "На головну",
    retryPayment: "Повернутися до оформлення",
  },
};
