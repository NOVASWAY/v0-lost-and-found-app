# Backend Setup Guide

This application now uses a proper backend with Prisma ORM and SQLite database.

## Setup Instructions

### 1. Install Dependencies

All required dependencies are already installed:
- `prisma` - ORM for database management
- `@prisma/client` - Prisma client for database queries
- `bcryptjs` - Password hashing
- `tsx` - TypeScript execution for seed scripts

### 2. Database Setup

The database is already initialized. To reset or recreate:

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database with initial data
npm run db:seed
```

### 3. Database Schema

The database includes the following models:
- **User** - User accounts with roles (user, volunteer, admin)
- **Item** - Lost and found items
- **Claim** - Item claims by users
- **ReleaseLog** - Records of item releases
- **Location** - Church locations
- **Playbook** - Security playbooks
- **ServiceRecord** - Attendance and service records
- **Order** - User orders/notifications
- **AuditLog** - System audit trail

### 4. API Routes

All API routes are located in `app/api/`:

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change user password

#### Users
- `GET /api/users` - Get all users (with optional search)
- `GET /api/users/[id]` - Get user by ID
- `POST /api/users` - Create new user (admin only)
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user (admin only)

#### Items
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/[id]` - Get item by ID
- `POST /api/items` - Create new item
- `PATCH /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

#### Claims
- `GET /api/claims` - Get all claims (with filters)
- `GET /api/claims/[id]` - Get claim by ID
- `POST /api/claims` - Create new claim
- `PATCH /api/claims/[id]` - Update claim (e.g., release)

#### Locations
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create location
- `PATCH /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Delete location

#### Playbooks
- `GET /api/playbooks` - Get all playbooks
- `POST /api/playbooks` - Create playbook
- `PATCH /api/playbooks/[id]` - Update playbook
- `DELETE /api/playbooks/[id]` - Delete playbook

#### Audit Logs
- `GET /api/audit-logs` - Get audit logs (with filters)

#### Service Records
- `GET /api/service-records?userId=...` - Get service records for user
- `POST /api/service-records` - Create service record

#### Release Logs
- `GET /api/release-logs` - Get all release logs

### 5. API Client

A utility API client is available in `lib/api-client.ts` with typed functions for all endpoints.

### 6. Default Users

After seeding, you can login with:
- **Admin**: username: `admin`, password: `admin123`
- **Volunteer**: username: `volunteer`, password: `volunteer123`
- **User**: username: `johndoe`, password: `user123`

### 7. Database Management

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# View database file
# SQLite database is located at: prisma/dev.db
```

### 8. Migrations

When you modify the Prisma schema:

```bash
# Create and apply migration
npm run db:migrate

# Regenerate Prisma client
npm run db:generate
```

## Frontend Integration

The frontend can now use the API client (`lib/api-client.ts`) instead of mock data. The API client provides:

- Type-safe API calls
- Error handling
- Consistent request/response format

Example usage:
```typescript
import { itemsApi } from "@/lib/api-client"

// Get all items
const { items } = await itemsApi.getAll()

// Create new item
const { item } = await itemsApi.create({
  imageUrl: "...",
  category: "Wallet",
  // ... other fields
})
```

## Next Steps

1. Update `lib/auth-context.tsx` to use `authApi` instead of mock data
2. Update components to use API client instead of mock data
3. Add authentication middleware for protected routes
4. Add request validation with Zod
5. Add rate limiting for API routes

## Production Considerations

For production:
1. Switch from SQLite to PostgreSQL
2. Update `DATABASE_URL` in environment variables
3. Set up proper authentication (JWT tokens)
4. Add API rate limiting
5. Enable CORS if needed
6. Set up database backups
7. Add monitoring and logging

