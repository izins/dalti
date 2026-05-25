import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from app.services.exchange_service import ExchangeService
from app.extensions import get_supabase

app = create_app()

def run():
    with app.app_context():
        supabase = get_supabase()
        print("Creating more tickets in a specific queue to ensure exchanges...")
        
        # Get first queue
        res = supabase.table("queues").select("*").execute()
        if not res.data:
            print("No queues found.")
            return
            
        target_queue = res.data[0]
        
        # Get users
        res = supabase.table("users").select("*").execute()
        users = res.data
        if len(users) < 5:
            print("Not enough users.")
            return
            
        from app.services.ticket_service import TicketService
        
        q_tickets = []
        # Create 5 tickets in this queue
        for i in range(5):
            try:
                t = TicketService.take_ticket(
                    user_id=users[i]['id'],
                    structure_id=target_queue['structure_id'],
                    service_id=target_queue['service_id']
                )
                q_tickets.append(t)
            except Exception as e:
                # If error (like user already has active ticket)
                pass
                
        # fetch tickets from DB for this queue
        res = supabase.table("tickets").select("*").eq("queue_id", target_queue['id']).execute()
        db_tickets = res.data
        print(f"Queue {target_queue['id']} has {len(db_tickets)} tickets.")
        
        exchange_count = 0
        if len(db_tickets) >= 2:
            t1 = db_tickets[1]
            t0 = db_tickets[0]
            try:
                ExchangeService.propose_exchange(
                    user_id=t1['user_id'],
                    owner_ticket_id=t1['id'],
                    target_ticket_id=t0['id']
                )
                print(f"Exchange created: {t1['id']} -> {t0['id']}")
                exchange_count += 1
            except Exception as e:
                print(f"Exchange failed: {e}")
                
        if len(db_tickets) >= 4:
            t1 = db_tickets[3]
            t0 = db_tickets[2]
            try:
                ExchangeService.propose_exchange(
                    user_id=t1['user_id'],
                    owner_ticket_id=t1['id'],
                    target_ticket_id=t0['id']
                )
                print(f"Exchange created: {t1['id']} -> {t0['id']}")
                exchange_count += 1
            except Exception as e:
                print(f"Exchange failed: {e}")

        print(f"Created {exchange_count} exchanges.")

if __name__ == '__main__':
    run()
