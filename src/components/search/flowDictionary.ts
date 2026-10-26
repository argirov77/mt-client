import type { Lang } from "./types";

// Тексты обновлённого пути покупки (подсказки, нижняя панель, схема мест,
// экран после брони). Сливаются со словарём searchDictionary.

type Leg = "outbound" | "return";

export type FlowDict = {
  change: string;
  otherDates: string;
  yourTrip: string;
  passengersSummary: (adults: number, children: number) => string;
  totalPassengers: (count: number) => string;
  nextStep2: string;
  nextStep3: string;
  tripKindOneway: string;
  tripKindRoundtrip: string;
  tripKindOpen: string;
  returnDiscountShort: string;

  seatsTitle: string;
  seatsAdjacent: string;
  amenitiesLabel: string;
  amenitiesList: string;
  changeOnMap: string;
  chooseOnMap: string;
  passengerKindAdult: string;
  passengerKindChild: string;
  missingSeats: (leg: Leg, selected: number, total: number) => string;
  missingName: (index: number) => string;
  seatWindow: string;
  seatAisle: string;
  seatsAutoPicked: string;
  seatPickFor: (index: number) => string;
  seatsFull: (count: number) => string;
  yourSeats: string;
  seatNotChosen: string;
  legendFree: string;
  legendSelected: string;
  legendTaken: string;
  nextReturnSeats: string;
  done: string;
  seatsLoading: string;
  seatLabel: (seat: number | string) => string;

  phoneHint: string;
  emailHint: string;
  phoneRequired: string;
  phoneInvalid: (dialCode: string, digits: number | null) => string;
  emailRequired: string;
  emailInvalid: string;
  baggageIncludedShort: string;
  addBaggageShort: string;
  payByCard: (sum: string) => string;
  bookWithoutPay: string;
  bookingNote: string;

  bookedTitle: string;
  orderNo: (id: string | number, date: string) => string;
  seatsList: (seats: number[]) => string;
  toPay: string;
  bookedPayNote: string;
  downloadPdf: string;
  openReturnLeg: string;

  errChooseTrips: string;
  errChooseSeats: string;
  errFillNames: string;
  msgPurchasing: string;
  msgBooking: string;
  msgRedirect: string;
  errNoBooking: string;
  errDownloadData: string;
};

const ruPlural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const joinAnd = (items: Array<string | number>, and: string) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;

