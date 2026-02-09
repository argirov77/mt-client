#!/usr/bin/env python3
import argparse
import base64
import os
from datetime import datetime

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError as exc:
    raise SystemExit("Jinja2 is required: pip install jinja2") from exc

try:
    from weasyprint import HTML
except ImportError as exc:
    raise SystemExit("WeasyPrint is required: pip install weasyprint") from exc

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "templates")
PDF_TEMPLATE_NAME = "ticket_weasy.html"
BROWSER_TEMPLATE_NAME = "ticket.html"
REQUIRED_CONTEXT_KEYS = {
    "i18n",
    "route",
    "ticket",
    "passenger",
    "payment",
    "departure",
    "arrival",
    "timeline",
    "qr_data_uri",
    "deep_link",
    "status_chip",
}


def _qr_data_uri() -> str:
    svg = """
    <svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='#ffffff'/>
      <rect x='8' y='8' width='32' height='32' fill='#111827'/>
      <rect x='80' y='8' width='32' height='32' fill='#111827'/>
      <rect x='8' y='80' width='32' height='32' fill='#111827'/>
      <rect x='52' y='52' width='16' height='16' fill='#111827'/>
    </svg>
    """.strip()
    encoded = base64.b64encode(svg.encode("utf-8")).decode("utf-8")
    return f"data:image/svg+xml;base64,{encoded}"


def build_context():
    long_email = (
        "verylongemailaddress.with.a.lot.of.parts.and.subdomains."
        "evenmorecharactersaddedforstress@example.com"
    )
    long_deep_link = (
        "https://client.example.com/api/q/"
        "opaque-token-with-many-characters-1234567890abcdefghijklmnopqrstuvwxyz"
        "?utm_source=pdf&utm_medium=qr&utm_campaign=super-long-campaign-name"
    )
    long_address = (
        "Россия, Республика Татарстан, город Казань, улица Санкт-Петербургская, "
        "дом 123456, корпус 7, подъезд 3, этаж 15, офис 1234567890"
    )
    long_ticket_number = "TICKET-" + "1234567890" * 4
    long_order_number = "ORDER-" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" * 3

    i18n = {
        "brand": "Maximov Tours",
        "ticket_title": "Электронный билет",
        "ticket_number": "Билет №",
        "order_number": "Заказ №",
        "seat": "Место",
        "baggage": "Багаж",
        "trip": "Поездка",
        "departure": "Отправление",
        "arrival": "Прибытие",
        "on_the_way": "В пути",
        "passenger": "Пассажир",
        "payment": "Оплата",
        "status": "Статус",
        "method": "Метод",
        "amount": "Сумма",
        "qr_title": "QR + ссылка",
        "open_online": "Открыть онлайн",
        "hotline": "на линии +7 (800) 555-35-35",
        "since": "с 1991 года",
        "time_note": "Время может отличаться",
    }

    context = {
        "i18n": i18n,
        "route": {
            "from": "Санкт-Петербург",
            "to": "Казань",
            "label": "Санкт-Петербург → Казань · рейс MT-777",
            "date": "12 ноября 2025",
        },
        "ticket": {
            "number": long_ticket_number,
            "order_number": long_order_number,
            "seat": "12A",
            "baggage": "1×20кг",
        },
        "passenger": {
            "name": "Иванов Иван Иванович",
            "phone": "+7 (999) 123-45-67",
            "email": long_email,
        },
        "payment": {
            "status": "Оплачен",
            "method": "Карта Mastercard",
            "amount": "12 345 ₽",
        },
        "departure": {
            "name": "Автовокзал №1",
            "datetime": "12.11.2025 08:15",
            "address": long_address,
            "map_url": long_deep_link,
        },
        "arrival": {
            "name": "Центральный автовокзал",
            "datetime": "12.11.2025 21:00",
            "address": long_address,
            "map_url": long_deep_link,
        },
        "timeline": {"duration_text": "12 ч 45 мин"},
        "qr_data_uri": _qr_data_uri(),
        "deep_link": long_deep_link,
        "status_chip": "<span class='status-chip status-paid'>Оплачен</span>",
    }

    return context


def _validate_context(context: dict) -> None:
    missing = sorted(REQUIRED_CONTEXT_KEYS - context.keys())
    if missing:
        raise ValueError(f"Context is missing required keys: {', '.join(missing)}")


def render_ticket(output_dir: str) -> None:
    env = Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    context = build_context()
    _validate_context(context)
    template = env.get_template(PDF_TEMPLATE_NAME)
    html = template.render(**context)

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(output_dir, f"ticket_weasy_debug_{timestamp}.html")
    pdf_path = os.path.join(output_dir, f"ticket_weasy_debug_{timestamp}.pdf")

    with open(html_path, "w", encoding="utf-8") as handle:
        handle.write(html)

    HTML(string=html, base_url=TEMPLATE_DIR).write_pdf(pdf_path)

    print(f"HTML saved to {html_path}")
    print(f"PDF saved to {pdf_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a WeasyPrint-safe ticket PDF with extreme test data.",
    )
    parser.add_argument(
        "--output-dir",
        default="/tmp",
        help="Directory to write rendered HTML and PDF artifacts.",
    )
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    render_ticket(args.output_dir)


if __name__ == "__main__":
    main()
