import os
import json
import pandas as pd
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
INSTANCE_DIR = os.path.join(BASE_DIR, 'instance')
DB_PATH = os.path.join(INSTANCE_DIR, 'fabric_sourcing.db')
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + DB_PATH
DATA_FILE_PATH = os.path.join(BASE_DIR, 'Excel_files', 'fabric_database.xlsx')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from models import db, User, Fabric
db.init_app(app)

def find_file(directory, base_filename, extensions=['.jpg', '.png', '.jpeg', '.webp']):
    for ext in extensions:
        for case_ext in [ext, ext.upper(), ext.lower()]:
            path = os.path.join(directory, f"{base_filename}{case_ext}")
            if os.path.exists(path): return f"{base_filename}{case_ext}"
    return None

# Models


def setup_database():
    print("Starting database setup...")
    
    # Ensure instance directory exists
    if not os.path.exists(INSTANCE_DIR):
        os.makedirs(INSTANCE_DIR)
        print(f"Created instance directory at {INSTANCE_DIR}")

    with app.app_context():
        # Initialize Database
        db.create_all()
        print("Database initialized.")

        # Create Admin User from .env
        admin_email = os.getenv('ADMIN_EMAIL', 'admin@linker.app')
        admin_pass = os.getenv('ADMIN_PASSWORD')
        if not admin_pass:
            raise ValueError("ADMIN_PASSWORD environment variable is required to setup the database.")
        
        admin_user = User.query.filter_by(email=admin_email).first()
        if not admin_user:
            print(f"Creating admin user {admin_email}...")
            admin_user = User(
                email=admin_email,
                password_hash=generate_password_hash(admin_pass),
                role='admin',
                company_name='System Admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print(f"Admin user created with ID: {admin_user.id}")
        else:
            print(f"Admin user {admin_email} already exists.")

        # Create Masco User
        masco_email = 'admin@mascoknit.com'
        masco_user = User.query.filter_by(email=masco_email).first()
        
        if not masco_user:
            # Security: Require password from environment variable
            masco_pass = os.getenv('MASCO_PASSWORD')
            if not masco_pass:
                raise ValueError("MASCO_PASSWORD environment variable is required to setup the database.")
            
            print(f"Creating user {masco_email}...")
            masco_user = User(
                email=masco_email,
                password_hash=generate_password_hash(masco_pass),
                role='manufacturer',
                company_name='Masco'
            )
            db.session.add(masco_user)
            db.session.commit()
            print(f"User {masco_email} created with ID: {masco_user.id}")
        else:
            print(f"User {masco_email} already exists with ID: {masco_user.id}")

        # Load Excel Data
        if os.path.exists(DATA_FILE_PATH):
            print(f"Loading data from {DATA_FILE_PATH}...")
            try:
                df = pd.read_excel(DATA_FILE_PATH)
                
                # Rename columns to match model
                # Expected Excel columns based on user prompt mapping: 'Ref', 'Group'
                # We will map them to 'ref', 'fabric_group'
                # Other columns will be stored in meta_data or mapped if they exist
                
                # Standardize column names for easier mapping (strip whitespace)
                df.columns = [str(c).strip() for c in df.columns]
                
                count = 0
                for index, row in df.iterrows():
                    # Map 'fabric ref' to 'ref'
                    ref_val = str(row.get('fabric ref', ''))
                    if not ref_val or pd.isna(row.get('fabric ref')) or ref_val.lower() == 'nan':
                        continue
                        
                    existing_fabric = Fabric.query.filter_by(ref=ref_val).first()
                    if existing_fabric:
                        continue

                    # Extract specific fields based on actual Excel columns
                    fabric_group = row.get('GROUP')
                    fabrication = row.get('fabrication')
                    gsm = str(row.get('GSM', ''))
                    width = str(row.get('Width', ''))
                    composition = row.get('FABRIC COMPOSITION')
                    
                    # Store everything else in meta_data
                    meta_data = {}
                    for col in df.columns:
                        val = row[col]
                        # Convert to string if not null, else ignore or store as None
                        if pd.notna(val):
                            meta_data[col] = str(val)

                    # Find image path
                    image_filename = find_file(os.path.join(BASE_DIR, 'fabric_swatches'), ref_val)
                    
                    new_fabric = Fabric(
                        ref=ref_val,
                        fabric_group=fabric_group if pd.notna(fabric_group) else None,
                        fabrication=fabrication if pd.notna(fabrication) else None,
                        gsm=gsm if pd.notna(row.get('GSM')) else None,
                        width=width if pd.notna(row.get('Width')) else None,
                        composition=composition if pd.notna(composition) else None,
                        status='LIVE',
                        manufacturer_id=masco_user.id,
                        meta_data=meta_data,
                        image_path=image_filename
                    )
                    db.session.add(new_fabric)
                    count += 1
                
                db.session.commit()
                print(f"Successfully migrated {count} fabrics.")
                
            except Exception as e:
                print(f"Error loading Excel file: {e}")
        else:
            print(f"Data file not found at {DATA_FILE_PATH}")

if __name__ == '__main__':
    setup_database()
