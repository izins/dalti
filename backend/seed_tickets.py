import os
import sys
import uuid
import bcrypt
from app import create_app
from app.extensions import get_supabase

def seed_tickets():
    app = create_app()
    with app.app_context():
        supabase = get_supabase()
        
        # 1. Create dummy users
        dummy_users = []
        for i in range(5):
            email = f"dummy{i}@dalti.com"
            res = supabase.table("users").select("id").eq("email", email).execute()
            if res.data:
                dummy_users.append(res.data[0]["id"])
            else:
                pwd = bcrypt.hashpw(b"password", bcrypt.gensalt()).decode("utf-8")
                new_user = supabase.table("users").insert({
                    "email": email,
                    "password_hash": pwd,
                    "first_name": f"Dummy{i}",
                    "last_name": "Test",
                }).execute()
                dummy_users.append(new_user.data[0]["id"])
            
        # 2. Get Algerie Poste
        structs = supabase.table("structures").select("id").ilike("name", "%poste%").execute()
        if not structs.data:
            print("Algerie Poste not found")
            return
            
        for struct in structs.data:
            struct_id = struct["id"]
            
            # 3. Get queues for this structure
            queues = supabase.table("queues").select("*").eq("structure_id", struct_id).execute()
            if not queues.data:
                continue
                
            for queue in queues.data:
                q_id = queue["id"]
                
                # Make sure it's open
                if queue["status"] != "open":
                    supabase.table("queues").update({"status": "open"}).eq("id", q_id).execute()
                
                # Insert 5 tickets
                curr_num = queue["current_number"]
                for i in range(5):
                    curr_num += 1
                    qr_code = str(uuid.uuid4())
                    supabase.table("tickets").insert({
                        "user_id": dummy_users[i],
                        "queue_id": q_id,
                        "number": curr_num,
                        "status": "waiting",
                        "qr_code": qr_code,
                        "estimated_time": (i+1) * 10,
                        "actual_wait_time": 0,
                        "called_at": "00:00:00+00:00",
                        "completed_at": "00:00:00+00:00"
                    }).execute()
                
                supabase.table("queues").update({"current_number": curr_num, "total_today": queue.get("total_today", 0) + 5}).eq("id", q_id).execute()
                print(f"Added 5 tickets to queue {q_id}")

if __name__ == "__main__":
    seed_tickets()
