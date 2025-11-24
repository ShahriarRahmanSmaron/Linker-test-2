# Project Context Documentation

## Project Overview
**B2B Fabric Sourcing Platform** - React frontend with Flask backend integration for fabric search, filtering, and mockup generation.

## Architecture

### Frontend
- **Framework**: React 19.2.0 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Port**: `localhost:3000`
- **Entry Point**: `src/index.tsx`

### Backend
- **Framework**: Python Flask
- **Port**: `localhost:5000`
- **Main File**: `api_server.py`

### Proxy Configuration
The frontend uses Vite proxy to forward API requests:
- `/api/*` → `http://localhost:5000`
- `/static/*` → `http://localhost:5000`
- `/images/*` → `http://localhost:5000`

## Key Components & Implementation

### 1. MockupModal Component (`src/components/MockupModal.tsx`)

#### Design
- **Glassmorphism Aesthetic**: Translucent frosted glass with sage green (#22C55E) light refractions on edges
- **Modal Structure**:
  - Top-left: Bold heading "Fabrication :" with subtitle "(Select garment, visualize and save)"
  - Left Sidebar: Category menu (Men, Women, Infant, Big Collection) with pill-shaped buttons
  - Right Grid: Square glass tiles displaying garment silhouettes
  - Background: Heavily blurred (40px) showing underlying website

#### Features Implemented

**Garment Selection View:**
- Fetches garments from `/api/garments` endpoint
- Categories displayed in left sidebar with selected state (Vibrant Blue #0E6FFF)
- Grid of square tiles (2-4 columns responsive) showing garment images
- Images loaded directly from `/static/mockup-templates/` (no filters applied)
- Images fit within square containers using `object-contain`
- Hover effects with green glow on tiles

**Mockup Preview View:**
- Displays generated mockup images from `/api/generate-mockup`
- Image container: White rounded container with glassmorphism effect
- View selector: Front/Back buttons at bottom of image container
- Download buttons: Separate "Download Front" and "Download Back" buttons below image
- Image sizing: Fits within `calc(95vh - 300px)` to fit on one screen
- No "Add to Moodboard" button in preview (removed per user request)

#### API Integration
- `GET /api/garments`: Fetches available garments with categories
- `POST /api/generate-mockup`: Generates mockup with `fabric_ref` and `mockup_name`
- Response includes `mockups.face` and `mockups.back` URLs

#### State Management
- `viewMode`: 'select' | 'preview'
- `selectedCategory`: Currently selected garment category
- `selectedGarment`: Selected garment for mockup generation
- `mockupData`: Generated mockup data with face/back views
- `currentView`: 'face' | 'back' | 'single' for viewing mockup angles

### 2. SearchPage Component (`src/components/SearchPage.tsx`)

#### Features
- **Pagination**: Implements "Load More" functionality
- **API Integration**: Calls `/api/find-fabrics` with:
  - `search`: Search term
  - `group`: Fabrication filter (maps from frontend `fabrication`)
  - `weight`: GSM range filter (maps from frontend `gsmRange`)
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20)
- **Response Handling**: 
  - `data`: Array of fabric objects
  - `total`: Total matching results
  - `has_more`: Boolean for pagination
- **Loading States**: Shows spinner while fetching
- **Empty States**: 
  - "Start Your Fabric Search" when no criteria
  - "No fabrics found" when search yields no results

#### Search Behavior
- **Debounced Search**: Prevents excessive API calls
- **No Initial Load**: Only fetches when search term or filters are applied
- **Pagination**: Appends new results on "Load More" click

### 3. SearchFilters Component (`src/components/SearchFilters.tsx`)

#### Features
- **Dynamic Fabrication Dropdown**: Fetches from `/api/fabric-groups` on mount
- **Filter Mapping**:
  - Frontend `fabrication` → Backend `group`
  - Frontend `gsmRange` → Backend `weight` ('light', 'medium', 'heavy')
- **Loading State**: Shows loading while fetching groups

### 4. Type Definitions (`src/types.ts`)

#### Fabric Interface
```typescript
export interface Fabric {
  ref: string; // Backend uses 'ref' as ID
  fabrication: string; // Frontend fabrication
  group_name: string; // Backend group_name
  gsm: string; // Backend returns as string
  composition: string;
  supplier: string;
  color: string;
  badges: string[];
  mockupCategories: string[];
  type?: string;
  price?: string;
  moq?: string;
  leadTime?: string;
  style?: string;
  width?: string;
  swatchUrl?: string; // Image URL from backend
}
```

## Backend Implementation

### API Endpoints

#### `GET /api/fabric-groups`
- Returns array of unique fabric group names
- Cleans group names (removes brackets, handles dots)
- Response: `["Pique", "Single Jersey", ...]`

#### `GET /api/find-fabrics`
- **Parameters**:
  - `search`: Search term (optional)
  - `group`: Fabrication filter (optional)
  - `weight`: 'light' | 'medium' | 'heavy' (optional)
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20)
- **Response**:
  ```json
  {
    "data": [...],
    "total": 341,
    "page": 1,
    "limit": 20,
    "has_more": true
  }
  ```
- **Pagination**: Slices DataFrame to return only requested page
- **No Initial Load**: Returns empty if no search/filter criteria

#### `GET /api/garments`
- Scans mask directory for available garments
- Returns categorized garments:
  ```json
  {
    "Men": [
      {
        "name": "men_polo",
        "displayName": "Men Polo",
        "imageUrl": "/static/mockup-templates/men_polo_face.jpg"
      }
    ],
    "Ladies": [...],
    "Infant": [...]
  }
  ```
