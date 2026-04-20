# Whizunik Factoring

A professional factoring operations portal with separate backend and frontend applications.

## 🏗️ Project Structure

```

whizunik-factoring/
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express + TypeScript backend
├── package.json       # Root package.json for monorepo management
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Setup

1. **Install all dependencies:**
```bash
npm run install:all
```

2. **Run both frontend and backend in development mode:**
```bash
npm run dev
```

This will start:
- Backend API server on `http://localhost:6767`
- Frontend development server on `http://localhost:8080`

### Individual Commands

#### Frontend Only
```bash
# Development
npm run dev:frontend

# Build for production
npm run build:frontend

# Preview production build
npm run start:frontend
```

#### Backend Only
```bash
# Development with hot reload
npm run dev:backend

# Build TypeScript
npm run build:backend

# Start production server
npm run start:backend
```

## 🔐 Login Credentials

- **Email:** Set in `frontend/.env` as `VITE_ADMIN_EMAIL`
- **Password:** Set in `frontend/.env` as `VITE_ADMIN_PASSWORD`

## 📁 Directory Details

### Frontend (`/frontend`)
- **Framework:** React 18 + TypeScript + Vite
- **UI Library:** Tailwind CSS + shadcn/ui components
- **State Management:** React Context + React Query
- **Authentication:** JWT-based auth with protected routes
- **Features:** Dashboard, Entity Management, Treasury Operations

### Backend (`/backend`)
- **Framework:** Node.js + Express + TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens
- **Security:** Helmet, CORS, Rate limiting
- **Logging:** Winston with audit trails
- **Features:** RESTful API, User management, Entity CRUD, Transaction processing

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development |
| `npm run build` | Build both applications for production |
| `npm run start` | Start both applications in production mode |
| `npm run clean` | Clean all node_modules and build directories |
| `npm run install:all` | Install dependencies for all applications |

## 🔧 Development Workflow

1. **Start Development Servers:**
   ```bash
   npm run dev
   ```

2. **Frontend Development:**
   - Navigate to `http://localhost:8080`
   - Login with credentials configured in `frontend/.env`
   - Hot reload enabled for instant feedback

3. **Backend API Development:**
   - API available at `http://localhost:6767`
   - Auto-restart on file changes
   - MongoDB connection required

4. **Database Setup:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update connection string in backend/.env
   - Database will be created automatically

## 🚀 Production Deployment

1. **Build applications:**
   ```bash
   npm run build
   ```

2. **Start production servers:**
   ```bash
   npm run start
   ```

## 🔐 Environment Variables

### Frontend (`/frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:6767
```

### Backend (`/backend/.env`)
```
PORT=6767
MONGODB_URI=mongodb://localhost:27017/whizunik-factoring
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## 📊 Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Query
- Lucide Icons

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Winston Logging
- Helmet Security
- CORS Support

## 🎯 Features

### ✅ Completed
- JWT Authentication system
- Protected routes
- Professional UI with financial theming
- Entity management (Suppliers/Buyers)
- Treasury operations dashboard
- Real-time KPI monitoring
- Comprehensive audit logging
- Role-based access control

### 🚧 In Development
- Real-time notifications
- Advanced reporting
- Document management
- Payment processing integration
- Advanced analytics

## 📞 Support

For technical support or questions about the Whizunik Factoring platform, please contact the development team.

---

© 2025 Whizunik Factoring. All rights reserved.
- **Tailwind CSS** with custom financial design system
- **Radix UI** components with shadcn/ui
- **Lucide React** icons
- **React Router** for navigation
- **Recharts** for financial data visualization

### Backend Stack
- **Node.js** + **Express** + **TypeScript**
- **MongoDB** with **Mongoose** ODM
- **JWT** authentication with role-based permissions
- **Winston** logging with financial audit trails
- **Helmet** + **CORS** + rate limiting for security

