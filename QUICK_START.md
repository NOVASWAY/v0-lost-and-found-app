# Quick Start Guide - Vault Church Lost & Found

**Status:** ✅ Production Ready
**Last Updated:** March 2026

---

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Setup Database
\`\`\`bash
npm run db:generate
npm run db:migrate
npm run db:seed
\`\`\`

### 3. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### 4. Access the Application
\`\`\`
Open: http://localhost:3000
\`\`\`

---

## 🔐 Test Credentials

### Admin Account (Full System Access)
\`\`\`
Username: admin
Password: admin123
Role: Administrator
Access: Admin Dashboard, User Management, Settings
\`\`\`

### Volunteer Account (Release Management)
\`\`\`
Username: volunteer
Password: volunteer123
Role: Volunteer
Access: Volunteer Dashboard, Release Processing, Service Tracking
\`\`\`

### Regular User Accounts
\`\`\`
Username: johndoe
Password: user123
Role: User
Access: Item Upload, View Items, Submit Claims

Username: sarahjohnson
Password: password123
Role: User
Access: Item Upload, View Items, Submit Claims

Username: michaelchen
Password: password123
Role: User
Access: Item Upload, View Items, Submit Claims
\`\`\`

---

## 📋 Main Features Walkthrough

### 1. Login
\`\`\`
1. Navigate to http://localhost:3000/login
2. Enter username (e.g., "johndoe")
3. Enter password (e.g., "user123")
4. Click "Unlock the Vault"
5. Redirected to dashboard
\`\`\`

### 2. Upload Lost Item (User)
\`\`\`
1. Click "Upload Item" from dashboard
2. Fill in item details:
   - Upload photo
   - Select category
   - Describe item
   - Set location
   - Add unique markings (optional)
3. Click "Submit"
4. Item appears in "My Uploads"
\`\`\`

### 3. Browse & Claim Item (User)
\`\`\`
1. Go to "Browse Items"
2. Filter by category or location
3. Click item to view details
4. Click "Claim Item"
5. Upload proof image
6. Submit claim
7. Status shows as "pending"
\`\`\`

### 4. Approve Release (Volunteer)
\`\`\`
1. Login as volunteer (volunteer/volunteer123)
2. Go to "Volunteer Dashboard"
3. View pending releases
4. Click "Approve Release"
5. Add release notes (optional)
6. Click "Confirm Release"
7. Audit log records action
\`\`\`

### 5. Admin Dashboard (Admin)
\`\`\`
1. Login as admin (admin/admin123)
2. Go to "Admin Dashboard"
3. View all users, items, claims
4. Manage system settings
5. Review audit logs
6. Create/update locations
\`\`\`

---

## 🔒 Security Features Verification

### Verify Password Hashing
\`\`\`bash
# Check database (sqlite3)
sqlite3 vault-production.db
SELECT id, username, password FROM User LIMIT 1;

# Password should be bcryptjs hash like:
# $2b$10$...60+ character hash...

# Never plaintext!
\`\`\`

### Verify Session Security
\`\`\`javascript
// Open browser DevTools Console
sessionStorage.getItem("sessionToken")
// Shows: 64-character hex token (32-byte random)

sessionStorage.getItem("userId")
// Shows: User ID (CUID format)
\`\`\`

### Verify API Security
\`\`\`bash
# Test login with invalid password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpass"}'

# Response: {"error":"Invalid credentials"}

# Test rate limiting (5 attempts/min)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'
done

# 6th attempt gets 429 Too Many Requests
\`\`\`

---

## 📊 Dashboard Overview

### User Dashboard (`/dashboard`)
- ✅ My Items (uploaded by user)
- ✅ My Claims (submitted by user)
- ✅ Available Items (browsable)
- ✅ Profile (view/edit settings)

### Volunteer Dashboard (`/volunteer/dashboard`)
- ✅ Pending Releases
- ✅ Release History
- ✅ Service Records
- ✅ Attendance Tracking
- ✅ Vault Points

### Admin Dashboard (`/admin`)
- ✅ User Management
- ✅ Item Management
- ✅ Claims Management
- ✅ Audit Logs
- ✅ Locations
- ✅ Playbooks
- ✅ Missions
- ✅ System Settings

---

## 🛠️ Common Tasks

### Change Your Password
\`\`\`
1. Go to Profile
2. Click "Change Password"
3. Enter current password
4. Enter new password (8+ chars, mixed case, numbers)
5. Confirm
\`\`\`

### Create New User (Admin Only)
\`\`\`
1. Go to Admin > Users
2. Click "New User"
3. Fill in details:
   - Name
   - Username (3-50 chars, alphanumeric+underscore)
   - Password (8+ chars, mixed case, numbers)
   - Role (User/Volunteer/Admin)
4. Click "Create"
\`\`\`

### Update Item Status (Admin Only)
\`\`\`
1. Go to Admin > Items
2. Click item to edit
3. Change status:
   - Available (default)
   - Claimed (when claim approved)
   - Released (when released)
   - Donated (if not claimed)
4. Save changes
\`\`\`

### View Audit Logs (Admin Only)
\`\`\`
1. Go to Admin > Audit Logs
2. View all system activities:
   - Login/Logout events
   - Item uploads/changes
   - Claims submitted/approved
   - User management actions
3. Filter by type or date
4. Logs are immutable (cannot delete)
\`\`\`

---

## 🔍 API Testing

### Test Login Endpoint
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Response: {"user": {...}, "message": "Login successful"}
\`\`\`

### Test Item Upload
\`\`\`bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/item.jpg",
    "category": "Electronics",
    "color": "Black",
    "location": "Front Desk",
    "dateFounded": "2026-03-10T14:30:00Z",
    "description": "iPhone 14",
    "uploadedById": "USER_ID"
  }'
\`\`\`

### Test Get Items
\`\`\`bash
curl http://localhost:3000/api/items

# Returns: [{"id": "...", "category": "...", ...}]
\`\`\`

---

## 📈 Performance Checks

### Check Database Performance
\`\`\`bash
# Open admin dashboard
# Navigate to Admin > Items
# Should load in <1 second

# Check network tab in DevTools
# All API calls should be <500ms
\`\`\`

### Monitor Audit Logs
\`\`\`bash
# Admin > Audit Logs
# Should see entries for:
# - Login events
# - Item uploads
# - Claim submissions
# - User management
\`\`\`

---

## 🐛 Troubleshooting

### "Invalid username or password"
- Verify username is correct (case-sensitive)
- Verify password is correct
- Check caps lock is off
- Try default credentials first

### Session expires unexpectedly
- Session timeout is 30 minutes of inactivity
- Move mouse/keyboard to reset timer
- Check browser sessionStorage is enabled
- Check no browser extensions clearing storage

### API endpoint returns 401
- Session has expired, login again
- Session token may have been cleared
- Try clearing sessionStorage and relogin

### Database errors
- Check database file exists: `vault-production.db`
- Run migrations: `npm run db:migrate`
- Check permissions on database file

### Password change fails
- Old password must be correct
- New password must be 6+ chars
- New password must have uppercase, lowercase, number
- Check no special characters in password

---

## 📝 Audit Logging Test

### Verify Audit Logs Working
\`\`\`
1. Login (should create audit log)
2. Upload item (should create audit log)
3. Submit claim (should create audit log)
4. Go to Admin > Audit Logs
5. Should see all actions listed
\`\`\`

### Check Audit Log Data
\`\`\`bash
# View audit logs in database
sqlite3 vault-production.db
SELECT type, userId, action, createdAt FROM AuditLog ORDER BY createdAt DESC LIMIT 10;
\`\`\`

---

## 🔐 Security Verification Checklist

### Verify Passwords Are Hashed
- [ ] Login successfully with admin
- [ ] View database: passwords are bcrypt hashes
- [ ] Try using hash as password: fails
- [ ] Change password: old hash different from new

### Verify Session Security
- [ ] Login creates session token in sessionStorage
- [ ] Token is 64 hex characters (32-byte)
- [ ] Session cleared on logout
- [ ] Session cleared on browser close
- [ ] Timeout after 30 minutes inactivity

### Verify API Security
- [ ] Login rate limited (5 attempts/minute)
- [ ] Invalid credentials rejected
- [ ] Audit log records failed attempts
- [ ] API returns 401 for unauthorized
- [ ] API returns 403 for forbidden

### Verify Data Integrity
- [ ] All inputs validated (Zod schemas)
- [ ] SQL injection impossible (parameterized)
- [ ] XSS prevented (special chars escaped)
- [ ] CSRF protected (SameSite headers)
- [ ] Audit trail complete and immutable

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **IMPLEMENTATION_SUMMARY.md** | Overview of all features and security |
| **CIA_TRIAD_COMPLIANCE.md** | Security validation (Confidentiality, Integrity, Availability) |
| **PRODUCTION_SETUP.md** | Deployment and configuration guide |
| **FUNCTIONALITY_VERIFICATION.md** | Complete feature verification checklist |
| **SECURITY.md** | Security architecture details |
| **PROJECT_STATUS.md** | Project status and features |
| **README.md** | Feature documentation |

---

## 🎯 Next Steps

### For Development
1. Run `npm run dev` to start dev server
2. Use test credentials to explore features
3. Check browser DevTools for API responses
4. View database with `sqlite3` command

### For Production
1. Follow PRODUCTION_SETUP.md
2. Configure environment variables
3. Run database migrations
4. Seed initial data
5. Enable HTTPS
6. Deploy to production

### For Testing
1. Create test accounts in Admin dashboard
2. Upload test items
3. Submit test claims
4. Review audit logs
5. Check API responses

---

## ✅ Verification Checklist

- [ ] npm install completed successfully
- [ ] Database migrations ran without errors
- [ ] Initial data seeded successfully
- [ ] Dev server starts on localhost:3000
- [ ] Can login with test credentials
- [ ] Password is stored as bcryptjs hash (not plaintext)
- [ ] Session token created in sessionStorage
- [ ] Can upload item and it appears in list
- [ ] Can submit claim and see status change
- [ ] Can view audit logs (if admin)
- [ ] API endpoints respond correctly
- [ ] Rate limiting works (5 login attempts/minute)

---

## 🚀 You're Ready!

The application is fully functional, secure, and ready to use. Start exploring the features with the test credentials above.

**Questions?** Check the documentation files or review the source code comments.

**Issues?** Refer to the Troubleshooting section above.

---

**Happy using! 🎉**

Last Updated: March 2026
Version: 1.0.0
Status: ✅ PRODUCTION READY
