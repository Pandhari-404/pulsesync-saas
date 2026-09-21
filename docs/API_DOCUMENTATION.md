# PulseSync REST API Reference & Integration Guide

PulseSync provides a RESTful JSON API hardened with JWT Bearer tokens and SHA-256 API Key headers.

Interactive documentation (Swagger UI) is available at:
`http://localhost:5000/api/docs`

---

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

---

## Authentication Schemes

### 1. Bearer Token (JWT)
Send in standard HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

### 2. API Key Authentication
Send in HTTP header:
```http
X-API-Key: psk_live_<32_hex_chars>
```

---

## Endpoints

### 1. Authentication

#### Register User & Workspace
`POST /api/auth/register`

**Request Body:**
```json
{
  "name": "Sarah Connor",
  "email": "sarah@skydefense.com",
  "password": "Password123!",
  "workspaceName": "SkyDefense SRE"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "c1f7b8e1-...",
      "name": "Sarah Connor",
      "email": "sarah@skydefense.com",
      "role": "ADMIN"
    },
    "workspace": {
      "id": "w9b2a1...",
      "name": "SkyDefense SRE",
      "slug": "skydefense-sre-8492",
      "plan": "PRO"
    }
  }
}
```

#### Login
`POST /api/auth/login`

**Request Body:**
```json
{
  "email": "alex@pulsesync.io",
  "password": "PulseDemo2026!"
}
```

#### 1-Click Demo Login
`GET /api/auth/demo?role=ADMIN`

---

### 2. Incidents & Operations

#### List Incidents
`GET /api/incidents?status=INVESTIGATING&severity=CRITICAL&search=payment`

**Query Parameters:**
- `status`: `INVESTIGATING` | `IDENTIFIED` | `MONITORING` | `RESOLVED`
- `severity`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
- `search`: free-text search across title, description, or service
- `limit`: items per page (default: 50)
- `offset`: pagination offset (default: 0)

#### Create Incident
`POST /api/incidents`

**Request Body:**
```json
{
  "title": "Stripe Webhook Gateway 504 Timeout",
  "description": "Inbound checkout notifications failing due to Redis queue backlog.",
  "severity": "CRITICAL",
  "serviceName": "Payment Service"
}
```

#### Update Incident Status
`PUT /api/incidents/:id`

**Request Body:**
```json
{
  "status": "IDENTIFIED"
}
```

#### Post Communication / Timeline Update
`POST /api/incidents/:id/comments`

**Request Body:**
```json
{
  "status": "MONITORING",
  "message": "Mitigation deployed. Traffic diverted to failover region."
}
```

---

### 3. Observability & Telemetry

#### Liveness Probe
`GET /health/live`
- Returns: `200 OK` `{"status": "UP"}`

#### Readiness Probe
`GET /health/ready`
- Returns: `200 OK` when SQLite/PostgreSQL connection is healthy.

#### System Telemetry
`GET /health/telemetry`
- Returns V8 heap statistics, RSS memory, system architecture, CPU core count, and process uptime.

#### Prometheus Scraper
`GET /health/metrics`
- Outputs standard Prometheus exposition format.

---

### 4. API Keys Provisioning

#### Create API Key
`POST /api/keys`

**Request Body:**
```json
{
  "name": "GitHub Actions CI Deployer"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "key_91238...",
    "name": "GitHub Actions CI Deployer",
    "prefix": "psk_live_a1b...",
    "apiKey": "psk_live_a1b2c3d4e5f6789012345678"
  }
}
```
