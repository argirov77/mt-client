#!/usr/bin/env python3
import argparse
import os
from datetime import datetime
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError as exc:
    raise SystemExit("Jinja2 is required: pip install jinja2") from exc

try:
    from weasyprint import HTML
except ImportError as exc:
    raise SystemExit("WeasyPrint is required: pip install weasyprint") from exc

from backend.ticket_weasy_debug import build_context

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "backend" / "templates"
TEMPLATE_NAME = "ticket_weasy.html"


def render_ticket(output_dir: str) -> None:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template(TEMPLATE_NAME)
    html = template.render(**build_context())

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    html_path = os.path.join(output_dir, f"ticket_weasy_debug_{timestamp}.html")
    pdf_path = os.path.join(output_dir, f"ticket_weasy_debug_{timestamp}.pdf")

    with open(html_path, "w", encoding="utf-8") as handle:
        handle.write(html)

    HTML(string=html, base_url=str(TEMPLATE_DIR)).write_pdf(pdf_path)

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
