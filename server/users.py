from typing import Optional
import time
from sqlalchemy import Column, String, Integer, Text
from sqlalchemy.exc import IntegrityError
from db import Base, SessionLocal, init_db
try:
    from argon2 import PasswordHasher
    ph = PasswordHasher()
except Exception:
    ph = None
import bcrypt


class User(Base):
    __tablename__ = 'users'
    email = Column(String, primary_key=True, index=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String, default='VIEWER')
    tenant = Column(String, default='default')
    created_at = Column(Integer)


def _hash_password(password: str) -> str:
    if ph:
        return ph.hash(password)
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_user(email: str, password: str, role: str = 'VIEWER', tenant: str = 'default') -> dict:
    init_db()
    db = SessionLocal()
    email = email.strip().lower()
    hashed = _hash_password(password)
    now = int(time.time())
    user = User(email=email, password_hash=hashed, role=role, tenant=tenant, created_at=now)
    try:
        db.add(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        db.close()
        raise ValueError('User already exists')
    row = db.query(User).filter(User.email == email).first()
    db.close()
    return {'email': row.email, 'role': row.role, 'tenant': row.tenant, 'created_at': row.created_at}


def list_users(tenant: Optional[str] = None):
    init_db()
    db = SessionLocal()
    if tenant:
        rows = db.query(User).filter(User.tenant == tenant).all()
    else:
        rows = db.query(User).all()
    out = [{'email': r.email, 'role': r.role, 'tenant': r.tenant, 'created_at': r.created_at} for r in rows]
    db.close()
    return out


def get_user(email: str):
    init_db()
    db = SessionLocal()
    row = db.query(User).filter(User.email == email.strip().lower()).first()
    db.close()
    if not row:
        return None
    return {'email': row.email, 'password_hash': row.password_hash, 'role': row.role, 'tenant': row.tenant, 'created_at': row.created_at}
