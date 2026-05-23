import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from app.services.auth_service import AuthService

app = create_app()

def test_register():
    with app.app_context():
        try:
            user = AuthService.register({
                "email": "test_empty_date@test.com",
                "password": "password123",
                "first_name": "Test",
                "last_name": "User",
                "birth_date": "",
                "wilaya": "",
                "commune": ""
            })
            print("Registration success:", user)
        except Exception as e:
            print("Registration error:", str(e))
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    test_register()
