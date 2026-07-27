# Test Environment

Document control
- Document purpose: Describe the test-related assets visible in the repository and identify the remaining evidence required for an audit-ready test environment package.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `frontend/package.json`
  - `frontend/src/__tests__/`
  - `frontend/src/setupTests.ts`
  - `backend/package.json`
  - `backend/seed.ts`
  - `backend/.env.example`

## 1. Current test capability summary

Frontend
- Automated tests are configured with Vitest
- Existing tests are present under `frontend/src/__tests__/`
- Test setup is defined in `frontend/src/setupTests.ts`

Backend
- No dedicated automated backend test framework is declared in `backend/package.json`
- Backend validation and runtime behavior are currently reviewable primarily through source inspection and manual execution

Test data support
- `backend/seed.ts` provides seed-data capability for DynamoDB-backed environments
- `backend/import-invoices.ts` provides additional data import support

## 2. Environment configuration relevant to testing

Backend test-related configuration dependencies
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AWS_REGION`
- `DYNAMODB_TABLE`

Frontend test-related configuration dependencies
- `VITE_API_URL`
- `VITE_WS_URL`
- `VITE_ADMIN_EMAIL`
- `VITE_ADMIN_PASSWORD`
- `VITE_ADMIN_NAME`

## 3. Available automated tests

Observed frontend tests
- `frontend/src/__tests__/AddTransactionDialog.test.tsx`
- `frontend/src/__tests__/LateFeeHandlingDialog.test.tsx`

Observed frontend command
- `npm run test` from `frontend/package.json`

## 4. Test execution model

Frontend
- Unit or component tests can be executed locally using Vitest

Backend
- Development execution is supported through `npm run dev`
- Data setup is supported through `npm run seed`
- No repository-evidenced backend unit or integration test command was identified

## 5. Test data and isolation observations

Observed
- Seed utilities exist
- The backend can run with DynamoDB configured

Not evidenced
- Dedicated test database naming convention
- Automated teardown/reset strategy
- Data masking or anonymization procedure
- Repeatable integration environment provisioning

## 6. Audit-ready evidence still required

To support formal testing assurance, gather or add:
- Test strategy document
- Test case inventory mapped to requirements or critical workflows
- CI test run results
- Defect tracking evidence
- Regression signoff records
- UAT or release approval records
- Separate test credentials with least privilege

## 7. Current gaps

Visible gaps in the repository
- No backend automated test suite
- No end-to-end test suite
- No dedicated `TESTING.md`
- No CI workflow executing tests on commit or pull request

## 8. Audit interpretation

The repository demonstrates that frontend automated testing has started and that test data seeding utilities exist. It does not yet demonstrate a complete, controlled, multi-layer test environment suitable for strong audit reliance without additional evidence or implementation.
