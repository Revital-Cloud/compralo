"""Sesión de base de datos falsa para probar `builder_service` sin Postgres.

Interpreta el SQL parametrizado del servicio (SELECT/INSERT/UPDATE/DELETE sobre
`tab_cms_content`) contra un diccionario en memoria, replicando el comportamiento
relevante: lectura por nombre, listado por prefijo, upsert e incremento de versión.
"""
import json
from datetime import datetime


class _FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def mappings(self):
        return self

    def first(self):
        return self._rows[0] if self._rows else None

    def all(self):
        return list(self._rows)


class FakeSession:
    def __init__(self):
        # nom_cms_content -> row dict
        self.store: dict[str, dict] = {}
        self.committed = False
        self.rolled_back = False
        self._seq = 0

    # API usada por el servicio -------------------------------------------------
    def execute(self, query, params=None):
        sql = " ".join(str(query).split())
        params = params or {}

        if sql.startswith("SELECT") and "LIKE :prefix" in sql:
            prefix = params["prefix"].rstrip("%")
            rows = [row for nom, row in self.store.items() if nom.startswith(prefix)]
            return _FakeResult(rows)

        if sql.startswith("SELECT") and "nom_cms_content = :nom" in sql:
            row = self.store.get(params["nom"])
            return _FakeResult([row] if row else [])

        if sql.startswith("INSERT INTO tab_cms_content"):
            self._seq += 1
            self.store[params["nom"]] = {
                "id_cms_content": self._seq,
                "nom_cms_content": params["nom"],
                "des_cms_content": json.loads(params["des"]),
                "num_version": 1,
                "ind_publicado": params["pub"],
                "usr_insert": params["usr"],
                "fec_insert": datetime(2026, 1, 1, 12, 0, 0),
                "usr_update": None,
                "fec_update": None,
            }
            return _FakeResult([])

        if sql.startswith("UPDATE tab_cms_content"):
            row = self.store.get(params["nom"])
            if row is not None:
                row["des_cms_content"] = json.loads(params["des"])
                row["ind_publicado"] = params["pub"]
                row["usr_update"] = params["usr"]
                row["fec_update"] = datetime(2026, 1, 2, 12, 0, 0)
                if "num_version = num_version + 1" in sql:
                    row["num_version"] = int(row["num_version"]) + 1
            return _FakeResult([])

        if sql.startswith("DELETE FROM tab_cms_content"):
            self.store.pop(params["nom"], None)
            return _FakeResult([])

        raise AssertionError(f"SQL no soportado por FakeSession: {sql}")

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolled_back = True
