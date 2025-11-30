"""
Mockup Generator 2.0 - FIXED VERSION
Stretch-to-fit fabric application with CORRECT mask orientation
WHITE areas in mask = fabric visible
BLACK areas in mask = transparent

V2.1 Update: Now auto-detects _face and _back variants.
"""

import os
from PIL import Image, ImageOps
import sys


class MockupGeneratorV2:
    """
    Version 2.1:
    - Applies entire fabric design to mask area using stretch-to-fit.
    - `generate_mockup` auto-detects garment variants (e.g., _face, _back)
      and generates all associated parts.
    """
    
    def __init__(self, fabric_dir, mockup_dir, mask_dir, output_dir):
        """
        Initialize the generator with directory paths.
        
        Args:
            fabric_dir: Directory containing fabric design files
            mockup_dir: Directory containing base mockup templates (white garment shapes)
            mask_dir: Directory containing mask files (WHITE = fabric area, BLACK = transparent)
            output_dir: Directory where generated mockups will be saved
        """
        self.fabric_dir = fabric_dir
        self.mockup_dir = mockup_dir
        self.mask_dir = mask_dir
        self.output_dir = output_dir
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
    def find_file(self, directory, ref_code, extensions=['.png', '.jpg', '.jpeg']):
        """
        Finds a file in a directory matching the ref_code (case-insensitive on Windows).
        
        Args:
            directory: Directory to search in
            ref_code: Reference code/name of the file
            extensions: List of acceptable file extensions
            
        Returns:
            Full path to the file, or None if not found
        """
        # Security: Prevent path traversal attacks
        # Use os.path.basename to strip any directory components
        ref_code = os.path.basename(str(ref_code))
        # Reject any remaining path traversal attempts
        if '..' in ref_code or '/' in ref_code or '\\' in ref_code:
            print(f"  [!] Security: Rejected potential path traversal in ref_code: '{ref_code}'")
            return None

        # First try exact match
        for ext in extensions:
            file_path = os.path.join(directory, f"{ref_code}{ext}")
            if os.path.exists(file_path):
                # print(f"DEBUG: Found exact match: {file_path}")
                return file_path
            
            # Handle case-insensitive extensions
            file_path_upper = os.path.join(directory, f"{ref_code}{ext.upper()}")
            if os.path.exists(file_path_upper):
                # print(f"DEBUG: Found exact match with upper extension: {file_path_upper}")
                return file_path_upper
        
        # If not found, try case-insensitive filename search
        try:
            ref_code_lower = ref_code.lower()
            files_in_dir = os.listdir(directory)
            # print(f"DEBUG: Files in dir: {files_in_dir[:5]}... (total {len(files_in_dir)})")
            
            for filename in files_in_dir:
                name_without_ext = os.path.splitext(filename)[0]
                if name_without_ext.lower() == ref_code_lower:
                    found_path = os.path.join(directory, filename)
                    print(f"  [i] Found via case-insensitive search: '{filename}' (matches '{ref_code}')")
                    return found_path
        except Exception as e:
            print(f"  Warning: Error during case-insensitive search: {e}")
        
        print(f"  [x] Not found: '{ref_code}' in '{directory}'")
        return None
    
    def extract_mask_bounds(self, mask_image):
        """
        Calculates the bounding box of WHITE areas in the mask.
        
        Args:
            mask_image: PIL Image object of the mask
            
        Returns:
            Tuple (x, y, width, height) of the bounding box
        """
        # Convert mask to grayscale if needed
        if mask_image.mode != 'L':
            mask_image = mask_image.convert('L')
        
        # Get bounding box of non-black pixels (white areas)
        # Threshold to ensure we only get bright areas
        binary_mask = mask_image.point(lambda p: 255 if p > 200 else 0, '1')
        bbox = binary_mask.getbbox()
        
        if bbox is None:
            raise ValueError("Mask is completely empty (all black or non-white)")
        
        x1, y1, x2, y2 = bbox
        width = x2 - x1
        height = y2 - y1
        
        return (x1, y1, width, height)
    
    def create_alpha_mask_from_white(self, mask_image):
        """
        Converts a white-background mask to an alpha mask.
        WHITE areas become OPAQUE (fabric visible)
        BLACK areas become TRANSPARENT (no fabric)
        
        Args:
            mask_image: PIL Image object (JPG/PNG with white=fabric, black=transparent)
            
        Returns:
            PIL Image in 'L' mode suitable for use as alpha channel
        """
        # Convert to grayscale
        mask_gray = mask_image.convert('L')
        
        # NO INVERSION - white stays white (255 = opaque), black stays black (0 = transparent)
        # This is the FIX - we removed the ImageOps.invert() call
        
        return mask_gray
    
    def apply_fabric_to_mockup(self, fabric_path, mockup_path, mask_path, output_path):
        """
        Main function: Applies fabric to mockup using stretch-to-fit method.
        
        Process:
        1. Load fabric, mockup base, and mask
        2. Extract mask boundaries (white areas)
        3. Stretch fabric to exactly fit mask dimensions
        4. Composite fabric onto mockup using mask alpha (white = visible)
        5. Save final result
        
        Args:
            fabric_path: Path to fabric design file
            mockup_path: Path to base mockup template
            mask_path: Path to mask file (WHITE = fabric area)
            output_path: Path where final mockup will be saved
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # 1. Load images
            print(f"  - Loading fabric: {os.path.basename(fabric_path)}")
            fabric_img = Image.open(fabric_path).convert('RGBA')
            
            print(f"  - Loading mockup base: {os.path.basename(mockup_path)}")
            mockup_img = Image.open(mockup_path).convert('RGBA')
            
            print(f"  - Loading mask: {os.path.basename(mask_path)}")
            mask_img = Image.open(mask_path).convert('RGB')
            
            # 2. Extract mask boundaries (white areas)
            print(f"  - Extracting mask boundaries (WHITE = fabric area)...")
            mask_x, mask_y, mask_width, mask_height = self.extract_mask_bounds(mask_img)
            print(f"  - Mask area: {mask_width}x{mask_height} at position ({mask_x}, {mask_y})")
            
            # 3. Stretch fabric to EXACTLY fit mask dimensions
            print(f"  - Stretching fabric from {fabric_img.size} to {mask_width}x{mask_height}...")
            fabric_stretched = fabric_img.resize(
                (mask_width, mask_height), 
                Image.Resampling.LANCZOS  # High-quality resampling
            )
            
            # 4. Create alpha mask from the mask (WHITE = opaque, BLACK = transparent)
            print(f"  - Creating alpha channel from mask (WHITE areas will show fabric)...")
            alpha_mask = self.create_alpha_mask_from_white(mask_img)
            
            # Resize alpha mask to match mockup dimensions if needed
            if alpha_mask.size != mockup_img.size:
                alpha_mask = alpha_mask.resize(mockup_img.size, Image.Resampling.LANCZOS)
            
            # 5. Create a blank canvas matching mockup size
            final_canvas = mockup_img.copy()
            
            # 6. Paste stretched fabric onto the canvas at mask position
            print(f"  - Compositing fabric onto mockup...")
            # Create a temporary image the size of the mockup to hold the fabric
            fabric_layer = Image.new('RGBA', mockup_img.size, (255, 255, 255, 0))
            fabric_layer.paste(fabric_stretched, (mask_x, mask_y))
            
            # Apply the alpha mask to the fabric layer
            fabric_layer.putalpha(alpha_mask)
            
            # Composite fabric layer over mockup base
            final_canvas = Image.alpha_composite(final_canvas, fabric_layer)
            
            # 7. Save the result
            print(f"  - Saving mockup to: {output_path}")
            final_canvas.save(output_path, 'PNG', quality=95)
            
            print(f"  [OK] Mockup generated successfully!")
            return True
            
        except FileNotFoundError as e:
            print(f"  [x] ERROR: File not found - {e}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"  [x] ERROR: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            return False
    
    def generate_mockup(self, fabric_ref, base_mockup_name):
        """
        High-level function to generate a mockup from reference codes.
        Auto-detects _face and _back variants.
        
        Args:
            fabric_ref: Fabric reference code (e.g., 'FAB-101')
            base_mockup_name: Base garment name (e.g., 'men polo' or 'Ladies Hoodie')
            
        Returns:
            A list of paths to generated mockups if successful, or None if all fail.
        """
        print(f"\n{'='*60}")
        print(f"Mockup Generator 2.1 - Stretch-to-Fit Mode")
        print(f"Fabric: {fabric_ref}")
        print(f"Base Garment: {base_mockup_name}")
        print(f"{'='*60}\n")
        
        # Find fabric file
        fabric_path = self.find_file(self.fabric_dir, fabric_ref)
        if not fabric_path:
            print(f"[x] ERROR: Fabric '{fabric_ref}' not found in {self.fabric_dir}")
            return None
        
        generated_files = []
        variants_found = False
        
        # --- 1. Check for variants (e.g., _face, _back) ---
        variants = ["face", "back"] # Add more here like "side" if needed
        for variant in variants:
            mockup_name_variant = f"{base_mockup_name}_{variant}"
            mask_ref_variant = f"{base_mockup_name}_mask_{variant}"
            
            mockup_path = self.find_file(self.mockup_dir, mockup_name_variant)
            mask_path = self.find_file(self.mask_dir, mask_ref_variant)
            
            if mockup_path and mask_path:
                variants_found = True
                print(f"--- Processing Variant: {variant} ---")
                output_filename = f"Mockup_{mockup_name_variant}_{fabric_ref}.png"
                output_path = os.path.join(self.output_dir, output_filename)
                
                success = self.apply_fabric_to_mockup(
                    fabric_path, 
                    mockup_path, 
                    mask_path, 
                    output_path
                )
                if success:
                    generated_files.append(output_path)
                print(f"--- Finished Variant: {variant} ---")
            elif mockup_path or mask_path:
                print(f"  [i] Skipping variant '{variant}': Missing matching mockup or mask file.")

        # --- 2. If no variants found, check for a single (base) file ---
        if not variants_found:
            print(f"--- Processing Single Garment: {base_mockup_name} ---")
            mask_ref = f"{base_mockup_name}_mask"
            mockup_path = self.find_file(self.mockup_dir, base_mockup_name)
            mask_path = self.find_file(self.mask_dir, mask_ref)
            
            if mockup_path and mask_path:
                output_filename = f"Mockup_{base_mockup_name}_{fabric_ref}.png"
                output_path = os.path.join(self.output_dir, output_filename)
                
                success = self.apply_fabric_to_mockup(
                    fabric_path, 
                    mockup_path, 
                    mask_path, 
                    output_path
                )
                if success:
                    generated_files.append(output_path)
            else:
                print(f"[x] ERROR: No files found for base garment '{base_mockup_name}'.")
                print(f"  Checked for mockup: {mockup_path}")
                print(f"  Checked for mask: {mask_path}")
                return None
        
        # --- 3. Return results ---
        if generated_files:
            return generated_files
        else:
            print(f"[x] FAILED: No mockups were successfully generated for '{base_mockup_name}'.")
            return None


# Convenience function for quick testing
def quick_generate(fabric_ref, mockup_name):
    """
    Quick generation function for testing.
    Uses default directory structure.
    """
    generator = MockupGeneratorV2(
        fabric_dir="fabrics",
        mockup_dir="mockups",
        mask_dir="masks",
        output_dir="generated_mockups"
    )
    
    return generator.generate_mockup(fabric_ref, mockup_name)


if __name__ == "__main__":
    # Test code
    print("Mockup Generator 2.1 Library - Auto-detects face/back")
    print("WHITE areas in mask = fabric visible")
    print("BLACK areas in mask = transparent")
    
    # Test 1: A garment with face and back
    print("\n--- TEST 1: 'men polo' (face/back) ---")
    quick_generate("FAB-101", "men polo")
    
    # Test 2: A single garment
    print("\n--- TEST 2: 'Ladies Hoodie' (single) ---")
    quick_generate("FAB-102", "Ladies Hoodie")