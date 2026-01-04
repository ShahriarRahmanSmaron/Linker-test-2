"""
Techpack Generation API Route
This module provides the /api/generate-techpack endpoint.
Register this blueprint in api_server.py to enable the feature.
"""

import os
import sys
import io
from flask import Blueprint, request, jsonify, send_file
from flask_cors import CORS
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.colors import black
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
import fitz  # PyMuPDF for PDF flattening

from config import settings

techpack_bp = Blueprint('techpack', __name__)
# Apply CORS to this blueprint
CORS(techpack_bp, resources={r"/api/*": {"origins": settings.CORS_ALLOWED_ORIGINS.split(',')}}, supports_credentials=True)

# Output directory for generated techpacks
PDF_OUTPUT_DIR = str(settings.pdf_output_dir_path)
MOCKUP_OUTPUT_DIR = str(settings.mockup_output_dir_path)



def create_techpack_pdf_with_data(mockup_paths, fabric_ref, garment_name, form_data):
    """
    Creates a techpack PDF with mockup images and form data overlay.
    
    Args:
        mockup_paths: dict with keys 'face', 'back', 'single' containing image paths
        fabric_ref: Fabric reference code
        garment_name: Name of the garment
        form_data: dict with style, buyer, size, gender, sampleStatus, season, styleName, designSource
    
    Returns:
        Path to generated PDF, or None on failure
    """
    os.makedirs(PDF_OUTPUT_DIR, exist_ok=True)
    
    # Use the user's template PDF (with form fields)
    template_path = os.path.join(settings.project_root_path, "Techpack template.pdf")
    if not os.path.exists(template_path):
        print(f"Error: Template not found at {template_path}", file=sys.stderr)
        return None
    
    pdf_filename = f"Techpack_{fabric_ref}_{garment_name}.pdf"
    pdf_path = os.path.join(PDF_OUTPUT_DIR, pdf_filename)
    
    try:
        # ============================================================
        # STEP 1: Fill PDF Form Fields
        # ============================================================
        template_reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Clone the template
        writer.append(template_reader)
        
        # Map our form_data keys to the PDF field names (as created in Acrobat)
        # Field names in PDF match our camelCase keys exactly:
        # style, buyer, sampleStatus, season, gender, size, styleName, designSource
        field_mapping = {
            'style': 'style',
            'buyer': 'buyer', 
            'sampleStatus': 'sampleStatus',
            'season': 'season',
            'gender': 'gender',
            'size': 'size',
            'styleName': 'styleName',
            'designSource': 'designSource',
        }
        
        # Fill the form fields with specific appearance (Nunito Bold font)
        for form_key, pdf_field_name in field_mapping.items():
            value = form_data.get(form_key, '')
            if value:
                try:
                    writer.update_page_form_field_values(
                        writer.pages[0],
                        {pdf_field_name: str(value)},
                        auto_regenerate=False  # Don't auto-regenerate to avoid blue background
                    )
                except Exception as field_err:
                    print(f"Warning: Could not fill field '{pdf_field_name}': {field_err}")
        
        # ============================================================
        # STEP 2: Add Mockup Images as Overlay
        # ============================================================
        page = writer.pages[0]
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)
        
        # Determine mockup images to include
        face_path = mockup_paths.get('face')
        back_path = mockup_paths.get('back')
        single_path = mockup_paths.get('single')
        
        # Create overlay canvas for mockup images
        packet = io.BytesIO()
        c = pdf_canvas.Canvas(packet, pagesize=(page_width, page_height))
        
        # Mockup area - INSIDE the FLAT SKETCH box (moved UP)
        # Based on template: the box is roughly from Y=200 to Y=600
        mockup_area_x = 35       # Left edge (start of the left box area)
        mockup_area_y = 200      # MOVED UP into the box area
        mockup_width = 400       # Width spanning the left-center area
        mockup_height = 380      # Height to fit within the box
        
        if face_path and os.path.exists(face_path) and back_path and os.path.exists(back_path):
            # Both face and back available - draw side by side
            half_width = mockup_width / 2 - 10
            
            face_img = ImageReader(face_path)
            c.drawImage(face_img, mockup_area_x, mockup_area_y, 
                       width=half_width, height=mockup_height,
                       preserveAspectRatio=True, mask='auto')
            
            back_img = ImageReader(back_path)
            c.drawImage(back_img, mockup_area_x + half_width + 20, mockup_area_y,
                       width=half_width, height=mockup_height,
                       preserveAspectRatio=True, mask='auto')
        elif face_path and os.path.exists(face_path):
            face_img = ImageReader(face_path)
            c.drawImage(face_img, mockup_area_x, mockup_area_y,
                       width=mockup_width, height=mockup_height,
                       preserveAspectRatio=True, mask='auto')
        elif back_path and os.path.exists(back_path):
            back_img = ImageReader(back_path)
            c.drawImage(back_img, mockup_area_x, mockup_area_y,
                       width=mockup_width, height=mockup_height,
                       preserveAspectRatio=True, mask='auto')
        elif single_path and os.path.exists(single_path):
            single_img = ImageReader(single_path)
            c.drawImage(single_img, mockup_area_x, mockup_area_y,
                       width=mockup_width, height=mockup_height,
                       preserveAspectRatio=True, mask='auto')
        
        c.save()
        
        # Merge mockup overlay with the filled form
        packet.seek(0)
        overlay_reader = PdfReader(packet)
        if len(overlay_reader.pages) > 0:
            page.merge_page(overlay_reader.pages[0])
        
        # ============================================================
        # STEP 3: Save the filled PDF (intermediate)
        # ============================================================
        temp_pdf_path = pdf_path.replace('.pdf', '_temp.pdf')
        with open(temp_pdf_path, 'wb') as output_file:
            writer.write(output_file)
        
        # ============================================================
        # STEP 4: Flatten form fields using PyMuPDF (fitz)
        # This converts form widgets to static page content for Illustrator
        # ============================================================
        doc = fitz.open(temp_pdf_path)
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Get all widget annotations and flatten them
            for widget in page.widgets():
                widget.update()  # Ensure appearance is current
            # Remove all form widgets by flattening
            page.wrap_contents()
        
        # Save the flattened PDF
        doc.save(pdf_path, garbage=4, deflate=True)
        doc.close()
        
        # Clean up temp file
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        
        print(f"Successfully generated flattened techpack: {pdf_path}")
        return pdf_path
        
    except Exception as e:
        print(f"Error generating techpack PDF: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return None


@techpack_bp.route('/api/generate-techpack', methods=['POST'])
def generate_techpack():
    """Generate a techpack PDF with mockup images and form data."""
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Request body is required"}), 400
    
    fabric_ref = data.get('fabric_ref')
    garment_name = data.get('garment_name')
    mockup_urls = data.get('mockup_urls', {})
    form_data = data.get('form_data', {})
    
    if not fabric_ref or not garment_name:
        return jsonify({"success": False, "error": "Missing fabric_ref or garment_name"}), 400
    
    # Security: Validate inputs
    fabric_ref = os.path.basename(str(fabric_ref))
    garment_name = os.path.basename(str(garment_name))
    
    try:
        # Get mockup image paths from URLs
        mockup_paths = {}
        for view, url in mockup_urls.items():
            if url and isinstance(url, str):
                # Extract filename from URL like /static/mockups/filename.png
                if url.startswith('/static/mockups/'):
                    filename = url.replace('/static/mockups/', '')
                    mockup_paths[view] = os.path.join(MOCKUP_OUTPUT_DIR, filename)
        
        # Generate the techpack PDF
        pdf_path = create_techpack_pdf_with_data(
            mockup_paths=mockup_paths,
            fabric_ref=fabric_ref,
            garment_name=garment_name,
            form_data=form_data
        )
        
        if pdf_path and os.path.exists(pdf_path):
            return send_file(
                pdf_path,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f"Techpack_{fabric_ref}_{garment_name}.pdf"
            )
        else:
            return jsonify({"success": False, "error": "Failed to generate techpack"}), 500
            
    except Exception as e:
        print(f"Error generating techpack: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"An error occurred: {str(e)}"}), 500
