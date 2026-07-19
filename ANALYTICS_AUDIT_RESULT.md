# GA4 Tracking Audit — mt-client

**Дата аудита:** 2026-07-19  
**GA4 Property:** `G-N3PVQB5J6S`  
**Стек:** Next.js / Netlify, gtag.js (напрямую, без GTM-контейнера)

---

## A. Таблица маппинга «кнопка/триггер → событие»

| Кнопка / триггер | Событие GA4 | Файл:строка | Параметры | Этап воронки |
|---|---|---|---|---|
| Клик по результату поиска (карточка рейса) | `select_item` | `SearchResults.tsx:278`, `:303` | item_id, item_name, item_category, price, currency | Просмотр |
| Раскрытие деталей рейса | `view_item` | `SearchResults.tsx:1022` | item_id, item_name, item_category, price, currency | Просмотр |
| **Кнопка «Забронировать» (book)** | `purchase_click` | `ContactsAndPaymentStep.tsx:97` (через `trackPurchaseClick()`) | event_category="conversion", event_label | Намерение оплаты |
| **Кнопка «Купить» (purchase)** | `purchase_click` | `ContactsAndPaymentStep.tsx:97` (через `trackPurchaseClick()`) | event_category="conversion", event_label | Намерение оплаты |
| Обработчик `handleAction("book"\|"purchase")` — до API-вызова | `begin_checkout` | `SearchResults.tsx:380` | value, currency, items, passenger_count, trip_type, route, checkout_type | Начало чекаута |
| Успешный book → бэкенд ответил | `booking_success` | `SearchResults.tsx:554` (через `trackBooking()`) | transaction_id, trip_from, trip_to, value, currency | Бронирование создано |
| Успешный purchase → редирект на LiqPay | `add_payment_info` | `SearchResults.tsx:579` | transaction_id, value, currency, payment_type="liqpay", passenger_count, trip_type | Переход к оплате |
| **Кнопка «Оплатить» (pay)** — `handlePay()` | `add_payment_info` | `SearchResults.tsx:635` | transaction_id, value, currency, payment_type="liqpay", passenger_count, trip_type | Переход к оплате |
| Маунт `/return` + данные загружены (НЕ кнопка) | **`purchase`** | `return/page.tsx:752` (через `trackPurchase()`) | transaction_id, value, currency, items[], passenger_count, trip_type, days_until_departure, payment_method | **Транзакция завершена** |
| `/return` — быстрый возврат (<30 сек) | `checkout_abandoned` + `payment_window_closed` | `return/page.tsx:679`, `:687` | reason, transaction_id, time_spent_seconds | Отмена |
| Клик «Скачать чек» на `/return` | `fiscal_receipt_download_click` | `return/page.tsx:497` (dataLayer.push) | order_id, purchase_id | Пост-покупка |
| Скачивание PDF-билета | `download_ticket` | `ticketPdf.ts:78` | (параметры из контекста) | Пост-покупка |
| Запрос отмены | `cancel_request` | `PurchaseClient.tsx:1680` | (из контекста) | Возврат |
| Отправка заявки на возврат | `refund_request_submitted` | `PurchaseClient.tsx:1742` | (из контекста) | Возврат |
| Поиск рейса | `search` | `SearchForm.tsx:236` | (параметры поиска) | Поиск |

### Кнопки без отдельного события
- **Кнопка «Оплатить» (pay)** — НЕ шлёт `purchase_click`. Шлёт только `add_payment_info` через `handlePay()`.

### События не с кнопок
- **`purchase`** — срабатывает на маунт роута `/return` при успешной загрузке данных транзакции (не по клику).
- **`checkout_abandoned` / `payment_window_closed`** — срабатывает при быстром возврате на `/return`.

---

## B. Вердикт по `purchase`

### B.1. Баг со `value` (~72 373)

**Вердикт: БАГ ЗАКРЫТ в коде.**

Текущая реализация `trackPurchase()` (`src/lib/analytics.ts:179–293`):

1. **Первичный источник `value`** — сумма `price × quantity` по каждому item:
   ```ts
   // analytics.ts:209–212
   const itemsValue = normalizedItems.reduce(
     (sum, item) => sum + item.price * item.quantity, 0,
   );
   ```

2. **Откуда берётся `price` каждого item** — из `ticket.pricing?.price` (return/page.tsx:748), то есть реальная цена конкретного билета из API.

3. **Fallback** — если `itemsValue === 0`, используется `valueOverride`, который на `/return` равен:
   ```ts
   // return/page.tsx:756–757
   valueOverride: purchaseView.totals?.paid ?? purchaseView.purchase.amount_due,
   ```
   Это суммарная оплаченная сумма за конкретную покупку из ответа API.

4. **Защита от аномальных значений** — если `value > 1_000_000`, выводится warning (analytics.ts:252).

5. **Валидация несоответствия** — если `itemsValue` и `valueOverride` расходятся более чем на 5%, выводится warning (analytics.ts:236–250).

**Вывод:** Захардкоженного значения 72 373 в коде нет. `value` вычисляется динамически из цен билетов текущей транзакции. Баг закрыт.

### B.2. Корректность `currency`

```ts
// return/page.tsx:755
currency: purchaseView.purchase.currency ?? FALLBACK_CURRENCY,
```

- Берётся из данных транзакции (`purchase.currency`).
- Fallback — `FALLBACK_CURRENCY = "UAH"` (analytics.ts:87).
- **Риск:** Если бэкенд вернёт `null` для `currency` при транзакции в EUR, событие уйдёт с `UAH`. Это маловероятно (бэкенд должен заполнять поле), но не исключено.
- **Для `booking_success`:** всегда `FALLBACK_CURRENCY` (UAH), не из транзакции — потенциальная неточность для BG/EN локали, но `booking_success` не является целью кампании.

