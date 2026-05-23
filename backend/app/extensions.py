"""DALTI Backend — Extensions.

Initializes shared extensions (Supabase client, mail, scheduler).
"""

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
