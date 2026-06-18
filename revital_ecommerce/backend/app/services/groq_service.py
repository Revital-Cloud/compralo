"""
Servicio para integración con Groq API (LLM).
Usa el SDK oficial groq para chat completions.
Incluye:
- Manejo de tools (function calling)
- parseErrorManager para reparar tool-calls inválidas
- Backoff con reintentos en caso de rate limiting.
"""
import logging
import json
import re
import time
from typing import Any, Dict, List, Optional, Tuple

from groq import Groq

from core.config import settings

logger = logging.getLogger(__name__)

# Modelos recomendados en Groq (configurables vía entorno en core.config):
# - LIGHT_MODEL: más rápido y barato, ideal para la mayoría de tareas de asistente/admin.
# - HEAVY_MODEL: más potente, usar solo para análisis muy complejos o cuando se necesite explícitamente.
LIGHT_MODEL = settings.GROQ_LIGHT_MODEL
HEAVY_MODEL = settings.GROQ_HEAVY_MODEL
DEFAULT_MODEL = LIGHT_MODEL

# Tope de tokens de salida por defecto (control de coste/latencia).
DEFAULT_MAX_TOKENS = settings.GROQ_MAX_TOKENS

_FAILED_GENERATION_RE = re.compile(
    r"^<function=(?P<name>[a-zA-Z0-9_:-]+)>(?P<args>\{.*\})(?:</function>)?$",
    re.DOTALL,
)


def is_groq_available() -> bool:
    """Indica si Groq est? configurado (API key presente)."""
    return bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())


def usage_to_dict(usage: Any) -> Dict[str, int]:
    """Normaliza el objeto/dict `usage` de Groq a {prompt,completion,total}_tokens."""
    if usage is None:
        return {}
    get = usage.get if isinstance(usage, dict) else lambda k, d=None: getattr(usage, k, d)
    out: Dict[str, int] = {}
    for key in ("prompt_tokens", "completion_tokens", "total_tokens"):
        try:
            val = get(key)
            if val is not None:
                out[key] = int(val)
        except Exception:
            continue
    return out


def _log_usage(where: str, model: str, usage: Any) -> None:
    """Registra el consumo de tokens (observabilidad de coste)."""
    u = usage_to_dict(usage)
    if u:
        logger.info(
            "Groq usage [%s] model=%s prompt=%s completion=%s total=%s",
            where, model, u.get("prompt_tokens", 0),
            u.get("completion_tokens", 0), u.get("total_tokens", 0),
        )


def _build_client() -> Groq:
    """Crea una instancia de cliente Groq validando que haya API key."""
    if not is_groq_available():
        raise ValueError("GROQ_API_KEY no est? configurada.")
    return Groq(api_key=settings.GROQ_API_KEY)


def _is_rate_limit_error(exc: Exception) -> bool:
    """
    Detecta errores de rate limiting a partir del mensaje del SDK.

    Groq suele devolver:
    - código HTTP 429
    - error.code = 'rate_limit_exceeded'
    """
    text = str(exc).lower()
    if "rate_limit_exceeded" in text:
        return True
    if "status code: 429" in text or "code: 429" in text:
        return True
    return False


