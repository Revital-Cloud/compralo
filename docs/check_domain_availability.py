#!/usr/bin/env python3
"""
Consulta disponibilidad de dominios con WhoisXML Domain Availability API.

Documentación: https://domain-availability.whoisxmlapi.com/api/documentation/making-requests
Registro (100 consultas gratis): https://domain-availability.whoisxmlapi.com

Uso:
  export WHOISXML_API_KEY="tu_clave"
  python docs/check_domain_availability.py accord.ai trace.ai qora.ai
  python docs/check_domain_availability.py -f docs/domain-candidates.txt
  python docs/check_domain_availability.py -f domains.txt --mode DNS_AND_WHOIS -o resultados.csv

La API admite ~30 req/s; el script limita por defecto a 4 req/s para no saturar la cuota.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable, Literal

API_BASE = "https://domain-availability.whoisxmlapi.com/api/v1"
DEFAULT_DELAY_S = 0.25
VIABILITY_LABELS = {
    "AVAILABLE": ("Alta", "Libre para registrar (según API)"),
    "UNAVAILABLE": ("Nula", "Registrado o no disponible"),
    "UNDETERMINED": ("Dudosa", "La API no pudo determinarlo; verificar en registrador"),
}

Mode = Literal["DNS_ONLY", "DNS_AND_WHOIS"]
Credits = Literal["DA", "WHOIS"]


@dataclass
class DomainResult:
    domain: str
    availability: str
    viability: str
    note: str
    error: str | None = None
    raw: dict[str, Any] | None = None


def _load_env_file(path: Path) -> None:
    """Carga KEY=VALUE desde un .env sin dependencias externas."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        os.environ.setdefault(key, value)


def _normalize_domain(value: str) -> str:
    value = value.strip().lower()
    if value.startswith("http://") or value.startswith("https://"):
        value = urllib.parse.urlparse(value).netloc or value
    return value.lstrip(".")


def _parse_availability(payload: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    """Extrae domainAvailability de las formas de respuesta conocidas."""
    candidates: list[Any] = [
        payload.get("domainAvailability"),
        (payload.get("DomainInfo") or {}).get("domainAvailability"),
        (payload.get("WhoisRecord") or {}).get("domainAvailability"),
    ]
    for item in candidates:
        if isinstance(item, str) and item:
            return item.upper(), payload

    # Búsqueda recursiva superficial por si cambia el esquema
    def walk(obj: Any, depth: int = 0) -> str | None:
        if depth > 4:
            return None
        if isinstance(obj, dict):
            if "domainAvailability" in obj and isinstance(obj["domainAvailability"], str):
                return obj["domainAvailability"].upper()
            for v in obj.values():
                found = walk(v, depth + 1)
                if found:
                    return found
        elif isinstance(obj, list):
            for v in obj:
                found = walk(v, depth + 1)
                if found:
                    return found
        return None

    found = walk(payload)
    if found:
        return found, payload

    if payload.get("ErrorMessage"):
        raise ValueError(str(payload["ErrorMessage"]))
    raise ValueError(f"Respuesta sin domainAvailability: {json.dumps(payload)[:300]}")


def check_domain(
    api_key: str,
    domain: str,
    *,
    mode: Mode = "DNS_ONLY",
    credits: Credits = "DA",
    rdap: int = 0,
    timeout_s: float = 30.0,
) -> DomainResult:
    """Consulta un dominio en la API."""
    domain = _normalize_domain(domain)
    params = urllib.parse.urlencode(
        {
            "apiKey": api_key,
            "domainName": domain,
            "mode": mode,
            "credits": credits,
            "rdap": str(rdap),
            "outputFormat": "JSON",
        }
    )
    url = f"{API_BASE}?{params}"
    request = urllib.request.Request(url, headers={"Accept": "application/json"})

    try:
        with urllib.request.urlopen(request, timeout=timeout_s) as response:
            body = response.read().decode("utf-8")
        payload = json.loads(body)
        availability, _ = _parse_availability(payload)
        viability, note = VIABILITY_LABELS.get(availability, ("Dudosa", "Estado desconocido"))
        return DomainResult(
            domain=domain,
            availability=availability,
            viability=viability,
            note=note,
            raw=payload,
        )
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        return DomainResult(
            domain=domain,
            availability="ERROR",
            viability="—",
            note="Error HTTP",
            error=f"HTTP {exc.code}: {detail}",
        )
    except urllib.error.URLError as exc:
        return DomainResult(
            domain=domain,
            availability="ERROR",
            viability="—",
            note="Error de red",
            error=str(exc.reason),
        )
    except (json.JSONDecodeError, ValueError) as exc:
        return DomainResult(
            domain=domain,
            availability="ERROR",
            viability="—",
            note="Error al interpretar respuesta",
            error=str(exc),
        )


def iter_domains_from_file(path: Path) -> list[str]:
    domains: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Permite líneas tipo "accord.ai  # comentario"
        token = line.split("#", 1)[0].strip().split()[0]
        if token:
            domains.append(_normalize_domain(token))
    return domains


def run_checks(
    api_key: str,
    domains: Iterable[str],
    *,
    mode: Mode,
    credits: Credits,
    rdap: int,
    delay_s: float,
    verbose: bool,
) -> list[DomainResult]:
    results: list[DomainResult] = []
    seen: set[str] = set()
    for domain in domains:
        domain = _normalize_domain(domain)
        if not domain or domain in seen:
            continue
        seen.add(domain)
        if verbose:
            print(f"Consultando {domain}...", file=sys.stderr)
        results.append(
            check_domain(
                api_key,
                domain,
                mode=mode,
                credits=credits,
                rdap=rdap,
            )
        )
        if delay_s > 0:
            time.sleep(delay_s)
    return results


def print_table(results: list[DomainResult]) -> None:
    headers = ("Dominio", "Estado API", "Viabilidad", "Nota")
    rows = [(r.domain, r.availability, r.viability, r.error or r.note) for r in results]
    widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))

    def fmt_row(cells: tuple[str, ...]) -> str:
        return "  ".join(cell.ljust(widths[i]) for i, cell in enumerate(cells))

    print(fmt_row(headers))
    print(fmt_row(tuple("-" * w for w in widths)))
    for row in rows:
        print(fmt_row(row))

    available = sum(1 for r in results if r.availability == "AVAILABLE")
    print()
    print(f"Total: {len(results)} | Disponibles: {available} | No disponibles/otros: {len(results) - available}")


