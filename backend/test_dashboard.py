import os
from app import create_app
from app.extensions import get_supabase

app = create_app()
with app.app_context():
    client = app.test_client()
    
    # 1. Get structures
    res = client.get('/api/structures')
    structs = res.json['structures']
    primary = next((s for s in structs if 'Poste' in s['name']), structs[0])
    
    # 2. Get queues
    res = client.get(f'/api/queues/structure/{primary["id"]}')
    queues = res.json.get('queues', res.json)
    q0 = queues[0]
    print("BEFORE CALL:")
    print(f"Queue {q0['id']} waiting: {q0.get('waiting_count')}, called_ticket: {q0.get('called_ticket')}")
    
    # 3. Call next
    # We need to simulate admin user for the mock or bypass @admin_required.
    # Alternatively, just directly call QueueService.call_next
    from app.services.queue_service import QueueService
    admin_res = get_supabase().table("users").select("id").eq("email", "zizou@gmail.com").execute()
    admin_id = admin_res.data[0]["id"]
    try:
        QueueService.toggle_queue_status(q0["id"], "open")
        ticket = QueueService.call_next(q0["id"], admin_id)
        print(f"CALLED TICKET: {ticket['number']}")
    except Exception as e:
        print("CALL NEXT ERROR:", str(e))
        
    # 4. Fetch again
    res = client.get(f'/api/queues/structure/{primary["id"]}')
    queues2 = res.json.get('queues', res.json)
    q0_after = queues2[0]
    print("AFTER CALL:")
    print(f"Queue {q0_after['id']} waiting: {q0_after.get('waiting_count')}, called_ticket: {q0_after.get('called_ticket')}")
