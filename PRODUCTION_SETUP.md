# Production Setup & Deployment Guide

## System Requirements
- Node.js 18+ (LTS recommended)
- npm or yarn
- SQLite 3 (included with Node)
- 512MB RAM minimum

## Pre-Deployment Checklist

### 1. Database Setup
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Create database and run migrations
npm run db:migrate

# Seed initial data (users, locations, playbooks)
npm run db:seed
\`\`\`

### 2. Environment Configuration
Create `.env.local` file:
\`\`\`
# Database URL (production)
DATABASE_URL="file:./vault-production.db"

# JWT signing secret (required)
JWT_SECRET="set-a-long-random-secret"

# Enable audit logging
AUDIT_LOGGING="true"

# Rate limiting
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="5"

# Session timeout (milliseconds)
SESSION_TIMEOUT="1800000"

# Security headers
ENABLE_SECURITY_HEADERS="true"

# Bootstrap passwords for `npm run db:seed` (production only)
BOOTSTRAP_ADMIN_PASSWORD="set-a-strong-admin-password"
BOOTSTRAP_VOLUNTEER_PASSWORD="set-a-strong-volunteer-password"
BOOTSTRAP_USER_PASSWORD="set-a-strong-user-password"
\`\`\`

### 3. Build & Verify
\`\`\`bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm run start
\`\`\`

## Bootstrap Credentials (production)

The database seed creates users using the usernames defined in `prisma/seed.ts`.
Bootstrap passwords must be provided via environment variables:
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_VOLUNTEER_PASSWORD`
- `BOOTSTRAP_USER_PASSWORD`

Example usernames created by the seed:
- Admin: `admin`
- Volunteers: `tomanderson`, `emilyrodriguez`, `jenniferwilliams`
- Users: `johndoe`, `sarahjohnson`, `michaelchen`, `davidpark`

## Features & Functionality

### Core Features ✅
1. **Item Management**
   - Upload lost items with images and details
   - Categorize items (electronics, clothing, accessories, etc.)
   - Set donation deadlines
   - Track item status (available, claimed, released, donated)

2. **Claims System**
   - Submit claims for found items
   - Provide proof images
   - Track claim status
   - Release items to claimants

3. **Release Management**
   - Volunteer approval workflow
   - Release logs and history
   - Detailed release notes

4. **User Management**
   - Admin user creation/deletion
   - Role management (user, volunteer, admin)
   - Vault points tracking
   - Rank system

5. **Audit & Compliance**
   - Comprehensive audit logging
   - Login/logout tracking
   - Item operation history
   - Admin action logging

6. **Admin Dashboard**
   - User management
   - Item overview
   - Claims management
   - Location settings
   - System settings
   - Audit logs

7. **Volunteer Tools**
   - Release assignments
   - Service tracking
   - Attendance records
   - Dashboard with statistics

8. **Additional Features**
   - Playbooks (operational guidelines)
   - Missions (task assignment)
   - Meetings (minutes recording)
   - Locations (storage/distribution points)
   - Orders (message queue)

## Security Implementation

### Password Security
✅ **Algorithm:** Bcryptjs with 10-salt rounds
✅ **Storage:** Server-side hashing only
✅ **Comparison:** Secure bcryptjs.compare() method
✅ **Transport:** HTTPS/TLS encrypted

### Session Security
✅ **Token Generation:** Cryptographically secure (32-byte)
✅ **Storage:** sessionStorage (cleared on browser close)
✅ **Timeout:** 30 minutes inactivity
✅ **Activity Reset:** Mouse/keyboard activity resets timer

### API Security
✅ **Rate Limiting:** 5 attempts/minute for login
✅ **Input Validation:** Zod schema validation
✅ **SQL Injection:** Parameterized queries via Prisma
✅ **CSRF Prevention:** SameSite cookie attributes

### Data Protection
✅ **HTTPS:** Strict-Transport-Security (HSTS) enabled
✅ **Content Security Policy:** XSS protection
✅ **Access Control:** Role-based (RBAC)
✅ **Audit Logging:** Immutable audit trail

