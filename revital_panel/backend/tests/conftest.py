import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
_app_dir = _backend_root / "app"
if str(_app_dir) not in sys.path:
    sys.path.insert(0, str(_app_dir))
