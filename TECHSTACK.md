# Whizunik Factoring - Technology Stack Documentation

## 📋 Overview

Whizunik Factoring is a professional factoring operations portal built as a monorepo with separate backend and frontend applications. This document provides a comprehensive guide to all technologies used, their purposes, and where they are implemented.

---

## 🏗️ Backend Technology Stack

### Core Framework & Runtime
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Node.js** | >=18.0.0 | JavaScript runtime environment | `backend/` - Runtime for Express server |
| **Express.js** | ^4.18.2 | RESTful API framework | `backend/src/index.ts` - Main server initialization |
| **TypeScript** | ^5.3.3 | Static typing for JavaScript | `backend/src/**/*.ts` - All backend source files |
| **ts-node** | ^10.9.1 | TypeScript execution for Node.js | `backend/` - Development and script execution |

### Database & ORM
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **MongoDB** | (via Mongoose) | NoSQL database for document storage | `backend/src/models/schemas.ts` - Data persistence |
| **Mongoose** | ^9.1.5 | MongoDB object modeling toolkit | `backend/src/models/schemas.ts` - Schema definitions (Entities, Transactions, Framework Agreements, etc.) |

**MongoDB Collections & Models:**
- **Entity**: Stores supplier and buyer information with limits and risk assessment
- **Transaction**: Records factoring transactions with invoice details, fees, and reserves
- **FrameworkAgreement**: Stores agreement data with signing status and timestamps
- **Notification**: Real-time notification records
- **Reports**: Report configurations and executions
- **Alerts**: System and risk monitoring alerts

### Security & Authentication
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **jsonwebtoken (JWT)** | ^9.0.2 | JSON Web Token for authentication | `backend/src/routes/auth.ts` - Token generation & verification |
| **bcryptjs** | ^2.4.3 | Password hashing and encryption | `backend/src/routes/auth.ts` - Password comparison, `frontend/src/config/` - Client-side encryption |
| **Helmet** | ^7.1.0 | HTTP security headers middleware | `backend/src/index.ts` - Secures Express app with CSP, HSTS, etc. |
| **express-rate-limit** | ^7.1.5 | Rate limiting middleware | `backend/src/index.ts` - DDoS protection and API abuse prevention |
| **express-validator** | ^7.0.1 | Input validation & sanitization | `backend/src/routes/auth.ts` - Email and password validation |
| **crypto-js** | ^4.2.0 | Cryptographic library | `backend/src/` - Data encryption/decryption for sensitive information |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing | `backend/src/index.ts` - Configure frontend-backend communication |

### Cloud & Storage
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **AWS SDK (S3)** | ^3.1029.0 | Amazon S3 client for cloud storage | `backend/src/utils/s3.ts` - Upload/download documents, PDFs, invoices |
| **AWS S3 Request Presigner** | ^3.1029.0 | Generate pre-signed URLs | `backend/src/utils/s3.ts` - Secure temporary access to S3 objects |

**S3 Integration Details:**
- Stores framework agreements, invoices, PDFs, and supporting documents
- Pre-signed URLs for secure file access without exposing credentials
- Document sanitization before upload

### File & Data Processing
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Multer** | ^1.4.5-lts.1 | File upload middleware | `backend/src/routes/entities.ts`, `transactions.ts` - Handle multipart form data |
| **XLSX** | ^0.18.5 | Excel file parsing & generation | `backend/` - Import invoices from Excel, generate reports |
| **pdf-parse** | ^2.4.5 | PDF text extraction | `backend/` - Extract invoice data from PDFs |
| **Puppeteer** | ^24.43.1 | Headless browser automation | `backend/src/utils/pdfGenerator.tsx` - Generate PDF documents server-side |
| **@react-pdf/renderer** | ^3.4.5 | React-based PDF generation | `backend/src/utils/pdfGenerator.tsx`, `docs/legal/render-framework-pdf.tsx` - Create framework agreements, NOAs, acknowledgements |

### Email & Communications
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Nodemailer** | ^8.0.1 | Email sending library | `backend/src/routes/documents.tsx`, `noa.ts` - Send framework agreements, NOAs, notifications |

**Email Features:**
- SMTP configuration for email delivery
- HTML email templates with framework agreement data
- Attachment support for PDFs
- Node of Acknowledgement (NOA) delivery

### Real-time Communication
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **WebSocket (ws)** | ^8.14.2 | Real-time bidirectional communication | `backend/src/index.ts` - Push notifications, live updates |
| **HTTP Server** | (Node.js native) | WebSocket server support | `backend/src/index.ts` - Create HTTP server for WebSocket integration |

**WebSocket Implementation:**
- Path: `/notifications`
- Broadcast notifications to all connected clients
- Connection management and error handling

