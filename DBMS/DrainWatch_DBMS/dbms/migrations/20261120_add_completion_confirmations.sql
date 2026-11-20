ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS authority_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS citizen_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS citizen_rating SMALLINT,
    ADD COLUMN IF NOT EXISTS citizen_feedback TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'complaints_citizen_rating_range'
    ) THEN
        ALTER TABLE complaints
            ADD CONSTRAINT complaints_citizen_rating_range
            CHECK (citizen_rating IS NULL OR citizen_rating BETWEEN 1 AND 5);
    END IF;
END $$;
