try:
    import jsonschema
    from jsonschema import validate
    JSONSCHEMA_AVAILABLE = True
except Exception:
    JSONSCHEMA_AVAILABLE = False
from typing import Any, Dict

DEFAULT_MAX_PAGE_SIZE = 100

import json
from pathlib import Path


def validate_schema(payload: Dict[str, Any], schema: Dict[str, Any]):
    if not JSONSCHEMA_AVAILABLE:
        # jsonschema not installed; skip strict validation in this environment
        return True, None
    try:
        validate(instance=payload, schema=schema)
        return True, None
    except jsonschema.ValidationError as exc:
        return False, str(exc)


# Load schemas from server/schemas/*.json when available, else fallback to defaults
SCHEMA_DIR = Path(__file__).parent / 'schemas'

def _load_schema_file(name: str, default: Dict[str, Any]) -> Dict[str, Any]:
    p = SCHEMA_DIR / f"{name}.json"
    if p.exists():
        try:
            return json.loads(p.read_text())
        except Exception:
            return default
    return default


# Default embedded schemas (used if files are missing)
_DEFAULT_SIMULATE_SCHEMA = {
    'type': 'object',
    'properties': {
        'fuel_change_pct': {'type': 'number'},
        'wage_change_pct': {'type': 'number'},
        'maint_change_pct': {'type': 'number'},
        'revenue_change_pct': {'type': 'number'},
    },
    'additionalProperties': False
}

_DEFAULT_AI_QUERY_SCHEMA = {
    'type': 'object',
    'properties': {
        'prompt': {'type': 'string', 'minLength': 1}
    },
    'required': ['prompt'],
    'additionalProperties': False
}

SIMULATE_SCHEMA = _load_schema_file('simulate', _DEFAULT_SIMULATE_SCHEMA)
AI_QUERY_SCHEMA = _load_schema_file('ai_query', _DEFAULT_AI_QUERY_SCHEMA)