### Data Processing & Utilities
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **UUID** | ^13.0.0 | Unique identifier generation | `backend/src/` - Generate unique transaction, entity, and document IDs |
| **dotenv** | ^16.3.1 | Environment variable management | `backend/src/index.ts` - Load `.env` configuration |
| **compression** | ^1.7.4 | Gzip compression middleware | `backend/src/index.ts` - Compress HTTP responses for faster transfer |

### Logging & Monitoring
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Winston** | ^3.11.0 | Structured logging library | `backend/src/index.ts` - Log application events, errors, and transactions |

**Logging Configuration:**
- File logging: `../logs/error.log` and `../logs/combined.log`
- Console logging for development
- Structured JSON format with timestamps
- Service-level metadata

### Development Tools
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Nodemon** | ^3.0.2 | Auto-restart Node.js during development | `backend/package.json` - Run dev server with `npm run dev` |
| **rimraf** | ^5.0.5 | Cross-platform file deletion | `backend/package.json` - Clean build artifacts |

### Build & Compilation
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **TypeScript Compiler (tsc)** | ^5.3.3 | Compile TypeScript to JavaScript | `backend/package.json` - Run `npm run build` for production |

---

## 🎨 Frontend Technology Stack

### Core Framework & Runtime
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **React** | ^18.3.1 | UI library for building components | `frontend/src/` - Component-based architecture |
| **React DOM** | ^18.3.1 | React rendering to DOM | `frontend/src/main.tsx` - Main entry point |
| **TypeScript** | ^5.8.3 | Static typing for JavaScript | `frontend/src/**/*.tsx` - All React components |
| **Vite** | ^5.4.19 | Next-generation build tool | `frontend/vite.config.ts` - Bundle and dev server |

### State Management & Data Fetching
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **TanStack Query (React Query)** | ^5.83.0 | Server state management & caching | `frontend/src/` - API data fetching, caching, synchronization |
| **React Hook Form** | ^7.61.1 | Performant form state management | `frontend/src/components/forms/` - Form handling across dashboard |

### UI Component Libraries & Styling
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Radix UI Components** | Various | Unstyled, accessible component primitives | `frontend/src/components/ui/` - Dialog, Select, Checkbox, Toast, etc. |
| **Tailwind CSS** | ^3.4.17 | Utility-first CSS framework | `frontend/src/**/*.tsx` - Styling all components |
| **tailwind-merge** | ^2.6.0 | Merge Tailwind CSS classes | `frontend/src/lib/utils.ts` - Resolve class conflicts |
| **tailwindcss-animate** | ^1.0.7 | Animation plugin for Tailwind | `frontend/src/` - Smooth transitions and animations |
| **Class Variance Authority** | ^0.7.1 | CSS-in-JS variant management | `frontend/src/components/` - Component style variants |
| **clsx** | ^2.1.1 | Conditional CSS class names | `frontend/src/` - Dynamic class application |

**Radix UI Components Used:**
- Accordion, Alert Dialog, Aspect Ratio
- Avatar, Checkbox, Collapsible
- Context Menu, Dialog, Dropdown Menu
- Hover Card, Label, Menubar
- Navigation Menu, Popover, Progress
- Radio Group, Scroll Area, Select
- Separator, Slider, Switch, Tabs
- Toggle, Tooltip, Toast

### Routing & Navigation
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **React Router DOM** | ^6.30.1 | Client-side routing | `frontend/src/components/ProtectedRoute.tsx` - Navigation between pages |

**Routes Implemented:**
- `/login` - Login page
- `/dashboard` - Main dashboard with KPIs
- `/transactions` - Transaction management
- `/entities` - Supplier/Buyer management
- `/treasury` - Treasury management
- `/reports` - Report generation
- `/monitoring` - Alert and risk monitoring
- `/fee-limits` - Fee configuration
- `/noa` - Notice of Acknowledgement management
- `/settings` - System settings
- `/framework-agreement` - Framework agreement management

### Forms & Validation
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Zod** | ^3.25.76 | TypeScript-first schema validation | `frontend/src/` - Form and API response validation |
| **@hookform/resolvers** | ^3.10.0 | React Hook Form + Zod integration | `frontend/src/components/forms/` - Form validation |
| **express-validator** | ^7.0.1 | Backend validation | `backend/src/routes/auth.ts` - Server-side input validation |

### Data Visualization
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Recharts** | ^2.15.4 | React charting library | `frontend/src/components/dashboard/` - Charts and graphs (line, bar, pie) |

**Dashboard Charts:**
- Transaction volume trends
- Revenue analytics
- Risk distribution
- Fee breakdowns
- Payout patterns

