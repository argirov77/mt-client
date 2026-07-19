# EVENT_MODEL_PROPOSAL.md — GA4 Customer Journey Redesign

## Резюме

Текущий трекинг частично реализует ecommerce-события GA4, но содержит:
- Дублирующие/нестандартные события (`purchase_click`, `booking_success`, `form_submit`, `phone_click`, `messenger_click`)
- Разнобой: часть вызовов через `trackEvent()` (с UTM-обогащением), часть — через голый `window.gtag?.()` (без UTM)
- Жёсткий `FALLBACK_CURRENCY = "UAH"` вместо зависимости от локали
- Отсутствие `view_item_list` (список рейсов не трекается)
- Отсутствие IntersectionObserver для секций
- Нет единого `contact` события — вместо этого `phone_click` / `messenger_click` / `email_click` в разных компонентах

**GTM-контейнер: отсутствует.** Используется только `gtag.js` (GA4 tag loader) с ID `G-N3PVQB5J6S`. Риска двойного счёта нет.

---

## 1. Маппинг: текущее состояние → целевая модель

### A. Воронка покупки (Ecommerce)

| # | Реальное действие | Текущее событие | Новое GA4 событие | Файл : строка |
|---|---|---|---|---|
| 1 | Сабмит формы поиска | `form_submit` (raw gtag) + `search` (trackEvent) | **`search`** | `src/components/hero/SearchForm.tsx:227,236` |
| 2 | Показан список рейсов | — (нет события) | **`view_item_list`** | `src/components/search/SearchResults.tsx` (useEffect после загрузки туров) |
| 3 | Выбор рейса | `select_item` (trackEvent) | **`select_item`** (оставить) | `src/components/search/SearchResults.tsx:278,303` |
| 4 | Переход к шагу 2 (рейс выбран, показаны места/данные) | `view_item` (trackEvent) | **`add_to_cart`** (переименовать — фиксация рейса+места) | `src/components/search/SearchResults.tsx:1022` |
| 5 | Клик «Book» / «Purchase» | `purchase_click` (raw gtag) + `begin_checkout` (trackEvent) | **`begin_checkout`** (убрать `purchase_click`) | `src/components/search/ContactsAndPaymentStep.tsx:97` + `src/components/search/SearchResults.tsx:380` |
| 6 | Редирект на LiqPay (инициация оплаты) | `add_payment_info` (trackEvent) | **`add_payment_info`** (оставить) | `src/components/search/SearchResults.tsx:579,635` |
| 7 | Оплата подтверждена | `purchase` (trackPurchase) | **`purchase`** (оставить, починить value) | `src/app/[locale]/(site)/return/page.tsx:699-764` |

**Решение по `select_item` + `add_to_cart`:**  
В текущем UX выбор рейса (шаг 1) и выбор места + заполнение данных (шаг 2) — **разные экраны**. Поэтому разделяем:
- `select_item` = клик по рейсу в списке (фиксирует выбор рейса)
- `add_to_cart` = переход на шаг 2 (рейс + место зафиксированы; текущий `view_item` переименовывается)

### B. Дополнительные события воронки (уже есть, оставляем)

| Действие | Событие | Файл : строка | Статус |
|---|---|---|---|
| Оплата не прошла | `checkout_abandoned` | `return/page.tsx:679` | Оставить |
| Быстрый возврат (<30с) | `payment_window_closed` | `return/page.tsx:687` | Оставить |
| Скачивание билета | `download_ticket` | `src/utils/ticketPdf.ts:78` | Оставить |
| Скачивание чека | `fiscal_receipt_download_click` | `return/page.tsx:494` | Оставить (dataLayer push) |
| Запрос отмены | `cancel_request` | `PurchaseClient.tsx:1680` | Оставить |
| Запрос возврата | `refund_request_submitted` | `PurchaseClient.tsx:1742` | Оставить |

### C. Контентные секции

| Действие | Событие | Параметр `section` | Текущее | Реализация |
|---|---|---|---|---|
| Секция «Расписание/Цены» видна | `view_section` | `schedule` | — (нет) | IntersectionObserver на `#schedule` |
| Секция «О нас» видна | `view_section` | `about` | — (нет) | IntersectionObserver на `#about` |
| Секция «Посылка» видна | `view_section` | `parcel` | — (нет) | IntersectionObserver на `#parcel` |

Дедуп: один раз за сессию на секцию (Set в React state или sessionStorage). Порог: 50% видимости.

### D. Контакты / Лиды

