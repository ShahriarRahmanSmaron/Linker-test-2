"""
Analyze Techpack template.pdf to extract precise coordinates.
"""
from pypdf import PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

# Read the template
reader = PdfReader("Techpack template.pdf")
page = reader.pages[0]

# Get exact dimensions
page_width = float(page.mediabox.width)
page_height = float(page.mediabox.height)

print("=" * 60)
print("TECHPACK TEMPLATE PDF ANALYSIS")
print("=" * 60)
print(f"\nPage Dimensions:")
print(f"  Width:  {page_width:.2f} points ({page_width/72:.2f} inches)")
print(f"  Height: {page_height:.2f} points ({page_height/72:.2f} inches)")

# Try to extract text with positions
print("\n" + "=" * 60)
print("EXTRACTING TEXT POSITIONS")
print("=" * 60)

def visitor_body(text, cm, tm, fontDict, fontSize):
    if text.strip():
        # tm[4] is x position, tm[5] is y position
        x = tm[4]
        y = tm[5]
        print(f'  Text: "{text.strip()[:30]:<30}" at X={x:>7.2f}, Y={y:>7.2f}')

page.extract_text(visitor_text=visitor_body)

# Calculate recommended coordinates based on typical table layout
print("\n" + "=" * 60)
print("RECOMMENDED COORDINATES")
print("=" * 60)

# Based on the template structure from screenshots:
# - Header row: "Specification Sheet" | "FLAT SKETCH" | (rightmost column)
# - The data rows have labels on left and need values after them
# - Right column (Gender, Size, etc. values) is in the far right column

# Typical table measurements for this layout:
# Column 1 (Specification Sheet): ~125 to ~435 points
# Column 2 (FLAT SKETCH): ~435 to ~595 points  
# Column 3 (rightmost): ~595 to ~page_width

# Row positions (Y from bottom, PDF coordinate system)
# Each row is approximately 32-35 points high
row_height = 32.5

# First row (Style/Gender) starts approximately 35 points from top
# Y position in PDF = page_height - distance_from_top
header_y = page_height - 35
row_1_y = header_y - row_height      # Style / Gender
row_2_y = row_1_y - row_height       # Buyer / Size  
row_3_y = row_2_y - row_height       # Sample Status / Style name
row_4_y = row_3_y - row_height       # Season / Design Source

# X positions for text values:
# Left column values: after the labels like "Style:", "Buyer:" - around X=205
# Right column values (3rd column): around X=612

left_value_x = 205   # After labels like "Style:", "Buyer:"
right_value_x = 612  # In the rightmost column

print(f"\nText Field Coordinates (for Nunito 17pt):")
print(f"  Style value:         X={left_value_x}, Y={row_1_y:.1f}")
print(f"  Gender value:        X={right_value_x}, Y={row_1_y:.1f}")
print(f"  Buyer value:         X={left_value_x}, Y={row_2_y:.1f}")
print(f"  Size value:          X={right_value_x}, Y={row_2_y:.1f}")
print(f"  Sample Status value: X={left_value_x}, Y={row_3_y:.1f}")
print(f"  Style Name value:    X={right_value_x}, Y={row_3_y:.1f}")
print(f"  Season value:        X={left_value_x}, Y={row_4_y:.1f}")
print(f"  Design Source value: X={right_value_x}, Y={row_4_y:.1f}")

# FLAT SKETCH box (mockup area)
# This is the large area in column 2, below the header row
sketch_box_left = 130
sketch_box_right = 590
sketch_box_top = row_4_y - row_height  # Just below the last data row
sketch_box_bottom = 25

print(f"\nFLAT SKETCH Box (Mockup Area):")
print(f"  Left edge:   X = {sketch_box_left}")
print(f"  Right edge:  X = {sketch_box_right}")
print(f"  Top edge:    Y = {sketch_box_top:.1f}")
print(f"  Bottom edge: Y = {sketch_box_bottom}")
print(f"  Box width:   {sketch_box_right - sketch_box_left} points")
print(f"  Box height:  {sketch_box_top - sketch_box_bottom:.1f} points")

# Output Python code for techpack_routes.py
print("\n" + "=" * 60)
print("PYTHON CODE FOR techpack_routes.py")
print("=" * 60)
print(f'''
# Calculated coordinates for page size: {page_width:.2f} x {page_height:.2f} points
# Font: Nunito 17pt

# Row Y positions (from bottom of page)
row_1_y = {row_1_y:.1f}  # Style / Gender row
row_2_y = {row_2_y:.1f}  # Buyer / Size row
row_3_y = {row_3_y:.1f}  # Sample Status / Style name row
row_4_y = {row_4_y:.1f}  # Season / Design Source row

# Text X positions
left_value_x = {left_value_x}   # Values in Specification Sheet column
right_value_x = {right_value_x}  # Values in right-most column

field_positions = {{
    'style': ({left_value_x}, {row_1_y:.1f}),
    'gender': ({right_value_x}, {row_1_y:.1f}),
    'buyer': ({left_value_x}, {row_2_y:.1f}),
    'size': ({right_value_x}, {row_2_y:.1f}),
    'sampleStatus': ({left_value_x}, {row_3_y:.1f}),
    'styleName': ({right_value_x}, {row_3_y:.1f}),
    'season': ({left_value_x}, {row_4_y:.1f}),
    'designSource': ({right_value_x}, {row_4_y:.1f}),
}}

# Mockup area (FLAT SKETCH box)
mockup_x = {sketch_box_left}
mockup_y = {sketch_box_bottom}
mockup_width = {sketch_box_right - sketch_box_left}
mockup_height = {sketch_box_top - sketch_box_bottom:.1f}
''')
