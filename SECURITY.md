# Security & Performance Documentation

## Security Features

### 1. Input Validation & Sanitization
- **Zod Schema Validation**: All API endpoints use Zod schemas to validate and sanitize input data
- **Type Safety**: Prevents SQL injection, XSS attacks, and invalid data
- **Location**: `lib/validation.ts`

### 2. Authentication & Authorization
- **Role-Based Access Control (RBAC)**: Admin, Volunteer, and User roles
- **Protected Routes**: API endpoints require appropriate authentication
- **Middleware Functions**: 
  - `requireAuth()` - Requires any authenticated user
  - `requireAdmin()` - Requires admin role
  - `requireAdminOrVolunteer()` - Requires admin or volunteer role
- **Location**: `lib/auth-middleware.ts`

### 3. Rate Limiting
- **In-Memory Rate Limiter**: Prevents brute force attacks and API abuse
- **Configurable Limits**: Different limits for different endpoints
  - Login: 5 attempts per minute
  - Password changes: 5 attempts per 5 minutes
  - General API: 100 requests per minute
  - Admin operations: 20 requests per minute
- **Location**: `lib/rate-limit.ts`
- **Note**: For production, consider using Redis-based rate limiting

### 4. Password Security
- **Hashing**: Passwords are hashed using `bcryptjs` with salt rounds
- **Strength Requirements**: 
  - Minimum 6 characters
  - Must contain uppercase, lowercase, and number (for password changes)
- **Location**: `lib/db.ts`

### 5. Security Headers
- **HTTP Security Headers**: Configured in `next.config.js`
  - `Strict-Transport-Security`: Enforces HTTPS
  - `X-Frame-Options`: Prevents clickjacking
  - `X-Content-Type-Options`: Prevents MIME sniffing
  - `X-XSS-Protection`: XSS protection
  - `Referrer-Policy`: Controls referrer information
  - `Permissions-Policy`: Restricts browser features

### 6. Database Security
- **Prisma ORM**: Prevents SQL injection through parameterized queries
- **Input Validation**: All inputs validated before database operations
- **Indexes**: Optimized database queries with proper indexes

### 7. API Security
- **Request Size Limits**: 10MB maximum request body size
- **Response Limits**: 10MB maximum response size
- **Error Handling**: Generic error messages to prevent information leakage
- **Audit Logging**: All sensitive operations are logged

## Performance Optimizations

### 1. Database Indexes
Indexes added to frequently queried fields:
- **User**: `username`, `role`, `vaultPoints`
- **Item**: `status`, `category`, `uploadedById`, `dateFounded`, `location`
- **Claim**: `status`, `itemId`, `claimantId`, `claimedAt`
- **AuditLog**: `type`, `severity`, `userId`, `timestamp`
- **ServiceRecord**: `userId`, `serviceDate`

### 2. Pagination
- All list endpoints support pagination
- Default page size: 20-50 items
- Maximum page size: 100-200 items (varies by endpoint)
- Reduces memory usage and improves response times

### 3. Query Optimization
- **Selective Field Loading**: Only fetch required fields
- **Relation Limits**: Limit nested relations (e.g., claims per item)
- **Parallel Queries**: Use `Promise.all()` for independent queries

### 4. Rate Limiting
- Prevents server overload from excessive requests
- Protects against DDoS attacks
- Ensures fair resource usage

## API Endpoint Security

### Public Endpoints
- `GET /api/items` - Rate limited (100/min)
- `GET /api/locations` - Rate limited

### Authenticated Endpoints
- `POST /api/items` - Requires authentication, rate limited (20/min)
- `POST /api/claims` - Requires authentication, rate limited (20/min)
- `GET /api/claims` - Requires admin/volunteer, rate limited (100/min)

### Admin-Only Endpoints
- `GET /api/users` - Admin only, paginated, rate limited (100/min)
- `POST /api/users` - Admin only, rate limited (20/min)
- `GET /api/audit-logs` - Admin only, paginated, rate limited (100/min)
- `POST /api/locations` - Admin only, rate limited (20/min)
- All user management endpoints

### High-Security Endpoints
- `POST /api/auth/login` - Stricter rate limit (5/min)
- `POST /api/auth/change-password` - Very strict rate limit (5 per 5 minutes)

## Best Practices

### For Developers
1. **Always validate input** using Zod schemas
2. **Use authentication middleware** for protected routes
3. **Implement rate limiting** on all endpoints
4. **Log sensitive operations** to audit logs
5. **Never expose passwords** in API responses
6. **Use parameterized queries** (Prisma handles this)
7. **Sanitize user input** before displaying
8. **Keep dependencies updated** for security patches

### For Deployment
1. **Use HTTPS** in production
2. **Set secure environment variables**
3. **Enable database connection pooling**
4. **Use Redis** for rate limiting in production
5. **Implement JWT tokens** for stateless authentication
6. **Set up monitoring** and alerting
7. **Regular security audits**
8. **Backup database** regularly

## Security Checklist

- [x] Input validation on all endpoints
- [x] Authentication middleware
- [x] Rate limiting
- [x] Password hashing
- [x] Security headers
- [x] Database indexes
- [x] Pagination
- [x] Error handling
- [x] Audit logging
- [ ] JWT token implementation (recommended for production)
- [ ] Redis rate limiting (recommended for production)
- [ ] CSRF protection (if using cookies)
- [ ] File upload validation (if implementing file uploads)
- [ ] Email verification (if adding email features)

## Known Limitations

1. **In-Memory Rate Limiting**: Current implementation uses in-memory storage. For production with multiple servers, use Redis.
2. **Simple Auth**: Current authentication uses simple header-based auth. For production, implement JWT tokens.
3. **No CSRF Protection**: If using cookie-based sessions, add CSRF protection.
4. **No File Upload Validation**: If implementing file uploads, add proper validation and scanning.

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not create public GitHub issues for security vulnerabilities.

