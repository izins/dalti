"""DALTI Backend — Extensions.

Initializes shared extensions (Supabase client, mail, scheduler).
"""

import re
import supabase._sync.client

# Monkeypatch the API key validation in supabase library to support newer keys like sb_publishable_* or sb_secret_*
original_match = re.match
def custom_match(pattern, string, flags=0):
    if isinstance(pattern, str) and pattern == r"^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$":
        if isinstance(string, str) and (string.startswith("sb_publishable_") or string.startswith("sb_secret_")):
            return True
    return original_match(pattern, string, flags)

supabase._sync.client.re.match = custom_match

from supabase import create_client, Client
from flask_mail import Mail
from flask_apscheduler import APScheduler
from flask_socketio import SocketIO

mail = Mail()
scheduler = APScheduler()
socketio = SocketIO(cors_allowed_origins="*")

from typing import Optional

# Supabase client — initialized in app factory
supabase_client: Optional[Client] = None


def init_supabase(url: str, key: str) -> Client:
    """Create and cache the Supabase client."""
    global supabase_client
    supabase_client = create_client(url, key)
    return supabase_client


def get_supabase() -> Client:
    """Return the cached Supabase client."""
    if supabase_client is None:
        raise RuntimeError("Supabase client not initialized. Call init_supabase first.")
    return supabase_client