| Действие | Текущее событие | Новое событие | Параметры | Файл : строка |
|---|---|---|---|---|
| Звонок из хедера | `phone_click` (raw gtag) | `contact` | `method: "phone"`, `source: "topbar"` | `Header.tsx:149` |
| Мессенджер из хедера | `messenger_click` (raw gtag) | `contact` | `method: "telegram"\|"viber"\|"whatsapp"`, `source: "topbar"` | `Header.tsx:152` |
| Звонок из секции «О нас» | `phone_click` (raw gtag) | `contact` | `method: "phone"`, `source: "about_section"` | `AboutSection.tsx:44` |
| Мессенджер из секции «О нас» | `messenger_click` (raw gtag) | `contact` | `method: "telegram"\|"viber"\|"whatsapp"`, `source: "about_section"` | `AboutSection.tsx:47` |
| Контакт из секции «Посылка» | — (открывает модал хедера) | `contact` | `method: ...`, `source: "parcel_section"` | `ParcelSection.tsx:17` → `Header.tsx` modal |
| Звонок из футера | `phone_click` (raw gtag) | `contact` | `method: "phone"`, `source: "footer"` | `SiteFooter.tsx:55` |
| Email из футера | `email_click` (raw gtag) | `contact` | `method: "email"`, `source: "footer"` | `SiteFooter.tsx:59` |
| Контакт из PurchaseClient | `phone_click`/`email_click` | `contact` | `method: "phone"\|"email"`, `source: "purchase_detail"` | `PurchaseClient.tsx:2653,2656` |

**`contact` — кандидат в Key Event** (вторичная конверсия для Google Ads, особенно с `source: "parcel_section"`).

---

## 2. Депрекация старых событий

| Старое событие | Переход в | Обоснование |
|---|---|---|
| `purchase_click` | **Удаляется** (покрыт `begin_checkout`) | `begin_checkout` уже стреляет в том же `handleAction()` сразу после валидации. `purchase_click` — дубль без полезной нагрузки. |
| `booking_success` | **Удаляется** (см. ниже) | Это событие — «бронь создана без оплаты». Не является конверсией (продажей). В новой модели покрывается `begin_checkout` (checkout_type: "book"). Факт оплаты → только `purchase`. |
| `form_submit` | **Удаляется** | Дублирует `search` (SearchForm) и не несёт ценности (BookingPanel). |
| `phone_click` | → `contact` (method: "phone") | Объединяем в параметризованное событие. |
| `messenger_click` | → `contact` (method: telegram/viber/whatsapp) | Объединяем в параметризованное событие. |
| `email_click` | → `contact` (method: "email") | Объединяем в параметризованное событие. |
| `view_item` | → `add_to_cart` | Переименование: фиксация рейса и места — это ecommerce "добавление в корзину". |

---

## 3. Спорные точки — решения

### 3.1. «Book» vs «Purchase» — одно действие или разные?

**Ответ по коду:** Это **два сценария одной кнопочной панели** (`ContactsAndPaymentStep.tsx:320-339`):
- **«Book»** (`handleAction("book")`) — создаёт бронь **без оплаты**. Пользователь получает purchaseId, может оплатить позже кнопкой «Pay».
- **«Purchase»** (`handleAction("purchase")`) — создаёт бронь **и сразу редиректит на LiqPay** для оплаты.

**Решение:** Оба клика → один `begin_checkout` с параметром `checkout_type: "book" | "purchase"`. Далее:
- "purchase" путь: `add_payment_info` → (LiqPay) → `purchase` на `/return`
- "book" путь: воронка завершается на `begin_checkout`. Если пользователь позже нажмёт «Pay» → `add_payment_info` → `purchase`

### 3.2. `booking_success` — это продажа?

**Нет.** По коду (`SearchResults.tsx:553-560`) `trackBooking` вызывается **только** при `action === "book"`. Это подтверждение создания брони без оплаты. Фактическая продажа — **только** `purchase` на `/return` после подтверждения статуса "paid".

В новой модели `booking_success` **не нужен**: шаг "бронь создана" покрывается `begin_checkout` (с `checkout_type: "book"`), а конверсию (продажу) фиксирует исключительно `purchase`.

### 3.3. Слияние `select_item` + `add_to_cart`?

**Не сливаем** — это два отдельных экрана в UI. `select_item` при клике по рейсу из списка; `add_to_cart` при активации шага 2 (рейс + место зафиксированы).

---

## 4. Схема параметров для каждого события

### `search`
```js
{
  search_term: "<departure> - <arrival>",
  origin: "<departure_name>",
  destination: "<arrival_name>",
  route: "<departure_id>-<arrival_id>",
  departure_date: "YYYY-MM-DD",
  return_date: "YYYY-MM-DD" | null,
  trip_type: "oneway" | "roundtrip",
  passenger_count: number
}
```

### `view_item_list`
```js
{
  item_list_name: "search_results",
  items: [{
    item_id: "<tour_id>",
    item_name: "<departure> → <arrival>",
    item_category: "oneway" | "roundtrip",
    price: number,
    item_variant: "<date>"
  }, ...],
  currency: "UAH" | "EUR",  // по локали
  route: "<departure_id>-<arrival_id>"
}
```

