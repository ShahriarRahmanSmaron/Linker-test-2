"""
Mockup Generator 2.0 - API Server v6.0
Includes Supabase authentication for buyers/manufacturers
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
from flask import Flask, request, jsonify, send_from_directory, send_file, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import pandas as pd
from PIL import Image as PILImage
# Security: Limit max image pixels to prevent DoS (DecompressionBomb)
PILImage.MAX_IMAGE_PIXELS = 100000000  # 100 MP limit
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR
import jwt as pyjwt
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
# Use Supabase PostgreSQL via DATABASE_URL env var (required)
database_url = os.getenv('DATABASE_URL')
if not database_url:
    raise ValueError("DATABASE_URL environment variable is required. Please set it in your .env file.")
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize Extensions
db.init_app(app)  # type: ignore[arg-type]
migrate = Migrate(app, db)  # type: ignore[arg-type] # Architecture: Enable database migrations

# Security: Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,  # type: ignore[arg-type]
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

# ===== SUPABASE INTEGRATION =====
# Load Supabase configuration from environment
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY = settings.SUPABASE_ANON_KEY
SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET

if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, SUPABASE_JWT_SECRET]):
    logger.warning(
        "Supabase configuration incomplete! Supabase authentication will fail. "
        "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, and SUPABASE_JWT_SECRET in your .env file."
    )

def verify_supabase_jwt(token: str) -> dict:
    """
    Verify Supabase JWT token using JWT secret.
    Returns decoded claims if valid, raises exception otherwise.
    """
    if not SUPABASE_JWT_SECRET:
        raise ValueError("SUPABASE_JWT_SECRET not configured. Set it in your .env file.")
    
    try:
        # Decode and verify the token using Supabase JWT secret
        decoded = pyjwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"  # Supabase uses 'authenticated' as audience
        )
        logger.info(f"JWT verification SUCCESS - user: {decoded.get('email')}, sub: {decoded.get('sub')}")
        return decoded
    except pyjwt.ExpiredSignatureError:
        logger.error("JWT verification FAILED - Token expired")
        raise ValueError("Token has expired")
    except pyjwt.InvalidTokenError as e:
        logger.error(f"JWT verification FAILED - Invalid token: {str(e)}")
        raise ValueError(f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"JWT verification FAILED - Unexpected error: {e}")
        raise ValueError(f"Token verification failed: {str(e)}")

def get_current_user():
    """
    Extract current user from Supabase JWT token.
    Returns User object or None.
    If user doesn't exist in public.users, attempts to create it from auth.users data.
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        claims = verify_supabase_jwt(token)
        supabase_uid = claims.get('sub')  # Supabase user ID (UUID)
        email = claims.get('email', '')
        user_metadata = claims.get('user_metadata', {})
        
        if not supabase_uid:
            return None
        
        # Query user by supabase_uid
        user = User.query.filter_by(supabase_uid=supabase_uid).first()
        
        # If user doesn't exist, try to create it from JWT claims
        # This handles cases where the trigger didn't fire
        if not user:
            logger.warning(f"User with supabase_uid {supabase_uid} not found in public.users, attempting to create from JWT")
            
            # Try to find by email first
            if email:
                user = User.query.filter_by(email=email).first()
                if user:
                    # Update existing user with supabase_uid
                    user.supabase_uid = supabase_uid
                    db.session.commit()
                    logger.info(f"Updated existing user {user.id} with supabase_uid {supabase_uid}")
                    return user
            
            # Create new user from JWT claims
            # IGNORED FOR SECURITY - User metadata is client-writable
            # requested_role = user_metadata.get('requested_role', 'general_user')
            
            # Extract name and company_name if provided (safe)
            name = user_metadata.get('name', '')
            company_name = user_metadata.get('company_name', '') 
            
            # Force default role for security
            role = 'general_user'
            is_verified_buyer = False
            approval_status = 'none'
            
            try:
                new_user = User(
                    email=email or f"user_{supabase_uid[:8]}@unknown.com",
                    supabase_uid=supabase_uid,
                    role=role,
                    name=name,
                    company_name=company_name,
                    is_verified_buyer=is_verified_buyer,
                    approval_status=approval_status
                )
                db.session.add(new_user)
                db.session.commit()
                logger.info(f"Created user {new_user.id} from JWT for supabase_uid {supabase_uid}")
                return new_user
            except IntegrityError as e:
                db.session.rollback()
                logger.error(f"Failed to create user from JWT: {e}")
                # Try one more time to get the user (might have been created by another request)
                user = User.query.filter_by(supabase_uid=supabase_uid).first()
                if user:
                    return user
                return None
        
        return user
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return None

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

