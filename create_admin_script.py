import os
from werkzeug.security import generate_password_hash
from api_server import app, db, User
from config import settings

def create_admin_user():
    with app.app_context():
        admin_email = settings.ADMIN_EMAIL
        admin_password = settings.ADMIN_PASSWORD
        # admin_company is not in settings, fallback to env or default
        admin_company = os.getenv('ADMIN_COMPANY', 'System Admin')
        
        print(f"Attempting to create admin: {admin_email}")
        
        if not admin_email or not admin_password:
            print("Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set.")
            return

        # Check if admin already exists
        try:
            existing_user = User.query.filter_by(email=admin_email).first()
            if existing_user:
                # Always update password to match .env
                hashed_password = generate_password_hash(admin_password)
                existing_user.password_hash = hashed_password
                
                if existing_user.role == 'admin':
                    print(f'Admin user "{admin_email}" updated with new password.')
                else:
                    existing_user.role = 'admin'
                    print(f'Upgraded existing user "{admin_email}" to admin role.')
                
                db.session.commit()
                return
            
            # Create new admin user
            hashed_password = generate_password_hash(admin_password)
            admin_user = User(
                email=admin_email,
                password_hash=hashed_password,
                role='admin',
                company_name=admin_company
            )
            db.session.add(admin_user)
            db.session.commit()
            print(f'Admin user "{admin_email}" created successfully.')
            
        except Exception as e:
            print(f"An error occurred: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
