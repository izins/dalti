import os
from app.extensions import get_supabase
from datetime import datetime, timezone
from app import create_app

app = create_app()
with app.app_context():
    sb = get_supabase()
    # just create a ticket with valid fields and test time string
    now = datetime.now(timezone.utc)
    t_str = now.isoformat().split("T")[1]
    print("Testing time string:", t_str)
    
    # get a ticket
    res = sb.table("tickets").select("id").limit(1).execute()
    t_id = res.data[0]["id"]
    try:
        sb.table("tickets").update({"called_at": t_str}).eq("id", t_id).execute()
        print("SUCCESS isoformat split")
    except Exception as e:
        print("ERROR isoformat split:", str(e))
        
    try:
        t_str2 = now.strftime("%H:%M:%S%z")
        sb.table("tickets").update({"called_at": t_str2}).eq("id", t_id).execute()
        print("SUCCESS strftime")
    except Exception as e:
        print("ERROR strftime:", str(e))
