import os
import sys
import bcrypt
from app import create_app
from app.extensions import get_supabase
from app.repositories.user_repo import UserRepository

def seed_admin():
    app = create_app()
    with app.app_context():
        supabase = get_supabase()
        
        email = "zizou@gmail.com"
        password = "zizou123"
        
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")
            
        # Check if user exists
        existing = UserRepository.find_by_email(email)
        if existing:
            print(f"User {email} already exists.")
            user_id = existing["id"]
            # update to admin and set password
            supabase.table("users").update({
                "is_admin": True,
                "password_hash": password_hash
            }).eq("id", user_id).execute()
            print("Updated existing user to admin and reset password.")
        else:
            user = UserRepository.create({
                "email": email,
                "password_hash": password_hash,
                "first_name": "Zinedine",
                "last_name": "Zidane",
                "is_admin": True,
            })
            user_id = user["id"]
            print(f"Created admin user {email}")

        # Find Algerie Poste structure
        res = supabase.table("structures").select("*").ilike("name", "%poste%").execute()
        if res.data:
            structure = res.data[0]
            struct_id = structure["id"]
            print(f"Found structure: {structure['name']}")
            
            # Check if user_structures link exists
            link_res = supabase.table("user_structures").select("*").eq("user_id", user_id).eq("structure_id", struct_id).execute()
            if not link_res.data:
                supabase.table("user_structures").insert({
                    "user_id": user_id,
                    "structure_id": struct_id,
                    "role": "admin"
                }).execute()
                print("Linked admin to structure.")
            else:
                print("Admin already linked to structure.")
        else:
            print("Could not find any Algerie Poste structure in the DB.")

if __name__ == "__main__":
    seed_admin()
