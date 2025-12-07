<!-- 3f745b89-f76f-48d6-b6be-38dc8259eb32 fdf4ecec-799c-4c7e-b88b-b0f50db90a3e -->
# Database Viewer Implementation & System FAQ

## 1. Backend Update: Enhanced Admin API

- **File:** [`api_server.py`](api_server.py)
- **Goal:** Allow fetching more records and flexible filtering in the admin fabric list.
- **Changes:**
- Modify `get_admin_fabrics` to accept a `limit` parameter (default 100, max 1000).
- Ensure it returns all necessary fields (it currently does).

## 2. Frontend Update: Excel-like Viewer

- **File:** [`src/components/admin/content/LiveDbView.tsx`](src/components/admin/content/LiveDbView.tsx)
- **Goal:** Create a comprehensive data grid view.
- **Changes:**
- Add columns: `Group`, `GSM`, `Width`, `Composition`.
- Add a "Search" input for real-time client-side filtering.
- Add a "Status" dropdown filter (Live, Pending, All) to replace the hardcoded behavior.
- Improve table layout for better readability (denser rows).

## 3. System Explanations (for User)

- **Mockup Stability:**
- The system has a strict **rate limiter (10 requests/minute per IP)**.
- If 10 *different* users click generate, the server handles them concurrently (threaded/Gunicorn).
- If one user spams clicks, they get "429 Too Many Requests".
- Safety: The server catches `MemoryError` to prevent crashing.
- **Storage:**
- Mockups are stored on the **Server Filesystem** (`generated_mockups/`).
- They are NOT in temporary cache; they persist until manually deleted.
- Served via Caddy/Flask static file serving.

### To-dos

- [ ] Update api_server.py to allow customizable limit in get_admin_fabrics
- [ ] Update LiveDbView.tsx to add search, status filter, and extra columns