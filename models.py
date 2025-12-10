from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True)  # Nullable for Supabase auth users, required for admin
    role = db.Column(db.String(20), default='general_user')  # buyer, manufacturer, admin, general_user
    company_name = db.Column(db.String(100))
    
    # Supabase Integration Fields
    supabase_uid = db.Column(db.String(36), unique=True, nullable=True)  # UUID linking to auth.users.id
    approval_status = db.Column(db.String(20), default='none')  # pending, approved, rejected, none
    is_verified_buyer = db.Column(db.Boolean, default=False)  # True if email domain matched whitelist
    
class Fabric(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ref = db.Column(db.String(255), nullable=False)
    fabric_group = db.Column(db.String(255))
    fabrication = db.Column(db.String(255))
    gsm = db.Column(db.Integer)
    width = db.Column(db.String(50))
    composition = db.Column(db.String(255))
    status = db.Column(db.String(50), default='pending')
    manufacturer_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    meta_data = db.Column(db.JSON)
    image_path = db.Column(db.String(255)) # Optimization: Store path to avoid N+1 lookups
