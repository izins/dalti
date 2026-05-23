import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)

def seed():
    print("Seeding database...")
    
    # Insert services
    services = [
        {'name': 'Hospital CHU Béjaïa', 'description': 'Medical consultation', 'icon': '🏥', 'is_popular': True},
        {'name': 'Municipality of Béjaïa', 'description': 'Civil documents', 'icon': '🏛️', 'is_popular': True},
        {'name': 'BNA Bank', 'description': 'Banking services', 'icon': '🏦', 'is_popular': True},
        {'name': 'Algeria Post Office', 'description': 'Postal and financial', 'icon': '📮', 'is_popular': True},
        {'name': 'University A. Mira', 'description': 'Student affairs', 'icon': '🎓', 'is_popular': True},
    ]
    
    inserted_services = []
    for s in services:
        # Check if exists
        res = supabase.table("services").select("*").eq("name", s['name']).execute()
        if not res.data:
            res = supabase.table("services").insert(s).execute()
        inserted_services.append(res.data[0])
        
    print(f"Ensured {len(inserted_services)} services.")

    # Insert a default structure
    structure = {
        'name': 'Main Center Béjaïa',
        'type': 'mixed',
        'adresse': 'Downtown',
        'wilaya': 'Béjaïa',
        'commune': 'Béjaïa',
        'latitude': 36.75,
        'longitude': 5
    }
    res = supabase.table("structures").select("*").eq("name", structure['name']).execute()
    if not res.data:
        res = supabase.table("structures").insert(structure).execute()
    main_structure = res.data[0]
    print("Ensured main structure:", main_structure['id'])
    
    # Link services and create queues
    for s in inserted_services:
        res = supabase.table("structure_services").select("*").eq("structure_id", main_structure['id']).eq("service_id", s['id']).execute()
        if not res.data:
            supabase.table("structure_services").insert({"structure_id": main_structure['id'], "service_id": s['id']}).execute()
        
        # Create queue
        res = supabase.table("queues").select("*").eq("structure_id", main_structure['id']).eq("service_id", s['id']).execute()
        if not res.data:
            supabase.table("queues").insert({
                "structure_id": main_structure['id'],
                "service_id": s['id'],
                "status": "open",
                "current_number": 0,
                "last_called_number": 0,
                "total_today": 0
            }).execute()
            
    print("Seeding complete.")

if __name__ == '__main__':
    seed()
