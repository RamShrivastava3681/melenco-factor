# Source Code Access

Document control
- Document purpose: Explain how source code is organized, accessed, and reviewed for audit or due diligence.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `.git/`
  - `frontend/`
  - `backend/`
  - `docs/`

## 1. Repository overview

The repository is organized into two main application areas:
- `frontend/`: React + Vite user interface
- `backend/`: Node.js + Express API and supporting logic

Supporting folders observed in the repository:
- `docs/`: operational and audit documentation
- `backend/src/models/`: domain and response types
- `backend/src/data/`: data access utilities
- `backend/src/routes/`: API route handlers
- `frontend/src/__tests__/`: frontend automated tests

## 2. Access expectations for auditors or reviewers

The recommended audit access model is read-only access to:
- The Git repository
- A tagged release or agreed review branch
- Supporting non-code evidence such as infrastructure records, deployment records, and access control exports maintained outside this repository

Minimum useful review scope:
- Full repository clone or archive
- Commit history for the audit period
- Current dependency manifests:
  - `frontend/package.json`
  - `backend/package.json`

## 3. Source code structure

Frontend
- Application entry points: `frontend/src/main.tsx`, `frontend/src/App.tsx`
- API client configuration: `frontend/src/config/api.ts`
- Reusable components: `frontend/src/components/`
- Business pages: `frontend/src/pages/`

Backend
- Application bootstrap: `backend/src/index.ts`
- Authentication routes: `backend/src/routes/auth.ts`
- Business routes: `backend/src/routes/*.ts`
- Data access utilities: `backend/src/data/`
- Domain types: `backend/src/models/`
- Document generation and storage helpers: `backend/src/documents/`, `backend/src/utils/`

## 4. Build and run prerequisites

Frontend prerequisites
- Node.js compatible with the toolchain in `frontend/package.json`
- Install dependencies with `npm install`
- Development server via `npm run dev`
- Test execution via `npm run test`

Backend prerequisites
- Node.js 18 or later as declared in `backend/package.json`
- Install dependencies with `npm install`
- Development server via `npm run dev`
- Production build via `npm run build`
- Optional data seeding via `npm run seed`

## 5. Configuration files relevant to code review

Frontend
- `frontend/.env.example`
- `frontend/vite.config.ts`
- `frontend/eslint.config.js`

Backend
- `backend/.env.example`
- `backend/tsconfig.json`

## 6. Evidence of change-managed artifacts

Observed evidence
- Git metadata is present via `.git/`
- Compiled output exists in `frontend/dist/` and `backend/dist/`
- TypeScript source and generated JavaScript are both present in the backend tree

Audit note
- The repository alone does not prove branch protection, pull request approvals, or reviewer separation of duties. Those controls typically require exports from the Git hosting platform.

## 7. Recommended access-control evidence outside the repository

For an audit-ready package, accompany this document with:
- Repository membership export
- Permission model for developers, reviewers, and administrators
- Branch protection settings
- Pull request approval policy
- Change request and release approval records
- List of production deployers and service account permissions

## 8. Known gaps in the repository itself

Not observed in the current repository:
- `CODEOWNERS`
- `CONTRIBUTING.md`
- `SECURITY.md`
- CI workflow definitions under `.github/workflows/`

These are not blockers to understanding the codebase, but they are useful supporting controls for a formal audit trail.
