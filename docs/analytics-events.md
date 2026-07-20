# Аналитика GA4 — карта событий, CHANGELOG и верификация

Централизация слоя аналитики. Все вызовы GA4 идут через типизированные хелперы
в `src/lib/analytics.ts`. Голых `window.gtag?.()` в компонентах не осталось —
поэтому UTM-атрибуция (прикрепляется в `trackEvent`) теперь попадает во **все**
события.

- **Валюта по локали:** `getCurrencyForLocale(locale)` → `UAH` для `ru`/`ua`,
  `EUR` для `en`/`bg`. Жёсткая константа `FALLBACK_CURRENCY = "UAH"` удалена;
  валюта везде выводится из локали.
- **`value`** во всех событиях воронки — в основных единицах валюты (гривны/евро,
  не копейки/центы).
- **Единый `items[]`** через всю воронку (item_id `<departure>-<arrival>` там, где
  применимо; item_name — читаемое направление; price, quantity).

---

## CHANGELOG (действие → было → стало)

| Действие человека | Было (событие) | Стало (событие) | Где |
| --- | --- | --- | --- |
| Клик «Поиск» | `form_submit` + `search` | `search` (form_submit удалён) | `SearchForm.tsx`, `BookingPanel.tsx` |
| Отрисован список рейсов | — | `view_item_list` (новое) | `SearchResults.tsx` |
| Клик по рейсу | `select_item` | `select_item` (без изменений) | `SearchResults.tsx` |
| Место выбрано (рейс+место) | `view_item` | `add_to_cart` (переименовано) | `SearchResults.tsx` |
| Экран оформления открыт | `purchase_click` + `begin_checkout` | `begin_checkout` (purchase_click удалён) | `SearchResults.tsx` / `ContactsAndPaymentStep.tsx` |
| Клик «Purchase» → LiqPay | `add_payment_info` | `add_payment_info` (без изменений) | `SearchResults.tsx` |
| Оплата подтверждена | `purchase` | `purchase` (фикс value + дедуп) | `return/page.tsx` |
| Клик «Book» (бронь без оплаты) | `booking_success` | `reservation` (взвешенный value) | `SearchResults.tsx` |
| Звонок / мессенджер / email | `phone_click` / `messenger_click` / `email_click` | `contact` (method + source) | `Header`, `AboutSection`, `SiteFooter`, `PurchaseClient`, `ParcelSection`→`Header` |
| Долистал до секции | — | `view_section` (новое, Фаза 3) | `Schedule`/`About`/`ParcelSection`/`Routes` |
| Указал направление без поиска | — | `search_intent` (новое, Фаза 3) | `SearchForm.tsx` |

**Удалено:** `form_submit`, `purchase_click`.
**Переименовано:** `view_item` → `add_to_cart`, `booking_success` → `reservation`,
`phone_click`/`messenger_click`/`email_click` → `contact`.
**Без изменений (раздел B):** `checkout_abandoned`, `payment_window_closed`,
`download_ticket`, `fiscal_receipt_download_click`, `cancel_request`,
`refund_request_submitted`.

---

## Полная карта событий (по точкам кода)

### A. Воронка покупки (GA4 ecommerce)

| # | Событие | Хелпер | Триггер |
| --- | --- | --- | --- |
| 1 | `search` | `trackSearch` | `SearchForm.handleSubmit` (валидная форма) |
| 2 | `view_item_list` | `trackViewItemList` | `SearchResults` — useEffect после загрузки туров, один раз на запрос |
| 3 | `select_item` | `trackSelectItem` | клик по рейсу (`onSelectOutbound` / `onSelectReturn`) |
| 4 | `add_to_cart` | `trackAddToCart` | все места выбраны (`seatsDone`), один раз на выбор рейса |
| 5 | `begin_checkout` | `trackBeginCheckout` | попадание на экран `ContactsAndPaymentStep` (`activeStep===3 && step2Complete`), **один раз, до развилки** |
| 6 | `add_payment_info` | `trackAddPaymentInfo` | `handleAction("purchase")` и `handlePay` перед редиректом на LiqPay |
| 7 | `purchase` | `trackPurchase` | `return/page.tsx` `firePurchaseEvent` при статусе paid |
| 8 | `reservation` | `trackReservation` | `handleAction` только на ветке `action === "book"` |

### Разница кнопок и защита от задвоения reservation/purchase

- `handleAction("book")` — бронь **без** оплаты → шлём `reservation` (взвешенный value).
- `handleAction("purchase")` — бронь + редирект на LiqPay → шлём `add_payment_info`,
  затем `purchase` на `/return`.
