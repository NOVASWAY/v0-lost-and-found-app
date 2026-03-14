## Backend Architecture Documentation

### System Overview

The Vault Church Lost & Found application uses a full-stack Next.js architecture with:
- **Frontend**: React + TypeScript with Next.js
- **Backend**: Next.js API Routes + Express-style middleware
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Storage**: File system with optional cloud integration

---

## Database Architecture

### Database Choice: Neon PostgreSQL

**Why PostgreSQL?**
- ACID compliance for transaction safety
- Advanced indexing for performance
- JSON support for flexible data
- Superior for relational data integrity
- Scalable to enterprise needs

**Neon Advantages:**
- Serverless architecture (no server management)
- Auto-scaling with usage-based billing
- Built-in backups and recovery
- High availability with replication
- Compatible with Vercel deployment

### Core Data Model

\`\`\`
User
├── Profile Data (name, email, role)
├── Credentials (password hash)
├── Activity Stats (vault points, rank)
├── Relationships
│   ├── uploadedItems → Item[]
│   ├── claims → Claim[]
│   ├── serviceRecords → ServiceRecord[]
│   ├── auditLogs → AuditLog[]
│   └── orders → Order[]

Item
├── Metadata (name, category, color, location)
├── Timestamps (date found, deadline)
├── Status (available, claimed, released, donated)
├── Relationships
│   ├── uploadedBy → User
│   └── claims → Claim[]

Claim
├── Item Reference (itemId, item details)
├── Claimant Info (name, email, proof image)
├── Status Workflow (pending → released/rejected)
├── Relationships
│   ├── item → Item
│   ├── claimant → User
│   └── releaseLog → ReleaseLog

ReleaseLog
├── Release Details (item, claimant, volunteer)
├── Documentation (notes, timestamp)
└── Relationships
    ├── claim → Claim
    └── volunteer → User

Location
├── Physical Space (name, description)
└── Reference for Items

Playbook
├── Operational Guide (title, scenario, protocol)
├── Priority Level
└── For admin decision-making

ServiceRecord
├── Volunteer Activity (service date, attendance, service completed)
├── Documentation (notes, recorded by)
└── Relationships
    └── user → User

AuditLog
├── Activity Log (type, action, details)
├── Security (severity, IP address, timestamp)
└── Relationships
    └── user → User (nullable)

Order (Notifications)
├── Message (title, message)
├── Status (unread, read)
├── Priority (low, medium, high)
└── Relationships
    └── user → User
\`\`\`

### Database Schema Relationships

**One-to-Many:**
- User → Items (users upload items)
- User → Claims (users make claims)
- User → ServiceRecords (volunteer tracking)
- User → AuditLogs (activity tracking)
- User → Orders (notifications)
- Item → Claims (item can have multiple claims)

**One-to-One:**
- Claim → ReleaseLog (one release per claim)

**Indexes for Performance:**
\`\`\`
User:        username (unique), role, vaultPoints
Item:        status, category, uploadedById, dateFounded, location
Claim:       status, itemId, claimantId, claimedAt
ReleaseLog:  claimId (unique), volunteerId
ServiceRecord: userId, serviceDate
AuditLog:    type, severity, userId, timestamp
\`\`\`

---

## API Architecture

### Route Organization

\`\`\`
/api
├── /auth
│   ├── /login         [POST] - User authentication
│   ├── /logout        [POST] - Session termination
│   └── /change-password [POST] - Password update
├── /users
│   ├── [GET]          - List all users (admin only)
│   ├── [POST]         - Create user (admin only)
│   ├── /[id]
│   │   ├── [GET]      - Get user details
│   │   └── [PUT]      - Update user (admin/self)
├── /items
│   ├── [GET]          - List items (public)
│   ├── [POST]         - Upload item (authenticated)
│   └── /[id]
│       ├── [GET]      - Get item details
│       ├── [PUT]      - Update item (uploader/admin)
│       └── [DELETE]   - Delete item (admin only)
├── /claims
│   ├── [GET]          - List claims (role-based)
│   ├── [POST]         - Submit claim (authenticated)
│   └── /[id]
│       ├── [GET]      - Get claim details
│       ├── [PUT]      - Update claim status (volunteer/admin)
│       └── [DELETE]   - Delete claim (admin only)
├── /locations
│   ├── [GET]          - List locations
│   ├── [POST]         - Create location (admin)
│   ├── /[id]
│   │   ├── [PUT]      - Update location (admin)
│   │   └── [DELETE]   - Delete location (admin)
├── /playbooks
│   ├── [GET]          - List playbooks (admin)
│   ├── [POST]         - Create playbook (admin)
│   ├── /[id]
│   │   ├── [PUT]      - Update playbook (admin)
│   │   └── [DELETE]   - Delete playbook (admin)
├── /service-records
│   ├── [GET]          - List service records
│   ├── [POST]         - Create service record (admin)
├── /release-logs
│   ├── [GET]          - List release logs
│   ├── [POST]         - Create release log (volunteer)
├── /audit-logs
│   └── [GET]          - View audit logs (admin)
\`\`\`

### API Authentication & Authorization

**Authentication Flow:**
1. User submits credentials to `/api/auth/login`
2. Server validates password against bcryptjs hash
3. JWT token generated with user ID and role
4. Token returned in HTTP-only cookie
5. Client includes token on subsequent requests
6. Middleware validates token on protected routes

**Authorization Levels:**
- **Public**: Browse items, search (no auth required)
- **Authenticated**: Upload items, submit claims, manage profile
- **Volunteer**: Process claims, release items, log service
- **Admin**: User management, settings, audit logs, playbooks

**Middleware Chain:**
\`\`\`
Request
  ↓
Authentication Check (verify JWT token)
  ↓
User Lookup (fetch user from database)
  ↓
Role Verification (check role-based access)
  ↓
Rate Limiting (5 requests/second per user)
  ↓
Route Handler (execute business logic)
  ↓
Audit Logging (record action)
  ↓
Response
\`\`\`

---

## Security Architecture

### Password Security

**Storage:**
- Passwords hashed with bcryptjs (10 salt rounds)
- Never stored in plaintext
- Hash comparison only, never decryption

**Requirements:**
- Minimum 12 characters
- Uppercase letters required
- Lowercase letters required
- Numbers required
- Special characters required

### Authentication

**Token Management:**
- JWT tokens with 30-minute expiration
- Refresh tokens for session extension (optional)
- HTTP-only cookies prevent XSS access
- Secure flag prevents unencrypted transmission

**Session Security:**
- Inactivity timeout: 30 minutes
- One active session per user (optional)
- Clear session on logout
- Audit log all logins/logouts

### Data Protection

**Input Validation:**
- Zod schemas for all API inputs
- Type validation at runtime
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (HTML escaping)

**Access Control:**
- Row-level security by user ID
- Role-based feature access
- Owner-based resource access
- Admin override capabilities

**Audit Trail:**
- All mutations logged with action, user, timestamp
- Immutable audit log (no updates/deletes)
- Severity levels: info, warning, error, critical
- IP address tracking for suspicious activity

---

## Business Logic Layers

### Authentication Service
\`\`\`typescript
// lib/db.ts
hashPassword(password) → bcryptjs hash
comparePassword(input, hash) → boolean
generateToken(userId, role) → JWT token
verifyToken(token) → { userId, role }
\`\`\`

### Item Management
\`\`\`typescript
uploadItem(userId, metadata) → Item
updateItem(itemId, changes) → Item
deleteItem(itemId) → void
getItems(filters: { status, category, location }) → Item[]
\`\`\`

### Claim Processing Workflow
\`\`\`
User submits claim with proof image
  ↓ [pending]
Volunteer reviews claim
  ↓ [released] or [rejected]
If released: ReleaseLog created, Item status updated
If rejected: Claimant notified, Item remains available
\`\`\`

### Service Tracking
\`\`\`
Admin records service: date, attendance, service completed
System updates: attendanceCount, serviceCount, vaultPoints
\`\`\`

### Audit Logging
\`\`\`
Every mutation tracked:
  - Type: user_created, item_uploaded, claim_submitted, etc.
  - Action: created, updated, deleted
  - UserId: who performed action
  - Details: JSON of changes
  - Timestamp: ISO 8601
  - Severity: info, warning, error, critical
\`\`\`

---

## Error Handling

### Error Types

**Validation Errors (400)**
\`\`\`
Invalid input format
Missing required fields
Invalid enum values
\`\`\`

**Authentication Errors (401)**
\`\`\`
Missing or expired token
Invalid credentials
Session expired
\`\`\`

**Authorization Errors (403)**
\`\`\`
Insufficient permissions
Unauthorized resource access
Role restrictions
\`\`\`

**Not Found Errors (404)**
\`\`\`
Resource does not exist
User not found
Item not found
\`\`\`

**Server Errors (500)**
\`\`\`
Database connection failed
Unexpected exception
Service unavailable
\`\`\`

### Error Response Format
\`\`\`json
{
  "error": "string",
  "code": "error_code",
  "details": {
    "field": "validation message"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

---

## Performance Optimization

### Database Optimization

**Query Optimization:**
- Indexed columns for filtering (status, category, user ID)
- Composite indexes for common filters
- Connection pooling to Neon
- Query result caching with SWR

**Pagination:**
- Default 20 items per page
- Cursor-based pagination for large datasets
- Lazy loading on frontend

**Caching Strategy:**
- SWR for client-side data cache
- Revalidation on mutations
- Background revalidation every 30 seconds
- Manual refresh on critical updates

### API Optimization

**Rate Limiting:**
- 5 requests per second per user
- 100 requests per minute per IP
- Exponential backoff for retries

**Response Optimization:**
- Minimal payload: exclude sensitive fields
- Gzip compression enabled
- CDN for static assets

---

## Deployment Architecture

### Local Development
\`\`\`
SQLite database (/data/dev.db)
Next.js dev server (http://localhost:3000)
Hot module reloading
Seed data from fixtures
\`\`\`

### Production (Vercel + Neon)
\`\`\`
Neon PostgreSQL (cloud database)
Vercel serverless functions (API routes)
Vercel edge caching
Automatic deployments on git push
\`\`\`

### Environment Configuration
\`\`\`
.env.local        - Local development (SQLite)
.env.production   - Production secrets (Neon URL)
Vercel Settings   - Deployment environment variables
\`\`\`

---

## Monitoring & Observability

### Database Monitoring

1. **Neon Console**
   - Connection count
   - Query performance
   - Storage usage
   - Backup status

2. **Application Logs**
   - Error tracking (Sentry optional)
   - Query logging (DEBUG mode)
   - Request logging

3. **Metrics**
   - Response times
   - Error rates
   - Database connection pool
   - Query durations

### Health Checks

\`\`\`bash
# Database connection
GET /api/health → { status: 'ok', db: 'connected' }

# User count
GET /api/admin/stats → { users: 4, items: 0, claims: 0 }
\`\`\`

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check database connection
- Verify backup completion

**Weekly:**
- Review audit logs
- Analyze performance metrics
- Check storage usage

**Monthly:**
- Update dependencies
- Rotate security keys
- Review access patterns
- Database optimization (VACUUM, ANALYZE)

### Backup & Recovery

**Automated Backups:**
- Neon automatic daily backups
- 7-day retention period
- Point-in-time recovery available

**Manual Backup:**
\`\`\`bash
# Export schema and data
npx prisma db pull > backup.prisma
pg_dump $DATABASE_URL > backup.sql
\`\`\`

**Recovery:**
\`\`\`bash
# Restore from backup
psql $DATABASE_URL < backup.sql
npx prisma generate
npx prisma migrate resolve --rolled-back <migration_id>
\`\`\`

---

## Future Enhancements

**Planned Features:**
1. Real-time notifications (WebSockets)
2. File upload to cloud storage (AWS S3/Vercel Blob)
3. Advanced analytics dashboard
4. SMS notifications
5. Email notifications
6. Two-factor authentication (2FA)
7. API key authentication for integrations
8. GraphQL endpoint
9. Database read replicas for scaling
10. Caching layer (Redis) for high-traffic scenarios

---

## References

- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **OWASP Guidelines**: https://owasp.org

---

**Backend Architecture Document v1.0** - Last Updated: March 2024
