# CivicConnect Architecture

## System Flow
Citizen Mobile/Web UI
↓
React Frontend
↓
REST API (Express)
↓
Authentication & Authorization Middleware (JWT)
↓
Business Logic Services
  - Classification Service
  - Priority Service
  - Duplicate Detection Service
  - Routing Service
  - Hotspot Service
↓
JSON Storage Service
↓
File System (data/*.json, /uploads)

## Technologies Used
- **Frontend**: React.js, Vite, React Router, Tailwind CSS v4, Axios.
- **Backend**: Node.js, Express.js, Multer, bcrypt, jsonwebtoken.
- **Storage**: JSON File-based storage (No SQL/NoSQL databases used to adhere to prototype constraints).

## Core Modules
- **Authentication**: JWT-based stateless authentication with Role-Based Access Control (RBAC). Roles include Citizen, Admin, Officer, Worker.
- **JSON Storage Abstraction**: `jsonService.js` provides generic methods (`insert`, `update`, `findById`) to ensure safe reading and writing to the local `data/` directory.
- **Issue Workflow Pipeline**: A middleware-style logic flow applied to every newly submitted issue before it rests in the storage layer.
