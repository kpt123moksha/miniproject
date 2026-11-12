-- Add Bantwal as a supported service area without changing existing complaint records.
ALTER TABLE complaints
    DROP CONSTRAINT IF EXISTS complaints_city_check;

ALTER TABLE complaints
    ADD CONSTRAINT complaints_city_check
    CHECK (city IS NULL OR city IN ('Mangaluru', 'Bantwal', 'Udupi'));
