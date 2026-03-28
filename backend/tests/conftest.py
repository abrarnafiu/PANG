import sys
import os

# Ensure the backend package root is on the path when pytest runs from /backend
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import supabase_auth
from app import app as flask_app


@pytest.fixture()
def app():
    flask_app.config["TESTING"] = True
    yield flask_app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture(autouse=False)
def bypass_auth(monkeypatch):
    """Patch verify_supabase_token so all routes accept requests in tests."""
    monkeypatch.setattr(
        supabase_auth,
        "verify_supabase_token",
        lambda: ({"sub": "test-user-id"}, None),
    )
