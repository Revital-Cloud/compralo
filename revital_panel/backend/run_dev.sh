#!/bin/bash
# Script para ejecutar el servidor de desarrollo FastAPI
# Configura el PYTHONPATH correctamente para que las importaciones funcionen

cd "$(dirname "$0")"
source venv/bin/activate
export PYTHONPATH=./app:$PYTHONPATH
fastapi dev app/main.py --port 8001
