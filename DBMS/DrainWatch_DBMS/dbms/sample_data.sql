-- Sample/demo data. Demo password for all seeded accounts: DrainWatch@123
-- pgcrypto creates a bcrypt-compatible password hash.
INSERT INTO users (name, email, phone, password_hash, role)
VALUES
 ('Demo Citizen', 'citizen@drainwatch.local', '9000000001', crypt('DrainWatch@123', gen_salt('bf', 10)), 'citizen'),
 ('Demo Authority', 'authority@drainwatch.local', '9000000002', crypt('DrainWatch@123', gen_salt('bf', 10)), 'authority'),
 ('Demo Worker One', 'worker1@drainwatch.local', '9000000003', crypt('DrainWatch@123', gen_salt('bf', 10)), 'worker'),
 ('Demo Worker Two', 'worker2@drainwatch.local', '9000000004', crypt('DrainWatch@123', gen_salt('bf', 10)), 'worker')
ON CONFLICT (email) DO NOTHING;

INSERT INTO ward_settings (id, area_name, centre_latitude, centre_longitude, radius_km)
VALUES (1, 'Demo Ward - update this value', 12.9141000, 74.8560000, 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO complaints
(citizen_id, title, description, severity, latitude, longitude, location_text,
 rainfall_mm, elevation_m, risk_score, risk_level, status)
SELECT u.id, 'Blocked roadside drain', 'Water is collecting because the roadside drain appears blocked.',
       'High', 12.9145000, 74.8565000, 'Demo Main Road', 28.00, 18.00, 63, 'High', 'Submitted'
FROM users u WHERE u.email = 'citizen@drainwatch.local'
AND NOT EXISTS (SELECT 1 FROM complaints c WHERE c.title = 'Blocked roadside drain' AND c.citizen_id = u.id);

INSERT INTO complaint_status_history (complaint_id, changed_by, old_status, new_status, remarks)
SELECT c.id, c.citizen_id, NULL, 'Submitted', 'Demo complaint submitted'
FROM complaints c
WHERE c.title = 'Blocked roadside drain'
AND NOT EXISTS (
  SELECT 1 FROM complaint_status_history h
  WHERE h.complaint_id = c.id AND h.new_status = 'Submitted'
);
