## Quick Reference Guide - Database & Backend

### Database Structure at a Glance

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    NEON POSTGRESQL                          │
│                   (Cloud Hosted)                            │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──┐          ┌────▼─────┐        ┌────▼─────┐
    │ User │          │   Item    │        │  Claim   │
    ├──────┤          ├───────────┤        ├──────────┤
    │ id   │◄─────────┤uploadedBy │        │ itemId   │
    │ name │          │ status    │        │ claimant │
    │ role │          │ category  │        │ status   │
    │ pwd  │          │ location  │        │ proof    │
    └──────┘          └───────────┘        └──────────┘
        │                                       │
        ├──────────────┬──────────────┬─────────┘
        │              │              │
    ┌───▼──────┐  ┌────▼────┐  ┌─────▼──────┐
    │ Service  │  │ Audit   │  │ Release    │
    │ Record   │  │ Log     │  │ Log        │
    └──────────┘  └─────────┘  └────────────┘
        │              │
        └──────┬───────┘
               │
        ┌──────▼──────┐  ┌──────────┐  ┌─────────┐
        │ Location    │  │ Playbook │  │ Order   │
        └─────────────┘  └──────────┘  └─────────┘
\`\`\`

---

### Setup Commands

\`\`\`bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Create tables (first time)
npx prisma migrate deploy

# Load test data
npx prisma db seed

# Verify database
npx ts-node scripts/verify-database.ts

# Full automated setup
npx ts-node scripts/setup-neon-database.ts
\`\`\`

---

### Environment Variables

\`\`\`env
# Local Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Optional
PRISMA_DATABASE_URL="postgresql://..."  # If different from above
\`\`\`

---

### Test Credentials

\`\`\`
Admin:
  Email: admin@vaultchurch.org
  Pass:  AdminVault123!@#

Volunteer:
  Email: volunteer@vaultchurch.org
  Pass:  Volunteer@2024#Secure

User:
  Email: john.doe@vaultchurch.org
  Pass:  SecureUser123!@#
\`\`\`

---

### Database Tables Quick Reference

| Table | Purpose | Rows | Key Fields |
|-------|---------|------|-----------|
| **User** | Accounts & auth | 4 | username, role, password |
| **Item** | Lost items | ~0 | status, category, location |
| **Claim** | Item claims | ~0 | status, itemId, claimantId |
| **ReleaseLog** | Release history | ~0 | claimId, volunteerId |
| **Location** | Church locations | 6 | name (unique) |
| **Playbook** | Procedures | 2 | title, priority |
| **ServiceRecord** | Volunteer hours | ~0 | userId, serviceDate |
| **AuditLog** | Activity log | ~0 | type, severity, userId |
| **Order** | Notifications | ~0 | userId, status |

---

### API Routes Quick Reference

\`\`\`
POST   /api/auth/login               - User login
POST   /api/auth/logout              - User logout
POST   /api/auth/change-password     - Change password

GET    /api/users                    - List users (admin)
POST   /api/users                    - Create user (admin)
GET    /api/users/[id]               - Get user
PUT    /api/users/[id]               - Update user

GET    /api/items                    - List items (public)
POST   /api/items                    - Upload item
GET    /api/items/[id]               - Get item
PUT    /api/items/[id]               - Update item
DELETE /api/items/[id]               - Delete item

GET    /api/claims                   - List claims
POST   /api/claims                   - Submit claim
GET    /api/claims/[id]              - Get claim
PUT    /api/claims/[id]              - Update claim

GET    /api/locations                - List locations
POST   /api/locations                - Create location (admin)
PUT    /api/locations/[id]           - Update location (admin)
DELETE /api/locations/[id]           - Delete location (admin)

GET    /api/playbooks                - List playbooks (admin)
POST   /api/playbooks                - Create playbook (admin)
PUT    /api/playbooks/[id]           - Update playbook
DELETE /api/playbooks/[id]           - Delete playbook

GET    /api/service-records          - List records
POST   /api/service-records          - Create record (admin)

GET    /api/release-logs             - List logs

GET    /api/audit-logs               - View logs (admin)
\`\`\`

---

### Password Requirements

\`\`\`
✅ Minimum 12 characters
✅ Uppercase letter required
✅ Lowercase letter required
✅ Number required
✅ Special character required (!@#$%^&*)

Example: AdminVault123!@#
\`\`\`

---

### User Roles & Permissions

\`\`\`
┌──────────┬─────────┬──────────┬───────┐
│ Feature  │ User    │ Volunteer│ Admin │
├──────────┼─────────┼──────────┼───────┤
│ Login    │    ✅   │    ✅    │  ✅   │
│ Upload   │    ✅   │    ✅    │  ✅   │
│ Browse   │    ✅   │    ✅    │  ✅   │
│ Claim    │    ✅   │    ✅    │  ✅   │
│ Release  │    ✗    │    ✅    │  ✅   │
│ Users    │    ✗    │    ✗     │  ✅   │
│ Settings │    ✗    │    ✗     │  ✅   │
│ Audit    │    ✗    │    ✗     │  ✅   │
└──────────┴─────────┴──────────┴───────┘
\`\`\`

---

### Common Queries

\`\`\`typescript
// Find user
const user = await prisma.user.findUnique({
  where: { username: "admin@vaultchurch.org" }
})

// List items
const items = await prisma.item.findMany({
  where: { status: "available" },
  orderBy: { createdAt: 'desc' }
})

// Get claims for item
const claims = await prisma.claim.findMany({
  where: { itemId: "item-123" },
  include: { claimant: true }
})

// Count by status
const stats = await prisma.item.groupBy({
  by: ['status'],
  _count: { id: true }
})
\`\`\`

---

### Troubleshooting Checklist

\`\`\`
❌ Can't connect to database
  → Check DATABASE_URL in .env.local
  → Verify Neon connection string
  → Ensure PostgreSQL running

❌ Migration failed
  → Run: npx prisma migrate reset
  → Check SQL syntax in migration file
  → Verify database permissions

❌ Prisma Client not found
  → Run: npx prisma generate
  → Reinstall: npm install

❌ Password doesn't work
  → Verify passwords are hashed (bcryptjs)
  → Check role is set correctly
  → Try resetting with db seed

❌ API route not working
  → Check file is in /api folder
  → Verify authentication middleware
  → Check request method matches

❌ Test users not found
  → Run: npx prisma db seed
  → Verify database has data
  → Check user was created successfully
\`\`\`

---

### Performance Indexes

\`\`\`
User:        username (unique), role, vaultPoints
Item:        status, category, uploadedById, dateFounded, location
Claim:       status, itemId, claimantId, claimedAt
ReleaseLog:  claimId (unique), volunteerId
ServiceRec:  userId, serviceDate
AuditLog:    type, severity, userId, timestamp
\`\`\`

---

### Security Checklist

\`\`\`
✅ Passwords hashed with bcryptjs (10 rounds)
✅ No plaintext passwords in database
✅ JWT tokens for authentication
✅ HTTP-only secure cookies
✅ CORS properly configured
✅ Rate limiting enforced
✅ Input validation (Zod schemas)
✅ SQL injection prevention (Prisma)
✅ Audit logging enabled
✅ Role-based access control
\`\`\`

---

### Deployment Steps

\`\`\`
1. Create Neon database account
2. Get PostgreSQL connection string
3. Add DATABASE_URL to .env.local
4. Run: npm install
5. Run: npx prisma migrate deploy
6. Run: npx prisma db seed
7. Test locally: npm run dev
8. Verify: npx ts-node scripts/verify-database.ts
9. Deploy: git push origin main
10. Monitor logs in Vercel dashboard
\`\`\`

---

### Documentation Map

\`\`\`
📚 NEON_SETUP.md
   └─ Step-by-step setup guide

📚 BACKEND_ARCHITECTURE.md
   └─ System design & API architecture

📚 DEPLOYMENT_CHECKLIST.md
   └─ Pre/post deployment verification

📚 DATABASE_SETUP_SUMMARY.md
   └─ What was created & overview

📚 QUICK_REFERENCE.md  (← you are here)
   └─ Quick lookup guide
\`\`\`

---

### Key Files

\`\`\`
prisma/
├── schema.prisma              (database definition)
├── seed.ts                    (test data)
└── migrations/                (database versions)

scripts/
├── setup-neon-database.ts     (automated setup)
└── verify-database.ts         (verification)

app/api/
├── auth/                      (authentication)
├── items/                     (CRUD operations)
├── claims/                    (claim processing)
├── users/                     (user management)
└── ...                        (other endpoints)

lib/
├── db.ts                      (database functions)
├── prisma.ts                  (Prisma client)
├── auth-context.tsx           (auth state)
└── validation.ts              (input validation)
\`\`\`

---

### Useful Commands

\`\`\`bash
# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Create migration
npx prisma migrate dev --name migration_name

# Check database
npx ts-node scripts/verify-database.ts

# Seed again
npx prisma db seed

# Generate types
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
\`\`\`

---

### Success Indicators

✅ Database tables created in Neon
✅ Test users can login
✅ API routes responding
✅ Audit logs recording actions
✅ Items can be uploaded
✅ Claims can be submitted
✅ Build succeeds without errors
✅ No TypeScript errors
✅ Performance metrics good
✅ Backup created automatically

---

### Next Resources

- Full setup: **NEON_SETUP.md**
- Architecture: **BACKEND_ARCHITECTURE.md**
- Deployment: **DEPLOYMENT_CHECKLIST.md**
- Overview: **DATABASE_SETUP_SUMMARY.md**

---

**Quick Reference v1.0** - Keep handy during development!
