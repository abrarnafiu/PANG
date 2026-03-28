import os
import jwt
from jwt.algorithms import ECAlgorithm
from functools import wraps
from flask import request, jsonify, g

# Supabase project's public EC key (ES256).
# Fetched from: https://wvsnrdajylbdqfdpwews.supabase.co/auth/v1/.well-known/jwks.json
# This is the *public* key — safe to embed. Refresh only if Supabase rotates keys.
_SUPABASE_JWK = {
    "alg": "ES256",
    "crv": "P-256",
    "ext": True,
    "key_ops": ["verify"],
    "kid": "77ada7f7-5b39-4273-ba03-8bbf0c660479",
    "kty": "EC",
    "use": "sig",
    "x": "i8jOc6elkmyeI3sYvd--Q_YTJyq4j5v45KRO5WJ6LBM",
    "y": "81UZRDV1SzPA-U5gnTJy_OAbzPE12NhAnnhpTjPgCr0",
}

_PUBLIC_KEY = ECAlgorithm.from_jwk(_SUPABASE_JWK)


def get_token():
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    return auth[7:].strip()


def verify_supabase_token():
    token = get_token()
    if not token:
        return None, ("Missing or invalid Authorization header", 401)
    try:
        payload = jwt.decode(
            token,
            _PUBLIC_KEY,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload, None
    except jwt.ExpiredSignatureError:
        print("[auth] Token expired")
        return None, ("Token expired", 401)
    except jwt.InvalidTokenError as e:
        print(f"[auth] Invalid token: {type(e).__name__}: {e}")
        return None, ("Invalid token", 401)


def require_supabase_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload, err = verify_supabase_token()
        if err is not None:
            msg, status = err
            return jsonify({"error": msg}), status
        g.supabase_user = payload
        return f(*args, **kwargs)
    return decorated
