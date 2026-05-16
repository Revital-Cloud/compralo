"""
Integración Envia (cotización y generación de guías).

Usa httpx.AsyncClient con timeout 30s. Cotiza carriers CO con slugs oficiales Envia.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote

import httpx
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.config import settings

logger = logging.getLogger(__name__)

# https://docs.envia.com/docs/supported-carriers — `serviEntrega` (camelCase), no `servientrega`.
CARRIERS_CO = ("coordinadora", "serviEntrega", "tcc")
HTTP_TIMEOUT = 30.0
GEOCODES_BASE = "https://geocodes.envia.com"


def _carrier_slug_for_envia_request(carrier: str) -> str:
    """Slug que espera el POST Envia; acepta `servientrega` guardado desde checkout."""
    low = (carrier or "").strip().lower()
    if low == "servientrega":
        return "serviEntrega"
    return (carrier or "").strip()


def _b2c_service_rank(service: str) -> int:
    """
    Menor = mejor para e‑commerce genérico (mercancía en caja).
    Evita elegir por defecto productos tipo documento al empatar precio con paquetería.
    """
    s = (service or "").lower()
    if "doc" in s or "sobre" in s or "carta" in s:
        return 40
    if "industrial" in s or "carga" in s or "ltl" in s:
        return 20
    return 0


def _rate_pick_key(r: Dict[str, Any]) -> tuple[float, int, str]:
    """Orden para elegir una tarifa: precio asc., luego servicio más adecuado B2C, luego nombre."""
    p = float(r.get("price") or 0)
    svc = str(r.get("service") or "")
    return (p, _b2c_service_rank(svc), svc)


def _best_rate_per_carrier(rates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Una opción por transportadora: menor precio; si empata, prioriza paquetería sobre documento."""
    best: Dict[str, Dict[str, Any]] = {}
    for r in rates:
        c = str(r.get("carrier") or "").strip().lower()
        if not c:
            continue
        cur = best.get(c)
        if cur is None or _rate_pick_key(r) < _rate_pick_key(cur):
            best[c] = r
    out = list(best.values())
    out.sort(key=lambda x: (float(x.get("price") or 0), str(x.get("carrier") or "").lower()))
    return out


def _envia_base() -> str:
    return (settings.ENVIA_API_BASE or "https://api-test.envia.com").rstrip("/")


def _float_price(v: Any) -> Optional[float]:
    if v is None:
        return None
    try:
        if isinstance(v, (int, float)):
            return float(v)
        s = str(v).strip().replace(",", "")
        return float(s) if s else None
    except (TypeError, ValueError):
        return None


def _extract_rates_list(body: Any) -> List[Dict[str, Any]]:
    if isinstance(body, list):
        return [x for x in body if isinstance(x, dict)]
    if isinstance(body, dict):
        for key in ("data", "rates", "rate", "quotes"):
            v = body.get(key)
            if isinstance(v, list):
                return [x for x in v if isinstance(x, dict)]
            if isinstance(v, dict):
                inner = v.get("rates") or v.get("data")
                if isinstance(inner, list):
                    return [x for x in inner if isinstance(x, dict)]
    return []


def _origin_payload() -> Dict[str, Any]:
    return {
        "name": settings.ENVIA_ORIGIN_NAME or settings.COMPANY_NAME,
        "company": settings.ENVIA_ORIGIN_COMPANY or settings.COMPANY_NAME,
        "email": settings.ENVIA_ORIGIN_EMAIL or settings.SUPPORT_EMAIL,
        "phone": _digits_phone(settings.ENVIA_ORIGIN_PHONE) or "3000000000",
        "street": settings.ENVIA_ORIGIN_STREET or settings.COMPANY_ADDRESS[:120],
        "number": settings.ENVIA_ORIGIN_NUMBER or "S/N",
        "district": settings.ENVIA_ORIGIN_DISTRICT or "Centro",
        "city": settings.ENVIA_ORIGIN_CITY or "Bogotá",
        "state": settings.ENVIA_ORIGIN_STATE or "DC",
        "country": "CO",
        "postalCode": str(settings.ENVIA_ORIGIN_POSTAL or "110111"),
    }


