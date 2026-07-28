#!/usr/bin/env python3
import os
from pathlib import Path

try:
    from flask import Flask, Response, make_response
except ImportError as exc:
    raise SystemExit("Flask is required: pip install flask") from exc

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError as exc:
    raise SystemExit("Jinja2 is required: pip install jinja2") from exc

try:
    from weasyprint import HTML
except ImportError as exc:
    raise SystemExit("WeasyPrint is required: pip install weasyprint") from exc

from backend.ticket_weasy_debug import build_context

TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"
TEMPLATE_NAME = "ticket_weasy.html"

app = Flask(__name__)


def render_html() -> str:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template(TEMPLATE_NAME)
    return template.render(**build_context())


@app.get("/public/tickets/<ticket_id>/pdf")
def ticket_pdf(ticket_id: str) -> Response:
    html = render_html()
    pdf_bytes = HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf()
    response = make_response(pdf_bytes)
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f"attachment; filename=ticket-{ticket_id}.pdf"
    return response


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=True)
