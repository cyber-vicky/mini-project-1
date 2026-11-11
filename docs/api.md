# CivicConnect API Documentation

All API endpoints are prefixed with `/api`.

## Auth Endpoints
- `POST /auth/citizen/register` - Register a new citizen account.
- `POST /auth/citizen/login` - Authenticate a citizen and return a JWT.
- `POST /auth/municipal/login` - Authenticate a municipal worker/officer/admin and return a JWT.
- `GET /auth/me` - Validate the JWT and return current user profile.
- `PUT /auth/profile` - Update user personal contact details.
- `POST /auth/logout` - Invalidate frontend session.

## Issue Endpoints
- `POST /issues` - (Citizen) Submit a new issue. Accepts `multipart/form-data` for media uploads.
- `GET /issues/my-issues` - (Citizen) Retrieve issues created by the logged-in citizen.
- `GET /issues/all` - (Municipal) Retrieve all issues based on municipal role scoping.
- `GET /issues/:id` - (All authenticated) Retrieve detailed issue data, intelligence panel, internal remarks, and history timeline.
- `PUT /issues/:id` - (Admin) Override core fields (category, priority, department, staff).
- `POST /issues/:id/status` - (Municipal) Update status of an issue (e.g., IN_PROGRESS, RESOLVED). Accepts `multipart/form-data` for resolution proof.
- `POST /issues/:id/assign` - (Admin/Officer) Assign an issue to a department, officer, or worker with role and department validation.
- `POST /issues/:id/verify` - (Citizen) Verify resolution (CLOSED) or reopen (REOPENED) with required reason.
- `POST /issues/:id/remarks` - (Municipal) Add internal staff remark or note.

## Analytics & System Endpoints
- `GET /analytics` - (Admin/Officer) Fetch system-wide statistics (totals, distributions by status/category/priority/department/date, and average resolution time).
- `GET /analytics/hotspots` - (Admin/Officer) Fetch geographic complaint density hotspots.
- `GET /departments` - (Admin/Officer) Fetch all registered municipal departments.
- `GET /departments/:id/members` - (Admin/Officer) Fetch active officers and workers belonging to a department.
- `GET /notifications` - (All authenticated) Fetch unread and read notifications for logged-in user.
- `PUT /notifications/:id/read` - (All authenticated) Mark a specific notification as read.
- `PUT /notifications/read-all` - (All authenticated) Mark all notifications as read for logged-in user.