def _digits_phone(phone: str) -> str:
    if not phone:
        return ""
    return re.sub(r"\D+", "", phone)[:15] or phone


def destination_from_address_row(
    row: Any,
    phone: str,
    email: Optional[str] = None,
) -> Dict[str, Any]:
    """Mapea fila tab_direcciones_usuario (+ teléfono usuario) al JSON destination Envia."""
    calle = str(getattr(row, "calle_direccion", "") or "").strip() or "Calle"
    nombre = str(getattr(row, "nombre_direccion", "") or "").strip() or "Cliente"
    parts = calle.rsplit(" ", 1)
    if len(parts) == 2 and parts[1].isdigit():
        street, number = parts[0], parts[1]
    else:
        street, number = calle, "S/N"
    out: Dict[str, Any] = {
        "name": nombre[:80],
        "phone": _digits_phone(phone) or "3000000000",
        "street": street[:120],
        "number": number[:20],
        "district": str(getattr(row, "barrio", "") or "Centro")[:80],
        "city": str(getattr(row, "ciudad", "") or "")[:80],
        "state": str(getattr(row, "departamento", "") or "")[:10],
        "country": "CO",
        "postalCode": str(getattr(row, "codigo_postal", "") or "000000")[:20],
    }
    em = (email or "").strip()
    if em and "@" in em:
        out["email"] = em[:120]
    return out


