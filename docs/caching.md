# Кэширование публичных страниц

## Что было сломано

Все 52 страницы отдавались с `cache-control: private,no-cache,no-store,max-age=0,must-revalidate`
и `cache-status: "Netlify Durable"; fwd=bypass, "Netlify Edge"; fwd=miss`.
Заголовков `netlify-cdn-cache-control` и `x-nf-render-mode` не было вообще — их
проставляет Netlify-рантайм только для статических/ISR-ответов.

Причина: `await headers()` (чтение `x-locale`) в корневом `src/app/layout.tsx`.
Один динамический API в корневом layout переводит **всё** дерево маршрутов в
динамический рендер. `export const revalidate = 600` на страницах при этом молча
не работал.

`<Suspense>` эту проблему не решает: динамический API в layout делает маршрут
динамическим независимо от границ Suspense (без включённого PPR).

## Как устроено сейчас

**Локаль — из route params, а не из заголовка.** `src/app/layout.tsx` удалён;
корневым layout'ом стал `src/app/[locale]/layout.tsx` — он держит `<html>`/`<body>`
и берёт локаль из `params.locale`. `generateStaticParams` перечисляет все четыре
локали, поэтому дерево пререндерится.

**`src/proxy.ts`** больше не проставляет `x-locale`. Осталась одна задача:
подставить сегмент локали по умолчанию для URL без префикса
(`/odessa-varna` → `/ru/odessa-varna`). Rewrite сам по себе кэш не обходит —
edge- и durable-слои Netlify запрашиваются, что видно по `cache-status` даже в
сломанном состоянии.

**Ревалидация — на уровне страницы**, не на отдельных `fetch`:
`export const revalidate = 600` в `[locale]/(site)/page.tsx` и
`[locale]/(site)/[trip]/page.tsx`. На самих фетчах `next.revalidate` бесполезен:
`/selected_route` и `/selected_pricelist` — POST, а Data Cache кэширует только GET.

**Приватные маршруты остаются некэшируемыми** через `export const dynamic = "force-dynamic"`:
`/cabinet`, `/booking`, `/purchase/[purchaseId]`, `/ticket/[id]`, `/return`, `/q/[opaque]`.
`/api/*` уходит на бэкенд редиректом из `netlify.toml` и через proxy не проходит
(исключён матчером).

**Живые данные не кэшируются.** Наличие мест (`/seat/`), направления и итоговые
цены грузятся из браузера с `cache: "no-store"` — в SSR они не попадают.
`Routes` и `Schedule` получают серверный снимок как `initialData`/`initialPrices`
и всё равно перезапрашивают данные на клиенте.

**В SSR публичных страниц нет ничего пользовательского.** Оверлей возврата с
оплаты (`PurchaseReturnView`) читает query-параметры на клиенте и обёрнут в
`<Suspense fallback={null}>` — здесь Suspense нужен именно для CSR-bailout
`useSearchParams()`, и в статической разметке от него ничего не остаётся.
Проверка: `curl -s '/?purchase_id=12345&payment=success' | grep -c 12345` → `0`.

## Ожидаемый результат сборки

```
● /[locale]                     10m   1y
● /[locale]/[trip]              10m   1y
ƒ /[locale]/booking
ƒ /[locale]/cabinet
ƒ /[locale]/purchase/[purchaseId]
ƒ /[locale]/q/[opaque]
ƒ /[locale]/return
ƒ /[locale]/ticket/[id]
```

`●` (SSG) на публичных маршрутах, `ƒ` (Dynamic) на приватных. Если публичная
страница снова стала `ƒ` — в дереве появился динамический API.

## Приёмка

Локально (`next start`):

```bash
curl -sI http://127.0.0.1:3000/odessa-varna | grep -iE 'cache-control|x-nextjs'
# Cache-Control: s-maxage=600, stale-while-revalidate=31535400
# x-nextjs-cache: HIT
```

На проде:

```bash
curl -sI https://maximovtours.com/odessa-varna | grep -i cache
curl -sI https://maximovtours.com/odessa-varna | grep -i cache   # второй раз
```

Во втором ответе `cache-status` должен содержать `hit`. Медиана TTFB повтора —
меньше 100 мс.

## Чего нельзя делать

- Динамические API (`headers()`, `cookies()`, `draftMode()`) в
  `src/app/[locale]/layout.tsx` и в общих компонентах публичных страниц.
- `cache: "no-store"` в серверных фетчах публичных страниц (см. `src/lib/serverData.ts`).
- `export const dynamic = "force-dynamic"` или `revalidate = 0` на публичных маршрутах.
- Проставлять заголовки запроса из `src/proxy.ts` ради передачи данных в рендер —
  это возвращает зависимость рендера от запроса.
