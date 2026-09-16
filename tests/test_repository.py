import unittest
import sqlite3
import tempfile
from pathlib import Path
import sys
import os

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = ROOT / 'server'
sys.path.insert(0, str(SERVER_DIR))

from repository import Repository


class RepositoryTests(unittest.TestCase):
    def setUp(self):
        # Use the real DB path from server via env
        self.db_path = str((ROOT / 'server' / 'fleet.db'))
        self.repo = Repository(self.db_path)

    def test_add_tenant_filter_no_where(self):
        sql = "SELECT * FROM dim_customer"
        modified = self.repo._add_tenant_filter(sql, 'tenant_id')
        self.assertIn('WHERE tenant_id = ?', modified)

    def test_add_tenant_filter_with_where(self):
        sql = "SELECT * FROM fact_trip WHERE revenue > 0"
        modified = self.repo._add_tenant_filter(sql, 'tenant_id')
        self.assertIn('AND tenant_id = ?', modified)

    def test_tenant_filter_runs_before_limit_and_offset(self):
        with tempfile.NamedTemporaryFile(suffix='.db') as database:
            conn = sqlite3.connect(database.name)
            conn.execute('CREATE TABLE fact_trip (trip_id INTEGER, tenant_id TEXT, date TEXT)')
            conn.executemany('INSERT INTO fact_trip VALUES (?, ?, ?)', [
                (1, 'tenant_alpha', '2026-01-02'),
                (2, 'tenant_beta', '2026-01-03'),
                (3, 'tenant_alpha', '2026-01-04'),
            ])
            conn.commit()
            conn.close()

            repository = Repository(database.name)
            rows = repository.fetchall(
                'SELECT trip_id FROM fact_trip ORDER BY date DESC LIMIT ? OFFSET ?',
                params=[1, 0],
                tenant='tenant_alpha',
            )

            self.assertEqual([row['trip_id'] for row in rows], [3])


if __name__ == '__main__':
    unittest.main()
