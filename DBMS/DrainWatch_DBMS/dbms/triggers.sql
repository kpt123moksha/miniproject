-- Keep updated_at values consistent when rows are edited.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_complaints_updated_at ON complaints;
CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cleaning_tasks_updated_at ON cleaning_tasks;
CREATE TRIGGER trg_cleaning_tasks_updated_at
BEFORE UPDATE ON cleaning_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Optional status-audit trigger.
-- The supplied Express backend writes complaint_status_history itself.
-- To avoid duplicate history rows, this trigger is opt-in only.
CREATE OR REPLACE FUNCTION audit_complaint_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND current_setting('drainwatch.enable_status_trigger', true) = 'on' THEN
        INSERT INTO complaint_status_history
            (complaint_id, changed_by, old_status, new_status, remarks)
        VALUES
            (NEW.id, NULL, OLD.status, NEW.status, 'Recorded by database status trigger');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_complaint_status_history ON complaints;
CREATE TRIGGER trg_complaint_status_history
AFTER UPDATE OF status ON complaints
FOR EACH ROW EXECUTE FUNCTION audit_complaint_status();

-- Demonstration (run in a transaction, replacing 1 with a valid complaint ID):
-- BEGIN;
-- SET LOCAL drainwatch.enable_status_trigger = 'on';
-- UPDATE complaints SET status = 'Assigned' WHERE id = 1;
-- ROLLBACK;
