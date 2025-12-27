# Vault Church Security System

A comprehensive church security and lost & found management system built with Next.js, Prisma, and TypeScript.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/njauwangari6-gmailcoms-projects/v0-lost-and-found-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/g7sft6BjyxK)

## Overview

The Vault Church Security System is a full-featured platform for managing:
- **Lost & Found Items**: Upload, browse, claim, and release lost items
- **User Management**: Role-based access control (Admin, Volunteer, User)
- **Security Playbooks**: Operational procedures for security scenarios
- **Location Management**: Church location tracking for found items
- **Audit Logging**: Complete system activity tracking
- **Service Records**: Attendance and service participation tracking
- **Vault Points**: Gamification system for user contributions

## Features

### 🔐 Authentication & Authorization
- Username/password authentication
- Role-based access control (Admin, Volunteer, User)
- Admin-only user creation
- Password change functionality
- Protected routes

### 📦 Lost & Found Management
- Upload found items with photos
- Browse and search items
- Submit claims with proof photos
- Volunteer review and release process
- Donation deadline tracking
- Item status management

### 👥 User Management
- Admin dashboard for user management
- User activity tracking
- Attendance and service marking
- Vault Points system
- User statistics and rankings

### 📍 Location Management
- Admin-managed church locations
- Dynamic location dropdowns
- Location descriptions

### 📚 Security Playbooks
- Create and manage security protocols
- Scenario-based procedures
- Priority levels (low, medium, high, critical)

### 📊 Audit & Logging
- Complete audit trail
- Searchable and filterable logs
- Severity levels (info, warning, error, critical)
- Real-time event tracking

### 📱 Mobile Responsive
- Fully responsive design
- Mobile-friendly navigation
- Touch-optimized UI
- Works on all device sizes

### 🔒 Security & Performance
- **Input Validation**: Zod schema validation on all API endpoints
- **Rate Limiting**: Protection against brute force and API abuse
- **Authentication Middleware**: Role-based access control
- **Password Security**: Bcrypt hashing with strength requirements
- **Security Headers**: HTTP security headers configured
- **Database Indexes**: Optimized queries for performance
- **Pagination**: Efficient data loading with pagination
- **Audit Logging**: Complete security event tracking

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **ORM**: Prisma 7
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: Custom auth context
- **State Management**: React Hooks
- **Validation**: Zod
- **Security**: Rate limiting, input validation, password hashing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NOVASWAY/v0-lost-and-found-app.git
cd v0-lost-and-found-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Login Credentials

After seeding, you can login with:
- **Admin**: username: `admin`, password: `admin123`
- **Volunteer**: username: `volunteer`, password: `volunteer123`
- **User**: username: `johndoe`, password: `user123`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── browse/            # Browse items page
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── profile/            # User profile
│   ├── upload/             # Upload item page
│   └── volunteer/          # Volunteer pages
├── components/             # React components
│   └── ui/                # UI component library
├── lib/                    # Utilities and helpers
│   ├── api-client.ts      # API client utilities
│   ├── auth-context.tsx   # Authentication context
│   ├── db.ts              # Database utilities
│   └── prisma.ts          # Prisma client
├── prisma/                 # Prisma schema and migrations
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── public/                 # Static assets
```

## API Documentation

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for complete API documentation.

## Mobile Responsiveness

The application is fully responsive and optimized for mobile devices. See [MOBILE_RESPONSIVE.md](./MOBILE_RESPONSIVE.md) for details.

## Database Schema

The application uses Prisma ORM with the following main models:
- User
- Item
- Claim
- ReleaseLog
- Location
- Playbook
- ServiceRecord
- Order
- AuditLog

See `prisma/schema.prisma` for the complete schema.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./prisma/dev.db"
```

## Deployment

The project is configured for deployment on Vercel. See the [Vercel documentation](https://vercel.com/docs) for deployment instructions.

For production, update the `DATABASE_URL` to use PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Contributing

This project is automatically synced with [v0.app](https://v0.app) deployments. Changes made on v0.app are automatically pushed to this repository.

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

---

**Shielded in Silence. Fortified for Eternity.** 🛡️