- `begin_checkout` шлётся **один раз** при попадании на экран оформления, **до**
  развилки book/purchase (перенесён из клика в `useEffect`).
- `reservation` физически недостижим на purchase-ветке: вызов стоит внутри
  `if (action === "book")`. Если пользователь после брони нажмёт «Pay» и оплатит
  онлайн — сработает `purchase`, а `reservation` повторно **не** шлётся (дедуп по
  `purchaseId` + вес усредняет ценность и не задваивает выручку).

### B. События без изменений

`checkout_abandoned`, `payment_window_closed` (`return/page.tsx`),
`download_ticket` (`ticketPdf.ts`), `fiscal_receipt_download_click`
(`return/page.tsx`), `cancel_request`, `refund_request_submitted`
(`PurchaseClient.tsx`).

### C. Контакты — `contact` (`trackContact`)

| Точка | method | source |
| --- | --- | --- |
| Хедер, звонок | `phone` | `topbar` |
| Хедер, мессенджер | `telegram`/`viber`/`whatsapp` | `topbar` |
| «О нас», звонок/мессенджер | `phone`/… | `about_section` |
| Секция «Посылка» (открывает модал хедера) | по выбору | `parcel_section` |
| Футер, звонок | `phone` | `footer` |
| Футер, email | `email` | `footer` |
| Деталь покупки | `phone`/`email` | `purchase_detail` |

`source: "parcel_section"` — ключевой лид по посылкам: модал контактов один и тот же
(в `Header.tsx`), но `source` определяется по точке открытия (топбар vs событие
`open-contact-modal` из `ParcelSection`).

### D. `view_section` (Фаза 3, `trackViewSection` + `useSectionView`)

`section`: `prices` (`Schedule`), `about` (`About`), `parcel` (`ParcelSection`),
`marshrut` (`Routes`). IntersectionObserver, порог ~50% (учитывается и покрытие
вьюпорта для высоких секций). Дедуп: один раз за сессию на секцию (sessionStorage).

> Значение `schedule` оставлено в типе, но на главной нет отдельной секции
> расписания/таймтейбла — времена отправления живут внутри `marshrut` (Routes).

### E. `search_intent` (Фаза 3, `trackSearchIntent`)

Триггер: заполнены `departure` и `arrival`, но клика «Поиск» не было. Один раз за
сессию, с задержкой 12с (не на каждый клик по дропдауну). Параметры: `departure`,
`arrival`, `reached_date_step` (выбрана ли дата отправления). Завершённый `search`
гасит `search_intent`.

---

## Критические правки purchase (Фаза 1)

### 1. Источник `purchase.value` (баг ~72 373)

`value` теперь считается как **сумма per-ticket fare**: `Σ ticket.pricing.price`
(каждый билет = 1 место, `quantity: 1`). Это та же цена билета в основных единицах
валюты, которую `PurchaseClient` рендерит через `formatCurrency` и суммирует как
`ticketsSubtotal` — то есть «реальная цена билета текущей транзакции × количество».

`trackPurchase` **всегда предпочитает** сумму по `items` и берёт `valueOverride`
только когда у билетов нет цены. Резерв переупорядочен:

1. `Σ ticket.pricing.price` (per-ticket fare) — основной источник;
2. `ga_checkout_value` — сумма квоты, сохранённая в `sessionStorage` на шаге
   `add_payment_info` (funnel-consistent, совпадает с суммой, которую видел
   пользователь);
3. `totals.paid` → `amount_due` — **именно этот резерв раньше улетал в ~72 373**;
   теперь он используется в последнюю очередь.

В dev-режиме `trackPurchase` логирует `valueSource` (`items` / `override`), чтобы в
DebugView было видно, откуда взялось значение. Если `~72 373` появится снова —
это значит, что `/public/purchase/{id}` на `/return` не отдал per-ticket `pricing`,
и надо чинить include на бэкенде (фронт при этом уже подставит funnel-сумму из
пункта 2, а не аномалию из пункта 3).

### 2. Дедуп `purchase` по `transaction_id`

Защита от повторной отправки при рефреше `/return`: отправленные `transaction_id`
хранятся в `sessionStorage` + `localStorage` (`ga_purchase_fired_<id>`). Повторный
вызов с тем же id — no-op.

### 3. Валюта по локали

`currency = purchaseView.purchase.currency ?? getCurrencyForLocale(lang)`.

### Вес `reservation`

`reservation.value = (цена билета × количество) × RESERVATION_WEIGHT`.
`RESERVATION_WEIGHT` — именованная константа в `analytics.ts` (дефолт **0.5**),
меняется в одном месте. Смысл: доля book-броней, доезжающих и оплачивающих не
онлайн; усредняет ожидаемую ценность и не задваивает выручку с `purchase`.
В событие также кладутся `reservation_value_full` (полная стоимость) и
`reservation_weight` — для прозрачности.

