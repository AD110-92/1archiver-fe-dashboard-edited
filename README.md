<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 1Archiver - Enterprise Email Archiving & Compliance

An enterprise-grade, on-premises compliance archiving platform for email archiving, eDiscovery, legal holds, retention policies, and audit logging.

## Architecture

- **Frontend**: React + TypeScript + Vite (port 3000)
- **Backend**: Node.js + Express + SQLite (port 8080)
- **Auth**: JWT-based authentication with bcrypt password hashing
- **Email Archiving**: IMAP-based email fetching and archiving service

## Quick Start

**Prerequisites:** Node.js 18+

### 1. Backend Setup

```bash
cd backend
npm install
npm run seed    # Seeds the database with demo data
npm start       # Starts the API server on port 8080
```

### 2. Frontend Setup

```bash
# From the project root
npm install
npm run dev     # Starts Vite dev server on port 3000 (proxies /api to :8080)
```

### 3. Login

Open http://localhost:3000 and use one of the demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@globalcorp.com | admin123 |
| Compliance Officer | compliance@globalcorp.com | compliance123 |
| Auditor | auditor@globalcorp.com | auditor123 |

## Features

- **Dashboard Overview** - Real-time compliance health, ingestion throughput, and KPIs
- **Email Archiving** - Connect IMAP mailboxes and archive emails with full-text search
- **Search & eDiscovery** - Full-text search across all archived messages with filters
- **Legal Holds** - Create and manage preservation orders with custodian scoping
- **Retention Policies** - Define WORM-compliant data lifecycle rules (SEC 17a-4, GDPR)
- **Audit Logs** - Immutable, tamper-evident logging with SHA-256 integrity hashes
- **Access Control (RBAC)** - Role-based permissions management
- **Storage & Infrastructure** - Cluster health monitoring and capacity planning

## API Endpoints

All endpoints are under `/api/v1/`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Authenticate and receive JWT token |
| GET | `/mailboxes` | List connected mailboxes |
| POST | `/mailboxes` | Add a new mailbox (with optional IMAP config) |
| POST | `/mailboxes/:id/sync` | Trigger IMAP email sync for a mailbox |
| POST | `/search` | Search archived messages with filters |
| GET | `/legal-holds` | List legal holds |
| POST | `/legal-holds` | Create a new legal hold |
| GET | `/audit-logs` | View audit trail |
| GET | `/retention-policies` | List retention policies |
| GET | `/users` | List users |
| POST | `/users` | Create a new user |
| GET | `/roles` | List roles |
| GET | `/tenants/:id` | Get tenant details |
| GET | `/health` | Health check |

## Email Archiving Setup

To archive emails from a real mailbox:

1. Navigate to **Data Sources** in the dashboard
2. Click **+ Add Integration**
3. Provide IMAP connection details:
   - IMAP Host (e.g., `imap.gmail.com`)
   - Port (993 for SSL)
   - Username and password (or app password)
4. Trigger sync via the API: `POST /api/v1/mailboxes/:id/sync`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Backend server port |
| `JWT_SECRET` | dev key | JWT signing secret (change in production) |
| `DB_PATH` | `./1archiver.db` | SQLite database file path |
