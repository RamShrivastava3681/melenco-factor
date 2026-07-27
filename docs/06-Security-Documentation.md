# Security Documentation

Document control
- Document purpose: Summarize implemented security controls, material risks, and audit considerations visible in the application repository.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `backend/src/index.ts`
  - `backend/src/routes/auth.ts`
  - `backend/.env.example`
  - `frontend/src/config/api.ts`
  - `backend/src/utils/s3.ts`

## 1. Security posture summary

Implemented application-level controls
- HTTP security headers through Helmet
- CORS origin restrictions
- Global request rate limiting
- JWT-based authentication
- Structured logging through Winston
- Separation of environment configuration from source code via `.env.example` templates

Material limitations visible in code
- Authentication uses environment-defined demo credentials
- Password comparison is plaintext rather than hashed verification
- Authorization enforcement is not centrally evidenced across all route groups

These limitations should be disclosed explicitly in any audit or customer review.

## 2. Authentication

Implemented behavior
- `POST /api/auth/login` validates input and issues a JWT signed with `JWT_SECRET`
- `GET /api/auth/verify` validates bearer tokens

Evidence
- `backend/src/routes/auth.ts`

Audit observation
- The current login implementation reads a single admin credential pair from environment variables:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- This is acceptable for a development or demo environment, but it is not a production-grade identity control.

## 3. Authorization

Observed state
- The JWT payload includes a `role`
- Domain models define roles such as `admin`, `operations`, `treasury`, and `audit`

Not fully evidenced
- A shared authorization middleware
- Per-route role enforcement matrix
- Separation-of-duties controls in code

## 4. Secrets handling

Observed good practice
- Sensitive values are expected through environment variables rather than hardcoded in normal source paths

Not evidenced in repository
- Secret storage platform such as AWS Secrets Manager or Parameter Store
- Secret rotation schedule
- Break-glass or emergency access process

## 5. Transport and perimeter controls

Implemented in code
- CORS allowlist logic
- Rate limiting
- Security headers via Helmet

Expected externally
- HTTPS termination
- TLS certificate management
- Firewall or WAF policy
- DDoS mitigation

## 6. Data protection

Observed application behavior
- DynamoDB is used for business data
- S3 is used for document storage
- Sensitive business fields include contact information, bank details, signatures, photos, IP addresses, and user agents

Not directly evidenced
- S3 bucket encryption configuration
- DynamoDB encryption configuration
- Key management ownership
- Data retention and deletion controls

## 7. Logging and monitoring from a security perspective

Implemented
- Request logging
- Error logging
- Monitoring and alert routes in `backend/src/routes/monitoring.ts`

Security caution
- Application startup currently logs whether AWS credentials are loaded
- Logging of secret values is not observed, but production logging configuration should still be reviewed to ensure no tokens, passwords, or document payloads are emitted

## 8. Dependency and hardening posture

Security-related packages observed
- `helmet`
- `express-rate-limit`
- `jsonwebtoken`
- `bcryptjs`

Audit note
- The presence of security libraries is helpful, but audit evidence usually also requires:
  - dependency vulnerability scan outputs
  - patch cadence records
  - security review or penetration test evidence

## 9. Known security gaps requiring disclosure

High-priority gaps visible in code
- Demo-style credential model
- Plaintext password comparison
- No clearly centralized authorization middleware
- No repository-level `SECURITY.md`
- No evidence of automated SAST, SCA, or secret scanning in CI

## 10. Recommended companion evidence for an audit pack

- Production authentication architecture
- Access review records
- Secret management process
- Dependency scanning reports
- Vulnerability remediation logs
- Penetration test or application security assessment results
- Incident response contacts and escalation process