---

## Отчёт: GTM и потенциальные проблемы

- **Параллельного GTM-контейнера НЕ найдено.** В `src/app/layout.tsx` грузится
  только GA4 `gtag` (`googletagmanager.com/gtag/js?id=G-...` + `gtag('config', …)`).
  `GTM-XXXX` / `gtm.js` в проекте нет. Риска двойного счёта через GTM нет. GTM не
  добавлялся.
- **`fiscal_receipt_download_click`** (`return/page.tsx`) отправляется через
  `window.dataLayer.push({ event: … })` (GTM-стиль), а не через `gtag('event', …)`.
  Без GTM-контейнера такой push, скорее всего, **не доходит до GA4**. Оставлено без
  изменений (раздел B — «не трогать»), но помечаю как потенциальную проблему: при
  необходимости переведу на `trackEvent("fiscal_receipt_download_click", …)`
  (тогда событие пойдёт через gtag + UTM). Требуется решение Димы.

---

## Чек-лист ручной верификации (GA4 DebugView)

Открывать сайт с `?debug_mode=1` или включённым GA Debug (в dev `debug_mode: true`
уже включён). В dev каждое событие также логируется в консоль как `[Analytics] …`.

### 1. Полная воронка до онлайн-оплаты

1. Открыть главную с UTM, напр. `/?utm_source=test&utm_medium=qa`.
2. Выбрать departure + arrival + дату, нажать **«Поиск»**.
   → `search` (origin/destination/route, `currency`, UTM-параметры `source/medium`).
   → `form_submit` **не** должен появляться.
3. На странице результатов после загрузки списка → `view_item_list`
   (`items[]` рейсов, `item_count`).
4. Кликнуть рейс → `select_item` (`items[0]` с price, `value`, `currency`).
5. Выбрать места на всех пассажиров → `add_to_cart` (`items` с `quantity`,
   `value`, `seats_outbound`).
6. Заполнить контакты, попасть на экран оформления → `begin_checkout` **один раз**
   (без `checkout_type`).
7. Нажать **«Purchase»** → `add_payment_info` (`transaction_id`, `value`,
   `payment_type: liqpay`), затем редирект на LiqPay.
8. Оплатить → возврат на `/return` → `purchase` с корректными
   `value` (реальная цена билета × кол-во, **не ~72 373**), `currency` (UAH для
   ru/ua, EUR для en/bg), уникальным `transaction_id`, `items[]`.
9. Обновить `/return` (F5) → `purchase` **повторно не** отправляется (дедуп).
10. Проверить, что у всех событий шага 2–8 присутствуют UTM (`source`, `medium`).

### 2. Бронь через «Book» (без оплаты)

1. Пройти до экрана оформления, нажать **«Book»**.
   → `begin_checkout` (один раз, при попадании на экран).
   → после успешной брони — `reservation` **один раз** с взвешенным `value`
   (полная сумма × 0.5), `reservation_value_full`, `reservation_weight: 0.5`.
2. Повторный «Book» того же `purchaseId` — `reservation` не задваивается.

### 3. `reservation` не шлётся на purchase-ветке

1. Пройти путь **«Purchase»** (сразу оплата) до `/return`.
   → есть `add_payment_info` и `purchase`, **нет** `reservation`.
2. Сценарий book → затем «Pay» → оплата онлайн:
   → `reservation` уже сработал на «Book»; на онлайн-оплате идёт `purchase`,
   `reservation` **повторно не** шлётся.

### 4. Контакты

Кликнуть контакты в разных точках и проверить `contact` с верными `method`/`source`:

- Хедер (звонок/мессенджер) → `source: topbar`, `method: phone|telegram|viber|whatsapp`.
- «О нас» → `source: about_section`.
- Кнопка в секции «Посылка» → открывается модал хедера → `source: parcel_section`.
- Футер → `source: footer`, `method: phone|email`.
- Страница покупки → `source: purchase_detail`, `method: phone|email`.

### 5. Фаза 3

- Долистать до секций → `view_section` по одному разу на секцию
  (`prices`, `about`, `parcel`, `marshrut`); повторный скролл событие не задваивает.
- Указать departure + arrival, **не** нажимать «Поиск», подождать ~12с →
  `search_intent` (`departure`, `arrival`, `reached_date_step`). Если затем выбрать
  дату но не искать — `reached_date_step: true`. Один раз за сессию.
- Если нажать «Поиск» — идёт `search`, `search_intent` не появляется.