### B.3. Наличие `transaction_id`

```ts
// return/page.tsx:726–728
const transactionId = String(purchaseView.purchase.id ?? purchaseId);
```

Берётся из `purchase.id` (с fallback на `purchaseId` из URL).

### B.4. Дедупликация

**ЕСТЬ.** Реализована через `sessionStorage` + `localStorage`:

```ts
// analytics.ts:261–269
const firedKey = `${PURCHASE_FIRED_KEY_PREFIX}${transactionId}`;
if (safeStorageGet(firedKey)) {
  return false; // событие не отправляется повторно
}
// После отправки:
safeStorageSet(firedKey, String(Date.now()));
```

- Записывается в оба хранилища (sessionStorage и localStorage).
- Проверка при каждом вызове — повторный рефреш `/return` НЕ отправит дубль.
- Тест подтверждает: `analytics.test.ts:184–193`.

---

## C. Что шлёт `purchase_click`

**Файл:** `src/components/search/ContactsAndPaymentStep.tsx:96–101`

```ts
const trackPurchaseClick = () => {
  window.gtag?.("event", "purchase_click", {
    event_category: "conversion",
    event_label: `${fromName} → ${toName}`.trim() || window.location.pathname,
  });
};
```

**Триггер:** Клик по кнопке «Забронировать» (book) или «Купить» (purchase) на шаге контактов/оплаты — строки 324 и 334.

**Что это:** Момент **намерения** пользователя (клик по CTA). Это НЕ завершённая транзакция. На этом этапе:
- Ещё не сделан API-вызов
- Ещё не прошла оплата
- Пользователь может получить ошибку валидации

**Почему это НЕ цель кампании:**
- Событие фиксирует клик, а не результат.
- Нет `value` / `transaction_id` — GA4 не может атрибутировать выручку.
- Кнопка «Оплатить» (pay) вообще НЕ шлёт `purchase_click`.
- Конверсия по клику завышает реальные покупки.

---

## D. Дублирование (GTM vs код)

**GTM-контейнер (`GTM-...`) в проекте НЕ обнаружен.**

GA4 подключён напрямую через gtag.js:
```html
<!-- src/app/layout.tsx:39–50 -->
<Script src="https://www.googletagmanager.com/gtag/js?id=G-N3PVQB5J6S" />
```

Единственный `dataLayer.push` в коде — на `/return` для `fiscal_receipt_download_click` (return/page.tsx:497). Это отдельное событие, не дублирующее ни один gtag-вызов.

**Риск двойного счёта: ОТСУТСТВУЕТ.** Все события отправляются единственным путём — через `trackEvent()` / прямой `window.gtag()`.

---

## E. Рекомендация

### Единственная цель Google Ads: **`purchase`**

Обоснование:
1. Срабатывает только после реально завершённой оплаты (на `/return` после callback LiqPay).
2. Содержит корректный `value` (реальная цена билетов) и `transaction_id`.
3. Имеет дедупликацию — повторные загрузки страницы не дублируют событие.
4. Соответствует стандартной e-commerce модели GA4 (recommended event).

### Чек-лист для ручной верификации в GA4 DebugView перед запуском

1. [ ] Открыть DebugView в GA4 → выполнить тестовую покупку.
2. [ ] Убедиться, что событие `purchase` появилось **ровно 1 раз**.
3. [ ] Проверить параметр `value` — должен соответствовать цене билета (напр. 350.00, 1200.00), а не ~72 373.
4. [ ] Проверить `currency` — должна совпадать с валютой в чекауте (UAH для грн, EUR для евро).
5. [ ] Проверить `transaction_id` — уникальный ID покупки.
6. [ ] Обновить страницу `/return` (F5) → убедиться, что событие `purchase` НЕ отправилось повторно.
7. [ ] В GA4 → Admin → Events → Conversions — убедиться, что `purchase` помечен как конверсия.
8. [ ] Проверить, что `purchase` появляется в отчёте «Conversions» в GA4 за последние 24 часа.
9. [ ] Убедиться, что `items[]` не пустой и содержит корректные `item_name` / `price`.
10. [ ] Проверить атрибуцию: что Google Ads видит это событие как импортированную конверсию (если настроен импорт).

---

## PROPOSED — требует ревью

Явных дефектов, требующих патча, **не обнаружено**. Код в текущем состоянии корректно:
- вычисляет `value` из реальных цен билетов;
- берёт `currency` из данных транзакции;
- дедуплицирует по `transaction_id`;
- логирует предупреждения при аномальных значениях.

### Незначительное улучшение (опционально)

Для `booking_success` (analytics.ts:334) `currency` всегда fallback `UAH`, а не из параметра `params.currency`. Код использует `params.currency || FALLBACK_CURRENCY`, но на вызывающей стороне (SearchResults.tsx:559) передаётся `currency: FALLBACK_CURRENCY` — то есть жёстко `"UAH"`. Если появятся EUR-маршруты с бронированием (book), `booking_success` будет некорректно отмечен как UAH.

```diff
--- a/src/components/search/SearchResults.tsx
+++ b/src/components/search/SearchResults.tsx
@@ -556,7 +556,7 @@ export default function SearchResults(...) {
         trackBooking({
           purchaseId: pId,
           tripFrom: fromName,
           tripTo: toName,
           value: Number(total),
-          currency: FALLBACK_CURRENCY,
+          currency: purchaseCurrency ?? FALLBACK_CURRENCY,
         });
```

Это не влияет на событие `purchase` (цель кампании) и не является блокером для запуска Google Ads.