export const flowDict: Record<Lang, FlowDict> = {
  ru: {
    change: "Изменить",
    otherDates: "Другие даты",
    yourTrip: "Ваша поездка",
    passengersSummary: (a, d) =>
      [
        a ? `${a} ${ruPlural(a, "взрослый", "взрослых", "взрослых")}` : "",
        d ? `${d} ${ruPlural(d, "детский", "детских", "детских")}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    totalPassengers: (n) => `Итого, ${n} ${ruPlural(n, "пассажир", "пассажира", "пассажиров")}`,
    nextStep2: "Далее: места и пассажиры",
    nextStep3: "Далее: контакты и оплата",
    tripKindOneway: "в одну сторону",
    tripKindRoundtrip: "туда-обратно",
    tripKindOpen: "туда-обратно, обратно с открытой датой",
    returnDiscountShort: "−10% на обратный билет",

    seatsTitle: "Места",
    seatsAdjacent: "рядом",
    amenitiesLabel: "В автобусе",
    amenitiesList: "Wi-Fi, туалет, климат-контроль, розетки, откидные сиденья",
    changeOnMap: "Изменить на схеме",
    chooseOnMap: "Выбрать на схеме",
    passengerKindAdult: "взрослый",
    passengerKindChild: "детский",
    missingSeats: (leg, s, t) => `Выберите места ${leg === "return" ? "обратно" : "туда"}: ${s} из ${t}`,
    missingName: (i) => `Заполните имя пассажира ${i}`,
    seatWindow: "у окна",
    seatAisle: "у прохода",
    seatsAutoPicked: "Подобрали места рядом. Чтобы поменять — нажмите на своё синее место, потом на зелёное.",
    seatPickFor: (i) => `Нажмите на зелёное место для пассажира ${i}. Синее — чтобы освободить.`,
    seatsFull: (n) => `Уже выбрано ${n} из ${n} — нажмите на синее, чтобы освободить`,
    yourSeats: "Ваши места",
    seatNotChosen: "место не выбрано",
    legendFree: "свободно",
    legendSelected: "ваше место",
    legendTaken: "недоступно",
    nextReturnSeats: "Места обратно →",
    done: "Готово",
    seatsLoading: "Подбираем места…",
    seatLabel: (seat) => `место ${seat}`,

    phoneHint: "Для связи по поездке",
    emailHint: "Сюда придут билеты и чек",
    phoneRequired: "Укажите номер телефона",
    phoneInvalid: (code, digits) =>
      digits ? `Проверьте номер: после ${code} должно быть ${digits} цифр` : "Проверьте номер телефона",
    emailRequired: "Укажите email — на него придут билеты",
    emailInvalid: "Введите email в формате name@example.com",
    baggageIncludedShort: "В билете: ручная кладь 7 кг и чемодан 10–20 кг",
    addBaggageShort: "+ багаж, +10%",
    payByCard: (sum) => `Оплатить картой · ${sum}`,
    bookWithoutPay: "Забронировать без оплаты",
    bookingNote: "Бронь бесплатная, оплата онлайн или при посадке",

    bookedTitle: "Места забронированы",
    orderNo: (id, date) => `Заказ № ${id} · ${date}`,
    seatsList: (seats) => (seats.length === 1 ? `Место ${seats[0]}` : `Места ${joinAnd(seats, "и")}`),
    toPay: "К оплате",
    bookedPayNote: "Оплатить можно картой сейчас или при посадке.",
    downloadPdf: "Скачать билет (PDF)",
    openReturnLeg: "Обратно — открытая дата",

    errChooseTrips: "Сначала выберите рейсы",
    errChooseSeats: "Выберите нужное количество мест",
    errFillNames: "Заполните имена пассажиров",
    msgPurchasing: "Покупка…",
    msgBooking: "Бронирование…",
    msgRedirect: "Перенаправляем на страницу оплаты…",
    errNoBooking: "Нет бронирования для оплаты",
    errDownloadData: "Не хватает данных для скачивания билета",
  },
  ua: {
    change: "Змінити",
    otherDates: "Інші дати",
    yourTrip: "Ваша поїздка",
    passengersSummary: (a, d) =>
      [
        a ? `${a} ${ruPlural(a, "дорослий", "дорослих", "дорослих")}` : "",
        d ? `${d} ${ruPlural(d, "дитячий", "дитячих", "дитячих")}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    totalPassengers: (n) => `Разом, ${n} ${ruPlural(n, "пасажир", "пасажири", "пасажирів")}`,
    nextStep2: "Далі: місця та пасажири",
    nextStep3: "Далі: контакти та оплата",
    tripKindOneway: "в один бік",
    tripKindRoundtrip: "туди й назад",
    tripKindOpen: "туди й назад, назад з відкритою датою",
    returnDiscountShort: "−10% на зворотний квиток",

    seatsTitle: "Місця",
    seatsAdjacent: "поруч",
    amenitiesLabel: "В автобусі",
    amenitiesList: "Wi-Fi, туалет, клімат-контроль, розетки, відкидні сидіння",
    changeOnMap: "Змінити на схемі",
    chooseOnMap: "Обрати на схемі",
    passengerKindAdult: "дорослий",
    passengerKindChild: "дитячий",
    missingSeats: (leg, s, t) => `Оберіть місця ${leg === "return" ? "назад" : "туди"}: ${s} з ${t}`,
    missingName: (i) => `Заповніть ім'я пасажира ${i}`,
    seatWindow: "біля вікна",
    seatAisle: "біля проходу",
    seatsAutoPicked: "Підібрали місця поруч. Щоб змінити — натисніть на своє синє місце, потім на зелене.",
    seatPickFor: (i) => `Натисніть на зелене місце для пасажира ${i}. Синє — щоб звільнити.`,
    seatsFull: (n) => `Уже обрано ${n} з ${n} — натисніть на синє, щоб звільнити`,
    yourSeats: "Ваші місця",
    seatNotChosen: "місце не обрано",
    legendFree: "вільно",
    legendSelected: "ваше місце",
    legendTaken: "недоступно",
    nextReturnSeats: "Місця назад →",
    done: "Готово",
    seatsLoading: "Підбираємо місця…",
    seatLabel: (seat) => `місце ${seat}`,

    phoneHint: "Для зв'язку щодо поїздки",
    emailHint: "Сюди прийдуть квитки та чек",
    phoneRequired: "Вкажіть номер телефону",
    phoneInvalid: (code, digits) =>
      digits ? `Перевірте номер: після ${code} має бути ${digits} цифр` : "Перевірте номер телефону",
    emailRequired: "Вкажіть email — на нього прийдуть квитки",
    emailInvalid: "Введіть email у форматі name@example.com",
    baggageIncludedShort: "У квитку: ручна поклажа 7 кг і валіза 10–20 кг",
    addBaggageShort: "+ багаж, +10%",
    payByCard: (sum) => `Оплатити карткою · ${sum}`,
    bookWithoutPay: "Забронювати без оплати",
    bookingNote: "Бронювання безкоштовне, оплата онлайн або під час посадки",

    bookedTitle: "Місця заброньовано",
    orderNo: (id, date) => `Замовлення № ${id} · ${date}`,
    seatsList: (seats) => (seats.length === 1 ? `Місце ${seats[0]}` : `Місця ${joinAnd(seats, "і")}`),
    toPay: "До сплати",
    bookedPayNote: "Сплатити можна карткою зараз або під час посадки.",
    downloadPdf: "Завантажити квиток (PDF)",
    openReturnLeg: "Назад — відкрита дата",

    errChooseTrips: "Спочатку оберіть рейси",
    errChooseSeats: "Оберіть потрібну кількість місць",
    errFillNames: "Заповніть імена пасажирів",
    msgPurchasing: "Купівля…",
    msgBooking: "Бронювання…",
    msgRedirect: "Переходимо на сторінку оплати…",
    errNoBooking: "Немає бронювання для оплати",
    errDownloadData: "Бракує даних для завантаження квитка",
  },
  bg: {
    change: "Промени",
    otherDates: "Други дати",
    yourTrip: "Вашето пътуване",
    passengersSummary: (a, d) =>
      [
        a ? `${a} ${a === 1 ? "възрастен" : "възрастни"}` : "",
        d ? `${d} детски` : "",
      ]
        .filter(Boolean)
        .join(", "),
    totalPassengers: (n) => `Общо, ${n} ${n === 1 ? "пътник" : "пътници"}`,
    nextStep2: "Напред: места и пътници",
    nextStep3: "Напред: контакти и плащане",
    tripKindOneway: "в едната посока",
    tripKindRoundtrip: "отиване и връщане",
    tripKindOpen: "отиване и връщане, връщане с отворена дата",
    returnDiscountShort: "−10% за обратния билет",

    seatsTitle: "Места",
    seatsAdjacent: "едно до друго",
    amenitiesLabel: "В автобуса",
    amenitiesList: "Wi-Fi, тоалетна, климатик, контакти, накланящи се седалки",
    changeOnMap: "Промени на схемата",
    chooseOnMap: "Избери на схемата",
    passengerKindAdult: "възрастен",
    passengerKindChild: "детски",
    missingSeats: (leg, s, t) => `Изберете места ${leg === "return" ? "обратно" : "натам"}: ${s} от ${t}`,
    missingName: (i) => `Попълнете името на пътник ${i}`,
    seatWindow: "до прозореца",
    seatAisle: "до пътеката",
    seatsAutoPicked: "Избрахме места едно до друго. За промяна натиснете своето синьо място, после зелено.",
    seatPickFor: (i) => `Натиснете зелено място за пътник ${i}. Синьо — за освобождаване.`,
    seatsFull: (n) => `Вече са избрани ${n} от ${n} — натиснете синьо място, за да го освободите`,
    yourSeats: "Вашите места",
    seatNotChosen: "няма избрано място",
    legendFree: "свободно",
    legendSelected: "вашето място",
    legendTaken: "недостъпно",
    nextReturnSeats: "Места обратно →",
    done: "Готово",
    seatsLoading: "Избираме места…",
    seatLabel: (seat) => `място ${seat}`,

    phoneHint: "За връзка относно пътуването",
    emailHint: "Тук ще получите билетите и касовата бележка",
    phoneRequired: "Въведете телефонен номер",
    phoneInvalid: (code, digits) =>
      digits ? `Проверете номера: след ${code} трябва да има ${digits} цифри` : "Проверете телефонния номер",
    emailRequired: "Въведете имейл — на него ще получите билетите",
    emailInvalid: "Въведете имейл във формат name@example.com",
    baggageIncludedShort: "В билета: ръчен багаж 7 кг и куфар 10–20 кг",
    addBaggageShort: "+ багаж, +10%",
    payByCard: (sum) => `Плащане с карта · ${sum}`,
    bookWithoutPay: "Резервирай без плащане",
    bookingNote: "Резервацията е безплатна, плащане онлайн или при качване",

    bookedTitle: "Местата са резервирани",
    orderNo: (id, date) => `Поръчка № ${id} · ${date}`,
    seatsList: (seats) => (seats.length === 1 ? `Място ${seats[0]}` : `Места ${joinAnd(seats, "и")}`),
    toPay: "За плащане",
    bookedPayNote: "Можете да платите с карта сега или при качване.",
    downloadPdf: "Изтегли билета (PDF)",
    openReturnLeg: "Обратно — отворена дата",

    errChooseTrips: "Първо изберете курсове",
    errChooseSeats: "Изберете нужния брой места",
    errFillNames: "Попълнете имената на пътниците",
    msgPurchasing: "Покупка…",
    msgBooking: "Резервиране…",
    msgRedirect: "Пренасочваме към страницата за плащане…",
    errNoBooking: "Няма резервация за плащане",
    errDownloadData: "Липсват данни за изтегляне на билета",
  },
  en: {
    change: "Change",
    otherDates: "Other dates",
    yourTrip: "Your trip",
    passengersSummary: (a, d) =>
      [
        a ? `${a} ${a === 1 ? "adult" : "adults"}` : "",
        d ? `${d} ${d === 1 ? "child" : "children"}` : "",
      ]
        .filter(Boolean)
        .join(", "),
    totalPassengers: (n) => `Total, ${n} ${n === 1 ? "passenger" : "passengers"}`,
    nextStep2: "Next: seats and passengers",
    nextStep3: "Next: contacts and payment",
    tripKindOneway: "one way",
    tripKindRoundtrip: "round trip",
    tripKindOpen: "round trip, open-date return",
    returnDiscountShort: "−10% on the return ticket",

    seatsTitle: "Seats",
    seatsAdjacent: "together",
    amenitiesLabel: "On board",
    amenitiesList: "Wi-Fi, toilet, air conditioning, sockets, reclining seats",
    changeOnMap: "Change on the seat map",
    chooseOnMap: "Choose on the seat map",
    passengerKindAdult: "adult",
    passengerKindChild: "child",
    missingSeats: (leg, s, t) => `Choose ${leg === "return" ? "return" : "outbound"} seats: ${s} of ${t}`,
    missingName: (i) => `Enter the name of passenger ${i}`,
    seatWindow: "window",
    seatAisle: "aisle",
    seatsAutoPicked: "We picked seats together. To change, tap your blue seat, then a green one.",
    seatPickFor: (i) => `Tap a green seat for passenger ${i}. Tap a blue one to release it.`,
    seatsFull: (n) => `${n} of ${n} already chosen — tap a blue seat to release it`,
    yourSeats: "Your seats",
    seatNotChosen: "no seat yet",
    legendFree: "free",
    legendSelected: "your seat",
    legendTaken: "unavailable",
    nextReturnSeats: "Return seats →",
    done: "Done",
    seatsLoading: "Picking seats…",
    seatLabel: (seat) => `seat ${seat}`,

    phoneHint: "To contact you about the trip",
    emailHint: "Tickets and the receipt will be sent here",
    phoneRequired: "Enter a phone number",
    phoneInvalid: (code, digits) =>
      digits ? `Check the number: ${digits} digits are expected after ${code}` : "Check the phone number",
    emailRequired: "Enter your email — tickets are sent there",
    emailInvalid: "Enter an email like name@example.com",
    baggageIncludedShort: "Included: 7 kg carry-on and a 10–20 kg suitcase",
    addBaggageShort: "+ bag, +10%",
    payByCard: (sum) => `Pay by card · ${sum}`,
    bookWithoutPay: "Reserve without paying",
    bookingNote: "Reservation is free, pay online or at boarding",

    bookedTitle: "Seats reserved",
    orderNo: (id, date) => `Order No. ${id} · ${date}`,
    seatsList: (seats) => (seats.length === 1 ? `Seat ${seats[0]}` : `Seats ${joinAnd(seats, "and")}`),
    toPay: "To pay",
    bookedPayNote: "You can pay by card now or at boarding.",
    downloadPdf: "Download ticket (PDF)",
    openReturnLeg: "Return — open date",

    errChooseTrips: "Choose your trips first",
    errChooseSeats: "Choose the required number of seats",
    errFillNames: "Enter the passenger names",
    msgPurchasing: "Purchasing…",
    msgBooking: "Reserving…",
    msgRedirect: "Redirecting to the payment page…",
    errNoBooking: "No reservation to pay for",
    errDownloadData: "Not enough data to download the ticket",
  },
};
