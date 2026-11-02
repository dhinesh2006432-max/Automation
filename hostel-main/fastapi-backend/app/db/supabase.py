from supabase import create_client, Client
from app.core.config import settings

def get_supabase_client() -> Client:
    # We fallback to an empty string to avoid crash if env vars are not set during init
    url = settings.SUPABASE_URL or "https://placeholder.supabase.co"
    key = settings.SUPABASE_KEY or "placeholder-key"
    return create_client(url, key)

supabase: Client = get_supabase_client()
