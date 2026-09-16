import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

for env_file in (ROOT_DIR / '.env', BASE_DIR / '.env'):
    if env_file.exists():
        load_dotenv(env_file, override=True)


def reload_config():
    for env_file in (ROOT_DIR / '.env', BASE_DIR / '.env'):
        if env_file.exists():
            load_dotenv(env_file, override=True)


def get_allowed_origins():
    origins = []
    for raw in (
        os.getenv('FRONTEND_URL', ''),
        os.getenv('CORS_ALLOWED_ORIGINS', ''),
    ):
        if not raw:
            continue
        for value in raw.replace(' ', '').split(','):
            value = value.strip().rstrip('/')
            if value:
                origins.append(value)

    if os.getenv('APP_ENV') != 'production':
        origins.extend([
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ])

    deduped = []
    seen = set()
    for origin in origins:
        if origin and origin not in seen:
            deduped.append(origin)
            seen.add(origin)
    return deduped


def get_db_path():
    return str(BASE_DIR / 'fleet.db')


def get_jwt_secret():
    secret = os.getenv('JWT_SECRET') or os.getenv('SECRET_KEY')
    if not secret:
        raise RuntimeError('JWT_SECRET is not configured.')
    return secret


def get_default_admin_email():
    return os.getenv('DEFAULT_ADMIN_EMAIL', '').strip()


def get_default_admin_password():
    return os.getenv('DEFAULT_ADMIN_PASSWORD', '').strip()


def get_default_admin_password_hash():
    return os.getenv('DEFAULT_ADMIN_PASSWORD_HASH', '').strip()


def get_app_env():
    return os.getenv('APP_ENV', 'production').lower()


def get_require_auth():
    # When true, the API will enforce authentication on protected endpoints.
    val = os.getenv('REQUIRE_AUTH', '')
    return str(val).lower() in ('1', 'true', 'yes')


def get_default_tenant():
    return os.getenv('DEFAULT_TENANT', 'default')