### Date & Time Management
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **date-fns** | ^3.6.0 | Modern date utility library | `frontend/src/` - Format dates, calculate periods, comparisons |
| **React Day Picker** | ^8.10.1 | Accessible date picker component | `frontend/src/components/ui/` - Calendar date selection |

### UI Notifications & Alerts
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Sonner** | ^1.7.4 | Toast notification system | `frontend/src/` - Display success, error, and info messages |
| **@radix-ui/react-toast** | ^1.2.14 | Toast notification primitives | `frontend/src/components/NotificationCenter.tsx` |

### Advanced UI Components
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Embla Carousel** | ^8.6.0 | Carousel/slider component | `frontend/src/components/` - Image and content carousels |
| **React Resizable Panels** | ^2.1.9 | Resizable panel layout | `frontend/src/components/` - Flexible dashboard layouts |
| **Vaul** | ^0.9.9 | Drawer/sidebar component | `frontend/src/components/layout/` - Slide-out panels |
| **cmdk** | ^1.1.1 | Command/search menu | `frontend/src/components/` - Command palette functionality |
| **input-otp** | ^1.4.2 | OTP input component | `frontend/src/components/` - Multi-factor authentication |
| **Lucide React** | ^0.462.0 | Icon library | `frontend/src/components/` - Consistent icon usage |

### Theme Management
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **next-themes** | ^0.3.0 | Dark mode & theme switching | `frontend/src/` - Light/dark theme support |

### PDF Generation (Frontend)
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **@react-pdf/renderer** | ^4.5.1 | React-based PDF rendering | `frontend/src/` - Generate downloadable PDFs |

### HTTP Client & API Communication
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Fetch API** | (Built-in) | Native HTTP requests | `frontend/src/config/api.ts` - API communication |

### Development & Build Tools
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Vite** | ^5.4.19 | Lightning-fast build tool | `frontend/vite.config.ts` - Development and production builds |
| **@vitejs/plugin-react** | ^4.7.0 | React Fast Refresh plugin | `frontend/vite.config.ts` - Hot module replacement |
| **PostCSS** | ^8.5.6 | CSS transformation tool | `frontend/postcss.config.js` - Tailwind CSS processing |
| **Autoprefixer** | ^10.4.21 | Add vendor prefixes to CSS | `frontend/postcss.config.js` - Cross-browser compatibility |
| **ESLint** | ^9.32.0 | Code quality linting | `frontend/` - Code style enforcement |
| **TypeScript ESLint** | ^8.38.0 | TypeScript linting rules | `frontend/eslint.config.js` |
| **tsx** | ^4.19.2 | TypeScript execution | `frontend/package.json` - Run TypeScript scripts |

### Testing
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Vitest** | ^4.0.18 | Unit testing framework | `frontend/` - Fast unit tests |
| **@testing-library/react** | ^16.3.2 | React component testing utilities | `frontend/src/__tests__/` - Component tests |
| **@testing-library/jest-dom** | ^6.9.1 | Jest DOM matchers | `frontend/src/setupTests.ts` - DOM assertions |
| **@testing-library/user-event** | ^14.6.1 | User interaction simulation | `frontend/src/__tests__/` - Simulate user actions |
| **jsdom** | ^28.1.0 | JavaScript implementation of web APIs | `frontend/vite.config.ts` - DOM testing environment |

**Test Files Located At:**
- `frontend/src/__tests__/AddTransactionDialog.test.tsx`
- `frontend/src/__tests__/LateFeeHandlingDialog.test.tsx`

### Authentication & Security
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **jsonwebtoken** | ^9.0.2 | JWT token management | `frontend/src/hooks/useAuth.tsx` - Token storage and validation |
| **bcryptjs** | ^2.4.3 | Password hashing | `frontend/src/` - Client-side encryption |

### Utilities
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **compression** | ^1.7.5 | Response compression | `frontend/` - Reduce bundle size |
| **helmet** | ^7.1.0 | Security headers | `frontend/` - HTTP security |
| **express-rate-limit** | ^7.4.2 | API rate limiting | `frontend/` - Prevent abuse |
| **mongoose** | ^8.8.4 | Database modeling | `frontend/` - Shared models |
| **nodemailer** | ^6.9.16 | Email sending | `frontend/` - Email notifications |
| **winston** | ^3.17.0 | Logging | `frontend/` - Application logging |

### Monorepo Management
| Technology | Version | Purpose | Usage Location |
|------------|---------|---------|-----------------|
| **Concurrently** | ^9.1.0 | Run multiple processes in parallel | `frontend/package.json` - Dev and build scripts |

---

## 🔌 API Endpoints Documentation

### Authentication APIs

