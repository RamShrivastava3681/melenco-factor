# Database Structure

Document control
- Document purpose: Describe the application data model, persistence approach, and related audit considerations.
- Prepared from repository state reviewed on 2026-06-11.
- Primary evidence sources:
  - `backend/src/data/dynamoClient.ts`
  - `backend/src/data/dynamoRepository.ts`
  - `backend/src/models/index.ts`
  - `backend/src/models/schemas.ts`
  - `backend/seed.ts`

## 1. Database platform

Current persistence implementation
- AWS DynamoDB is the primary database technology referenced in the backend
- Access is established through `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`
- The table name is supplied by the `DYNAMODB_TABLE` environment variable

Configuration dependency
- DynamoDB is treated as configured only when `AWS_REGION`, `DYNAMODB_TABLE`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` are present

## 2. Data modeling approach

Observed state
- The repository does not contain a standalone schema migration framework
- Data structures are primarily documented through TypeScript interfaces in `backend/src/models/`
- Seed data and route handlers provide additional evidence of stored attributes

Audit interpretation
- This application uses code-defined data contracts rather than DDL migrations
- The authoritative schema for review is therefore spread across model definitions, repository logic, and route serialization

## 3. Principal business entities

Entity records
- Supplier and buyer attributes are defined in `IEntity`
- Includes limits, risk profile, contact information, fee settings, and optional bank details

Transaction records
- Transaction attributes are defined in `ITransaction`
- Includes invoice data, supplier and buyer linkage, financial calculations, payout state, payment history, due dates, and settlement fields

NOA records
- Defined in `INOA`
- Includes transaction linkage, recipient details, status progression, access tracking, and captured signatory evidence

Framework agreement records
- Defined in `IFrameworkAgreement`
- Includes agreement metadata, delivery and acknowledgment status, and signatory evidence

Payout records
- Defined in `IPayoutRecord`
- Includes supplier, amount, bank details, status, references, and processing metadata

Operational and monitoring records
- Alerts, monitoring metrics, reports, audit-style structures, and sessions are defined in `backend/src/models/index.ts`

## 4. Key data domains represented in code

Master data
- Buyers
- Suppliers
- Fee and limit configurations

Transactional data
- Factoring transactions
- Payment history
- Disbursements
- Reserve management
- Open invoices

Operational data
- Notifications
- Monitoring alerts
- Risk indicators
- Report executions
- User sessions

Document-linked data
- S3 object keys for signed or generated documents
- Agreement and NOA document metadata

## 5. Sample high-value attributes for audit review

Identity and reference fields
- `entityId`
- `transactionId`
- `invoiceNumber`
- `agreementId`
- `noaId`
- `payoutId`

Financial fields
- `invoiceValue`
- `advanceAmount`
- `feeAmount`
- `reserveAmount`
- `netAmount`
- `paidAmount`

Control and status fields
- `status`
- `riskCategory`
- `healthStatus`
- `isRead`
- `isResolved`
- `createdAt`
- `updatedAt`

Sensitive or regulated fields
- Contact information
- Bank details
- Signature image data
- Photo data
- IP address and user agent metadata captured during signing flows

## 6. Seeding and test data

Observed utilities
- `backend/seed.ts`
- `backend/import-invoices.ts`

Audit note
- Seed scripts create or import sample records and should not be treated as production migration logic.

## 7. Backup and retention considerations

Not directly evidenced in the repository
- DynamoDB backup schedules
- Point-in-time recovery settings
- Export retention periods
- Deletion and archival policies

Recommended external evidence
- DynamoDB table configuration export
- Backup policy
- Recovery test evidence
- Data retention schedule approved by the business

## 8. Data integrity and audit trail observations

Implemented in data structures
- Extensive `createdAt` and `updatedAt` fields across models
- Payment history arrays on transactions
- Monitoring and resolution metadata on alerts
- Session- and audit-style interfaces defined in `backend/src/models/index.ts`

Not evidenced as enforced controls
- Database-level uniqueness constraints beyond application logic
- Immutable audit ledger implementation
- Centralized migration/version history

## 9. Known gaps and audit considerations

Current strengths
- Code-defined domain model is reasonably rich and reviewable
- Business-critical data fields are explicit in TypeScript
- Seed utilities help reviewers understand expected record shapes

Current limitations
- No standalone ERD or DynamoDB access-pattern document
- No table definition export in the repository
- No formal data classification matrix
- No retention policy artifact in the repository

Recommended companion artifacts
- Entity relationship or access-pattern diagram
- DynamoDB table and index export
- Data classification and retention register
- Backup and restore procedure evidence
