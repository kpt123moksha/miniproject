-- DrainWatch database schema (PostgreSQL)
-- Run this file first in the drainwatch database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'citizen'
        CHECK (role IN ('citizen', 'authority', 'admin', 'worker')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    citizen_id BIGINT NOT NULL REFERENCES users(id),
    city VARCHAR(20) CHECK (city IN ('Mangaluru', 'Bantwal', 'Udupi')),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    location_text VARCHAR(250),
    photo_url TEXT,
    rainfall_mm NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (rainfall_mm >= 0),
    elevation_m NUMERIC(8,2) CHECK (elevation_m IS NULL OR elevation_m >= -500),
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Low'
        CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted'
        CHECK (status IN ('Submitted', 'Assigned', 'Cleaning in Progress',
                          'Cleaning Completed', 'Verified', 'Reopened', 'Rejected')),
    verification_remarks TEXT,
    authority_confirmed_at TIMESTAMPTZ,
    citizen_confirmed_at TIMESTAMPTZ,
    citizen_rating SMALLINT CHECK (citizen_rating IS NULL OR citizen_rating BETWEEN 1 AND 5),
    citizen_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_city_status ON complaints(city, status);

CREATE TABLE IF NOT EXISTS cleaning_tasks (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL UNIQUE REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id BIGINT NOT NULL REFERENCES users(id),
    assigned_by BIGINT NOT NULL REFERENCES users(id),
    deadline TIMESTAMPTZ NOT NULL,
    task_status VARCHAR(30) NOT NULL DEFAULT 'Assigned'
        CHECK (task_status IN ('Assigned', 'Cleaning in Progress', 'Cleaning Completed')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    remarks TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cleaning_evidence (
    id BIGSERIAL PRIMARY KEY,
    complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    evidence_type VARCHAR(10) NOT NULL CHECK (evidence_type IN ('Before', 'After')),
    photo_url TEXT NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stores the one configured Panchayat/municipal ward used by this project.
CREATE TABLE IF NOT EXISTS ward_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    area_name VARCHAR(150) NOT NULL,
    centre_latitude NUMERIC(10,7) NOT NULL CHECK (centre_latitude BETWEEN -90 AND 90),
    centre_longitude NUMERIC(10,7) NOT NULL CHECK (centre_longitude BETWEEN -180 AND 180),
    radius_km NUMERIC(6,2) NOT NULL CHECK (radius_km > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional rainfall observations used for project reporting.
CREATE TABLE IF NOT EXISTS rainfall_observations (
    id BIGSERIAL PRIMARY KEY,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    rainfall_mm NUMERIC(8,2) NOT NULL CHECK (rainfall_mm >= 0),
    source VARCHAR(80) NOT NULL DEFAULT 'Open-Meteo'
);
