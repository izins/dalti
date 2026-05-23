import os
import sys
from app import create_app
from app.extensions import get_supabase
from app.repositories.ticket_repo import TicketRepository

def test_count():
    app = create_app()
    with app.app_context():
        supabase = get_supabase()
        structs = supabase.table("structures").select("id").ilike("name", "%poste%").execute()
        struct_id = structs.data[0]["id"]
        
        queues = supabase.table("queues").select("*").eq("structure_id", struct_id).execute()
        for q in queues.data:
            c = TicketRepository.count_waiting_in_queue(q["id"])
            print(f"Queue {q['id']} waiting count: {c}")
            
            # debug query
            res = supabase.table("tickets").select("id").eq("queue_id", q["id"]).eq("status", "waiting").execute()
            print(f"Manual count: {len(res.data)}")
            
test_count()