def _package_payload(
    weight_kg: float,
    length_cm: float,
    width_cm: float,
    height_cm: float,
    content: str = "Pedido",
    declared_value_cop: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Formato OpenAPI Envia: `dimensions` anidado + `declaredValue` (requeridos en /ship/rate/)."""
    lw = max(0.1, float(length_cm))
    ww = max(0.1, float(width_cm))
    hh = max(0.1, float(height_cm))
    wkg = max(0.01, float(weight_kg))
    if declared_value_cop is not None and float(declared_value_cop) > 0:
        dv = round(float(declared_value_cop), 2)
    else:
        dv = 0.0
    return [
        {
            "content": content[:120],
            "amount": 1,
            "type": "box",
            "declaredValue": dv,
            "weightUnit": "KG",
            "lengthUnit": "CM",
            "weight": wkg,
            "dimensions": {
                "length": lw,
                "width": ww,
                "height": hh,
            },
        }
    ]


def _declared_value_cop_from_order_row(row: Any) -> float:
    """Valor declarado COP para la guía: mercancía (productos − descuentos) o total del pedido; mínimo 1000 COP."""
    vp = float(getattr(row, "vp", None) or 0)
    vd = float(getattr(row, "vd", None) or 0)
    tp = float(getattr(row, "tp", None) or 0)
    goods = max(vp - vd, 0.0)
    if goods <= 0:
        goods = max(tp, 0.0)
    return max(round(goods, 2), 1000.0)


def _generate_settings_for_carrier(carrier: str) -> Dict[str, str]:
    """
    Impresión CO: PDF + tamaño (Envia). Opcional `ENVIA_PRINT_SIZE_SERVIENTREGA` si el carrier
    exige otro tamaño (p. ej. pruebas con Servientrega).
    """
    low = (carrier or "").strip().lower()
    fmt = str(settings.ENVIA_PRINT_FORMAT or "PDF").strip()
    override = settings.ENVIA_PRINT_SIZE_SERVIENTREGA
    if override and low == "servientrega":
        size = str(override).strip()
    else:
        size = str(settings.ENVIA_PRINT_SIZE or "STOCK_4X6").strip()
    return {"currency": "COP", "printFormat": fmt, "printSize": size}


def _colombia_label_settings_attempts(carrier: str) -> List[Dict[str, str]]:
    """
    Secuencia de `settings` para POST /ship/generate/ en CO.
    Servientrega: varios printSize por si el sandbox del carrier falla (Envia code 1300).
    """
    low = (carrier or "").strip().lower()
    fmt = str(settings.ENVIA_PRINT_FORMAT or "PDF").strip()
    if low != "servientrega":
        return [_generate_settings_for_carrier(carrier)]

    sizes_ordered: List[str] = []
    extra_csv = settings.ENVIA_SERVIENTREGA_FALLBACK_PRINT_SIZES
    if extra_csv:
        for part in str(extra_csv).split(","):
            p = part.strip()
            if p:
                sizes_ordered.append(p)
    override = settings.ENVIA_PRINT_SIZE_SERVIENTREGA
    if override:
        sizes_ordered.append(str(override).strip())
    sizes_ordered.extend(
        [
            str(settings.ENVIA_PRINT_SIZE or "STOCK_4X6").strip(),
            "PAPER_7X4.75",
            "STOCK_4X6",
            "PAPER_4X6",
        ]
    )
    seen: set[str] = set()
    out: List[Dict[str, str]] = []
    for s in sizes_ordered:
        if not s or s in seen:
            continue
        seen.add(s)
        out.append({"currency": "COP", "printFormat": fmt, "printSize": s})
    return out if out else [_generate_settings_for_carrier(carrier)]


def _servientrega_generate_retryable(err: Dict[str, Any]) -> bool:
    """Reintentar otro printSize ante fallo del carrier en Envia (típ. 1300 / Servientrega)."""
    code = err.get("code")
    msg = str(err.get("message") or "")
    desc = str(err.get("description") or "")
    if code == 1300:
        return True
    combined = f"{msg} {desc}".lower()
    return "servi" in combined and "entrega" in combined


def _headers() -> Dict[str, str]:
    token = settings.ENVIA_TOKEN
    if not token:
        raise RuntimeError("ENVIA_TOKEN no configurado")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _rate_service_key(item: Dict[str, Any]) -> str:
    """Envia puede devolver solo serviceId (int) o serviceDescription."""
    s = item.get("service")
    if s is not None and str(s).strip():
        return str(s).strip()
    sid = item.get("serviceId")
    if sid is not None and str(sid).strip():
        return str(sid).strip()
    sid2 = item.get("service_id")
    if sid2 is not None and str(sid2).strip():
        return str(sid2).strip()
    desc = item.get("serviceDescription")
    if desc is not None and str(desc).strip():
        return str(desc).strip()
    return ""


async def enrich_colombia_destination(
    client: httpx.AsyncClient, destination: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Envia (CO) espera `city` como código de cobertura/DANE (p. ej. 68001000) y `state` en código
    corto (p. ej. ST), no el nombre legible. Resuelve vía API pública de geocódigos de Envia.
    """
    out = dict(destination)
    if (out.get("country") or "").upper() != "CO":
        return out
    city_raw = str(out.get("city") or "").strip()
    if not city_raw:
        return out
    if len(city_raw) >= 8 and city_raw.isdigit():
        return out

    url = f"{GEOCODES_BASE}/locate/CO/{quote(city_raw)}"
    try:
        r = await client.get(url)
        if r.status_code != 200:
            logger.warning(
                "Geocodes locate HTTP %s city=%s",
                r.status_code,
                city_raw[:60],
            )
            return out
        arr = r.json()
    except Exception as e:
        logger.warning("Geocodes locate error city=%s: %s", city_raw[:60], e)
        return out

    if not isinstance(arr, list) or not arr or not isinstance(arr[0], dict):
        return out
    node = arr[0]
    state_block = node.get("state")
    state_code: Optional[str] = None
    if isinstance(state_block, dict):
        code_obj = state_block.get("code")
        if isinstance(code_obj, dict):
            state_code = code_obj.get("2digit") or code_obj.get("3digit")
        elif isinstance(code_obj, str):
            state_code = code_obj

    norm_postal = re.sub(r"\D", "", str(out.get("postalCode") or ""))
    zips = node.get("zip_codes") or []
    best: Optional[Dict[str, Any]] = None
    if isinstance(zips, list):
        for z in zips:
            if not isinstance(z, dict):
                continue
            info = z.get("info") or {}
            stat = re.sub(r"\D", "", str(info.get("stat") or ""))
            stat8 = re.sub(r"\D", "", str(info.get("stat_8digit") or ""))
            zc = re.sub(r"\D", "", str(z.get("zip_code") or ""))
            if norm_postal and stat and norm_postal == stat:
                best = z
                break
            if norm_postal and len(norm_postal) >= 5 and stat8.startswith(norm_postal[:5]):
                best = z
                break
            if norm_postal and len(norm_postal) >= 5 and zc.startswith(norm_postal[: min(6, len(zc))]):
                best = z
                break
        if best is None and zips:
            best = zips[0] if isinstance(zips[0], dict) else None

    if isinstance(best, dict):
        info = best.get("info") or {}
        stat8 = re.sub(r"\D", "", str(info.get("stat_8digit") or ""))
        stat5 = re.sub(r"\D", "", str(info.get("stat") or ""))
        if stat8.isdigit() and len(stat8) >= 6:
            out["city"] = stat8
        elif stat5.isdigit():
            out["city"] = stat5
        zc = str(best.get("zip_code") or "").strip()
        if zc:
            out["postalCode"] = zc
    if state_code:
        out["state"] = str(state_code)[:5]
    logger.debug(
        "enrich_colombia_destination: city_in=%s -> city_out=%s state=%s postal=%s",
        city_raw[:40],
        out.get("city"),
        out.get("state"),
        out.get("postalCode"),
    )
    return out


def _normalize_rate_item(item: Dict[str, Any], carrier_fallback: str) -> Optional[Dict[str, Any]]:
    carrier = str(item.get("carrier") or carrier_fallback).lower()
    service = _rate_service_key(item)
    if not service:
        return None
    price = _float_price(
        item.get("totalPrice")
        or item.get("total")
        or item.get("price")
        or item.get("basePrice")
        or item.get("basePriceTaxes")
    )
    if price is None or price < 0:
        return None
    name_parts = [carrier, service]
    delivery = item.get("deliveryEstimate") or item.get("delivery_estimate")
    if isinstance(delivery, dict):
        delivery = delivery.get("description") or delivery.get("text")
    return {
        "carrier": carrier,
        "service": service,
        "price": round(price, 2),
        "currency": str(item.get("currency") or "COP"),
        "name": " ".join(p for p in name_parts if p).title(),
        "delivery_estimate": str(delivery) if delivery else None,
    }


async def _post_rate_for_carrier(
    client: httpx.AsyncClient,
    carrier: str,
    origin: Dict[str, Any],
    destination: Dict[str, Any],
    packages: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    slug = _carrier_slug_for_envia_request(carrier)
    url = f"{_envia_base()}/ship/rate/"
    body: Dict[str, Any] = {
        "origin": origin,
        "destination": destination,
        "packages": packages,
        "shipment": {"type": 1, "carrier": slug},
    }
    if (destination.get("country") or "").upper() == "CO":
        body["settings"] = {"currency": "COP"}
    try:
        r = await client.post(url, headers=_headers(), json=body)
        if r.status_code >= 400:
            logger.warning("Envia rate carrier=%s HTTP %s %s", slug, r.status_code, r.text[:500])
            return []
        data = r.json()
        if isinstance(data, dict) and data.get("meta") == "error":
            err = data.get("error") if isinstance(data.get("error"), dict) else {}
            logger.warning(
                "Envia rate carrier=%s error de negocio code=%s desc=%s msg=%s",
                slug,
                err.get("code"),
                err.get("description"),
                err.get("message"),
            )
            return []
        raw_list = _extract_rates_list(data)
        out: List[Dict[str, Any]] = []
        for item in raw_list:
            norm = _normalize_rate_item(item, slug)
            if norm:
                out.append(norm)
        if not out and isinstance(data, dict):
            norm = _normalize_rate_item(data, slug)
            if norm:
                out.append(norm)
        if not out:
            logger.warning(
                "Envia rate carrier=%s sin tarifas parseables. keys=%s body_sample=%s",
                slug,
                list(data.keys()) if isinstance(data, dict) else type(data).__name__,
                (r.text[:600] if isinstance(r.text, str) else "")[:600],
            )
        return out
    except RuntimeError as e:
        logger.warning("Envia rate carrier=%s: %s", slug, e)
        return []
    except Exception as e:
        logger.warning("Envia rate carrier=%s error: %s", slug, e)
        return []


async def get_shipping_rates(
    destination: Dict[str, Any],
    weight_kg: float,
    length_cm: float,
    width_cm: float,
    height_cm: float,
) -> List[Dict[str, Any]]:
    """
    Cotiza en paralelo por carrier CO. Retorna una tarifa por transportadora (la más barata),
    ordenada por precio ascendente.
    """
    packages = _package_payload(weight_kg, length_cm, width_cm, height_cm)
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        origin = await enrich_colombia_destination(client, _origin_payload())
        dest = await enrich_colombia_destination(client, dict(destination))
        tasks = [
            _post_rate_for_carrier(client, carrier, origin, dest, packages)
            for carrier in CARRIERS_CO
        ]
        groups = await asyncio.gather(*tasks)
    for slug_attempt, g in zip(CARRIERS_CO, groups):
        logger.info("Envia cotización carrier=%s tarifas_parseadas=%d", slug_attempt, len(g))
    merged: List[Dict[str, Any]] = []
    for g in groups:
        merged.extend(g)
    merged.sort(key=lambda x: x["price"])
    merged = _best_rate_per_carrier(merged)
    return merged


def _http_url_only(v: Any) -> Optional[str]:
    s = str(v or "").strip()
    if s.startswith("http://") or s.startswith("https://"):
        return s
    return None


def _flatten_response_dicts(obj: Any, max_depth: int = 6) -> List[Dict[str, Any]]:
    """Recorre dict/list anidados para localizar campos en respuestas Envia heterogéneas."""
    out: List[Dict[str, Any]] = []

    def walk(o: Any, depth: int) -> None:
        if depth > max_depth:
            return
        if isinstance(o, dict):
            out.append(o)
            for v in o.values():
                walk(v, depth + 1)
        elif isinstance(o, list):
            for item in o:
                walk(item, depth + 1)

    walk(obj, 0)
    return out


def _parse_envia_generate_response(data: Any) -> Dict[str, Any]:
    """
    POST /ship/generate/ devuelve estructura variable (a veces `data` dict, lista, o campos en sub-objetos).
    """
    tracking_keys = (
        "trackingNumber",
        "tracking_number",
        "tracking",
        "wayBill",
        "waybill",
        "wayBillNumber",
        "guideNumber",
        "numeroGuia",
        "numero_guia",
        "consecutive",
        "radicado",
    )
    label_keys = (
        "labelUrl",
        "label_url",
        "labelPDF",
        "label_pdf",
        "urlLabel",
        "url_label",
        "printFormat1",
    )
    track_url_keys = (
        "trackUrl",
        "track_url",
        "trackingUrl",
        "tracking_url",
        "urlTracking",
        "url_tracking",
    )
    price_keys = ("totalPrice", "price", "amount", "total")

    tracking: Any = None
    label_url: Optional[str] = None
    track_url: Optional[str] = None
    price: Optional[float] = None

    for d in _flatten_response_dicts(data):
        if tracking is None:
            for k in tracking_keys:
                v = d.get(k)
                if v is not None and str(v).strip():
                    tracking = v
                    break
        if label_url is None:
            for k in label_keys:
                v = d.get(k)
                u = _http_url_only(v)
                if u:
                    label_url = u
                    break
        if track_url is None:
            for k in track_url_keys:
                v = d.get(k)
                u = _http_url_only(v)
                if u:
                    track_url = u
                    break
        if price is None:
            for k in price_keys:
                if k in d:
                    price = _float_price(d.get(k))
                    if price is not None:
                        break

    return {
        "tracking_number": str(tracking).strip() if tracking is not None and str(tracking).strip() else None,
        "label_url": label_url,
        "track_url": track_url,
        "price": price,
    }


async def create_shipping_label(
    destination: Dict[str, Any],
    weight_kg: float,
    length_cm: float,
    width_cm: float,
    height_cm: float,
    carrier: str,
    service: str,
    declared_value_cop: Optional[float] = None,
) -> Dict[str, Any]:
    """POST /ship/generate/ — retorna tracking_number, label_url, track_url, carrier, service, price."""
    url = f"{_envia_base()}/ship/generate/"
    dv = float(declared_value_cop) if declared_value_cop is not None else 0.0
    if dv <= 0:
        dv = 1000.0
    packages = _package_payload(
        weight_kg, length_cm, width_cm, height_cm, declared_value_cop=dv
    )
    carrier_low = (carrier or "").strip().lower()

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        origin = await enrich_colombia_destination(client, _origin_payload())
        dest = await enrich_colombia_destination(client, dict(destination))

        if (dest.get("country") or "").upper() == "CO":
            settings_attempts = _colombia_label_settings_attempts(carrier)
        else:
            settings_attempts = [None]

        last_failure: Optional[RuntimeError] = None
        data: Any = None

        for attempt_idx, gen_settings in enumerate(settings_attempts):
            body: Dict[str, Any] = {
                "origin": origin,
                "destination": dest,
                "packages": packages,
                "shipment": {
                    "type": 1,
                    "carrier": _carrier_slug_for_envia_request(carrier),
                    "service": service,
                },
            }
            if gen_settings is not None:
                body["settings"] = gen_settings
            r = await client.post(url, headers=_headers(), json=body)
            if r.status_code >= 400:
                raise RuntimeError(f"Envia generate HTTP {r.status_code}: {r.text[:800]}")
            data = r.json()

            if isinstance(data, dict) and data.get("meta") == "error":
                err = data.get("error") if isinstance(data.get("error"), dict) else {}
                try:
                    raw = json.dumps(data, default=str)[:2500]
                except Exception:
                    raw = str(data)[:2500]
                exc = RuntimeError(
                    f"Envia generate error code={err.get('code')} "
                    f"msg={err.get('message') or err.get('description')} raw={raw}"
                )
                may_retry = (
                    carrier_low == "servientrega"
                    and attempt_idx < len(settings_attempts) - 1
                    and _servientrega_generate_retryable(err)
                )
                if may_retry:
                    logger.warning(
                        "Envia generate Servientrega intento %s/%s printSize=%s: %s — reintentando",
                        attempt_idx + 1,
                        len(settings_attempts),
                        gen_settings.get("printSize"),
                        err.get("message") or err.get("description"),
                    )
                    last_failure = exc
                    continue
                raise exc

            last_failure = None
            break

        if last_failure is not None:
            raise last_failure

    assert data is not None
    parsed = _parse_envia_generate_response(data)
    tracking = parsed["tracking_number"]
    label_url = parsed["label_url"]
    track_url = parsed["track_url"]
    price = parsed["price"]

    if not tracking and not label_url:
        try:
            sample = json.dumps(data, default=str)[:1500]
        except Exception:
            sample = str(data)[:1500]
        logger.warning(
            "Envia generate: sin tracking ni URL de etiqueta HTTP. carrier=%s service=%s sample=%s",
            carrier,
            service,
            sample,
        )

    return {
        "tracking_number": tracking,
        "label_url": label_url,
        "track_url": track_url,
        "carrier": str(carrier).lower(),
        "service": str(service),
        "price": float(price) if price is not None else 0.0,
    }


def load_address_and_phone(
    db: Session, id_direccion: int, id_usuario: int
) -> Optional[Tuple[Any, str, str]]:
    row = db.execute(
        text(
            """
            SELECT d.id_direccion, d.nombre_direccion, d.calle_direccion, d.ciudad, d.departamento,
                   d.codigo_postal, d.barrio, d.id_usuario, u.cel_usuario, u.email_usuario
            FROM tab_direcciones_usuario d
            JOIN tab_usuarios u ON u.id_usuario = d.id_usuario
            WHERE d.id_direccion = :did
              AND d.id_usuario = :uid
              AND d.ind_activa = TRUE
            """
        ),
        {"did": id_direccion, "uid": id_usuario},
    ).fetchone()
    if not row:
        return None
    phone = str(getattr(row, "cel_usuario", "") or "")
    email = str(getattr(row, "email_usuario", "") or "")
    return (row, phone, email)


async def finalize_envia_after_paid_order(
    db: Session,
    order_id: int,
    reference: str,
) -> None:
    """
    Tras pago aprobado: genera guía Envia, inserta tab_ordenes_envio y enlaza tab_ordenes.id_envio.
    Idempotente si id_envio ya está asignado. No relanza excepción si Envia falla (solo log).
    """
    row_lock = db.execute(
        text("SELECT id_envio FROM tab_ordenes WHERE id_orden = :oid"),
        {"oid": order_id},
    ).fetchone()
    if row_lock and getattr(row_lock, "id_envio", None) is not None:
        return

    ship = db.execute(
        text(
            """
            SELECT id_direccion, shipping_carrier, shipping_service, shipping_cost,
                   weight_kg, length_cm, width_cm, height_cm
            FROM tab_checkout_shipping
            WHERE reference = :ref
            """
        ),
        {"ref": reference},
    ).fetchone()
    if not ship:
        logger.warning("finalize_envia: sin tab_checkout_shipping para reference=%s", reference)
        return

    id_direccion = int(ship.id_direccion)
    carrier = str(ship.shipping_carrier).lower().strip()
    service = str(ship.shipping_service).strip()
    costo = float(ship.shipping_cost or 0)
    w_kg = float(ship.weight_kg)
    l_cm = float(ship.length_cm)
    w_cm = float(ship.width_cm)
    h_cm = float(ship.height_cm)

    order_user = db.execute(
        text("SELECT id_usuario FROM tab_ordenes WHERE id_orden = :oid"),
        {"oid": order_id},
    ).fetchone()
    if not order_user:
        return
    id_usuario = int(order_user.id_usuario)

    loaded = load_address_and_phone(db, id_direccion, id_usuario)
    if not loaded:
        logger.error("finalize_envia: dirección %s no válida para usuario %s", id_direccion, id_usuario)
        return
    addr_row, phone, dest_email = loaded
    destination = destination_from_address_row(addr_row, phone, dest_email)

    totals = db.execute(
        text(
            """
            SELECT COALESCE(o.val_total_productos, 0) AS vp,
                   COALESCE(o.val_total_descuentos, 0) AS vd,
                   COALESCE(o.val_total_pedido, 0) AS tp
            FROM tab_ordenes o
            WHERE o.id_orden = :oid
            """
        ),
        {"oid": order_id},
    ).fetchone()
    declared_cop = _declared_value_cop_from_order_row(totals) if totals else 1000.0

    try:
        label = await create_shipping_label(
            destination=destination,
            weight_kg=w_kg,
            length_cm=l_cm,
            width_cm=w_cm,
            height_cm=h_cm,
            carrier=carrier,
            service=service,
            declared_value_cop=declared_cop,
        )
    except Exception as e:
        logger.exception("finalize_envia: fallo al generar guía Envia order_id=%s: %s", order_id, e)
        return

    next_id = db.execute(text("SELECT COALESCE(MAX(id_envio), 0) + 1 AS n FROM tab_ordenes_envio")).scalar()
    id_envio = int(next_id) if next_id is not None else 1
    tracking = label.get("tracking_number")
    track_url = label.get("track_url")
    label_url = label.get("label_url")

    try:
        db.execute(
            text(
                """
                INSERT INTO tab_ordenes_envio (
                    id_envio, id_orden, id_direccion, carrier, service, costo_envio,
                    tracking_number, tracking_url, label_url, estado_envio, fecha_generacion
                ) VALUES (
                    :id_envio, :id_orden, :id_direccion, :carrier, :service, :costo_envio,
                    :tracking_number, :tracking_url, :label_url, :estado_envio, NOW()
                )
                """
            ),
            {
                "id_envio": id_envio,
                "id_orden": order_id,
                "id_direccion": id_direccion,
                "carrier": carrier,
                "service": service,
                "costo_envio": int(round(costo)),
                "tracking_number": tracking,
                "tracking_url": track_url,
                "label_url": label_url,
                "estado_envio": "generada",
            },
        )
        db.execute(
            text("UPDATE tab_ordenes SET id_envio = :eid, fec_update = NOW() WHERE id_orden = :oid"),
            {"eid": id_envio, "oid": order_id},
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        logger.warning("finalize_envia: inserción duplicada o FK order_id=%s (omitido)", order_id)
    else:
        logger.info(
            "finalize_envia: guía creada order_id=%s id_envio=%s tracking=%s",
            order_id,
            id_envio,
            tracking,
        )
        try:
            from services.email_service import send_shipping_label_generated_email

            await send_shipping_label_generated_email(
                order_id=order_id,
                carrier=carrier,
                service=service,
                tracking_number=str(tracking).strip() if tracking else None,
                tracking_url=str(track_url).strip() if track_url else None,
                label_url=str(label_url).strip() if label_url else None,
            )
        except Exception:
            logger.exception(
                "finalize_envia: no se pudo enviar email de guía order_id=%s",
                order_id,
            )


def parse_envia_webhook_body(raw: Dict[str, Any]) -> Tuple[Optional[str], Optional[str]]:
    """Extrae trackingNumber y status de payloads planos o anidados."""
    tn = raw.get("trackingNumber") or raw.get("tracking_number")
    st = raw.get("status") or raw.get("estado")
    if not tn and isinstance(raw.get("data"), dict):
        d = raw["data"]
        tn = d.get("trackingNumber") or d.get("tracking_number")
        st = d.get("status") or d.get("estado")
    if tn is not None:
        tn = str(tn).strip()
    if st is not None:
        st = str(st).strip()
    return (tn or None, st or None)


def apply_envia_tracking_update(db: Session, tracking_number: str, status: Optional[str]) -> bool:
    row = db.execute(
        text("SELECT id_envio FROM tab_ordenes_envio WHERE tracking_number = :tn LIMIT 1"),
        {"tn": tracking_number},
    ).fetchone()
    if not row:
        return False
    id_envio = int(row.id_envio)
    st_val = status or "actualizado"
    delivered_markers = ("delivered", "entregad", "entreg", "completed", "finaliz")
    low = st_val.lower()
    if any(m in low for m in delivered_markers):
        db.execute(
            text(
                """
                UPDATE tab_ordenes_envio
                SET estado_envio = :st, fecha_entrega = COALESCE(fecha_entrega, NOW())
                WHERE id_envio = :id_envio
                """
            ),
            {"st": st_val, "id_envio": id_envio},
        )
    else:
        db.execute(
            text("UPDATE tab_ordenes_envio SET estado_envio = :st WHERE id_envio = :id_envio"),
            {"st": st_val, "id_envio": id_envio},
        )
    db.commit()
    return True
