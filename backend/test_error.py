import os
from app import create_app
from app.extensions import get_supabase
from app.repositories.ticket_repo import TicketRepository

app = create_app()
with app.app_context():
    sb = get_supabase()
    res = sb.table("structures").select("id").limit(1).execute()
    s_id = res.data[0]["id"]
    
    queues = sb.table("queues").select("id").eq("structure_id", s_id).execute()
    for q in queues.data:
        try:
            print(f"Testing queue {q['id']}")
            res = TicketRepository.find_called_in_queue(q["id"])
            print("SUCCESS:", res)
        except Exception as e:
            print("ERROR:", str(e))