- **Image URLs**: Points to `/static/mockup-templates/` directory
- **Case Handling**: Returns exact `name` for API calls, `displayName` for UI

#### `POST /api/generate-mockup`
- **Request Body**:
  ```json
  {
    "fabric_ref": "FAB-101",
    "mockup_name": "men polo"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "views": ["face", "back"],
    "mockups": {
      "face": "/static/mockups/...",
      "back": "/static/mockups/..."
    }
  }
  ```
- **Case Insensitive**: Uses case-insensitive file matching for garment names

### Static File Serving
- `/static/swatches/<filename>`: Fabric swatch images
- `/static/mockup-templates/<filename>`: Garment template images
- `/static/mockups/<filename>`: Generated mockup images
- `/static/silhouettes/<filename>`: Silhouette images (if available)

### Logging
- Request/response logging for all API endpoints
- Detailed logging for search, pagination, and mockup generation
- Console-friendly (no emojis to prevent Unicode errors on Windows)

## Recent Changes & Fixes

### 1. Frontend-Backend Integration
- **Date**: Initial integration
- **Changes**:
  - Added Vite proxy configuration
  - Updated type definitions to match backend
  - Refactored SearchFilters to fetch groups dynamically
  - Refactored SearchPage to use API instead of mock data
  - Connected MockupModal to generate-mockup endpoint

### 2. Pagination Implementation
- **Issue**: Backend was loading all fabrics on initial page load
- **Fix**:
  - Added frontend guard to prevent API calls without search/filters
  - Implemented backend pagination with `page` and `limit` parameters
  - Added "Load More" button in SearchPage
  - Default limit: 20 items per page

### 3. MockupModal Redesign
- **Design**: Glassmorphism aesthetic with green light refractions
- **Layout**: Left sidebar (categories) + Right grid (garments)
- **Features**:
  - Category selection with pill-shaped buttons
  - Garment images displayed in square glass tiles
  - Mockup preview with Front/Back view selector
  - Download buttons for face and back views

### 4. Image Display Fixes
- **Issue**: Silhouettes not loading/visible
- **Solution**: Removed filters, display images directly from mockups folder
- **Implementation**: Simple `object-contain` to fit images in squares

### 5. Modal Sizing
- **Issue**: Modal too large, not fitting on screen
- **Fix**:
  - Reduced modal max-width: `max-w-5xl` → `max-w-4xl`
  - Increased max-height: `85vh` → `95vh`
  - Reduced padding and font sizes throughout
  - Compact button sizes
  - Mockup image fits within `calc(95vh - 300px)`

### 6. Case Sensitivity Fix
- **Issue**: Mockup generation failing due to case mismatches
- **Fix**:
  - Modified `find_file()` in `mockup_library.py` for case-insensitive search
  - API returns both `name` (exact) and `displayName` (formatted)

### 7. Unicode Encoding Fix
- **Issue**: `UnicodeEncodeError` on Windows when printing emojis
- **Fix**: Removed all emoji characters from print statements in Python files

### 8. Silhouette Image Support
- **Implementation**: Backend checks for silhouette images first
- **Directory**: `silhouettes/` with `_silhouette.png` suffix
- **Fallback**: Uses full-color mockup templates if silhouettes not found
- **Frontend**: Only applies filter if `isSilhouette: false`

## File Structure

```
src/
├── components/
│   ├── MockupModal.tsx      # Main modal with glassmorphism design
│   ├── SearchPage.tsx        # Search page with pagination
│   ├── SearchFilters.tsx     # Dynamic filters
│   └── SearchFabricCard.tsx  # Individual fabric card
├── types.ts                  # TypeScript type definitions
└── index.tsx                 # Entry point

api_server.py                 # Flask backend API
mockup_library.py            # Mockup generation logic
vite.config.ts               # Vite configuration with proxy
```

## Environment Variables

- `.env`: Contains `GEMINI_API_KEY` (placeholder for local dev)

## Git Configuration

- **Excluded**: All image files (`.jpg`, `.png`, etc.)
- **Tracked**: Frontend code, backend code, configuration files
- **Repository**: `https://github.com/SRX-hash/frontend-connected`

## Running the Application

### Backend
```powershell
cd "D:\React based\React based CUR"
python api_server.py
```
Runs on `http://localhost:5000`

### Frontend
```powershell
cd "D:\React based\React based CUR"
npm run dev
```
Runs on `http://localhost:3000`

## Key Design Decisions

1. **No Initial Data Load**: Frontend only fetches when user searches/filters
2. **Pagination**: Server-side pagination with 20 items per page
3. **Direct Image Display**: Garment images shown without filters from mockups folder
4. **Glassmorphism UI**: Premium glass effect with green light refractions
5. **Compact Modal**: Designed to fit on one screen at 100% zoom
6. **Case Insensitive Matching**: Handles file name variations gracefully

## Known Issues & Solutions

1. **PowerShell Execution Policy**: Use `--legacy-peer-deps` for npm or change execution policy
2. **Port Conflicts**: Check with `netstat -ano | Select-String ":3000|:5000"`
3. **Unicode Errors**: Removed emojis from Python print statements
4. **Case Sensitivity**: Implemented case-insensitive file matching

## Future Enhancements (Not Implemented)

- Silhouette image generation script (`generate_silhouettes.py` exists but needs refinement)
- Production build configuration
- Environment-based API URL configuration
- Advanced error handling and retry logic

