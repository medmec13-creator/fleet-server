import json
import math
import os
import time
from collections import defaultdict, deque

APP_ENV = os.getenv('APP_ENV', 'production').lower()


def build_error_response(status_code, code, message, details=None):
    payload = {
        'error': {
            'code': code,
            'message': message,
        }
    }
    if APP_ENV == 'development' and details is not None:
        payload['error']['details'] = details
    return payload


def parse_json_body(raw_body, max_size=1_048_576):
    if raw_body in (None, b''):
        return {}
    if len(raw_body) > max_size:
        raise ValueError('Request body is too large.')
    try:
        return json.loads(raw_body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError('Invalid JSON payload.') from exc


def build_success_response(data):
    return {'data': data}


def build_pagination_response(data, page, page_size, total):
    page = max(1, int(page))
    page_size = max(1, min(int(page_size), 100))
    total_pages = max(1, math.ceil(total / page_size)) if total else 0
    return {
        'data': data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total': total,
            'total_pages': total_pages,
        },
    }


def safe_int(value, default=1, minimum=1, maximum=100):
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimum, min(maximum, number))


def get_client_ip(headers):
    forwarded = headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    direct = headers.get('X-Real-Ip')
    if direct:
        return direct.strip()
    return headers.get('Remote-Addr', 'unknown')


class RateLimiter:
    def __init__(self, limit_per_minute=120, burst=20):
        self.limit_per_minute = limit_per_minute
        self.burst = burst
        # If REDIS_URL is provided, use Redis for cross-instance rate limiting
        redis_url = os.getenv('REDIS_URL')
        if redis_url:
            try:
                import redis
                self._redis = redis.from_url(redis_url)
            except Exception:
                self._redis = None
        else:
            self._redis = None

        self._buckets = defaultdict(deque)

    def allow(self, key):
        if self._redis:
            # Use a per-minute window key
            ts = int(time.time())
            window = ts // 60
            rkey = f"rl:{key}:{window}"
            try:
                val = self._redis.incr(rkey)
                if val == 1:
                    # expire slightly after window
                    self._redis.expire(rkey, 65)
                return val <= self.limit_per_minute
            except Exception:
                # on redis error, fallback to in-memory
                pass

        now = time.time()
        bucket = self._buckets[key]
        window = 60
        while bucket and bucket[0] <= now - window:
            bucket.popleft()
        if len(bucket) >= self.limit_per_minute:
            return False
        bucket.append(now)
        return True


class ResponseCache:
    def __init__(self, ttl_seconds=60, max_entries=512):
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._cache = {}

    def get(self, key):
        now = time.time()
        value = self._cache.get(key)
        if value is None:
            return None
        expires_at, payload = value
        if expires_at < now:
            self._cache.pop(key, None)
            return None
        return payload

    def set(self, key, payload, ttl_seconds=None):
        now = time.time()
        ttl = ttl_seconds if ttl_seconds is not None else self.ttl_seconds
        self._cache[key] = (now + ttl, payload)
        if len(self._cache) > self.max_entries:
            oldest = sorted(self._cache.items(), key=lambda item: item[1][0])[:10]
            for key_to_drop, _ in oldest:
                self._cache.pop(key_to_drop, None)
                if len(self._cache) <= self.max_entries:
                    break

    def clear(self):
        self._cache.clear()
