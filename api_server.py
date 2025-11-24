"""
Mockup Generator 2.0 - API Server v5.1
- Updated for Google AI Studio Vibe Coding
- CORS enabled for VS Code Tunneling
- Fixed Image Serving Routes
"""

import os
import glob
import json
import re
import sys 
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from mockup_library import MockupGeneratorV2 
import io
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import MSO_ANCHOR
from pptx.dml.color import RGBColor
from PIL import Image as PILImage
import logging
from datetime import datetime

# ===== CONFIGURATION =====
try:
    with open('config.json', 'r') as f:
        config = json.load(f)
except FileNotFoundError:
    print("ERROR: config.json not found!")
    exit(1)

PATHS = config['paths']
DB_FILE = PATHS.get('fabric_database_file', 'fabric_database.xlsx')
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

# Define all paths from config
FABRIC_DIR = os.path.join(PROJECT_ROOT, PATHS.get('fabric_dir', 'fabrics'))
MOCKUP_DIR_TEMPLATES = os.path.join(PROJECT_ROOT, PATHS.get('mockup_dir', 'mockups')) 
SILHOUETTE_DIR = os.path.join(PROJECT_ROOT, PATHS.get('silhouette_dir', 'silhouettes'))  # Directory for silhouette images
MASK_DIR = os.path.join(PROJECT_ROOT, PATHS.get('mask_dir', 'masks'))
MOCKUP_DIR_OUTPUT = os.path.join(PROJECT_ROOT, PATHS.get('mockup_output_dir', 'generated_mockups')) 
TECHPACK_DIR = os.path.join(PROJECT_ROOT, PATHS.get('pdf_output_dir', 'generated_techpacks'))
EXCEL_DIR = os.path.join(PROJECT_ROOT, PATHS.get('excel_dir', 'excel_files'))
FABRIC_SWATCH_DIR = os.path.join(PROJECT_ROOT, PATHS.get('fabric_swatch_dir', 'fabric_swatches'))
IMAGE_DIR = os.path.join(PROJECT_ROOT, 'images') # New: Explicit Images folder

