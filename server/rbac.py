"""
RBAC scaffold for Fleet API.

Provides role constants and simple authorization helpers.
This is intentionally lightweight: it does not modify existing endpoints
by default. Use `get_require_auth()` to toggle enforcement.
"""
from typing import Iterable, Dict, Any
from config import get_require_auth

# Define the minimal role set required by the product
ROLES = [
    'SUPER_ADMIN',
    'ADMIN',
    'FLEET_MANAGER',
    'OPERATIONS_MANAGER',
    'ACCOUNTANT',
    'DISPATCHER',
    'VIEWER',
]


def role_allowed(user_claims: Dict[str, Any], allowed: Iterable[str]) -> bool:
    if not user_claims:
        return False
    role = user_claims.get('role') or user_claims.get('r') or 'VIEWER'
    return role in set(allowed)


def require_roles(user_claims: Dict[str, Any], allowed: Iterable[str]) -> bool:
    """Check whether enforcement is enabled and whether the user has one of the allowed roles.

    Returns True when access should be granted. If REQUIRE_AUTH is False, this returns True
    to preserve backward compatibility with the existing frontend.
    """
    if not get_require_auth():
        # Do not enforce in non-production/dev unless explicitly enabled
        return True
    return role_allowed(user_claims, allowed)
