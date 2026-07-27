# System Architecture

Document control
- Document purpose: Describe the current application architecture and supporting components for audit and technical review.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `frontend/package.json`
  - `frontend/src/App.tsx`
  - `frontend/src/config/api.ts`
  - `backend/package.json`
  - `backend/src/index.ts`
  - `backend/src/routes/`
  - `backend/src/data/dynamoClient.ts`
  - `backend/src/utils/s3.ts`

## 1. Executive summary

The Melenco Factoring platform is a two-tier web application consisting of:
- A React + Vite single-page application in `frontend/`
- A Node.js + Express API service in `backend/`

The platform integrates with:
- AWS DynamoDB for transactional and master data persistence
- AWS S3 for document storage
- WebSocket notifications served by the backend at `/notifications`
- Email and PDF generation services implemented in backend routes

## 2. In-scope components

Application components currently visible in the repository:
- Presentation layer: React application in `frontend/src/`
- API layer: Express server in `backend/src/index.ts`
- Business logic and route handlers: `backend/src/routes/`
- Data access layer: `backend/src/data/`
- Shared domain models: `backend/src/models/`
- Document generation: `backend/src/documents/` and `backend/src/utils/pdfGenerator.tsx`

Out-of-scope for this repository:
- Cloud infrastructure definitions
- Reverse proxy or load balancer configuration
- Secrets manager configuration
- CI/CD pipeline definitions

## 3. Logical architecture

```text
User browser
  -> React SPA (frontend)
  -> HTTPS / API calls
Backend API (Express on Node.js)
  -> Route handlers and business logic
  -> WebSocket notifications endpoint
  -> DynamoDB access layer
  -> S3 document storage
  -> Email/PDF generation
AWS services
  -> DynamoDB
  -> S3
```

## 4. Runtime architecture

Frontend
- Built with Vite and React as defined in `frontend/package.json`
- Uses `/api` as the default REST base path and `/notifications` as the default WebSocket path through `frontend/src/config/api.ts`
- Includes authenticated and business workflow pages such as dashboard, entities, transactions, treasury, monitoring, reports, and framework agreement workflows

Backend
- Runs on Node.js 18+ as defined in `backend/package.json`
- Starts from `backend/src/index.ts`
- Exposes REST endpoints under `/api/*`
- Exposes a health endpoint at `/health`
- Hosts a WebSocket server on `/notifications`

Data and file services
- DynamoDB client initialization is implemented in `backend/src/data/dynamoClient.ts`
- S3 upload and retrieval helpers are implemented in `backend/src/utils/s3.ts`

## 5. Major subsystems

Authentication and session handling
- JWT issuance and verification are implemented in `backend/src/routes/auth.ts`
- The frontend stores and sends bearer tokens through `frontend/src/config/api.ts`

Core factoring operations
- Entity management: `backend/src/routes/entities.ts`
- Transaction lifecycle: `backend/src/routes/transactions.ts`
- Treasury operations: `backend/src/routes/treasury.ts`
- Fee limit management: `backend/src/routes/fee-limits.ts`
- Dashboard metrics: `backend/src/routes/dashboard.ts`
- Monitoring and risk views: `backend/src/routes/monitoring.ts`
- Reporting: `backend/src/routes/reports.ts`

Document and communication flows
- Document routes: `backend/src/routes/documents.tsx`
- Notice of Assignment workflows: `backend/src/routes/noa.ts`
- Email delivery via `nodemailer`
- PDF generation via `puppeteer` and `@react-pdf/renderer`

Real-time events
- Notification WebSocket server and broadcast helper are implemented in `backend/src/index.ts`
- Frontend notification client is implemented in `frontend/src/hooks/useNotifications.tsx`

## 6. Trust boundaries

Boundary 1: End user to frontend
- User interactions originate in the browser and are handled by the React SPA

Boundary 2: Frontend to backend
- REST traffic uses `/api/*`
- WebSocket traffic uses `/notifications`
- CORS restrictions are applied in `backend/src/index.ts`

Boundary 3: Backend to AWS services
- Backend uses AWS SDK clients for DynamoDB and S3
- Access depends on runtime environment variables for region, credentials, and resource names

Boundary 4: Backend to external communications
- Email delivery and PDF rendering are invoked from backend routes

## 7. Availability and resiliency characteristics

Observed implementation
- Health endpoint available at `/health`
- Structured logging via Winston
- Graceful shutdown handling for `SIGINT`
- Conditional fallback to mock data when DynamoDB is not configured

Audit note
- The repository does not currently contain infrastructure-as-code, autoscaling definitions, backup orchestration, or disaster recovery procedures. These should be documented outside the application repository if they exist.

## 8. Architecture evidence map

Key evidence a reviewer can inspect directly:
- Backend bootstrap and middleware: `backend/src/index.ts`
- API surface: `backend/src/routes/`
- Frontend API and WebSocket config: `frontend/src/config/api.ts`
- Data access bootstrap: `backend/src/data/dynamoClient.ts`
- File storage bootstrap: `backend/src/utils/s3.ts`
- Domain model definitions: `backend/src/models/`

## 9. Known gaps and audit considerations

Implemented and evidenced
- Separate frontend and backend codebases
- Defined API, notification, storage, and document-generation layers
- Runtime support for health checks, security middleware, and centralized application logging

Not evidenced in this repository
- Network topology diagrams
- Deployment topology diagrams
- Infrastructure-as-code
- Formal RTO/RPO targets
- Service dependency inventory maintained outside code

Recommended companion evidence for an audit pack
- Production deployment diagram
- Infrastructure inventory with owners
- Data flow diagram with trust boundaries
- Backup and recovery runbook
- Change management and release approval records
