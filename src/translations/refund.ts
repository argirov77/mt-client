import type { Lang } from "@/components/common/LanguageProvider";

type RefundCopy = {
  button: string;
  selectTickets: string;
  partialNote: string;
  submit: string;
  submitting: string;
  successBody: string;
  pendingBadge: (date: string) => string;
  completedPartial: (params: { amount: string; ticketCount: number }) => string;
  estimateLabel: string;
  errorGeneric: string;
  hide: string;
  selectAll: string;
  clear: string;
};

function slavicPlural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export const refundTranslations: Record<Lang, RefundCopy> = {
  ru: {
    button: "Вернуть билеты",
    selectTickets: "Выберите билеты для возврата",
    partialNote: "Можно выбрать как все билеты, так и часть",
    submit: "Отправить заявку на возврат",
    submitting: "Отправляем заявку…",
    successBody:
      "Мы получили заявку на возврат средств и отмену поездки. Обработаем её в течение 1 рабочего дня.",
    pendingBadge: (date) => `Заявка на возврат в обработке от ${date}`,
    completedPartial: ({ amount, ticketCount }) =>
      `По заказу возвращено ${amount} за ${ticketCount} ${slavicPlural(
        ticketCount,
        "билет",
        "билета",
        "билетов",
      )}`,
    estimateLabel: "Ориентировочная сумма к возврату",
    errorGeneric: "Не удалось отправить заявку на возврат",
    hide: "Скрыть",
    selectAll: "Выбрать все",
    clear: "Сбросить",
  },
  bg: {
    button: "Върни билетите",
    selectTickets: "Изберете билети за връщане",
    partialNote: "Можете да изберете всички билети или само част от тях",
    submit: "Изпрати заявка за връщане",
    submitting: "Изпращаме заявката…",
    successBody:
      "Получихме заявката за връщане на средства и отмяна на пътуването. Ще я обработим в рамките на 1 работен ден.",
    pendingBadge: (date) => `Заявката за връщане се обработва от ${date}`,
    completedPartial: ({ amount, ticketCount }) =>
      `По поръчката са върнати ${amount} за ${ticketCount} ${
        ticketCount === 1 ? "билет" : "билета"
      }`,
    estimateLabel: "Ориентировъчна сума за връщане",
    errorGeneric: "Неуспешно изпращане на заявката за връщане",
    hide: "Скрий",
    selectAll: "Избери всички",
    clear: "Изчисти",
  },
  en: {
    button: "Refund tickets",
    selectTickets: "Select tickets to refund",
    partialNote: "You can select all tickets or just a few",
    submit: "Submit refund request",
    submitting: "Submitting request…",
    successBody:
      "We have received the refund and trip cancellation request. We will process it within 1 business day.",
    pendingBadge: (date) => `Refund request is being processed from ${date}`,
    completedPartial: ({ amount, ticketCount }) =>
      `${amount} refunded for ${ticketCount} ticket${ticketCount === 1 ? "" : "s"} on this order`,
    estimateLabel: "Estimated refund amount",
    errorGeneric: "Failed to submit the refund request",
    hide: "Hide",
    selectAll: "Select all",
    clear: "Clear",
  },
  ua: {
    button: "Повернути квитки",
    selectTickets: "Виберіть квитки для повернення",
    partialNote: "Можна вибрати як усі квитки, так і частину",
    submit: "Надіслати заявку на повернення",
    submitting: "Надсилаємо заявку…",
    successBody:
      "Ми отримали заявку на повернення коштів і скасування поїздки. Опрацюємо її протягом 1 робочого дня.",
    pendingBadge: (date) => `Заявка на повернення обробляється з ${date}`,
    completedPartial: ({ amount, ticketCount }) =>
      `За замовленням повернуто ${amount} за ${ticketCount} ${slavicPlural(
        ticketCount,
        "квиток",
        "квитки",
        "квитків",
      )}`,
    estimateLabel: "Орієнтовна сума до повернення",
    errorGeneric: "Не вдалося надіслати заявку на повернення",
    hide: "Сховати",
    selectAll: "Вибрати всі",
    clear: "Очистити",
  },
};
