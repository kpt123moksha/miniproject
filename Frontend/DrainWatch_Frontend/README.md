# DrainWatch Frontend

React + TypeScript + Vite frontend, organized into components, pages, services and types.

## Setup
1. Start the DrainWatch Express backend at `http://localhost:5000`.
2. Copy `.env.example` to `.env` if you need to change the API URL.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the Vite URL shown in the terminal.

## Notes
- Citizen registration creates a citizen account.
- Authority and worker accounts must be created by an authorized administrator or promoted in PostgreSQL for a college demonstration.
- The frontend expects the matching backend endpoints.
- Map clicks select a point; browser geolocation requires permission.
