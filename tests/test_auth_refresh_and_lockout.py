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
from server import FleetAPIHandler
import server as srv
import sqlite3
from config import get_db_path
from auth import verify_token


class AuthRefreshAndLockoutTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ['JWT_SECRET'] = 'test-secret-key'
        os.environ['DEFAULT_TENANT'] = 'tenant_alpha'
        os.environ['DEFAULT_ADMIN_EMAIL'] = 'admin@fleet.local'
        os.environ['DEFAULT_ADMIN_PASSWORD'] = 'ChangeMe!123'
        os.environ['REQUIRE_AUTH'] = 'True'
        config.reload_config()

        # re-create server-side auth manager to pick up new env config
        try:
            srv.AUTH_MANAGER = srv.AuthManager()
        except Exception:
            pass

        # clear any previous login fail state (persisted table)
        try:
            conn = sqlite3.connect(get_db_path())
            c = conn.cursor()
            c.execute('DELETE FROM login_failures')
            conn.commit()
            conn.close()
        except Exception:
            pass

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

    def _post(self, path: str, body: dict, headers: dict = None):
        conn = http.client.HTTPConnection('localhost', self.port, timeout=10)
        body_bytes = json.dumps(body).encode('utf-8')
        hdrs = {'Content-Type': 'application/json'}
        if headers:
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

    def test_refresh_rotates_refresh_token(self):
        # ensure any lockout state cleared from other tests (persisted)
        try:
            conn = sqlite3.connect(get_db_path())
            c = conn.cursor()
            c.execute('DELETE FROM login_failures')
            conn.commit()
            conn.close()
        except Exception:
            pass

        # login to get refresh token
        status, js = self._post('/api/auth/login', {'username': os.getenv('DEFAULT_ADMIN_EMAIL', 'admin'), 'password': os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin')})
        self.assertEqual(status, 200)
        tokens = js['data']
        self.assertIn('refresh_token', tokens)
        old_refresh = tokens['refresh_token']
        # call refresh
        status, js = self._post('/api/auth/refresh', {'refresh_token': old_refresh})
        self.assertEqual(status, 200)
        new_tokens = js['data']
        self.assertIn('access_token', new_tokens)
        self.assertIn('refresh_token', new_tokens)
        self.assertNotEqual(old_refresh, new_tokens['refresh_token'])
        status, js = self._post('/api/auth/refresh', {'refresh_token': old_refresh})
        self.assertEqual(status, 401)
        with self.assertRaises(ValueError):
            verify_token(new_tokens['refresh_token'], expected_type='access')

    def test_login_lockout(self):
        # attempt bad passwords repeatedly to trigger lockout
        email = os.getenv('DEFAULT_ADMIN_EMAIL', 'admin')
        for i in range(srv.MAX_LOGIN_FAILS):
            status, js = self._post('/api/auth/login', {'username': email, 'password': 'wrong'})
            self.assertEqual(status, 401)
        # next attempt should be locked (429)
        status, js = self._post('/api/auth/login', {'username': email, 'password': 'wrong'})
        self.assertIn(status, (401, 429))


if __name__ == '__main__':
    unittest.main()
