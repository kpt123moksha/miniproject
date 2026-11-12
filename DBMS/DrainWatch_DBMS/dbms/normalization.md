# Database Normalization (1NF, 2NF and 3NF)

## First Normal Form (1NF)
A table is in 1NF when each column contains one atomic value and there are no repeating groups.
- User name, email and phone are stored in separate columns.
- Complaint coordinates are stored as latitude and longitude numeric values.
- Before/after photos are separate rows in `cleaning_evidence`, not multiple photo values in one cell.

## Second Normal Form (2NF)
A table is in 2NF when it is in 1NF and every non-key attribute depends on the whole candidate key.
- Each main table uses a single-column primary key.
- Complaint details depend on `complaints.id`.
- Task details depend on `cleaning_tasks.id`.
- Evidence details depend on `cleaning_evidence.id`.
- User profile details are kept in `users`, rather than copied into every complaint.

## Third Normal Form (3NF)
A table is in 3NF when it is in 2NF and non-key attributes do not depend transitively on another non-key attribute.
- Citizen name and email are stored only in `users`; `complaints` stores `citizen_id`.
- Worker name is stored in `users`; `cleaning_tasks` stores `worker_id`.
- Status changes are stored as separate history rows.
- Evidence metadata is stored separately from complaint details.
- Ward configuration is stored in `ward_settings`, not repeated in every complaint.

## Result
The design separates users, complaints, cleaning tasks, status history, evidence, ward configuration and rainfall observations. Foreign keys connect related records and constraints protect data quality.
