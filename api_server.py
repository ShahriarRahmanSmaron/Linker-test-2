"""
Mockup Generator 2.0 - API Server v5.3
Includes Clerk hybrid authentication for buyers/manufacturers
"""

import os
import glob
import json
import logging
import re
import io
import sys
import hmac
import hashlib
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import pandas as pd
from PIL import Image as PILImage
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR
import jwt as pyjwt
from jwt import PyJWKClient
import requests

# ===== CONFIGURATION =====
from config import settings
from models import db, User, Fabric
from mockup_library import MockupGeneratorV2

# Use settings from environment variables
PROJECT_ROOT = str(settings.project_root_path)
FABRIC_SWATCH_DIR = str(settings.fabric_dir_path)
MOCKUP_DIR_TEMPLATES = str(settings.mockup_dir_path)
SILHOUETTE_DIR = str(settings.silhouette_dir_path)
MASK_DIR = str(settings.mask_dir_path)
MOCKUP_DIR_OUTPUT = str(settings.mockup_output_dir_path)
TECHPACK_DIR = str(settings.pdf_output_dir_path)
EXCEL_DIR = str(settings.excel_dir_path)
IMAGE_DIR = str(settings.image_dir_path)
DATABASE_PATH = str(settings.database_path)
TITLE_SLIDE_1_PATH = str(settings.title_slide_1_path)
TITLE_SLIDE_2_PATH = str(settings.title_slide_2_path)

# Initialize Flask App
app = Flask(__name__)

# Security: Restrict CORS to frontend origins
cors_origins = settings.CORS_ALLOWED_ORIGINS.split(',')
CORS(app, resources={r"/*": {"origins": cors_origins}}, supports_credentials=True)

# Database Configuration
# Production: Use DATABASE_URL env var (PostgreSQL recommended for concurrency)
# Development: Falls back to SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 
    f"sqlite:///{os.path.join(PROJECT_ROOT, 'instance', 'fabric_sourcing.db')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Security: JWT Secret Key
app.config['JWT_SECRET_KEY'] = settings.SECRET_KEY
if not app.config['JWT_SECRET_KEY']:
    raise ValueError("No SECRET_KEY set for Flask application. Please set it in .env file.")

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db) # Architecture: Enable database migrations
jwt = JWTManager(app)

# Security: Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# ===== CLERK INTEGRATION =====
# Load Clerk configuration from environment
# Load Clerk configuration from environment
CLERK_SECRET_KEY = settings.CLERK_SECRET_KEY

CLERK_WEBHOOK_SECRET = settings.CLERK_WEBHOOK_SECRET  # For webhook signature verification

# Clerk JWKS URL for token verification
# IMPORTANT: Set this to your Clerk instance's JWKS URL
# Format: https://<your-clerk-subdomain>.clerk.accounts.dev/.well-known/jwks.json
# Example: https://glowing-mule-27.clerk.accounts.dev/.well-known/jwks.json
CLERK_JWKS_URL = settings.CLERK_JWKS_URL

if not CLERK_JWKS_URL:
    logger.warning(
        "CLERK_JWKS_URL not set! Clerk authentication will fail. "
        "Set it in your .env file."
    )

# Load allowed company domains into memory at startup (O(1) lookup)
ALLOWED_DOMAINS_FILE = os.path.join(PROJECT_ROOT, 'data', 'allowed_companies.csv')
ALLOWED_DOMAINS: set = set()

def load_allowed_domains():
    """Load allowed company domains from CSV file into memory."""
    global ALLOWED_DOMAINS
    try:
        if os.path.exists(ALLOWED_DOMAINS_FILE):
            with open(ALLOWED_DOMAINS_FILE, 'r') as f:
                domains = set()
                for line in f:
                    line = line.strip().lower()
                    # Skip empty lines and comments
                    if line and not line.startswith('#'):
                        domains.add(line)
                ALLOWED_DOMAINS = domains
                logger.info(f"Loaded {len(ALLOWED_DOMAINS)} allowed domains for buyer verification")
        else:
            logger.warning(f"Allowed domains file not found: {ALLOWED_DOMAINS_FILE}")
    except Exception as e:
        logger.error(f"Error loading allowed domains: {e}")

# Load domains at startup
load_allowed_domains()

def get_email_domain(email: str) -> str:
    """Extract domain from email address."""
    if '@' in email:
        return email.split('@')[1].lower()
    return ''

def verify_clerk_token(token: str) -> dict:
    """
    Verify Clerk JWT token using JWKS.
    Returns decoded claims if valid, raises exception otherwise.
    """
    if not CLERK_JWKS_URL:
        raise ValueError(
            "CLERK_JWKS_URL not configured. "
            "Set it in .env to: https://<your-clerk-subdomain>.clerk.accounts.dev/.well-known/jwks.json"
        )
    
    try:
        # Get the JWKS client
        jwks_client = PyJWKClient(CLERK_JWKS_URL)
        
        # Get the signing key from the JWT header
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify the token
        decoded = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Clerk doesn't always set audience
        )
        return decoded
    except pyjwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except pyjwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"JWKS verification error (URL: {CLERK_JWKS_URL}): {e}")
        raise ValueError(f"Token verification failed: {str(e)}")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

