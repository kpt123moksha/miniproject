# DrainWatch Backend

Express + PostgreSQL REST API for the DrainWatch project.

## 1. Requirements

- Node.js 18 or newer (the weather service uses built-in `fetch`)
- PostgreSQL 14 or newer
- The DrainWatch database schema from the project's `dbms` folder

## 2. Install

Open PowerShell in this `backend` folder:

```powershell
npm install
Copy-Item .env.example .env
```

Open `.env` and set your PostgreSQL password, JWT secret, and configured ward centre/radius.
To enable photo-based severity suggestions, create a Gemini API key in Google AI Studio and set `GEMINI_API_KEY` in `.env`. Keep this key on the backend; never put it in the frontend. `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`, a low-cost model that supports image input.

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/drainwatch
JWT_SECRET=use_a_long_random_secret_here
CLIENT_URL=http://localhost:5173
SERVICE_AREAS_GEOJSON=./data/service-areas.geojson
GEOCODER_USER_AGENT=DrainWatch/1.0 (contact: your-email@example.com)
AREA_NAME=Your Ward Name
AREA_LATITUDE=12.9141
AREA_LONGITUDE=74.8560
```

Do not commit `.env` to GitHub.

## 3. Create database

In pgAdmin:
1. Create a database named `drainwatch`.
2. Open Query Tool for that database.
3. Run the SQL schema file supplied in the project's `dbms` folder (usually `schema.sql`).
4. Run the sample-data file if your project includes one.

The schema must include these tables and columns:
- `users(id, name, email, phone, password_hash, role)`
- `complaints(id, citizen_id, city, title, description, severity, latitude, longitude, location_text, photo_url, rainfall_mm, elevation_m, risk_score, risk_level, status, verification_remarks, created_at, updated_at)`
- `cleaning_tasks(id, complaint_id, worker_id, assigned_by, deadline, task_status, remarks, updated_at)`
- `complaint_status_history(id, complaint_id, changed_by, old_status, new_status, remarks, changed_at)`
- `cleaning_evidence(id, complaint_id, uploaded_by, evidence_type, photo_url, remarks, created_at)`

If your existing SQL uses different column or table names, align the SQL or backend queries before running.

## Service-area boundaries

The configured service areas use OpenStreetMap administrative boundaries for **Mangaluru taluk** (`relation/3804915`, `admin_level=6`, LGD subdistrict `5561`), **Bantwal taluk** (`relation/3805146`, `admin_level=6`, LGD subdistrict `5562`) and **Udupi taluku** (`relation/4236158`, `admin_level=6`, LGD subdistrict `5523`). These are broader than their respective municipal limits; the app deliberately accepts these taluk-wide boundaries because they are the selected project coverage. They are not represented as municipal limits. If the scope changes to city-only coverage, replace them with verified municipal-limit polygons and update boundary validation.

The GeoJSON file is `Backend/backend/data/service-areas.geojson`. It must contain Polygon or MultiPolygon features with `properties.city` set to `Mangaluru`, `Bantwal`, and `Udupi` for their corresponding boundaries. Coordinates must use WGS84 (EPSG:4326) and GeoJSON order `[longitude, latitude]`. Do not substitute a district, ward, circle or hand-drawn shape.

The backend resolves `SERVICE_AREAS_GEOJSON` relative to the backend project root, regardless of the shell's working directory. Apply `DBMS/DrainWatch_DBMS/dbms/migrations/20261108_add_complaint_city.sql` and `DBMS/DrainWatch_DBMS/dbms/migrations/20261109_add_bantwal_service_area.sql` to existing databases before running the updated API. Existing complaints are preserved.

Address search uses OpenStreetMap Nominatim and filters results against the selected taluk polygon. Configure a descriptive `GEOCODER_USER_AGENT` with a contact address and respect Nominatim's usage policy.

## 4. Start server

```powershell
npm run dev
```

Expected message:

```text
PostgreSQL connection successful
DrainWatch API running at http://localhost:5000
```

Check this URL in your browser:

`http://localhost:5000/api/health`

It should return JSON with status `ok`.

## 5. Frontend connection

In the React frontend `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing `.env`.

## 6. Main API routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Citizen registration |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current logged-in user |
| GET | `/api/complaints` | Citizen's complaints or authority complaint list |
| POST | `/api/complaints/analyze-image` | Suggest complaint severity from a JPG, PNG or WEBP photo (Gemini API key required) |
| POST | `/api/complaints` | Submit complaint with multipart `photo` |
| GET | `/api/complaints/:id` | Complaint details, history and evidence |
| PATCH | `/api/complaints/:id/status` | Authority updates status |
| POST | `/api/complaints/:id/assign` | Assign worker and deadline |
| POST | `/api/complaints/:id/verify` | Citizen verifies/reopens completed work |
| POST | `/api/complaints/:id/evidence` | Upload Before/After photo |
| PATCH | `/api/complaints/tasks/:taskId/status` | Worker updates task |
| GET | `/api/workers` | List workers |
| POST | `/api/workers` | Add worker |
| GET | `/api/dashboard/summary` | Dashboard counts |
| GET | `/api/service-areas` | Configured Mangaluru, Bantwal and Udupi taluk service-area GeoJSON |
| GET | `/api/service-areas/identify?latitude=...&longitude=...` | Identify a city from GPS coordinates |
| GET | `/api/service-areas/search?q=...&city=...` | Search for locations in a service city |
| GET | `/api/weather` | Current weather and rainfall forecast |
| GET | `/api/weather/elevation` | Elevation for a GPS point |

Protected routes require:

`Authorization: Bearer YOUR_JWT_TOKEN`

## 7. Important notes

- Register creates a **citizen** account. Create the first authority/admin and worker accounts securely through a controlled database/admin setup; do not allow public users to select an authority role.
- Complaint eligibility uses the configured city polygons. `AREA_NAME`, `AREA_LATITUDE`, and `AREA_LONGITUDE` remain weather-display defaults only.
- The risk score is a transparent rule-based maintenance-priority indicator, not a flood prediction.
- Weather/elevation providers may be temporarily unavailable. The complaint can still be recorded; unavailable data is not fabricated.
- Image upload is limited to 5 MB and JPG/PNG/WEBP. For a production deployment, add server-side file-signature inspection and malware scanning.
- Test with a local development database before using real citizen information.
