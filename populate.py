import os
import random
import string
from dotenv import load_dotenv

# Load env before importing app
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from app.services.auth_service import AuthService
from app.services.ticket_service import TicketService
from app.services.exchange_service import ExchangeService
from app.extensions import get_supabase

app = create_app()

def run():
    with app.app_context():
        supabase = get_supabase()
        print("Starting data generation...")
        
        # 1. Create Services
        services_data = [
            {'name': 'Retrait', 'description': 'Retrait d\'argent', 'icon': '💵', 'is_popular': True},
            {'name': 'Versement', 'description': 'Versement d\'argent', 'icon': '📥', 'is_popular': True},
            {'name': 'Carte Edahabia', 'description': 'Renouvellement/Demande de carte', 'icon': '💳', 'is_popular': True},
            {'name': 'Consultation', 'description': 'Consultation de solde', 'icon': 'ℹ️', 'is_popular': False},
        ]
        
        inserted_services = []
        for s in services_data:
            res = supabase.table("services").select("*").eq("name", s['name']).execute()
            if not res.data:
                res = supabase.table("services").insert(s).execute()
            inserted_services.append(res.data[0])
            
        print(f"Ensured {len(inserted_services)} services.")

        # 2. Create Structures
        structures_data = [
            {'name': 'Algérie Poste - Centre Ville', 'type': 'poste', 'adresse': 'Centre Ville, Béjaïa', 'wilaya': 'Béjaïa', 'commune': 'Béjaïa', 'latitude': 36.75, 'longitude': 5},
            {'name': 'Algérie Poste - Ihaddaden', 'type': 'poste', 'adresse': 'Ihaddaden, Béjaïa', 'wilaya': 'Béjaïa', 'commune': 'Béjaïa', 'latitude': 36.74, 'longitude': 5},
            {'name': 'BADR Banque', 'type': 'banque', 'adresse': 'Boulevard Amirouche', 'wilaya': 'Béjaïa', 'commune': 'Béjaïa', 'latitude': 36.76, 'longitude': 5},
            {'name': 'BNA Banque', 'type': 'banque', 'adresse': 'Rue de la liberté', 'wilaya': 'Béjaïa', 'commune': 'Béjaïa', 'latitude': 36.755, 'longitude': 5},
            {'name': 'CPA Banque', 'type': 'banque', 'adresse': 'Aamriw', 'wilaya': 'Béjaïa', 'commune': 'Béjaïa', 'latitude': 36.745, 'longitude': 5},
        ]

        inserted_structures = []
        for s in structures_data:
            res = supabase.table("structures").select("*").eq("name", s['name']).execute()
            if not res.data:
                res = supabase.table("structures").insert(s).execute()
            inserted_structures.append(res.data[0])
            
        print(f"Ensured {len(inserted_structures)} structures.")
        
        # Link services and create queues
        for struct in inserted_structures:
            for srv in inserted_services:
                # Poste might have Edahabia, banks might not, but let's link all for simplicity
                if struct['type'] == 'banque' and srv['name'] == 'Carte Edahabia':
                    continue
                    
                res = supabase.table("structure_services").select("*").eq("structure_id", struct['id']).eq("service_id", srv['id']).execute()
                if not res.data:
                    supabase.table("structure_services").insert({"structure_id": struct['id'], "service_id": srv['id']}).execute()
                
                # Create queue
                res = supabase.table("queues").select("*").eq("structure_id", struct['id']).eq("service_id", srv['id']).execute()
                if not res.data:
                    supabase.table("queues").insert({
                        "structure_id": struct['id'],
                        "service_id": srv['id'],
                        "status": "open",
                        "current_number": 0,
                        "last_called_number": 0,
                        "total_today": 0
                    }).execute()

        # 3. Create 40 Users
        users = []
        print("Creating users...")
        for i in range(1, 41):
            email = f"user{i}@test.com"
            try:
                user = AuthService.register({
                    "email": email,
                    "password": "password123",
                    "first_name": f"User{i}",
                    "last_name": "Test"
                })
                users.append(user)
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"Exception for {email}: {e}")
                # User might already exist
                res = supabase.table("users").select("*").eq("email", email).execute()
                if res.data:
                    users.append(res.data[0])
                    
        print(f"Ensured {len(users)} users.")

        # 4. Take Tickets
        print("Taking tickets...")
        tickets = []
        for i, user in enumerate(users):
            # Pick a random structure and one of its services
            struct = random.choice(inserted_structures)
            
            # Find queues for this structure
            res = supabase.table("queues").select("*").eq("structure_id", struct['id']).execute()
            queues = res.data
            if not queues:
                continue
                
            queue = random.choice(queues)
            
            try:
                ticket = TicketService.take_ticket(
                    user_id=user['id'],
                    structure_id=struct['id'],
                    service_id=queue['service_id']
                )
                tickets.append(ticket)
            except Exception as e:
                print(f"Error taking ticket for user {user['email']}: {e}")

        print(f"Created {len(tickets)} tickets.")

        # 5. Create Exchanges
        print("Creating exchange requests...")
        # Need to find two users in the same queue
        queue_dict = {}
        for t in tickets:
            q_id = t['queue_id']
            if q_id not in queue_dict:
                queue_dict[q_id] = []
            queue_dict[q_id].append(t)
            
        exchange_count = 0
        for q_id, q_tickets in queue_dict.items():
            if len(q_tickets) >= 2:
                # Propose exchange from ticket[1] to ticket[0]
                t1 = q_tickets[1]
                t0 = q_tickets[0]
                try:
                    ExchangeService.propose_exchange(
                        user_id=t1['user_id'],
                        owner_ticket_id=t1['id'],
                        target_ticket_id=t0['id']
                    )
                    exchange_count += 1
                except Exception as e:
                    pass

        print(f"Created {exchange_count} exchange requests.")
        print("Done!")

if __name__ == '__main__':
    run()