def write_csv(path: Path, results: list[DomainResult]) -> None:
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["domain", "availability", "viability", "note", "error"],
        )
        writer.writeheader()
        for r in results:
            writer.writerow(
                {
                    "domain": r.domain,
                    "availability": r.availability,
                    "viability": r.viability,
                    "note": r.note,
                    "error": r.error or "",
                }
            )


def write_json(path: Path, results: list[DomainResult], include_raw: bool) -> None:
    payload = []
    for r in results:
        item = {k: v for k, v in asdict(r).items() if k != "raw" or include_raw}
        if not include_raw:
            item.pop("raw", None)
        elif r.raw is not None:
            item["raw"] = r.raw
        payload.append(item)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Verifica disponibilidad de dominios con WhoisXML Domain Availability API.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Ejemplos:\n"
            "  %(prog)s accord.ai trace.ai mode.ai\n"
            "  %(prog)s -f candidatos.txt --mode DNS_AND_WHOIS\n"
            "  %(prog)s -f candidatos.txt -o salida.csv --json salida.json\n"
        ),
    )
    parser.add_argument(
        "domains",
        nargs="*",
        help="Dominios a consultar (ej. accord.ai trace.ai)",
    )
    parser.add_argument(
        "-f",
        "--file",
        type=Path,
        help="Archivo con un dominio por línea (# = comentario)",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=Path(__file__).with_name(".env.domain-check"),
        help="Ruta a .env con WHOISXML_API_KEY (por defecto: docs/.env.domain-check)",
    )
    parser.add_argument(
        "--mode",
        choices=("DNS_ONLY", "DNS_AND_WHOIS"),
        default="DNS_AND_WHOIS",
        help="DNS_ONLY es más rápido; DNS_AND_WHOIS más preciso (recomendado)",
    )
    parser.add_argument(
        "--credits",
        choices=("DA", "WHOIS"),
        default="DA",
        help="Tipo de créditos a consumir (DA = Domain Availability)",
    )
    parser.add_argument(
        "--rdap",
        type=int,
        choices=(0, 1, 2),
        default=0,
        help="Protocolo al usar DNS_AND_WHOIS (0=auto, 1=RDAP, 2=WHOIS)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=DEFAULT_DELAY_S,
        help=f"Segundos entre consultas (default: {DEFAULT_DELAY_S})",
    )
    parser.add_argument(
        "-o",
        "--csv",
        type=Path,
        help="Guardar resultados en CSV",
    )
    parser.add_argument(
        "--json",
        type=Path,
        dest="json_out",
        help="Guardar resultados en JSON",
    )
    parser.add_argument(
        "--include-raw",
        action="store_true",
        help="Incluir respuesta completa de la API en el JSON",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Muestra progreso en stderr",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    _load_env_file(args.env_file)
    api_key = os.environ.get("WHOISXML_API_KEY", "").strip()
    if not api_key:
        print(
            "Error: define WHOISXML_API_KEY en el entorno o en "
            f"{args.env_file}\n"
            "Obtén la clave en https://domain-availability.whoisxmlapi.com "
            "(100 consultas gratis al registrarte).",
            file=sys.stderr,
        )
        return 1

    domains: list[str] = list(args.domains)
    if args.file:
        if not args.file.is_file():
            print(f"Error: no existe el archivo {args.file}", file=sys.stderr)
            return 1
        domains.extend(iter_domains_from_file(args.file))

    domains = [_normalize_domain(d) for d in domains if d.strip()]
    if not domains:
        parser.print_help()
        print("\nError: indica dominios por argumentos o con -f/--file.", file=sys.stderr)
        return 1

    results = run_checks(
        api_key,
        domains,
        mode=args.mode,
        credits=args.credits,
        rdap=args.rdap,
        delay_s=args.delay,
        verbose=args.verbose,
    )

    print_table(results)

    if args.csv:
        write_csv(args.csv, results)
        print(f"\nCSV guardado en {args.csv}")
    if args.json_out:
        write_json(args.json_out, results, include_raw=args.include_raw)
        print(f"JSON guardado en {args.json_out}")

    has_errors = any(r.availability == "ERROR" for r in results)
    return 1 if has_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
