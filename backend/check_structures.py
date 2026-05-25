import os
import sys
from app import create_app
from app.extensions import get_supabase

def check_structures():
    app = create_app()
    with app.app_context():
        supabase = get_supabase()
        structs = supabase.table("structures").select("id, name").execute()
        for i, s in enumerate(structs.data):
            print(f"{i}: {s['name']}")
check_structures()
