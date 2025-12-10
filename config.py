"""
Configuration Management using Environment Variables
Uses pydantic-settings to validate all required environment variables on startup.
"""

import os
from pathlib import Path
from typing import List, Tuple
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    All required variables must be set or the application will fail to start.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Allow extra env vars
    )
    
    # ===== API Keys =====
    # Optional: Currently not used in the codebase, but kept for future use
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key for AI features (optional)")
    
    # ===== Directory Paths =====
    # Base project root (defaults to current directory)
    PROJECT_ROOT: str = Field(default_factory=lambda: str(Path(__file__).parent.absolute()))
    
    # Directory paths (relative to PROJECT_ROOT or absolute)
    FABRIC_DIR: str = Field(default="fabric_swatches", description="Directory containing fabric swatch images")
    MOCKUP_DIR: str = Field(default="mockups", description="Directory containing mockup templates")
    MASK_DIR: str = Field(default="masks", description="Directory containing mask files")
    SILHOUETTE_DIR: str = Field(default="silhouettes", description="Directory containing silhouette images")
    MOCKUP_OUTPUT_DIR: str = Field(default="generated_mockups", description="Directory for generated mockups")
    PDF_OUTPUT_DIR: str = Field(default="generated_techpacks", description="Directory for generated techpacks")
    EXCEL_DIR: str = Field(default="Excel_files", description="Directory containing Excel database files")
    IMAGE_DIR: str = Field(default="images", description="Directory for general images")
    TECHPACK_TEMPLATE_DIR: str = Field(default="techpack_templates", description="Directory containing techpack templates")
    
    # ===== Database Files =====
    FABRIC_DATABASE_FILE: str = Field(default="fabric_database.xlsx", description="Fabric database Excel file name")
    
    # ===== Static Files =====
    TITLE_SLIDE_1_PATH: str = Field(default="1st page.png", description="First title slide image")
    TITLE_SLIDE_2_PATH: str = Field(default="2nd page.png", description="Second title slide image")
    
    # ===== Image Settings =====
    DEFAULT_FABRIC_RESOLUTION_WIDTH: int = Field(default=2000, description="Default fabric image width in pixels")
    DEFAULT_FABRIC_RESOLUTION_HEIGHT: int = Field(default=2000, description="Default fabric image height in pixels")
    OUTPUT_FORMAT: str = Field(default="PNG", description="Default output image format")
    OUTPUT_QUALITY: int = Field(default=95, ge=1, le=100, description="Output image quality (1-100)")
    
    # ===== Techpack Coordinates (for PDF generation) =====
    TECHPACK_TOTAL_TEMPLATE_WIDTH_PX: int = Field(default=2480, description="Total techpack template width in pixels")
    TECHPACK_TOTAL_TEMPLATE_HEIGHT_PX: int = Field(default=3508, description="Total techpack template height in pixels")
    TECHPACK_SELECTION_X_PX: int = Field(default=0, description="Selection X coordinate in pixels")
    TECHPACK_SELECTION_Y_PX: int = Field(default=0, description="Selection Y coordinate in pixels")
    TECHPACK_SELECTION_WIDTH_PX: int = Field(default=2480, description="Selection width in pixels")
    TECHPACK_SELECTION_HEIGHT_PX: int = Field(default=3508, description="Selection height in pixels")
    
    # ===== Flask Server Settings =====
    FLASK_HOST: str = Field(default="0.0.0.0", description="Flask server host")
    FLASK_PORT: int = Field(default=5000, ge=1, le=65535, description="Flask server port")
    FLASK_DEBUG: bool = Field(default=True, description="Flask debug mode")

    # ===== Security Settings =====
    SECRET_KEY: str = Field(..., description="Secret key for Flask session and JWT")
    ADMIN_EMAIL: str = Field(default="admin@linker.app", description="Admin email address")
    ADMIN_PASSWORD: str = Field(..., description="Admin password")
    MASCO_PASSWORD: str = Field(default="masco123", description="Masco manufacturer user password")
    CORS_ALLOWED_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:3000,http://localhost:3001,https://www.linkersource.app,https://linkersource.app,http://136.111.175.251", description="Comma-separated list of allowed CORS origins")
    
    # ===== Supabase Authentication Settings =====
    SUPABASE_URL: str = Field(..., description="Supabase project URL (e.g., https://your-project.supabase.co)")
    SUPABASE_ANON_KEY: str = Field(..., description="Supabase anonymous key for client-side operations")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(..., description="Supabase service role key for backend operations")
    SUPABASE_JWT_SECRET: str = Field(..., description="Supabase JWT secret for token verification")
    
    @field_validator("OUTPUT_FORMAT")
    @classmethod
    def validate_output_format(cls, v: str) -> str:
        """Validate output format is supported."""
        allowed = ["PNG", "JPEG", "JPG", "WEBP"]
        if v.upper() not in allowed:
            raise ValueError(f"OUTPUT_FORMAT must be one of {allowed}")
        return v.upper()
    
    @property
    def project_root_path(self) -> Path:
        """Get PROJECT_ROOT as Path object."""
        return Path(self.PROJECT_ROOT)
    
    @property
    def fabric_dir_path(self) -> Path:
        """Get absolute path to fabric directory."""
        path = Path(self.FABRIC_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def mockup_dir_path(self) -> Path:
        """Get absolute path to mockup directory."""
        path = Path(self.MOCKUP_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def mask_dir_path(self) -> Path:
        """Get absolute path to mask directory."""
        path = Path(self.MASK_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def silhouette_dir_path(self) -> Path:
        """Get absolute path to silhouette directory."""
        path = Path(self.SILHOUETTE_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def mockup_output_dir_path(self) -> Path:
        """Get absolute path to mockup output directory."""
        path = Path(self.MOCKUP_OUTPUT_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def pdf_output_dir_path(self) -> Path:
        """Get absolute path to PDF output directory."""
        path = Path(self.PDF_OUTPUT_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def excel_dir_path(self) -> Path:
        """Get absolute path to Excel directory."""
        path = Path(self.EXCEL_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def image_dir_path(self) -> Path:
        """Get absolute path to image directory."""
        path = Path(self.IMAGE_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def techpack_template_dir_path(self) -> Path:
        """Get absolute path to techpack template directory."""
        path = Path(self.TECHPACK_TEMPLATE_DIR)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def database_path(self) -> Path:
        """Get absolute path to fabric database file."""
        return self.excel_dir_path / self.FABRIC_DATABASE_FILE
    
    @property
    def title_slide_1_path(self) -> Path:
        """Get absolute path to first title slide."""
        path = Path(self.TITLE_SLIDE_1_PATH)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def title_slide_2_path(self) -> Path:
        """Get absolute path to second title slide."""
        path = Path(self.TITLE_SLIDE_2_PATH)
        if path.is_absolute():
            return path
        return self.project_root_path / path
    
    @property
    def default_fabric_resolution(self) -> Tuple[int, int]:
        """Get default fabric resolution as tuple."""
        return (self.DEFAULT_FABRIC_RESOLUTION_WIDTH, self.DEFAULT_FABRIC_RESOLUTION_HEIGHT)
    
    @property
    def techpack_coords(self) -> dict:
        """Get techpack coordinates as dictionary (for backward compatibility)."""
        return {
            "total_template_width_px": self.TECHPACK_TOTAL_TEMPLATE_WIDTH_PX,
            "total_template_height_px": self.TECHPACK_TOTAL_TEMPLATE_HEIGHT_PX,
            "selection_x_px": self.TECHPACK_SELECTION_X_PX,
            "selection_y_px": self.TECHPACK_SELECTION_Y_PX,
            "selection_width_px": self.TECHPACK_SELECTION_WIDTH_PX,
            "selection_height_px": self.TECHPACK_SELECTION_HEIGHT_PX,
        }
    
    def ensure_directories(self) -> None:
        """Create all required directories if they don't exist."""
        directories = [
            self.mockup_output_dir_path,
            self.pdf_output_dir_path,
            self.image_dir_path,
            self.silhouette_dir_path,
            self.fabric_dir_path,
            self.mockup_dir_path,
            self.mask_dir_path,
            self.excel_dir_path,
            self.techpack_template_dir_path,
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            # Use ASCII-safe character for Windows compatibility
            print(f"[OK] Ensured directory exists: {directory}")


# Global settings instance
# This will raise ValidationError if required env vars are missing
try:
    settings = Settings()
    print("=" * 60)
    print("Configuration loaded successfully from environment variables")
    print("=" * 60)
    settings.ensure_directories()
except Exception as e:
    print("=" * 60)
    print("FATAL ERROR: Failed to load configuration")
    print(f"Error: {e}")
    print("=" * 60)
    print("\nPlease ensure all required environment variables are set.")
    print("See .env.example for a list of required variables.")
    print("=" * 60)
    raise

