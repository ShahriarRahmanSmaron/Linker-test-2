"""
Create Admin User Script
Run this inside the Docker container to create/update the admin user.
"""
import os
from api_server import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    email = os.environ.get('ADMIN_EMAIL', 'admin@linker.app')
    password = os.environ.get('ADMIN_PASSWORD')
    
    if not password:
        print('Error: ADMIN_PASSWORD environment variable not set')
        exit(1)
    
    user = User.query.filter_by(email=email).first()
    if user:
        user.role = 'admin'
        user.password_hash = generate_password_hash(password)
        db.session.commit()
        print(f'Updated existing user "{email}" to admin with new password')
    else:
        admin = User(
            email=email, 
            password_hash=generate_password_hash(password), 
            role='admin',
            name='Admin',
            company_name='System Admin'
        )
        db.session.add(admin)
        db.session.commit()
        print(f'Created admin user: {email}')
