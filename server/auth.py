import os
import sqlite3
import time
from typing import Any, Dict

import bcrypt
try:
    from argon2 import PasswordHasher
    ARGON2_AVAILABLE = True
    ph = PasswordHasher()
except Exception:
    ARGON2_AVAILABLE = False
import jwt
import uuid

from config import get_db_path, get_default_admin_email, get_default_admin_password, get_default_admin_password_hash, get_jwt_secret, get_default_tenant


def _ensure_revocation_table():
    conn = sqlite3.connect(get_db_path())
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS revoked_tokens (
                jti TEXT PRIMARY KEY,
                expires_at INTEGER NOT NULL,
                revoked_at INTEGER NOT NULL
            )
        """)
        conn.execute('DELETE FROM revoked_tokens WHERE expires_at < ?', (int(time.time()),))
        conn.commit()
    finally:
        conn.close()


def _is_revoked(jti: str) -> bool:
    if not jti:
        return False
    _ensure_revocation_table()
    conn = sqlite3.connect(get_db_path())
    try:
        return conn.execute('SELECT 1 FROM revoked_tokens WHERE jti = ?', (jti,)).fetchone() is not None
    finally:
        conn.close()


class AuthManager:
    def __init__(self):
        self.jwt_secret = get_jwt_secret()
        self.default_email = get_default_admin_email()
        self.default_password = get_default_admin_password()
        self.default_password_hash = get_default_admin_password_hash()

    def _generate_token(self, subject: str, email: str, role: str, token_type: str, expires_in_seconds: int, tenant: str = None):
        issued_at = int(time.time())
        payload = {
            'sub': subject,
            'email': email,
            'role': role,
            'tenant': tenant,
            'token_type': token_type,
            'iat': issued_at,
            'exp': issued_at + expires_in_seconds,
            'jti': str(uuid.uuid4()),
        }
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')

    def login(self, email: str, password: str, tenant: str = None):
        if not self.default_email or not (self.default_password or self.default_password_hash):
            raise ValueError('Authentication is not configured for this environment.')

        valid = False
        if self.default_password_hash:
            # Try Argon2 verification first if available and hash looks like argon2
            if ARGON2_AVAILABLE and self.default_password_hash.startswith('$argon2'):
                try:
                    ph.verify(self.default_password_hash, password)
                    valid = True
                except Exception:
                    valid = False
            else:
                valid = bcrypt.checkpw(password.encode('utf-8'), self.default_password_hash.encode('utf-8'))
        elif self.default_password:
            valid = email == self.default_email and password == self.default_password

        if not valid or email != self.default_email:
            raise ValueError('Invalid credentials.')

        # tenant selection: prefer provided tenant, else fall back to default
        tenant = tenant or get_default_tenant()
        access_token = self._generate_token(self.default_email, self.default_email, 'SUPER_ADMIN', 'access', 900, tenant=tenant)
        refresh_token = self._generate_token(self.default_email, self.default_email, 'SUPER_ADMIN', 'refresh', 7 * 24 * 3600, tenant=tenant)

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'expires_in': 900,
            'user': {
                'email': self.default_email,
                'role': 'SUPER_ADMIN',
                'tenant': tenant,
            },
        }

    def refresh(self, refresh_token: str):
        payload = verify_token(refresh_token, expected_type='refresh')
        revoke_token(refresh_token)
        # rotate refresh token: issue new access + new refresh token
        access_token = self._generate_token(payload['sub'], payload['email'], payload['role'], 'access', 900, tenant=payload.get('tenant'))
        new_refresh = self._generate_token(payload['sub'], payload['email'], payload['role'], 'refresh', 7 * 24 * 3600, tenant=payload.get('tenant'))
        return {'access_token': access_token, 'refresh_token': new_refresh, 'token_type': 'bearer', 'expires_in': 900}

    def get_user_from_request(self, headers):
        auth_header = headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return None
        return verify_token(token, expected_type='access')


def verify_token(token: str, expected_type: str = None) -> Dict[str, Any]:
    payload = jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
    if _is_revoked(payload.get('jti')):
        raise ValueError('Token has been revoked.')
    if expected_type and payload.get('token_type') != expected_type:
        raise ValueError('Invalid token type.')
    return payload


def revoke_token(token: str):
    payload = jwt.decode(token, get_jwt_secret(), algorithms=['HS256'])
    jti = payload.get('jti')
    if jti:
        _ensure_revocation_table()
        conn = sqlite3.connect(get_db_path())
        try:
            conn.execute(
                'INSERT OR REPLACE INTO revoked_tokens (jti, expires_at, revoked_at) VALUES (?, ?, ?)',
                (jti, int(payload.get('exp', time.time())), int(time.time()))
            )
            conn.commit()
        finally:
            conn.close()


def require_auth(headers):
    manager = AuthManager()
    return manager.get_user_from_request(headers)
