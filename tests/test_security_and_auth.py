import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = ROOT / 'server'
sys.path.insert(0, str(SERVER_DIR))

import config
import security
import auth


class SecurityAndAuthTests(unittest.TestCase):
    def setUp(self):
        os.environ['FRONTEND_URL'] = 'https://frontend-wheat-iota-49.vercel.app'
        os.environ['APP_ENV'] = 'development'
        os.environ['JWT_SECRET'] = 'test-secret-key'
        os.environ['DEFAULT_ADMIN_EMAIL'] = 'admin@fleet.local'
        os.environ['DEFAULT_ADMIN_PASSWORD'] = 'ChangeMe!123'
        os.environ['DEFAULT_TENANT'] = 'tenant_alpha'
        config.reload_config()

    def test_cors_config_uses_whitelist(self):
        origins = config.get_allowed_origins()
        self.assertIn('https://frontend-wheat-iota-49.vercel.app', origins)
        self.assertNotIn('*', origins)

    def test_standard_error_format(self):
        payload = security.build_error_response(401, 'AUTH_REQUIRED', 'Authentication required.')
        self.assertEqual(payload['error']['code'], 'AUTH_REQUIRED')
        self.assertEqual(payload['error']['message'], 'Authentication required.')

    def test_auth_login_and_token_round_trip(self):
        token = auth.AuthManager().login('admin@fleet.local', 'ChangeMe!123')
        self.assertIn('access_token', token)
        self.assertIn('refresh_token', token)

        claims = auth.verify_token(token['access_token'])
        self.assertEqual(claims['email'], 'admin@fleet.local')
        self.assertEqual(claims.get('tenant'), 'tenant_alpha')


if __name__ == '__main__':
    unittest.main()