#### POST `/api/auth/login`
**Purpose:** User login with email and password
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin"
    }
  }
}
```
**Used in:** `frontend/src/pages/Login.tsx`, Authentication flow

#### GET `/api/auth/verify`
**Purpose:** Verify JWT token validity
**Headers:** `Authorization: Bearer <token>`
**Response:** User data if valid, error if invalid
**Used in:** `frontend/src/hooks/useAuth.tsx`, Protected routes

---

### Entity Management APIs

#### GET `/api/entities`
**Purpose:** Fetch all entities (suppliers and buyers)
**Query Parameters:** Pagination, filters, search
**Response:** Array of entity objects with details
**Used in:** `frontend/src/pages/Entities.tsx`, Entity listings

#### GET `/api/entities/:id`
**Purpose:** Fetch a specific entity by ID
**Response:** Single entity object with all details, limits, and risk info
**Used in:** `EntityDetailsDialog.tsx`, Entity detail views

#### GET `/api/entities/buyers/list`
**Purpose:** Fetch list of all buyers
**Response:** Array of buyer entities
**Used in:** Transaction creation forms

#### GET `/api/entities/suppliers/list`
**Purpose:** Fetch list of all suppliers
**Response:** Array of supplier entities
**Used in:** Transaction creation forms

#### GET `/api/entities/suppliers/:id`
**Purpose:** Fetch supplier-specific details and limits
**Response:** Supplier data with transaction limits per supplier
**Used in:** Supplier management pages

#### POST `/api/entities`
**Purpose:** Create new entity (supplier or buyer)
**Request Body:** Entity data with agreement framework document
**File Upload:** `agreementFrameworkDocument` (multipart/form-data)
**Response:** Created entity object with ID
**Used in:** `EntityDetailsDialog.tsx`, Onboarding flow

#### PUT `/api/entities/:id`
**Purpose:** Update existing entity information
**Request Body:** Updated entity fields
**Response:** Updated entity object
**Used in:** Entity editing

#### PUT `/api/entities/:id/limits`
**Purpose:** Update entity credit limits and supplier-specific limits
**Request Body:**
```json
{
  "creditLimit": 100000,
  "supplierLimits": [
    {
      "supplierId": "supplier_id",
      "supplierName": "Supplier Name",
      "transactionLimit": 50000
    }
  ]
}
```
**Response:** Updated limits
**Used in:** Fee and Limits management

#### DELETE `/api/entities/:id`
**Purpose:** Delete an entity
**Response:** Success message
**Used in:** Entity cleanup

---

### Transaction Management APIs

#### GET `/api/transactions`
**Purpose:** Fetch all transactions with filtering
**Query Parameters:** Status, date range, entity filters, pagination
**Response:** Paginated transaction list with details
**Used in:** `frontend/src/pages/Transactions.tsx`

#### GET `/api/transactions/recent`
**Purpose:** Fetch recently created transactions
**Response:** Array of recent transaction objects
**Used in:** Dashboard widget, recent activity

#### POST `/api/transactions`
**Purpose:** Create new factoring transaction
**Request Body:**
```json
{
  "invoiceNumber": "INV-001",
  "invoiceDate": "2026-05-01",
  "invoiceValue": 10000,
  "supplierId": "supplier_id",
  "buyerId": "buyer_id",
  "advanceRate": 0.80,
  "description": "Transaction description",
  "buyerEmail": "buyer@example.com",
  "sendNOA": true,
  "supplierPaymentTerms": "Net 30"
}
```
**File Upload:** Supporting documents (invoices, contracts)
**Response:** Created transaction object with fees calculated
**Used in:** `frontend/src/pages/Transactions.tsx`, Add transaction dialog

#### DELETE `/api/transactions/:id`
**Purpose:** Delete a transaction
**Response:** Success message
**Used in:** Transaction cleanup

---

### Dashboard APIs

#### GET `/api/dashboard/kpis`
**Purpose:** Fetch key performance indicators
**Response:**
```json
{
  "totalTransactions": 150,
  "totalValue": 1500000,
  "activeSuppliers": 45,
  "activeBuyers": 30,
  "pendingApprovals": 5,
  "totalFees": 75000
}
```
**Used in:** Dashboard KPI cards

#### GET `/api/dashboard/charts`
**Purpose:** Fetch data for dashboard charts
**Response:** Chart data for transactions, revenue, fees, risk distribution
**Used in:** Dashboard visualizations (Recharts)

---

### Treasury Management APIs

#### GET `/api/treasury/metrics`
**Purpose:** Fetch treasury metrics and balances
**Response:** Cash balances, reserves, pending payouts
**Used in:** Treasury dashboard

#### GET `/api/treasury/dashboard-metrics`
**Purpose:** Treasury-specific dashboard metrics
**Response:** Detailed treasury analytics
**Used in:** Treasury page

#### GET `/api/treasury/dashboard-alerts`
**Purpose:** Treasury-related alerts and notifications
**Response:** Array of alert objects
**Used in:** Treasury alerts widget

#### GET `/api/treasury/invoices`
**Purpose:** Fetch all invoices in treasury system
**Query Parameters:** Status, date range, filters
**Response:** Invoice list with payment status
**Used in:** Invoice management

#### GET `/api/treasury/open-invoices`
**Purpose:** Fetch open/pending invoices
**Response:** Array of open invoice objects
**Used in:** Open invoice tracking

#### GET `/api/treasury/open-invoices/:invoiceId`
**Purpose:** Fetch specific open invoice details
**Response:** Invoice details with payment terms and reserve info
**Used in:** Invoice detail view

#### POST `/api/treasury/open-invoices/:invoiceId/payment`
**Purpose:** Record payment for open invoice
**Request Body:** Payment amount, payment method, date
**Response:** Updated invoice with payment status
**Used in:** Payment processing

#### DELETE `/api/treasury/open-invoices/:invoiceId`
**Purpose:** Delete/remove open invoice
**Response:** Success message
**Used in:** Invoice cleanup

#### GET `/api/treasury/closed-invoices`
**Purpose:** Fetch closed/completed invoices
**Response:** Array of closed invoice objects
**Used in:** Closed invoice reports

#### GET `/api/treasury/open-invoices/:invoiceId/closure-report`
**Purpose:** Generate closure report for open invoice
**Response:** Detailed closure report PDF
**Used in:** Invoice closure documentation

#### GET `/api/treasury/supplier-summary`
**Purpose:** Fetch supplier-wise invoice summary
**Response:** Summary by supplier with totals
**Used in:** Treasury analytics

#### GET `/api/treasury/incoming-payments`
**Purpose:** Track incoming payments from buyers
**Response:** Payment list with dates and amounts
**Used in:** Cash flow management

#### GET `/api/treasury/payouts`
**Purpose:** Fetch payout records
**Response:** Array of supplier payouts
**Used in:** Payout tracking

#### POST `/api/treasury/payouts`
**Purpose:** Create new payout
**Request Body:** Supplier ID, amount, payment method
**Response:** Created payout record
**Used in:** Payout creation

#### GET `/api/treasury/invoices/:id`
**Purpose:** Fetch specific invoice details
**Response:** Complete invoice information
**Used in:** Invoice detail view

#### PUT `/api/treasury/invoices/:id/payment`
**Purpose:** Update invoice payment information
**Request Body:** Payment details
**Response:** Updated invoice
**Used in:** Payment tracking

#### POST `/api/treasury/invoices/:id/close`
**Purpose:** Mark invoice as closed
**Response:** Closed invoice object
**Used in:** Invoice closure

#### POST `/api/treasury/payout`
**Purpose:** Process supplier payout
**Request Body:** Payout details
**Response:** Payout confirmation
**Used in:** Payout processing

#### GET `/api/treasury/payout-history`
**Purpose:** Fetch historical payout records
**Response:** Array of past payouts
**Used in:** Historical analysis

#### GET `/api/treasury/payout/:payoutId/acknowledgement`
**Purpose:** Generate payout acknowledgement document
**Response:** PDF acknowledgement
**Used in:** Documentation

#### POST `/api/treasury/pay-reserve`
**Purpose:** Pay from reserved amount
**Request Body:** Reserve details, payment info
**Response:** Transaction confirmation
**Used in:** Reserve payment processing

#### POST `/api/treasury/open-invoices/:invoiceId/release-reserves`
**Purpose:** Release reserved funds for invoice
**Request Body:** Release details
**Response:** Release confirmation
**Used in:** Reserve release

---

### Fee & Limits APIs

#### GET `/api/fee-limits/fees`
**Purpose:** Fetch all fee configurations
**Response:** Array of fee structure objects
**Used in:** Fee management page

#### GET `/api/fee-limits/fees/:id`
**Purpose:** Fetch specific fee configuration
**Response:** Fee structure details
**Used in:** Fee detail view

#### POST `/api/fee-limits/fees`
**Purpose:** Create new fee configuration
**Request Body:** Fee details (processing, factoring, setup fees)
**Response:** Created fee object
**Used in:** Fee setup

#### PUT `/api/fee-limits/fees/:id`
**Purpose:** Update fee configuration
**Request Body:** Updated fee values
**Response:** Updated fee object
**Used in:** Fee modification

#### DELETE `/api/fee-limits/fees/:id`
**Purpose:** Delete fee configuration
**Response:** Success message
**Used in:** Fee cleanup

#### GET `/api/fee-limits/limits`
**Purpose:** Fetch credit limits
**Response:** Array of limit objects
**Used in:** Limits management

#### POST `/api/fee-limits/limits`
**Purpose:** Create new credit limit
**Request Body:** Entity ID, limit amount, limits per supplier
**Response:** Created limit object
**Used in:** Limit creation

#### PUT `/api/fee-limits/limits/:id`
**Purpose:** Update credit limit
**Request Body:** Updated limit values
**Response:** Updated limit object
**Used in:** Limit modification

#### POST `/api/fee-limits/fees/calculate`
**Purpose:** Calculate fees for a transaction
**Request Body:** Transaction details (amount, days, rate)
**Response:**
```json
{
  "processingFee": 500,
  "factoringFee": 1000,
  "setupFee": 200,
  "totalFee": 1700
}
```
**Used in:** Transaction creation preview

#### POST `/api/fee-limits/limits/check`
**Purpose:** Check if transaction exceeds limits
**Request Body:** Entity ID, transaction amount
**Response:** Validation result with available limit
**Used in:** Limit validation

#### POST `/api/fee-limits/preview`
**Purpose:** Preview full transaction with all fees
**Request Body:** Transaction and entity details
**Response:** Complete fee breakdown and net amount
**Used in:** Transaction preview dialog

---

### Notification APIs

#### GET `/api/notifications`
**Purpose:** Fetch user notifications
**Response:** Array of notification objects
**Used in:** Notification Center, `frontend/src/components/NotificationCenter.tsx`

#### PATCH `/api/notifications/:id/read`
**Purpose:** Mark notification as read
**Response:** Updated notification
**Used in:** Notification management

#### PATCH `/api/notifications/mark-all-read`
**Purpose:** Mark all notifications as read
**Response:** Success message
**Used in:** Bulk notification management

#### POST `/api/notifications`
**Purpose:** Create new notification
**Request Body:** Message, type, recipient
**Response:** Created notification
**Used in:** System-triggered notifications

**Real-time WebSocket:**
- Path: `/notifications` (WebSocket)
- Events: Transaction created, payment received, payout processed, alerts
- Used in:** Real-time notification push to frontend

---

### Notice of Acknowledgement (NOA) APIs

#### POST `/api/noa/send`
**Purpose:** Send NOA to buyer via email
**Request Body:** Transaction ID, buyer email, agreement data
**Response:** Sent NOA record with token
**Used in:** `frontend/src/pages/NOAPage.tsx`, Send NOA flow

#### GET `/api/noa/signed`
**Purpose:** Fetch all signed NOAs
**Response:** Array of signed NOA records
**Used in:** NOA history

#### GET `/api/noa/:token`
**Purpose:** Fetch NOA for signing (via unique token)
**Response:** NOA document data
**Used in:** NOA signing page (public link)

#### POST `/api/noa/:token/sign`
**Purpose:** Sign NOA with buyer signature
**Request Body:** Signature data, timestamp
**Response:** Signed NOA confirmation
**Used in:** NOA signing completion

#### GET `/api/noa/:token/pdf`
**Purpose:** Generate signed NOA PDF
**Response:** PDF file download
**Used in:** NOA document download

#### GET `/api/noa/status/:transactionId`
**Purpose:** Check NOA signing status for transaction
**Response:** Status object (pending/signed/expired)
**Used in:** Transaction status tracking

---

### Reports APIs

#### GET `/api/reports/templates`
**Purpose:** Fetch available report templates
**Response:** Array of report template objects
**Used in:** Report selection page

#### GET `/api/reports/configurations`
**Purpose:** Fetch report configurations
**Response:** Array of configured reports
**Used in:** Report management

#### POST `/api/reports/configurations`
**Purpose:** Create new report configuration
**Request Body:** Report name, template, filters
**Response:** Created configuration
**Used in:** Report setup

#### GET `/api/reports/executions`
**Purpose:** Fetch report execution history
**Response:** Array of past report executions
**Used in:** Report history

#### POST `/api/reports/configurations/:reportId/execute`
**Purpose:** Execute a specific report
**Request Body:** Filter parameters, date range
**Response:** Report execution ID and data
**Used in:** Generate report

#### GET `/api/reports/executions/:executionId/download`
**Purpose:** Download report as file (Excel/PDF)
**Response:** File download
**Used in:** Report export

#### GET `/api/reports/templates/:templateId/download`
**Purpose:** Download report template
**Response:** Template file
**Used in:** Template export

#### GET `/api/reports/filter-options`
**Purpose:** Fetch available filter options for reports
**Response:** Filter options by category (date, entity, status, etc.)
**Used in:** Report filter UI

#### GET `/api/reports/transactions`
**Purpose:** Generate transaction report
**Query Parameters:** Filters, date range
**Response:** Transaction data for report
**Used in:** Transaction reports

#### GET `/api/reports/compliance`
**Purpose:** Generate compliance report
**Response:** Compliance metrics and data
**Used in:** Compliance reporting

#### GET `/api/reports/risk`
**Purpose:** Generate risk analysis report
**Response:** Risk assessment data
**Used in:** Risk reports

#### GET `/api/reports/performance`
**Purpose:** Generate performance report
**Response:** Performance metrics
**Used in:** Performance analytics

#### GET `/api/reports/financial`
**Purpose:** Generate financial report
**Response:** Financial statements and metrics
**Used in:** Financial reporting

#### GET `/api/reports/entities`
**Purpose:** Generate entity report
**Response:** Entity data and analytics
**Used in:** Entity reporting

---

### Currency APIs

#### GET `/api/currency/rates`
**Purpose:** Fetch current exchange rates
**Response:** Exchange rates for USD, EUR, GBP
**Used in:** Multi-currency transactions, Dashboard

---

### Monitoring & Alerts APIs

#### GET `/api/monitoring/health/overview`
**Purpose:** Get system health overview
**Response:** Health status of all components
**Used in:** System monitoring dashboard

#### GET `/api/monitoring/health/transactions`
**Purpose:** Get transaction health metrics
**Response:** Transaction processing status
**Used in:** Transaction monitoring

#### GET `/api/monitoring/health/transactions/:id`
**Purpose:** Get specific transaction health
**Response:** Detailed transaction status
**Used in:** Transaction health details

#### PUT `/api/monitoring/health/transactions/:id`
**Purpose:** Update transaction health status
**Request Body:** Health status updates
**Response:** Updated status
**Used in:** Status management

#### GET `/api/monitoring/alerts`
**Purpose:** Fetch system alerts
**Response:** Array of alert objects
**Used in:** `frontend/src/pages/Monitoring.tsx`, Alert center

#### POST `/api/monitoring/alerts`
**Purpose:** Create new alert
**Request Body:** Alert details
**Response:** Created alert
**Used in:** Alert creation

#### PUT `/api/monitoring/alerts/:id/read`
**Purpose:** Mark alert as read
**Response:** Updated alert
**Used in:** Alert management

#### PUT `/api/monitoring/alerts/:id/resolve`
**Purpose:** Resolve alert
**Request Body:** Resolution details
**Response:** Resolved alert
**Used in:** Alert resolution

#### POST `/api/monitoring/alerts/bulk-resolve`
**Purpose:** Resolve multiple alerts at once
**Request Body:** Array of alert IDs
**Response:** Bulk resolution confirmation
**Used in:** Batch alert management

#### GET `/api/monitoring/risk`
**Purpose:** Fetch risk assessment data
**Response:** Risk metrics and scores
**Used in:** Risk monitoring

#### POST `/api/monitoring/risk`
**Purpose:** Create risk assessment
**Request Body:** Entity ID, risk details
**Response:** Created risk record
**Used in:** Risk tracking

#### GET `/api/monitoring/dashboard`
**Purpose:** Get monitoring dashboard data
**Response:** Comprehensive monitoring metrics
**Used in:** Monitoring page

#### GET `/api/monitoring/fees/summary`
**Purpose:** Get fee collection summary
**Response:** Fee statistics and metrics
**Used in:** Fee analytics

#### POST `/api/monitoring/send-to-treasury`
**Purpose:** Move transaction to treasury
**Request Body:** Transaction ID
**Response:** Transfer confirmation
**Used in:** Transaction workflow

---

### Framework Agreement APIs

#### Document Routes (via `/api/documents`)
**Purpose:** Handle framework agreement generation, signing, and distribution
**Features:**
- Generate framework agreement PDFs
- Send agreements via email
- Track agreement signing status
- Store signed documents in S3

---

## 🗄️ Database Schema Overview

### Entity Collection
```json
{
  "entityId": "string",
  "name": "string",
  "type": "supplier|buyer",
  "status": "active|inactive|suspended",
  "riskScore": "number",
  "creditLimit": "number",
  "currency": "USD|EUR|GBP",
  "bankDetails": { "accountNumber", "ifscCode", "swiftCode" },
  "contactInfo": { "email", "phone", "address" },
  "agreementFrameworkDocumentKey": "string (S3)"
}
```

### Transaction Collection
```json
{
  "transactionId": "string",
  "invoiceId": "string",
  "supplierId": "string",
  "buyerId": "string",
  "invoiceValue": "number",
  "advanceAmount": "number",
  "feeAmount": "number",
  "reserveAmount": "number",
  "status": "pending|approved|funded|closed",
  "supportingDocuments": ["string (S3 keys)"]
}
```

### Framework Agreement Collection
```json
{
  "agreementId": "string",
  "token": "string",
  "buyerName": "string",
  "sellerName": "string",
  "agreementData": "object",
  "status": "pending|signed|expired",
  "acknowledgedAt": "date",
  "createdAt": "date"
}
```

---

## 📁 Project Structure

```
whizunik-factoring/
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Express server & WebSocket setup
│   │   ├── routes/
│   │   │   ├── auth.ts                 # Authentication endpoints
│   │   │   ├── entities.ts             # Entity management
│   │   │   ├── transactions.ts         # Transaction APIs
│   │   │   ├── treasury.ts             # Treasury management
│   │   │   ├── fee-limits.ts           # Fee & limit configuration
│   │   │   ├── reports.ts              # Report generation
│   │   │   ├── notifications.ts        # Notification system
│   │   │   ├── noa.ts                  # NOA management
│   │   │   ├── monitoring.ts           # Alerts & monitoring
│   │   │   ├── documents.tsx           # Document/PDF generation
│   │   │   ├── dashboard.ts            # Dashboard data
│   │   │   ├── currency.ts             # Exchange rates
│   │   │   └── treasury-management.ts  # Advanced treasury
│   │   ├── models/
│   │   │   ├── schemas.ts              # Mongoose schemas
│   │   │   └── index.ts                # Model exports
│   │   ├── utils/
│   │   │   ├── s3.ts                   # AWS S3 operations
│   │   │   ├── pdfGenerator.tsx        # PDF generation
│   │   │   └── footer-template.html    # PDF footer
│   │   └── documents/
│   │       ├── framework-agreement.html
│   │       └── frameworkAgreement.tsx
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                    # React entry point
│   │   ├── App.tsx                     # Root component
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Entities.tsx
│   │   │   ├── Treasury.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Monitoring.tsx
│   │   │   ├── FeeLimits.tsx
│   │   │   ├── NOAPage.tsx
│   │   │   ├── FrameworkAgreement.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Login.tsx
│   │   ├── components/
│   │   │   ├── ui/                     # Radix UI components
│   │   │   ├── dashboard/              # Dashboard components
│   │   │   ├── forms/                  # Form components
│   │   │   ├── layout/                 # Layout components
│   │   │   ├── legal/                  # Legal document components
│   │   │   └── NotificationCenter.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx
│   │   │   ├── useNotifications.tsx
│   │   │   └── use-toast.ts
│   │   ├── config/
│   │   │   └── api.ts                  # API endpoints configuration
│   │   ├── data/
│   │   │   └── mockData.ts
│   │   └── lib/
│   │       └── utils.ts
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── package.json                         # Root package.json for monorepo
└── README.md
```

---

## 🔑 Environment Variables

### Backend `.env`
```env
PORT=6767
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@whizunik.com
ADMIN_PASSWORD=admin_password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=whizunik-documents

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# URLs
FRONTEND_URL=http://localhost:8080
LOCALHOST_FRONTEND_URL=http://localhost:8080
```

### Frontend `.env`
```env
VITE_API_BASE_URL=http://localhost:6767/api
VITE_WS_URL=ws://localhost:6767
```

---

## 🚀 Development & Deployment

### Development Commands
```bash
# Install dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Build production
npm run build

# Clean build artifacts
npm run clean
```

### Production Deployment
- Backend: Node.js server runs on port 6767
- Frontend: Static build artifacts served via Vite preview
- Database: MongoDB connection via Mongoose
- Storage: AWS S3 for documents and PDFs
- Email: SMTP configured for notifications
- Logging: Winston logs to `../logs/` directory

---

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcryptjs for secure password storage
3. **Rate Limiting**: express-rate-limit for DDoS protection
4. **CORS**: Configured for frontend-backend communication
5. **Helmet**: HTTP security headers (CSP, HSTS, etc.)
6. **Input Validation**: express-validator for sanitization
7. **Encryption**: crypto-js for sensitive data
8. **S3 Pre-signed URLs**: Temporary secure access without exposing credentials
9. **WebSocket Security**: Authenticated WebSocket connections

---

## 📝 Notes

- This is a monorepo managed at the root level
- TypeScript is used throughout for type safety
- All APIs support pagination and filtering
- Real-time updates via WebSocket for notifications
- PDF generation supports both server-side (Puppeteer) and client-side (React-PDF)
- Multi-currency support (USD, EUR, GBP)
- Comprehensive logging with Winston
- Cloud-first architecture with AWS S3 integration