def chat_completion(
    user_content: str,
    system_content: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.3,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> str:
    """
    Llama a Groq Chat Completions y devuelve el texto de la respuesta.

    Args:
        user_content: Contenido del mensaje del usuario.
        system_content: Contenido del mensaje de sistema (instrucciones). Opcional.
        model: Modelo a usar. Por defecto el modelo ligero configurado.
        temperature: Temperatura (0-2). Por defecto 0.3 para respuestas m?s deterministas.
        max_tokens: Tope de tokens de salida (control de coste/latencia).

    Returns:
        str: Contenido de la respuesta del asistente.

    Raises:
        ValueError: Si GROQ_API_KEY no est? configurada.
        RuntimeError: Si la API de Groq devuelve error (timeout, rate limit, etc.).
    """
    if not is_groq_available():
        raise ValueError("GROQ_API_KEY no est? configurada. Las funciones de IA no est?n disponibles.")

    messages = []
    if system_content:
        messages.append({"role": "system", "content": system_content})
    messages.append({"role": "user", "content": user_content})

    max_retries = 2
    base_delay = 0.5
    attempt = 0

    while True:
        try:
            client = _build_client()
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            _log_usage("chat_completion", model, getattr(response, "usage", None))
            content = response.choices[0].message.content
            return content or ""
        except Exception as e:
            if _is_rate_limit_error(e) and attempt < max_retries:
                delay = base_delay * (2**attempt)
                logger.warning(
                    "Groq chat_completion rate limited (intentando de nuevo %s/%s en %.2fs)",
                    attempt + 1,
                    max_retries,
                    delay,
                )
                time.sleep(delay)
                attempt += 1
                continue
            logger.exception("Unexpected error calling Groq")
            raise RuntimeError(f"Error inesperado al usar Groq: {str(e)}") from e


def chat_with_tools(
    messages: List[Dict[str, Any]],
    tools: List[Dict[str, Any]],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.3,
    tool_choice: str = "auto",
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> Dict[str, Any]:
    """
    Llama a Groq Chat Completions con tools (function calling) y devuelve la
    respuesta cruda del modelo.

    Esta funci?n no ejecuta ninguna acci?n; solo devuelve la estructura con
    posibles tool_calls para que la capa de servicio decida qu? hacer.
    """
    if not is_groq_available():
        raise ValueError("GROQ_API_KEY no est? configurada. Las funciones de IA no est?n disponibles.")

    max_retries = 2
    base_delay = 0.5
    attempt = 0

    while True:
        try:
            client = _build_client()
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools,
                tool_choice=tool_choice,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            # Convertimos a dict para desacoplar de la clase del SDK.
            result = response.to_dict() if hasattr(response, "to_dict") else dict(response)  # type: ignore[arg-type]
            _log_usage("chat_with_tools", model, result.get("usage") if isinstance(result, dict) else None)
            return result
        except Exception as e:
            # Si es rate limit, aplicamos backoff y reintentamos.
            if _is_rate_limit_error(e) and attempt < max_retries:
                delay = base_delay * (2**attempt)
                logger.warning(
                    "Groq chat_with_tools rate limited (intentando de nuevo %s/%s en %.2fs)",
                    attempt + 1,
                    max_retries,
                    delay,
                )
                time.sleep(delay)
                attempt += 1
                continue

            # parseErrorManager: si Groq rechaza una tool-call por schema,
            # intentamos reparar la llamada a partir de failed_generation y el schema local.
            repaired = _parse_error_manager_repair_tool_call(e, tools)
            if repaired is not None:
                logger.warning("Groq tool-call validation failed; repaired locally and continued.")
                return repaired

            logger.exception("Unexpected error calling Groq with tools")
            raise RuntimeError(f"Error inesperado al usar Groq (tools): {str(e)}") from e


def _parse_error_manager_repair_tool_call(exc: Exception, tools: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Intenta reparar errores de validaci?n de tool-calls de Groq.

    Caso t?pico:
    - message: "tool call validation failed: parameters for tool X did not match schema..."
    - failed_generation: "<function=X>{...json...}"

    Estrategia:
    - Parsear el payload del error (si viene embebido en el mensaje del SDK)
    - Extraer tool + args de failed_generation
    - Coaccionar tipos seg?n el schema local de la tool
    - Devolver una respuesta sint?tica con tool_calls para que el servicio contin?e.
    """
    payload = _try_extract_groq_error_payload(str(exc))
    if not payload:
        return None

    err = payload.get("error") or {}
    msg = (err.get("message") or "").lower()
    failed_generation = err.get("failed_generation")
    if "tool call validation failed" not in msg or not isinstance(failed_generation, str):
        return None

    parsed = _parse_failed_generation(failed_generation)
    if not parsed:
        return None
    tool_name, raw_args = parsed

    schema = _get_tool_schema(tools, tool_name)
    if not schema:
        return None

    coerced_args = _coerce_args_to_schema(raw_args, schema)

    # Respuesta sint?tica estilo OpenAI/Groq
    return {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "repaired_tool_call",
                            "type": "function",
                            "function": {
                                "name": tool_name,
                                "arguments": json.dumps(coerced_args, ensure_ascii=False),
                            },
                        }
                    ],
                }
            }
        ]
    }


def _try_extract_groq_error_payload(text: str) -> Optional[Dict[str, Any]]:
    """
    Extrae el JSON del error desde el string del SDK.
    Ejemplo esperado: "Error code: 400 - {'error': {...}}"
    """
    marker = " - "
    if marker not in text:
        return None
    # Tomar el ?ltimo " - " para evitar cortar mensajes internos
    _, tail = text.split(marker, 1)
    tail = tail.strip()
    # El SDK a veces devuelve dict con comillas simples; normalizamos a JSON si es posible.
    try:
        # Intentar parsear como JSON directo
        return json.loads(tail)
    except Exception:
        pass
    try:
        # Intentar parsear como literal de Python (dict con comillas simples) de forma segura
        import ast

        val = ast.literal_eval(tail)
        return val if isinstance(val, dict) else None
    except Exception:
        return None


def _parse_failed_generation(s: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    s = s.strip()
    # Nuevo formato: JSON array de llamadas [{"name": ..., "parameters": {...}}]
    if s.startswith("["):
        try:
            arr = json.loads(s)
            if isinstance(arr, list) and arr:
                first = arr[0]
                if isinstance(first, dict):
                    name = first.get("name")
                    params = first.get("parameters") or {}
                    if isinstance(name, str) and isinstance(params, dict):
                        return name, params
        except Exception:
            # Si falla, seguimos con el formato antiguo
            pass

    # Formato antiguo: <function=name>{...}</function>
    m = _FAILED_GENERATION_RE.match(s)
    if not m:
        return None
    name = m.group("name")
    args_raw = m.group("args")
    try:
        args = json.loads(args_raw)
        if not isinstance(args, dict):
            args = {}
    except Exception:
        args = {}
    return name, args


def _get_tool_schema(tools: List[Dict[str, Any]], tool_name: str) -> Optional[Dict[str, Any]]:
    for t in tools:
        fn = t.get("function") if isinstance(t, dict) else None
        if not isinstance(fn, dict):
            continue
        if fn.get("name") == tool_name:
            params = fn.get("parameters")
            return params if isinstance(params, dict) else None
    return None


def _coerce_args_to_schema(args: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Coacciona argumentos al schema JSON:
    - number: convierte strings num?ricos a int/float
    - boolean: convierte strings t?picos a bool
    - string: convierte a str si viene otro tipo
    - elimina keys no permitidas si additionalProperties=False
    """
    props = schema.get("properties") or {}
    additional = schema.get("additionalProperties", True)
    if not isinstance(props, dict):
        return args

    def to_number(v: Any) -> Optional[float]:
        if v is None:
            return None
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            s = v.strip().replace(",", "")
            try:
                return float(s)
            except Exception:
                return None
        return None

    def to_bool(v: Any) -> Optional[bool]:
        if v is None:
            return None
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            return bool(v)
        if isinstance(v, str):
            s = v.strip().lower()
            if s in {"true", "1", "s?", "si", "ok", "vale"}:
                return True
            if s in {"false", "0", "no"}:
                return False
        return None

    coerced: Dict[str, Any] = {}
    for key, value in args.items():
        if key not in props and additional is False:
            continue
        spec = props.get(key) if key in props else None
        if not isinstance(spec, dict):
            coerced[key] = value
            continue
        t = spec.get("type")
        if t == "number":
            n = to_number(value)
            if n is None:
                continue
            coerced[key] = int(n) if float(n).is_integer() else n
            continue
        if t == "boolean":
            b = to_bool(value)
            if b is None:
                continue
            coerced[key] = b
            continue
        if t == "string":
            coerced[key] = value if isinstance(value, str) else str(value)
            continue
        coerced[key] = value

    return coerced
