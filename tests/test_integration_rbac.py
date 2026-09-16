import os
import time
import threading
import http.client
import json
import socketserver
import unittest

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = ROOT / 'server'
import sys
sys.path.insert(0, str(SERVER_DIR))

import config
import jwt
from server import FleetAPIHandler


class IntegrationRBACTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ['JWT_SECRET'] = 'test-secret-key'
        os.environ['DEFAULT_TENANT'] = 'tenant_alpha'
        os.environ['REQUIRE_AUTH'] = 'True'
        config.reload_config()

        # start server on ephemeral port
        cls.server = socketserver.TCPServer(('', 0), FleetAPIHandler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.1)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def _make_token(self, role: str, tenant: str):
        payload = {
            'sub': 'test',
            'email': 'test@example.com',
            'role': role,
            'tenant': tenant,
            'token_type': 'access',
            'iat': int(time.time()),
            'exp': int(time.time()) + 600
        }
        return jwt.encode(payload, os.environ['JWT_SECRET'], algorithm='HS256')

    def _post(self, path: str, body: dict, headers: dict):
        conn = http.client.HTTPConnection('localhost', self.port, timeout=10)
        body_bytes = json.dumps(body).encode('utf-8')
        hdrs = {'Content-Type': 'application/json'}
        hdrs.update(headers)
        try:
            conn.request('POST', path, body=body_bytes, headers=hdrs)
            resp = conn.getresponse()
            data = resp.read().decode('utf-8')
            try:
                data_json = json.loads(data)
            except Exception:
                data_json = data
            return resp.status, data_json
        finally:
            try:
                conn.close()
            except Exception:
                pass

    def test_simulate_blocked_for_viewer(self):
        token = self._make_token('VIEWER', os.environ['DEFAULT_TENANT'])
        status, data = self._post('/api/simulate', {'fuel_change_pct': 1}, {'Authorization': f'Bearer {token}', 'X-Tenant-Id': os.environ['DEFAULT_TENANT']})
        self.assertIn(status, (403, 401))

    def test_simulate_allowed_for_admin(self):
        token = self._make_token('ADMIN', os.environ['DEFAULT_TENANT'])
        status, data = self._post('/api/simulate', {'fuel_change_pct': 1}, {'Authorization': f'Bearer {token}', 'X-Tenant-Id': os.environ['DEFAULT_TENANT']})
        self.assertEqual(status, 200)


if __name__ == '__main__':
    unittest.main()
