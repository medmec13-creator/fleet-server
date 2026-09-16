import sqlite3
import re
from typing import List, Any


class Repository:
    """Lightweight DB abstraction to centralize tenant-aware queries.

    Behavior:
    - `fetchall` and `fetchone` will attempt to detect the primary table in the
      SQL (first token after FROM) and, if that table contains a `tenant_id`
      column, will append a tenant filter automatically.
    - This is intentionally conservative and non-destructive: if the table has
      no `tenant_id` column, the SQL is left unchanged.
    """

    def __init__(self, db_path: str):
        self.db_path = db_path

    def get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def table_has_column(self, table: str, column: str) -> bool:
        conn = self.get_conn()
        try:
            cur = conn.cursor()
            rows = cur.execute(f"PRAGMA table_info('{table}')").fetchall()
            return any(r['name'] == column for r in rows)
        finally:
            conn.close()

    def _detect_table(self, sql: str) -> str:
        m = re.search(r"from\s+[`\"]?(\w+)[`\"]?", sql, flags=re.IGNORECASE)
        return m.group(1) if m else ''

    def _add_tenant_filter(self, sql: str, tenant_column: str) -> str:
        # Predicates must precede GROUP/ORDER/LIMIT/OFFSET clauses.
        match = re.search(r"\b(group\s+by|order\s+by|limit|offset)\b", sql, flags=re.IGNORECASE)
        insertion_point = match.start() if match else len(sql)
        before = sql[:insertion_point].rstrip()
        after = sql[insertion_point:]
        conjunction = " AND " if re.search(r"\bwhere\b", before, flags=re.IGNORECASE) else " WHERE "
        return f"{before}{conjunction}{tenant_column} = ? {after}"

    def fetchall(self, sql: str, params: List[Any] = None, tenant: str = None, tenant_column: str = 'tenant_id'):
        params = list(params or [])
        modified_sql = sql
        if tenant:
            table = self._detect_table(sql)
            column = tenant_column.rsplit('.', 1)[-1]
            if table and self.table_has_column(table, column):
                modified_sql = self._add_tenant_filter(sql, tenant_column)
                match = re.search(r"\b(group\s+by|order\s+by|limit|offset)\b", sql, flags=re.IGNORECASE)
                insertion_point = match.start() if match else len(sql)
                params.insert(sql[:insertion_point].count('?'), tenant)

        conn = self.get_conn()
        try:
            return conn.cursor().execute(modified_sql, params).fetchall()
        finally:
            conn.close()

    def fetchone(self, sql: str, params: List[Any] = None, tenant: str = None, tenant_column: str = 'tenant_id'):
        rows = self.fetchall(sql, params, tenant=tenant, tenant_column=tenant_column)
        return rows[0] if rows else None
