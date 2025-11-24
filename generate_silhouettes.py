"""
Script to generate white silhouette images from mockup templates.
Converts full-color mockup images to white silhouettes on transparent backgrounds.
"""

import os
from PIL import Image
import glob

# Configuration
MOCKUP_DIR = 'mockups'
SILHOUETTE_DIR = 'silhouettes'

# Create silhouettes directory if it doesn't exist
if not os.path.exists(SILHOUETTE_DIR):
    os.makedirs(SILHOUETTE_DIR)
    print(f"Created directory: {SILHOUETTE_DIR}")

def create_silhouette(input_path, output_path):
    """
    Convert a full-color mockup image to a white silhouette.
    """
    try:
        # Open the image
        img = Image.open(input_path).convert('RGBA')
        
        # Get image dimensions
        width, height = img.size
        
        # Create a new image with transparent background
        silhouette = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        
        # Process each pixel
        pixels = img.load()
        silhouette_pixels = silhouette.load()
        
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                
                # Skip fully transparent pixels
                if a == 0:
                    continue
                
                # Calculate brightness
                brightness = (r + g + b) / 3
                
                # If pixel is not too dark (likely part of garment, not background)
                # Make it white, otherwise keep transparent
                if brightness > 50:  # Threshold to separate garment from background
                    silhouette_pixels[x, y] = (255, 255, 255, 255)  # White
                else:
                    silhouette_pixels[x, y] = (0, 0, 0, 0)  # Transparent
        
        # Save the silhouette
        silhouette.save(output_path, 'PNG')
        print(f"Created silhouette: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

def main():
    """
    Generate silhouettes for all _face images in the mockups directory.
    """
    # Find all _face images
    face_images = glob.glob(os.path.join(MOCKUP_DIR, '*_face.*'))
    face_images.extend(glob.glob(os.path.join(MOCKUP_DIR, '*_face.*'.upper())))
    
    print(f"Found {len(face_images)} face images to process")
    
    created = 0
    for face_path in face_images:
        # Get base name (e.g., "Men hoodie" from "Men hoodie_face.jpg")
        filename = os.path.basename(face_path)
        base_name = filename.rsplit('_face', 1)[0]
        
        # Create output filename
        output_filename = f"{base_name}_silhouette.png"
        output_path = os.path.join(SILHOUETTE_DIR, output_filename)
        
        # Skip if already exists
        if os.path.exists(output_path):
            print(f"Skipping (already exists): {output_path}")
            continue
        
        # Generate silhouette
        if create_silhouette(face_path, output_path):
            created += 1
    
    print(f"\nCompleted! Created {created} silhouette images in {SILHOUETTE_DIR}/")
    print("Note: You may need to manually adjust the threshold or use image editing software")
    print("for better results, especially if backgrounds are complex.")

if __name__ == '__main__':
    main()

