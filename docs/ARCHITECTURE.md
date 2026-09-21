# PulseSync Architecture & Engineering Lifecycle Blueprint

PulseSync is an enterprise-grade Incident Operations and Collaborative Reliability SaaS platform. This document details the software engineering lifecycle, architectural principles, domain model, security posture, and deployment topologies.

---

## 1. System Architecture Overview

```
                                  ┌──────────────────────────────────┐
                                  │      Client SPA (React + Vite)   │
                                  │  Tailwind CSS / Recharts / Lucide │
                                  └───────────────┬──────────────────┘
                                                  │
                                       HTTPS / WSS / REST
                                                  │
                                                  ▼
                                  ┌──────────────────────────────────┐
                                  │     Reverse Proxy / Nginx        │
                                  │    (TLS Termination / Caching)   │
                                  └───────────────┬──────────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────────┐
                        │              PulseSync Node.js Server                │
                        │                                                      │
                        │  ┌────────────────────┐    ┌──────────────────────┐  │
                        │  │ Express REST Engine│    │ Socket.IO WSS Engine │  │
                        │  │ (Zod, RBAC, Helmet)│    │ (Tenant Room Pub/Sub)│  │
                        │  └──────────┬─────────┘    └──────────┬───────────┘  │
                        │             │                         │              │
                        │             ▼                         ▼              │
                        │  ┌────────────────────────────────────────────────┐  │
                        │  │       Prisma ORM & Data Access Layer           │  │
                        │  └──────────────────────┬─────────────────────────┘  │
                        └─────────────────────────┼────────────────────────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    ▼                           ▼
                        ┌───────────────────────┐   ┌───────────────────────┐
                        │ Relational Store (SQL)│   │ Prometheus Exporter   │
                        │ SQLite / PostgreSQL   │   │ /health/metrics       │
                        └───────────────────────┘   └───────────────────────┘
```

---

## 2. Domain & Entity Model

- **Workspace (Tenant Root)**: Root of tenancy. Every user, incident, API key, and audit log strictly belongs to a specific `workspaceId`. Data isolation is enforced at both the database query level and the WebSocket room level (`workspace:<workspaceId>`).
- **User & RBAC**:
  - `ADMIN`: Full workspace control, API key creation/revocation, member invitation, role promotions.
  - `MANAGER`: Incident triage, timeline modification, team oversight.
  - `MEMBER`: Incident creation, status updates, posting communication entries.
  - `VIEWER`: Read-only telemetry and incident inspection.
- **Incident Lifecycle**:
  - `INVESTIGATING` -> `IDENTIFIED` -> `MONITORING` -> `RESOLVED`
  - Automated timestamp tracking (`createdAt`, `updatedAt`, `resolvedAt`) enables continuous calculation of Mean Time to Resolution (MTTR).
- **Incident Updates & Comments**: Append-only communication timeline documenting response actions, root cause analyses, and triage notes.
- **API Keys**: Programmatic authentication using cryptographically generated keys (`psk_live_...`). Only SHA-256 hashes are stored at rest.
- **Audit Logs**: Comprehensive event trail recording security events, user logins, incident declarations, and permissions modifications.

---

## 3. Real-Time WebSocket Pub/Sub Topology

1. **Room Partitioning**: When a user logs in, the client emits `join:workspace` with their authenticated `workspaceId`. The socket joins room `workspace:<workspaceId>`.
2. **Event Dispatch**:
   - `incident:created`: Emitted when an incident is declared. Responders receive immediate notifications without polling.
   - `incident:updated`: Emitted when status changes (e.g. Investigating -> Identified -> Monitoring -> Resolved).
   - `incident:comment`: Broadcasts new communication entries directly to active viewers.
   - `telemetry:tick`: Periodic stream delivering real-time CPU, memory, latency, and connection metrics.

---

## 4. Security Hardening

- **Transport Security**: Enforced HTTPS/WSS headers via `Helmet`.
- **Credential Protection**: Passwords salted and hashed with `bcryptjs` (work factor 10).
- **API Key Security**: Raw keys shown once to user upon creation; only SHA-256 digest saved in database.
- **Rate Limiting**: Multi-tiered rate limiters via `express-rate-limit`:
  - Standard API: 200 req / 15 min
  - Auth routes: 30 req / 15 min (brute force prevention)
- **Input Validation**: Strict schema enforcement using `Zod` on all request bodies and parameters.
- **CORS Protection**: Restricted origins configured via environment variables.

---

## 5. Observability & Telemetry

- **Prometheus Metrics**: Custom instrumentation via `prom-client`:
  - `pulsesync_http_requests_total`: Labeled by HTTP method, route, and status code.
  - `pulsesync_http_request_duration_seconds`: Histogram of endpoint latency.
  - `pulsesync_websocket_active_connections`: Gauge of live connected WebSocket clients.
  - `pulsesync_incidents_created_total`: Labeled by severity and service name.
- **Structured Logging**: `Winston` JSON logger in production; colorized console logger in development.
- **Probes**:
  - `/health/live`: Unconditional 200 OK for Kubernetes pod restarts.
  - `/health/ready`: Deep probe querying database connectivity (`SELECT 1`).
  - `/health/telemetry`: Process memory, heap usage, and platform specs.