@app.before_request
def log_request_info():
    if request.path.startswith('/api'):
        logger.info(f"[API] {request.method} {request.path}")

@app.after_request
def log_response_info(response):
    if request.path.startswith('/api'):
        logger.info(f"[API] {request.method} {request.path} -> {response.status_code}")
    return response

# ===== HELPER FUNCTIONS =====
def find_file(directory, base_filename, extensions=['.jpg', '.png', '.jpeg', '.webp']):
    # Security: Prevent path traversal while preserving special characters in filenames
    # Use os.path.basename to ensure we only get the filename part (no directory separators)
    base_filename = os.path.basename(str(base_filename))
    # Additional check: reject any remaining path traversal attempts
    if '..' in base_filename or '/' in base_filename or '\\' in base_filename:
        return None
    
    for ext in extensions:
        for case_ext in [ext, ext.upper(), ext.lower()]:
            path = os.path.join(directory, f"{base_filename}{case_ext}")
            if os.path.exists(path): return f"{base_filename}{case_ext}"
    return None

def clean_group_name(text):
    if not isinstance(text, str): return str(text)
    return text.strip()

# ===== ADMIN DECORATOR =====
def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") != "admin":
                return jsonify({"msg": "Admins only!"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# ===== API ROUTES =====

@app.route('/health')
def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return jsonify({'status': 'ok'}), 200

@app.route('/api/fabric-groups')
@limiter.limit("100 per minute")
def get_fabric_groups():
    try:
        # Architecture: Standardized on Model.query pattern for consistency
        groups = Fabric.query.with_entities(Fabric.fabric_group).filter_by(status='LIVE').distinct().all()
        cleaned_groups = sorted(list(set([clean_group_name(g[0]) for g in groups if g[0]])))
        return jsonify(cleaned_groups)
    except Exception as e:
        logger.error(f"Error fetching groups: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/api/find-fabrics')
@limiter.limit("60 per minute")
def find_fabrics():
    search_term = request.args.get('search', '').strip()
    filter_group = request.args.get('group', '').strip()
    filter_weight = request.args.get('weight', '').strip()
    # Stability: Use Flask's type parameter to safely handle invalid input (prevents 500 errors)
    page = request.args.get('page', 1, type=int)
    if page < 1:
        page = 1
    
    # Security: Enforce max limit to prevent DoS
    MAX_LIMIT = 100
    limit = request.args.get('limit', 20, type=int)
    limit = max(1, min(limit, MAX_LIMIT))
    
    logger.info(f"Search: '{search_term}' | Group: '{filter_group}' | Weight: '{filter_weight}'")

    try:
        query = Fabric.query.filter_by(status='LIVE')

        # 1. Apply Filters
        if filter_group:
            query = query.filter(Fabric.fabric_group.ilike(f"%{filter_group}%"))
        
        if filter_weight:
            if filter_weight == 'light':
                query = query.filter(Fabric.gsm < 160)
            elif filter_weight == 'medium':
                query = query.filter(Fabric.gsm.between(160, 240))
            elif filter_weight == 'heavy':
                query = query.filter(Fabric.gsm > 240)

        # 2. Apply Search Term
        if search_term:
            term = f"%{search_term}%"
            query = query.filter(
                (Fabric.ref.ilike(term)) |
                (Fabric.fabrication.ilike(term)) |
                (Fabric.fabric_group.ilike(term))
            )

        # 3. Pagination
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        results = []
        for f in pagination.items:
            # Get owner name
            owner = User.query.get(f.manufacturer_id)
            owner_name = owner.company_name if owner else "Unknown"
            
            # Find image
            # Optimization: Use stored image_path if available
            image_filename = f.image_path if hasattr(f, 'image_path') and f.image_path else find_file(FABRIC_SWATCH_DIR, f.ref)
            swatch_url = f"/static/swatches/{image_filename}" if image_filename else None
            
            results.append({
                "id": f.id,
                "ref": f.ref,
                "fabric_group": f.fabric_group,
                "fabrication": f.fabrication,
                "gsm": f.gsm,
                "width": f.width,
                "composition": f.composition,
                "status": f.status,
                "owner_name": owner_name,
                "manufacturer_id": f.manufacturer_id,
                "meta_data": f.meta_data or {},
                "swatchUrl": swatch_url
            })
            
        return jsonify({
            "results": results,
            "total": pagination.total,
            "page": page,
            "limit": limit,
            "pages": pagination.pages
        })

    except Exception as e:
        logger.error(f"Error finding fabrics: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/api/garments')
@limiter.limit("100 per minute")
def get_garments():
    try:
        garments_by_category = {}
        
        if not os.path.exists(MOCKUP_DIR_TEMPLATES):
            return jsonify({})
            
        files = os.listdir(MOCKUP_DIR_TEMPLATES)
        garment_map = {} # Key: (category, base_name) -> data

        for filename in files:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                # Remove extension
                name_part = os.path.splitext(filename)[0]
                
                # Check for view suffix
                view = None
                base_name = name_part
                if '_face' in name_part.lower():
                    base_name = re.sub(r'_face', '', name_part, flags=re.IGNORECASE)
                    view = 'face'
                elif '_back' in name_part.lower():
                    base_name = re.sub(r'_back', '', name_part, flags=re.IGNORECASE)
                    view = 'back'
                
                # Split category (first word)
                parts = base_name.split(' ', 1)
                if len(parts) > 1:
                    category = parts[0].capitalize() # Men, Ladies, Infant
                    display_name = parts[1].strip()
                else:
                    category = "Uncategorized"
                    display_name = base_name
                
                # Key for uniqueness
                key = (category, display_name)
                
                if key not in garment_map:
                    garment_map[key] = {
                        "name": base_name, 
                        "displayName": display_name,
                        "category": category,
                        "imageUrl": None,
                        "hasFace": False
                    }
                
                # Determine best image for thumbnail
                if view == 'face' or not garment_map[key]["imageUrl"]:
                     garment_map[key]["imageUrl"] = f"/static/mockup-templates/{filename}"
                     if view == 'face':
                         garment_map[key]["hasFace"] = True
                elif view == 'back' and not garment_map[key]["hasFace"]:
                     garment_map[key]["imageUrl"] = f"/static/mockup-templates/{filename}"

        # Convert map to response structure
        for key, data in garment_map.items():
            cat = data["category"]
            if cat not in garments_by_category:
                garments_by_category[cat] = []
                
            garments_by_category[cat].append({
                "name": data["name"],
                "displayName": data["displayName"],
                "imageUrl": data["imageUrl"],
                "isSilhouette": True
            })
            
        return jsonify(garments_by_category)

    except Exception as e:
        logger.error(f"Error fetching garments: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/api/generate-mockup', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def generate_on_demand():
    data = request.json
    fabric_ref = data.get('fabric_ref')
    mockup_name = data.get('mockup_name')
    
    if not fabric_ref or not mockup_name:
        return jsonify({"success": False, "error": "Missing fabric_ref or mockup_name"}), 400
    
    # Security: Validate inputs (prevent path traversal while preserving special characters)
    # Use os.path.basename to ensure we only get the filename part
    fabric_ref = os.path.basename(str(fabric_ref))
    mockup_name = os.path.basename(str(mockup_name))
    # Reject path traversal attempts
    if '..' in fabric_ref or '/' in fabric_ref or '\\' in fabric_ref:
        return jsonify({"success": False, "error": "Invalid fabric_ref: path traversal detected"}), 400
    if '..' in mockup_name or '/' in mockup_name or '\\' in mockup_name:
        return jsonify({"success": False, "error": "Invalid mockup_name: path traversal detected"}), 400
    
    try:
        generator = MockupGeneratorV2(
            fabric_dir=FABRIC_SWATCH_DIR,
            mockup_dir=MOCKUP_DIR_TEMPLATES,
            mask_dir=MASK_DIR,
            output_dir=MOCKUP_DIR_OUTPUT
        )
        
        results = generator.generate_mockup(fabric_ref, mockup_name)
        
        if results:
            mockups = {}
            views = []
            for res in results:
                filename = os.path.basename(res)
                view = "single"
                if "_face" in filename: view = "face"
                elif "_back" in filename: view = "back"
                
                mockups[view] = f"/static/mockups/{filename}"
                views.append(view)
                
            return jsonify({
                "success": True,
                "mockups": mockups,
                "views": views
            })
        else:
            return jsonify({"success": False, "error": "Failed to generate mockup. Check if files exist."}), 404
    
    # Reliability: Catch specific exceptions for appropriate error responses
    except (PILImage.UnidentifiedImageError, OSError) as e:
        logger.warning(f"Invalid image file in mockup generation: {e}")
        return jsonify({"success": False, "error": "Invalid or corrupt image file"}), 400
    except MemoryError as e:
        logger.error(f"Memory error during mockup generation: {e}")
        return jsonify({"success": False, "error": "Server ran out of memory processing this request"}), 503
    except Exception as e:
        logger.error(f"Unexpected error generating mockup: {e}")
        return jsonify({"success": False, "error": "An unexpected server error occurred"}), 500

@app.route('/api/generate-pptx', methods=['POST'])
@limiter.limit("5 per minute")
def generate_pptx():
    return jsonify({"success": False, "error": "Not implemented"}), 501

# ===== STATIC SERVING ROUTES =====
@app.route('/static/mockups/<filename>')
def serve_mockup(filename): return send_from_directory(MOCKUP_DIR_OUTPUT, filename)

@app.route('/static/mockup-templates/<filename>')
def serve_mockup_template(filename): return send_from_directory(MOCKUP_DIR_TEMPLATES, filename)

@app.route('/static/silhouettes/<filename>')
def serve_silhouette(filename): return send_from_directory(SILHOUETTE_DIR, filename)

@app.route('/static/swatches/<filename>')
def serve_swatch(filename): return send_from_directory(FABRIC_SWATCH_DIR, filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    # Security: Enforce strict path isolation to prevent traversal attacks
    safe_filename = secure_filename(filename)
    if not safe_filename:
        return jsonify({"error": "Invalid filename"}), 400
    safe_path = os.path.join(IMAGE_DIR, safe_filename)
    if not os.path.exists(safe_path):
        return jsonify({"error": "File not found"}), 404
    return send_from_directory(IMAGE_DIR, safe_filename)

@app.route('/')
def serve_index(): return send_from_directory(PROJECT_ROOT, 'index.html')

@app.route('/app.html')
def serve_app(): return send_from_directory(PROJECT_ROOT, 'app.html')

@app.route('/app.js')
def serve_js(): return send_from_directory(PROJECT_ROOT, 'app.js')

@app.route('/styles.css')
def serve_css(): return send_from_directory(PROJECT_ROOT, 'styles.css')
@app.route('/script.js')
def serve_script(): return send_from_directory(PROJECT_ROOT, 'script.js')

# ===== ADMIN ROUTES =====
@app.route('/api/admin/fabrics', methods=['GET'])
@admin_required()
def get_admin_fabrics():
    try:
        status_filter = request.args.get('status')
        query = Fabric.query
        if status_filter:
            if '|' in status_filter:
                statuses = status_filter.split('|')
                query = query.filter(Fabric.status.in_(statuses))
            else:
                query = query.filter_by(status=status_filter)
        fabrics = query.order_by(Fabric.id.desc()).limit(100).all()
        results = []
        for f in fabrics:
            owner = User.query.get(f.manufacturer_id)
            owner_name = owner.company_name if owner else "Unknown"
            
            # Find image
            image_filename = f.image_path if hasattr(f, 'image_path') and f.image_path else find_file(FABRIC_SWATCH_DIR, f.ref)
            swatch_url = f"/static/swatches/{image_filename}" if image_filename else None
            
            results.append({
                "id": f.id, "ref": f.ref, "fabric_group": f.fabric_group,
                "fabrication": f.fabrication, "gsm": f.gsm, "width": f.width,
                "composition": f.composition, "status": f.status,
                "owner_name": owner_name, "manufacturer_id": f.manufacturer_id,
                "meta_data": f.meta_data or {},
                "swatchUrl": swatch_url
            })
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error fetching admin fabrics: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/api/admin/fabric/<int:fabric_id>', methods=['GET', 'PUT', 'DELETE'])
@admin_required()
def manage_fabric(fabric_id):
    try:
        fabric = Fabric.query.get_or_404(fabric_id)
        if request.method == 'GET':
            # Find image
            image_filename = fabric.image_path if hasattr(fabric, 'image_path') and fabric.image_path else find_file(FABRIC_SWATCH_DIR, fabric.ref)
            swatch_url = f"/static/swatches/{image_filename}" if image_filename else None

            return jsonify({
                "id": fabric.id, "ref": fabric.ref, "fabric_group": fabric.fabric_group,
                "fabrication": fabric.fabrication, "gsm": fabric.gsm, "width": fabric.width,
                "composition": fabric.composition, "status": fabric.status,
                "manufacturer_id": fabric.manufacturer_id, "meta_data": fabric.meta_data or {},
                "swatchUrl": swatch_url
            })
        elif request.method == 'PUT':
            data = request.json
            if 'status' in data: fabric.status = data['status']
            if 'manufacturer_id' in data: fabric.manufacturer_id = data['manufacturer_id']
            if 'meta_data' in data: fabric.meta_data = data['meta_data']
            for field in ['ref', 'fabric_group', 'fabrication', 'gsm', 'width', 'composition']:
                if field in data: setattr(fabric, field, data[field])
            db.session.commit()
            return jsonify({"success": True, "message": "Fabric updated"})
        elif request.method == 'DELETE':
            db.session.delete(fabric)
            db.session.commit()
            return jsonify({"success": True, "message": "Fabric deleted"})
    except Exception as e:
        logger.error(f"Error managing fabric {fabric_id}: {e}")
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred."}), 500

@app.route('/api/admin/mills', methods=['GET'])
@admin_required()
def get_mills():
    try:
        mills = User.query.filter_by(role='manufacturer').all()
        return jsonify([{"id": m.id, "name": m.company_name} for m in mills])
    except Exception as e:
        logger.error(f"Error fetching mills: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

# ===== AUTHENTICATION =====
@app.route('/api/auth/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    requested_role = data.get('role', 'buyer')
    company_name = data.get('company_name', '')
    
    # Security: Only allow 'buyer' or 'manufacturer' roles during signup
    # Admin users must be created through CLI command: flask --app api_server create-admin
    if requested_role not in ['buyer', 'manufacturer']:
        role = 'buyer'  # Default to buyer for invalid/admin role attempts
    else:
        role = requested_role
    
    if not email or not password: 
        return jsonify({"msg": "Email and password required"}), 400
    if User.query.filter_by(email=email).first(): 
        return jsonify({"msg": "Email already exists"}), 400
    
    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password_hash=hashed_password, role=role, company_name=company_name)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully", "user_id": new_user.id, "role": role}), 201

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"msg": "Request body is required"}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"msg": "Email and password are required"}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"msg": "Bad email or password"}), 401
        
        # Check if user has a password hash (Clerk users don't have one)
        if not user.password_hash:
            return jsonify({"msg": "Bad email or password"}), 401
        
        if not check_password_hash(user.password_hash, password):
            return jsonify({"msg": "Bad email or password"}), 401
        
        # Security: Only allow admins to login via password
        if user.role != 'admin':
            return jsonify({"msg": "Access denied. Only admins can login via this endpoint."}), 403

        additional_claims = {
            "role": user.role, 
            "company": user.company_name or "",
            "approval_status": getattr(user, 'approval_status', 'none'),
            "is_verified_buyer": getattr(user, 'is_verified_buyer', False)
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        # Build user profile with safe field access
        user_profile = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.company_name or "",
            "approval_status": getattr(user, 'approval_status', 'none'),
            "is_verified_buyer": getattr(user, 'is_verified_buyer', False)
        }
        
        return jsonify({
            "token": access_token,
            "user_profile": user_profile
        }), 200
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Admin login error: {e}\n{error_traceback}")
        db.session.rollback()
        error_msg = str(e) if app.config.get('DEBUG', False) else "An unexpected error occurred during login"
        return jsonify({"msg": error_msg}), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user: return jsonify({"msg": "User not found"}), 404
    return jsonify({
        "id": user.id, 
        "email": user.email, 
        "role": user.role, 
        "name": user.company_name,
        "approval_status": user.approval_status,
        "is_verified_buyer": user.is_verified_buyer
    }), 200

# ===== CLERK AUTHENTICATION ENDPOINTS =====

@app.route('/api/auth/clerk-sync', methods=['POST'])
@limiter.limit("100 per minute")
def clerk_sync():
    """
    Sync Clerk user to local database and issue Flask JWT.
    
    Security: Backend determines role based on:
    1. Email domain verification against allowed_companies.csv
    2. Requested role (manufacturer requires approval)
    
    Frontend role selection is for UX only - backend has final authority.
    """
    # Early validation check
    if not CLERK_JWKS_URL:
        logger.error("CLERK_JWKS_URL not configured - cannot verify Clerk tokens")
        return jsonify({
            "msg": "Clerk authentication not properly configured. Please contact support.",
            "error": "CLERK_JWKS_URL missing"
        }), 500
    
    try:
        # 1. Extract and verify Clerk token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({"msg": "Missing or invalid Authorization header"}), 401
        
        clerk_token = auth_header.split(' ')[1]
        
        try:
            claims = verify_clerk_token(clerk_token)
        except ValueError as e:
            logger.warning(f"Clerk token verification failed: {e}")
            return jsonify({"msg": str(e)}), 401
        
        # 2. Extract user info from verified claims
        clerk_id = claims.get('sub')  # Clerk user ID
        
        # Try multiple ways to get email from token
        email = (
            claims.get('email') or 
            claims.get('email_address') or
            (claims.get('email_addresses', [{}])[0].get('email_address', '') if claims.get('email_addresses') else '')
        )
        
        # Fallback: Fetch from Clerk API if email is missing in token
        if clerk_id and not email:
            if CLERK_SECRET_KEY:
                try:
                    logger.info(f"Fetching user {clerk_id} from Clerk API (email not in token)...")
                    headers = {'Authorization': f'Bearer {CLERK_SECRET_KEY}'}
                    resp = requests.get(f'https://api.clerk.com/v1/users/{clerk_id}', headers=headers, timeout=5)
                    if resp.status_code == 200:
                        clerk_user_data = resp.json()
                        email_addresses = clerk_user_data.get('email_addresses', [])
                        if email_addresses:
                            # Use primary email or first verified email
                            primary_id = clerk_user_data.get('primary_email_address_id')
                            # Prefer verified emails
                            verified_emails = [e for e in email_addresses if e.get('verification', {}).get('status') == 'verified']
                            if verified_emails:
                                email_obj = next((e for e in verified_emails if e['id'] == primary_id), verified_emails[0])
                            else:
                                email_obj = next((e for e in email_addresses if e['id'] == primary_id), email_addresses[0])
                            email = email_obj.get('email_address', '')
                            logger.info(f"Retrieved email {email} from Clerk API for user {clerk_id}")
                    else:
                        logger.warning(f"Clerk API returned status {resp.status_code} for user {clerk_id}")
                except requests.exceptions.RequestException as api_err:
                    logger.error(f"Failed to fetch from Clerk API: {api_err}")
                except Exception as api_err:
                    logger.error(f"Unexpected error fetching from Clerk API: {api_err}")
            else:
                logger.warning("CLERK_SECRET_KEY not set, cannot fetch email from Clerk API")

        if not clerk_id:
            logger.error("Token claims missing Clerk user ID (sub)")
            return jsonify({"msg": "Invalid token: missing user ID"}), 400
            
        if not email:
            logger.error(f"Token claims missing Email. ClerkID: {clerk_id}, Email found: False")
            return jsonify({"msg": "Email verification required. Please verify your email address in Clerk before signing in."}), 400
        
        # 3. Get requested role from body (optional, for UX)
        data = request.json or {}
        requested_role = data.get('requested_role', 'buyer')
        company_name = data.get('company_name', '')
        
        # 4. Backend authority: determine actual role
        email_domain = get_email_domain(email)
        
        # Role determination logic:
        # - If requesting manufacturer -> role='manufacturer', status='pending'
        # - Elif domain in whitelist -> role='buyer', is_verified_buyer=True
        # - Else -> role='general_user'
        
        if requested_role == 'manufacturer':
            role = 'manufacturer'
            approval_status = 'pending'
            is_verified_buyer = False
        elif email_domain in ALLOWED_DOMAINS:
            role = 'buyer'
            approval_status = 'none'
            is_verified_buyer = True
        else:
            role = 'general_user'
            approval_status = 'none'
            is_verified_buyer = False
        
        # 5. Find or create user in database
        # Use case-insensitive email matching to handle email variations
        user = User.query.filter(
            (User.clerk_id == clerk_id) | (func.lower(User.email) == email.lower())
        ).first()
        
        if user:
            # Update existing user with Clerk ID if not set
            # Check if clerk_id is already taken by another user
            if not user.clerk_id:
                # Verify clerk_id is not already assigned to another user
                existing_clerk_user = User.query.filter_by(clerk_id=clerk_id).first()
                if existing_clerk_user and existing_clerk_user.id != user.id:
                    logger.error(f"Clerk ID {clerk_id} already assigned to user {existing_clerk_user.email}")
                    return jsonify({"msg": "Account conflict: Clerk ID already in use"}), 409
                user.clerk_id = clerk_id
            
            # Only update role if user was previously general_user and now qualifies for upgrade
            # Don't downgrade existing buyers/manufacturers
            if user.role == 'general_user':
                user.role = role
                user.approval_status = approval_status
                user.is_verified_buyer = is_verified_buyer
            elif user.role == 'buyer' and not user.is_verified_buyer and is_verified_buyer:
                # Upgrade unverified buyer to verified
                user.is_verified_buyer = True
            
            # Update company name if provided and not set
            if company_name and not user.company_name:
                user.company_name = company_name
                
            try:
                db.session.commit()
            except IntegrityError as ie:
                db.session.rollback()
                logger.error(f"Database integrity error updating user: {ie}")
                return jsonify({"msg": "Database error: Unable to update user account"}), 500
        else:
            # Create new user
            user = User(
                email=email,
                clerk_id=clerk_id,
                role=role,
                company_name=company_name,
                approval_status=approval_status,
                is_verified_buyer=is_verified_buyer,
                password_hash=None  # Clerk users don't have local passwords
            )
            db.session.add(user)
            try:
                db.session.commit()
                logger.info(f"Created new Clerk user: {email} with role: {role}")
            except IntegrityError as ie:
                db.session.rollback()
                # User might have been created between query and insert (race condition)
                # Try to find the user again
                user = User.query.filter(
                    (User.clerk_id == clerk_id) | (func.lower(User.email) == email.lower())
                ).first()
                if user:
                    logger.info(f"User {email} was created concurrently, using existing user")
                    # Update clerk_id if needed
                    if not user.clerk_id and clerk_id:
                        user.clerk_id = clerk_id
                        try:
                            db.session.commit()
                        except IntegrityError:
                            db.session.rollback()
                else:
                    logger.error(f"Database integrity error creating user: {ie}")
                    return jsonify({"msg": "Database error: Unable to create user account. Email or Clerk ID may already be in use."}), 500
        
        # 6. Generate Flask JWT for API calls
        additional_claims = {
            "role": user.role,
            "company": user.company_name,
            "approval_status": user.approval_status,
            "is_verified_buyer": user.is_verified_buyer
        }
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
        
        # 7. Return token and user profile
        return jsonify({
            "token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "name": user.company_name,
                "approval_status": user.approval_status,
                "is_verified_buyer": user.is_verified_buyer
            }
        }), 200
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Clerk sync error: {e}\n{error_traceback}")
        db.session.rollback()
        # Return more detailed error in development, generic in production
        # error_msg = str(e) if app.config.get('DEBUG', False) else "An unexpected error occurred during authentication"
        # TEMPORARY DEBUGGING: Always return detailed error
        return jsonify({
            "msg": "An unexpected error occurred during authentication",
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500


@app.route('/api/webhooks/clerk', methods=['POST'])
def clerk_webhook():
    """
    Clerk webhook endpoint for user.created events.
    This is a backup sync mechanism to prevent ghost users
    (users who exist in Clerk but not in our database).
    
    Security: Verifies webhook signature using svix headers.
    """
    try:
        # Get webhook signature headers
        svix_id = request.headers.get('svix-id')
        svix_timestamp = request.headers.get('svix-timestamp')
        svix_signature = request.headers.get('svix-signature')
        
        if not all([svix_id, svix_timestamp, svix_signature]):
            logger.warning("Clerk webhook missing signature headers")
            return jsonify({"msg": "Missing webhook signature headers"}), 400
        
        # Verify signature if secret is configured
        if CLERK_WEBHOOK_SECRET:
            payload = request.get_data(as_text=True)
            
            # Construct the signed content
            signed_content = f"{svix_id}.{svix_timestamp}.{payload}"
            
            # Get the expected signature (format: v1,<base64_signature>)
            expected_signatures = svix_signature.split(' ')
            signature_valid = False
            
            for sig in expected_signatures:
                if sig.startswith('v1,'):
                    expected_sig = sig[3:]  # Remove 'v1,' prefix
                    
                    # Compute HMAC
                    secret_bytes = CLERK_WEBHOOK_SECRET.encode('utf-8')
                    if CLERK_WEBHOOK_SECRET.startswith('whsec_'):
                        # Decode base64 secret
                        import base64
                        secret_bytes = base64.b64decode(CLERK_WEBHOOK_SECRET[6:])
                    
                    computed_sig = hmac.new(
                        secret_bytes,
                        signed_content.encode('utf-8'),
                        hashlib.sha256
                    ).digest()
                    
                    import base64
                    computed_sig_b64 = base64.b64encode(computed_sig).decode('utf-8')
                    
                    if hmac.compare_digest(computed_sig_b64, expected_sig):
                        signature_valid = True
                        break
            
            if not signature_valid:
                logger.warning("Clerk webhook signature verification failed")
                return jsonify({"msg": "Invalid webhook signature"}), 401
        
        # Parse webhook payload
        data = request.json
        event_type = data.get('type')
        
        if event_type == 'user.created':
            user_data = data.get('data', {})
            clerk_id = user_data.get('id')
            email_addresses = user_data.get('email_addresses', [])
            email = email_addresses[0].get('email_address') if email_addresses else None
            
            if not clerk_id or not email:
                logger.warning("Clerk webhook user.created missing required fields")
                return jsonify({"msg": "Missing required user fields"}), 400
            
            # Check if user already exists (from primary sync)
            existing_user = User.query.filter(
                (User.clerk_id == clerk_id) | (User.email == email)
            ).first()
            
            if existing_user:
                # User already exists, update clerk_id if needed
                if not existing_user.clerk_id:
                    existing_user.clerk_id = clerk_id
                    db.session.commit()
                logger.info(f"Clerk webhook: User {email} already exists")
            else:
                # Create new user with general_user role
                # They'll get proper role assignment on first login via clerk-sync
                email_domain = get_email_domain(email)
                is_verified = email_domain in ALLOWED_DOMAINS
                
                new_user = User(
                    email=email,
                    clerk_id=clerk_id,
                    role='buyer' if is_verified else 'general_user',
                    approval_status='none',
                    is_verified_buyer=is_verified,
                    password_hash=None
                )
                db.session.add(new_user)
                db.session.commit()
                logger.info(f"Clerk webhook: Created user {email} as backup sync")
            
            return jsonify({"success": True}), 200
        
        elif event_type == 'user.deleted':
            # Optionally handle user deletion
            user_data = data.get('data', {})
            clerk_id = user_data.get('id')
            
            if clerk_id:
                user = User.query.filter_by(clerk_id=clerk_id).first()
                if user:
                    # Mark user as deleted or remove - depends on your data retention policy
                    logger.info(f"Clerk webhook: User {user.email} deleted from Clerk")
                    # Uncomment to actually delete:
                    # db.session.delete(user)
                    # db.session.commit()
            
            return jsonify({"success": True}), 200
        
        # Acknowledge other event types
        return jsonify({"success": True}), 200
        
    except Exception as e:
        logger.error(f"Clerk webhook error: {e}")
        db.session.rollback()
        return jsonify({"msg": "Webhook processing failed"}), 500


# ===== ADMIN USER MANAGEMENT ENDPOINTS =====

@app.route('/api/admin/users', methods=['GET'])
@admin_required()
def get_admin_users():
    """Get all users for admin management, with optional status filter."""
    try:
        status_filter = request.args.get('approval_status')
        role_filter = request.args.get('role')
        
        query = User.query
        
        if status_filter:
            query = query.filter_by(approval_status=status_filter)
        if role_filter:
            query = query.filter_by(role=role_filter)
        
        users = query.order_by(User.id.desc()).limit(100).all()
        
        return jsonify([{
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "company_name": u.company_name,
            "approval_status": u.approval_status,
            "is_verified_buyer": u.is_verified_buyer,
            "has_clerk_id": bool(u.clerk_id)
        } for u in users])
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/api/admin/user/<int:user_id>/approve', methods=['POST'])
@admin_required()
def approve_user(user_id):
    """Approve a manufacturer's account."""
    try:
        user = User.query.get_or_404(user_id)
        
        if user.role != 'manufacturer':
            return jsonify({"msg": "Only manufacturer accounts require approval"}), 400
        
        user.approval_status = 'approved'
        db.session.commit()
        
        logger.info(f"Admin approved manufacturer: {user.email}")
        return jsonify({"success": True, "message": f"Manufacturer {user.email} approved"})
        
    except Exception as e:
        logger.error(f"Error approving user {user_id}: {e}")
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/api/admin/user/<int:user_id>/reject', methods=['POST'])
@admin_required()
def reject_user(user_id):
    """Reject a manufacturer's account."""
    try:
        user = User.query.get_or_404(user_id)
        
        if user.role != 'manufacturer':
            return jsonify({"msg": "Only manufacturer accounts can be rejected"}), 400
        
        user.approval_status = 'rejected'
        db.session.commit()
        
        logger.info(f"Admin rejected manufacturer: {user.email}")
        return jsonify({"success": True, "message": f"Manufacturer {user.email} rejected"})
        
    except Exception as e:
        logger.error(f"Error rejecting user {user_id}: {e}")
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred."}), 500


@app.route('/api/admin/domains', methods=['GET', 'POST'])
@admin_required()
def manage_domains():
    """Get or update the allowed domains list."""
    try:
        if request.method == 'GET':
            return jsonify({"domains": list(ALLOWED_DOMAINS)})
        
        elif request.method == 'POST':
            data = request.json
            domains = data.get('domains', [])
            
            # Write to file
            with open(ALLOWED_DOMAINS_FILE, 'w') as f:
                f.write("# Allowed Company Domains for Verified Buyer Status\n")
                f.write("# Updated via Admin Dashboard\n\n")
                for domain in domains:
                    f.write(f"{domain.strip().lower()}\n")
            
            # Reload into memory
            load_allowed_domains()
            
            return jsonify({"success": True, "count": len(ALLOWED_DOMAINS)})
            
    except Exception as e:
        logger.error(f"Error managing domains: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500

# ===== CLI COMMANDS =====
@app.cli.command('create-admin')
def create_admin():
    """Create an admin user from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)."""
    import click
    
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_password = os.getenv('ADMIN_PASSWORD')
    admin_company = os.getenv('ADMIN_COMPANY', 'System Admin')
    
    if not admin_email or not admin_password:
        click.echo('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.')
        click.echo('Usage: Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file or environment.')
        return
    
    # Check if admin already exists
    existing_user = User.query.filter_by(email=admin_email).first()
    if existing_user:
        if existing_user.role == 'admin':
            click.echo(f'Admin user "{admin_email}" already exists.')
        else:
            # Upgrade existing user to admin
            existing_user.role = 'admin'
            db.session.commit()
            click.echo(f'Upgraded existing user "{admin_email}" to admin role.')
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
    click.echo(f'Admin user "{admin_email}" created successfully.')

if __name__ == '__main__':
    # Production: Use gunicorn instead: gunicorn -w 4 -b 0.0.0.0:5000 api_server:app
    # This block only runs in development mode
    if not os.path.exists(os.path.join(PROJECT_ROOT, 'instance')):
        os.makedirs(os.path.join(PROJECT_ROOT, 'instance'))
    with app.app_context():
        db.create_all()
    
    # Warning for production usage
    if not settings.FLASK_DEBUG:
        logger.warning(
            "WARNING: Running Flask development server in non-debug mode. "
            "For production, use: gunicorn -w 4 -b 0.0.0.0:5000 api_server:app"
        )
    
    app.run(host=settings.FLASK_HOST, port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)