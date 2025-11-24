"""
Mockup Generator 2.0 - Command Line Interface
Allows manual mockup generation from terminal

V2.1 Update: Handles list output from generator
"""

import os
import sys
# Ensure new library is imported
from mockup_library import MockupGeneratorV2


def main():
    """Interactive command-line mockup generator"""
    
    print("\n" + "="*60)
    print("🎨 SRX MOCKUP GENERATOR 2.1")
    print("   Stretch-to-Fit Fabric Application")
    print("   (Auto-detects face/back)")
    print("="*60 + "\n")
    
    # Configuration
    FABRIC_DIR = "fabrics"
    MOCKUP_DIR = "mockups"
    MASK_DIR = "masks"
    OUTPUT_DIR = "generated_mockups"
    
    # Initialize generator
    generator = MockupGeneratorV2(
        fabric_dir=FABRIC_DIR,
        mockup_dir=MOCKUP_DIR,
        mask_dir=MASK_DIR,
        output_dir=OUTPUT_DIR
    )
    
    # Get user input
    print("📋 Enter the following details:\n")
    
    fabric_ref = input("  Fabric Reference Code (e.g., FAB-101): ").strip()
    if not fabric_ref:
        print("✗ Error: Fabric reference cannot be empty")
        return
    
    # Updated prompt
    mockup_name = input("  Garment Type (e.g., 'men polo' or 'Ladies Hoodie'): ").strip()
    if not mockup_name:
        print("✗ Error: Garment type cannot be empty")
        return
    
    # Custom output name is removed, as library now handles this
    
    # Generate mockup(s)
    # This now returns a list of paths
    result_paths = generator.generate_mockup(fabric_ref, mockup_name)
    
    if result_paths and len(result_paths) > 0:
        print(f"\n{'='*60}")
        print(f"✓ SUCCESS! Generated {len(result_paths)} mockup(s):")
        for path in result_paths:
            print(f"  ✓ Mockup saved to: {path}")
        print(f"{'='*60}\n")
    else:
        print(f"\n{'='*60}")
        print(f"✗ FAILED!")
        print(f"  No mockups were generated. Check error messages above.")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Operation cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)