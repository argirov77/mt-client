# Документация по эндпоинтам API

Базовый URL фронтенд-клиента указывает на `http://localhost:8000`.

## Публичный доступ (без авторизации)

- `POST /search/departures` — выдаёт список доступных пунктов отправления с учётом языка интерфейса и числа мест.【F:src/components/hero/SearchForm.tsx†L81-L105】
- `POST /search/arrivals` — возвращает пункты назначения для выбранной станции отправления, языка и числа мест.【F:src/components/hero/SearchForm.tsx†L98-L105】
- `GET /search/dates` — отдаёт массив дат, в которые есть рейсы для выбранной пары остановок и требуемого числа мест (используется в обе стороны маршрута).【F:src/components/hero/SearchForm.tsx†L109-L123】
- `GET /tours/search` — возвращает список рейсов на выбранную дату; вызывается отдельно для прямого и обратного направлений.【F:src/components/search/SearchResults.tsx†L371-L407】
- `POST /purchase` — оформляет покупку билетов, используя выбранные места, данные пассажиров и контактную информацию.【F:src/components/search/SearchResults.tsx†L487-L609】
- `POST /book` — создаёт бронь без моментальной оплаты; отправляется с тем же телом, что и покупка.【F:src/components/search/SearchResults.tsx†L487-L609】
- `POST /pay` — инициирует оплату ранее созданной брони по её идентификатору.【F:src/components/search/SearchResults.tsx†L680-L707】
- `POST /cancel/{purchaseId}` — отменяет или возвращает бронирование по идентификатору покупки.【F:src/components/search/SearchResults.tsx†L710-L738】
- `POST /selected_route` — отдаёт описание рекомендованных маршрутов (прямого и обратного) для публичной секции сайта.【F:src/components/Routes.tsx†L155-L182】
- `POST /selected_pricelist` — возвращает публичный прайс-лист направлений с учётом выбранного языка.【F:src/components/Schedule.tsx†L67-L83】
- `GET /seat` — загружает актуальную схему свободных мест для конкретного рейса и пары остановок; запрос выполняется без авторизации и не кэшируется.【F:src/components/SeatClient.tsx†L60-L98】

## Операции, требующие сессионного доступа

Для этих запросов клиент всегда добавляет куки и при необходимости заголовок `X-CSRF` с помощью вспомогательной функции `fetchWithInclude`, поэтому они предполагают наличие активной сессии пользователя.【F:src/utils/fetchWithInclude.ts†L1-L28】

- `GET /public/purchase/{purchaseId}` — загружает агрегированную информацию о покупке, её билетах и истории.【F:src/components/purchase/PurchaseClient.tsx†L807-L840】
- `GET /purchase/{purchaseId}/pdf` — скачивает единый PDF-файл с билетами покупки.【F:src/components/purchase/PurchaseClient.tsx†L847-L858】
- `GET /public/tickets/{ticketId}/pdf` — скачивает PDF отдельного билета (также используется в отдельном хелпере для загрузки электронного билета).【F:src/components/purchase/PurchaseClient.tsx†L855-L858】【F:src/utils/ticketPdf.ts†L1-L28】
- `POST /public/purchase/{purchaseId}/cancel/preview` — рассчитывает размер возврата перед отменой отдельных билетов.【F:src/components/purchase/PurchaseClient.tsx†L1133-L1161】
- `POST /public/purchase/{purchaseId}/cancel` — подтверждает отмену или возврат выбранных билетов покупки.【F:src/components/purchase/PurchaseClient.tsx†L1166-L1208】
- `POST /public/purchase/{purchaseId}/baggage/quote` — пересчитывает стоимость после изменения количества дополнительного багажа.【F:src/components/purchase/PurchaseClient.tsx†L1220-L1250】
- `POST /public/purchase/{purchaseId}/baggage` — применяет изменения по багажу и обновляет покупку.【F:src/components/purchase/PurchaseClient.tsx†L1255-L1305】
- `POST /public/purchase/{purchaseId}/pay` — инициирует платёж по уже созданной покупке и подготавливает форму оплаты провайдера.【F:src/components/purchase/PurchaseClient.tsx†L1315-L1340】
- `GET /search/dates` — повторное использование поиска дат при переносе билетов; выполняется с учётом сессии, чтобы сервер знал текущую покупку.【F:src/components/purchase/PurchaseClient.tsx†L1068-L1124】
- `GET /tours/search` — подбирает рейсы для переноса билетов (включая дату и доступные места).【F:src/components/purchase/PurchaseClient.tsx†L1468-L1533】
- `POST /public/purchase/{purchaseId}/reschedule/quote` — рассчитывает доплату или возврат при переносе билетов.【F:src/components/purchase/PurchaseClient.tsx†L1597-L1642】
- `POST /public/purchase/{purchaseId}/reschedule` — подтверждает перенос выбранных билетов на новый рейс и возвращает обновлённый статус оплаты.【F:src/components/purchase/PurchaseClient.tsx†L1650-L1699】

## Примечания

- Все пути строятся на базе константы `API`, определённой в конфигурации клиента.【F:src/config.ts†L1-L1】
- Запросы на скачивание PDF в личном кабинете используют общий вспомогательный метод `downloadPdf`, который добавляет заголовок `Accept: application/pdf` и выгружает файл напрямую в браузер.【F:src/components/purchase/PurchaseClient.tsx†L128-L154】