# Ensure critical directories exist
for d in [MOCKUP_DIR_OUTPUT, TECHPACK_DIR, IMAGE_DIR, SILHOUETTE_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

TITLE_SLIDE_1_PATH = os.path.join(PROJECT_ROOT, '1st page.png')
TITLE_SLIDE_2_PATH = os.path.join(PROJECT_ROOT, '2nd page.png')
DATABASE_PATH = os.path.join(EXCEL_DIR, DB_FILE)

app = Flask(__name__)

# !!! IMPORTANT CHANGE: Allow all origins for Tunneling (VS Code/Ngrok) !!!
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Request logging middleware
@app.before_request
def log_request_info():
    if request.path.startswith('/api'):
        logger.info(f"[API] {request.method} {request.path}")
        if request.args:
            logger.info(f"      Query params: {dict(request.args)}")
        if request.is_json:
            logger.info(f"      Body: {request.json}")

@app.after_request
def log_response_info(response):
    if request.path.startswith('/api'):
        logger.info(f"[API] {request.method} {request.path} -> {response.status_code}")
    return response

print("=" * 60)
print("SRX Fabric Library - API Server (v5.1)")
print("   Running on: http://localhost:5000")
print("   API Logging: ENABLED")
print("=" * 60)

# ===== HELPER FUNCTIONS =====

def clean_group_name(text):
    """
    Cleans the fabric group name based on requirements:
    1. Remove text in brackets (...)
    2. Scan only after the first dot '.'
    3. Trim whitespace
    """
    if not isinstance(text, str):
        return str(text)
    
    # 1. Remove text inside brackets (e.g., "(280 gsm)")
    text = re.sub(r'\(.*?\)', '', text)
    
    # 2. Split by dot and take the part after it, if a dot exists
    if '.' in text:
        parts = text.split('.', 1)
        if len(parts) > 1:
            text = parts[1]
            
    return text.strip()

def find_file(directory, base_filename, extensions=['.jpg', '.png', '.jpeg', '.webp']):
    for ext in extensions:
        for case_ext in [ext, ext.upper(), ext.lower()]:
            path = os.path.join(directory, f"{base_filename}{case_ext}")
            if os.path.exists(path):
                return f"{base_filename}{case_ext}"
    return None

def apply_mask_to_swatch(swatch_path, mask_path):
    try:
        swatch = PILImage.open(swatch_path).convert('RGBA')
        mask = PILImage.open(mask_path)
        mask_l = mask.convert('L')
        binary_mask = mask_l.point(lambda p: 255 if p > 200 else 0, '1')
        bbox = binary_mask.getbbox()
        if bbox is None: raise ValueError("Mask is empty")
        x1, y1, x2, y2 = bbox
        swatch_resized = swatch.resize((x2 - x1, y2 - y1), PILImage.Resampling.LANCZOS)
        output = PILImage.new('RGBA', mask.size, (0, 0, 0, 0))
        output.paste(swatch_resized, (x1, y1))
        output.putalpha(mask_l)
        return output
    except Exception as e:
        print(f"  [x] ERROR: Failed to apply mask: {e}", file=sys.stderr)
        return None

# ===== API ROUTES =====

@app.route('/api/fabric-groups')
def get_fabric_groups():
    try:
        df = pd.read_excel(DATABASE_PATH)
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        # Identify group column (handle variations)
        group_col = None
        if 'group' in df.columns: group_col = 'group'
        elif 'group name' in df.columns: group_col = 'group name'
        
        if not group_col:
            logger.warning("No group column found in database")
            return jsonify([])

        # Extract, Clean, Unique, Sort
        raw_groups = df[group_col].dropna().unique()
        cleaned_groups = sorted(list(set([clean_group_name(str(g)) for g in raw_groups if str(g).strip()])))
        
        logger.info(f"      Returning {len(cleaned_groups)} fabric groups")
        return jsonify(cleaned_groups)
        
    except Exception as e:
        logger.error(f"Error fetching groups: {e}")
        return jsonify([])


@app.route('/api/find-fabrics')
def find_fabrics():
    search_term = request.args.get('search', '').strip()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    # Filters
    filter_group = request.args.get('group', '').lower().strip()
    filter_weight = request.args.get('weight', '').lower().strip()

    logger.info(f"      Search: '{search_term}' | Group: '{filter_group}' | Weight: '{filter_weight}' | Page: {page} | Limit: {limit}")

    try:
        df = pd.read_excel(DATABASE_PATH)
    except Exception as e:
        logger.error(f"Database read error: {e}")
        return jsonify({"error": f"Database read error: {str(e)}"}), 500

    # Normalize columns
    df.columns = [str(c).lower().strip() for c in df.columns]
    
    # Map columns to expected keys
    col_map = {
        'fabric ref': 'ref',
        'ref': 'ref',
        'fabrication': 'fabrication',
        'group': 'group',
        'group name': 'group',
        'gsm': 'gsm',
        'width': 'width',
        'style': 'style',
        'moq': 'moq'
    }
    
    # Rename columns in dataframe
    df.rename(columns=col_map, inplace=True)
    
    # Create a 'cleaned_group' column for filtering
    if 'group' in df.columns:
        df['cleaned_group'] = df['group'].astype(str).apply(clean_group_name)
    else:
        df['cleaned_group'] = ''

    # Ensure text columns are strings
    df_str = df.astype(str)

    # 1. Apply Filters
    matches = df_str
    
    # Filter by Group
    if filter_group:
        matches = matches[matches['cleaned_group'].str.lower() == filter_group]
        
    # Filter by Weight
    if filter_weight and 'gsm' in matches.columns:
        matches['gsm_clean'] = pd.to_numeric(matches['gsm'].astype(str).str.replace(r'[^\d]', '', regex=True), errors='coerce')
        if filter_weight == 'light':
            matches = matches[matches['gsm_clean'] < 160]
        elif filter_weight == 'medium':
            matches = matches[matches['gsm_clean'].between(160, 240)]
        elif filter_weight == 'heavy':
            matches = matches[matches['gsm_clean'] > 240]

    # 2. Apply Search Term
    if search_term:
        search_lower = search_term.lower()
        matches = matches[
            matches['ref'].str.lower().str.contains(search_lower, na=False) |
            matches['fabrication'].str.lower().str.contains(search_lower, na=False) |
            matches['cleaned_group'].str.lower().str.contains(search_lower, na=False) |
            matches.get('style', pd.Series()).astype(str).str.lower().str.contains(search_lower, na=False)
        ]

    # Pagination
    total_matches = len(matches)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    # Slice dataframe for current page
    paginated_matches = matches.iloc[start_idx:end_idx]

    logger.info(f"      Found {total_matches} total matches, returning {len(paginated_matches)} results (page {page})")

    results = []
    for _, row in paginated_matches.iterrows():
        ref_code = row.get('ref', 'N/A')
        swatch_filename = find_file(FABRIC_SWATCH_DIR, ref_code)
        swatch_url = f"/static/swatches/{swatch_filename}" if swatch_filename else None
        
        results.append({
            "ref": ref_code,
            "fabrication": row.get('fabrication', 'N/A'),
            "group_name": row.get('cleaned_group', 'General'),
            "style": row.get('style', 'N/A'),
            "width": row.get('width', 'N/A'),
            "gsm": row.get('gsm', 'N/A'),
            "moq": row.get('moq', '500 kgs'),
            "swatchUrl": swatch_url,
        })

    return jsonify({
        "data": results,
        "total": total_matches,
        "page": page,
        "limit": limit,
        "has_more": end_idx < total_matches
    })


@app.route('/api/garments')
def get_available_garments():
    try:
        logger.info("      Fetching available garments from mask directory")
        garments_dict = {}
        mask_files = os.listdir(MASK_DIR)
        
        for f in mask_files:
            if f == 'swatch_mask_pptx.png': continue
            
            base_name = None
            if '_mask_' in f: base_name = f.split('_mask_')[0]
            elif '_mask' in f: base_name = f.split('_mask')[0]
            
            if not base_name: continue
            
            # CRITICAL FIX: Use the base_name EXACTLY as it appears in the mask filename
            # This preserves the exact casing needed for file matching
            garment_name_for_api = base_name  # Keep EXACT casing with underscores for file matching
            garment_name_display = base_name.replace('_', ' ').strip().title()  # For display only
            
            # Find silhouette image - prefer actual silhouette images, fallback to face images
            # First try silhouette directory with _silhouette suffix
            img_filename = find_file(SILHOUETTE_DIR, f"{base_name}_silhouette") or find_file(SILHOUETTE_DIR, base_name)
            if img_filename:
                img_url = f"/static/silhouettes/{img_filename}"
                is_silhouette = True
            else:
                # Fallback to mockup templates (full-color images)
                img_filename = find_file(MOCKUP_DIR_TEMPLATES, f"{base_name}_face") or find_file(MOCKUP_DIR_TEMPLATES, base_name)
                img_url = f"/static/mockup-templates/{img_filename}" if img_filename else None
                is_silhouette = False
            
            # Categorize
            category = "General"
            bn_lower = base_name.lower()
            if bn_lower.startswith('men'): category = "Men"
            elif bn_lower.startswith(('ladies', 'women')): category = "Ladies"
            elif bn_lower.startswith('infant'): category = "Infant"
            elif bn_lower.startswith('kid'): category = "Kids"
            
            if category not in garments_dict: garments_dict[category] = {}
            
            # Return both API name (exact base_name from mask file) and display name (for UI)
            garments_dict[category][garment_name_for_api] = {
                "name": garment_name_for_api,  # EXACT base_name with underscores for backend
                "displayName": garment_name_display,  # Formatted for display
                "imageUrl": img_url,
                "isSilhouette": is_silhouette  # Indicates if this is a true silhouette or needs filtering
            }
        
        categorized = {cat: sorted(vals.values(), key=lambda x: x['name']) for cat, vals in garments_dict.items()}
        total_garments = sum(len(v) for v in categorized.values())
        logger.info(f"      Returning {total_garments} garments across {len(categorized)} categories")
        return jsonify(categorized)
        
    except Exception as e:
        logger.error(f"Error fetching garments: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-mockup', methods=['POST'])
def generate_on_demand():
    try:
        data = request.json
        fabric_ref = data.get('fabric_ref')
        mockup_name = data.get('mockup_name') 
        
        logger.info(f"      Generating mockup for fabric: {fabric_ref}, garment: {mockup_name}")
        
        if not fabric_ref or not mockup_name: 
            logger.warning("      Missing fabric_ref or mockup_name")
            return jsonify({"success": False, "error": "Missing data"}), 400
        
        generator = MockupGeneratorV2(
            fabric_dir=FABRIC_SWATCH_DIR, 
            mockup_dir=MOCKUP_DIR_TEMPLATES,
            mask_dir=MASK_DIR,
            output_dir=MOCKUP_DIR_OUTPUT
        )
        result_paths = generator.generate_mockup(fabric_ref, mockup_name)
        
        if result_paths:
            mockups = {}
            views = []
            for path in result_paths:
                filename = os.path.basename(path)
                url = f"/static/mockups/{filename}"
                if '_face' in filename: mockups['face'] = url; views.append('face')
                elif '_back' in filename: mockups['back'] = url; views.append('back')
                else: mockups['single'] = url; views.append('single')
            logger.info(f"      Mockup generated successfully: {views}")
            return jsonify({ "success": True, "views": views, "mockups": mockups })
        else:
            logger.error("      Mockup generation failed - no result paths")
            return jsonify({"success": False, "error": "Mockup generation failed."}), 500
    except Exception as e:
        logger.error(f"      Mockup generation error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/generate-pptx', methods=['POST'])
def generate_pptx():
    try:
        selected_fabrics = request.json
        if not selected_fabrics: return jsonify({"error": "No fabrics selected"}), 400

        prs = Presentation()
        prs.slide_width = Inches(11.69)
        prs.slide_height = Inches(8.27)
        BLANK_LAYOUT = prs.slide_layouts[6]
        
        for title_img in [TITLE_SLIDE_1_PATH, TITLE_SLIDE_2_PATH]:
            if os.path.exists(title_img):
                slide = prs.slides.add_slide(BLANK_LAYOUT)
                slide.shapes.add_picture(title_img, Inches(0), Inches(0), width=prs.slide_width, height=prs.slide_height)

        mask_path = os.path.join(MASK_DIR, 'swatch_mask_pptx.png')
        
        # Layout Config (2x2 Grid)
        ITEMS_PER_SLIDE = 4
        IMG_W, IMG_H = Inches(3.5), Inches(3.5)
        TXT_W, TXT_H = Inches(2.2), Inches(3.5)
        MARGIN_LEFT = (prs.slide_width - ((IMG_W * 2) + (TXT_W * 2) + Inches(0.4))) / 2
        MARGIN_TOP = (prs.slide_height - ((IMG_H * 2) + Inches(0.2))) / 2
        
        # Calculate Positions
        positions = []
        for r in range(2):
            for c in range(2):
                img_x = MARGIN_LEFT + (c * (IMG_W + TXT_W + Inches(0.2)))
                txt_x = img_x + IMG_W + Inches(0.1)
                y = MARGIN_TOP + (r * (IMG_H + Inches(0.2)))
                positions.append({"img": (img_x, y, IMG_W, IMG_H), "text": (txt_x, y, TXT_W, TXT_H)})

        slide = prs.slides.add_slide(BLANK_LAYOUT)
        item_count = 0

        for fabric in selected_fabrics:
            if item_count == ITEMS_PER_SLIDE:
                slide = prs.slides.add_slide(BLANK_LAYOUT)
                item_count = 0
            
            swatch_url = fabric.get('swatchUrl')
            if not swatch_url: continue
            filename = os.path.basename(swatch_url)
            swatch_path = os.path.join(FABRIC_SWATCH_DIR, filename)
            if not os.path.exists(swatch_path): continue
            
            masked_swatch = apply_mask_to_swatch(swatch_path, mask_path)
            if not masked_swatch: continue
            
            img_stream = io.BytesIO()
            masked_swatch.save(img_stream, format="PNG")
            img_stream.seek(0)
            
            pos = positions[item_count]
            slide.shapes.add_picture(img_stream, pos["img"][0], pos["img"][1], width=pos["img"][2])
            
            # Text Box
            txBox = slide.shapes.add_textbox(pos["text"][0], pos["text"][1], pos["text"][2], pos["text"][3])
            tf = txBox.text_frame
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.word_wrap = True
            
            # 1. Ref Header
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = fabric.get('ref', 'N/A')
            run.font.bold = True
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(51, 51, 51)
            
            # 2. Fabrication
            p2 = tf.add_paragraph()
            p2.space_before = Pt(6)
            run2 = p2.add_run()
            run2.text = fabric.get('fabrication', 'N/A')
            run2.font.size = Pt(11)
            run2.font.color.rgb = RGBColor(89, 89, 89)
            
            # 3. Width
            width_val = fabric.get('width', 'N/A')
            p_width = tf.add_paragraph()
            p_width.space_before = Pt(4)
            run_width = p_width.add_run()
            run_width.text = f"Width: {width_val}\""
            run_width.font.size = Pt(11)
            run_width.font.color.rgb = RGBColor(89, 89, 89)
            
            # 4. Buyer Notes
            buyer_note = fabric.get('buyerNote', '').strip()
            if buyer_note:
                p3 = tf.add_paragraph()
                p3.space_before = Pt(12)
                run3 = p3.add_run()
                run3.text = "Buyer Notes:"
                run3.font.bold = True
                run3.font.size = Pt(10)
                run3.font.color.rgb = RGBColor(235, 87, 87) 
                
                p4 = tf.add_paragraph()
                run4 = p4.add_run()
                run4.text = buyer_note
                run4.font.size = Pt(10)
                run4.font.italic = True

            item_count += 1

        stream = io.BytesIO()
        prs.save(stream)
        stream.seek(0)
        
        return send_file(
            stream,
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            as_attachment=True,
            download_name='SRX_Buyer_Techpack.pptx'
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ===== STATIC SERVING ROUTES =====

@app.route('/static/mockups/<filename>')
def serve_mockup(filename): return send_from_directory(MOCKUP_DIR_OUTPUT, filename)

@app.route('/static/mockup-templates/<filename>')
def serve_mockup_template(filename): return send_from_directory(MOCKUP_DIR_TEMPLATES, filename)

@app.route('/static/silhouettes/<filename>')
def serve_silhouette(filename): return send_from_directory(SILHOUETTE_DIR, filename)

@app.route('/static/swatches/<filename>')
def serve_swatch(filename): return send_from_directory(FABRIC_SWATCH_DIR, filename)

# !!! FIXED: Route to serve general images !!!
@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(IMAGE_DIR, filename)

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

if __name__ == '__main__':
    # Bind to 0.0.0.0 to allow connections from outside the container/process
    app.run(host='0.0.0.0', port=5000, debug=True)