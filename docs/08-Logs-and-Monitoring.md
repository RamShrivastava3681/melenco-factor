# Logs and Monitoring

Document control
- Document purpose: Describe current logging and monitoring capabilities evidenced by the application code and identify what additional operational evidence is required for audit readiness.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `backend/src/index.ts`
  - `backend/src/routes/monitoring.ts`
  - `backend/src/routes/notifications.ts`
  - `frontend/src/hooks/useNotifications.tsx`

## 1. Logging overview

Implemented in the backend
- Winston-based structured logging
- Console log output
- File log output to:
  - `../logs/error.log`
  - `../logs/combined.log`
- Request logging middleware for inbound HTTP traffic
- Centralized error logging in the global error handler

## 2. Monitoring endpoints

Implemented monitoring routes in `backend/src/routes/monitoring.ts`
- `GET /api/monitoring/health/overview`
- `GET /api/monitoring/health/transactions`
- `GET /api/monitoring/health/transactions/:id`
- `PUT /api/monitoring/health/transactions/:id`
- `GET /api/monitoring/alerts`
- `POST /api/monitoring/alerts`
- `PUT /api/monitoring/alerts/:id/read`
- `PUT /api/monitoring/alerts/:id/resolve`
- `POST /api/monitoring/alerts/bulk-resolve`
- `GET /api/monitoring/risk`
- `POST /api/monitoring/risk`
- `GET /api/monitoring/dashboard`
- `GET /api/monitoring/fees/summary`
- `POST /api/monitoring/send-to-treasury`

Health check endpoint
- `GET /health`

## 3. Real-time monitoring and notifications

Implemented behavior
- Backend hosts a WebSocket server at `/notifications`
- Notification broadcasts are supported through a shared broadcast helper
- Frontend subscribes to WebSocket notifications through `frontend/src/hooks/useNotifications.tsx`
- REST notification endpoints exist under `backend/src/routes/notifications.ts`

## 4. Current monitoring data characteristics

Observed limitations
- Several monitoring datasets in `backend/src/routes/monitoring.ts` are stored in memory
- Notification data in `backend/src/routes/notifications.ts` is also in-memory

Audit implication
- These monitoring features support application behavior and demos, but they should not be treated as durable audit logs or an immutable operational event store.

## 5. Alerting and dashboard capabilities

Implemented application-level capabilities
- Health summaries
- Aging analysis
- Risk indicator tracking
- Alert creation, resolution, and bulk resolution
- Fee summary reporting
- Real-time notification delivery

Not evidenced
- Integration with an external SIEM
- Pager or on-call alert routing
- Durable alert acknowledgment records outside process memory

## 6. Log retention and access control

Not directly evidenced in the repository
- Retention periods for log files
- Log rotation strategy
- Centralized log shipping
- Access control model for operational logs
- Tamper protection or immutability for security-relevant events

Recommended companion evidence
- Logging standard
- Retention schedule
- Central log platform screenshots or exports
- Access review records for operational dashboards and log stores

## 7. Privacy and sensitive data considerations

Observed concerns
- The system processes contact data, bank details, and signature-related information in business flows
- Logging configuration should be reviewed to ensure sensitive values are redacted before production use

Positive observation
- Structured logging is already in place, which makes field-level redaction easier to standardize

## 8. Audit-ready next steps

To make this area stronger for audit review, pair this document with:
- Log retention policy
- Evidence of centralized log aggregation
- Alert response runbook
- Incident escalation matrix
- Monitoring dashboard exports
- Proof of regular review for alerts and exceptions
