# CivicConnect – Smart Civic Issue Reporting

## Problem Statement
Citizens lack a centralized, transparent platform to report and track municipal issues like potholes, broken streetlights, or garbage overflow.

## Platform Roles & Portal Navigation
The platform features a unified public landing page (`/`) and a centralized role portal (`/select-role`):
1. **Citizen Portal (`/citizen/login`)**: Report issues, track live status, upload images, receive notifications, and verify/reopen resolutions. *(Leaflet GIS map is strictly prohibited to protect public spatial privacy).*
2. **Administrator (`/municipal/login` with `ADMIN001`)**: City-wide issue triage, inter-departmental assignments, operational GIS map, department management, and aggregate city analytics.
3. **Municipal Officer (`/municipal/login` with `OFFICER001`)**: Departmental queue triage, internal remarks, department worker assignments, and department-scoped GIS map.
4. **Field Worker (`/municipal/login` with `WORKER001`)**: Assigned task list (`/municipal/tasks`), start work transition, resolution proof upload, and task-scoped GIS map.

## Core Capabilities
- **Explainable Civic Intelligence**: Rule-based text classification, weighted priority scoring, and duplicate detection without heavy external dependencies.
- **Strict Role-Based GIS Map**: Interactive Leaflet map strictly scoped per role (`Admin: All`, `Officer: Department`, `Worker: Assigned`, `Citizen: 403 Forbidden`).
- **Real-Time Live Aggregate Stats**: Real data endpoint (`GET /api/analytics/public-stats`) powering the public landing page with total reports, resolved count, and active departments.
- **Atomic File-Based JSON Engine**: Robust atomic writes (`.tmp` + rename) with automated `.bak` backups.
- **Responsive UI/UX**: Built with React, Tailwind CSS, Heroicons, and dynamic civic-tech dashboards.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons + Leaflet GIS
- **Backend**: Node.js + Express + JWT Authentication
- **Storage**: Robust File-Based JSON Storage (`backend/data/*.json`)

## Running Locally

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Seed Data
```bash
npm run seed
```

### 3. Run Development Servers
```bash
npm run dev
```

### 4. Run Automated E2E Validation Suite
```bash
cd backend
node test_e2e.js
```

## System Overview
CivicConnect is a centralized civic issue reporting and municipal management platform. Citizens can report issues with descriptions, media, and location information. The system analyzes each report using explainable classification, priority scoring, duplicate detection, and department routing. Municipal staff can review, assign, track, and resolve complaints. Citizens can monitor progress and verify resolutions. Analytics provide insights into complaint trends, response times, and issue hotspots.

## Project Documentation
Detailed documentation is available in the `/docs` directory:
- [Algorithms (`docs/algorithms.md`)](./docs/algorithms.md)
- [Architecture (`docs/architecture.md`)](./docs/architecture.md)
- [API Reference (`docs/api.md`)](./docs/api.md)

## Demo Credentials
### Citizen
- **Email:** `citizen@example.com`
- **Password:** `Citizen@123`

### Municipal Admin
- **Employee ID / Email:** `ADMIN001` or `admin@civicconnect.gov`
- **Password:** `Admin@123`

### Municipal Officer
- **Employee ID / Email:** `OFFICER001` or `officer1@civicconnect.gov`
- **Password:** `Officer@123`

### Municipal Worker
- **Employee ID / Email:** `WORKER001` or `worker1@civicconnect.gov`
- **Password:** `Worker@123`

## Academic Prototype Notes
- **Storage Engine**: Uses transactional file-based JSON storage to maintain a zero-dependency setup ideal for college evaluation and portable demonstration.
- **Data Integrity**: JSON updates use atomic staging writes and automatic rollback backups to prevent corruption.
- **Security**: JWT role verification, route guards, query-parameter tampering defenses, and PII anonymization on public endpoints.
