# API Documentation

Document control
- Document purpose: Summarize the currently implemented API surface and its control-relevant behavior.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `backend/src/index.ts`
  - `backend/src/routes/auth.ts`
  - `backend/src/routes/`
  - `frontend/src/config/api.ts`

## 1. API overview

Current backend runtime
- Default local port: `6767`
- Health endpoint: `/health`
- REST API namespace: `/api/*`
- WebSocket notifications endpoint: `/notifications`

Frontend integration defaults
- REST base path defaults to `/api`
- WebSocket path defaults to `/notifications`

## 2. Authentication model

Implemented behavior
- Login endpoint issues a JWT signed with `JWT_SECRET`
- Token verification is handled by a dedicated verification endpoint
- The frontend sends bearer tokens through `Authorization` headers when present in local storage

Primary evidence
- `backend/src/routes/auth.ts`
- `frontend/src/config/api.ts`

Audit note
- Authentication is currently implemented using environment-based demo credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) rather than a persistent user directory. This is a material limitation for production-control maturity and should be called out explicitly to reviewers.

## 3. Implemented route groups

The backend mounts the following route groups in `backend/src/index.ts`:
- `/api/auth`
- `/api/entities`
- `/api/transactions`
- `/api/dashboard`
- `/api/treasury`
- `/api/fee-limits`
- `/api/monitoring`
- `/api/reports`
- `/api/notifications`
- `/api/noa`
- `/api/currency`
- `/api/documents`

## 4. Key endpoints

Authentication
- `POST /api/auth/login`
- `GET /api/auth/verify`

Monitoring and health
- `GET /health`
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

Business route groups
- Entities, transactions, treasury, fee-limits, dashboard, reports, notifications, NOA, currency, and documents are implemented as separate Express routers under `backend/src/routes/`

## 5. Request and response conventions

Observed patterns
- JSON request bodies for create and update operations
- Common response shape often includes:
  - `success`
  - `message`
  - `data`
  - `timestamp`
- Error responses typically return HTTP 4xx or 5xx with a JSON body

Global behaviors from `backend/src/index.ts`
- JSON body limit: `10mb`
- Compression enabled
- Global rate limiting enabled
- Centralized error handler
- 404 JSON response for unknown endpoints

## 6. Security-relevant API controls

Implemented
- Helmet middleware
- CORS allowlist logic
- Express rate limiting
- JWT issue and verify endpoints

Not fully evidenced across all routes
- Consistent authorization middleware on every protected route
- Role-based access enforcement per endpoint
- Formal API schema validation beyond the login route

## 7. API dependencies

Data services
- DynamoDB via `backend/src/data/dynamoClient.ts`
- S3 via `backend/src/utils/s3.ts`

Supporting services
- Email transport via `nodemailer`
- PDF rendering via `puppeteer` and `@react-pdf/renderer`
- WebSocket notifications via `ws`

## 8. Audit evidence map

Direct evidence reviewers can inspect:
- Route registration: `backend/src/index.ts`
- Authentication logic: `backend/src/routes/auth.ts`
- Monitoring endpoints: `backend/src/routes/monitoring.ts`
- Notification endpoints: `backend/src/routes/notifications.ts`
- Frontend API consumer config: `frontend/src/config/api.ts`

## 9. Gaps and recommended next evidence

Not currently present in the repository:
- OpenAPI or Swagger specification
- Versioned Postman collection
- Endpoint ownership matrix
- Formal API deprecation/versioning policy

Recommended audit companion artifacts:
- Generated OpenAPI specification
- API authentication and authorization matrix
- Sample request and response payloads for key business flows
- Evidence of endpoint testing in CI or release signoff
