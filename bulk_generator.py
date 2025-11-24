"""
Bulk Mockup Generator 2.0 - DUAL VIEW SUPPORT
Automatically detects and generates face/back mockups for garments
Supports both single-view and dual-view mask naming conventions:
  - Single: "Men_Polo_mask.png"
  - Dual: "Men_Polo_mask_face.png" and "Men_Polo_mask_back.png"
"""

import os
import sys
import json
from mockup_library import MockupGeneratorV2

def run_bulk_generator():
    """
    Main function to run the bulk mockup generator with dual-view support.
    Scans the 'mask_dir' for all available garment masks and generates mockups
    for each one using a single fabric ref.
    """
    
    # --- 1. Load Configuration ---
    try:
        with open('config.json', 'r') as f:
            config = json.load(f)
        PATHS = config['paths']
        MASK_DIR = PATHS.get('mask_dir', 'masks')
        
        if not os.path.isdir(MASK_DIR):
            print(f"FATAL ERROR: Mask directory not found at path: {MASK_DIR}", file=sys.stderr)
            print("Please check your 'config.json' file.", file=sys.stderr)
            sys.exit(1)
            
    except FileNotFoundError:
        print("FATAL ERROR: config.json not found.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError:
        print("FATAL ERROR: config.json is not valid JSON.", file=sys.stderr)
        sys.exit(1)
    
    print("="*60)
    print("🎨 SRX Bulk Mockup Generator 2.0 (DUAL VIEW)")
    print("="*60)
    print(f"📂 Scanning for masks in: {MASK_DIR}\n")
    
    # --- 2. Detect Garments with Dual-View Support ---
    garments = detect_garments(MASK_DIR)
    
    if not garments:
        print(f"❌ Error: No mask files found in {MASK_DIR}.", file=sys.stderr)
        print("   Expected naming:")
        print("   - Single view: 'GarmentName_mask.png'")
        print("   - Dual view: 'GarmentName_mask_face.png' and 'GarmentName_mask_back.png'")
        sys.exit(0)
    
    print(f"✅ Found {len(garments)} garment(s) to process:\n")
    for garment_name, views in sorted(garments.items()):
        view_str = ', '.join(views)
        print(f"   📋 {garment_name} ({view_str})")
    
    # --- 3. Get User Input ---
    try:
        fabric_ref = input("\n🧵 Enter Fabric Ref Code (e.g., RND MCB-41G): ").strip()
        scale_input = input("📏 Enter fabric scale (0.5-2.0, default 1.0): ").strip()
        
        if not scale_input:
            scaling_factor = 1.0
        else:
            scaling_factor = float(scale_input)
            if scaling_factor <= 0:
                print("⚠️  Warning: Scale must be > 0. Defaulting to 1.0.")
                scaling_factor = 1.0
        
        if not fabric_ref:
            print("❌ Error: Fabric Ref Code is required.", file=sys.stderr)
            return
            
    except ValueError:
        print("⚠️  Error: Invalid scale. Defaulting to 1.0.")
        scaling_factor = 1.0
    except KeyboardInterrupt:
        print("\n\n⛔ Operation cancelled by user.")
        sys.exit(0)
    
    # --- 4. Initialize Generator and Run Loop ---
    try:
        FABRIC_DIR = PATHS.get('fabric_dir', 'fabrics')
        MOCKUP_DIR = PATHS.get('mockup_dir', 'mockups')
        OUTPUT_DIR = PATHS.get('mockup_output_dir', 'generated_mockups')
        
        generator = MockupGeneratorV2(
            fabric_dir=FABRIC_DIR,
            mockup_dir=MOCKUP_DIR,
            mask_dir=MASK_DIR,
            output_dir=OUTPUT_DIR
        )
        
    except Exception as e:
        print(f"❌ Error: Failed to initialize MockupGenerator: {e}", file=sys.stderr)
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print(f"🚀 Starting bulk generation for '{fabric_ref}'")
    print(f"{'='*60}\n")
    
    success_count = 0
    fail_count = 0
    total_mockups = 0
    
    for garment_name, views in garments.items():
        print(f"{'─'*60}")
        print(f"🔨 Processing: {garment_name}")
        print(f"   Views: {', '.join(views)}")
        
        try:
            # Use the generate_mockup method which handles dual-view automatically
            result = generator.generate_mockup(
                fabric_ref=fabric_ref,
                mockup_name=garment_name,
                scaling_factor=scaling_factor
            )
            
            if result['success']:
                print(f"   ✅ Success! Generated {len(result['views'])} view(s):")
                for view, filepath in result['mockups'].items():
                    filename = os.path.basename(filepath)
                    print(f"      • {view}: {filename}")
                    total_mockups += 1
                success_count += 1
            else:
                print(f"   ❌ Generation FAILED: {result.get('error', 'Unknown error')}")
                fail_count += 1
                
        except Exception as e:
            print(f"   ❌ CRITICAL ERROR: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            fail_count += 1
    
    # --- 5. Summary ---
    print(f"\n{'='*60}")
    print("📊 BULK GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"✅ Successfully processed: {success_count} garment(s)")
    print(f"📁 Total mockups generated: {total_mockups}")
    print(f"❌ Failed: {fail_count}")
    print(f"{'='*60}\n")


def detect_garments(mask_dir):
    """
    Detect all garments in the mask directory with dual-view support.
    
    Returns a dictionary:
    {
        'Men_Polo': ['single'],
        'Women_Tshirt': ['face', 'back'],
        'Men_ShortPant': ['face', 'back']
    }
    """
    mask_files = os.listdir(mask_dir)
    garments = {}
    
    # Patterns to match
    single_suffixes = ['_mask.png', '_mask.jpg', '_mask.jpeg', '_mask.webp']
    dual_suffixes = [
        ('_mask_face.png', 'face'),
        ('_mask_face.jpg', 'face'),
        ('_mask_face.jpeg', 'face'),
        ('_mask_back.png', 'back'),
        ('_mask_back.jpg', 'back'),
        ('_mask_back.jpeg', 'back')
    ]
    
    for filename in mask_files:
        # Check for dual-view masks first
        detected = False
        for suffix, view in dual_suffixes:
            if filename.endswith(suffix):
                garment_name = filename[:-len(suffix)]
                if garment_name:
                    if garment_name not in garments:
                        garments[garment_name] = []
                    if view not in garments[garment_name]:
                        garments[garment_name].append(view)
                detected = True
                break
        
        # If not dual-view, check for single-view
        if not detected:
            for suffix in single_suffixes:
                if filename.endswith(suffix):
                    garment_name = filename[:-len(suffix)]
                    if garment_name:
                        garments[garment_name] = ['single']
                    break
    
    return garments


if __name__ == "__main__":
    run_bulk_generator()
