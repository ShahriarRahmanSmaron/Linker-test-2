"""
Mockup Generator 2.0 - API Server v5.2
"""

import os
import glob
import json
import logging
import re
import io
import sys
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
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
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(PROJECT_ROOT, 'instance', 'fabric_sourcing.db')}"
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
    page = int(request.args.get('page', 1))
    
    # Security: Enforce max limit to prevent DoS
    MAX_LIMIT = 100
    limit = int(request.args.get('limit', 20))
    limit = min(limit, MAX_LIMIT)
    
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
    try:
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
            
    except Exception as e:
        logger.error(f"Error generating mockup: {e}")
        return jsonify({"success": False, "error": "An unexpected error occurred."}), 500

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
def serve_images(filename): return send_from_directory(IMAGE_DIR, filename)

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
    role = data.get('role', 'buyer')
    company_name = data.get('company_name', '')
    if not email or not password: return jsonify({"msg": "Email and password required"}), 400
    if User.query.filter_by(email=email).first(): return jsonify({"msg": "Email already exists"}), 400
    hashed_password = generate_password_hash(password)
    new_user = User(email=email, password_hash=hashed_password, role=role, company_name=company_name)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully", "user_id": new_user.id}), 201

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"msg": "Bad email or password"}), 401
    additional_claims = {"role": user.role, "company": user.company_name}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    return jsonify({
        "token": access_token,
        "user_profile": {"id": user.id, "email": user.email, "role": user.role, "name": user.company_name}
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user: return jsonify({"msg": "User not found"}), 404
    return jsonify({"id": user.id, "email": user.email, "role": user.role, "name": user.company_name}), 200

if __name__ == '__main__':
    if not os.path.exists(os.path.join(PROJECT_ROOT, 'instance')):
        os.makedirs(os.path.join(PROJECT_ROOT, 'instance'))
    with app.app_context():
        db.create_all()
    app.run(host=settings.FLASK_HOST, port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)