### `select_item`
```js
{
  item_list_name: "search_results_outbound" | "search_results_return",
  items: [{
    item_id: "<tour_id>",
    item_name: "<departure> → <arrival>",
    item_category: "oneway" | "roundtrip",
    item_category2: "<route_category>",
    price: number,
    item_variant: "<date>"
  }],
  currency: "UAH" | "EUR",
  value: number
}
```

### `add_to_cart`
```js
{
  items: [{
    item_id: "<tour_id>",
    item_name: "<departure> → <arrival>",
    item_category: "oneway" | "roundtrip",
    item_category2: "<route_category>",
    price: number,
    quantity: number  // кол-во мест/пассажиров
  }],
  currency: "UAH" | "EUR",
  value: number,      // общая стоимость
  trip_type: "oneway" | "roundtrip",
  route: "<route>",
  passenger_count: number
}
```

### `begin_checkout`
```js
{
  items: [{
    item_id: "<tour_id>",
    item_name: "<departure> → <arrival>",
    item_category: "oneway" | "roundtrip",
    item_category2: "<route_category>",
    price: number,
    quantity: number
  }],
  currency: "UAH" | "EUR",
  value: number,
  passenger_count: number,
  trip_type: "oneway" | "roundtrip",
  route: "<route>",
  checkout_type: "book" | "purchase"
}
```

### `add_payment_info`
```js
{
  transaction_id: "<purchase_id>",
  items: [{
    item_id: "<tour_id>",
    item_name: "<departure> → <arrival>",
    item_category: "oneway" | "roundtrip",
    price: number,
    quantity: number
  }],
  currency: "UAH" | "EUR",
  value: number,
  payment_type: "liqpay",
  passenger_count: number,
  trip_type: "oneway" | "roundtrip"
}
```

### `purchase`
```js
{
  transaction_id: "<purchase_id>",   // ОБЯЗАТЕЛЕН, для дедупликации
  items: [{
    item_id: "<ticket_id>",
    item_name: "<departure> → <arrival>",
    item_category: "oneway" | "roundtrip",
    item_category2: "<route_category>",
    item_variant: "<direction>",
    price: number,                   // реальная цена билета!
    quantity: 1
  }],
  currency: "UAH" | "EUR",          // из purchase.currency или по локали
  value: number,                     // сумма prices (НЕ захардкоженная!)
  passenger_count: number,
  trip_type: "oneway" | "roundtrip",
  days_until_departure: number | null,
  payment_method: "liqpay"
}
```

### `view_section`
```js
{
  section: "schedule" | "about" | "parcel"
}
```

### `contact`
```js
{
  method: "phone" | "telegram" | "viber" | "whatsapp" | "email",
  source: "topbar" | "about_section" | "parcel_section" | "footer" | "purchase_detail"
}
```

---

## 5. Валюта по локали

| Локаль | Валюта |
|---|---|
| `ru`, `ua` | `UAH` |
| `en`, `bg` | `EUR` |

Реализация: хелпер `getCurrencyByLocale(locale)` в `analytics.ts`, заменит захардкоженный `FALLBACK_CURRENCY`.

---

## 6. Баг `purchase.value`

**Проблема:** Ранее фиксировался нереалистичный `value` ~72 373.

**Текущее состояние в коде** (`analytics.ts:209-220`): value вычисляется как сумма `item.price * item.quantity` из массива items. Если items пустой или цены невалидны — берётся `valueOverride` (передаётся `purchaseView.totals?.paid ?? purchaseView.purchase.amount_due`).

**Потенциальная причина бага:** `ticket.pricing?.price` мог возвращать значение в копейках (72373 коп = 723.73 грн) или приходить как строка с мусором. Нужно проверить API-ответ.

**Фикс в Фазе 2:**
1. Логировать в dev-режиме raw `ticket.pricing?.price` для диагностики.
2. Добавить upper bound check (MAX_REASONABLE_PURCHASE_VALUE уже есть — ~50000, но он только warn'ит).
3. Нормализовать: если price > MAX_SINGLE_TICKET_PRICE (напр. 5000 UAH), считать что пришло в копейках и делить на 100.
4. Источник value для `purchase` = `purchaseView.totals?.paid` (уже есть как valueOverride) — это оплаченная сумма из backend, наиболее надёжный источник.

---

## 7. Дедупликация `purchase`

**Уже реализована** в `trackPurchase()` (`analytics.ts:261-268`): хранит `ga_purchase_fired_{transactionId}` в sessionStorage + localStorage. При повторном вызове с тем же transactionId — событие не отправляется.

Защита от рефреша `/return` уже работает. В Фазе 2 оставляем как есть.

---

## 8. Замечание по историческим данным

При переименовании событий (`purchase_click` → удаляется, `booking_success` → удаляется, `phone_click`/`messenger_click` → `contact`) **история старых событий в GA4 на новые имена не переносится**. Это приемлемо — Google Ads кампании ещё не запущены, исторические отчёты по старым именам сохраняются.

---

## STOP

Ожидаю подтверждения маппинга. Фазу 2 (реализацию) начну только после approve от Димы.
