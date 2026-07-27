# Infrastructure Details

Document control
- Document purpose: Record the infrastructure dependencies that are evidenced by the application code and identify missing deployment evidence needed for audit readiness.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `backend/package.json`
  - `backend/src/index.ts`
  - `backend/src/data/dynamoClient.ts`
  - `backend/src/utils/s3.ts`
  - `frontend/package.json`

## 1. Infrastructure dependencies evidenced in code

Compute runtime
- Frontend build/runtime toolchain: Vite and React
- Backend runtime: Node.js 18+ and Express

Cloud service dependencies
- AWS DynamoDB
- AWS S3

Operational dependencies
- WebSocket support through `ws`
- Email transport through `nodemailer`
- PDF generation through `puppeteer` and `@react-pdf/renderer`

## 2. Environment-driven infrastructure configuration

Backend environment variables evidenced in `backend/.env.example`
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `NOA_FRONTEND_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AWS_REGION`
- `DYNAMODB_TABLE`
- `LOG_LEVEL`

Frontend environment variables evidenced in `frontend/.env.example`
- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_NAME`

Audit note
- The repository contains example configuration files, not production values or secret-management controls.

## 3. Network-facing surfaces

Backend
- REST API on the configured port, default `6767`
- Health endpoint at `/health`
- WebSocket notifications endpoint at `/notifications`

Frontend
- Served as a browser SPA
- Uses `/api` and `/notifications` by default, implying reverse-proxy or same-origin deployment is expected in production

## 4. Logging and runtime services

Observed in code
- Console logging
- File-based logging to `../logs/error.log` and `../logs/combined.log`
- Request logging middleware
- Global error handler

## 5. Security-related infrastructure assumptions

Implemented in application code
- CORS allowlist support
- Helmet middleware
- Global rate limiting

Expected but not evidenced in repository
- TLS certificate management
- WAF or edge filtering
- Load balancing
- Private networking or VPC design
- Secrets manager integration
- IAM role boundaries

## 6. Build and deployment artifacts

Observed
- Frontend and backend package manifests
- Backend TypeScript build script
- Prebuilt `dist/` output

Not observed
- Dockerfiles
- Kubernetes manifests
- ECS task definitions
- Terraform or CloudFormation
- CI/CD workflows

## 7. Availability and operations evidence still needed

To make this area audit-ready, a companion infrastructure pack should include:
- Production architecture diagram
- Environment inventory: dev, test, staging, production
- Compute hosting details
- Network diagram and ingress points
- Backup configuration for stateful services
- Secret storage and rotation process
- Patch management and OS ownership records

## 8. Current audit position

What is evidenced by code
- The application depends on AWS-managed data and storage services
- It is designed as a separate frontend and backend deployment
- It expects environment-driven configuration and supports health checks and logging

What is not evidenced by code alone
- How production is actually hosted
- How deployments are approved and promoted
- How infrastructure changes are controlled
- How secrets, certificates, and backups are managed
