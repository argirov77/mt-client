"use client";

import { useMemo, useState } from "react";

const paymentDue = "2 000,00 UAH";
const refundSum = "1 400,00 UAH";
const baseTrip = "15.09 · 12:30 → 21:30";

const rescheduleOptions = [
  {
    id: "opt1",
    title: "16.09 · 10:10 → 19:40",
    availability: "Свободно: 12",
    diff: "+ 100 UAH",
  },
  {
    id: "opt2",
    title: "16.09 · 12:30 → 21:30",
    availability: "Свободно: 7",
    diff: "0 UAH",
  },
  {
    id: "opt3",
    title: "16.09 · 15:40 → 00:10",
    availability: "Свободно: 3",
    diff: "– 50 UAH",
  },
];

export default function CabinetPage() {
  const [isPayOpen, setPayOpen] = useState(false);
  const [isRescheduleOpen, setRescheduleOpen] = useState(false);
  const [isCancelOpen, setCancelOpen] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);
  const [selectedOption, setSelectedOption] = useState(rescheduleOptions[1]);

  const rescheduleSummary = useMemo(() => {
    return selectedOption
      ? {
          trip: selectedOption.title,
          diff: selectedOption.diff,
        }
      : {
          trip: rescheduleOptions[0].title,
          diff: rescheduleOptions[0].diff,
        };
  }, [selectedOption]);

  return (
    <div className="page">
      <header className="header" data-booking-id="2690574">
        <div>
          <div className="route">
            <div className="city">Бургас</div>
            <div>→</div>
            <div className="city">Одесса</div>
          </div>
          <div className="meta">
            Бронь <b>2690574</b> · Билет <b>2732866</b> · Дата выезда <b>15.09.2025 · 12:30</b>
          </div>
          <div className="pills">
            <span className="pill status-paid">Оплачен</span>
            <span className="pill place">
              Место: <b>2</b>
            </span>
            <span className="pill bag">
              Багаж: <b>1</b> + ручная кладь
            </span>
          </div>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setPayOpen(true)}>
            Оплатить
          </button>
          <button className="btn warn" onClick={() => setRescheduleOpen(true)}>
            Перенести рейс
          </button>
          <button className="btn danger" onClick={() => setCancelOpen(true)}>
            Отменить поездку
          </button>
        </div>
      </header>

      <section className="card" style={{ marginTop: 14 }}>
        <h3>Поездка</h3>
        <div className="timeline">
          <div className="tl">
            <div className="dot" />
            <div className="bar" />
          </div>
          <div className="leg">
            <h4>Отправление — Бургас (Автогара «Юг»)</h4>
            <div className="muted">15.09.2025 · 12:30</div>
            <div className="muted">
              Адрес: ул. Иван Вазов, 1 ·{" "}
              <a
                className="link"
                target="_blank"
                rel="noreferrer"
                href="https://www.google.com/maps/search/?api=1&query=Бургас%20Автогара%20Юг"
              >
                Открыть на карте
              </a>
            </div>
          </div>

          <div className="tl">
            <div className="dot" />
          </div>
          <div className="leg">
            <h4>Прибытие — Одесса (АС «Привокзальная»)</h4>
            <div className="muted">15.09.2025 · 21:30</div>
            <div className="muted">
              Адрес: пл. Старосенная, 1Б ·{" "}
              <a
                className="link"
                target="_blank"
                rel="noreferrer"
                href="https://www.google.com/maps/search/?api=1&query=Одесса%20АС%20Привокзальная"
              >
                Открыть на карте
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <h3>Оплата</h3>
          <div className="lead">
            К оплате: <span className="sum">{paymentDue}</span>
          </div>
          <div className="row">
            <div className="badges">
              <span className="badge info">VISA</span>
              <span className="badge info">MC</span>
              <span className="badge info">Apple&nbsp;Pay</span>
            </div>
            <button className="btn primary" onClick={() => setPayOpen(true)}>
              Оплатить сейчас
            </button>
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            Оплата защищена 3-D Secure. После оплаты билет придёт на e-mail.
          </div>
        </div>

        <div className="card">
          <h3>Перенести рейс</h3>
          <div className="muted">
            Выберите новую дату и рейс. Если стоимость отличается — доплата/возврат будет рассчитан автоматически.
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <label className="hint" htmlFor="date">
              Дата
            </label>
            <input className="input" type="date" id="date" defaultValue="2025-09-16" />
          </div>
          <ul className="list">
            {rescheduleOptions.map((option) => (
              <li key={option.id}>
                <div>
                  <div>
                    <b>{option.title}</b> · {option.availability}
                  </div>
                  <div className="muted">Бургас → Одесса</div>
                </div>
                <div className="price">
                  {option.diff}{" "}
                  <button
                    className="btn warn"
                    onClick={() => {
                      setSelectedOption(option);
                      setRescheduleOpen(true);
                    }}
                  >
                    Выбрать
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Отмена</h3>
          <div className="lead">
            Возврат: <span className="sum">{refundSum}</span>
          </div>
          <div className="muted">
            Правила: &gt;72ч — 90%, 72–24ч — 70%, 24–12ч — 50%, &lt;12ч — без возмещения.
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <label className="hint" htmlFor="reason">
              Причина (необязательно)
            </label>
            <select className="select" id="reason" defaultValue="">
              <option value="" disabled>
                Выберите…
              </option>
              <option>Поменялись планы</option>
              <option>Ошибся/лась при покупке</option>
              <option>Другое</option>
            </select>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn danger" onClick={() => setCancelOpen(true)}>
              Отменить поездку
            </button>
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            Отмена необратима. Сумма возвращается на исходный метод оплаты.
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h3>Доступные действия API</h3>
        <div className="list actions-list">
          <div className="row">
            <div>
              <div className="lead">POST /purchase/{`{purchase_id}`}/pay</div>
              <div className="muted">Админский эндпоинт: переводит покупку в paid, логирует оплату и рассылает билеты.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="lead">POST /pay</div>
              <div className="muted">Публичный: меняет статус покупки на paid, логирует оплату и рассылает билеты.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="lead">POST /purchase/{`{purchase_id}`}/cancel</div>
              <div className="muted">Админский: освобождает места, переводит покупку в cancelled и пишет запись в журнал продаж.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="lead">POST /cancel/{`{purchase_id}`}</div>
              <div className="muted">Публичный: освобождает места и помечает покупку cancelled.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="lead">POST /refund/{`{purchase_id}`}</div>
              <div className="muted">Возвращает средства, удаляет билеты и отзывает токены ссылок.</div>
            </div>
          </div>
          <div className="row">
            <div>
              <div className="lead">POST /ticket/{`{ticket_id}`}/reschedule</div>
              <div className="muted">Изменяет рейс и место с проверкой доступности сегментов.</div>
            </div>
          </div>
        </div>
      </section>

      {isPayOpen && (
        <div className="modal show" aria-hidden="false">
          <div className="dialog">
            <h3>Оплатить бронирование</h3>
            <p className="sub">
              К оплате: <b>{paymentDue}</b>
            </p>
            <div className="rows">
              <label className="radio">
                <input type="radio" name="pay" defaultChecked />
                <span>
                  <b>Банковская карта</b>
                  <br />
                  <span className="hint">VISA / MasterCard · 3-D Secure</span>
                </span>
              </label>
              <label className="radio">
                <input type="radio" name="pay" />
                <span>
                  <b>Apple Pay / Google Pay</b>
                  <br />
                  <span className="hint">Быстрая оплата в 1 клик</span>
                </span>
              </label>
            </div>
            <div className="actions">
              <button className="btn" onClick={() => setPayOpen(false)}>
                Отмена
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setPayOpen(false);
                  alert("Переходим к оплате (заглушка UI)");
                }}
              >
                Перейти к оплате
              </button>
            </div>
          </div>
        </div>
      )}

      {isRescheduleOpen && (
        <div className="modal show" aria-hidden="false">
          <div className="dialog">
            <h3>Подтвердить перенос</h3>
            <p className="sub">
              <b>Было:</b> {baseTrip} · место 2
              <br />
              <b>Станет:</b> {rescheduleSummary.trip} · место будет назначено автоматически
            </p>
            <div className="rows">
              <div className="row">
                <div className="muted">Разница к оплате</div>
                <div className="sum">{rescheduleSummary.diff}</div>
              </div>
              <div className="hint">
                Если потребуется доплата — далее откроется окно оплаты.
              </div>
            </div>
            <div className="actions">
              <button className="btn" onClick={() => setRescheduleOpen(false)}>
                Отмена
              </button>
              <button
                className="btn warn"
                onClick={() => {
                  setRescheduleOpen(false);
                  alert("Перенос подтверждён (заглушка UI)");
                }}
              >
                Подтвердить перенос
              </button>
            </div>
          </div>
        </div>
      )}

      {isCancelOpen && (
        <div className="modal show" aria-hidden="false">
          <div className="dialog">
            <h3>Отменить поездку?</h3>
            <p className="sub">
              К возврату: <b>{refundSum}</b>
            </p>
            <div className="rows">
              <label className="radio" style={{ alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={agreeRules}
                  onChange={(event) => setAgreeRules(event.target.checked)}
                />
                <span>Я согласен(на) с правилами возврата</span>
              </label>
            </div>
            <div className="actions">
              <button
                className="btn"
                onClick={() => {
                  setAgreeRules(false);
                  setCancelOpen(false);
                }}
              >
                Оставить
              </button>
              <button
                className="btn danger"
                disabled={!agreeRules}
                onClick={() => {
                  setAgreeRules(false);
                  setCancelOpen(false);
                  alert("Поездка отменена (заглушка UI)");
                }}
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: var(--bg);
          color: var(--ink);
          font: 14px/1.45 Inter, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", sans-serif;
        }
        :root {
          --brand: #1f4e79;
          --accent: #f28c28;
          --ink: #0f172a;
          --muted: #64748b;
          --bg: #f5f7fb;
          --card: #fff;
          --stroke: #e6edf5;
          --ok: #16a34a;
          --warn: #f59e0b;
          --danger: #dc2626;
          --r: 14px;
        }
        * {
          box-sizing: border-box;
        }
        html,
        body {
          height: 100%;
        }
        a {
          color: var(--brand);
          text-decoration: none;
        }
        .page {
          max-width: 1100px;
          margin: 22px auto;
          padding: 0 14px;
        }
        .header {
          background: linear-gradient(180deg, #fff, #fbfdff);
          border: 1px solid var(--stroke);
          border-radius: 16px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
        }
        .route {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }
        .city {
          font-weight: 900;
          font-size: 24px;
        }
        .meta {
          color: var(--muted);
          font-size: 12px;
          margin-top: 4px;
        }
        .pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          background: #fff;
          font-weight: 700;
          font-size: 12px;
        }
        .pill.status-paid {
          background: #eefcf0;
          border-color: #c7f3cf;
          color: #166534;
        }
        .pill.status-hold {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #9a3412;
        }
        .pill.status-cancel {
          background: #fff0f0;
          border-color: #ffd4d4;
          color: #a31d1d;
        }
        .pill.place {
          background: #f3f6ff;
          border-color: #dbe2f3;
          color: #1e388a;
        }
        .pill.bag {
          background: #fff4e8;
          border-color: #ffe0bf;
          color: #a65300;
        }
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--stroke);
          background: #fff;
          color: var(--ink);
          font-weight: 800;
          transition: 0.15s ease;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .btn.primary {
          background: var(--brand);
          color: #fff;
          border-color: transparent;
        }
        .btn.warn {
          background: #fff7ed;
          color: #9a3412;
          border-color: #fed7aa;
        }
        .btn.danger {
          background: #fff0f0;
          color: #a31d1d;
          border-color: #ffd4d4;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-top: 14px;
        }
        @media (max-width: 980px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .actions {
            justify-content: flex-start;
          }
        }
        .card {
          background: var(--card);
          border: 1px solid var(--stroke);
          border-radius: 16px;
          padding: 16px;
        }
        .card h3 {
          margin: 0 0 8px;
          font-size: 13px;
          color: var(--brand);
          text-transform: uppercase;
          letter-spacing: 0.35px;
        }
        .lead {
          font-size: 16px;
          font-weight: 800;
          margin: 2px 0 8px;
        }
        .muted {
          color: var(--muted);
        }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .row + .row {
          margin-top: 6px;
        }
        .badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }
        .badge.ok {
          background: #eefcf0;
          color: #166534;
          border: 1px solid #c7f3cf;
        }
        .badge.warn {
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid #fed7aa;
        }
        .badge.info {
          background: #eef2ff;
          color: #1e3a8a;
          border: 1px solid #dbe2f3;
        }
        .list {
          margin: 10px 0 0;
          padding: 0;
          list-style: none;
        }
        .list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px dashed var(--stroke);
        }
        .list li:last-child {
          border-bottom: none;
        }
        .price {
          font-weight: 800;
        }
        .timeline {
          display: grid;
          grid-template-columns: 18px 1fr;
          gap: 10px;
        }
        .tl {
          position: relative;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          margin-top: 3px;
        }
        .bar {
          position: absolute;
          left: 3px;
          top: 14px;
          width: 2px;
          height: calc(100% - 14px);
          background: var(--stroke);
        }
        .leg {
          border: 1px dashed var(--stroke);
          border-radius: 10px;
          padding: 10px;
          margin-bottom: 10px;
        }
        .leg h4 {
          margin: 0 0 4px;
          font-size: 16px;
        }
        .link {
          color: var(--brand);
          text-decoration: none;
        }
        .modal {
          position: fixed;
          inset: 0;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.32);
          z-index: 50;
        }
        .modal.show {
          display: flex;
        }
        .dialog {
          background: #fff;
          border: 1px solid var(--stroke);
          border-radius: 14px;
          max-width: 560px;
          width: 100%;
          padding: 16px;
        }
        .dialog h3 {
          margin: 0 0 8px;
          font-size: 18px;
        }
        .dialog .sub {
          color: var(--muted);
          margin: 0 0 8px;
        }
        .dialog .rows {
          display: grid;
          gap: 8px;
          margin: 10px 0;
        }
        .dialog .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .input,
        .select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--stroke);
          border-radius: 10px;
          background: #fff;
          font: inherit;
        }
        .radio {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--stroke);
          border-radius: 12px;
          background: #fbfdff;
        }
        .radio + .radio {
          margin-top: 8px;
        }
        .radio input {
          margin-top: 2px;
        }
        .sum {
          font-weight: 800;
        }
        .hint {
          color: var(--muted);
          font-size: 12px;
        }
        .actions-list .row {
          align-items: flex-start;
        }
        .actions-list .lead {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
