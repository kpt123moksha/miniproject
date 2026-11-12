# DrainWatch ER Diagram

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : submits
    USERS ||--o{ CLEANING_TASKS : works_on
    USERS ||--o{ CLEANING_TASKS : assigns
    USERS ||--o{ COMPLAINT_STATUS_HISTORY : changes
    USERS ||--o{ CLEANING_EVIDENCE : uploads
    COMPLAINTS ||--o| CLEANING_TASKS : has
    COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : records
    COMPLAINTS ||--o{ CLEANING_EVIDENCE : has
    USERS {
      bigint id PK
      varchar name
      varchar email UK
      varchar role
    }
    COMPLAINTS {
      bigint id PK
      bigint citizen_id FK
      varchar title
      varchar severity
      numeric latitude
      numeric longitude
      integer risk_score
      varchar status
    }
    CLEANING_TASKS {
      bigint id PK
      bigint complaint_id FK,UK
      bigint worker_id FK
      bigint assigned_by FK
      timestamptz deadline
    }
    COMPLAINT_STATUS_HISTORY {
      bigint id PK
      bigint complaint_id FK
      bigint changed_by FK
      varchar old_status
      varchar new_status
    }
    CLEANING_EVIDENCE {
      bigint id PK
      bigint complaint_id FK
      bigint uploaded_by FK
      varchar evidence_type
      text photo_url
    }
    WARD_SETTINGS {
      smallint id PK
      varchar area_name
      numeric centre_latitude
      numeric centre_longitude
      numeric radius_km
    }
    RAINFALL_OBSERVATIONS {
      bigint id PK
      timestamptz recorded_at
      numeric latitude
      numeric longitude
      numeric rainfall_mm
    }
```

## Relationships

- One citizen can submit many complaints; each complaint belongs to one citizen.
- One complaint can have zero or one cleaning task in this project version.
- A worker can receive many cleaning tasks; each task is assigned by an authority user.
- One complaint can have many status-history records and many evidence photographs.
- Ward settings stores the single configured project area.
- Rainfall observations stores readings independently for later reporting.
