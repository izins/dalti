import os
from app import create_app
from app.extensions import get_supabase

app = create_app()
with app.app_context():
    client = app.test_client()
    
    # Get structures
    res = client.get('/api/structures')
    structs = res.json['structures']
    primary = next((s for s in structs if 'Poste' in s['name']), structs[0])
    print(f"Primary Structure: {primary['id']} - {primary['name']}")
    
    # Get queues
    res = client.get(f'/api/queues/structure/{primary["id"]}')
    queues = res.json.get('queues', res.json)
    print(f"Found {len(queues)} queues.")
    for q in queues:
        print(f"Queue {q['id']}, service {q['service_id']}, waiting: {q.get('waiting_count')}, current_num: {q.get('current_number')}")
