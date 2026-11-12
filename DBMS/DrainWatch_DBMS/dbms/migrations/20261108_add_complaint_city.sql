-- Add city categorization without discarding existing complaints.
-- Historical rows remain NULL until their city can be verified from an official boundary.
ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS city VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'complaints_city_check'
    ) THEN
        ALTER TABLE complaints
            ADD CONSTRAINT complaints_city_check
            CHECK (city IS NULL OR city IN ('Mangaluru', 'Udupi'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_city_status ON complaints(city, status);