## Database Schema

### Core Tables
- **User** - User accounts and credentials
- **Item** - Lost & found items inventory
- **Claim** - Item claims from users
- **ReleaseLog** - Item release history
- **AuditLog** - System activity log

### Admin Tables
- **Location** - Storage/distribution locations
- **Playbook** - Operational procedures
- **Mission** - Task assignments
- **ServiceRecord** - Service tracking
- **Order** - Message/notification queue
- **MeetingMinutes** - Meeting records

### Configuration
- **SystemSettings** - Item expiration period, etc.
- **UserPreferences** - Theme, notifications

## API Endpoints

### Authentication
- `POST /api/auth/login` - Secure login with bcrypt validation
- `POST /api/auth/logout` - Clear session
- `POST /api/auth/change-password` - Change user password

### Items Management
- `GET /api/items` - List all items
- `GET /api/items/[id]` - Get item details
- `POST /api/items` - Upload new item
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Remove item

### Claims
- `GET /api/claims` - List all claims
- `GET /api/claims/[id]` - Get claim details
- `POST /api/claims` - Submit claim
- `PUT /api/claims/[id]` - Update claim status

### Admin Operations
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/audit-logs` - View audit logs

## Monitoring & Logging

### Audit Log Categories
- `login` / `logout` - User session events
- `item_uploaded` - Item inventory additions
- `item_claimed` - Claim submissions
- `item_released` / `item_donated` - Item status changes
- `user_created` / `user_deleted` - User management
- `system_settings_updated` - Configuration changes

### Key Metrics to Monitor
1. **Login Success Rate** - Should be >95%
2. **Average Response Time** - Should be <200ms
3. **Failed Login Attempts** - Monitor for brute force
4. **Claim Processing Time** - Average claim to release
5. **Item Expiration Rate** - Monitor deadline compliance

## Backup & Recovery

### Database Backup
\`\`\`bash
# SQLite backup
cp vault-production.db vault-production.backup.db

# Or use Prisma snapshot
npm run db:migrate -- --name backup
\`\`\`

### Migration Rollback
\`\`\`bash
# Rollback to previous migration
npm run db:migrate -- --revert

# Check migration history
npx prisma migrate status
\`\`\`

## Performance Optimization

### Database Indexes
The application includes indexes on:
- `User.username` - Login lookups
- `User.role` - User filtering
- `Item.status` - Item discovery
- `Item.category` - Category filtering
- `Claim.status` - Claim filtering
- `AuditLog.createdAt` - Log searching

### Caching Strategy
- Static assets cached in browser (next/image)
- Session data in sessionStorage
- API responses cached client-side where appropriate

## Troubleshooting

### Common Issues

**Issue:** Password comparisons failing
- **Solution:** Ensure bcryptjs is installed: `npm install bcryptjs`

**Issue:** Audit logs not recording
- **Solution:** Check AuditLog table in Prisma schema is defined

**Issue:** Session expiring unexpectedly
- **Solution:** Check browser sessionStorage not disabled, verify 30-min timeout setting

**Issue:** Items not appearing after upload
- **Solution:** Verify Item table has foreign key to User, run migrations

**Issue:** API returning 401 Unauthorized**
- **Solution:** Ensure session token in sessionStorage, check CORS headers

## Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly: Review audit logs for suspicious activity
- [ ] Monthly: Update dependencies (`npm update`)
- [ ] Monthly: Run security audit (`npm audit`)
- [ ] Quarterly: Security review and penetration testing
- [ ] Quarterly: Database optimization and cleanup
- [ ] Annually: Disaster recovery drill

### Documentation Updates
Keep these files current:
- CIA_TRIAD_COMPLIANCE.md - Security validation
- PRODUCTION_SETUP.md - This file
- SECURITY.md - Security architecture
- README.md - Feature overview

---

**Last Updated:** March 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
