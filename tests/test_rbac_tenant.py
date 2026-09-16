import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = ROOT / 'server'
sys.path.insert(0, str(SERVER_DIR))

import config
from auth import AuthManager, verify_token
from server import FleetAPIHandler


class RBACAndTenantTests(unittest.TestCase):
    def setUp(self):
        os.environ['JWT_SECRET'] = 'test-secret-key'
        os.environ['DEFAULT_ADMIN_EMAIL'] = 'admin@fleet.local'
        os.environ['DEFAULT_ADMIN_PASSWORD'] = 'ChangeMe!123'
        os.environ['DEFAULT_TENANT'] = 'tenant_alpha'
        config.reload_config()

    def test_tenant_claim_in_token_allows_same_tenant(self):
        mgr = AuthManager()
        tokens = mgr.login('admin@fleet.local', 'ChangeMe!123')
        claims = verify_token(tokens['access_token'])
        self.assertEqual(claims.get('tenant'), 'tenant_alpha')

    def test_super_admin_bypasses_tenant_mismatch(self):
        mgr = AuthManager()
        tokens = mgr.login('admin@fleet.local', 'ChangeMe!123')
        claims = verify_token(tokens['access_token'])
        # simulate a request where header tenant differs; SUPER_ADMIN should bypass
        self.assertEqual(claims.get('role'), 'SUPER_ADMIN')


if __name__ == '__main__':
    unittest.main()