# ===== AUTHENTICATION DECORATORS =====
def supabase_jwt_required():
    """Decorator to require Supabase JWT authentication."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            try:
                user = get_current_user()
                if not user:
                    # Log why authentication failed
                    auth_header = request.headers.get('Authorization', '')
                    error_reason = "User not found"
                    
                    if not auth_header.startswith('Bearer '):
                        logger.warning("Missing Authorization header")
                        error_reason = "Missing Authorization header"
                    else:
                        logger.warning("JWT verification failed or user not found")
                        # Diagnostic: Try to verify token to get exact error
                        try:
                            token = auth_header.split(' ')[1]
                            verify_supabase_jwt(token)
                            error_reason = "Token valid but user lookup failed"
                        except Exception as e:
                            error_reason = f"Token invalid: {str(e)}"
                            
                    return jsonify({"msg": f"Authentication required: {error_reason}"}), 401
                # Attach user to request context for easy access
                request.current_user = user
                return fn(*args, **kwargs)
            except Exception as e:
                logger.error(f"Error in supabase_jwt_required decorator: {e}")
                import traceback
                logger.error(traceback.format_exc())
                return jsonify({"msg": "Authentication error"}), 500
        return decorator
    return wrapper

def admin_required():
    """Decorator to require admin role."""
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"msg": "Authentication required"}), 401
            if user.role != "admin":
                return jsonify({"msg": "Admins only!"}), 403
            request.current_user = user
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
@supabase_jwt_required()
@limiter.limit("10 per minute")
def generate_on_demand():
    # Security: Prevent large payloads (DoS)
    if request.content_length and request.content_length > 10 * 1024 * 1024:  # 10MB limit
        abort(413)
        
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400
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
        # Parameters
        status_filter = request.args.get('status')
        search_term = request.args.get('search', '').strip()
        page = request.args.get('page', 1, type=int)
        page = max(1, page)
        
        # Security: Enforce max limit
        MAX_LIMIT = 100
        limit = request.args.get('limit', 20, type=int)
        limit = max(1, min(limit, MAX_LIMIT))

        query = Fabric.query
        
        # 1. Apply Status Filter
        if status_filter:
            if '|' in status_filter:
                statuses = status_filter.split('|')
                query = query.filter(Fabric.status.in_(statuses))
            else:
                query = query.filter_by(status=status_filter)
        
        # 2. Apply Search
        if search_term:
            term = f"%{search_term}%"
            query = query.filter(
                (Fabric.ref.ilike(term)) |
                (Fabric.fabrication.ilike(term)) |
                (Fabric.fabric_group.ilike(term))
            )
            
        # 3. Apply Pagination
        # Use order_by id desc for latest first
        pagination = query.order_by(Fabric.id.desc()).paginate(page=page, per_page=limit, error_out=False)
        
        results = []
        for f in pagination.items:
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
            
        return jsonify({
            "results": results,
            "total": pagination.total,
            "page": page,
            "limit": limit,
            "pages": pagination.pages
        })
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
            if not data:
                return jsonify({"error": "Request body is required"}), 400
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
        else:
            return jsonify({"error": "Method not allowed"}), 405
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




@app.route('/api/auth/me', methods=['GET'])
@supabase_jwt_required()
def get_current_user_endpoint():
    """Get current user from Supabase JWT token."""
    user = get_current_user()
    if not user:
        # Log diagnostic information
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                claims = verify_supabase_jwt(token)
                supabase_uid = claims.get('sub')
                email = claims.get('email', '')
                logger.error(f"User not found for supabase_uid: {supabase_uid}, email: {email}")
                logger.error(f"Database URI: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')}")
                # Check if user exists by email
                user_by_email = User.query.filter_by(email=email).first() if email else None
                if user_by_email:
                    logger.error(f"User exists by email but supabase_uid mismatch: {user_by_email.supabase_uid} vs {supabase_uid}")
            except Exception as e:
                logger.error(f"Error in diagnostic: {e}")
        return jsonify({"msg": "User not found. Please ensure you've completed signup and the user record exists in the database."}), 404
    return jsonify({
        "id": user.id, 
        "email": user.email, 
        "role": user.role, 
        "name": user.name,  # Use name field instead of company_name
        "approval_status": user.approval_status,
        "is_verified_buyer": user.is_verified_buyer
    }), 200

# ===== SUPABASE AUTHENTICATION =====
# Note: Supabase handles authentication on the frontend.
# Backend only verifies JWT tokens from Supabase.
# No sync endpoints needed - user creation is handled by PostgreSQL trigger.


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
            "has_supabase_uid": bool(u.supabase_uid)
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
    """
    Get or update the allowed domains list.
    Note: This now works with the allowed_companies table in Supabase.
    For GET, we query the database. For POST, we update the database.
    """
    try:
        if request.method == 'GET':
            # Query allowed_companies table from database
            # Note: This requires a direct database query since we don't have a model for it
            from sqlalchemy import text
            result = db.session.execute(text("SELECT domain FROM allowed_companies ORDER BY domain"))
            domains = [row[0] for row in result]
            return jsonify({"domains": domains})
        
        elif request.method == 'POST':
            data = request.json
            if not data:
                return jsonify({"error": "Request body is required"}), 400
            domains = data.get('domains', [])
            
            # Update database table
            from sqlalchemy import text
            # Clear existing domains
            db.session.execute(text("DELETE FROM allowed_companies"))
            # Insert new domains
            for domain in domains:
                domain_clean = domain.strip().lower()
                if domain_clean:
                    db.session.execute(
                        text("INSERT INTO allowed_companies (domain) VALUES (:domain) ON CONFLICT (domain) DO NOTHING"),
                        {"domain": domain_clean}
                    )
            db.session.commit()
            
            return jsonify({"success": True, "count": len(domains)})
        else:
            return jsonify({"error": "Method not allowed"}), 405
            
    except Exception as e:
        logger.error(f"Error managing domains: {e}")
        db.session.rollback()
        return jsonify({"error": "An unexpected error occurred."}), 500

# ===== CLI COMMANDS =====
@app.cli.command('create-admin')
def create_admin():
    """Create an admin user in both Supabase Auth and local database.
    
    Uses environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_COMPANY (optional)
    The admin will be able to login via /admin-login using Supabase Auth.
    """
    import click
    import requests
    
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_password = os.getenv('ADMIN_PASSWORD')
    admin_company = os.getenv('ADMIN_COMPANY', 'System Admin')
    
    if not admin_email or not admin_password:
        click.echo('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.')
        click.echo('Usage: Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file or environment.')
        return
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        click.echo('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
        return
    
    supabase_uid = None
    
    # Step 1: Create user in Supabase Auth using Admin API
    click.echo(f'Creating admin user in Supabase Auth...')
    try:
        # Use Supabase Admin API to create user
        response = requests.post(
            f'{SUPABASE_URL}/auth/v1/admin/users',
            headers={
                'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'email': admin_email,
                'password': admin_password,
                'email_confirm': True,  # Auto-confirm email for admin
                'user_metadata': {
                    'requested_role': 'admin',
                    'company_name': admin_company
                }
            }
        )
        
        if response.status_code == 200 or response.status_code == 201:
            supabase_user = response.json()
            supabase_uid = supabase_user.get('id')
            click.echo(f'  [OK] Created in Supabase Auth (UID: {supabase_uid})')
        elif response.status_code == 422 and 'already been registered' in response.text:
            click.echo(f'  [INFO] User already exists in Supabase Auth, fetching UID...')
            # Fetch existing user
            list_response = requests.get(
                f'{SUPABASE_URL}/auth/v1/admin/users',
                headers={
                    'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
                    'apikey': SUPABASE_SERVICE_ROLE_KEY
                },
                params={'filter': f'email eq "{admin_email}"'}
            )
            if list_response.ok:
                users = list_response.json().get('users', [])
                for u in users:
                    if u.get('email') == admin_email:
                        supabase_uid = u.get('id')
                        click.echo(f'  [OK] Found existing Supabase user (UID: {supabase_uid})')
                        break
        else:
            click.echo(f'  [ERROR] Failed to create in Supabase Auth: {response.status_code} - {response.text}')
    except Exception as e:
        click.echo(f'  [ERROR] Supabase Auth error: {e}')
    
    # Step 2: Create/update user in local database (users table)
    existing_user = User.query.filter_by(email=admin_email).first()
    if existing_user:
        if existing_user.role == 'admin':
            click.echo(f'  [INFO] Admin user "{admin_email}" already exists in database.')
        else:
            existing_user.role = 'admin'
            click.echo(f'  [OK] Upgraded existing user to admin role.')
        
        # Update supabase_uid if we got one
        if supabase_uid and existing_user.supabase_uid != supabase_uid:
            existing_user.supabase_uid = supabase_uid
            click.echo(f'  [OK] Updated supabase_uid.')
        
        db.session.commit()
    else:
        # Create new admin user in database
        hashed_password = generate_password_hash(admin_password)
        admin_user = User(  # type: ignore
            email=admin_email,  # type: ignore
            password_hash=hashed_password,  # type: ignore
            role='admin',  # type: ignore
            name='Admin',  # type: ignore
            company_name=admin_company,  # type: ignore
            supabase_uid=supabase_uid,  # type: ignore
            approval_status='approved'  # type: ignore
        )
        db.session.add(admin_user)
        db.session.commit()
        click.echo(f'  [OK] Created admin user in database (ID: {admin_user.id})')
    
    click.echo(f'\n=== Admin user "{admin_email}" is ready! ===')
    click.echo(f'    Login at: /admin-login')

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